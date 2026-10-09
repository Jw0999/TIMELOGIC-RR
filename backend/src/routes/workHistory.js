const router = require('express').Router();
const { query, param } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const controller = require('../controllers/workHistoryController');

const filters = [
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  query('type').optional().isString().isLength({ min: 2, max: 80 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 200 }),
];

router.get('/', authenticate, filters, validate, controller.getHistory);
router.get('/timeline/:employeeId', authenticate, [param('employeeId').isUUID()], validate, controller.getTimeline);
router.get('/:employeeId', authenticate, [param('employeeId').isUUID(), ...filters], validate, controller.getHistory);

module.exports = router;
