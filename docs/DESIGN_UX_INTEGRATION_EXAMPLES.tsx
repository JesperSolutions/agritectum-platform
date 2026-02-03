/**
 * EXAMPLE: How to integrate Design/UX components into existing portal
 * This file shows practical examples of using the new components
 */

import React, { useState } from 'react';
import { Building, FileCheck, Calendar, AlertCircle } from 'lucide-react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useOnboarding } from '../../hooks/useOnboarding';

// Import new components
import OnboardingTour from '../../components/onboarding/OnboardingTour';
import EmptyState from '../../components/empty-states/EmptyState';
import DocumentLibrary, { Document } from '../../components/document-library/DocumentLibrary';
import { MobileDashboardWidget, ResponsiveDashboardGrid, CompactStat } from '../../components/dashboard/MobileDashboardWidget';
import { HelpIcon, InfoBox, InlineHelp, HelpPanel } from '../../components/help/HelpContent';

/**
 * EXAMPLE 1: Buildings List with Empty State
 */
const BuildingsListExample: React.FC<{ buildings: any[] }> = ({ buildings }) => {
  if (buildings.length === 0) {
    return (
      <EmptyState
        type='buildings'
        actionUrl='/portal/buildings/new'
      />
    );
  }

  return (
    <div className='space-y-4'>
      {buildings.map(building => (
        <div key={building.id} className='bg-white rounded-lg shadow p-6'>
          <h3 className='font-semibold text-gray-900'>{building.address}</h3>
          <p className='text-gray-600'>{building.city}</p>
        </div>
      ))}
    </div>
  );
};

/**
 * EXAMPLE 2: Dashboard with Mobile Optimization
 */
const OptimizedDashboardExample: React.FC = () => {
  const buildings = []; // Your data
  const agreements = []; // Your data
  const visits = []; // Your data

  return (
    <div className='space-y-6'>
      {/* Info box at top */}
      <InfoBox
        title='Pro Tip'
        variant='tip'
        dismissible={true}
      >
        You can customize which widgets appear on your dashboard by clicking the settings icon.
      </InfoBox>

      {/* Responsive grid - single column on mobile, 2 columns on desktop */}
      <ResponsiveDashboardGrid>
        {/* Widget 1: Buildings */}
        <MobileDashboardWidget
          title='My Buildings'
          icon={<Building className='w-5 h-5' />}
          expandable={true}
          defaultExpanded={true}
          isEmpty={buildings.length === 0}
          action={{
            label: 'Add Building',
            onClick: () => {
              // Handle click
            },
          }}
        >
          {buildings.length === 0 ? (
            <p className='text-gray-600 text-sm'>No buildings yet. Add one to get started!</p>
          ) : (
            <div className='space-y-3'>
              {buildings.map(b => (
                <div key={b.id} className='flex justify-between items-center'>
                  <span className='text-sm text-gray-700'>{b.address}</span>
                  <span className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded'>
                    OK
                  </span>
                </div>
              ))}
            </div>
          )}
        </MobileDashboardWidget>

        {/* Widget 2: Statistics */}
        <MobileDashboardWidget
          title='Statistics'
          expandable={false}
        >
          <div className='space-y-2'>
            <CompactStat
              label='Total Buildings'
              value={buildings.length}
              icon={<Building className='w-4 h-4' />}
              trend={{ value: 2, direction: 'up' }}
            />
            <CompactStat
              label='Active Agreements'
              value={agreements.length}
              icon={<FileCheck className='w-4 h-4' />}
            />
            <CompactStat
              label='Upcoming Visits'
              value={visits.length}
              icon={<Calendar className='w-4 h-4' />}
            />
          </div>
        </MobileDashboardWidget>
      </ResponsiveDashboardGrid>
    </div>
  );
};

/**
 * EXAMPLE 3: Help Content Integration
 */
const FormWithHelpExample: React.FC = () => {
  return (
    <form className='space-y-6'>
      {/* Field with tooltip help */}
      <div>
        <div className='flex items-center gap-2 mb-2'>
          <label className='text-sm font-medium text-gray-900'>
            Building Address
          </label>
          <HelpIcon
            content='Enter the complete street address of your property'
            position='right'
            size='sm'
          />
        </div>
        <input
          type='text'
          placeholder='123 Main Street, City, 12345'
          className='w-full px-3 py-2 border border-gray-300 rounded-lg'
        />
        <InlineHelp>
          We use this address to locate your building on our map
        </InlineHelp>
      </div>

      {/* Info box with instructions */}
      <InfoBox
        title='About Service Agreements'
        variant='info'
      >
        Service agreements help you track regular maintenance and inspection schedules.
        You can set them up manually or import them from your service provider.
      </InfoBox>

      {/* Help panel in sidebar */}
      <div className='grid grid-cols-3 gap-6'>
        <div className='col-span-2'>
          <textarea
            placeholder='Building description...'
            rows={4}
            className='w-full px-3 py-2 border border-gray-300 rounded-lg'
          />
        </div>
        <HelpPanel
          title='Form Help'
          sections={[
            {
              heading: 'Required Fields',
              content: 'Address and building type are required to create a building record.',
              icon: AlertCircle,
            },
            {
              heading: 'Save Progress',
              content: 'Your changes are automatically saved as you type.',
              icon: Building,
            },
          ]}
        />
      </div>
    </form>
  );
};

/**
 * EXAMPLE 4: Document Library Integration
 */
const DocumentsPageExample: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      name: 'Service Agreement - Building A',
      type: 'agreement',
      buildingId: 'building-1',
      buildingName: 'Downtown Office',
      uploadedAt: new Date('2026-01-15'),
      uploadedBy: 'john@example.com',
      size: 2500000,
      fileUrl: 'https://storage.googleapis.com/...',
    },
    {
      id: '2',
      name: 'Inspection Report Q4 2025',
      type: 'report',
      buildingId: 'building-1',
      buildingName: 'Downtown Office',
      uploadedAt: new Date('2026-01-10'),
      uploadedBy: 'inspector@company.com',
      size: 5000000,
      fileUrl: 'https://storage.googleapis.com/...',
    },
  ]);

  const handleDelete = async (docId: string) => {
    setDocuments(docs => docs.filter(d => d.id !== docId));
    // Call actual delete API
  };

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold text-gray-900 mb-2'>Documents</h1>
        <p className='text-gray-600'>
          Browse and download all your documents in one place
        </p>
      </div>

      <DocumentLibrary
        documents={documents}
        loading={false}
        onDelete={handleDelete}
      />
    </div>
  );
};

/**
 * EXAMPLE 5: Using Onboarding Hook
 */
const ProfileWithTourControlExample: React.FC = () => {
  const { restartTour, onboardingState } = useOnboarding();

  if (!onboardingState) {
    return <div>Loading...</div>;
  }

  return (
    <div className='space-y-4'>
      <h2 className='text-lg font-semibold text-gray-900'>Learning & Support</h2>

      {onboardingState.skipped && (
        <InfoBox
          title='Guided Tour Available'
          variant='tip'
        >
          Need help getting started? We can show you around the portal again.
        </InfoBox>
      )}

      <button
        onClick={restartTour}
        className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
      >
        🎬 Restart Guided Tour
      </button>

      <div className='text-sm text-gray-600'>
        <p className='mb-2'>Tour Progress: {onboardingState.completedSteps.length} / 6 steps completed</p>
        <div className='w-full bg-gray-200 rounded-full h-2'>
          <div
            className='bg-blue-600 h-2 rounded-full transition-all'
            style={{ width: `${(onboardingState.completedSteps.length / 6) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * EXAMPLE 6: Service Agreement Form with Mobile Optimization
 */
const ServiceAgreementFormExample: React.FC = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [formData, setFormData] = useState({
    customerName: '',
    serviceFrequency: 'annual',
    startDate: '',
    price: '',
  });

  return (
    <form className='space-y-6 max-w-2xl'>
      <InfoBox
        title='Service Agreement'
        variant='info'
        dismissible={true}
      >
        This agreement outlines the services, schedule, and pricing for your maintenance plan.
      </InfoBox>

      <div>
        <div className='flex items-center gap-2 mb-2'>
          <label className='block text-sm font-medium text-gray-900'>
            Customer Name
          </label>
          <HelpIcon
            content='The person or company who will receive these services'
            position='right'
          />
        </div>
        <input
          type='text'
          value={formData.customerName}
          onChange={e => setFormData({ ...formData, customerName: e.target.value })}
          className='w-full px-3 py-2 border border-gray-300 rounded-lg'
          placeholder='Enter customer name'
        />
      </div>

      <div className={isMobile ? 'space-y-4' : 'grid grid-cols-2 gap-4'}>
        <div>
          <label className='block text-sm font-medium text-gray-900 mb-2'>
            Service Frequency
          </label>
          <select
            value={formData.serviceFrequency}
            onChange={e => setFormData({ ...formData, serviceFrequency: e.target.value })}
            className='w-full px-3 py-2 border border-gray-300 rounded-lg'
          >
            <option value='monthly'>Monthly</option>
            <option value='quarterly'>Quarterly</option>
            <option value='annual'>Annual</option>
          </select>
          <InlineHelp>
            How often will services be provided?
          </InlineHelp>
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-900 mb-2'>
            Start Date
          </label>
          <input
            type='date'
            value={formData.startDate}
            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
            className='w-full px-3 py-2 border border-gray-300 rounded-lg'
          />
        </div>
      </div>

      <div>
        <div className='flex items-center gap-2 mb-2'>
          <label className='block text-sm font-medium text-gray-900'>
            Annual Price
          </label>
          <HelpIcon
            content='Total price for one year of services'
            position='right'
          />
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-gray-600'>DKK</span>
          <input
            type='number'
            value={formData.price}
            onChange={e => setFormData({ ...formData, price: e.target.value })}
            className='flex-1 px-3 py-2 border border-gray-300 rounded-lg'
            placeholder='0'
          />
        </div>
      </div>

      <button
        type='submit'
        className={`w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium ${
          isMobile ? 'text-base' : ''
        }`}
      >
        Create Agreement
      </button>
    </form>
  );
};

// Export examples
export {
  BuildingsListExample,
  OptimizedDashboardExample,
  FormWithHelpExample,
  DocumentsPageExample,
  ProfileWithTourControlExample,
  ServiceAgreementFormExample,
};
