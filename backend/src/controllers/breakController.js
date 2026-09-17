const BreakService = require('../services/BreakService');
const { prisma } = require('../config/database');
const { dayBounds } = require('../utils/attendanceClock');

const startBreak = async (req, res, next) => {
  try {
    const { breakType, notes } = req.body;
    const record = await BreakService.startBreak(req.user.id, breakType, notes);
    res.status(201).json({ success: true, data: record });
  } catch (err) { next(err); }
};

const startBreakForEmployee = async (req, res, next) => {
  try {
    const employee = await prisma.user.findFirst({
      where: { id: req.params.employeeId, orgId: req.user.orgId, role: 'EMPLOYEE', status: { not: 'TERMINATED' } },
      select: { id: true },
    });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });
    const { breakType, notes } = req.body;
    const record = await BreakService.startBreakForEmployee(employee.id, breakType, notes || `Started by admin ${req.user.id}`);
    res.status(201).json({ success: true, data: record });
  } catch (err) { next(err); }
};

const endBreak = async (req, res, next) => {
  try {
    const { wifiSSID } = req.body;
    const record = await BreakService.endBreak(req.user.id, req.params.breakId, { wifiSSID, admin: false });
    res.json({ success: true, data: record });
  } catch (err) { next(err); }
};

const endBreakForEmployee = async (req, res, next) => {
  try {
    const employee = await prisma.user.findFirst({
      where: { id: req.params.employeeId, orgId: req.user.orgId, role: 'EMPLOYEE', status: { not: 'TERMINATED' } },
      select: { id: true },
    });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });
    const { breakId } = req.params;
    const record = await BreakService.endBreak(employee.id, breakId, { wifiSSID: req.body?.wifiSSID, admin: true });
    res.json({ success: true, data: record });
  } catch (err) { next(err); }
};

const getActiveBreak = async (req, res, next) => {
  try {
    const record = await BreakService.getActiveBreak(req.user.id);
    res.json({ success: true, data: record });
  } catch (err) { next(err); }
};

const getDailyBreaks = async (req, res, next) => {
  try {
    const { date } = req.query;

    if (req.params?.employeeId) {
      const employee = await prisma.user.findFirst({
        where: { id: req.params.employeeId, orgId: req.user.orgId, role: 'EMPLOYEE' }, select: { id: true },
      });
      if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });
      // Specific employee — verify they belong to admin's org first
      const records = await BreakService.getDailyBreaks(req.params.employeeId, date);
      return res.json({ success: true, data: BreakService.withLifecycleStatus(records) });
    }

    // Admin requesting breaks → scope to their org (or selected org / all orgs for SUPER_ADMIN)
    if (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN') {
      const targetOrgId = req.headers['x-organization-id'] || req.query.orgId || (req.user.orgId !== 'platform-org' ? req.user.orgId : null);
      const orgFilter = targetOrgId ? { employee: { orgId: targetOrgId } } : {};

      const isAll = date === 'all' || req.query.all === 'true' || date === '*';
      let dateFilter = {};
      if (!isAll) {
        const organization = await prisma.organization.findUnique({
          where: { id: targetOrgId || req.user.orgId }, select: { timezone: true },
        });
        const requested = date && /^\d{4}-\d{2}-\d{2}$/.test(String(date))
          ? new Date(`${date}T12:00:00.000Z`)
          : date ? new Date(date) : new Date();
        const bounds = dayBounds(requested, organization?.timezone || 'Africa/Lagos');
        dateFilter = { startTime: { gte: bounds.start, lt: bounds.end } };
      }

      const records = await prisma.breakRecord.findMany({
        where: { ...orgFilter, ...dateFilter },
        include: {
          employee: {
            select: {
              id: true, firstName: true, lastName: true,
              employeeCode: true,
              organization: { select: { timezone: true, name: true } },
              department: { select: { name: true, breakPolicy: true } },
            },
          },
        },
        orderBy: { startTime: 'desc' },
      });

      return res.json({ success: true, data: records });
    }

    // Employee requesting their own breaks
    const records = await BreakService.getDailyBreaks(req.user.id, date);
    res.json({ success: true, data: records });
  } catch (err) { next(err); }
};

const waiveBreakPenalty = async (req, res, next) => {
  try {
    const { breakId } = req.params;
    const targetOrgId = req.headers['x-organization-id'] || req.query.orgId || (req.user.orgId !== 'platform-org' ? req.user.orgId : null);
    const orgFilter = targetOrgId ? { employee: { orgId: targetOrgId } } : (req.user.orgId !== 'platform-org' ? { employee: { orgId: req.user.orgId } } : {});
    const brk = await prisma.breakRecord.findFirst({
      where: { id: breakId, ...orgFilter },
    });
    if (!brk) return res.status(404).json({ success: false, message: 'Break record not found.' });
    const updated = await prisma.breakRecord.update({
      where: { id: breakId },
      data: { penalty: 0 },
    });
    res.json({ success: true, data: updated, message: 'Break penalty waived successfully.' });
  } catch (err) { next(err); }
};

module.exports = { startBreak, startBreakForEmployee, endBreak, endBreakForEmployee, getActiveBreak, getDailyBreaks, waiveBreakPenalty };

