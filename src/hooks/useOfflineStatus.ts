import { useState, useEffect, useCallback } from 'react';

interface OfflineStatus {
  isOnline: boolean;
  isOffline: boolean;
  wasOffline: boolean;
  lastOnlineTime: Date | null;
  lastOfflineTime: Date | null;
}

interface OfflineActions {
  retry: () => void;
  clearOfflineData: () => void;
  syncPendingChanges: () => Promise<void>;
}

export const useOfflineStatus = (): OfflineStatus & OfflineActions => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(null);
  const [lastOfflineTime, setLastOfflineTime] = useState<Date | null>(null);

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
        console.log('Offline data cleared');
      };
    }
  }, []);

  const syncPendingChanges = useCallback(async () => {
    if (!isOnline) return;

    try {
      // Get pending changes from IndexedDB
      const pendingChanges = await getPendingChanges();

      for (const change of pendingChanges) {
        try {
          await syncChange(change);
          await removePendingChange(change.id);
        } catch (error) {
          console.error('Failed to sync change:', error);
        }
      }
    } catch (error) {
      console.error('Failed to sync pending changes:', error);
    }
  }, [isOnline]);

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline,
    lastOnlineTime,
    lastOfflineTime,
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
      console.log('Syncing change:', change);
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
