# Creating the Test Firebase Project

This guide walks you through creating the `taklaget-service-app-test` Firebase project.

## Prerequisites

- Firebase CLI installed: `npm install -g firebase-tools`
- Authenticated with Firebase: `firebase login`
- Access to Firebase Console

## Step 1: Create Project via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter project name: `taklaget-service-app-test`
4. Follow the setup wizard:
   - Disable Google Analytics (optional, for test project)
   - Click "Create project"
   - Wait for project creation (1-2 minutes)

## Step 2: Enable Required Services

### Authentication

1. In Firebase Console, go to **Authentication** > **Get started**
2. Enable **Email/Password** sign-in method
3. Click "Save"

### Firestore Database

1. Go to **Firestore Database** > **Create database**
2. Start in **production mode** (or test mode, but production mode matches prod setup)
3. Choose location: `europe-west1` (or same as production)
4. Click "Enable"

### Cloud Storage

1. Go to **Storage** > **Get started**
2. Start in **production mode**
3. Choose location: `europe-west1` (or same as production)
4. Click "Done"

### Cloud Functions (if using)

1. Go to **Functions** > **Get started**
2. Enable billing if prompted (required for Cloud Functions)
3. Functions will be deployed later via CLI

## Step 3: Install Trigger Email Extension

1. Go to **Extensions** in Firebase Console
2. Click "Browse the Extensions Hub"
3. Search for "Trigger Email"
4. Click "Install"
5. Configure:
   - Collection path: `mail`
   - SMTP connection URI: (use your MailerSend SMTP settings)
   - From email: `noreply@taklaget.app`
   - Reply-to email: (your support email)
6. Click "Install extension"

## Step 4: Set Up Firebase CLI

1. Initialize Firebase in your project (if not already done):
   ```bash
   firebase init
   ```
   - Select: Firestore, Functions, Storage, Hosting
   - Use existing project: `taklaget-service-app-test`
   - Follow prompts for configuration

2. Or link existing project:
   ```bash
   firebase use --add
   ```
   - Select `taklaget-service-app-test`
   - Set as alias: `test` (optional)

## Step 5: Deploy Configuration

```bash
# Deploy security rules and indexes
npm run deploy:rules:test

# Deploy Cloud Functions (if applicable)
firebase deploy --only functions --project taklaget-service-app-test
```

## Step 6: Get Configuration Values

1. In Firebase Console, go to **Project Settings** > **Your apps**
2. If no web app exists, click "Add app" > Web icon
3. Register app (name it "Taklaget Test Web App")
4. Copy the Firebase configuration object
5. Create `.env.test` from `.env.test.example`:
   ```bash
   cp .env.test.example .env.test
   ```
6. Fill in the values from Firebase Console

## Step 7: Download Service Account Key

1. Go to **Project Settings** > **Service Accounts**
2. Click "Generate new private key"
3. Confirm download
4. Save the JSON file in project root
5. Rename it to match pattern: `taklaget-service-app-test-firebase-adminsdk-*.json`
6. **Important**: This file is in `.gitignore` - never commit it!

## Step 8: Verify Setup

```bash
# Check Firebase projects
firebase projects:list

# Verify test project is accessible
firebase use taklaget-service-app-test

# Test deployment
npm run deploy:rules:test
```

## Step 9: Seed Test Data (Optional)

You may want to create a test super admin account:

```bash
# Use the seed script with test project
# (Update script to use test project service account)
node scripts/operations/seed-smaland-branch.cjs
```

## Troubleshooting

### "Project not found"
- Verify project exists in Firebase Console
- Check you're logged in: `firebase login`
- Verify project ID is correct

### "Permission denied"
- Ensure you have Owner/Editor role on the test project
- Check Firebase CLI authentication: `firebase login:list`

### "Billing required"
- Cloud Functions require billing account
- Either enable billing or skip Functions deployment for now

## Next Steps

- See [TEST_ENVIRONMENT.md](../../docs/01-getting-started/TEST_ENVIRONMENT.md) for usage
- See [DEVELOPMENT_WORKFLOW.md](../../DEVELOPMENT_WORKFLOW.md) for workflow guidelines

