import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { logger } from '../utils/logger';

export interface PerformanceMetric {
  id?: string;
  type: 'page_load' | 'api_call' | 'database_query' | 'component_render';
  name: string;
  duration: number;
  timestamp: Date;
  userId?: string;
  metadata?: {
    url?: string;
    component?: string;
    querySize?: number;
    cacheHit?: boolean;
    networkType?: string;
  };
}

export interface PerformanceReport {
  averageLoadTime: number;
  slowestPages: Array<{ name: string; averageTime: number; count: number }>;
  apiPerformance: Array<{ endpoint: string; averageTime: number; count: number }>;
  databasePerformance: Array<{ query: string; averageTime: number; count: number }>;
  componentPerformance: Array<{ component: string; averageTime: number; count: number }>;
  recommendations: string[];
}

/**
 * Record a performance metric
 */
export const recordPerformanceMetric = async (
  metric: Omit<PerformanceMetric, 'id' | 'timestamp'>
): Promise<void> => {
  try {
    // Only record metrics in production or when explicitly enabled
    if (
      process.env.NODE_ENV === 'development' &&
      !localStorage.getItem('enablePerformanceTracking')
    ) {
      return;
    }

    const metricData: Omit<PerformanceMetric, 'id'> = {
      ...metric,
      timestamp: new Date(),
    };

    await addDoc(collection(db, 'performanceMetrics'), {
      ...metricData,
      timestamp: serverTimestamp(),
    });

    // Check for performance issues
    if (metric.duration > getPerformanceThreshold(metric.type)) {
      logger.warn(`Slow ${metric.type}: ${metric.name} took ${metric.duration}ms`);
    }
  } catch (error) {
    console.error('Failed to record performance metric:', error);
  }
};

/**
 * Get performance thresholds for different metric types
 */
const getPerformanceThreshold = (type: string): number => {
  const thresholds = {
    page_load: 3000,
    api_call: 2000,
    database_query: 1000,
    component_render: 100,
  };
  return thresholds[type as keyof typeof thresholds] || 5000;
};

/**
 * Get performance report for a date range
 */
export const getPerformanceReport = async (days: number = 7): Promise<PerformanceReport> => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const q = query(
      collection(db, 'performanceMetrics'),
      where('timestamp', '>=', startDate),
      where('timestamp', '<=', endDate)
    );

    const snapshot = await getDocs(q);
    const metrics = snapshot.docs.map(doc => ({
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    })) as PerformanceMetric[];

    // Calculate averages
    const pageLoads = metrics.filter(m => m.type === 'page_load');
    const apiCalls = metrics.filter(m => m.type === 'api_call');
    const dbQueries = metrics.filter(m => m.type === 'database_query');
    const componentRenders = metrics.filter(m => m.type === 'component_render');

    const averageLoadTime =
      pageLoads.length > 0
        ? pageLoads.reduce((sum, m) => sum + m.duration, 0) / pageLoads.length
        : 0;

    // Group by name and calculate averages
    const groupByAverage = (metrics: PerformanceMetric[]) => {
      const groups: Record<string, { total: number; count: number }> = {};

      metrics.forEach(metric => {
        if (!groups[metric.name]) {
          groups[metric.name] = { total: 0, count: 0 };
        }
        groups[metric.name].total += metric.duration;
        groups[metric.name].count += 1;
      });

      return Object.entries(groups)
        .map(([name, data]) => ({
          name,
          averageTime: data.total / data.count,
          count: data.count,
        }))
        .sort((a, b) => b.averageTime - a.averageTime);
    };

    const slowestPages = groupByAverage(pageLoads).slice(0, 10);
    const apiPerformance = groupByAverage(apiCalls).slice(0, 10);
    const databasePerformance = groupByAverage(dbQueries).slice(0, 10);
    const componentPerformance = groupByAverage(componentRenders).slice(0, 10);

    // Generate recommendations
    const recommendations: string[] = [];

    if (averageLoadTime > 3000) {
      recommendations.push('Consider implementing code splitting to reduce initial page load time');
    }

    if (apiPerformance.some(api => api.averageTime > 2000)) {
      recommendations.push('Optimize slow API endpoints or implement caching');
    }

    if (databasePerformance.some(db => db.averageTime > 1000)) {
      recommendations.push('Review database queries and consider adding indexes');
    }

    if (componentPerformance.some(comp => comp.averageTime > 100)) {
      recommendations.push('Optimize slow-rendering components with React.memo or useMemo');
    }

    return {
      averageLoadTime,
      slowestPages,
      apiPerformance,
      databasePerformance,
      componentPerformance,
      recommendations,
    };
  } catch (error) {
    console.error('Error getting performance report:', error);
    return {
      averageLoadTime: 0,
      slowestPages: [],
      apiPerformance: [],
      databasePerformance: [],
      componentPerformance: [],
      recommendations: [],
    };
  }
};

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private startTime: number;
  private metricName: string;
  private metricType: PerformanceMetric['type'];
  private metadata?: PerformanceMetric['metadata'];

  constructor(
    name: string,
    type: PerformanceMetric['type'],
    metadata?: PerformanceMetric['metadata']
  ) {
    this.metricName = name;
    this.metricType = type;
    this.metadata = metadata;
    this.startTime = performance.now();
  }

  end(): void {
    const duration = performance.now() - this.startTime;
    recordPerformanceMetric({
      type: this.metricType,
      name: this.metricName,
      duration,
      metadata: this.metadata,
    });
  }
}

/**
 * Hook for measuring component render time
 */
export const measureComponentRender = (componentName: string) => {
  return new PerformanceMonitor(componentName, 'component_render', {
    component: componentName,
  });
};

/**
 * Hook for measuring API calls
 */
export const measureApiCall = (endpoint: string) => {
  return new PerformanceMonitor(endpoint, 'api_call', {
    endpoint,
  });
};

/**
 * Hook for measuring database queries
 */
export const measureDatabaseQuery = (queryName: string, querySize?: number) => {
  return new PerformanceMonitor(queryName, 'database_query', {
    query: queryName,
    querySize,
  });
};

/**
 * Hook for measuring page loads
 */
export const measurePageLoad = (pageName: string, url?: string) => {
  return new PerformanceMonitor(pageName, 'page_load', {
    url,
  });
};

/**
 * Clean up old performance metrics (keep last 30 days)
 */
export const cleanupOldPerformanceMetrics = async (): Promise<void> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    const q = query(collection(db, 'performanceMetrics'), where('timestamp', '<', cutoffDate));

    const snapshot = await getDocs(q);
    const batch = db.batch();

    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    logger.log(`Cleaned up ${snapshot.size} old performance metrics`);
  } catch (error) {
    console.error('Error cleaning up old performance metrics:', error);
  }
};
