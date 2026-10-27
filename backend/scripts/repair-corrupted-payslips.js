const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('[repair-corrupted-payslips] Checking for mistakenly deferred or rolled-over payslip records...');

  try {
    // Find all payslip records that might have been affected by previous carryover logic
    const payslips = await prisma.payslipRecord.findMany({
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            createdAt: true,
            orgId: true,
          },
        },
      },
    });

    let repairedCount = 0;

    for (const p of payslips) {
      const isNewHireEmmanuel = p.employee?.employeeCode === 'EMP014';
      if (isNewHireEmmanuel) {
        // Emmanuel is the actual new hire, keep his initial 31-day cycle preservation intact
        continue;
      }

      const hasDeferredStatus = p.status === 'DEFERRED_31_DAYS';
      const summary = p.calculationSnapshot?.summary || {};
      const hasBogusCarryover = Number(summary.carryoverEarnings || 0) > 0;
      const hasBogusNewHireFlag = summary.isNewHire === true;
      const hasCarryoverLine = Array.isArray(p.breakdownJson) && p.breakdownJson.some((i) => i.type === 'PRIOR_MONTH_CARRYOVER');

      if (hasDeferredStatus || hasBogusCarryover || hasBogusNewHireFlag || hasCarryoverLine) {
        const baseSalary = Number(p.baseSalary || 0);
        const overtime = Number(p.overtimeEarnings || 0);
        const totalDeductions = Number(p.totalDeductions || 0);
        const cleanGross = baseSalary + overtime;
        const cleanNet = Math.max(0, cleanGross - totalDeductions);

        const cleanLineItems = Array.isArray(p.breakdownJson)
          ? p.breakdownJson.filter((i) => i.type !== 'PRIOR_MONTH_CARRYOVER')
          : [];

        const cleanSnapshot = p.calculationSnapshot ? {
          ...p.calculationSnapshot,
          summary: {
            ...p.calculationSnapshot.summary,
            grossSalary: cleanGross,
            netSalary: cleanNet,
            carryoverEarnings: 0,
            deferredAmount: 0,
            isNewHire: false,
            payoutEligible: true,
            cycleNote: null,
          },
          lineItems: cleanLineItems,
        } : null;

        await prisma.payslipRecord.update({
          where: { id: p.id },
          data: {
            status: hasDeferredStatus ? 'GENERATED' : p.status,
            grossSalary: cleanGross,
            netSalary: cleanNet,
            breakdownJson: cleanLineItems,
            calculationSnapshot: cleanSnapshot,
          },
        });

        console.log(`[repair-corrupted-payslips] Repaired payslip ${p.id} for ${p.employee?.firstName} ${p.employee?.lastName} (${p.employee?.employeeCode}) [${p.year}-${p.month}]: gross=${cleanGross}, net=${cleanNet}, status=${hasDeferredStatus ? 'GENERATED' : p.status}`);
        repairedCount += 1;
      }
    }

    console.log(`[repair-corrupted-payslips] Completed. Successfully repaired ${repairedCount} record(s).`);
  } catch (err) {
    console.error('[repair-corrupted-payslips] Error during repair:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('[repair-corrupted-payslips] Unhandled rejection:', err);
  process.exit(0); // Do not crash startup
});
