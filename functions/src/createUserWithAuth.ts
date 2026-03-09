import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

interface CreateUserRequest {
  email: string;
  password: string;
  displayName: string;
  role: 'inspector' | 'branchAdmin' | 'superadmin';
  branchId: string;
  isActive: boolean;
  invitedBy?: string;
}

interface Employee {
  uid: string;
  email: string;
  displayName: string;
  role: 'inspector' | 'branchAdmin' | 'superadmin';
  permissionLevel: number;
  branchId: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export const createUserWithAuth = onRequest({ region: 'europe-west1' }, async (req, res) => {
  // Set CORS headers - restrict to known origins
  const allowedOrigins = [
    'https://agritectum-platform.web.app',
    'https://agritectum-platform.firebaseapp.com',
  ];
  const origin = req.headers.origin || '';
  if (allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
    return;
  }

  try {
    // Verify the caller is authenticated and has admin privileges
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Missing or invalid Authorization header',
      });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    let callerClaims;
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      callerClaims = decodedToken;
    } catch (tokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired authentication token',
      });
      return;
    }

    // Only superadmins and branchAdmins can create users
    const callerRole = callerClaims.role;
    const callerPermissionLevel = callerClaims.permissionLevel || 0;
    if (callerRole !== 'superadmin' && callerRole !== 'branchAdmin' && callerPermissionLevel < 1) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions. Only admins can create users.',
      });
      return;
    }

    const { email, password, displayName, role, branchId, isActive, invitedBy }: CreateUserRequest =
      req.body;

    // Prevent privilege escalation: branchAdmins cannot create superadmins
    if (callerRole === 'branchAdmin' && role === 'superadmin') {
      res.status(403).json({
        success: false,
        error: 'Branch admins cannot create superadmin accounts',
      });
      return;
    }

    // Validate required fields
    if (!email || !password || !displayName || !role || !branchId) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: email, password, displayName, role, branchId',
      });
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long',
      });
      return;
    }

    // Set permission level based on role
    const permissionLevel = role === 'inspector' ? 0 : role === 'branchAdmin' ? 1 : 2;

    console.log('🔍 Creating Firebase Auth user:', { email, role, branchId });

    // Create Firebase Auth user
    const firebaseUser = await admin.auth().createUser({
      email,
      password,
      displayName,
      emailVerified: false,
    });

    console.log('✅ Firebase Auth user created:', firebaseUser.uid);

    // Set custom claims for role and permissions
    const customClaims = {
      role,
      permissionLevel,
      branchId,
      branchIds: [branchId], // For future multi-branch support
    };

    await admin.auth().setCustomUserClaims(firebaseUser.uid, customClaims);

    console.log('✅ Custom claims set for user:', firebaseUser.uid);

    // Create user document in Firestore
    const userData: Omit<Employee, 'id'> = {
      uid: firebaseUser.uid,
      email,
      displayName,
      role,
      permissionLevel,
      branchId,
      isActive,
      createdAt: new Date().toISOString(),
      // Don't include lastLogin if it's undefined
    };

    // Add invitation details if provided
    if (invitedBy) {
      (userData as any).invitedBy = invitedBy;
      (userData as any).invitedAt = new Date().toISOString();
    }

    const userRef = await admin.firestore().collection('users').add(userData);

    console.log('✅ Firestore user document created:', userRef.id);

    // Return success response
    res.status(200).json({
      success: true,
      userId: userRef.id,
      firebaseUid: firebaseUser.uid,
      message: 'User created successfully',
    });
  } catch (error: any) {
    console.error('❌ Error creating user:', error);

    // Handle specific Firebase Auth errors
    if (error.code === 'auth/email-already-exists') {
      res.status(400).json({
        success: false,
        error: 'An account with this email already exists',
      });
      return;
    }

    if (error.code === 'auth/invalid-email') {
      res.status(400).json({
        success: false,
        error: 'Invalid email address',
      });
      return;
    }

    if (error.code === 'auth/weak-password') {
      res.status(400).json({
        success: false,
        error: 'Password is too weak',
      });
      return;
    }

    // Generic error response
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create user',
    });
  }
});
