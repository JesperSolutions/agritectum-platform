import React from 'react';
import { Save, ArrowLeft } from 'lucide-react';
import AccessibleButton from '../AccessibleButton';

interface ReportFormHeaderProps {
  mode: 'create' | 'edit';
  autoSaving: boolean;
  onSave: (e: React.FormEvent, status?: 'draft' | 'completed') => void;
  onCancel: () => void;
  loading: boolean;
  isValid: boolean;
}

const ReportFormHeader: React.FC<ReportFormHeaderProps> = ({
  mode,
  autoSaving,
  onSave,
  onCancel,
  loading,
  isValid,
}) => {
  return (
    <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6'>
      <div className='flex items-center justify-between flex-wrap gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>
            {mode === 'create' ? 'New Inspection Report' : 'Edit Report'}
          </h1>
          {autoSaving && <p className='text-sm text-blue-600 mt-1'>Auto-saving...</p>}
        </div>

        <div className='flex items-center space-x-3'>
          <AccessibleButton
            variant='ghost'
            onClick={onCancel}
            leftIcon={<ArrowLeft className='w-4 h-4' />}
            aria-label='Go back to dashboard'
          >
            Back
          </AccessibleButton>

          <AccessibleButton
            variant='secondary'
            onClick={e => onSave(e, 'draft')}
            disabled={loading}
            leftIcon={loading ? undefined : <Save className='w-4 h-4' />}
            loading={loading}
            aria-label='Save as draft'
          >
            Save as Draft
          </AccessibleButton>

          <AccessibleButton
            variant='primary'
            onClick={e => onSave(e, 'completed')}
            disabled={loading || !isValid}
            leftIcon={loading ? undefined : <Save className='w-4 h-4' />}
            loading={loading}
            aria-label='Complete report'
          >
            Complete Report
          </AccessibleButton>
        </div>
      </div>
    </div>
  );
};

export default ReportFormHeader;
