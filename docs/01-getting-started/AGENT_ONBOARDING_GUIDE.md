# Agent Onboarding Guide - Taklaget Service App

**Date:** 2025-01-31  
**Purpose:** Complete guide for AI agents working on this project  
**Status:** Comprehensive Reference

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [How the Project Works](#how-the-project-works)
3. [Deployment to Firebase](#deployment-to-firebase)
4. [How Prior Agents Worked](#how-prior-agents-worked)
5. [Development Workflow](#development-workflow)
6. [Key Files & Directories](#key-files--directories)
7. [Common Tasks Reference](#common-tasks-reference)

---

## Project Overview

### What This Project Is

**Taklaget Service App** is a professional roof inspection management system built for Nordic companies. It's a full-stack web application with:

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Firebase (Firestore, Storage, Functions, Auth, Hosting)
- **Architecture:** PWA (Progressive Web App) with offline capabilities
- **Email:** MailerSend via Firebase Trigger Email Extension
- **Maps:** Leaflet.js with OpenStreetMap
- **PDF:** jsPDF + html2canvas for client-side generation

### Core Features

1. **Multi-Branch Management** - Support for multiple office locations
2. **Role-Based Access Control** - 3-tier system (Inspector, Branch Admin, Superadmin)
3. **Report Management** - Create, edit, view, share inspection reports
4. **Offer System** - Create price offers from reports, customer acceptance flow
5. **Customer Management** - Customer directory and history
6. **Appointment Scheduling** - Calendar-based appointment system
7. **Analytics Dashboard** - Revenue and performance metrics
8. **Email Automation** - Automated notifications and communications

### Tech Stack Summary

```
Frontend:
├── React 18.3.1
├── TypeScript 5.5.3
├── Vite 5.4.2
├── Tailwind CSS 3.4.1
├── React Router DOM 7.8.2
├── React Intl 7.1.11 (i18n)
├── Zustand 5.0.8 (state management)
└── Radix UI (component library)

Backend:
├── Firebase Auth
├── Firestore (NoSQL database)
├── Firebase Storage (file storage)
├── Cloud Functions (Node.js 22)
└── Firebase Hosting (CDN)

Third-Party:
├── Leaflet.js (maps)
├── jsPDF (PDF generation)
├── MailerSend (email)
└── Nominatim API (geocoding)
```

---

## How the Project Works

### Application Architecture

```
┌─────────────────────────────────────────┐
│         React Application (Frontend)     │
│  ┌────────────────────────────────────┐ │
│  │  React Router (Client-side routing) │ │
│  │  ┌──────────────────────────────┐  │ │
│  │  │  Components (Pages/UI)        │  │ │
│  │  └──────────────────────────────┘  │ │
│  │  ┌──────────────────────────────┐  │ │
│  │  │  Services (API layer)         │  │ │
│  │  │  - reportService.ts           │  │ │
│  │  │  - offerService.ts            │  │ │
│  │  │  - customerService.ts         │  │ │
│  │  │  - etc.                        │  │ │
│  │  └──────────────────────────────┘  │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│         Firebase Backend                │
│  ┌────────────────────────────────────┐ │
│  │  Firebase Auth (Authentication)    │  │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │  Firestore (Database)              │  │
│  │  Collections:                       │  │
│  │  - reports, offers, customers,     │  │
│  │    appointments, users, branches   │  │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │  Firebase Storage (Files)          │  │
│  │  - roof-images/                    │  │
│  │  - reports/                        │  │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │  Cloud Functions (Serverless)      │  │
│  │  - generateReportPDF               │  │
│  │  - createUserWithAuth              │  │
│  │  - offerFollowUp                   │  │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Authentication & Authorization

**Authentication Flow:**

1. User enters email/password → `LoginForm.tsx`
2. Firebase Auth validates → `authService.ts`
3. Custom claims fetched (role, permissionLevel, branchId)
4. User document fetched from Firestore `/users/{uid}`
5. AuthContext updated → User redirected to dashboard

**Permission System:**

- **Level 0:** Inspector (field worker)
- **Level 1:** Branch Admin (branch management)
- **Level 2:** Superadmin (full system access)

**Custom Claims:** Stored in Firebase Auth token, set via Cloud Functions

**Security Rules:** Firestore rules in `firestore.rules` enforce branch-based access

### Data Flow Example: Creating a Report

```
1. User fills ReportForm.tsx (multi-step form)
   ↓
2. Form data validated (step-by-step)
   ↓
3. reportService.createReport() called
   ↓
4. Firebase SDK writes to Firestore:
   - Document created in /reports/{reportId}
   - Customer found/created in /customers/{customerId}
   ↓
5. Images uploaded to Firebase Storage:
   - roof-images/{reportId}/roof-overview.png
   - roof-images/{reportId}/issues/{issueId}/...
   ↓
6. Cloud Function triggered:
   - notifyBranchManagersOnReportCreation
   - Sends email via MailerSend
   ↓
7. Report appears in dashboard
```

### Routing Structure

**Protected Routes** (require authentication):

- `/dashboard` - Role-based dashboard
- `/report/new` - Create report
- `/report/edit/:id` - Edit report
- `/report/view/:id` - View report
- `/reports` - Reports list (Inspector view)
- `/admin/reports` - Reports list (Admin view)
- `/offers` - Offers management
- `/schedule` - Appointment scheduling
- `/admin/users` - User management
- `/admin/customers` - Customer management
- `/admin/branches` - Branch management (Superadmin)
- `/admin/analytics` - Analytics dashboard

**Public Routes** (no auth):

- `/login` - Login page
- `/report/public/:id` - Public report view (if `isPublic=true`)
- `/offer/public/:id` - Public offer view/acceptance
- `/offer/thank-you` - Offer response confirmation
- `/unsubscribe` - Email unsubscribe

**Route Protection:** `ProtectedRoute.tsx` component checks authentication and role permissions

### State Management

**React Context API:**

- `AuthContext` - Global authentication state
- `ReportContextSimple` - Report state (if used)

**Local State:**

- `useState` for component state
- `useReducer` for complex state (ReportForm)

**Persistence:**

- Firestore for persistent data
- localStorage for drafts and preferences
- IndexedDB for offline support (if implemented)

### Service Layer Pattern

**Location:** `src/services/`

**Pattern:** Pure functions (no classes), async/await, error handling

**Example:**

```typescript
// src/services/reportService.ts
export const createReport = async (
  reportData: Partial<Report>,
  branchId: string
): Promise<string> => {
  try {
    // Validation
    if (!reportData.customerName) {
      throw new Error('Customer name required');
    }

    // Firestore operation
    const docRef = await addDoc(collection(db, 'reports'), {
      ...reportData,
      branchId,
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating report:', error);
    throw error;
  }
};
```

---

## Deployment to Firebase

### Prerequisites

1. **Firebase CLI installed:**

   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase project created:**
   - Go to https://console.firebase.google.com
   - Create project: `taklaget-service-app`

3. **Firebase login:**

   ```bash
   firebase login
   ```

4. **Link project:**
   ```bash
   firebase use taklaget-service-app
   ```

### Deployment Process

#### 1. Build Frontend

```bash
npm run build
```

This:

- Compiles TypeScript → JavaScript
- Bundles React app with Vite
- Outputs to `dist/` directory
- Optimizes assets

**Check:** Verify `dist/` directory contains `index.html` and `assets/`

#### 2. Deploy to Firebase Hosting

**Option A: Full deployment (recommended)**

```bash
npm run deploy
```

This runs:

1. `npm run build` (builds frontend)
2. `firebase deploy --only hosting` (deploys to Firebase)

**Option B: Deploy hosting only**

```bash
firebase deploy --only hosting
```

**Option C: Deploy specific targets**

```bash
# Deploy only hosting
firebase deploy --only hosting

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy only Storage rules
firebase deploy --only storage

# Deploy only Functions
firebase deploy --only functions

# Deploy multiple targets
firebase deploy --only hosting,firestore:rules,storage
```

#### 3. Deploy Cloud Functions

```bash
cd functions
npm install  # Install dependencies
npm run build  # Compile TypeScript
cd ..
firebase deploy --only functions
```

**Or:**

```bash
npm run deploy --prefix functions
```

#### 4. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

**Or:**

```bash
npm run deploy:rules  # Deploys rules + storage rules
```

### Firebase Configuration

**File:** `firebase.json`

**Hosting Configuration:**

```json
{
  "hosting": {
    "public": "dist", // Build output directory
    "rewrites": [
      {
        "source": "/api/generateReportPDF",
        "function": "generateReportPDF"
      },
      {
        "source": "**",
        "destination": "/index.html" // SPA routing
      }
    ],
    "headers": [
      // Security headers, cache control, etc.
    ]
  }
}
```

**Functions Configuration:**

```json
{
  "functions": {
    "source": "functions",
    "runtime": "nodejs22",
    "region": "europe-west1"
  }
}
```

### Environment Variables

**For Frontend:** Use `VITE_*` prefix (injected at build time)

**File:** `.env` or `.env.production` (not committed)

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=taklaget-service-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=taklaget-service-app
VITE_FIREBASE_STORAGE_BUCKET=taklaget-service-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FROM_EMAIL=noreply@taklaget.app
```

**For Functions:** Use `.env` or Firebase Functions config

```bash
firebase functions:config:set mailersend.api_key="..."
```

### Deployment Checklist

**Before Deploying:**

- [ ] Run `npm run build` successfully
- [ ] Test locally with `npm run preview`
- [ ] Check `dist/` directory has all assets
- [ ] Verify Firestore rules syntax
- [ ] Verify Storage rules syntax
- [ ] Check environment variables are set
- [ ] Functions compile without errors

**After Deploying:**

- [ ] Visit deployed URL (check Firebase console)
- [ ] Test login functionality
- [ ] Verify Firestore rules are active
- [ ] Check Cloud Functions logs
- [ ] Test critical user flows

### Common Deployment Commands

```bash
# Full deployment (hosting only)
npm run deploy

# Deploy everything
firebase deploy

# Deploy specific targets
firebase deploy --only hosting,functions,firestore:rules

# View deployment history
firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL_ID TARGET_SITE_ID:channel-id

# Rollback (via Firebase Console)
# Go to Hosting → Releases → Rollback to previous version
```

### Firebase Project Setup

**Project ID:** `taklaget-service-app` (from `.firebaserc`)

**Services Enabled:**

- ✅ Authentication (Email/Password only)
- ✅ Firestore Database
- ✅ Firebase Storage
- ✅ Cloud Functions
- ✅ Firebase Hosting
- ✅ Firebase Extension: Trigger Email (MailerSend)

**Regions:**

- Functions: `europe-west1` (Belgium)
- Firestore: Multi-region or `europe-west1`
- Storage: `europe-west1`

---

## How Prior Agents Worked

### Documentation Pattern

Prior agents maintained comprehensive documentation:

1. **Feature Documentation:** `docs/10-feature-descriptions/`
   - Specifications → Implementation → Completion
   - Completed features moved to `completed/` subdirectory

2. **History Logs:** `docs/07-history/`
   - `COMPLETE_WORK_SUMMARY.md` - Major work summaries
   - `FEATURE_WORKFLOW_SETUP_COMPLETE.md` - Feature management process
   - `DATABASE_CLEANUP_SUMMARY.md` - Database operations
   - `DOCS_REORGANIZATION_2025.md` - Documentation restructuring

3. **Quick Reference:** Root-level `.md` files
   - `QUICK_REFERENCE.md` - Route mappings and workflows
   - `TECHNICAL_REFERENCE.md` - Technical implementation details
   - `FUNCTIONALITY_INVENTORY.md` - Complete feature inventory
   - `MEDIUM_PRIORITY_COMPLETION_SUMMARY.md` - Progress tracking

### Work Patterns Observed

#### 1. Comprehensive Documentation

- Agents document every feature implementation
- Clear separation of completed vs. in-progress work
- Historical records preserved in `docs/archive/`

#### 2. Feature Management Workflow

```
NEW_FEATURES_SPECIFICATION.md
    ↓ [Feature Completed]
Extract feature documentation
    ↓
Move to docs/10-feature-descriptions/completed/
Archive original spec to docs/10-feature-descriptions/archived-specifications/
Update status in docs/09-requirements/
```

#### 3. Testing & Validation

- Production testing before marking complete
- User acceptance verification
- Documentation of issues found and fixes

#### 4. Code Organization

- Consistent naming conventions
- Service layer pattern (pure functions)
- TypeScript strict mode
- Error handling in all async functions

#### 5. Legacy Code Management

- Legacy code organized in `src/legacy/` directories
- See `src/legacy/ARCHIVE_MANIFEST.md` for complete inventory
- Legacy code kept for reference and potential rollback
- Do not use legacy code in new implementations
- Document rationale when archiving new code

#### 6. Incremental Improvements

- Medium priority items tracked separately
- Progress summaries maintained
- Clear distinction between must-have and nice-to-have

### Common Agent Tasks

**1. Implementing Features**

- Start from `docs/09-requirements/NEW_FEATURES_SPECIFICATION.md`
- Follow existing patterns in codebase
- Update documentation as work progresses
- Move to completed when done

**2. Bug Fixes**

- Document issue in relevant docs folder
- Implement fix with tests (if applicable)
- Document resolution in history
- Update `KNOWN_ISSUES.md` if needed

**3. Code Refactoring**

- Maintain backward compatibility
- Update all references
- Document changes in history
- Update technical reference if needed

**4. Documentation Updates**

- Keep `QUICK_REFERENCE.md` current
- Update `FUNCTIONALITY_INVENTORY.md` for new features
- Maintain feature descriptions
- Archive old documentation

### Agent Communication Patterns

**Session Summaries:**

- Document what was accomplished
- Note any pending actions
- Update completion summaries
- Maintain clear status indicators

**Example Structure:**

```markdown
# [Feature Name] - Complete

**Date:** YYYY-MM-DD  
**Status:** ✅ Complete

## What Was Done

- Feature 1
- Feature 2

## Files Modified

- path/to/file.tsx

## Testing

- ✅ Tested in production
- ✅ Verified user flows

## Next Steps

- [ ] Pending action 1
- [ ] Pending action 2
```

---

## Development Workflow

### Local Development Setup

**1. Install Dependencies**

```bash
npm install
cd functions && npm install && cd ..
```

**2. Environment Setup**

```bash
# Copy example env file
cp env.example .env

# Edit .env with your Firebase config
# (Or use Firebase emulators for local dev)
```

**3. Start Development**

**Option A: Using Firebase Emulators (Recommended - FREE)**

```bash
# Terminal 1: Start emulators
npm run emulators

# Terminal 2: Start dev server
npm run dev
```

**Option B: Connect to Production Firebase**

```bash
# Just start dev server (no emulators)
npm run dev
```

**URLs:**

- App: http://localhost:5173
- Emulator UI: http://localhost:4000

### Development Commands

```bash
# Development
npm run dev              # Start Vite dev server
npm run emulators        # Start Firebase emulators
npm run emulators:export # Emulators with data persistence

# Building
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run format           # Format with Prettier
npm run format:check     # Check formatting
npm run check            # Lint + format check

# Deployment
npm run deploy           # Deploy to Firebase (build + deploy)
npm run deploy:rules     # Deploy Firestore/Storage rules only

# Utilities
npm run generate:translations  # Generate translation inventory
```

### Code Structure

```
src/
├── components/          # React components
│   ├── admin/          # Admin pages
│   ├── common/         # Reusable UI components
│   ├── forms/          # Form components
│   ├── layout/         # Layout components
│   ├── navigation/     # Navigation components
│   ├── offers/         # Offer-related components
│   ├── reports/        # Report-related components
│   └── schedule/       # Scheduling components
├── contexts/           # React contexts (Auth, etc.)
├── hooks/              # Custom React hooks
├── services/          # Service layer (API calls)
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── locales/            # i18n translations (Swedish)
├── config/             # Configuration files
├── Router.tsx          # Route definitions
└── main.tsx            # Application entry point
```

### Testing Strategy

**Current State:**

- Manual testing in production
- Firebase emulators for local testing
- No automated test suite (yet)

**Recommended:**

- Unit tests for services
- Integration tests for critical flows
- E2E tests for user journeys

### Git Workflow

**Branch Strategy:**

- `main` - Production-ready code
- Feature branches (if collaborating)

**Commit Patterns:**

- Descriptive commit messages
- Reference issue numbers if applicable
- Group related changes

**Example:**

```
feat: Add offer preview modal

- Created OfferPreviewModal component
- Integrated into OffersPage
- Added Swedish translations
- Implemented loading states
```

---

## Key Files & Directories

### Configuration Files

- `firebase.json` - Firebase project configuration
- `.firebaserc` - Firebase project selection
- `package.json` - NPM dependencies and scripts
- `vite.config.ts` - Vite build configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `firestore.rules` - Firestore security rules
- `storage.rules` - Firebase Storage security rules

### Documentation Files

**Root Level:**

- `README.md` - Project overview
- `QUICK_REFERENCE.md` - Route mappings and workflows
- `TECHNICAL_REFERENCE.md` - Technical implementation details
- `FUNCTIONALITY_INVENTORY.md` - Complete feature inventory

**Documentation Directory:**

- `docs/01-getting-started/` - Setup guides
- `docs/02-features/` - Feature documentation
- `docs/03-deployment/` - Deployment guides
- `docs/04-administration/` - Admin and security docs
- `docs/07-history/` - Historical records
- `docs/09-requirements/` - Requirements and specs
- `docs/10-feature-descriptions/` - Feature descriptions

### Service Files

- `src/services/reportService.ts` - Report CRUD operations
- `src/services/offerService.ts` - Offer management
- `src/services/customerService.ts` - Customer management
- `src/services/appointmentService.ts` - Appointment scheduling
- `src/services/userService.ts` - User management
- `src/services/branchService.ts` - Branch management
- `src/services/authService.ts` - Authentication
- `src/services/imageUploadService.ts` - Image handling

### Component Files

- `src/Router.tsx` - Route definitions and protection
- `src/components/layout/Layout.tsx` - Main layout with sidebar
- `src/components/Dashboard.tsx` - Role-based dashboard
- `src/components/ReportForm.tsx` - Multi-step report creation
- `src/components/forms/LoginForm.tsx` - Authentication

### Utility Files

- `src/utils/firestoreClient.ts` - Firestore client setup
- `src/utils/dateFormatter.ts` - Swedish date formatting
- `src/utils/buttonStyles.ts` - Button style utilities
- `src/utils/formDataValidation.ts` - Form validation

---

## Legacy Code Reference

### Legacy Code Organization

The codebase maintains legacy code in `src/legacy/` for reference:

**Structure:**

```
src/legacy/
├── components/     # Unused components
├── services/       # Legacy service wrappers
├── utilities/      # Legacy utilities (if any)
└── ARCHIVE_MANIFEST.md  # Complete inventory
```

**Guidelines:**

- Check `src/legacy/ARCHIVE_MANIFEST.md` before referencing legacy code
- Do not import from `src/legacy/` in new implementations
- Legacy code is kept for reference and potential rollback only
- When archiving new code, add metadata headers and update ARCHIVE_MANIFEST.md

**Common Legacy Patterns:**

- Wrapper components that delegate to new implementations
- Deprecated functions kept for backward compatibility
- Unused alternate implementations

## Common Tasks Reference

### Adding a New Feature

1. **Check Requirements:**
   - Review `docs/09-requirements/NEW_FEATURES_SPECIFICATION.md`
   - Understand existing patterns in codebase

2. **Implement:**
   - Create components in `src/components/`
   - Add service methods in `src/services/`
   - Add routes in `src/Router.tsx`
   - Add translations in `src/locales/sv/`

3. **Update Documentation:**
   - Add to `FUNCTIONALITY_INVENTORY.md`
   - Update `QUICK_REFERENCE.md` if routes changed
   - Document in `docs/10-feature-descriptions/`

4. **Test:**
   - Test in Firebase emulators
   - Test in production (if safe)
   - Verify user flows

### Fixing a Bug

1. **Reproduce:**
   - Test locally with emulators
   - Check console for errors
   - Review Firestore rules if permission issue

2. **Fix:**
   - Implement fix following existing patterns
   - Add error handling if missing
   - Update types if needed

3. **Test:**
   - Verify fix works
   - Check for regressions
   - Test edge cases

4. **Document:**
   - Update `KNOWN_ISSUES.md` if applicable
   - Document in history if significant

### Adding a New Route

1. **Add Route:**

   ```typescript
   // In src/Router.tsx
   <Route
     path="/new-route"
     element={
       <ProtectedRoute allowedRoles={['inspector', 'branchAdmin']}>
         <LazyNewComponent />
       </ProtectedRoute>
     }
   />
   ```

2. **Create Component:**
   - Add to `src/components/`
   - Use lazy loading for performance

3. **Update Navigation:**
   - Add to sidebar in `Layout.tsx`
   - Filter by role if needed

4. **Document:**
   - Update `QUICK_REFERENCE.md`
   - Update `FUNCTIONALITY_INVENTORY.md`

### Deploying Changes

1. **Build:**

   ```bash
   npm run build
   ```

2. **Preview:**

   ```bash
   npm run preview
   # Test at http://localhost:4173
   ```

3. **Deploy:**

   ```bash
   npm run deploy
   # Or: firebase deploy --only hosting
   ```

4. **Verify:**
   - Check deployed URL
   - Test critical flows
   - Check Firebase console for errors

### Working with Firebase Emulators

**Start Emulators:**

```bash
npm run emulators
```

**Benefits:**

- No Firebase costs
- Safe testing (no production data)
- Offline development
- Fast data reset

**Emulator UI:** http://localhost:4000

**App URL:** http://localhost:5173

---

## Quick Command Reference

```bash
# Development
npm run dev                    # Start dev server
npm run emulators              # Start Firebase emulators

# Building
npm run build                  # Build for production
npm run preview                # Preview production build

# Code Quality
npm run lint                   # Lint code
npm run lint:fix               # Fix lint errors
npm run format                 # Format code
npm run check                  # Lint + format check

# Deployment
npm run deploy                 # Build + deploy hosting
npm run deploy:rules           # Deploy security rules
firebase deploy --only hosting # Deploy hosting only
firebase deploy --only functions # Deploy functions only

# Firebase
firebase login                 # Authenticate
firebase use PROJECT_ID        # Select project
firebase emulators:start       # Start emulators
firebase functions:log         # View function logs
```

---

## Important Notes

### Security

- **Never commit secrets:** `.env` files are in `.gitignore`
- **Firestore rules:** Always test rules before deploying
- **Custom claims:** Set via Cloud Functions or admin scripts
- **Storage rules:** Validate file types and sizes

### Performance

- **Lazy loading:** All major pages are lazy loaded
- **Code splitting:** Vite handles automatic code splitting
- **Image optimization:** Compress before upload
- **Caching:** Use Firebase Storage cache headers

### Best Practices

- **TypeScript:** Use strict mode, add types at boundaries
- **Error handling:** Always handle errors in async functions
- **Translations:** Use `react-intl` for all user-facing text
- **Validation:** Validate data at service layer and form level
- **Documentation:** Update docs when adding features

### Common Pitfalls

1. **Firestore Rules:** Forgot to deploy rules after changes
2. **Environment Variables:** Missing `VITE_` prefix for frontend
3. **Custom Claims:** Claims not set → users can't access data
4. **Build Output:** Forgot to build before deploying
5. **Branch Access:** Users need correct branchId in claims

---

## Getting Help

### Documentation Locations

- **Quick Start:** `docs/01-getting-started/`
- **Features:** `docs/02-features/`
- **Deployment:** `docs/03-deployment/`
- **Technical Details:** `TECHNICAL_REFERENCE.md`
- **Route Reference:** `QUICK_REFERENCE.md`

### Code References

- **Service Patterns:** `src/services/reportService.ts`
- **Component Patterns:** `src/components/Dashboard.tsx`
- **Route Protection:** `src/components/layout/ProtectedRoute.tsx`
- **Firebase Config:** `src/config/firebase.ts`

### Firebase Console

- **Project:** https://console.firebase.google.com/project/taklaget-service-app
- **Hosting:** https://console.firebase.google.com/project/taklaget-service-app/hosting
- **Firestore:** https://console.firebase.google.com/project/taklaget-service-app/firestore
- **Functions:** https://console.firebase.google.com/project/taklaget-service-app/functions

---

**Last Updated:** 2025-01-31  
**Maintained By:** AI Agents Working on Taklaget Project
