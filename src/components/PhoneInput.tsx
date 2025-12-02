import React, { useState, useEffect } from 'react';
import { Phone } from 'lucide-react';

interface PhoneInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  id,
  value,
  onChange,
  className = '',
  placeholder = '+46 70 123 45 67',
}) => {
  const [displayValue, setDisplayValue] = useState('');

  // Format phone number for display
  const formatPhoneNumber = (phone: string): string => {
    if (!phone) return '';

    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');

    // If it starts with 46, format as +46
    if (digits.startsWith('46')) {
      const number = digits.substring(2);
      if (number.length <= 9) {
        // Format as +46 70 123 45 67
        const formatted = number.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, '+46 $1 $2 $3 $4');
        return formatted;
      }
    }

    // If it starts with 0, replace with +46
    if (digits.startsWith('0')) {
      const number = digits.substring(1);
      if (number.length <= 9) {
        const formatted = number.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, '+46 $1 $2 $3 $4');
        return formatted;
      }
    }

    // If it's just digits, try to format as Swedish number
    if (digits.length >= 8 && digits.length <= 10) {
      const formatted = digits.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, '+46 $1 $2 $3 $4');
      return formatted;
    }

    return phone;
  };

  // Parse phone number for storage
  const parsePhoneNumber = (display: string): string => {
    if (!display) return '';

    // Remove all non-digits
    const digits = display.replace(/\D/g, '');

    // If it starts with 46, keep as is
    if (digits.startsWith('46')) {
      return digits;
    }

    // If it starts with 0, replace with 46
    if (digits.startsWith('0')) {
      return '46' + digits.substring(1);
    }

    // If it's just digits, add 46
    if (digits.length >= 8 && digits.length <= 10) {
      return '46' + digits;
    }

    return digits;
  };

  // Update display value when value prop changes
  useEffect(() => {
    setDisplayValue(formatPhoneNumber(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);

    // Parse and store the clean number
    const cleanNumber = parsePhoneNumber(inputValue);
    onChange(cleanNumber);
  };

  const handleBlur = () => {
    // Format the display value on blur
    const formatted = formatPhoneNumber(displayValue);
    setDisplayValue(formatted);
  };

  return (
    <div className='relative'>
      <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
        <Phone className='h-5 w-5 text-gray-400' />
      </div>
      <input
        type='tel'
        id={id}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`pl-10 ${className}`}
      />
    </div>
  );
};

export default PhoneInput;
