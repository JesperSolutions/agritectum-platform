# QA Testing Guide - Taklaget Service App

## 🧪 **3 User Types for Comprehensive Testing**

### **1. 👑 SUPER ADMIN** 
**Account:** `admin@taklaget.onmicrosoft.com`  
**Password:** `[Your Microsoft 365 Password]`  
**Role:** Full system access

#### **Test Scenarios:**
- ✅ **User Management** - Create, edit, delete users across all branches
- ✅ **Branch Management** - Add/edit branches, assign admins
- ✅ **System Analytics** - View comprehensive dashboards
- ✅ **All Reports** - Access every report in the system
- ✅ **Email Testing** - Send test emails via Admin Testing page
- ✅ **Customer Management** - Full CRUD operations
- ✅ **Settings Access** - All configuration options

#### **Critical Tests:**
1. **Create New Branch Admin** - Test user creation workflow
2. **Assign Permissions** - Verify role-based access control
3. **System Monitoring** - Check analytics and reporting
4. **Email System** - Test all email templates and delivery

---

### **2. 🏢 BRANCH ADMIN** 
**Account:** `admin@taklagetentreprenad.se`  
**Password:** `[Set during setup]`  
**Role:** Branch-specific management

#### **Test Scenarios:**
- ✅ **Branch Reports** - View/edit reports for their branch only
- ✅ **Team Management** - Manage inspectors in their branch
- ✅ **Customer Management** - Add/edit customers for their branch
- ✅ **Email Testing** - Send test emails for their branch
- ✅ **Limited Analytics** - Branch-specific metrics only
- ❌ **No Super Admin Access** - Cannot access user management
- ❌ **No Cross-Branch Access** - Cannot see other branches' data

#### **Critical Tests:**
1. **Create Inspector** - Add new team members
2. **Generate Report** - Complete report workflow
3. **Email Reports** - Send reports to customers
4. **Data Isolation** - Verify branch-specific data access

---

### **3. 🔍 INSPECTOR** 
**Account:** `inspector@taklagetentreprenad.se`  
**Password:** `[Set during setup]`  
**Role:** Report creation and basic operations

#### **Test Scenarios:**
- ✅ **Create Reports** - Full report creation workflow
- ✅ **Edit Own Reports** - Modify reports they created
- ✅ **View Branch Reports** - See all reports from their branch
- ✅ **Customer Lookup** - Search existing customers
- ✅ **PDF Export** - Generate and download PDFs
- ❌ **No User Management** - Cannot create/edit users
- ❌ **No Branch Management** - Cannot modify branch settings
- ❌ **No Analytics** - Cannot access admin dashboards

#### **Critical Tests:**
1. **Complete Report** - Full inspection workflow
2. **Image Upload** - Test photo attachment system
3. **PDF Generation** - Verify PDF export functionality
4. **Email Sending** - Send reports to customers

---

## 🎯 **Testing Workflow**

### **Phase 1: Authentication & Access Control**
1. **Login Test** - Verify each user can log in
2. **Role Verification** - Confirm correct permissions
3. **Navigation Test** - Check menu items match role
4. **Data Isolation** - Verify users only see appropriate data

### **Phase 2: Core Functionality**
1. **Report Creation** - Full workflow from start to finish
2. **PDF Generation** - Test all PDF export options
3. **Email System** - Send test emails to real addresses
4. **Image Upload** - Test photo attachment system

### **Phase 3: Advanced Features**
1. **Search & Filter** - Test all search functionality
2. **Offline Mode** - Test PWA offline capabilities
3. **Mobile Responsiveness** - Test on mobile devices
4. **Performance** - Check loading times and responsiveness

---

## 📋 **Test Data Requirements**

### **Sample Customers:**
- **Test Customer 1:** `test.customer1@example.com`
- **Test Customer 2:** `test.customer2@example.com`
- **Test Customer 3:** `test.customer3@example.com`

### **Sample Reports:**
- **Draft Report** - For testing edit functionality
- **Completed Report** - For testing PDF generation
- **Report with Images** - For testing photo uploads

### **Test Email Addresses:**
- **Primary Test:** `test@taklaget.app`
- **Secondary Test:** `qa@taklaget.app`
- **Customer Test:** `customer@example.com`

---

## 🚨 **Critical Test Points**

### **Must Work:**
- ✅ User authentication and role-based access
- ✅ Report creation and editing
- ✅ PDF generation and download
- ✅ Email sending and delivery
- ✅ Image upload and storage
- ✅ Mobile responsiveness
- ✅ Offline functionality

### **Must NOT Work:**
- ❌ Inspectors accessing admin functions
- ❌ Branch admins seeing other branches' data
- ❌ Unauthorized data access
- ❌ Broken PDF generation
- ❌ Failed email delivery

---

## 📱 **Device Testing**

### **Desktop:**
- Chrome (latest)
- Firefox (latest)
- Edge (latest)
- Safari (latest)

### **Mobile:**
- iOS Safari
- Android Chrome
- PWA installation test

### **Tablet:**
- iPad Safari
- Android Chrome
- Responsive design verification

---

## 🔧 **Setup Instructions**

### **1. Create Test Users:**
```bash
# Run the setup script
node scripts/setup-production-branches.cjs
```

### **2. Set Passwords:**
- Use Firebase Console to set initial passwords
- Or use password reset functionality

### **3. Verify Access:**
- Test login for each user type
- Verify correct permissions
- Check data isolation

---

## 📊 **Success Criteria**

### **✅ All Tests Pass:**
- 100% login success rate
- 0 unauthorized access attempts
- All PDFs generate correctly
- All emails deliver successfully
- Mobile experience is smooth
- Offline mode works properly

### **❌ Failure Indicators:**
- Login failures
- Permission errors
- PDF generation errors
- Email delivery failures
- Mobile layout breaks
- Offline mode doesn't work

---

## 🎯 **Quick Test Checklist**

- [ ] Super Admin can access all features
- [ ] Branch Admin can only access their branch
- [ ] Inspector can only create/edit reports
- [ ] PDF generation works for all report types
- [ ] Email sending works for all user types
- [ ] Mobile experience is smooth
- [ ] Offline mode functions properly
- [ ] No data leakage between branches
- [ ] All buttons and forms work correctly
- [ ] Error handling is user-friendly

---

**Last Updated:** January 2025  
**Version:** 1.2.0  
**QA Specialist:** [Your Name]  
**Test Environment:** https://taklaget-service-app.web.app

