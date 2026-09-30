const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');

router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  body().custom((body) => {
    if (!body.email) throw new Error('Email is required');
    return true;
  }),
], validate, ctrl.login);

const { validateStrongPassword } = require('../utils/passwordPolicy');

router.post('/logout',          authenticate, ctrl.logout);
router.post('/refresh',         [body('refreshToken').notEmpty()], validate, ctrl.refresh);
router.get('/me',               authenticate, ctrl.me);
router.put('/change-password',  authenticate, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').custom((val) => {
    const check = validateStrongPassword(val);
    if (!check.valid) throw new Error(check.message);
    return true;
  }),
], validate, ctrl.changePassword);

router.post('/station-login', authLimiter, [
  body('password').notEmpty().withMessage('Password is required'),
], validate, ctrl.stationLogin);

router.post('/forgot-password/verify', authLimiter, [
  body('email').isEmail().withMessage('A valid email address is required').normalizeEmail(),
], validate, ctrl.verifyResetEmail);

router.post('/forgot-password/reset', authLimiter, [
  body('email').isEmail().withMessage('A valid email address is required').normalizeEmail(),
  body('resetToken').notEmpty().withMessage('Reset token is required'),
  body('newPassword').custom((val) => {
    const check = validateStrongPassword(val);
    if (!check.valid) throw new Error(check.message);
    return true;
  }),
], validate, ctrl.resetPasswordWithToken);

module.exports = router;
