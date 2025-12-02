# Permission System Documentation - Taklaget

## 📊 Permission Hierarchy

### Permission Levels (Numeric)
```
2 = Superadmin (Full system access)
1 = Branch Admin (Branch-level management)
0 = Inspector (Field worker, read-only)
```

---

## 👥 User Roles & Capabilities

### 🔴 **Superadmin** (permissionLevel: 2)
**Role Name**: `superadmin`  
**Branch Assignment**: `null` or `undefined` (no specific branch)  
**BranchIds Field**: `[]` (empty array - can access all branches)

**Capabilities**:
- ✅ View ALL branches
- ✅ Create/Edit/Delete branches
- ✅ View ALL reports across all branches
- ✅ Manage users in ANY branch
- ✅ Access analytics for entire system
- ✅ Create appointments for any branch
- ✅ Full system administration

**Authentication Custom Claims**:
```json
{
  "role": "superadmin",
  "permissionLevel": 2,
  "branchIds": []
}
```

**Firestore Document** (`/users/{uid}`):
```json
{
  "role": "superadmin",
  "permissionLevel": 2,
  "branchId": null,
  "email": "admin@taklaget.onmicrosoft.com",
  "displayName": "System Administrator"
}
```

---

### 🟡 **Branch Admin** (permissionLevel: 1)
**Role Name**: `branchAdmin`  
**Branch Assignment**: **MUST** have a specific branchId  
**Example**: `stockholm`, `goteborg`, `malmo`

**Capabilities**:
- ✅ View ONLY their branch
- ✅ Edit their branch details
- ✅ View reports in their branch
- ✅ Manage users in their branch (inspectors)
- ✅ Create/assign appointments for their inspectors
- ✅ Access analytics for their branch
- ❌ Cannot see other branches
- ❌ Cannot create/delete branches

**Authentication Custom Claims**:
```json
{
  "role": "branchAdmin",
  "permissionLevel": 1,
  "branchId": "stockholm"
}
```

**Firestore Document** (`/users/{uid}`):
```json
{
  "role": "branchAdmin",
  "permissionLevel": 1,
  "branchId": "stockholm",
  "email": "sthlm.admin@taklaget.se",
  "displayName": "Stockholm Branch Manager"
}
```

---

### 🟢 **Inspector** (permissionLevel: 0)
**Role Name**: `inspector`  
**Branch Assignment**: **MUST** have a specific branchId  
**Example**: `stockholm`, `goteborg`, `malmo`

**Capabilities**:
- ✅ View reports in their branch
- ✅ Create NEW reports
- ✅ Edit their OWN reports (not others')
- ✅ View their assigned appointments
- ✅ Start inspections from appointments
- ✅ Update appointment status (in progress, completed)
- ❌ Cannot see other branches
- ❌ Cannot manage users
- ❌ Cannot create appointments (only admins can)
- ❌ Cannot delete reports

**Authentication Custom Claims**:
```json
{
  "role": "inspector",
  "permissionLevel": 0,
  "branchId": "stockholm"
}
```

**Firestore Document** (`/users/{uid}`):
```json
{
  "role": "inspector",
  "permissionLevel": 0,
  "branchId": "stockholm",
  "email": "erik.andersson@taklaget.se",
  "displayName": "Erik Andersson"
}
```

---

## 🏢 Branch Structure

### Expected Organization:

```
📍 Stockholm (branchId: "stockholm")
├── 👤 Branch Admin: sthlm.admin@taklaget.se
├── 🔧 Inspector: erik.andersson@taklaget.se
└── 🔧 Inspector: sofia.johansson@taklaget.se

📍 Göteborg (branchId: "goteborg")
├── 👤 Branch Admin: goteborg.manager@taklaget.se
└── 🔧 Inspector: lars.larsson@taklaget.se

📍 Malmö (branchId: "malmo")
├── 👤 Branch Admin: malmo.manager@taklaget.se
├── 🔧 Inspector: petra.petersson@taklaget.se
├── 🔧 Inspector: anders.andersson@taklaget.se
└── 🔧 Inspector: karin.karlsson@taklaget.se
```

---

## 🔒 Security Rules Logic

### Firestore Rules Check:
```javascript
// Branch Admin can read their branch
isBranchAdmin() && (resource.data.branchId == getUserBranchId())

// Inspector can read their branch
isInspector() && (resource.data.branchId == getUserBranchId())

// Superadmin can read everything
isSuperadmin()
```

### Authentication Custom Claims:
- Set during user creation
- Stored in Firebase Authentication
- Used for security rules evaluation
- **MUST match Firestore document data**

---

## ⚠️ Common Issues & Fixes

### Issue 1: User can't see their branch data
**Cause**: `branchId` mismatch between Authentication custom claims and Firestore document

**Fix**: Ensure BOTH systems have the same `branchId`:
```javascript
// Authentication custom claims
await auth.setCustomUserClaims(uid, {
  role: 'inspector',
  permissionLevel: 0,
  branchId: 'stockholm'
});

// Firestore document
await db.collection('users').doc(uid).set({
  role: 'inspector',
  permissionLevel: 0,
  branchId: 'stockholm'
});
```

### Issue 2: Branch Admin can't manage users
**Cause**: `permissionLevel` is not set correctly or `branchId` is missing

**Fix**: Verify both `permissionLevel: 1` AND valid `branchId` exist

### Issue 3: Inspector sees wrong branch data
**Cause**: Inspector assigned to wrong branch or has multiple `branchId` values

**Fix**: Inspector should have EXACTLY ONE `branchId` matching their physical location

---

## 📋 Data Consistency Checklist

For EVERY user, verify:

1. ✅ **Email format is correct**
   - Branch admins: `{city}.admin@taklaget.se` or `{city}.manager@taklaget.se`
   - Inspectors: `{firstname}.{lastname}@taklaget.se`
   - Superadmin: `admin@taklaget.onmicrosoft.com`

2. ✅ **Role matches permission level**
   - `superadmin` = permissionLevel 2
   - `branchAdmin` = permissionLevel 1
   - `inspector` = permissionLevel 0

3. ✅ **Branch assignment is logical**
   - Superadmin: `branchId = null` or no branchId field
   - Branch Admin/Inspector: `branchId = 'stockholm'|'goteborg'|'malmo'`

4. ✅ **Authentication custom claims match Firestore document**
   - `role` field matches in both
   - `permissionLevel` matches in both
   - `branchId` matches in both

5. ✅ **User has Firestore document**
   - Every user in Authentication MUST have a document in `/users/{uid}`

---

## 🔧 Testing Procedure

### Test as Superadmin:
1. Login as `admin@taklaget.onmicrosoft.com`
2. Navigate to "Företag" (Branches)
3. **Expected**: See all 3 branches with their employees listed
4. Navigate to "Rapporter" (Reports)
5. **Expected**: See reports from all branches

### Test as Branch Admin:
1. Login as `sthlm.admin@taklaget.se`
2. Navigate to "Översikt" (Dashboard)
3. **Expected**: See only Stockholm branch data
4. Navigate to "Användare" (Users)
5. **Expected**: See only Stockholm employees (Erik, Sofia)
6. Try to access other branches
7. **Expected**: Should not see Göteborg or Malmö data

### Test as Inspector:
1. Login as `erik.andersson@taklaget.se`
2. Navigate to "Översikt" (Dashboard)
3. **Expected**: See Stockholm branch reports
4. Navigate to "Schema" (Schedule)
5. **Expected**: See only appointments assigned to Erik
6. **Expected**: No "Ny bokning" button (can't create appointments)
7. **Expected**: Can click "Starta inspektion" to create reports

---

## 🎯 Expected User Count by Role

- **Superadmins**: 1 (admin@taklaget.onmicrosoft.com)
- **Branch Admins**: 3 (Stockholm, Göteborg, Malmö)
- **Inspectors**: 6 (2 Stockholm, 1 Göteborg, 3 Malmö)
- **Total Production Users**: 10

Any other accounts are test/development accounts and should be removed.

---

## 📝 Notes

- **Branch IDs are lowercase**: `stockholm`, `goteborg`, `malmo` (not `Stockholm`)
- **Roles are lowercase**: `superadmin`, `branchAdmin`, `inspector` (not `BranchAdmin`)
- **Permission levels are integers**: `0`, `1`, `2` (not strings)
- **Superadmin has NO branchId**: Field should be `null` or omitted entirely
- **All non-superadmin users MUST have a branchId**: Cannot be null or empty

---

This documentation should be used as the source of truth when auditing or fixing user permissions.

