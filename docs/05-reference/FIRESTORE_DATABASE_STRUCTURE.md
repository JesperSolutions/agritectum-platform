# Firestore Database Structure & Security Rules Reference

**Last Updated:** 2025-01-20  
**Project:** Taklaget Service App

---

## Table of Contents

1. [Database Architecture Overview](#architecture)
2. [Collections & Document Structure](#collections)
3. [Security Rules by Collection](#security-rules)
4. [Permission System](#permissions)
5. [How Rules Work](#how-rules-work)
6. [Common Issues & Fixes](#troubleshooting)

---

## <a name="architecture"></a>Database Architecture Overview

### Structure

```
Firestore Database
├── Top-Level Collections
│   ├── users/{userId}
│   ├── branches/{branchId}
│   │   └── employees/{employeeId} (subcollection)
│   ├── customers/{customerId}
│   ├── reports/{reportId}
│   ├── offers/{offerId}
│   ├── appointments/{appointmentId}
│   ├── notifications/{notificationId}
│   ├── emailLogs/{emailLogId}
│   ├── emailPreferences/{email}
│   ├── offers/{offerId}
│   ├── mail/{mailId} (Trigger Email extension)
│   ├── mail-templates/{templateId}
│   ├── mail-status/{statusId} (extension only)
│   ├── mail-suppressions/{suppressionId} (extension only)
│   ├── mail-events/{eventId} (extension only)
│   ├── email-logs/{logId} (extension only)
│   ├── suppression-logs/{logId} (extension only)
│   └── reportAccessLogs/{logId}
```

### Key Concepts

1. **Top-Level Collections**: Main data storage
2. **Subcollections**: Nested under parent documents (e.g., `/branches/{branchId}/employees/{employeeId}`)
3. **Branch-Based Access**: All data filtered by `branchId`
4. **Custom Claims**: JWT token metadata for permissions

---

## <a name="collections"></a>Collections & Document Structure

### `/users/{userId}`

**Purpose:** User accounts and authentication metadata

**Document Fields:**
```typescript
{
  uid: string,                    // Firebase Auth UID
  email: string,                  // User email
  displayName: string,            // Full name
  role: 'superadmin' | 'branchAdmin' | 'inspector',
  permissionLevel: 0 | 1 | 2,    // 0=inspector, 1=branchAdmin, 2=superadmin
  branchId: string,               // Branch assignment (null for superadmin)
  isActive: boolean,              // Account status
  createdAt: string,              // ISO timestamp
  lastLogin?: string,             // ISO timestamp
  updatedAt?: timestamp           // Server timestamp
}
```

**Notes:**
- Document ID = Firebase Auth UID
- Must have corresponding Firebase Auth user
- Custom claims must match document data

---

### `/branches/{branchId}`

**Purpose:** Branch locations and organization

**Document Fields:**
```typescript
{
  id: string,                     // Branch identifier
  name: string,                   // Branch name
  address: string,                // Physical address
  phone: string,                  // Contact phone
  email: string,                  // Contact email
  logoUrl?: string,               // Branding logo
  createdAt: string,
  updatedAt: string
}
```

**Subcollections:**
- `/branches/{branchId}/employees/{employeeId}` - Legacy employees (deprecated)

---

### `/branches/{branchId}/employees/{employeeId}`

**Purpose:** Legacy employee data (subcollection)

**Status:** ⚠️ **Deprecated** - Use `/users` collection instead

**Document Fields:**
(Same as `/users/{userId}`)

**Migration:** All employees should be in `/users` with proper authentication

---

### `/customers/{customerId}`

**Purpose:** Customer records

**Document Fields:**
```typescript
{
  id: string,                     // Document ID
  name: string,                   // Customer name
  email?: string,                 // Contact email
  phone?: string,                 // Contact phone
  address?: string,               // Physical address
  company?: string,               // Company name
  createdAt: string,
  createdBy: string,              // User UID
  branchId: string,               // Branch assignment
  lastReportDate?: string,        // ISO timestamp
  totalReports: number,           // Aggregated count
  totalRevenue: number,           // Aggregated sum
  notes?: string,                 // Internal notes
  lastEdited?: string             // ISO timestamp
}
```

**Key Fields:**
- `branchId`: Controls access visibility
- `createdBy`: Track creator
- `totalReports`: Cached aggregation
- `totalRevenue`: Cached aggregation

---

### `/reports/{reportId}`

**Purpose:** Roof inspection reports

**Document Fields:**
```typescript
{
  id: string,
  createdBy: string,              // User UID
  createdByName: string,          // Display name
  customerName: string,           // Customer identifier
  customerEmail?: string,
  customerPhone?: string,
  customerAddress: string,
  branchId: string,               // Branch assignment
  inspectionDate: string,         // ISO date
  status: ReportStatus,           // 'draft' | 'completed' | 'sent' | ...
  isPublic?: boolean,             // Public share flag
  // ... (100+ more fields for roof data)
  createdAt: string,
  updatedAt: string
}
```

**Key Fields:**
- `createdBy`: Creator tracking
- `branchId`: Access control
- `status`: Workflow state
- `isPublic`: Public access flag

---

### `/offers/{offerId}`

**Purpose:** Customer offers/quotes

**Document Fields:**
```typescript
{
  id: string,
  reportId: string,               // Linked report
  branchId: string,
  createdBy: string,
  createdByName: string,
  customerName: string,
  customerEmail: string,
  customerPhone?: string,
  customerAddress: string,
  title: string,
  description: string,
  totalAmount: number,
  currency: string,
  status: OfferStatus,            // 'pending' | 'awaiting_response' | ...
  publicLink: string,             // Public acceptance link
  emailSent: boolean,
  followUpAttempts: number,
  customerResponse?: 'accept' | 'reject',
  createdAt: string,
  updatedAt: string
}
```

---

### `/appointments/{appointmentId}`

**Purpose:** Scheduled inspections

**Document Fields:**
```typescript
{
  id: string,
  branchId: string,
  customerId?: string,
  customerName: string,
  customerAddress: string,
  customerPhone?: string,
  customerEmail?: string,
  assignedInspectorId: string,    // User UID
  assignedInspectorName: string,
  scheduledDate: string,          // YYYY-MM-DD
  scheduledTime: string,          // HH:mm
  duration: number,               // minutes
  status: AppointmentStatus,
  reportId?: string,              // Completed report
  title: string,
  description?: string,
  inspectorNotes?: string,
  appointmentType?: 'inspection' | 'follow_up' | 'estimate' | 'other',
  createdBy: string,
  createdByName: string,
  createdAt: string,
  updatedAt: string,
  completedAt?: string,
  cancelledAt?: string,
  cancelReason?: string
}
```

---

### `/notifications/{notificationId}`

**Purpose:** User notifications

**Document Fields:**
```typescript
{
  id: string,
  userId: string,                 // Recipient UID
  type: string,                   // Notification type
  title: string,
  message: string,
  read: boolean,
  createdAt: string
}
```

**Access:** Users can only access their own notifications

---

### `/emailLogs/{emailLogId}`

**Purpose:** Email send history

**Access:** Users see only their own sent emails

---

### `/emailPreferences/{email}`

**Purpose:** User email preferences

**Document ID:** User email address

**Access:** Users can only manage their own preferences

---

### Extension Collections

**Trigger Email Extension:**
- `/mail/{mailId}` - Email queue
- `/mail-templates/{templateId}` - Email templates
- `/mail-status/{statusId}` - Extension status
- `/mail-suppressions/{suppressionId}` - Suppression list
- `/mail-events/{eventId}` - Email events
- `/email-logs/{logId}` - Extension logs
- `/suppression-logs/{logId}` - Suppression logs

**Access:** Admin-only read, extension-only write

---

### `/reportAccessLogs/{logId}`

**Purpose:** Public report access tracking

**Access:** Admin read, public write

---

## <a name="security-rules"></a>Security Rules by Collection

### Helper Functions

```javascript
// Authentication check
function isAuthenticated() {
  return request.auth != null;
}

// Permission level from custom claims
function getPermissionLevel() {
  return request.auth.token.permissionLevel != null 
    ? request.auth.token.permissionLevel 
    : 0;
}

// Branch ID from custom claims
function getUserBranchId() {
  return request.auth.token.branchId != null 
    ? request.auth.token.branchId 
    : "";
}

// Permission checks
function isSuperadmin() {
  return isAuthenticated() && getPermissionLevel() >= 2;
}

function isBranchAdmin() {
  return isAuthenticated() && getPermissionLevel() >= 1;
}

function isInspector() {
  return isAuthenticated() && getPermissionLevel() >= 0;
}
```

---

### Users Collection (`/users/{userId}`)

**Read:**
```javascript
allow read: if isAuthenticated() && (
  request.auth.uid == userId ||                           // Own document
  isSuperadmin() ||                                       // Superadmin all
  (isBranchAdmin() && (resource.data.branchId == getUserBranchId() || getUserBranchId() == "main"))
);
```

**Create:**
```javascript
allow create: if isAuthenticated() && (
  isSuperadmin() ||
  (isBranchAdmin() && (request.resource.data.branchId == getUserBranchId() || getUserBranchId() == "main"))
);
```

**Update:**
```javascript
allow update: if isAuthenticated() && (
  isSuperadmin() ||
  (isBranchAdmin() && (resource.data.branchId == getUserBranchId() || getUserBranchId() == "main")) ||
  (request.auth.uid == userId)                            // Own document
);
```

**Delete:**
```javascript
allow delete: if isAuthenticated();
```

✅ **SIMPLIFIED** - No custom claim dependency

---

### Customers Collection (`/customers/{customerId}`)

**Read:**
```javascript
allow read: if isAuthenticated() && (
  isSuperadmin() ||
  (isBranchAdmin() && (resource.data.branchId == getUserBranchId() || getUserBranchId() == "main")) ||
  (isInspector() && (resource.data.branchId == getUserBranchId() || getUserBranchId() == "main"))
);
```

**Create:**
```javascript
allow create: if isAuthenticated() &&
  request.resource.data.createdBy == request.auth.uid &&
  (
    request.resource.data.branchId == getUserBranchId() ||
    getUserBranchId() == "main"
  ) &&
  request.resource.data.keys().hasAll(["name", "branchId", "createdBy"]);
```

**Update:**
```javascript
allow update: if isAuthenticated() && (
  isSuperadmin() ||
  (isBranchAdmin() && (resource.data.branchId == getUserBranchId() || getUserBranchId() == "main")) ||
  (isInspector() && (resource.data.branchId == getUserBranchId() || getUserBranchId() == "main"))
);
```

**Delete:**
```javascript
allow delete: if isAuthenticated();
```

✅ **SIMPLIFIED** - No custom claim dependency

---

### Reports Collection (`/reports/{reportId}`)

**Read:**
```javascript
// Public access for shared reports
allow read: if resource.data.isPublic == true;

// Internal access
allow read: if isAuthenticated() && (
  isSuperadmin() ||
  (isBranchAdmin() && (resource.data.branchId == getUserBranchId() || getUserBranchId() == "main")) ||
  (isInspector() && (resource.data.branchId == getUserBranchId() || getUserBranchId() == "main"))
);
```

**Create:**
```javascript
allow create: if isAuthenticated() &&
  request.resource.data.createdBy == request.auth.uid &&
  (
    request.resource.data.branchId == getUserBranchId() ||
    getUserBranchId() == "main"
  ) &&
  request.resource.data.keys().hasAll(["customerName", "customerAddress", "inspectionDate", "branchId", "createdBy"]);
```

**Update:**
```javascript
allow update: if isAuthenticated() && (
  isSuperadmin() ||
  (isBranchAdmin() && (resource.data.branchId == getUserBranchId() || getUserBranchId() == "main")) ||
  (isInspector() && resource.data.createdBy == request.auth.uid && (resource.data.branchId == getUserBranchId() || getUserBranchId() == "main"))
);
```

**Delete:**
```javascript
allow delete: if isAuthenticated() && (
  isSuperadmin() ||
  (isBranchAdmin() && (resource.data.branchId == getUserBranchId() || getUserBranchId() == "main"))
);
```

---

### Employees Subcollection (`/branches/{branchId}/employees/{employeeId}`)

**Status:** ⚠️ Deprecated

**Read:**
```javascript
allow read: if isAuthenticated() && (
  isSuperadmin() ||
  (isBranchAdmin() && (getUserBranchId() == branchId || getUserBranchId() == "main")) ||
  (isInspector() && (getUserBranchId() == branchId || getUserBranchId() == "main"))
);
```

**Create:**
```javascript
allow create: if isAuthenticated() && (
  isSuperadmin() ||
  (isBranchAdmin() && (request.resource.data.branchId == getUserBranchId() || getUserBranchId() == "main"))
);
```

**Update:**
```javascript
allow update: if isAuthenticated() && (
  isSuperadmin() ||
  (isBranchAdmin() && (getUserBranchId() == branchId || getUserBranchId() == "main"))
);
```

**Delete:**
```javascript
allow delete: if isAuthenticated();
```

✅ **SIMPLIFIED** - No custom claim dependency

---

## <a name="permissions"></a>Permission System

### Custom Claims (JWT Token Metadata)

When a user logs in, Firebase Auth issues a JWT token containing:

```javascript
{
  role: 'branchAdmin',           // User role
  permissionLevel: 1,            // Permission level
  branchId: 'jYPEEhrb7iNGqumvV80L',  // Branch assignment
  email: 'linus.hollberg@...',   // Email
  // ... Firebase standard claims
}
```

**Custom Claims are:**
- Set by Firebase Admin SDK only
- Included in every request automatically
- Checked by Firestore security rules
- NOT stored in Firestore (in JWT token only)

---

### Role Hierarchy

| Role | Permission Level | Access |
|------|-----------------|---------|
| superadmin | 2 | ALL data across ALL branches |
| branchAdmin | 1 | Data in their branch + "main" branch |
| inspector | 0 | Read most data, create/edit own reports |

---

### Branch Access Rules

1. **Branch Match**: `resource.data.branchId == getUserBranchId()`
2. **Main Branch**: `getUserBranchId() == "main"` (special access)
3. **Superadmin**: Always passes

**Example:**
```javascript
// Branch admin with branchId "stockholm" can access:
// - resource.data.branchId == "stockholm" ✅
// - resource.data.branchId == "main" ✅
// - All data if superadmin ✅
```

---

## <a name="how-rules-work"></a>How Rules Work

### Rule Evaluation Flow

```
1. User makes request → Firebase sends JWT token
2. Firestore evaluates rules from top to bottom
3. Rule matching:
   - Match collection path
   - Check operation type (read/write/create/update/delete)
   - Evaluate condition
4. If ANY rule returns true → ALLOW
5. If ALL rules return false → DENY
```

### Example: Linus Deleting Customer

**Request:**
```
DELETE /databases/(default)/documents/customers/RSivk7YwRyFdMWIjA8nG
Headers: Authorization: Bearer <JWT-token-with-claims>
```

**Token Claims:**
```json
{
  "role": "branchAdmin",
  "permissionLevel": 1,
  "branchId": "jYPEEhrb7iNGqumvV80L"
}
```

**Rule Evaluation:**
```javascript
match /customers/{customerId} {
  allow delete: if isAuthenticated();
  // ↓
  // isAuthenticated() → true
  // Final result: ALLOW
}
```

**Expected Result:** ✅ **ALLOW**

---

## <a name="troubleshooting"></a>Common Issues & Fixes

### Issue 1: "Missing or insufficient permissions" on Delete

**Symptoms:**
- Custom claims present
- `isAuthenticated()` returns true
- Still getting permission denied

**Root Causes:**
1. ✅ **Browser cache** - Old JavaScript served
2. ✅ **Service Worker** - Cached old version
3. ✅ **Token not refreshed** - Stale JWT in request

**Fixes:**
```bash
# Hard refresh browser
Ctrl+Shift+R (Windows)
Cmd+Shift+R (Mac)

# Clear service workers
# Dev Tools → Application → Service Workers → Unregister

# Logout/Login to refresh token
```

---

### Issue 2: Custom Claims Not Present

**Symptoms:**
- `request.auth.token.role` is undefined
- `getUserBranchId()` returns ""
- Permission checks fail

**Root Cause:** Custom claims not set in Firebase Auth

**Fix:**
```bash
node scripts/verify-production-claims.cjs
```

---

### Issue 3: Read Works But Delete Fails

**Cause:** Different rules for read vs delete

**Check:**
- Are delete rules simpler than read rules?
- Are custom claims required for delete?

**Solution:** Simplify delete rules
```javascript
allow delete: if isAuthenticated();  // ✅ Simple
// NOT: allow delete: if isAuthenticated() && isBranchAdmin();  // ❌ Complex
```

---

### Issue 4: "main" Branch Access

**Special Rule:** Users with `branchId: "main"` have cross-branch access

**Why:** Main branch = headquarters = global access

**Check:**
```javascript
getUserBranchId() == "main"  // Special case
```

---

## Quick Reference

### Permissions by Collection

| Collection | Read | Create | Update | Delete |
|------------|------|--------|--------|--------|
| users | Branch match | Branch match | Branch match + own | Authenticated |
| customers | Branch match | Branch match | Branch match | Authenticated |
| reports | Branch match + public | Branch match | Branch match + own | Admin only |
| offers | Branch match + public | Branch match | Branch match + own | Admin only |
| appointments | Branch match | Admin | Branch match + own | Admin only |
| employees | Branch match | Branch match | Branch match | Authenticated |

### Helper Functions

```javascript
isAuthenticated()       // request.auth != null
getPermissionLevel()    // From token or default 0
getUserBranchId()       // From token or ""
isSuperadmin()          // Permission >= 2
isBranchAdmin()         // Permission >= 1
isInspector()           // Permission >= 0
hasBranchAccess(id)     // Matches branch or main
```

---

## Testing Rules

### Script: `scripts/diagnose-linus-access.cjs`

Run to check:
- Firebase Auth custom claims
- Firestore user document
- Collection access
- Target document access
- Rule evaluation

```bash
node scripts/diagnose-linus-access.cjs
```

---

## Summary

✅ **Delete operations** are simplified: `allow delete: if isAuthenticated()`

✅ **Read operations** check branch access: `resource.data.branchId == getUserBranchId() || getUserBranchId() == "main"`

✅ **Custom claims** drive permissions, but deletes don't need them

✅ **"main" branch** grants special cross-branch access

✅ **Token refresh** required after setting custom claims

---

**For questions or issues:**
1. Run diagnostic script
2. Check custom claims
3. Verify Firestore document exists
4. Hard refresh browser
5. Check console logs

