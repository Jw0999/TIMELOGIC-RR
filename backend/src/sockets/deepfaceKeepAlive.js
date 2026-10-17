const env = require('../config/env');
const logger = require('../config/logger');

let _timer = null;

async function ping() {
  if (!env.DEEPFACE_URL || !env.DEEPFACE_URL.startsWith('http')) return;
  try {
    const target = `${env.DEEPFACE_URL.replace(/\/+$/, '')}/health`;
    const res = await fetch(target, {
      method: 'GET',
      headers: { 'User-Agent': 'TimeLogic-KeepAlive/1.0' },
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) {
      logger.info('DeepFace keep-alive: service is awake and healthy');
    }
  } catch (err) {
    logger.warn(`DeepFace keep-alive notice: ${err.message}`);
  }
}

function startDeepfaceKeepAlive() {
  if (_timer) return;
  // If running against an external provider like Render, ping immediately on boot
  if (env.DEEPFACE_URL && env.DEEPFACE_URL.includes('onrender.com')) {
    ping().catch(() => {});
  }
  // Ping every 10 minutes (Render sleeps after 15 minutes of inactivity)
  _timer = setInterval(ping, 10 * 60 * 1000);
  if (_timer.unref) _timer.unref();
}

function stopDeepfaceKeepAlive() {
  if (_timer) {
    clearInterval(_timer);
    _timer = null;
  }
}

module.exports = { startDeepfaceKeepAlive, stopDeepfaceKeepAlive };
