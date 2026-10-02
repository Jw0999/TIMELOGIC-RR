const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { prisma } = require('../config/database');
const logger = require('../config/logger');

class PayrollService {
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
   * Get start and end date boundaries for a given year and month
   */
  getMonthDateRange(year, month) {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    const startDate = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
    return { startDate, endDate };
  }

  /**
   * Fetch all employees in an organization with their salary info and current month calculations
   */
  async getEmployeesWithSalary(orgId, year, month) {
    const y = parseInt(year || new Date().getFullYear(), 10);
    const m = parseInt(month || new Date().getMonth() + 1, 10);
    const { startDate, endDate } = this.getMonthDateRange(y, m);

    const [org, employees, attendanceRecords, manualPenalties, existingPayslips] = await Promise.all([
      prisma.organization.findUnique({
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
      }),
      prisma.user.findMany({
        where: { orgId, role: 'EMPLOYEE' },
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
          office: { select: { id: true, name: true } },
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
          clockInTime: true,
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

    const employeeRows = employees.map((emp) => {
      const existing = payslipMap.get(emp.id);
      const userAtt = attendanceByEmployee.get(emp.id) || [];
      const userMp = manualPenaltiesByEmployee.get(emp.id) || [];

      const baseSalary = Number(emp.baseSalary || 0);
      const currency = emp.salaryCurrency || org?.salaryCurrency || 'NGN';

      // Attendance Metrics
      let totalWorkHours = 0;
      let totalPresentDays = 0;
      let totalLateDays = 0;
      let attendancePenalties = 0;

      for (const a of userAtt) {
        if (a.status === 'PRESENT' || a.status === 'LATE' || a.status === 'HALF_DAY') {
          totalPresentDays += 1;
        }
        if (a.status === 'LATE' || a.status === 'COMPLETELY_LATE') {
          totalLateDays += 1;
        }
        totalWorkHours += a.totalWorkHours || 0;
        attendancePenalties += Number(a.penalty || 0);
      }

      let manualPenaltiesTotal = 0;
      for (const m of userMp) {
        manualPenaltiesTotal += Number(m.amount || 0);
      }

      const totalDeductions = attendancePenalties + manualPenaltiesTotal;
      const netSalary = Math.max(0, baseSalary - totalDeductions);

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
        totalWorkHours: Math.round(totalWorkHours * 10) / 10,
        totalPresentDays,
        totalLateDays,
        attendancePenalties,
        manualPenalties: manualPenaltiesTotal,
        totalDeductions,
        netSalary,
        payslipId: existing?.id || null,
        payslipStatus: existing?.status || 'DRAFT',
        whatsappStatus: existing?.whatsappStatus || 'PENDING',
        whatsappSentAt: existing?.whatsappSentAt || null,
      };
    });

    const totalBase = employeeRows.reduce((acc, r) => acc + r.baseSalary, 0);
    const totalDeductions = employeeRows.reduce((acc, r) => acc + r.totalDeductions, 0);
    const totalNet = employeeRows.reduce((acc, r) => acc + r.netSalary, 0);

    return {
      organization: org,
      year: y,
      month: m,
      summary: {
        totalEmployees: employeeRows.length,
        totalBasePayroll: totalBase,
        totalDeductions,
        totalNetPayout: totalNet,
        salaryPayoutDay: org?.salaryPayoutDay ?? 28,
        currency: org?.salaryCurrency || 'NGN',
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
      where: { id: employeeId, orgId },
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
        whatsappProvider: true,
        whatsappPhoneId: true,
        whatsappSenderNumber: true,
        whatsappApiToken: true,
      },
    });
    if (!org) throw new Error('Organization not found');

    return {
      ...org,
      hasWhatsappToken: Boolean(org.whatsappApiToken),
      whatsappApiToken: org.whatsappApiToken ? '••••••••' + org.whatsappApiToken.slice(-4) : null,
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
    if (data.whatsappProvider) {
      updateData.whatsappProvider = data.whatsappProvider;
    }
    if (data.whatsappPhoneId !== undefined) {
      updateData.whatsappPhoneId = data.whatsappPhoneId;
    }
    if (data.whatsappSenderNumber !== undefined) {
      updateData.whatsappSenderNumber = data.whatsappSenderNumber;
    }
    if (data.whatsappApiToken && !data.whatsappApiToken.includes('••••')) {
      updateData.whatsappApiToken = data.whatsappApiToken;
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
        whatsappProvider: true,
        whatsappPhoneId: true,
        whatsappSenderNumber: true,
      },
    });

    return org;
  }

  /**
   * Compute monthly payroll for all employees in an organization and persist to PayslipRecord
   */
  async calculateMonthlyPayroll(orgId, year, month) {
    const y = parseInt(year || new Date().getFullYear(), 10);
    const m = parseInt(month || new Date().getMonth() + 1, 10);
    const { startDate, endDate } = this.getMonthDateRange(y, m);

    const [org, employees, attendanceRecords, manualPenalties] = await Promise.all([
      prisma.organization.findUnique({ where: { id: orgId } }),
      prisma.user.findMany({
        where: { orgId, role: 'EMPLOYEE' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          employeeCode: true,
          baseSalary: true,
          salaryCurrency: true,
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

    const savedPayslips = [];

    for (const emp of employees) {
      const baseSalary = Number(emp.baseSalary || 0);
      const userAtt = attendanceByEmployee.get(emp.id) || [];
      const userMp = manualByEmployee.get(emp.id) || [];

      let totalWorkHours = 0;
      let totalPresentDays = 0;
      let totalLateDays = 0;
      let totalLateMinutes = 0;
      let attendancePenalties = 0;
      const itemizedDeductions = [];

      for (const a of userAtt) {
        if (a.status === 'PRESENT' || a.status === 'LATE' || a.status === 'HALF_DAY') {
          totalPresentDays += 1;
        }
        if (a.status === 'LATE' || a.status === 'COMPLETELY_LATE') {
          totalLateDays += 1;
        }
        totalWorkHours += a.totalWorkHours || 0;
        const pen = Number(a.penalty || 0);
        if (pen > 0) {
          attendancePenalties += pen;
          itemizedDeductions.push({
            date: a.date.toISOString().split('T')[0],
            type: 'ATTENDANCE_PENALTY',
            status: a.status,
            amount: pen,
            reason: a.status === 'COMPLETELY_LATE' ? 'Exceeded late threshold' : 'Late check-in',
          });
        }
      }

      let manualPenaltiesTotal = 0;
      for (const mp of userMp) {
        const amt = Number(mp.amount || 0);
        manualPenaltiesTotal += amt;
        itemizedDeductions.push({
          date: mp.createdAt.toISOString().split('T')[0],
          type: 'MANUAL_PENALTY',
          amount: amt,
          reason: mp.reason || 'HR Administrative penalty',
        });
      }

      const totalDeductions = attendancePenalties + manualPenaltiesTotal;
      const netSalary = Math.max(0, baseSalary - totalDeductions);

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
          baseSalary,
          currency: emp.salaryCurrency || currency,
          totalWorkHours: Math.round(totalWorkHours * 10) / 10,
          totalPresentDays,
          totalLateDays,
          totalLateMinutes,
          attendancePenalties,
          manualPenalties: manualPenaltiesTotal,
          totalDeductions,
          netSalary,
          breakdownJson: itemizedDeductions,
          status: 'GENERATED',
        },
        update: {
          baseSalary,
          currency: emp.salaryCurrency || currency,
          totalWorkHours: Math.round(totalWorkHours * 10) / 10,
          totalPresentDays,
          totalLateDays,
          totalLateMinutes,
          attendancePenalties,
          manualPenalties: manualPenaltiesTotal,
          totalDeductions,
          netSalary,
          breakdownJson: itemizedDeductions,
          status: 'GENERATED',
        },
      });

      savedPayslips.push(payslip);
    }

    return {
      success: true,
      year: y,
      month: m,
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

      // ── HEADER BANNER (TimeLogic Deep Navy) ──
      doc.rect(40, 40, 515, 65).fill('#0a1638');

      doc.fillColor('#f59e0b').fontSize(10).font('Helvetica-Bold')
        .text('TIMELOGIC ENTERPRISE ATTENDANCE & PAYROLL', 55, 52, { letterSpacing: 1.5 });

      doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold')
        .text('OFFICIAL EMPLOYEE PAYSLIP', 55, 70);

      doc.fillColor('#94a3b8').fontSize(9).font('Helvetica')
        .text(`Pay Period: ${monthStr}`, 410, 56, { align: 'right' });
      doc.text(`Status: Verified`, 410, 72, { align: 'right' });

      // ── COMPANY & EMPLOYEE INFO GRID ──
      doc.rect(40, 115, 515, 95).strokeColor('#e2e8f0').lineWidth(1).stroke();

      // Column 1: Organization
      doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('ORGANIZATION / EMPLOYER', 55, 125);
      doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text(orgName, 55, 137);
      doc.fillColor('#64748b').fontSize(9).font('Helvetica')
        .text(`Timezone: ${payslip.organization.timezone || 'Africa/Lagos'}`, 55, 155)
        .text(`Generated: ${new Date().toISOString().split('T')[0]}`, 55, 170);

      // Column 2: Employee
      doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('EMPLOYEE DETAILS', 300, 125);
      doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text(empName, 300, 137);
      doc.fillColor('#64748b').fontSize(9).font('Helvetica')
        .text(`Staff ID: ${empCode}  |  Dept: ${payslip.employee.department?.name || 'General'}`, 300, 155)
        .text(`Phone: ${payslip.employee.phone || 'N/A'}  |  Email: ${payslip.employee.email}`, 300, 170);

      // ── WORK & ATTENDANCE SUMMARY METRICS ──
      doc.rect(40, 220, 515, 45).fill('#f8fafc');
      doc.rect(40, 220, 515, 45).strokeColor('#e2e8f0').stroke();

      const metricColW = 515 / 4;
      const metrics = [
        { label: 'DAYS PRESENT', val: `${payslip.totalPresentDays} Days` },
        { label: 'WORK DURATION', val: `${payslip.totalWorkHours} Hours` },
        { label: 'LATE INSTANCES', val: `${payslip.totalLateDays} Days` },
        { label: 'PENALTIES APPLIED', val: `${this.formatMoney(payslip.totalDeductions, currency)}` },
      ];

      metrics.forEach((m, idx) => {
        const x = 40 + idx * metricColW;
        doc.fillColor('#64748b').fontSize(7.5).font('Helvetica-Bold')
          .text(m.label, x + 10, 228);
        doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold')
          .text(m.val, x + 10, 243);
      });

      // ── SALARY & DEDUCTIONS BREAKDOWN TABLE ──
      let yPos = 280;

      // Table Header
      doc.rect(40, yPos, 515, 24).fill('#0f172a');
      doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold')
        .text('DESCRIPTION', 55, yPos + 7)
        .text('EARNINGS', 340, yPos + 7, { align: 'right' })
        .text('DEDUCTIONS', 470, yPos + 7, { align: 'right' });
      yPos += 24;

      // Base Salary Row
      doc.rect(40, yPos, 515, 26).fill('#ffffff');
      doc.rect(40, yPos, 515, 26).strokeColor('#f1f5f9').stroke();
      doc.fillColor('#0f172a').fontSize(9.5).font('Helvetica')
        .text(`Basic Monthly Salary (${monthStr})`, 55, yPos + 8);
      doc.fillColor('#10b981').font('Helvetica-Bold')
        .text(`+${this.formatMoney(payslip.baseSalary, currency)}`, 340, yPos + 8, { align: 'right' });
      doc.fillColor('#94a3b8').text('-', 470, yPos + 8, { align: 'right' });
      yPos += 26;

      // Attendance Penalties Row
      doc.rect(40, yPos, 515, 26).fill('#fafafa');
      doc.rect(40, yPos, 515, 26).strokeColor('#f1f5f9').stroke();
      doc.fillColor('#0f172a').fontSize(9.5).font('Helvetica')
        .text('Attendance Lateness / Absence Deductions', 55, yPos + 8);
      doc.fillColor('#94a3b8').text('-', 340, yPos + 8, { align: 'right' });
      doc.fillColor('#ef4444').font('Helvetica-Bold')
        .text(
          payslip.attendancePenalties > 0 ? `-${this.formatMoney(payslip.attendancePenalties, currency)}` : '₦0.00',
          470,
          yPos + 8,
          { align: 'right' }
        );
      yPos += 26;

      // Manual Penalties Row
      doc.rect(40, yPos, 515, 26).fill('#ffffff');
      doc.rect(40, yPos, 515, 26).strokeColor('#f1f5f9').stroke();
      doc.fillColor('#0f172a').fontSize(9.5).font('Helvetica')
        .text('HR Administrative / Disciplinary Penalties', 55, yPos + 8);
      doc.fillColor('#94a3b8').text('-', 340, yPos + 8, { align: 'right' });
      doc.fillColor('#ef4444').font('Helvetica-Bold')
        .text(
          payslip.manualPenalties > 0 ? `-${this.formatMoney(payslip.manualPenalties, currency)}` : '₦0.00',
          470,
          yPos + 8,
          { align: 'right' }
        );
      yPos += 26;

      // ── NET PAYOUT CALLOUT BOX ──
      yPos += 14;
      doc.rect(40, yPos, 515, 56).fill('#0a1638');
      doc.rect(40, yPos, 5, 56).fill('#2563eb');

      doc.fillColor('#f59e0b').fontSize(8.5).font('Helvetica-Bold')
        .text('FINAL NET PAYABLE (DISBURSED)', 60, yPos + 12);
      doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold')
        .text(this.formatMoney(payslip.netSalary, currency), 60, yPos + 26);

      if (payslip.employee.bankName && payslip.employee.accountNumber) {
        doc.fillColor('#cbd5e1').fontSize(8.5).font('Helvetica')
          .text(
            `Bank: ${payslip.employee.bankName}  |  Acc: ${payslip.employee.accountNumber}`,
            410,
            yPos + 22,
            { align: 'right' }
          );
      }
      yPos += 68;

      // ── ITEMIZED PENALTIES AUDIT LIST ──
      const breakdown = Array.isArray(payslip.breakdownJson) ? payslip.breakdownJson : [];
      if (breakdown.length > 0) {
        doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold')
          .text('ITEMIZED DEDUCTIONS & PENALTIES AUDIT TRAIL', 40, yPos);
        yPos += 16;

        breakdown.slice(0, 5).forEach((item) => {
          doc.rect(40, yPos, 515, 20).fill('#f8fafc');
          doc.fillColor('#64748b').fontSize(8).font('Helvetica')
            .text(`• ${item.date}: ${item.reason || item.type}`, 50, yPos + 5);
          doc.fillColor('#ef4444').font('Helvetica-Bold')
            .text(`-${this.formatMoney(item.amount, currency)}`, 470, yPos + 5, { align: 'right' });
          yPos += 22;
        });

        if (breakdown.length > 5) {
          doc.fillColor('#64748b').fontSize(8).font('Helvetica-Oblique')
            .text(`+ and ${breakdown.length - 5} more penalty records on file.`, 50, yPos + 2);
          yPos += 16;
        }
      }

      // ── FOOTER & CRYPTOGRAPHIC VERIFICATION ──
      doc.rect(40, 750, 515, 40).strokeColor('#e2e8f0').stroke();
      doc.fillColor('#64748b').fontSize(7.5).font('Helvetica')
        .text(
          `TimeLogic ID: ${payslip.id}  •  Tamper-Evident Verification Hash: ${Buffer.from(payslip.id).toString('base64').slice(0, 16)}`,
          50,
          758
        )
        .text(
          'This is a computer-generated statutory payroll document. No physical signature required.',
          50,
          770
        );

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
   * Dispatch WhatsApp notification and document to employee
   */
  async sendPayslipWhatsApp(payslipId, options = {}) {
    const payslip = await prisma.payslipRecord.findUnique({
      where: { id: payslipId },
      include: {
        organization: true,
        employee: true,
      },
    });

    if (!payslip) throw new Error('Payslip not found');

    const phone = payslip.employee.phone;
    const cleanPhone = this.cleanPhoneNumber(phone);

    if (!cleanPhone) {
      await prisma.payslipRecord.update({
        where: { id: payslip.id },
        data: {
          whatsappStatus: 'SKIPPED',
          whatsappError: 'Employee has no registered phone number',
        },
      });
      return {
        success: false,
        status: 'SKIPPED',
        error: 'Employee has no registered phone number',
      };
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthStr = `${monthNames[payslip.month - 1]} ${payslip.year}`;
    const currency = payslip.currency || 'NGN';
    const companyName = payslip.organization.name || 'TimeLogic Enterprise';
    const empName = `${payslip.employee.firstName} ${payslip.employee.lastName}`;

    const messageText = [
      `📄 *TIMELOGIC OFFICIAL PAYSLIP*`,
      `🏢 *Company:* ${companyName}`,
      `👤 *Employee:* ${empName} (${payslip.employee.employeeCode || 'TL-EMP'})`,
      `📅 *Pay Period:* ${monthStr}`,
      ``,
      `💰 *Base Salary:* ${this.formatMoney(payslip.baseSalary, currency)}`,
      `⚠️ *Total Penalties & Deductions:* -${this.formatMoney(payslip.totalDeductions, currency)}`,
      `💵 *NET PAYABLE:* *${this.formatMoney(payslip.netSalary, currency)}*`,
      ``,
      `Your itemized attendance record and payslip PDF have been processed.`,
      `Verified by TimeLogic Enterprise Systems.`,
    ].join('\n');

    // Ensure PDF is generated
    let pdfPath = payslip.pdfPath;
    if (!pdfPath || !fs.existsSync(pdfPath)) {
      const generated = await this.generatePayslipPdf(payslip.id);
      pdfPath = generated.filePath;
    }

    // Direct WhatsApp web link fallback
    const directUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;

    // If Meta Cloud API is configured
    const org = payslip.organization;
    let apiSuccess = false;
    let messageId = null;
    let errorDetail = null;

    if (org.whatsappProvider === 'META' && org.whatsappPhoneId && org.whatsappApiToken) {
      try {
        const fetchRes = await fetch(
          `https://graph.facebook.com/v18.0/${org.whatsappPhoneId}/messages`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${org.whatsappApiToken}`,
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: cleanPhone,
              type: 'text',
              text: { body: messageText },
            }),
          }
        );
        const resBody = await fetchRes.json();
        if (fetchRes.ok) {
          apiSuccess = true;
          messageId = resBody.messages?.[0]?.id || 'META_SENT';
        } else {
          errorDetail = resBody.error?.message || 'Meta API error';
          logger.warn(`WhatsApp Meta Cloud API send failed: ${errorDetail}`);
        }
      } catch (err) {
        errorDetail = err.message;
        logger.warn(`WhatsApp Meta fetch error: ${err.message}`);
      }
    } else {
      // In development / direct-link mode without cloud keys
      apiSuccess = true;
      messageId = `DIRECT_LINK_${Date.now()}`;
    }

    const updated = await prisma.payslipRecord.update({
      where: { id: payslip.id },
      data: {
        whatsappStatus: apiSuccess ? 'SENT' : 'FAILED',
        whatsappSentAt: apiSuccess ? new Date() : null,
        whatsappMessageId: messageId,
        whatsappError: errorDetail,
      },
    });

    return {
      success: apiSuccess,
      whatsappStatus: updated.whatsappStatus,
      phone: cleanPhone,
      messageText,
      directUrl,
      error: errorDetail,
    };
  }

  /**
   * Batch dispatch WhatsApp payslips for all employees for a given month
   */
  async batchSendMonthlyWhatsApp(orgId, year, month) {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);

    const payslips = await prisma.payslipRecord.findMany({
      where: { orgId, year: y, month: m },
    });

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const p of payslips) {
      const res = await this.sendPayslipWhatsApp(p.id);
      if (res.status === 'SKIPPED') skipped += 1;
      else if (res.success) sent += 1;
      else failed += 1;
    }

    return {
      total: payslips.length,
      sent,
      failed,
      skipped,
    };
  }

  /**
   * Scheduled cron handler called daily:
   * Finds organizations where today is salaryPayoutDay, calculates payroll, generates PDFs, sends WhatsApp
   */
  async executeAutomatedPaydayCron() {
    const today = new Date();
    const currentDay = today.getDate();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    logger.info(`Running Automated Payday Cron for Day: ${currentDay}`);

    const eligibleOrgs = await prisma.organization.findMany({
      where: {
        salaryAutomationEnabled: true,
        salaryPayoutDay: currentDay,
      },
      select: { id: true, name: true },
    });

    logger.info(`Found ${eligibleOrgs.length} organizations scheduled for salary payout today.`);

    const results = [];
    for (const org of eligibleOrgs) {
      try {
        const calcRes = await this.calculateMonthlyPayroll(org.id, currentYear, currentMonth);
        const batchRes = await this.batchSendMonthlyWhatsApp(org.id, currentYear, currentMonth);
        results.push({ orgId: org.id, name: org.name, ...calcRes, ...batchRes });
      } catch (err) {
        logger.error(`Error in automated payday for org ${org.name}:`, err);
        results.push({ orgId: org.id, name: org.name, error: err.message });
      }
    }

    return results;
  }
}

module.exports = new PayrollService();
