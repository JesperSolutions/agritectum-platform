# System Documentation Before Complete Reset

## 🚨 **CRITICAL ISSUE IDENTIFIED**

Super admin cannot see reports or users - only branches. Need complete database reset.

## 📋 **Current System Architecture**

### **User Roles & Permissions**

- **Super Admin** (permissionLevel: 2)
  - Should see ALL data across ALL branches
  - Can manage all users, branches, reports, customers
  - Global access to everything

- **Branch Admin** (permissionLevel: 1)
  - Can see data from their assigned branch only
  - Can manage users in their branch
  - Can see all reports from their branch
  - Can manage customers in their branch

- **Inspector** (permissionLevel: 0)
  - Can see ALL reports from their branch (for relating new reports to old ones)
  - Can create and edit their own reports
  - Can see customers from their branch

### **Database Collections Structure**

#### **Users Collection** (`/users/{userId}`)

```javascript
{
  uid: string,
  email: string,
  displayName: string,
  role: 'superadmin' | 'branchAdmin' | 'inspector',
  permissionLevel: 0 | 1 | 2,
  branchId: string | null, // null for superadmin
  isActive: boolean,
  createdAt: string,
  lastLogin: string
}
```

#### **Branches Collection** (`/branches/{branchId}`)

```javascript
{
  id: string, // 'stockholm', 'goteborg', 'malmo'
  name: string,
  address: string,
  phone: string,
  email: string,
  logoUrl: string,
  createdAt: string,
  updatedAt: string
}
```

#### **Reports Collection** (`/reports/{reportId}`)

```javascript
{
  id: string,
  createdBy: string, // user UID
  createdByName: string,
  branchId: string, // 'stockholm', 'goteborg', 'malmo'
  inspectionDate: string,
  customerName: string,
  customerAddress: string,
  customerPhone: string,
  customerEmail: string,
  roofType: string,
  roofAge: number,
  conditionNotes: string,
  issuesFound: Array,
  recommendedActions: Array,
  status: 'draft' | 'completed' | 'sent' | 'archived',
  createdAt: string,
  lastEdited: string,
  isShared: boolean,
  pdfLink: string,
  images: Array,
  weatherConditions: string
}
```

#### **Customers Collection** (`/customers/{customerId}`)

```javascript
{
  id: string,
  customerName: string,
  customerAddress: string,
  customerPhone: string,
  customerEmail: string,
  branchId: string,
  createdBy: string,
  createdAt: string,
  updatedAt: string
}
```

### **Firestore Rules (CORRECT VERSION)**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function getPermissionLevel() {
      return request.auth.token.permissionLevel;
    }

    function getUserBranchId() {
      return request.auth.token.branchId;
    }

    function isSuperadmin() {
      return isAuthenticated() && getPermissionLevel() >= 2;
    }

    function isBranchAdmin() {
      return isAuthenticated() && getPermissionLevel() >= 1;
    }

    function isInspector() {
      return isAuthenticated() && getPermissionLevel() >= 0;
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated() && (
        request.auth.uid == userId ||
        isSuperadmin() ||
        (isBranchAdmin() && resource.data.branchId == getUserBranchId())
      );
      allow write: if isAuthenticated() && (
        isSuperadmin() ||
        (isBranchAdmin() && resource.data.branchId == getUserBranchId())
      );
    }

    // Branches collection
    match /branches/{branchId} {
      allow read: if isAuthenticated() && (
        isSuperadmin() ||
        (isBranchAdmin() && getUserBranchId() == branchId) ||
        (isInspector() && getUserBranchId() == branchId)
      );
      allow write: if isSuperadmin();
    }

    // Reports collection
    match /reports/{reportId} {
      allow read: if isAuthenticated() && (
        isSuperadmin() ||
        (isBranchAdmin() && resource.data.branchId == getUserBranchId()) ||
        (isInspector() && resource.data.branchId == getUserBranchId())
      );
      allow create: if isAuthenticated() &&
        request.resource.data.createdBy == request.auth.uid;
      allow update: if isAuthenticated() && (
        isSuperadmin() ||
        (isBranchAdmin() && resource.data.branchId == getUserBranchId()) ||
        (isInspector() && resource.data.createdBy == request.auth.uid && resource.data.branchId == getUserBranchId())
      );
      allow delete: if isAuthenticated() && (
        isSuperadmin() ||
        (isBranchAdmin() && resource.data.branchId == getUserBranchId())
      );
    }

    // Customers collection
    match /customers/{customerId} {
      allow read: if isAuthenticated() && (
        isSuperadmin() ||
        (isBranchAdmin() && resource.data.branchId == getUserBranchId()) ||
        (isInspector() && resource.data.branchId == getUserBranchId())
      );
      allow create: if isAuthenticated() &&
        request.resource.data.createdBy == request.auth.uid;
      allow update: if isAuthenticated() && (
        isSuperadmin() ||
        (isBranchAdmin() && resource.data.branchId == getUserBranchId()) ||
        (isInspector() && resource.data.branchId == getUserBranchId())
      );
      allow delete: if isAuthenticated() && (
        isSuperadmin() ||
        (isBranchAdmin() && resource.data.branchId == getUserBranchId())
      );
    }
  }
}
```

### **Required Test Data**

#### **Branches**

- Stockholm Branch (id: 'stockholm')
- Göteborg Branch (id: 'goteborg')
- Malmö Branch (id: 'malmo')

#### **Users**

- Super Admin: admin.sys@taklaget.se (permissionLevel: 2, branchId: null)
- Stockholm Manager: sthlm.admin@taklaget.se (permissionLevel: 1, branchId: 'stockholm')
- Göteborg Manager: goteborg.manager@taklaget.se (permissionLevel: 1, branchId: 'goteborg')
- Malmö Manager: malmo.manager@taklaget.se (permissionLevel: 1, branchId: 'malmo')
- Stockholm Inspectors: erik.andersson@taklaget.se, sofia.johansson@taklaget.se (permissionLevel: 0, branchId: 'stockholm')
- Göteborg Inspectors: lars.larsson@taklaget.se, petra.petersson@taklaget.se (permissionLevel: 0, branchId: 'goteborg')
- Malmö Inspectors: anders.andersson@taklaget.se, karin.karlsson@taklaget.se (permissionLevel: 0, branchId: 'malmo')

#### **Sample Reports** (2-3 per branch)

- Mix of draft, completed, sent statuses
- Different customers per branch
- Various roof types and issues

#### **Sample Customers** (3-4 per branch)

- Different customers per branch
- Proper branchId assignment

### **Key Features to Implement**

1. **Super Admin Dashboard**
   - See all users across all branches
   - See all reports across all branches
   - See all customers across all branches
   - Manage branches, users, and system settings

2. **Branch Manager Dashboard**
   - See users in their branch only
   - See all reports from their branch
   - See customers in their branch
   - Create new inspector users

3. **Inspector Dashboard**
   - See all reports from their branch (for reference)
   - Create new reports
   - Edit their own reports
   - Search through branch reports

4. **Report Creation**
   - 4-step wizard
   - Date handling without timezone issues
   - Image upload support
   - Issue and recommendation management

5. **Search & Filtering**
   - Search by customer name, email, address
   - Filter by status, date, branch
   - Sort by various criteria

### **Critical Issues to Avoid**

1. **Super Admin Access**: Must be able to see ALL data
2. **Branch Isolation**: Branch admins and inspectors only see their branch data
3. **Inspector Report Access**: Can see all branch reports (not just their own)
4. **Date Handling**: No timezone offset issues
5. **Permission Consistency**: Rules must match application logic

### **Files to Preserve**

- `src/config/firebase.ts` - Firebase configuration
- `src/types/index.ts` - Type definitions
- `src/contexts/AuthContext.tsx` - Authentication logic
- `src/services/reportService.ts` - Report service (with inspector access fix)
- `src/components/ReportForm.tsx` - Report form with date fixes
- `src/components/Layout.tsx` - Navigation with role filtering
- `src/Router.tsx` - Route protection

### **Files to Reset**

- All Firestore data
- All Firebase Storage data
- User custom claims
- Database indexes

This documentation will be used to rebuild the system correctly from scratch.
