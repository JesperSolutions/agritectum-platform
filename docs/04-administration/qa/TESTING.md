# QA Testing Guide

Complete quality assurance testing reference for Agritectum Platform.

## Table of Contents

1. [Test Environment Setup](#test-environment-setup)
2. [Test User Accounts](#test-user-accounts)
3. [Testing Workflows](#testing-workflows)
4. [Critical Test Points](#critical-test-points)
5. [Fixes Tracking](#fixes-tracking)

---

## Test Environment Setup

### Prerequisites

- Firebase test project configured
- Test users created in Firebase Auth
- Test data seeded
- Environment variables set

### Quick Start

```bash
# Install dependencies
npm install

# Start emulators (if using local testing)
npm run emulators

# Run dev server
npm run dev

# Build for production test
npm run build:test
```

---

## Test User Accounts

### 1. Superadmin (Full System Access)

**Account:** `admin@agritectum.app`  
**Role:** Full system administration  
**Access Level:** 2

**Test Scenarios:**

- ✅ User Management - Create, edit, delete users across all branches
- ✅ Branch Management - Add/edit branches, assign admins
- ✅ System Analytics - View comprehensive dashboards
- ✅ All Reports - Access every report in the system
- ✅ Email Testing - Send test emails via admin panel
- ✅ Customer Management - Full CRUD operations
- ✅ Settings Access - All configuration options

**Critical Tests:**

1. Create new branch admin
2. Assign permissions to users
3. Monitor system analytics
4. Test all email templates
5. Create and delete branches

---

### 2. Branch Admin (Branch-Level Management)

**Account:** `admin@branch.local`  
**Role:** Branch administrator  
**Access Level:** 1

**Test Scenarios:**

- ✅ Branch Reports - View/edit reports for their branch only
- ✅ Team Management - Manage inspectors in their branch
- ✅ Customer Management - Add/edit customers for their branch
- ✅ Email Testing - Send test emails for their branch
- ✅ Branch Analytics - Branch-specific metrics only
- ❌ No System User Management
- ❌ No Cross-Branch Access

**Critical Tests:**

1. Create new inspector account
2. Generate complete report workflow
3. Email reports to customers
4. Verify data isolation (can't see other branches)
5. Manage appointments

---

### 3. Inspector (Field Operations)

**Account:** `inspector@branch.local`  
**Role:** Field inspector  
**Access Level:** 0

**Test Scenarios:**

- ✅ Create Reports - Full report creation workflow
- ✅ Edit Own Reports - Modify reports they created
- ✅ View Branch Reports - See all reports from their branch
- ✅ Customer Lookup - Search existing customers
- ✅ PDF Export - Generate and download PDFs
- ❌ No User Management
- ❌ No Branch Management
- ❌ No Analytics Access

**Critical Tests:**

1. Complete full inspection workflow
2. Upload inspection photos
3. Generate PDF reports
4. Send reports to customers
5. View appointment schedule

---

## Testing Workflows

### Phase 1: Authentication & Access Control

**Duration:** ~15 minutes

1. **Login Test**
   - [ ] Superadmin can login
   - [ ] Branch admin can login
   - [ ] Inspector can login
   - [ ] Invalid credentials rejected

2. **Role Verification**
   - [ ] Superadmin sees all menu items
   - [ ] Branch admin sees branch-level menu
   - [ ] Inspector sees report-only menu
   - [ ] Correct dashboards load

3. **Navigation Test**
   - [ ] All visible links work
   - [ ] No broken navigation
   - [ ] Mobile menu responsive
   - [ ] Breadcrumbs accurate

4. **Data Isolation**
   - [ ] Inspectors only see their branch
   - [ ] Branch admins only see their branch
   - [ ] Superadmin sees all branches
   - [ ] Cross-branch access blocked

---

### Phase 2: Core Functionality

**Duration:** ~45 minutes

1. **Report Creation**
   - [ ] New report form displays
   - [ ] All fields present and functional
   - [ ] Validation works correctly
   - [ ] Report saves successfully

2. **Customer Management**
   - [ ] Add new customer
   - [ ] Edit existing customer
   - [ ] Delete customer (if allowed)
   - [ ] Search/filter customers

3. **Report Editing**
   - [ ] Open existing report
   - [ ] Edit report details
   - [ ] Add/remove items
   - [ ] Save changes

4. **PDF Generation**
   - [ ] Generate PDF
   - [ ] PDF contains correct data
   - [ ] Formatting looks good
   - [ ] Download works

5. **Email Functionality**
   - [ ] Send report via email
   - [ ] Email arrives in inbox
   - [ ] Email formatting correct
   - [ ] Attachments included

---

### Phase 3: Advanced Features

**Duration:** ~30 minutes

1. **Appointments**
   - [ ] Create appointment
   - [ ] Assign to inspector
   - [ ] Reschedule appointment
   - [ ] Complete appointment

2. **Analytics**
   - [ ] Dashboard loads data
   - [ ] Charts render correctly
   - [ ] Filters work
   - [ ] Data accuracy verified

3. **Mobile Experience**
   - [ ] All screens responsive
   - [ ] Touch interactions work
   - [ ] Forms usable on mobile
   - [ ] Navigation accessible

4. **Offline Support**
   - [ ] App loads offline
   - [ ] Can view cached data
   - [ ] Sync when online
   - [ ] No data loss

---

## Critical Test Points

### Must Work ✅

- [ ] Login for all 3 user types
- [ ] Role-based menu visibility
- [ ] Report CRUD operations
- [ ] PDF generation and download
- [ ] Email sending and delivery
- [ ] Mobile responsiveness
- [ ] Data isolation by branch
- [ ] Date/time calculations correct
- [ ] Form validation messages
- [ ] Error handling graceful

### Must NOT Work ❌

- [ ] Inspectors accessing admin functions
- [ ] Branch admins seeing other branches
- [ ] Unauthorized Firestore access
- [ ] Direct API manipulation
- [ ] Cross-branch data leakage
- [ ] Invalid form submissions
- [ ] Negative numbers in amounts
- [ ] Future dates for past inspections

### Performance Benchmarks

- [ ] Page load < 3 seconds
- [ ] Report open < 2 seconds
- [ ] PDF generation < 5 seconds
- [ ] Email sending < 2 seconds
- [ ] Search results < 1 second
- [ ] Mobile load < 4 seconds

---

## Fixes Tracking

### Recent Fixes Implemented

**1. Custom Claims Authentication** ✅

- **Issue**: Branch admins couldn't access data
- **Fix**: Custom claims properly set for all users
- **Verification**: All three user types can login

**2. Localization/Translation** ✅

- **Issue**: Form fields showed English or raw keys
- **Fix**: 150+ Swedish translations added
- **Verification**: All UI text in correct language

**3. Form Validation** ✅

- **Issue**: Some validation messages missing
- **Fix**: Comprehensive validation added to all forms
- **Verification**: All fields validate correctly

**4. PDF Generation** ✅

- **Issue**: Some edge cases in PDF layout
- **Fix**: Enhanced PDF generation logic
- **Verification**: PDF formatting consistent

**5. Email Delivery** ✅

- **Issue**: Emails not sending in some cases
- **Fix**: Email service configuration fixed
- **Verification**: All email templates deliver

---

## Test Data Creation

### Sample Data Setup

```bash
# Create test users
node scripts/createQAAccounts.mjs

# Create test data
node scripts/seedTestData.mjs

# Create admin test data
node scripts/seedTestDataAdmin.mjs
```

### Test Data Includes

- ✅ 1 Superadmin user
- ✅ 2 Branch admin users
- ✅ 3 Inspector users
- ✅ 3 Test customers
- ✅ 5 Sample reports (various states)
- ✅ 2 Sample appointments
- ✅ All configured for testing

---

## Regression Testing Checklist

Run before every release:

### Core Features

- [ ] Authentication working
- [ ] All user roles functioning
- [ ] Report creation/editing
- [ ] PDF generation
- [ ] Email sending
- [ ] Data persistence

### UI/UX

- [ ] No console errors
- [ ] No broken links
- [ ] Responsive on all devices
- [ ] Navigation consistent
- [ ] Translations complete

### Performance

- [ ] Load times acceptable
- [ ] No memory leaks
- [ ] Smooth animations
- [ ] Proper error handling

### Security

- [ ] No unauth access
- [ ] Data isolation enforced
- [ ] No sensitive data exposed
- [ ] HTTPS working
- [ ] CORS configured

---

## Known Issues & Workarounds

### Issue: "Permission Denied" on Login

**Cause**: Custom claims not set for user  
**Workaround**: Run claims setup script

```bash
node scripts/set-branch-admin-claims.cjs
```

### Issue: Emails Not Arriving

**Cause**: MailerSend configuration  
**Workaround**: Check email service dashboard

```bash
npm run debug-email-service
```

### Issue: PDF Generation Timeout

**Cause**: Large images in report  
**Workaround**: Compress images before upload

---

## Contact & Support

For testing questions or issues:

1. Check this documentation
2. Review recent fixes
3. Check Firebase Console logs
4. Contact development team

---

**Last Updated**: January 2026  
**Test Cycle**: Weekly  
**Maintained By**: QA Team
