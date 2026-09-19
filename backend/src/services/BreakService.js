const { v4: uuidv4 } = require('uuid');
const { prisma } = require('../config/database');
const NotificationService = require('./NotificationService');
const logger = require('../config/logger');
const { atZonedTime, dayBounds, zonedParts } = require('../utils/attendanceClock');
const { getCurrentServerTime } = require('../utils/networkTime');

const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };

class BreakService {
  withLifecycleStatus(records) {
    return (Array.isArray(records) ? records : [records]).map((record) => ({
      ...record,
      lifecycleStatus: record.endTime ? (record.isAutoEnded ? 'EXTENDED' : 'ENDED') : 'ACTIVE',
    }));
  }

  _overstayPenalty(startTime, endTime, policy, timezone, office = null) {
    if (!startTime || !endTime) return 0;

    const penaltyAmount = Number(policy?.overstayPenalty) || Number(office?.overstayPenalty) || 0;
    if (penaltyAmount <= 0) return 0;

    let isOverstayed = false;

    // 1. Overstayed past scheduled break window end time
    if (policy?.breakEnd) {
      const windowEnd = atZonedTime(startTime, policy.breakEnd, timezone);
      if (windowEnd && endTime.getTime() > windowEnd.getTime()) {
        isOverstayed = true;
      }
    }

    // 2. Overstayed past daily break limit duration
    const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);
    const limitMinutes = policy?.totalDailyBreakLimit || policy?.maxLunchMinutes || office?.breakMinutes || 60;
    if (durationMinutes > limitMinutes) {
      isOverstayed = true;
    }

    return isOverstayed ? penaltyAmount : 0;
  }

  async startBreak(employeeId, breakType, notes = null, startedByAdmin = false) {
    const record = await prisma.attendanceRecord.findFirst({
      where: { employeeId, clockInTime: { not: null }, clockOutTime: null },
      orderBy: { clockInTime: 'desc' },
      include: { session: { select: { office: { select: { timezone: true } } } } },
    });
    if (!record) throw Object.assign(new Error('No active attendance record for today'), { status: 404 });

    const active = await this.getActiveBreak(employeeId);
    if (active) throw Object.assign(new Error('Already on a break'), { status: 409 });

    const policy = await this._getPolicy(employeeId);

    // ── Enforce the DEPARTMENT's break window (every employee must follow their department schedule) ──
    if (!policy || !policy.breakStart || !policy.breakEnd) {
      throw Object.assign(
        new Error('You cannot take a break because no department break schedule is assigned to you. Every employee must follow their assigned department break time.'),
        { status: 400 }
      );
    }

    const now = await getCurrentServerTime();
    const timezone = record.session?.office?.timezone || 'Africa/Lagos';
    const local = zonedParts(now, timezone);
    const nowMin = local.hour * 60 + local.minute;
    const startMin = toMin(policy.breakStart);
    const endMin = toMin(policy.breakEnd);
    const deptName = policy.department?.name || policy.policyName || 'Department';

    if (nowMin < startMin) {
      throw Object.assign(
        new Error(`Cannot start break before your break time. ${deptName} break time is strictly between ${policy.breakStart} and ${policy.breakEnd}.`),
        { status: 400 }
      );
    }

    if (nowMin >= endMin) {
      throw Object.assign(
        new Error(`Cannot start break after your break time. ${deptName} break was between ${policy.breakStart} and ${policy.breakEnd} and has already ended for today.`),
        { status: 400 }
      );
    }

    const serverNow = now;
    const sessionBreaks = await prisma.breakRecord.findMany({
      where: { attendanceRecordId: record.id },
      orderBy: { startTime: 'asc' },
    });
    if (sessionBreaks.length > 0) {
      throw Object.assign(new Error('Only one break is allowed per employee during this attendance session. A new break is available when the next session begins.'), { status: 400 });
    }
    const check = await this.checkBreakPolicy(employeeId, policy, sessionBreaks, breakType);
    if (!check.allowed) throw Object.assign(new Error(check.reason), { status: 400 });

    return prisma.breakRecord.create({
      data: { id: uuidv4(), attendanceRecordId: record.id, employeeId, breakType, startTime: serverNow, notes, startedByAdmin },
    });
  }

  async startBreakForEmployee(employeeId, breakType, notes = null) {
    return this.startBreak(employeeId, breakType, notes, true);
  }

  async endBreak(employeeId, breakId, ctx = {}) {
    const breakRecord = await prisma.breakRecord.findFirst({
      where: { id: breakId, employeeId, endTime: null },
      include: {
        attendanceRecord: {
          select: {
            sessionId: true,
            session: {
              select: {
                office: {
                  select: { wifiSSID: true, timezone: true, overstayPenalty: true, breakMinutes: true },
                },
              },
            },
          },
        },
      },
    });
    if (!breakRecord) throw Object.assign(new Error('Break not found or already ended'), { status: 404 });
    if (breakRecord.startedByAdmin && !ctx.admin) {
      throw Object.assign(new Error('This break was started by an admin. Only an admin can end it.'), { status: 403 });
    }

    const endTime = await getCurrentServerTime();
    const durationMinutes = Math.floor((endTime - breakRecord.startTime) / 60000);

    const policy = await this._getPolicy(employeeId);
    const office = breakRecord.attendanceRecord?.session?.office;
    const timezone = office?.timezone || 'Africa/Lagos';
    const penalty = this._overstayPenalty(breakRecord.startTime, endTime, policy, timezone, office);
    const changed = await prisma.breakRecord.updateMany({
      where: { id: breakId, employeeId, endTime: null },
      data: { endTime, durationMinutes, penalty },
    });
    if (!changed.count) throw Object.assign(new Error('Break is already ended'), { status: 409 });
    const updated = await prisma.breakRecord.findUnique({ where: { id: breakId } });
    await prisma.attendanceRecord.update({
      where: { id: breakRecord.attendanceRecordId },
      data: { totalBreakMinutes: { increment: durationMinutes } },
    });

    // The employee is "back" only if they are on the company Wi-Fi. If they end a
    // break while off the office Wi-Fi, raise a fraud alert (they are not actually back).
    const officeWifi = office?.wifiSSID;
    if (officeWifi && ctx.wifiSSID && ctx.wifiSSID !== officeWifi) {
      await this._raiseFraud(employeeId, breakRecord.attendanceRecord?.sessionId, 'BREAK_OFF_WIFI',
        `Ended break while connected to "${ctx.wifiSSID}", not the office Wi-Fi "${officeWifi}".`,
        { durationMinutes, gotWifi: ctx.wifiSSID, expectedWifi: officeWifi });
    }

    if (penalty > 0) {
      await this._raiseFraud(employeeId, breakRecord.attendanceRecord?.sessionId, 'OVERSTAYED_BREAK',
        `Overstayed break (${durationMinutes} min). An automatic penalty of ₦${penalty.toLocaleString()} was applied.`,
        { durationMinutes, penalty, limitMinutes: policy?.totalDailyBreakLimit || office?.breakMinutes || 60 });
    } else if (policy && durationMinutes > policy.totalDailyBreakLimit) {
      await this._raiseFraud(employeeId, breakRecord.attendanceRecord?.sessionId, 'OVERSTAYED_BREAK',
        `Break of ${durationMinutes} min exceeded the daily limit of ${policy.totalDailyBreakLimit} min.`,
        { durationMinutes, limit: policy.totalDailyBreakLimit });
    }

    return updated;
  }

  async getActiveBreak(employeeId) {
    const active = await prisma.breakRecord.findFirst({
      where: { employeeId, endTime: null },
      orderBy: { startTime: 'desc' },
      include: { attendanceRecord: true },
    });
    if (!active) return null;

    const serverNow = await getCurrentServerTime();
    const breakDateStr = new Date(active.startTime).toISOString().slice(0, 10);
    const todayDateStr = serverNow.toISOString().slice(0, 10);
    const isPast = breakDateStr < todayDateStr || !!active.attendanceRecord?.clockOutTime;

    if (isPast) {
      const end = active.attendanceRecord?.clockOutTime || new Date(new Date(active.startTime).getTime() + 60 * 60000);
      const durationMinutes = Math.max(1, Math.floor((end - active.startTime) / 60000));
      await prisma.breakRecord.update({
        where: { id: active.id },
        data: { endTime: end, durationMinutes, isAutoEnded: true, notes: 'Auto-ended past break' },
      });
      return null;
    }

    return active;
  }

  async getDailyBreaks(employeeId, date) {
    const employee = await prisma.user.findUnique({
      where: { id: employeeId }, select: { organization: { select: { timezone: true } } },
    });
    const bounds = dayBounds(date ? new Date(date) : new Date(), employee?.organization?.timezone || 'Africa/Lagos');
    const records = await prisma.breakRecord.findMany({
      where: { employeeId, startTime: { gte: bounds.start, lt: bounds.end } },
      orderBy: { startTime: 'asc' },
    });
    return this.withLifecycleStatus(records);
  }

  async checkBreakPolicy(employeeId, policy, todayBreaks, breakType) {
    if (!policy) return { allowed: true };
    const shortBreaks = todayBreaks.filter((b) => b.breakType === 'SHORT_BREAK' && b.endTime);
    const lunchBreaks = todayBreaks.filter((b) => b.breakType === 'LUNCH' && b.endTime);
    const totalUsed = todayBreaks.reduce((sum, b) => sum + (b.durationMinutes || 0), 0);

    if (breakType === 'LUNCH' && lunchBreaks.length >= 1) return { allowed: false, reason: 'Lunch break already taken today' };
    if (breakType === 'SHORT_BREAK' && shortBreaks.length >= policy.maxShortBreaks) return { allowed: false, reason: `Max ${policy.maxShortBreaks} short breaks per day` };
    if (totalUsed >= policy.totalDailyBreakLimit) return { allowed: false, reason: `Daily break limit of ${policy.totalDailyBreakLimit} minutes reached` };
    return { allowed: true };
  }

  // Only auto-ends past / orphaned breaks from previous days or when an employee has already clocked out.
  // Active breaks during the work day are NEVER auto-ended; they continue until the employee ends the break.
  async autoEndOverdueBreaks() {
    const now = await getCurrentServerTime();
    const openBreaks = await prisma.breakRecord.findMany({
      where: { endTime: null },
      include: {
        employee: { include: { department: { include: { breakPolicy: true } } } },
        attendanceRecord: { include: { session: { include: { office: true } } } },
      },
    });

    let endedCount = 0;
    for (const b of openBreaks) {
      const office = b.attendanceRecord?.session?.office;
      const policy = b.employee?.department?.breakPolicy;
      const timezone = office?.timezone || 'Africa/Lagos';

      const breakDateStr = new Date(b.startTime).toISOString().slice(0, 10);
      const todayDateStr = now.toISOString().slice(0, 10);
      // Only close if it belongs to a past day or the employee has already clocked out
      const isPast = breakDateStr < todayDateStr || !!b.attendanceRecord?.clockOutTime;

      if (isPast) {
        const endTime = b.attendanceRecord?.clockOutTime || now;
        const durationMinutes = Math.max(1, Math.floor((endTime - b.startTime) / 60000));
        const penalty = this._overstayPenalty(b.startTime, endTime, policy, timezone, office);

        await prisma.breakRecord.update({
          where: { id: b.id },
          data: { endTime, durationMinutes, isAutoEnded: true, penalty, notes: 'Auto-ended past break after clock-out or day end' },
        });

        if (b.attendanceRecordId) {
          await prisma.attendanceRecord.update({
            where: { id: b.attendanceRecordId },
            data: { totalBreakMinutes: { increment: durationMinutes } },
          }).catch(() => {});
        }

        const maxDurationMin = policy?.totalDailyBreakLimit || office?.breakMinutes || 60;
        if (penalty > 0 && b.attendanceRecord?.sessionId) {
          await this._raiseFraud(b.employeeId, b.attendanceRecord.sessionId, 'OVERSTAYED_BREAK',
            `Past break of ${durationMinutes} min exceeded limit or window. Auto-ended with penalty of ₦${penalty}.`,
            { durationMinutes, penalty, limit: maxDurationMin });
        }
        endedCount++;
      }
    }
    return endedCount;
  }

  async _raiseFraud(employeeId, sessionId, fraudType, description, evidence) {
    try {
      const alert = await prisma.fraudAlert.create({
        data: { id: uuidv4(), employeeId, sessionId, fraudType, severity: 'HIGH', description, evidence, status: 'NEW' },
      });
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN', status: 'ACTIVE', id: { not: employeeId } },
        select: { id: true, orgId: true },
      });
      const emp = await prisma.user.findUnique({ where: { id: employeeId }, select: { orgId: true } });
      for (const a of admins) {
        if (a.orgId === emp?.orgId) await NotificationService.notifyAdmin(a.id, `Fraud alert: ${description}`).catch(() => {});
      }
      return alert;
    } catch (err) {
      logger.warn('Could not raise break fraud alert:', err.message);
      return null;
    }
  }

  async _getPolicy(employeeId) {
    const user = await prisma.user.findUnique({
      where: { id: employeeId },
      include: {
        department: { include: { breakPolicy: true } },
        organization: { include: { offices: true } },
      },
    });
    if (user?.department?.breakPolicy) {
      return {
        ...user.department.breakPolicy,
        department: user.department,
      };
    }
    const office = user?.organization?.offices?.[0];
    if (office && office.breakStart && office.breakEnd) {
      return {
        breakStart: office.breakStart,
        breakEnd: office.breakEnd,
        totalDailyBreakLimit: office.breakMinutes || 60,
        maxLunchMinutes: office.breakMinutes || 60,
        maxShortBreaks: 2,
        maxShortBreakMinutes: 15,
        overstayPenalty: office.overstayPenalty || 0,
        department: null,
      };
    }
    return null;
  }
}

module.exports = new BreakService();
