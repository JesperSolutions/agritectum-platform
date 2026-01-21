import React from 'react';
import { MaterialFormField, MaterialSelect, MaterialTextarea } from '../ui/material-form-field';
import { useIntl } from '../../hooks/useIntl';

export interface InspectionChecklistItemData {
  id: string;
  status: 'pass' | 'fail' | 'needs_review' | 'na';
  comment?: string;
}

interface InspectionChecklistItemProps {
  label: string;
  value?: InspectionChecklistItemData;
  onChange: (item: InspectionChecklistItemData) => void;
  required?: boolean;
  helpText?: string;
  error?: string;
  touched?: boolean;
}

const InspectionChecklistItem: React.FC<InspectionChecklistItemProps> = ({
  label,
  value,
  onChange,
  required = false,
  helpText,
  error,
  touched,
}) => {
  const { t } = useIntl();
  const currentStatus = value?.status || '';
  const currentComment = value?.comment || '';

  const statusOptions = [
    { value: '', label: t('inspection.selectStatus') || 'Select status...' },
    { value: 'pass', label: t('inspection.status.pass') || '✓ Pass' },
    { value: 'fail', label: t('inspection.status.fail') || '✗ Needs Action' },
    { value: 'needs_review', label: t('inspection.status.needsReview') || '⚠ Needs Review' },
    { value: 'na', label: t('inspection.status.notApplicable') || 'N/A Not Applicable' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'border-l-4 border-l-green-500 bg-green-50';
      case 'fail':
        return 'border-l-4 border-l-red-500 bg-red-50';
      case 'needs_review':
        return 'border-l-4 border-l-yellow-500 bg-yellow-50';
      default:
        return 'border-l-4 border-l-gray-300 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return '✓';
      case 'fail':
        return '✗';
      case 'needs_review':
        return '⚠';
      case 'na':
        return '—';
      default:
        return '○';
    }
  };

  const handleStatusChange = (newStatus: string) => {
    onChange({
      id: value?.id || Date.now().toString(),
      status: newStatus as InspectionChecklistItemData['status'],
      comment: currentComment,
    });
  };

  const handleCommentChange = (newComment: string) => {
    onChange({
      id: value?.id || Date.now().toString(),
      status: currentStatus as InspectionChecklistItemData['status'],
      comment: newComment,
    });
  };

  return (
    <div
      className={`p-4 rounded-lg border border-gray-200 transition-all duration-200 ${getStatusColor(currentStatus)}`}
    >
      {/* Header with Status and Label */}
      <div className='flex items-start gap-3'>
        {currentStatus && (
          <div className='flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-white border-2 border-gray-300 text-sm font-bold'>
            <span
              className={`${
                currentStatus === 'pass'
                  ? 'text-green-600'
                  : currentStatus === 'fail'
                    ? 'text-red-600'
                    : currentStatus === 'needs_review'
                      ? 'text-yellow-600'
                      : 'text-gray-600'
              }`}
            >
              {getStatusIcon(currentStatus)}
            </span>
          </div>
        )}
        <div className='flex-1'>
          <label className='block text-sm font-medium text-gray-700 mb-3'>
            {label}
            {required && <span className='text-red-500 ml-1'>*</span>}
          </label>

          {/* Status Select */}
          <MaterialFormField
            label={t('inspection.status') || 'Status'}
            error={error}
            touched={touched}
            helpText={helpText}
            className='mb-0'
          >
            <MaterialSelect
              value={currentStatus}
              onChange={e => handleStatusChange(e.target.value)}
              required={required}
              options={statusOptions}
              title={required ? t('form.validation.required') : undefined}
            />
          </MaterialFormField>
        </div>
      </div>

      {/* Conditional Comment Field - Appears when status is selected */}
      {currentStatus && (
        <div className='mt-4 pl-9 animate-in fade-in duration-200'>
          <div className='border-t border-gray-200 pt-4'>
            <MaterialFormField
              label={t('inspection.comment') || 'Comment'}
              helpText={t('inspection.commentHint') || 'Add findings or observations'}
              className='mb-0'
            >
              <MaterialTextarea
                placeholder={
                  t('inspection.commentPlaceholder') || 'Add observations, findings, or notes...'
                }
                value={currentComment}
                onChange={e => handleCommentChange(e.target.value)}
                rows={3}
              />
            </MaterialFormField>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectionChecklistItem;
