const StudentAttendanceService = require('../services/StudentAttendanceService');
const { prisma } = require('../config/database');

async function resolveStudentOrgId(req) {
  const headerOrgId = req.headers['x-organization-id'];
  if (headerOrgId) return headerOrgId;
  if (req.query.orgId) return req.query.orgId;
  if (req.user.role === 'SUPER_ADMIN' && req.user.orgId === 'platform-org') {
    const orgWithStudents = await prisma.organization.findFirst({
      where: { students: { some: {} } },
      select: { id: true },
    }) || await prisma.organization.findFirst({
      where: { hasStudents: true },
      select: { id: true },
    });
    if (orgWithStudents) return orgWithStudents.id;
  }
  return req.user.orgId;
}

const list = async (req, res, next) => {
  try {
    const orgId = await resolveStudentOrgId(req);
    const result = await StudentAttendanceService.list(orgId, req.query);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const orgId = await resolveStudentOrgId(req);
    const student = await StudentAttendanceService.create(orgId, req.body);
    res.status(201).json({ success: true, data: student });
  } catch (error) { next(error); }
};

const history = async (req, res, next) => {
  try {
    const orgId = await resolveStudentOrgId(req);
    const result = await StudentAttendanceService.history(orgId, req.query);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const orgId = await resolveStudentOrgId(req);
    const student = await StudentAttendanceService.update(orgId, req.params.studentId, req.body);
    res.json({ success: true, data: student });
  } catch (error) { next(error); }
};

const archive = async (req, res, next) => {
  try {
    const orgId = await resolveStudentOrgId(req);
    const student = await StudentAttendanceService.archive(orgId, req.params.studentId);
    res.json({ success: true, data: student });
  } catch (error) { next(error); }
};

const checkIn = async (req, res, next) => {
  try {
    const orgId = await resolveStudentOrgId(req);
    const record = await StudentAttendanceService.checkIn(orgId, req.user.id, req.params.studentId);
    res.status(201).json({ success: true, data: record });
  } catch (error) { next(error); }
};

const checkOut = async (req, res, next) => {
  try {
    const orgId = await resolveStudentOrgId(req);
    const record = await StudentAttendanceService.checkOut(orgId, req.user.id, req.params.studentId);
    res.json({ success: true, data: record });
  } catch (error) { next(error); }
};

module.exports = { list, history, create, update, archive, checkIn, checkOut };
