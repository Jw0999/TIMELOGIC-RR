const { createHash } = require('crypto');

const CALCULATION_VERSION = 'payroll-calculation-v1';

function amount(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value) {
  return Math.round((amount(value) + Number.EPSILON) * 100) / 100;
}

function workDate(value) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
}

function formatTime(date, timeZone = 'Africa/Lagos') {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone || 'Africa/Lagos',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return '';
  }
}

function formatDate(date, timeZone = 'Africa/Lagos') {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: timeZone || 'Africa/Lagos',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return d.toISOString().split('T')[0];
  }
}

function formatTimeFromHhmm(hhmm) {
  if (!hhmm || typeof hhmm !== 'string') return '';
  const match = hhmm.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return hhmm;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function calculatePayroll({
  employeeId,
  year,
  month,
  periodStart,
  periodEnd,
  currency = 'NGN',
  baseSalary = 0,
  attendanceRecords = [],
  breakRecords = [],
  manualPenalties = [],
  timezone = 'Africa/Lagos',
  officeOpenTime = '08:00',
  officeCloseTime = '17:00',
  weeklySchedule = null,
}) {
  const attendance = [...attendanceRecords].sort((left, right) => String(left.id).localeCompare(String(right.id)));
  const breaks = [...breakRecords].sort((left, right) => String(left.id).localeCompare(String(right.id)));
  const penalties = [...manualPenalties].sort((left, right) => String(left.id).localeCompare(String(right.id)));
  const earnings = [];
  const deductions = [];
  const salary = money(baseSalary);

  earnings.push({
    id: `base-salary:${employeeId}`,
    type: 'BASE_SALARY',
    category: 'EARNING',
    amount: salary,
    currency,
    description: 'Monthly base salary',
    sourceType: 'Employee',
    sourceId: employeeId,
  });

  const attendedRecords = attendance.filter((record) => Boolean(record.clockInTime)
    || ['PRESENT', 'LATE', 'COMPLETELY_LATE', 'HALF_DAY', 'REVIEW_REQUIRED'].includes(record.status));
  const totalWorkHours = Math.round(attendance.reduce((total, record) => total + amount(record.totalWorkHours), 0) * 100) / 100;
  const totalPresentDays = attendedRecords.filter((record) => record.status !== 'ABSENT').length;
  const totalLateDays = attendance.filter((record) => record.status === 'LATE' || record.status === 'COMPLETELY_LATE').length;

  for (const record of attendance) {
    const overtimeEarnings = money(record.overtimeEarnings);
    const overtimeMinutes = Math.max(0, Math.trunc(amount(record.overtimeMinutes)));
    const clockOutStr = record.clockOutTime ? formatTime(record.clockOutTime, timezone) : '';
    const dateFormatted = formatDate(record.date, timezone);
    const dateKey = workDate(record.date);

    if (overtimeEarnings > 0 || overtimeMinutes > 0) {
      const overstayDesc = clockOutStr
        ? `Overstay until ${clockOutStr} (${overtimeMinutes} min after closing)`
        : `${Math.round((overtimeMinutes / 60) * 10) / 10}h (${overtimeMinutes} min) overstay after closing`;

      let closeDisplay = '';
      if (record.overtimeDetails?.scheduledClose) {
        closeDisplay = formatTime(record.overtimeDetails.scheduledClose, timezone);
      } else if (weeklySchedule && (record.date || record.clockInTime)) {
        const ref = record.date || record.clockInTime;
        const p = new Date(ref);
        const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][p.getUTCDay()];
        const schedDay = weeklySchedule[dayName] || weeklySchedule[Object.keys(weeklySchedule).find((k) => k.toLowerCase() === dayName)];
        if (schedDay?.closeTime && schedDay.closeTime !== '00:00') {
          closeDisplay = formatTimeFromHhmm(schedDay.closeTime);
        }
      }
      if (!closeDisplay && officeCloseTime && officeCloseTime !== '00:00') {
        closeDisplay = formatTimeFromHhmm(officeCloseTime);
      }

      earnings.push({
        id: `overtime:${record.id}`,
        type: 'OVERTIME',
        category: 'EARNING',
        categoryLabel: 'WORK OVERSTAY',
        amount: overtimeEarnings,
        currency,
        date: dateKey,
        dateFormatted,
        time: clockOutStr,
        timeStr: clockOutStr ? `Departure: ${clockOutStr}` : `${overtimeMinutes} min`,
        minutes: overtimeMinutes,
        ratePerHour: amount(record.overtimeDetails?.feePerOvertimeHour),
        ruleVersion: record.overtimeRuleVersion || 'office-overtime-v1',
        calculation: record.overtimeDetails || null,
        description: overstayDesc,
        subDetail: closeDisplay ? `Closed ${closeDisplay}` : '',
        badgeBg: '#f0fdf4',
        categoryColor: '#059669',
        sourceType: 'AttendanceRecord',
        sourceId: record.id,
      });
    }

    const attendancePenalty = money(record.penalty);
    if (attendancePenalty > 0) {
      const clockInStr = record.clockInTime ? formatTime(record.clockInTime, timezone) : '';
      let catLabel = 'ATTENDANCE';
      let catColor = '#b91c1c';
      let badgeBg = '#fef2f2';
      let desc = '';
      let subDetail = '';

      if (record.status === 'COMPLETELY_LATE') {
        catLabel = 'COMPLETELY LATE';
        catColor = '#991b1b';
        desc = clockInStr ? `Exceeded late threshold (Arrival: ${clockInStr})` : 'Completely late attendance penalty';
        subDetail = (officeOpenTime && officeOpenTime !== '00:00') ? `Expected opening: ${formatTimeFromHhmm(officeOpenTime)}` : '';
      } else if (record.status === 'LATE') {
        catLabel = 'LATE ARRIVAL';
        catColor = '#b91c1c';
        desc = clockInStr ? `Late arrival at ${clockInStr}` : 'Attendance penalty';
        subDetail = (officeOpenTime && officeOpenTime !== '00:00') ? `Shift begins: ${formatTimeFromHhmm(officeOpenTime)}` : '';
      } else if (record.status === 'ABSENT') {
        catLabel = 'ABSENCE';
        catColor = '#c2410c';
        badgeBg = '#fff7ed';
        desc = 'Full-day absence penalty';
        subDetail = 'Unexcused absence';
      } else {
        desc = clockInStr ? `Attendance penalty (Arrival: ${clockInStr})` : 'Attendance penalty';
      }

      deductions.push({
        id: `attendance-penalty:${record.id}`,
        type: 'ATTENDANCE_PENALTY',
        category: 'DEDUCTION',
        categoryLabel: catLabel,
        categoryColor: catColor,
        badgeBg,
        amount: attendancePenalty,
        currency,
        date: dateKey,
        dateFormatted,
        time: clockInStr,
        timeStr: clockInStr || '—',
        status: record.status,
        description: desc,
        subDetail,
        sourceType: 'AttendanceRecord',
        sourceId: record.id,
      });
    }
  }

  for (const record of breaks) {
    const penalty = money(record.penalty);
    if (penalty <= 0) continue;
    const startStr = record.startTime ? formatTime(record.startTime, timezone) : '';
    const endStr = record.endTime ? formatTime(record.endTime, timezone) : (record.isAutoEnded ? 'Auto-ended' : '');
    const timeRange = (startStr && endStr) ? `${startStr} – ${endStr}` : startStr;
    const dateFormatted = formatDate(record.startTime, timezone);
    const dateKey = workDate(record.startTime);
    const durationStr = record.durationMinutes ? `${record.durationMinutes} mins` : '';

    deductions.push({
      id: `break-penalty:${record.id}`,
      type: 'BREAK_PENALTY',
      category: 'DEDUCTION',
      categoryLabel: 'BREAK OVERSTAY',
      categoryColor: '#ea580c',
      badgeBg: '#fff7ed',
      amount: penalty,
      currency,
      date: dateKey,
      dateFormatted,
      time: timeRange,
      timeStr: timeRange || '—',
      description: `Break overstay (${record.breakType || 'Break'}${durationStr ? ` · ${durationStr}` : ''})`,
      subDetail: timeRange ? `Interval: ${timeRange}${record.notes ? ` · ${record.notes}` : ''}` : (record.notes || ''),
      sourceType: 'BreakRecord',
      sourceId: record.id,
    });
  }

  for (const record of penalties) {
    const penalty = money(record.amount);
    if (penalty <= 0) continue;
    const timeStr = record.createdAt ? formatTime(record.createdAt, timezone) : '';
    const dateFormatted = formatDate(record.createdAt, timezone);
    const dateKey = workDate(record.createdAt);

    deductions.push({
      id: `manual-penalty:${record.id}`,
      type: 'MANUAL_PENALTY',
      category: 'DEDUCTION',
      categoryLabel: 'HR PENALTY',
      categoryColor: '#7c3aed',
      badgeBg: '#faf5ff',
      amount: penalty,
      currency,
      date: dateKey,
      dateFormatted,
      time: timeStr,
      timeStr: timeStr || '—',
      description: record.reason || 'HR administrative penalty',
      subDetail: 'Administrative disciplinary deduction',
      sourceType: 'ManualPenalty',
      sourceId: record.id,
    });
  }

  const overtimeEarnings = money(earnings.reduce((total, item) => total + (item.type === 'OVERTIME' ? item.amount : 0), 0));
  const attendancePenalties = money(deductions.reduce((total, item) => total + (item.type === 'ATTENDANCE_PENALTY' ? item.amount : 0), 0));
  const breakPenalties = money(deductions.reduce((total, item) => total + (item.type === 'BREAK_PENALTY' ? item.amount : 0), 0));
  const manualPenaltiesTotal = money(deductions.reduce((total, item) => total + (item.type === 'MANUAL_PENALTY' ? item.amount : 0), 0));
  const grossSalary = money(salary + overtimeEarnings);
  const totalDeductions = money(attendancePenalties + breakPenalties + manualPenaltiesTotal);
  const netSalary = money(Math.max(0, grossSalary - totalDeductions));
  const lineItems = [...earnings, ...deductions];
  const summary = {
    baseSalary: salary,
    overtimeEarnings,
    grossSalary,
    attendancePenalties,
    breakPenalties,
    manualPenalties: manualPenaltiesTotal,
    totalDeductions,
    netSalary,
    totalWorkHours,
    totalPresentDays,
    totalLateDays,
  };
  const snapshot = {
    calculationVersion: CALCULATION_VERSION,
    employeeId,
    period: {
      year,
      month,
      startDate: workDate(periodStart),
      endDate: workDate(periodEnd),
    },
    currency,
    summary,
    lineItems,
    inputReferences: {
      attendanceRecordIds: attendance.map((record) => record.id),
      breakRecordIds: breaks.map((record) => record.id),
      manualPenaltyIds: penalties.map((record) => record.id),
    },
  };
  const calculationHash = createHash('sha256').update(stableStringify(snapshot)).digest('hex');

  return { ...summary, lineItems, snapshot, calculationHash, calculationVersion: CALCULATION_VERSION };
}

module.exports = { calculatePayroll, CALCULATION_VERSION };
