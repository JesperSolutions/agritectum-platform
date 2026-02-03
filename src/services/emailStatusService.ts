import { db } from '../config/firebase';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';

export interface EmailDeliveryStatus {
  id: string;
  to: string;
  subject: string;
  template: string;
  createdAt: Timestamp;
  delivery?: {
    state: 'PENDING' | 'SUCCESS' | 'ERROR';
    attempts: number;
    error?: string;
    lastAttempt?: Timestamp;
  };
  metadata?: {
    reportId?: string;
    sentBy?: string;
    timestamp?: string;
  };
}

export interface EmailLog {
  id: string;
  sentBy: string;
  sentAt: Timestamp;
  to: string;
  subject: string;
  template: string;
  reportId?: string;
  status: 'sent' | 'failed' | 'pending' | 'disabled';
  errorMessage?: string;
}

// Get recent email delivery status from mail collection (Trigger Email extension)
export const getRecentEmailStatus = async (
  limitCount: number = 50
): Promise<EmailDeliveryStatus[]> => {
  try {
    const q = query(collection(db, 'mail'), orderBy('createdAt', 'desc'), limit(limitCount));

    const querySnapshot = await getDocs(q);
    const emails: EmailDeliveryStatus[] = [];

    querySnapshot.forEach(doc => {
      emails.push({
        id: doc.id,
        ...doc.data(),
      } as EmailDeliveryStatus);
    });

    return emails;
  } catch (error) {
    console.error('Error fetching email status:', error);
    return [];
  }
};

// Get email logs from emailLogs collection
export const getEmailLogs = async (limitCount: number = 50): Promise<EmailLog[]> => {
  try {
    const q = query(collection(db, 'emailLogs'), orderBy('sentAt', 'desc'), limit(limitCount));

    const querySnapshot = await getDocs(q);
    const logs: EmailLog[] = [];

    querySnapshot.forEach(doc => {
      logs.push({
        id: doc.id,
        ...doc.data(),
      } as EmailLog);
    });

    return logs;
  } catch (error) {
    console.error('Error fetching email logs:', error);
    return [];
  }
};

// Get email status for a specific report
export const getReportEmailStatus = async (reportId: string): Promise<EmailDeliveryStatus[]> => {
  try {
    const q = query(
      collection(db, 'mail'),
      where('metadata.reportId', '==', reportId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const emails: EmailDeliveryStatus[] = [];

    querySnapshot.forEach(doc => {
      emails.push({
        id: doc.id,
        ...doc.data(),
      } as EmailDeliveryStatus);
    });

    return emails;
  } catch (error) {
    console.error('Error fetching report email status:', error);
    return [];
  }
};

// Get email statistics
export const getEmailStats = async (): Promise<{
  totalSent: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  pendingDeliveries: number;
  successRate: number;
}> => {
  try {
    const emails = await getRecentEmailStatus(1000); // Get more data for accurate stats

    const totalSent = emails.length;
    const successfulDeliveries = emails.filter(email => email.delivery?.state === 'SUCCESS').length;
    const failedDeliveries = emails.filter(email => email.delivery?.state === 'ERROR').length;
    const pendingDeliveries = emails.filter(email => email.delivery?.state === 'PENDING').length;

    const successRate = totalSent > 0 ? Math.round((successfulDeliveries / totalSent) * 100) : 0;

    return {
      totalSent,
      successfulDeliveries,
      failedDeliveries,
      pendingDeliveries,
      successRate,
    };
  } catch (error) {
    console.error('Error calculating email stats:', error);
    return {
      totalSent: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      pendingDeliveries: 0,
      successRate: 0,
    };
  }
};

// Format delivery status for display
export const formatDeliveryStatus = (
  status: EmailDeliveryStatus
): {
  status: 'success' | 'error' | 'pending';
  message: string;
  color: string;
} => {
  if (!status.delivery) {
    return {
      status: 'pending',
      message: 'Queued for delivery',
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    };
  }

  switch (status.delivery.state) {
    case 'SUCCESS':
      return {
        status: 'success',
        message: 'Delivered successfully',
        color: 'text-green-600 bg-green-50 border-green-200',
      };
    case 'ERROR':
      return {
        status: 'error',
        message: status.delivery.error || 'Delivery failed',
        color: 'text-red-600 bg-red-50 border-red-200',
      };
    case 'PENDING':
    default:
      return {
        status: 'pending',
        message: `Attempting delivery (${status.delivery.attempts || 0} attempts)`,
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      };
  }
};

// Format timestamp for display
export const formatEmailTimestamp = (timestamp: Timestamp): string => {
  try {
    return new Intl.DateTimeFormat('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(timestamp.toDate());
  } catch {
    return 'Unknown';
  }
};
