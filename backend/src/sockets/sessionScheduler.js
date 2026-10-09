/**
 * Session Scheduler — runs every 30s, driven by EACH OFFICE's own work hours
 * (office.openTime / office.closeTime, set per organization). Scales to many
 * organizations: each tick only touches offices whose threshold matches the
 * current minute, so most ticks do almost nothing.
 *
 *  openTime - AUTO_SESSION_LEAD_MIN
 *        → auto-create an ACTIVE session if the admin hasn't already.
 *  closeTime
 *        → end the session and stop new session activity. Open attendance records
 *          remain open until the employee explicitly checks out.
 */

const { prisma } = require('../config/database');
const { redis, PREFIXES } = require('../config/redis');
const { v4: uuidv4 } = require('uuid');
const env = require('../config/env');
const QRTokenService = require('../services/QRTokenService');
const BreakService = require('../services/BreakService');
const AttendanceService = require('../services/AttendanceService');
const logger = require('../config/logger');
const { atZonedTime, openingOccurrence, zonedParts, isSunday, officeHoursFor } = require('../utils/attendanceClock');
const { getCurrentServerTime } = require('../utils/networkTime');
const { evaluateAutoCheckout } = require('../utils/shiftHelper');

let _timer = null;
let _lastMinute = -1;

const sessionLeadMinutes = () => Math.max(0, Number(env.AUTO_SESSION_LEAD_MIN) || 40);

function toMinutes(hhmm) {
  if (!hhmm || typeof hhmm !== 'string') return null;
  const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}
async function tick() {
  try {
    const now = await getCurrentServerTime();
    const minuteKey = Math.floor(now.getTime() / 60000);
    if (minuteKey === _lastMinute) return; // once per absolute minute
    _lastMinute = minuteKey;

    // 1. Run midnight and cutoff auto-checkout sweep
    await runAutoCheckoutSweep(now);

    // Reconcile missed work after a restart, laptop sleep, or delayed timer.
    await endExpiredSessions(now);
    await endSessionsOutsideOfficeHours(now);

    // Periodic sweep for past absences across all organizations (runs every 10 minutes)
    if (minuteKey % 10 === 0) {
      await AttendanceService.reconcileAllPastAbsences(now).catch((e) => logger.warn('reconcileAllPastAbsences sweep:', e.message));
    }

    const orgs = await prisma.organization.findMany({
      where: { id: { not: 'platform-org' } },
      include: { offices: { where: { isActive: true }, orderBy: { createdAt: 'asc' } } },
    });

    for (const org of orgs) {
      for (const office of org.offices) {
        const local = zonedParts(now, office.timezone);
        const hours = officeHoursFor(now, {
          ...office,
          organizationOpeningTime: org.openingTime,
        });
        if (!hours) continue;
        const minOfDay = local.hour * 60 + local.minute;
        const openMin  = toMinutes(hours.openTime);
        const closeMin = toMinutes(hours.closeTime);
        if (openMin == null || closeMin == null) continue;

        let openAt = atZonedTime(now, hours.openTime, office.timezone);
        let closeAt = atZonedTime(now, hours.closeTime, office.timezone);
        if (closeMin <= openMin) {
          if (minOfDay < closeMin) openAt = atZonedTime(now, hours.openTime, office.timezone, -1);
          else closeAt = atZonedTime(now, hours.closeTime, office.timezone, 1);
        }
        const autoCreateAt = new Date(openAt.getTime() - sessionLeadMinutes() * 60_000);
        if (now >= autoCreateAt && now < closeAt) await autoCreate(org, office, now, openAt, closeAt);
      }

    }

    // Force-end any break that overstayed its department window (raises fraud).
    await BreakService.autoEndOverdueBreaks().catch((e) => logger.warn('break sweep:', e.message));
  } catch (err) {
    logger.warn(`Session scheduler tick error: ${err.stack || err.message}`);
  }
}

// Auto-create the employee session at the office opening time.
async function autoCreate(org, office, now, openAt, closeAt) {
  const lockKey = `${PREFIXES.SESSION_AUTO_LOCK}${office.id}:${openAt.toISOString()}`;
  const lockToken = uuidv4();
  const lockAcquired = await redis.set(lockKey, lockToken, 'EX', 90, 'NX').catch(() => null);
  if (lockAcquired !== 'OK') return;

  try {
  const existing = await prisma.attendanceSession.findFirst({
    where: {
      officeId: office.id,
      // Do not recreate an ended session after its check-in window expires.
      // The stored endTime remains the office close so open records can still
      // be checked out until closing/automatic checkout.
      startTime: { gte: new Date(openAt.getTime() - sessionLeadMinutes() * 60_000), lt: closeAt },
    },
    select: { id: true },
  });
  if (existing) {
    await AttendanceService.syncAdminAttendanceForSession(existing.id);
    return;
  }

  const admin = await prisma.user.findFirst({
    where: { orgId: org.id, role: 'ADMIN', status: 'ACTIVE' }, select: { id: true },
  });

  const startTime = new Date((openAt || now).getTime() - sessionLeadMinutes() * 60_000);
  let endTime = closeAt || atZonedTime(now, office.closeTime || '17:00', office.timezone);
  if (endTime <= startTime) endTime = atZonedTime(now, office.closeTime || '17:00', office.timezone, 1);
  if (endTime <= startTime) return;

  const session = await prisma.attendanceSession.create({
    data: {
      id: uuidv4(),
      sessionName: `${office.name} – ${now.toLocaleDateString('en-GB')}`,
      officeId:   office.id,
      officeName: office.name,
      orgName:    org.name,
      createdBy:  admin?.id ?? null,
      startTime, endTime,
      qrRefreshInterval: 120,
      status: 'ACTIVE',
    },
  });
  await QRTokenService.generate(session);
  await QRTokenService.scheduleRotation(session);
  await AttendanceService.syncAdminAttendanceForSession(session.id);
  logger.info(`Scheduler: auto-created session for ${org.name}/${office.name} (open ${office.openTime})`);
  } finally {
    await redis.eval(
      "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
      1, lockKey, lockToken,
    ).catch(() => {});
  }
}

async function runAutoCheckoutSweep(now) {
  try {
    const openRecords = await prisma.attendanceRecord.findMany({
      where: {
        clockInTime: { not: null },
        clockOutTime: null,
      },
      include: {
        employee: {
          select: {
            id: true,
            orgId: true,
            shiftType: true,
            organization: {
              select: {
                id: true,
                timezone: true,
                shiftSchedules: true,
                autoCheckoutPolicy: true,
              },
            },
          },
        },
        session: {
          select: {
            id: true,
            startTime: true,
            office: {
              select: {
                id: true,
                name: true,
                timezone: true,
                shiftSchedules: true,
                midnightAutoCheckout: true,
                dayShiftCutoffTime: true,
                nightShiftMaxHours: true,
                organization: {
                  select: {
                    id: true,
                    timezone: true,
                    shiftSchedules: true,
                    autoCheckoutPolicy: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    for (const record of openRecords) {
      const tz = record.session?.office?.timezone ||
        record.employee?.organization?.timezone ||
        'Africa/Lagos';

      const evaluation = evaluateAutoCheckout(record, now, tz);
      if (evaluation.shouldAutoCheckout) {
        await AttendanceService.autoCheckOutRecord(record.id, {
          reason: evaluation.reason,
          effectiveCheckoutTime: evaluation.effectiveCheckoutTime,
        }).catch((err) => {
          logger.error(`Error auto checking out record ${record.id}: ${err.message}`);
        });
      }
    }
  } catch (err) {
    logger.error(`Error in runAutoCheckoutSweep: ${err.message}`);
  }
}

async function endExpiredSessions(now) {
  const sessions = await prisma.attendanceSession.findMany({
    where: { endTime: { lte: now }, status: { in: ['ACTIVE', 'PAUSED'] } },
    select: { id: true, sessionName: true },
  });
  for (const sn of sessions) {
    // If employees are still clocked in, do not end session prematurely
    const openCount = await prisma.attendanceRecord.count({
      where: { sessionId: sn.id, clockInTime: { not: null }, clockOutTime: null },
    });
    if (openCount > 0) continue;

    await AttendanceService.syncEmployeeAbsencesForSession(sn.id).catch((e) => logger.warn('absence sweep:', e.message));
    await prisma.attendanceSession.updateMany({
      where: { id: sn.id, status: { in: ['ACTIVE', 'PAUSED'] } },
      data: { status: 'ENDED' },
    });
    await QRTokenService.invalidatePrevious(sn.id).catch(() => {});
    logger.info(`Scheduler: ended expired session ${sn.sessionName}`);
  }
}

async function endSessionsOutsideOfficeHours(now) {
  const sessions = await prisma.attendanceSession.findMany({
    where: { status: { in: ['ACTIVE', 'PAUSED'] } },
    select: {
      id: true, sessionName: true,
      office: { select: { openTime: true, closeTime: true, weeklySchedule: true, timezone: true } },
    },
  });

  for (const session of sessions) {
    if (!session.office) {
      await prisma.attendanceSession.updateMany({
        where: { id: session.id, status: { in: ['ACTIVE', 'PAUSED'] } },
        data: { status: 'ENDED' },
      });
      await QRTokenService.invalidatePrevious(session.id).catch(() => {});
      logger.warn(`Scheduler: ended session ${session.sessionName} because its office no longer exists`);
      continue;
    }
    const local = zonedParts(now, session.office.timezone);
    const hours = officeHoursFor(now, session.office);
    if (!hours) {
      await prisma.attendanceSession.updateMany({
        where: { id: session.id, status: { in: ['ACTIVE', 'PAUSED'] } },
        data: { status: 'ENDED' },
      });
      await QRTokenService.invalidatePrevious(session.id).catch(() => {});
      logger.info(`Scheduler: ended Sunday session ${session.sessionName}`);
      continue;
    }
    const openMin = toMinutes(hours.openTime);
    const closeMin = toMinutes(hours.closeTime);
    if (openMin == null || closeMin == null) continue;
    const localMin = local.hour * 60 + local.minute;
    let openAt = atZonedTime(now, hours.openTime, session.office.timezone);
    let closeAt = atZonedTime(now, hours.closeTime, session.office.timezone);
    if (closeMin <= openMin) {
      if (localMin < closeMin) {
        openAt = atZonedTime(now, hours.openTime, session.office.timezone, -1);
      } else {
        closeAt = atZonedTime(now, hours.closeTime, session.office.timezone, 1);
      }
    }

    const autoCreateAt = new Date(openAt.getTime() - sessionLeadMinutes() * 60_000);
    if (now < autoCreateAt || now >= closeAt) {
      // If employees are still clocked in on this session, keep it open!
      const openCount = await prisma.attendanceRecord.count({
        where: { sessionId: session.id, clockInTime: { not: null }, clockOutTime: null },
      });
      if (openCount > 0) continue;

      await AttendanceService.syncEmployeeAbsencesForSession(session.id).catch((e) => logger.warn('absence sweep:', e.message));
      await prisma.attendanceSession.updateMany({
        where: { id: session.id, status: { in: ['ACTIVE', 'PAUSED'] } },
        data: { status: 'ENDED' },
      });
      await QRTokenService.invalidatePrevious(session.id).catch(() => {});
      logger.info(`Scheduler: ended session outside office hours ${session.sessionName}`);
    }
  }
}

function startSessionScheduler() {
  if (_timer) return;
  void tick();
  _timer = setInterval(tick, 30_000);
  logger.info('Session scheduler started (per-office, multi-org)');
}
function stopSessionScheduler() { if (_timer) { clearInterval(_timer); _timer = null; } }

module.exports = { startSessionScheduler, stopSessionScheduler };
