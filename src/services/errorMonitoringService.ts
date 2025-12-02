import { db } from '../config/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, limit, serverTimestamp } from 'firebase/firestore';

export interface ErrorLog {
  id?: string;
  level: 'error' | 'warning' | 'info' | 'critical';
  message: string;
  stack?: string;
  userId?: string;
  userRole?: string;
  component?: string;
  action?: string;
  url?: string;
  userAgent?: string;
  timestamp: Date;
  resolved: boolean;
  assignedTo?: string;
  notes?: string;
}

export interface ErrorAlert {
  id?: string;
  errorId: string;
  alertType: 'email' | 'slack' | 'webhook';
  recipients: string[];
  sent: boolean;
  sentAt?: Date;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByLevel: Record<string, number>;
  errorsByComponent: Record<string, number>;
  errorsByUser: Record<string, number>;
  errorTrend: Array<{ date: string; count: number }>;
  topErrors: Array<{ message: string; count: number }>;
}

/**
 * Log an error to the monitoring system
 */
export const logError = async (errorData: Omit<ErrorLog, 'id' | 'timestamp' | 'resolved'>): Promise<string> => {
  try {
    const errorLog: Omit<ErrorLog, 'id'> = {
      ...errorData,
      timestamp: new Date(),
      resolved: false,
    };

    const docRef = await addDoc(collection(db, 'errorLogs'), {
      ...errorLog,
      timestamp: serverTimestamp(),
    });

    // Check if this error needs immediate alerting
    await checkForCriticalError(errorLog);

    return docRef.id;
  } catch (error) {
    console.error('Failed to log error:', error);
    throw error;
  }
};

/**
 * Check if error requires immediate alerting
 */
const checkForCriticalError = async (error: ErrorLog): Promise<void> => {
  const criticalKeywords = ['critical', 'fatal', 'authentication', 'payment', 'database'];
  const isCritical = error.level === 'critical' || 
    criticalKeywords.some(keyword => 
      error.message.toLowerCase().includes(keyword) ||
      error.component?.toLowerCase().includes(keyword)
    );

  if (isCritical) {
    await sendCriticalErrorAlert(error);
  }
};

/**
 * Send critical error alert
 */
const sendCriticalErrorAlert = async (error: ErrorLog): Promise<void> => {
  try {
    const alert: Omit<ErrorAlert, 'id'> = {
      errorId: error.id || '',
      alertType: 'email',
      recipients: [import.meta.env.VITE_SUPPORT_EMAIL || 'support@example.com'], // Admin email
      sent: false,
    };

    await addDoc(collection(db, 'errorAlerts'), {
      ...alert,
      sentAt: serverTimestamp(),
    });

    // TODO: Implement actual email sending for critical errors
    console.warn('CRITICAL ERROR ALERT:', error);
  } catch (alertError) {
    console.error('Failed to send critical error alert:', alertError);
  }
};

/**
 * Get error logs with filtering and pagination
 */
export const getErrorLogs = async (
  filters: {
    level?: string;
    component?: string;
    userId?: string;
    resolved?: boolean;
    startDate?: Date;
    endDate?: Date;
  } = {},
  limitCount: number = 50
): Promise<ErrorLog[]> => {
  try {
    let q = query(collection(db, 'errorLogs'), orderBy('timestamp', 'desc'), limit(limitCount));

    if (filters.level) {
      q = query(q, where('level', '==', filters.level));
    }
    if (filters.component) {
      q = query(q, where('component', '==', filters.component));
    }
    if (filters.userId) {
      q = query(q, where('userId', '==', filters.userId));
    }
    if (filters.resolved !== undefined) {
      q = query(q, where('resolved', '==', filters.resolved));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    })) as ErrorLog[];
  } catch (error) {
    console.error('Error getting error logs:', error);
    return [];
  }
};

/**
 * Mark error as resolved
 */
export const resolveError = async (errorId: string, notes?: string): Promise<void> => {
  try {
    const errorRef = doc(db, 'errorLogs', errorId);
    await updateDoc(errorRef, {
      resolved: true,
      notes,
      resolvedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error resolving error:', error);
    throw error;
  }
};

/**
 * Get error metrics for dashboard
 */
export const getErrorMetrics = async (days: number = 30): Promise<ErrorMetrics> => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const q = query(
      collection(db, 'errorLogs'),
      where('timestamp', '>=', startDate),
      where('timestamp', '<=', endDate)
    );

    const snapshot = await getDocs(q);
    const errors = snapshot.docs.map(doc => doc.data()) as ErrorLog[];

    // Calculate metrics
    const totalErrors = errors.length;
    const errorsByLevel: Record<string, number> = {};
    const errorsByComponent: Record<string, number> = {};
    const errorsByUser: Record<string, number> = {};
    const errorMessages: Record<string, number> = {};

    errors.forEach(error => {
      // Count by level
      errorsByLevel[error.level] = (errorsByLevel[error.level] || 0) + 1;
      
      // Count by component
      if (error.component) {
        errorsByComponent[error.component] = (errorsByComponent[error.component] || 0) + 1;
      }
      
      // Count by user
      if (error.userId) {
        errorsByUser[error.userId] = (errorsByUser[error.userId] || 0) + 1;
      }
      
      // Count by message
      errorMessages[error.message] = (errorMessages[error.message] || 0) + 1;
    });

    // Get top errors
    const topErrors = Object.entries(errorMessages)
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate error trend (daily)
    const errorTrend: Array<{ date: string; count: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayErrors = errors.filter(error => {
        const errorDate = error.timestamp.toISOString().split('T')[0];
        return errorDate === dateStr;
      });

      errorTrend.push({
        date: dateStr,
        count: dayErrors.length,
      });
    }

    return {
      totalErrors,
      errorsByLevel,
      errorsByComponent,
      errorsByUser,
      errorTrend,
      topErrors,
    };
  } catch (error) {
    console.error('Error getting error metrics:', error);
    return {
      totalErrors: 0,
      errorsByLevel: {},
      errorsByComponent: {},
      errorsByUser: {},
      errorTrend: [],
      topErrors: [],
    };
  }
};

/**
 * Get unresolved errors count
 */
export const getUnresolvedErrorsCount = async (): Promise<number> => {
  try {
    const q = query(
      collection(db, 'errorLogs'),
      where('resolved', '==', false)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting unresolved errors count:', error);
    return 0;
  }
};

/**
 * Clean up old error logs (keep last 90 days)
 */
export const cleanupOldErrorLogs = async (): Promise<void> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const q = query(
      collection(db, 'errorLogs'),
      where('timestamp', '<', cutoffDate)
    );

    const snapshot = await getDocs(q);
    const batch = db.batch();

    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Cleaned up ${snapshot.size} old error logs`);
  } catch (error) {
    console.error('Error cleaning up old error logs:', error);
  }
};
