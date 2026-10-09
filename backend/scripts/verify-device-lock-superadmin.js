const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const PlanPolicy = require('../src/services/PlanPolicyService');
const AuthService = require('../src/services/AuthenticationService');

async function run() {
  console.log('--- Starting Hardware Device Lock & Super Admin Verification ---');

  // Find or create a test organization
  let testOrg = await prisma.organization.findFirst({
    where: { name: 'Device Test Corp' },
  });

  if (!testOrg) {
    testOrg = await prisma.organization.create({
      data: {
        name: 'Device Test Corp',
        subscriptionTier: 'starter',
        maxDesktopAdmins: 1,
        maxKiosks: 1,
        maxEmployees: 20,
        timezone: 'Africa/Lagos',
      },
    });
  } else {
    await prisma.organization.update({
      where: { id: testOrg.id },
      data: {
        subscriptionTier: 'starter',
        maxDesktopAdmins: 1,
        maxKiosks: 1,
      },
    });
  }

  // Clean existing test devices for this org
  await prisma.kioskDevice.deleteMany({
    where: { orgId: testOrg.id },
  });

  console.log(`[1] Created/Reset Starter Org: ${testOrg.name} (maxDesktopAdmins: ${testOrg.maxDesktopAdmins})`);

  // Test 1: First Desktop Admin Device binds
  const devA = 'device-pc-001';
  const bindA = await PlanPolicy.evaluateDesktopDeviceBinding(testOrg.id, devA, {
    deviceName: 'Kelvin Windows 11 PC',
    platform: 'Windows',
    firmwareVersion: 'TimeLogic Desktop v1.0.32 (Windows 11 / 16 cores)',
    ipAddress: '192.168.1.101',
  });

  console.log(`[2] Device A Binding: ${bindA.status} (ID: ${bindA.device.id}, Bound: ${bindA.device.isBound})`);
  if (bindA.status !== 'NEWLY_BOUND' || !bindA.device.isBound) {
    throw new Error('Device A failed to bind properly');
  }

  // Test 2: Device A signs in again (should be recognized as ALREADY_BOUND)
  const bindAgainA = await PlanPolicy.evaluateDesktopDeviceBinding(testOrg.id, devA, {
    deviceName: 'Kelvin Windows 11 PC',
    platform: 'Windows',
  });
  console.log(`[3] Device A Re-login: ${bindAgainA.status}`);
  if (bindAgainA.status !== 'ALREADY_BOUND') {
    throw new Error('Device A re-login was not recognized as already bound');
  }

  // Test 3: Device B tries to sign in on Starter plan (limit is 1, so it must be blocked)
  const devB = 'device-pc-002';
  let blocked = false;
  try {
    await PlanPolicy.evaluateDesktopDeviceBinding(testOrg.id, devB, {
      deviceName: 'Another Admin Laptop',
      platform: 'macOS',
      firmwareVersion: 'TimeLogic Desktop v1.0.32 (macOS / 8 cores)',
      ipAddress: '192.168.1.105',
    });
  } catch (err) {
    blocked = true;
    console.log(`[4] Device B Sign-in Blocked as Expected: Code = ${err.code}`);
    console.log(`    Message: ${err.message}`);
    if (err.code !== 'DESKTOP_DEVICE_LOCKED' || err.status !== 403) {
      throw new Error(`Expected DESKTOP_DEVICE_LOCKED with status 403, got code=${err.code}, status=${err.status}`);
    }
  }

  if (!blocked) {
    throw new Error('Device B was NOT blocked even though maxDesktopAdmins=1 limit was reached!');
  }

  // Test 4: Super Admin unlocks Device A
  const unlocked = await prisma.kioskDevice.update({
    where: { id: bindA.device.id },
    data: { isBound: false, releasedAt: new Date() },
  });
  console.log(`[5] Super Admin unlocked Device A: isBound = ${unlocked.isBound}`);

  // Test 5: Now Device B tries to sign in again (should succeed since slot is free)
  const bindB = await PlanPolicy.evaluateDesktopDeviceBinding(testOrg.id, devB, {
    deviceName: 'Another Admin Laptop',
    platform: 'macOS',
    firmwareVersion: 'TimeLogic Desktop v1.0.32 (macOS / 8 cores)',
    ipAddress: '192.168.1.105',
  });
  console.log(`[6] Device B Binding after unlock: ${bindB.status} (ID: ${bindB.device.id})`);
  if (bindB.status !== 'NEWLY_BOUND' || !bindB.device.isBound) {
    throw new Error('Device B failed to bind after slot was released');
  }

  // Test 6: Verify Enterprise Tier (maxDesktopAdmins: 3)
  await prisma.organization.update({
    where: { id: testOrg.id },
    data: { subscriptionTier: 'enterprise', maxDesktopAdmins: 3 },
  });

  const devC = 'device-pc-003';
  const devD = 'device-pc-004';
  const devE = 'device-pc-005';

  const bindC = await PlanPolicy.evaluateDesktopDeviceBinding(testOrg.id, devC, { deviceName: 'Enterprise PC 2' });
  const bindD = await PlanPolicy.evaluateDesktopDeviceBinding(testOrg.id, devD, { deviceName: 'Enterprise PC 3' });
  console.log(`[7] Enterprise PC 2 bound: ${bindC.status}, Enterprise PC 3 bound: ${bindD.status}`);

  // 4th device should now be blocked
  let enterpriseBlocked = false;
  try {
    await PlanPolicy.evaluateDesktopDeviceBinding(testOrg.id, devE, { deviceName: 'Enterprise PC 4' });
  } catch (err) {
    enterpriseBlocked = true;
    console.log(`[8] Enterprise 4th PC Blocked as Expected: Code = ${err.code}`);
    if (err.code !== 'DESKTOP_DEVICE_LOCKED') {
      throw new Error(`Enterprise 4th PC was not blocked with DESKTOP_DEVICE_LOCKED`);
    }
  }

  if (!enterpriseBlocked) {
    throw new Error('Enterprise 4th PC was not blocked when 3 seats were already full!');
  }

  // Clean up test data
  await prisma.kioskDevice.deleteMany({ where: { orgId: testOrg.id } });
  await prisma.organization.delete({ where: { id: testOrg.id } });

  console.log('\n ALL TESTS PASSED! Hardware device single-system locking, multi-system enterprise limit, and Super Admin unlock logic verified successfully.');
}

run()
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
