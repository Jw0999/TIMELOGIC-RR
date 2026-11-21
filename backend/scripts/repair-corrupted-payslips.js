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
      const isEmmanuel = p.employee?.employeeCode === 'EMP014';

      // Fix Emmanuel's December payslip specifically
      if (isEmmanuel && p.year === 2026 && p.month === 12) {
        const summary = p.calculationSnapshot?.summary || {};
        const needsRepair = Number(summary.carryoverEarnings || 0) > 0 || Number(p.grossSalary || 0) > 60000 || Number(p.totalDeductions || 0) < 2000;

        if (needsRepair) {
          // Fetch November payslip to get prior month penalties & overtime
          const novPayslip = await prisma.payslipRecord.findFirst({
            where: {
              employeeId: p.employeeId,
              year: 2026,
              month: 11,
            },
          });

          const novLineItems = Array.isArray(novPayslip?.breakdownJson) ? novPayslip.breakdownJson : [];
          const priorPenalties = novLineItems.filter((i) => i.category === 'DEDUCTION' || (i.type && i.type.includes('PENALTY')));
          const priorOvertime = novLineItems.filter((i) => i.type === 'OVERTIME');

          const baseSalary = 50000;
          const overtimeEarnings = priorOvertime.reduce((sum, item) => sum + Number(item.amount || 0), 0); // 85

          const decLines = Array.isArray(p.breakdownJson)
            ? p.breakdownJson.filter((i) => i.type !== 'PRIOR_MONTH_CARRYOVER' && i.type !== 'BASE_SALARY' && !String(i.id).startsWith('prior-'))
            : [];

          const formattedPriorPenalties = priorPenalties.map((item) => ({
            ...item,
            id: String(item.id).startsWith('prior-') ? item.id : `prior-${item.id}`,
            subDetail: item.subDetail ? `${item.subDetail} · Rolled over from prior month` : 'Rolled over from prior month',
          }));

          const allDeductions = [...decLines.filter((i) => i.category === 'DEDUCTION'), ...formattedPriorPenalties];
          const attendancePenalties = allDeductions.filter((i) => i.type === 'ATTENDANCE_PENALTY').reduce((sum, item) => sum + Number(item.amount || 0), 0); // 1500 + 1000 = 2500
          const breakPenalties = allDeductions.filter((i) => i.type === 'BREAK_PENALTY').reduce((sum, item) => sum + Number(item.amount || 0), 0); // 300
          const manualPenalties = allDeductions.filter((i) => i.type === 'MANUAL_PENALTY').reduce((sum, item) => sum + Number(item.amount || 0), 0); // 0
          const totalDeductions = attendancePenalties + breakPenalties + manualPenalties; // 2800

          const grossSalary = baseSalary + overtimeEarnings; // 50085
          const netSalary = Math.max(0, grossSalary - totalDeductions); // 47285

          const cleanLineItems = [
            {
              id: `base-salary:${p.employeeId}`,
              type: 'BASE_SALARY',
              category: 'EARNING',
              amount: baseSalary,
              currency: p.currency || 'NGN',
              description: 'Monthly base salary',
              sourceType: 'Employee',
              sourceId: p.employeeId,
            },
            ...priorOvertime.map((item) => ({
              ...item,
              id: String(item.id).startsWith('prior-') ? item.id : `prior-${item.id}`,
              subDetail: item.subDetail ? `${item.subDetail} · Rolled over from prior month` : 'Rolled over from prior month',
            })),
            ...allDeductions,
          ];

          const cleanSnapshot = {
            ...(p.calculationSnapshot || {}),
            summary: {
              ...(p.calculationSnapshot?.summary || {}),
              baseSalary,
              grossSalary,
              overtimeEarnings,
              carryoverEarnings: 0,
              attendancePenalties,
              breakPenalties,
              manualPenalties,
              totalDeductions,
              netSalary,
              deferredAmount: 0,
              isNewHire: false,
              payoutEligible: true,
              cycleNote: null,
            },
            lineItems: cleanLineItems,
          };

          await prisma.payslipRecord.update({
            where: { id: p.id },
            data: {
              baseSalary,
              grossSalary,
              overtimeEarnings,
              attendancePenalties,
              breakPenalties,
              manualPenalties,
              totalDeductions,
              netSalary,
              breakdownJson: cleanLineItems,
              calculationSnapshot: cleanSnapshot,
              status: 'GENERATED',
            },
          });

          if (novPayslip) {
            await prisma.payslipRecord.update({
              where: { id: novPayslip.id },
              data: {
                status: 'RESOLVED_ROLLED_OVER',
                calculationSnapshot: {
                  ...(novPayslip.calculationSnapshot || {}),
                  summary: {
                    ...(novPayslip.calculationSnapshot?.summary || {}),
                    resolvedInCycle: '2026-12',
                    deferredAmount: 0,
                  },
                },
              },
            });
            console.log(`[repair-corrupted-payslips] Succeeded marking November payslip ${novPayslip.id} as RESOLVED_ROLLED_OVER with resolvedInCycle=2026-12`);
          }

          console.log(`[repair-corrupted-payslips] Repaired Emmanuel Adewoye (EMP014) December payslip: base=${baseSalary}, gross=${grossSalary}, deductions=${totalDeductions}, net=${netSalary}, status=GENERATED`);
          repairedCount += 1;
        }
        continue;
      }

      if (isEmmanuel) {
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
