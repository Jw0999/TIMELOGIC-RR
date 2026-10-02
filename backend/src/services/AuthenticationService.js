const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { prisma } = require('../config/database');
const { redis, PREFIXES } = require('../config/redis');
const env = require('../config/env');
const logger = require('../config/logger');
const { getCurrentServerTime } = require('../utils/networkTime');
const EmployeePolicy = require('./EmployeePolicyService');
const PlanPolicy = require('./PlanPolicyService');
const { getOrgSubscriptionStatus } = require('../utils/subscription');

class AuthenticationService {
  async login(identifier, password, deviceFingerprint = null, context = {}) {
    // Authentication uses email only; employee codes are organization-scoped display identifiers.
    const normalizedIdentifier = String(identifier || '').trim().toLowerCase();

    // Account-Level Lockout (5 consecutive failed attempts locks account for 15 minutes)
    const lockoutKey = `tl:lockout:${normalizedIdentifier}`;
    const attemptsKey = `tl:failed_attempts:${normalizedIdentifier}`;
    try {
      const isLocked = await redis.get(lockoutKey);
      if (isLocked) {
        const ttl = await redis.ttl(lockoutKey);
        const minutes = Math.max(1, Math.ceil((ttl > 0 ? ttl : 900) / 60));
        throw Object.assign(
          new Error(`Account is temporarily locked due to multiple failed login attempts. Please try again in ${minutes} minute(s) or reset your password.`),
          { status: 429, code: 'ACCOUNT_LOCKED' }
        );
      }
    } catch (err) {
      if (err.status === 429) throw err;
    }

    const recordFailedAttempt = async () => {
      try {
        const attempts = await redis.incr(attemptsKey);
        if (attempts === 1) {
          await redis.expire(attemptsKey, 900); // 15 mins window
        } else if (attempts >= 5) {
          await redis.set(lockoutKey, '1', 'EX', 900); // 15 mins lockout
          await redis.del(attemptsKey);
        }
      } catch (_) {}
    };

    const user = await prisma.user.findUnique({ where: { email: normalizedIdentifier } });

    if (!user) {
      await recordFailedAttempt();
      throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      await recordFailedAttempt();
      if (user.role === 'ADMIN' && user.orgId) {
        const orgCheck = await prisma.organization.findUnique({
          where: { id: user.orgId },
          select: { kioskPasswordHash: true },
        });
        if (orgCheck?.kioskPasswordHash && (await bcrypt.compare(password, orgCheck.kioskPasswordHash))) {
          throw Object.assign(new Error('The password entered is the PWA 2.0 Station Password. Please use your Desktop Admin password to log into the Desktop App.'), { status: 401 });
        }
      }
      throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    }

    // Login successful: reset failed attempt tracking and lockout
    try {
      await redis.del(attemptsKey);
      await redis.del(lockoutKey);
    } catch (_) {}

    if (user.status !== 'ACTIVE') {
      throw Object.assign(new Error(`Account is ${user.status.toLowerCase()}`), { status: 403 });
    }

    // Tenant isolation: every login is bound to exactly one organization. A user
    // can only ever authenticate into their OWN org (orgId is fixed on the user
    // and carried in the JWT); they can never act inside another organization.
    const org = await prisma.organization.findUnique({
      where: { id: user.orgId },
      select: {
        id: true, name: true, allowDeviceCheckIn: true, allowManualCheckIn: true,
        hasStudents: true, openingTime: true, timezone: true,
        subscriptionStatus: true, subscriptionStart: true, subscriptionExpiresAt: true, lastActivatedAt: true,
      },
    });
    if (!org) {
      throw Object.assign(new Error('Your organization is no longer active.'), { status: 403 });
    }

    // ── Device binding (employees only): one phone per employee, locked ──
    if (user.role === 'EMPLOYEE') {
      EmployeePolicy.assertChannelAllowed(org, user.checkInMethod, 'PHONE');
      if (!deviceFingerprint) {
        throw Object.assign(
          new Error('A registered device is required for employee sign-in.'),
          { status: 400, code: 'DEVICE_REQUIRED' }
        );
      }
      // 1. Is this phone already bound to a DIFFERENT employee?
      const boundElsewhere = await prisma.registeredDevice.findFirst({
        where: { deviceFingerprint, isActive: true, employeeId: { not: user.id } },
        select: { id: true },
      });
      if (boundElsewhere) {
        throw Object.assign(
          new Error('This phone is already registered to another employee and cannot be used to sign in.'),
          { status: 403, code: 'DEVICE_TAKEN' }
        );
      }

      // 2. Does this employee already have a registered phone?
      const mine = await prisma.registeredDevice.findFirst({
        where: { employeeId: user.id, isActive: true },
        orderBy: { registeredAt: 'asc' },
      });
      if (mine) {
        if (mine.deviceFingerprint !== deviceFingerprint) {
          throw Object.assign(
            new Error('Your account is locked to your registered phone. You cannot sign in from a different device. Contact your admin to reset it.'),
            { status: 403, code: 'DEVICE_MISMATCH' }
          );
        }
        await prisma.registeredDevice.update({ where: { id: mine.id }, data: { lastUsedAt: new Date() } });
      } else {
        // 3. First sign-in on this account → bind this phone permanently
        await prisma.registeredDevice.create({
          data: { id: uuidv4(), employeeId: user.id, deviceFingerprint, platform: 'mobile', isActive: true, lastUsedAt: new Date() },
        });
        logger.info(`Device bound: employee ${user.id} -> ${deviceFingerprint.slice(0, 12)}…`);
      }
    }

    const loginAt = await getCurrentServerTime();
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: loginAt } });

    let adminLogin = null;
    if (user.role === 'ADMIN') {
      adminLogin = await require('./AttendanceService').recordAdminLogin(user.id, loginAt, {
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
    }

    const accessToken = this._signAccess(user);
    const refreshToken = await this._createRefreshToken(user.id);
    const subscription = org ? getOrgSubscriptionStatus(org) : null;

    return {
      accessToken, refreshToken,
      user: { ...this._safeUser(user), lastLoginAt: loginAt, organization: { ...org, subscription } },
      adminLogin,
    };
  }

  async stationLogin(identifier, password, context = {}) {
    const normalizedIdentifier = String(identifier || '').trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedIdentifier.toLowerCase() },
      include: {
        organization: {
          select: {
            id: true, name: true, allowDeviceCheckIn: true, allowManualCheckIn: true,
            hasStudents: true, openingTime: true, timezone: true,
            kioskPasswordHash: true, requireFaceVerification: true,
            subscriptionStatus: true, subscriptionStart: true, subscriptionExpiresAt: true, lastActivatedAt: true,
          },
        },
      },
    });

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      throw Object.assign(new Error('Only administrator accounts can access this kiosk station.'), { status: 401 });
    }

    if (user.status !== 'ACTIVE') {
      throw Object.assign(new Error(`Account is ${user.status.toLowerCase()}`), { status: 403 });
    }

    // Check organization subscription status for kiosk station
    if (user.role !== 'SUPER_ADMIN' && user.organization) {
      const sub = getOrgSubscriptionStatus(user.organization);
      if (sub.isExpired) {
        throw Object.assign(
          new Error('Subscription expired. Contact your administrator.'),
          { status: 403, code: 'SUBSCRIPTION_EXPIRED' }
        );
      }
    }

    // Station password verification
    if (user.role === 'SUPER_ADMIN') {
      if (!(await bcrypt.compare(password, user.passwordHash))) {
        throw Object.assign(new Error('Invalid Super Admin credentials.'), { status: 401 });
      }
    } else {
      // For Organization Admin: check org.kioskPasswordHash first
      if (user.organization?.kioskPasswordHash) {
        const match = await bcrypt.compare(password, user.organization.kioskPasswordHash);
        if (!match) {
          throw Object.assign(new Error('Invalid station password. Please enter the station password configured in the Desktop App Settings.'), { status: 401 });
        }
      } else {
        // Fallback to admin's password if station password has not yet been set
        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) {
          throw Object.assign(new Error('Invalid credentials. Please set a dedicated Station Password in Desktop App settings.'), { status: 401 });
        }
      }
    }

    const loginAt = await getCurrentServerTime();
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: loginAt } });

    // Kiosk Hardware Device Binding and Plan Terminal Limit Enforcement
    let boundKioskDevice = null;
    if (user.role !== 'SUPER_ADMIN' && user.orgId) {
      const incomingDeviceId = context.deviceId ? String(context.deviceId).trim() : null;
      if (incomingDeviceId) {
        const bindResult = await PlanPolicy.evaluateKioskDeviceBinding(user.orgId, incomingDeviceId, {
          deviceName: context.deviceName,
          platform: context.platform,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });
        boundKioskDevice = bindResult.device;
      }
    }

    const accessToken = this._signAccess(user, '30d');
    const refreshToken = await this._createRefreshToken(user.id, '90d');

    return {
      accessToken,
      refreshToken,
      user: { ...this._safeUser(user), lastLoginAt: loginAt, organization: user.organization },
      boundDevice: boundKioskDevice,
    };
  }

  async logout(userId, refreshToken) {
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { userId, token: refreshToken } });
    }
    await redis.del(`${PREFIXES.SOCKET}${userId}`);
  }

  async refreshAccessToken(rawRefreshToken) {
    let payload;
    try {
      payload = jwt.verify(rawRefreshToken, env.JWT_REFRESH_SECRET);
    } catch {
      throw Object.assign(new Error('Invalid refresh token'), { status: 401 });
    }
    const stored = await prisma.refreshToken.findUnique({ where: { token: rawRefreshToken } });
    if (
      !stored ||
      stored.expiresAt < new Date() ||
      stored.userId !== payload.sub ||
      stored.id !== payload.jti
    ) {
      throw Object.assign(new Error('Refresh token expired or revoked'), { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== 'ACTIVE') {
      throw Object.assign(new Error('User unavailable'), { status: 401 });
    }

    if (user.role === 'EMPLOYEE') {
      const org = await EmployeePolicy.getOrganizationPolicy(user.orgId);
      EmployeePolicy.assertChannelAllowed(org, user.checkInMethod, 'PHONE');
    }

    const isAdminStation = ['ADMIN', 'SUPER_ADMIN'].includes(user.role);
    const accessToken = isAdminStation ? this._signAccess(user, '30d') : this._signAccess(user);

    // Rotate refresh token for admin kiosk station so sessions never expire mid-use
    let newRefreshToken = rawRefreshToken;
    if (isAdminStation) {
      newRefreshToken = await this._createRefreshToken(user.id, '90d');
      await prisma.refreshToken.delete({ where: { id: stored.id } }).catch(() => {});
    }

    return { accessToken, refreshToken: newRefreshToken };
  }

  async registerDevice(userId, deviceData) {
    const { deviceFingerprint, platform, model, osVersion, appVersion } = deviceData;

    const settings = await this._getOrgSettings(userId);
    const maxDevices = settings?.maxDevicesPerEmployee ?? 2;

    const activeCount = await prisma.registeredDevice.count({
      where: { employeeId: userId, isActive: true },
    });

    if (activeCount >= maxDevices) {
      throw Object.assign(
        new Error(`Maximum ${maxDevices} devices allowed per employee`),
        { status: 409 }
      );
    }

    const existing = await prisma.registeredDevice.findFirst({
      where: { employeeId: userId, deviceFingerprint },
    });

    if (existing) {
      return prisma.registeredDevice.update({
        where: { id: existing.id },
        data: { isActive: true, platform, model, osVersion, appVersion, lastUsedAt: new Date() },
      });
    }

    return prisma.registeredDevice.create({
      data: { id: uuidv4(), employeeId: userId, deviceFingerprint, platform, model, osVersion, appVersion },
    });
  }

  async verifyDevice(userId, deviceFingerprint) {
    const device = await prisma.registeredDevice.findFirst({
      where: { employeeId: userId, deviceFingerprint, isActive: true },
    });
    return !!device;
  }

  async deactivateDevice(userId, deviceId) {
    await prisma.registeredDevice.updateMany({
      where: { id: deviceId, employeeId: userId },
      data: { isActive: false },
    });
  }

  async verifyResetEmail(email) {
    const normalized = String(email || '').trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalized },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, status: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw Object.assign(new Error('No active account found associated with this email address.'), { status: 404 });
    }

    if (!['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
      throw Object.assign(new Error('Password reset is only available for administrative accounts.'), { status: 403 });
    }

    const resetToken = jwt.sign(
      { sub: user.id, email: user.email, role: user.role, purpose: 'PASSWORD_RESET' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    logger.info(`Password reset verified for ${user.email} (${user.role})`);

    return {
      verified: true,
      email: user.email,
      firstName: user.firstName,
      role: user.role,
      resetToken,
    };
  }

  async resetPasswordWithToken(email, resetToken, newPassword) {
    const normalized = String(email || '').trim().toLowerCase();
    let payload;
    try {
      payload = jwt.verify(resetToken, env.JWT_ACCESS_SECRET);
    } catch {
      throw Object.assign(new Error('Reset token has expired or is invalid. Please verify your email again.'), { status: 400 });
    }

    if (payload.purpose !== 'PASSWORD_RESET' || String(payload.email).toLowerCase() !== normalized) {
      throw Object.assign(new Error('Invalid password reset token for this email.'), { status: 400 });
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      throw Object.assign(new Error('Password must be at least 8 characters long.'), { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== 'ACTIVE') {
      throw Object.assign(new Error('Account not found or inactive.'), { status: 404 });
    }

    const hash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS || 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hash },
    });

    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    await redis.del(`${PREFIXES.SOCKET}${user.id}`);

    // Invalidate any active JWT access tokens immediately
    await redis.set(`tl:revoked:${user.id}`, String(Date.now()), 'EX', 86400 * 7);

    // Clear failed attempts and lockout so user can immediately authenticate
    await redis.del(`tl:failed_attempts:${normalized}`);
    await redis.del(`tl:lockout:${normalized}`);

    logger.info(`Password successfully reset for user ${user.email}`);

    return { success: true, message: 'Password has been updated successfully.' };
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw Object.assign(new Error('Current password is incorrect'), { status: 400 });
    }
    const hash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS || 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
    await prisma.refreshToken.deleteMany({ where: { userId } });

    // Invalidate any active JWT access tokens immediately
    await redis.set(`tl:revoked:${userId}`, String(Date.now()), 'EX', 86400 * 7);
  }

  // ── helpers ──────────────────────────────────────────────────────────────────

  _signAccess(user, expiresIn) {
    return jwt.sign(
      { sub: user.id, role: user.role, orgId: user.orgId },
      env.JWT_ACCESS_SECRET,
      { expiresIn: expiresIn || env.JWT_ACCESS_EXPIRES_IN || '15m' }
    );
  }

  async _createRefreshToken(userId, expiresIn = env.JWT_REFRESH_EXPIRES_IN || '7d') {
    const id = uuidv4();
    const token = jwt.sign(
      { sub: userId, jti: id },
      env.JWT_REFRESH_SECRET,
      { expiresIn }
    );
    const decoded = jwt.decode(token);
    const expiresAt = new Date(decoded.exp * 1000);
    await prisma.refreshToken.create({ data: { id, userId, token, expiresAt } });
    return token;
  }

  _safeUser(user) {
    const { passwordHash, faceEncodingData, ...safe } = user;
    return safe;
  }

  async _getOrgSettings(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { department: { include: { organization: { include: { offices: { include: { securitySettings: true } } } } } } },
    });
    return user?.department?.organization?.offices?.[0]?.securitySettings ?? null;
  }
}

module.exports = new AuthenticationService();
