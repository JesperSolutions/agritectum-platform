import { Employee, UserRole } from '../types';
import { logger } from '../utils/logger';

interface CreateUserWithAuthRequest {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  branchId: string;
  isActive: boolean;
  invitedBy?: string;
}

interface CreateCustomerUserRequest {
  email: string;
  password: string;
  displayName: string;
  phone?: string;
  address?: string;
  companyName?: string;
  companyId?: string;
}

interface CreateUserWithAuthResponse {
  success: boolean;
  userId?: string;
  firebaseUid?: string;
  message?: string;
  error?: string;
}

// Call the Cloud Function to create a user with Firebase Auth
export const createUserWithAuth = async (
  userData: CreateUserWithAuthRequest
): Promise<CreateUserWithAuthResponse> => {
  try {
    logger.log('🔍 Creating user with Firebase Auth:', userData.email);

    // Get the current user's auth token to verify caller identity
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Must be authenticated to create users');
    }
    const idToken = await currentUser.getIdToken();

    // Cloud Run URL for the v2 createUserWithAuth function (europe-west1)
    const functionUrl = 'https://createuserwithauth-3xlrn5fcnq-ew.a.run.app';

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify(userData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create user');
    }

    logger.log('✅ User created with Firebase Auth:', result);
    return result;
  } catch (error) {
    console.error('❌ Error creating user with Firebase Auth:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Create customer user account
export const createCustomerUser = async (
  customerData: CreateCustomerUserRequest
): Promise<{ success: boolean; userId?: string; error?: string }> => {
  try {
    logger.log('🔍 Creating customer user:', customerData.email);

    // Get the current Firebase project ID
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'agritectum-platform';

    // Construct the Cloud Function URL
    // Note: This will need to be updated with the actual Cloud Function URL
    const functionUrl = `https://us-central1-${projectId}.cloudfunctions.net/createCustomerUser`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customerData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create customer user');
    }

    logger.log('✅ Customer user created:', result);
    return result;
  } catch (error) {
    console.error('❌ Error creating customer user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Update customer profile
export const updateCustomerProfile = async (
  userId: string,
  updates: { phone?: string; address?: string; companyName?: string; companyId?: string }
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { doc, updateDoc } = await import('firebase/firestore');
    const { db } = await import('../config/firebase');

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      customerProfile: updates,
      ...(updates.companyId && { companyId: updates.companyId }),
    });

    return { success: true };
  } catch (error) {
    console.error('❌ Error updating customer profile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Send email invitation (existing function from userInvitationService)
export const sendUserInvitation = async (
  employee: Employee,
  temporaryPassword: string,
  invitedBy: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    logger.log('📧 Sending user invitation:', {
      email: employee.email,
      displayName: employee.displayName,
      invitedBy,
    });

    // Get the current Firebase project ID
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'agritectum-platform';

    // Construct the Cloud Function URL for email invitation
    const functionUrl = `https://us-central1-${projectId}.cloudfunctions.net/sendUserInvitation`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employee,
        temporaryPassword,
        invitedBy,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to send invitation');
    }

    logger.log('✅ User invitation sent:', result);
    return result;
  } catch (error) {
    console.error('❌ Error sending user invitation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
