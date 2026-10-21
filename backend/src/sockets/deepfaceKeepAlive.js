const env = require('../config/env');
const logger = require('../config/logger');

let _timer = null;

async function pingEndpoint(url, label) {
  if (!url || !url.startsWith('http')) return;
  try {
    const target = `${url.replace(/\/+$/, '')}/health`;
    const res = await fetch(target, {
      method: 'GET',
      headers: { 'User-Agent': 'TimeLogic-KeepAlive/1.0' },
      signal: AbortSignal.timeout(25000),
    });
    if (res.ok) {
      logger.info(`${label} keep-alive: service is awake and healthy`);
    } else {
      logger.warn(`${label} keep-alive returned status ${res.status}`);
    }
  } catch (err) {
    logger.warn(`${label} keep-alive notice: ${err.message}`);
  }
}

async function ping() {
  const deepfaceTarget = env.DEEPFACE_URL;
  const backendTarget = process.env.RENDER_EXTERNAL_URL || 'https://timelogic-backend.onrender.com';

  await Promise.allSettled([
    pingEndpoint(deepfaceTarget, 'DeepFace'),
    pingEndpoint(backendTarget, 'Backend'),
  ]);
}

function startDeepfaceKeepAlive() {
  if (_timer) return;
  // If running in production or against external providers, ping immediately on boot
  if (process.env.NODE_ENV === 'production' || (env.DEEPFACE_URL && env.DEEPFACE_URL.includes('onrender.com'))) {
    ping().catch(() => {});
  }
  // Ping every 9 minutes (Render free tier sleeps after 15 minutes of inactivity)
  _timer = setInterval(ping, 9 * 60 * 1000);
  if (_timer.unref) _timer.unref();
}

function stopDeepfaceKeepAlive() {
  if (_timer) {
    clearInterval(_timer);
    _timer = null;
  }
}

module.exports = { startDeepfaceKeepAlive, stopDeepfaceKeepAlive };
