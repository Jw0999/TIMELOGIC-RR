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
    if (overtimeEarnings > 0 || overtimeMinutes > 0) {
      earnings.push({
        id: `overtime:${record.id}`,
        type: 'OVERTIME',
        category: 'EARNING',
        amount: overtimeEarnings,
        currency,
        date: workDate(record.date),
        minutes: overtimeMinutes,
        ratePerHour: amount(record.overtimeDetails?.feePerOvertimeHour),
        ruleVersion: record.overtimeRuleVersion || 'office-overtime-v1',
        calculation: record.overtimeDetails || null,
        description: `${Math.round((overtimeMinutes / 60) * 10) / 10}h (${overtimeMinutes} min) overstay after closing`,
        sourceType: 'AttendanceRecord',
        sourceId: record.id,
      });
    }

    const attendancePenalty = money(record.penalty);
    if (attendancePenalty > 0) {
      deductions.push({
        id: `attendance-penalty:${record.id}`,
        type: 'ATTENDANCE_PENALTY',
        category: 'DEDUCTION',
        amount: attendancePenalty,
        currency,
        date: workDate(record.date),
        description: record.status === 'COMPLETELY_LATE' ? 'Completely late attendance penalty' : 'Attendance penalty',
        sourceType: 'AttendanceRecord',
        sourceId: record.id,
      });
    }
  }

  for (const record of breaks) {
    const penalty = money(record.penalty);
    if (penalty <= 0) continue;
    deductions.push({
      id: `break-penalty:${record.id}`,
      type: 'BREAK_PENALTY',
      category: 'DEDUCTION',
      amount: penalty,
      currency,
      date: workDate(record.startTime),
      description: `Break overstay penalty (${record.breakType || 'Break'})`,
      sourceType: 'BreakRecord',
      sourceId: record.id,
    });
  }

  for (const record of penalties) {
    const penalty = money(record.amount);
    if (penalty <= 0) continue;
    deductions.push({
      id: `manual-penalty:${record.id}`,
      type: 'MANUAL_PENALTY',
      category: 'DEDUCTION',
      amount: penalty,
      currency,
      date: workDate(record.createdAt),
      description: record.reason || 'HR administrative penalty',
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
