import { Report, OfflineReport } from '../types';

const DB_NAME = 'offline-reports';
const DB_VERSION = 1;
const STORE_NAME = 'reports';

/**
 * Service for managing offline data storage and synchronization
 */
export class OfflineService {
  private db: IDBDatabase | null = null;

  /**
   * Initialize the IndexedDB database
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('syncStatus', 'syncStatus', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  /**
   * Save a report for offline access
   */
  async saveReport(report: Report): Promise<void> {
    if (!this.db) await this.init();

    const offlineReport: OfflineReport = {
      ...report,
      localId: report.id,
      syncStatus: 'pending',
      lastSyncAttempt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(offlineReport);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all offline reports
   */
  async getOfflineReports(): Promise<OfflineReport[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get reports by sync status
   */
  async getReportsBySyncStatus(
    status: 'pending' | 'syncing' | 'synced' | 'error'
  ): Promise<OfflineReport[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('syncStatus');
      const request = index.getAll(status);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update report sync status
   */
  async updateSyncStatus(
    id: string,
    status: 'pending' | 'syncing' | 'synced' | 'error'
  ): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const report = getRequest.result;
        if (report) {
          report.syncStatus = status;
          report.lastSyncAttempt = new Date().toISOString();

          const putRequest = store.put(report);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Report not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Delete a report from offline storage
   */
  async deleteReport(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all offline data
   */
  async clearAllData(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get storage usage information
   */
  async getStorageInfo(): Promise<{ used: number; available: number }> {
    if (!navigator.storage || !navigator.storage.estimate) {
      return { used: 0, available: 0 };
    }

    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage || 0,
      available: estimate.quota || 0,
    };
  }

  /**
   * Check if storage is available
   */
  async isStorageAvailable(): Promise<boolean> {
    try {
      if (!navigator.storage || !navigator.storage.estimate) {
        return false;
      }

      const estimate = await navigator.storage.estimate();
      return (estimate.quota || 0) > 0;
    } catch (error) {
      console.error('Storage check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const offlineService = new OfflineService();

// Initialize service
offlineService.init().catch(console.error);
