import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';

export interface ReportAccessLog {
  id?: string;
  reportId: string;
  accessedAt: any; // Firestore timestamp
  userAgent?: string;
  ipAddress?: string;
  referer?: string;
  accessType: 'public' | 'admin';
  userId?: string; // For admin access
  customerEmail?: string; // For public access
  sessionId?: string;
  createdAt: any;
}

// Log when a report is accessed
export const logReportAccess = async (
  reportId: string,
  accessType: 'public' | 'admin',
  additionalData: {
    userAgent?: string;
    ipAddress?: string;
    referer?: string;
    userId?: string;
    customerEmail?: string;
    sessionId?: string;
  } = {}
): Promise<void> => {
  try {
    const accessLog: Omit<ReportAccessLog, 'id'> = {
      reportId,
      accessType,
      accessedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      ...additionalData,
    };

    await addDoc(collection(db, 'reportAccessLogs'), accessLog);
    console.log(`📊 Logged ${accessType} access to report ${reportId}`);
  } catch (error) {
    console.error('Error logging report access:', error);
    // Don't throw error to avoid breaking the user experience
  }
};

// Get access logs for a specific report
export const getReportAccessLogs = async (
  reportId: string,
  limitCount: number = 50
): Promise<ReportAccessLog[]> => {
  try {
    const q = query(
      collection(db, 'reportAccessLogs'),
      where('reportId', '==', reportId),
      orderBy('accessedAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const logs: ReportAccessLog[] = [];

    querySnapshot.forEach(doc => {
      logs.push({
        id: doc.id,
        ...doc.data(),
      } as ReportAccessLog);
    });

    return logs;
  } catch (error) {
    console.error('Error fetching report access logs:', error);
    return [];
  }
};

// Get recent access logs across all reports (for admin dashboard)
export const getRecentAccessLogs = async (limitCount: number = 100): Promise<ReportAccessLog[]> => {
  try {
    const q = query(
      collection(db, 'reportAccessLogs'),
      orderBy('accessedAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const logs: ReportAccessLog[] = [];

    querySnapshot.forEach(doc => {
      logs.push({
        id: doc.id,
        ...doc.data(),
      } as ReportAccessLog);
    });

    return logs;
  } catch (error) {
    console.error('Error fetching recent access logs:', error);
    return [];
  }
};

// Get access statistics for a report
export const getReportAccessStats = async (
  reportId: string
): Promise<{
  totalViews: number;
  publicViews: number;
  adminViews: number;
  lastAccessed?: Date;
  uniqueViewers: number;
}> => {
  try {
    const logs = await getReportAccessLogs(reportId, 1000); // Get more logs for stats

    const publicViews = logs.filter(log => log.accessType === 'public').length;
    const adminViews = logs.filter(log => log.accessType === 'admin').length;
    const totalViews = logs.length;

    // Count unique viewers (for public access, use IP + UserAgent combination)
    const uniqueViewers = new Set(
      logs
        .filter(log => log.accessType === 'public')
        .map(log => `${log.ipAddress || 'unknown'}-${log.userAgent || 'unknown'}`)
    ).size;

    const lastAccessed = logs.length > 0 ? logs[0].accessedAt?.toDate() : undefined;

    return {
      totalViews,
      publicViews,
      adminViews,
      lastAccessed,
      uniqueViewers,
    };
  } catch (error) {
    console.error('Error calculating report access stats:', error);
    return {
      totalViews: 0,
      publicViews: 0,
      adminViews: 0,
      uniqueViewers: 0,
    };
  }
};

// Utility function to get client info for logging
export const getClientInfo = (): {
  userAgent: string;
  referer: string;
  sessionId: string;
} => {
  return {
    userAgent: navigator.userAgent,
    referer: document.referrer || '',
    sessionId: getSessionId(),
  };
};

// Generate or retrieve session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('taklaget-session-id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('taklaget-session-id', sessionId);
  }
  return sessionId;
};
