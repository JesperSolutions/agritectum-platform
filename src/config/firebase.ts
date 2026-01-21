import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { logger } from '../utils/logger';

// Firebase configuration from environment variables
// Supports: development (emulators), test (test Firebase project), production (prod Firebase project)
const getFirebaseConfig = () => {
  const mode = import.meta.env.MODE; // 'development', 'test', or 'production'

  // Production config (default for production builds) - Agritectum Platform
  // Require VITE_FIREBASE_* variables in production builds. Do not fall back to hardcoded prod credentials here.
  const prodConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  };

  // Test environment config (uses test Firebase project)
  if (mode === 'test' || import.meta.env.VITE_USE_TEST_PROJECT === 'true') {
    // Test project defaults (from .env.test or hardcoded test project values)
    const testConfig = {
      apiKey:
        import.meta.env.VITE_FIREBASE_API_KEY_TEST || 'AIzaSyDONTxBtz3LRvDgoGJAEhTG_iK61GX30-0',
      authDomain:
        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN_TEST ||
        'agritectum-platform-test.firebaseapp.com',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID_TEST || 'agritectum-platform-test',
      storageBucket:
        import.meta.env.VITE_FIREBASE_STORAGE_BUCKET_TEST ||
        'agritectum-platform-test.firebasestorage.app',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID_TEST || '649108739976',
      appId:
        import.meta.env.VITE_FIREBASE_APP_ID_TEST || '1:649108739976:web:a5a1fd3b2f56fa364d4c3d',
    };
    return testConfig;
  }

  // Development/Production uses production config (or emulators in dev)
  return prodConfig;
};

const firebaseConfig = getFirebaseConfig();

// Validate required config based on environment
const mode = import.meta.env.MODE;
if (mode === 'production') {
  // In production we expect the VITE_FIREBASE_* environment variables to be set by the deploy process.
  const missing: string[] = [];
  if (!import.meta.env.VITE_FIREBASE_API_KEY) missing.push('VITE_FIREBASE_API_KEY');
  if (!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) missing.push('VITE_FIREBASE_AUTH_DOMAIN');
  if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) missing.push('VITE_FIREBASE_PROJECT_ID');

  if (missing.length > 0) {
    console.error(
      `⚠️ Firebase config: Missing environment variables for production: ${missing.join(', ')}.`
    );
    console.error(
      'Set the VITE_FIREBASE_* variables in your Firebase Hosting or CI environment before building.'
    );
  }
} else if (mode === 'test') {
  // In test mode, warn if test-specific vars are missing
  if (!import.meta.env.VITE_FIREBASE_PROJECT_ID_TEST) {
    console.warn(
      '⚠️ Test environment: Using default test project ID. Set VITE_FIREBASE_PROJECT_ID_TEST for custom test project.'
    );
  }
} else if (import.meta.env.DEV) {
  // In development, warn if using fallback values
  if (!import.meta.env.VITE_FIREBASE_API_KEY) {
    console.warn(
      '⚠️ Firebase config: Using fallback hardcoded values. Consider setting VITE_FIREBASE_* env vars.'
    );
  }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'europe-west1');

// Connect to emulators in development
if (import.meta.env.DEV) {
  try {
    logger.log('🔥 Connecting to Firebase Emulators...');

    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectStorageEmulator(storage, '127.0.0.1', 9199);
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);

    logger.log('✅ Connected to Firebase Emulators');
    logger.log('📊 Emulator UI: http://localhost:4000');
  } catch (error) {
    console.warn('⚠️ Could not connect to emulators. Make sure they are running!');
    console.warn('Run: npm run emulators');
  }
}

export default app;
