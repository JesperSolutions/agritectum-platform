# Deployment Guide

## Firebase Hosting Deployment

### Overview

This guide documents the process for deploying the Agritectum Platform to Firebase Hosting. **IMPORTANT:** Always clear the build cache before deploying to ensure browsers receive the latest version without needing manual cache clearing.

---

## Pre-Deployment Checklist

1. **Verify Changes**: Ensure all code changes are committed to the appropriate branch
2. **Test Locally**: Run `npm run dev` and test changes locally before deploying
3. **Update Version**: Consider updating the version in `package.json` if this is a release
4. **Review Environment**: Confirm the correct Firebase project is configured in `.firebaserc`

---

## Deployment Process

### Step 1: Clear Build Cache ⚠️ **CRITICAL**

Before building, **always** clear the previous build cache to ensure a completely fresh build:

```powershell
# Windows PowerShell
Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "node_modules/.vite" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "Build cache cleared successfully"
```

Or for Mac/Linux:

```bash
rm -rf dist
rm -rf node_modules/.vite
echo "Build cache cleared successfully"
```

**Why this is important:**

- Vite caches build artifacts which can prevent browsers from receiving updates
- Without clearing the cache, users may see stale content even after fresh deployments
- This eliminates the need for users to manually clear their browser cache

### Step 2: Build the Project

```powershell
npm run build
```

The build process will:

- Transform all modules (typically 2805+ modules)
- Output production-ready files to the `dist/` directory
- Generate hashed filenames for cache busting
- Report any warnings (some expected warnings about dynamic imports are normal)

**Important:** Before building, stamp the service worker with a build version to force cache invalidation.
Add a one-liner replacement step (PowerShell):

```powershell
# Stamp service worker with build version (replace BUILD_VERSION_REPLACE_ME)
(Get-Content public/sw.js) -replace 'BUILD_VERSION_REPLACE_ME', "v$(Get-Content package.json | ConvertFrom-Json).version-$(Get-Date -Format yyyyMMddHHmm)" | Set-Content public/sw.js
```

Expected output confirms successful build:

```
✓ built in X.XXs
```

### Step 3: Deploy to Firebase

```powershell
firebase deploy --only hosting
# Deploy composite indexes if you've added/changed them:
firebase deploy --only firestore:indexes
```

Firebase will:

- Upload all files from the `dist/` directory
- Finalize the version
- Release the new version to live hosting

**Expected output:**

```
+  Deploy complete!

Project Console: https://console.firebase.google.com/project/agritectum-app/overview
Hosting URL: https://agritectum-app.web.app
```

---

## Full Deployment Script (One Command)

To execute the complete deployment process in one command:

```powershell
# Windows PowerShell
Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue; Remove-Item -Path "node_modules/.vite" -Recurse -Force -ErrorAction SilentlyContinue; npm run build; firebase deploy --only hosting
```

Or for Mac/Linux:

```bash
rm -rf dist && rm -rf node_modules/.vite && npm run build && firebase deploy --only hosting
```

---

## Verifying the Deployment

### 1. Check Firebase Console

- Visit: https://console.firebase.google.com/project/agritectum-app/overview
- Navigate to **Hosting** tab to see deployment history and status

### 2. Test the Live App

- Open: https://agritectum-app.web.app
- Hard refresh the page (Ctrl+Shift+R on Windows/Linux, Cmd+Shift+R on Mac)
- Verify new changes are visible

### 3. Confirm Cache Busting

- Open browser DevTools (F12)
- Navigate to **Network** tab
- Reload the page and verify that JavaScript chunks have new hashes
- Look for files like `index-<hash>.js` to confirm new content is served

---

## Troubleshooting

### Issue: Seeing Old Content After Deployment

**Solution:**

1. Check Firebase Hosting console to confirm deployment completed successfully
2. Hard refresh your browser (Ctrl+Shift+R / Cmd+Shift+R)
3. Clear browser cache completely:
   - **Chrome**: Settings > Privacy > Clear browsing data > Check "Cached images and files"
   - **Firefox**: Preferences > Privacy & Security > Clear Data
   - **Safari**: Develop menu > Empty Web Caches

### Issue: Firebase Authentication Error

**Possible causes:**

- Not logged into Firebase CLI: Run `firebase login`
- Wrong project selected: Verify `.firebaserc` has `"default": "agritectum-app"`
- Missing permissions: Ensure your account has access to the Firebase project

**Solution:**

```powershell
firebase login
firebase use agritectum-app
firebase deploy --only hosting
```

### Issue: Build Fails

**Common causes:**

- TypeScript/ESLint errors: Review error messages in build output
- Missing dependencies: Run `npm install` to ensure all packages are installed
- Node version mismatch: Verify Node.js version (use `node --version`)

**Solution:**

```powershell
npm install
npm run build
```

### Issue: "Unable to find a valid endpoint for function generateReportPDF"

**Status:** This is a non-critical warning and can be safely ignored

- The warning appears because the PDF generation function is not deployed as a Cloud Function
- The hosting deployment completes successfully despite this warning

---

## Environment Configuration

The app uses environment variables from `.env` file:

```properties
VITE_FIREBASE_API_KEY=<your-api-key>
VITE_FIREBASE_AUTH_DOMAIN=agritectum-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=agritectum-app
VITE_FIREBASE_STORAGE_BUCKET=agritectum-app.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
VITE_FIREBASE_APP_ID=<your-app-id>
```

**Important:**

- Ensure `.env` is **NOT** committed to version control (should be in `.gitignore`)
- Update `.env` on deployment machine before building if credentials change
- These are frontend credentials and are meant to be public

---

## Deployment Frequency

- **Development**: Deploy after each feature completion or bug fix
- **Staging**: Deploy before releasing to production
- **Production**: Deploy only after testing and approval

---

## Related Documentation

- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)
- [Vite Build Guide](https://vitejs.dev/guide/build.html)
- [Agritectum Platform README](./README.md)

---

## Key Takeaways

✅ **Always clear the build cache before deploying**
✅ **Use hashed filenames for automatic cache busting**
✅ **Hard refresh your browser after deployment to verify changes**
✅ **Check Firebase console for deployment history**
✅ **Users should NOT need to manually clear cache if this process is followed**
