# Git History Cleanup Plan

## ⚠️ **IMPORTANT - READ BEFORE PROCEEDING**

This will **rewrite git history** to remove sensitive files from ALL commits.

### **What Will Be Removed:**
1. `taklaget-service-app-firebase-adminsdk-fbsvc-0fd3c304a5.json` (service account key)
2. `extensions/firestore-send-email-tyk0.env` (SMTP credentials)
3. `extensions/firestore-send-email.env` (SMTP credentials)

### **Consequences:**
- ✅ Credentials removed from entire git history
- ⚠️ All commit hashes will change
- ⚠️ Anyone who has cloned the repo needs to re-clone
- ⚠️ Force push required

### **Safety:**
- ✅ Your code and commits remain intact
- ✅ Only the 3 files are removed
- ✅ Branch structure preserved
- ✅ Can backup first

---

## 📋 **Steps I'll Execute:**

1. Create backup branch
2. Remove sensitive files from history
3. Force push will be YOUR decision after verification

---

**Ready to proceed?** The commands are safe and tested.

