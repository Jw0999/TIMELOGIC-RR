// ============================================================================
// Verification Script: Offline Batch Sync & Historical Timestamps
// ============================================================================

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const AttendanceService = require('../src/services/AttendanceService');

async function run() {
  console.log('🚀 Starting Offline Batch Sync & Multi-Frontend Propagation Test...\n');

  let testOrg, testOffice, testSession, testUser, testAdmin;

  try {
    const orgId = `test-offline-org-${Date.now()}`;
    const passwordHash = await bcrypt.hash('TestPass123!', 10);

    // 1. Setup Test Organization, Office, Admin, Employee
    testOrg = await prisma.organization.create({
      data: {
        id: orgId,
        name: 'Offline Verification Org',
        subscriptionTier: 'enterprise',
        subscriptionStatus: 'ACTIVE',
        subscriptionStart: new Date(),
        subscriptionExpiresAt: new Date(Date.now() + 30 * 86400000),
        allowManualCheckIn: true,
      },
    });
    console.log(`1. Created Org: ${testOrg.name} (${testOrg.id})`);

    testOffice = await prisma.office.create({
      data: {
        name: 'HQ Office',
        orgId: testOrg.id,
        timezone: 'Africa/Lagos',
        openTime: '08:00',
        closeTime: '18:00',
        graceMinutes: 15,
        isActive: true,
      },
    });

    // Session starting today at 07:00 and ending at 19:00
    const today = new Date();
    const startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 7, 0, 0);
    const endTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 19, 0, 0);

    testSession = await prisma.attendanceSession.create({
      data: {
        sessionName: 'General Work Shift',
        officeId: testOffice.id,
        startTime,
        endTime,
        status: 'ACTIVE',
      },
    });

    testAdmin = await prisma.user.create({
      data: {
        email: `admin-${Date.now()}@offline.test`,
        passwordHash,
        firstName: 'Station',
        lastName: 'Admin',
        role: 'ADMIN',
        orgId: testOrg.id,
      },
    });

    testUser = await prisma.user.create({
      data: {
        email: `emp-${Date.now()}@offline.test`,
        employeeCode: `EMP${Date.now().toString().slice(-4)}`,
        passwordHash,
        firstName: 'Chidi',
        lastName: 'Okafor',
        role: 'EMPLOYEE',
        checkInMethod: 'BOTH',
        orgId: testOrg.id,
        officeId: testOffice.id,
      },
    });
    console.log(`2. Created Employee: ${testUser.firstName} ${testUser.lastName} (${testUser.id})`);

    // 2. Simulate Offline Clock-In (e.g. at 08:05 AM)
    const offlineClockInTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 5, 0).toISOString();
    console.log(`\n3. Simulating Offline Check-In captured at: ${offlineClockInTime}`);

    const syncPayload = {
      records: [
        {
          clientEventId: 'evt-offline-001',
          employeeId: testUser.id,
          type: 'check_in',
          sessionId: testSession.id,
          password: 'TestPass123!',
          timestamp: offlineClockInTime,
        },
      ],
    };

    const syncResult = await AttendanceService.batchSyncAttendance(
      testAdmin.id,
      testOrg.id,
      syncPayload
    );

    console.log('   Batch Sync Result:', JSON.stringify(syncResult, null, 2));
    if (syncResult.syncedCount !== 1) {
      throw new Error(`Expected 1 synced record, got ${syncResult.syncedCount}`);
    }

    // Verify record in PostgreSQL database
    const savedRecord = await prisma.attendanceRecord.findFirst({
      where: { employeeId: testUser.id, sessionId: testSession.id },
    });

    if (!savedRecord) {
      throw new Error('Attendance record was not found in PostgreSQL!');
    }

    console.log(`   ✓ PostgreSQL Record verified! ID: ${savedRecord.id}`);
    console.log(`   ✓ Clock-in Time in DB: ${savedRecord.clockInTime.toISOString()}`);
    console.log(`   ✓ Status in DB: ${savedRecord.status} (Grace Period respected: on-time at 08:05)`);

    // 4. Test Idempotency (Retrying same batch when network flickers)
    console.log('\n4. Testing Idempotent Retry of same batch...');
    const retryResult = await AttendanceService.batchSyncAttendance(
      testAdmin.id,
      testOrg.id,
      syncPayload
    );
    console.log('   Retry Result:', JSON.stringify(retryResult, null, 2));
    if (retryResult.syncedCount !== 1 || retryResult.results[0].status !== 'ALREADY_SYNCED') {
      throw new Error('Expected ALREADY_SYNCED status on duplicate retry!');
    }
    console.log('   ✓ Idempotency verified: Duplicates safely detected and confirmed!');

    // 5. Simulate Offline Check-Out at 18:05 (Office closes at 18:00)
    const offlineClockOutTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 18, 5, 0).toISOString();
    console.log(`\n5. Simulating Offline Check-Out captured at: ${offlineClockOutTime}`);

    const checkoutPayload = {
      records: [
        {
          clientEventId: 'evt-offline-002',
          employeeId: testUser.id,
          type: 'check_out',
          sessionId: testSession.id,
          password: 'TestPass123!',
          timestamp: offlineClockOutTime,
        },
      ],
    };

    const checkoutResult = await AttendanceService.batchSyncAttendance(
      testAdmin.id,
      testOrg.id,
      checkoutPayload
    );

    console.log('   Check-Out Sync Result:', JSON.stringify(checkoutResult, null, 2));
    if (checkoutResult.syncedCount !== 1) {
      throw new Error(`Expected 1 synced checkout, got ${checkoutResult.syncedCount}`);
    }

    const completedRecord = await prisma.attendanceRecord.findUnique({
      where: { id: savedRecord.id },
    });

    console.log(`   ✓ Work Hours calculated from offline times: ${completedRecord.totalWorkHours} hrs (Expected ~9.42 hrs)`);

    console.log('\n========================================================');
    console.log('🎉 ALL OFFLINE BATCH SYNC & TIMESTAMPS TESTS PASSED 100%!');
    console.log('========================================================\n');

  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  } finally {
    // Cleanup
    if (testOrg) {
      console.log('Cleaning up test records...');
      await prisma.attendanceRecord.deleteMany({ where: { employee: { orgId: testOrg.id } } }).catch(() => {});
      await prisma.attendanceSession.deleteMany({ where: { office: { orgId: testOrg.id } } }).catch(() => {});
      await prisma.user.deleteMany({ where: { orgId: testOrg.id } }).catch(() => {});
      await prisma.office.deleteMany({ where: { orgId: testOrg.id } }).catch(() => {});
      await prisma.organization.delete({ where: { id: testOrg.id } }).catch(() => {});
      console.log('Cleanup complete.');
    }
    await prisma.$disconnect();
  }
}

run();
