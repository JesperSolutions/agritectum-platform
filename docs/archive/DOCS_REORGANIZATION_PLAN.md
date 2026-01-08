# Documentation Reorganization Plan

## Current Issues:
1. **Flat structure** - All docs in one folder makes it hard to find things
2. **Redundant files** - Multiple files cover similar topics
3. **Outdated content** - Archive folder has useful content but it's not clear what's current
4. **No clear entry point** - New developers don't know where to start

---

## Proposed Structure:

```
docs/
├── README.md                           (Main index - START HERE)
│
├── 01-getting-started/
│   ├── LOCAL_DEVELOPMENT.md           (How to run locally)
│   ├── EMULATOR_SETUP_GUIDE.md        (Firebase emulators)
│   └── FIREBASE_SETUP.md              (Initial Firebase config)
│
├── 02-features/
│   ├── SCHEDULING_SYSTEM.md           (Scheduling & appointments)
│   ├── NOTIFICATION_SYSTEM.md         (Notifications)
│   ├── EMAIL_SYSTEM.md                (Email configuration)
│   └── TRANSLATION_STRATEGY.md        (i18n implementation)
│
├── 03-deployment/
│   ├── PRODUCTION_DEPLOYMENT.md       (How to deploy)
│   ├── DNS_CONFIGURATION_GUIDE.md     (DNS setup)
│   └── EU_COMPLIANCE_VERIFICATION.md  (GDPR compliance)
│
├── 04-administration/
│   ├── PERMISSION_SYSTEM.md           (Roles & permissions - NEW)
│   ├── QA_TESTING_GUIDE.md            (Testing procedures)
│   └── SECURITY_IMPROVEMENTS.md       (Security best practices)
│
├── 05-reference/
│   ├── SYSTEM_ARCHITECTURE.md         (Tech stack overview)
│   └── API_REFERENCE.md               (If needed)
│
└── archive/
    └── (Old/historical documents)
```

---

## Files to **CONSOLIDATE**:

### Email Documentation (3 files → 1 file)
- `EMAIL_SETUP_GUIDE.md`
- `EMAIL_SYSTEM_README.md`  
- `PRODUCTION_EMAIL_SETUP.md`
- `TRIGGER_EMAIL_EXTENSION_GUIDE.md`
**→ Merge into**: `02-features/EMAIL_SYSTEM.md`

### Permission/Hierarchy Documentation (2 files → 1 file)
- `PERMISSION_HIERARCHY.md`
- `PERMISSION_SYSTEM_DOCUMENTATION.md` (root, just created)
**→ Merge into**: `04-administration/PERMISSION_SYSTEM.md`

### System Overview (3 files → 1 file)
- `SYSTEM_README.md`
- `SYSTEM_IMPROVEMENTS.md`
- `README.md` (docs folder)
**→ Merge into**: `05-reference/SYSTEM_ARCHITECTURE.md`

### QA/Testing (2 files → 1 file)
- `QA_TESTING_GUIDE.md`
- `QA_QUICK_REFERENCE.md`
**→ Merge into**: `04-administration/QA_TESTING_GUIDE.md`

---

## Files to **ARCHIVE** (move to archive/):
- `REACT_INTL_IMPLEMENTATION.md` (implementation complete, keep for reference)
- `EMULATOR_SETUP_GUIDE.md` (if no longer using emulators actively)
- `DNS_CONFIGURATION_GUIDE.md` (setup complete, rarely needed)

---

## Files to **KEEP AS-IS**:
- `LOCAL_DEVELOPMENT.md` → `01-getting-started/`
- `FIREBASE_SETUP.md` → `01-getting-started/`
- `NOTIFICATION_SYSTEM.md` → `02-features/`
- `TRANSLATION_STRATEGY.md` → `02-features/`
- `SCHEDULING_SYSTEM_IMPLEMENTATION.md` → `02-features/SCHEDULING_SYSTEM.md`
- `EU_COMPLIANCE_VERIFICATION.md` → `03-deployment/`
- `SECURITY_IMPROVEMENTS.md` → `04-administration/`

---

## New **README.md** Structure:

```markdown
# Taklaget Documentation

Welcome to the Taklaget documentation! Start here to understand the system.

## 📚 Documentation Index

### 🚀 Getting Started
New to the project? Start here.
- [Local Development](01-getting-started/LOCAL_DEVELOPMENT.md) - Run the project locally
- [Firebase Setup](01-getting-started/FIREBASE_SETUP.md) - Configure Firebase
- [Emulator Setup](01-getting-started/EMULATOR_SETUP_GUIDE.md) - Use Firebase emulators

### ⚡ Features
Learn about the main features and how they work.
- [Scheduling System](02-features/SCHEDULING_SYSTEM.md) - Appointment management
- [Email System](02-features/EMAIL_SYSTEM.md) - Email configuration & templates
- [Notification System](02-features/NOTIFICATION_SYSTEM.md) - Real-time notifications
- [Translations](02-features/TRANSLATION_STRATEGY.md) - i18n implementation

### 🚢 Deployment
How to deploy to production.
- [Production Deployment](03-deployment/PRODUCTION_DEPLOYMENT.md) - Deployment guide
- [DNS Configuration](03-deployment/DNS_CONFIGURATION_GUIDE.md) - Domain setup
- [EU Compliance](03-deployment/EU_COMPLIANCE_VERIFICATION.md) - GDPR compliance

### 🔐 Administration
Managing users, permissions, and testing.
- [Permission System](04-administration/PERMISSION_SYSTEM.md) - Roles & access control
- [QA Testing Guide](04-administration/QA_TESTING_GUIDE.md) - Testing procedures
- [Security Best Practices](04-administration/SECURITY_IMPROVEMENTS.md) - Security guidelines

### 📖 Reference
Technical documentation and architecture.
- [System Architecture](05-reference/SYSTEM_ARCHITECTURE.md) - Tech stack & design

### 📦 Archive
Historical documents and completed migrations.
- [Archive Index](archive/README.md)

---

## Quick Links

- **First time setup**: Follow [Local Development](01-getting-started/LOCAL_DEVELOPMENT.md)
- **Deploy to production**: See [Production Deployment](03-deployment/PRODUCTION_DEPLOYMENT.md)
- **Manage users**: Read [Permission System](04-administration/PERMISSION_SYSTEM.md)
- **Run tests**: Check [QA Testing Guide](04-administration/QA_TESTING_GUIDE.md)

---

## Project Overview

**Taklaget** is a roof inspection management system built with:
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Firebase (Firestore, Authentication, Storage, Functions, Hosting)
- **Design**: Material Design principles
- **i18n**: React Intl (Swedish)
- **Features**: Scheduling, Reports, PDF generation, Email notifications, Offline support

See [System Architecture](05-reference/SYSTEM_ARCHITECTURE.md) for full details.
```

---

## Benefits of This Structure:

1. ✅ **Clear hierarchy** - Easy to find what you need
2. ✅ **Progressive disclosure** - Start simple, dive deeper as needed
3. ✅ **Reduced redundancy** - One source of truth per topic
4. ✅ **Better onboarding** - Clear path for new developers
5. ✅ **Maintainable** - Easy to update and expand

---

## Implementation Steps:

1. Create new folder structure
2. Move/rename files to new locations
3. Consolidate redundant files
4. Update all internal links
5. Create new README.md index
6. Archive old/completed docs
7. Delete truly obsolete files

---

**Ready to execute?**

