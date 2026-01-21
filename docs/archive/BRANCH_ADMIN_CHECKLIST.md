# Branch Admin Verification Checklist

**Date:** ******\_\_\_******  
**Verified By:** ******\_\_\_******  
**Environment:** [ ] Development [ ] Staging [ ] Production

---

## Quick Verification (5 minutes)

### Step 1: Check Branches ✅

**Firebase Console > Firestore > branches collection**

| Branch Name           | Branch ID              | Active | Email               | Phone           |
| --------------------- | ---------------------- | ------ | ------------------- | --------------- |
| Taklaget Småland      | `jYPEEhrb7iNGqumvV80L` | ☐      | smaland@taklaget.se | +46 470 123 456 |
| Taklaget Binne        | ******\_******         | ☐      | ******\_******      | ******\_******  |
| Other: ******\_****** | ******\_******         | ☐      | ******\_******      | ******\_******  |

**Issues Found:** ****************\_****************

---

### Step 2: Check Branch Admins ✅

**Firebase Console > Firestore > users collection**
**Filter:** `role == "branchAdmin"`

#### Admin 1: Linus Hollberg

**Firestore User Document:**

- [ ] Email: `linus.hollberg@taklagetentreprenad.se`
- [ ] Role: `branchAdmin`
- [ ] Permission Level: `1`
- [ ] Branch ID: `jYPEEhrb7iNGqumvV80L`
- [ ] Display Name: `Linus Hollberg`

**Firebase Auth:**

- [ ] User exists in Authentication
- [ ] Custom Claims present
  - [ ] role: `branchAdmin`
  - [ ] permissionLevel: `1`
  - [ ] branchId: `jYPEEhrb7iNGqumvV80L`

**Issues:** ****************\_****************

---

#### Admin 2: Bengt Widstrand

**Firestore User Document:**

- [ ] Email: `Bengt.widstrand@binne.se`
- [ ] Role: `branchAdmin`
- [ ] Permission Level: `1`
- [ ] Branch ID: ******\_******
- [ ] Display Name: `Bengt Widstrand`

**Firebase Auth:**

- [ ] User exists in Authentication
- [ ] Custom Claims present
  - [ ] role: `branchAdmin`
  - [ ] permissionLevel: `1`
  - [ ] branchId: ******\_******

**Issues:** ****************\_****************

---

#### Admin 3: Magnus Eriksson

**Firestore User Document:**

- [ ] Email: `Magnus.eriksson@binne.se`
- [ ] Role: `branchAdmin`
- [ ] Permission Level: `1`
- [ ] Branch ID: `jYPEEhrb7iNGqumvV80L`
- [ ] Display Name: `Magnus Eriksson`

**Firebase Auth:**

- [ ] User exists in Authentication
- [ ] Custom Claims present
  - [ ] role: `branchAdmin`
  - [ ] permissionLevel: `1`
  - [ ] branchId: `jYPEEhrb7iNGqumvV80L`

**Issues:** ****************\_****************

---

### Step 3: Test Access ✅

For each branch admin, test the following:

**Login Test:**

- [ ] Can log in successfully
- [ ] No authentication errors
- [ ] Session persists

**Data Access:**

- [ ] Sees only their branch data
- [ ] Cannot access other branches
- [ ] Dashboard shows correct branch

**User Management:**

- [ ] Can view users in their branch
- [ ] Can add new users to their branch
- [ ] Cannot access users from other branches

**Report Management:**

- [ ] Can view reports from their branch
- [ ] Can create/edit reports
- [ ] Cannot access reports from other branches

**Issues Found:** ****************\_****************

---

## Common Issues & Fixes

### Issue 1: User Cannot Log In

**Symptoms:**

- Authentication fails
- "User not found" error
- Permission denied errors

**Possible Causes:**

- User doesn't exist in Firebase Auth
- Email mismatch
- Account disabled

**Fix:**

1. Check Firebase Auth > Users
2. Verify user exists
3. Check if account is disabled
4. Reset password if needed

---

### Issue 2: User Sees All Branches

**Symptoms:**

- User can access all branches
- No branch filtering
- Sees data from all branches

**Possible Causes:**

- Role is `superadmin` instead of `branchAdmin`
- Permission level is 2 instead of 1
- Custom claims not set

**Fix:**

1. Run: `node scripts/setup/set-branch-admin-claims.cjs`
2. Update user role to `branchAdmin`
3. Set permission level to `1`
4. Ask user to log out and back in

---

### Issue 3: User Cannot Manage Users

**Symptoms:**

- Cannot access user management
- "Access denied" errors
- User management page not visible

**Possible Causes:**

- Permission level too low
- Role is `inspector` instead of `branchAdmin`
- Frontend permission check failing

**Fix:**

1. Verify role is `branchAdmin`
2. Verify permission level is `1`
3. Check Firestore rules
4. Clear browser cache

---

### Issue 4: Branch ID Mismatch

**Symptoms:**

- User assigned to wrong branch
- User sees wrong data
- Branch information incorrect

**Possible Causes:**

- Branch ID in custom claims doesn't match Firestore
- Branch ID is incorrect
- Branch doesn't exist

**Fix:**

1. Verify correct branch ID
2. Update custom claims with correct branch ID
3. Update Firestore user document
4. Ask user to log out and back in

---

## Action Items

### Critical (Fix Immediately)

- [ ] ***
- [ ] ***
- [ ] ***

### High Priority (Fix This Week)

- [ ] ***
- [ ] ***
- [ ] ***

### Medium Priority (Fix This Month)

- [ ] ***
- [ ] ***
- [ ] ***

---

## Verification Summary

**Total Branches Checked:** **\_**  
**Total Branch Admins Checked:** **\_**  
**Issues Found:** **\_**  
**Issues Fixed:** **\_**  
**Status:** [ ] All Clear [ ] Issues Found [ ] Needs Attention

**Notes:**

---

---

---

---

## Sign-Off

**Verified By:** ******\_\_\_\_******  
**Date:** ******\_\_\_\_******  
**Next Review:** ******\_\_\_\_******

---

## Related Documentation

- **Verification Guide:** `BRANCH_ADMIN_VERIFICATION_GUIDE.md`
- **Permission System:** `PERMISSION_SYSTEM.md`
- **Custom Claims:** `../security/CUSTOM_CLAIMS_EXPLAINED.md`
- **Setup Guide:** `../../01-getting-started/FIREBASE_SETUP.md`

---

_Last updated: January 2025_
