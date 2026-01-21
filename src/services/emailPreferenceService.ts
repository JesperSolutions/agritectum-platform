import { db } from '../config/firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';

export interface EmailPreferences {
  email: string;
  subscribed: boolean;
  preferences: {
    inspectionComplete: boolean;
    urgentIssues: boolean;
    weeklyDigest: boolean;
    marketingEmails: boolean;
    systemNotifications: boolean;
  };
  unsubscribeToken: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UnsubscribeRequest {
  email: string;
  token: string;
  reason?: string;
  timestamp: Date;
}

/**
 * Generate a secure unsubscribe token
 */
const generateUnsubscribeToken = (email: string): string => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2);
  return Buffer.from(`${email}:${timestamp}:${random}`).toString('base64');
};

/**
 * Get email preferences for a user
 */
export const getEmailPreferences = async (email: string): Promise<EmailPreferences | null> => {
  try {
    const prefDoc = await getDoc(doc(db, 'emailPreferences', email));

    if (!prefDoc.exists()) {
      return null;
    }

    const data = prefDoc.data();
    return {
      email: data.email,
      subscribed: data.subscribed,
      preferences: data.preferences,
      unsubscribeToken: data.unsubscribeToken,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('Error getting email preferences:', error);
    return null;
  }
};

/**
 * Create or update email preferences
 */
export const setEmailPreferences = async (
  email: string,
  preferences: Partial<EmailPreferences['preferences']>
): Promise<void> => {
  try {
    const existingPrefs = await getEmailPreferences(email);

    const prefData = {
      email,
      subscribed: true,
      preferences: {
        inspectionComplete: preferences.inspectionComplete ?? true,
        urgentIssues: preferences.urgentIssues ?? true,
        weeklyDigest: preferences.weeklyDigest ?? false,
        marketingEmails: preferences.marketingEmails ?? false,
        systemNotifications: preferences.systemNotifications ?? true,
      },
      unsubscribeToken: existingPrefs?.unsubscribeToken || generateUnsubscribeToken(email),
      createdAt: existingPrefs?.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'emailPreferences', email), prefData);
  } catch (error) {
    console.error('Error setting email preferences:', error);
    throw new Error('Failed to set email preferences');
  }
};

/**
 * Unsubscribe user from all emails
 */
export const unsubscribeUser = async (
  email: string,
  token: string,
  reason?: string
): Promise<boolean> => {
  try {
    const prefDoc = await getDoc(doc(db, 'emailPreferences', email));

    if (!prefDoc.exists()) {
      return false;
    }

    const data = prefDoc.data();
    if (data.unsubscribeToken !== token) {
      return false; // Invalid token
    }

    // Update preferences to unsubscribe
    await updateDoc(doc(db, 'emailPreferences', email), {
      subscribed: false,
      updatedAt: serverTimestamp(),
    });

    // Log the unsubscribe request
    await setDoc(doc(collection(db, 'unsubscribeRequests'), `${email}_${Date.now()}`), {
      email,
      token,
      reason,
      timestamp: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error('Error unsubscribing user:', error);
    return false;
  }
};

/**
 * Resubscribe user to emails
 */
export const resubscribeUser = async (email: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'emailPreferences', email), {
      subscribed: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error resubscribing user:', error);
    throw new Error('Failed to resubscribe user');
  }
};

/**
 * Check if user is subscribed to specific email type
 */
export const isUserSubscribed = async (
  email: string,
  emailType: keyof EmailPreferences['preferences']
): Promise<boolean> => {
  try {
    const preferences = await getEmailPreferences(email);

    if (!preferences || !preferences.subscribed) {
      return false;
    }

    return preferences.preferences[emailType];
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
};

/**
 * Get unsubscribe URL for an email
 */
export const getUnsubscribeUrl = (email: string, token: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/unsubscribe?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
};

/**
 * Validate unsubscribe token
 */
export const validateUnsubscribeToken = async (email: string, token: string): Promise<boolean> => {
  try {
    const preferences = await getEmailPreferences(email);
    return preferences?.unsubscribeToken === token;
  } catch (error) {
    console.error('Error validating unsubscribe token:', error);
    return false;
  }
};

/**
 * Get unsubscribe statistics
 */
export const getUnsubscribeStats = async (): Promise<{
  totalSubscribers: number;
  totalUnsubscribed: number;
  unsubscribeRate: number;
}> => {
  try {
    const [subscribedDocs, unsubscribedDocs] = await Promise.all([
      getDocs(query(collection(db, 'emailPreferences'), where('subscribed', '==', true))),
      getDocs(query(collection(db, 'emailPreferences'), where('subscribed', '==', false))),
    ]);

    const totalSubscribers = subscribedDocs.size;
    const totalUnsubscribed = unsubscribedDocs.size;
    const unsubscribeRate =
      totalSubscribers > 0 ? (totalUnsubscribed / (totalSubscribers + totalUnsubscribed)) * 100 : 0;

    return {
      totalSubscribers,
      totalUnsubscribed,
      unsubscribeRate,
    };
  } catch (error) {
    console.error('Error getting unsubscribe stats:', error);
    return {
      totalSubscribers: 0,
      totalUnsubscribed: 0,
      unsubscribeRate: 0,
    };
  }
};
