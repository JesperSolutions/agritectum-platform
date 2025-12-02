import React from 'react';
import AccessibleModal from './AccessibleModal';
import { useIntl } from '../hooks/useIntl';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
  const { t } = useIntl();

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title='Changelog'
      size='xl'
      aria-label='Application changelog'
    >
      <div className='max-h-[70vh] overflow-y-auto'>
        <div className='prose prose-sm max-w-none'>
          {/* Version 1.0.2b */}
          <div className='mb-8'>
            <h2 className='text-xl font-bold text-slate-900 mb-2'>[1.0.2b] - 2025-01-28</h2>
            
            <div className='mb-4'>
              <h3 className='text-lg font-semibold text-slate-800 mb-2'>Added</h3>
              <ul className='list-disc list-inside space-y-1 text-slate-700 ml-4'>
                <li>Comprehensive service agreement form enhancements based on Danish paper version</li>
                <li><strong>Service Agreement Purpose Field:</strong> Added textarea for agreement purpose/description</li>
                <li><strong>Service Visits Checkboxes:</strong> 1 annual service visit option, 2 annual service visits option</li>
                <li><strong>Standard Services Checkboxes</strong> (10 services): Visual inspection, roofing control, penetrations control, flashing control, drain cleaning, gutter cleaning, debris removal, drainage test, walkway control, photo documentation</li>
                <li><strong>Optional Addons with Expandable Sections:</strong>
                  <ul className='list-disc list-inside ml-6 mt-1 space-y-1'>
                    <li><strong>Skylights & Fall Protection:</strong> Cleaning/inspection, annual inspection (EN 365), safety equipment control</li>
                    <li><strong>Solar Panels:</strong> Solar panel cleaning (1-2 times annually)</li>
                    <li><strong>Steel Roofs:</strong> Moss/lichen removal, chemical roof treatment</li>
                    <li><strong>Sedum Roofs (Green Roofs):</strong> Fertilization, weed control, sedum repair, substrate refill, watering</li>
                  </ul>
                </li>
                <li><strong>Pricing Structure Options:</strong> Per roof annual pricing with checkbox, per square meter pricing with checkbox</li>
                <li><strong>Billing Frequency Selection:</strong> Annual or semi-annual options</li>
                <li><strong>Signature Fields:</strong> Supplier and customer signature fields</li>
                <li><strong>Service Report Information Section:</strong> Displays what's included in service reports</li>
                <li><strong>Agreement Period Information:</strong> Notes about 12-month automatic renewal</li>
              </ul>
            </div>

            <div className='mb-4'>
              <h3 className='text-lg font-semibold text-slate-800 mb-2'>Changed</h3>
              <ul className='list-disc list-inside space-y-1 text-slate-700 ml-4'>
                <li>Expanded ServiceAgreement TypeScript interface with new fields: purpose, serviceVisits, standardServices, addons, pricingStructure, billingFrequency, signatures</li>
                <li>Enhanced form state management to handle all new checkbox and field types</li>
                <li>Updated form submission to include all new fields when creating/updating service agreements</li>
                <li>Added comprehensive translations for all new form fields in Danish, Swedish, and German</li>
              </ul>
            </div>

            <div className='mb-4'>
              <h3 className='text-lg font-semibold text-slate-800 mb-2'>Technical Details</h3>
              <ul className='list-disc list-inside space-y-1 text-slate-700 ml-4'>
                <li>Implemented toggle functions for service visits, standard services, and addons</li>
                <li>Added expandable/collapsible sections for addon categories using ChevronUp/ChevronDown icons</li>
                <li>Conditional rendering for pricing structure inputs based on checkbox selection</li>
                <li>Form validation and error handling for all new fields</li>
              </ul>
            </div>
          </div>

          {/* Version 1.0.2a */}
          <div className='mb-8 border-t border-slate-200 pt-6'>
            <h2 className='text-xl font-bold text-slate-900 mb-2'>[1.0.2a] - 2025-01-28</h2>
            
            <div className='mb-4'>
              <h3 className='text-lg font-semibold text-slate-800 mb-2'>Fixed</h3>
              <ul className='list-disc list-inside space-y-1 text-slate-700 ml-4'>
                <li>Fixed missing translation keys in dashboard for Swedish, Danish, and German locales</li>
                <li>Improved language auto-detection to re-detect locale on each visit for auto-detected locales</li>
                <li>Fixed language not automatically switching for users in different regions (e.g., Denmark)</li>
                <li>Added distinction between manual and auto-detected locale preferences</li>
                <li>Fixed console errors related to Firestore permission-denied queries for branch service</li>
                <li>Added client-side fallback for service agreement queries when Firestore index is missing</li>
              </ul>
            </div>

            <div className='mb-4'>
              <h3 className='text-lg font-semibold text-slate-800 mb-2'>Changed</h3>
              <ul className='list-disc list-inside space-y-1 text-slate-700 ml-4'>
                <li>Enhanced locale detection system to preserve manual language selections while allowing auto-detection updates</li>
                <li>Improved branch service to query only accessible branches based on user permissions</li>
              </ul>
            </div>
          </div>

          {/* Version 2.0.0 */}
          <div className='mb-8 border-t border-slate-200 pt-6'>
            <h2 className='text-xl font-bold text-slate-900 mb-2'>[2.0.0] - 2025-01-22</h2>
            
            <div className='mb-4'>
              <h3 className='text-lg font-semibold text-slate-800 mb-2'>Added</h3>
              <ul className='list-disc list-inside space-y-1 text-slate-700 ml-4'>
                <li>Smart PDF Export System with optimized header/footer layout</li>
                <li>Minimum content height enforcement to prevent cramped layouts</li>
                <li>Enhanced UX design optimized for roofing industry professionals</li>
                <li>4-step report creation wizard with streamlined workflow</li>
                <li>Auto-save functionality with 30-second intervals</li>
                <li>Advanced filtering and search capabilities</li>
                <li>Danish CVR compliance integration</li>
                <li>Professional PDF templates with industry standards</li>
                <li>Offline-first architecture with complete offline functionality</li>
                <li>Role-based analytics with branch-specific performance metrics</li>
                <li>Comprehensive customer relationship management</li>
                <li>Photo documentation system with image upload and attachment</li>
                <li>Comprehensive error boundaries and user feedback</li>
                <li>WCAG AA compliance and accessibility features</li>
                <li>Mobile optimization with touch-friendly interface</li>
                <li>Offer management system with customer acceptance tracking</li>
                <li>Real-time notifications and communication system</li>
                <li>Google Maps integration for location services</li>
                <li>Address autocomplete with worldwide support</li>
                <li>QR code generation for report access</li>
                <li>Breadcrumb navigation system</li>
                <li>Quick actions floating action button</li>
                <li>Page state persistence across sessions</li>
              </ul>
            </div>

            <div className='mb-4'>
              <h3 className='text-lg font-semibold text-slate-800 mb-2'>Changed</h3>
              <ul className='list-disc list-inside space-y-1 text-slate-700 ml-4'>
                <li>Updated copyright year to 2025 across all components</li>
                <li>Improved PDF generation using Puppeteer for HTML-to-PDF conversion</li>
                <li>Enhanced report status system with additional states</li>
                <li>Updated translation system with comprehensive Swedish localization</li>
                <li>Improved mobile responsiveness and touch interactions</li>
                <li>Enhanced security rules for better data protection</li>
                <li>Updated user management with password generation options</li>
                <li>Improved error handling and user feedback</li>
              </ul>
            </div>

            <div className='mb-4'>
              <h3 className='text-lg font-semibold text-slate-800 mb-2'>Fixed</h3>
              <ul className='list-disc list-inside space-y-1 text-slate-700 ml-4'>
                <li>Resolved PDF generation 500 errors with correct Firebase Functions v2 syntax</li>
                <li>Fixed offer permission errors with branch-specific filtering</li>
                <li>Corrected translation key issues in dashboard components</li>
                <li>Fixed Shield icon import error in public report view</li>
                <li>Resolved TypeScript type errors in various components</li>
                <li>Fixed breadcrumb navigation mapping issues</li>
                <li>Corrected user creation process with proper Firebase Auth integration</li>
                <li>Fixed CORS issues in Cloud Functions</li>
                <li>Resolved inspector dashboard data loading issues</li>
              </ul>
            </div>

            <div className='mb-4'>
              <h3 className='text-lg font-semibold text-slate-800 mb-2'>Removed</h3>
              <ul className='list-disc list-inside space-y-1 text-slate-700 ml-4'>
                <li>Weather conditions field from report creation process</li>
                <li>Access statistics feature due to privacy concerns</li>
                <li>Debug and testing tools from production builds</li>
                <li>Unused imports and dead code across components</li>
              </ul>
            </div>
          </div>

          {/* Version 1.0.0 */}
          <div className='mb-8 border-t border-slate-200 pt-6'>
            <h2 className='text-xl font-bold text-slate-900 mb-2'>[1.0.0] - 2024-12-01</h2>
            
            <div className='mb-4'>
              <h3 className='text-lg font-semibold text-slate-800 mb-2'>Added</h3>
              <ul className='list-disc list-inside space-y-1 text-slate-700 ml-4'>
                <li>Initial release of Agritectum Platform</li>
                <li>Multi-branch support with independent operations</li>
                <li>Role-based access control (Superadmin, Branch Admin, Inspector)</li>
                <li>Report management system with CRUD operations</li>
                <li>PDF export functionality with basic formatting</li>
                <li>Offline support with IndexedDB storage and sync</li>
                <li>PWA capabilities with service worker</li>
                <li>User and branch management interfaces</li>
                <li>Firebase integration with Auth, Firestore, and Storage</li>
                <li>Mobile-responsive design with Tailwind CSS</li>
                <li>Basic customer management system</li>
                <li>Simple analytics dashboard</li>
                <li>Email notification system</li>
                <li>Basic security rules and permissions</li>
              </ul>
            </div>

            <div className='mb-4'>
              <h3 className='text-lg font-semibold text-slate-800 mb-2'>Technical Details</h3>
              <ul className='list-disc list-inside space-y-1 text-slate-700 ml-4'>
                <li>Built with React 18 and TypeScript</li>
                <li>Firebase backend with Firestore database</li>
                <li>Tailwind CSS for styling</li>
                <li>Vite for build tooling</li>
                <li>Progressive Web App architecture</li>
                <li>Offline-first data management</li>
                <li>Role-based security implementation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AccessibleModal>
  );
};

export default ChangelogModal;



