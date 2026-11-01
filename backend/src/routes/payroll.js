const router = require('express').Router();
const { body, query, param } = require('express-validator');
const ctrl = require('../controllers/payrollController');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleGuard');
const { validate } = require('../middleware/validate');
const { checkSubscription } = require('../middleware/subscriptionGuard');

// Require authentication and active subscription for all payroll endpoints
router.use(authenticate);
router.use(checkSubscription);

/**
 * GET /api/payroll/overview
 * Get employee payroll list with salary, attendance penalties, and net earnings
 */
router.get(
  '/overview',
  isAdmin,
  [
    query('year').optional().isInt({ min: 2020, max: 2100 }),
    query('month').optional().isInt({ min: 1, max: 12 }),
  ],
  validate,
  ctrl.getOverview
);

/**
 * PUT /api/payroll/employees/:id/salary
 * Set employee base salary and bank disbursement details
 */
router.put(
  '/employees/:id/salary',
  isAdmin,
  [
    param('id').isUUID(),
    body('baseSalary').isFloat({ min: 0 }).withMessage('Base salary must be a positive number'),
    body('salaryCurrency').optional().isString().isLength({ min: 2, max: 5 }),
    body('bankName').optional({ nullable: true }).isString(),
    body('accountNumber').optional({ nullable: true }).isString(),
    body('accountName').optional({ nullable: true }).isString(),
  ],
  validate,
  ctrl.setEmployeeSalary
);

/**
 * GET /api/payroll/settings
 * Get organization payroll schedule & WhatsApp automation configuration
 */
router.get('/settings', isAdmin, ctrl.getSettings);

/**
 * PUT /api/payroll/settings
 * Update payroll payout day, WhatsApp provider keys, and automation toggle
 */
router.put(
  '/settings',
  isAdmin,
  [
    body('salaryPayoutDay').optional().isInt({ min: 1, max: 31 }),
    body('salaryAutomationEnabled').optional().isBoolean(),
    body('salaryCurrency').optional().isString().isLength({ min: 2, max: 5 }),
    body('whatsappProvider').optional().isIn(['META', 'TWILIO', 'WEB_LINK']),
    body('whatsappPhoneId').optional({ nullable: true }).isString(),
    body('whatsappSenderNumber').optional({ nullable: true }).isString(),
    body('whatsappApiToken').optional({ nullable: true }).isString(),
  ],
  validate,
  ctrl.updateSettings
);

/**
 * POST /api/payroll/calculate
 * Calculate/recalculate and snapshot monthly payroll for all employees
 */
router.post(
  '/calculate',
  isAdmin,
  [
    body('year').optional().isInt({ min: 2020, max: 2100 }),
    body('month').optional().isInt({ min: 1, max: 12 }),
  ],
  validate,
  ctrl.calculatePayroll
);


/**
 * GET /api/payroll/payslips/:id/pdf
 * Generate and stream download of branded employee payslip PDF (Authenticated)
 */
router.get(
  '/payslips/:id/pdf',
  [param('id').isUUID()],
  validate,
  ctrl.downloadPayslipPdf
);

/**
 * POST /api/payroll/payslips/:id/email
 * Dispatch official payslip PDF to employee via email
 */
router.post(
  '/payslips/:id/email',
  isAdmin,
  [param('id').isUUID()],
  validate,
  ctrl.sendEmail
);

/**
 * POST /api/payroll/complete-payout
 * Finalize monthly payout and dispatch official payslip PDFs to all employees via email
 */
router.post(
  '/complete-payout',
  isAdmin,
  [
    body('year').isInt({ min: 2020, max: 2100 }),
    body('month').isInt({ min: 1, max: 12 }),
  ],
  validate,
  ctrl.completePayout
);

/**
 * Legacy aliases for backwards compatibility
 */
router.post(
  '/payslips/:id/whatsapp',
  isAdmin,
  [param('id').isUUID()],
  validate,
  ctrl.sendEmail
);

router.post(
  '/batch-whatsapp',
  isAdmin,
  [
    body('year').isInt({ min: 2020, max: 2100 }),
    body('month').isInt({ min: 1, max: 12 }),
  ],
  validate,
  ctrl.completePayout
);

/**
 * GET /api/payroll/additions
 * List all salary additions / bonuses with optional filtering
 */
router.get(
  '/additions',
  isAdmin,
  [
    query('employeeId').optional().isUUID(),
    query('month').optional().matches(/^(\d{4})-(0[1-9]|1[0-2])$/),
    query('type').optional().isString(),
    query('search').optional().isString(),
  ],
  validate,
  ctrl.listAdditions
);

/**
 * POST /api/payroll/additions
 * Add money to an employee salary with reason and optional permanent base salary update
 */
router.post(
  '/additions',
  isAdmin,
  [
    body('employeeId').isUUID().withMessage('Valid employee selection is required'),
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least 1'),
    body('reason').trim().isLength({ min: 2, max: 500 }).withMessage('Reason must be between 2 and 500 characters'),
    body('type').optional().isIn(['BONUS', 'ALLOWANCE', 'INCREMENT', 'COMMISSION', 'OTHER']),
    body('effectiveDate').optional().isISO8601(),
    body('updateBaseSalary').optional().isBoolean(),
  ],
  validate,
  ctrl.createAddition
);

/**
 * DELETE /api/payroll/additions/:id
 * Remove a salary addition record and recalculate payroll
 */
router.delete(
  '/additions/:id',
  isAdmin,
  [param('id').isUUID()],
  validate,
  ctrl.deleteAddition
);

module.exports = router;
