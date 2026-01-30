import { db } from '../config/firebase';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { Report } from '../types';
import { logger } from '../utils/logger';

export interface AccessControlSettings {
  isPublic: boolean;
  expirationDate?: Date;
  accessPassword?: string;
  allowedEmails?: string[];
  maxAccessCount?: number;
  currentAccessCount: number;
  lastAccessed?: Date;
}

export interface AccessControlResult {
  allowed: boolean;
  reason?: string;
  remainingAccess?: number;
}

interface AccessControlUpdate {
  accessControls: {
    isPublic: boolean;
    expirationDate: unknown;
    accessPassword: string | null;
    allowedEmails: string[];
    maxAccessCount: number | null;
    currentAccessCount: number;
    lastAccessed: null;
    updatedAt: unknown;
  };
}

/**
 * Set access controls for a report
 */
export const setReportAccessControls = async (
  reportId: string,
  settings: Partial<AccessControlSettings>
): Promise<void> => {
  try {
    const reportRef = doc(db, 'reports', reportId);

    const updateData: AccessControlUpdate = {
      accessControls: {
        isPublic: settings.isPublic ?? false,
        expirationDate: settings.expirationDate ? serverTimestamp() : null,
        accessPassword: settings.accessPassword || null,
        allowedEmails: settings.allowedEmails || [],
        maxAccessCount: settings.maxAccessCount || null,
        currentAccessCount: settings.currentAccessCount || 0,
        lastAccessed: null,
        updatedAt: serverTimestamp(),
      },
    };

    await updateDoc(reportRef, updateData as unknown as Record<string, unknown>);
    logger.log(`Access controls set for report ${reportId}`);
  } catch (error) {
    console.error('Error setting access controls:', error);
    throw new Error('Failed to set access controls');
  }
};

/**
 * Check if a user can access a report
 */
export const checkReportAccess = async (
  reportId: string,
  userEmail?: string,
  accessPassword?: string
): Promise<AccessControlResult> => {
  try {
    const reportRef = doc(db, 'reports', reportId);
    const reportDoc = await getDoc(reportRef);

    if (!reportDoc.exists()) {
      return { allowed: false, reason: 'Report not found' };
    }

    const reportData = reportDoc.data();
    const accessControls = reportData.accessControls;

    if (!accessControls) {
      // No access controls set, allow access
      return { allowed: true };
    }

    // Check if report is public
    if (!accessControls.isPublic) {
      return { allowed: false, reason: 'Report is not publicly accessible' };
    }

    // Check expiration
    if (accessControls.expirationDate) {
      const expirationDate = accessControls.expirationDate.toDate();
      if (new Date() > expirationDate) {
        return { allowed: false, reason: 'Report access has expired' };
      }
    }

    // Check email whitelist
    if (accessControls.allowedEmails && accessControls.allowedEmails.length > 0) {
      if (!userEmail || !accessControls.allowedEmails.includes(userEmail)) {
        return { allowed: false, reason: 'Email not authorized for this report' };
      }
    }

    // Check access password
    if (accessControls.accessPassword) {
      if (!accessPassword || accessPassword !== accessControls.accessPassword) {
        return { allowed: false, reason: 'Invalid access password' };
      }
    }

    // Check access count limit
    if (accessControls.maxAccessCount) {
      const currentCount = accessControls.currentAccessCount || 0;
      if (currentCount >= accessControls.maxAccessCount) {
        return { allowed: false, reason: 'Maximum access count reached' };
      }
    }

    return {
      allowed: true,
      remainingAccess: accessControls.maxAccessCount
        ? accessControls.maxAccessCount - (accessControls.currentAccessCount || 0)
        : undefined,
    };
  } catch (error) {
    console.error('Error checking report access:', error);
    return { allowed: false, reason: 'Error checking access' };
  }
};

/**
 * Record report access
 */
export const recordReportAccess = async (reportId: string, userEmail?: string): Promise<void> => {
  try {
    const reportRef = doc(db, 'reports', reportId);
    const reportDoc = await getDoc(reportRef);

    if (!reportDoc.exists()) {
      throw new Error('Report not found');
    }

    const reportData = reportDoc.data();
    const accessControls = reportData.accessControls;

    if (accessControls) {
      const updateData = {
        'accessControls.currentAccessCount': (accessControls.currentAccessCount || 0) + 1,
        'accessControls.lastAccessed': serverTimestamp(),
      };

      await updateDoc(reportRef, updateData);
    }
  } catch (error) {
    console.error('Error recording report access:', error);
    throw new Error('Failed to record access');
  }
};

/**
 * Get access control settings for a report
 */
export const getReportAccessControls = async (
  reportId: string
): Promise<AccessControlSettings | null> => {
  try {
    const reportRef = doc(db, 'reports', reportId);
    const reportDoc = await getDoc(reportRef);

    if (!reportDoc.exists()) {
      return null;
    }

    const reportData = reportDoc.data();
    return reportData.accessControls || null;
  } catch (error) {
    console.error('Error getting access controls:', error);
    return null;
  }
};

/**
 * Remove access controls from a report
 */
export const removeReportAccessControls = async (reportId: string): Promise<void> => {
  try {
    const reportRef = doc(db, 'reports', reportId);
    await updateDoc(reportRef, {
      accessControls: null,
    });
    logger.log(`Access controls removed for report ${reportId}`);
  } catch (error) {
    console.error('Error removing access controls:', error);
    throw new Error('Failed to remove access controls');
  }
};
