import { Report, Branch, Customer, User } from '../types';

/**
 * Caching service for API calls and data persistence
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  key: string;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
  persist?: boolean; // Whether to persist to localStorage
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
  hitRate: number;
}

class CachingService {
  private cache = new Map<string, CacheEntry<any>>();
  private stats = {
    hits: 0,
    misses: 0,
    size: 0,
    maxSize: 1000,
  };
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  private maxSize = 1000;
  private persist = false;

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || this.defaultTTL;
    this.maxSize = options.maxSize || this.maxSize;
    this.persist = options.persist || false;
    this.stats.maxSize = this.maxSize;

    if (this.persist) {
      this.loadFromStorage();
    }
  }

  /**
   * Set a value in the cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      key,
    };

    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      this.stats.size--;
    }

    this.cache.set(key, entry);
    this.stats.size = this.cache.size;

    if (this.persist) {
      this.saveToStorage();
    }
  }

  /**
   * Get a value from the cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.size = this.cache.size;
      return null;
    }

    this.stats.hits++;
    return entry.data;
  }

  /**
   * Check if a key exists in the cache and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.size = this.cache.size;
      return false;
    }

    return true;
  }

  /**
   * Delete a key from the cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    this.stats.size = this.cache.size;

    if (this.persist) {
      this.saveToStorage();
    }

    return deleted;
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
    this.stats.size = 0;

    if (this.persist) {
      this.saveToStorage();
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  /**
   * Get all keys in the cache
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get all values in the cache
   */
  values(): any[] {
    return Array.from(this.cache.values()).map(entry => entry.data);
  }

  /**
   * Get all entries in the cache
   */
  entries(): Array<[string, any]> {
    return Array.from(this.cache.entries()).map(([key, entry]) => [key, entry.data]);
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    this.stats.size = this.cache.size;
    return cleaned;
  }

  /**
   * Save cache to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = Array.from(this.cache.entries()).map(([key, entry]) => [key, entry]);
      localStorage.setItem('taklaget-cache', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save cache to localStorage:', error);
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem('taklaget-cache');
      if (data) {
        const entries = JSON.parse(data);
        for (const [key, entry] of entries) {
          // Check if entry is still valid
          if (Date.now() - entry.timestamp <= entry.ttl) {
            this.cache.set(key, entry);
          }
        }
        this.stats.size = this.cache.size;
      }
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error);
    }
  }
}

// Create cache instances for different data types
export const reportsCache = new CachingService({
  ttl: 10 * 60 * 1000, // 10 minutes
  maxSize: 500,
  persist: true,
});

export const branchesCache = new CachingService({
  ttl: 30 * 60 * 1000, // 30 minutes
  maxSize: 100,
  persist: true,
});

export const customersCache = new CachingService({
  ttl: 15 * 60 * 1000, // 15 minutes
  maxSize: 200,
  persist: true,
});

export const employeesCache = new CachingService({
  ttl: 20 * 60 * 1000, // 20 minutes
  maxSize: 100,
  persist: true,
});

export const apiCache = new CachingService({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 1000,
  persist: false,
});

// Cache key generators
export const cacheKeys = {
  reports: {
    all: 'reports:all',
    byId: (id: string) => `reports:${id}`,
    byBranch: (branchId: string) => `reports:branch:${branchId}`,
    byStatus: (status: string) => `reports:status:${status}`,
    byDateRange: (start: string, end: string) => `reports:date:${start}:${end}`,
  },
  branches: {
    all: 'branches:all',
    byId: (id: string) => `branches:${id}`,
  },
  customers: {
    all: 'customers:all',
    byId: (id: string) => `customers:${id}`,
    byBranch: (branchId: string) => `customers:branch:${branchId}`,
  },
  employees: {
    all: 'employees:all',
    byId: (id: string) => `employees:${id}`,
    byBranch: (branchId: string) => `employees:branch:${branchId}`,
  },
  api: {
    user: (userId: string) => `api:user:${userId}`,
    permissions: (userId: string) => `api:permissions:${userId}`,
    settings: 'api:settings',
  },
};

// Cache service functions
export const cacheService = {
  /**
   * Cache reports data
   */
  cacheReports: (reports: Report[]) => {
    reportsCache.set(cacheKeys.reports.all, reports);
    reports.forEach(report => {
      reportsCache.set(cacheKeys.reports.byId(report.id), report);
    });
  },

  /**
   * Get cached reports
   */
  getCachedReports: (): Report[] | null => {
    return reportsCache.get(cacheKeys.reports.all);
  },

  /**
   * Get cached report by ID
   */
  getCachedReport: (id: string): Report | null => {
    return reportsCache.get(cacheKeys.reports.byId(id));
  },

  /**
   * Cache branches data
   */
  cacheBranches: (branches: Branch[]) => {
    branchesCache.set(cacheKeys.branches.all, branches);
    branches.forEach(branch => {
      branchesCache.set(cacheKeys.branches.byId(branch.id), branch);
    });
  },

  /**
   * Get cached branches
   */
  getCachedBranches: (): Branch[] | null => {
    return branchesCache.get(cacheKeys.branches.all);
  },

  /**
   * Get cached branch by ID
   */
  getCachedBranch: (id: string): Branch | null => {
    return branchesCache.get(cacheKeys.branches.byId(id));
  },

  /**
   * Cache customers data
   */
  cacheCustomers: (customers: Customer[]) => {
    customersCache.set(cacheKeys.customers.all, customers);
    customers.forEach(customer => {
      customersCache.set(cacheKeys.customers.byId(customer.id), customer);
    });
  },

  /**
   * Get cached customers
   */
  getCachedCustomers: (): Customer[] | null => {
    return customersCache.get(cacheKeys.customers.all);
  },

  /**
   * Get cached customer by ID
   */
  getCachedCustomer: (id: string): Customer | null => {
    return customersCache.get(cacheKeys.customers.byId(id));
  },

  /**
   * Cache employees data
   */
  cacheEmployees: (employees: Employee[]) => {
    employeesCache.set(cacheKeys.employees.all, employees);
    employees.forEach(employee => {
      employeesCache.set(cacheKeys.employees.byId(employee.id), employee);
    });
  },

  /**
   * Get cached employees
   */
  getCachedEmployees: (): Employee[] | null => {
    return employeesCache.get(cacheKeys.employees.all);
  },

  /**
   * Get cached employee by ID
   */
  getCachedEmployee: (id: string): Employee | null => {
    return employeesCache.get(cacheKeys.employees.byId(id));
  },

  /**
   * Cache API response
   */
  cacheApiResponse: (key: string, data: any, ttl?: number) => {
    apiCache.set(key, data, ttl);
  },

  /**
   * Get cached API response
   */
  getCachedApiResponse: (key: string): any => {
    return apiCache.get(key);
  },

  /**
   * Clear all caches
   */
  clearAllCaches: () => {
    reportsCache.clear();
    branchesCache.clear();
    customersCache.clear();
    employeesCache.clear();
    apiCache.clear();
  },

  /**
   * Get cache statistics
   */
  getCacheStats: () => ({
    reports: reportsCache.getStats(),
    branches: branchesCache.getStats(),
    customers: customersCache.getStats(),
    employees: employeesCache.getStats(),
    api: apiCache.getStats(),
  }),

  /**
   * Cleanup expired entries
   */
  cleanupCaches: () => {
    const cleaned = {
      reports: reportsCache.cleanup(),
      branches: branchesCache.cleanup(),
      customers: customersCache.cleanup(),
      employees: employeesCache.cleanup(),
      api: apiCache.cleanup(),
    };
    return cleaned;
  },
};

// Auto-cleanup every 5 minutes
setInterval(
  () => {
    cacheService.cleanupCaches();
  },
  5 * 60 * 1000
);

export default cacheService;
