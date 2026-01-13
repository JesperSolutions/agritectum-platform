import React from 'react';
import { Calendar, Home, Clock } from 'lucide-react';
import ValidatedInput, { ValidatedTextarea } from '../ValidatedInput';
import { validators } from '../../utils/validation';
import { RoofType } from '../types';
import { useTranslation } from 'react-i18next';

interface InspectionDetailsSectionProps {
  inspectionDate: string;
  roofType: RoofType;
  roofAge: number;
  conditionNotes: string;
  inspectionDuration: number;
  onFieldChange: (field: string, value: string | number) => void;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

// Roof type options - labels will be translated dynamically
const roofTypeOptions = [
  { value: 'tile' },
  { value: 'metal' },
  { value: 'shingle' },
  { value: 'slate' },
  { value: 'flat' },
  { value: 'other' },
];

const InspectionDetailsSection: React.FC<InspectionDetailsSectionProps> = ({
  inspectionDate,
  roofType,
  roofAge,
  conditionNotes,
  inspectionDuration,
  onFieldChange,
  errors,
  touched,
}) => {
  const { t } = useTranslation();
  
  return (
    <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
      <div className='flex items-center mb-4'>
        <Home className='w-5 h-5 text-blue-600 mr-2' />
        <h3 className='text-lg font-semibold text-gray-900'>{t('form.sections.inspectionDetails')}</h3>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <ValidatedInput
          label={t('form.fields.inspectionDate')}
          type='date'
          value={inspectionDate}
          onChange={onFieldChange.bind(null, 'inspectionDate')}
          rules={[
            {
              field: 'inspectionDate',
              message: t('form.validation.inspectionDateRequired'),
              validator: validators.required,
            },
            {
              field: 'inspectionDate',
              message: t('form.validation.dateInvalid'),
              validator: validators.date,
            },
          ]}
          required
        />

        <div className='space-y-1'>
          <label className='block text-sm font-medium text-gray-700'>
            {t('form.fields.roofType')} <span className='text-red-500'>*</span>
          </label>
          <select
            value={roofType}
            onChange={e => onFieldChange('roofType', e.target.value)}
            className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
          >
            <option value=''>{t('form.fields.roofTypePlaceholder')}</option>
            {roofTypeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {t(`roofTypes.${option.value}`)}
              </option>
            ))}
          </select>
          {errors.roofType && touched.roofType && (
            <p className='text-sm text-red-600'>{errors.roofType}</p>
          )}
        </div>

        <ValidatedInput
          label={t('form.fields.roofAge')}
          type='number'
          value={roofAge?.toString() || ''}
          onChange={value => onFieldChange('roofAge', parseInt(value) || 0)}
          rules={[
            {
              field: 'roofAge',
              message: t('form.validation.roofAgePositive'),
              validator: value => !value || validators.positiveNumber(value),
            },
          ]}
          helpText={t('form.fields.roofAgeHelp')}
        />


        <ValidatedInput
          label={t('form.fields.inspectionDuration')}
          type='number'
          value={inspectionDuration?.toString() || ''  onChange={value => onFieldChange('inspectionDuration', parseInt(value) || 0)}
          helpText={t('form.fields.inspectionDurationHelp')}
        />
      </div>

      <div className='mt-4'>
        <ValidatedTextarea
          label={t('form.fields.conditionNotes')}
          value={conditionNotes}
          onChange={onFieldChange.bind(null, 'conditionNotes')}
          rules={[
            {
              field: 'conditionNotes',
              message: t('form.validation.conditionNotesRequired'),
              validator: validators.required,
            },
            {
              field: 'conditionNotes',
              message: t('form.validation.conditionNotesMinLength'),
              validator: validators.minLength(10),
            },
          ]}
          rows={4}
          required
          helpText={t('form.fields.conditionNotesHelp')}
        />
      </div>
    </div>
  );
};

export default InspectionDetailsSection;
