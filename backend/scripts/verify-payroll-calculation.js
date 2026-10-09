const assert = require('assert');
const { calculatePayroll } = require('../src/services/PayrollCalculationEngine');

const input = {
  employeeId: 'employee-1',
  year: 2026,
  month: 10,
  periodStart: new Date('2026-10-01T00:00:00.000Z'),
  periodEnd: new Date('2026-10-31T00:00:00.000Z'),
  currency: 'NGN',
  baseSalary: 100000,
  attendanceRecords: [
    {
      id: 'attendance-1', date: new Date('2026-10-07T00:00:00.000Z'), status: 'PRESENT',
      clockInTime: new Date('2026-10-07T08:00:00.000Z'), totalWorkHours: 8, penalty: 0,
      overtimeMinutes: 60, overtimeEarnings: 1250, overtimeRuleVersion: 'office-overtime-v1',
      overtimeDetails: { feePerOvertimeHour: 1250, startAfterCloseMinutes: 30 },
    },
    {
      id: 'attendance-2', date: new Date('2026-10-08T00:00:00.000Z'), status: 'LATE',
      clockInTime: new Date('2026-10-08T08:20:00.000Z'), totalWorkHours: 7.5, penalty: 200,
      overtimeMinutes: 0, overtimeEarnings: 0,
    },
  ],
  breakRecords: [{ id: 'break-1', startTime: new Date('2026-10-07T12:00:00.000Z'), breakType: 'LUNCH', penalty: 500 }],
  manualPenalties: [{ id: 'penalty-1', createdAt: new Date('2026-10-09T00:00:00.000Z'), amount: 50, reason: 'Manual adjustment' }],
};

const result = calculatePayroll(input);
assert.equal(result.baseSalary, 100000);
assert.equal(result.overtimeEarnings, 1250);
assert.equal(result.grossSalary, 101250);
assert.equal(result.attendancePenalties, 200);
assert.equal(result.breakPenalties, 500);
assert.equal(result.manualPenalties, 50);
assert.equal(result.totalDeductions, 750);
assert.equal(result.netSalary, 100500);
assert.equal(result.totalWorkHours, 15.5);
assert.equal(result.totalPresentDays, 2);
assert.equal(result.totalLateDays, 1);
assert.equal(result.lineItems.find((item) => item.type === 'OVERTIME').sourceId, 'attendance-1');
assert.equal(result.lineItems.find((item) => item.type === 'OVERTIME').ratePerHour, 1250);
assert.equal(result.lineItems.find((item) => item.type === 'OVERTIME').calculation.startAfterCloseMinutes, 30);
assert.deepEqual(result.snapshot.inputReferences.attendanceRecordIds, ['attendance-1', 'attendance-2']);
assert.equal(calculatePayroll(input).calculationHash, result.calculationHash);
assert.notEqual(calculatePayroll({ ...input, baseSalary: 100001 }).calculationHash, result.calculationHash);

console.log('PASS deterministic payroll totals, source references, and calculation hash');
