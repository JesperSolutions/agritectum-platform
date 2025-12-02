# Test Accounts Setup Guide

## Test Accounts to Create

Create the following test accounts for Agritectum Platform:

### 1. Super Admin
- **Email:** `admin@agritectum-platform.web.app`
- **Password:** `Test1234!`
- **Role:** `superadmin`
- **Permission Level:** `2`
- **Access:** Full system access - can manage everything

### 2. Branch Manager (Branch Admin)
- **Email:** `branch.manager@agritectum-platform.web.app`
- **Password:** `Test1234!`
- **Role:** `branchAdmin`
- **Permission Level:** `1`
- **Branch ID:** `main` (or create a branch first)
- **Access:** Branch-level management - can manage their branch

### 3. Roofer (Inspector)
- **Email:** `roofer@agritectum-platform.web.app`
- **Password:** `Test1234!`
- **Role:** `inspector`
- **Permission Level:** `0`
- **Branch ID:** `main` (or same branch as branch manager)
- **Access:** Field inspector - can create and edit reports

### 4. Customer User
- **Email:** `customer@agritectum-platform.web.app`
- **Password:** `Test1234!`
- **Role:** `customer`
- **Permission Level:** `-1`
- **Access:** Customer user - can view their buildings, offers, and agreements

## How to Create Accounts

### Option 1: Using Cloud Function (Recommended)

Use the deployed `createUserWithAuth` Cloud Function:

```bash
# For employees (superadmin, branchAdmin, inspector)
curl -X POST https://us-central1-agritectum-platform.cloudfunctions.net/createUserWithAuth \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@agritectum-platform.web.app",
    "password": "Test1234!",
    "displayName": "Super Admin",
    "role": "superadmin",
    "branchId": "",
    "isActive": true
  }'
```

### Option 2: Using Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/project/agritectum-platform/authentication/users)
2. Click "Add user"
3. Enter email and password
4. After creating, set custom claims using the `setUserClaimsHttp` function or via Admin SDK

### Option 3: Using the Script

1. Download service account key from Firebase Console
2. Save as `serviceAccountKey.json` in project root
3. Run:
   ```bash
   cd functions
   node ../scripts/setup/create-test-accounts.cjs
   ```

## Setting Custom Claims

After creating users, set custom claims:

```javascript
// For superadmin
{
  role: "superadmin",
  permissionLevel: 2,
  branchIds: []
}

// For branchAdmin
{
  role: "branchAdmin",
  permissionLevel: 1,
  branchId: "main", // or your branch ID
  branchIds: ["main"]
}

// For inspector
{
  role: "inspector",
  permissionLevel: 0,
  branchId: "main",
  branchIds: ["main"]
}

// For customer
{
  role: "customer",
  permissionLevel: -1,
  customerId: "<customer-document-id>"
}
```

## Login URLs

- **Production:** https://agritectum-platform.web.app/login
- **All accounts use password:** `Test1234!`

⚠️ **IMPORTANT:** Change passwords after first login!

