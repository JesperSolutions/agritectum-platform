# Changelog

All notable changes to the Taklaget Service App project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2b] - 2025-01-28

### Added
- Comprehensive service agreement form enhancements based on Danish paper version
- **Service Agreement Purpose Field**: Added textarea for agreement purpose/description
- **Service Visits Checkboxes**: 
  - 1 annual service visit option
  - 2 annual service visits option
- **Standard Services Checkboxes** (10 services):
  - Visual inspection of roof
  - Roofing felt and joint control
  - Penetration control
  - Flashing and joint control
  - Drain and gutter cleaning
  - Gutter cleaning
  - Debris removal (leaves, moss, dirt)
  - Drainage function/flow test
  - Walkway control
  - Photo documentation
- **Optional Addons with Expandable Sections**:
  - **Skylights & Fall Protection**: Cleaning/inspection, annual inspection (EN 365), safety equipment control
  - **Solar Panels**: Solar panel cleaning (1-2 times annually)
  - **Steel Roofs**: Moss/lichen removal, chemical roof treatment
  - **Sedum Roofs (Green Roofs)**: Fertilization, weed control, sedum repair, substrate refill, watering
- **Pricing Structure Options**:
  - Per roof annual pricing with checkbox
  - Per square meter pricing with checkbox
- **Billing Frequency Selection**: Annual or semi-annual options
- **Signature Fields**: Supplier and customer signature fields
- **Service Report Information Section**: Displays what's included in service reports
- **Agreement Period Information**: Notes about 12-month automatic renewal

### Changed
- Expanded ServiceAgreement TypeScript interface with new fields:
  - `purpose`, `serviceVisits`, `standardServices`, `addons`, `pricingStructure`, `billingFrequency`, `signatures`
- Enhanced form state management to handle all new checkbox and field types
- Updated form submission to include all new fields when creating/updating service agreements
- Added comprehensive translations for all new form fields in Danish, Swedish, and German

### Technical Details
- Implemented toggle functions for service visits, standard services, and addons
- Added expandable/collapsible sections for addon categories using ChevronUp/ChevronDown icons
- Conditional rendering for pricing structure inputs based on checkbox selection
- Form validation and error handling for all new fields

## [1.0.2a] - 2025-01-28

### Fixed
- Fixed missing translation keys in dashboard for Swedish, Danish, and German locales
- Improved language auto-detection to re-detect locale on each visit for auto-detected locales
- Fixed language not automatically switching for users in different regions (e.g., Denmark)
- Added distinction between manual and auto-detected locale preferences
- Fixed console errors related to Firestore permission-denied queries for branch service
- Added client-side fallback for service agreement queries when Firestore index is missing

### Changed
- Enhanced locale detection system to preserve manual language selections while allowing auto-detection updates
- Improved branch service to query only accessible branches based on user permissions

## [2.0.0] - 2025-01-22

### Added
- Smart PDF Export System with optimized header/footer layout
- Minimum content height enforcement to prevent cramped layouts
- Enhanced UX design optimized for roofing industry professionals
- 4-step report creation wizard with streamlined workflow
- Auto-save functionality with 30-second intervals
- Advanced filtering and search capabilities
- Danish CVR compliance integration
- Professional PDF templates with industry standards
- Offline-first architecture with complete offline functionality
- Role-based analytics with branch-specific performance metrics
- Comprehensive customer relationship management
- Photo documentation system with image upload and attachment
- Comprehensive error boundaries and user feedback
- WCAG AA compliance and accessibility features
- Mobile optimization with touch-friendly interface
- Offer management system with customer acceptance tracking
- Real-time notifications and communication system
- Google Maps integration for location services
- Address autocomplete with worldwide support
- QR code generation for report access
- Breadcrumb navigation system
- Quick actions floating action button
- Page state persistence across sessions

### Changed
- Updated copyright year to 2025 across all components
- Improved PDF generation using Puppeteer for HTML-to-PDF conversion
- Enhanced report status system with additional states
- Updated translation system with comprehensive Swedish localization
- Improved mobile responsiveness and touch interactions
- Enhanced security rules for better data protection
- Updated user management with password generation options
- Improved error handling and user feedback

### Fixed
- Resolved PDF generation 500 errors with correct Firebase Functions v2 syntax
- Fixed offer permission errors with branch-specific filtering
- Corrected translation key issues in dashboard components
- Fixed Shield icon import error in public report view
- Resolved TypeScript type errors in various components
- Fixed breadcrumb navigation mapping issues
- Corrected user creation process with proper Firebase Auth integration
- Fixed CORS issues in Cloud Functions
- Resolved inspector dashboard data loading issues

### Removed
- Weather conditions field from report creation process
- Access statistics feature due to privacy concerns
- Debug and testing tools from production builds
- Unused imports and dead code across components

## [1.0.0] - 2024-12-01

### Added
- Initial release of Taklaget Service App
- Multi-branch support with independent operations
- Role-based access control (Superadmin, Branch Admin, Inspector)
- Report management system with CRUD operations
- PDF export functionality with basic formatting
- Offline support with IndexedDB storage and sync
- PWA capabilities with service worker
- User and branch management interfaces
- Firebase integration with Auth, Firestore, and Storage
- Mobile-responsive design with Tailwind CSS
- Basic customer management system
- Simple analytics dashboard
- Email notification system
- Basic security rules and permissions

### Technical Details
- Built with React 18 and TypeScript
- Firebase backend with Firestore database
- Tailwind CSS for styling
- Vite for build tooling
- Progressive Web App architecture
- Offline-first data management
- Role-based security implementation

---

## Version History

- **v2.0.0** (Current) - Enhanced UX, smart PDF generation, comprehensive features
- **v1.0.0** (Initial) - Core functionality and basic features

## Future Roadmap

### Planned Features
- Advanced analytics and reporting
- Native mobile applications
- Third-party service integrations
- Advanced push notifications
- Multi-language support
- Advanced PDF customization
- Bulk operations and management
- Full-text search capabilities
- Advanced data export
- REST API for integrations
