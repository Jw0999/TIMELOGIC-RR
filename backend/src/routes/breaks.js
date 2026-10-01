const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/breakController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { checkSubscription } = require('../middleware/subscriptionGuard');

// Enforce active subscription on break tracking
router.use(checkSubscription);

router.post('/', authenticate, [
  body('breakType').isIn(['LUNCH', 'SHORT_BREAK', 'PRAYER', 'PERSONAL', 'NURSING']),
], validate, ctrl.startBreak);

router.put('/:breakId/end', authenticate, ctrl.endBreak);

router.get('/active', authenticate, ctrl.getActiveBreak);

router.get('/daily', authenticate, ctrl.getDailyBreaks);

router.get('/daily/:employeeId', authenticate, ctrl.getDailyBreaks);

module.exports = router;
