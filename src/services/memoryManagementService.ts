/**
 * Memory Management Service
 * Provides utilities for optimizing memory usage and preventing memory leaks
 */

import { logger } from '../utils/logger';

interface MemoryStats {
  used: number;
  total: number;
  percentage: number;
  timestamp: number;
}

interface MemoryThresholds {
  warning: number; // Percentage (0-100)
  critical: number; // Percentage (0-100)
}

class MemoryManagementService {
  private static instance: MemoryManagementService;
  private memoryStats: MemoryStats[] = [];
  private thresholds: MemoryThresholds = {
    warning: 70,
    critical: 90,
  };
  private listeners: Array<(stats: MemoryStats) => void> = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private cleanupTasks: Array<() => void> = [];

  private constructor() {
    this.startMonitoring();
  }

  static getInstance(): MemoryManagementService {
    if (!MemoryManagementService.instance) {
      MemoryManagementService.instance = new MemoryManagementService();
    }
    return MemoryManagementService.instance;
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage(): MemoryStats | null {
    if (typeof performance === 'undefined' || !performance.memory) {
      return null;
    }

    const memory = performance.memory;
    const used = memory.usedJSHeapSize;
    const total = memory.totalJSHeapSize;
    const percentage = (used / total) * 100;

    const stats: MemoryStats = {
      used,
      total,
      percentage,
      timestamp: Date.now(),
    };

    this.memoryStats.push(stats);

    // Keep only last 100 measurements
    if (this.memoryStats.length > 100) {
      this.memoryStats = this.memoryStats.slice(-100);
    }

    return stats;
  }

  /**
   * Start monitoring memory usage
   */
  private startMonitoring(): void {
    if (this.monitoringInterval) return;

    this.monitoringInterval = setInterval(() => {
      const stats = this.getMemoryUsage();
      if (stats) {
        this.checkThresholds(stats);
        this.notifyListeners(stats);
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Stop monitoring memory usage
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Check memory thresholds and trigger cleanup if needed
   */
  private checkThresholds(stats: MemoryStats): void {
    if (stats.percentage >= this.thresholds.critical) {
      console.warn('Critical memory usage detected:', stats);
      this.triggerCleanup('critical');
    } else if (stats.percentage >= this.thresholds.warning) {
      console.warn('High memory usage detected:', stats);
      this.triggerCleanup('warning');
    }
  }

  /**
   * Trigger memory cleanup
   */
  private triggerCleanup(level: 'warning' | 'critical'): void {
    logger.log(`Triggering memory cleanup (${level} level)`);

    // Run cleanup tasks
    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        console.error('Error during cleanup task:', error);
      }
    });

    // Force garbage collection if available
    if (typeof window !== 'undefined' && (window as any).gc) {
      (window as any).gc();
    }

    // Clear old memory stats
    this.memoryStats = this.memoryStats.slice(-50);
  }

  /**
   * Add a cleanup task
   */
  addCleanupTask(task: () => void): void {
    this.cleanupTasks.push(task);
  }

  /**
   * Remove a cleanup task
   */
  removeCleanupTask(task: () => void): void {
    const index = this.cleanupTasks.indexOf(task);
    if (index > -1) {
      this.cleanupTasks.splice(index, 1);
    }
  }

  /**
   * Subscribe to memory usage updates
   */
  subscribe(listener: (stats: MemoryStats) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify listeners of memory updates
   */
  private notifyListeners(stats: MemoryStats): void {
    this.listeners.forEach(listener => {
      try {
        listener(stats);
      } catch (error) {
        console.error('Error in memory listener:', error);
      }
    });
  }

  /**
   * Get memory usage history
   */
  getMemoryHistory(): MemoryStats[] {
    return [...this.memoryStats];
  }

  /**
   * Get memory usage trends
   */
  getMemoryTrends(): {
    average: number;
    peak: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  } {
    if (this.memoryStats.length < 2) {
      return { average: 0, peak: 0, trend: 'stable' };
    }

    const recent = this.memoryStats.slice(-10);
    const average = recent.reduce((sum, stat) => sum + stat.percentage, 0) / recent.length;
    const peak = Math.max(...recent.map(stat => stat.percentage));

    const first = recent[0].percentage;
    const last = recent[recent.length - 1].percentage;
    const diff = last - first;

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (diff > 5) trend = 'increasing';
    else if (diff < -5) trend = 'decreasing';

    return { average, peak, trend };
  }

  /**
   * Set memory thresholds
   */
  setThresholds(thresholds: Partial<MemoryThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Force garbage collection
   */
  forceGarbageCollection(): void {
    if (typeof window !== 'undefined' && (window as any).gc) {
      (window as any).gc();
    }
  }

  /**
   * Get memory recommendations
   */
  getMemoryRecommendations(): string[] {
    const trends = this.getMemoryTrends();
    const recommendations: string[] = [];

    if (trends.trend === 'increasing') {
      recommendations.push('Memory usage is increasing. Consider implementing cleanup strategies.');
    }

    if (trends.peak > 80) {
      recommendations.push('Peak memory usage is high. Consider implementing data pagination.');
    }

    if (trends.average > 70) {
      recommendations.push(
        'Average memory usage is high. Consider implementing virtual scrolling.'
      );
    }

    return recommendations;
  }
}

// Export singleton instance
export const memoryManager = MemoryManagementService.getInstance();

// Memory optimization utilities
export const memoryUtils = {
  /**
   * Debounce function to prevent excessive calls
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  /**
   * Throttle function to limit function calls
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  /**
   * Create a weak reference to prevent memory leaks
   */
  createWeakRef<T extends object>(obj: T): WeakRef<T> {
    return new WeakRef(obj);
  },

  /**
   * Check if an object is still referenced
   */
  isReferenced<T extends object>(weakRef: WeakRef<T>): T | undefined {
    return weakRef.deref();
  },

  /**
   * Create a memory-efficient array with size limit
   */
  createLimitedArray<T>(maxSize: number): T[] {
    const array: T[] = [];

    return new Proxy(array, {
      set(target, property, value) {
        if (property === 'length') {
          return Reflect.set(target, property, value);
        }

        const index = Number(property);
        if (!isNaN(index) && index >= maxSize) {
          // Remove oldest items when array gets too large
          const removeCount = index - maxSize + 1;
          target.splice(0, removeCount);
          return Reflect.set(target, property - removeCount, value);
        }

        return Reflect.set(target, property, value);
      },
    });
  },

  /**
   * Create a memory-efficient cache with TTL
   */
  createCache<T>(ttl: number = 300000): Map<string, { value: T; expiry: number }> {
    const cache = new Map<string, { value: T; expiry: number }>();

    // Cleanup expired entries every minute
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of cache.entries()) {
        if (now > entry.expiry) {
          cache.delete(key);
        }
      }
    }, 60000);

    return cache;
  },

  /**
   * Create a memory-efficient event emitter
   */
  createEventEmitter(): {
    on: (event: string, listener: Function) => void;
    off: (event: string, listener: Function) => void;
    emit: (event: string, ...args: any[]) => void;
  } {
    const listeners = new Map<string, Set<Function>>();

    return {
      on(event: string, listener: Function) {
        if (!listeners.has(event)) {
          listeners.set(event, new Set());
        }
        listeners.get(event)!.add(listener);
      },

      off(event: string, listener: Function) {
        const eventListeners = listeners.get(event);
        if (eventListeners) {
          eventListeners.delete(listener);
          if (eventListeners.size === 0) {
            listeners.delete(event);
          }
        }
      },

      emit(event: string, ...args: any[]) {
        const eventListeners = listeners.get(event);
        if (eventListeners) {
          eventListeners.forEach(listener => {
            try {
              listener(...args);
            } catch (error) {
              console.error('Error in event listener:', error);
            }
          });
        }
      },
    };
  },
};

// Memory leak detection utilities
export const leakDetection = {
  /**
   * Track object creation and destruction
   */
  trackObject<T extends object>(obj: T, name: string): T {
    const weakRef = memoryUtils.createWeakRef(obj);

    // Track object in memory manager
    memoryManager.addCleanupTask(() => {
      if (!memoryUtils.isReferenced(weakRef)) {
        logger.log(`Object ${name} was garbage collected`);
      }
    });

    return obj;
  },

  /**
   * Check for potential memory leaks
   */
  checkForLeaks(): {
    hasLeaks: boolean;
    recommendations: string[];
  } {
    const trends = memoryManager.getMemoryTrends();
    const recommendations = memoryManager.getMemoryRecommendations();

    const hasLeaks = trends.trend === 'increasing' && trends.average > 60;

    return {
      hasLeaks,
      recommendations,
    };
  },
};

export default memoryManager;
