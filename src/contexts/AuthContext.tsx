import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  getIdTokenResult,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { User, UserRole, CustomClaims } from '../types';

interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  registerCustomer: (email: string, password: string, displayName: string, profile?: { phone?: string; address?: string; companyName?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const parseUserFromFirebase = async (firebaseUser: FirebaseUser): Promise<User> => {
    const tokenResult = await getIdTokenResult(firebaseUser);
    const claims = tokenResult.claims as CustomClaims;

    // Map role to permission level if not provided
    const getPermissionLevel = (role: string, permissionLevel?: number, userType?: string): number => {
      if (permissionLevel !== undefined) return permissionLevel;
      
      // Customer users have permission level -1
      if (userType === 'customer' || role === 'customer') {
        return -1;
      }

      switch (role) {
        case 'superadmin':
          return 2;
        case 'branchAdmin':
          return 1;
        case 'inspector':
          return 0;
        default:
          return 0;
      }
    };

    const userType = claims.userType || (claims.role === 'customer' ? 'customer' : 'internal');
    const permissionLevel = getPermissionLevel(claims.role || 'inspector', claims.permissionLevel, userType);

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      displayName: firebaseUser.displayName || '',
      role: (claims.role || (userType === 'customer' ? 'customer' : 'inspector')) as UserRole,
      permissionLevel: permissionLevel,
      branchId: claims.branchId,
      branchIds: claims.branchIds,
      userType: userType as 'internal' | 'customer',
      companyId: claims.companyId,
      createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
      lastLogin: firebaseUser.metadata.lastSignInTime || new Date().toISOString(),
    };
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      const { logger } = await import('../utils/logger');
      logger.error('Sign in error:', error);
      throw error;
    }
  };

  const registerCustomer = async (
    email: string,
    password: string,
    displayName: string,
    profile?: { phone?: string; address?: string; companyName?: string }
  ): Promise<void> => {
    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update display name
      if (displayName) {
        await firebaseUser.updateProfile({ displayName });
      }

      // Create user document in Firestore with customer profile
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('../config/firebase');
      
      const userDoc = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: displayName,
        role: 'customer' as UserRole,
        permissionLevel: -1,
        userType: 'customer' as const,
        customerProfile: profile || {},
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userDoc);

      // Call Cloud Function to set custom claims (if available)
      // This will be handled by the onCustomerUserCreate Cloud Function
      // For now, the user document is created and claims will be set by the function
    } catch (error: any) {
      const { logger } = await import('../utils/logger');
      logger.error('Customer registration error:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setFirebaseUser(null);
    } catch (error: any) {
      const { logger } = await import('../utils/logger');
      logger.error('Logout error:', error);
      throw error;
    }
  };

  const refreshToken = async (): Promise<void> => {
    if (firebaseUser) {
      await firebaseUser.getIdToken(true);
      const user = await parseUserFromFirebase(firebaseUser);
      setCurrentUser(user);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      setLoading(true);

      if (firebaseUser) {
        try {
          // Force refresh the token to get updated claims
          await firebaseUser.getIdToken(true);
          const user = await parseUserFromFirebase(firebaseUser);
          setCurrentUser(user);
          setFirebaseUser(firebaseUser);
        } catch (error: any) {
          const { logger } = await import('../utils/logger');
          logger.error('Error parsing user:', error);
          setCurrentUser(null);
          setFirebaseUser(null);
        }
      } else {
        setCurrentUser(null);
        setFirebaseUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    currentUser,
    firebaseUser,
    loading,
    signIn,
    registerCustomer,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
