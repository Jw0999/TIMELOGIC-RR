const { prisma } = require('../config/database');
const { redis, PREFIXES } = require('../config/redis');
const QRTokenService = require('../services/QRTokenService');
const { emitToSession } = require('./io');
const logger = require('../config/logger');

let _timer;

async function tick() {
  try {
    const activeSessions = await prisma.attendanceSession.findMany({
      where: { status: 'ACTIVE' },
    });

    const now = new Date();

    for (const session of activeSessions) {
      // ── Auto-expire sessions that have passed their endTime ─────────────────
      if (session.endTime && session.endTime <= now) {
        await prisma.attendanceSession.update({
          where: { id: session.id },
          data: { status: 'ENDED' },
        });
        await QRTokenService.invalidatePrevious(session.id).catch(() => {});
        try { emitToSession(session.id, 'session:ended', { sessionId: session.id, reason: 'auto_expired' }); } catch (_e) {}
        logger.info(`Session ${session.id} auto-expired`);
        continue;
      }

      // ── QR rotation ─────────────────────────────────────────────────────────
      const rotationKey = `${PREFIXES.SESSION}rotation:${session.id}`;
      const due = await redis.get(rotationKey);

      if (due === null) {
        const newToken = await QRTokenService.generate(session);
        await QRTokenService.scheduleRotation(session);

        emitToSession(session.id, 'qr:rotated', {
          sessionId: session.id,
          tokenId: newToken.id,
          expiresAt: newToken.expiresAt,
          expiresIn: QRTokenService.getRemainingSeconds(newToken),
        });

        logger.debug(`QR rotated for session ${session.id}`);
      }
    }
  } catch (err) {
    logger.warn('QR rotation tick error:', err.message);
  }
}

function startQRRotationWorker(intervalMs = 5000) {
  if (_timer) return;
  _timer = setInterval(tick, intervalMs);
  logger.info('QR rotation worker started');
}

function stopQRRotationWorker() {
  if (_timer) { clearInterval(_timer); _timer = null; }
}

module.exports = { startQRRotationWorker, stopQRRotationWorker };
