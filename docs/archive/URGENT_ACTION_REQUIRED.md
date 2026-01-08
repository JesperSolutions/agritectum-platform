# ⚠️ URGENT ACTION REQUIRED

## Critical Issue: Branch Admin Access Blocked

**Status**: 🔴 **CRITICAL** - Branch admins cannot access any data

**Affected Users**:
- Linus Hollberg (linus.hollberg@taklagetentreprenad.se)
- Bengt Widstrand (Bengt.widstrand@binne.se)
- Magnus Eriksson (Magnus.eriksson@binne.se)

---

## What's Wrong?

Branch admin users can log in, but they get **"Missing or insufficient permissions"** errors when trying to access:
- Dashboard
- Reports
- Users
- Customers
- Schedule
- Analytics

**Root Cause**: Their Firebase Authentication JWT tokens don't have custom claims (`branchId`, `permissionLevel`).

---

## How to Fix (5 minutes)

### Step 1: Download Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/project/taklaget-service-app/settings/serviceaccounts/adminsdk)
2. Click "Generate new private key"
3. Save the file as `taklaget-service-app-firebase-adminsdk-fbsvc-0fd3c304a5.json` in the project root

### Step 2: Run the Script

```bash
node scripts/set-branch-admin-claims.cjs
```

When prompted, type `yes` to confirm.

### Step 3: Test

1. Log out from the app
2. Log in with a branch admin account
3. Try accessing Dashboard, Reports, etc.
4. Everything should work! ✅

---

## What the Script Does

1. Connects to production Firebase using your service account key
2. Finds each branch admin user by email
3. Sets their custom claims:
   - `role`: "branchAdmin"
   - `permissionLevel`: 1
   - `branchId`: Their branch ID
4. Updates their Firestore user document

---

## After Running the Script

✅ **Completed Fixes**:
- Custom claims set for all branch admins
- 150+ Swedish translations added
- All major localization issues fixed

⏳ **Next Steps** (Plan D):
1. ✅ Fix critical custom claims issue (YOU ARE HERE)
2. Finish remaining QA fixes (6 pending)
3. Plan new features (offer flow, pricing, reminders, etc.)

---

## Need Help?

See `docs/CUSTOM_CLAIMS_EXPLAINED.md` for detailed explanation of:
- What custom claims are
- Why they're needed
- How they work
- Troubleshooting

---

## Security Note

⚠️ **IMPORTANT**: The service account key file gives full admin access to your Firebase project!

- ✅ File is already in `.gitignore`
- ✅ Never commit it to Git
- ✅ Never share it publicly
- ✅ Delete it after running the script (optional)

---

## Quick Reference

**Script location**: `scripts/set-branch-admin-claims.cjs`

**Documentation**:
- `docs/CUSTOM_CLAIMS_EXPLAINED.md` - Full explanation
- `docs/QA_FIXES_IMPLEMENTED.md` - All fixes completed so far
- `docs/ISSUES_FOUND_DURING_FIX.md` - Issues discovered

**Support**: If you have questions, check the documentation above or ask! 🙋‍♂️

