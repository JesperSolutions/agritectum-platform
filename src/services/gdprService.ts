import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { logger } from '../utils/logger';

/**
 * Delete user account and all associated data
 * Requires user authentication
 */
export const deleteUserAccountWithGDPR = async (userId: string): Promise<{
  success: boolean;
  deleted: number;
  message: string;
}> => {
  try {
    const deleteAccount = httpsCallable(functions, 'deleteUserAccount');
    const result: any = await deleteAccount({ userId });
    
    logger.info('Account deleted successfully:', result.data);
    return result.data;
  } catch (error: any) {
    logger.error('Error deleting account:', error);
    throw new Error(error.message || 'Failed to delete account');
  }
};

/**
 * Export user data in portable format (GDPR right to portability)
 */
export const exportUserDataGDPR = async (): Promise<{
  success: boolean;
  data: any;
  fileName: string;
}> => {
  try {
    const exportData = httpsCallable(functions, 'exportUserData');
    const result: any = await exportData({});
    
    // Auto-download the JSON file
    const dataStr = JSON.stringify(result.data.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.data.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    logger.info('Data exported successfully');
    return result.data;
  } catch (error: any) {
    logger.error('Error exporting data:', error);
    throw new Error(error.message || 'Failed to export data');
  }
};

/**
 * Update GDPR consent preferences
 */
export const updateConsentPreferences = async (preferences: {
  analyticsconsent: boolean;
  personaldataConsent: boolean;
  termsAccepted: boolean;
}): Promise<void> => {
  try {
    // This is handled via Firestore update in the component
    logger.info('Consent preferences updated');
  } catch (error) {
    logger.error('Error updating preferences:', error);
    throw error;
  }
};
