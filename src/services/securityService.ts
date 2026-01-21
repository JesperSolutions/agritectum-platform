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

export interface SecurityEvent {
  id?: string;
  type: 'login_attempt' | 'failed_login' | 'suspicious_activity' | 'data_access' | 'admin_action';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  details: {
    action?: string;
    resource?: string;
    reason?: string;
    metadata?: Record<string, any>;
  };
  timestamp: Date;
  resolved: boolean;
}

export interface SecurityAlert {
  id?: string;
  eventId: string;
  alertType: 'email' | 'slack' | 'webhook';
  recipients: string[];
  sent: boolean;
  sentAt?: Date;
}

export interface SecurityMetrics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  failedLogins: number;
  suspiciousActivities: number;
  securityScore: number;
}

/**
 * Log a security event
 */
export const logSecurityEvent = async (
  event: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>
): Promise<string> => {
  try {
    const securityEvent: Omit<SecurityEvent, 'id'> = {
      ...event,
      timestamp: new Date(),
      resolved: false,
    };

    const docRef = await addDoc(collection(db, 'securityEvents'), {
      ...securityEvent,
      timestamp: serverTimestamp(),
    });

    // Check if this event requires immediate alerting
    if (event.severity === 'critical' || event.severity === 'high') {
      await sendSecurityAlert(securityEvent);
    }

    return docRef.id;
  } catch (error) {
    console.error('Failed to log security event:', error);
    throw error;
  }
};

/**
 * Send security alert for critical events
 */
const sendSecurityAlert = async (event: SecurityEvent): Promise<void> => {
  try {
    const alert: Omit<SecurityAlert, 'id'> = {
      eventId: event.id || '',
      alertType: 'email',
      recipients: ['security@agritectum.com'], // Security team email
      sent: false,
    };

    await addDoc(collection(db, 'securityAlerts'), {
      ...alert,
      sentAt: serverTimestamp(),
    });

    logger.warn('SECURITY ALERT:', event);
  } catch (alertError) {
    console.error('Failed to send security alert:', alertError);
  }
};

/**
 * Detect suspicious login patterns
 */
export const detectSuspiciousLogin = async (
  email: string,
  ipAddress: string,
  userAgent: string
): Promise<{ suspicious: boolean; reasons: string[] }> => {
  try {
    const reasons: string[] = [];

    // Check for multiple failed login attempts
    const recentFailedLogins = await getRecentFailedLogins(email, 15); // Last 15 minutes
    if (recentFailedLogins > 3) {
      reasons.push('Multiple failed login attempts');
    }

    // Check for login from new IP address
    const isNewIP = await isNewIPForUser(email, ipAddress);
    if (isNewIP) {
      reasons.push('Login from new IP address');
    }

    // Check for login from new user agent
    const isNewUserAgent = await isNewUserAgentForUser(email, userAgent);
    if (isNewUserAgent) {
      reasons.push('Login with new device/browser');
    }

    // Check for rapid successive logins
    const recentLogins = await getRecentLogins(email, 5); // Last 5 minutes
    if (recentLogins > 2) {
      reasons.push('Rapid successive login attempts');
    }

    const suspicious = reasons.length > 1;

    if (suspicious) {
      await logSecurityEvent({
        type: 'suspicious_activity',
        severity: 'high',
        userEmail: email,
        ipAddress,
        userAgent,
        details: {
          action: 'login_attempt',
          reason: reasons.join(', '),
        },
      });
    }

    return { suspicious, reasons };
  } catch (error) {
    console.error('Error detecting suspicious login:', error);
    return { suspicious: false, reasons: [] };
  }
};

/**
 * Rate limiting for API calls
 */
export const checkRateLimit = async (
  identifier: string, // IP address or user ID
  action: string,
  limit: number = 10,
  windowMinutes: number = 15
): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> => {
  try {
    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - windowMinutes);

    const q = query(
      collection(db, 'rateLimitLogs'),
      where('identifier', '==', identifier),
      where('action', '==', action),
      where('timestamp', '>=', windowStart),
      orderBy('timestamp', 'desc')
    );

    const snapshot = await getDocs(q);
    const requestCount = snapshot.size;

    const allowed = requestCount < limit;
    const remaining = Math.max(0, limit - requestCount);
    const resetTime = new Date();
    resetTime.setMinutes(resetTime.getMinutes() + windowMinutes);

    if (!allowed) {
      await logSecurityEvent({
        type: 'suspicious_activity',
        severity: 'medium',
        details: {
          action: 'rate_limit_exceeded',
          resource: action,
          reason: `Rate limit exceeded: ${requestCount}/${limit} requests in ${windowMinutes} minutes`,
          metadata: { identifier, requestCount, limit, windowMinutes },
        },
      });
    }

    return { allowed, remaining, resetTime };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return { allowed: true, remaining: limit, resetTime: new Date() };
  }
};

/**
 * Log rate limit attempt
 */
export const logRateLimitAttempt = async (identifier: string, action: string): Promise<void> => {
  try {
    await addDoc(collection(db, 'rateLimitLogs'), {
      identifier,
      action,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error logging rate limit attempt:', error);
  }
};

/**
 * Get recent failed logins for a user
 */
const getRecentFailedLogins = async (email: string, minutes: number): Promise<number> => {
  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - minutes);

  const q = query(
    collection(db, 'securityEvents'),
    where('userEmail', '==', email),
    where('type', '==', 'failed_login'),
    where('timestamp', '>=', windowStart)
  );

  const snapshot = await getDocs(q);
  return snapshot.size;
};

/**
 * Check if IP is new for user
 */
const isNewIPForUser = async (email: string, ipAddress: string): Promise<boolean> => {
  const q = query(
    collection(db, 'securityEvents'),
    where('userEmail', '==', email),
    where('type', '==', 'login_attempt'),
    where('details.ipAddress', '==', ipAddress)
  );

  const snapshot = await getDocs(q);
  return snapshot.size === 0;
};

/**
 * Check if user agent is new for user
 */
const isNewUserAgentForUser = async (email: string, userAgent: string): Promise<boolean> => {
  const q = query(
    collection(db, 'securityEvents'),
    where('userEmail', '==', email),
    where('type', '==', 'login_attempt'),
    where('details.userAgent', '==', userAgent)
  );

  const snapshot = await getDocs(q);
  return snapshot.size === 0;
};

/**
 * Get recent logins for a user
 */
const getRecentLogins = async (email: string, minutes: number): Promise<number> => {
  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - minutes);

  const q = query(
    collection(db, 'securityEvents'),
    where('userEmail', '==', email),
    where('type', '==', 'login_attempt'),
    where('timestamp', '>=', windowStart)
  );

  const snapshot = await getDocs(q);
  return snapshot.size;
};

/**
 * Get security metrics
 */
export const getSecurityMetrics = async (days: number = 7): Promise<SecurityMetrics> => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const q = query(
      collection(db, 'securityEvents'),
      where('timestamp', '>=', startDate),
      where('timestamp', '<=', endDate)
    );

    const snapshot = await getDocs(q);
    const events = snapshot.docs.map(doc => doc.data()) as SecurityEvent[];

    const totalEvents = events.length;
    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};

    events.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
    });

    const failedLogins = eventsByType.failed_login || 0;
    const suspiciousActivities = eventsByType.suspicious_activity || 0;

    // Calculate security score (0-100, higher is better)
    let securityScore = 100;
    securityScore -= failedLogins * 2; // -2 points per failed login
    securityScore -= suspiciousActivities * 5; // -5 points per suspicious activity
    securityScore -= eventsBySeverity.critical * 10; // -10 points per critical event
    securityScore -= eventsBySeverity.high * 5; // -5 points per high severity event
    securityScore = Math.max(0, securityScore);

    return {
      totalEvents,
      eventsByType,
      eventsBySeverity,
      failedLogins,
      suspiciousActivities,
      securityScore,
    };
  } catch (error) {
    console.error('Error getting security metrics:', error);
    return {
      totalEvents: 0,
      eventsByType: {},
      eventsBySeverity: {},
      failedLogins: 0,
      suspiciousActivities: 0,
      securityScore: 100,
    };
  }
};

/**
 * Clean up old security logs (keep last 90 days)
 */
export const cleanupOldSecurityLogs = async (): Promise<void> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const q = query(collection(db, 'securityEvents'), where('timestamp', '<', cutoffDate));

    const snapshot = await getDocs(q);
    const batch = db.batch();

    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    logger.log(`Cleaned up ${snapshot.size} old security logs`);
  } catch (error) {
    console.error('Error cleaning up old security logs:', error);
  }
};
