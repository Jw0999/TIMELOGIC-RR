// ============================================================================
// TimeLogic Kiosk Offline Database Engine (IndexedDB)
// Provides zero-downtime offline storage for Roster, Auth, and Outbox.
// ============================================================================

import type { AdminUser, Employee, Session } from '../api';

const DB_NAME = 'timelogic_kiosk_offline';
const DB_VERSION = 1;

export interface OutboxRecord {
  clientEventId: string;
  employeeId: string;
  employeeName: string;
  type: 'check_in' | 'check_out';
  sessionId?: string;
  timestamp: string;
  password: string;
  faceImage?: string;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
  createdAt: string;
  error?: string;
}

export interface CachedAuth {
  key: string;
  user: AdminUser;
  identifier: string;
  passwordHash: string; // SHA-256 hash for offline verification
  cachedAt: number;
}

let dbInstance: IDBDatabase | null = null;

export async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Roster store: cached employees
      if (!db.objectStoreNames.contains('roster')) {
        const rosterStore = db.createObjectStore('roster', { keyPath: 'id' });
        rosterStore.createIndex('employeeCode', 'employeeCode', { unique: false });
        rosterStore.createIndex('email', 'email', { unique: false });
      }

      // 2. Sessions store: cached active sessions
      if (!db.objectStoreNames.contains('sessions')) {
        db.createObjectStore('sessions', { keyPath: 'id' });
      }

      // 3. Outbox store: queued attendance records waiting for sync
      if (!db.objectStoreNames.contains('outbox')) {
        const outboxStore = db.createObjectStore('outbox', { keyPath: 'clientEventId' });
        outboxStore.createIndex('status', 'status', { unique: false });
        outboxStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 4. Station auth store: cached station admin credentials
      if (!db.objectStoreNames.contains('auth_cache')) {
        db.createObjectStore('auth_cache', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// ─── Cryptographic Hash for Offline Station Login ───────────────────────────
async function hashCredential(input: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`timelogic_salt_${input}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ─── Station Auth Cache ─────────────────────────────────────────────────────
export async function cacheStationAuth(user: AdminUser, identifier: string, password: string): Promise<void> {
  try {
    const db = await getDB();
    const passwordHash = await hashCredential(password);
    const entry: CachedAuth = {
      key: 'current_station',
      user,
      identifier: identifier.trim().toLowerCase(),
      passwordHash,
      cachedAt: Date.now(),
    };
    return new Promise((resolve, reject) => {
      const tx = db.transaction('auth_cache', 'readwrite');
      tx.objectStore('auth_cache').put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[OfflineDB] Could not cache station auth:', err);
  }
}

export async function verifyOfflineStationAuth(identifier: string, password: string): Promise<AdminUser | null> {
  try {
    const db = await getDB();
    const entry: CachedAuth | null = await new Promise((resolve, reject) => {
      const tx = db.transaction('auth_cache', 'readonly');
      const req = tx.objectStore('auth_cache').get('current_station');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(tx.error);
    });

    if (!entry) return null;

    const cleanInput = identifier.trim().toLowerCase();
    const storedIdent = entry.identifier.toLowerCase();
    const storedUserEmail = (entry.user.organization?.name || '').toLowerCase();

    // Check identifier match (email or employee code or current station)
    const matchesIdent = cleanInput === storedIdent ||
      cleanInput === (entry.user as any).email?.toLowerCase() ||
      cleanInput === (entry.user as any).employeeCode?.toLowerCase() ||
      cleanInput === storedUserEmail;

    if (!matchesIdent) return null;

    const hash = await hashCredential(password);
    if (hash === entry.passwordHash) {
      return entry.user;
    }
    return null;
  } catch (err) {
    console.error('[OfflineDB] Error checking offline station auth:', err);
    return null;
  }
}

// ─── Roster & Sessions Cache ────────────────────────────────────────────────
export async function cacheRosterAndSessions(employees: Employee[], sessions: Session[]): Promise<void> {
  if (!Array.isArray(employees)) return;
  try {
    const db = await getDB();
    const tx = db.transaction(['roster', 'sessions'], 'readwrite');
    const rosterStore = tx.objectStore('roster');
    const sessionsStore = tx.objectStore('sessions');

    // Clear and refill with latest fresh server copy
    rosterStore.clear();
    for (const emp of employees) {
      rosterStore.put(emp);
    }

    sessionsStore.clear();
    for (const s of sessions) {
      sessionsStore.put(s);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[OfflineDB] Failed to cache roster:', err);
  }
}

export async function getCachedRoster(): Promise<{ employees: Employee[]; sessions: Session[] }> {
  try {
    const db = await getDB();
    const tx = db.transaction(['roster', 'sessions'], 'readonly');

    const employeesPromise = new Promise<Employee[]>((resolve, reject) => {
      const req = tx.objectStore('roster').getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(tx.error);
    });

    const sessionsPromise = new Promise<Session[]>((resolve, reject) => {
      const req = tx.objectStore('sessions').getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(tx.error);
    });

    const [employees, sessions] = await Promise.all([employeesPromise, sessionsPromise]);
    return { employees, sessions };
  } catch (err) {
    console.error('[OfflineDB] Could not retrieve cached roster:', err);
    return { employees: [], sessions: [] };
  }
}

export async function findEmployeeOffline(query: string): Promise<Employee | null> {
  const clean = query.trim().toLowerCase();
  const { employees } = await getCachedRoster();
  return (
    employees.find((emp) =>
      emp.email?.toLowerCase() === clean ||
      emp.employeeCode?.toLowerCase() === clean ||
      `${emp.firstName} ${emp.lastName}`.toLowerCase() === clean ||
      emp.id === clean
    ) || null
  );
}

// ─── Outbox Queue (Attendance Actions) ──────────────────────────────────────
export async function queueOfflineAttendance(action: {
  employeeId: string;
  employeeName: string;
  type: 'check_in' | 'check_out';
  sessionId?: string;
  password: string;
  faceImage?: string;
  timestamp?: string;
}): Promise<OutboxRecord> {
  const db = await getDB();
  const clientEventId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `evt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const record: OutboxRecord = {
    clientEventId,
    employeeId: action.employeeId,
    employeeName: action.employeeName,
    type: action.type,
    sessionId: action.sessionId,
    timestamp: action.timestamp || new Date().toISOString(),
    password: action.password,
    faceImage: action.faceImage,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction('outbox', 'readwrite');
    tx.objectStore('outbox').put(record);
    tx.oncomplete = () => {
      window.dispatchEvent(new CustomEvent('timelogic:outbox_changed'));
      resolve(record);
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingOutbox(): Promise<OutboxRecord[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('outbox', 'readonly');
      const req = tx.objectStore('outbox').getAll();
      req.onsuccess = () => {
        const records = (req.result || []) as OutboxRecord[];
        resolve(records.filter((r) => r.status === 'PENDING'));
      };
      req.onerror = () => reject(tx.error);
    });
  } catch {
    return [];
  }
}

export async function getOutboxCount(): Promise<number> {
  const pending = await getPendingOutbox();
  return pending.length;
}

export async function removeSyncedRecords(clientEventIds: string[]): Promise<void> {
  if (!clientEventIds || clientEventIds.length === 0) return;
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('outbox', 'readwrite');
    const store = tx.objectStore('outbox');
    for (const id of clientEventIds) {
      store.delete(id);
    }
    tx.oncomplete = () => {
      window.dispatchEvent(new CustomEvent('timelogic:outbox_changed'));
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}
