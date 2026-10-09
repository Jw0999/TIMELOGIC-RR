const { prisma } = require('../config/database');

const PLAN_DEFINITIONS = {
  starter: {
    tier: 'starter',
    name: 'Starter',
    maxEmployees: 20,
    maxKiosks: 1,
    maxDesktopAdmins: 1,
    maxOffices: 1,
    price: 20000,
    description: '20 Employees · 1 Desktop Admin · 1 Kiosk · 1 Office',
  },
  enterprise: {
    tier: 'enterprise',
    name: 'Enterprise',
    maxEmployees: 60,
    maxKiosks: null, // Unlimited
    maxDesktopAdmins: 3, // 3 Desktop Admins
    maxOffices: null, // Unlimited
    price: 60000,
    description: 'Up to 60 Employees · 3 Desktop Admins · Unlimited Kiosks · Multi-Office',
  },
  custom: {
    tier: 'custom',
    name: 'Custom',
    maxEmployees: null,
    maxKiosks: null,
    maxDesktopAdmins: null,
    maxOffices: null,
    price: null,
    description: 'Custom Headcount · Unlimited Desktop Admins & Kiosks · Multi-Facility',
  },
};

function normalizeTier(tier) {
  const t = String(tier || '').toLowerCase().trim();
  if (t === 'enterprise' || t === 'enterprises') return 'enterprise';
  if (t === 'custom' || t === 'organisation' || t === 'organization') return 'custom';
  return 'starter';
}

function resolvePlanLimits(tier, overrides = {}) {
  const normalized = normalizeTier(tier);
  const def = PLAN_DEFINITIONS[normalized];

  let maxEmployees = def.maxEmployees;
  let maxKiosks = def.maxKiosks;
  let maxDesktopAdmins = def.maxDesktopAdmins;
  let maxOffices = def.maxOffices;

  if (normalized === 'custom') {
    maxEmployees = overrides.maxEmployees !== undefined && overrides.maxEmployees !== null && overrides.maxEmployees !== ''
      ? parseInt(overrides.maxEmployees, 10)
      : null;
    maxKiosks = overrides.maxKiosks !== undefined && overrides.maxKiosks !== null && overrides.maxKiosks !== ''
      ? parseInt(overrides.maxKiosks, 10)
      : null;
    maxDesktopAdmins = overrides.maxDesktopAdmins !== undefined && overrides.maxDesktopAdmins !== null && overrides.maxDesktopAdmins !== ''
      ? parseInt(overrides.maxDesktopAdmins, 10)
      : null;
    maxOffices = overrides.maxOffices !== undefined && overrides.maxOffices !== null && overrides.maxOffices !== ''
      ? parseInt(overrides.maxOffices, 10)
      : null;
  }

  return {
    subscriptionTier: normalized,
    maxEmployees: Number.isFinite(maxEmployees) ? maxEmployees : null,
    maxKiosks: Number.isFinite(maxKiosks) ? maxKiosks : null,
    maxDesktopAdmins: Number.isFinite(maxDesktopAdmins) ? maxDesktopAdmins : null,
    maxOffices: Number.isFinite(maxOffices) ? maxOffices : null,
  };
}

async function assertCanAddEmployee(orgId) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true, subscriptionTier: true, maxEmployees: true },
  });
  if (!org) throw Object.assign(new Error('Organization not found.'), { status: 404 });

  if (org.maxEmployees !== null && org.maxEmployees !== undefined) {
    const activeCount = await prisma.user.count({
      where: {
        orgId,
        role: 'EMPLOYEE',
        status: { not: 'TERMINATED' },
      },
    });

    if (activeCount >= org.maxEmployees) {
      const planName = PLAN_DEFINITIONS[normalizeTier(org.subscriptionTier)]?.name || 'Starter';
      const error = new Error(
        `Employee limit reached for your ${planName} plan (${activeCount}/${org.maxEmployees} registered staff). Please contact your Super Administrator to upgrade to Enterprise for expanded capacity.`
      );
      error.status = 400;
      error.code = 'PLAN_EMPLOYEE_LIMIT_EXCEEDED';
      error.currentCount = activeCount;
      error.maxLimit = org.maxEmployees;
      throw error;
    }
  }
}

async function assertCanAddOffice(orgId) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true, subscriptionTier: true, maxOffices: true },
  });
  if (!org) throw Object.assign(new Error('Organization not found.'), { status: 404 });

  if (org.maxOffices !== null && org.maxOffices !== undefined) {
    const currentOffices = await prisma.office.count({
      where: { orgId, isActive: true },
    });

    if (currentOffices >= org.maxOffices) {
      const planName = PLAN_DEFINITIONS[normalizeTier(org.subscriptionTier)]?.name || 'Starter';
      const error = new Error(
        `Office location limit reached for your ${planName} plan (${currentOffices}/${org.maxOffices} office allowed). Starter plan is limited to 1 location. Upgrade to Enterprise to add multiple branch offices.`
      );
      error.status = 400;
      error.code = 'PLAN_OFFICE_LIMIT_EXCEEDED';
      throw error;
    }
  }
}

async function evaluateDesktopDeviceBinding(orgId, incomingDeviceId, meta = {}) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true, subscriptionTier: true, maxDesktopAdmins: true },
  });
  if (!org) throw Object.assign(new Error('Organization not found.'), { status: 404 });

  const boundDevices = await prisma.kioskDevice.findMany({
    where: { orgId, isBound: true, deviceType: 'DESKTOP_ADMIN' },
    orderBy: { boundAt: 'asc' },
  });

  const matchedDevice = boundDevices.find((d) => d.deviceId === incomingDeviceId);
  if (matchedDevice) {
    // Device is already bound to this org
    await prisma.kioskDevice.update({
      where: { id: matchedDevice.id },
      data: {
        lastLoginAt: new Date(),
        ipAddress: meta.ipAddress || matchedDevice.ipAddress,
        userAgent: meta.userAgent || matchedDevice.userAgent,
        deviceName: meta.deviceName || matchedDevice.deviceName,
        platform: meta.platform || matchedDevice.platform,
        firmwareVersion: meta.firmwareVersion || matchedDevice.firmwareVersion,
      },
    });
    return { status: 'ALREADY_BOUND', device: matchedDevice };
  }

  // Incoming device is not currently bound. Check max desktop admins limit.
  // Starter: 1, Enterprise: 3, Custom: null (unlimited)
  const maxDesktopAdmins = org.maxDesktopAdmins !== undefined ? org.maxDesktopAdmins : (org.subscriptionTier === 'enterprise' ? 3 : 1);
  if (maxDesktopAdmins !== null && maxDesktopAdmins !== undefined && boundDevices.length >= maxDesktopAdmins) {
    const existing = boundDevices[0];
    const deviceLabel = existing.deviceName || existing.platform || 'Authorized PC System';
    const error = new Error(
      `This organization's Desktop App is locked to authorized system (${deviceLabel}). Plan limit: ${maxDesktopAdmins} device(s). Another device cannot sign in until the Super Administrator unlocks or releases this device in the Super Admin portal.`
    );
    error.status = 403;
    error.code = 'DESKTOP_DEVICE_LOCKED';
    error.boundDevice = existing;
    throw error;
  }

  // Slot available: bind this new device
  const newBound = await prisma.kioskDevice.upsert({
    where: {
      orgId_deviceId: {
        orgId,
        deviceId: incomingDeviceId,
      },
    },
    create: {
      orgId,
      deviceId: incomingDeviceId,
      deviceName: meta.deviceName || 'Desktop Admin Terminal',
      deviceType: 'DESKTOP_ADMIN',
      platform: meta.platform || 'Desktop',
      firmwareVersion: meta.firmwareVersion || null,
      ipAddress: meta.ipAddress || null,
      userAgent: meta.userAgent || null,
      isBound: true,
      boundAt: new Date(),
      lastLoginAt: new Date(),
      releasedAt: null,
    },
    update: {
      isBound: true,
      deviceType: 'DESKTOP_ADMIN',
      boundAt: new Date(),
      lastLoginAt: new Date(),
      releasedAt: null,
      deviceName: meta.deviceName || undefined,
      platform: meta.platform || undefined,
      firmwareVersion: meta.firmwareVersion || undefined,
      ipAddress: meta.ipAddress || undefined,
      userAgent: meta.userAgent || undefined,
    },
  });

  return { status: 'NEWLY_BOUND', device: newBound };
}

async function evaluateKioskDeviceBinding(orgId, incomingDeviceId, meta = {}) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true, subscriptionTier: true, maxKiosks: true },
  });
  if (!org) throw Object.assign(new Error('Organization not found.'), { status: 404 });

  const boundDevices = await prisma.kioskDevice.findMany({
    where: { orgId, isBound: true, deviceType: 'KIOSK' },
    orderBy: { boundAt: 'asc' },
  });

  const matchedDevice = boundDevices.find((d) => d.deviceId === incomingDeviceId);
  if (matchedDevice) {
    // Device is already bound to this org
    await prisma.kioskDevice.update({
      where: { id: matchedDevice.id },
      data: {
        lastLoginAt: new Date(),
        ipAddress: meta.ipAddress || matchedDevice.ipAddress,
        userAgent: meta.userAgent || matchedDevice.userAgent,
        deviceName: meta.deviceName || matchedDevice.deviceName,
        platform: meta.platform || matchedDevice.platform,
        firmwareVersion: meta.firmwareVersion || matchedDevice.firmwareVersion,
      },
    });
    return { status: 'ALREADY_BOUND', device: matchedDevice };
  }

  // Incoming device is not currently bound. Check max kiosks limit.
  const maxKiosks = org.maxKiosks;
  if (maxKiosks !== null && maxKiosks !== undefined && boundDevices.length >= maxKiosks) {
    const existing = boundDevices[0];
    const deviceLabel = existing.deviceName || existing.platform || 'Authorized Kiosk Terminal';
    const error = new Error(
      `This attendance kiosk is locked to an authorized terminal (${deviceLabel}). Another device cannot sign in until the Super Administrator releases the station binding in the Super Admin portal.`
    );
    error.status = 403;
    error.code = 'KIOSK_DEVICE_LOCKED';
    error.boundDevice = existing;
    throw error;
  }

  // Slot available: bind this new device
  const newBound = await prisma.kioskDevice.upsert({
    where: {
      orgId_deviceId: {
        orgId,
        deviceId: incomingDeviceId,
      },
    },
    create: {
      orgId,
      deviceId: incomingDeviceId,
      deviceName: meta.deviceName || 'Kiosk Terminal',
      deviceType: 'KIOSK',
      platform: meta.platform || 'Unknown',
      firmwareVersion: meta.firmwareVersion || null,
      ipAddress: meta.ipAddress || null,
      userAgent: meta.userAgent || null,
      isBound: true,
      boundAt: new Date(),
      lastLoginAt: new Date(),
      releasedAt: null,
    },
    update: {
      isBound: true,
      deviceType: 'KIOSK',
      boundAt: new Date(),
      lastLoginAt: new Date(),
      releasedAt: null,
      deviceName: meta.deviceName || undefined,
      platform: meta.platform || undefined,
      firmwareVersion: meta.firmwareVersion || undefined,
      ipAddress: meta.ipAddress || undefined,
      userAgent: meta.userAgent || undefined,
    },
  });

  return { status: 'NEWLY_BOUND', device: newBound };
}

module.exports = {
  PLAN_DEFINITIONS,
  normalizeTier,
  resolvePlanLimits,
  assertCanAddEmployee,
  assertCanAddOffice,
  evaluateDesktopDeviceBinding,
  evaluateKioskDeviceBinding,
};
