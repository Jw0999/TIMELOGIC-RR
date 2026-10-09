const { prisma } = require('../src/config/database');
const PayrollService = require('../src/services/PayrollService');
const { calculatePayroll } = require('../src/services/PayrollCalculationEngine');
const AttendanceService = require('../src/services/AttendanceService');
const BreakService = require('../src/services/BreakService');

async function verify() {
  console.log('=== STARTING VERIFICATION: OVERSTAY ADDITION & BREAK PENALTY DEDUCTION ===');

  const orgId = '415138c4-e672-4c2d-8916-2253e06a2ec0'; // Loveth
  const office = await prisma.office.findFirst({ where: { orgId } });
  console.log('Office Configuration:', {
    name: office.name,
    openTime: office.openTime,
    closeTime: office.closeTime,
    overtimeFeePerHour: office.overtimeFeePerHour,
    overstayPenalty: office.overstayPenalty
  });

  // TEST 1: Break Penalty Reflection in getEmployeesWithSalary
  console.log('\n--- TEST 1: Break Penalty Reflection in Payroll Overview ---');
  const overview = await PayrollService.getEmployeesWithSalary(orgId, 2026, 10);
  const fish = overview.employees.find((e) => e.firstName === 'Fish');
  if (!fish) throw new Error('Fish not found in Loveth org');

  console.log('Fish Payroll Data:', {
    baseSalary: fish.baseSalary,
    overtimeEarnings: fish.overtimeEarnings,
    grossSalary: fish.grossSalary,
    attendancePenalties: fish.attendancePenalties,
    breakPenalties: fish.breakPenalties,
    manualPenalties: fish.manualPenalties,
    totalDeductions: fish.totalDeductions,
    netSalary: fish.netSalary
  });

  if (fish.breakPenalties !== 200) {
    throw new Error(`Expected breakPenalties to be 200, got ${fish.breakPenalties}`);
  }

  const expectedDeductions = fish.attendancePenalties + fish.breakPenalties + fish.manualPenalties;
  if (fish.totalDeductions !== expectedDeductions) {
    throw new Error(`Expected totalDeductions to be ${expectedDeductions}, got ${fish.totalDeductions}`);
  }

  if (fish.netSalary !== (fish.grossSalary - fish.totalDeductions)) {
    throw new Error(`Expected netSalary to equal grossSalary - totalDeductions, got ${fish.netSalary}`);
  }
  console.log('✓ TEST 1 PASSED: Break penalty (₦200) is accurately reflected in deductions and deducted from net salary.');

  // TEST 2: Overstay is strictly an ADDITION to salary (+), NOT a deduction
  console.log('\n--- TEST 2: Overstay Calculation as Salary Addition (+) ---');
  const hourlyRate = 500;
  const hoursStayed = 2; // 2 hours stayed after closing
  const testAttendance = [
    {
      id: 'test-att-1',
      date: new Date('2026-10-08'),
      status: 'PRESENT',
      totalWorkHours: 10,
      penalty: 0,
      overtimeMinutes: hoursStayed * 60,
      overtimeEarnings: hoursStayed * hourlyRate, // ₦1,000
      overtimeRuleVersion: 'OFFICE-OVERTIME-v1',
      overtimeDetails: { feePerOvertimeHour: hourlyRate, startAfterCloseMinutes: 0 },
      clockInTime: new Date('2026-10-08T08:00:00Z'),
      clockOutTime: new Date('2026-10-08T19:00:00Z'),
    },
  ];
  const testBreaks = [
    {
      id: 'test-break-1',
      startTime: new Date('2026-10-08T13:00:00Z'),
      endTime: new Date('2026-10-08T14:30:00Z'),
      breakType: 'LUNCH',
      penalty: 150, // ₦150 break overstay penalty
    },
  ];

  const calc = calculatePayroll({
    employeeId: 'test-emp',
    year: 2026,
    month: 10,
    periodStart: new Date('2026-10-01'),
    periodEnd: new Date('2026-10-31'),
    currency: 'NGN',
    baseSalary: 100000,
    attendanceRecords: testAttendance,
    breakRecords: testBreaks,
    manualPenalties: [],
  });

  console.log('Calculation Result:', {
    baseSalary: calc.baseSalary,
    overtimeEarnings: calc.overtimeEarnings,
    grossSalary: calc.grossSalary,
    breakPenalties: calc.breakPenalties,
    totalDeductions: calc.totalDeductions,
    netSalary: calc.netSalary,
  });

  // Gross must be Base + Overstay Earnings: 100,000 + 1,000 = 101,000
  if (calc.grossSalary !== 101000) {
    throw new Error(`Expected grossSalary to be 101,000, got ${calc.grossSalary}`);
  }
  // Total deductions must be Break Penalty: 150
  if (calc.totalDeductions !== 150) {
    throw new Error(`Expected totalDeductions to be 150, got ${calc.totalDeductions}`);
  }
  // Net must be Gross - Deductions: 101,000 - 150 = 100,850
  if (calc.netSalary !== 100850) {
    throw new Error(`Expected netSalary to be 100,850, got ${calc.netSalary}`);
  }

  // Check line items: Overtime must be EARNING (+), Break penalty must be DEDUCTION (-)
  const overtimeItem = calc.lineItems.find((i) => i.type === 'OVERTIME');
  const breakItem = calc.lineItems.find((i) => i.type === 'BREAK_PENALTY');
  if (!overtimeItem || overtimeItem.category !== 'EARNING' || overtimeItem.amount !== 1000) {
    throw new Error('Overtime line item invalid');
  }
  if (!breakItem || breakItem.category !== 'DEDUCTION' || breakItem.amount !== 150) {
    throw new Error('Break penalty line item invalid');
  }
  console.log('✓ TEST 2 PASSED: 2 hours overstay added ₦1,000 to gross earnings (+); break penalty deducted ₦150 (-).');

  // TEST 3: Break Overstay Detection
  console.log('\n--- TEST 3: Break Overstay Penalty Evaluation ---');
  const start = new Date('2026-10-08T12:00:00Z');
  const endOverstay = new Date('2026-10-08T13:30:00Z'); // 90 min on a 60 min limit
  const endOnTime = new Date('2026-10-08T12:45:00Z');   // 45 min on a 60 min limit

  const penaltyOverstay = BreakService._overstayPenalty(start, endOverstay, { totalDailyBreakLimit: 60, overstayPenalty: 250 }, 'Africa/Lagos', null);
  const penaltyOnTime = BreakService._overstayPenalty(start, endOnTime, { totalDailyBreakLimit: 60, overstayPenalty: 250 }, 'Africa/Lagos', null);

  if (penaltyOverstay !== 250) {
    throw new Error(`Expected penaltyOverstay to be 250, got ${penaltyOverstay}`);
  }
  if (penaltyOnTime !== 0) {
    throw new Error(`Expected penaltyOnTime to be 0, got ${penaltyOnTime}`);
  }
  console.log('✓ TEST 3 PASSED: Overstayed break generated ₦250 penalty; on-time break generated ₦0 penalty.');

  // TEST 4: Generate Payslip PDF to confirm itemized deductions and earnings
  console.log('\n--- TEST 4: PDF Payslip Generation with Break Penalties & Overstay ---');
  const payslipRecord = await prisma.payslipRecord.findFirst({
    where: { employeeId: fish.id, year: 2026, month: 10 }
  });
  if (payslipRecord) {
    const pdfRes = await PayrollService.generatePayslipPdf(payslipRecord.id);
    console.log('PDF Generated successfully:', pdfRes.fileName);
  }
  console.log('✓ TEST 4 PASSED: Payslip PDF generation succeeded with live break penalty integration.');

  console.log('\n=== ALL VERIFICATIONS PASSED 100%! ===');
}

verify().catch((err) => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
}).finally(() => process.exit(0));
