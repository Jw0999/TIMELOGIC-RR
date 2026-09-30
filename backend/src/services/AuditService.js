const { v4: uuidv4 } = require('uuid');
const { prisma } = require('../config/database');
const logger = require('../config/logger');

class AuditService {
  /**
   * Records an immutable audit log entry.
   * Safe to call anywhere: catches internal errors and logs them to ensure business operations are never blocked.
   */
  async log({
    actorId,
    actorEmail,
    actorRole,
    action,
    targetId = null,
    targetType = null,
    details = null,
    ipAddress = null,
    userAgent = null,
  }) {
    try {
      return await prisma.auditLog.create({
        data: {
          id: uuidv4(),
          actorId: actorId ? String(actorId) : 'SYSTEM',
          actorEmail: actorEmail ? String(actorEmail) : 'system@timelogic.local',
          actorRole: actorRole ? String(actorRole) : 'SYSTEM',
          action: String(action),
          targetId: targetId ? String(targetId) : null,
          targetType: targetType ? String(targetType) : null,
          details: details ? details : {},
          ipAddress: ipAddress ? String(ipAddress) : null,
          userAgent: userAgent ? String(userAgent).slice(0, 500) : null,
        },
      });
    } catch (err) {
      logger.error('Failed to write audit log entry:', err);
      return null;
    }
  }

  /**
   * Returns paginated audit logs with optional filters for Super Admin review.
   */
  async getLogs({ page = 1, limit = 50, action, actorEmail, fromDate, toDate } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * take;

    const where = {};
    if (action && typeof action === 'string' && action.trim()) {
      where.action = { contains: action.trim(), mode: 'insensitive' };
    }
    if (actorEmail && typeof actorEmail === 'string' && actorEmail.trim()) {
      where.actorEmail = { contains: actorEmail.trim(), mode: 'insensitive' };
    }
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate);
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    return {
      logs,
      pagination: {
        page: pageNum,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  }
}

module.exports = new AuditService();
