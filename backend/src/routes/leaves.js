const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/leaveController');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleGuard');
const { validate } = require('../middleware/validate');

router.post('/', authenticate, [
  body('leaveType').isIn(['ANNUAL', 'SICK', 'CASUAL', 'MATERNITY', 'PATERNITY', 'UNPAID', 'COMPASSIONATE']),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
], validate, ctrl.requestLeave);

router.post('/admin', authenticate, isAdmin, [
  body('employeeId').isUUID(),
  body('leaveType').isIn(['ANNUAL', 'SICK', 'CASUAL', 'MATERNITY', 'PATERNITY', 'UNPAID', 'COMPASSIONATE']),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
  body('reason').trim().notEmpty(),
], validate, ctrl.grantLeaveForEmployee);

router.get('/mine', authenticate, ctrl.getMyLeaves);

router.get('/pending', authenticate, isAdmin, ctrl.getPendingLeaves);
router.get('/admin', authenticate, isAdmin, ctrl.getAdminLeaves);
router.put('/:leaveId/stop', authenticate, isAdmin, ctrl.stopLeaveForEmployee);

router.get('/team-calendar', authenticate, ctrl.getTeamCalendar);

router.get('/balance', authenticate, ctrl.getBalance);

router.get('/balance/:employeeId', authenticate, isAdmin, ctrl.getBalance);

router.put('/:leaveId/approve', authenticate, isAdmin, ctrl.approveLeave);

router.put('/:leaveId/reject', authenticate, isAdmin, [
  body('reason').notEmpty(),
], validate, ctrl.rejectLeave);

router.delete('/:leaveId', authenticate, ctrl.cancelLeave);

module.exports = router;
