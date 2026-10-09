const { atZonedTime, safeTimeZone, zonedParts, dateKey, dateOnly } = require('./attendanceClock');

const DEFAULT_SHIFT_SCHEDULES = {
  FULL_TIME: {
    key: 'FULL_TIME',
    name: 'Full Time',
    openTime: '08:00',
    closeTime: '17:00',
    isOvernight: false,
    cutoffTime: '00:00',
  },
  MORNING: {
    key: 'MORNING',
    name: 'Morning Shift',
    openTime: '07:00',
    closeTime: '14:00',
    isOvernight: false,
    cutoffTime: '00:00',
  },
  AFTERNOON: {
    key: 'AFTERNOON',
    name: 'Afternoon Shift',
    openTime: '12:00',
    closeTime: '19:00',
    isOvernight: false,
    cutoffTime: '00:00',
  },
  EVENING: {
    key: 'EVENING',
    name: 'Evening Shift',
    openTime: '14:00',
    closeTime: '22:00',
    isOvernight: false,
    cutoffTime: '00:00',
  },
  NIGHT: {
    key: 'NIGHT',
    name: 'Night Shift',
    openTime: '21:00',
    closeTime: '05:00',
    isOvernight: true,
    maxHours: 14,
  },
  FLEXIBLE: {
    key: 'FLEXIBLE',
    name: 'Flexible Shift',
    openTime: '08:00',
    closeTime: '17:00',
    isOvernight: false,
    cutoffTime: '00:00',
  },
};

/**
 * Returns whether a shift configuration is an overnight shift (spans midnight).
 */
function isShiftOvernight(shiftConfig) {
  if (!shiftConfig) return false;
  if (shiftConfig.isOvernight === true) return true;
  if (typeof shiftConfig.openTime === 'string' && typeof shiftConfig.closeTime === 'string') {
    const [openH, openM] = shiftConfig.openTime.split(':').map(Number);
    const [closeH, closeM] = shiftConfig.closeTime.split(':').map(Number);
    if (!Number.isNaN(openH) && !Number.isNaN(closeH)) {
      return (closeH * 60 + closeM) <= (openH * 60 + openM);
    }
  }
  return false;
}

/**
 * Resolves the active shift schedule for an employee, taking into account
 * office-level or org-level overrides and falling back to default standards.
 */
function resolveShiftSchedule(officeOrOrg = {}, shiftType = 'FULL_TIME') {
  const normalizedKey = (shiftType || 'FULL_TIME').toUpperCase();
  const orgSchedules = officeOrOrg?.shiftSchedules ||
    officeOrOrg?.organization?.shiftSchedules ||
    officeOrOrg?.office?.shiftSchedules;

  let configured = null;
  if (orgSchedules && typeof orgSchedules === 'object') {
    configured = orgSchedules[normalizedKey];
  }

  const fallback = DEFAULT_SHIFT_SCHEDULES[normalizedKey] || DEFAULT_SHIFT_SCHEDULES.FULL_TIME;
  if (!configured) {
    return { ...fallback };
  }

  const openTime = configured.openTime || configured.open || fallback.openTime;
  const closeTime = configured.closeTime || configured.close || fallback.closeTime;
  const isOvernight = configured.isOvernight !== undefined
    ? Boolean(configured.isOvernight)
    : isShiftOvernight({ openTime, closeTime });

  return {
    key: normalizedKey,
    name: configured.name || fallback.name,
    openTime,
    closeTime,
    isOvernight,
    cutoffTime: configured.cutoffTime || fallback.cutoffTime || '00:00',
    maxHours: Number(configured.maxHours) || fallback.maxHours || 14,
  };
}

/**
 * Calculates the exact scheduled shift closing instant (Date in UTC)
 * for an attendance record based on its clockInTime or session startTime.
 */
function getShiftClosingInstant(record, shiftSchedule, timezone = 'Africa/Lagos') {
  const tz = safeTimeZone(timezone);
  const referenceTime = record.clockInTime || record.session?.startTime || new Date();
  const closeTime = shiftSchedule.closeTime || '17:00';
  const openTime = shiftSchedule.openTime || '08:00';

  let closeAt = atZonedTime(referenceTime, closeTime, tz);
  const isOvernight = shiftSchedule.isOvernight || isShiftOvernight({ openTime, closeTime });

  if (isOvernight) {
    const [openH, openM] = openTime.split(':').map(Number);
    const refLocal = zonedParts(referenceTime, tz);
    const refMins = refLocal.hour * 60 + refLocal.minute;
    const openMins = openH * 60 + openM;

    // If clocked in during evening/night (e.g. >= openMins), close time is the NEXT calendar day
    if (refMins >= openMins - 60) {
      closeAt = atZonedTime(referenceTime, closeTime, tz, 1);
    }
  } else {
    // For day shifts, if closeAt is earlier than clockInTime on the same day due to late arrival,
    // closeAt is still the same day's close time.
    if (!closeAt) {
      closeAt = atZonedTime(referenceTime, closeTime, tz);
    }
  }

  return closeAt;
}

/**
 * Determines if an open record should be auto-checked out at this instant.
 *
 * Rules:
 * 1. Day workers (Full-Time / Morning / Afternoon / Evening non-overnight):
 *    - If local time has passed midnight (00:00) of the record's work date
 *      (or the organization's dayShiftCutoffTime), auto-check out!
 * 2. Overnight workers (Night / shifts spanning past 00:00):
 *    - MUST NOT be checked out at 00:00.
 *    - Only auto-check out after their shift closing instant AND
 *      either max hours (default 14h) exceeded or next morning cutoff reached.
 */
function evaluateAutoCheckout(record, now = new Date(), timezone = 'Africa/Lagos') {
  const tz = safeTimeZone(timezone);
  const clockInTime = record.clockInTime;
  if (!clockInTime) return { shouldAutoCheckout: false };

  const shiftType = record.shiftTypeSnapshot ||
    record.employee?.shiftType ||
    'FULL_TIME';

  const office = record.session?.office || {};
  const org = record.employee?.organization || office.organization || {};
  const shiftSchedule = resolveShiftSchedule({ ...org, ...office }, shiftType);

  const localNow = zonedParts(now, tz);
  const localClockIn = zonedParts(clockInTime, tz);

  // If clock in was on an earlier calendar day (or 00:00 reached)
  const isOvernight = isShiftOvernight(shiftSchedule);

  if (!isOvernight) {
    // DAY SHIFT:
    // Office configured day cutoff time or default 00:00 midnight
    const cutoffTime = office.dayShiftCutoffTime ||
      org.autoCheckoutPolicy?.dayShiftCutoffTime ||
      shiftSchedule.cutoffTime ||
      '00:00';

    // Midnight instant for the clock-in date
    const midnightAfterClockIn = atZonedTime(clockInTime, '00:00', tz, 1);
    const configuredCutoffInstant = cutoffTime === '00:00'
      ? midnightAfterClockIn
      : atZonedTime(clockInTime, cutoffTime, tz, 0);

    // If now is >= cutoff or >= midnight after clock in
    const isPastCutoff = (cutoffTime !== '00:00' && configuredCutoffInstant && now >= configuredCutoffInstant);
    const isPastMidnight = midnightAfterClockIn && now >= midnightAfterClockIn;

    if (isPastMidnight || isPastCutoff) {
      return {
        shouldAutoCheckout: true,
        reason: isPastMidnight ? 'MIDNIGHT_DAY_SHIFT_SWEEP' : 'ORGANIZATION_CUTOFF_AUTO_CHECKOUT',
        shiftType: shiftSchedule.key,
        effectiveCheckoutTime: midnightAfterClockIn || now,
      };
    }

    return { shouldAutoCheckout: false };
  }

  // OVERNIGHT SHIFT:
  // Must NOT auto-checkout at 00:00! Let the employee continue working.
  const scheduledClose = getShiftClosingInstant(record, shiftSchedule, tz);
  const maxHours = Number(office.nightShiftMaxHours) ||
    Number(org.autoCheckoutPolicy?.nightShiftMaxHours) ||
    shiftSchedule.maxHours ||
    14;

  const hoursWorked = (now.getTime() - clockInTime.getTime()) / 3600000;

  // Auto-checkout overnight worker only if they passed scheduled close AND exceeded max hours
  if (scheduledClose && now > scheduledClose && hoursWorked >= maxHours) {
    return {
      shouldAutoCheckout: true,
      reason: 'OVERNIGHT_SHIFT_MAX_HOURS_EXCEEDED',
      shiftType: shiftSchedule.key,
      effectiveCheckoutTime: scheduledClose,
    };
  }

  return { shouldAutoCheckout: false };
}

module.exports = {
  DEFAULT_SHIFT_SCHEDULES,
  isShiftOvernight,
  resolveShiftSchedule,
  getShiftClosingInstant,
  evaluateAutoCheckout,
};
