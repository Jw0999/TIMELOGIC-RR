const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const { getOrgSubscriptionStatus } = require('../utils/subscription');

/**
 * Middleware to enforce active monthly subscription for organizations.
 * Super Admins are exempt.
 * Code redemption and subscription status endpoints are exempt so locked admins can renew.
 */
async function checkSubscription(req, res, next) {
  try {
    let userRole = req.user?.role;
    let userOrgId = req.user?.orgId || req.user?.organizationId;

    if (!userRole && req.headers?.authorization?.startsWith('Bearer ')) {
      try {
        const decoded = jwt.decode(req.headers.authorization.slice(7));
        if (decoded && typeof decoded === 'object') {
          userRole = decoded.role;
          userOrgId = decoded.orgId;
        }
      } catch (_) {}
    }

    // Super Admins are never blocked by organization subscription
    if (userRole === 'SUPER_ADMIN') {
      return next();
    }

    // Identify orgId from authenticated user, custom headers, or request parameters
    const orgId = userOrgId || req.orgId || req.headers?.['x-organization-id'] || req.params?.orgId || req.body?.orgId;

    if (!orgId) {
      // If no org context, allow downstream handlers or auth guards to deal with it
      return next();
    }

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        subscriptionStatus: true,
        subscriptionStart: true,
        subscriptionExpiresAt: true,
        subscriptionPausedAt: true,
        subscriptionPausedRemainingSeconds: true,
        lastActivatedAt: true,
        createdAt: true,
      },
    });

    if (!org) {
      return next();
    }

    const subscription = getOrgSubscriptionStatus(org);

    // Attach subscription info to request for downstream handlers
    req.subscription = subscription;

    if (subscription.isExpired) {
      // Allow redemption, status, and server-time synchronization even when expired
      const path = req.baseUrl + (req.path === '/' ? '' : req.path);
      const isExempt =
        req.path.includes('/redeem-code') ||
        req.path.includes('/subscription-status') ||
        req.path.includes('/server-time') ||
        path.includes('/redeem-code') ||
        path.includes('/subscription-status') ||
        path.includes('/server-time');

      if (isExempt) {
        return next();
      }

      if (subscription.isSuspended) {
        return res.status(403).json({
          success: false,
          code: 'ORGANIZATION_SUSPENDED',
          error: 'Organization suspended. Contact Super Admin.',
          message: 'Your organization has been suspended by Super Admin. Operations and subscriptions are on hold.',
          status: 'SUSPENDED',
          pausedDaysRemaining: subscription.pausedDaysRemaining,
        });
      }

      return res.status(403).json({
        success: false,
        code: 'SUBSCRIPTION_EXPIRED',
        error: 'Subscription expired. Contact your administrator.',
        message: 'Your organization subscription has expired. Please enter an 8-digit activation code to restore access.',
        subscriptionExpiresAt: subscription.subscriptionExpiresAt,
        status: 'EXPIRED',
      });
    }

    return next();
  } catch (error) {
    console.error('[SubscriptionGuard] Error checking subscription:', error);
    // On unexpected error, fail safe to allow request to continue so system doesn't crash
    return next();
  }
}

module.exports = {
  checkSubscription,
};
