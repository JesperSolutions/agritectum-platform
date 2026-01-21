# Agritectum Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/your-username/agritectum-platform)
[![License](https://img.shields.io/badge/license-proprietary-red)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0-blue)](package.json)
[![Tech Stack](https://img.shields.io/badge/tech-React%20%7C%20Firebase%20%7C%20TypeScript-blue)](README.md)

Professional roof inspection management system with customer portal. Multi-branch support, offline-first PWA, smart PDF generation, role-based access control, and customer-facing user portal.

## 🚀 Quick Links

- **Live Demo**: [agritectum-platform.web.app](https://agritectum-platform.web.app)
- **Documentation**: [GitHub Pages](https://your-username.github.io/agritectum-platform)
- **Features**: [Features Overview](https://your-username.github.io/agritectum-platform/features.html)

## 🛠️ Tech Stack

### Frontend

- **React 18** - Modern UI library with hooks and concurrent features
- **TypeScript** - Type-safe JavaScript with enhanced developer experience
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **Vite** - Fast build tool and development server
- **PWA** - Progressive Web App with offline capabilities

### Backend & Services

- **Firebase Auth** - Secure authentication and user management
- **Firestore** - NoSQL document database with real-time sync
- **Cloud Functions** - Serverless backend functions for automation
- **Firebase Hosting** - Global CDN hosting with SSL
- **Puppeteer** - PDF generation with HTML-to-PDF conversion

### Features

- **PWA** - Offline-first architecture with IndexedDB
- **Multi-branch RBAC** - Three-tier permission system
- **Smart PDF Generation** - Professional reports with Danish CVR compliance
- **Google Maps API** - Location services and address autocomplete
- **Email Automation** - Automated notifications and communications using Firebase Trigger Email Extension (MailerSend SMTP only, never SendGrid/AWS)

## ⚡ Quick Start

### Prerequisites

- Node.js 18+
- Firebase project

### ⚠️ Development Workflow

**Important**: All coding must be done in the testing environment (`develop` branch + test Firebase project). Only move to production when explicitly requested.

See [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md) for complete guidelines.

### Installation

```bash
# Clone repository
git clone <repository-url>
cd taklaget-service-app

# Install dependencies
npm install

# Set up Firebase (see Firebase Setup below)
npm run setup-firebase

# Start development server
npm run dev
```

### Firebase Setup

1. Create Firebase project and enable Auth, Firestore, Storage
2. Update Firebase config in `src/config/firebase.ts`
3. Install the official **Trigger Email** Firebase extension and configure your MailerSend SMTP settings inside Firebase Extensions UI (no SMTP credentials ever set in this codebase)
4. Deploy security rules:
   ```bash
   firebase deploy --only firestore:rules,storage:rules
   ```

### Environment Setup

- All transactional email is managed by the Firebase Trigger Email Extension + MailerSend. There is **no SendGrid/Sparkpost/AWS SES/Simple SMTP setup** present here.
- The only email-related variable for frontend is `VITE_FROM_EMAIL` for UI branding (not for SMTP/secrets). See `env.example`.
- Never commit any secrets or SMTP credentials.

## 🎯 Key Features

- 🏢 **Multi-branch Management** - Independent branch operations with centralized oversight
- 👥 **Role-Based Access Control** - Superadmin, Branch Admin, Inspector roles
- 📱 **Offline-First PWA** - Work anywhere with automatic sync
- 📄 **Smart PDF Generation** - Professional reports with Danish CVR compliance
- 🔄 **Real-Time Sync** - Live data synchronization across devices
- 📊 **Analytics Dashboard** - Branch-specific performance metrics

## 🗂️ Legacy Code

Legacy code is organized in `src/legacy/` directories:

- **Components:** Unused components moved for reference
- **Services:** Legacy wrappers marked for backward compatibility
- **Documentation:** See `src/legacy/ARCHIVE_MANIFEST.md` for complete inventory

**Guidelines:**

- Do not use code from `src/legacy/` in new implementations
- Check ARCHIVE_MANIFEST.md for migration paths
- Legacy code is kept for reference and potential rollback only

## 📋 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run deploy       # Deploy to Firebase Hosting
npm run emulators    # Start Firebase emulators
```

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── Dashboard.tsx    # Main dashboard
│   ├── ReportForm.tsx   # Report creation wizard
│   ├── ReportView.tsx   # Report viewing/editing
│   └── ...
├── services/            # API services
│   ├── reportService.ts # Report operations
│   ├── userService.ts   # User management
│   └── ...
├── contexts/            # React contexts
├── hooks/               # Custom React hooks
├── types/               # TypeScript definitions
└── utils/               # Utility functions
```

## 🚀 Deployment

### Build & Deploy

```bash
npm run build
npm run deploy
```

### Environment Variables

Set these for production:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- (`VITE_FROM_EMAIL` for branding)

## 📖 Documentation

- **Development Workflow**: [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md) - **Read this first!**
- **Test Environment Setup**: [docs/01-getting-started/TEST_ENVIRONMENT.md](./docs/01-getting-started/TEST_ENVIRONMENT.md)
- **Full Documentation**: [GitHub Pages](https://your-username.github.io/taklaget-service-app)
- **Employee Onboarding**: [Onboarding Guide](https://your-username.github.io/taklaget-service-app/onboarding.html)
- **Tech Stack Details**: [Technology Overview](https://your-username.github.io/taklaget-service-app/tech-stack.html)
- **API Documentation**: See `src/services/` directory
- **Contributing Guidelines**: See [CONTRIBUTING.md](CONTRIBUTING.md)

## 🔒 Security

- Firebase Authentication with custom claims
- Comprehensive Firestore security rules
- GDPR compliance and data protection
- Role-based access control
- Encrypted data transmission

## 🐛 Troubleshooting

### Common Issues

1. **Permission denied**: Check Firestore rules and user claims
2. **User not found**: Verify Firebase Auth user exists
3. **Offline sync issues**: Check IndexedDB and network status
4. **PDF export failures**: Verify report data integrity

### Debug Mode

```javascript
localStorage.setItem('debug', 'true');
```

## 📄 License

This project is proprietary software for Taklaget AB. All rights reserved.

## 🆘 Support

- **Technical Issues**: Create an issue in the repository
- **Documentation**: Check GitHub Pages documentation
- **Emergency Support**: Contact the development team

---

**Taklaget Service App** - Professional roof inspection management for Nordic companies.
