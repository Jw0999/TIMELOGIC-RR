const FraudDetectionEngine = require('../services/FraudDetectionEngine');
const { prisma } = require('../config/database');

const getAlerts = async (req, res, next) => {
  try {
    const { status, severity, page = 1, limit = 100 } = req.query;
    const skip = (+page - 1) * +limit;

    const headerOrgId = req.headers['x-organization-id'] || req.query.orgId;
    let orgFilter = {};
    if (headerOrgId && headerOrgId !== 'platform-org') {
      orgFilter = { employee: { orgId: headerOrgId } };
    } else if (req.user.role !== 'SUPER_ADMIN') {
      orgFilter = { employee: { orgId: req.user.orgId } };
    }

    const where = {
      ...orgFilter,
      ...(status && status !== 'All' ? { status } : {}),
      ...(severity && { severity }),
    };

    const [alerts, total] = await Promise.all([
      prisma.fraudAlert.findMany({
        where,
        include: {
          employee: {
            select: {
              firstName: true, lastName: true, employeeCode: true, role: true,
              organization: { select: { name: true } },
            },
          },
          session: { select: { sessionName: true, startTime: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: +limit,
      }),
      prisma.fraudAlert.count({ where }),
    ]);
    res.json({ success: true, data: alerts, total, page: +page, totalPages: Math.ceil(total / +limit) });
  } catch (err) { next(err); }
};

const getAlertsByEmployee = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const alerts = await FraudDetectionEngine.getAlertsByEmployee(employeeId, req.query);
    res.json({ success: true, data: alerts });
  } catch (err) { next(err); }
};

const resolveAlert = async (req, res, next) => {
  try {
    const { resolution } = req.body;
    const alert = await FraudDetectionEngine.resolveAlert(req.params.alertId, req.user.id, resolution);
    res.json({ success: true, data: alert });
  } catch (err) { next(err); }
};

const dismissAlert = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const alert = await FraudDetectionEngine.dismissAlert(req.params.alertId, req.user.id, reason);
    res.json({ success: true, data: alert });
  } catch (err) { next(err); }
};

const escalateAlert = async (req, res, next) => {
  try {
    const alert = await FraudDetectionEngine.escalateAlert(req.params.alertId);
    res.json({ success: true, data: alert });
  } catch (err) { next(err); }
};

const logScreenshot = async (req, res, next) => {
  try {
    const { deviceId, platform, sessionId } = req.body;
    await FraudDetectionEngine.logScreenshotAttempt(req.user.id, deviceId, platform, sessionId);
    res.json({ success: true, message: 'Logged' });
  } catch (err) { next(err); }
};

module.exports = { getAlerts, getAlertsByEmployee, resolveAlert, dismissAlert, escalateAlert, logScreenshot };
