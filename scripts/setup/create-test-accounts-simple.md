# Create Test Accounts for Agritectum Platform

## Option 1: Using Cloud Functions (Recommended)

You can create test accounts using the deployed Cloud Functions via the Firebase Console or by calling the functions directly.

### Accounts to Create:

1. **Super Admin**
   - Email: `admin@agritectum-platform.web.app`
   - Password: `Test1234!`
   - Role: `superadmin`

2. **Branch Manager**
   - Email: `branch.manager@agritectum-platform.web.app`
   - Password: `Test1234!`
   - Role: `branchAdmin`

3. **Roofer (Inspector)**
   - Email: `roofer@agritectum-platform.web.app`
   - Password: `Test1234!`
   - Role: `inspector`

4. **Customer User**
   - Email: `customer@agritectum-platform.web.app`
   - Password: `Test1234!`
   - Role: `customer`

## Option 2: Using Firebase Console

1. Go to Firebase Console > Authentication > Users
2. Click "Add user" for each account
3. Set custom claims via Cloud Function `setUserClaimsHttp` or use the script below

## Option 3: Using the Script (Requires Service Account)

If you have a service account key file:

```bash
# Place serviceAccountKey.json in project root
# Then run:
cd functions
node ../scripts/setup/create-test-accounts.cjs
```

