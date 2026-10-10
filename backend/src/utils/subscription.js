const crypto = require('crypto');
const { prisma } = require('../config/database');

/**
 * Generate a cryptographically secure 8-digit numeric activation code.
 */
function generate8DigitCode() {
  return crypto.randomInt(10000000, 100000000).toString();
}

/**
 * Evaluate organization subscription status based on current server clock.
 * Any newly created organization or expired organization requires activation code.
 * @param {object} org - Organization model instance
 * @returns {object} Subscription assessment
 */
function getOrgSubscriptionStatus(org) {
  if (!org) {
    return { isExpired: true, status: 'EXPIRED', daysRemaining: 0 };
  }

  const now = new Date();
  const expiresAt = org.subscriptionExpiresAt ? new Date(org.subscriptionExpiresAt) : null;

  // If organization is SUSPENDED by Super Admin, subscription is on hold
  if (org.subscriptionStatus === 'SUSPENDED') {
    const pausedSeconds = org.subscriptionPausedRemainingSeconds || 0;
    const pausedDays = Math.ceil(pausedSeconds / 86400);
    return {
      isExpired: true,
      isSuspended: true,
      status: 'SUSPENDED',
      subscriptionStart: org.subscriptionStart || null,
      subscriptionExpiresAt: expiresAt ? expiresAt.toISOString() : null,
      subscriptionPausedAt: org.subscriptionPausedAt ? (org.subscriptionPausedAt instanceof Date ? org.subscriptionPausedAt.toISOString() : new Date(org.subscriptionPausedAt).toISOString()) : null,
      lastActivatedAt: org.lastActivatedAt ? (org.lastActivatedAt instanceof Date ? org.lastActivatedAt.toISOString() : new Date(org.lastActivatedAt).toISOString()) : null,
      daysRemaining: pausedDays,
      pausedDaysRemaining: pausedDays,
      pausedRemainingSeconds: pausedSeconds,
    };
  }

  // If no expiration date is set, or org was never activated, or status is explicitly EXPIRED
  if (!expiresAt || org.subscriptionStatus === 'EXPIRED') {
    return {
      isExpired: true,
      isSuspended: false,
      status: 'EXPIRED',
      subscriptionStart: org.subscriptionStart || null,
      subscriptionExpiresAt: expiresAt ? expiresAt.toISOString() : null,
      lastActivatedAt: org.lastActivatedAt ? (org.lastActivatedAt instanceof Date ? org.lastActivatedAt.toISOString() : new Date(org.lastActivatedAt).toISOString()) : null,
      daysRemaining: 0,
    };
  }

  const isExpired = expiresAt.getTime() <= now.getTime();
  const diffMs = expiresAt.getTime() - now.getTime();
  const daysRemaining = isExpired ? 0 : Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  let status = 'ACTIVE';
  if (isExpired) {
    status = 'EXPIRED';
  } else if (daysRemaining <= 3) {
    status = 'EXPIRING_SOON';
  }

  return {
    isExpired,
    isSuspended: false,
    status,
    subscriptionStart: org.subscriptionStart || org.createdAt,
    subscriptionExpiresAt: expiresAt.toISOString(),
    lastActivatedAt: org.lastActivatedAt ? (org.lastActivatedAt instanceof Date ? org.lastActivatedAt.toISOString() : new Date(org.lastActivatedAt).toISOString()) : null,
    daysRemaining,
  };
}

/**
 * Redeem an 8-digit activation code to activate or extend organization subscription.
 */
async function redeemActivationCode({ orgId, code, adminId, adminIp }) {
  const cleanCode = String(code || '').trim().replace(/[-\s]/g, '');

  if (!cleanCode || cleanCode.length !== 8) {
    return { success: false, error: 'Invalid activation code format. Must be an 8-digit numeric code.' };
  }

  const now = new Date();

  // Find valid unused code for this org
  const activationRecord = await prisma.activationCode.findFirst({
    where: {
      orgId,
      code: cleanCode,
      isUsed: false,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ],
    },
  });

  if (!activationRecord) {
    // Check if code was already used
    const alreadyUsed = await prisma.activationCode.findFirst({
      where: { orgId, code: cleanCode, isUsed: true },
    });
    if (alreadyUsed) {
      return { success: false, error: 'This activation code has already been redeemed and is no longer valid.' };
    }
    return { success: false, error: 'Invalid or expired activation code for your organization.' };
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
  });

  if (!org) {
    return { success: false, error: 'Organization not found.' };
  }

  if (org.subscriptionStatus === 'SUSPENDED') {
    return {
      success: false,
      error: 'This organization is currently suspended by Super Admin. The subscription is on hold and activation codes cannot be redeemed until the organization is unsuspended.',
    };
  }

  const durationDays = activationRecord.durationDays || 30;
  const currentExpiry = org.subscriptionExpiresAt ? new Date(org.subscriptionExpiresAt) : null;

  // If current expiry is in the future, extend from that future date; otherwise extend from now (current server time)
  const baseDate = currentExpiry && currentExpiry.getTime() > now.getTime() ? currentExpiry : now;
  const newExpiry = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

  // Execute in atomic transaction
  await prisma.$transaction([
    prisma.activationCode.update({
      where: { id: activationRecord.id },
      data: {
        isUsed: true,
        usedAt: now,
        usedByAdminId: adminId || null,
        usedByAdminIp: adminIp || null,
      },
    }),
    prisma.organization.update({
      where: { id: orgId },
      data: {
        subscriptionStatus: 'ACTIVE',
        subscriptionStart: org.subscriptionStart || now,
        subscriptionExpiresAt: newExpiry,
        subscriptionPausedAt: null,
        subscriptionPausedRemainingSeconds: null,
        lastActivatedAt: now,
      },
    }),
  ]);

  const daysRemaining = Math.max(0, Math.ceil((newExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  return {
    success: true,
    message: `Subscription successfully activated/renewed for ${durationDays} days!`,
    subscriptionExpiresAt: newExpiry.toISOString(),
    status: 'ACTIVE',
    daysRemaining,
  };
}

module.exports = {
  generate8DigitCode,
  getOrgSubscriptionStatus,
  redeemActivationCode,
};
