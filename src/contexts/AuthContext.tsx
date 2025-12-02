import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
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
    const getPermissionLevel = (role: string, permissionLevel?: number): number => {
      if (permissionLevel !== undefined) return permissionLevel;

      switch (role) {
        case 'superadmin':
          return 2;
        case 'branchAdmin':
          return 1;
        case 'inspector':
          return 0;
        case 'customer':
          return -1;
        default:
          return 0;
      }
    };

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      displayName: firebaseUser.displayName || '',
      role: claims.role || 'inspector',
      permissionLevel: getPermissionLevel(claims.role || 'inspector', claims.permissionLevel),
      branchId: claims.branchId,
      branchIds: claims.branchIds,
      customerId: claims.customerId,
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
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
