# 🏗️ Agritectum Platform - Architecture Analysis
**Date:** January 30, 2026  
**Analyst Role:** Solutions Architect  
**Context:** Platform consolidated from 3 development houses

---

## 🔍 Executive Summary

After reviewing the Firestore collections, TypeScript types, security rules, and service layer, I've identified **architectural debt and inconsistencies** that have accumulated across multiple development teams. This report categorizes findings by severity and provides recommendations.

**Health Score: 6.5/10** ⚠️

---

## 📊 Collection Inventory (22 Collections)

### Core Business Collections ✅
1. **users** - User accounts & authentication
2. **branches** - Branch/office locations
3. **customers** - Customer records
4. **buildings** - Physical building data (NEW - good addition)
5. **companies** - Company/organization data
6. **reports** - Inspection reports
7. **appointments** - Scheduled appointments
8. **offers** - Customer quotes/offers
9. **serviceAgreements** - Service contracts
10. **scheduledVisits** - Visit scheduling (customer-facing)
11. **esgServiceReports** - ESG/sustainability reports

### Supporting Collections ✅
12. **notifications** - In-app notifications
13. **customerInvitations** - Customer signup tokens
14. **externalServiceProviders** - External contractors
15. **buildingImprovements** - (Type defined, rules missing)
16. **rejectedOrders** - Rejected appointment tracking

### Email Infrastructure Collections 📧
17. **mail** - Trigger Email extension queue
18. **emailLogs** - Email tracking (internal)
19. **emailPreferences** - User email settings
20. **reportAccessLogs** - Audit logging

### Deprecated/Problematic Collections ⚠️
21. **employees** (TOP-LEVEL) - **DUPLICATE** - should only be subcollection
22. **branches/{branchId}/employees** (SUBCOLLECTION) - **DEPRECATED** - migrating to users

---

## 🚨 Critical Issues

### 1. **DUPLICATE EMPLOYEE STORAGE** 🔴 HIGH PRIORITY

**Problem:**
- `employees` exists as **both** top-level collection AND subcollection under `branches`
- TypeScript `Employee` interface duplicates `User` structure
- Security rules exist for both locations
- Data inconsistency risk is HIGH

**Evidence:**
```typescript
// firestore.rules line 131: subcollection
match /branches/{branchId} {
  match /employees/{employeeId} { ... }
}

// firestore.rules line 403: top-level collection
match /employees/{employeeId} { ... }
```

```typescript
// types/index.ts - Nearly identical interfaces
export interface User {
  uid: string;
  email: string;
  role: UserRole;
  permissionLevel: PermissionLevel;
  branchId?: string;
  // ... 
}

export interface Employee {
  id: string;
  uid: string;
  email: string;
  role: UserRole;
  permissionLevel: PermissionLevel;
  branchId: string;
  // ... (same fields!)
}
```

**Recommendation:**
```
ACTION: Consolidate to /users collection ONLY
- Migrate any remaining data from /branches/{branchId}/employees
- Delete employee subcollection rules
- Delete top-level /employees collection rules
- Remove Employee interface, use User everywhere
- Update all services to use userService only
```

---

### 2. **INCONSISTENT CUSTOMER LINKING** 🔴 HIGH PRIORITY

**Problem:**
Multiple ways to reference customers across collections:
- `customerId` (points to customers collection)
- `companyId` (points to companies collection)  
- `customerName` (denormalized string)
- Mix of both individual and company customers

**Evidence:**
```typescript
// Report interface
interface Report {
  customerId?: string;        // Link to customers?
  customerName: string;        // Denormalized
  // ... but also:
  buildingId: string;          // Required
}

// Building interface  
interface Building {
  companyId?: string;          // Link to companies?
  customerId?: string;         // Link to customers?
}

// ServiceAgreement interface
interface ServiceAgreement {
  customerId: string;          // Required but...
  companyId?: string;          // Also optional company link
  buildingId?: string;         // And optional building
}
```

**Issue:** No clear "source of truth" for customer data. Reports/appointments can exist without proper customer linkage.

**Recommendation:**
```
DESIGN DECISION NEEDED:
Option A: Customer-centric (B2C focus)
  - Keep /customers as primary
  - Add optional companyId to customers
  - All reports/buildings link to customerId

Option B: Company-centric (B2B focus)
  - Keep /companies as primary
  - Customers become contacts under companies
  - All reports/buildings link to companyId

Option C: Hybrid (current state - needs cleanup)
  - Enforce: buildings MUST have either customerId XOR companyId
  - Reports/agreements link via buildingId (ALWAYS required)
  - Deprecate direct customer/company links on reports
```

**Recommended: Option C (with strict validation)**
- Buildings become the relationship hub
- Every report/agreement MUST have buildingId
- Remove optional customerId from reports (get it via building)

---

### 3. **INCONSISTENT BRANCH ACCESS PATTERNS** 🟡 MEDIUM PRIORITY

**Problem:**
Security rules use inconsistent patterns for branch filtering:

**Pattern 1:** Simple branch match
```javascript
resource.data.branchId == getUserBranchId()
```

**Pattern 2:** Branch match OR "main" bypass
```javascript
(resource.data.branchId == getUserBranchId() || getUserBranchId() == "main")
```

**Pattern 3:** No branch check (inspectors allowed)
```javascript
isInspector() && resource.data.createdBy == request.auth.uid
```

**Collections with inconsistent patterns:**
- reports: Uses pattern 2
- customers: Uses pattern 2  
- offers: Uses pattern 2
- appointments: Uses pattern 2
- esgServiceReports: Uses pattern 2
- scheduledVisits: Uses pattern 1 (INCONSISTENT!)

**Recommendation:**
```
STANDARDIZE: All collections use Pattern 2
- Superadmins get getUserBranchId() == "main" in claims
- Branch admins/inspectors get specific branchId
- All rules check: (branchId match OR main bypass)
- Document this pattern in FIRESTORE_DATABASE_STRUCTURE.md
```

---

### 4. **MISSING COMPOSITE INDEXES** 🟡 MEDIUM PRIORITY

**Problem:**
Several query patterns lack corresponding indexes in firestore.indexes.json:

**Missing indexes:**
1. `offers` collection:
   - `where('branchId', '==', ...).orderBy('createdAt', 'desc')`
   - `where('createdBy', '==', ...).orderBy('createdAt', 'desc')`

2. `customers` collection:
   - `where('branchId', '==', ...).orderBy('name', 'asc')`
   - `where('branchId', '==', ...).orderBy('createdAt', 'desc')`

3. `buildings` collection:
   - `where('companyId', '==', ...).orderBy('createdAt', 'desc')`
   - `where('customerId', '==', ...).orderBy('createdAt', 'desc')`

**Recently Fixed:**
- ✅ externalServiceProviders (just added today)

**Recommendation:**
```
ACTION: Add missing indexes
- Run production query logs to identify failing patterns
- Add indexes proactively for all branch-scoped queries
- Document index strategy in deployment guide
```

---

### 5. **ORPHANED HELPER FUNCTIONS** 🟢 LOW PRIORITY

**Problem:**
Unused functions in firestore.rules creating technical debt:

```javascript
// Line 31-36: UNUSED
function hasBranchAccess(branchId) {
  let userBranchId = getUserBranchId();
  return userBranchId == branchId || userBranchId == "main" || isSuperadmin();
}

// Line 64-75: UNUSED
function getUserType() {
  return request.auth.token.userType != null
    ? request.auth.token.userType
    : (exists(...) ? get(...).data.userType : "internal");
}
```

**Recommendation:**
```
ACTION: Clean up unused functions
- Remove hasBranchAccess (pattern replaced inline)
- Remove getUserType (only used for customer checks, use isCustomer())
- Add comment header explaining standard patterns
```

---

### 6. **INCONSISTENT REQUIRED FIELDS VALIDATION** 🟡 MEDIUM PRIORITY

**Problem:**
Some create rules validate required fields, others don't:

**Good example (customers):**
```javascript
allow create: if ... &&
  request.resource.data.keys().hasAll(["name", "branchId", "createdBy"])
```

**Missing validation:**
- buildings: No required field checks
- offers: No required field checks
- appointments: No required field checks
- reports: No required field checks (only esgServiceReports has it)

**Recommendation:**
```
ACTION: Add required field validation to all create rules
buildings:
  .hasAll(["address", "branchId", "createdBy"])
  AND (has "customerId" XOR has "companyId")

offers:
  .hasAll(["reportId", "branchId", "customerEmail", "totalAmount"])

appointments:
  .hasAll(["branchId", "scheduledDate", "assignedInspectorId"])

reports:
  .hasAll(["buildingId", "branchId", "createdBy"])
```

---

## 🎯 Architectural Strengths

### ✅ What's Working Well

1. **Buildings Collection** - Excellent addition as relationship hub
   - Proper geolocation support (lat/lng)
   - ESG metrics integration
   - Links to both customers and companies
   - Snapshot pattern for audit trail

2. **Permission System** - Well-designed role hierarchy
   - Clear permission levels (-1, 0, 1, 2)
   - Custom claims properly used
   - Helper functions (isSuperadmin, isBranchAdmin, etc.)

3. **Service Agreements** - Flexible provider model
   - Supports internal (branch) AND external providers
   - Public acceptance workflow
   - Proper metadata tracking

4. **ESG Integration** - Forward-thinking sustainability features
   - ESG metrics on buildings
   - Dedicated esgServiceReports collection
   - Calculator integration ready

5. **Email Infrastructure** - Professional setup
   - Trigger Email extension properly configured
   - Audit logging (reportAccessLogs)
   - Email preferences per user

6. **Public Access Patterns** - Customer-friendly
   - Public links for offers
   - Public links for service agreements
   - Public ESG reports
   - Proper token validation

---

## 📋 Data Model Recommendations

### Proposed Canonical Relationships

```
┌─────────────┐
│   branches  │ (Branch offices)
└──────┬──────┘
       │
       │ branchId
       ├────────────┐
       │            │
       ▼            ▼
  ┌────────┐   ┌──────────┐
  │ users  │   │companies │ (B2B customers)
  └────────┘   └────┬─────┘
                    │ companyId
                    │
       ┌────────────┴─────────────┐
       │                          │
       ▼                          ▼
  ┌───────────┐            ┌──────────────────┐
  │ customers │            │    buildings     │ ⭐ HUB
  └─────┬─────┘            └────────┬─────────┘
        │ customerId               │ buildingId
        │                          │
        └──────────┬───────────────┘
                   │
       ┌───────────┴────────────────────┐
       │                                │
       ▼                                ▼
  ┌──────────┐                   ┌────────────┐
  │ reports  │                   │appointments│
  └──────────┘                   └────────────┘
       │                                │
       ├────────────────────────────────┤
       │                                │
       ▼                                ▼
  ┌──────────┐                   ┌──────────────────┐
  │  offers  │                   │ scheduledVisits  │
  └──────────┘                   └──────────────────┘
       │                                │
       │                                │
       ▼                                ▼
  ┌──────────────────┐          ┌────────────────────┐
  │serviceAgreements │          │ esgServiceReports  │
  └──────────────────┘          └────────────────────┘
```

**Key Principles:**
1. **Buildings are the hub** - All customer work relates to a building
2. **No orphan data** - Every report/agreement MUST have buildingId
3. **Single source of truth** - Get customer via building, not directly
4. **Branch scoping** - Every document has branchId for access control
5. **Audit trail** - Use buildingSnapshot pattern for historical data

---

## 🔧 Implementation Roadmap

### Phase 1: Critical Fixes (1-2 weeks)
**Priority: HIGH** 🔴

1. **Employee Collection Consolidation**
   ```
   - [ ] Audit: Count documents in /employees vs /branches/*/employees
   - [ ] Migrate: Move any remaining employee data to /users
   - [ ] Delete: Remove Employee interface from types
   - [ ] Update: Change all services to use User type
   - [ ] Clean: Remove employee rules from firestore.rules
   - [ ] Test: Verify all user queries work
   - [ ] Deploy: Production migration
   ```

2. **Customer Relationship Cleanup**
   ```
   - [ ] Audit: Find reports without buildingId
   - [ ] Decision: Choose Option A, B, or C for customer model
   - [ ] Migration script: Link existing reports to buildings
   - [ ] Validation: Add required field checks to rules
   - [ ] Code update: Enforce buildingId in all new reports
   - [ ] Test: Create report flow with new validation
   - [ ] Deploy: Staged rollout
   ```

3. **Missing Composite Indexes**
   ```
   - [ ] Review: Production query logs for missing indexes
   - [ ] Add: offers by branchId + createdAt
   - [ ] Add: offers by createdBy + createdAt
   - [ ] Add: customers by branchId + name
   - [ ] Add: buildings by customerId + createdAt
   - [ ] Add: buildings by companyId + createdAt
   - [ ] Deploy: firestore.indexes.json
   - [ ] Monitor: Index build progress in console
   ```

### Phase 2: Consistency Improvements (2-3 weeks)
**Priority: MEDIUM** 🟡

4. **Standardize Branch Access Pattern**
   ```
   - [ ] Document: Standard pattern in architecture guide
   - [ ] Update: scheduledVisits to use pattern 2
   - [ ] Update: Any other inconsistent collections
   - [ ] Test: Branch admin & inspector access
   - [ ] Deploy: Rules update
   ```

5. **Required Field Validation**
   ```
   - [ ] Add: buildings required fields
   - [ ] Add: offers required fields
   - [ ] Add: appointments required fields
   - [ ] Add: reports required fields
   - [ ] Test: Create operations with missing fields
   - [ ] Deploy: Rules update
   ```

6. **Security Rule Cleanup**
   ```
   - [ ] Remove: hasBranchAccess() function
   - [ ] Remove: getUserType() function
   - [ ] Add: Header comment explaining patterns
   - [ ] Review: All unused code
   - [ ] Deploy: Clean rules
   ```

### Phase 3: Future Enhancements (Backlog)
**Priority: LOW** 🟢

7. **Add Relationship Validation**
   ```
   - [ ] Validate: buildingId exists before creating report
   - [ ] Validate: customerId/companyId exists on building
   - [ ] Validate: branchId exists before assigning
   - [ ] Consider: Cloud Functions for cross-collection validation
   ```

8. **Data Migration Utilities**
   ```
   - [ ] Script: Audit orphaned data
   - [ ] Script: Fix missing relationships
   - [ ] Script: Validate data consistency
   - [ ] Dashboard: Data quality metrics
   ```

---

## 📊 Collection-by-Collection Assessment

### Tier A: Well-Designed ✅

| Collection | Score | Notes |
|------------|-------|-------|
| buildings | 9/10 | Excellent hub design, ESG ready, proper audit trail |
| serviceAgreements | 9/10 | Flexible provider model, public acceptance, complete metadata |
| esgServiceReports | 8/10 | Good structure, proper validations, clear purpose |
| notifications | 8/10 | Simple, focused, proper user scoping |
| externalServiceProviders | 8/10 | Good ownership model, sharing logic, platform integration |

### Tier B: Functional with Issues ⚠️

| Collection | Score | Issues |
|------------|-------|--------|
| reports | 7/10 | Too many optional fields, inconsistent customer linking |
| offers | 7/10 | Missing indexes, no required field validation |
| appointments | 7/10 | Duplicates scheduledVisits, unclear which to use |
| scheduledVisits | 7/10 | Inconsistent branch pattern, overlaps appointments |
| customers | 6/10 | Unclear relationship to companies, denormalized data |
| companies | 6/10 | Underutilized, unclear role in architecture |

### Tier C: Needs Refactoring 🔴

| Collection | Score | Critical Issues |
|------------|-------|-----------------|
| employees (top-level) | 2/10 | **DUPLICATE** - Should not exist |
| branches/*/employees | 2/10 | **DEPRECATED** - Migrate to users |
| users | 5/10 | Mixing internal users + customers, needs clearer separation |

---

## 🎓 Lessons Learned

### Patterns from Multiple Dev Houses

**House 1** (Original): Branch/employee subcollection pattern  
**House 2** (Migration): Added top-level users + customers  
**House 3** (Recent): Added buildings hub + ESG features  

**Result:** Layering without cleanup = Technical debt

### What Happened
1. Each team added features without removing old patterns
2. No architectural governance between handoffs
3. TypeScript types don't match Firestore reality
4. Security rules evolved separately from code
5. Missing documentation of design decisions

### How to Prevent
1. ✅ **Architectural Decision Records (ADRs)** - Document why choices were made
2. ✅ **Code review checklist** - Include Firestore rules in PR reviews
3. ✅ **Type-to-schema validation** - Automated checks between TS and Firestore
4. ✅ **Migration scripts** - Never leave deprecated patterns in production
5. ✅ **Quarterly architecture review** - Dedicated time to review patterns

---

## 🚀 Quick Wins (< 1 Day Each)

1. **Add Missing Indexes** ⚡
   - Copy-paste ready configurations
   - Deploy immediately
   - No code changes required

2. **Remove Unused Functions** 🧹
   - Delete hasBranchAccess()
   - Delete getUserType()
   - 10 lines removed = cleaner codebase

3. **Document Branch Pattern** 📝
   - Add to FIRESTORE_DATABASE_STRUCTURE.md
   - Include code examples
   - New devs will thank you

4. **Add Required Field Validation** 🛡️
   - 5-10 lines per collection
   - Prevents bad data at source
   - No application code changes

5. **Consolidate Employee Type** 🔄
   - Find/replace Employee → User in services
   - Remove interface definition
   - Simplify mental model

---

## 📝 Conclusion

The Agritectum platform has a **solid foundation** with some **accumulated technical debt** from multiple development teams. The core architecture is sound, but inconsistencies in implementation create maintenance burden and potential bugs.

### Key Takeaways

**Strengths:**
- ✅ Buildings-as-hub is excellent architectural choice
- ✅ Permission system is well-designed
- ✅ ESG integration is forward-thinking
- ✅ Service agreements handle complex provider relationships

**Weaknesses:**
- ⚠️ Employee/User duplication is confusing and risky
- ⚠️ Customer/Company relationships need clarity
- ⚠️ Missing indexes cause query failures
- ⚠️ Inconsistent patterns across collections

**Priority Actions:**
1. 🔴 Consolidate employees → users (HIGH)
2. 🔴 Add missing composite indexes (HIGH)
3. 🟡 Enforce buildingId on all reports (MEDIUM)
4. 🟡 Standardize branch access patterns (MEDIUM)
5. 🟢 Clean up unused helper functions (LOW)

### Estimated Effort
- **Phase 1 (Critical):** 1-2 weeks
- **Phase 2 (Consistency):** 2-3 weeks  
- **Phase 3 (Enhancements):** Ongoing backlog

**Total cleanup effort:** ~4-5 weeks with 1 senior developer

---

## 📚 Recommended Documentation Updates

1. **Architecture Decision Records**
   - Why buildings are the hub
   - Why employees migrated to users
   - Customer vs Company model decision

2. **Developer Onboarding Guide**
   - Collection relationship diagram
   - Standard query patterns
   - Permission system explained

3. **Security Rules Guide**
   - Standard branch access pattern
   - Helper function reference
   - Common validation patterns

4. **Migration Playbook**
   - Scripts for data cleanup
   - Testing procedures
   - Rollback plans

---

**Document Status:** ✅ COMPLETE  
**Next Review:** Q2 2026 (after Phase 1 completion)  
**Owner:** Solutions Architect  
**Stakeholders:** Engineering Team, Product Lead
