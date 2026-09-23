const { prisma } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const EmergencyControlService = require('../services/EmergencyControlService');
const AttendanceService = require('../services/AttendanceService');
const EmployeePolicy = require('../services/EmployeePolicyService');
const { hasValidEnrolledFace } = require('../utils/faceVerify');

// ── Organization / Office / Department ────────────────────────────────────────

const resolveAdminOrgId = async (req) => {
  const headerOrgId = req.headers['x-organization-id'];
  if (headerOrgId) return headerOrgId;
  if (req.query.orgId) return req.query.orgId;
  if (req.user.role === 'SUPER_ADMIN' && req.user.orgId === 'platform-org') {
    const orgWithUsers = await prisma.organization.findFirst({
      where: { id: { not: 'platform-org' } },
      orderBy: { users: { _count: 'desc' } },
      select: { id: true },
    });
    if (orgWithUsers) return orgWithUsers.id;
  }
  return req.user.orgId;
};

const getOrg = async (req, res, next) => {
  try {
    const targetOrgId = await resolveAdminOrgId(req);
    const org = await prisma.organization.findUnique({
      where: { id: targetOrgId },
      include: {
        offices: { orderBy: { createdAt: 'asc' }, include: { securitySettings: true, _count: { select: { sessions: true } } } },
        departments: { include: { _count: { select: { employees: true } } } },
        _count: { select: { users: true } },
      },
    });
    res.json({ success: true, data: org });
  } catch (err) { next(err); }
};

const updateOrg = async (req, res, next) => {
  try {
    const { name, industry, requireFaceVerification } = req.body;
    const targetOrgId = await resolveAdminOrgId(req);
    const org = await prisma.organization.update({
      where: { id: targetOrgId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(industry !== undefined ? { industry } : {}),
        ...(requireFaceVerification !== undefined ? { requireFaceVerification: Boolean(requireFaceVerification) } : {}),
      },
    });
    res.json({ success: true, data: org });
  } catch (err) { next(err); }
};

const createOffice = async (req, res, next) => {
  try {
    const { name, address, timezone } = req.body;
    const targetOrgId = await resolveAdminOrgId(req);
    const office = await prisma.office.create({
      data: { id: uuidv4(), orgId: targetOrgId, name, address, timezone },
    });
    await prisma.securitySettings.create({
      data: { id: uuidv4(), officeId: office.id, updatedBy: req.user.id },
    });
    res.status(201).json({ success: true, data: office });
  } catch (err) { next(err); }
};

const createDepartment = async (req, res, next) => {
  try {
    const { name, managerId } = req.body;
    const targetOrgId = await resolveAdminOrgId(req);
    if (managerId) {
      const manager = await prisma.user.findFirst({
        where: { id: managerId, orgId: targetOrgId }, select: { id: true },
      });
      if (!manager) return res.status(400).json({ success: false, message: 'Manager does not belong to your organization.' });
    }
    const dept = await prisma.department.create({
      data: { id: uuidv4(), orgId: targetOrgId, name, managerId },
    });
    res.status(201).json({ success: true, data: dept });
  } catch (err) { next(err); }
};

// ── Users ─────────────────────────────────────────────────────────────────────

const listUsers = async (req, res, next) => {
  try {
    const { role, status, departmentId, page = 1, limit = 20, search } = req.query;
    const skip = (+page - 1) * +limit;
    const targetOrgId = await resolveAdminOrgId(req);
    const where = {
      ...(targetOrgId ? { orgId: targetOrgId } : {}),
      // Admins never see TERMINATED employees — only Super Admin can via /api/super routes
      status: { not: 'TERMINATED' },
      ...(role && { role }),
      ...(status && status !== 'TERMINATED' && { status }),
      ...(departmentId && { departmentId }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, firstName: true, lastName: true, email: true,
          role: true, status: true, shiftType: true,
          profileImageUrl: true, employeeCode: true,
          phone: true, checkInMethod: true,
          faceEncodingData: true,
          department: {
            select: {
              id: true,
              name: true,
              breakPolicy: {
                select: { breakStart: true, breakEnd: true, totalDailyBreakLimit: true },
              },
            },
          },
        },
        orderBy: { firstName: 'asc' },
        skip,
        take: +limit,
      }),
      prisma.user.count({ where }),
    ]);
    const mappedUsers = users.map((u) => {
      const hasFace = Boolean(hasValidEnrolledFace(u));
      return {
        ...u,
        hasFaceEnrolled: hasFace,
        faceEncodingData: undefined,
      };
    });
    res.json({ success: true, data: mappedUsers, total, page: +page, totalPages: Math.ceil(total / +limit) });
  } catch (err) { next(err); }
};

const updateUser = async (req, res, next) => {
  try {
    // Tenant isolation: the target must belong to the admin's own organization
    const target = await prisma.user.findUnique({
      where: { id: req.params.userId }, select: { orgId: true, role: true },
    });
    if (!target || target.orgId !== req.user.orgId) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (target.role !== 'EMPLOYEE') {
      return res.status(403).json({ success: false, message: 'Only employee accounts can be modified here.' });
    }

    const { firstName, lastName, status, departmentId, shiftType, checkInMethod, phone } = req.body;
    if (departmentId) {
      const department = await prisma.department.findFirst({
        where: { id: departmentId, orgId: req.user.orgId }, select: { id: true },
      });
      if (!department) return res.status(400).json({ success: false, message: 'Department does not belong to your organization.' });
    }
    let allowedMethod;
    if (checkInMethod !== undefined) {
      const org = await EmployeePolicy.getOrganizationPolicy(req.user.orgId);
      allowedMethod = EmployeePolicy.assertMethodAllowed(org, checkInMethod);
      const openRecord = await prisma.attendanceRecord.findFirst({
        where: { employeeId: req.params.userId, clockOutTime: null },
        select: { checkInSource: true },
      });
      const nextCapabilities = EmployeePolicy.methodCapabilities(allowedMethod);
      if (
        (openRecord?.checkInSource === 'PHONE' && !nextCapabilities.phone) ||
        (openRecord?.checkInSource === 'MANUAL' && !nextCapabilities.manual)
      ) {
        return res.status(409).json({ success: false, message: 'Check this employee out before changing their check-in method.' });
      }
    }
    const user = await prisma.user.update({
      where: { id: req.params.userId },
      data: {
        ...(firstName !== undefined ? { firstName } : {}),
        ...(lastName !== undefined ? { lastName } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(departmentId !== undefined ? { departmentId: departmentId || null } : {}),
        ...(shiftType !== undefined ? { shiftType } : {}),
        ...(allowedMethod !== undefined ? { checkInMethod: allowedMethod } : {}),
        ...(phone !== undefined ? { phone: phone || null } : {}),
      },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, status: true, checkInMethod: true, phone: true },
    });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

const suspendUser = async (req, res, next) => {
  try {
    // Tenant isolation + never suspend a Super Admin
    const result = await prisma.user.updateMany({
      where: { id: req.params.userId, orgId: req.user.orgId, role: 'EMPLOYEE' },
      data: { status: 'SUSPENDED' },
    });
    if (result.count === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    await prisma.refreshToken.deleteMany({ where: { userId: req.params.userId } });
    res.json({ success: true, message: 'User suspended' });
  } catch (err) { next(err); }
};

// ── Security Settings ─────────────────────────────────────────────────────────

const getSecuritySettings = async (req, res, next) => {
  try {
    const settings = await prisma.securitySettings.findFirst({
      where: { officeId: req.params.officeId, office: { orgId: req.user.orgId } },
    });
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
};

const updateSecuritySettings = async (req, res, next) => {
  try {
    const ownedOffice = await prisma.office.findFirst({
      where: { id: req.params.officeId, orgId: req.user.orgId },
      select: { id: true },
    });
    if (!ownedOffice) return res.status(404).json({ success: false, message: 'Office not found.' });

    // Office-level field: Wi-Fi SSID lives on the Office model
    const { wifiSSID } = req.body;
    if (wifiSSID !== undefined) {
      await prisma.office.update({
        where: { id: req.params.officeId },
        data: { wifiSSID: (wifiSSID && wifiSSID.trim()) ? wifiSSID.trim() : null },
      });
    }

    // Everything else belongs to SecuritySettings — strip non-settings keys
    const {
      id, officeId, createdAt, updatedAt, updatedBy: _ub, wifiSSID: _w,
      ...settingsData
    } = req.body;

    const settings = await prisma.securitySettings.upsert({
      where:  { officeId: ownedOffice.id },
      update: settingsData,
      create: { id: uuidv4(), officeId: ownedOffice.id, ...settingsData },
    });

    const office = await prisma.office.findUnique({ where: { id: ownedOffice.id } });
    res.json({ success: true, data: { settings, office } });
  } catch (err) { next(err); }
};

// ── Break Policy ──────────────────────────────────────────────────────────────

const setBreakPolicy = async (req, res, next) => {
  try {
    const { departmentId } = req.params;
    const department = await prisma.department.findFirst({
      where: { id: departmentId, orgId: req.user.orgId }, select: { id: true },
    });
    if (!department) return res.status(404).json({ success: false, message: 'Department not found.' });
    const policy = await prisma.breakPolicy.upsert({
      where: { departmentId },
      create: { id: uuidv4(), departmentId, ...req.body },
      update: req.body,
    });
    res.json({ success: true, data: policy });
  } catch (err) { next(err); }
};

// ── Emergency Controls ────────────────────────────────────────────────────────

// Resolve the correct officeId — admin may pass orgId accidentally; fall back to first office
async function resolveOfficeId(officeIdOrOrgId, orgId) {
  if (officeIdOrOrgId) {
    // Check if it's a valid officeId
    const asOffice = await prisma.office.findFirst({ where: { id: officeIdOrOrgId, orgId }, select: { id: true } });
    if (asOffice) return asOffice.id;
  }
  // Fall back to first active office for the admin's org
  const office = await prisma.office.findFirst({ where: { orgId, isActive: true }, select: { id: true } });
  return office?.id ?? null;
}

const emergencyStopAll = async (req, res, next) => {
  try {
    const { reason, officeId } = req.body;
    if (!reason?.trim()) return res.status(400).json({ success: false, message: 'Reason is required.' });
    const resolvedOfficeId = await resolveOfficeId(officeId, req.user.orgId);
    if (!resolvedOfficeId) return res.status(404).json({ success: false, message: 'No active office found for this organization.' });
    const control = await EmergencyControlService.stopAllAttendance(req.user.id, reason, resolvedOfficeId);
    res.json({ success: true, data: control });
  } catch (err) { next(err); }
};

const emergencyLockSystem = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason?.trim()) return res.status(400).json({ success: false, message: 'Reason is required.' });
    const control = await EmergencyControlService.lockSystem(req.user.id, reason, req.user.orgId);
    res.json({ success: true, data: control });
  } catch (err) { next(err); }
};

const emergencyInvalidateQR = async (req, res, next) => {
  try {
    const { reason, officeId } = req.body;
    if (!reason?.trim()) return res.status(400).json({ success: false, message: 'Reason is required.' });
    const resolvedOfficeId = await resolveOfficeId(officeId, req.user.orgId);
    if (!resolvedOfficeId) return res.status(404).json({ success: false, message: 'No active office found for this organization.' });
    const control = await EmergencyControlService.invalidateAllQR(req.user.id, reason, resolvedOfficeId);
    res.json({ success: true, data: control });
  } catch (err) { next(err); }
};

const emergencyRevert = async (req, res, next) => {
  try {
    const control = await EmergencyControlService.revert(req.user.id, req.params.controlId);
    res.json({ success: true, data: control });
  } catch (err) { next(err); }
};

const bcrypt = require('bcryptjs');
const env = require('../config/env');

const getNotifications = async (req, res, next) => {
  try {
    const orgUserIds = (await prisma.user.findMany({
      where: { orgId: req.user.orgId },
      select: { id: true },
    })).map((user) => user.id);
    const notifs = await prisma.notificationLog.findMany({
      where: { userId: { in: orgUserIds } },
      orderBy: { sentAt: 'desc' },
      take: 20,
    });
    res.json({ success: true, data: notifs });
  } catch (err) { next(err); }
};

const createEmployee = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, employeeCode, departmentId, shiftType, phone, checkInMethod = 'PHONE' } = req.body;
    const targetOrgId = await resolveAdminOrgId(req);

    const org = await prisma.organization.findUnique({
      where: { id: targetOrgId },
      select: {
        name: true,
        allowDeviceCheckIn: true, allowManualCheckIn: true,
      },
    });
    const allowedMethod = EmployeePolicy.assertMethodAllowed(org, checkInMethod);

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return res.status(400).json({ success: false, message: 'Email already in use.' });
    if (employeeCode) {
      const codeOwner = await prisma.user.findFirst({ where: { orgId: targetOrgId, employeeCode } });
      if (codeOwner) return res.status(400).json({ success: false, message: 'Employee code already in use.' });
    }
    if (departmentId) {
      const department = await prisma.department.findFirst({
        where: { id: departmentId, orgId: targetOrgId }, select: { id: true },
      });
      if (!department) return res.status(400).json({ success: false, message: 'Department does not belong to your organization.' });
    }
    const passwordHash = await bcrypt.hash(password, +(env.BCRYPT_ROUNDS || 12));
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        orgId: targetOrgId,
        firstName, lastName,
        email: email.toLowerCase(),
        employeeCode: employeeCode || null,
        passwordHash,
        role: 'EMPLOYEE',
        status: 'ACTIVE',
        shiftType: shiftType || 'MORNING',
        departmentId: departmentId || null,
        phone: phone || null,
        checkInMethod: allowedMethod,
      },
      select: { id: true, firstName: true, lastName: true, email: true, employeeCode: true, role: true, status: true, shiftType: true, phone: true, checkInMethod: true },
    });
    // Initialize leave balances
    const types = ['ANNUAL','SICK','CASUAL','MATERNITY','PATERNITY','UNPAID','COMPASSIONATE'];
    const defaults = { ANNUAL:14, SICK:10, CASUAL:5, MATERNITY:90, PATERNITY:14, UNPAID:0, COMPASSIONATE:3 };
    const year = new Date().getFullYear();
    for (const lt of types) {
      await prisma.leaveBalance.create({ data: { id: uuidv4(), employeeId: user.id, leaveType: lt, year, totalEntitled: defaults[lt], remaining: defaults[lt] } });
    }
    res.status(201).json({ success: true, data: user });
  } catch (err) { next(err); }
};

const deleteEmployee = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { orgId: true, role: true, status: true } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role !== 'EMPLOYEE') return res.status(403).json({ success: false, message: 'Only employee accounts can be terminated here.' });
    if (user.orgId !== req.user.orgId) return res.status(403).json({ success: false, message: 'Access denied' });

    // SOFT DELETE — set status to TERMINATED (keeps all records for audit/history)
    // The login flow already blocks users whose status !== 'ACTIVE'
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'TERMINATED' },
    });

    // Revoke all refresh tokens so the employee is immediately signed out
    await prisma.refreshToken.deleteMany({ where: { userId } });

    res.json({
      success: true,
      message: 'Employee has been terminated. They can no longer log in. All records are preserved and visible to Super Admin.',
    });
  } catch (err) { next(err); }
};

const employeeSummary = async (req, res, next) => {
  try {
    const employee = await prisma.user.findFirst({
      where: { id: req.params.userId, orgId: req.user.orgId, role: 'EMPLOYEE' },
      select: { id: true },
    });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });
    const [penalties, breakPenalties, manualPenalties, attendanceCount] = await Promise.all([
      prisma.attendanceRecord.aggregate({ where: { employeeId: employee.id }, _sum: { penalty: true } }),
      prisma.breakRecord.aggregate({ where: { employeeId: employee.id }, _sum: { penalty: true } }),
      prisma.manualPenalty.aggregate({ where: { employeeId: employee.id }, _sum: { amount: true } }),
      prisma.attendanceRecord.count({ where: { employeeId: employee.id } }),
    ]);
    const attendancePenalty = penalties._sum.penalty ?? 0;
    const breakPenalty = breakPenalties._sum.penalty ?? 0;
    const manualPenalty = manualPenalties._sum.amount ?? 0;
    res.json({
      success: true,
      data: {
        attendancePenalty,
        breakPenalty,
        manualPenalty,
        totalPenalty: attendancePenalty + breakPenalty + manualPenalty,
        attendanceCount,
      },
    });
  } catch (err) { next(err); }
};

// POST /api/admin/users/:userId/reset-device
// Frees an employee's device binding so they can sign in on a NEW phone. The
// first device used after this becomes their bound device; the old one is
// rejected (it no longer matches the active binding).
const resetDevice = async (req, res, next) => {
  try {
    const { userId } = req.params;
    // Tenant isolation: admins can only reset employees in their own org.
    const where = req.user.role === 'SUPER_ADMIN'
      ? { id: userId, role: 'EMPLOYEE' }
      : { id: userId, orgId: req.user.orgId, role: 'EMPLOYEE' };
    const emp = await prisma.user.findFirst({ where, select: { id: true } });
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });

    const result = await prisma.registeredDevice.updateMany({
      where: { employeeId: userId, isActive: true },
      data: { isActive: false },
    });
    res.json({
      success: true,
      cleared: result.count,
      message: 'Device unlinked. The employee can now sign in on a new device, which becomes their bound device. The old device will no longer work.',
    });
  } catch (err) { next(err); }
};

const getManualAttendance = async (req, res, next) => {
  try {
    const targetOrgId = await resolveAdminOrgId(req);
    const data = await AttendanceService.getManualDashboard(targetOrgId, req.query);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const findManualEmployee = async (req, res, next) => {
  try {
    const targetOrgId = await resolveAdminOrgId(req);
    const data = await AttendanceService.findManualEmployee(targetOrgId, req.query.email);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const manualCheckIn = async (req, res, next) => {
  try {
    const targetOrgId = await resolveAdminOrgId(req);
    const data = await AttendanceService.manualCheckIn(req.user.id, targetOrgId, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

const manualCheckOut = async (req, res, next) => {
  try {
    const targetOrgId = await resolveAdminOrgId(req);
    const data = await AttendanceService.manualCheckOut(req.user.id, targetOrgId, req.body);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const listPenalties = async (req, res, next) => {
  try {
    const targetOrgId = await resolveAdminOrgId(req);
    const month = String(req.query.month || '');
    const monthMatch = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month);
    const dateFilter = monthMatch ? {
      createdAt: {
        gte: new Date(Date.UTC(Number(monthMatch[1]), Number(monthMatch[2]) - 1, 1)),
        lt: new Date(Date.UTC(Number(monthMatch[1]), Number(monthMatch[2]), 1)),
      },
    } : {};
    const penalties = await prisma.manualPenalty.findMany({
      where: { orgId: targetOrgId, ...dateFilter },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: penalties });
  } catch (err) { next(err); }
};

const createPenalty = async (req, res, next) => {
  try {
    const targetOrgId = await resolveAdminOrgId(req);
    const { employeeId, amount, reason } = req.body;
    const employee = await prisma.user.findFirst({
      where: { id: employeeId, orgId: targetOrgId, role: 'EMPLOYEE', status: { not: 'TERMINATED' } },
      select: { id: true },
    });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });
    const penalty = await prisma.manualPenalty.create({
      data: { orgId: targetOrgId, employeeId, amount: Number(amount), reason: reason.trim(), createdById: req.user.id },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });
    res.status(201).json({ success: true, data: penalty });
  } catch (err) { next(err); }
};

const deletePenalty = async (req, res, next) => {
  try {
    const targetOrgId = await resolveAdminOrgId(req);
    const { id } = req.params;
    const penalty = await prisma.manualPenalty.findFirst({
      where: { id, orgId: targetOrgId },
    });
    if (!penalty) return res.status(404).json({ success: false, message: 'Manual penalty not found.' });
    await prisma.manualPenalty.delete({ where: { id } });
    res.json({ success: true, message: 'Penalty removed successfully.' });
  } catch (err) { next(err); }
};

const waiveEmployeeAutoPenalties = async (req, res, next) => {
  try {
    const targetOrgId = await resolveAdminOrgId(req);
    const { employeeId } = req.params;
    const month = String(req.query.month || '');
    const employee = await prisma.user.findFirst({
      where: { id: employeeId, orgId: targetOrgId, role: 'EMPLOYEE' },
      select: { id: true },
    });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });

    let dateFilter = {};
    const monthMatch = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month);
    if (monthMatch) {
      const start = new Date(Date.UTC(Number(monthMatch[1]), Number(monthMatch[2]) - 1, 1));
      const end = new Date(Date.UTC(Number(monthMatch[1]), Number(monthMatch[2]), 1));
      dateFilter = { gte: start, lt: end };
    }

    const [updatedAttendance, updatedBreaks] = await Promise.all([
      prisma.attendanceRecord.updateMany({
        where: {
          employeeId,
          ...(monthMatch ? { date: dateFilter } : {}),
          penalty: { gt: 0 },
        },
        data: { penalty: 0, reviewNotes: 'WAIVED_BY_ADMIN' },
      }),
      prisma.breakRecord.updateMany({
        where: {
          employeeId,
          ...(monthMatch ? { startTime: dateFilter } : {}),
          penalty: { gt: 0 },
        },
        data: { penalty: 0 },
      }),
    ]);

    res.json({
      success: true,
      message: 'Auto penalties removed successfully.',
      cleared: {
        attendanceRecords: updatedAttendance.count,
        breakRecords: updatedBreaks.count,
      },
    });
  } catch (err) { next(err); }
};

module.exports = {
  getOrg, updateOrg,
  createOffice,
  createDepartment,
  listUsers, updateUser, suspendUser, deleteEmployee, employeeSummary, resetDevice,
  getSecuritySettings, updateSecuritySettings,
  setBreakPolicy,
  emergencyStopAll, emergencyLockSystem, emergencyInvalidateQR, emergencyRevert,
  getNotifications, createEmployee,
  getManualAttendance, findManualEmployee, manualCheckIn, manualCheckOut,
  listPenalties, createPenalty, deletePenalty, waiveEmployeeAutoPenalties,
  resolveAdminOrgId,
};
