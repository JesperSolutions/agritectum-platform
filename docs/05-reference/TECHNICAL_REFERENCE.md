# Taklaget Service App - Technical Reference

**Date:** 2025-01-31  
**Version:** 1.0  
**Status:** Comprehensive Technical Documentation

---

## Table of Contents

1. [Component Architecture](#1-component-architecture)
2. [Service Layer](#2-service-layer)
3. [Data Models](#3-data-models)
4. [State Management](#4-state-management)
5. [Routing & Navigation](#5-routing--navigation)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Firebase Integration](#7-firebase-integration)
8. [Third-Party Integrations](#8-third-party-integrations)
9. [Form Handling](#9-form-handling)
10. [Error Handling](#10-error-handling)
11. [Performance Optimizations](#11-performance-optimizations)

---

## 1. Component Architecture

### 1.1 Component Structure

**Location:** `src/components/`

**Main Component Types:**

- **Pages:** Full page components (Dashboard, ReportForm, etc.)
- **Forms:** Form components (LoginForm, AppointmentForm)
- **Admin:** Admin-specific components (`admin/` directory)
- **Reports:** Report-related components (`reports/` directory)
- **Offers:** Offer-related components (`offers/` directory)
- **Schedule:** Appointment scheduling (`schedule/` directory)
- **Common:** Reusable UI components (`common/` directory)
- **Layout:** Layout components (`layout/` directory)
- **Navigation:** Navigation components (`navigation/` directory)

### 1.2 Component Hierarchy

```
Layout
├── Sidebar (Navigation)
├── Main Content Area
│   ├── Breadcrumb
│   ├── Outlet (Route Content)
│   └── QuickActions (FAB)
├── OfflineIndicator
└── NotificationCenter
```

### 1.3 Lazy Loading

**Location:** `src/components/LazyComponents.tsx`

**Implementation:**

- Uses React `lazy()` for code splitting
- Custom `lazyWithRetry()` wrapper for error recovery
- All major pages are lazy loaded
- Suspense boundaries with `LoadingFallback` component

**Lazy Loaded Components:**

- Dashboard
- ReportForm
- ReportView
- AllReports
- CustomerManagement
- UserManagement
- BranchManagement
- AnalyticsDashboard
- SchedulePage
- OffersPage
- PublicOfferView
- EmailTemplateViewer
- UserProfile

**Example:**

```typescript
export const LazyReportForm = lazyWithRetry(() => import('./ReportForm'));
```

### 1.4 Component Props & State

**Common Patterns:**

- Functional components with hooks
- TypeScript interfaces for props
- `useState` for local state
- `useContext` for global state
- `useReducer` for complex state

**Example Component Structure:**

```typescript
interface ComponentProps {
  // Props definition
}

const Component: React.FC<ComponentProps> = ({ ...props }) => {
  // Hooks
  const [state, setState] = useState();
  const { currentUser } = useAuth();

  // Effects
  useEffect(() => {
    // Side effects
  }, [dependencies]);

  // Handlers
  const handleAction = () => {
    // Handler logic
  };

  // Render
  return (
    // JSX
  );
};
```

---

## 2. Service Layer

### 2.1 Service Architecture

**Location:** `src/services/`

**Service Pattern:**

- Pure functions (no class instances)
- Async functions returning Promises
- Firebase SDK integration
- Error handling and logging
- TypeScript interfaces for type safety

**Service Files:**

- `reportService.ts` - Report CRUD operations
- `offerService.ts` - Offer management
- `customerService.ts` - Customer management
- `appointmentService.ts` - Appointment scheduling
- `userService.ts` - User management
- `branchService.ts` - Branch management
- `authService.ts` - Authentication
- `imageUploadService.ts` - Image handling
- `emailService.ts` - Email operations
- `simplePdfService.ts` - PDF generation
- `clientPdfService.ts` - Client-side PDF

### 2.2 Service Method Pattern

**Standard Pattern:**

```typescript
export const serviceMethod = async (params: ParamType, user?: User): Promise<ReturnType> => {
  try {
    // Validation
    if (!params.requiredField) {
      throw new Error('Required field missing');
    }

    // Firestore operation
    const docRef = doc(db, 'collection', params.id);
    const result = await getDoc(docRef);

    if (!result.exists()) {
      return null;
    }

    return { id: result.id, ...result.data() } as ReturnType;
  } catch (error) {
    console.error('Service method error:', error);
    throw new Error('Operation failed');
  }
};
```

### 2.3 Service Error Handling

**Error Types:**

- `permission-denied` - Firestore security rules
- `not-found` - Document doesn't exist
- `network-error` - Connection issues
- `validation-error` - Invalid input

**Error Handling Strategy:**

- Try-catch blocks in all service methods
- Logging errors with context
- Re-throwing with user-friendly messages
- Returning null for not-found cases

### 2.4 Service Dependencies

**Firebase Services:**

- `firebase/firestore` - Database operations
- `firebase/storage` - File storage
- `firebase/auth` - Authentication
- `firebase/functions` - Cloud Functions (optional)

**Third-Party:**

- Nominatim API - Geocoding
- MailerSend - Email (via Cloud Functions)
- Leaflet.js - Maps

---

## 3. Data Models

### 3.1 TypeScript Interfaces

**Location:** `src/types/index.ts`

**Core Types:**

- `User` - User account
- `Branch` - Branch/office
- `Customer` - Customer record
- `Report` - Inspection report
- `Offer` - Price offer
- `Appointment` - Scheduled appointment
- `Issue` - Report issue
- `RecommendedAction` - Repair recommendation
- `Employee` - Employee/user (internal)

**Enums:**

- `UserRole` - 'inspector' | 'branchAdmin' | 'superadmin'
- `PermissionLevel` - 0 | 1 | 2
- `ReportStatus` - Report status values
- `OfferStatus` - Offer status values
- `AppointmentStatus` - Appointment status values
- `RoofType` - Roof material types
- `IssueType` - Issue categories
- `IssueSeverity` - Severity levels

### 3.2 Data Validation

**Service-Level:**

- TypeScript type checking
- Runtime validation in service methods
- Firestore rules validation

**Form-Level:**

- Client-side validation
- Real-time field validation
- Step-by-step validation
- Error messages from translations

### 3.3 Data Relationships

**Report → Customer:**

- Denormalized: `customerName`, `customerAddress` in report
- Optional link: `priorReportId` to previous report
- Optional link: `appointmentId` to appointment

**Report → Offer:**

- Bidirectional: `report.offerId` and `offer.reportId`
- Status denormalized: `report.offerStatus`

**Offer → Customer:**

- Denormalized customer data in offer
- Public link: `/offer/public/:offerId`

**Appointment → Report:**

- Optional: `appointment.reportId` after completion
- Report created with `appointmentId`

---

## 4. State Management

### 4.1 React Context API

**Contexts:**

- `AuthContext` - Authentication state
- `ReportContextSimple` - Report state (simplified)
- Custom hooks for context access

**AuthContext:**

```typescript
interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
```

**ReportContextSimple:**

```typescript
interface ReportContextType {
  state: {
    reports: Report[];
    loading: boolean;
    error: string | null;
    isOffline: boolean;
    syncInProgress: boolean;
  };
  fetchReports: () => Promise<void>;
  // ... other actions
}
```

### 4.2 Local State Management

**Patterns:**

- `useState` for simple state
- `useReducer` for complex state
- `useRef` for mutable values
- `useMemo` for computed values
- `useCallback` for memoized functions

**Example (ReportForm):**

```typescript
const [formData, setFormData] = useState<Partial<Report>>({});
const [currentStep, setCurrentStep] = useState(1);
const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
```

### 4.3 State Persistence

**LocalStorage:**

- Draft reports: `report_draft_{userId}`
- Form step: `reportFormStep_{userId}`
- Branch filter: `selectedBranch_{userId}`
- Date filters: `reportDateFilter_{userId}`

**Firestore:**

- All persistent data
- Real-time updates (if implemented)
- Offline support (if implemented)

### 4.4 Optimized Store (Optional)

**Location:** `src/stores/optimizedStore.ts`

**Features:**

- Optimized state management
- Caching
- Computed values
- Data actions

**Usage:**

```typescript
const dataState = useOptimizedStore(state => state.data);
const computedValues = useComputedValues();
const dataActions = useDataActions();
```

---

## 5. Routing & Navigation

### 5.1 React Router Setup

**Location:** `src/Router.tsx`

**Router Type:** Browser Router (React Router DOM v6)

**Route Structure:**

- Public routes (no auth)
- Protected routes (require auth)
- Role-based routes (require specific roles)
- Nested routes (children)

### 5.2 Protected Routes

**Component:** `src/components/layout/ProtectedRoute.tsx`

**Features:**

- Authentication check
- Role-based access control
- Branch requirement check
- Redirects for unauthorized access

**Usage:**

```typescript
<ProtectedRoute allowedRoles={['inspector', 'branchAdmin']} requiredBranch>
  <Component />
</ProtectedRoute>
```

### 5.3 Navigation Flow

**Entry Points:**

- Sidebar navigation
- Dashboard quick actions
- Quick Actions FAB
- Direct URL navigation
- Programmatic navigation (`navigate()`)

**Navigation State:**

- Pass data via `location.state`
- Pass data via URL params (`useSearchParams`)
- Pass data via route params (`useParams`)

**Example:**

```typescript
// Navigate with state
navigate('/report/new', {
  state: { appointmentId, customerName, customerAddress },
});

// Navigate with URL params
navigate(`/report/new?customerId=${id}&customerName=${name}`);
```

### 5.4 Breadcrumb Navigation

**Component:** `src/components/navigation/Breadcrumb.tsx`

**Features:**

- Auto-generated from route
- Shows path hierarchy
- Clickable navigation
- Icons for each level

---

## 6. Authentication & Authorization

### 6.1 Authentication Flow

**Service:** `src/services/authService.ts`

**Process:**

1. User enters email/password
2. Firebase Auth validates credentials
3. Custom claims fetched (role, permissionLevel, branchId)
4. User document fetched from Firestore
5. Auth context updated
6. Redirect to dashboard

**Custom Claims:**

- Set via Cloud Function on user creation/login
- Stored in Firebase Auth token
- Includes: `role`, `permissionLevel`, `branchId`

### 6.2 Authorization (Permissions)

**Permission Levels:**

- `0` = Inspector
- `1` = Branch Admin
- `2` = Superadmin

**Helper Functions:**

```typescript
hasPermission(userLevel, requiredLevel): boolean
canAccessAllBranches(permissionLevel): boolean
canAccessBranch(userLevel, userBranchId, targetBranchId): boolean
canManageUsers(permissionLevel): boolean
canManageBranches(permissionLevel): boolean
```

### 6.3 Firestore Security Rules

**Location:** `firestore.rules`

**Pattern:**

```javascript
match /collection/{docId} {
  allow read: if isAuthenticated() && hasAccess();
  allow create: if isAuthenticated() && canCreate();
  allow update: if isAuthenticated() && canUpdate();
  allow delete: if isAuthenticated() && canDelete();
}
```

**Helper Functions (in rules):**

- `isAuthenticated()` - Check if user logged in
- `isSuperadmin()` - Permission level >= 2
- `isBranchAdmin()` - Permission level >= 1
- `isInspector()` - Permission level >= 0
- `getUserBranchId()` - Get user's branchId
- `hasBranchAccess(branchId)` - Check branch access

### 6.4 Branch-Based Access Control

**Rules:**

- Users can access data in their branch
- Superadmins can access all branches
- Branch admins can manage their branch
- Inspectors see only their own reports (some collections)

**Example:**

```javascript
allow read: if isAuthenticated() && (
  isSuperadmin() ||
  (isBranchAdmin() && (resource.data.branchId == getUserBranchId() || getUserBranchId() == "main")) ||
  (isInspector() && (resource.data.branchId == getUserBranchId() || getUserBranchId() == "main"))
);
```

---

## 7. Firebase Integration

### 7.1 Firebase Configuration

**Location:** `src/config/firebase.ts`

**Services:**

- Firestore Database
- Firebase Storage
- Firebase Auth
- Cloud Functions (optional)

**Initialization:**

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
```

### 7.2 Firestore Operations

**Read Operations:**

- `getDoc(docRef)` - Single document
- `getDocs(queryRef)` - Query collection
- `query(collectionRef, ...constraints)` - Build query

**Write Operations:**

- `addDoc(collectionRef, data)` - Create document
- `updateDoc(docRef, updates)` - Update document
- `deleteDoc(docRef)` - Delete document

**Query Constraints:**

- `where(field, operator, value)` - Filter
- `orderBy(field, direction)` - Sort
- `limit(count)` - Limit results

**Example:**

```typescript
const q = query(
  collection(db, 'reports'),
  where('branchId', '==', branchId),
  where('status', '==', 'completed'),
  orderBy('createdAt', 'desc'),
  limit(50)
);
const snapshot = await getDocs(q);
```

### 7.3 Firebase Storage

**Operations:**

- `uploadBytes(storageRef, file)` - Upload file
- `getDownloadURL(ref)` - Get URL
- `deleteObject(ref)` - Delete file

**Paths:**

- Roof images: `roof-images/{reportId}/`
- Branch logos: `branches/{branchId}/logo.png`
- PDFs: `reports/{reportId}/`

**Example:**

```typescript
const storageRef = ref(storage, `roof-images/${reportId}/roof-overview.png`);
await uploadBytes(storageRef, file);
const url = await getDownloadURL(storageRef);
```

### 7.4 Real-Time Updates (Optional)

**If Implemented:**

- `onSnapshot(docRef, callback)` - Listen to document
- `onSnapshot(queryRef, callback)` - Listen to query
- Unsubscribe on component unmount

---

## 8. Third-Party Integrations

### 8.1 Nominatim API (Geocoding)

**Service:** OpenStreetMap Nominatim

**Endpoint:**

```
https://nominatim.openstreetmap.org/search?format=json&q={address}
```

**Usage:**

- Convert addresses to coordinates
- Validate addresses
- Center maps on addresses

**Rate Limits:**

- Free tier: 1 request/second
- Should implement caching

**Example:**

```typescript
const response = await fetch(
  `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
);
const data = await response.json();
const { lat, lon } = data[0];
```

### 8.2 Leaflet.js (Maps)

**Library:** Leaflet.js

**Usage:**

- Interactive maps
- Satellite tiles
- Markers/pins
- Click-to-add markers

**Components:**

- `InteractiveRoofMap.tsx` - Map component
- Uses OpenStreetMap satellite tiles
- Custom markers based on severity

### 8.3 MailerSend (Email)

**Integration:** Via Cloud Functions

**Email Types:**

- Report shared notification
- Offer sent
- Offer reminder
- Appointment confirmation
- User invitation

**Flow:**

- Frontend triggers Cloud Function
- Cloud Function calls MailerSend API
- Email sent
- Status logged in Firestore

### 8.4 PDF Generation

**Methods:**

1. **Cloud Function:** `simplePdfService.ts`
   - Calls Cloud Function endpoint
   - Server-side PDF generation
   - More reliable for large reports

2. **Client-side:** `clientPdfService.ts`
   - Uses jsPDF + html2canvas
   - Renders HTML to PDF
   - Faster, but limited by browser

**Libraries:**

- `jsPDF` - PDF creation
- `html2canvas` - HTML to canvas conversion

### 8.5 Image Handling

**Upload:**

- Firebase Storage SDK
- Progress tracking
- Error handling
- Multiple file support

**Display:**

- Download URLs from Storage
- Thumbnail generation (if implemented)
- Lightbox/modal for full-size

---

## 9. Form Handling

### 9.1 Form Component Structure

**ReportForm Component:**

- Multi-step form (4 steps)
- State management with `useState`
- Validation per step
- Auto-save functionality
- Draft management

### 9.2 Form Validation

**Validation Levels:**

1. **Field-level:** On blur/change
2. **Step-level:** Before progression
3. **Form-level:** Before submission

**Validation Rules:**

- Required fields
- Format validation (email, phone)
- Range validation (roof age, offer value)
- Custom validation functions

**Error Display:**

- Inline errors below fields
- Summary at top
- Visual indicators (red borders)
- Error messages from translations

### 9.3 Auto-Save

**Implementation:**

- `useEffect` hook with debounce
- Saves to localStorage every 3 seconds
- Saves to Firestore on form change (if implemented)
- Draft expiry: 24 hours

**Storage:**

- LocalStorage key: `report_draft_{userId}`
- Structure: JSON string of form data

**Restore:**

- Check on mount
- Prompt user to restore
- Clear on successful submission

### 9.4 Form State Management

**State Variables:**

- `formData` - Form values
- `currentStep` - Current step number
- `validationErrors` - Error messages
- `loading` - Loading state
- `saving` - Auto-save state

**State Updates:**

- Controlled inputs
- `setFormData` with spread operator
- Immutable updates

---

## 10. Error Handling

### 10.1 Error Boundaries

**Components:**

- `ErrorBoundary.tsx` - General error boundary
- `EnhancedErrorBoundary.tsx` - Enhanced with context
- `RouteErrorBoundary.tsx` - Route-specific errors

**Usage:**

```typescript
<ErrorBoundary>
  <Component />
</ErrorBoundary>
```

### 10.2 Error Types

**Network Errors:**

- Connection issues
- Timeout
- CORS errors

**Permission Errors:**

- Firestore rules denied
- Unauthorized access

**Validation Errors:**

- Invalid input
- Missing required fields
- Format errors

**Service Errors:**

- Document not found
- Duplicate creation
- Invalid operation

### 10.3 Error Display

**User-Facing:**

- Toast notifications
- Inline error messages
- Error pages
- Modal dialogs

**Developer-Facing:**

- Console logging
- Error monitoring service (if implemented)
- Stack traces

### 10.4 Error Recovery

**Strategies:**

- Retry for network errors
- Fallback data
- Graceful degradation
- User feedback

---

## 11. Performance Optimizations

### 11.1 Code Splitting

**Implementation:**

- Lazy loading components
- Route-based splitting
- Dynamic imports

**Benefits:**

- Smaller initial bundle
- Faster initial load
- On-demand loading

### 11.2 Caching

**Services:**

- `cachingService.ts` - Cache management
- LocalStorage caching
- Memory caching (if implemented)

**Cache Strategy:**

- Time-based expiry
- Invalidation on updates
- Cache-first with network fallback

### 11.3 Optimistic Updates

**Pattern:**

- Update UI immediately
- Make API call in background
- Rollback on error

**Usage:**

- Report creation
- Status updates
- Quick actions

### 11.4 Debouncing & Throttling

**Usage:**

- Search input (500ms debounce)
- Auto-save (3s debounce)
- Notification throttling (60s)
- Customer search (1s debounce)

**Implementation:**

```typescript
const debouncedSearch = useMemo(
  () =>
    debounce(term => {
      // Search logic
    }, 500),
  []
);
```

### 11.5 Memoization

**React Hooks:**

- `useMemo` - Computed values
- `useCallback` - Functions
- React.memo - Components

**Usage:**

- Expensive calculations
- Prevent unnecessary re-renders
- Optimize list rendering

### 11.6 Image Optimization

**Strategies:**

- Lazy loading images
- Thumbnail generation
- Progressive loading
- Compression before upload

---

## Integration Points

### Cloud Functions

**Functions:**

- `createUserWithAuth` - User creation
- `generatereportpdf` - PDF generation
- `notifyBranchManagersOnReportCreation` - Notifications
- `offerFollowUp` - Automated reminders

**Trigger Types:**

- HTTP endpoints
- Firestore triggers
- Scheduled functions

### Email System

**Integration:**

- MailerSend API
- Email templates
- Status tracking
- Unsubscribe handling

### Offline Support

**If Implemented:**

- Service Worker
- IndexedDB caching
- Queue for offline actions
- Sync on reconnect

---

## Development Tools

### Linting & Formatting

**Tools:**

- ESLint
- Prettier (if configured)

### TypeScript

**Configuration:**

- Strict mode
- Type checking
- Interface definitions

### Build Process

**Tools:**

- Vite (build tool)
- TypeScript compiler
- Asset optimization

---

## Testing (If Implemented)

### Unit Tests

**Location:** `src/**/*.test.ts` or `.spec.ts`

### Integration Tests

**Location:** `src/**/*.integration.test.ts`

### E2E Tests

**Tools:**

- Playwright
- Cypress

---

## Deployment

### Firebase Hosting

**Build:**

```bash
npm run build
```

**Deploy:**

```bash
firebase deploy --only hosting
```

### Firestore Rules

**Deploy:**

```bash
firebase deploy --only firestore:rules
```

### Cloud Functions

**Deploy:**

```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

---

## Environment Variables

**Required:**

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

**Optional:**

- `VITE_MAILERSEND_API_KEY`
- `VITE_NOMINATIM_URL` (defaults to OpenStreetMap)

---

## Security Considerations

### Client-Side

- Environment variables (no secrets)
- Input validation
- XSS prevention (React default)
- CSRF protection (Firebase handles)

### Server-Side (Firestore Rules)

- Role-based access
- Branch-based filtering
- Field validation
- Owner verification

### Authentication

- Firebase Auth token validation
- Custom claims verification
- Session management (Firebase handles)

---

## Troubleshooting

### Common Issues

**1. Permission Denied Errors:**

- Check Firestore rules
- Verify user role/permissions
- Check branch access

**2. Network Errors:**

- Check Firebase config
- Verify internet connection
- Check CORS settings

**3. Image Upload Failures:**

- Check Storage rules
- Verify file size limits
- Check file format

**4. PDF Generation Errors:**

- Check Cloud Function status
- Verify report data completeness
- Check browser compatibility

---

## Best Practices

### Code Organization

- Components in `src/components/`
- Services in `src/services/`
- Types in `src/types/`
- Utils in `src/utils/`
- Hooks in `src/hooks/`

### Naming Conventions

- Components: PascalCase (`ReportForm.tsx`)
- Services: camelCase (`reportService.ts`)
- Types: PascalCase (`Report`, `User`)
- Constants: UPPER_SNAKE_CASE (`FORM_CONSTANTS`)

### Code Style

- TypeScript strict mode
- Functional components
- Hooks over classes
- Async/await over promises
- Error handling in all async functions

---

**Last Updated:** 2025-01-31
