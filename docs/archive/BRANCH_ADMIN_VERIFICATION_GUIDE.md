# Branch Admin Verification Guide

**Purpose:** Verify that all branch admins have correct departments, permissions, and are functioning properly.

**Last Updated:** January 2025  
**Version:** 1.0.0

---

## Overview

This guide helps you verify that all branch administrators in the Taklaget system have:

- ✅ Correct branch/department assignments
- ✅ Proper custom claims in Firebase Auth
- ✅ Valid permissions and roles
- ✅ Complete user information
- ✅ Functioning access to their data

---

## Prerequisites

Before running verification, ensure you have:

- Firebase service account key (for automated verification)
- Access to Firebase Console
- Admin permissions
- List of expected branch admins

---

## Automated Verification

### Option 1: Using Verification Script

If you have the Firebase service account key:

```bash
node scripts/verify-branch-admins.cjs
```

This script will:

1. Fetch all branches from Firestore
2. Fetch all users from Firestore
3. Fetch all Firebase Auth users
4. Analyze each branch admin's configuration
5. Check for issues and warnings
6. Generate a detailed report

**Output:** `branch-admin-verification-report.json`

### Option 2: Using Firebase Console

Manual verification through Firebase Console:

1. **Go to Firebase Console**
   - Navigate to: https://console.firebase.google.com
   - Select your project: `taklaget-service-app`

2. **Check Branches**
   - Go to Firestore Database
   - Navigate to `branches` collection
   - Verify all branches exist and are active

3. **Check Users**
   - Go to Firestore Database
   - Navigate to `users` collection
   - Filter by `role: "branchAdmin"`
   - Verify each admin has a `branchId`

4. **Check Firebase Auth**
   - Go to Authentication > Users
   - Search for branch admin emails
   - Click on each user
   - Check "Custom Claims" section

---

## Manual Verification Checklist

### Step 1: Verify Branches Exist

**Expected Branches:**

- [ ] Taklaget Småland (ID: `jYPEEhrb7iNGqumvV80L`)
- [ ] Taklaget Binne (ID: To be confirmed)
- [ ] Other branches as configured

**For each branch, verify:**

- [ ] Branch exists in Firestore
- [ ] Branch is marked as active (`isActive: true`)
- [ ] Branch has correct contact information
- [ ] Branch has email configured

### Step 2: Verify Branch Admins

**Expected Branch Admins:**

1. **Linus Hollberg**
   - Email: `linus.hollberg@taklagetentreprenad.se`
   - Branch: Taklaget Småland
   - Branch ID: `jYPEEhrb7iNGqumvV80L`
   - Role: `branchAdmin`
   - Permission Level: `1`

2. **Bengt Widstrand**
   - Email: `Bengt.widstrand@binne.se`
   - Branch: Taklaget Binne
   - Branch ID: To be confirmed
   - Role: `branchAdmin`
   - Permission Level: `1`

3. **Magnus Eriksson**
   - Email: `Magnus.eriksson@binne.se`
   - Branch: Taklaget Småland
   - Branch ID: `jYPEEhrb7iNGqumvV80L`
   - Role: `branchAdmin`
   - Permission Level: `1`

**For each branch admin, verify:**

#### Firestore User Document

- [ ] User document exists in `users` collection
- [ ] `email` field matches expected email
- [ ] `role` field is set to `"branchAdmin"`
- [ ] `permissionLevel` field is set to `1`
- [ ] `branchId` field is set to correct branch ID
- [ ] `displayName` field is populated

#### Firebase Auth Custom Claims

- [ ] User exists in Firebase Auth
- [ ] Custom claims are set
- [ ] `role` claim is `"branchAdmin"`
- [ ] `permissionLevel` claim is `1`
- [ ] `branchId` claim matches Firestore

#### Access Verification

- [ ] Admin can log in successfully
- [ ] Admin sees only their branch data
- [ ] Admin can manage users in their branch
- [ ] Admin can view reports for their branch
- [ ] Admin can create/edit reports

### Step 3: Check for Issues

**Common Issues to Look For:**

#### Critical Issues

- [ ] User exists in Firestore but not in Firebase Auth
- [ ] User exists in Firebase Auth but not in Firestore
- [ ] Branch ID is set to a non-existent branch
- [ ] Branch ID is missing
- [ ] Custom claims are not set in Firebase Auth
- [ ] Role mismatch between Auth and Firestore

#### Warnings

- [ ] Branch has no assigned branch admin
- [ ] Multiple admins for same branch (verify this is intentional)
- [ ] Admin has wrong permission level
- [ ] Admin email doesn't match company domain

---

## Verification Scripts

### Script 1: Verify Branch Admins

**Location:** `scripts/verify-branch-admins.cjs`

**Usage:**

```bash
node scripts/verify-branch-admins.cjs
```

**What it does:**

- Fetches all branches from Firestore
- Fetches all users from Firestore
- Fetches all Firebase Auth users
- Analyzes each branch admin
- Checks for issues and warnings
- Generates detailed report

**Output:**

- Console output with verification results
- JSON report file: `branch-admin-verification-report.json`

### Script 2: Set Branch Admin Claims

**Location:** `scripts/setup/set-branch-admin-claims.cjs`

**Usage:**

```bash
node scripts/setup/set-branch-admin-claims.cjs
```

**What it does:**

- Sets custom claims for branch admin users
- Updates Firestore user documents
- Requires service account key

### Script 3: Fix Branch Admin Claims

**Location:** `scripts/setup/fix-branch-admin-claims.cjs`

**Usage:**

```bash
node scripts/setup/fix-branch-admin-claims.cjs
```

**What it does:**

- Fixes missing custom claims
- Updates user configurations
- Works with emulator data

---

## Troubleshooting

### Issue: User Cannot Access Branch Data

**Possible Causes:**

1. Branch ID not set in custom claims
2. Branch ID doesn't exist
3. Custom claims not set in Firebase Auth
4. User needs to log out and back in

**Solution:**

1. Run verification script to identify issue
2. Use `set-branch-admin-claims.cjs` to fix claims
3. Ask user to log out and log back in
4. Verify access is working

### Issue: User Sees All Branches

**Possible Causes:**

1. User has `superadmin` role instead of `branchAdmin`
2. Permission level is set to 2 instead of 1
3. Custom claims not properly set

**Solution:**

1. Check user's role in Firebase Auth
2. Verify permission level is 1
3. Update custom claims if needed

### Issue: Branch Admin Cannot Manage Users

**Possible Causes:**

1. Permission level too low
2. User role is `inspector` instead of `branchAdmin`
3. Frontend permission check failing

**Solution:**

1. Verify permission level is 1
2. Check user role is `branchAdmin`
3. Clear browser cache and cookies
4. Verify Firestore rules allow the operation

---

## Expected Configuration

### Branch Admin User Structure

**Firestore (`users` collection):**

```json
{
  "uid": "user-uid-here",
  "email": "admin@company.com",
  "displayName": "Admin Name",
  "role": "branchAdmin",
  "permissionLevel": 1,
  "branchId": "branch-id-here",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "lastLogin": "2025-01-15T10:30:00.000Z"
}
```

**Firebase Auth (Custom Claims):**

```json
{
  "role": "branchAdmin",
  "permissionLevel": 1,
  "branchId": "branch-id-here"
}
```

### Branch Structure

**Firestore (`branches` collection):**

```json
{
  "id": "branch-id-here",
  "name": "Branch Name",
  "address": "Branch Address",
  "phone": "+46 123 456 789",
  "email": "branch@company.com",
  "isActive": true,
  "country": "Sweden",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

---

## Verification Report

After running the verification script, you'll receive a report with:

### Summary

- Total branches
- Total users
- Branch admins count
- Super admins count
- Inspectors count

### Issues

- Critical issues requiring immediate action
- User-specific issues
- Branch-specific issues

### Warnings

- Non-critical issues
- Recommendations
- Best practices

### Detailed Data

- Complete list of all branch admins
- Their configurations
- Branch assignments
- Status of each admin

---

## Regular Maintenance

### Weekly

- [ ] Run verification script
- [ ] Check for new issues
- [ ] Review warnings
- [ ] Fix critical issues

### Monthly

- [ ] Full branch admin audit
- [ ] Review permission levels
- [ ] Update branch information
- [ ] Archive inactive admins

### Quarterly

- [ ] Complete system audit
- [ ] Review all custom claims
- [ ] Update documentation
- [ ] Security review

---

## Security Considerations

### Access Control

- Branch admins should only access their branch data
- Permission level 1 = branch admin (branch-specific access)
- Permission level 2 = super admin (all branches)

### Data Isolation

- Verify Firestore rules enforce branch isolation
- Test that admins cannot access other branches
- Monitor for unauthorized access attempts

### Audit Trail

- All permission changes should be logged
- Track who made changes and when
- Maintain audit log for compliance

---

## Quick Reference

### Firebase Console Links

**Firestore Database:**

```
https://console.firebase.google.com/project/taklaget-service-app/firestore
```

**Authentication:**

```
https://console.firebase.google.com/project/taklaget-service-app/authentication
```

**Functions:**

```
https://console.firebase.google.com/project/taklaget-service-app/functions
```

### Common Commands

**Run verification:**

```bash
node scripts/verify-branch-admins.cjs
```

**Set custom claims:**

```bash
node scripts/setup/set-branch-admin-claims.cjs
```

**Fix claims:**

```bash
node scripts/setup/fix-branch-admin-claims.cjs
```

**Check branches:**

```bash
node scripts/setup/check-existing-branches.cjs
```

---

## Support

**Questions?**

- Review this guide
- Check `docs/04-administration/PERMISSION_SYSTEM.md`
- Review `docs/CUSTOM_CLAIMS_EXPLAINED.md`
- Contact development team

---

_Last updated: January 2025_  
_Version: 1.0.0_
