const assert = require('assert');
const fs = require('fs');
const { randomUUID } = require('crypto');
const { PrismaClient } = require('@prisma/client');
const PayrollService = require('../src/services/PayrollService');

const prisma = new PrismaClient();
const orgId = randomUUID();
const employeeId = randomUUID();
const sessionId = randomUUID();
const attendanceId = randomUUID();
const year = 2026;
const month = 10;
let generatedPdfPath = null;

async function cleanup() {
  if (generatedPdfPath) fs.rmSync(generatedPdfPath, { force: true });
  await prisma.workEvent.deleteMany({ where: { orgId } });
  await prisma.attendanceEvent.deleteMany({ where: { orgId } });
  await prisma.attendanceSession.deleteMany({ where: { id: sessionId } });
  await prisma.user.deleteMany({ where: { id: employeeId } });
  await prisma.organization.deleteMany({ where: { id: orgId } });
}

async function run() {
  try {
    await prisma.organization.create({ data: { id: orgId, name: 'Temporary Payroll Snapshot Test', salaryCurrency: 'NGN' } });
    await prisma.user.create({
      data: {
        id: employeeId,
        orgId,
        firstName: 'Payroll',
        lastName: 'Test',
        email: `payroll-test-${employeeId}@example.invalid`,
        passwordHash: 'test-only-not-authenticatable',
        role: 'EMPLOYEE',
        baseSalary: 100000,
        salaryCurrency: 'NGN',
      },
    });
    await prisma.attendanceSession.create({
      data: {
        id: sessionId,
        sessionName: 'Payroll Snapshot Test Session',
        startTime: new Date('2026-10-05T08:00:00.000Z'),
        endTime: new Date('2026-10-05T18:00:00.000Z'),
        status: 'ENDED',
      },
    });
    await prisma.attendanceRecord.create({
      data: {
        id: attendanceId,
        employeeId,
        sessionId,
        date: new Date('2026-10-05T00:00:00.000Z'),
        clockInTime: new Date('2026-10-05T08:00:00.000Z'),
        clockOutTime: new Date('2026-10-05T18:00:00.000Z'),
        status: 'PRESENT',
        totalWorkHours: 10,
        overtimeMinutes: 60,
        overtimeEarnings: 1250,
        overtimeRuleVersion: 'office-overtime-v1',
        overtimeDetails: {
          scheduledClose: '2026-10-05T17:00:00.000Z',
          overtimeStartsAt: '2026-10-05T17:00:00.000Z',
          startAfterCloseMinutes: 0,
          feePerOvertimeHour: 1250,
          overtimeMinutes: 60,
          overtimeEarnings: 1250,
          ruleVersion: 'OFFICE-OVERTIME-v1',
        },
      },
    });

    const first = await PayrollService.calculateMonthlyPayroll(orgId, year, month);
    let payslip = await prisma.payslipRecord.findUnique({ where: { employeeId_year_month: { employeeId, year, month } } });
    assert.ok(payslip.calculationSnapshot);
    assert.equal(payslip.grossSalary, 101250);
    assert.equal(payslip.netSalary, 101250);
    assert.equal(payslip.calculationHash, first.payslips[0].calculationHash);
    assert.equal(payslip.breakdownJson.find((item) => item.type === 'OVERTIME').sourceId, attendanceId);
    const originalHash = payslip.calculationHash;
    const pdf = await PayrollService.generatePayslipPdf(payslip.id);
    generatedPdfPath = pdf.filePath;
    payslip = await prisma.payslipRecord.findUnique({ where: { id: payslip.id } });
    assert.equal(payslip.calculationHash, originalHash);

    await prisma.attendanceRecord.update({ where: { id: attendanceId }, data: { penalty: 100 } });
    await PayrollService.calculateMonthlyPayroll(orgId, year, month);
    payslip = await prisma.payslipRecord.findUnique({ where: { employeeId_year_month: { employeeId, year, month } } });
    assert.equal(payslip.netSalary, 101150);
    assert.notEqual(payslip.calculationHash, originalHash);

    const sentHash = payslip.calculationHash;
    await prisma.payslipRecord.update({ where: { id: payslip.id }, data: { status: 'SENT' } });
    await prisma.attendanceRecord.update({ where: { id: attendanceId }, data: { penalty: 900 } });
    assert.equal((await PayrollService.sendPayslipEmail(payslip.id)).status, 'SKIPPED');
    await PayrollService.calculateMonthlyPayroll(orgId, year, month);
    payslip = await prisma.payslipRecord.findUnique({ where: { id: payslip.id } });
    assert.equal(payslip.status, 'SENT');
    assert.equal(payslip.calculationHash, sentHash);
    assert.equal(payslip.netSalary, 101150);

    console.log('PASS persisted gross, line-item source trace, recalculation hash, and SENT snapshot lock');
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
