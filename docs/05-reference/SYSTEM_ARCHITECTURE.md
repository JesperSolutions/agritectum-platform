# System Architecture

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5.4
- **Styling**: Tailwind CSS with Material Design principles
- **UI Components**: Radix UI primitives
- **State Management**: Zustand + Context API
- **Routing**: React Router v6
- **i18n**: React Intl (Swedish language)
- **Icons**: Lucide React
- **PDF Generation**: jsPDF

### Backend
- **Platform**: Firebase
  - **Firestore**: NoSQL database
  - **Authentication**: Email/password auth with custom claims
  - **Storage**: File/image storage
  - **Hosting**: Static site hosting
  - **Functions**: Cloud Functions (Node.js)
  - **Extensions**: Trigger Email (MailerSend SMTP)

### Features
- **Offline Support**: Service Worker, LocalStorage caching
- **Progressive Web App (PWA)**: Installable on mobile/desktop
- **Real-time Notifications**: Firestore listeners
- **Role-Based Access Control**: 3-tier permission system
- **Material Design**: Shadows, transitions, typography
- **Responsive**: Mobile-first design

## Architecture Patterns

### Component Structure
```
src/
├── components/
│   ├── dashboards/        (Role-specific dashboards)
│   ├── reports/           (Report CRUD)
│   ├── schedule/          (Appointment system)
│   ├── admin/             (User/branch management)
│   ├── forms/             (Reusable forms)
│   ├── layout/            (Layout components)
│   ├── ui/                (Shadcn/Radix primitives)
│   └── common/            (Shared utilities)
├── contexts/              (React Context providers)
├── services/              (Firebase/API services)
├── hooks/                 (Custom React hooks)
├── types/                 (TypeScript definitions)
└── utils/                 (Helper functions)
```

### Data Flow
1. User interacts with component
2. Component calls service function
3. Service function interacts with Firebase
4. Firestore security rules validate access
5. Data returned to component
6. Component updates via state/context

### Security Model
- **Authentication**: Firebase Auth with custom claims
- **Authorization**: Firestore security rules
- **Permission Levels**: 0 (Inspector), 1 (Branch Admin), 2 (Superadmin)
- **Data Isolation**: Branch-level data segregation

## Key Features

### 1. Smart Dashboard
- Role-aware component
- Consolidates 3 dashboard types
- Dynamic data fetching based on permissions

### 2. Scheduling System
- Create/manage appointments
- Assign inspectors
- Conflict detection
- Link appointments to reports

### 3. Report Management
- 4-step wizard (Customer → Inspection → Issues → Summary)
- PDF export with company branding
- Public sharing links
- Offline draft support

### 4. User Management
- Create users with roles
- Assign to branches
- Set custom authentication claims

### 5. Email System
- Template-based emails (Handlebars)
- Automatic sending via Firestore triggers
- MailerSend SMTP integration

## Performance

### Bundle Size
- Total: ~1.6 MB uncompressed
- Largest chunks:
  - Firebase SDK: ~510 KB
  - PDF library: ~615 KB
  - Main app: ~332 KB

### Optimization Strategies
- Code splitting with React.lazy()
- Dynamic imports for admin pages
- Image optimization
- Service Worker caching

## Deployment

### Hosting
- Firebase Hosting
- CDN: Global edge caching
- HTTPS: Automatic SSL
- Custom domain: taklaget.app

### CI/CD
- `npm run build` - Build production bundle
- `firebase deploy --only hosting` - Deploy frontend
- `firebase deploy --only firestore:rules` - Deploy security rules

## Security

### Authentication
- Email/password only
- Custom claims for roles
- Session management via Firebase

### Firestore Rules
- Role-based read/write rules
- Branch-level data isolation
- Inspector can only edit own reports

### Data Privacy
- GDPR compliant
- EU data residency (europe-west1)
- User consent for emails
- Data retention policies

## Monitoring

### Firebase Console
- Authentication users
- Firestore data
- Storage files
- Hosting analytics

### Error Tracking
- Client-side: ErrorBoundary components
- Server-side: Cloud Function logs

## Future Improvements

See `SYSTEM_IMPROVEMENTS.md` in archive for detailed roadmap:
- Calendar view for scheduling
- Enhanced photo management
- Analytics dashboard with charts
- Customer self-service portal
- Audit logging
