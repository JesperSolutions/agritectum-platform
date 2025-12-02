# Taklaget Service App - Quick Reference Guide

**Date:** 2025-01-31  
**Version:** 1.0

---

## Route to Functionality Mapping

| Route | Functionality | Component | Allowed Roles |
|-------|--------------|------------|---------------|
| `/login` | Login | `LoginForm.tsx` | Public |
| `/dashboard` | Dashboard | `Dashboard.tsx` | Inspector, Branch Admin, Superadmin |
| `/profile` | User Profile | `UserProfile.tsx` | Inspector, Branch Admin, Superadmin |
| `/report/new` | Create Report | `ReportForm.tsx` | Inspector, Branch Admin |
| `/report/edit/:id` | Edit Report | `ReportForm.tsx` | Inspector, Branch Admin |
| `/report/view/:id` | View Report | `ReportView.tsx` | Inspector, Branch Admin, Superadmin |
| `/report/public/:id` | Public Report | `PublicReportView.tsx` | Public |
| `/reports` | Reports List (Inspector) | `AllReports.tsx` | Inspector |
| `/admin/reports` | Reports List (Admin) | `AllReports.tsx` | Branch Admin, Superadmin |
| `/offers` | Offers List | `OffersPage.tsx` | Inspector, Branch Admin, Superadmin |
| `/offer/public/:id` | Public Offer | `PublicOfferView.tsx` | Public |
| `/offer/thank-you` | Offer Thank You | `OfferThankYou.tsx` | Public |
| `/schedule` | Schedule | `SchedulePage.tsx` | Inspector, Branch Admin, Superadmin |
| `/admin/users` | User Management | `UserManagement.tsx` | Branch Admin, Superadmin |
| `/admin/customers` | Customer Management | `CustomerManagement.tsx` | Inspector (read-only), Branch Admin, Superadmin |
| `/admin/branches` | Branch Management | `BranchManagement.tsx` | Superadmin |
| `/admin/analytics` | Analytics | `AnalyticsDashboard.tsx` | Branch Admin, Superadmin |
| `/admin/email-templates` | Email Templates | `EmailTemplateViewer.tsx` | Superadmin |
| `/admin/qa` | QA Testing | `QATestingPage.tsx` | Superadmin (Dev only) |
| `/unsubscribe` | Unsubscribe | `UnsubscribePage.tsx` | Public |
| `/marketing` | Marketing Page | `MarketingPage.tsx` | Superadmin |

---

## Role-Based Feature Matrix

### Inspector (Permission Level 0)

**Can Access:**
- ✅ Dashboard
- ✅ User Profile
- ✅ Create Report (own branch)
- ✅ Edit Report (own reports only)
- ✅ View Report (branch reports)
- ✅ Reports List (own reports)
- ✅ Offers List (own offers)
- ✅ Create Offer (from own reports)
- ✅ View Schedule (own appointments only)
- ✅ Complete Appointment (own appointments)
- ✅ View Customers (read-only, branch)
- ✅ Create Report from Customer (via customer detail)

**Cannot Access:**
- ❌ Delete Report
- ❌ Create Customer
- ❌ Edit Customer
- ❌ Delete Customer
- ❌ Create Appointment
- ❌ Edit Appointment
- ❌ Delete Appointment
- ❌ User Management
- ❌ Branch Management
- ❌ Analytics
- ❌ Email Templates

---

### Branch Admin (Permission Level 1)

**Can Access:**
- ✅ All Inspector features
- ✅ Create Report (branch)
- ✅ Edit Report (branch reports)
- ✅ Delete Report (branch)
- ✅ Reports List (all branch reports)
- ✅ Admin Reports List
- ✅ Create Customer
- ✅ Edit Customer
- ✅ Delete Customer
- ✅ Create Offer (branch reports)
- ✅ Send Offer
- ✅ Create Appointment
- ✅ Edit Appointment
- ✅ Delete Appointment
- ✅ User Management (branch users)
- ✅ Analytics (branch data)
- ✅ View Schedule (branch appointments)

**Cannot Access:**
- ❌ Branch Management
- ❌ Email Templates
- ❌ QA Testing (dev)

---

### Superadmin (Permission Level 2)

**Can Access:**
- ✅ All Branch Admin features
- ✅ All Reports (all branches)
- ✅ All Customers (all branches)
- ✅ All Offers (all branches)
- ✅ All Appointments (all branches)
- ✅ Branch Management
- ✅ User Management (all branches)
- ✅ Analytics (all branches)
- ✅ Email Templates
- ✅ QA Testing (dev only)

**Full System Access**

---

### Public (No Authentication)

**Can Access:**
- ✅ Login Page
- ✅ Public Report View (if `isPublic = true`)
- ✅ Public Offer View
- ✅ Offer Acceptance/Rejection
- ✅ Offer Thank You Page
- ✅ Unsubscribe Page

---

## Common Workflows

### Workflow 1: Inspector Creates Report

1. Login → `/dashboard`
2. Click "New Report" (sidebar or dashboard) → `/report/new`
3. Fill Step 1: Customer Information
4. Click "Next" → Step 2: Inspection Details
5. Upload roof image, add annotations
6. Click "Next" → Step 3: Issues & Actions
7. Add issues and recommended actions
8. Click "Next" → Step 4: Offer Information
9. Optionally set offer value
10. Click "Complete Report"
11. Redirected to → `/report/view/:reportId`

**Entry Points:**
- Sidebar: "New Report"
- Dashboard: "New Report" button
- Quick Actions FAB: "New Report"
- Customer Management: "Create Report" button

---

### Workflow 2: Inspector Creates Offer from Report

1. View Report → `/report/view/:reportId`
2. Click "Create Offer" button
3. Fill offer form (costs, margin, validity)
4. Click "Create Offer"
5. Offer created, link generated
6. Click "Send Offer" (optional)
7. Email sent to customer

**Alternative:**
- View Offers → `/offers`
- Click "New Offer"
- Select report from dropdown
- Fill form and create

---

### Workflow 3: Customer Accepts Offer (Public)

1. Customer receives email with offer link
2. Clicks link → `/offer/public/:offerId`
3. Views offer details
4. Clicks "Accept Offer" or "Reject Offer"
5. If reject: Enters reason (optional)
6. Status updated
7. Redirected to → `/offer/thank-you`
8. Thank you message displayed

---

### Workflow 4: Branch Admin Creates Appointment

1. Navigate to Schedule → `/schedule`
2. Click "Create New Appointment"
3. Fill form:
   - Customer name/address
   - Assign inspector
   - Date/time
   - Duration
   - Type
4. Click "Save Appointment"
5. Appointment appears in calendar

---

### Workflow 5: Inspector Completes Appointment

1. View Schedule → `/schedule`
2. See own appointments in calendar
3. Click on appointment
4. Click "Start Inspection"
5. Redirected to → `/report/new` (with appointment data pre-filled)
6. Complete report (see Workflow 1)
7. Report automatically linked to appointment

---

### Workflow 6: Inspector Views Customer Directory

1. Navigate to Customers → `/admin/customers`
2. See customer list (read-only)
3. Search customers by name
4. Click "View" on customer
5. Customer detail modal opens
6. Click "Create Report" button
7. Redirected to → `/report/new?customerId=X&customerName=Y&customerAddress=Z`
8. Report form pre-fills customer data

---

### Workflow 7: Branch Admin Creates Customer

1. Navigate to Customers → `/admin/customers`
2. Click "Add Customer"
3. Fill form: Name, Email, Phone, Address, Company
4. Click "Save"
5. Customer created and appears in list

---

### Workflow 8: Share Report with Customer

1. View Report → `/report/view/:reportId`
2. Click "Share" button
3. System generates public link
4. Modal shows link and QR code
5. Copy link or send via email
6. Customer can view report without login

---

### Workflow 9: Export Report PDF

1. View Report → `/report/view/:reportId`
2. Click "Export PDF" button
3. PDF generates (loading state)
4. PDF downloads automatically
5. File: `Report_{customerName}_{date}.pdf`

---

### Workflow 10: View Analytics

1. Navigate to Analytics → `/admin/analytics`
2. View dashboard with:
   - Revenue charts
   - Report statistics
   - Customer statistics
   - Branch performance (superadmin)
3. Filter by date range
4. Filter by branch (superadmin)
5. Export data (if implemented)

---

## Navigation Shortcuts

### Quick Actions FAB

**Available on:**
- Dashboard (`/dashboard`)
- Reports List (`/reports`, `/admin/reports`)
- Report View (`/report/view/:id`)
- Offers List (`/offers`)
- Customer Management (`/admin/customers`)

**Actions by Context:**

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
- Export Reports

**Offers:**
- New Offer
- View Reports

**Customer:**
- New Report (pre-filled)
- Create Offer (pre-filled)
- Schedule Appointment (pre-filled)

---

### Sidebar Navigation

**Always Visible:**
- Dashboard
- Profile
- New Report (Inspector, Branch Admin)
- My Reports (Inspector only)
- Customers (All)
- Schedule (All)
- Offers (All)

**Admin Only:**
- Users (Branch Admin, Superadmin)
- Analytics (Branch Admin, Superadmin)
- Reports (Admin) (Branch Admin, Superadmin)
- Branches (Superadmin only)
- Email Templates (Superadmin only)
- QA Testing (Superadmin, Dev only)

---

## Service Methods Quick Reference

### reportService.ts

```typescript
// Create
createReport(reportData: Partial<Report>, branchId: string): Promise<string>

// Read
getReport(reportId: string, branchId?: string): Promise<Report | null>
getReports(user: User): Promise<Report[]>
getLatestReportForCustomer(name, email, phone, branchId): Promise<Report | null>

// Update
updateReport(reportId: string, updates: Partial<Report>): Promise<void>

// Delete
deleteReport(reportId: string, branchId?: string): Promise<void>

// PDF
generatePDF(reportId: string, branchId?: string): Promise<string>
```

### offerService.ts

```typescript
// Create
createOffer(offerData: OfferData): Promise<string>

// Read
getOffer(offerId: string): Promise<Offer | null>
getOffers(user: User): Promise<Offer[]>
getOffersNeedingFollowUp(user: User): Promise<Offer[]>
reportHasOffer(reportId: string, userBranchId?: string): Promise<boolean>

// Update
updateOfferStatus(offerId: string, status: OfferStatus, user: User, reason?: string): Promise<void>
extendOfferValidity(offerId: string, newDate: string): Promise<void>

// Send
sendOfferToCustomer(offerId: string): Promise<void>
sendReminderToCustomer(offerId: string): Promise<void>

// Customer Response
acceptOffer(offerId: string): Promise<void>
rejectOffer(offerId: string, reason?: string): Promise<void>
respondToOfferPublic(offerId: string, response: 'accept' | 'reject', reason?: string): Promise<void>
```

### customerService.ts

```typescript
// Create
createCustomer(customerData: CustomerData): Promise<string>

// Read
getCustomers(branchId?: string): Promise<Customer[]>
getCustomerById(customerId: string): Promise<Customer | null>
searchCustomers(searchTerm: string, branchId?: string): Promise<Customer[]>

// Update
updateCustomer(customerId: string, updates: Partial<Customer>, user: User): Promise<void>
updateCustomerStats(customerId: string): Promise<void>

// Delete
deleteCustomer(customerId: string, user: User): Promise<void>

// Utility
findOrCreateCustomer(reportData: {...}): Promise<Customer>
```

### appointmentService.ts

```typescript
// Create
createAppointment(appointmentData: AppointmentData): Promise<string>

// Read
getAppointments(user: User): Promise<Appointment[]>
getAppointment(appointmentId: string): Promise<Appointment | null>
getAppointmentsByDate(date: string, user: User): Promise<Appointment[]>
getUpcomingAppointments(user: User, days?: number): Promise<Appointment[]>

// Update
updateAppointment(appointmentId: string, updates: Partial<Appointment>): Promise<void>
startAppointment(appointmentId: string): Promise<void>
completeAppointment(appointmentId: string, reportId?: string): Promise<void>
cancelAppointment(appointmentId: string, reason?: string): Promise<void>

// Delete
deleteAppointment(appointmentId: string): Promise<void>

// Utility
checkConflicts(inspectorId: string, date: string, time: string, duration: number): Promise<boolean>
```

### userService.ts

```typescript
// Read
getUsers(branchId?: string): Promise<Employee[]>
getUser(userId: string): Promise<Employee | null>

// Create
createUser(userData: Omit<Employee, 'id'>): Promise<string>

// Update
updateUser(userId: string, updates: Partial<Employee>, user: User): Promise<void>
toggleUserStatus(userId: string, isActive: boolean): Promise<void>

// Delete
deleteUser(userId: string, user: User): Promise<void>
```

### branchService.ts

```typescript
// Read
getBranches(): Promise<Branch[]>
getBranch(branchId: string): Promise<Branch | null>

// Create
createBranch(branchData: Omit<Branch, 'id'>): Promise<string>

// Update
updateBranch(branchId: string, updates: Partial<Branch>): Promise<void>

// Delete
deleteBranch(branchId: string): Promise<void>
```

---

## Data Models Quick Reference

### Report

```typescript
{
  id: string
  createdBy: string
  createdByName: string
  branchId: string
  inspectionDate: string
  customerName: string
  customerAddress: string
  customerPhone?: string
  customerEmail?: string
  roofType: RoofType
  roofAge?: number
  conditionNotes: string
  issuesFound: Issue[]
  recommendedActions: RecommendedAction[]
  status: ReportStatus
  createdAt: string
  lastEdited: string
  isShared: boolean
  isPublic?: boolean
  pdfLink?: string
  images?: string[]
  roofImageUrl?: string
  roofImagePins?: RoofPinMarker[]
  roofMapMarkers?: MapMarker[]
  appointmentId?: string
  priorReportId?: string
  isOffer: boolean
  offerValue?: number
  offerValidUntil?: string
  offerId?: string
}
```

### Offer

```typescript
{
  id: string
  reportId: string
  branchId: string
  createdBy: string
  createdByName: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  customerAddress: string
  title: string
  description: string
  totalAmount: number
  currency: string
  laborCost: number
  materialCost: number
  travelCost: number
  overheadCost: number
  profitMargin: number
  status: OfferStatus
  statusHistory: OfferStatusHistory[]
  validUntil: string
  sentAt: string
  respondedAt?: string
  publicLink: string
  emailSent: boolean
  followUpAttempts: number
  customerResponse?: 'accept' | 'reject'
  createdAt: string
  updatedAt: string
}
```

### Customer

```typescript
{
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  company?: string
  createdAt: string
  createdBy: string
  branchId?: string
  lastReportDate?: string
  totalReports: number
  totalRevenue: number
  notes?: string
}
```

### Appointment

```typescript
{
  id: string
  branchId: string
  customerId?: string
  customerName: string
  customerAddress: string
  customerPhone?: string
  customerEmail?: string
  assignedInspectorId: string
  assignedInspectorName: string
  scheduledDate: string // YYYY-MM-DD
  scheduledTime: string // HH:mm
  duration: number // minutes
  status: AppointmentStatus
  reportId?: string
  title: string
  description?: string
  inspectorNotes?: string
  appointmentType?: 'inspection' | 'follow_up' | 'estimate' | 'other'
  createdBy: string
  createdByName: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  cancelledAt?: string
  cancelReason?: string
}
```

---

## Firestore Collections

- `/users/{userId}` - User accounts
- `/branches/{branchId}` - Branches
- `/customers/{customerId}` - Customers
- `/reports/{reportId}` - Reports
- `/offers/{offerId}` - Offers
- `/appointments/{appointmentId}` - Appointments
- `/emailTemplates/{templateId}` - Email templates
- `/emailCommunications/{id}` - Email logs

---

## Firebase Storage Paths

- `roof-images/{reportId}/roof-overview.png` - Roof overview images
- `roof-images/{reportId}/issues/{issueId}/{filename}` - Issue images
- `branches/{branchId}/logo.png` - Branch logos
- `reports/{reportId}/inspection-report-{timestamp}.pdf` - Generated PDFs

---

## Common Error Messages

**Swedish Translations (from `src/locales/sv/`):**

- `form.validation.customerNameRequired` - "Kundnamn är obligatoriskt"
- `form.validation.addressRequired` - "Adress är obligatorisk"
- `form.validation.phoneInvalid` - "Ange ett giltigt telefonnummer"
- `form.validation.emailInvalid` - "Ange en giltig e-postadress"
- `form.validation.roofAgeRange` - "Takålder måste vara mellan 0 och 100 år"
- `form.validation.offerValueRange` - "Offertvärde måste vara mellan 0 och 10 000 000 SEK"
- `form.messages.autoSaveFailed` - "Automatisk sparning misslyckades. Kontrollera din anslutning."
- `form.validation.stepValidationFailed` - "Vänligen korrigera felen i det aktuella steget innan du fortsätter."

---

## Key Constants

**Report Form:**
- Auto-save interval: 3 seconds (debounced)
- Draft expiry: 24 hours
- Max images per issue: 5
- Notification throttle: 60 seconds

**Validation:**
- Customer name: 2-100 characters
- Roof age: 0-100 years
- Offer value: 0-10,000,000 SEK

**Pagination:**
- Reports per page: 20 (default)
- Customers per page: 50 (default)

---

## Contact Points

For questions about this documentation, refer to:
- `FUNCTIONALITY_INVENTORY.md` - Complete functionality details
- `TECHNICAL_REFERENCE.md` - Technical implementation details

---

**Last Updated:** 2025-01-31





