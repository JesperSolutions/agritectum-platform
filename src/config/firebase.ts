import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Firebase configuration from environment variables
// Supports: development (emulators), test (test Firebase project), production (prod Firebase project)
const getFirebaseConfig = () => {
  const mode = import.meta.env.MODE; // 'development', 'test', or 'production'
  
  // Production config (default for production builds) - Agritectum Platform
  const prodConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyB7t5LITs2cydGizXE5cJAlIY7Q3p9wR1k',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'agritectum-platform.firebaseapp.com',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'agritectum-platform',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'agritectum-platform.firebasestorage.app',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '831129873464',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:831129873464:web:eda440c687b5e883c84acd',
  };
  
  // Test environment config (uses test Firebase project)
  if (mode === 'test' || import.meta.env.VITE_USE_TEST_PROJECT === 'true') {
    // Test project defaults (from .env.test or hardcoded test project values)
    const testConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY_TEST || 'AIzaSyDONTxBtz3LRvDgoGJAEhTG_iK61GX30-0',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN_TEST || 'agritectum-platform-test.firebaseapp.com',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID_TEST || 'agritectum-platform-test',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET_TEST || 'agritectum-platform-test.firebasestorage.app',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID_TEST || '649108739976',
      appId: import.meta.env.VITE_FIREBASE_APP_ID_TEST || '1:649108739976:web:a5a1fd3b2f56fa364d4c3d',
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
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ];
  
  const missingVars = requiredVars.filter(
    varName => !import.meta.env[varName]
  );
  
  if (missingVars.length > 0) {
    console.error(
      '❌ Missing required Firebase environment variables:',
      missingVars.join(', ')
    );
    console.error(
      'Please set these in your production environment or .env file'
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
    console.log('🔥 Connecting to Firebase Emulators...');
    
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectStorageEmulator(storage, '127.0.0.1', 9199);
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    
    console.log('✅ Connected to Firebase Emulators');
    console.log('📊 Emulator UI: http://localhost:4000');
  } catch (error) {
    console.warn('⚠️ Could not connect to emulators. Make sure they are running!');
    console.warn('Run: npm run emulators');
  }
}

export default app;
