const { v4: uuidv4 } = require('uuid');
const { prisma } = require('../config/database');
const ExcelJS = require('exceljs');
const { dateOnly } = require('../utils/attendanceClock');
const {
  PALETTE,
  BORDER_THIN,
  BORDER_MEDIUM,
  sanitizeSheetName,
  renderHeaderBanner,
  renderKpiCards,
  renderSectionHeader,
  renderTableHeader,
  formatDataRow,
  autoFitColumns,
  applySheetSetup,
} = require('../utils/excelStyler');

function csvEscape(value) {
  const text = value == null ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function isoDate(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function isoUtcDateTime(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString();
}

function formatTime(d) {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

function formatDateTime(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

function reportDate(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00.000Z`);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw Object.assign(new Error('Invalid report date.'), { status: 400 });
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
}

class ReportService {
  async generateDaily(date, adminId, orgId) {
    const d = reportDate(date);
    return this._generate('daily', d, d, adminId, orgId);
  }

  async generateWeekly(weekStart, adminId, orgId) {
    const start = reportDate(weekStart);
    const end = new Date(start); end.setUTCDate(end.getUTCDate() + 6);
    return this._generate('weekly', start, end, adminId, orgId);
  }

  async generateMonthly(year, month, adminId, orgId) {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0));
    return this._generate('monthly', start, end, adminId, orgId);
  }

  async generateCustom(startDate, endDate, adminId, orgId) {
    return this._generate('custom', reportDate(startDate), reportDate(endDate), adminId, orgId);
  }

  async generateByDepartment(departmentId, startDate, endDate, adminId, orgId) {
    const employees = await prisma.user.findMany({
      where: { departmentId, orgId, status: 'ACTIVE' },
      select: { id: true },
    });
    const empIds = employees.map((e) => e.id);
    return this._generate('department', reportDate(startDate), reportDate(endDate), adminId, orgId, { employeeId: { in: empIds } });
  }

  async generateByEmployee(employeeId, startDate, endDate, adminId, orgId) {
    const employee = await prisma.user.findFirst({ where: { id: employeeId, orgId }, select: { id: true } });
    if (!employee) throw Object.assign(new Error('Employee not found.'), { status: 404 });
    return this._generate('employee', reportDate(startDate), reportDate(endDate), adminId, orgId, { employeeId });
  }

  // ─── Comprehensive export with full database ───────────────────────────────

  async buildFullExport(orgId) {
    const isSuperAdminExport = !orgId || orgId === 'platform-org';
    const targetOrgFilter = isSuperAdminExport ? { id: { not: 'platform-org' } } : { id: orgId };
    const orgFilter = isSuperAdminExport ? {} : { orgId };
    const empOrgFilter = isSuperAdminExport ? {} : { employee: { orgId } };
    const sessionOrgFilter = isSuperAdminExport ? {} : { office: { orgId } };
    const scanOrgFilter = isSuperAdminExport ? {} : { employee: { orgId } };
    const scopedOrgId = isSuperAdminExport ? null : orgId;
    const scopedUserIds = scopedOrgId
      ? (await prisma.user.findMany({ where: { orgId: scopedOrgId }, select: { id: true } })).map((user) => user.id)
      : null;

    const [
      organizations,
      employees,
      attendanceRecords,
      leaveRequests,
      breakRecords,
      fraudAlerts,
      sessions,
      scanAttempts,
      studentRecords,
      studentAttendance,
      adminLoginEvents,
      screenshotLogs,
      securitySettings,
      emergencyControls,
      attendanceReports,
      notificationLogs,
      manualPenalties,
      leaveBalances,
    ] = await Promise.all([
      prisma.organization.findMany({
        where: targetOrgFilter,
        include: {
          offices: {
            select: {
              id: true, name: true, address: true, timezone: true,
              openTime: true, closeTime: true, graceMinutes: true, lateAfterMinutes: true,
              gracePenalty: true, latePenalty: true, completelyLatePenalty: true,
              absentPenalty: true, overstayPenalty: true,
            },
          },
          departments: { select: { id: true, name: true } },
          _count: { select: { users: true, offices: true, departments: true, students: true } },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.user.findMany({
        where: { ...orgFilter, role: { in: ['EMPLOYEE', 'ADMIN', 'SUPER_ADMIN'] } },
        select: {
          id: true, orgId: true, firstName: true, lastName: true, email: true, employeeCode: true,
          role: true, shiftType: true, status: true, checkInMethod: true, phone: true,
          officeId: true, office: { select: { name: true } },
          createdAt: true,
          organization: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
          profileImageUrl: true, lastLoginAt: true,
        },
        orderBy: [{ organization: { name: 'asc' } }, { firstName: 'asc' }],
      }),
      prisma.attendanceRecord.findMany({
        where: empOrgFilter,
        include: {
          employee: {
            select: {
              id: true, firstName: true, lastName: true, email: true, employeeCode: true, status: true,
              orgId: true,
              organization: { select: { id: true, name: true } },
              department: { select: { name: true } },
              office: { select: { name: true } },
            },
          },
          session: { select: { sessionName: true, startTime: true, endTime: true, officeName: true } },
          checkInRecorder: { select: { firstName: true, lastName: true, email: true } },
          checkOutRecorder: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.leaveRequest.findMany({
        where: empOrgFilter,
        include: {
          employee: {
            select: {
              id: true, firstName: true, lastName: true, employeeCode: true,
              orgId: true,
              organization: { select: { id: true, name: true } },
            },
          },
          approver: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.breakRecord.findMany({
        where: empOrgFilter,
        include: {
          employee: {
            select: {
              id: true, firstName: true, lastName: true, employeeCode: true,
              orgId: true,
              organization: { select: { id: true, name: true } },
            },
          },
          attendanceRecord: { select: { date: true, session: { select: { sessionName: true } } } },
        },
        orderBy: { startTime: 'desc' },
      }),
      prisma.fraudAlert.findMany({
        where: empOrgFilter,
        include: {
          employee: {
            select: {
              id: true, firstName: true, lastName: true, employeeCode: true,
              orgId: true,
              organization: { select: { id: true, name: true } },
            },
          },
          session: { select: { sessionName: true, startTime: true } },
          resolver: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.attendanceSession.findMany({
        where: sessionOrgFilter,
        select: {
          id: true, sessionName: true, officeName: true, orgName: true, status: true,
          startTime: true, endTime: true, createdAt: true,
          office: { select: { name: true, orgId: true, organization: { select: { id: true, name: true } } } },
          _count: { select: { attendanceRecords: true, scanAttempts: true, fraudAlerts: true } },
        },
        orderBy: { startTime: 'desc' },
      }),
      prisma.scanAttempt.findMany({
        where: scanOrgFilter,
        include: {
          employee: { select: { firstName: true, lastName: true, employeeCode: true, orgId: true, organization: { select: { id: true, name: true } } } },
          session: { select: { sessionName: true, startTime: true } },
        },
        orderBy: { timestamp: 'desc' },
      }),
      prisma.student.findMany({
        where: orgFilter,
        include: { organization: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.studentAttendance.findMany({
        where: scopedOrgId ? { student: { orgId: scopedOrgId } } : {},
        include: {
          student: { select: { studentCode: true, firstName: true, lastName: true, orgId: true, organization: { select: { id: true, name: true } } } },
          checkedInBy: { select: { firstName: true, lastName: true, email: true } },
          checkedOutBy: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { date: 'desc' },
      }),
      prisma.adminLoginEvent.findMany({
        where: orgFilter,
        include: {
          admin: { select: { firstName: true, lastName: true, email: true, organization: { select: { id: true, name: true } } } },
          organization: { select: { id: true, name: true } },
        },
        orderBy: { loggedInAt: 'desc' },
      }),
      prisma.screenshotLog.findMany({
        where: scopedUserIds ? { employeeId: { in: scopedUserIds } } : {},
        orderBy: { timestamp: 'desc' },
      }),
      prisma.securitySettings.findMany({
        where: scopedOrgId ? { office: { orgId: scopedOrgId } } : {},
        include: { office: { select: { name: true, orgId: true, organization: { select: { id: true, name: true } } } }, updater: { select: { firstName: true, lastName: true, email: true } } },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.emergencyControl.findMany({
        where: scopedOrgId ? { admin: { orgId: scopedOrgId } } : {},
        include: {
          admin: { select: { firstName: true, lastName: true, email: true, orgId: true } },
          sessions: { select: { session: { select: { sessionName: true, officeName: true } } } },
        },
        orderBy: { timestamp: 'desc' },
      }),
      prisma.attendanceReport.findMany({
        where: scopedOrgId ? { generator: { orgId: scopedOrgId } } : {},
        include: { generator: { select: { firstName: true, lastName: true, email: true } } },
        orderBy: { generatedAt: 'desc' },
      }),
      prisma.notificationLog.findMany({
        where: scopedUserIds ? { userId: { in: scopedUserIds } } : {},
        orderBy: { sentAt: 'desc' },
      }),
      prisma.manualPenalty.findMany({
        where: orgFilter,
        include: {
          employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, orgId: true, organization: { select: { id: true, name: true } } } },
          createdBy: { select: { firstName: true, lastName: true, email: true } },
          organization: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.leaveBalance.findMany({
        where: empOrgFilter,
        include: {
          employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, orgId: true, organization: { select: { id: true, name: true } } } },
        },
        orderBy: [{ year: 'desc' }, { leaveType: 'asc' }],
      }),
    ]);

    return {
      organizations,
      employees,
      attendanceRecords,
      leaveRequests,
      breakRecords,
      fraudAlerts,
      sessions,
      scanAttempts,
      studentRecords,
      studentAttendance,
      adminLoginEvents,
      screenshotLogs,
      securitySettings,
      emergencyControls,
      attendanceReports,
      notificationLogs,
      manualPenalties,
      leaveBalances,
    };
  }

  async exportToExcel(records, reportMeta) {
    // Legacy single-sheet export
    return this._buildExcelFromAttendance(records);
  }

  /**
   * Main Excel Export Gateway
   * Dispatches between Super Admin (Multi-Org Sheets) and Org Admin (Multi-Tab Scoped Workbook)
   */
  async exportFullToExcel(orgId) {
    const data = await this.buildFullExport(orgId);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'TimeLogic Enterprise';
    workbook.created = new Date();

    const isSuperAdmin = !orgId || orgId === 'platform-org';

    if (isSuperAdmin) {
      await this._renderSuperAdminExcel(workbook, data);
    } else {
      const targetOrg = data.organizations.find((o) => o.id === orgId) || { id: orgId, name: 'Organization' };
      await this._renderOrganizationExcel(workbook, data, targetOrg);
    }

    return this._writeExcelBuffer(workbook);
  }

  /**
   * Super Admin Excel Builder
   * Sheet 1 = System Overview (Cross-org performance with Excel formulas)
   * Sheet 2..N = One sheet per organization containing full organizational records
   */
  async _renderSuperAdminExcel(workbook, data) {
    const nowStr = formatDateTime(new Date());
    const usedSheetNames = new Set();

    // ──────────────────────────────────────────────────────────────────────────
    // Sheet 1: Master System Overview
    // ──────────────────────────────────────────────────────────────────────────
    const overviewSheet = workbook.addWorksheet('System Overview');
    usedSheetNames.add('system overview');

    renderHeaderBanner(overviewSheet, {
      title: 'TIMELOGIC ENTERPRISE — GLOBAL SYSTEM AUDIT REPORT',
      organizationName: 'All Registered Organizations',
      period: 'Comprehensive Historical Database',
      generatedAt: nowStr,
      totalCols: 14,
    });

    const totalOrgs = data.organizations.length;
    const totalStaff = data.employees.filter((e) => e.role === 'EMPLOYEE').length;
    const totalAdmins = data.employees.filter((e) => e.role === 'ADMIN').length;
    const totalRecords = data.attendanceRecords.length;
    const totalAutoPenalties = data.attendanceRecords.reduce((s, r) => s + (r.penalty || 0), 0) +
      data.breakRecords.reduce((s, b) => s + (b.penalty || 0), 0);
    const totalManualPenalties = data.manualPenalties.reduce((s, m) => s + (m.amount || 0), 0);
    const totalCombinedPenalties = totalAutoPenalties + totalManualPenalties;
    const totalHours = data.attendanceRecords.reduce((s, r) => s + (r.totalWorkHours || 0), 0);

    renderKpiCards(overviewSheet, [
      { label: 'Registered Orgs', value: totalOrgs, color: PALETTE.PRIMARY },
      { label: 'Active Workforce', value: totalStaff, color: 'FF166534' },
      { label: 'Admin Accounts', value: totalAdmins, color: 'FF5B21B6' },
      { label: 'Total Attendance Logs', value: totalRecords, color: PALETTE.PRIMARY },
      { label: 'Total Hours Worked', value: parseFloat(totalHours.toFixed(1)), numFmt: '#,##0.0" hrs"', color: 'FF0369A1' },
      { label: 'Combined Penalties', value: totalCombinedPenalties, numFmt: '"₦"#,##0.00', color: 'FF991B1B' },
    ], 14);

    renderSectionHeader(overviewSheet, 'CROSS-ORGANIZATION PERFORMANCE AUDIT', 14);

    const overviewHeaders = [
      'Organization Name', 'Industry', 'Timezone', 'Offices', 'Staff Count', 'Admins',
      'Total Records', 'Total Hours', 'Break (min)', 'Auto Penalty (NGN)', 'Manual Penalty (NGN)',
      'Total Penalties (NGN)', 'Open Alerts', 'Status',
    ];
    renderTableHeader(overviewSheet, overviewHeaders);

    const startRow = overviewSheet.lastRow.number + 1;

    data.organizations.forEach((org, idx) => {
      const orgStaff = data.employees.filter((e) => e.orgId === org.id && e.role === 'EMPLOYEE').length;
      const orgAdmins = data.employees.filter((e) => e.orgId === org.id && e.role === 'ADMIN').length;
      const orgAtt = data.attendanceRecords.filter((a) => a.employee?.orgId === org.id);
      const orgBreaks = data.breakRecords.filter((b) => b.employee?.orgId === org.id);
      const orgManuals = data.manualPenalties.filter((m) => m.orgId === org.id || m.employee?.orgId === org.id);
      const orgAlerts = data.fraudAlerts.filter((f) => f.employee?.orgId === org.id && (f.status === 'NEW' || f.status === 'INVESTIGATING')).length;

      const hours = orgAtt.reduce((s, r) => s + (r.totalWorkHours || 0), 0);
      const breakMins = orgAtt.reduce((s, r) => s + (r.totalBreakMinutes || 0), 0);
      const autoPen = orgAtt.reduce((s, r) => s + (r.penalty || 0), 0) + orgBreaks.reduce((s, b) => s + (b.penalty || 0), 0);
      const manPen = orgManuals.reduce((s, m) => s + (m.amount || 0), 0);
      const totalPen = autoPen + manPen;

      const row = overviewSheet.addRow([
        org.name || 'Unnamed',
        org.industry || 'General',
        org.timezone || 'Africa/Lagos',
        org.offices?.length || 1,
        orgStaff,
        orgAdmins,
        orgAtt.length,
        parseFloat(hours.toFixed(2)),
        breakMins,
        autoPen,
        manPen,
        totalPen,
        orgAlerts,
        'ACTIVE',
      ]);

      row.getCell(8).numFmt = '0.00" hrs"';
      row.getCell(9).numFmt = '#,##0';
      row.getCell(10).numFmt = '"₦"#,##0.00';
      row.getCell(11).numFmt = '"₦"#,##0.00';
      row.getCell(12).numFmt = '"₦"#,##0.00';

      formatDataRow(row, idx % 2 === 1, 14);
    });

    const endRow = overviewSheet.lastRow.number;

    if (data.organizations.length > 0) {
      const summaryRow = overviewSheet.addRow([
        'TOTALS & AVERAGES', '', '', '',
        { formula: `SUM(E${startRow}:E${endRow})` },
        { formula: `SUM(F${startRow}:F${endRow})` },
        { formula: `SUM(G${startRow}:G${endRow})` },
        { formula: `SUM(H${startRow}:H${endRow})` },
        { formula: `SUM(I${startRow}:I${endRow})` },
        { formula: `SUM(J${startRow}:J${endRow})` },
        { formula: `SUM(K${startRow}:K${endRow})` },
        { formula: `SUM(L${startRow}:L${endRow})` },
        { formula: `SUM(M${startRow}:M${endRow})` },
        '',
      ]);
      summaryRow.height = 24;
      summaryRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: PALETTE.PRIMARY } };
        cell.border = {
          top: { style: 'thin', color: { argb: PALETTE.PRIMARY } },
          bottom: { style: 'double', color: { argb: PALETTE.PRIMARY } },
        };
      });
      summaryRow.getCell(8).numFmt = '0.00" hrs"';
      summaryRow.getCell(10).numFmt = '"₦"#,##0.00';
      summaryRow.getCell(11).numFmt = '"₦"#,##0.00';
      summaryRow.getCell(12).numFmt = '"₦"#,##0.00';
    }

    autoFitColumns(overviewSheet, 13, 38);
    applySheetSetup(overviewSheet, { freezeY: 6, landscape: true });

    // ──────────────────────────────────────────────────────────────────────────
    // Sheets 2..N: One Dedicated Sheet per Organization
    // ──────────────────────────────────────────────────────────────────────────
    for (const org of data.organizations) {
      const sheetName = sanitizeSheetName(org.name, usedSheetNames);
      const ws = workbook.addWorksheet(sheetName);

      this._renderSingleOrganizationSheet(ws, data, org, nowStr);
    }
  }

  /**
   * Renders the complete organizational lifecycle dataset into one master sheet (for Super Admin export)
   */
  _renderSingleOrganizationSheet(ws, data, org, nowStr) {
    const TOTAL_COLS = 18;

    renderHeaderBanner(ws, {
      title: `ORGANIZATION AUDIT REPORT: ${org.name.toUpperCase()}`,
      organizationName: org.name,
      period: 'Complete Historical Database',
      generatedAt: nowStr,
      totalCols: TOTAL_COLS,
    });

    const orgEmployees = data.employees.filter((e) => e.orgId === org.id);
    const orgAttendance = data.attendanceRecords.filter((a) => a.employee?.orgId === org.id);
    const orgBreaks = data.breakRecords.filter((b) => b.employee?.orgId === org.id);
    const orgManualPenalties = data.manualPenalties.filter((m) => m.orgId === org.id || m.employee?.orgId === org.id);
    const orgLeaves = data.leaveRequests.filter((l) => l.employee?.orgId === org.id);
    const orgFraud = data.fraudAlerts.filter((f) => f.employee?.orgId === org.id);
    const orgSessions = data.sessions.filter((s) => s.office?.orgId === org.id);
    const orgStudents = data.studentRecords.filter((s) => s.organization?.id === org.id || s.orgId === org.id);
    const orgStudentAttendance = data.studentAttendance.filter((s) => s.student?.orgId === org.id);

    const staffCount = orgEmployees.filter((e) => e.role === 'EMPLOYEE').length;
    const adminCount = orgEmployees.filter((e) => e.role === 'ADMIN').length;
    const presentCount = orgAttendance.filter((r) => r.status === 'PRESENT').length;
    const lateCount = orgAttendance.filter((r) => r.status === 'LATE' || r.status === 'COMPLETELY_LATE').length;
    const absentCount = orgAttendance.filter((r) => r.status === 'ABSENT').length;
    const hoursTotal = orgAttendance.reduce((s, r) => s + (r.totalWorkHours || 0), 0);
    const autoPenTotal = orgAttendance.reduce((s, r) => s + (r.penalty || 0), 0) + orgBreaks.reduce((s, b) => s + (b.penalty || 0), 0);
    const manualPenTotal = orgManualPenalties.reduce((s, m) => s + (m.amount || 0), 0);
    const totalPenalties = autoPenTotal + manualPenTotal;

    renderKpiCards(ws, [
      { label: 'Staff Count', value: staffCount, color: PALETTE.PRIMARY },
      { label: 'Total Logs', value: orgAttendance.length, color: PALETTE.PRIMARY },
      { label: 'Present Logs', value: presentCount, color: 'FF166534' },
      { label: 'Late Logs', value: lateCount, color: 'FF92400E' },
      { label: 'Absent Logs', value: absentCount, color: 'FF991B1B' },
      { label: 'Work Hours', value: parseFloat(hoursTotal.toFixed(1)), numFmt: '#,##0.0" hrs"', color: 'FF0369A1' },
      { label: 'Total Penalties', value: totalPenalties, numFmt: '"₦"#,##0.00', color: 'FF991B1B' },
    ], TOTAL_COLS);

    // ── Table 1: Attendance Records ──────────────────────────────────────────
    renderSectionHeader(ws, '1. ATTENDANCE RECORDS (ALL HISTORICAL LOGS)', TOTAL_COLS);
    const attHeaders = [
      'Date', 'Day', 'Employee Code', 'Employee Name', 'Department', 'Office', 'Shift',
      'Clock In', 'In Source', 'In Recorder', 'Clock Out', 'Out Source', 'Out Recorder',
      'Status', 'Work Hours', 'Break (min)', 'Penalty (NGN)', 'Flagged',
    ];
    renderTableHeader(ws, attHeaders);

    if (orgAttendance.length === 0) {
      const emptyRow = ws.addRow(['No attendance records found for this organization.']);
      formatDataRow(emptyRow, false);
    } else {
      orgAttendance.forEach((r, idx) => {
        const row = ws.addRow([
          isoDate(r.date),
          r.date ? new Date(r.date).toLocaleDateString('en-GB', { weekday: 'short' }) : '',
          r.employee?.employeeCode || '—',
          `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`.trim() || 'Unknown',
          r.employee?.department?.name || 'Unassigned',
          r.employee?.office?.name || r.session?.officeName || 'Main',
          r.employee?.shiftType || 'FULL_TIME',
          r.clockInTime ? formatTime(r.clockInTime) : '—',
          r.checkInSource || '—',
          r.checkInRecorder ? `${r.checkInRecorder.firstName} ${r.checkInRecorder.lastName}`.trim() : 'Self',
          r.clockOutTime ? formatTime(r.clockOutTime) : '—',
          r.checkOutSource || '—',
          r.checkOutRecorder ? `${r.checkOutRecorder.firstName} ${r.checkOutRecorder.lastName}`.trim() : 'Self',
          r.status || 'ABSENT',
          r.totalWorkHours != null ? parseFloat(r.totalWorkHours.toFixed(2)) : 0,
          r.totalBreakMinutes || 0,
          r.penalty || 0,
          r.flagged ? 'YES' : 'NO',
        ]);

        row.getCell(15).numFmt = '0.00" hrs"';
        row.getCell(16).numFmt = '#,##0';
        row.getCell(17).numFmt = '"₦"#,##0.00';
        formatDataRow(row, idx % 2 === 1, 14);
      });
    }

    ws.addRow([]); // Spacer

    // ── Table 2: Break Records ───────────────────────────────────────────────
    renderSectionHeader(ws, '2. BREAK & OVERSTAY RECORDS', TOTAL_COLS);
    const breakHeaders = [
      'Date', 'Employee Code', 'Employee Name', 'Break Type', 'Start Time', 'End Time',
      'Duration (min)', 'Overstay Penalty (NGN)', 'Auto-Ended', 'Session Name',
    ];
    renderTableHeader(ws, breakHeaders);

    if (orgBreaks.length === 0) {
      const emptyRow = ws.addRow(['No break records logged for this organization.']);
      formatDataRow(emptyRow, false);
    } else {
      orgBreaks.forEach((b, idx) => {
        const row = ws.addRow([
          isoDate(b.attendanceRecord?.date || b.startTime),
          b.employee?.employeeCode || '—',
          `${b.employee?.firstName || ''} ${b.employee?.lastName || ''}`.trim() || 'Unknown',
          b.breakType || 'LUNCH',
          b.startTime ? formatTime(b.startTime) : '—',
          b.endTime ? formatTime(b.endTime) : 'ACTIVE',
          b.durationMinutes || 0,
          b.penalty || 0,
          b.isAutoEnded ? 'YES' : 'NO',
          b.attendanceRecord?.session?.sessionName || 'Standard',
        ]);
        row.getCell(7).numFmt = '#,##0';
        row.getCell(8).numFmt = '"₦"#,##0.00';
        formatDataRow(row, idx % 2 === 1);
      });
    }

    ws.addRow([]); // Spacer

    // ── Table 3: Consolidated Penalties Ledger ────────────────────────────────
    renderSectionHeader(ws, '3. CONSOLIDATED DISCIPLINARY & PENALTIES LEDGER (AUTO + MANUAL)', TOTAL_COLS);
    const penHeaders = [
      'Date', 'Employee Code', 'Employee Name', 'Penalty Category', 'Amount (NGN)', 'Violation / Reason', 'Recorded By / Origin',
    ];
    renderTableHeader(ws, penHeaders);

    const combinedPenalties = [];

    // Auto penalties from attendance
    orgAttendance.filter((r) => (r.penalty || 0) > 0).forEach((r) => {
      combinedPenalties.push({
        date: isoDate(r.date),
        code: r.employee?.employeeCode || '—',
        name: `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`.trim(),
        category: r.status === 'COMPLETELY_LATE' ? 'Completely Late' : (r.status === 'ABSENT' ? 'Absence Fine' : 'Late Arrival'),
        amount: r.penalty,
        reason: r.reviewNotes || `Automated fine for ${r.status.toLowerCase().replace('_', ' ')}`,
        origin: 'Automated Attendance Engine',
      });
    });

    // Auto penalties from breaks
    orgBreaks.filter((b) => (b.penalty || 0) > 0).forEach((b) => {
      combinedPenalties.push({
        date: isoDate(b.attendanceRecord?.date || b.startTime),
        code: b.employee?.employeeCode || '—',
        name: `${b.employee?.firstName || ''} ${b.employee?.lastName || ''}`.trim(),
        category: 'Break Overstay',
        amount: b.penalty,
        reason: `Overstayed allowed break window by ${b.durationMinutes || 0} minutes`,
        origin: 'Automated Break Monitor',
      });
    });

    // Manual penalties from admin
    orgManualPenalties.forEach((m) => {
      combinedPenalties.push({
        date: isoDate(m.createdAt),
        code: m.employee?.employeeCode || '—',
        name: `${m.employee?.firstName || ''} ${m.employee?.lastName || ''}`.trim(),
        category: 'Manual Penalty',
        amount: m.amount || 0,
        reason: m.reason || 'Manual disciplinary deduction',
        origin: m.createdBy ? `Admin: ${m.createdBy.firstName} ${m.createdBy.lastName}` : 'Administrator',
      });
    });

    if (combinedPenalties.length === 0) {
      const emptyRow = ws.addRow(['No disciplinary penalties or deductions recorded for this organization.']);
      formatDataRow(emptyRow, false);
    } else {
      const penStart = ws.lastRow.number + 1;
      combinedPenalties.forEach((p, idx) => {
        const row = ws.addRow([
          p.date, p.code, p.name, p.category, p.amount, p.reason, p.origin,
        ]);
        row.getCell(5).numFmt = '"₦"#,##0.00';
        formatDataRow(row, idx % 2 === 1);
      });
      const penEnd = ws.lastRow.number;

      const subtotalRow = ws.addRow([
        'SUBTOTAL', '', '', '',
        { formula: `SUM(E${penStart}:E${penEnd})` },
        '', '',
      ]);
      subtotalRow.height = 22;
      subtotalRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: PALETTE.PRIMARY } };
        cell.border = { top: { style: 'thin' }, bottom: { style: 'double' } };
      });
      subtotalRow.getCell(5).numFmt = '"₦"#,##0.00';
    }

    ws.addRow([]); // Spacer

    // ── Table 4: Leave Records ───────────────────────────────────────────────
    renderSectionHeader(ws, '4. LEAVE REQUESTS & EMPLOYEE BALANCES', TOTAL_COLS);
    const leaveHeaders = [
      'Employee Code', 'Employee Name', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Reason', 'Approved By', 'Submitted At',
    ];
    renderTableHeader(ws, leaveHeaders);

    if (orgLeaves.length === 0) {
      const emptyRow = ws.addRow(['No leave requests submitted for this organization.']);
      formatDataRow(emptyRow, false);
    } else {
      orgLeaves.forEach((l, idx) => {
        const row = ws.addRow([
          l.employee?.employeeCode || '—',
          `${l.employee?.firstName || ''} ${l.employee?.lastName || ''}`.trim() || 'Unknown',
          l.leaveType || 'ANNUAL',
          isoDate(l.startDate),
          isoDate(l.endDate),
          l.totalDays || 0,
          l.status || 'PENDING',
          l.reason || '—',
          l.approver ? `${l.approver.firstName} ${l.approver.lastName}`.trim() : 'Pending Approval',
          isoDate(l.createdAt),
        ]);
        row.getCell(6).numFmt = '#,##0';
        formatDataRow(row, idx % 2 === 1, 7);
      });
    }

    ws.addRow([]); // Spacer

    // ── Table 5: Employee Directory ──────────────────────────────────────────
    renderSectionHeader(ws, '5. EMPLOYEE & ADMINISTRATOR DIRECTORY', TOTAL_COLS);
    const empHeaders = [
      'Employee Code', 'Full Name', 'Email', 'Phone', 'Role', 'Department', 'Office', 'Shift Type', 'Check-In Method', 'Face Registered', 'Status', 'Date Joined', 'Last Login',
    ];
    renderTableHeader(ws, empHeaders);

    if (orgEmployees.length === 0) {
      const emptyRow = ws.addRow(['No employee profiles registered under this organization.']);
      formatDataRow(emptyRow, false);
    } else {
      orgEmployees.forEach((e, idx) => {
        const row = ws.addRow([
          e.employeeCode || '—',
          `${e.firstName || ''} ${e.lastName || ''}`.trim() || 'Unknown',
          e.email || '—',
          e.phone || '—',
          e.role || 'EMPLOYEE',
          e.department?.name || 'Unassigned',
          e.office?.name || 'Main Office',
          e.shiftType || 'FULL_TIME',
          e.checkInMethod || 'PHONE',
          e.profileImageUrl ? 'YES' : 'NO',
          e.status || 'ACTIVE',
          isoDate(e.createdAt),
          e.lastLoginAt ? formatDateTime(e.lastLoginAt) : 'Never',
        ]);
        formatDataRow(row, idx % 2 === 1, 11);
      });
    }

    ws.addRow([]); // Spacer

    // ── Table 6: Fraud Alerts ────────────────────────────────────────────────
    renderSectionHeader(ws, '6. FRAUD ALERTS & SECURITY AUDIT', TOTAL_COLS);
    const fraudHeaders = [
      'Date', 'Employee Code', 'Employee Name', 'Fraud Type', 'Severity', 'Description', 'Status', 'Session', 'Resolved By',
    ];
    renderTableHeader(ws, fraudHeaders);

    if (orgFraud.length === 0) {
      const emptyRow = ws.addRow(['No fraud alerts or suspicious security incidents recorded.']);
      formatDataRow(emptyRow, false);
    } else {
      orgFraud.forEach((f, idx) => {
        const row = ws.addRow([
          isoDate(f.createdAt),
          f.employee?.employeeCode || '—',
          `${f.employee?.firstName || ''} ${f.employee?.lastName || ''}`.trim() || 'Unknown',
          f.fraudType || 'SUSPICIOUS_SCAN',
          f.severity || 'MEDIUM',
          f.description || '—',
          f.status || 'NEW',
          f.session?.sessionName || '—',
          f.resolver ? `${f.resolver.firstName} ${f.resolver.lastName}`.trim() : 'Unresolved',
        ]);
        formatDataRow(row, idx % 2 === 1, 7);
      });
    }

    ws.addRow([]); // Spacer

    // ── Table 7: Sessions & Stations ─────────────────────────────────────────
    renderSectionHeader(ws, '7. ATTENDANCE SESSIONS & KIOSK STATIONS', TOTAL_COLS);
    const sessionHeaders = [
      'Session Name', 'Office', 'Status', 'Date', 'Start Time', 'End Time', 'Total Check-ins', 'Scan Attempts', 'Fraud Alerts',
    ];
    renderTableHeader(ws, sessionHeaders);

    if (orgSessions.length === 0) {
      const emptyRow = ws.addRow(['No attendance sessions found for this organization.']);
      formatDataRow(emptyRow, false);
    } else {
      orgSessions.forEach((s, idx) => {
        const row = ws.addRow([
          s.sessionName || 'Main Station',
          s.office?.name || s.officeName || 'Main Office',
          s.status || 'ENDED',
          isoDate(s.startTime),
          s.startTime ? formatTime(s.startTime) : '—',
          s.endTime ? formatTime(s.endTime) : '—',
          s._count?.attendanceRecords || 0,
          s._count?.scanAttempts || 0,
          s._count?.fraudAlerts || 0,
        ]);
        formatDataRow(row, idx % 2 === 1, 3);
      });
    }

    // ── Optional Table 8: Students (if educational org) ──────────────────────
    if (orgStudents.length > 0 || org.hasStudents) {
      ws.addRow([]); // Spacer
      renderSectionHeader(ws, '8. STUDENT ATTENDANCE & ROSTER', TOTAL_COLS);
      const studentHeaders = [
        'Student Code', 'First Name', 'Last Name', 'Class', 'Date', 'Check In', 'Check Out', 'Checked In By',
      ];
      renderTableHeader(ws, studentHeaders);

      if (orgStudentAttendance.length === 0) {
        const emptyRow = ws.addRow(['No student attendance records found.']);
        formatDataRow(emptyRow, false);
      } else {
        orgStudentAttendance.forEach((sa, idx) => {
          const row = ws.addRow([
            sa.student?.studentCode || '—',
            sa.student?.firstName || '—',
            sa.student?.lastName || '—',
            sa.student?.className || '—',
            isoDate(sa.date),
            sa.checkInTime ? formatTime(sa.checkInTime) : '—',
            sa.checkOutTime ? formatTime(sa.checkOutTime) : '—',
            sa.checkedInBy ? `${sa.checkedInBy.firstName} ${sa.checkedInBy.lastName}`.trim() : 'Admin',
          ]);
          formatDataRow(row, idx % 2 === 1);
        });
      }
    }

    autoFitColumns(ws, 13, 38);
    applySheetSetup(ws, { freezeY: 6, landscape: true });
  }

  /**
   * Organization Admin Excel Builder
   * Scoped strictly to one organization with dedicated tabs for executive reporting:
   * Tab 1 = Executive Dashboard
   * Tab 2 = Attendance Log
   * Tab 3 = Breaks & Overstays
   * Tab 4 = Penalties & Deductions Ledger (Auto + Manual)
   * Tab 5 = Staff Directory
   * Tab 6 = Leave Management
   * Tab 7 = Fraud & Security
   * Tab 8 = Sessions & Kiosks
   * (Tab 9 = Students if applicable)
   */
  async _renderOrganizationExcel(workbook, data, targetOrg) {
    const nowStr = formatDateTime(new Date());

    const orgEmployees = data.employees.filter((e) => e.orgId === targetOrg.id);
    const orgAttendance = data.attendanceRecords.filter((a) => a.employee?.orgId === targetOrg.id);
    const orgBreaks = data.breakRecords.filter((b) => b.employee?.orgId === targetOrg.id);
    const orgManualPenalties = data.manualPenalties.filter((m) => m.orgId === targetOrg.id || m.employee?.orgId === targetOrg.id);
    const orgLeaves = data.leaveRequests.filter((l) => l.employee?.orgId === targetOrg.id);
    const orgFraud = data.fraudAlerts.filter((f) => f.employee?.orgId === targetOrg.id);
    const orgSessions = data.sessions.filter((s) => s.office?.orgId === targetOrg.id);
    const orgStudents = data.studentRecords.filter((s) => s.organization?.id === targetOrg.id || s.orgId === targetOrg.id);
    const orgStudentAttendance = data.studentAttendance.filter((s) => s.student?.orgId === targetOrg.id);

    // ──────────────────────────────────────────────────────────────────────────
    // Tab 1: Executive Dashboard
    // ──────────────────────────────────────────────────────────────────────────
    const dashSheet = workbook.addWorksheet('Dashboard');
    renderHeaderBanner(dashSheet, {
      title: `${targetOrg.name.toUpperCase()} — ATTENDANCE & WORKFORCE REPORT`,
      organizationName: targetOrg.name,
      period: 'Complete Historical Summary',
      generatedAt: nowStr,
      totalCols: 10,
    });

    const staffCount = orgEmployees.filter((e) => e.role === 'EMPLOYEE').length;
    const presentCount = orgAttendance.filter((r) => r.status === 'PRESENT').length;
    const lateCount = orgAttendance.filter((r) => r.status === 'LATE' || r.status === 'COMPLETELY_LATE').length;
    const absentCount = orgAttendance.filter((r) => r.status === 'ABSENT').length;
    const hoursTotal = orgAttendance.reduce((s, r) => s + (r.totalWorkHours || 0), 0);
    const autoPenTotal = orgAttendance.reduce((s, r) => s + (r.penalty || 0), 0) + orgBreaks.reduce((s, b) => s + (b.penalty || 0), 0);
    const manualPenTotal = orgManualPenalties.reduce((s, m) => s + (m.amount || 0), 0);
    const totalPenalties = autoPenTotal + manualPenTotal;

    renderKpiCards(dashSheet, [
      { label: 'Active Staff', value: staffCount, color: PALETTE.PRIMARY },
      { label: 'Total Logs', value: orgAttendance.length, color: PALETTE.PRIMARY },
      { label: 'On-Time', value: presentCount, color: 'FF166534' },
      { label: 'Lateness', value: lateCount, color: 'FF92400E' },
      { label: 'Absences', value: absentCount, color: 'FF991B1B' },
      { label: 'Total Work Hours', value: parseFloat(hoursTotal.toFixed(1)), numFmt: '#,##0.0" hrs"', color: 'FF0369A1' },
      { label: 'Combined Penalties', value: totalPenalties, numFmt: '"₦"#,##0.00', color: 'FF991B1B' },
    ], 10);

    // Department Performance Breakdown
    renderSectionHeader(dashSheet, 'DEPARTMENT WORKFORCE BREAKDOWN', 10);
    renderTableHeader(dashSheet, ['Department', 'Assigned Staff', 'Attendance Logs', 'Hours Worked', 'Late Logs', 'Total Penalties (NGN)']);

    const deptMap = new Map();
    orgEmployees.forEach((e) => {
      const dName = e.department?.name || 'General / Unassigned';
      if (!deptMap.has(dName)) deptMap.set(dName, { staff: 0, logs: 0, hours: 0, late: 0, penalties: 0 });
      deptMap.get(dName).staff++;
    });

    orgAttendance.forEach((a) => {
      const dName = a.employee?.department?.name || 'General / Unassigned';
      if (!deptMap.has(dName)) deptMap.set(dName, { staff: 0, logs: 0, hours: 0, late: 0, penalties: 0 });
      const stats = deptMap.get(dName);
      stats.logs++;
      stats.hours += a.totalWorkHours || 0;
      if (a.status === 'LATE' || a.status === 'COMPLETELY_LATE') stats.late++;
      stats.penalties += a.penalty || 0;
    });

    Array.from(deptMap.entries()).forEach(([deptName, stats], idx) => {
      const row = dashSheet.addRow([
        deptName, stats.staff, stats.logs, parseFloat(stats.hours.toFixed(2)), stats.late, stats.penalties,
      ]);
      row.getCell(4).numFmt = '0.00" hrs"';
      row.getCell(6).numFmt = '"₦"#,##0.00';
      formatDataRow(row, idx % 2 === 1);
    });

    autoFitColumns(dashSheet, 14, 38);
    applySheetSetup(dashSheet, { freezeY: 6, landscape: true });

    // ──────────────────────────────────────────────────────────────────────────
    // Tab 2: Attendance Records
    // ──────────────────────────────────────────────────────────────────────────
    const attSheet = workbook.addWorksheet('Attendance');
    renderHeaderBanner(attSheet, {
      title: 'ATTENDANCE LOG',
      organizationName: targetOrg.name,
      period: 'Complete Historical Database',
      generatedAt: nowStr,
      totalCols: 18,
    });
    const attHeaders = [
      'Date', 'Day', 'Employee Code', 'Employee Name', 'Department', 'Office', 'Shift',
      'Clock In', 'In Source', 'In Recorder', 'Clock Out', 'Out Source', 'Out Recorder',
      'Status', 'Work Hours', 'Break (min)', 'Penalty (NGN)', 'Flagged',
    ];
    renderTableHeader(attSheet, attHeaders);

    orgAttendance.forEach((r, idx) => {
      const row = attSheet.addRow([
        isoDate(r.date),
        r.date ? new Date(r.date).toLocaleDateString('en-GB', { weekday: 'short' }) : '',
        r.employee?.employeeCode || '—',
        `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`.trim() || 'Unknown',
        r.employee?.department?.name || 'Unassigned',
        r.employee?.office?.name || r.session?.officeName || 'Main',
        r.employee?.shiftType || 'FULL_TIME',
        r.clockInTime ? formatTime(r.clockInTime) : '—',
        r.checkInSource || '—',
        r.checkInRecorder ? `${r.checkInRecorder.firstName} ${r.checkInRecorder.lastName}`.trim() : 'Self',
        r.clockOutTime ? formatTime(r.clockOutTime) : '—',
        r.checkOutSource || '—',
        r.checkOutRecorder ? `${r.checkOutRecorder.firstName} ${r.checkOutRecorder.lastName}`.trim() : 'Self',
        r.status || 'ABSENT',
        r.totalWorkHours != null ? parseFloat(r.totalWorkHours.toFixed(2)) : 0,
        r.totalBreakMinutes || 0,
        r.penalty || 0,
        r.flagged ? 'YES' : 'NO',
      ]);
      row.getCell(15).numFmt = '0.00" hrs"';
      row.getCell(16).numFmt = '#,##0';
      row.getCell(17).numFmt = '"₦"#,##0.00';
      formatDataRow(row, idx % 2 === 1, 14);
    });

    autoFitColumns(attSheet, 12, 36);
    applySheetSetup(attSheet, { freezeY: 4, landscape: true });

    // ──────────────────────────────────────────────────────────────────────────
    // Tab 3: Breaks & Overstays
    // ──────────────────────────────────────────────────────────────────────────
    const breakSheet = workbook.addWorksheet('Breaks');
    renderHeaderBanner(breakSheet, {
      title: 'BREAKS & OVERSTAYS LOG',
      organizationName: targetOrg.name,
      period: 'Complete Historical Database',
      generatedAt: nowStr,
      totalCols: 10,
    });
    renderTableHeader(breakSheet, [
      'Date', 'Employee Code', 'Employee Name', 'Break Type', 'Start Time', 'End Time',
      'Duration (min)', 'Overstay Penalty (NGN)', 'Auto-Ended', 'Session Name',
    ]);

    orgBreaks.forEach((b, idx) => {
      const row = breakSheet.addRow([
        isoDate(b.attendanceRecord?.date || b.startTime),
        b.employee?.employeeCode || '—',
        `${b.employee?.firstName || ''} ${b.employee?.lastName || ''}`.trim() || 'Unknown',
        b.breakType || 'LUNCH',
        b.startTime ? formatTime(b.startTime) : '—',
        b.endTime ? formatTime(b.endTime) : 'ACTIVE',
        b.durationMinutes || 0,
        b.penalty || 0,
        b.isAutoEnded ? 'YES' : 'NO',
        b.attendanceRecord?.session?.sessionName || 'Standard',
      ]);
      row.getCell(7).numFmt = '#,##0';
      row.getCell(8).numFmt = '"₦"#,##0.00';
      formatDataRow(row, idx % 2 === 1);
    });

    autoFitColumns(breakSheet, 13, 36);
    applySheetSetup(breakSheet, { freezeY: 4, landscape: true });

    // ──────────────────────────────────────────────────────────────────────────
    // Tab 4: Penalties Ledger (Auto + Manual)
    // ──────────────────────────────────────────────────────────────────────────
    const penSheet = workbook.addWorksheet('Penalties Ledger');
    renderHeaderBanner(penSheet, {
      title: 'CONSOLIDATED DISCIPLINARY & PENALTIES LEDGER',
      organizationName: targetOrg.name,
      period: 'Automated Fines & Manual Administrative Penalties',
      generatedAt: nowStr,
      totalCols: 8,
    });
    renderTableHeader(penSheet, [
      'Date', 'Employee Code', 'Employee Name', 'Category', 'Amount (NGN)', 'Reason / Violation', 'Recorded By / System',
    ]);

    const penStart = penSheet.lastRow.number + 1;
    const orgCombinedPenalties = [];

    // Auto penalties from attendance
    orgAttendance.filter((r) => (r.penalty || 0) > 0).forEach((r) => {
      orgCombinedPenalties.push({
        date: isoDate(r.date),
        code: r.employee?.employeeCode || '—',
        name: `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`.trim(),
        category: r.status === 'COMPLETELY_LATE' ? 'Completely Late' : (r.status === 'ABSENT' ? 'Absence Fine' : 'Late Arrival'),
        amount: r.penalty,
        reason: r.reviewNotes || `Automated fine for ${r.status.toLowerCase().replace('_', ' ')}`,
        origin: 'Automated Attendance Engine',
      });
    });

    // Auto penalties from breaks
    orgBreaks.filter((b) => (b.penalty || 0) > 0).forEach((b) => {
      orgCombinedPenalties.push({
        date: isoDate(b.attendanceRecord?.date || b.startTime),
        code: b.employee?.employeeCode || '—',
        name: `${b.employee?.firstName || ''} ${b.employee?.lastName || ''}`.trim(),
        category: 'Break Overstay',
        amount: b.penalty,
        reason: `Overstayed allowed break window by ${b.durationMinutes || 0} minutes`,
        origin: 'Automated Break Monitor',
      });
    });

    // Manual penalties from admin
    orgManualPenalties.forEach((m) => {
      orgCombinedPenalties.push({
        date: isoDate(m.createdAt),
        code: m.employee?.employeeCode || '—',
        name: `${m.employee?.firstName || ''} ${m.employee?.lastName || ''}`.trim(),
        category: 'Manual Penalty',
        amount: m.amount || 0,
        reason: m.reason || 'Manual disciplinary deduction',
        origin: m.createdBy ? `Admin: ${m.createdBy.firstName} ${m.createdBy.lastName}` : 'Administrator',
      });
    });

    if (orgCombinedPenalties.length === 0) {
      const emptyRow = penSheet.addRow(['No disciplinary penalties or deductions recorded for this organization.']);
      formatDataRow(emptyRow, false);
    } else {
      orgCombinedPenalties.forEach((p, idx) => {
        const row = penSheet.addRow([
          p.date, p.code, p.name, p.category, p.amount, p.reason, p.origin,
        ]);
        row.getCell(5).numFmt = '"₦"#,##0.00';
        formatDataRow(row, idx % 2 === 1);
      });
      const penEnd = penSheet.lastRow.number;

      const subtotalRow = penSheet.addRow([
        'TOTAL PENALTIES', '', '', '',
        { formula: `SUM(E${penStart}:E${penEnd})` },
        '', '',
      ]);
      subtotalRow.height = 24;
      subtotalRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: PALETTE.PRIMARY } };
        cell.border = { top: { style: 'thin' }, bottom: { style: 'double' } };
      });
      subtotalRow.getCell(5).numFmt = '"₦"#,##0.00';
    }

    autoFitColumns(penSheet, 14, 38);
    applySheetSetup(penSheet, { freezeY: 4, landscape: true });

    // ──────────────────────────────────────────────────────────────────────────
    // Tab 5: Staff Directory
    // ──────────────────────────────────────────────────────────────────────────
    const staffSheet = workbook.addWorksheet('Staff Directory');
    renderHeaderBanner(staffSheet, {
      title: 'EMPLOYEE & ADMINISTRATOR DIRECTORY',
      organizationName: targetOrg.name,
      period: 'Complete Staff Roster',
      generatedAt: nowStr,
      totalCols: 13,
    });
    renderTableHeader(staffSheet, [
      'Employee Code', 'Full Name', 'Email', 'Phone', 'Role', 'Department', 'Office',
      'Shift Type', 'Check-In Method', 'Face Registered', 'Status', 'Date Joined', 'Last Login',
    ]);

    orgEmployees.forEach((e, idx) => {
      const row = staffSheet.addRow([
        e.employeeCode || '—',
        `${e.firstName || ''} ${e.lastName || ''}`.trim() || 'Unknown',
        e.email || '—',
        e.phone || '—',
        e.role || 'EMPLOYEE',
        e.department?.name || 'Unassigned',
        e.office?.name || 'Main Office',
        e.shiftType || 'FULL_TIME',
        e.checkInMethod || 'PHONE',
        e.profileImageUrl ? 'YES' : 'NO',
        e.status || 'ACTIVE',
        isoDate(e.createdAt),
        e.lastLoginAt ? formatDateTime(e.lastLoginAt) : 'Never',
      ]);
      formatDataRow(row, idx % 2 === 1, 11);
    });

    autoFitColumns(staffSheet, 13, 36);
    applySheetSetup(staffSheet, { freezeY: 4, landscape: true });

    // ──────────────────────────────────────────────────────────────────────────
    // Tab 6: Leave Management
    // ──────────────────────────────────────────────────────────────────────────
    const leaveSheet = workbook.addWorksheet('Leave Management');
    renderHeaderBanner(leaveSheet, {
      title: 'LEAVE APPLICATIONS & BALANCES',
      organizationName: targetOrg.name,
      period: 'Historical Leave Records',
      generatedAt: nowStr,
      totalCols: 10,
    });
    renderTableHeader(leaveSheet, [
      'Employee Code', 'Employee Name', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Reason', 'Approved By', 'Submitted At',
    ]);

    orgLeaves.forEach((l, idx) => {
      const row = leaveSheet.addRow([
        l.employee?.employeeCode || '—',
        `${l.employee?.firstName || ''} ${l.employee?.lastName || ''}`.trim() || 'Unknown',
        l.leaveType || 'ANNUAL',
        isoDate(l.startDate),
        isoDate(l.endDate),
        l.totalDays || 0,
        l.status || 'PENDING',
        l.reason || '—',
        l.approver ? `${l.approver.firstName} ${l.approver.lastName}`.trim() : 'Pending Approval',
        isoDate(l.createdAt),
      ]);
      row.getCell(6).numFmt = '#,##0';
      formatDataRow(row, idx % 2 === 1, 7);
    });

    autoFitColumns(leaveSheet, 13, 36);
    applySheetSetup(leaveSheet, { freezeY: 4, landscape: true });

    // ──────────────────────────────────────────────────────────────────────────
    // Tab 7: Fraud & Security
    // ──────────────────────────────────────────────────────────────────────────
    const fraudSheet = workbook.addWorksheet('Fraud & Security');
    renderHeaderBanner(fraudSheet, {
      title: 'FRAUD ALERTS & SECURITY AUDIT LOGS',
      organizationName: targetOrg.name,
      period: 'Security Events Log',
      generatedAt: nowStr,
      totalCols: 9,
    });
    renderTableHeader(fraudSheet, [
      'Date', 'Employee Code', 'Employee Name', 'Fraud Type', 'Severity', 'Description', 'Status', 'Session', 'Resolved By',
    ]);

    orgFraud.forEach((f, idx) => {
      const row = fraudSheet.addRow([
        isoDate(f.createdAt),
        f.employee?.employeeCode || '—',
        `${f.employee?.firstName || ''} ${f.employee?.lastName || ''}`.trim() || 'Unknown',
        f.fraudType || 'SUSPICIOUS_SCAN',
        f.severity || 'MEDIUM',
        f.description || '—',
        f.status || 'NEW',
        f.session?.sessionName || '—',
        f.resolver ? `${f.resolver.firstName} ${f.resolver.lastName}`.trim() : 'Unresolved',
      ]);
      formatDataRow(row, idx % 2 === 1, 7);
    });

    autoFitColumns(fraudSheet, 13, 36);
    applySheetSetup(fraudSheet, { freezeY: 4, landscape: true });

    // ──────────────────────────────────────────────────────────────────────────
    // Tab 8: Sessions & Kiosks
    // ──────────────────────────────────────────────────────────────────────────
    const sessSheet = workbook.addWorksheet('Sessions & Kiosks');
    renderHeaderBanner(sessSheet, {
      title: 'ATTENDANCE SESSIONS & KIOSK STATIONS',
      organizationName: targetOrg.name,
      period: 'Station Lifecycle History',
      generatedAt: nowStr,
      totalCols: 9,
    });
    renderTableHeader(sessSheet, [
      'Session Name', 'Office', 'Status', 'Date', 'Start Time', 'End Time', 'Total Check-ins', 'Scan Attempts', 'Fraud Alerts',
    ]);

    orgSessions.forEach((s, idx) => {
      const row = sessSheet.addRow([
        s.sessionName || 'Main Station',
        s.office?.name || s.officeName || 'Main Office',
        s.status || 'ENDED',
        isoDate(s.startTime),
        s.startTime ? formatTime(s.startTime) : '—',
        s.endTime ? formatTime(s.endTime) : '—',
        s._count?.attendanceRecords || 0,
        s._count?.scanAttempts || 0,
        s._count?.fraudAlerts || 0,
      ]);
      formatDataRow(row, idx % 2 === 1, 3);
    });

    autoFitColumns(sessSheet, 13, 36);
    applySheetSetup(sessSheet, { freezeY: 4, landscape: true });

    // Optional Tab 9: Students
    if (orgStudents.length > 0 || targetOrg.hasStudents) {
      const studentSheet = workbook.addWorksheet('Student Attendance');
      renderHeaderBanner(studentSheet, {
        title: 'STUDENT ATTENDANCE & ACADEMIC LOG',
        organizationName: targetOrg.name,
        period: 'Academic Session History',
        generatedAt: nowStr,
        totalCols: 8,
      });
      renderTableHeader(studentSheet, [
        'Student Code', 'First Name', 'Last Name', 'Class', 'Date', 'Check In', 'Check Out', 'Recorded By',
      ]);

      orgStudentAttendance.forEach((sa, idx) => {
        const row = studentSheet.addRow([
          sa.student?.studentCode || '—',
          sa.student?.firstName || '—',
          sa.student?.lastName || '—',
          sa.student?.className || '—',
          isoDate(sa.date),
          sa.checkInTime ? formatTime(sa.checkInTime) : '—',
          sa.checkOutTime ? formatTime(sa.checkOutTime) : '—',
          sa.checkedInBy ? `${sa.checkedInBy.firstName} ${sa.checkedInBy.lastName}`.trim() : 'Admin',
        ]);
        formatDataRow(row, idx % 2 === 1);
      });

      autoFitColumns(studentSheet, 13, 36);
      applySheetSetup(studentSheet, { freezeY: 4, landscape: true });
    }
  }

  /**
   * Generates complete CSV report with zero missing fields
   * Super Admin: Separated by organization blocks
   * Org Admin: Scoped to the organization
   */
  async exportFullToCSV(orgId) {
    const data = await this.buildFullExport(orgId);
    const isSuperAdmin = !orgId || orgId === 'platform-org';
    const lines = [];

    const addSection = (title, headers, rows) => {
      lines.push(title);
      lines.push(headers.map(csvEscape).join(','));
      rows.forEach((r) => lines.push(r.map(csvEscape).join(',')));
      lines.push('');
    };

    if (isSuperAdmin) {
      lines.push('================================================================================');
      lines.push('TIMELOGIC ENTERPRISE ATTENDANCE SYSTEM — GLOBAL AUDIT REPORT (CSV)');
      lines.push(`Generated: ${formatDateTime(new Date())}`);
      lines.push(`Total Organizations: ${data.organizations.length}`);
      lines.push('================================================================================\n');

      // Master Cross-Org Summary
      addSection('MASTER ORGANIZATIONS SUMMARY',
        ['Organization Name', 'Industry', 'Timezone', 'Offices', 'Staff Count', 'Admins Count', 'Total Records', 'Total Hours', 'Break (min)', 'Auto Penalty (NGN)', 'Manual Penalty (NGN)', 'Total Penalties (NGN)', 'Open Alerts'],
        data.organizations.map((org) => {
          const orgStaff = data.employees.filter((e) => e.orgId === org.id && e.role === 'EMPLOYEE').length;
          const orgAdmins = data.employees.filter((e) => e.orgId === org.id && e.role === 'ADMIN').length;
          const orgAtt = data.attendanceRecords.filter((a) => a.employee?.orgId === org.id);
          const orgBreaks = data.breakRecords.filter((b) => b.employee?.orgId === org.id);
          const orgManuals = data.manualPenalties.filter((m) => m.orgId === org.id || m.employee?.orgId === org.id);
          const orgAlerts = data.fraudAlerts.filter((f) => f.employee?.orgId === org.id && (f.status === 'NEW' || f.status === 'INVESTIGATING')).length;

          const hours = orgAtt.reduce((s, r) => s + (r.totalWorkHours || 0), 0);
          const breakMins = orgAtt.reduce((s, r) => s + (r.totalBreakMinutes || 0), 0);
          const autoPen = orgAtt.reduce((s, r) => s + (r.penalty || 0), 0) + orgBreaks.reduce((s, b) => s + (b.penalty || 0), 0);
          const manPen = orgManuals.reduce((s, m) => s + (m.amount || 0), 0);

          return [
            org.name, org.industry || 'General', org.timezone || 'Africa/Lagos', org.offices?.length || 1,
            orgStaff, orgAdmins, orgAtt.length, hours.toFixed(2), breakMins, autoPen, manPen, autoPen + manPen, orgAlerts,
          ];
        })
      );

      // Section per organization
      for (const org of data.organizations) {
        lines.push('================================================================================');
        lines.push(`ORGANIZATION: ${org.name.toUpperCase()} (ID: ${org.id})`);
        lines.push('================================================================================\n');

        const orgAttendance = data.attendanceRecords.filter((a) => a.employee?.orgId === org.id);
        const orgBreaks = data.breakRecords.filter((b) => b.employee?.orgId === org.id);
        const orgManuals = data.manualPenalties.filter((m) => m.orgId === org.id || m.employee?.orgId === org.id);
        const orgLeaves = data.leaveRequests.filter((l) => l.employee?.orgId === org.id);
        const orgEmployees = data.employees.filter((e) => e.orgId === org.id);
        const orgFraud = data.fraudAlerts.filter((f) => f.employee?.orgId === org.id);

        addSection(`--- ATTENDANCE RECORDS: ${org.name} ---`,
          ['Date', 'Day', 'Employee Code', 'Employee Name', 'Department', 'Office', 'Shift', 'Clock In', 'In Source', 'Clock Out', 'Out Source', 'Status', 'Work Hours', 'Break (min)', 'Penalty (NGN)', 'Flagged'],
          orgAttendance.map((r) => [
            isoDate(r.date),
            r.date ? new Date(r.date).toLocaleDateString('en-GB', { weekday: 'short' }) : '',
            r.employee?.employeeCode || '',
            `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`.trim(),
            r.employee?.department?.name || '',
            r.employee?.office?.name || '',
            r.employee?.shiftType || '',
            r.clockInTime ? formatTime(r.clockInTime) : '',
            r.checkInSource || '',
            r.clockOutTime ? formatTime(r.clockOutTime) : '',
            r.checkOutSource || '',
            r.status || '',
            r.totalWorkHours != null ? r.totalWorkHours.toFixed(2) : '0.00',
            r.totalBreakMinutes || 0,
            r.penalty || 0,
            r.flagged ? 'YES' : 'NO',
          ])
        );

        addSection(`--- BREAK RECORDS: ${org.name} ---`,
          ['Date', 'Employee Code', 'Employee Name', 'Break Type', 'Start Time', 'End Time', 'Duration (min)', 'Overstay Penalty (NGN)', 'Auto-Ended'],
          orgBreaks.map((b) => [
            isoDate(b.attendanceRecord?.date || b.startTime),
            b.employee?.employeeCode || '',
            `${b.employee?.firstName || ''} ${b.employee?.lastName || ''}`.trim(),
            b.breakType || '',
            b.startTime ? formatTime(b.startTime) : '',
            b.endTime ? formatTime(b.endTime) : 'ACTIVE',
            b.durationMinutes || 0,
            b.penalty || 0,
            b.isAutoEnded ? 'YES' : 'NO',
          ])
        );

        addSection(`--- PENALTIES & DEDUCTIONS (AUTO + MANUAL): ${org.name} ---`,
          ['Date', 'Employee Code', 'Employee Name', 'Category', 'Amount (NGN)', 'Reason', 'Origin / Author'],
          [
            ...orgAttendance.filter((r) => (r.penalty || 0) > 0).map((r) => [
              isoDate(r.date), r.employee?.employeeCode || '', `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`.trim(),
              r.status, r.penalty, r.reviewNotes || 'Late / Absence Fine', 'Automated Attendance Engine',
            ]),
            ...orgBreaks.filter((b) => (b.penalty || 0) > 0).map((b) => [
              isoDate(b.attendanceRecord?.date || b.startTime), b.employee?.employeeCode || '', `${b.employee?.firstName || ''} ${b.employee?.lastName || ''}`.trim(),
              'Break Overstay', b.penalty, 'Overstayed allowed window', 'Automated Break Engine',
            ]),
            ...orgManuals.map((m) => [
              isoDate(m.createdAt), m.employee?.employeeCode || '', `${m.employee?.firstName || ''} ${m.employee?.lastName || ''}`.trim(),
              'Manual Penalty', m.amount || 0, m.reason || 'Admin disciplinary fine', m.createdBy ? `${m.createdBy.firstName} ${m.createdBy.lastName}` : 'Admin',
            ]),
          ]
        );

        addSection(`--- EMPLOYEES & STAFF: ${org.name} ---`,
          ['Employee Code', 'Full Name', 'Email', 'Phone', 'Role', 'Department', 'Office', 'Shift Type', 'Check-In Method', 'Face Registered', 'Status', 'Joined Date'],
          orgEmployees.map((e) => [
            e.employeeCode || '', `${e.firstName || ''} ${e.lastName || ''}`.trim(), e.email || '', e.phone || '',
            e.role || '', e.department?.name || '', e.office?.name || '', e.shiftType || '', e.checkInMethod || '',
            e.profileImageUrl ? 'YES' : 'NO', e.status || '', isoDate(e.createdAt),
          ])
        );

        addSection(`--- LEAVE REQUESTS: ${org.name} ---`,
          ['Employee Code', 'Employee Name', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Reason', 'Approved By'],
          orgLeaves.map((l) => [
            l.employee?.employeeCode || '', `${l.employee?.firstName || ''} ${l.employee?.lastName || ''}`.trim(),
            l.leaveType || '', isoDate(l.startDate), isoDate(l.endDate), l.totalDays || 0, l.status || '', l.reason || '',
            l.approver ? `${l.approver.firstName} ${l.approver.lastName}`.trim() : 'Pending',
          ])
        );

        addSection(`--- FRAUD ALERTS: ${org.name} ---`,
          ['Date', 'Employee Code', 'Employee Name', 'Fraud Type', 'Severity', 'Description', 'Status', 'Resolved By'],
          orgFraud.map((f) => [
            isoDate(f.createdAt), f.employee?.employeeCode || '', `${f.employee?.firstName || ''} ${f.employee?.lastName || ''}`.trim(),
            f.fraudType || '', f.severity || '', f.description || '', f.status || '',
            f.resolver ? `${f.resolver.firstName} ${f.resolver.lastName}`.trim() : 'Unresolved',
          ])
        );
      }
    } else {
      // Organization-scoped CSV export
      const org = data.organizations[0] || { name: 'Organization' };

      lines.push('================================================================================');
      lines.push(`TIMELOGIC REPORT: ${org.name.toUpperCase()}`);
      lines.push(`Generated: ${formatDateTime(new Date())}`);
      lines.push('================================================================================\n');

      addSection('ATTENDANCE RECORDS',
        ['Date', 'Day', 'Employee Code', 'Employee Name', 'Department', 'Office', 'Shift', 'Clock In', 'In Source', 'Clock Out', 'Out Source', 'Status', 'Work Hours', 'Break (min)', 'Penalty (NGN)', 'Flagged'],
        data.attendanceRecords.map((r) => [
          isoDate(r.date),
          r.date ? new Date(r.date).toLocaleDateString('en-GB', { weekday: 'short' }) : '',
          r.employee?.employeeCode || '',
          `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`.trim(),
          r.employee?.department?.name || '',
          r.employee?.office?.name || '',
          r.employee?.shiftType || '',
          r.clockInTime ? formatTime(r.clockInTime) : '',
          r.checkInSource || '',
          r.clockOutTime ? formatTime(r.clockOutTime) : '',
          r.checkOutSource || '',
          r.status || '',
          r.totalWorkHours != null ? r.totalWorkHours.toFixed(2) : '0.00',
          r.totalBreakMinutes || 0,
          r.penalty || 0,
          r.flagged ? 'YES' : 'NO',
        ])
      );

      addSection('BREAK RECORDS',
        ['Date', 'Employee Code', 'Employee Name', 'Break Type', 'Start Time', 'End Time', 'Duration (min)', 'Overstay Penalty (NGN)', 'Auto-Ended'],
        data.breakRecords.map((b) => [
          isoDate(b.attendanceRecord?.date || b.startTime),
          b.employee?.employeeCode || '',
          `${b.employee?.firstName || ''} ${b.employee?.lastName || ''}`.trim(),
          b.breakType || '',
          b.startTime ? formatTime(b.startTime) : '',
          b.endTime ? formatTime(b.endTime) : 'ACTIVE',
          b.durationMinutes || 0,
          b.penalty || 0,
          b.isAutoEnded ? 'YES' : 'NO',
        ])
      );

      addSection('PENALTIES & DEDUCTIONS (AUTO + MANUAL)',
        ['Date', 'Employee Code', 'Employee Name', 'Category', 'Amount (NGN)', 'Reason', 'Origin / Author'],
        [
          ...data.attendanceRecords.filter((r) => (r.penalty || 0) > 0).map((r) => [
            isoDate(r.date), r.employee?.employeeCode || '', `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`.trim(),
            r.status, r.penalty, r.reviewNotes || 'Late / Absence Fine', 'Automated Attendance Engine',
          ]),
          ...data.breakRecords.filter((b) => (b.penalty || 0) > 0).map((b) => [
            isoDate(b.attendanceRecord?.date || b.startTime), b.employee?.employeeCode || '', `${b.employee?.firstName || ''} ${b.employee?.lastName || ''}`.trim(),
            'Break Overstay', b.penalty, 'Overstayed allowed window', 'Automated Break Engine',
          ]),
          ...data.manualPenalties.map((m) => [
            isoDate(m.createdAt), m.employee?.employeeCode || '', `${m.employee?.firstName || ''} ${m.employee?.lastName || ''}`.trim(),
            'Manual Penalty', m.amount || 0, m.reason || 'Admin disciplinary fine', m.createdBy ? `${m.createdBy.firstName} ${m.createdBy.lastName}` : 'Admin',
          ]),
        ]
      );

      addSection('EMPLOYEES & STAFF',
        ['Employee Code', 'Full Name', 'Email', 'Phone', 'Role', 'Department', 'Office', 'Shift Type', 'Check-In Method', 'Face Registered', 'Status', 'Joined Date'],
        data.employees.map((e) => [
          e.employeeCode || '', `${e.firstName || ''} ${e.lastName || ''}`.trim(), e.email || '', e.phone || '',
          e.role || '', e.department?.name || '', e.office?.name || '', e.shiftType || '', e.checkInMethod || '',
          e.profileImageUrl ? 'YES' : 'NO', e.status || '', isoDate(e.createdAt),
        ])
      );

      addSection('LEAVE REQUESTS',
        ['Employee Code', 'Employee Name', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Reason', 'Approved By'],
        data.leaveRequests.map((l) => [
          l.employee?.employeeCode || '', `${l.employee?.firstName || ''} ${l.employee?.lastName || ''}`.trim(),
          l.leaveType || '', isoDate(l.startDate), isoDate(l.endDate), l.totalDays || 0, l.status || '', l.reason || '',
          l.approver ? `${l.approver.firstName} ${l.approver.lastName}`.trim() : 'Pending',
        ])
      );

      addSection('FRAUD ALERTS & SECURITY',
        ['Date', 'Employee Code', 'Employee Name', 'Fraud Type', 'Severity', 'Description', 'Status', 'Resolved By'],
        data.fraudAlerts.map((f) => [
          isoDate(f.createdAt), f.employee?.employeeCode || '', `${f.employee?.firstName || ''} ${f.employee?.lastName || ''}`.trim(),
          f.fraudType || '', f.severity || '', f.description || '', f.status || '',
          f.resolver ? `${f.resolver.firstName} ${f.resolver.lastName}`.trim() : 'Unresolved',
        ])
      );
    }

    return lines.join('\n');
  }

  exportToCSV(records) {
    // Legacy CSV export
    const rows = records.map((r) => ({
      date: r.date?.toISOString().split('T')[0],
      employee: `${r.employee?.firstName ?? r.employeeId} ${r.employee?.lastName ?? ''}`.trim(),
      status: r.status,
      clockIn: r.clockInTime ? formatTime(r.clockInTime) : '',
      checkInSource: r.checkInSource ?? '',
      clockOut: r.clockOutTime ? formatTime(r.clockOutTime) : '',
      checkOutSource: r.checkOutSource ?? '',
      workHours: r.totalWorkHours?.toFixed(2) ?? '',
      breakMinutes: r.totalBreakMinutes ?? 0,
      wifiVerified: r.wifiVerified ? 'Yes' : 'No',
      flagged: r.flagged ? 'Yes' : 'No',
    }));
    if (!rows.length) return '';
    const headers = Object.keys(rows[0]).join(',');
    const lines = rows.map((r) => Object.values(r).join(','));
    return [headers, ...lines].join('\n');
  }

  async _buildExcelFromAttendance(records) {
    const rows = records.map((r) => ({
      Date: r.date?.toISOString().split('T')[0],
      Employee: `${r.employee?.firstName ?? r.employeeId} ${r.employee?.lastName ?? ''}`.trim(),
      Status: r.status,
      'Clock In': r.clockInTime ? formatTime(r.clockInTime) : '',
      'Check-In Source': r.checkInSource ?? '',
      'Clock Out': r.clockOutTime ? formatTime(r.clockOutTime) : '',
      'Check-Out Source': r.checkOutSource ?? '',
      'Work Hours': r.totalWorkHours?.toFixed(2) ?? '',
      'Break (min)': r.totalBreakMinutes ?? 0,
      'WiFi OK': r.wifiVerified ? 'Yes' : 'No',
      Flagged: r.flagged ? 'Yes' : 'No',
    }));
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Attendance');
    renderTableHeader(ws, Object.keys(rows[0] || {}));
    rows.forEach((r, idx) => formatDataRow(ws.addRow(Object.values(r)), idx % 2 === 1));
    autoFitColumns(ws);
    return this._writeExcelBuffer(workbook);
  }

  async _writeExcelBuffer(workbook) {
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  }

  async getDashboardLiveStats(orgId, serverNow = new Date()) {
    const organization = await prisma.organization.findUnique({
      where: { id: orgId }, select: { timezone: true },
    });
    const today = dateOnly(serverNow, organization?.timezone || 'Africa/Lagos');

    const orgEmployees = await prisma.user.findMany({
      where: { orgId, role: 'EMPLOYEE', status: 'ACTIVE' },
      select: { id: true },
    });
    const empIds = orgEmployees.map((e) => e.id);
    const total = empIds.length;

    const [todayRecords, onLeave, flagged, openAlerts, activeSessions] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where: { employeeId: { in: empIds }, date: today },
        select: { employeeId: true, status: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.leaveRequest.count({ where: { employeeId: { in: empIds }, status: 'APPROVED', startDate: { lte: today }, endDate: { gte: today } } }),
      prisma.attendanceRecord.count({ where: { employeeId: { in: empIds }, date: today, flagged: true } }),
      prisma.fraudAlert.count({ where: { employeeId: { in: empIds }, status: 'NEW' } }),
      prisma.attendanceSession.count({ where: { office: { orgId }, status: { in: ['ACTIVE', 'PAUSED'] } } }),
    ]);

    const latestByEmployee = new Map();
    for (const record of todayRecords) {
      if (!latestByEmployee.has(record.employeeId)) latestByEmployee.set(record.employeeId, record.status);
    }
    const present = [...latestByEmployee.values()].filter((status) => status === 'PRESENT').length;
    const late = [...latestByEmployee.values()].filter((status) => status === 'LATE' || status === 'COMPLETELY_LATE').length;
    const absent = [...latestByEmployee.values()].filter((status) => status === 'ABSENT').length;
    const attendanceRate = total ? Math.round(((present + late) / total) * 100) : 0;
    return { total, present, late, onLeave, absent, notRecorded: Math.max(0, total - present - late - onLeave - absent), attendanceRate, flagged, openAlerts, activeSessions, serverDate: today.toISOString().slice(0, 10), timezone: organization?.timezone || 'Africa/Lagos' };
  }

  // ── private ──────────────────────────────────────────────────────────────────

  async _generate(reportType, start, end, adminId, orgId, extraFilter = {}) {
    const orgFilter = orgId
      ? { employee: { orgId, role: 'EMPLOYEE' } }
      : {};

    const records = await prisma.attendanceRecord.findMany({
      where: {
        date: { gte: start, lte: end },
        ...orgFilter,
        ...extraFilter,
      },
      include: { employee: { select: { firstName: true, lastName: true, departmentId: true, department: { select: { name: true } } } } },
    });

    const totalPresent  = records.filter((r) => r.status === 'PRESENT').length;
    const totalLate     = records.filter((r) => r.status === 'LATE' || r.status === 'COMPLETELY_LATE').length;
    const totalAbsent   = records.filter((r) => r.status === 'ABSENT').length;
    const totalOnLeave  = records.filter((r) => r.status === 'ON_LEAVE').length;
    const totalFlagged  = records.filter((r) => r.flagged).length;
    const avgWork       = records.filter((r) => r.totalWorkHours).reduce((s, r) => s + r.totalWorkHours, 0) / (records.length || 1);
    const avgBreak      = Math.round(records.reduce((s, r) => s + r.totalBreakMinutes, 0) / (records.length || 1));

    // Check adminId still exists (can be deleted after org removal)
    const adminExists = adminId
      ? await prisma.user.findUnique({ where: { id: adminId }, select: { id: true } }).catch(() => null)
      : null;

    const report = adminExists
      ? await prisma.attendanceReport.create({
          data: {
            id: uuidv4(), reportType,
            dateRangeStart: start, dateRangeEnd: end,
            totalPresent, totalLate, totalAbsent, totalOnLeave, totalFlagged,
            averageWorkHours: parseFloat(avgWork.toFixed(2)),
            averageBreakMinutes: avgBreak,
            generatedBy: adminId,
            metadata: { recordCount: records.length },
          },
        }).catch(() => ({ id: null, reportType }))
      : { id: null, reportType };

    return { report, records };
  }
}

module.exports = new ReportService();
