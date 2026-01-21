# Software Requirements Specification (SRS)

## Agritectum Platform

**Version:** 1.0.0  
**Date:** January 2025  
**Status:** Production Ready  
**Document Type:** Software Requirements Specification

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [System Features](#3-system-features)
4. [User Roles & Permissions](#4-user-roles--permissions)
5. [User Flows](#5-user-flows)
6. [External Interface Requirements](#6-external-interface-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [System Architecture](#8-system-architecture)
9. [Data Models](#9-data-models)
10. [Security Requirements](#10-security-requirements)

---

## 1. Introduction

### 1.1 Purpose

This document provides a comprehensive specification for the Agritectum Platform, a professional roof inspection management system designed for inspection companies to manage inspections, generate reports, schedule appointments, and communicate with customers.

### 1.2 Scope

The Agritectum Platform is a web-based application that enables:

- Multi-branch inspection management
- Real-time report creation and editing
- Customer relationship management
- Appointment scheduling
- Email notifications and communication
- PDF report generation and sharing
- Analytics and reporting
- Multi-role access control

### 1.3 Definitions, Acronyms, and Abbreviations

- **SRS:** Software Requirements Specification
- **UI:** User Interface
- **UX:** User Experience
- **API:** Application Programming Interface
- **RBAC:** Role-Based Access Control
- **PWA:** Progressive Web Application
- **PDF:** Portable Document Format
- **CRM:** Customer Relationship Management
- **CVR:** Central Business Register (Danish)
- **VAT:** Value Added Tax
- **GDPR:** General Data Protection Regulation

### 1.4 References

- Firebase Documentation: https://firebase.google.com/docs
- React Documentation: https://react.dev
- TypeScript Documentation: https://www.typescriptlang.org/docs
- GDPR Compliance Guidelines
- Danish Business Regulations

### 1.5 Overview

This document is organized into sections covering functional requirements, user flows, system architecture, and technical specifications. Each section provides detailed information about specific aspects of the system.

---

## 2. Overall Description

### 2.1 Product Perspective

The Taklaget Service App is a standalone web application that operates in the cloud using Firebase as the backend infrastructure. It integrates with:

- **Firebase Authentication** - User authentication and authorization
- **Cloud Firestore** - NoSQL database for data storage
- **Cloud Storage** - File storage for images and documents
- **Cloud Functions** - Serverless backend logic
- **Email Service** - Customer communication

### 2.2 Product Functions

**Core Features:**

1. User Authentication & Authorization
2. Multi-Branch Management
3. Inspection Report Creation & Management
4. Customer Management
5. Appointment Scheduling
6. Email Notifications
7. PDF Generation & Sharing
8. Analytics & Reporting
9. Image Upload & Management
10. Offline Support

### 2.3 User Classes and Characteristics

#### 2.3.1 Super Admin

- **Purpose:** System-wide administration
- **Characteristics:** Full system access, manages all branches and users
- **Technical Skills:** Advanced
- **Frequency of Use:** Daily

#### 2.3.2 Branch Admin

- **Purpose:** Manage specific branch operations
- **Characteristics:** Manages branch users, customers, and reports
- **Technical Skills:** Intermediate
- **Frequency of Use:** Daily

#### 2.3.3 Inspector

- **Purpose:** Conduct inspections and create reports
- **Characteristics:** Field workers, mobile users
- **Technical Skills:** Basic to Intermediate
- **Frequency of Use:** Daily

#### 2.3.4 Customer (External)

- **Purpose:** View inspection reports
- **Characteristics:** Non-technical users
- **Technical Skills:** Basic
- **Frequency of Use:** Occasional

### 2.4 Operating Environment

**Client Requirements:**

- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Internet connection (with offline support)
- Responsive design for mobile, tablet, and desktop

**Server Requirements:**

- Firebase Hosting
- Cloud Firestore
- Cloud Storage
- Cloud Functions
- Firebase Authentication

### 2.5 Design and Implementation Constraints

- **Technology Stack:** React, TypeScript, Firebase
- **Browser Support:** Last 2 versions of major browsers
- **Mobile Support:** iOS 13+, Android 8+
- **GDPR Compliance:** Required
- **Performance:** Page load < 3 seconds
- **Accessibility:** WCAG 2.1 AA compliance

---

## 3. System Features

### 3.1 Feature 1: User Authentication & Authorization

**Priority:** Critical  
**Complexity:** Medium

#### 3.1.1 Description

Secure user authentication with role-based access control supporting three user roles: Inspector, Branch Admin, and Super Admin.

#### 3.1.2 Functional Requirements

**FR-1.1:** System shall support email/password authentication

- **Input:** Email address, password
- **Output:** Authentication token, user session
- **Validation:** Email format, password strength

**FR-1.2:** System shall implement role-based access control

- **Roles:** Inspector (Level 0), Branch Admin (Level 1), Super Admin (Level 2)
- **Permissions:** Hierarchical permission system
- **Branch Access:** Users assigned to specific branches

**FR-1.3:** System shall support session management

- **Token Refresh:** Automatic token refresh
- **Session Timeout:** Configurable timeout
- **Logout:** Secure session termination

#### 3.1.3 Business Rules

- Password must be minimum 8 characters
- Failed login attempts: 5 attempts before temporary lockout
- Session timeout: 24 hours
- Token refresh: Every 55 minutes

---

### 3.2 Feature 2: Inspection Report Management

**Priority:** Critical  
**Complexity:** High

#### 3.2.1 Description

Create, edit, view, and manage roof inspection reports with images, issues, and recommendations.

#### 3.2.2 Functional Requirements

**FR-2.1:** System shall allow creation of new inspection reports

- **Input:** Customer info, inspection details, issues, images
- **Output:** Saved report with unique ID
- **Validation:** Required fields, data types

**FR-2.2:** System shall support report editing

- **Edit Mode:** Draft reports can be edited
- **Version Control:** Track changes and history
- **Status Management:** Draft → Completed → Sent

**FR-2.3:** System shall generate PDF reports

- **PDF Format:** Professional branded PDF
- **Content:** Customer info, inspection details, issues, recommendations
- **Images:** Embedded images in PDF
- **QR Code:** Link to online report view

**FR-2.4:** System shall support report sharing

- **Public Link:** Unique URL for customer access
- **Email Sharing:** Send report via email
- **Access Control:** Time-limited access

#### 3.2.3 Business Rules

- Reports are branch-specific
- Only assigned inspectors can edit their reports
- Draft reports can be edited indefinitely
- Completed reports require approval before sending
- PDFs expire after 90 days (configurable)

---

### 3.3 Feature 3: Customer Management

**Priority:** High  
**Complexity:** Medium

#### 3.3.1 Description

Manage customer information, track history, and maintain customer relationships.

#### 3.3.2 Functional Requirements

**FR-3.1:** System shall store customer information

- **Fields:** Name, email, phone, address, company
- **History:** Track all inspections for customer
- **Revenue:** Calculate total revenue per customer

**FR-3.2:** System shall support customer search

- **Search Criteria:** Name, email, phone, company
- **Filters:** Date range, branch, status
- **Sorting:** By name, date, revenue

**FR-3.3:** System shall track customer history

- **Report History:** All reports for customer
- **Timeline:** Chronological view
- **Statistics:** Total inspections, revenue, last contact

#### 3.3.3 Business Rules

- Customers are branch-specific
- Customer data is GDPR compliant
- Duplicate prevention based on email/phone
- Customer data retention: 7 years

---

### 3.4 Feature 4: Appointment Scheduling

**Priority:** High  
**Complexity:** Medium

#### 3.4.1 Description

Schedule, manage, and track inspection appointments.

#### 3.4.2 Functional Requirements

**FR-4.1:** System shall allow appointment creation

- **Input:** Customer info, date, time, inspector, notes
- **Output:** Scheduled appointment
- **Validation:** Date/time conflicts, inspector availability

**FR-4.2:** System shall support appointment status tracking

- **Statuses:** Scheduled, In Progress, Completed, Cancelled, No Show
- **Transitions:** State machine for status changes
- **Notifications:** Email notifications for status changes

**FR-4.3:** System shall provide calendar view

- **Calendar:** Monthly/weekly/daily views
- **Filters:** By inspector, branch, status
- **Drag & Drop:** Reschedule appointments

#### 3.4.3 Business Rules

- Appointments are branch-specific
- Default duration: 2 hours
- Buffer time: 30 minutes between appointments
- Cancellation notice: 24 hours
- No-show tracking for statistics

---

### 3.5 Feature 5: Email Notifications

**Priority:** High  
**Complexity:** Medium

#### 3.5.1 Description

Automated and manual email notifications for various events.

#### 3.5.2 Functional Requirements

**FR-5.1:** System shall send automated emails

- **Triggers:** Report completion, appointment reminders, status changes
- **Templates:** Customizable email templates
- **Personalization:** Dynamic content based on context

**FR-5.2:** System shall support manual email sending

- **Compose:** Create custom emails
- **Attachments:** Attach PDF reports
- **Templates:** Use predefined templates

**FR-5.3:** System shall track email delivery

- **Status:** Sent, Delivered, Opened, Bounced
- **Logs:** Email history and status
- **Retry:** Automatic retry for failed sends

#### 3.5.3 Business Rules

- Email templates are branch-specific
- Maximum email size: 10MB
- Email rate limit: 100 emails/hour
- Bounce handling: Mark as invalid after 3 bounces
- Unsubscribe support: Required by law

---

### 3.6 Feature 6: Analytics & Reporting

**Priority:** Medium  
**Complexity:** High

#### 3.6.1 Description

Analytics dashboard with business metrics and insights.

#### 3.6.2 Functional Requirements

**FR-6.1:** System shall provide analytics dashboard

- **Metrics:** Reports created, revenue, customers, appointments
- **Charts:** Visual representations of data
- **Filters:** Date range, branch, inspector

**FR-6.2:** System shall support data export

- **Formats:** CSV, Excel, PDF
- **Data:** Reports, customers, appointments, revenue
- **Scheduling:** Scheduled exports

**FR-6.3:** System shall track key performance indicators

- **KPIs:** Revenue, report completion rate, customer satisfaction
- **Trends:** Historical data and trends
- **Comparisons:** Period-over-period comparisons

#### 3.6.3 Business Rules

- Analytics are branch-specific (except for Super Admin)
- Data aggregation: Real-time
- Export limit: 10,000 records
- Data retention: 2 years

---

## 4. User Roles & Permissions

### 4.1 Permission Matrix

| Feature                | Inspector | Branch Admin | Super Admin |
| ---------------------- | --------- | ------------ | ----------- |
| View Dashboard         | ✅        | ✅           | ✅          |
| Create Reports         | ✅        | ✅           | ✅          |
| Edit Own Reports       | ✅        | ✅           | ✅          |
| Edit All Reports       | ❌        | ✅           | ✅          |
| Delete Reports         | ❌        | ✅           | ✅          |
| View All Reports       | ❌        | ✅ (Branch)  | ✅ (All)    |
| Manage Customers       | ❌        | ✅           | ✅          |
| Manage Users           | ❌        | ✅ (Branch)  | ✅ (All)    |
| Manage Branches        | ❌        | ❌           | ✅          |
| View Analytics         | ❌        | ✅ (Branch)  | ✅ (All)    |
| Manage Appointments    | ✅        | ✅           | ✅          |
| Manage Email Templates | ❌        | ❌           | ✅          |
| System Configuration   | ❌        | ❌           | ✅          |

### 4.2 Branch Access

- **Inspector:** Access only assigned branch
- **Branch Admin:** Access only assigned branch
- **Super Admin:** Access all branches

---

## 5. User Flows

### 5.1 User Flow 1: Inspector Creates Inspection Report

**Actor:** Inspector  
**Precondition:** User is logged in and has branch assigned

#### Flow Steps:

1. **Login**
   - User navigates to login page
   - Enters email and password
   - System validates credentials
   - System redirects to dashboard

2. **Navigate to Report Creation**
   - User clicks "New Report" button
   - System displays report creation form

3. **Enter Customer Information**
   - User enters customer name
   - User enters customer address
   - User enters customer phone (optional)
   - User enters customer email (optional)
   - System validates input

4. **Enter Inspection Details**
   - User selects inspection date
   - User selects roof type
   - User enters roof age (optional)
   - User enters weather conditions (optional)
   - User enters condition notes

5. **Add Issues**
   - User clicks "Add Issue" button
   - User selects issue type (leak, damage, wear, etc.)
   - User selects severity (low, medium, high, critical)
   - User enters description
   - User enters location
   - User uploads images (optional)
   - User clicks "Save Issue"
   - System adds issue to list
   - **Repeat for multiple issues**

6. **Add Recommended Actions**
   - User clicks "Add Action" button
   - User enters description
   - User selects priority (low, medium, high)
   - User selects urgency (immediate, short-term, long-term)
   - User enters estimated cost (optional)
   - User clicks "Save Action"
   - System adds action to list
   - **Repeat for multiple actions**

7. **Upload Images**
   - User clicks "Upload Images" button
   - User selects images from device
   - System uploads images to cloud storage
   - System displays uploaded images

8. **Save Report**
   - User clicks "Save Report" button
   - System validates all required fields
   - System creates report with unique ID
   - System sets status to "Draft"
   - System redirects to report view

9. **Complete Report**
   - User reviews report
   - User clicks "Complete Report" button
   - System changes status to "Completed"
   - System displays success message

10. **Generate PDF (Optional)**
    - User clicks "Generate PDF" button
    - System generates PDF report
    - System provides download link

11. **Send Report to Customer (Optional)**
    - User clicks "Send to Customer" button
    - System generates public link
    - System sends email to customer
    - System changes status to "Sent"

**Postcondition:** Report is created and saved in database

---

### 5.2 User Flow 2: Branch Admin Manages Users

**Actor:** Branch Admin  
**Precondition:** User is logged in as Branch Admin

#### Flow Steps:

1. **Navigate to User Management**
   - User clicks "Admin" menu
   - User clicks "User Management"
   - System displays user list

2. **View Users**
   - System displays list of users in branch
   - Columns: Name, Email, Role, Status, Last Login
   - User can sort by any column
   - User can filter by role or status

3. **Add New User**
   - User clicks "Add User" button
   - System displays user creation form
   - User enters email address
   - User enters display name
   - User selects role (Inspector or Branch Admin)
   - User clicks "Create User"
   - System creates Firebase user
   - System sends invitation email
   - System displays success message

4. **Edit User**
   - User clicks "Edit" button for a user
   - System displays user edit form
   - User can change display name
   - User can change role
   - User can activate/deactivate user
   - User clicks "Save Changes"
   - System updates user information
   - System displays success message

5. **Reset User Password**
   - User clicks "Reset Password" for a user
   - System sends password reset email
   - System displays success message

6. **Deactivate User**
   - User clicks "Deactivate" for a user
   - System shows confirmation dialog
   - User confirms deactivation
   - System deactivates user account
   - System displays success message

**Postcondition:** User management operations completed

---

### 5.3 User Flow 3: Customer Views Report

**Actor:** Customer (External)  
**Precondition:** Customer received report link via email

#### Flow Steps:

1. **Receive Email**
   - Customer receives email with report link
   - Email contains preview of report
   - Email contains "View Report" button

2. **Click Report Link**
   - Customer clicks "View Report" link
   - System opens report in browser
   - System displays loading state

3. **View Report**
   - System displays report header
   - System displays customer information
   - System displays inspection details
   - System displays issues found
   - System displays recommended actions
   - System displays images

4. **Download PDF (Optional)**
   - Customer clicks "Download PDF" button
   - System generates PDF
   - System triggers PDF download

5. **Print Report (Optional)**
   - Customer clicks "Print" button
   - System opens print dialog
   - Customer prints report

6. **Schedule Follow-up (Optional)**
   - Customer clicks "Schedule Follow-up" button
   - System displays contact form
   - Customer enters message
   - Customer clicks "Send"
   - System sends message to inspector
   - System displays success message

**Postcondition:** Customer has viewed report

---

### 5.4 User Flow 4: Inspector Schedules Appointment

**Actor:** Inspector  
**Precondition:** User is logged in

#### Flow Steps:

1. **Navigate to Schedule**
   - User clicks "Schedule" menu
   - System displays calendar view

2. **View Calendar**
   - System displays calendar for current month
   - System shows existing appointments
   - System color-codes by status

3. **Create Appointment**
   - User clicks on date/time slot
   - System displays appointment creation form
   - User enters customer name
   - User enters customer address
   - User enters customer phone (optional)
   - User enters customer email (optional)
   - User selects duration (default: 2 hours)
   - User enters notes (optional)
   - User clicks "Create Appointment"
   - System creates appointment
   - System sends confirmation email to customer
   - System displays success message

4. **Edit Appointment**
   - User clicks on existing appointment
   - System displays appointment details
   - User clicks "Edit" button
   - User modifies appointment details
   - User clicks "Save Changes"
   - System updates appointment
   - System sends update email to customer
   - System displays success message

5. **Complete Appointment**
   - User clicks "Complete" button
   - System changes status to "Completed"
   - System prompts to create report
   - User chooses to create report or skip
   - If creating report, system opens report form with pre-filled customer info

**Postcondition:** Appointment is scheduled and tracked

---

### 5.5 User Flow 5: Super Admin Manages Branches

**Actor:** Super Admin  
**Precondition:** User is logged in as Super Admin

#### Flow Steps:

1. **Navigate to Branch Management**
   - User clicks "Admin" menu
   - User clicks "Branch Management"
   - System displays branch list

2. **View Branches**
   - System displays list of all branches
   - Columns: Name, Address, Phone, Status, Users, Reports
   - User can sort by any column
   - User can filter by status

3. **Add New Branch**
   - User clicks "Add Branch" button
   - System displays branch creation form
   - User enters branch name
   - User enters address
   - User enters phone
   - User enters email
   - User enters CVR number (optional)
   - User enters VAT number (optional)
   - User uploads logo (optional)
   - User clicks "Create Branch"
   - System creates branch
   - System displays success message

4. **Edit Branch**
   - User clicks "Edit" for a branch
   - System displays branch edit form
   - User modifies branch information
   - User clicks "Save Changes"
   - System updates branch
   - System displays success message

5. **Manage Branch Users**
   - User clicks "Manage Users" for a branch
   - System displays users in that branch
   - User can add/remove users
   - User can change user roles

6. **View Branch Analytics**
   - User clicks "Analytics" for a branch
   - System displays branch statistics
   - Metrics: Reports, Revenue, Users, Customers

7. **Deactivate Branch**
   - User clicks "Deactivate" for a branch
   - System shows confirmation dialog
   - User confirms deactivation
   - System deactivates branch
   - System displays success message

**Postcondition:** Branch management operations completed

---

## 6. External Interface Requirements

### 6.1 User Interfaces

#### 6.1.1 Web Application

- **Framework:** React 18.3
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI, Custom Components
- **Responsive Design:** Mobile-first approach
- **Browser Support:** Chrome, Firefox, Safari, Edge (last 2 versions)

#### 6.1.2 Design System

- **Colors:** Primary blue (#3B82F6), Success green (#10B981), Danger red (#EF4444)
- **Typography:** Noto Sans, system fonts
- **Spacing:** 4px base unit
- **Breakpoints:** sm (640px), md (768px), lg (1024px), xl (1280px)

### 6.2 Hardware Interfaces

- **Storage:** Cloud Storage (Firebase)
- **Processing:** Client-side rendering with serverless backend
- **Network:** HTTPS for all communications

### 6.3 Software Interfaces

#### 6.3.1 Firebase Services

- **Authentication:** Firebase Auth
- **Database:** Cloud Firestore
- **Storage:** Cloud Storage
- **Functions:** Cloud Functions
- **Hosting:** Firebase Hosting

#### 6.3.2 External APIs

- **Email Service:** Nodemailer / SendGrid
- **PDF Generation:** jsPDF, html2canvas
- **QR Code:** qrcode library

### 6.4 Communication Interfaces

- **Protocol:** HTTPS
- **Data Format:** JSON
- **Authentication:** Firebase Auth tokens
- **API Versioning:** v1

---

## 7. Non-Functional Requirements

### 7.1 Performance Requirements

- **Page Load Time:** < 3 seconds
- **Time to Interactive:** < 5 seconds
- **API Response Time:** < 1 second (95th percentile)
- **Concurrent Users:** Support 100+ concurrent users
- **Database Queries:** < 500ms
- **Image Upload:** < 10 seconds for 5MB image

### 7.2 Reliability Requirements

- **Uptime:** 99.9% availability
- **Data Backup:** Daily automated backups
- **Recovery Time:** < 4 hours
- **Error Rate:** < 0.1%
- **Data Loss:** Zero tolerance

### 7.3 Security Requirements

- **Authentication:** Multi-factor authentication for admins
- **Authorization:** Role-based access control
- **Data Encryption:** In transit (HTTPS) and at rest (AES-256)
- **GDPR Compliance:** Full compliance required
- **Audit Logging:** All sensitive operations logged
- **Session Management:** Secure session handling
- **Input Validation:** All inputs validated and sanitized

### 7.4 Usability Requirements

- **Learning Curve:** New users productive within 30 minutes
- **Accessibility:** WCAG 2.1 AA compliance
- **Mobile Support:** Full functionality on mobile devices
- **Offline Support:** Core functionality available offline
- **Error Messages:** Clear, actionable error messages
- **Help System:** Contextual help and tooltips

### 7.5 Scalability Requirements

- **Users:** Support up to 10,000 users
- **Branches:** Support up to 100 branches
- **Reports:** Support 100,000+ reports
- **Storage:** Unlimited (Cloud Storage)
- **Database:** Auto-scaling (Firestore)

### 7.6 Maintainability Requirements

- **Code Quality:** TypeScript strict mode
- **Documentation:** Comprehensive code documentation
- **Testing:** 80% code coverage
- **Monitoring:** Application performance monitoring
- **Logging:** Structured logging
- **Version Control:** Git with semantic versioning

---

## 8. System Architecture

### 8.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   React UI   │  │  TypeScript  │  │   Tailwind   │      │
│  │  Components  │  │   Services   │  │      CSS     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS / REST
                            │
┌─────────────────────────────────────────────────────────────┐
│                      Firebase Platform                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Firebase    │  │   Cloud      │  │   Cloud      │      │
│  │     Auth     │  │  Firestore   │  │   Storage    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │   Cloud      │  │   Firebase   │                        │
│  │  Functions   │  │   Hosting    │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Technology Stack

**Frontend:**

- React 18.3
- TypeScript 5.5
- Tailwind CSS 3.4
- React Router 7.8
- React Hook Form 7.62
- Zustand 5.0 (State Management)

**Backend:**

- Firebase 12.2
- Cloud Firestore
- Cloud Functions
- Cloud Storage
- Firebase Authentication

**DevOps:**

- Vite (Build Tool)
- ESLint (Linting)
- Prettier (Formatting)
- Git (Version Control)

### 8.3 Component Architecture

```
src/
├── components/          # UI Components
│   ├── admin/          # Admin components
│   ├── common/         # Shared components
│   ├── email/          # Email components
│   ├── forms/          # Form components
│   ├── layout/         # Layout components
│   ├── reports/        # Report components
│   └── ui/             # UI primitives
├── contexts/           # React Contexts
├── hooks/              # Custom Hooks
├── services/           # Business Logic
├── types/              # TypeScript Types
├── utils/              # Utility Functions
└── Router.tsx          # Routing Configuration
```

---

## 9. Data Models

### 9.1 User Model

```typescript
interface User {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole; // 'inspector' | 'branchAdmin' | 'superadmin'
  permissionLevel: PermissionLevel; // 0 | 1 | 2
  branchId?: string;
  branchIds?: string[];
  createdAt: string;
  lastLogin?: string;
}
```

### 9.2 Branch Model

```typescript
interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  createdAt: string;
  cvrNumber?: string;
  vatNumber?: string;
  isActive: boolean;
  country: string;
}
```

### 9.3 Report Model

```typescript
interface Report {
  id: string;
  createdBy: string;
  createdByName: string;
  branchId: string;
  inspectionDate: string;
  customerName: string;
  customerAddress: string;
  customerPhone?: string;
  customerEmail?: string;
  roofType: RoofType;
  roofAge?: number;
  conditionNotes: string;
  issuesFound: Issue[];
  recommendedActions: RecommendedAction[];
  status: ReportStatus;
  createdAt: string;
  lastEdited: string;
  isShared: boolean;
  pdfLink?: string;
  images?: string[];
  weatherConditions?: string;
  inspectionDuration?: number;
  priorReportId?: string;
  isOffer: boolean;
  offerValue?: number;
  offerValidUntil?: string;
}
```

### 9.4 Appointment Model

```typescript
interface Appointment {
  id: string;
  branchId: string;
  customerId?: string;
  customerName: string;
  customerAddress: string;
  customerPhone?: string;
  customerEmail?: string;
  assignedInspectorId: string;
  assignedInspectorName: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  status: AppointmentStatus;
  reportId?: string;
  title: string;
  description?: string;
  inspectorNotes?: string;
  appointmentType?: 'inspection' | 'follow_up' | 'estimate' | 'other';
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
}
```

### 9.5 Customer Model

```typescript
interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  createdAt: string;
  createdBy: string;
  lastReportDate?: string;
  totalReports: number;
  totalRevenue: number;
  notes?: string;
}
```

---

## 10. Security Requirements

### 10.1 Authentication Security

- **Password Policy:** Minimum 8 characters, complexity requirements
- **Session Management:** Secure session tokens, automatic timeout
- **Rate Limiting:** Prevent brute force attacks
- **Account Lockout:** Temporary lockout after failed attempts

### 10.2 Authorization Security

- **Role-Based Access Control:** Three-tier permission system
- **Branch Isolation:** Users can only access their assigned branch
- **Resource-Level Permissions:** Fine-grained access control
- **Audit Trail:** Log all authorization decisions

### 10.3 Data Security

- **Encryption:** All data encrypted in transit (HTTPS) and at rest
- **PII Protection:** Personal data handled per GDPR
- **Data Retention:** Configurable retention policies
- **Data Deletion:** Secure deletion with audit trail

### 10.4 API Security

- **Authentication:** Token-based authentication
- **Authorization:** Role-based endpoint access
- **Input Validation:** All inputs validated and sanitized
- **Rate Limiting:** Prevent API abuse
- **CORS:** Configured for allowed origins only

### 10.5 Compliance

- **GDPR:** Full compliance with General Data Protection Regulation
- **Data Privacy:** User consent for data processing
- **Right to Access:** Users can access their data
- **Right to Deletion:** Users can request data deletion
- **Data Portability:** Export user data in machine-readable format

---

## Appendix A: Glossary

- **Branch:** A physical location or office of the inspection company
- **Inspector:** Field worker who conducts inspections
- **Report:** Document containing inspection findings and recommendations
- **Customer:** Client who receives inspection services
- **Appointment:** Scheduled inspection visit
- **Offer:** Proposed work with pricing for customer
- **Issue:** Problem or defect found during inspection
- **Action:** Recommended repair or maintenance action

---

## Appendix B: Acronyms

- **SRS:** Software Requirements Specification
- **UI:** User Interface
- **UX:** User Experience
- **API:** Application Programming Interface
- **RBAC:** Role-Based Access Control
- **PWA:** Progressive Web Application
- **PDF:** Portable Document Format
- **CRM:** Customer Relationship Management
- **GDPR:** General Data Protection Regulation
- **CVR:** Central Business Register (Danish)
- **VAT:** Value Added Tax
- **KPI:** Key Performance Indicator
- **WCAG:** Web Content Accessibility Guidelines

---

## Document Control

| Version | Date         | Author                  | Changes              |
| ------- | ------------ | ----------------------- | -------------------- |
| 1.0.0   | January 2025 | AI Documentation System | Initial SRS creation |

---

**Document Status:** ✅ **APPROVED**  
**Next Review Date:** April 2025  
**Owner:** Development Team  
**Stakeholders:** Product Owner, Development Team, QA Team

---

_This document is confidential and proprietary to Taklaget Service App._
