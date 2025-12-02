# 🧪 QA Quick Reference Card

## **3 User Types for Testing**

### **1. 👑 SUPER ADMIN**
- **Email:** `admin@taklaget.onmicrosoft.com`
- **Password:** `[Your Microsoft 365 Password]`
- **Access:** Everything - users, branches, reports, analytics
- **Test:** Create users, manage branches, view all data

### **2. 🏢 BRANCH ADMIN** 
- **Email:** `admin@taklagetentreprenad.se`
- **Password:** `[Set in Firebase Console]`
- **Access:** Branch reports, team management, customers
- **Test:** Create inspectors, manage branch data only

### **3. 🔍 INSPECTOR**
- **Email:** `inspector@taklagetentreprenad.se`
- **Password:** `[Set in Firebase Console]`
- **Access:** Create/edit reports, view branch reports
- **Test:** Full report workflow, PDF generation, email sending

---

## **🚨 Critical Test Points**

### **Must Work:**
- ✅ Login for all 3 user types
- ✅ Role-based menu items
- ✅ Report creation and editing
- ✅ PDF generation and download
- ✅ Email sending and delivery
- ✅ Mobile responsiveness
- ✅ Data isolation (users only see their data)

### **Must NOT Work:**
- ❌ Inspectors accessing admin functions
- ❌ Branch admins seeing other branches
- ❌ Unauthorized data access

---

## **📱 Test Environment**
**URL:** https://taklaget-service-app.web.app

## **📋 Test Data Created**
- ✅ 3 test customers
- ✅ 2 test reports (draft + completed)
- ✅ User permissions configured

## **🔧 Setup Required**
1. Set passwords for test users in Firebase Console
2. Test login for each user type
3. Verify correct permissions and menu items

---

**Quick Test:** Try logging in with each user type and verify you see the correct menu items and data access levels.

