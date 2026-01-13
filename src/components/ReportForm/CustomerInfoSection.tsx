import React from 'react';
import { User, MapPin, Phone, Mail } from 'lucide-react';
import ValidatedInput from '../ValidatedInput';
import { validators } from '../../utils/validation';
import { useIntl } from '../../hooks/useIntl';

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
  const { t } = useIntl();

  return (
    <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200 form-section'>
      <div className='flex items-center mb-6'>
        <User className='w-5 h-5 text-blue-600 mr-3 flex-shrink-0' />
        <h3 className='text-lg font-semibold text-gray-900 truncate-smart'>{t('reportForm.customerInfo.title')}</h3>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-5 form-section-grid'>
        <ValidatedInput
          label={t('reportForm.customerInfo.customerName')}
          value={customerName}
          onChange={onFieldChange.bind(null, 'customerName')}
          rules={[
            {
              field: 'customerName',
              message: t('reportForm.customerInfo.customerNameRequired'),
              validator: validators.required,
            },
            {
              field: 'customerName',
              message: t('reportForm.customerInfo.customerNameMinLength'),
              validator: validators.minLength(2),
            },
          ]}
          required
          className='md:col-span-2'
        />

        <ValidatedInput
          label={t('reportForm.customerInfo.address')}
          value={customerAddress}
          onChange={onFieldChange.bind(null, 'customerAddress')}
          rules={[
            {
              field: 'customerAddress',
              message: t('reportForm.customerInfo.addressRequired'),
              validator: validators.required,
            },
            {
              field: 'customerAddress',
              message: t('reportForm.customerInfo.addressMinLength'),
              validator: validators.minLength(5),
            },
          ]}
          required
          className='md:col-span-2'
        />

        <ValidatedInput
          label={t('reportForm.customerInfo.phoneNumber')}
          value={customerPhone}
          onChange={onFieldChange.bind(null, 'customerPhone')}
          rules={[
            {
              field: 'customerPhone',
              message: t('reportForm.customerInfo.phoneInvalid'),
              validator: value => !value || validators.phone(value),
            },
          ]}
          helpText={t('reportForm.customerInfo.phoneHelp')}
        />

        <ValidatedInput
          label={t('reportForm.customerInfo.email')}
          type='email'
          value={customerEmail}
          onChange={onFieldChange.bind(null, 'customerEmail')}
          rules={[
            {
              field: 'customerEmail',
              message: t('reportForm.customerInfo.emailInvalid'),
              validator: value => !value || validators.email(value),
            },
          ]}
          helpText={t('reportForm.customerInfo.emailHelp')}
      </div>
    </div>
  );
};

export default CustomerInfoSection;
