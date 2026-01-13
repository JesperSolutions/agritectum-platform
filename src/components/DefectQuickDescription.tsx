import React, { useState } from 'react';
import { X, Save, FileText } from 'lucide-react';
import { useIntl } from '../hooks/useIntl';
import { IssueType, IssueSeverity } from '../types';

interface DefectQuickDescriptionProps {
  draftDefect: {
    image?: string;
    pinPosition?: { lat: number; lon: number } | { x: number; y: number };
    title?: string;
    description?: string;
    severity?: IssueSeverity;
    type?: IssueType;
  } | null;
  onSave: (defect: {
    title: string;
    description: string;
    type: IssueType;
    severity: IssueSeverity;
  }) => void;
  onMoreDetails: () => void;
  onCancel: () => void;
}

const DefectQuickDescription: React.FC<DefectQuickDescriptionProps> = ({
  draftDefect,
  onSave,
  onMoreDetails,
  onCancel,
}) => {
  const { t } = useIntl();
  const [description, setDescription] = useState(
    draftDefect?.description || ''
  );
  const [title, setTitle] = useState(
    draftDefect?.title || ''
  );
  const [issueType, setIssueType] = useState<IssueType>(
    draftDefect?.type || 'other'
  );

  const handleSave = () => {
    if (!title.trim()) {
      // Require title
      return;
    }

    onSave({
      title: title.trim(),
      description: description.trim(),
      type: issueType,
      severity: draftDefect?.severity || 'medium',
    });
  };

  const canSave = title.trim().length > 0;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center'>
      <div className='bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='sticky top-0 bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex items-center justify-between z-10'>
          <h3 className='text-lg font-semibold text-slate-900 flex items-center'>
            <FileText className='w-5 h-5 mr-2' />
            {t('form.defectFlow.describeDefect') || 'Describe Defect'}
          </h3>
          <button
            type='button'
            onClick={onCancel}
            className='text-slate-400 hover:text-slate-600 transition-colors'
            aria-label={t('common.buttons.close') || 'Close'}
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* Content */}
        <div className='p-4 sm:p-6 space-y-6'>
          {/* Image thumbnail */}
          {draftDefect?.image && (
            <div className='flex justify-center'>
              <div className='relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50'>
                <img
                  src={draftDefect.image}
                  alt={t('form.defectFlow.capturedImage') || 'Captured image'}
                  className='w-32 h-32 object-cover'
                />
              </div>
            </div>
          )}

          {/* Issue Type */}
          <div>
            <label className='block text-sm font-medium text-slate-700 mb-1'>
              {t('form.fields.issueType')} *
            </label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value as IssueType)}
              className='block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm min-h-[44px]'
            >
              <option value='leak'>{t('issueTypes.leak')}</option>
              <option value='damage'>{t('issueTypes.damage')}</option>
              <option value='wear'>{t('issueTypes.wear')}</option>
              <option value='structural'>{t('issueTypes.structural')}</option>
              <option value='ventilation'>{t('issueTypes.ventilation')}</option>
              <option value='gutters'>{t('issueTypes.gutters')}</option>
              <option value='flashing'>{t('issueTypes.flashing')}</option>
              <option value='other'>{t('issueTypes.other')}</option>
            </select>
          </div>

          {/* Title input */}
          <div>
            <label className='block text-sm font-medium text-slate-700 mb-1'>
              {t('form.labels.issueTitle')} *
            </label>
            <input
              type='text'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('form.fields.issueTitlePlaceholder') || 'Enter issue title'}
              className='block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm min-h-[44px]'
            />
          </div>

          {/* Description */}
          <div>
            <label className='block text-sm font-medium text-slate-700 mb-1'>
              {t('form.labels.issueDescription')} ({t('form.labels.optional')})
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('form.fields.issueDescriptionPlaceholder') || 'Describe the issue in detail...'}
              className='block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm resize-none'
            />
          </div>
        </div>

        {/* Footer buttons */}
        <div className='sticky bottom-0 bg-white border-t border-slate-200 px-4 sm:px-6 py-4 flex flex-col sm:flex-row gap-3'>
          <button
            type='button'
            onClick={onCancel}
            className='px-4 py-3 border border-slate-300 text-slate-700 bg-white rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 font-medium min-h-[44px] transition-colors'
          >
            {t('form.buttons.cancel') || 'Cancel'}
          </button>
          <button
            type='button'
            onClick={onMoreDetails}
            className='px-4 py-3 border border-slate-300 text-slate-700 bg-white rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 font-medium min-h-[44px] transition-colors'
          >
            {t('form.buttons.moreDetails') || 'More Details'}
          </button>
          <button
            type='button'
            onClick={handleSave}
            disabled={!canSave}
            className='flex-1 px-4 py-3 border border-transparent text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium min-h-[44px] transition-colors flex items-center justify-center gap-2'
          >
            <Save className='w-4 h-4' />
            {t('form.buttons.saveDefect') || 'Save Defect'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DefectQuickDescription;
