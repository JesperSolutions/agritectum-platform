import React from 'react';
import { Save, ArrowLeft } from 'lucide-react';
import AccessibleButton from '../AccessibleButton';
import { useIntl } from '../../hooks/useIntl';

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
  const { t } = useIntl();

  return (
    <div className='bg-gradient-to-r from-slate-900 to-slate-700 rounded-2xl shadow-lg p-6 mb-6 text-white'>
      <div className='flex items-center justify-between flex-wrap gap-4'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>
            {mode === 'create'
              ? t('reportForm.header.newInspection')
              : t('reportForm.header.editReport')}
          </h1>
          {autoSaving && (
            <p className='text-sm text-white/70 mt-1'>{t('reportForm.header.autoSaving')}</p>
          )}
        </div>

        <div className='flex items-center space-x-3'>
          <AccessibleButton
            variant='ghost'
            onClick={onCancel}
            leftIcon={<ArrowLeft className='w-4 h-4' />}
            aria-label={t('common.goBackToDashboard')}
          >
            {t('common.back')}
          </AccessibleButton>

          <AccessibleButton
            variant='secondary'
            onClick={e => onSave(e, 'draft')}
            disabled={loading}
            leftIcon={loading ? undefined : <Save className='w-4 h-4' />}
            loading={loading}
            aria-label={t('reportForm.header.saveDraftAria')}
          >
            {t('reportForm.header.saveDraft')}
          </AccessibleButton>

          <AccessibleButton
            variant='primary'
            onClick={e => onSave(e, 'completed')}
            disabled={loading || !isValid}
            leftIcon={loading ? undefined : <Save className='w-4 h-4' />}
            loading={loading}
            aria-label={t('reportForm.header.completeAria')}
          >
            {t('reportForm.header.complete')}
          </AccessibleButton>
        </div>
      </div>
    </div>
  );
};

export default ReportFormHeader;
