import React from 'react';
import { Calendar, Home, Clock } from 'lucide-react';
import ValidatedInput, { ValidatedTextarea } from '../ValidatedInput';
import { validators } from '../../utils/validation';
import { RoofType } from '../types';

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

const roofTypeOptions = [
  { value: 'tile', label: 'Tile' },
  { value: 'metal', label: 'Metal' },
  { value: 'shingle', label: 'Shingle' },
  { value: 'slate', label: 'Slate' },
  { value: 'flat', label: 'Flat' },
  { value: 'other', label: 'Other' },
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
  return (
    <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
      <div className='flex items-center mb-4'>
        <Home className='w-5 h-5 text-blue-600 mr-2' />
        <h3 className='text-lg font-semibold text-gray-900'>Inspection Details</h3>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <ValidatedInput
          label='Inspection Date'
          type='date'
          value={inspectionDate}
          onChange={onFieldChange.bind(null, 'inspectionDate')}
          rules={[
            {
              field: 'inspectionDate',
              message: 'Inspection date is required',
              validator: validators.required,
            },
            {
              field: 'inspectionDate',
              message: 'Please enter a valid date',
              validator: validators.date,
            },
          ]}
          required
        />

        <div className='space-y-1'>
          <label className='block text-sm font-medium text-gray-700'>
            Roof Type <span className='text-red-500'>*</span>
          </label>
          <select
            value={roofType}
            onChange={e => onFieldChange('roofType', e.target.value)}
            className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
          >
            <option value=''>Select roof type</option>
            {roofTypeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.roofType && touched.roofType && (
            <p className='text-sm text-red-600'>{errors.roofType}</p>
          )}
        </div>

        <ValidatedInput
          label='Roof Age (years)'
          type='number'
          value={roofAge?.toString() || ''}
          onChange={value => onFieldChange('roofAge', parseInt(value) || 0)}
          rules={[
            {
              field: 'roofAge',
              message: 'Roof age must be a positive number',
              validator: value => !value || validators.positiveNumber(value),
            },
          ]}
          helpText='Optional - estimated age of the roof'
        />


        <ValidatedInput
          label='Inspection Duration (minutes)'
          type='number'
          value={inspectionDuration?.toString() || ''}
          onChange={value => onFieldChange('inspectionDuration', parseInt(value) || 0)}
          helpText='Optional - how long the inspection took'
        />
      </div>

      <div className='mt-4'>
        <ValidatedTextarea
          label='Condition Notes'
          value={conditionNotes}
          onChange={onFieldChange.bind(null, 'conditionNotes')}
          rules={[
            {
              field: 'conditionNotes',
              message: 'Condition notes are required',
              validator: validators.required,
            },
            {
              field: 'conditionNotes',
              message: 'Notes must be at least 10 characters',
              validator: validators.minLength(10),
            },
          ]}
          rows={4}
          required
          helpText='Describe the overall condition of the roof'
        />
      </div>
    </div>
  );
};

export default InspectionDetailsSection;
