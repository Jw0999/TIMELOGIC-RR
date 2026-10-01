const AuthService = require('../services/AuthenticationService');
const AuditService = require('../services/AuditService');
const { prisma } = require('../config/database');
const { getOrgSubscriptionStatus } = require('../utils/subscription');

const login = async (req, res, next) => {
  try {
    const { email, password, deviceFingerprint } = req.body;
    const result = await AuthService.login(email, password, deviceFingerprint, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await AuthService.logout(req.user.id, refreshToken);
    res.json({ success: true, message: 'Logged out' });
  } catch (err) { next(err); }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await AuthService.refreshAccessToken(refreshToken);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

const me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, firstName: true, lastName: true, email: true,
        role: true, status: true, shiftType: true,
        checkInMethod: true, phone: true,
        profileImageUrl: true, employeeCode: true,
        departmentId: true, officeId: true, orgId: true, lastLoginAt: true, createdAt: true,
        department: { select: { name: true } },
        office: { select: { id: true, name: true } },
        organization: {
          select: {
            id: true, name: true, allowDeviceCheckIn: true, allowManualCheckIn: true,
            hasStudents: true, openingTime: true, timezone: true,
            shiftSchedules: true,
            subscriptionStatus: true,
            subscriptionStart: true,
            subscriptionExpiresAt: true,
            lastActivatedAt: true,
          },
        },
      },
    });
    if (!user) {
      return res.status(401).json({ success: false, message: 'User unavailable' });
    }
    const subscription = user.organization ? getOrgSubscriptionStatus(user.organization) : null;
    res.json({
      success: true,
      data: {
        ...user,
        organization: user.organization
          ? {
              ...user.organization,
              subscription,
            }
          : null,
      },
    });
  } catch (err) { next(err); }
};

const changePassword = async (req, res, next) => {
  try {
    if (req.user.role === 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Organization Admin passwords can only be changed by the Super Administrator.',
      });
    }
    const { currentPassword, newPassword } = req.body;
    await AuthService.changePassword(req.user.id, currentPassword, newPassword);

    await AuditService.log({
      actorId: req.user.id,
      actorEmail: req.user.email || req.user.id,
      actorRole: req.user.role,
      action: 'PASSWORD_CHANGED',
      targetId: req.user.id,
      targetType: 'USER',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, message: 'Password changed' });
  } catch (err) { next(err); }
};

const stationLogin = async (req, res, next) => {
  try {
    const { identifier, email, password } = req.body;
    const cleanId = identifier || email;
    const result = await AuthService.stationLogin(cleanId, password, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

const verifyResetEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await AuthService.verifyResetEmail(email);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

const resetPasswordWithToken = async (req, res, next) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    const result = await AuthService.resetPasswordWithToken(email, resetToken, newPassword);

    await AuditService.log({
      actorId: email,
      actorEmail: email,
      actorRole: 'USER',
      action: 'PASSWORD_RESET_COMPLETED',
      targetType: 'USER',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, message: result.message });
  } catch (err) { next(err); }
};

module.exports = { login, logout, refresh, me, changePassword, stationLogin, verifyResetEmail, resetPasswordWithToken };

