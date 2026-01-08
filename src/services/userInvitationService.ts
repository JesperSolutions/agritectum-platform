import { addDoc, collection, doc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Employee } from '../types';

// Generate a secure temporary password (16+ characters for "strong" rating)
export const generateTemporaryPassword = (): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  const allChars = uppercase + lowercase + numbers + special;
  
  let password = '';
  
  // Ensure at least one of each required character type
  password += uppercase[Math.floor(Math.random() * uppercase.length)]; // Uppercase
  password += lowercase[Math.floor(Math.random() * lowercase.length)]; // Lowercase
  password += numbers[Math.floor(Math.random() * numbers.length)]; // Number
  password += special[Math.floor(Math.random() * special.length)]; // Special char
  
  // Fill the rest randomly to reach 16 characters minimum
  // This ensures score of 7-8 ("strong" rating)
  for (let i = 4; i < 16; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password for randomness
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Send user invitation email
export const sendUserInvitation = async (
  employee: Employee,
  temporaryPassword: string,
  invitedBy: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('📧 Sending user invitation:', {
      email: employee.email,
      displayName: employee.displayName,
      invitedBy,
    });

    // Create invitation email request
    const mailDoc = {
      to: employee.email,
      from: 'noreply@agritectum.com',
      replyTo: 'support@agritectum.com',
      template: {
        name: 'user-invitation',
        data: {
          displayName: employee.displayName,
          email: employee.email,
          temporaryPassword,
          loginUrl: `${window.location.origin}/login`,
          companyName: 'Agritectum',
          invitedBy,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('sv-SE'), // 7 days
        },
      },
      metadata: {
        type: 'user-invitation',
        employeeId: employee.id,
        invitedBy,
        timestamp: new Date().toISOString(),
      },
    };

    // Add document to mail collection to trigger email
    const mailRef = await addDoc(collection(db, 'mail'), mailDoc);

    console.log('✅ User invitation email created:', mailRef.id);
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending user invitation:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Update user with invitation details
export const updateUserWithInvitation = async (
  userId: string,
  temporaryPassword: string,
  invitedBy: string
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      temporaryPassword,
      invitedBy,
      invitedAt: new Date().toISOString(),
      passwordExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      needsPasswordChange: true,
      updatedAt: new Date().toISOString(),
    });

    console.log('✅ User updated with invitation details:', userId);
  } catch (error) {
    console.error('❌ Error updating user with invitation:', error);
    throw new Error('Failed to update user with invitation details');
  }
};

// Complete user invitation process
export const inviteUser = async (
  employee: Employee,
  invitedBy: string
): Promise<{
  success: boolean;
  temporaryPassword?: string;
  error?: string;
}> => {
  try {
    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();
    
    // Send invitation email
    const emailResult = await sendUserInvitation(employee, temporaryPassword, invitedBy);
    
    if (!emailResult.success) {
      return { success: false, error: emailResult.error };
    }
    
    // Update user with invitation details
    await updateUserWithInvitation(employee.id, temporaryPassword, invitedBy);
    
    console.log('✅ User invitation completed successfully:', {
      userId: employee.id,
      email: employee.email,
    });
    
    return { 
      success: true, 
      temporaryPassword 
    };
  } catch (error) {
    console.error('❌ Error in user invitation process:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Verify temporary password (for login)
export const verifyTemporaryPassword = async (
  email: string,
  password: string
): Promise<{ valid: boolean; userId?: string; needsPasswordChange?: boolean }> => {
  try {
    // This would typically be handled by Firebase Auth, but for temporary passwords
    // we need to check against our stored temporary password
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { valid: false };
    }
    
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    // Check if temporary password matches and hasn't expired
    const now = new Date();
    const expiresAt = new Date(userData.passwordExpiresAt);
    
    if (userData.temporaryPassword === password && expiresAt > now) {
      return { 
        valid: true, 
        userId: userDoc.id,
        needsPasswordChange: userData.needsPasswordChange || false
      };
    }
    
    return { valid: false };
  } catch (error) {
    console.error('❌ Error verifying temporary password:', error);
    return { valid: false };
  }
};
