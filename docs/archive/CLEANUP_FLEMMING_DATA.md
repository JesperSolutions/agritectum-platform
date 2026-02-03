# Cleanup Flemming's Test Data - Instructions

## Quick Summary

This will **permanently delete** all data created by Flemming (flemming.adolfsen@agritectum.dk):

- ✗ All buildings he created
- ✗ All customers he created
- ✗ All reports he created

After cleanup, you can recreate the data with proper customer linking.

---

## Option 1: Browser Console (Easiest) ✨

1. **Log in to Firebase Console**
   - Go to: https://console.firebase.google.com
   - Select project: `agritectum-platform`

2. **Open Firestore Database**
   - Navigate to: Firestore Database

3. **Open Browser Console**
   - Press `F12` to open Developer Tools
   - Click "Console" tab

4. **Copy and Paste this code:**

   ```javascript
   const flemmingEmail = 'flemming.adolfsen@agritectum.dk';
   async function cleanupFlemmingData() {
     const db = firebase.firestore();
     if (!confirm(`⚠️ DELETE all data by ${flemmingEmail}?`)) return;

     let count = 0;

     // Delete buildings
     const b = await db.collection('buildings').where('createdBy', '==', flemmingEmail).get();
     for (const doc of b.docs) {
       await doc.ref.delete();
       count++;
     }

     // Delete customers
     const c = await db.collection('customers').where('createdBy', '==', flemmingEmail).get();
     for (const doc of c.docs) {
       await doc.ref.delete();
       count++;
     }

     // Delete reports
     const r = await db.collection('reports').where('createdBy', '==', flemmingEmail).get();
     for (const doc of r.docs) {
       await doc.ref.delete();
       count++;
     }

     console.log(`✅ Deleted ${count} documents`);
   }
   cleanupFlemmingData();
   ```

5. **Press Enter**
   - A confirmation dialog will appear
   - Click "OK" to confirm deletion
   - Watch the console for progress

6. **Done!** ✨
   - You'll see `✅ Deleted X documents`

---

## Option 2: Node.js Script (More Control)

If you prefer to run locally:

1. **Navigate to project**

   ```bash
   cd f:\GitHub\agritectum-platform
   ```

2. **Run cleanup script**

   ```bash
   node scripts/cleanupFlemmingData.cjs
   ```

3. **Confirm when prompted**
   - Type `yes` and press Enter
   - Wait for completion

4. **Results displayed**
   - Summary of deleted items

---

## Option 3: Manual Deletion via Console

If you prefer to delete specific items manually:

1. **Go to Firestore Console**
   - Buildings: Filter by `createdBy == "flemming.adolfsen@agritectum.dk"` and delete
   - Customers: Same filter and delete
   - Reports: Same filter and delete

---

## ⚠️ Important Notes

- **This cannot be undone** - Data will be permanently deleted
- **Make sure** you're deleting the right user (flemming.adolfsen@agritectum.dk)
- **Check carefully** before confirming
- **Backups** - Firebase has no automatic backup, so be absolutely sure

---

## After Cleanup ✨

Once deleted, you can:

1. **Create new buildings** with proper customer linking:
   - Make sure to set `customerId` or `companyId` when creating
   - This links buildings to customers

2. **Create new customers**
   - Link them to the correct branch

3. **Create reports** with the buildings properly linked

---

## Need Help?

If something goes wrong:

- Check the console for error messages
- Make sure you're authenticated with the right account
- Verify the email: `flemming.adolfsen@agritectum.dk`
- Contact support if you accidentally deleted too much

---

**Recommended**: Use **Option 1 (Browser Console)** - it's fastest and safest with built-in confirmation dialog.
