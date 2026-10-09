const { v4: uuidv4 } = require('uuid');
const { prisma } = require('../config/database');

const jsonSafe = (value) => value == null ? null : JSON.parse(JSON.stringify(value));

class WorkEventService {
  async record({
    db = prisma,
    orgId,
    employeeId,
    actorId = null,
    type,
    occurredAt,
    source,
    status = 'FINALIZED',
    sessionId = null,
    deviceId = null,
    verificationId = null,
    ruleVersion = null,
    sourceType = null,
    sourceId = null,
    dedupeKey = uuidv4(),
    metadata = null,
  }) {
    try {
      return await db.workEvent.create({
        data: {
          orgId,
          employeeId,
          actorId,
          type,
          occurredAt: occurredAt instanceof Date ? occurredAt : new Date(occurredAt),
          source,
          status,
          sessionId,
          deviceId,
          verificationId,
          ruleVersion,
          sourceType,
          sourceId,
          dedupeKey,
          metadata: jsonSafe(metadata),
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        return db.workEvent.findUnique({ where: { dedupeKey } });
      }
      throw error;
    }
  }

  async recordAttendanceEvent(db, attendanceEvent, outcome) {
    return this.record({
      db,
      orgId: attendanceEvent.orgId,
      employeeId: attendanceEvent.employeeId,
      actorId: attendanceEvent.actorId,
      type: attendanceEvent.eventType,
      occurredAt: attendanceEvent.serverTimestamp,
      source: attendanceEvent.source,
      status: 'FINALIZED',
      sessionId: attendanceEvent.sessionId,
      deviceId: attendanceEvent.deviceId,
      verificationId: attendanceEvent.id,
      ruleVersion: attendanceEvent.ruleVersion,
      sourceType: 'AttendanceEvent',
      sourceId: attendanceEvent.id,
      dedupeKey: `attendance-event:${attendanceEvent.id}`,
      metadata: {
        result: attendanceEvent.result,
        clientTimestamp: attendanceEvent.clientTimestamp,
        networkEvidence: attendanceEvent.networkEvidence,
        identityEvidence: attendanceEvent.identityEvidence,
        livenessEvidence: attendanceEvent.livenessEvidence,
        policySnapshot: outcome.ruleEvaluation?.policySnapshot || null,
        outcome,
      },
    });
  }

  async getEmployeeHistory(orgId, employeeId, { from, to, type, page = 1, limit = 100 } = {}) {
    const employee = await prisma.user.findFirst({
      where: { id: employeeId, orgId },
      select: { id: true, firstName: true, lastName: true, email: true, employeeCode: true },
    });
    if (!employee) throw Object.assign(new Error('Employee not found.'), { status: 404 });

    const pageNumber = Math.max(1, Number(page) || 1);
    const take = Math.min(200, Math.max(1, Number(limit) || 100));
    const occurredAt = {};
    if (from) occurredAt.gte = new Date(from);
    if (to) occurredAt.lte = new Date(to);
    const where = {
      orgId,
      employeeId,
      ...(Object.keys(occurredAt).length ? { occurredAt } : {}),
      ...(type ? { type } : {}),
    };
    const [total, events] = await Promise.all([
      prisma.workEvent.count({ where }),
      prisma.workEvent.findMany({
        where,
        orderBy: [{ occurredAt: 'asc' }, { recordedAt: 'asc' }],
        skip: (pageNumber - 1) * take,
        take,
        include: { actor: { select: { id: true, firstName: true, lastName: true, email: true, role: true } } },
      }),
    ]);
    return {
      employee,
      events,
      pagination: { page: pageNumber, limit: take, total, totalPages: Math.ceil(total / take) },
    };
  }
}

module.exports = new WorkEventService();
