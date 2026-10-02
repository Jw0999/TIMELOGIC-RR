const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const PlanPolicy = require('../src/services/PlanPolicyService');

const prisma = new PrismaClient();

async function runVerification() {
  console.log('🚀 Starting Verification of Plan Tiers & Kiosk Device Binding...\n');

  const testOrgId = `test-plan-org-${Date.now()}`;
  const testAdminId = `test-admin-${Date.now()}`;

  try {
    // 1. Test PlanPolicyService resolution
    console.log('1. Testing Plan Limits Resolution:');
    const starterLimits = PlanPolicy.resolvePlanLimits('starter');
    console.log('   Starter:', starterLimits);
    if (starterLimits.maxEmployees !== 20 || starterLimits.maxKiosks !== 1) {
      throw new Error('Starter limits mismatch!');
    }

    const enterpriseLimits = PlanPolicy.resolvePlanLimits('enterprise');
    console.log('   Enterprise:', enterpriseLimits);
    if (enterpriseLimits.maxEmployees !== 60 || enterpriseLimits.maxKiosks !== null) {
      throw new Error('Enterprise limits mismatch!');
    }

    const customLimits = PlanPolicy.resolvePlanLimits('custom', { maxEmployees: 150, maxKiosks: 5 });
    console.log('   Custom:', customLimits);
    if (customLimits.maxEmployees !== 150 || customLimits.maxKiosks !== 5) {
      throw new Error('Custom limits mismatch!');
    }
    console.log('   ✓ Plan limits resolution passed!\n');

    // 2. Create a test organization on STARTER plan
    console.log('2. Creating Test Org on STARTER plan (Max 20 staff, 1 Kiosk, 1 Office)...');
    const org = await prisma.organization.create({
      data: {
        id: testOrgId,
        name: 'Starter Verification Org',
        subscriptionTier: 'starter',
        maxEmployees: 20,
        maxKiosks: 1,
        maxOffices: 1,
        subscriptionStatus: 'ACTIVE',
        offices: {
          create: {
            id: uuidv4(),
            name: 'HQ Office',
            timezone: 'Africa/Lagos',
          },
        },
      },
      include: { offices: true },
    });
    console.log('   ✓ Created org:', org.name, 'with tier:', org.subscriptionTier);

    // 3. Verify Office limit enforcement on Starter
    console.log('\n3. Testing Office Limit Enforcement:');
    try {
      await PlanPolicy.assertCanAddOffice(testOrgId);
      throw new Error('Should have rejected second office on Starter!');
    } catch (err) {
      if (err.code === 'PLAN_OFFICE_LIMIT_EXCEEDED') {
        console.log('   ✓ Successfully rejected 2nd office on Starter:', err.message);
      } else {
        throw err;
      }
    }

    // 4. Create 20 mock active employees
    console.log('\n4. Testing Employee Limit Enforcement:');
    console.log('   Adding 20 active employees to reach Starter limit...');
    const userCreates = [];
    for (let i = 1; i <= 20; i++) {
      userCreates.push(
        prisma.user.create({
          data: {
            id: uuidv4(),
            orgId: testOrgId,
            email: `emp${i}_${Date.now()}@test.com`,
            passwordHash: 'dummy',
            firstName: `Emp${i}`,
            lastName: 'Test',
            role: 'EMPLOYEE',
            status: 'ACTIVE',
          },
        })
      );
    }
    await Promise.all(userCreates);
    console.log('   ✓ 20 employees added.');

    // Now try to add the 21st employee
    try {
      await PlanPolicy.assertCanAddEmployee(testOrgId);
      throw new Error('Should have rejected 21st employee on Starter!');
    } catch (err) {
      if (err.code === 'PLAN_EMPLOYEE_LIMIT_EXCEEDED') {
        console.log('   ✓ Successfully rejected 21st employee on Starter:', err.message);
      } else {
        throw err;
      }
    }

    // 5. Test Kiosk Hardware Device Binding
    console.log('\n5. Testing Kiosk Hardware Device Binding:');
    const pc1_deviceId = `pc-terminal-1-${Date.now()}`;
    const pc2_deviceId = `pc-terminal-2-${Date.now()}`;

    // PC #1 logs in for the first time
    console.log('   PC #1 logs into Kiosk:');
    const bind1 = await PlanPolicy.evaluateKioskDeviceBinding(testOrgId, pc1_deviceId, {
      deviceName: 'Front Desk PC (Windows 11)',
      platform: 'Windows PC',
      ipAddress: '192.168.1.101',
    });
    console.log('   ✓ PC #1 binding result:', bind1.status, 'Device ID:', bind1.device.id);

    // PC #1 logs in again (same device)
    console.log('   PC #1 logs in again (same device):');
    const bind1_repeat = await PlanPolicy.evaluateKioskDeviceBinding(testOrgId, pc1_deviceId, {
      deviceName: 'Front Desk PC (Windows 11)',
      platform: 'Windows PC',
      ipAddress: '192.168.1.101',
    });
    console.log('   ✓ PC #1 repeat login result:', bind1_repeat.status);

    // PC #2 attempts to log in while PC #1 is bound on Starter (1 max)
    console.log('   PC #2 attempts to log in (Different device while slot bound):');
    try {
      await PlanPolicy.evaluateKioskDeviceBinding(testOrgId, pc2_deviceId, {
        deviceName: 'Back Office Laptop (macOS)',
        platform: 'macOS Terminal',
        ipAddress: '192.168.1.102',
      });
      throw new Error('Should have rejected PC #2 while PC #1 is bound!');
    } catch (err) {
      if (err.code === 'KIOSK_DEVICE_LOCKED') {
        console.log('   ✓ Successfully blocked PC #2 with KIOSK_DEVICE_LOCKED:');
        console.log('     "', err.message, '"');
      } else {
        throw err;
      }
    }

    // 6. Desktop Admin Releases PC #1
    console.log('\n6. Desktop Admin Releases Kiosk Device:');
    await prisma.kioskDevice.update({
      where: { id: bind1.device.id },
      data: { isBound: false, releasedAt: new Date() },
    });
    console.log('   ✓ Kiosk slot released by administrator.');

    // 7. PC #2 attempts to log in again after release
    console.log('   PC #2 logs in after release:');
    const bind2 = await PlanPolicy.evaluateKioskDeviceBinding(testOrgId, pc2_deviceId, {
      deviceName: 'Back Office Laptop (macOS)',
      platform: 'macOS Terminal',
      ipAddress: '192.168.1.102',
    });
    console.log('   ✓ PC #2 binding result:', bind2.status, 'Device ID:', bind2.device.id);

    // Now PC #1 attempts to log in again: should be rejected because PC #2 is now bound!
    console.log('   PC #1 attempts to log in now that PC #2 is bound:');
    try {
      await PlanPolicy.evaluateKioskDeviceBinding(testOrgId, pc1_deviceId, {
        deviceName: 'Front Desk PC (Windows 11)',
        platform: 'Windows PC',
      });
      throw new Error('Should have rejected PC #1 now that PC #2 is bound!');
    } catch (err) {
      if (err.code === 'KIOSK_DEVICE_LOCKED') {
        console.log('   ✓ Successfully blocked PC #1 (now locked to PC #2):');
        console.log('     "', err.message, '"');
      } else {
        throw err;
      }
    }

    console.log('\n========================================================');
    console.log('🎉 ALL PLAN TIERS & KIOSK BINDING TESTS PASSED 100%!');
    console.log('========================================================\n');
  } finally {
    // Cleanup test records
    console.log('Cleaning up test records...');
    await prisma.organization.deleteMany({ where: { id: testOrgId } });
    await prisma.$disconnect();
    console.log('Cleanup complete.');
  }
}

runVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
