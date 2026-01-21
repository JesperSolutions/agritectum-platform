# Test Environment Setup

This guide explains how to set up and use the test Firebase project for safe development and testing before deploying to production.

## Overview

The Taklaget Service App uses two Firebase projects:

- **Production**: `taklaget-service-app` (used for live users)
- **Test**: `taklaget-service-app-test` (used for development and testing)

**All coding and development work must be done in the test environment.** Only move to production when explicitly requested.

## Firebase Test Project Setup

### 1. Create Test Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Name it: `taklaget-service-app-test`
4. Follow the setup wizard (disable Google Analytics if desired)
5. Wait for project creation to complete

### 2. Enable Required Services

Enable the same services as production:

- **Authentication**: Enable Email/Password provider
- **Firestore Database**: Create database in production mode (or start in test mode)
- **Storage**: Enable Cloud Storage
- **Cloud Functions**: Enable (if using functions)

### 3. Deploy Configuration to Test Project

```bash
# Deploy security rules and indexes
npm run deploy:rules:test

# Deploy Cloud Functions (if applicable)
firebase deploy --only functions --project taklaget-service-app-test
```

### 4. Get Test Project Configuration

1. In Firebase Console, go to Project Settings > Your apps
2. If no web app exists, click "Add app" > Web
3. Copy the Firebase configuration values
4. Create `.env.test` file from `.env.test.example`:

```bash
cp .env.test.example .env.test
```

5. Fill in the test project values in `.env.test`:

```env
VITE_FIREBASE_API_KEY_TEST=your_test_api_key
VITE_FIREBASE_AUTH_DOMAIN_TEST=taklaget-service-app-test.firebaseapp.com
VITE_FIREBASE_PROJECT_ID_TEST=taklaget-service-app-test
VITE_FIREBASE_STORAGE_BUCKET_TEST=taklaget-service-app-test.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID_TEST=your_test_sender_id
VITE_FIREBASE_APP_ID_TEST=your_test_app_id
```

### 5. Download Service Account Key

1. Go to Project Settings > Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Save it in project root as `taklaget-service-app-test-firebase-adminsdk-*.json`
5. **Important**: This file is already in `.gitignore` - never commit it!

## Using the Test Environment

### Development Mode

By default, development uses Firebase Emulators. To use the test Firebase project instead:

1. Set `VITE_USE_TEST_PROJECT=true` in `.env.test`
2. Or build with test mode: `npm run build -- --mode test`

### Deployment to Test

```bash
# Deploy everything to test project
npm run deploy:test

# Deploy only rules
npm run deploy:rules:test
```

### Switching Between Environments

The app automatically detects the environment:

- **Development** (`npm run dev`): Uses emulators by default, or test project if `VITE_USE_TEST_PROJECT=true`
- **Test Build** (`npm run build -- --mode test`): Uses test Firebase project
- **Production Build** (`npm run build`): Uses production Firebase project

## Branch Strategy

- **`main` branch**: Production-ready code, deploys to production Firebase project
- **`develop` branch**: Development work, deploys to test Firebase project
- **Feature branches**: Branch from `develop`, merge back to `develop` when ready

## Important Notes

⚠️ **Never commit secrets or service account keys**

⚠️ **Always test in test environment before production**

⚠️ **Only deploy to production when explicitly requested**

## Troubleshooting

### "Project not found" error

- Verify the test project exists in Firebase Console
- Check that `.env.test` has correct project ID
- Ensure you're authenticated: `firebase login`

### "Permission denied" errors

- Verify security rules are deployed: `npm run deploy:rules:test`
- Check that test project has same services enabled as production

### Wrong Firebase project being used

- Check `src/config/firebase.ts` environment detection logic
- Verify `.env.test` file exists and has correct values
- Check `VITE_USE_TEST_PROJECT` flag if using in development

## Next Steps

- See [DEVELOPMENT_WORKFLOW.md](../../DEVELOPMENT_WORKFLOW.md) for development guidelines
- See [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) for local setup
- See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for Firebase configuration details
