import React from 'react';
import { User, MapPin, Phone, Mail } from 'lucide-react';
import ValidatedInput from '../ValidatedInput';
import { validators } from '../../utils/validation';

interface CustomerInfoSectionProps {
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  customerEmail: string;
  onFieldChange: (field: string, value: string) => void;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

const CustomerInfoSection: React.FC<CustomerInfoSectionProps> = ({
  customerName,
  customerAddress,
  customerPhone,
  customerEmail,
  onFieldChange,
  errors,
  touched,
}) => {
  return (
    <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
      <div className='flex items-center mb-4'>
        <User className='w-5 h-5 text-blue-600 mr-2' />
        <h3 className='text-lg font-semibold text-gray-900'>Customer Information</h3>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <ValidatedInput
          label='Customer Name'
          value={customerName}
          onChange={onFieldChange.bind(null, 'customerName')}
          rules={[
            {
              field: 'customerName',
              message: 'Customer name is required',
              validator: validators.required,
            },
            {
              field: 'customerName',
              message: 'Name must be at least 2 characters',
              validator: validators.minLength(2),
            },
          ]}
          required
          className='md:col-span-2'
        />

        <ValidatedInput
          label='Address'
          value={customerAddress}
          onChange={onFieldChange.bind(null, 'customerAddress')}
          rules={[
            {
              field: 'customerAddress',
              message: 'Address is required',
              validator: validators.required,
            },
            {
              field: 'customerAddress',
              message: 'Address must be at least 5 characters',
              validator: validators.minLength(5),
            },
          ]}
          required
          className='md:col-span-2'
        />

        <ValidatedInput
          label='Phone Number'
          value={customerPhone}
          onChange={onFieldChange.bind(null, 'customerPhone')}
          rules={[
            {
              field: 'customerPhone',
              message: 'Please enter a valid phone number',
              validator: value => !value || validators.phone(value),
            },
          ]}
          helpText='Optional - for customer contact'
        />

        <ValidatedInput
          label='Email Address'
          type='email'
          value={customerEmail}
          onChange={onFieldChange.bind(null, 'customerEmail')}
          rules={[
            {
              field: 'customerEmail',
              message: 'Please enter a valid email address',
              validator: value => !value || validators.email(value),
            },
          ]}
          helpText='Optional - for sending reports'
        />
      </div>
    </div>
  );
};

export default CustomerInfoSection;
