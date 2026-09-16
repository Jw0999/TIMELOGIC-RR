const assert = require('assert');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const BACKEND_URL = 'http://127.0.0.1:5000/api';

async function main() {
  console.log('Testing end-to-end biometrics pipeline...');

  // 1. Setup test organization & admin
  const orgId = `test-bio-org-${Date.now()}`;
  const testOrg = await prisma.organization.create({
    data: {
      id: orgId,
      name: 'Biometric Test Org',
      industry: 'Technology',
      subscriptionTier: 'enterprise',
      allowManualCheckIn: true,
      allowDeviceCheckIn: true,
      requireFaceVerification: true,
      openingTime: '08:00',
      timezone: 'UTC',
    },
  });

  const adminPassword = 'AdminPassword123!';
  const adminHash = await bcrypt.hash(adminPassword, 10);
  const adminUser = await prisma.user.create({
    data: {
      id: uuidv4(),
      orgId,
      firstName: 'Bio',
      lastName: 'Admin',
      email: `bioadmin-${Date.now()}@example.com`,
      passwordHash: adminHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  const empPassword = 'EmpPassword123!';
  const empHash = await bcrypt.hash(empPassword, 10);
  const empUser = await prisma.user.create({
    data: {
      id: uuidv4(),
      orgId,
      firstName: 'Bio',
      lastName: 'Employee',
      email: `bioemp-${Date.now()}@example.com`,
      passwordHash: empHash,
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      checkInMethod: 'MANUAL',
    },
  });

  const office = await prisma.office.create({
    data: {
      id: uuidv4(),
      orgId,
      name: 'Bio Test Office',
      timezone: 'UTC',
      openTime: '00:00',
      closeTime: '23:59',
      isActive: true,
    },
  });

  const now = new Date();
  const session = await prisma.attendanceSession.create({
    data: {
      id: uuidv4(),
      officeId: office.id,
      sessionName: 'Today Session',
      startTime: new Date(now.getTime() - 60000),
      endTime: new Date(now.getTime() + 3600000),
      status: 'ACTIVE',
    },
  });

  try {
    // 2. Mint test admin token directly (avoids authLimiter)
    const jwt = require('jsonwebtoken');
    const env = require('../src/config/env');
    const token = jwt.sign({ sub: adminUser.id, role: 'ADMIN', orgId }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });

    // 3. Prepare face image (Lena test image)
    const lenaPath = '/tmp/lena.jpg';
    if (!fs.existsSync(lenaPath)) {
      const resp = await fetch('https://raw.githubusercontent.com/opencv/opencv/master/samples/data/lena.jpg');
      fs.writeFileSync(lenaPath, Buffer.from(await resp.arrayBuffer()));
    }
    const lenaBuffer = fs.readFileSync(lenaPath);
    const lenaBase64Uri = `data:image/jpeg;base64,${lenaBuffer.toString('base64')}`;

    // 4. Test Face Enrollment via POST /api/admin/users/:userId/face
    console.log('Testing face enrollment...');
    const formData = new FormData();
    formData.append('photo', new Blob([lenaBuffer], { type: 'image/jpeg' }), 'face.jpg');

    const enrollRes = await fetch(`${BACKEND_URL}/admin/users/${empUser.id}/face`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const enrollJson = await enrollRes.json();
    assert.strictEqual(enrollRes.status, 200, `Face enrollment should succeed: ${JSON.stringify(enrollJson)}`);
    assert.strictEqual(enrollJson.success, true);
    console.log('  OK Face enrollment succeeded');

    // Verify faceEncodingData was saved in PostgreSQL
    const empInDb = await prisma.user.findUnique({
      where: { id: empUser.id },
      select: { faceEncodingData: true, profileImageUrl: true },
    });
    assert(empInDb.faceEncodingData && empInDb.faceEncodingData.length > 0, 'faceEncodingData must be saved in DB');
    console.log(`  OK PostgreSQL persistent face storage verified (${empInDb.faceEncodingData.length} bytes)`);

    // 5. Test Re-enrollment Prevention
    console.log('Testing re-enrollment lockout...');
    const reEnrollRes = await fetch(`${BACKEND_URL}/admin/users/${empUser.id}/face`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const reEnrollJson = await reEnrollRes.json();
    assert.strictEqual(reEnrollRes.status, 400, 'Re-enrollment must be rejected with HTTP 400');
    assert.strictEqual(reEnrollJson.code, 'FACE_ALREADY_ENROLLED');
    console.log('  OK Permanent re-enrollment lockout verified');

    // 6. Test Ephemeral Disk Wipe Recovery
    console.log('Testing ephemeral disk wipe recovery...');
    const storedRelative = empInDb.profileImageUrl.replace(/^\/uploads\//, '');
    const diskPath = path.resolve(__dirname, '../uploads', storedRelative);
    if (fs.existsSync(diskPath)) {
      fs.unlinkSync(diskPath); // Simulate Render wiping the disk on container restart
      console.log('  Simulated Render ephemeral disk wipe: deleted', diskPath);
    }
    // Test static route DB fallback
    const staticRes = await fetch(`http://127.0.0.1:5000${empInDb.profileImageUrl}`);
    assert.strictEqual(staticRes.status, 200, 'Static route should serve face from PostgreSQL fallback');
    const servedBytes = Buffer.from(await staticRes.arrayBuffer());
    assert.strictEqual(servedBytes.length, empInDb.faceEncodingData.length, 'Served bytes must match DB binary');
    console.log('  OK Database image recovery served seamlessly after disk wipe');

    // 7. Test Check-In with Face Verification
    console.log('Testing check-in with face verification...');
    const checkInRes = await fetch(`${BACKEND_URL}/admin/manual-attendance/check-in`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employeeId: empUser.id,
        sessionId: session.id,
        password: empPassword,
        faceImage: lenaBase64Uri,
      }),
    });
    const checkInJson = await checkInRes.json();
    assert.strictEqual(checkInRes.status, 201, `Check-in with face must succeed: ${JSON.stringify(checkInJson)}`);
    assert.strictEqual(checkInJson.success, true);
    console.log('  OK Biometric check-in verified successfully');

    // 8. Test Check-Out (Strictly password-only, no camera)
    console.log('Testing check-out (password-only)...');
    const closeNow = new Date();
    const currentHHMM = `${String(closeNow.getUTCHours()).padStart(2, '0')}:${String(closeNow.getUTCMinutes()).padStart(2, '0')}`;
    await prisma.office.update({
      where: { id: office.id },
      data: { closeTime: currentHHMM },
    });
    const checkOutRes = await fetch(`${BACKEND_URL}/admin/manual-attendance/check-out`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employeeId: empUser.id,
        sessionId: session.id,
        password: empPassword,
      }),
    });
    const checkOutJson = await checkOutRes.json();
    assert.strictEqual(checkOutRes.status, 200, `Check-out must succeed without face: ${JSON.stringify(checkOutJson)}`);
    assert.strictEqual(checkOutJson.success, true);
    console.log('  OK Password-only checkout verified successfully');

    console.log('\n ALL BIOMETRIC PIPELINE TESTS PASSED CLEANLY!\n');
  } finally {
    // Clean up test data
    await prisma.attendanceRecord.deleteMany({ where: { employeeId: empUser.id } }).catch(() => {});
    await prisma.attendanceSession.deleteMany({ where: { officeId: office.id } }).catch(() => {});
    await prisma.office.deleteMany({ where: { id: office.id } }).catch(() => {});
    await prisma.user.deleteMany({ where: { orgId } }).catch(() => {});
    await prisma.organization.deleteMany({ where: { id: orgId } }).catch(() => {});
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Biometrics test failed:', err);
  process.exit(1);
});
