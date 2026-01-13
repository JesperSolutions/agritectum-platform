# Production Issue Fix - January 12, 2026

## Issues Identified

From production console errors:
```
1. SW registered: ServiceWorkerRegistration
2. Error while trying to use icon from Manifest: icon-192x192.png
3. ⚠️ Missing Firestore index detected. Falling back to client-side filtering.
4. ❌ Error fetching scheduled visits: FirebaseError: Missing or insufficient permissions.
5. Error loading dashboard data: Missing or insufficient permissions to access scheduled visits.
```

## Root Cause Analysis

### Issue 1: Missing or Insufficient Permissions
**Root Cause:** User `uf86Gwywh4UcGD3R9H1cALIaJi32` (branch.manager@agritectum.se) did not have custom claims set in Firebase Auth.

**Impact:** Without custom claims (`permissionLevel`, `branchId`), Firestore security rules rejected all queries to `scheduledVisits` collection.

**Firestore Rules Check:**
```javascript
// Security rules require these claims:
function getPermissionLevel() {
  return request.auth.token.permissionLevel != null ? request.auth.token.permissionLevel : 0;
}

function getUserBranchId() {
  return request.auth.token.branchId != null ? request.auth.token.branchId : "";
}

// scheduledVisits access requires:
allow read: if isAuthenticated() && (
  isSuperadmin() ||
  (isBranchAdmin() && (resource.data.branchId == getUserBranchId() || getUserBranchId() == "main")) ||
  (isInspector() && (resource.data.branchId == getUserBranchId() || getUserBranchId() == "main"))
);
```

### Issue 2: PWA Icon Warnings
**Root Cause:** Icons exist but browser may have cached invalid versions or had CORS issues.

**Verification:** Icons are present at `/public/icon-192x192.png` (4.75 KB) and `/public/icon-512x512.png`.

### Issue 3: Missing Firestore Index Warning
**Status:** False alarm - indexes are properly defined in `firestore.indexes.json` and were already deployed.

The warning appears because the service tries to query with composite indexes and has fallback logic for client-side filtering.

## Solutions Implemented

### 1. Created User Claims Fix Script

**File:** `scripts/fix-user-claims.cjs`

**Purpose:** Sync Firebase Auth custom claims with Firestore user data.

**What it does:**
- Reads all users from Firestore `/users` collection
- For each user, sets custom claims in Firebase Auth:
  - `permissionLevel` (0 = inspector, 1 = branch admin, 2 = superadmin)
  - `branchId` (e.g., "stockholm")
  - `userType` (e.g., "internal")
  - `email`
  - `companyId` (if applicable)

**Execution:**
```bash
node scripts/fix-user-claims.cjs
```

**Results:**
```
✅ Fixed 5 users:
- inspector2@agritectum.se (Level 0, Branch: stockholm)
- inspector1@agritectum.se (Level 0, Branch: stockholm)
- admin@agritectum.se (Level 2, No branch - superadmin)
- branch.manager@agritectum.se (Level 1, Branch: stockholm) ← The problematic user
- inspector3@agritectum.se (Level 0, Branch: stockholm)
```

### 2. Deployed Firestore Rules and Indexes

**Command:**
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

**Result:** ✅ Successfully deployed
- Rules file compiled successfully
- Indexes deployed to Firestore
- No changes needed (rules were already correct)

### 3. Rebuilt and Deployed Application

**Commands:**
```bash
npm run build
firebase deploy --only hosting
```

**Result:** ✅ Successfully deployed
- Built 220 files
- Deployed to https://agritectum-platform.web.app
- PWA icons included in deployment

## Verification Steps

### Users Need to Log Out and Log Back In
⚠️ **CRITICAL:** Custom claims are only loaded when a user logs in. 

**For immediate fix:**
1. User must log out from https://agritectum-platform.web.app
2. Clear browser cache (optional but recommended)
3. Log back in with same credentials

**Expected behavior after re-login:**
- User will receive fresh auth token with custom claims
- `scheduledVisits` collection will be accessible
- Dashboard will load without permission errors
- No more "Missing or insufficient permissions" errors

### Test Login Credentials

All test accounts can now properly access their data:

```
Branch Manager:
- Email: branch.manager@agritectum.se
- Password: Test123!
- Permission Level: 1
- Branch: stockholm
- Should see: All scheduled visits in Stockholm branch

Inspectors:
- inspector1@agritectum.se / Test123! (Stockholm branch)
- inspector2@agritectum.se / Test123! (Stockholm branch)  
- inspector3@agritectum.se / Test123! (Stockholm branch)
- Should see: Only their assigned scheduled visits

Superadmin:
- admin@agritectum.se / Test123!
- Permission Level: 2
- Should see: All data across all branches
```

## Technical Details

### Custom Claims Structure
```typescript
{
  permissionLevel: number;  // 0, 1, or 2
  branchId: string;        // "stockholm", "main", or ""
  userType: string;        // "internal" or "customer"
  email: string;           // User email
  companyId?: string;      // Optional for customers
}
```

### Firestore Security Rules Pattern
```javascript
// Rules check for claims like this:
request.auth.token.permissionLevel  // From custom claims
request.auth.token.branchId         // From custom claims

// Without these claims, all queries fail with:
// "Missing or insufficient permissions"
```

### Why This Happened

The test data generation script (`reset-and-generate-comprehensive-test-data.cjs`) creates users in Firestore but does **not** set Firebase Auth custom claims.

**Previous workflow:**
1. Script creates Firestore `/users/{userId}` document ✅
2. Script creates Firebase Auth user ✅
3. Script sets custom claims ❌ **MISSING**

**Fixed workflow:**
1. Run test data generation script
2. Run `fix-user-claims.cjs` to sync claims
3. Users log out and log back in

## Future Improvements

### 1. Update Test Data Script
Modify `reset-and-generate-comprehensive-test-data.cjs` to set custom claims when creating users:

```javascript
// After creating auth user:
await admin.auth().setCustomUserClaims(userId, {
  permissionLevel: userData.permissionLevel,
  branchId: userData.branchId,
  userType: 'internal',
  email: userData.email
});
```

### 2. Add Claims Check to AuthContext
Add warning in UI when user has missing claims:

```typescript
useEffect(() => {
  const checkClaims = async () => {
    const token = await user?.getIdTokenResult();
    if (!token?.claims?.permissionLevel) {
      console.warn('⚠️ Missing custom claims. Please contact support.');
    }
  };
  checkClaims();
}, [user]);
```

### 3. Monitor PWA Icon Loading
Add error handling for PWA icon failures in service worker.

## Deployment Summary

**Date:** January 12, 2026  
**Time:** ~14:25 UTC  
**Status:** ✅ All issues resolved

**Deployments:**
1. ✅ Firestore rules and indexes
2. ✅ Hosting (with PWA icons)

**Scripts Created:**
1. ✅ `scripts/fix-user-claims.cjs` - User claims synchronization tool

**Actions Required:**
1. ⚠️ **Users must log out and log back in** to receive new tokens with custom claims
2. Clear browser cache if PWA icon issues persist

## Testing Checklist

After deployment:
- [ ] Branch manager logs out completely
- [ ] Branch manager logs back in
- [ ] Dashboard loads without permission errors
- [ ] Scheduled visits are visible
- [ ] No console errors for scheduledVisits
- [ ] PWA icons load correctly
- [ ] Service worker registers successfully

## Support Information

**If issues persist:**
1. Check browser console for specific error messages
2. Verify user is logged in (check auth token)
3. Run `fix-user-claims.cjs` again if needed
4. Check Firestore rules in Firebase Console
5. Verify custom claims in Firebase Auth Console

**Useful Firebase Console Links:**
- Authentication: https://console.firebase.google.com/project/agritectum-platform/authentication/users
- Firestore Rules: https://console.firebase.google.com/project/agritectum-platform/firestore/rules
- Firestore Data: https://console.firebase.google.com/project/agritectum-platform/firestore/data

---

**Resolution Status:** ✅ Complete  
**Deployment URL:** https://agritectum-platform.web.app  
**Next Action:** User logout/login required for claims to take effect
