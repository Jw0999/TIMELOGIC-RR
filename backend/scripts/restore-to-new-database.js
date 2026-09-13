/**
 * Automated Production Data Restoration Script
 * ──────────────────────────────────────────────────────────
 * Reads the latest verified backup from:
 *   backups/timelogic_production_backup_latest.json
 * And populates the new target PostgreSQL database.
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

let rawUrl = process.env.DATABASE_URL || "postgresql://timelogic_db_user:U0pQSC6tV83OhMbBzYKcj8JOeezmleC0@dpg-dajj1e8ae00c73a5o8p0-a.oregon-postgres.render.com/timelogic_db";
if (!rawUrl.includes('sslmode=')) {
  rawUrl += (rawUrl.includes('?') ? '&' : '?') + 'sslmode=require&connect_timeout=30';
}
process.env.DATABASE_URL = rawUrl;
const targetDbUrl = rawUrl;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: targetDbUrl,
    },
  },
});

const toDate = (val, fallback = new Date()) => {
  if (!val) return fallback;
  const d = new Date(val);
  return isNaN(d.getTime()) ? fallback : d;
};

const toNullableDate = (val) => {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

async function main() {
  console.log('--- Starting Database Restoration ---');
  console.log('Connecting to target database...');

  const backupFile = path.resolve(__dirname, '../../backups/timelogic_production_backup_latest.json');
  if (!fs.existsSync(backupFile)) {
    throw new Error(`Backup file not found at: ${backupFile}`);
  }

  const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
  console.log(`Loaded backup file from ${backup.timestamp || 'latest'}`);

  // 1. Restore Organizations
  console.log('\n1. Restoring Organizations...');
  for (const org of backup.organizations || []) {
    console.log(`  -> Restoring Org: ${org.name} (${org.id})`);
    await prisma.organization.upsert({
      where: { id: org.id },
      update: {
        name: org.name,
        industry: org.industry,
        subscriptionTier: org.subscriptionTier || 'starter',
        leavePolicy: org.leavePolicy,
        allowDeviceCheckIn: org.allowDeviceCheckIn ?? true,
        allowManualCheckIn: org.allowManualCheckIn ?? false,
        hasStudents: org.hasStudents ?? false,
        openingTime: org.openingTime || '08:00',
        timezone: org.timezone || 'Africa/Lagos',
      },
      create: {
        id: org.id,
        name: org.name,
        industry: org.industry,
        subscriptionTier: org.subscriptionTier || 'starter',
        leavePolicy: org.leavePolicy,
        allowDeviceCheckIn: org.allowDeviceCheckIn ?? true,
        allowManualCheckIn: org.allowManualCheckIn ?? false,
        hasStudents: org.hasStudents ?? false,
        openingTime: org.openingTime || '08:00',
        timezone: org.timezone || 'Africa/Lagos',
        createdAt: toDate(org.createdAt),
        updatedAt: toDate(org.updatedAt),
      },
    });

    // 2. Restoring Offices
    for (const office of org.offices || []) {
      console.log(`    -> Office: ${office.name} (${office.id})`);
      await prisma.office.upsert({
        where: { id: office.id },
        update: {
          name: office.name,
          address: office.address || '',
          timezone: office.timezone || 'Africa/Lagos',
          isActive: office.isActive ?? true,
          wifiSSID: office.wifiSSID,
          breakMinutes: office.breakMinutes ?? 60,
          closeTime: office.closeTime || '17:00',
          openTime: office.openTime || '08:00',
          autoSessionMinutes: office.autoSessionMinutes ?? 60,
          breakEnd: office.breakEnd,
          breakStart: office.breakStart,
          graceMinutes: office.graceMinutes ?? 30,
          gracePenalty: office.gracePenalty ?? 0,
          lateAfterMinutes: office.lateAfterMinutes ?? 90,
          latePenalty: office.latePenalty ?? 0,
          publicIp: office.publicIp,
          weeklySchedule: office.weeklySchedule,
          completelyLatePenalty: office.completelyLatePenalty ?? 0,
        },
        create: {
          id: office.id,
          orgId: org.id,
          name: office.name,
          address: office.address || '',
          timezone: office.timezone || 'Africa/Lagos',
          isActive: office.isActive ?? true,
          wifiSSID: office.wifiSSID,
          breakMinutes: office.breakMinutes ?? 60,
          closeTime: office.closeTime || '17:00',
          openTime: office.openTime || '08:00',
          autoSessionMinutes: office.autoSessionMinutes ?? 60,
          breakEnd: office.breakEnd,
          breakStart: office.breakStart,
          graceMinutes: office.graceMinutes ?? 30,
          gracePenalty: office.gracePenalty ?? 0,
          lateAfterMinutes: office.lateAfterMinutes ?? 90,
          latePenalty: office.latePenalty ?? 0,
          publicIp: office.publicIp,
          weeklySchedule: office.weeklySchedule,
          completelyLatePenalty: office.completelyLatePenalty ?? 0,
          createdAt: toDate(office.createdAt),
          updatedAt: toDate(office.updatedAt),
        },
      });

      // Security Settings
      if (office.securitySettings) {
        const sec = office.securitySettings;
        await prisma.securitySettings.upsert({
          where: { officeId: office.id },
          update: {
            wifiRequired: sec.wifiRequired ?? true,
            deviceBindingEnabled: sec.deviceBindingEnabled ?? true,
            screenshotProtection: sec.screenshotProtection ?? true,
            qrRotationSeconds: sec.qrRotationSeconds ?? 30,
            maxDevicesPerEmployee: sec.maxDevicesPerEmployee ?? 2,
            lateThresholdMinutes: sec.lateThresholdMinutes ?? 15,
            maxFailedAttempts: sec.maxFailedAttempts ?? 5,
            autoLockOnFraud: sec.autoLockOnFraud ?? true,
          },
          create: {
            id: sec.id,
            officeId: office.id,
            wifiRequired: sec.wifiRequired ?? true,
            deviceBindingEnabled: sec.deviceBindingEnabled ?? true,
            screenshotProtection: sec.screenshotProtection ?? true,
            qrRotationSeconds: sec.qrRotationSeconds ?? 30,
            maxDevicesPerEmployee: sec.maxDevicesPerEmployee ?? 2,
            lateThresholdMinutes: sec.lateThresholdMinutes ?? 15,
            maxFailedAttempts: sec.maxFailedAttempts ?? 5,
            autoLockOnFraud: sec.autoLockOnFraud ?? true,
          },
        });
      }
    }

    // 3. Restoring Departments & Break Policies
    for (const dept of org.departments || []) {
      console.log(`    -> Department: ${dept.name} (${dept.id})`);
      await prisma.department.upsert({
        where: { id: dept.id },
        update: {
          name: dept.name,
        },
        create: {
          id: dept.id,
          orgId: org.id,
          name: dept.name,
          createdAt: toDate(dept.createdAt),
          updatedAt: toDate(dept.updatedAt),
        },
      });

      if (dept.breakPolicy) {
        const bp = dept.breakPolicy;
        await prisma.breakPolicy.upsert({
          where: { departmentId: dept.id },
          update: {
            policyName: bp.policyName || 'Department Break Policy',
            maxLunchMinutes: bp.maxLunchMinutes ?? 60,
            maxShortBreaks: bp.maxShortBreaks ?? 2,
            maxShortBreakMinutes: bp.maxShortBreakMinutes ?? 15,
            totalDailyBreakLimit: bp.totalDailyBreakLimit ?? 90,
            autoEndAfterMinutes: bp.autoEndAfterMinutes ?? 120,
            requiresApproval: bp.requiresApproval ?? false,
            appliesTo: bp.appliesTo || [],
            breakEnd: bp.breakEnd,
            breakStart: bp.breakStart,
            overstayPenalty: bp.overstayPenalty ?? 100,
          },
          create: {
            id: bp.id,
            departmentId: dept.id,
            policyName: bp.policyName || 'Department Break Policy',
            maxLunchMinutes: bp.maxLunchMinutes ?? 60,
            maxShortBreaks: bp.maxShortBreaks ?? 2,
            maxShortBreakMinutes: bp.maxShortBreakMinutes ?? 15,
            totalDailyBreakLimit: bp.totalDailyBreakLimit ?? 90,
            autoEndAfterMinutes: bp.autoEndAfterMinutes ?? 120,
            requiresApproval: bp.requiresApproval ?? false,
            appliesTo: bp.appliesTo || [],
            breakEnd: bp.breakEnd,
            breakStart: bp.breakStart,
            overstayPenalty: bp.overstayPenalty ?? 100,
          },
        });
      }
    }
  }

  // 4. Restoring Users
  console.log('\n2. Restoring Users...');
  const detailedRecords = backup.detailedEmployeeRecords || {};
  for (const [userId, rec] of Object.entries(detailedRecords)) {
    const user = rec.user;
    if (!user) continue;
    console.log(`  -> User: ${user.email} (${user.role})`);
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        orgId: user.orgId,
        departmentId: user.departmentId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role,
        profileImageUrl: user.profileImageUrl,
        status: user.status || 'ACTIVE',
        shiftType: user.shiftType || 'FLEXIBLE',
        adminLevel: user.adminLevel,
        lastLoginAt: toNullableDate(user.lastLoginAt),
        employeeCode: user.employeeCode,
        checkInMethod: user.checkInMethod || 'PHONE',
        phone: user.phone,
      },
      create: {
        id: user.id,
        orgId: user.orgId,
        departmentId: user.departmentId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role,
        profileImageUrl: user.profileImageUrl,
        status: user.status || 'ACTIVE',
        shiftType: user.shiftType || 'FLEXIBLE',
        adminLevel: user.adminLevel,
        lastLoginAt: toNullableDate(user.lastLoginAt),
        createdAt: toDate(user.createdAt),
        updatedAt: toDate(user.updatedAt),
        employeeCode: user.employeeCode,
        checkInMethod: user.checkInMethod || 'PHONE',
        phone: user.phone,
      },
    });
  }

  // 5. Restoring Attendance Sessions
  console.log('\n3. Restoring Attendance Sessions...');
  const sessionMap = new Map();
  const validSessionStatus = ['SCHEDULED', 'ACTIVE', 'PAUSED', 'LOCKED', 'ENDED'];
  const mapSessionStatus = (st) => (validSessionStatus.includes(st) ? st : 'ENDED');

  // Add sessions from backup.activeSessions
  for (const sess of backup.activeSessions || []) {
    sessionMap.set(sess.id, {
      id: sess.id,
      sessionName: sess.sessionName,
      officeId: sess.officeId,
      createdBy: sess.createdBy,
      startTime: toDate(sess.startTime),
      endTime: toNullableDate(sess.endTime),
      qrRefreshInterval: sess.qrRefreshInterval || 30,
      status: mapSessionStatus(sess.status),
      officeName: sess.officeName,
      orgName: sess.orgName,
      createdAt: toDate(sess.createdAt),
      updatedAt: toDate(sess.updatedAt),
    });
  }
  // Add sessions from attendance records if not already in map
  for (const [userId, rec] of Object.entries(detailedRecords)) {
    const userOrgId = rec.user?.orgId;
    const defaultOfficeId = backup.organizations?.find((o) => o.id === userOrgId)?.offices?.[0]?.id;
    for (const att of rec.attendanceRecords || []) {
      if (att.sessionId && !sessionMap.has(att.sessionId)) {
        sessionMap.set(att.sessionId, {
          id: att.sessionId,
          sessionName: att.session?.sessionName || 'Attendance Session',
          officeId: defaultOfficeId || null,
          createdBy: null,
          startTime: toDate(att.session?.startTime || att.date),
          endTime: null,
          qrRefreshInterval: 30,
          status: 'ENDED',
          officeName: 'Main Office',
          orgName: rec.user?.organization?.name || null,
          createdAt: toDate(att.createdAt),
          updatedAt: toDate(att.updatedAt),
        });
      }
    }
  }

  for (const [id, sess] of sessionMap.entries()) {
    console.log(`  -> Session: ${sess.sessionName} (${id})`);
    await prisma.attendanceSession.upsert({
      where: { id },
      update: {
        sessionName: sess.sessionName,
        officeId: sess.officeId,
        startTime: sess.startTime,
        endTime: sess.endTime,
        qrRefreshInterval: sess.qrRefreshInterval,
        status: sess.status,
      },
      create: sess,
    });
  }

  // 6. Restoring Attendance Records
  console.log('\n4. Restoring Employee Attendance Records...');
  let totalAttendance = 0;
  for (const [userId, rec] of Object.entries(detailedRecords)) {
    for (const att of rec.attendanceRecords || []) {
      const existing = await prisma.attendanceRecord.findUnique({
        where: { id: att.id },
      });
      if (!existing) {
        await prisma.attendanceRecord.create({
          data: {
            id: att.id,
            employeeId: att.employeeId,
            sessionId: att.sessionId,
            date: toDate(att.date),
            clockInTime: toNullableDate(att.clockInTime),
            clockOutTime: toNullableDate(att.clockOutTime),
            status: att.status,
            totalWorkHours: att.totalWorkHours,
            totalBreakMinutes: att.totalBreakMinutes ?? 0,
            scanResult: att.scanResult,
            wifiVerified: att.wifiVerified ?? false,
            deviceVerified: att.deviceVerified ?? false,
            flagged: att.flagged ?? false,
            flagReason: att.flagReason,
            reviewedBy: att.reviewedBy,
            reviewNotes: att.reviewNotes,
            createdAt: toDate(att.createdAt),
            updatedAt: toDate(att.updatedAt),
            deviceId: att.deviceId,
            penalty: att.penalty ?? 0,
            wifiSSID: att.wifiSSID,
            checkInSource: att.checkInSource || 'PHONE',
            checkOutSource: att.checkOutSource,
            checkInRecordedById: att.checkInRecordedById,
            checkOutRecordedById: att.checkOutRecordedById,
          },
        });
        totalAttendance++;
      }
    }
  }
  console.log(`  -> Restored ${totalAttendance} attendance records`);

  // 7. Restoring Break Records
  console.log('\n5. Restoring Break Records...');
  let totalBreaks = 0;
  for (const [userId, rec] of Object.entries(detailedRecords)) {
    for (const brk of rec.breakRecords || []) {
      const existing = await prisma.breakRecord.findUnique({
        where: { id: brk.id },
      });
      if (!existing) {
        await prisma.breakRecord.create({
          data: {
            id: brk.id,
            attendanceRecordId: brk.attendanceRecordId,
            employeeId: brk.employeeId,
            breakType: brk.breakType,
            startTime: toDate(brk.startTime),
            endTime: toNullableDate(brk.endTime),
            durationMinutes: brk.durationMinutes,
            isAutoEnded: brk.isAutoEnded ?? false,
            notes: brk.notes,
            penalty: brk.penalty ?? 0,
            startedByAdmin: brk.startedByAdmin ?? false,
          },
        });
        totalBreaks++;
      }
    }
  }
  console.log(`  -> Restored ${totalBreaks} break records`);

  // 8. Restoring Leave Balances
  console.log('\n6. Restoring Leave Balances...');
  let totalBalances = 0;
  for (const [userId, rec] of Object.entries(detailedRecords)) {
    for (const lb of rec.leaveBalances || []) {
      await prisma.leaveBalance.upsert({
        where: {
          employeeId_leaveType_year: {
            employeeId: lb.employeeId,
            leaveType: lb.leaveType,
            year: lb.year,
          },
        },
        update: {
          totalEntitled: lb.totalEntitled,
          used: lb.used,
          pending: lb.pending,
          remaining: lb.remaining,
          carriedForward: lb.carriedForward,
        },
        create: {
          id: lb.id,
          employeeId: lb.employeeId,
          leaveType: lb.leaveType,
          year: lb.year,
          totalEntitled: lb.totalEntitled,
          used: lb.used,
          pending: lb.pending,
          remaining: lb.remaining,
          carriedForward: lb.carriedForward,
        },
      });
      totalBalances++;
    }
  }
  console.log(`  -> Restored ${totalBalances} leave balances`);

  // 9. Restoring Students
  console.log('\n7. Restoring Students...');
  let totalStudents = 0;
  for (const stu of backup.students || []) {
    await prisma.student.upsert({
      where: { id: stu.id },
      update: {
        firstName: stu.firstName,
        lastName: stu.lastName,
        studentCode: stu.studentCode,
        className: stu.className,
        status: stu.status || 'ACTIVE',
      },
      create: {
        id: stu.id,
        orgId: stu.orgId,
        firstName: stu.firstName,
        lastName: stu.lastName,
        studentCode: stu.studentCode,
        className: stu.className,
        status: stu.status || 'ACTIVE',
        createdAt: toDate(stu.createdAt),
        updatedAt: toDate(stu.updatedAt),
      },
    });
    totalStudents++;
  }
  console.log(`  -> Restored ${totalStudents} students`);

  // 10. Restoring Student Attendance Records
  console.log('\n8. Restoring Student Attendance Records...');
  let totalStudentAtt = 0;
  for (const sa of backup.studentAttendance || []) {
    const existing = await prisma.studentAttendance.findUnique({
      where: { id: sa.id },
    });
    if (!existing) {
      await prisma.studentAttendance.create({
        data: {
          id: sa.id,
          studentId: sa.studentId,
          date: toDate(sa.date),
          checkInTime: toDate(sa.checkInTime),
          checkOutTime: toNullableDate(sa.checkOutTime),
          checkedInById: sa.checkedInById,
          checkedOutById: sa.checkedOutById,
          createdAt: toDate(sa.createdAt),
          updatedAt: toDate(sa.updatedAt),
        },
      });
      totalStudentAtt++;
    }
  }
  console.log(`  -> Restored ${totalStudentAtt} student attendance records`);

  console.log('\n=== ALL PRODUCTION DATA RESTORED 100% SUCCESSFULLY! ===');
}

main()
  .catch((err) => {
    console.error('Restoration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
