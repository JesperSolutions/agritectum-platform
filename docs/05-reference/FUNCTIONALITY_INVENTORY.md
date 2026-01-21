# Taklaget Service App - Complete Functionality Inventory

**Date:** 2025-01-31  
**Version:** 1.0  
**Status:** Comprehensive Documentation

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Authentication & User Management](#2-authentication--user-management)
3. [Report Management](#3-report-management)
4. [Customer Management](#4-customer-management)
5. [Offer Management](#5-offer-management)
6. [Appointment Scheduling](#6-appointment-scheduling)
7. [Branch Management](#7-branch-management)
8. [Analytics & Reporting](#8-analytics--reporting)
9. [Email System](#9-email-system)
10. [Image Management](#10-image-management)
11. [Map Features](#11-map-features)
12. [Quick Actions (FAB)](#12-quick-actions-fab)
13. [Public Features](#13-public-features)
14. [Admin Features](#14-admin-features)
15. [Form Features](#15-form-features)
16. [Role-Based Access Matrix](#16-role-based-access-matrix)

---

## 1. System Overview

### 1.1 User Roles & Permissions

**Permission Levels:**

- `0` = Inspector (Field worker)
- `1` = Branch Admin (Branch-level management)
- `2` = Superadmin (Full system access)

**Roles:**

- **Inspector:** Creates reports, views own branch data, manages appointments
- **Branch Admin:** Manages branch users/customers/reports, views branch analytics
- **Superadmin:** Full system access, manages all branches and users

### 1.2 Technology Stack

- **Frontend:** React 18 + TypeScript
- **UI Framework:** Tailwind CSS + Custom Material Design components
- **Routing:** React Router DOM v6
- **Backend:** Firebase (Firestore, Storage, Functions, Auth)
- **State Management:** React Context API + useState/useReducer
- **Internationalization:** react-intl (Swedish)
- **Maps:** Leaflet.js (OpenStreetMap)
- **PDF Generation:** jsPDF + html2canvas
- **Image Handling:** Firebase Storage
- **Email:** MailerSend (via Cloud Functions)

### 1.3 Route Structure

**Protected Routes (Require Authentication):**

- `/dashboard` - Role-based dashboard
- `/profile` - User profile management
- `/report/new` - Create new report
- `/report/edit/:reportId` - Edit existing report
- `/report/view/:reportId` - View report details
- `/reports` - Reports list (Inspectors)
- `/admin/reports` - Reports list (Admins)
- `/offers` - Offers management
- `/schedule` - Appointment scheduling
- `/admin/users` - User management
- `/admin/customers` - Customer management
- `/admin/branches` - Branch management (Superadmin only)
- `/admin/analytics` - Analytics dashboard
- `/admin/email-templates` - Email template management
- `/admin/qa` - QA Testing (Development only)

**Public Routes (No Authentication Required):**

- `/login` - Authentication page
- `/report/public/:reportId` - Public report view
- `/offer/public/:offerId` - Public offer view
- `/offer/thank-you` - Offer thank you page
- `/unsubscribe` - Email unsubscribe
- `/marketing` - Marketing page (Superadmin only)

### 1.4 Navigation Architecture

**Sidebar Navigation (Role-Based):**

- Filtered by user role (`Layout.tsx` lines 151-162)
- Responsive: Mobile hamburger menu, Desktop sidebar
- Active route highlighting
- Breadcrumb navigation on all pages

**Quick Actions FAB (Floating Action Button):**

- Context-aware based on current page
- Visible when scrolled down (>100px)
- Provides shortcuts for common tasks
- Available contexts: dashboard, report, reports, offers, customer

---

## 2. Authentication & User Management

### 2.1 Login

**Overview:** User authentication using Firebase Auth with email/password.

**Location:**

- **Route:** `/login`
- **Component:** `src/components/forms/LoginForm.tsx`
- **Service:** `src/services/authService.ts`
- **Context:** `src/contexts/AuthContext.tsx`

**User Flow:**

1. User navigates to `/login` (or redirected if not authenticated)
2. Enters email and password
3. System validates credentials via Firebase Auth
4. On success: Redirects to `/dashboard`
5. On failure: Shows error message

**Technical Implementation:**

- Uses Firebase `signInWithEmailAndPassword`
- Custom claims set via Cloud Function on first login
- Session persistence: Firebase handles token refresh (every 55 min)
- Error handling: Network errors, invalid credentials, disabled accounts

**Permissions & Access:**

- **Required Role:** None (public route)
- **Firestore Rules:** N/A (uses Firebase Auth)
- **Branch:** Not applicable

**Data Model:**

- **Input:** `{ email: string, password: string }`
- **Output:** `User` object with role, permissionLevel, branchId
- **Storage:** Firebase Auth (users), Firestore `/users/{uid}`

**Dependencies:**

- Firebase Auth
- `authService.ts` - Authentication logic
- `AuthContext.tsx` - Global auth state

**Error Handling:**

- Invalid credentials: "Invalid email or password"
- Network errors: "Network error. Please check your connection."
- User disabled: "This account has been disabled."

---

### 2.2 Logout

**Overview:** Clears user session and redirects to login.

**Location:**

- **Trigger:** Logout button in `Layout.tsx` (line 42-49)
- **Service:** `src/contexts/AuthContext.tsx` (logout method)

**User Flow:**

1. User clicks "Sign Out" in sidebar/footer
2. System calls Firebase `signOut()`
3. Clears local state (currentUser, firebaseUser)
4. Redirects to `/login`

**Technical Implementation:**

- Firebase `signOut()` method
- Clears Context state
- Clears any cached data

**Permissions & Access:**

- **Required Role:** Any authenticated user
- **Branch:** Not applicable

---

### 2.3 User Profile Management

**Overview:** Users can view and edit their own profile information.

**Location:**

- **Route:** `/profile`
- **Component:** `src/components/UserProfile.tsx` (Lazy loaded)
- **Service:** `src/services/userService.ts`

**User Flow:**

1. User navigates to `/profile` via sidebar
2. Views current profile information
3. Can edit display name, email (if allowed)
4. Saves changes
5. Updates reflected in UI

**Technical Implementation:**

- Reads user data from Firestore `/users/{uid}`
- Updates user document
- Syncs with Firebase Auth if email changed

**Permissions & Access:**

- **Required Role:** All authenticated users
- **Permission Level:** 0+ (All)
- **Firestore Rules:** Users can update own document (`firestore.rules` line 62)
- **Branch:** Not restricted

**Data Model:**

- **Input:** `{ displayName?: string, email?: string }`
- **Output:** Updated `User` object
- **Storage:** Firestore `/users/{uid}`

---

### 2.4 User Management (Admin)

**Overview:** Branch Admins and Superadmins can create, edit, and manage users.

**Location:**

- **Route:** `/admin/users`
- **Component:** `src/components/admin/UserManagement.tsx` (Lazy loaded)
- **Service:** `src/services/userService.ts`, `src/services/userInvitationService.ts`

**User Flow (Create User):**

1. Admin navigates to `/admin/users`
2. Clicks "Add User" button
3. Fills form: Email, Name, Role, Branch (if branch admin)
4. System creates user account via Cloud Function
5. Invitation email sent to user
6. User appears in list

**User Flow (Edit User):**

1. Admin clicks "Edit" on user row
2. Modifies user information
3. Saves changes
4. Updates applied

**Technical Implementation:**

- **Create:** `userService.createUser()` → Cloud Function `createUserWithAuth`
- **Update:** `userService.updateUser()` → Updates Firestore
- **Delete:** `userService.deleteUser()` → Marks as inactive or removes
- **Toggle Status:** `userService.toggleUserStatus()` → Activates/deactivates

**Permissions & Access:**

- **Required Role:** Branch Admin, Superadmin
- **Permission Level:** 1+ (Branch Admin)
- **Firestore Rules:**
  - Read: Own user OR superadmin OR branch admin (same branch) (`firestore.rules` line 45-49)
  - Create: Superadmin OR branch admin (same branch) (`firestore.rules` line 52-55)
  - Update: Own user OR superadmin OR branch admin (same branch) (`firestore.rules` line 58-63)
  - Delete: Superadmin OR branch admin (same branch) (`firestore.rules` line 66-69)
- **Branch:** Branch Admins can only manage users in their branch

**Data Model:**

- **Input:** `{ email, displayName, role, branchId, isActive }`
- **Output:** `Employee` object
- **Storage:** Firestore `/users/{uid}`

**Dependencies:**

- `userService.ts` - CRUD operations
- `userInvitationService.ts` - Email invitations
- Cloud Function: `createUserWithAuth` - User creation with auth
- MailerSend - Invitation emails

---

### 2.5 User Invitation

**Overview:** Automated email invitation when new user is created.

**Location:**

- **Service:** `src/services/userInvitationService.ts`
- **Cloud Function:** `functions/src/createUserWithAuth.ts`

**User Flow:**

1. Admin creates new user
2. Cloud Function generates temporary password
3. Invitation email sent with login credentials
4. User receives email, logs in, changes password

**Technical Implementation:**

- Cloud Function creates Firebase Auth user
- Generates temporary password
- Sends email via MailerSend
- User must change password on first login

---

## 3. Report Management

### 3.1 Create New Report

**Overview:** Multi-step form for creating inspection reports with customer info, inspection details, issues, and actions.

**Location:**

- **Route:** `/report/new`
- **Component:** `src/components/ReportForm.tsx` (mode='create')
- **Service:** `src/services/reportService.ts`
- **Context:** `src/contexts/ReportContextSimple.tsx`

**User Flow:**

1. User navigates to `/report/new` (via Dashboard, Sidebar, Quick Actions, or Reports page)
2. **Step 1 - Customer Information:**
   - Enters customer name (auto-complete searches existing customers)
   - Enters customer address (AddressInput with geocoding)
   - Optionally enters phone and email
   - Selects inspection date
   - Validates required fields
3. **Step 2 - Inspection Details:**
   - Selects roof type
   - Optionally enters roof age
   - Enters condition notes
   - Optionally uploads roof overview image with annotation pins
4. **Step 3 - Issues & Actions:**
   - Adds issues found (type, severity, description, location, images)
   - Adds recommended actions (priority, urgency, description, estimated cost)
   - Can use issue templates
5. **Step 4 - Offer Information:**
   - Optionally sets offer value
   - Sets offer valid until date
   - Links to prior reports
6. User clicks "Complete Report" or "Save as Draft"
7. Report saved to Firestore
8. Redirected to report view page

**Alternative Entry Points:**

- From Customer Management: Click "Create Report" → Pre-fills customer data
- From Appointment: Click "Start Inspection" → Pre-fills from appointment
- URL Parameters: `?customerId=X&customerName=Y&customerAddress=Z`

**Technical Implementation:**

- **State Management:** `useState` for form data, `useReducer` for complex state
- **Auto-save:** Saves draft to localStorage every 3 seconds (debounced)
- **Validation:** Step-by-step validation via `validateStep()` function
- **Customer Search:** Debounced search (1s) for existing customers
- **Image Upload:** Firebase Storage (`roof-images/{tempReportId}/`)
- **Draft Management:** localStorage with 24-hour expiry
- **Service Call:** `reportService.createReport()` → Creates Firestore document
- **Customer Creation:** Automatically creates/finds customer via `customerService.findOrCreateCustomer()`

**Permissions & Access:**

- **Required Role:** Inspector, Branch Admin
- **Permission Level:** 0+ (Inspector)
- **Firestore Rules:**
  - Create: Authenticated user, branchId match, creator match (`firestore.rules` line 116-123)
- **Branch:** Must match user's branchId or "main"

**Data Model:**

- **Input:** `Partial<Report>` object
- **Required Fields:** customerName, customerAddress, inspectionDate, roofType, branchId, createdBy
- **Output:** `{ reportId: string }`
- **Storage:** Firestore `/reports/{reportId}`
- **Related:** Creates/updates customer in `/customers/{customerId}`

**Dependencies:**

- `reportService.ts` - Report CRUD
- `customerService.ts` - Customer find/create
- `imageUploadService.ts` - Image handling
- Firebase Storage - Image storage
- Firebase Firestore - Data persistence
- AddressInput component - Address geocoding (Nominatim API)
- InteractiveRoofMap - Map marker placement

**Error Handling:**

- Validation errors: Field-level messages in Swedish
- Network errors: "Network error. Check your connection."
- Permission errors: "You don't have permission for this action."
- Auto-save errors: Silent (logs to console) OR visible notification for critical errors

**Integration Points:**

- Email notifications on creation (notifyBranchManagersOnReportCreation)
- Customer stats update (updateCustomerStats)
- Appointment linking (if created from appointment)
- PDF generation (on demand)
- Image storage cleanup for temp files

---

### 3.2 Edit Report

**Overview:** Edit existing reports (draft or completed).

**Location:**

- **Route:** `/report/edit/:reportId`
- **Component:** `src/components/ReportForm.tsx` (mode='edit')
- **Service:** `src/services/reportService.ts`

**User Flow:**

1. User navigates to report view page
2. Clicks "Edit" button (if permissions allow)
3. Form loads with existing report data
4. User modifies fields
5. Auto-saves every 3 seconds (updates Firestore)
6. User clicks "Save" or "Complete Report"
7. Report updated
8. Redirected to report view

**Technical Implementation:**

- Loads report via `reportService.getReport(reportId)`
- Same form component as create, but with `mode='edit'`
- Auto-save updates existing Firestore document
- Validation same as create mode
- Cannot edit archived reports (button hidden)

**Permissions & Access:**

- **Required Role:** Inspector (own reports), Branch Admin (branch reports), Superadmin (all)
- **Permission Level:** 0+ (Inspector)
- **Firestore Rules:**
  - Update: Superadmin OR branch admin (same branch) OR inspector (own reports, same branch) (`firestore.rules` line 124-128)
- **Branch:** Inspector can only edit own reports in their branch

**Data Model:**

- **Input:** `Partial<Report>` with updates
- **Output:** Updated `Report` object
- **Storage:** Firestore `/reports/{reportId}`

---

### 3.3 View Report

**Overview:** View detailed report with all information, map, images, and actions.

**Location:**

- **Route:** `/report/view/:reportId`
- **Component:** `src/components/ReportView.tsx` (Lazy loaded)
- **Service:** `src/services/reportService.ts`

**User Flow:**

1. User navigates from Reports list or Dashboard
2. Clicks on report card/list item
3. Report details page loads
4. User can:
   - View all report information
   - See satellite map with markers (if available)
   - View images
   - Export PDF
   - Share public link
   - Create offer (if no offer exists)
   - Edit report (if permissions allow)
   - Change status (if permissions allow)

**Technical Implementation:**

- Loads report via `reportService.getReport(reportId)`
- Geocodes customer address for map display (Nominatim API)
- Lazy loads InteractiveRoofMap component
- Checks for associated offers
- Generates QR code for public link (if shared)
- Displays report sections: Summary, Issues, Actions, Images, Map

**Permissions & Access:**

- **Required Role:** Inspector (branch reports), Branch Admin (branch reports), Superadmin (all)
- **Permission Level:** 0+ (Inspector)
- **Firestore Rules:**
  - Read: Public (if isPublic=true) OR authenticated (same branch/permissions) (`firestore.rules` line 106-113)
- **Branch:** Users see reports in their branch

**Data Model:**

- **Input:** `reportId: string`
- **Output:** `Report` object with all fields
- **Storage:** Firestore `/reports/{reportId}`

**Dependencies:**

- `reportService.ts` - Get report
- `offerService.ts` - Check for offers
- `branchService.ts` - Branch info for branding
- Nominatim API - Address geocoding
- QRCode library - QR code generation
- InteractiveRoofMap - Map display

---

### 3.4 Share Report (Public Link)

**Overview:** Generate shareable public link for customers to view reports without authentication.

**Location:**

- **Trigger:** "Share" button in `ReportView.tsx`
- **Component:** Share dialog/modal
- **Service:** `src/services/reportService.ts`

**User Flow:**

1. User clicks "Share" button on report view
2. System generates unique public link: `/report/public/{reportId}`
3. Sets `isPublic: true` on report document
4. Displays link and QR code
5. User copies link or sends via email
6. Customer opens link (no login required)
7. Customer views report in read-only mode

**Technical Implementation:**

- Updates Firestore: `updateDoc(reportRef, { isPublic: true })`
- Generates URL: `${window.location.origin}/report/public/${reportId}`
- Generates QR code for easy sharing
- Public view checks `isPublic` flag in Firestore rules

**Permissions & Access:**

- **Required Role:** Inspector (own reports), Branch Admin (branch reports), Superadmin (all)
- **Firestore Rules:**
  - Update: Same as edit report rules
  - Public Read: `isPublic == true` OR authenticated with access (`firestore.rules` line 106)

---

### 3.5 Export Report (PDF)

**Overview:** Generate and download professional PDF report.

**Location:**

- **Trigger:** "Export PDF" button in `ReportView.tsx`
- **Service:** `src/services/reportService.ts` (generatePDF method)
- **PDF Service:** `src/services/simplePdfService.ts` or `clientPdfService.ts`

**User Flow:**

1. User clicks "Export PDF" button
2. System generates PDF (shows loading state)
3. PDF downloads automatically
4. PDF includes: Customer info, inspection details, issues, actions, images, QR code

**Technical Implementation:**

- Uses jsPDF + html2canvas for PDF generation
- Fetches all report data including images
- Renders PDF with branding (branch logo if available)
- Includes QR code linking to public report view
- Downloads as `Report_{customerName}_{date}.pdf`

**Permissions & Access:**

- **Required Role:** Same as view report
- **Firestore Rules:** Same as read report

**Dependencies:**

- jsPDF library
- html2canvas library
- Firebase Storage - Image retrieval
- QRCode library

---

### 3.6 Delete Report

**Overview:** Permanently delete a report from the system.

**Location:**

- **Component:** `src/components/reports/AllReports.tsx`
- **Service:** `src/services/reportService.ts` (deleteReport)

**User Flow:**

1. User navigates to reports list (Admin: `/admin/reports`, Inspector: `/reports`)
2. Clicks "Delete" button on report row
3. Confirmation dialog appears
4. User confirms deletion
5. Report deleted from Firestore
6. List refreshes

**Technical Implementation:**

- Calls `reportService.deleteReport(reportId, branchId)`
- Deletes Firestore document
- Optionally cleans up associated images (if implemented)
- Updates customer stats (decrements totalReports)

**Permissions & Access:**

- **Required Role:** Branch Admin, Superadmin
- **Permission Level:** 1+ (Branch Admin)
- **Firestore Rules:**
  - Delete: Superadmin OR branch admin (same branch) (`firestore.rules` line 129-132)
- **Branch:** Branch Admins can only delete reports in their branch

**Data Model:**

- **Input:** `reportId: string, branchId: string`
- **Output:** `void`
- **Storage:** Document deleted from `/reports/{reportId}`

---

### 3.7 Report Search & Filtering

**Overview:** Search and filter reports by various criteria.

**Location:**

- **Component:** `src/components/reports/AllReports.tsx`
- **Route:** `/reports` (Inspectors) or `/admin/reports` (Admins)

**User Flow:**

1. User navigates to reports list
2. Enters search term (customer name, address)
3. System filters reports in real-time (debounced)
4. User can filter by:
   - Status (draft, completed, sent, archived)
   - Date range
   - Inspector
   - Branch (admin only)
5. Results update dynamically

**Technical Implementation:**

- Client-side filtering after fetching reports
- Debounced search input (500ms)
- Multi-criteria filtering
- Sort by date, customer name, status

**Permissions & Access:**

- **Required Role:** Inspector (own branch), Branch Admin (own branch), Superadmin (all)
- **Permission Level:** 0+ (Inspector)

---

### 3.8 Draft Management

**Overview:** Auto-save drafts and restore them when user returns.

**Location:**

- **Component:** `src/components/ReportForm.tsx` (auto-save logic)

**User Flow:**

1. User starts creating report
2. System auto-saves to localStorage every 3 seconds (after debounce)
3. User closes browser or navigates away
4. User returns to `/report/new`
5. System detects draft and prompts to restore
6. User can restore draft or start fresh

**Technical Implementation:**

- **Auto-save:** `useEffect` triggers every 3s (debounced)
- **Storage:** localStorage key: `report_draft_{userId}`
- **Expiry:** 24 hours (FORM_CONSTANTS.DRAFT_EXPIRY_HOURS)
- **Restore:** On mount, checks localStorage for valid draft
- **Clear:** Cleared on successful report creation

**Data Model:**

- **Storage:** localStorage JSON string
- **Structure:** Same as Report form data + `lastSaved: ISO string`

---

### 3.9 Report Templates

**Overview:** Use pre-configured issue templates when creating reports.

**Location:**

- **Component:** `src/components/IssueTemplateSelector.tsx`
- **Templates:** `src/constants/issueTemplates.ts`

**User Flow:**

1. User is in Step 3 (Issues) of report form
2. Clicks "Templates" button
3. Template selector modal opens
4. User selects template
5. Template issues/actions added to form
6. User can modify template content

**Technical Implementation:**

- Templates stored as constants (TypeScript objects)
- Templates include: Issue type, severity, description, recommended actions
- Applies template data to form state

---

## 4. Customer Management

### 4.1 Create Customer

**Overview:** Create new customer record manually (outside of report creation).

**Location:**

- **Route:** `/admin/customers`
- **Component:** `src/components/admin/CustomerManagement.tsx`
- **Service:** `src/services/customerService.ts`

**User Flow:**

1. Admin navigates to `/admin/customers`
2. Clicks "Add Customer" button
3. Modal form opens
4. Fills: Name, Email, Phone, Address, Company (optional)
5. Clicks "Save"
6. Customer created in Firestore
7. Customer appears in list

**Technical Implementation:**

- `customerService.createCustomer(customerData)`
- Validates required fields: name, branchId, createdBy
- Creates Firestore document in `/customers/{customerId}`
- Initializes: totalReports=0, totalRevenue=0

**Permissions & Access:**

- **Required Role:** Branch Admin, Superadmin (Inspectors cannot create customers directly)
- **Permission Level:** 1+ (Branch Admin)
- **Firestore Rules:**
  - Create: Authenticated, branchId match, creator match (`firestore.rules` line 143-150)
- **Branch:** Must match user's branchId or "main"

**Data Model:**

- **Input:** `{ name, email?, phone?, address?, company?, branchId, createdBy }`
- **Output:** `customerId: string`
- **Storage:** Firestore `/customers/{customerId}`

---

### 4.2 View Customer List

**Overview:** View all customers with search and filtering.

**Location:**

- **Route:** `/admin/customers`
- **Component:** `src/components/admin/CustomerManagement.tsx`

**User Flow:**

1. User navigates to `/admin/customers`
2. Sees table of all customers (filtered by branch)
3. Can search by name, email, phone
4. Can filter by status (all, has reports, no reports)
5. Can sort by name, revenue, report count, date
6. Can view customer details by clicking "View"

**Technical Implementation:**

- Fetches customers via `customerService.getCustomers(branchId)`
- Client-side filtering and sorting
- Debounced search (500ms)
- Pagination (if implemented)

**Permissions & Access:**

- **Required Role:** Inspector (read-only), Branch Admin, Superadmin
- **Permission Level:** 0+ (Inspector)
- **Firestore Rules:**
  - Read: Superadmin OR branch admin (same branch) OR inspector (same branch) (`firestore.rules` line 137-141)
- **Branch:** Users see customers in their branch (or all for superadmin)

---

### 4.3 Edit Customer

**Overview:** Update customer information.

**Location:**

- **Component:** `src/components/admin/CustomerManagement.tsx` (Edit modal)

**User Flow:**

1. Admin clicks "Edit" button on customer row
2. Edit modal opens with current data
3. Admin modifies fields
4. Clicks "Save"
5. Customer updated in Firestore

**Technical Implementation:**

- `customerService.updateCustomer(customerId, updates, user)`
- Updates Firestore document
- Validates branch access

**Permissions & Access:**

- **Required Role:** Branch Admin, Superadmin (Inspectors read-only)
- **Permission Level:** 1+ (Branch Admin)
- **Firestore Rules:**
  - Update: Superadmin OR branch admin (same branch) OR inspector (same branch) (`firestore.rules` line 151-155)

---

### 4.4 Delete Customer

**Overview:** Permanently delete customer record.

**Location:**

- **Component:** `src/components/admin/CustomerManagement.tsx`

**User Flow:**

1. Admin clicks "Delete" button
2. Confirmation dialog appears
3. Admin confirms
4. Customer deleted from Firestore
5. List refreshes

**Technical Implementation:**

- `customerService.deleteCustomer(customerId, user)`
- Deletes Firestore document
- Note: Does not delete associated reports (reports remain with customer info)

**Permissions & Access:**

- **Required Role:** Branch Admin, Superadmin
- **Permission Level:** 1+ (Branch Admin)
- **Firestore Rules:**
  - Delete: Superadmin OR branch admin (same branch) (`firestore.rules` line 156-159)

---

### 4.5 Search Customers

**Overview:** Search customers by name, email, phone, or company.

**Location:**

- **Component:** `src/components/admin/CustomerManagement.tsx`

**Technical Implementation:**

- `customerService.searchCustomers(searchTerm, branchId)`
- Searches Firestore with case-insensitive matching
- Debounced input (500ms)
- Returns matching customers

---

### 4.6 Customer History/Reports

**Overview:** View all reports associated with a customer.

**Location:**

- **Component:** Customer detail modal in `CustomerManagement.tsx`
- **Service:** `src/services/reportService.ts`

**User Flow:**

1. User clicks "View" on customer row
2. Customer detail modal opens
3. Shows: Contact info, Stats (total reports, revenue), Last report date
4. Can click on report links to view them

**Technical Implementation:**

- Calculates stats: `totalReports`, `totalRevenue`, `lastReportDate`
- Updated automatically when reports created/updated
- Read from customer document (denormalized for performance)

---

### 4.7 Customer Read-Only Access (Inspectors)

**Overview:** Inspectors can view customers but cannot create/edit/delete.

**Location:**

- **Route:** `/admin/customers`
- **Component:** `src/components/admin/CustomerManagement.tsx` (read-only mode)

**User Flow:**

1. Inspector navigates to `/admin/customers`
2. Sees customer list (read-only)
3. Can search and view customer details
4. Can click "Create Report" from customer detail modal
5. Cannot see "Add Customer", "Edit", or "Delete" buttons

**Technical Implementation:**

- `isReadOnly = currentUser?.role === 'inspector'`
- Conditionally hides create/edit/delete buttons
- Title changes to "Customer Directory" for inspectors
- "Create Report" button in customer detail modal

**Permissions & Access:**

- **Required Role:** Inspector
- **Permission Level:** 0 (Inspector)
- **Firestore Rules:** Read access only (same as view list)

---

## 5. Offer Management

### 5.1 Create Offer from Report

**Overview:** Create an offer based on an inspection report with pricing breakdown.

**Location:**

- **Trigger:** "Create Offer" button in `ReportView.tsx`
- **Component:** `src/components/offers/CreateOfferModal.tsx`
- **Service:** `src/services/offerService.ts`

**User Flow:**

1. User views a report (`/report/view/:reportId`)
2. Clicks "Create Offer" button (visible if no offer exists and report not archived)
3. Create Offer modal opens
4. User fills:
   - Title
   - Description
   - Labor cost
   - Material cost
   - Travel cost
   - Overhead cost
   - Profit margin (%)
   - Valid until date
5. System calculates total: `(subtotal) + (subtotal * profitMargin%)`
6. User clicks "Create Offer"
7. Offer created in Firestore
8. Public link generated
9. User can send offer via email

**Technical Implementation:**

- `offerService.createOffer(offerData)`
- Creates Firestore document in `/offers/{offerId}`
- Generates unique public link: `${origin}/offer/public/{offerId}`
- Links offer to report: Sets `offerId` on report, `reportId` on offer
- Initial status: `pending`
- Creates status history entry

**Permissions & Access:**

- **Required Role:** Inspector (own reports), Branch Admin (branch reports), Superadmin (all)
- **Permission Level:** 0+ (Inspector)
- **Firestore Rules:**
  - Create: Authenticated, branchId match (`firestore.rules` - offers section)
- **Branch:** Must match report's branchId

**Data Model:**

- **Input:** `{ reportId, title, description, laborCost, materialCost, travelCost, overheadCost, profitMargin, validUntil, customerName, customerEmail, customerAddress, branchId, createdBy }`
- **Output:** `offerId: string`
- **Storage:** Firestore `/offers/{offerId}`

**Dependencies:**

- `offerService.ts` - Offer CRUD
- `reportService.ts` - Link offer to report
- Email service - Send offer email
- QRCode - Public link QR code

---

### 5.2 View Offers List

**Overview:** View all offers with filtering and status tracking.

**Location:**

- **Route:** `/offers`
- **Component:** `src/components/offers/OffersPage.tsx` (Lazy loaded)

**User Flow:**

1. User navigates to `/offers`
2. Sees table/list of all offers (filtered by branch/role)
3. Can filter by status (pending, accepted, rejected, expired)
4. Can search by customer name, title
5. Can sort by date, amount, status
6. Color-coded status badges
7. Can click offer to view details

**Technical Implementation:**

- `offerService.getOffers(user)` - Fetches offers based on user permissions
- Inspector: Only sees offers from their reports
- Branch Admin: Sees all offers in their branch
- Superadmin: Sees all offers

**Permissions & Access:**

- **Required Role:** Inspector, Branch Admin, Superadmin
- **Permission Level:** 0+ (Inspector)
- **Branch:** Users see offers in their branch

---

### 5.3 Send Offer (Email)

**Overview:** Send offer to customer via email with acceptance link.

**Location:**

- **Trigger:** "Send Offer" button in offer detail or list
- **Service:** `src/services/offerService.ts` (sendOfferToCustomer)

**User Flow:**

1. User creates or views offer
2. Clicks "Send Offer" button
3. System sends email via MailerSend
4. Email includes:
   - Offer details
   - Pricing breakdown
   - Acceptance/rejection links
   - Valid until date
5. Offer status updated to "awaiting_response"
6. `sentAt` timestamp recorded
7. Email sent confirmation shown

**Technical Implementation:**

- `offerService.sendOfferToCustomer(offerId)`
- Calls Cloud Function or MailerSend API
- Email template includes branding and offer details
- Creates communication log entry

**Dependencies:**

- MailerSend API
- Email template service
- Cloud Functions (if using server-side)

---

### 5.4 Customer Offer Acceptance (Public)

**Overview:** Customers can accept or reject offers via public link without authentication.

**Location:**

- **Route:** `/offer/public/:offerId`
- **Component:** `src/components/offers/PublicOfferView.tsx` (Lazy loaded)

**User Flow:**

1. Customer receives email with offer link
2. Clicks link (or scans QR code)
3. Public offer page loads (no login required)
4. Customer views offer details:
   - Customer info
   - Offer description
   - Pricing breakdown
   - Validity period
   - Days remaining
5. Customer clicks "Accept Offer" or "Reject Offer"
6. If rejecting: Optional reason field
7. System updates offer status
8. Confirmation message shown
9. Thank you page displayed (`/offer/thank-you`)

**Technical Implementation:**

- Public route (no authentication required)
- `offerService.getOffer(offerId)` - Public read access
- `offerService.acceptOffer(offerId)` or `rejectOffer(offerId, reason)`
- Updates Firestore: status, `respondedAt`, `customerResponse`
- Creates status history entry
- Updates linked report: `offerStatus`, `offerId`
- Sends notification to creator

**Permissions & Access:**

- **Required Role:** Public (no authentication)
- **Firestore Rules:**
  - Read: Public access for offers (check rules)
  - Update: Public can update status via specific endpoint

**Data Model:**

- **Input:** `{ offerId, response: 'accept' | 'reject', reason?: string }`
- **Output:** Updated offer with new status
- **Storage:** Firestore `/offers/{offerId}`

---

### 5.5 Offer Status Tracking

**Overview:** Track offer status changes and history.

**Location:**

- **Component:** Offer detail views
- **Service:** `src/services/offerService.ts`

**Technical Implementation:**

- Status stored in `offer.status` field
- Status history in `offer.statusHistory[]` array
- Each status change creates history entry:
  - `{ status, timestamp, changedBy, changedByName, reason?, notes? }`
- Statuses: `pending`, `accepted`, `rejected`, `awaiting_response`, `expired`

---

### 5.6 Offer Follow-ups (Automated)

**Overview:** Automated email reminders for pending offers.

**Location:**

- **Cloud Function:** `functions/src/offerFollowUp.ts` (scheduled daily at 9 AM)

**User Flow (Automated):**

1. Cloud Function runs daily
2. Finds offers with status "awaiting_response" older than 7 days
3. Sends reminder email to customer
4. Increments `followUpAttempts`
5. After 14 days: Escalates to branch admin
6. After 30 days: Auto-expires offer (status = "expired")

**Technical Implementation:**

- Scheduled Cloud Function (daily trigger)
- `offerService.getOffersNeedingFollowUp(user)`
- Sends emails via MailerSend
- Updates offer: `lastFollowUpAt`, `followUpAttempts`
- Creates communication log entries

**Dependencies:**

- Cloud Functions (Firebase)
- MailerSend API
- Email template service

---

### 5.7 Offer Expiration

**Overview:** Automatically expire offers after validity period.

**Location:**

- **Cloud Function:** `functions/src/offerFollowUp.ts`

**Technical Implementation:**

- Checks offers where `validUntil < today`
- Updates status to "expired"
- Creates status history entry
- Sends notification to creator

---

## 6. Appointment Scheduling

### 6.1 Create Appointment

**Overview:** Schedule inspections or other appointments for inspectors.

**Location:**

- **Route:** `/schedule`
- **Component:** `src/components/schedule/SchedulePage.tsx`
- **Form:** `src/components/schedule/AppointmentForm.tsx` (modal)
- **Service:** `src/services/appointmentService.ts`

**User Flow:**

1. User navigates to `/schedule`
2. Clicks "Create New Appointment" button
3. Appointment form modal opens
4. Fills form:
   - Customer name (with search/autocomplete)
   - Customer address
   - Customer phone/email (optional)
   - Assign inspector (dropdown of branch inspectors)
   - Date (date picker)
   - Time (time picker)
   - Duration (default: 120 minutes)
   - Appointment type (inspection, follow_up, estimate, other)
   - Description/notes (optional)
5. Clicks "Save Appointment"
6. Appointment created in Firestore
7. Calendar view updates
8. Inspector receives notification (if implemented)

**Technical Implementation:**

- `appointmentService.createAppointment(appointmentData)`
- Creates Firestore document in `/appointments/{appointmentId}`
- Determines branchId based on assigned inspector
- Normalizes date to YYYY-MM-DD format (timezone handling)
- Validates no conflicts (if implemented)
- Status: "scheduled"

**Permissions & Access:**

- **Required Role:** Inspector, Branch Admin, Superadmin
- **Permission Level:** 0+ (Inspector)
- **Firestore Rules:**
  - Create: Authenticated, branchId match (`firestore.rules` - appointments section)
- **Branch:**
  - Branch Admin: Creates in their branch
  - Superadmin: Creates in inspector's branch
  - Inspector: Can view but typically cannot create (only admins create)

**Data Model:**

- **Input:** `{ customerName, customerAddress, customerPhone?, customerEmail?, assignedInspectorId, scheduledDate, scheduledTime, duration, appointmentType, description?, branchId }`
- **Output:** `appointmentId: string`
- **Storage:** Firestore `/appointments/{appointmentId}`

**Dependencies:**

- `appointmentService.ts` - CRUD operations
- `userService.ts` - Get inspectors for assignment
- Date normalization utility

---

### 6.2 View Schedule

**Overview:** Calendar view of all appointments.

**Location:**

- **Route:** `/schedule`
- **Component:** `src/components/schedule/SchedulePage.tsx`

**User Flow:**

1. User navigates to `/schedule`
2. Sees calendar view (month/week/day)
3. Appointments displayed on respective dates
4. Can filter by:
   - Inspector (admin sees all, inspector sees own)
   - Status
   - Date range
5. Can click appointment to view/edit

**Technical Implementation:**

- `appointmentService.getAppointments(user)`
- Fetches based on permissions:
  - Inspector: Only own appointments
  - Branch Admin: All appointments in branch
  - Superadmin: All appointments
- Renders in calendar component
- Color-coded by status

**Permissions & Access:**

- **Required Role:** Inspector, Branch Admin, Superadmin
- **Permission Level:** 0+ (Inspector)
- **Branch:** Users see appointments in their branch

---

### 6.3 Edit Appointment

**Overview:** Modify appointment details.

**Location:**

- **Component:** `src/components/schedule/AppointmentForm.tsx` (edit mode)

**User Flow:**

1. User clicks on appointment in calendar
2. Edit modal opens with current data
3. User modifies fields
4. Clicks "Save"
5. Appointment updated

**Technical Implementation:**

- `appointmentService.updateAppointment(appointmentId, updates)`
- Updates Firestore document
- Validates permissions and branch access

**Permissions & Access:**

- **Required Role:** Branch Admin, Superadmin (Inspectors typically cannot edit)
- **Permission Level:** 1+ (Branch Admin)

---

### 6.4 Delete Appointment

**Overview:** Cancel and delete appointment.

**Location:**

- **Component:** `src/components/schedule/SchedulePage.tsx`

**User Flow:**

1. User clicks "Delete" on appointment
2. Confirmation dialog
3. User confirms
4. Appointment deleted

**Technical Implementation:**

- `appointmentService.deleteAppointment(appointmentId)`
- Or `appointmentService.cancelAppointment(appointmentId, reason)`

**Permissions & Access:**

- **Required Role:** Branch Admin, Superadmin

---

### 6.5 Complete Appointment

**Overview:** Mark appointment as completed and optionally link to report.

**Location:**

- **Service:** `src/services/appointmentService.ts` (completeAppointment)

**User Flow:**

1. Inspector views appointment
2. Clicks "Start Inspection" or "Complete"
3. If "Start Inspection": Navigates to report creation with appointment data pre-filled
4. If "Complete": Marks status as "completed"
5. Optionally links to created report

**Technical Implementation:**

- `appointmentService.completeAppointment(appointmentId, reportId?)`
- Updates status to "completed"
- Sets `reportId` if provided
- Sets `completedAt` timestamp

---

### 6.6 Create Report from Appointment

**Overview:** Start report creation with appointment data pre-filled.

**User Flow:**

1. Inspector views appointment
2. Clicks "Start Inspection"
3. Navigates to `/report/new` with navigation state
4. Report form pre-fills:
   - Customer name
   - Customer address
   - Customer phone/email
   - Inspection date (from appointment date)
   - Appointment ID (linked)
5. Inspector completes report
6. Report linked to appointment via `appointmentId` field

**Technical Implementation:**

- Navigation state passed: `navigate('/report/new', { state: { appointmentId, customerName, customerAddress, ... } })`
- `ReportForm.tsx` reads `location.state` and pre-fills form
- On report creation, calls `appointmentService.completeAppointment(appointmentId, newReportId)`

---

### 6.7 Appointment Status Management

**Overview:** Change appointment status (scheduled → in_progress → completed).

**Location:**

- **Component:** `src/components/schedule/SchedulePage.tsx`

**Statuses:**

- `scheduled` - Initial state
- `in_progress` - Inspector started work
- `completed` - Finished (report linked)
- `cancelled` - Cancelled
- `no_show` - Customer didn't show

**Technical Implementation:**

- `appointmentService.startAppointment(appointmentId)` - Sets to "in_progress"
- `appointmentService.completeAppointment(appointmentId, reportId)` - Sets to "completed"
- `appointmentService.cancelAppointment(appointmentId, reason)` - Sets to "cancelled"

---

## 7. Branch Management

### 7.1 Create Branch

**Overview:** Create new branch for multi-location operations.

**Location:**

- **Route:** `/admin/branches`
- **Component:** `src/components/admin/BranchManagement.tsx` (Lazy loaded)
- **Service:** `src/services/branchService.ts`

**User Flow:**

1. Superadmin navigates to `/admin/branches`
2. Clicks "Add Branch" button
3. Form modal opens
4. Fills:
   - Branch name
   - Address
   - Phone
   - Email
   - Logo (upload)
   - Business details (CVR, VAT, etc.)
5. Clicks "Save"
6. Branch created in Firestore
7. Branch appears in list

**Technical Implementation:**

- `branchService.createBranch(branchData)`
- Creates Firestore document in `/branches/{branchId}`
- Uploads logo to Firebase Storage (`/branches/{branchId}/logo.png`)
- Validates unique branchId

**Permissions & Access:**

- **Required Role:** Superadmin only
- **Permission Level:** 2 (Superadmin)
- **Firestore Rules:**
  - Write: Superadmin only (`firestore.rules` line 79)

**Data Model:**

- **Input:** `Branch` object (see types)
- **Output:** `branchId: string`
- **Storage:** Firestore `/branches/{branchId}`
- **Related:** Logo stored in Firebase Storage

---

### 7.2 Edit Branch

**Overview:** Update branch information and settings.

**Location:**

- **Component:** `src/components/admin/BranchManagement.tsx`

**User Flow:**

1. Superadmin clicks "Edit" on branch row
2. Edit modal opens
3. Modifies fields
4. Can upload new logo
5. Clicks "Save"
6. Branch updated

**Technical Implementation:**

- `branchService.updateBranch(branchId, updates)`
- Updates Firestore document
- Re-uploads logo if changed

**Permissions & Access:**

- **Required Role:** Superadmin only
- **Permission Level:** 2 (Superadmin)

---

### 7.3 Delete Branch

**Overview:** Remove branch (with safety checks).

**Location:**

- **Component:** `src/components/admin/BranchManagement.tsx`

**User Flow:**

1. Superadmin clicks "Delete"
2. Confirmation dialog (warns about associated data)
3. Confirms
4. Branch deleted

**Technical Implementation:**

- `branchService.deleteBranch(branchId)`
- Should check for associated users/reports before deletion (safety)

**Permissions & Access:**

- **Required Role:** Superadmin only

---

### 7.4 View Branch List

**Overview:** See all branches in system.

**Location:**

- **Route:** `/admin/branches`
- **Component:** `src/components/admin/BranchManagement.tsx`

**Technical Implementation:**

- `branchService.getBranches()`
- Returns all branches (superadmin only)

**Permissions & Access:**

- **Required Role:** Superadmin
- **Read Rules:** Superadmin OR branch admin (own branch) OR inspector (own branch) (`firestore.rules` line 74-78)

---

### 7.5 Branch Logo Management

**Overview:** Upload and manage branch logos.

**Location:**

- **Service:** `src/services/branchLogoService.ts`
- **Storage:** Firebase Storage `/branches/{branchId}/logo.png`

**Technical Implementation:**

- Uploads logo to Firebase Storage
- Generates download URL
- Updates branch document with `logoUrl`
- Logo displayed on reports/offers for branding

---

## 8. Analytics & Reporting

### 8.1 Dashboard Statistics

**Overview:** Role-based dashboard with key metrics and recent activity.

**Location:**

- **Route:** `/dashboard`
- **Component:** `src/components/Dashboard.tsx` (Lazy loaded)

**User Flow:**

1. User logs in
2. Redirected to `/dashboard`
3. Sees dashboard with:
   - **Inspector:** Recent reports, upcoming appointments, quick actions
   - **Branch Admin:** Branch statistics, recent reports, user activity
   - **Superadmin:** System-wide statistics, branch performance
4. Can click on widgets to navigate to details

**Technical Implementation:**

- Fetches data based on user role:
  - Reports (filtered by branch/permissions)
  - Appointments
  - Customers
  - Offers
- Calculates statistics client-side
- Real-time updates (if implemented)

**Permissions & Access:**

- **Required Role:** All authenticated users
- **Permission Level:** 0+ (All)

**Data Shown:**

- Total reports
- Revenue
- Recent reports
- Upcoming appointments
- Pending offers

---

### 8.2 Analytics Dashboard

**Overview:** Detailed analytics with charts and metrics.

**Location:**

- **Route:** `/admin/analytics`
- **Component:** `src/components/admin/AnalyticsDashboard.tsx` (Lazy loaded)

**User Flow:**

1. Admin navigates to `/admin/analytics`
2. Sees analytics dashboard with:
   - Revenue charts (line/bar)
   - Report statistics
   - Customer statistics
   - Branch performance (superadmin)
   - Time-based filtering (week, month, year, custom)
3. Can filter by branch, date range
4. Can export analytics data

**Technical Implementation:**

- Fetches all reports for calculation
- Calculates metrics:
  - Total revenue
  - Report count by status
  - Average report value
  - Customer count
  - Trends over time
- Uses charting library (if implemented)

**Permissions & Access:**

- **Required Role:** Branch Admin, Superadmin
- **Permission Level:** 1+ (Branch Admin)
- **Branch:** Branch Admin sees only their branch data

---

### 8.3 Revenue Reports

**Overview:** Detailed revenue breakdown and reporting.

**Location:**

- **Component:** Part of Analytics Dashboard

**Technical Implementation:**

- Calculates revenue from:
  - Completed reports (offerValue)
  - Accepted offers (totalAmount)
- Groups by time period
- Shows trends

---

### 8.4 Report Statistics

**Overview:** Statistics about reports (count, status distribution, etc.).

**Location:**

- **Component:** Analytics Dashboard

**Metrics:**

- Total reports
- Reports by status
- Reports by inspector
- Average report value
- Reports over time

---

### 8.5 Customer Statistics

**Overview:** Customer-related metrics.

**Location:**

- **Component:** Analytics Dashboard

**Metrics:**

- Total customers
- Customers with reports
- Average reports per customer
- Top customers by revenue

---

### 8.6 Branch Performance

**Overview:** Compare performance across branches (Superadmin only).

**Location:**

- **Component:** Analytics Dashboard (Superadmin view)

**Metrics:**

- Revenue per branch
- Reports per branch
- Customer count per branch
- Branch comparison charts

---

### 8.7 Time-based Filtering

**Overview:** Filter analytics by time period.

**Technical Implementation:**

- Filter options: Week, Month, Quarter, Year, Custom range
- Updates calculations and charts
- Persists selection in URL or state

---

### 8.8 Export Analytics

**Overview:** Download analytics data as CSV/Excel.

**Location:**

- **Trigger:** "Export" button in Analytics Dashboard

**Technical Implementation:**

- Converts analytics data to CSV
- Downloads file
- Includes date range in filename

---

## 9. Email System

### 9.1 Email Template Management

**Overview:** Create and edit email templates for various purposes.

**Location:**

- **Route:** `/admin/email-templates`
- **Component:** `src/components/admin/EmailTemplateViewer.tsx` (Lazy loaded)

**User Flow:**

1. Superadmin navigates to `/admin/email-templates`
2. Sees list of email templates
3. Can view template
4. Can edit template (if implemented)
5. Templates include:
   - Report shared notification
   - Offer sent
   - Offer reminder
   - Appointment confirmation
   - User invitation

**Technical Implementation:**

- Templates stored in Firestore `/emailTemplates/{templateId}`
- Template variables: `{{customerName}}`, `{{reportLink}}`, etc.
- Template rendering service

**Permissions & Access:**

- **Required Role:** Superadmin only
- **Permission Level:** 2 (Superadmin)

---

### 9.2 Email Sending

**Overview:** Send emails via MailerSend service.

**Location:**

- **Service:** `src/services/emailService.ts` or Cloud Functions
- **Integration:** MailerSend API

**Technical Implementation:**

- Uses MailerSend API or Cloud Function
- Renders template with variables
- Sends email
- Logs communication

**Email Types:**

- Report shared
- Offer sent
- Offer reminder
- Appointment confirmation
- User invitation
- Follow-up notifications

---

### 9.3 Email Status Tracking

**Overview:** Track email delivery and open status.

**Location:**

- **Service:** `src/services/emailStatusService.ts`

**Technical Implementation:**

- MailerSend webhooks for delivery status
- Stores status in Firestore `/emailCommunications/{id}`
- Statuses: sent, delivered, opened, bounced, failed

---

### 9.4 Email Preferences

**Overview:** User preferences for email notifications.

**Location:**

- **Service:** `src/services/emailPreferenceService.ts`

**Technical Implementation:**

- Stores preferences in Firestore
- Controls which emails user receives

---

### 9.5 Unsubscribe Functionality

**Overview:** Allow customers to unsubscribe from emails.

**Location:**

- **Route:** `/unsubscribe`
- **Component:** `src/components/UnsubscribePage.tsx`

**User Flow:**

1. Customer clicks unsubscribe link in email
2. Navigates to `/unsubscribe?token={token}`
3. Unsubscribe page loads
4. Customer confirms unsubscribe
5. Email preference updated

**Technical Implementation:**

- Validates unsubscribe token
- Updates preference in Firestore
- Shows confirmation message

---

### 9.6 Email Delivery Status

**Overview:** View email delivery status dashboard.

**Location:**

- **Component:** `src/components/email/EmailStatusDashboard.tsx`

**Technical Implementation:**

- Displays email communications with status
- Filters by status, date, recipient
- Shows delivery/read rates

---

## 10. Image Management

### 10.1 Upload Roof Images

**Overview:** Upload and annotate roof overview images.

**Location:**

- **Component:** `src/components/RoofImageAnnotation.tsx` (Step 2 of report form)

**User Flow:**

1. User in report form Step 2
2. Clicks "Upload Roof Image" or takes photo
3. Image preview shows
4. User can add pins/markers on image
5. Pins linked to issues (if created)
6. Image saved to Firebase Storage

**Technical Implementation:**

- Image uploaded to Firebase Storage: `roof-images/{reportId}/roof-overview.png`
- Pin coordinates stored in `report.roofImagePins[]` (x, y percentages)
- Component: `RoofImageAnnotation.tsx` - Interactive image with click-to-add pins
- Uses canvas for pin rendering

**Storage:**

- Firebase Storage path: `roof-images/{reportId}/`
- Report field: `roofImageUrl`, `roofImagePins[]`

---

### 10.2 Upload Issue Images

**Overview:** Upload multiple images per issue.

**Location:**

- **Component:** `src/components/IssueImageUpload.tsx` (Step 3 of report form)

**User Flow:**

1. User adds issue in Step 3
2. Clicks "Upload Images" for issue
3. Selects multiple images (max 5 per issue)
4. Images upload to Firebase Storage
5. Image URLs stored in `issue.images[]`

**Technical Implementation:**

- `imageUploadService.uploadIssueImage(reportId, issueId, file)`
- Uploads to: `roof-images/{reportId}/issues/{issueId}/{filename}`
- Max 5 images per issue (FORM_CONSTANTS.MAX_IMAGES_PER_ISSUE)
- Shows progress during upload
- Displays thumbnails

**Storage:**

- Firebase Storage: `roof-images/{reportId}/issues/{issueId}/`
- Report field: `issuesFound[].images[]`

---

### 10.3 Image Annotation (Pins/Markers)

**Overview:** Add visual markers on roof image to indicate issue locations.

**Location:**

- **Component:** `src/components/RoofImageAnnotation.tsx`

**Technical Implementation:**

- Click on image to add pin
- Pin positioned at click coordinates (x, y percentages)
- Pin color based on severity (low=green, medium=yellow, high=orange, critical=red)
- Can link pin to issue (if issue exists)
- Can show/hide pins
- Pins stored in `report.roofImagePins[]`

**Data Model:**

```typescript
{
  id: string,
  x: number, // 0-100 (percentage from left)
  y: number, // 0-100 (percentage from top)
  issueId?: string, // Link to issue
  severity: IssueSeverity
}
```

---

### 10.4 Image Gallery

**Overview:** View all images associated with report.

**Location:**

- **Component:** `ReportView.tsx` - Images section

**User Flow:**

1. User views report
2. Scrolls to Images section
3. Sees:
   - Roof overview image (if uploaded)
   - All issue images grouped by issue
4. Can click to view full size
5. Can download images

**Technical Implementation:**

- Fetches image URLs from report document
- Displays in gallery grid
- Lightbox/modal for full-size view

---

### 10.5 Image Storage (Firebase Storage)

**Overview:** All images stored in Firebase Storage with organized structure.

**Storage Structure:**

```
roof-images/
  {reportId}/
    roof-overview.png (or .jpg)
    issues/
      {issueId}/
        image1.jpg
        image2.jpg
```

**Security Rules:**

- Read: User with report access
- Write: User with report write permissions
- Defined in `storage.rules`

**Technical Implementation:**

- Upload via `imageUploadService.ts`
- Uses Firebase Storage SDK
- Generates download URLs
- Stores URLs in Firestore report document

---

## 11. Map Features

### 11.1 Interactive Roof Map

**Overview:** Satellite map with markers for issue locations.

**Location:**

- **Component:** `src/components/InteractiveRoofMap.tsx` (Lazy loaded)
- **Used in:** Report Form (Step 2), Report View

**User Flow:**

1. User in report form Step 2
2. Sees satellite map centered on customer address
3. Can click on map to add markers
4. Markers linked to issues
5. Map shows all issue locations

**Technical Implementation:**

- Uses Leaflet.js library
- Base layer: OpenStreetMap satellite tiles
- Geocodes customer address (Nominatim API)
- Stores markers in `report.roofMapMarkers[]`
- Marker coordinates: `{ lat, lon }`
- Marker colors based on severity

**Data Model:**

```typescript
{
  id: string,
  lat: number,
  lon: number,
  issueId?: string,
  severity: IssueSeverity
}
```

**Dependencies:**

- Leaflet.js
- OpenStreetMap tiles
- Nominatim API (geocoding)

---

### 11.2 Address Geocoding

**Overview:** Convert addresses to coordinates for map display.

**Location:**

- **Service:** Nominatim API (OpenStreetMap)
- **Component:** `AddressInput.tsx`, `ReportView.tsx`

**Technical Implementation:**

- Calls: `https://nominatim.openstreetmap.org/search?format=json&q={address}`
- Returns coordinates: `{ lat, lon }`
- Used for:
  - Centering map on address
  - Validating address
  - Displaying location

**Rate Limits:**

- Free tier: 1 request/second
- Should implement caching

---

### 11.3 Map Markers/Pins

**Overview:** Visual markers on map indicating issue locations.

**Technical Implementation:**

- Markers added via click on map
- Stored in `report.roofMapMarkers[]`
- Displayed in ReportView
- Color-coded by severity
- Clickable to view issue details

---

### 11.4 Satellite View

**Overview:** Satellite imagery for roof inspection context.

**Technical Implementation:**

- Leaflet.js satellite tile layer
- Provides visual context for roof location
- Helps inspectors identify property

---

### 11.5 Issue Location Mapping

**Overview:** Link map markers to specific issues.

**User Flow:**

1. User creates issue in Step 3
2. Goes back to map (Step 2)
3. Clicks on map where issue is located
4. Marker created
5. Can link marker to issue via dropdown

**Technical Implementation:**

- Markers can have `issueId` field
- Linking creates association
- Clicking marker shows issue details

---

## 12. Quick Actions (FAB)

### 12.1 Context-aware Actions

**Overview:** Floating Action Button that shows relevant actions based on current page.

**Location:**

- **Component:** `src/components/navigation/QuickActions.tsx`
- **Triggered:** Automatically on pages: Dashboard, Reports, Report View, Offers, Customers

**User Flow:**

1. User scrolls down on page (>100px)
2. FAB appears in bottom-right corner
3. User clicks FAB
4. Action menu expands
5. User clicks desired action
6. Navigates to action or executes function

**Technical Implementation:**

- Context determined by current route:
  - `dashboard` - New Report, New Customer, View Reports
  - `report` - Edit Report, Create Offer, Share, Download PDF
  - `reports` - New Report, Export Reports
  - `offers` - New Offer, View Reports
  - `customer` - New Report, Create Offer, Schedule Appointment
- Scroll detection via `useEffect` with scroll listener
- Animations for menu expansion

**Available Actions by Context:**

**Dashboard:**

- New Report
- New Customer
- View Reports

**Report View:**

- Edit Report
- Create Offer
- Share Report
- Download PDF

**Reports List:**

- New Report
- Export Reports (bulk)

**Offers:**

- New Offer
- View Reports

**Customer:**

- New Report (with customer pre-filled)
- Create Offer (with customer pre-filled)
- Schedule Appointment (with customer pre-filled)

**Permissions & Access:**

- Actions filtered by user role
- Requires authentication

---

### 12.2 Back to Top

**Overview:** Scroll to top button when scrolled down.

**Location:**

- **Component:** `QuickActions.tsx` (shows when FAB visible)

**Technical Implementation:**

- Appears when scrolled >100px
- Smooth scroll to top on click

---

## 13. Public Features

### 13.1 Public Report View

**Overview:** Customers can view reports via public link without authentication.

**Location:**

- **Route:** `/report/public/:reportId`
- **Component:** `src/components/reports/PublicReportView.tsx`

**User Flow:**

1. Customer receives public report link
2. Clicks link
3. Public report page loads (no login)
4. Views report in read-only mode
5. Can download PDF (if enabled)
6. Can print report

**Technical Implementation:**

- Checks `report.isPublic` flag in Firestore
- Public read access via Firestore rules
- Limited functionality (read-only)
- No edit/delete actions
- Professional layout for customer viewing

**Permissions & Access:**

- **Required Role:** Public (no authentication)
- **Firestore Rules:**
  - Read: `isPublic == true` OR authenticated with access (`firestore.rules` line 106)

**Data Model:**

- **Input:** `reportId` from URL
- **Output:** `Report` object
- **Storage:** Firestore `/reports/{reportId}`

---

### 13.2 Public Offer View

**Overview:** Customers can view and respond to offers via public link.

**Location:**

- **Route:** `/offer/public/:offerId`
- **Component:** `src/components/offers/PublicOfferView.tsx` (Lazy loaded)

**User Flow:**

1. Customer receives offer email
2. Clicks acceptance link
3. Public offer page loads
4. Views offer details
5. Clicks "Accept" or "Reject"
6. Status updated
7. Thank you page shown

**Technical Implementation:**

- Public read access to offer
- `offerService.respondToOfferPublic(offerId, response, reason)`
- Updates offer status
- No authentication required

**Permissions & Access:**

- **Required Role:** Public
- **Firestore Rules:** Public read/write for status updates

---

### 13.3 Offer Thank You Page

**Overview:** Confirmation page after customer accepts/rejects offer.

**Location:**

- **Route:** `/offer/thank-you`
- **Component:** `src/components/offers/OfferThankYou.tsx` (Lazy loaded)

**User Flow:**

1. Customer accepts/rejects offer
2. Redirected to `/offer/thank-you`
3. Sees confirmation message
4. Different message based on accept/reject

**Technical Implementation:**

- Reads response from navigation state or URL params
- Displays appropriate message

---

### 13.4 Unsubscribe Page

**Overview:** Allow email recipients to unsubscribe.

**Location:**

- **Route:** `/unsubscribe`
- **Component:** `src/components/UnsubscribePage.tsx`

**User Flow:**

1. Customer clicks unsubscribe in email
2. Navigates to `/unsubscribe?token={token}`
3. Confirms unsubscribe
4. Preference updated
5. Confirmation shown

**Technical Implementation:**

- Validates token
- Updates email preferences
- Stores in Firestore

---

## 14. Admin Features

### 14.1 User Management

**Overview:** Complete user management system (covered in 2.4)

---

### 14.2 Branch Management

**Overview:** Complete branch management (covered in 7)

---

### 14.3 Analytics Dashboard

**Overview:** Complete analytics (covered in 8)

---

### 14.4 Email Template Viewer

**Overview:** View and manage email templates.

**Location:**

- **Route:** `/admin/email-templates`
- **Component:** `src/components/admin/EmailTemplateViewer.tsx` (Lazy loaded)

**Permissions & Access:**

- **Required Role:** Superadmin only

---

### 14.5 QA Testing Page (Dev)

**Overview:** Development tools for testing and QA.

**Location:**

- **Route:** `/admin/qa`
- **Component:** `src/components/admin/QATestingPage.tsx` (Lazy loaded)
- **Visibility:** Only in development mode (`process.env.NODE_ENV === 'development'`)

**Features:**

- Test email sending
- Test PDF generation
- Test notifications
- Debug tools
- Data validation checks

**Permissions & Access:**

- **Required Role:** Superadmin only
- **Visibility:** Development mode only

---

## 15. Form Features

### 15.1 Multi-step Form Navigation

**Overview:** Report form divided into 4 steps for better UX.

**Location:**

- **Component:** `src/components/ReportForm.tsx`

**Steps:**

1. **Customer Information** - Name, address, contact, date
2. **Inspection Details** - Roof type, age, condition, roof image
3. **Issues & Actions** - Add issues found, recommended actions
4. **Offer Information** - Offer value, validity, prior reports

**User Flow:**

1. User progresses through steps using "Next" button
2. Each step validates before allowing progression
3. Can go back using "Previous" button
4. Current step highlighted in progress indicator
5. Step persisted in localStorage

**Technical Implementation:**

- Step state: `useState<number>(1)`
- Step validation: `validateStep(stepNumber)` before progression
- Step persistence: `localStorage.setItem('reportFormStep_{userId}', step)`
- Progress indicator: Visual dots showing current step
- Focus management: Auto-focuses first field on step change

---

### 15.2 Auto-save (Draft)

**Overview:** Automatically saves form data as draft (covered in 3.8)

---

### 15.3 Form Validation

**Overview:** Comprehensive validation at step and form level.

**Location:**

- **Component:** `src/components/ReportForm.tsx`

**Validation Functions:**

- `validateStep(step)` - Validates specific step before progression
- `validateForm()` - Validates entire form before submission

**Validation Rules:**

**Step 1:**

- Customer name: Required, 2-100 characters
- Customer address: Required
- Inspection date: Required, cannot be in future
- Email: Optional, but if provided must be valid format
- Phone: Optional, but if provided must be valid format

**Step 2:**

- Roof type: Required
- Roof age: Optional, but if provided must be 0-100

**Step 3:**

- Issues: Optional (for better UX)
- If issue added: Title, description, severity required

**Step 4:**

- Offer value: Optional, but if provided must be >= 0 and <= 10,000,000
- Offer valid until: If provided, must be after inspection date

**Error Display:**

- Field-level errors below input
- Summary error box at top
- Errors clear on field correction
- Step validation prevents progression

**Technical Implementation:**

- `validationErrors` state: `Record<string, string>`
- Error messages from translations (`src/locales/sv/reportForm.json`)
- Real-time validation on blur
- Submit validation before save

---

### 15.4 Field-level Error Handling

**Overview:** Show errors directly below fields.

**Technical Implementation:**

- Error stored in `validationErrors[fieldName]`
- `MaterialFormField` component displays error
- Error clears when field value changes (`clearFieldError`)
- Visual indication: Red border, error message

---

### 15.5 Step Validation

**Overview:** Validate step before allowing progression to next step.

**User Flow:**

1. User clicks "Next" button
2. System validates current step
3. If valid: Proceeds to next step
4. If invalid: Shows errors, scrolls to top, prevents progression

**Technical Implementation:**

- `handleNext()` calls `validateStep(currentStep)`
- If invalid: Shows notification, scrolls to top, highlights errors
- Validation errors persist until fixed

---

### 15.6 Auto-complete (Customer Search)

**Overview:** Search for existing customers while typing customer name.

**Location:**

- **Component:** `src/components/ReportForm.tsx` (Step 1)

**User Flow:**

1. User types customer name (3+ characters)
2. System searches for existing customers (debounced 1s)
3. If match found with previous report:
   - Shows dialog: "We found existing customer '{name}' with a previous report"
   - User can: Import data OR Start fresh
4. If import: Pre-fills customer data and links to prior report

**Technical Implementation:**

- `checkForExistingCustomer(customerName)` - Debounced search
- Uses `customerService.searchCustomers(name, branchId)`
- If customer found: Gets latest report via `reportService.getLatestReportForCustomer()`
- Shows `AutoCompleteDialog` component
- Import fills: name, address, phone, email, links `priorReportId`

**Dependencies:**

- `customerService.ts` - Customer search
- `reportService.ts` - Latest report lookup

---

### 15.7 Prior Reports Linking

**Overview:** Link new report to previous report/offer for same customer.

**Location:**

- **Component:** `src/components/ReportForm.tsx` (Step 4)

**User Flow:**

1. User enters customer name
2. System loads prior reports for that customer (debounced 500ms)
3. Step 4 shows "Link to Prior Report/Offer" dropdown
4. User selects prior report
5. Report linked via `priorReportId` field

**Technical Implementation:**

- `loadPriorReports()` - Fetches reports with same customerName
- Filters by current user's branch
- Excludes current report (if editing)
- Stores selected `priorReportId` in form data
- Linked in Firestore: `report.priorReportId = string`

**Dependencies:**

- `reportService.getReports(user)` - Fetches all user reports
- Client-side filtering by customerName

---

## 16. Role-Based Access Matrix

| Functionality         | Inspector              | Branch Admin             | Superadmin    | Public           |
| --------------------- | ---------------------- | ------------------------ | ------------- | ---------------- |
| **Authentication**    |
| Login                 | ✅                     | ✅                       | ✅            | ✅               |
| Logout                | ✅                     | ✅                       | ✅            | ❌               |
| **Reports**           |
| Create Report         | ✅ (Own branch)        | ✅ (Own branch)          | ✅ (All)      | ❌               |
| Edit Report           | ✅ (Own only)          | ✅ (Branch)              | ✅ (All)      | ❌               |
| View Report           | ✅ (Branch)            | ✅ (Branch)              | ✅ (All)      | ✅ (If public)   |
| Delete Report         | ❌                     | ✅ (Branch)              | ✅ (All)      | ❌               |
| Share Report          | ✅ (Own)               | ✅ (Branch)              | ✅ (All)      | ❌               |
| Export PDF            | ✅ (Branch)            | ✅ (Branch)              | ✅ (All)      | ✅ (If public)   |
| **Customers**         |
| Create Customer       | ❌                     | ✅ (Branch)              | ✅ (All)      | ❌               |
| View Customers        | ✅ (Read-only, Branch) | ✅ (Branch)              | ✅ (All)      | ❌               |
| Edit Customer         | ❌                     | ✅ (Branch)              | ✅ (All)      | ❌               |
| Delete Customer       | ❌                     | ✅ (Branch)              | ✅ (All)      | ❌               |
| **Offers**            |
| Create Offer          | ✅ (From own reports)  | ✅ (From branch reports) | ✅ (From all) | ❌               |
| View Offers           | ✅ (Own offers)        | ✅ (Branch)              | ✅ (All)      | ✅ (Public link) |
| Send Offer            | ✅ (Own)               | ✅ (Branch)              | ✅ (All)      | ❌               |
| Accept/Reject Offer   | ❌                     | ❌                       | ❌            | ✅ (Public link) |
| **Appointments**      |
| Create Appointment    | ❌                     | ✅ (Branch)              | ✅ (All)      | ❌               |
| View Schedule         | ✅ (Own only)          | ✅ (Branch)              | ✅ (All)      | ❌               |
| Edit Appointment      | ❌                     | ✅ (Branch)              | ✅ (All)      | ❌               |
| Delete Appointment    | ❌                     | ✅ (Branch)              | ✅ (All)      | ❌               |
| Complete Appointment  | ✅ (Own)               | ✅ (Branch)              | ✅ (All)      | ❌               |
| **Branch Management** |
| Create Branch         | ❌                     | ❌                       | ✅            | ❌               |
| Edit Branch           | ❌                     | ❌                       | ✅            | ❌               |
| Delete Branch         | ❌                     | ❌                       | ✅            | ❌               |
| View Branches         | ✅ (Own only)          | ✅ (Own only)            | ✅ (All)      | ❌               |
| **Users**             |
| Create User           | ❌                     | ✅ (Branch)              | ✅ (All)      | ❌               |
| View Users            | ✅ (Own only)          | ✅ (Branch)              | ✅ (All)      | ❌               |
| Edit User             | ❌                     | ✅ (Branch)              | ✅ (All)      | ❌               |
| Delete User           | ❌                     | ✅ (Branch)              | ✅ (All)      | ❌               |
| **Analytics**         |
| View Analytics        | ❌                     | ✅ (Branch)              | ✅ (All)      | ❌               |
| Export Analytics      | ❌                     | ✅ (Branch)              | ✅ (All)      | ❌               |
| **Admin**             |
| Email Templates       | ❌                     | ❌                       | ✅            | ❌               |
| QA Testing            | ❌                     | ❌                       | ✅ (Dev only) | ❌               |

---

## Appendix: Quick Reference

### Routes to Functionality

| Route                    | Functionality            | Component                 |
| ------------------------ | ------------------------ | ------------------------- |
| `/login`                 | Login                    | `LoginForm.tsx`           |
| `/dashboard`             | Dashboard                | `Dashboard.tsx`           |
| `/profile`               | User Profile             | `UserProfile.tsx`         |
| `/report/new`            | Create Report            | `ReportForm.tsx`          |
| `/report/edit/:id`       | Edit Report              | `ReportForm.tsx`          |
| `/report/view/:id`       | View Report              | `ReportView.tsx`          |
| `/report/public/:id`     | Public Report            | `PublicReportView.tsx`    |
| `/reports`               | Reports List (Inspector) | `AllReports.tsx`          |
| `/admin/reports`         | Reports List (Admin)     | `AllReports.tsx`          |
| `/offers`                | Offers List              | `OffersPage.tsx`          |
| `/offer/public/:id`      | Public Offer             | `PublicOfferView.tsx`     |
| `/offer/thank-you`       | Offer Thank You          | `OfferThankYou.tsx`       |
| `/schedule`              | Schedule                 | `SchedulePage.tsx`        |
| `/admin/users`           | User Management          | `UserManagement.tsx`      |
| `/admin/customers`       | Customer Management      | `CustomerManagement.tsx`  |
| `/admin/branches`        | Branch Management        | `BranchManagement.tsx`    |
| `/admin/analytics`       | Analytics                | `AnalyticsDashboard.tsx`  |
| `/admin/email-templates` | Email Templates          | `EmailTemplateViewer.tsx` |
| `/admin/qa`              | QA Testing               | `QATestingPage.tsx`       |
| `/unsubscribe`           | Unsubscribe              | `UnsubscribePage.tsx`     |

### Service Methods Reference

**reportService.ts:**

- `createReport(reportData, branchId)` - Create new report
- `updateReport(reportId, updates)` - Update existing report
- `deleteReport(reportId, branchId)` - Delete report
- `getReport(reportId, branchId?)` - Get single report
- `getReports(user)` - Get all reports (filtered by permissions)
- `generatePDF(reportId, branchId)` - Generate PDF
- `getLatestReportForCustomer(name, email, phone, branchId)` - Get prior report

**offerService.ts:**

- `createOffer(offerData)` - Create offer
- `getOffers(user)` - Get offers (filtered)
- `getOffer(offerId)` - Get single offer
- `sendOfferToCustomer(offerId)` - Send email
- `acceptOffer(offerId)` - Customer accept
- `rejectOffer(offerId, reason)` - Customer reject
- `extendOfferValidity(offerId, newDate)` - Extend validity
- `getOffersNeedingFollowUp(user)` - Get pending offers

**customerService.ts:**

- `createCustomer(customerData)` - Create customer
- `getCustomers(branchId?)` - Get all customers
- `getCustomerById(customerId)` - Get single customer
- `searchCustomers(searchTerm, branchId)` - Search customers
- `updateCustomer(customerId, updates, user)` - Update customer
- `deleteCustomer(customerId, user)` - Delete customer
- `findOrCreateCustomer(reportData)` - Find or create from report

**appointmentService.ts:**

- `createAppointment(appointmentData)` - Create appointment
- `getAppointments(user)` - Get appointments (filtered)
- `getAppointment(appointmentId)` - Get single appointment
- `updateAppointment(appointmentId, updates)` - Update appointment
- `deleteAppointment(appointmentId)` - Delete appointment
- `startAppointment(appointmentId)` - Start appointment
- `completeAppointment(appointmentId, reportId?)` - Complete appointment
- `cancelAppointment(appointmentId, reason)` - Cancel appointment

**userService.ts:**

- `getUsers(branchId?)` - Get users
- `getUser(userId)` - Get single user
- `createUser(userData)` - Create user
- `updateUser(userId, updates, user)` - Update user
- `deleteUser(userId, user)` - Delete user
- `toggleUserStatus(userId, isActive)` - Activate/deactivate

**branchService.ts:**

- `getBranches()` - Get all branches
- `getBranch(branchId)` - Get single branch
- `createBranch(branchData)` - Create branch
- `updateBranch(branchId, updates)` - Update branch
- `deleteBranch(branchId)` - Delete branch

---

## Conclusion

This inventory documents all functionalities in the Taklaget Service App. Each functionality includes:

- Location (routes, components, services)
- User flows (step-by-step)
- Technical implementation details
- Permissions and access control
- Data models and dependencies

**For Specialists:** Use this document to understand:

- How to navigate to any feature
- What each feature does and how it works
- Which roles can access which features
- Technical implementation details
- Service method signatures
- Data structures

**Next Steps:**

- See `QUICK_REFERENCE.md` for route mappings
- See `TECHNICAL_REFERENCE.md` for detailed technical documentation
