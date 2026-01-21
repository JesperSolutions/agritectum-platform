# User Audit Report - October 1, 2025

## Summary

Auditing all users across Firebase Authentication and Firestore to identify:

- Mismatches between Authentication custom claims and Firestore documents
- Duplicate accounts
- Inconsistent data (branchId, role, permissionLevel)

---

## Users from Firebase Authentication (users.json)

### 1. **System Administrator**

- **Email**: admin.sys@taklaget.se
- **UID**: uKtyqRCXxqf7xtdK3JKnFnrGHTn2
- **Role**: superadmin
- **Permission Level**: 2
- **Branch**: None (branchIds: [])
- **Status**: Active
- **Last Sign In**: Sep 18, 2025

### 2. **Stockholm Branch Manager**

- **Email**: sthlm.admin@taklaget.se
- **UID**: NwhxIrVemAdKrLNBeaORSl1oIGy2
- **Role**: branchAdmin
- **Permission Level**: 1
- **Branch**: stockholm
- **Status**: Active
- **Last Sign In**: Sep 18, 2025

### 3. **Göteborg Branch Manager**

- **Email**: goteborg.manager@taklaget.se
- **UID**: nWBV9lKEI8Mp9Ql3IOcFH9ZXCYp1
- **Role**: branchAdmin
- **Permission Level**: 1
- **Branch**: goteborg
- **Status**: Active
- **Last Sign In**: Sep 5, 2025

### 4. **Malmö Branch Manager**

- **Email**: malmo.manager@taklaget.se
- **UID**: HOKOmwQ6m1QG3oHcZ4CQJ8p0me02
- **Role**: branchAdmin
- **Permission Level**: 1
- **Branch**: malmo
- **Status**: Active
- **Last Sign In**: Oct 1, 2025

### 5. **Erik Andersson** (Stockholm Inspector)

- **Email**: erik.andersson@taklaget.se
- **UID**: iEwYDXyQLqa9jlKznHFZkO09sF53
- **Role**: inspector
- **Permission Level**: 0
- **Branch**: stockholm
- **Status**: Active
- **Last Sign In**: Sep 5, 2025

### 6. **Sofia Johansson** (Stockholm Inspector)

- **Email**: sofia.johansson@taklaget.se
- **UID**: sUfpSJgikgTviVzZRlalAuz6Hwo2
- **Role**: inspector
- **Permission Level**: 0
- **Branch**: stockholm
- **Status**: Active
- **Last Sign In**: Never

### 7. **Lars Larsson** (Göteborg Inspector)

- **Email**: lars.larsson@taklaget.se
- **UID**: gKexXWp6cZbkodvWeNbAkT843jS2
- **Role**: inspector
- **Permission Level**: 0
- **Branch**: goteborg
- **Status**: Active
- **Last Sign In**: Sep 5, 2025

### 8. **Petra Petersson** (Göteborg Inspector) ⚠️

- **Email**: petra.petersson@taklaget.se
- **UID**: 1TngdzOaS7Xfd1GHJedLNuGX1g52
- **Role**: inspector
- **Permission Level**: 0
- **Branch**: goteborg (in Authentication)
- **Status**: Active
- **Last Sign In**: Oct 1, 2025
- **⚠️ ISSUE**: Firestore shows branchId: "malmo" but Authentication shows "goteborg"

### 9. **Anders Andersson** (Malmö Inspector)

- **Email**: anders.andersson@taklaget.se
- **UID**: Uoa88HXQaefquAKA5gJIDBzHis73
- **Role**: inspector
- **Permission Level**: 0
- **Branch**: malmo
- **Status**: Active
- **Last Sign In**: Never

### 10. **Karin Karlsson** (Malmö Inspector)

- **Email**: karin.karlsson@taklaget.se
- **UID**: sPvhXNxiSucbEjnxNvp6VqDhHM52
- **Role**: inspector
- **Permission Level**: 0
- **Branch**: malmo
- **Status**: Active
- **Last Sign In**: Never

---

## Issues Found

### 🔴 Critical Issues:

#### 1. **Petra Petersson - Branch Mismatch**

- **Authentication custom claims**: `branchId: "goteborg"`
- **Firestore `/users` document**: `branchId: "malmo"`
- **Impact**: User may not see correct data, permission errors
- **Recommended Fix**: Determine correct branch and sync both systems

---

## Duplicate Check: ✅ PASS

- No duplicate email addresses found
- All UIDs are unique
- No users appear more than once

---

## Data Consistency Check

### Users by Branch:

**Stockholm (3 users)**:

- sthlm.admin@taklaget.se (Admin)
- erik.andersson@taklaget.se (Inspector)
- sofia.johansson@taklaget.se (Inspector)

**Göteborg (2-3 users)** ⚠️:

- goteborg.manager@taklaget.se (Admin)
- lars.larsson@taklaget.se (Inspector)
- petra.petersson@taklaget.se (Inspector?) ← Conflicting data

**Malmö (2-3 users)** ⚠️:

- malmo.manager@taklaget.se (Admin)
- anders.andersson@taklaget.se (Inspector)
- karin.karlsson@taklaget.se (Inspector)
- petra.petersson@taklaget.se (Inspector?) ← Conflicting data

---

## Recommended Actions:

### 1. **Fix Petra Petersson's Branch Assignment**

**Question**: Should Petra belong to Göteborg or Malmö?

**Option A: Göteborg (matches Authentication)**

```
Update Firestore: /users/1TngdzOaS7Xfd1GHJedLNuGX1g52
Set: branchId = "goteborg"
```

**Option B: Malmö (matches current Firestore)**

```
Update Authentication custom claims:
Set: branchId = "malmo"
```

### 2. **Verify All Firestore Documents Match**

Need to check that ALL users in `/users` collection have matching data with Authentication.

---

## Summary Statistics:

- **Total Users**: 10
- **Superadmins**: 1
- **Branch Admins**: 3
- **Inspectors**: 6
- **Active**: 10
- **Disabled**: 0
- **Issues Found**: 1 (Petra's branch mismatch)
- **Duplicates**: 0

---

## Next Steps:

1. **Decide Petra's correct branch** (Göteborg or Malmö?)
2. **Update the incorrect system** (either Firestore or Authentication)
3. **Verify Firestore `/users` collection** matches Authentication for all users
4. **Test login** for Petra after fix
