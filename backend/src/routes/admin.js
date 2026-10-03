const router = require('express').Router();
const { body, query } = require('express-validator');
const ctrl = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { isAdmin, isSuperAdmin } = require('../middleware/roleGuard');
const { validate } = require('../middleware/validate');
const upload = require('../middleware/upload');
const { prisma } = require('../config/database');
const { stationLimiter } = require('../middleware/rateLimiter');
const studentRoutes = require('./students');
const { validateFaceEnrollment, hasValidEnrolledFace } = require('../utils/faceVerify');
const { checkSubscription } = require('../middleware/subscriptionGuard');
const fs = require('fs');

// Enforce active subscription on admin operations (except redeem-code and subscription-status)
router.use(checkSubscription);

// Secure employee station. The admin session must already be authenticated;
// the employee then confirms their own password for each manual action.
router.get('/manual-attendance', authenticate, isAdmin, ctrl.getManualAttendance);
router.get('/manual-attendance/employee', authenticate, isAdmin, [query('email').isEmail().normalizeEmail()], validate, ctrl.findManualEmployee);
router.post('/manual-attendance/check-in', authenticate, isAdmin, stationLimiter, [
  body('employeeId').isUUID(),
  body('sessionId').isUUID(),
  body('password').notEmpty(),
  body('faceImage').optional({ nullable: true }).isString(),
  body('timestamp').optional({ nullable: true }).isISO8601(),
], validate, ctrl.manualCheckIn);
router.post('/manual-attendance/check-out', authenticate, isAdmin, stationLimiter, [
  body('employeeId').isUUID(),
  body('sessionId').optional({ nullable: true }).isUUID(),
  body('password').notEmpty(),
  body('faceImage').optional({ nullable: true }).isString(),
  body('timestamp').optional({ nullable: true }).isISO8601(),
], validate, ctrl.manualCheckOut);
router.post('/manual-attendance/batch-sync', authenticate, isAdmin, [
  body('records').isArray({ min: 1 }).withMessage('records must be an array with at least one record'),
], validate, ctrl.batchSyncAttendance);

router.get('/penalties', authenticate, isAdmin, ctrl.listPenalties);
router.post('/penalties', authenticate, isAdmin, [
  body('employeeId').isUUID(),
  body('amount').isInt({ min: 1 }),
  body('reason').trim().isLength({ min: 2, max: 500 }),
], validate, ctrl.createPenalty);
router.delete('/penalties/:id', authenticate, isAdmin, ctrl.deletePenalty);
router.delete('/penalties/auto/:employeeId', authenticate, isAdmin, ctrl.waiveEmployeeAutoPenalties);


// Organisation
router.get('/org', authenticate, isAdmin, ctrl.getOrg);
router.put('/org', authenticate, isSuperAdmin, ctrl.updateOrg);

// Offices
router.post('/offices', authenticate, isSuperAdmin, [
  body('name').notEmpty(),
  body('timezone').notEmpty(),
], validate, ctrl.createOffice);

// Get org plan info and capacity
router.get('/plan', authenticate, isAdmin, async (req, res, next) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.user.orgId },
      select: { subscriptionTier: true, maxEmployees: true, maxKiosks: true, maxOffices: true },
    });
    const [active, total, boundKiosks] = await Promise.all([
      prisma.user.count({ where: { orgId: req.user.orgId, role: 'EMPLOYEE', status: { not: 'TERMINATED' } } }),
      prisma.user.count({ where: { orgId: req.user.orgId, role: 'EMPLOYEE' } }),
      prisma.kioskDevice.count({ where: { orgId: req.user.orgId, isBound: true } }),
    ]);
    const maxEmployees = org?.maxEmployees ?? (org?.subscriptionTier === 'enterprise' ? 60 : 20);
    const maxKiosks = org?.maxKiosks ?? (org?.subscriptionTier === 'enterprise' ? null : 1);
    const tier = org?.subscriptionTier || 'starter';
    const planName = tier === 'enterprise' ? 'Enterprise' : tier === 'custom' ? 'Custom' : 'Starter';
    const canAddMore = maxEmployees === null ? true : active < maxEmployees;
    res.json({
      success: true,
      data: {
        plan: tier,
        planName,
        limit: maxEmployees,
        maxEmployees,
        maxKiosks,
        activeEmployees: active,
        totalEmployees: total,
        boundKiosks,
        canAddMore,
      },
    });
  } catch (err) { next(err); }
});

// Departments
router.post('/departments', authenticate, isAdmin, [
  body('name').notEmpty(),
], validate, ctrl.createDepartment);

// Users / Employees
router.get('/users', authenticate, isAdmin, ctrl.listUsers);
router.put('/users/:userId', authenticate, isAdmin, [
  body('email').optional().isEmail().withMessage('Valid email address is required').normalizeEmail(),
  body('password').optional({ checkFalsy: true }).isLength({ min: 1 }).withMessage('Password cannot be empty'),
  body('phone').optional({ nullable: true }).isString(),
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('departmentId').optional({ nullable: true }),
  body('checkInMethod').optional().isIn(['PHONE', 'MANUAL', 'BOTH']),
  body('officeId').optional({ nullable: true }),
  body('shiftType').optional().isIn(['FULL_TIME', 'MORNING', 'EVENING', 'AFTERNOON', 'NIGHT', 'FLEXIBLE']),
], validate, ctrl.updateUser);
router.get('/users/:userId/summary', authenticate, isAdmin, ctrl.employeeSummary);
router.put('/users/:userId/suspend', authenticate, isAdmin, ctrl.suspendUser);
router.post('/users/:userId/reset-device', authenticate, isAdmin, ctrl.resetDevice);
router.delete('/users/:userId', authenticate, isAdmin, ctrl.deleteEmployee);

// ─── Face photo upload ──────────────────────────────────────────────────────
// POST /api/admin/users/:userId/face  (multipart/form-data, field: photo)
router.post('/users/:userId/face',
  authenticate,
  isAdmin,
  async (req, res, next) => {
    try {
      const where = { id: req.params.userId, role: 'EMPLOYEE' };
      if (req.user.role !== 'SUPER_ADMIN') {
        const targetOrgId = await ctrl.resolveAdminOrgId(req);
        where.orgId = targetOrgId;
      }
      const employee = await prisma.user.findFirst({
        where,
        select: { id: true, profileImageUrl: true, faceEncodingData: true },
      });
      if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });
      if (hasValidEnrolledFace(employee)) {
        return res.status(400).json({
          success: false,
          code: 'FACE_ALREADY_ENROLLED',
          message: 'Employee face is already enrolled. Re-enrollment is not permitted.',
        });
      }
      next();
    } catch (err) { next(err); }
  },
  upload.single('photo'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No photo received. Make sure the field name is "photo".' });
      }
      const fileBuffer = fs.readFileSync(req.file.path);
      await validateFaceEnrollment(req.file.path, fileBuffer);
      const url = `/uploads/faces/${req.file.filename}`;

      const user = await prisma.user.update({
        where: { id: req.params.userId },
        data: {
          profileImageUrl: url,
          faceEncodingData: fileBuffer,
        },
        select: { id: true, firstName: true, lastName: true, profileImageUrl: true },
      });
      res.json({ success: true, data: user });
    } catch (err) {
      if (req.file?.path) fs.promises.unlink(req.file.path).catch(() => {});
      next(err);
    }
  }
);

// ─── Face photo release / removal ──────────────────────────────────────────
router.delete('/users/:userId/face', authenticate, isAdmin, ctrl.releaseEmployeeFace);
router.post('/users/:userId/release-face', authenticate, isAdmin, ctrl.releaseEmployeeFace);

// Security settings — admins may VIEW, but only SUPER_ADMIN may edit (Wi-Fi, geo, schedule)
router.get('/offices/:officeId/settings', authenticate, isAdmin, ctrl.getSecuritySettings);
router.put('/offices/:officeId/settings', authenticate, isSuperAdmin, ctrl.updateSecuritySettings);

// Break policy
router.put('/departments/:departmentId/break-policy', authenticate, isAdmin, ctrl.setBreakPolicy);
router.post('/breaks/:employeeId/start', authenticate, isAdmin, [
  body('breakType').isIn(['LUNCH', 'SHORT_BREAK', 'PRAYER', 'PERSONAL', 'NURSING']),
], validate, require('../controllers/breakController').startBreakForEmployee);
router.put('/breaks/:employeeId/:breakId/end', authenticate, isAdmin, require('../controllers/breakController').endBreakForEmployee);
router.put('/breaks/:breakId/waive-penalty', authenticate, isAdmin, require('../controllers/breakController').waiveBreakPenalty);


// Emergency
router.post('/emergency/stop-all', authenticate, isAdmin, [
  body('reason').notEmpty(),
  body('officeId').optional({ checkFalsy: true }).isUUID(),
], validate, ctrl.emergencyStopAll);

router.post('/emergency/lock-system', authenticate, isSuperAdmin, [
  body('reason').notEmpty(),
], validate, ctrl.emergencyLockSystem);

router.post('/emergency/invalidate-qr', authenticate, isAdmin, [
  body('reason').notEmpty(),
], validate, ctrl.emergencyInvalidateQR);

router.post('/emergency/:controlId/revert', authenticate, isAdmin, ctrl.emergencyRevert);

// Notifications
router.get('/notifications', authenticate, isAdmin, ctrl.getNotifications);

// Station Password for PWA 2.0 (configured by Desktop Admin)
router.get('/station-password', authenticate, isAdmin, ctrl.getStationPasswordStatus);
router.put('/station-password', authenticate, isAdmin, [
  body('stationPassword').isLength({ min: 4 }).withMessage('Station password must be at least 4 characters or digits'),
], validate, ctrl.setStationPassword);

// Kiosk Devices & Hardware Binding
router.get('/kiosk-devices', authenticate, isAdmin, ctrl.getKioskDevices);
router.put('/kiosk-devices/:id/release', authenticate, isAdmin, ctrl.releaseKioskDevice);

const { validateEmployeePassword } = require('../utils/passwordPolicy');

// Create an employee user (employees can use ANY type of password, including numbers only)
router.post('/employees', authenticate, isAdmin, [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').custom((val) => {
    const check = validateEmployeePassword(val);
    if (!check.valid) throw new Error(check.message);
    return true;
  }),
  body('checkInMethod').optional().isIn(['PHONE', 'MANUAL', 'BOTH']),
  body('officeId').optional({ nullable: true }),
  body('shiftType').optional().isIn(['FULL_TIME', 'MORNING', 'EVENING', 'AFTERNOON', 'NIGHT', 'FLEXIBLE']),
  body('phone').optional({ nullable: true }).isString(),
], validate, ctrl.createEmployee);

// Subscription & Activation
router.get('/subscription-status', authenticate, isAdmin, ctrl.getSubscriptionStatus);
router.post('/redeem-code', authenticate, isAdmin, [
  body('code').trim().notEmpty().withMessage('Activation code is required'),
], validate, ctrl.redeemCode);

router.use('/students', studentRoutes);

module.exports = router;
