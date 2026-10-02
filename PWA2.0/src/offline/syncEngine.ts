// ============================================================================
// TimeLogic Kiosk Background Sync Engine
// Automatically uploads offline queued records to Heroku API upon reconnection.
// ============================================================================

import { api, getAccessToken } from '../api';
import { getPendingOutbox, removeSyncedRecords, getOutboxCount, getStationAuthCache, OutboxRecord } from './db';

let isSyncing = false;
let syncInterval: any = null;

export interface SyncResult {
  total: number;
  synced: number;
  failed: number;
  results: Array<{ clientEventId: string; status: string; error?: string }>;
}

export async function isOnlineReal(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }
  // Optional fast probe if needed, but navigator.onLine is standard baseline
  return true;
}

export async function syncOutboxNow(): Promise<SyncResult | null> {
  if (isSyncing) return null;

  const pending = await getPendingOutbox();
  if (pending.length === 0) {
    return { total: 0, synced: 0, failed: 0, results: [] };
  }

  isSyncing = true;
  window.dispatchEvent(new CustomEvent('timelogic:sync_status', { detail: { syncing: true, pendingCount: pending.length } }));

  try {
    // Ensure access token is active
    let token = getAccessToken();
    if (!token) {
      const cached = await getStationAuthCache().catch(() => null);
      if (cached?.accessToken) {
        localStorage.setItem('timelogic_admin_access', cached.accessToken);
        if (cached.refreshToken) localStorage.setItem('timelogic_admin_refresh', cached.refreshToken);
      }
    }

    const payload = {
      records: pending.map((r) => ({
        clientEventId: r.clientEventId,
        employeeId: r.employeeId,
        type: r.type,
        sessionId: r.sessionId,
        password: r.password,
        faceImage: r.faceImage,
        timestamp: r.timestamp,
      })),
    };

    const response = await api.post<{
      data: {
        total: number;
        syncedCount: number;
        failedCount: number;
        results: Array<{ clientEventId: string; status: string; error?: string }>;
      };
    }>('/admin/manual-attendance/batch-sync', payload);

    const res = response.data;
    const successfulIds: string[] = [];

    if (Array.isArray(res.results)) {
      for (const item of res.results) {
        if (item.status === 'SYNCED' || item.status === 'ALREADY_SYNCED') {
          successfulIds.push(item.clientEventId);
        }
      }
    }

    if (successfulIds.length > 0) {
      await removeSyncedRecords(successfulIds);
    }

    const remaining = await getOutboxCount();
    window.dispatchEvent(new CustomEvent('timelogic:sync_complete', {
      detail: {
        synced: res.syncedCount,
        failed: res.failedCount,
        remaining,
      },
    }));

    // Trigger dashboard refresh so all updated attendance reflects immediately on UI
    window.dispatchEvent(new CustomEvent('timelogic:reload_dashboard'));

    return {
      total: res.total,
      synced: res.syncedCount,
      failed: res.failedCount,
      results: res.results || [],
    };
  } catch (error) {
    console.warn('[SyncEngine] Batch sync attempt failed (will retry):', error);
    return null;
  } finally {
    isSyncing = false;
    const remaining = await getOutboxCount();
    window.dispatchEvent(new CustomEvent('timelogic:sync_status', { detail: { syncing: false, pendingCount: remaining } }));
  }
}

export function startBackgroundSync(intervalMs = 15000) {
  if (typeof window === 'undefined') return;

  // 1. Reconnection event
  window.addEventListener('online', () => {
    console.log('[SyncEngine] Internet connection detected — triggering immediate sync...');
    syncOutboxNow();
  });

  // 2. Periodic sync timer
  if (syncInterval) clearInterval(syncInterval);
  syncInterval = setInterval(() => {
    if (navigator.onLine) {
      getOutboxCount().then((count) => {
        if (count > 0) {
          syncOutboxNow();
        }
      });
    }
  }, intervalMs);

  // 3. Initial check on boot
  if (navigator.onLine) {
    setTimeout(() => syncOutboxNow(), 2000);
  }
}

export function stopBackgroundSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}
