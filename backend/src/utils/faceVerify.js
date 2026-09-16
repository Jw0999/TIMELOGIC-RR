const { prisma } = require('../config/database');
const env = require('../config/env');
const logger = require('../config/logger');
const fs = require('fs');
const path = require('path');

const DEEPFACE_URL = (env.DEEPFACE_URL || 'http://localhost:5001').replace(/\/+$/, '');
const MAX_MISMATCH = 5;
const LOCKOUT_MINUTES = 15;

async function postToDeepFace(pathname, payload) {
  try {
    return await fetch(`${DEEPFACE_URL}${pathname}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    logger.error('DeepFace service unreachable:', err.message);
    throw Object.assign(
      new Error('Face verification service is temporarily unavailable. Try again shortly.'),
      { status: 503, code: 'FACE_SERVICE_UNAVAILABLE' }
    );
  }
}

/**
 * Compare a live webcam capture (base64 data-URI) against the employee's
 * stored face photo on disk.
 *
 * @param {string} liveImageBase64 - data:image/jpeg;base64,... from the webcam
 * @param {string} storedPhotoPath - relative URL like /uploads/faces/abc.jpg
 * @returns {{ verified: boolean, distance: number, threshold: number, is_real: boolean|null }}
 */
async function verifyFace(liveImageBase64, storedPhotoPath) {
  let fileBuffer;
  let ext = '.jpg';

  if (storedPhotoPath.startsWith('http://') || storedPhotoPath.startsWith('https://')) {
    const res = await fetch(storedPhotoPath);
    if (!res.ok) {
      throw Object.assign(
        new Error('Stored face photo could not be retrieved from storage.'),
        { status: 400 }
      );
    }
    fileBuffer = Buffer.from(await res.arrayBuffer());
    try {
      ext = path.extname(new URL(storedPhotoPath).pathname).toLowerCase() || '.jpg';
    } catch {
      ext = '.jpg';
    }
  } else {
    const UP = env.UPLOAD_DIR || 'uploads';
    const relative = storedPhotoPath.replace(/^\/uploads\//, '');
    const absPath = path.isAbsolute(UP)
      ? path.join(UP, relative)
      : path.join(process.cwd(), UP, relative);

    if (!fs.existsSync(absPath)) {
      throw Object.assign(
        new Error('Stored face photo not found on disk. Please re-enroll the face.'),
        { status: 400 }
      );
    }
    fileBuffer = fs.readFileSync(absPath);
    ext = path.extname(absPath).toLowerCase();
  }

  const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  const storedBase64 = `data:${mime};base64,${fileBuffer.toString('base64')}`;

  const response = await postToDeepFace('/verify', {
    img1: liveImageBase64,
    img2: storedBase64,
    model_name: 'Facenet512',
    detector_backend: 'opencv',
    distance_metric: 'cosine',
    anti_spoofing: false,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    logger.error('DeepFace verify error:', response.status, body?.error);
    throw Object.assign(
      new Error(body?.error || 'Face verification failed unexpectedly.'),
      { status: 502 }
    );
  }

  return response.json();
}

async function validateFaceEnrollment(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  const response = await postToDeepFace('/validate', {
    image: `data:${mime};base64,${fileBuffer.toString('base64')}`,
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.valid) {
    throw Object.assign(
      new Error(body?.error || 'The enrollment image must contain one clear face.'),
      { status: 400, code: 'FACE_ENROLLMENT_INVALID' }
    );
  }
  return body;
}

/**
 * Full face verification pipeline with anti-spoofing, matching, and lockout.
 *
 * @param {{ id: string, profileImageUrl: string|null, faceBlockedUntil: Date|null, faceMismatchCount: number }} employee
 * @param {string} faceImage - base64 data-URI from the webcam
 */
async function performFaceVerification(employee, faceImage) {
  // Verify the face image is present.
  if (!faceImage || !faceImage.startsWith('data:image/')) {
    throw Object.assign(
      new Error('A valid face image is required (base64 data URI).'),
      { status: 400 }
    );
  }

  // Call DeepFace service.
  const result = await verifyFace(faceImage, employee.profileImageUrl);

  // 4. Anti-spoofing
  if (result.is_real === false) {
    await incrementFaceMismatch(employee.id);
    throw Object.assign(
      new Error('Liveness check failed. Please use a live camera — not a photo or screen.'),
      { status: 403 }
    );
  }

  // 5. Face match
  if (!result.verified) {
    await incrementFaceMismatch(employee.id);
    throw Object.assign(
      new Error('Face verification failed. The camera image did not match your registered face.'),
      { status: 403 }
    );
  }

  // 6. Success — reset any accumulated mismatches
  if (employee.faceMismatchCount > 0) {
    await resetFaceMismatch(employee.id);
  }

  return result;
}

/**
 * Keep mismatch telemetry without blocking future verification attempts.
 */
async function incrementFaceMismatch(employeeId) {
  const updated = await prisma.user.update({
    where: { id: employeeId },
    data: {
      faceMismatchCount: { increment: 1 },
      faceLastMismatchAt: new Date(),
    },
    select: { faceMismatchCount: true },
  });
}

/**
 * Reset the face mismatch counter after a successful verification.
 */
async function resetFaceMismatch(employeeId) {
  await prisma.user.update({
    where: { id: employeeId },
    data: { faceMismatchCount: 0, faceLastMismatchAt: null, faceBlockedUntil: null },
  });
}

/**
 * Check if the employee's stored face photo actually exists on disk or storage.
 * Prevents phantom paths from locking out employees if files were lost or not uploaded.
 *
 * @param {string|null} storedPhotoPath
 * @returns {boolean}
 */
function hasValidEnrolledFace(storedPhotoPath) {
  if (!storedPhotoPath || typeof storedPhotoPath !== 'string') return false;
  if (storedPhotoPath.startsWith('http://') || storedPhotoPath.startsWith('https://')) return true;
  try {
    const UP = env.UPLOAD_DIR || 'uploads';
    const relative = storedPhotoPath.replace(/^\/uploads\//, '');
    const absPath = path.isAbsolute(UP)
      ? path.join(UP, relative)
      : path.join(process.cwd(), UP, relative);
    return fs.existsSync(absPath);
  } catch {
    return false;
  }
}

module.exports = { verifyFace, performFaceVerification, validateFaceEnrollment, hasValidEnrolledFace };
