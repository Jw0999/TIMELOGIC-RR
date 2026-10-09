const WorkEventService = require('../services/WorkEventService');
const WorkforceRecordEngine = require('../services/WorkforceRecordEngine');

const getOrganizationId = (req) => {
  if (req.user.role !== 'SUPER_ADMIN') return req.user.orgId;
  return req.headers['x-organization-id'] || req.query.orgId || (req.user.orgId !== 'platform-org' ? req.user.orgId : null);
};

const getHistory = async (req, res, next) => {
  try {
    const employeeId = req.params.employeeId || req.user.id;
    if (req.user.role === 'EMPLOYEE' && employeeId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only view your own work history.' });
    }
    const orgId = getOrganizationId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization selection is required.' });
    const result = await WorkEventService.getEmployeeHistory(orgId, employeeId, {
      from: req.query.from,
      to: req.query.to,
      type: req.query.type,
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getTimeline = async (req, res, next) => {
  try {
    const employeeId = req.params.employeeId || req.user.id;
    if (req.user.role === 'EMPLOYEE' && employeeId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only view your own work history timeline.' });
    }
    const orgId = getOrganizationId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization selection is required.' });
    const timeline = await WorkforceRecordEngine.getEmployeeTimeline(orgId, employeeId, {
      date: req.query.date,
      recordId: req.query.recordId,
      sessionId: req.query.sessionId,
    });
    res.json({ success: true, data: timeline });
  } catch (error) {
    next(error);
  }
};

module.exports = { getHistory, getTimeline };

