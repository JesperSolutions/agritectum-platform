import React from 'react';
import { Building, FileCheck, Calendar, Lightbulb, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useIntl } from '../../hooks/useIntl';

interface EmptyStateProps {
  type: 'buildings' | 'agreements' | 'visits' | 'reports' | 'documents';
  onCreateClick?: () => void;
  actionLabel?: string;
  actionUrl?: string;
}

const EMPTY_STATE_CONFIG: Record<EmptyStateProps['type'], {
  icon: React.ComponentType<{ className: string }>;
  title: string;
  description: string;
  tips: string[];
  defaultActionLabel: string;
  defaultActionUrl?: string;
}> = {
  buildings: {
    icon: Building,
    title: 'No Buildings Yet',
    description: 'Start managing your properties by adding your first building.',
    tips: [
      'You can add multiple buildings to your portfolio',
      'Each building tracks its own inspection history and health status',
      'Upload photos and documents for each property',
    ],
    defaultActionLabel: 'Add Your First Building',
    defaultActionUrl: '/portal/buildings/new',
  },
  agreements: {
    icon: FileCheck,
    title: 'No Service Agreements',
    description: 'Service agreements help you stay on top of maintenance schedules.',
    tips: [
      'Create agreements directly or request them from your service provider',
      'Track pricing, frequency, and next service dates',
      'Digital signatures and acceptance tracking',
    ],
    defaultActionLabel: 'Create Service Agreement',
    defaultActionUrl: '/portal/service-agreements/new',
  },
  visits: {
    icon: Calendar,
    title: 'No Scheduled Visits',
    description: 'Schedule maintenance visits and inspections for your buildings.',
    tips: [
      'Get reminders before scheduled visits',
      'Track visit history and outcomes',
      'Coordinate with your service providers',
    ],
    defaultActionLabel: 'Schedule a Visit',
    defaultActionUrl: '/portal/scheduled-visits/new',
  },
  reports: {
    icon: FileCheck,
    title: 'No Reports Available',
    description: 'Inspection reports will appear here once your first inspection is completed.',
    tips: [
      'Reports include detailed findings and recommendations',
      'View photos, cost estimates, and health scores',
      'Download reports for your records',
    ],
    defaultActionLabel: 'Schedule an Inspection',
    defaultActionUrl: '/portal/scheduled-visits/new',
  },
  documents: {
    icon: FileCheck,
    title: 'No Documents',
    description: 'Upload and organize important documents for your buildings.',
    tips: [
      'Store permits, certificates, and maintenance records',
      'Access documents anytime from your portal',
      'Organize by building or document type',
    ],
    defaultActionLabel: 'Upload Document',
  },
};

const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  onCreateClick,
  actionLabel,
  actionUrl,
}) => {
  const { t } = useIntl();
  const config = EMPTY_STATE_CONFIG[type];
  const Icon = config.icon;

  const handleActionClick = () => {
    if (onCreateClick) {
      onCreateClick();
    }
  };

  const finalActionLabel = actionLabel || config.defaultActionLabel;
  const finalActionUrl = actionUrl || config.defaultActionUrl;

  return (
    <div className='flex flex-col items-center justify-center py-12 px-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200'>
      {/* Illustration */}
      <div className='mb-6'>
        <div className='w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center'>
          <Icon className='w-10 h-10 text-blue-500' />
        </div>
      </div>

      {/* Content */}
      <h3 className='text-xl font-semibold text-gray-900 mb-2 text-center'>{config.title}</h3>
      <p className='text-gray-600 text-center mb-6 max-w-sm'>{config.description}</p>

      {/* Tips */}
      <div className='w-full max-w-sm mb-8 bg-white rounded-lg border border-gray-200 p-4'>
        <div className='flex items-start gap-2 mb-3'>
          <Lightbulb className='w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5' />
          <h4 className='font-semibold text-gray-900'>Helpful Tips</h4>
        </div>
        <ul className='space-y-2'>
          {config.tips.map((tip, index) => (
            <li key={index} className='flex gap-2 text-sm text-gray-600'>
              <span className='text-blue-500 font-medium flex-shrink-0'>•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action Button */}
      {finalActionUrl ? (
        <Link
          to={finalActionUrl}
          className='inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors'
        >
          {finalActionLabel}
          <ArrowRight className='w-4 h-4' />
        </Link>
      ) : (
        <button
          onClick={handleActionClick}
          className='inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors'
        >
          {finalActionLabel}
          <ArrowRight className='w-4 h-4' />
        </button>
      )}
    </div>
  );
};

export default EmptyState;
