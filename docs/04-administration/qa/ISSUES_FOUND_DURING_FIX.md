# Issues Found During Fix

This document tracks issues discovered while implementing fixes for the branch admin QA report.

## Date: 2025-01-03

### Issue #1: Missing Custom Claims for Branch Admins
**Severity**: CRITICAL  
**Status**: FIXING  
**Description**: Branch admin users (Linus, Bengt, Magnus) cannot access any data because they lack `branchId` and `permissionLevel` in their Firebase Auth custom claims.

**Root Cause**:
- `linus.hollberg@taklagetentreprenad.se` - Has NO `customAttributes` field in `users.json`
- `bengt.widstrand@binne.se` and `magnus.eriksson@binne.se` - Don't exist in `users.json` at all

**Impact**: All Firestore rules check for these claims and deny access when they're missing. This blocks:
- Reports loading
- Users loading
- Customers loading
- Branches loading
- Appointments loading
- All other data access

**Solution**: Create script to add missing users with proper custom claims.

---

---

### Issue #2: Service Account Key Required for Production
**Severity**: HIGH  
**Status**: WAITING FOR USER ACTION  
**Description**: Cannot set custom claims in production Firebase without service account key.

**Root Cause**: 
- We're using production Firebase, not the emulator
- `users.json` only works with the emulator
- Custom claims must be set using Firebase Admin SDK with service account key

**Solution**: 
1. Download service account key from Firebase Console
2. Run `node scripts/set-branch-admin-claims.cjs`
3. Test with branch admin accounts

**Files Created**:
- `scripts/set-branch-admin-claims.cjs` - Script to set custom claims
- `functions/src/setUserClaims.ts` - Cloud Function for future use
- `docs/CUSTOM_CLAIMS_EXPLAINED.md` - Complete explanation
- `URGENT_ACTION_REQUIRED.md` - Quick start guide

---

### Additional Issues
_New issues will be documented here as they are discovered during the fix process._

