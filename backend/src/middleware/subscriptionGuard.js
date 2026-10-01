const { prisma } = require('../config/database');
const { getOrgSubscriptionStatus } = require('../utils/subscription');

/**
 * Middleware to enforce active monthly subscription for organizations.
 * Super Admins are exempt.
 * Code redemption and subscription status endpoints are exempt so locked admins can renew.
 */
async function checkSubscription(req, res, next) {
  try {
    // Super Admins are never blocked by organization subscription
    if (req.user && req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    // Identify orgId from authenticated user or request parameters
    const orgId = req.user?.orgId || req.user?.organizationId || req.orgId || req.params?.orgId || req.body?.orgId;

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
      // Allow redemption and status endpoints even when expired
      const path = req.baseUrl + (req.path === '/' ? '' : req.path);
      const isRedeemOrStatus =
        req.path.includes('/redeem-code') ||
        req.path.includes('/subscription-status') ||
        path.includes('/redeem-code') ||
        path.includes('/subscription-status');

      if (isRedeemOrStatus) {
        return next();
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
