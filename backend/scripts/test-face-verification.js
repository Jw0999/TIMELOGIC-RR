/**
 * Empirical Automated Verification Test Suite for TimeLogic Face Verification
 *
 * Tests:
 * 1. DeepFace / SFace live microservice health
 * 2. Same-face match verification (asserts verified === true)
 * 3. Cross-employee / buddy-punching mismatch prevention (asserts verified === false, distance > threshold)
 * 4. Non-face / missing face rejection (asserts verified === false, error: 'No face detected...')
 * 5. Backend performFaceVerification pipeline integration (asserts proper HTTP 403 and error messaging)
 * 6. Biometric Release Face & Lock mechanics (asserts hasValidEnrolledFace state transitions)
 */

const fs = require('fs');
const path = require('path');
const env = require('../src/config/env');
const { performFaceVerification, hasValidEnrolledFace } = require('../src/utils/faceVerify');

const DEEPFACE_URL = process.env.DEEPFACE_URL || 'http://127.0.0.1:5001';
const INTERNAL_SECRET = env.INTERNAL_SERVICE_SECRET;

// Test assets
const FACE_1 = path.join(__dirname, '../uploads/faces/10759470-2606-4bf4-b805-dd597192b81f.jpeg');
const FACE_2 = path.join(__dirname, '../uploads/faces/25dc7aed-2b00-4135-afc2-94d8b429baae.jpg');
const FACE_3 = path.join(__dirname, '../uploads/faces/54f2440e-8d3c-47bd-b0d5-e72b69a529be.jpg');
const NON_FACE = path.join(__dirname, '../../IMAGE/logo.jpeg');

const results = [];

function recordTest(testName, passed, details) {
  results.push({ testName, passed, details });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`\n${status}: ${testName}`);
  console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
}

async function run() {
  console.log('================================================================');
  console.log('  TIMELOGIC FACIAL BIOMETRIC & VERIFICATION TEST SUITE');
  console.log('================================================================');

  // Test 1: Service Health
  try {
    const res = await fetch(`${DEEPFACE_URL}/health`);
    const data = await res.json();
    const ok = res.status === 200 && data.status === 'ok';
    recordTest('DeepFace Microservice Health & Availability', ok, data);
  } catch (err) {
    recordTest('DeepFace Microservice Health & Availability', false, { error: err.message });
  }

  // Load image buffers
  const buf1 = fs.readFileSync(FACE_1);
  const buf2 = fs.readFileSync(FACE_2);
  const buf3 = fs.readFileSync(FACE_3);
  const bufNonFace = fs.readFileSync(NON_FACE);

  const b64Face1 = `data:image/jpeg;base64,${buf1.toString('base64')}`;
  const b64Face2 = `data:image/jpeg;base64,${buf2.toString('base64')}`;
  const b64Face3 = `data:image/jpeg;base64,${buf3.toString('base64')}`;
  const b64NonFace = `data:image/jpeg;base64,${bufNonFace.toString('base64')}`;

  // Test 2: Same-Person Verification (Legitimate employee check-in)
  try {
    const res = await fetch(`${DEEPFACE_URL}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Internal-Secret': INTERNAL_SECRET },
      body: JSON.stringify({ img1: b64Face1, img2: b64Face1 }),
    });
    const data = await res.json();
    const passed = data.verified === true && data.distance <= data.threshold;
    recordTest('Legitimate Check-In: Same Person Face Match', passed, {
      verified: data.verified,
      distance: data.distance,
      threshold: data.threshold,
      similarity: data.similarity,
    });
  } catch (err) {
    recordTest('Legitimate Check-In: Same Person Face Match', false, { error: err.message });
  }

  // Test 3: Buddy-Punching Prevention (Employee B checks in with Employee A registered face)
  try {
    const res = await fetch(`${DEEPFACE_URL}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Internal-Secret': INTERNAL_SECRET },
      body: JSON.stringify({ img1: b64Face2, img2: b64Face1 }),
    });
    const data = await res.json();
    const passed = data.verified === false && data.distance > data.threshold;
    recordTest('Buddy-Punching Prevention: Employee B cannot check in for Employee A', passed, {
      verified: data.verified,
      distance: data.distance,
      threshold: data.threshold,
      similarity: data.similarity,
      blocked: !data.verified,
    });
  } catch (err) {
    recordTest('Buddy-Punching Prevention: Employee B cannot check in for Employee A', false, { error: err.message });
  }

  // Test 4: Another Different Person Check
  try {
    const res = await fetch(`${DEEPFACE_URL}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Internal-Secret': INTERNAL_SECRET },
      body: JSON.stringify({ img1: b64Face3, img2: b64Face1 }),
    });
    const data = await res.json();
    const passed = data.verified === false;
    recordTest('Impersonation Prevention: Stranger / Employee C face rejected', passed, {
      verified: data.verified,
      distance: data.distance,
      threshold: data.threshold,
      similarity: data.similarity,
    });
  } catch (err) {
    recordTest('Impersonation Prevention: Stranger / Employee C face rejected', false, { error: err.message });
  }

  // Test 5: Non-Face / Spoof / Camera Covered Check
  try {
    const res = await fetch(`${DEEPFACE_URL}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Internal-Secret': INTERNAL_SECRET },
      body: JSON.stringify({ img1: b64NonFace, img2: b64Face1 }),
    });
    const data = await res.json();
    const passed = data.verified === false && Boolean(data.error);
    recordTest('Non-Face / Camera Covered Rejection', passed, {
      verified: data.verified,
      error: data.error,
    });
  } catch (err) {
    recordTest('Non-Face / Camera Covered Rejection', false, { error: err.message });
  }

  // Test 6: Backend Pipeline performFaceVerification with Matching Face
  try {
    const mockEmployee = {
      id: 'test-emp-001',
      profileImageUrl: '/uploads/faces/10759470-2606-4bf4-b805-dd597192b81f.jpeg',
      faceEncodingData: buf1,
      faceMismatchCount: 0,
    };
    const result = await performFaceVerification(mockEmployee, b64Face1);
    const passed = result.verified === true;
    recordTest('Backend performFaceVerification: Authorizes legitimate employee', passed, {
      verified: result.verified,
    });
  } catch (err) {
    recordTest('Backend performFaceVerification: Authorizes legitimate employee', false, { error: err.message });
  }

  // Test 7: Backend Pipeline performFaceVerification with Wrong Face (Must throw 403)
  try {
    const mockEmployee = {
      id: 'test-emp-001',
      profileImageUrl: '/uploads/faces/10759470-2606-4bf4-b805-dd597192b81f.jpeg',
      faceEncodingData: buf1,
      faceMismatchCount: 0,
    };
    let threw = false;
    let errStatus = 0;
    let errMsg = '';
    try {
      await performFaceVerification(mockEmployee, b64Face2);
    } catch (e) {
      threw = true;
      errStatus = e.status;
      errMsg = e.message;
    }
    const passed = threw && errStatus === 403;
    recordTest('Backend performFaceVerification: Blocks buddy-punching with HTTP 403', passed, {
      threw,
      errStatus,
      errMsg,
    });
  } catch (err) {
    recordTest('Backend performFaceVerification: Blocks buddy-punching with HTTP 403', false, { error: err.message });
  }

  // Test 8: Face Lock & Release State Machine
  {
    const empWithFace = {
      id: 'test-emp-001',
      profileImageUrl: '/uploads/faces/10759470-2606-4bf4-b805-dd597192b81f.jpeg',
      faceEncodingData: buf1,
    };
    const lockedBefore = hasValidEnrolledFace(empWithFace);

    // Simulate release
    const empReleased = {
      id: 'test-emp-001',
      profileImageUrl: null,
      faceEncodingData: null,
    };
    const unlockedAfter = !hasValidEnrolledFace(empReleased);

    // Simulate re-enrollment
    const empReEnrolled = {
      id: 'test-emp-001',
      profileImageUrl: '/uploads/faces/new-face.jpg',
      faceEncodingData: buf2,
    };
    const reLockedAfter = hasValidEnrolledFace(empReEnrolled);

    const passed = lockedBefore && unlockedAfter && reLockedAfter;
    recordTest('Biometric State Machine: Locked -> Released (Unlocked) -> Re-enrolled (Re-locked)', passed, {
      lockedBefore,
      unlockedAfter,
      reLockedAfter,
    });
  }

  console.log('\n================================================================');
  const allPassed = results.every((r) => r.passed);
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${results.filter((r) => r.passed).length} | FAILED: ${results.filter((r) => !r.passed).length}`);
  console.log(allPassed ? '>>> ALL FACE VERIFICATION TESTS PASSED SUCCESSFULLY! <<<' : '>>> SOME TESTS FAILED <<<');
  console.log('================================================================\n');

  process.exit(allPassed ? 0 : 1);
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
