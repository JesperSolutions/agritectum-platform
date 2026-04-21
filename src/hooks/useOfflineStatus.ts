import { useState, useEffect, useCallback } from 'react';
import { logger } from '../utils/logger';

interface OfflineStatus {
  isOnline: boolean;
  isOffline: boolean;
  wasOffline: boolean;
  lastOnlineTime: Date | null;
  lastOfflineTime: Date | null;
  /** Number of changes that failed to sync on the most recent attempt. */
  failedSyncCount: number;
  /** Error from the most recent sync attempt, if any. */
  lastSyncError: Error | null;
  /** True while a sync pass is in flight. */
  isSyncing: boolean;
}

interface OfflineActions {
  retry: () => void;
  clearOfflineData: () => void;
  syncPendingChanges: () => Promise<void>;
}

/** Event name consumers can listen to for surfaced sync failures. */
export const OFFLINE_SYNC_FAILED_EVENT = 'offline-sync-failed';

export interface OfflineSyncFailedDetail {
  failedCount: number;
  lastError: string;
}

export const useOfflineStatus = (): OfflineStatus & OfflineActions => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(null);
  const [lastOfflineTime, setLastOfflineTime] = useState<Date | null>(null);
  const [failedSyncCount, setFailedSyncCount] = useState(0);
  const [lastSyncError, setLastSyncError] = useState<Error | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      setLastOnlineTime(new Date());
    };

    const handleOffline = () => {
      setIsOnline(false);
      setLastOfflineTime(new Date());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const retry = useCallback(() => {
    if (isOnline) {
      // Trigger a sync when coming back online
      window.dispatchEvent(new CustomEvent('offline-retry'));
    }
  }, [isOnline]);

  const clearOfflineData = useCallback(() => {
    // Clear offline data from IndexedDB
    if ('indexedDB' in window) {
      const request = indexedDB.deleteDatabase('offline-reports');
      request.onsuccess = () => {
        logger.log('Offline data cleared');
      };
    }
  }, []);

  const syncPendingChanges = useCallback(async () => {
    if (!isOnline) return;

    setIsSyncing(true);
    let failed = 0;
    let lastError: Error | null = null;

    try {
      // Get pending changes from IndexedDB
      const pendingChanges = await getPendingChanges();

      for (const change of pendingChanges) {
        try {
          await syncChange(change);
          await removePendingChange(change.id);
        } catch (error) {
          failed += 1;
          lastError = error instanceof Error ? error : new Error(String(error));
          // Fix #2: surface individual failures through the project logger
          // instead of swallowing them to console. Per-change outcome is
          // aggregated below and exposed via hook state + event for UI.
          logger.error('[offline-sync] failed to sync change', {
            id: change?.id,
            error: lastError.message,
          });
        }
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.error('[offline-sync] failed to enumerate pending changes', lastError);
    } finally {
      setFailedSyncCount(failed);
      setLastSyncError(lastError);
      setIsSyncing(false);
      if (failed > 0 || (lastError && !failed)) {
        // Fix #2: emit a window event so OfflineIndicator (or other shells)
        // can present a user-visible notification. Keeps the hook free of
        // direct UI dependencies.
        window.dispatchEvent(
          new CustomEvent<OfflineSyncFailedDetail>(OFFLINE_SYNC_FAILED_EVENT, {
            detail: {
              failedCount: failed,
              lastError: lastError?.message ?? 'unknown',
            },
          })
        );
      }
    }
  }, [isOnline]);

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline,
    lastOnlineTime,
    lastOfflineTime,
    failedSyncCount,
    lastSyncError,
    isSyncing,
    retry,
    clearOfflineData,
    syncPendingChanges,
  };
};

// Helper functions for offline data management
const getPendingChanges = async (): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('offline-reports', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pending-changes'], 'readonly');
      const store = transaction.objectStore('pending-changes');
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
  });
};

const syncChange = async (change: any): Promise<void> => {
  // This would implement the actual sync logic
  // For now, we'll just simulate it
  return new Promise(resolve => {
    setTimeout(() => {
      logger.log('Syncing change:', change);
      resolve();
    }, 1000);
  });
};

const removePendingChange = async (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('offline-reports', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pending-changes'], 'readwrite');
      const store = transaction.objectStore('pending-changes');
      const deleteRequest = store.delete(id);

      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
};
