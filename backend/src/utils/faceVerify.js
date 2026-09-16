const { prisma } = require('../config/database');
const env = require('../config/env');
const logger = require('../config/logger');
const fs = require('fs');
const path = require('path');

const DEEPFACE_URL = (env.DEEPFACE_URL || 'http://localhost:5001').replace(/\/+$/, '');
const MAX_MISMATCH = 5;
const LOCKOUT_MINUTES = 15;

async function postToDeepFace(pathname, payload) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for cold starts
  try {
    const res = await fetch(`${DEEPFACE_URL}${pathname}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    return res;
  } catch (err) {
    logger.error('DeepFace service unreachable:', err.message);
    throw Object.assign(
      new Error('Face verification service is temporarily unavailable or warming up. Please try again in a moment.'),
      { status: 503, code: 'FACE_SERVICE_UNAVAILABLE' }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Compare a live webcam capture (base64 data-URI) against the employee's
 * stored face photo (from buffer, database, or disk).
 *
 * @param {string} liveImageBase64 - data:image/jpeg;base64,... from the webcam
 * @param {string|null} storedPhotoPath - relative URL like /uploads/faces/abc.jpg
 * @param {Buffer|Uint8Array|null} faceEncodingBuffer - binary data stored in database
 * @returns {{ verified: boolean, distance: number, threshold: number, is_real: boolean|null }}
 */
async function verifyFace(liveImageBase64, storedPhotoPath, faceEncodingBuffer) {
  let fileBuffer;
  let ext = '.jpg';

  if (faceEncodingBuffer && faceEncodingBuffer.length > 0) {
    fileBuffer = Buffer.isBuffer(faceEncodingBuffer) ? faceEncodingBuffer : Buffer.from(faceEncodingBuffer);
  } else if (storedPhotoPath && (storedPhotoPath.startsWith('http://') || storedPhotoPath.startsWith('https://'))) {
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
  } else if (storedPhotoPath && storedPhotoPath.startsWith('data:image/')) {
    const matches = storedPhotoPath.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      fileBuffer = Buffer.from(matches[2], 'base64');
    }
  } else if (storedPhotoPath) {
    const UP = env.UPLOAD_DIR || 'uploads';
    const relative = storedPhotoPath.replace(/^\/uploads\//, '');
    const absPath = path.isAbsolute(UP)
      ? path.join(UP, relative)
      : path.join(process.cwd(), UP, relative);

    if (fs.existsSync(absPath)) {
      fileBuffer = fs.readFileSync(absPath);
      ext = path.extname(absPath).toLowerCase();
    }
  }

  if (!fileBuffer || fileBuffer.length === 0) {
    throw Object.assign(
      new Error('No enrolled face photo found for this employee. Please enroll face first.'),
      { status: 400, code: 'FACE_NOT_ENROLLED' }
    );
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
    const msg = body?.error || (response.status >= 500
      ? 'Face verification service is warming up. Please try again in a few moments.'
      : 'Face verification failed unexpectedly.');
    throw Object.assign(
      new Error(msg),
      { status: response.status >= 500 ? 503 : 502 }
    );
  }

  return response.json();
}

async function validateFaceEnrollment(filePath, imageBuffer) {
  const buf = imageBuffer || fs.readFileSync(filePath);
  const ext = filePath ? path.extname(filePath).toLowerCase() : '.jpg';
  const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  const response = await postToDeepFace('/validate', {
    image: `data:${mime};base64,${buf.toString('base64')}`,
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.valid) {
    const errorMsg = body?.error || (response.status >= 500
      ? 'Face verification service is warming up. Please wait 15 seconds and try again.'
      : 'The enrollment image must contain one clear face.');
    throw Object.assign(
      new Error(errorMsg),
      { status: response.status >= 500 ? 503 : 400, code: 'FACE_ENROLLMENT_INVALID' }
    );
  }
  return body;
}

/**
 * Full face verification pipeline with matching and lockout.
 *
 * @param {{ id: string, profileImageUrl: string|null, faceEncodingData: Buffer|Uint8Array|null, faceBlockedUntil: Date|null, faceMismatchCount: number }} employee
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

  // Call DeepFace service with persistent encoding buffer fallback.
  const result = await verifyFace(faceImage, employee.profileImageUrl, employee.faceEncodingData);

  // Anti-spoofing check if enabled
  if (result.is_real === false) {
    await incrementFaceMismatch(employee.id);
    throw Object.assign(
      new Error('Liveness check failed. Please use a live camera — not a photo or screen.'),
      { status: 403 }
    );
  }

  // Face match check
  if (!result.verified) {
    await incrementFaceMismatch(employee.id);
    throw Object.assign(
      new Error('Face verification failed. The camera image did not match your registered face.'),
      { status: 403 }
    );
  }

  // Success — reset any accumulated mismatches
  if (employee.faceMismatchCount > 0) {
    await resetFaceMismatch(employee.id);
  }

  return result;
}

/**
 * Keep mismatch telemetry without blocking future verification attempts.
 */
async function incrementFaceMismatch(employeeId) {
  try {
    await prisma.user.update({
      where: { id: employeeId },
      data: {
        faceMismatchCount: { increment: 1 },
        faceLastMismatchAt: new Date(),
      },
      select: { faceMismatchCount: true },
    });
  } catch (err) {
    logger.warn('Failed to increment face mismatch:', err.message);
  }
}

/**
 * Reset the face mismatch counter after a successful verification.
 */
async function resetFaceMismatch(employeeId) {
  try {
    await prisma.user.update({
      where: { id: employeeId },
      data: { faceMismatchCount: 0, faceLastMismatchAt: null, faceBlockedUntil: null },
    });
  } catch (err) {
    logger.warn('Failed to reset face mismatch:', err.message);
  }
}

/**
 * Check if the employee's stored face photo actually exists in DB or disk.
 * Prevents phantom paths from locking out employees if files were lost.
 *
 * @param {object|string|null} employeeOrPath
 * @returns {boolean}
 */
function hasValidEnrolledFace(employeeOrPath) {
  if (!employeeOrPath) return false;
  if (typeof employeeOrPath === 'object') {
    if (employeeOrPath.faceEncodingData && employeeOrPath.faceEncodingData.length > 0) return true;
    return hasValidEnrolledFace(employeeOrPath.profileImageUrl);
  }
  const storedPhotoPath = employeeOrPath;
  if (typeof storedPhotoPath !== 'string') return false;
  if (storedPhotoPath.startsWith('http://') || storedPhotoPath.startsWith('https://') || storedPhotoPath.startsWith('data:image/')) return true;
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
