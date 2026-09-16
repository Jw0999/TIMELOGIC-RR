const Redis = require('ioredis');
const env = require('./env');
const logger = require('./logger');

let redisClient = null;
let isConnected = false;
const memoryStore = new Map();

try {
  const redisUrl = env.REDIS_URL || 'redis://localhost:6379';
  const isTls = redisUrl.startsWith('rediss://');
  redisClient = new Redis(redisUrl, {
    retryStrategy: (times) => Math.min(times * 100, 3000),
    maxRetriesPerRequest: 1,
    connectTimeout: 5000,
    enableOfflineQueue: false,
    lazyConnect: false,
    ...(isTls ? { tls: { rejectUnauthorized: false } } : {}),
  });

  redisClient.on('connect', () => {
    isConnected = true;
    logger.info('Redis connected successfully');
  });

  redisClient.on('error', (err) => {
    isConnected = false;
    logger.warn('Redis unavailable, using resilient fallback cache:', err.message);
  });

  redisClient.on('close', () => {
    isConnected = false;
  });
} catch (err) {
  logger.warn('Failed to initialize Redis client, using resilient fallback cache:', err.message);
}

// Resilient wrapper: uses real Redis when connected, otherwise uses memoryStore
const redis = new Proxy({}, {
  get(_target, prop) {
    if (prop === 'on' || prop === 'once' || prop === 'status') {
      return redisClient ? redisClient[prop]?.bind(redisClient) : () => {};
    }

    if (prop === 'pipeline') {
      return () => {
        if (isConnected && redisClient) return redisClient.pipeline();
        const ops = [];
        const pipe = {
          del(key) { ops.push(() => memoryStore.delete(key)); return pipe; },
          set(key, val) { ops.push(() => memoryStore.set(key, { val, exp: null })); return pipe; },
          setex(key, ttl, val) { ops.push(() => memoryStore.set(key, { val, exp: Date.now() + ttl * 1000 })); return pipe; },
          async exec() {
            return ops.map((fn) => [null, fn()]);
          },
        };
        return pipe;
      };
    }

    if (prop === 'get') {
      return async (key) => {
        if (isConnected && redisClient) {
          try { return await redisClient.get(key); } catch {}
        }
        const item = memoryStore.get(key);
        if (!item) return null;
        if (item.exp && item.exp < Date.now()) {
          memoryStore.delete(key);
          return null;
        }
        return item.val;
      };
    }

    if (prop === 'set') {
      return async (key, val, ...args) => {
        if (isConnected && redisClient) {
          try { return await redisClient.set(key, val, ...args); } catch {}
        }
        let exp = null;
        if (args[0] === 'EX' && args[1]) {
          exp = Date.now() + Number(args[1]) * 1000;
        }
        memoryStore.set(key, { val: String(val), exp });
        return 'OK';
      };
    }

    if (prop === 'setex') {
      return async (key, ttl, val) => {
        if (isConnected && redisClient) {
          try { return await redisClient.setex(key, ttl, val); } catch {}
        }
        memoryStore.set(key, { val: String(val), exp: Date.now() + Number(ttl) * 1000 });
        return 'OK';
      };
    }

    if (prop === 'del') {
      return async (...keys) => {
        if (isConnected && redisClient) {
          try { return await redisClient.del(...keys); } catch {}
        }
        let count = 0;
        for (const k of keys) {
          if (memoryStore.delete(k)) count++;
        }
        return count;
      };
    }

    if (prop === 'quit') {
      return async () => {
        if (redisClient) {
          try { await redisClient.quit(); } catch {}
        }
      };
    }

    if (prop === 'eval') {
      return async (script, numKeys, key, arg) => {
        if (isConnected && redisClient) {
          try { return await redisClient.eval(script, numKeys, key, arg); } catch {}
        }
        const item = memoryStore.get(key);
        if (item && item.val === arg) {
          memoryStore.delete(key);
          return 1;
        }
        return 0;
      };
    }

    return async (...args) => {
      if (isConnected && redisClient && typeof redisClient[prop] === 'function') {
        try { return await redisClient[prop](...args); } catch {}
      }
      return null;
    };
  },
});

const PREFIXES = {
  QR_TOKEN:        'qr:',
  SESSION:         'session:',
  RATE_LIMIT:      'rl:',
  FAILED_ATTEMPTS: 'fa:',
  SOCKET:          'sock:',
  CHALLENGE:       'challenge:',
  PRESENCE:        'presence:',
  ADMIN_PRESENT:   'adminpresent:',
  SESSION_AUTO_LOCK: 'session-auto-lock:',
};

module.exports = { redis, PREFIXES };
