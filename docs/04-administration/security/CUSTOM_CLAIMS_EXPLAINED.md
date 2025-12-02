# Custom Claims Explained

## What Are Custom Claims?

Custom claims are **metadata stored in Firebase Authentication JWT tokens**. They're used to store user roles, permissions, and other authorization data.

### Key Points:
- ✅ Stored in the **JWT token** (not in Firestore)
- ✅ Automatically included in **every request**
- ✅ Checked by **Firestore Security Rules**
- ✅ **Must be set using Firebase Admin SDK** (not client SDK)

---

## The Problem

When you create a user in Firebase Authentication, they get a JWT token with **no custom claims**. The Firestore security rules check for custom claims like:

```javascript
function isBranchAdmin() {
  return isAuthenticated() && getPermissionLevel() >= 1;
}

function getUserBranchId() {
  return request.auth.token.branchId; // ← This is undefined!
}
```

If `branchId` is undefined, **all Firestore queries fail** with "Missing or insufficient permissions".

---

## The Solution

You need to **set custom claims** for each user after they're created. This can only be done with the **Firebase Admin SDK**.

---

## How to Set Custom Claims

### Option 1: Using the Script (Recommended)

We've created a script that sets custom claims for your branch admin users:

```bash
node scripts/set-branch-admin-claims.cjs
```

**What it does:**
1. Connects to **production Firebase** using your service account key
2. Finds each branch admin user by email
3. Sets their custom claims (`role`, `permissionLevel`, `branchId`)
4. Updates their Firestore user document

**Prerequisites:**
- **Service account key file** (download from Firebase Console)
- Node.js installed

**How to get the service account key:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `taklaget-service-app`
3. Click ⚙️ (Settings) → Project settings
4. Go to "Service accounts" tab
5. Click "Generate new private key"
6. Save the file as `taklaget-service-app-firebase-adminsdk-fbsvc-0fd3c304a5.json` in the project root
7. **IMPORTANT**: Add this file to `.gitignore` (already done)

---

### Option 2: Using Cloud Function (For Future Use)

We've also created a Cloud Function that allows setting custom claims via HTTP:

**Deploy the function:**
```bash
cd functions
npm install
firebase deploy --only functions
```

**Call the function:**
```bash
curl -X POST https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/setUserClaimsHttp \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "USER_UID",
    "claims": {
      "role": "branchAdmin",
      "permissionLevel": 1,
      "branchId": "BRANCH_ID"
    }
  }'
```

---

## About users.json

### What is it?

`users.json` is a **Firebase Auth Emulator** configuration file. It's **ONLY used for local development**, not production!

### Why did we modify it?

We initially thought you were using the emulator, but you're actually using **production Firebase**. The `users.json` changes **won't help** because they're not used in production.

### Should we delete it?

No! It's still useful for:
- Local development
- Testing
- CI/CD pipelines

---

## Current Status

### ✅ What's Fixed

1. **Cloud Function created**: `setUserClaims` and `setUserClaimsHttp`
2. **Script created**: `set-branch-admin-claims.js`
3. **Documentation**: This file!

### ⏳ What Needs to Happen

1. **Run the script** to set custom claims for branch admin users:
   ```bash
   node scripts/set-branch-admin-claims.js
   ```

2. **Deploy the Cloud Function** (optional, for future use):
   ```bash
   cd functions
   npm install
   firebase deploy --only functions
   ```

3. **Test** with branch admin accounts:
   - Linus Hollberg
   - Bengt Widstrand
   - Magnus Eriksson

---

## Branch Admin Users

| Name | Email | Branch ID | Status |
|------|-------|-----------|--------|
| Linus Hollberg | linus.hollberg@taklagetentreprenad.se | jYPEEhrb7iNGqumvV80L | ⏳ Needs custom claims |
| Bengt Widstrand | Bengt.widstrand@binne.se | bengt-branch-id* | ⏳ Needs custom claims |
| Magnus Eriksson | Magnus.eriksson@binne.se | jYPEEhrb7iNGqumvV80L | ⏳ Needs custom claims |

*Note: Bengt's branch ID needs to be updated with the actual branch ID.

---

## Testing

After running the script, test with:

1. **Log out** from the app
2. **Log in** with a branch admin account
3. **Check the console** - you should see:
   ```
   🔍 ReportContext Debug - User details:
     - UID: ...
     - Email: ...
     - Role: branchAdmin
     - Permission Level: 1
     - Branch ID: jYPEEhrb7iNGqumvV80L
   ```
4. **Try accessing**:
   - Dashboard
   - Reports
   - Users
   - Customers
   - Schedule

All should work without "Missing or insufficient permissions" errors!

---

## Common Issues

### Issue: "Missing or insufficient permissions"

**Cause**: Custom claims not set or user needs to log out and log back in.

**Solution**:
1. Run the script to set custom claims
2. Log out and log back in
3. The new JWT token will include the custom claims

### Issue: "User not found"

**Cause**: User doesn't exist in Firebase Authentication.

**Solution**:
1. Create the user in Firebase Console
2. Run the script again

### Issue: "Permission denied"

**Cause**: Service account key doesn't have permission.

**Solution**:
1. Check that the service account has "Firebase Admin" role
2. Regenerate the service account key if needed

---

## Future Improvements

### Automatic Custom Claims on User Creation

Create a Cloud Function that automatically sets custom claims when a user is created:

```typescript
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  // Set default custom claims based on user data
  await admin.auth().setCustomUserClaims(user.uid, {
    role: 'inspector',
    permissionLevel: 0,
  });
});
```

### User Management UI

Create a UI in the admin panel to set custom claims without writing code.

---

## Summary

**The Problem**: Branch admin users can't access data because their JWT tokens don't have custom claims.

**The Solution**: Run the script to set custom claims for all branch admin users.

**Next Steps**:
1. Run: `node scripts/set-branch-admin-claims.js`
2. Test with branch admin accounts
3. Celebrate! 🎉

---

## Questions?

If you have questions about custom claims, JWT tokens, or Firebase Authentication, check out:
- [Firebase Custom Claims Documentation](https://firebase.google.com/docs/auth/admin/custom-claims)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

