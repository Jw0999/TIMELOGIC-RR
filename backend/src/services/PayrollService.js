const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const { prisma } = require('../config/database');
const logger = require('../config/logger');
const WorkEventService = require('./WorkEventService');
const { calculatePayroll } = require('./PayrollCalculationEngine');
const { officeHoursFor } = require('../utils/attendanceClock');

class PayrollService {
  formatTimeFromHhmm(hhmm) {
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
  /**
   * Format phone number to clean international standard (e.g., Nigerian numbers)
   */
  cleanPhoneNumber(phone) {
    if (!phone) return null;
    let clean = phone.replace(/[^0-9+]/g, '');
    if (clean.startsWith('0')) {
      clean = '234' + clean.slice(1);
    } else if (clean.startsWith('+')) {
      clean = clean.slice(1);
    }
    return clean;
  }

  /**
   * Format currency numbers nicely (e.g., 250,000.00)
   */
  formatMoney(amount, currency = 'NGN') {
    const num = Number(amount || 0);
    const symbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : `${currency} `;
    return `${symbol}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  /**
   * Format currency numbers cleanly for PDFKit to prevent character encoding glitches
   */
  formatMoneyPdf(amount, currency = 'NGN') {
    const num = Number(amount || 0);
    const code = currency || 'NGN';
    return `${code} ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  /**
   * Format start and end dates as a clean human-readable period label
   * e.g. "04 Sep 2026 – 03 Oct 2026"
   */
  formatPeriodLabel(startDate, endDate) {
    if (!startDate || !endDate) return '';
    const s = new Date(startDate);
    const e = new Date(endDate);
    const sStr = s.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
    const eStr = e.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
    return `${sStr} – ${eStr}`;
  }

  /**
   * Format clock/record time cleanly according to organization/office timezone
   * e.g. "09:42 AM"
   */
  formatTime(date, timeZone = 'Africa/Lagos') {
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

  /**
   * Format date cleanly according to organization/office timezone
   * e.g. "05 Oct 2026"
   */
  formatDate(date, timeZone = 'Africa/Lagos') {
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

  /**
   * Get start and end date boundaries for a given year, month, and organization salaryPayoutDay.
   * If payday is D (e.g. 3rd):
   * - Pay cycle ends on target year/month on day D (or last day of month if D > daysInMonth) at 23:59:59.999 UTC.
   * - Pay cycle starts on the day after the previous month's payout day at 00:00:00.000 UTC.
   * Example: For payday = 3, month = October 2026:
   *   endDate = 2026-10-03 23:59:59.999 UTC
   *   startDate = 2026-09-04 00:00:00.000 UTC
   * Example: For payday = 3, month = November 2026:
   *   endDate = 2026-11-03 23:59:59.999 UTC
   *   startDate = 2026-10-04 00:00:00.000 UTC (Penalties reset after the 3rd!)
   */
  getMonthDateRange(year, month, salaryPayoutDay = 28) {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    const day = Math.min(Math.max(1, parseInt(salaryPayoutDay, 10) || 28), 31);

    // Number of days in target month m of year y (0-indexed in JS Date)
    const maxDaysInTargetMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const endDay = Math.min(day, maxDaysInTargetMonth);
    const endDate = new Date(Date.UTC(y, m - 1, endDay, 23, 59, 59, 999));

    // Previous month payout day
    const prevMonthDate = new Date(Date.UTC(y, m - 2, 1));
    const prevY = prevMonthDate.getUTCFullYear();
    const prevM = prevMonthDate.getUTCMonth() + 1; // 1 to 12
    const maxDaysInPrevMonth = new Date(Date.UTC(prevY, prevM, 0)).getUTCDate();
    const prevEndDay = Math.min(day, maxDaysInPrevMonth);

    let startDate;
    if (prevEndDay >= maxDaysInPrevMonth) {
      // Payout in prev month was on the last day, so this cycle begins on 1st of current month
      startDate = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
    } else {
      startDate = new Date(Date.UTC(prevY, prevM - 1, prevEndDay + 1, 0, 0, 0));
    }

    return { startDate, endDate };
  }

  /**
   * Fetch all employees in an organization with their salary info and current month calculations
   */
  async getEmployeesWithSalary(orgId, year, month) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        salaryPayoutDay: true,
        salaryAutomationEnabled: true,
        salaryCurrency: true,
        whatsappProvider: true,
        whatsappPhoneId: true,
        whatsappSenderNumber: true,
      },
    });

    const payoutDay = org?.salaryPayoutDay ?? 28;
    const now = new Date();

    let y = year ? parseInt(year, 10) : null;
    let m = month ? parseInt(month, 10) : null;

    // If year or month not explicitly requested, determine current active cycle based on salaryPayoutDay
    if (!y || !m) {
      y = now.getUTCFullYear();
      m = now.getUTCMonth() + 1;
      if (now.getUTCDate() > payoutDay) {
        if (m === 12) {
          y += 1;
          m = 1;
        } else {
          m += 1;
        }
      }
    }

    const { startDate, endDate } = this.getMonthDateRange(y, m, payoutDay);

    const [employees, attendanceRecords, manualPenalties, breakRecords, existingPayslips] = await Promise.all([
      prisma.user.findMany({
        where: {
          orgId,
          role: 'EMPLOYEE',
          status: { notIn: ['SUSPENDED', 'TERMINATED'] },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          employeeCode: true,
          status: true,
          baseSalary: true,
          salaryCurrency: true,
          bankName: true,
          accountNumber: true,
          accountName: true,
          department: { select: { id: true, name: true } },
          office: { select: { id: true, name: true, openTime: true, closeTime: true, weeklySchedule: true, timezone: true } },
        },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      }),
      prisma.attendanceRecord.findMany({
        where: {
          employee: { orgId },
          date: { gte: startDate, lte: endDate },
        },
        select: {
          id: true,
          employeeId: true,
          date: true,
          status: true,
          penalty: true,
          totalWorkHours: true,
          overtimeEarnings: true,
          overtimeMinutes: true,
          overtimeRuleVersion: true,
          overtimeDetails: true,
          clockInTime: true,
          clockOutTime: true,
        },
      }),
      prisma.manualPenalty.findMany({
        where: {
          orgId,
          createdAt: { gte: startDate, lte: endDate },
        },
        select: {
          id: true,
          employeeId: true,
          amount: true,
          reason: true,
          createdAt: true,
        },
      }),
      prisma.breakRecord.findMany({
        where: {
          employee: { orgId },
          startTime: { gte: startDate, lte: endDate },
        },
        select: {
          id: true,
          employeeId: true,
          penalty: true,
          breakType: true,
          startTime: true,
          endTime: true,
          durationMinutes: true,
          notes: true,
        },
      }),
      prisma.payslipRecord.findMany({
        where: { orgId, year: y, month: m },
      }),
    ]);

    const payslipMap = new Map();
    for (const p of existingPayslips) {
      payslipMap.set(p.employeeId, p);
    }

    const attendanceByEmployee = new Map();
    for (const rec of attendanceRecords) {
      if (!attendanceByEmployee.has(rec.employeeId)) attendanceByEmployee.set(rec.employeeId, []);
      attendanceByEmployee.get(rec.employeeId).push(rec);
    }

    const manualPenaltiesByEmployee = new Map();
    for (const mp of manualPenalties) {
      if (!manualPenaltiesByEmployee.has(mp.employeeId)) manualPenaltiesByEmployee.set(mp.employeeId, []);
      manualPenaltiesByEmployee.get(mp.employeeId).push(mp);
    }

    const breakByEmployee = new Map();
    for (const br of breakRecords) {
      if (!breakByEmployee.has(br.employeeId)) breakByEmployee.set(br.employeeId, []);
      breakByEmployee.get(br.employeeId).push(br);
    }

    const employeeRows = await Promise.all(employees.map(async (emp) => {
      const existing = payslipMap.get(emp.id);
      const userAtt = attendanceByEmployee.get(emp.id) || [];
      const userMp = manualPenaltiesByEmployee.get(emp.id) || [];
      const userBr = breakByEmployee.get(emp.id) || [];
      const currency = emp.salaryCurrency || org?.salaryCurrency || 'NGN';
      const liveCalculation = calculatePayroll({
        employeeId: emp.id,
        year: y,
        month: m,
        periodStart: startDate,
        periodEnd: endDate,
        currency,
        baseSalary: emp.baseSalary,
        attendanceRecords: userAtt,
        breakRecords: userBr,
        manualPenalties: userMp,
        timezone: emp.office?.timezone || org?.timezone || 'Africa/Lagos',
        officeOpenTime: emp.office?.openTime || '08:00',
        officeCloseTime: emp.office?.closeTime || '17:00',
        weeklySchedule: emp.office?.weeklySchedule || null,
      });
      const isCurrentCycle = now >= startDate && now <= endDate;
      // Only lock calculation snapshot if payslip is for a closed past cycle AND has been finalized/paid
      const isHistoricalLocked = !isCurrentCycle && existing?.status === 'PAID';
      const calculation = (isHistoricalLocked && existing?.calculationSnapshot)
        ? { ...liveCalculation, ...existing.calculationSnapshot.summary, snapshot: existing.calculationSnapshot, calculationHash: existing.calculationHash }
        : liveCalculation;

      // Sync active un-locked payslip record with live calculation so DB, overview, and subsequent dispatches remain 100% consistent
      if (existing && !isHistoricalLocked) {
        try {
          await prisma.payslipRecord.update({
            where: { id: existing.id },
            data: {
              baseSalary: calculation.baseSalary,
              grossSalary: calculation.grossSalary,
              totalWorkHours: calculation.totalWorkHours,
              overtimeEarnings: calculation.overtimeEarnings,
              totalPresentDays: calculation.totalPresentDays,
              totalLateDays: calculation.totalLateDays,
              attendancePenalties: calculation.attendancePenalties,
              breakPenalties: calculation.breakPenalties,
              manualPenalties: calculation.manualPenalties,
              totalDeductions: calculation.totalDeductions,
              netSalary: calculation.netSalary,
              breakdownJson: calculation.lineItems,
              calculationVersion: calculation.calculationVersion,
              calculationHash: calculation.calculationHash,
              calculationSnapshot: calculation.snapshot,
            },
          });
        } catch (err) {
          logger.warn('Failed to sync payslip record with live calculation:', err.message);
        }
      }

      const { baseSalary, totalWorkHours, overtimeEarnings, totalPresentDays, totalLateDays,
        attendancePenalties, breakPenalties, manualPenalties: manualPenaltiesTotal,
        totalDeductions, grossSalary, netSalary } = calculation;

      return {
        id: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        name: `${emp.firstName} ${emp.lastName}`.trim(),
        email: emp.email,
        phone: emp.phone,
        cleanPhone: this.cleanPhoneNumber(emp.phone),
        employeeCode: emp.employeeCode || 'N/A',
        status: emp.status,
        departmentName: emp.department?.name || 'General',
        officeName: emp.office?.name || 'Headquarters',
        baseSalary,
        currency,
        bankName: emp.bankName || '',
        accountNumber: emp.accountNumber || '',
        accountName: emp.accountName || '',
        totalWorkHours,
        overtimeEarnings,
        totalPresentDays,
        totalLateDays,
        attendancePenalties,
        breakPenalties,
        manualPenalties: manualPenaltiesTotal,
        totalDeductions,
        grossSalary,
        netSalary,
        calculationSnapshot: calculation.snapshot,
        calculationHash: calculation.calculationHash,
        calculationVersion: calculation.calculationVersion,
        lineItems: calculation.lineItems,
        payslipId: existing?.id || null,
        payslipStatus: existing?.status || 'DRAFT',
        whatsappStatus: existing?.whatsappStatus || 'PENDING',
        whatsappSentAt: existing?.whatsappSentAt || null,
      };
    }));

    const totalBase = employeeRows.reduce((acc, r) => acc + r.baseSalary, 0);
    const totalGross = employeeRows.reduce((acc, r) => acc + r.grossSalary, 0);
    const totalOvertime = employeeRows.reduce((acc, r) => acc + r.overtimeEarnings, 0);
    const totalDeductions = employeeRows.reduce((acc, r) => acc + r.totalDeductions, 0);
    const totalNet = employeeRows.reduce((acc, r) => acc + r.netSalary, 0);

    const isCurrentCycle = now >= startDate && now <= endDate;
    const isCompleted = now > endDate;
    const cycleStatus = isCurrentCycle ? 'ACTIVE' : isCompleted ? 'COMPLETED' : 'UPCOMING';
    const periodLabel = this.formatPeriodLabel(startDate, endDate);

    return {
      organization: org,
      year: y,
      month: m,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      periodLabel,
      cycleStatus,
      summary: {
        totalEmployees: employeeRows.length,
        totalBasePayroll: totalBase,
        totalGrossPayroll: totalGross,
        totalOvertimeEarnings: totalOvertime,
        totalDeductions,
        totalNetPayout: totalNet,
        salaryPayoutDay: payoutDay,
        currency: org?.salaryCurrency || 'NGN',
        periodStart: startDate.toISOString(),
        periodEnd: endDate.toISOString(),
        periodLabel,
        cycleStatus,
      },
      employees: employeeRows,
    };
  }

  /**
   * Update base salary and bank info for an employee
   */
  async setEmployeeSalary(orgId, employeeId, data) {
    const baseSalary = parseFloat(data.baseSalary) || 0;
    const salaryCurrency = data.salaryCurrency || 'NGN';
    const bankName = data.bankName || null;
    const accountNumber = data.accountNumber || null;
    const accountName = data.accountName || null;

    const updated = await prisma.user.updateMany({
      where: {
        id: employeeId,
        orgId,
        status: { notIn: ['SUSPENDED', 'TERMINATED'] },
      },
      data: {
        baseSalary,
        salaryCurrency,
        bankName,
        accountNumber,
        accountName,
      },
    });

    if (updated.count === 0) {
      throw new Error('Employee not found or unauthorized');
    }

    return { success: true, baseSalary, salaryCurrency, bankName, accountNumber, accountName };
  }

  /**
   * Get and update organization payroll settings
   */
  async getPayrollSettings(orgId) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        salaryPayoutDay: true,
        salaryAutomationEnabled: true,
        salaryCurrency: true,
        smtpHost: true,
        smtpPort: true,
        smtpUser: true,
        smtpPass: true,
        smtpFrom: true,
        smtpSecure: true,
      },
    });
    if (!org) throw new Error('Organization not found');

    return {
      ...org,
      smtpPass: org.smtpPass ? '••••••••' : null,
      hasSmtpCredentials: Boolean(org.smtpHost && org.smtpUser && org.smtpPass),
    };
  }

  async updatePayrollSettings(orgId, data) {
    const updateData = {};
    if (data.salaryPayoutDay !== undefined) {
      const day = parseInt(data.salaryPayoutDay, 10);
      if (day >= 1 && day <= 31) updateData.salaryPayoutDay = day;
    }
    if (data.salaryAutomationEnabled !== undefined) {
      updateData.salaryAutomationEnabled = Boolean(data.salaryAutomationEnabled);
    }
    if (data.salaryCurrency) {
      updateData.salaryCurrency = data.salaryCurrency.toUpperCase();
    }
    // SMTP email configuration
    if (data.smtpHost !== undefined) {
      updateData.smtpHost = data.smtpHost || null;
    }
    if (data.smtpPort !== undefined) {
      updateData.smtpPort = parseInt(data.smtpPort, 10) || 587;
    }
    if (data.smtpUser !== undefined) {
      updateData.smtpUser = data.smtpUser || null;
    }
    if (data.smtpPass && !data.smtpPass.includes('••••')) {
      updateData.smtpPass = data.smtpPass;
    }
    if (data.smtpFrom !== undefined) {
      updateData.smtpFrom = data.smtpFrom || null;
    }
    if (data.smtpSecure !== undefined) {
      updateData.smtpSecure = Boolean(data.smtpSecure);
    }

    const org = await prisma.organization.update({
      where: { id: orgId },
      data: updateData,
      select: {
        id: true,
        name: true,
        salaryPayoutDay: true,
        salaryAutomationEnabled: true,
        salaryCurrency: true,
        smtpHost: true,
        smtpPort: true,
        smtpUser: true,
        smtpFrom: true,
        smtpSecure: true,
      },
    });

    return org;
  }

  /**
   * Compute monthly payroll for all employees in an organization and persist to PayslipRecord
   */
  async calculateMonthlyPayroll(orgId, year, month) {
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    const payoutDay = org?.salaryPayoutDay ?? 28;
    const now = new Date();

    let y = year ? parseInt(year, 10) : null;
    let m = month ? parseInt(month, 10) : null;

    if (!y || !m) {
      y = now.getUTCFullYear();
      m = now.getUTCMonth() + 1;
      if (now.getUTCDate() > payoutDay) {
        if (m === 12) {
          y += 1;
          m = 1;
        } else {
          m += 1;
        }
      }
    }

    const { startDate, endDate } = this.getMonthDateRange(y, m, payoutDay);

    const [employees, attendanceRecords, manualPenalties, breakRecords, existingPayslips] = await Promise.all([
      prisma.user.findMany({
        where: {
          orgId,
          role: 'EMPLOYEE',
          status: { notIn: ['SUSPENDED', 'TERMINATED'] },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          employeeCode: true,
          baseSalary: true,
          salaryCurrency: true,
          office: {
            select: {
              openTime: true,
              closeTime: true,
              weeklySchedule: true,
              timezone: true,
            },
          },
        },
      }),
      prisma.attendanceRecord.findMany({
        where: {
          employee: { orgId },
          date: { gte: startDate, lte: endDate },
        },
        orderBy: { date: 'asc' },
      }),
      prisma.manualPenalty.findMany({
        where: {
          orgId,
          createdAt: { gte: startDate, lte: endDate },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.breakRecord.findMany({
        where: {
          employee: { orgId },
          startTime: { gte: startDate, lte: endDate },
        },
        orderBy: { startTime: 'asc' },
      }),
      prisma.payslipRecord.findMany({ where: { orgId, year: y, month: m } }),
    ]);

    const currency = org?.salaryCurrency || 'NGN';
    const attendanceByEmployee = new Map();
    for (const rec of attendanceRecords) {
      if (!attendanceByEmployee.has(rec.employeeId)) attendanceByEmployee.set(rec.employeeId, []);
      attendanceByEmployee.get(rec.employeeId).push(rec);
    }

    const manualByEmployee = new Map();
    for (const mp of manualPenalties) {
      if (!manualByEmployee.has(mp.employeeId)) manualByEmployee.set(mp.employeeId, []);
      manualByEmployee.get(mp.employeeId).push(mp);
    }

    const breakByEmployee = new Map();
    for (const br of breakRecords) {
      if (!breakByEmployee.has(br.employeeId)) breakByEmployee.set(br.employeeId, []);
      breakByEmployee.get(br.employeeId).push(br);
    }

    const payslipByEmployee = new Map(existingPayslips.map((payslip) => [payslip.employeeId, payslip]));
    const savedPayslips = [];

    const isCurrentCycle = now >= startDate && now <= endDate;

    for (const emp of employees) {
      const existingPayslip = payslipByEmployee.get(emp.id);
      if (existingPayslip?.status === 'SENT' || (!isCurrentCycle && existingPayslip?.status === 'PAID')) {
        savedPayslips.push(existingPayslip);
        continue;
      }

      const userAtt = attendanceByEmployee.get(emp.id) || [];
      const userMp = manualByEmployee.get(emp.id) || [];
      const userBr = breakByEmployee.get(emp.id) || [];
      const calculation = calculatePayroll({
        employeeId: emp.id,
        year: y,
        month: m,
        periodStart: startDate,
        periodEnd: endDate,
        currency: emp.salaryCurrency || currency,
        baseSalary: emp.baseSalary,
        attendanceRecords: userAtt,
        breakRecords: userBr,
        manualPenalties: userMp,
        timezone: emp.office?.timezone || org?.timezone || 'Africa/Lagos',
        officeOpenTime: emp.office?.openTime || '08:00',
        officeCloseTime: emp.office?.closeTime || '17:00',
        weeklySchedule: emp.office?.weeklySchedule || null,
      });

      const payslip = await prisma.payslipRecord.upsert({
        where: {
          employeeId_year_month: {
            employeeId: emp.id,
            year: y,
            month: m,
          },
        },
        create: {
          orgId,
          employeeId: emp.id,
          year: y,
          month: m,
          periodStart: startDate,
          periodEnd: endDate,
          baseSalary: calculation.baseSalary,
          grossSalary: calculation.grossSalary,
          currency: emp.salaryCurrency || currency,
          totalWorkHours: calculation.totalWorkHours,
          overtimeEarnings: calculation.overtimeEarnings,
          totalPresentDays: calculation.totalPresentDays,
          totalLateDays: calculation.totalLateDays,
          totalLateMinutes: 0,
          attendancePenalties: calculation.attendancePenalties,
          breakPenalties: calculation.breakPenalties,
          manualPenalties: calculation.manualPenalties,
          totalDeductions: calculation.totalDeductions,
          netSalary: calculation.netSalary,
          breakdownJson: calculation.lineItems,
          calculationVersion: calculation.calculationVersion,
          calculationHash: calculation.calculationHash,
          calculationSnapshot: calculation.snapshot,
          status: 'GENERATED',
        },
        update: {
          periodStart: startDate,
          periodEnd: endDate,
          baseSalary: calculation.baseSalary,
          grossSalary: calculation.grossSalary,
          currency: emp.salaryCurrency || currency,
          totalWorkHours: calculation.totalWorkHours,
          overtimeEarnings: calculation.overtimeEarnings,
          totalPresentDays: calculation.totalPresentDays,
          totalLateDays: calculation.totalLateDays,
          totalLateMinutes: 0,
          attendancePenalties: calculation.attendancePenalties,
          breakPenalties: calculation.breakPenalties,
          manualPenalties: calculation.manualPenalties,
          totalDeductions: calculation.totalDeductions,
          netSalary: calculation.netSalary,
          breakdownJson: calculation.lineItems,
          calculationVersion: calculation.calculationVersion,
          calculationHash: calculation.calculationHash,
          calculationSnapshot: calculation.snapshot,
          status: existingPayslip?.status === 'SENT' ? 'SENT' : 'GENERATED',
        },
      });

      await WorkEventService.record({
        orgId,
        employeeId: emp.id,
        type: 'PAYROLL_CALCULATED',
        occurredAt: payslip.updatedAt,
        source: 'PAYROLL',
        status: payslip.status === 'GENERATED' ? 'FINALIZED' : payslip.status,
        ruleVersion: 'payroll-calculation-v1',
        sourceType: 'PayslipRecord',
        sourceId: payslip.id,
        dedupeKey: `payslip-calculated:${payslip.id}:${payslip.updatedAt.toISOString()}`,
        metadata: {
          year: y,
          month: m,
          totalWorkHours: payslip.totalWorkHours,
          totalDeductions: payslip.totalDeductions,
          overtimeEarnings: payslip.overtimeEarnings,
          calculationVersion: payslip.calculationVersion,
          calculationHash: payslip.calculationHash,
          calculationSnapshot: payslip.calculationSnapshot,
          netSalary: payslip.netSalary,
          breakdown: payslip.breakdownJson,
        },
      });

      savedPayslips.push(payslip);
    }

    return {
      success: true,
      year: y,
      month: m,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      periodLabel: this.formatPeriodLabel(startDate, endDate),
      count: savedPayslips.length,
      payslips: savedPayslips,
    };
  }

  /**
   * Generate high-resolution PDF Payslip using PDFKit
   */
  async generatePayslipPdf(payslipId) {
    const payslip = await prisma.payslipRecord.findUnique({
      where: { id: payslipId },
      include: {
        organization: true,
        employee: {
          include: {
            department: true,
            office: true,
          },
        },
      },
    });

    if (!payslip) throw new Error('Payslip record not found');

    const payoutDay = payslip.organization?.salaryPayoutDay ?? 28;
    const { startDate, endDate } = this.getMonthDateRange(payslip.year, payslip.month, payoutDay);
    const periodStart = startDate;
    const periodEnd = endDate;
    const periodLabel = this.formatPeriodLabel(periodStart, periodEnd);

    // Live query attendance, break records, and manual penalties for this employee within the active pay cycle
    const [atts, breaks, manuals] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where: {
          employeeId: payslip.employeeId,
          date: { gte: periodStart, lte: periodEnd },
        },
        select: {
          id: true,
          date: true,
          status: true,
          penalty: true,
          totalWorkHours: true,
          clockInTime: true,
          clockOutTime: true,
          overtimeEarnings: true,
          overtimeMinutes: true,
          overtimeRuleVersion: true,
          overtimeDetails: true,
          session: {
            select: {
              sessionName: true,
              startTime: true,
              endTime: true,
              office: {
                select: {
                  openTime: true,
                  closeTime: true,
                  weeklySchedule: true,
                  timezone: true,
                },
              },
            },
          },
        },
        orderBy: { date: 'asc' },
      }),
      prisma.breakRecord.findMany({
        where: {
          employeeId: payslip.employeeId,
          startTime: { gte: periodStart, lte: periodEnd },
        },
        select: {
          id: true,
          penalty: true,
          breakType: true,
          startTime: true,
          endTime: true,
          durationMinutes: true,
          notes: true,
        },
        orderBy: { startTime: 'asc' },
      }),
      prisma.manualPenalty.findMany({
        where: {
          employeeId: payslip.employeeId,
          createdAt: { gte: periodStart, lte: periodEnd },
        },
        select: {
          id: true,
          amount: true,
          reason: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const tz = payslip.employee?.office?.timezone || payslip.organization?.timezone || 'Africa/Lagos';
    const officeOpenTime = payslip.employee?.office?.openTime || '08:00';
    const officeCloseTime = payslip.employee?.office?.closeTime || '17:00';

    let displayPresentDays = 0;
    let displayLateDays = 0;
    let displayWorkHours = 0;
    let attendancePenalties = 0;
    let totalOvertimeEarnings = 0;
    let itemizedRecords = [];

    for (const a of atts) {
      const hasCheckedIn = Boolean(a.clockInTime) || ['PRESENT', 'LATE', 'COMPLETELY_LATE', 'HALF_DAY', 'REVIEW_REQUIRED'].includes(a.status);
      if (hasCheckedIn && a.status !== 'ABSENT') {
        displayPresentDays += 1;
      }
      if (a.status === 'LATE' || a.status === 'COMPLETELY_LATE') {
        displayLateDays += 1;
      }
      displayWorkHours += a.totalWorkHours || 0;
      totalOvertimeEarnings += Number(a.overtimeEarnings || 0);

      const pen = Number(a.penalty || 0);
      const isLateStatus = a.status === 'LATE' || a.status === 'COMPLETELY_LATE';
      if (pen > 0 || isLateStatus) {
        if (pen > 0) attendancePenalties += pen;
        const clockInStr = a.clockInTime ? this.formatTime(a.clockInTime, tz) : '';
        const dateFormatted = this.formatDate(a.date, tz);
        let category = 'LATE ARRIVAL';
        let categoryColor = '#b91c1c';
        let badgeBg = '#fef2f2';
        let desc = '';
        let subDetail = '';

        if (a.status === 'COMPLETELY_LATE') {
          category = 'COMPLETELY LATE';
          categoryColor = '#991b1b';
          badgeBg = '#fef2f2';
          desc = clockInStr ? `Exceeded late threshold (Arrival: ${clockInStr})` : 'Exceeded late threshold';
          subDetail = (officeOpenTime && officeOpenTime !== '00:00') ? `Expected opening: ${this.formatTimeFromHhmm(officeOpenTime)}` : '';
        } else if (a.status === 'LATE') {
          category = 'LATE ARRIVAL';
          categoryColor = '#b91c1c';
          badgeBg = '#fef2f2';
          desc = clockInStr ? `Late arrival at ${clockInStr}` : 'Late check-in';
          subDetail = (officeOpenTime && officeOpenTime !== '00:00') ? `Shift begins: ${this.formatTimeFromHhmm(officeOpenTime)}` : '';
        } else if (a.status === 'ABSENT') {
          category = 'ABSENCE';
          categoryColor = '#c2410c';
          badgeBg = '#fff7ed';
          desc = 'Full-day absence recorded';
          subDetail = 'Unexcused non-attendance';
        } else {
          category = 'ATTENDANCE';
          categoryColor = '#475569';
          badgeBg = '#f1f5f9';
          desc = clockInStr ? `Attendance deduction (Arrival: ${clockInStr})` : 'Attendance deduction';
          subDetail = `Status: ${a.status}`;
        }

        itemizedRecords.push({
          id: `att-${a.id}`,
          type: 'ATTENDANCE_PENALTY',
          categoryType: 'DEDUCTION',
          category,
          categoryColor,
          badgeBg,
          date: a.date.toISOString().split('T')[0],
          dateStr: dateFormatted,
          time: clockInStr,
          timeStr: clockInStr || '—',
          status: a.status,
          amount: pen,
          description: desc,
          subDetail,
          rawTimestamp: a.clockInTime || a.date,
        });
      }

      // Workday Overstay / Overtime additions
      const otEarnings = Number(a.overtimeEarnings || 0);
      const otMinutes = Number(a.overtimeMinutes || 0);
      if (otEarnings > 0 || otMinutes > 0) {
        const clockOutStr = a.clockOutTime ? this.formatTime(a.clockOutTime, tz) : '';
        const dateFormatted = this.formatDate(a.date, tz);
        const rate = a.overtimeDetails?.feePerOvertimeHour;
        let closeFormatted = '';
        if (a.overtimeDetails?.scheduledClose) {
          closeFormatted = this.formatTime(a.overtimeDetails.scheduledClose, tz);
        } else {
          const off = a.session?.office || payslip.employee?.office;
          const dayHours = officeHoursFor(a.date || a.clockInTime, off);
          if (dayHours?.closeTime && dayHours.closeTime !== '00:00') {
            closeFormatted = this.formatTimeFromHhmm(dayHours.closeTime);
          } else if (officeCloseTime && officeCloseTime !== '00:00') {
            closeFormatted = this.formatTimeFromHhmm(officeCloseTime);
          }
        }
        const closedPart = closeFormatted ? `Closed ${closeFormatted}` : '';
        const ratePart = rate ? `Rate: ${this.formatMoney(rate, payslip.currency || 'NGN')}/hr` : '';
        const subDetail = [ratePart, closedPart].filter(Boolean).join(' · ');

        itemizedRecords.push({
          id: `overstay-${a.id}`,
          type: 'WORK_OVERSTAY',
          categoryType: 'EARNING',
          category: 'WORK OVERSTAY',
          categoryColor: '#059669',
          badgeBg: '#f0fdf4',
          date: a.date.toISOString().split('T')[0],
          dateStr: dateFormatted,
          time: clockOutStr,
          timeStr: clockOutStr ? `Departure: ${clockOutStr}` : `${otMinutes} min`,
          amount: otEarnings,
          description: clockOutStr
            ? `Workday overstay until ${clockOutStr} (${otMinutes} min past close)`
            : `Workday overstay: ${Math.round((otMinutes / 60) * 10) / 10}h (${otMinutes} min)`,
          subDetail,
          rawTimestamp: a.clockOutTime || a.date,
        });
      }
    }

    let breakPenalties = 0;
    for (const b of breaks) {
      const pen = Number(b.penalty || 0);
      if (pen > 0 || (b.durationMinutes && b.durationMinutes > 60)) {
        if (pen > 0) breakPenalties += pen;
        const startStr = b.startTime ? this.formatTime(b.startTime, tz) : '';
        const endStr = b.endTime ? this.formatTime(b.endTime, tz) : (b.isAutoEnded ? 'Auto-ended' : '');
        const timeRange = (startStr && endStr) ? `${startStr} – ${endStr}` : startStr;
        const dateFormatted = this.formatDate(b.startTime, tz);
        const durationStr = b.durationMinutes ? `${b.durationMinutes} mins` : '';

        itemizedRecords.push({
          id: `break-${b.id}`,
          type: 'BREAK_PENALTY',
          categoryType: 'DEDUCTION',
          category: 'BREAK OVERSTAY',
          categoryColor: '#ea580c',
          badgeBg: '#fff7ed',
          date: b.startTime.toISOString().split('T')[0],
          dateStr: dateFormatted,
          time: timeRange,
          timeStr: timeRange || '—',
          amount: pen,
          description: `Break overstay (${b.breakType || 'Break'}${durationStr ? ` · ${durationStr}` : ''})`,
          subDetail: timeRange ? `Interval: ${timeRange}${b.notes ? ` · ${b.notes}` : ''}` : (b.notes || ''),
          rawTimestamp: b.startTime,
        });
      }
    }

    let manualPenalties = 0;
    for (const m of manuals) {
      const amt = Number(m.amount || 0);
      if (amt > 0) {
        manualPenalties += amt;
        const timeStr = m.createdAt ? this.formatTime(m.createdAt, tz) : '';
        const dateFormatted = this.formatDate(m.createdAt, tz);

        itemizedRecords.push({
          id: `manual-${m.id}`,
          type: 'MANUAL_PENALTY',
          categoryType: 'DEDUCTION',
          category: 'HR PENALTY',
          categoryColor: '#7c3aed',
          badgeBg: '#faf5ff',
          date: m.createdAt.toISOString().split('T')[0],
          dateStr: dateFormatted,
          time: timeStr,
          timeStr: timeStr || '—',
          amount: amt,
          description: m.reason || 'HR administrative disciplinary deduction',
          subDetail: 'Administrative disciplinary penalty',
          rawTimestamp: m.createdAt,
        });
      }
    }

    const now = new Date();
    const isCurrentCycle = now >= periodStart && now <= periodEnd;
    const isHistoricalLocked = !isCurrentCycle && payslip.status === 'PAID';
    const savedCalculation = isHistoricalLocked ? payslip.calculationSnapshot : null;
    if (savedCalculation?.summary) {
      displayPresentDays = savedCalculation.summary.totalPresentDays ?? displayPresentDays;
      displayLateDays = savedCalculation.summary.totalLateDays ?? displayLateDays;
      displayWorkHours = savedCalculation.summary.totalWorkHours ?? displayWorkHours;
      attendancePenalties = savedCalculation.summary.attendancePenalties ?? attendancePenalties;
      breakPenalties = savedCalculation.summary.breakPenalties ?? breakPenalties;
      manualPenalties = savedCalculation.summary.manualPenalties ?? manualPenalties;
      if (savedCalculation.lineItems && savedCalculation.lineItems.length > 0) {
        itemizedRecords = savedCalculation.lineItems.filter((i) => i.type !== 'BASE_SALARY');
      }
    }

    // Sort all itemized audit records chronologically
    itemizedRecords.sort((a, b) => new Date(a.rawTimestamp).getTime() - new Date(b.rawTimestamp).getTime());

    const baseSalary = Number(payslip.baseSalary || payslip.employee?.baseSalary || 0);
    const overtimeEarnings = Number(savedCalculation?.summary?.overtimeEarnings ?? totalOvertimeEarnings);
    const grossSalary = Number(savedCalculation?.summary?.grossSalary ?? (baseSalary + overtimeEarnings));
    const totalDeductions = Number(savedCalculation?.summary?.totalDeductions ?? (attendancePenalties + breakPenalties + manualPenalties));
    const netSalary = Number(savedCalculation?.summary?.netSalary ?? Math.max(0, grossSalary - totalDeductions));
    const roundedWorkHours = Math.round(displayWorkHours * 10) / 10;

    // Refresh payslip record cache for un-locked payslips to guarantee consistency with live calculations
    try {
      if (!isHistoricalLocked) {
        await prisma.payslipRecord.update({
          where: { id: payslip.id },
          data: {
            periodStart,
            periodEnd,
            baseSalary,
            grossSalary,
            overtimeEarnings,
            totalWorkHours: roundedWorkHours,
            totalPresentDays: displayPresentDays,
            totalLateDays: displayLateDays,
            attendancePenalties,
            breakPenalties,
            manualPenalties,
            totalDeductions,
            netSalary,
            breakdownJson: itemizedRecords,
          },
        });
      }
    } catch (updErr) {
      logger.warn('Failed to update payslip record cache during PDF generation:', updErr);
    }

    const uploadsDir = path.join(__dirname, '../../uploads/payslips');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileName = `payslip-${payslip.id}.pdf`;
    const filePath = path.join(uploadsDir, fileName);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Payslip - ${payslip.employee.firstName} ${payslip.employee.lastName}`,
          Author: 'TimeLogic Enterprise',
        },
      });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      const orgName = payslip.organization.name || 'TimeLogic Enterprise';
      const empName = `${payslip.employee.firstName} ${payslip.employee.lastName}`;
      const empCode = payslip.employee.employeeCode || 'TL-EMP';
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const monthStr = `${monthNames[payslip.month - 1]} ${payslip.year}`;
      const currency = payslip.currency || 'NGN';

      // ── HUMAN-DESIGNED EXECUTIVE PAYSLIP ──

      // Attendance & Conduct Grade
      let employeeGrade = 'GRADE A';
      let gradeTitle = 'Exemplary Attendance & Conduct';
      let gradeRemark = 'Employee maintained exemplary punctuality and core service hours with zero attendance deductions or disciplinary penalties throughout this cycle.';
      let gradeColor = '#047857';
      let gradeBg = '#f0fdf4';
      let gradeBorder = '#bbf7d0';

      if (totalDeductions > 0 || displayLateDays > 0) {
        if (totalDeductions <= 2000 && displayLateDays <= 2 && manualPenalties === 0) {
          employeeGrade = 'GRADE B';
          gradeTitle = 'Satisfactory Service (Minor Delays)';
          gradeRemark = `Core duty hours delivered satisfactorily (${roundedWorkHours} hrs); ${displayLateDays} late check-in instance(s) recorded during this cycle.`;
          gradeColor = '#1d4ed8';
          gradeBg = '#eff6ff';
          gradeBorder = '#bfdbfe';
        } else {
          employeeGrade = 'GRADE C';
          gradeTitle = 'Attendance & Policy Review Required';
          gradeRemark = `Noticeable attendance delays and/or administrative penalties recorded totaling -${this.formatMoneyPdf(totalDeductions, currency)} across ${displayLateDays} late instance(s). Adherence to office shift timings is required.`;
          gradeColor = '#b91c1c';
          gradeBg = '#fef2f2';
          gradeBorder = '#fecaca';
        }
      }

      const empEmail = payslip.employee.email || 'N/A';
      const deptName = payslip.employee.department?.name || 'General';
      const bankInfo = (payslip.employee.bankName && payslip.employee.accountNumber)
        ? `${payslip.employee.bankName}  •  A/C: ${payslip.employee.accountNumber}`
        : (payslip.employee.bankName || 'Direct Deposit / Bank Transfer');

      // ─────────────────────────────────────────────────────────────
      // 1. CLEAN EXECUTIVE HEADER (Human Accounting Voucher Style)
      // ─────────────────────────────────────────────────────────────
      doc.fillColor('#0f172a').fontSize(15).font('Helvetica-Bold')
        .text(orgName, 40, 42);

      doc.fillColor('#64748b').fontSize(8).font('Helvetica')
        .text('Official Remuneration & Attendance Statement', 40, 60)
        .text('TimeLogic Enterprise Payroll Management System', 40, 71);

      // Document identifier (right)
      doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold')
        .text('PAYSLIP', 350, 42, { width: 205, align: 'right' });

      doc.fillColor('#475569').fontSize(8.5).font('Helvetica')
        .text(`Period: ${periodLabel}`, 300, 60, { width: 255, align: 'right' })
        .text(`Payroll Period: ${monthStr}   |   Status: ${['SENT', 'PAID'].includes(payslip.status) ? 'Payslip sent' : 'Prepared'}`, 300, 71, { width: 255, align: 'right' });

      // Elegant double divider rule
      doc.moveTo(40, 88).lineTo(555, 88).lineWidth(1.2).strokeColor('#0f172a').stroke();
      doc.moveTo(40, 91).lineTo(555, 91).lineWidth(0.5).strokeColor('#cbd5e1').stroke();

      // ─────────────────────────────────────────────────────────────
      // 2. EMPLOYEE & ATTENDANCE INFORMATION BOX
      // ─────────────────────────────────────────────────────────────
      const infoY = 100;
      const infoH = 94;
      doc.rect(40, infoY, 515, infoH).fill('#ffffff');
      doc.rect(40, infoY, 515, infoH).lineWidth(0.75).strokeColor('#cbd5e1').stroke();

      // Subtle header strips
      doc.rect(40, infoY, 257.5, 18).fill('#f8fafc');
      doc.rect(297.5, infoY, 257.5, 18).fill('#f8fafc');
      doc.moveTo(40, infoY + 18).lineTo(555, infoY + 18).lineWidth(0.5).strokeColor('#e2e8f0').stroke();
      doc.moveTo(297.5, infoY).lineTo(297.5, infoY + infoH).lineWidth(0.75).strokeColor('#cbd5e1').stroke();

      doc.fillColor('#475569').fontSize(7.5).font('Helvetica-Bold')
        .text('EMPLOYEE PARTICULARS', 50, infoY + 5)
        .text('ATTENDANCE & DISBURSEMENT RECORD', 308, infoY + 5);

      // Left particulars
      doc.fillColor('#64748b').fontSize(8).font('Helvetica')
        .text('Employee Name:', 50, infoY + 24)
        .text('Employee Code:', 50, infoY + 38)
        .text('Department:', 50, infoY + 52)
        .text('Email / Contact:', 50, infoY + 66)
        .text('Disbursement Bank:', 50, infoY + 80);

      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold')
        .text(empName, 138, infoY + 24)
        .text(empCode, 138, infoY + 38)
        .text(deptName, 138, infoY + 52);

      doc.fillColor('#334155').fontSize(8).font('Helvetica')
        .text(empEmail, 138, infoY + 66)
        .text(bankInfo, 138, infoY + 80);

      // Right attendance particulars
      doc.fillColor('#64748b').fontSize(8).font('Helvetica')
        .text('Pay Period:', 308, infoY + 24)
        .text('Days Present:', 308, infoY + 38)
        .text('Hours Logged:', 308, infoY + 52)
        .text('Late Arrivals:', 308, infoY + 66)
        .text('Attendance Grade:', 308, infoY + 80);

      doc.fillColor('#334155').fontSize(8).font('Helvetica')
        .text(periodLabel, 405, infoY + 24);

      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold')
        .text(`${displayPresentDays} Day(s)`, 405, infoY + 38)
        .text(`${roundedWorkHours} Hours`, 405, infoY + 52);

      doc.fillColor(displayLateDays > 0 ? '#b91c1c' : '#0f172a').font('Helvetica-Bold')
        .text(`${displayLateDays} Instance(s)`, 405, infoY + 66);

      // Human-designed Grade Indicator (NO LINKS, JUST CLEAR GRADE BADGE)
      doc.fillColor(gradeColor).font('Helvetica-Bold').fontSize(9)
        .text(employeeGrade, 405, infoY + 80);

      // ─────────────────────────────────────────────────────────────
      // 3. BALANCED EARNINGS & DEDUCTIONS LEDGER TABLE
      // ─────────────────────────────────────────────────────────────
      const tblY = 204;
      const rowH = 22;

      // Table Header
      doc.rect(40, tblY, 515, 20).fill('#f1f5f9');
      doc.rect(40, tblY, 515, 20).lineWidth(0.75).strokeColor('#cbd5e1').stroke();
      doc.moveTo(297.5, tblY).lineTo(297.5, tblY + 20).lineWidth(0.75).strokeColor('#cbd5e1').stroke();

      doc.fillColor('#1e293b').fontSize(8).font('Helvetica-Bold')
        .text('EARNINGS', 50, tblY + 6)
        .text('AMOUNT', 215, tblY + 6, { width: 72, align: 'right' })
        .text('DEDUCTIONS & PENALTIES', 308, tblY + 6)
        .text('AMOUNT', 470, tblY + 6, { width: 75, align: 'right' });

      // Ledger Rows
      const rows = [
        {
          earnLabel: `Basic Salary (${monthStr})`,
          earnVal: `+${this.formatMoneyPdf(baseSalary, currency)}`,
          earnColor: '#047857',
          dedLabel: 'Attendance Lateness Deductions',
          dedVal: attendancePenalties > 0 ? `-${this.formatMoneyPdf(attendancePenalties, currency)}` : '—',
          dedColor: attendancePenalties > 0 ? '#b91c1c' : '#94a3b8',
        },
        {
          earnLabel: 'Overtime Earnings',
          earnVal: overtimeEarnings > 0 ? `+${this.formatMoneyPdf(overtimeEarnings, currency)}` : '—',
          earnColor: overtimeEarnings > 0 ? '#047857' : '#94a3b8',
          dedLabel: '—',
          dedVal: '—',
          dedColor: '#94a3b8',
        },
        {
          earnLabel: '—',
          earnVal: '—',
          earnColor: '#94a3b8',
          dedLabel: 'Break Overstay Deductions',
          dedVal: breakPenalties > 0 ? `-${this.formatMoneyPdf(breakPenalties, currency)}` : '—',
          dedColor: breakPenalties > 0 ? '#b91c1c' : '#94a3b8',
        },
        {
          earnLabel: '—',
          earnVal: '—',
          earnColor: '#94a3b8',
          dedLabel: 'HR Administrative / Conduct Penalties',
          dedVal: manualPenalties > 0 ? `-${this.formatMoneyPdf(manualPenalties, currency)}` : '—',
          dedColor: manualPenalties > 0 ? '#b91c1c' : '#94a3b8',
        },
      ];

      let currentY = tblY + 20;
      rows.forEach((r, idx) => {
        const isAlt = idx % 2 === 1;
        doc.rect(40, currentY, 515, rowH).fill(isAlt ? '#fcfdfe' : '#ffffff');
        doc.rect(40, currentY, 515, rowH).lineWidth(0.5).strokeColor('#e2e8f0').stroke();
        doc.moveTo(297.5, currentY).lineTo(297.5, currentY + rowH).lineWidth(0.5).strokeColor('#e2e8f0').stroke();

        // Left Earnings
        doc.fillColor('#334155').fontSize(8).font('Helvetica')
          .text(r.earnLabel, 50, currentY + 6, { width: 160 });
        doc.fillColor(r.earnColor).font('Helvetica-Bold')
          .text(r.earnVal, 195, currentY + 6, { width: 92, align: 'right' });

        // Right Deductions
        doc.fillColor('#334155').font('Helvetica')
          .text(r.dedLabel, 308, currentY + 6, { width: 160 });
        doc.fillColor(r.dedColor).font('Helvetica-Bold')
          .text(r.dedVal, 450, currentY + 6, { width: 95, align: 'right' });

        currentY += rowH;
      });

      // Subtotal Row
      const subH = 22;
      doc.rect(40, currentY, 515, subH).fill('#f8fafc');
      doc.rect(40, currentY, 515, subH).lineWidth(0.75).strokeColor('#cbd5e1').stroke();
      doc.moveTo(297.5, currentY).lineTo(297.5, currentY + subH).lineWidth(0.75).strokeColor('#cbd5e1').stroke();

      doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold')
        .text('TOTAL GROSS EARNINGS', 50, currentY + 7);
      doc.fillColor('#047857').font('Helvetica-Bold')
        .text(`+${this.formatMoneyPdf(grossSalary, currency)}`, 195, currentY + 7, { width: 92, align: 'right' });

      doc.fillColor('#0f172a').font('Helvetica-Bold')
        .text('TOTAL DEDUCTIONS APPLIED', 308, currentY + 7);
      doc.fillColor('#b91c1c').font('Helvetica-Bold')
        .text(`-${this.formatMoneyPdf(totalDeductions, currency)}`, 450, currentY + 7, { width: 95, align: 'right' });

      currentY += subH + 12;

      // ─────────────────────────────────────────────────────────────
      // 4. NET SALARY PAYABLE SUMMARY BOX (Classic Corporate Voucher)
      // ─────────────────────────────────────────────────────────────
      const netBoxH = 48;
      doc.rect(40, currentY, 515, netBoxH).fill('#f8fafc');
      doc.rect(40, currentY, 515, netBoxH).lineWidth(1).strokeColor('#cbd5e1').stroke();
      // Solid navy accent bar
      doc.rect(40, currentY, 4, netBoxH).fill('#0f172a');

      doc.fillColor('#64748b').fontSize(7.5).font('Helvetica-Bold')
        .text('NET PAY', 54, currentY + 10);
      doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold')
        .text(this.formatMoneyPdf(netSalary, currency), 54, currentY + 22);

      doc.fillColor('#475569').fontSize(8).font('Helvetica')
        .text('Disbursement Method: Direct Deposit / Bank Transfer', 280, currentY + 12, { width: 265, align: 'right' })
        .text('Prepared by TimeLogic Payroll', 280, currentY + 26, { width: 265, align: 'right' });

      currentY += netBoxH + 12;

      // ─────────────────────────────────────────────────────────────
      // 5. ATTENDANCE & CONDUCT EVALUATION CARD (HUMAN-DESIGNED)
      // ─────────────────────────────────────────────────────────────
      const evalH = 44;
      doc.rect(40, currentY, 515, evalH).fill(gradeBg);
      doc.rect(40, currentY, 515, evalH).lineWidth(0.75).strokeColor(gradeBorder).stroke();
      doc.rect(40, currentY, 4, evalH).fill(gradeColor);

      doc.fillColor(gradeColor).fontSize(8).font('Helvetica-Bold')
        .text(`ATTENDANCE & CONDUCT EVALUATION:  ${employeeGrade}  (${gradeTitle.toUpperCase()})`, 52, currentY + 8);

      doc.fillColor('#334155').fontSize(7.5).font('Helvetica')
        .text(gradeRemark, 52, currentY + 22, { width: 495, lineGap: 1.5 });

      currentY += evalH + 14;

      // ─────────────────────────────────────────────────────────────
      // ─────────────────────────────────────────────────────────────
      // 6. ITEMIZED ATTENDANCE, PENALTIES & OVERSTAY AUDIT TRAIL
      // ─────────────────────────────────────────────────────────────
      if (itemizedRecords.length > 0) {
        doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold')
          .text('ITEMIZED ATTENDANCE, PENALTIES & OVERSTAY AUDIT TRAIL', 40, currentY);
        doc.fillColor('#64748b').fontSize(7.5).font('Helvetica')
          .text('Official audit record of all late arrivals, break overstays, HR disciplinary deductions, and workday overstays for this pay cycle.', 40, currentY + 12);
        currentY += 27;

        // Table Header
        const auditHeadH = 18;
        doc.rect(40, currentY, 515, auditHeadH).fill('#f1f5f9');
        doc.rect(40, currentY, 515, auditHeadH).lineWidth(0.5).strokeColor('#cbd5e1').stroke();

        doc.fillColor('#475569').fontSize(7.5).font('Helvetica-Bold')
          .text('DATE & TIME', 48, currentY + 5)
          .text('CATEGORY', 160, currentY + 5)
          .text('RECORD DETAILS & REASON', 255, currentY + 5)
          .text('AMOUNT', 465, currentY + 5, { width: 80, align: 'right' });

        currentY += auditHeadH;

        for (let i = 0; i < itemizedRecords.length; i++) {
          const item = itemizedRecords[i];
          const rowHeight = 24;

          // Check if row exceeds page bounds
          if (currentY + rowHeight > 730) {
            doc.addPage();
            doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold')
              .text(`${orgName}  •  PAYSLIP CONTINUATION`, 40, 42);
            doc.fillColor('#64748b').fontSize(8).font('Helvetica')
              .text(`Employee: ${empName} (${empCode})   |   Period: ${periodLabel}`, 40, 56);
            doc.moveTo(40, 68).lineTo(555, 68).lineWidth(0.75).strokeColor('#0f172a').stroke();
            currentY = 80;

            doc.rect(40, currentY, 515, auditHeadH).fill('#f1f5f9');
            doc.rect(40, currentY, 515, auditHeadH).lineWidth(0.5).strokeColor('#cbd5e1').stroke();
            doc.fillColor('#475569').fontSize(7.5).font('Helvetica-Bold')
              .text('DATE & TIME', 48, currentY + 5)
              .text('CATEGORY', 160, currentY + 5)
              .text('RECORD DETAILS & REASON', 255, currentY + 5)
              .text('AMOUNT', 465, currentY + 5, { width: 80, align: 'right' });
            currentY += auditHeadH;
          }

          const isAlt = i % 2 === 1;
          doc.rect(40, currentY, 515, rowHeight).fill(isAlt ? '#fcfdfe' : '#ffffff');
          doc.rect(40, currentY, 515, rowHeight).lineWidth(0.5).strokeColor('#f1f5f9').stroke();

          // Date & Time (stacked vertically)
          doc.fillColor('#0f172a').fontSize(7.5).font('Helvetica-Bold')
            .text(item.dateStr || item.date, 48, currentY + 4);
          doc.fillColor('#64748b').fontSize(6.5).font('Helvetica')
            .text(item.timeStr || item.time || '—', 48, currentY + 14);

          // Category Badge Text
          const catLabel = item.categoryLabel || item.category || (
            item.type === 'ATTENDANCE_PENALTY' || item.type === 'ATTENDANCE_LATE' ? 'LATE ARRIVAL'
            : item.type === 'BREAK_PENALTY' ? 'BREAK OVERSTAY'
            : item.type === 'WORK_OVERSTAY' || item.type === 'OVERTIME' ? 'WORK OVERSTAY'
            : 'HR PENALTY'
          );
          doc.fillColor(item.categoryColor || '#334155').fontSize(7.5).font('Helvetica-Bold')
            .text(catLabel, 160, currentY + 4);

          // Details & Reason (stacked vertically)
          doc.fillColor('#334155').fontSize(7.5).font('Helvetica')
            .text(item.description || item.reason || item.type, 255, currentY + 4, { width: 205, ellipsis: true });
          if (item.subDetail) {
            doc.fillColor('#64748b').fontSize(6.5).font('Helvetica')
              .text(item.subDetail, 255, currentY + 14, { width: 205, ellipsis: true });
          }

          // Amount
          const isEarning = item.categoryType === 'EARNING' || item.category === 'EARNING' || item.type === 'WORK_OVERSTAY' || item.type === 'OVERTIME';
          const amtColor = isEarning ? '#047857' : (item.amount > 0 ? '#b91c1c' : '#64748b');
          const amtSign = isEarning ? '+' : (item.amount > 0 ? '-' : '');
          const amtText = item.amount > 0 ? `${amtSign}${this.formatMoneyPdf(item.amount, currency)}` : '—';

          doc.fillColor(amtColor).fontSize(7.5).font('Helvetica-Bold')
            .text(amtText, 465, currentY + 8, { width: 80, align: 'right' });

          currentY += rowHeight;
        }
        currentY += 14;
      } else {
        doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold')
          .text('ITEMIZED ATTENDANCE, PENALTIES & OVERSTAY AUDIT TRAIL', 40, currentY);
        currentY += 14;
        doc.rect(40, currentY, 515, 24).fill('#f8fafc');
        doc.rect(40, currentY, 515, 24).lineWidth(0.5).strokeColor('#e2e8f0').stroke();
        doc.fillColor('#047857').fontSize(8).font('Helvetica-Bold')
          .text('✓ No attendance penalties or overstay records incurred for this pay period.', 52, currentY + 7);
        currentY += 34;
      }

      // ─────────────────────────────────────────────────────────────
      // 7. FORMAL FOOTER
      // ─────────────────────────────────────────────────────────────
      const footerY = 750;
      doc.moveTo(40, footerY).lineTo(555, footerY).lineWidth(0.5).strokeColor('#e2e8f0').stroke();

      doc.fillColor('#64748b').fontSize(7).font('Helvetica')
        .text(
          'Confidential: This payslip is an official statement prepared for the named employee. For any inquiries, please contact the HR / Accounts Department.',
          40,
          footerY + 8,
          { width: 515, align: 'center' }
        )
        .text(
          `TimeLogic Enterprise Payroll System  •  Ref: TL-PAY-${payslip.id.slice(0, 8).toUpperCase()}  •  Generated on ${new Date().toISOString().split('T')[0]}  •  Page 1 of 1`,
          40,
          footerY + 18,
          { width: 515, align: 'center' }
        );
      if (payslip.calculationHash) {
        doc.fillColor('#64748b').fontSize(6.5).font('Helvetica')
          .text(`Calculation ${payslip.calculationVersion || 'payroll-calculation-v1'} · SHA-256 ${payslip.calculationHash}`, 40, footerY + 28, { width: 515, align: 'center' });
      }

      doc.end();

      writeStream.on('finish', async () => {
        const publicUrl = `/api/payroll/payslips/${payslip.id}/pdf`;
        await prisma.payslipRecord.update({
          where: { id: payslip.id },
          data: { pdfUrl: publicUrl, pdfPath: filePath },
        });
        resolve({ filePath, fileName, publicUrl });
      });

      writeStream.on('error', reject);
    });
  }

  /**
   * Dispatch official PDF payslip and breakdown to employee via Email
   */
  async sendPayslipEmail(payslipId, options = {}) {
    const payslip = await prisma.payslipRecord.findUnique({
      where: { id: payslipId },
      include: {
        organization: true,
        employee: true,
      },
    });

    const now = new Date();
    const isCurrentCycle = payslip.periodStart && payslip.periodEnd
      ? (now >= payslip.periodStart && now <= payslip.periodEnd)
      : false;
    if (!options.force && (payslip.status === 'SENT' || (!isCurrentCycle && payslip.status === 'PAID'))) {
      return { success: true, status: 'SKIPPED', reason: 'This payslip has already been finalized and locked.' };
    }

    const email = payslip.employee.email;
    if (!email || !email.includes('@')) {
      await prisma.payslipRecord.update({
        where: { id: payslip.id },
        data: {
          whatsappStatus: 'SKIPPED',
          whatsappError: 'Employee has no registered email address',
        },
      });
      return {
        success: false,
        status: 'SKIPPED',
        error: 'Employee has no registered email address',
      };
    }

    // Always regenerate fresh PDF to ensure up-to-date metrics, payday rules, and drafted performance review
    const generated = await this.generatePayslipPdf(payslip.id);
    const pdfPath = generated.filePath;

    // Reload freshly updated payslip record from DB
    const freshPayslip = (await prisma.payslipRecord.findUnique({
      where: { id: payslip.id },
      include: {
        organization: true,
        employee: true,
      },
    })) || payslip;

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthStr = `${monthNames[freshPayslip.month - 1]} ${freshPayslip.year}`;
    const currency = freshPayslip.currency || 'NGN';
    const companyName = freshPayslip.organization.name || 'TimeLogic Enterprise';
    const empName = `${freshPayslip.employee.firstName} ${freshPayslip.employee.lastName}`;

    let periodStart = freshPayslip.periodStart;
    let periodEnd = freshPayslip.periodEnd;
    if (!periodStart || !periodEnd) {
      const range = this.getMonthDateRange(freshPayslip.year, freshPayslip.month, freshPayslip.organization?.salaryPayoutDay || 28);
      periodStart = range.startDate;
      periodEnd = range.endDate;
    }
    const periodLabel = this.formatPeriodLabel(periodStart, periodEnd);

    let employeeGrade = 'GRADE A';
    if (freshPayslip.totalDeductions > 0 || freshPayslip.totalLateDays > 0) {
      if (freshPayslip.totalDeductions <= 2000 && freshPayslip.totalLateDays <= 2 && (freshPayslip.manualPenalties || 0) === 0) {
        employeeGrade = 'GRADE B';
      } else {
        employeeGrade = 'GRADE C';
      }
    }

    const subject = `Official Payslip: ${empName} - ${monthStr} (${periodLabel})`;

    const rawBreakdown = Array.isArray(freshPayslip.breakdownJson) ? freshPayslip.breakdownJson : [];
    const auditItems = rawBreakdown.filter((i) => i.type !== 'BASE_SALARY');
    let auditTrailRowsHtml = '';

    if (auditItems.length > 0) {
      auditTrailRowsHtml = auditItems.map((item, idx) => {
        const isAlt = idx % 2 === 1;
        const isEarning = item.categoryType === 'EARNING' || item.category === 'EARNING' || item.type === 'WORK_OVERSTAY' || item.type === 'OVERTIME';
        const amtColor = isEarning ? '#047857' : (item.amount > 0 ? '#b91c1c' : '#64748b');
        const amtSign = isEarning ? '+' : (item.amount > 0 ? '-' : '');
        const amtText = item.amount > 0 ? `${amtSign}${this.formatMoney(item.amount, currency)}` : '—';
        const badgeBg = item.badgeBg || (isEarning ? '#f0fdf4' : '#fef2f2');
        const badgeColor = item.categoryColor || (isEarning ? '#059669' : '#b91c1c');
        const catLabel = item.categoryLabel || item.category || (
          item.type === 'ATTENDANCE_PENALTY' || item.type === 'ATTENDANCE_LATE' ? 'LATE ARRIVAL'
          : item.type === 'BREAK_PENALTY' ? 'BREAK OVERSTAY'
          : isEarning ? 'WORK OVERSTAY'
          : 'HR PENALTY'
        );

        return `
          <tr style="border-bottom: 1px solid #f1f5f9; background-color: ${isAlt ? '#f8fafc' : '#ffffff'};">
            <td style="padding: 10px 12px; vertical-align: top; white-space: nowrap;">
              <div style="font-weight: 600; color: #0f172a; font-size: 12px;">${item.dateStr || item.date}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${item.timeStr || item.time || '—'}</div>
            </td>
            <td style="padding: 10px 12px; vertical-align: top;">
              <span style="display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 10.5px; font-weight: 600; background-color: ${badgeBg}; color: ${badgeColor};">
                ${catLabel}
              </span>
            </td>
            <td style="padding: 10px 12px; vertical-align: top; color: #334155; font-size: 12px;">
              <div style="font-weight: 500;">${item.description || item.reason || item.type}</div>
              ${item.subDetail ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">${item.subDetail}</div>` : ''}
            </td>
            <td style="padding: 10px 12px; vertical-align: top; text-align: right; font-weight: 700; white-space: nowrap; font-size: 12px; color: ${amtColor};">
              ${amtText}
            </td>
          </tr>
        `;
      }).join('');
    } else {
      auditTrailRowsHtml = `
        <tr>
          <td colspan="4" style="padding: 18px 12px; text-align: center; color: #047857; font-weight: 600; background-color: #f0fdf4; font-size: 12px;">
            ✓ No attendance penalties or overstay records incurred for this pay period.
          </td>
        </tr>
      `;
    }

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 28px 16px; color: #1e293b; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0; }
    .header { background: #0f172a; padding: 28px 24px; text-align: left; border-bottom: 3px solid #334155; }
    .header-sub { color: #94a3b8; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
    .header-title { color: #ffffff; font-size: 19px; font-weight: bold; margin: 0; }
    .header-meta { color: #cbd5e1; font-size: 13px; margin-top: 6px; }
    .content { padding: 28px 24px; }
    .greeting { font-size: 14px; margin-bottom: 20px; line-height: 1.6; color: #334155; }
    .payout-box { background: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #0f172a; border-radius: 8px; padding: 18px 20px; margin-bottom: 22px; }
    .payout-label { color: #64748b; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }
    .payout-amount { font-size: 24px; font-weight: bold; color: #0f172a; margin: 0; }
    .summary-box { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin-bottom: 22px; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13.5px; }
    .row:last-child { border-bottom: none; }
    .row-label { color: #64748b; }
    .row-val { font-weight: 600; color: #0f172a; }
    .row-val-alert { font-weight: 600; color: #b91c1c; }
    .notice { font-size: 12px; color: #64748b; line-height: 1.6; margin-top: 20px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="header-sub">${companyName}</div>
      <h1 class="header-title">Official Employee Payslip</h1>
      <div class="header-meta">Pay Period: ${periodLabel} (${monthStr})</div>
    </div>
    <div class="content">
      <div class="greeting">
        Dear <strong>${empName}</strong>,
        <br><br>
        Your official payslip statement for <strong>${monthStr}</strong> at <strong>${companyName}</strong> has been processed and is attached to this email as a PDF document.
      </div>

      <div class="payout-box">
        <div class="payout-label">NET PAY</div>
        <div class="payout-amount">${this.formatMoney(freshPayslip.netSalary, currency)}</div>
      </div>

      <div class="summary-box">
        <div class="row">
          <span class="row-label">Base Monthly Salary:</span>
          <span class="row-val" style="color: #047857;">+${this.formatMoney(freshPayslip.baseSalary, currency)}</span>
        </div>
        <div class="row">
          <span class="row-label">Overstay / Overtime Addition:</span>
          <span class="row-val" style="color: #047857;">+${this.formatMoney(freshPayslip.overtimeEarnings || 0, currency)}</span>
        </div>
        <div class="row">
          <span class="row-label">Gross pay:</span>
          <span class="row-val">${this.formatMoney(freshPayslip.grossSalary || (freshPayslip.baseSalary + (freshPayslip.overtimeEarnings || 0)), currency)}</span>
        </div>
        <div class="row">
          <span class="row-label">Total Penalties & Deductions:</span>
          <span class="row-val-alert">-${this.formatMoney(freshPayslip.totalDeductions, currency)}</span>
        </div>
        <div class="row">
          <span class="row-label">Days Present:</span>
          <span class="row-val">${freshPayslip.totalPresentDays} Days</span>
        </div>
        <div class="row">
          <span class="row-label">Hours Logged:</span>
          <span class="row-val">${freshPayslip.totalWorkHours} Hours</span>
        </div>
        <div class="row">
          <span class="row-label">Late Instances:</span>
          <span class="row-val">${freshPayslip.totalLateDays}</span>
        </div>
        <div class="row">
          <span class="row-label">Attendance & Conduct Grade:</span>
          <span class="row-val" style="color: #0f172a; font-weight: bold;">${employeeGrade}</span>
        </div>
      </div>

      <!-- ITEMIZED AUDIT TRAIL TABLE IN EMAIL -->
      <div style="margin-top: 22px; margin-bottom: 22px;">
        <div style="font-size: 12px; font-weight: bold; color: #0f172a; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 8px;">
          📋 Itemized Attendance, Penalties & Overstay Records
        </div>
        <table style="width: 100%; border-collapse: collapse; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; font-size: 12px;">
          <thead>
            <tr style="background-color: #f1f5f9; text-align: left; color: #475569; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
              <th style="padding: 9px 12px; border-bottom: 1px solid #cbd5e1;">Date & Time</th>
              <th style="padding: 9px 12px; border-bottom: 1px solid #cbd5e1;">Category</th>
              <th style="padding: 9px 12px; border-bottom: 1px solid #cbd5e1;">Details / Reason</th>
              <th style="padding: 9px 12px; border-bottom: 1px solid #cbd5e1; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${auditTrailRowsHtml}
          </tbody>
        </table>
      </div>

      <div style="background-color: #f1f5f9; border-radius: 8px; padding: 14px 16px; margin: 18px 0; border: 1px solid #e2e8f0;">
        <div style="font-size: 13px; font-weight: bold; color: #0f172a; margin-bottom: 4px;">📎 Official PDF Payslip Attached</div>
        <div style="font-size: 12px; color: #64748b; line-height: 1.5;">Your itemized payslip is attached directly to this email as <strong>Payslip-${freshPayslip.employee.employeeCode || freshPayslip.employee.firstName}-${monthStr}.pdf</strong>. You can open, save, or print it right from your inbox without needing to access any external links.</div>
      </div>

      <div class="notice">
        For any inquiries regarding your remuneration, attendance, or deductions, please contact the HR / Accounts Department.
        <br><br>
        <strong>${companyName}</strong> • TimeLogic Payroll Systems
      </div>
    </div>
  </div>
</body>
</html>
    `;

    let emailSent = false;
    let messageId = null;
    let errorDetail = null;

    try {
      let transporter;
      // Priority: 1. Org-specific SMTP → 2. Global env SMTP → 3. jsonTransport (dev fallback)
      const org = freshPayslip.organization;
      const smtpHost = org.smtpHost || process.env.SMTP_HOST;
      const smtpPort = parseInt(org.smtpPort || process.env.SMTP_PORT || '587', 10);
      const smtpUser = org.smtpUser || process.env.SMTP_USER;
      const smtpPass = org.smtpPass || process.env.SMTP_PASS;
      const smtpSecure = org.smtpSecure || smtpPort === 465;

      if (smtpHost && smtpUser && smtpPass) {
        transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          auth: { user: smtpUser, pass: smtpPass },
        });
      } else {
        // Fallback to jsonTransport when external SMTP credentials are not yet configured in environment
        transporter = nodemailer.createTransport({
          jsonTransport: true,
        });
      }

      // Automatically BCC sender/HR address so organization retains a live copy in Zoho Mail
      let bccAddress = null;
      const rawFrom = org.smtpFrom || process.env.SMTP_FROM;
      if (rawFrom) {
        const match = rawFrom.match(/<([^>]+)>/);
        bccAddress = match ? match[1].trim() : (rawFrom.includes('@') ? rawFrom.trim() : null);
      }
      if (!bccAddress && org.smtpUser && org.smtpUser.includes('@') && !org.smtpUser.includes('smtp-brevo.com')) {
        bccAddress = org.smtpUser.trim();
      }

      const mailOptions = {
        from: org.smtpFrom || process.env.SMTP_FROM || `"${companyName} Payroll" <payroll@timelogic.app>`,
        to: email,
        subject,
        html: htmlBody,
        ...(bccAddress && bccAddress.toLowerCase() !== email.toLowerCase() ? { bcc: bccAddress } : {}),
        attachments: [
          {
            filename: `Payslip-${freshPayslip.employee.employeeCode || freshPayslip.employee.firstName}-${monthStr}.pdf`,
            path: pdfPath,
            contentType: 'application/pdf',
          },
        ],
      };

      const info = await transporter.sendMail(mailOptions);
      emailSent = true;
      messageId = info.messageId || `EMAIL_${Date.now()}`;
      logger.info(`Payslip email dispatched successfully to ${email} (BCC: ${bccAddress || 'none'}) for payslip ${freshPayslip.id}`);
    } catch (mailErr) {
      errorDetail = mailErr.message;
      logger.error(`Error sending payslip email to ${email}:`, mailErr);
    }

    const updated = await prisma.payslipRecord.update({
      where: { id: payslip.id },
      data: {
        status: emailSent ? 'SENT' : 'GENERATED',
        whatsappStatus: emailSent ? 'SENT' : 'FAILED',
        whatsappSentAt: emailSent ? new Date() : null,
        whatsappMessageId: messageId,
        whatsappError: errorDetail,
      },
    });

    return {
      success: emailSent,
      status: updated.whatsappStatus,
      email,
      messageId,
      error: errorDetail,
    };
  }

  /**
   * Complete monthly payout: calculates payroll, generates fresh PDFs, and dispatches to all employees via email
   */
  async completeMonthlyPayout(orgId, year, month) {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);

    // 1. Recalculate payroll for the month
    const calcResult = await this.calculateMonthlyPayroll(orgId, y, m);

    // 2. Fetch all payslips
    const payslips = await prisma.payslipRecord.findMany({
      where: { orgId, year: y, month: m },
      include: { employee: true },
    });

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const p of payslips) {
      try {
        const res = await this.sendPayslipEmail(p.id);
        if (res.status === 'SKIPPED') skipped += 1;
        else if (res.success) sent += 1;
        else failed += 1;
      } catch (err) {
        logger.error(`Failed to send email for payslip ${p.id}:`, err);
        failed += 1;
      }
    }

    return {
      success: true,
      total: payslips.length,
      sent,
      failed,
      skipped,
      periodLabel: calcResult.periodLabel,
    };
  }

  /**
   * Legacy WhatsApp compatibility wrappers (now forward directly to Email & Complete Payout)
   */
  async sendPayslipWhatsApp(payslipId, options = {}) {
    return this.sendPayslipEmail(payslipId, options);
  }

  async batchSendMonthlyWhatsApp(orgId, year, month) {
    return this.completeMonthlyPayout(orgId, year, month);
  }

  /**
   * Automated payday background cron:
   * Automatic background email dispatch is completely deactivated per organization policy.
   * Emails are dispatched exclusively on-demand when the Admin clicks "Complete Payout" or the individual employee mail icon.
   */
  async executeAutomatedPaydayCron() {
    logger.info('[Payroll] Automatic background email dispatch is disabled per organization policy. Payslip emails are dispatched exclusively on-demand by the admin via Complete Payout or the employee Mail icon.');
    return [];
  }
}

module.exports = new PayrollService();
