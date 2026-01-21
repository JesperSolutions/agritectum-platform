# Data Integrity & Security Rules Documentation

**Last Updated:** January 20, 2026

## Overview

This document explains how the system prevents data integrity issues that could cause Firestore security rule violations.

## Critical Fields & Requirements

### 1. Users (Authentication & Authorization)

**Required Fields for Customers:**

- `permissionLevel: -1` (identifies as customer in security rules)
- `companyId: string` (links to customer/company document)
- `userType: "customer"` (distinguishes from internal users)
- `role: "customer"` (role field)

**Custom Claims (Firebase Auth):**
All customer users MUST have custom claims set:

```json
{
  "role": "customer",
  "permissionLevel": -1,
  "userType": "customer",
  "companyId": "<customer_id>"
}
```

**Why It Matters:**

- Security rules filter access using `permissionLevel` and `companyId`
- Without proper custom claims, queries fail with "Missing or insufficient permissions"
- Auth token includes custom claims, must match Firestore document

### 2. Reports (Access Control)

**Required Fields:**

- `buildingId: string` (links to building document)
- `customerId: string` (links to customer document)
- `companyId: string` (CRITICAL for customer access)
- `branchId: string` (branch association)
- `createdBy: string` (creator's UID)

**Security Rule Logic:**
Customers can only read reports where:

```
(
  resource.data.customerId == user.uid ||
  resource.data.customerId == user.companyId ||
  resource.data.companyId == user.companyId
)
```

**Why `companyId` is Critical:**

- Firestore can't evaluate permissions without knowing which customer owns the document
- Queries that only filter by `buildingId` fail because rules can't determine if user should access
- Must include `companyId` in both the document AND the query clause

### 3. Buildings (Customer Association)

**Required Fields:**

- `customerId: string` (MUST be the customer document ID, not user UID)
- `address: string` (full address)
- `branchId: string` (branch association)
- `createdBy: string` (creator's UID)

**Customer Association:**

- `customerId` must reference a document in the `customers` collection
- Do NOT use user UIDs as `customerId`
- One building can belong to one customer

## Automatic Data Enforcement

### When Creating Reports

The `createReport()` function automatically:

1. ✅ Gets the customer ID from the building
2. ✅ Retrieves the customer's company ID (if exists)
3. ✅ Sets `companyId` on the report before saving
4. ✅ Links report to building via `buildingId`

**Code Location:** [src/services/reportService.ts](../src/services/reportService.ts#L400-L426)

### When Creating Buildings

The `createBuilding()` function requires:

1. ✅ Valid `customerId` in the building data
2. ✅ Customer must exist in database
3. ✅ Address is geocoded for location features

**Code Location:** [src/services/buildingService.ts](../src/services/buildingService.ts#L308)

### When Creating Users

The signup flow ensures:

1. ✅ Customer users get `permissionLevel: -1`
2. ✅ Custom claims are set immediately after signup
3. ✅ `companyId` is set from invitation or signup data

## Validation & Repair Script

**Run periodic validation:**

```bash
node scripts/validate-and-fix-data.cjs
```

**What It Checks:**

- ✅ All customer users have `permissionLevel: -1`
- ✅ All customer users have `companyId` set
- ✅ All customer users have custom claims in Firebase Auth
- ✅ All reports have `companyId` field
- ✅ All buildings have valid `customerId` references

**What It Fixes:**

- 🔧 Sets missing `permissionLevel` to -1 for customers
- 🔧 Copies `companyId` to auth custom claims
- 🔧 Adds missing `companyId` to reports (sets to `customerId`)
- 🔧 Reports buildings with invalid customer references

## Key Rules Enforcement

### Rule 1: Customer Read Access

```
allow read: if isAuthenticated() && isCustomer() && (
  resource.data.customerId == request.auth.uid ||
  resource.data.customerId == getUserCompanyId() ||
  resource.data.companyId == getUserCompanyId()
);
```

**Enforcement:**

- Customers can only see reports/buildings for their own customer document
- Company-based customers can see all resources linked to their company

### Rule 2: Query Construction

```typescript
// WRONG - Will fail with "permission-denied"
query(where('buildingId', '==', buildingId));

// CORRECT - Passes security rules
query(where('buildingId', '==', buildingId), where('companyId', '==', userCompanyId));
```

**Enforcement:**

- Always include identity filter when querying for customer access
- Firestore needs to know which customer to check permissions for

## Troubleshooting

### Error: "Missing or insufficient permissions"

**Causes:**

1. ❌ User has `permissionLevel: 0` instead of `-1`
2. ❌ User's custom claims don't include `companyId`
3. ❌ Report is missing `companyId` field
4. ❌ Query doesn't include `companyId` filter for customers

**Solutions:**

```bash
# Run the validation script
node scripts/validate-and-fix-data.cjs

# Then force logout/login to refresh tokens
```

### Error: "The query requires an index"

**Cause:**

- Query uses multiple fields without proper index

**Solution:**

- Create composite index in Firebase Console
- OR adjust query to use fewer filter fields
- OR use fallback client-side filtering

## Data Migration Checklist

When migrating data or creating test data:

- [ ] All users have `permissionLevel` set correctly
- [ ] All customer users have `companyId` set
- [ ] All auth custom claims are set in Firebase Auth
- [ ] All reports have `companyId` field
- [ ] All reports have `buildingId` field
- [ ] All buildings have `customerId` field
- [ ] All buildings have valid customer references
- [ ] All documents have `branchId` field
- [ ] All documents have `createdBy` field
- [ ] All documents have `createdAt` timestamp

## Prevention Best Practices

1. **Use TypeScript Types:** The codebase uses strict types that prevent missing fields
2. **Validate on Submission:** Frontend validates all required fields before saving
3. **Run Regular Audits:** Use `validate-and-fix-data.cjs` weekly
4. **Monitor Errors:** Watch Firebase logs for "permission-denied" errors
5. **Test Queries:** Always test with customer accounts before deploying

## Related Files

- [Firestore Rules](../firestore.rules) - Security rules that enforce data integrity
- [Report Service](../src/services/reportService.ts) - Report creation with auto-setup
- [Building Service](../src/services/buildingService.ts) - Building creation with validation
- [Auth Context](../src/contexts/AuthContext.tsx) - User authentication and claims setup
- [Validation Script](../scripts/validate-and-fix-data.cjs) - Data integrity checker
