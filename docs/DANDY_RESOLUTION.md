# DANDY Business Park Report Access Resolution - Complete

## Issue Summary

Customer `kontakt@dandybusinesspark.dk` (DANDY Business Park) was unable to view their reports with "Missing or insufficient permissions" error.

## Root Causes Identified & Fixed

### 1. ✅ Duplicate Customer Accounts

**Problem:** Two customer records existed for DANDY Business Park

- Original account (created incorrectly): `qFv5i3h5...`
- Correct account: `1nsxKOqbucZbGHA1Zd9l`
  **Fix:** Removed duplicate; consolidated all data to correct account

### 2. ✅ Incorrect User Permission Level

**Problem:** User had `permissionLevel: 0` (inspector) instead of `-1` (customer)
**Fix:** Updated custom claims to set `permissionLevel: -1`

### 3. ✅ Missing Custom Claims

**Problem:** User lacked required custom claims in Firebase Auth token
**Fix:** Added via script:

- `permissionLevel: -1`
- `companyId: 1nsxKOqbucZbGHA1Zd9l`
- `userType: customer`
- `role: customer`

### 4. ✅ Building Not Linked to Customer

**Problem:** Building `KKeljcn2HXpCLAHmKGZL` was linked to user ID instead of customer ID
**Fix:** Updated building's `customerId` to `1nsxKOqbucZbGHA1Zd9l`

### 5. ✅ Reports Missing Company ID

**Problem:** 28 reports lacked the `companyId` field required by security rules
**Fix:** Validation script added `companyId: 1nsxKOqbucZbGHA1Zd9l` to all reports

### 6. ✅ Report Query Logic

**Problem:** Query wasn't filtering by `companyId` for customer access
**Fix:** Updated `getReportsByBuildingId()` in reportService.ts to include companyId filter when customer role detected

### 7. ✅ Firestore Security Rules

**Problem:** Rules didn't account for customers querying their own reports
**Fix:** Added customer-specific read rules:

```typescript
allow read: if isAuthenticated() && isCustomer() && (
  resource.data.customerId == request.auth.uid ||
  resource.data.customerId == getUserCompanyId() ||
  resource.data.companyId == getUserCompanyId()
);
```

## Current Status: All Components Verified ✅

### Customer Authentication

```
UID:               FVG569gVmHOnwGbwpjqMwrpixvF2
Email:             kontakt@dandybusinesspark.dk
Custom Claims:
  - role:           customer
  - permissionLevel: -1
  - userType:       customer
  - companyId:      1nsxKOqbucZbGHA1Zd9l
```

### Report Data

```
Report ID:         Mq6siZJiWOJDMVQHQwdp
customerId:        1nsxKOqbucZbGHA1Zd9l ✅
companyId:         1nsxKOqbucZbGHA1Zd9l ✅
buildingId:        KKeljcn2HXpCLAHmKGZL ✅
```

### Building Data

```
Building ID:       KKeljcn2HXpCLAHmKGZL
customerId:        1nsxKOqbucZbGHA1Zd9l ✅
```

### Customer Data

```
Customer ID:       1nsxKOqbucZbGHA1Zd9l
Email:             kontakt@dandybusinesspark.dk ✅
```

## Deployment Status: ✅ Complete

- Code rebuilt and deployed to Firebase Hosting
- Firestore rules deployed
- All data validated and corrected

## Testing Instructions

Customer can now:

1. Log in with `kontakt@dandybusinesspark.dk`
2. Navigate to the portal
3. View the building "DANDY Business Park"
4. Access all 28 reports for that building

## Prevention Measures for Future

1. **Data Validation Script:** `scripts/validate-and-fix-data.cjs` runs automatically to detect issues
2. **Security Rules:** Now enforce customer-specific access patterns
3. **Code Logging:** Comprehensive logging in `reportService.ts` for debugging

## Scripts Created

- `scripts/check-report-details.cjs` - Inspect individual report documents
- `scripts/check-customer-claims.cjs` - Verify customer authentication claims
- `scripts/check-user-buildings.cjs` - Comprehensive user/building/report audit
- `scripts/validate-and-fix-data.cjs` - Automatic data integrity fixes

---

**Resolved:** January 20, 2026
**Time to Resolution:** ~2 hours (7 root causes, comprehensive data validation)
