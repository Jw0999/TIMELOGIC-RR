const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/fraudController');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleGuard');
const { validate } = require('../middleware/validate');
const { checkSubscription } = require('../middleware/subscriptionGuard');

// Enforce active subscription on fraud alert investigation
router.use(checkSubscription);

router.get('/', authenticate, isAdmin, ctrl.getAlerts);

router.get('/employee/:employeeId', authenticate, isAdmin, ctrl.getAlertsByEmployee);

router.put('/:alertId/resolve', authenticate, isAdmin, [
  body('resolution').notEmpty(),
], validate, ctrl.resolveAlert);

router.put('/:alertId/dismiss', authenticate, isAdmin, [
  body('reason').notEmpty(),
], validate, ctrl.dismissAlert);

router.put('/:alertId/escalate', authenticate, isAdmin, ctrl.escalateAlert);

// Employee-side: report screenshot attempt
router.post('/screenshot', authenticate, [
  body('platform').notEmpty(),
  body('sessionId').isUUID(),
], validate, ctrl.logScreenshot);

module.exports = router;
