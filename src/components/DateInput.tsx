import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';

interface DateInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

const DateInput: React.FC<DateInputProps> = ({
  id,
  value,
  onChange,
  onBlur,
  required = false,
  className = '',
  placeholder = 'dd/mm/yyyy',
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLInputElement>(null);

  // Convert YYYY-MM-DD to DD/MM/YYYY for display
  const formatForDisplay = (isoDate: string): string => {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  };

  // Convert DD/MM/YYYY to YYYY-MM-DD for storage
  const parseFromDisplay = (displayDate: string): string => {
    if (!displayDate) return '';
    const parts = displayDate.split('/');
    if (parts.length !== 3) return '';

    const [day, month, year] = parts;

    // Validate the date
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    if (
      dayNum < 1 ||
      dayNum > 31 ||
      monthNum < 1 ||
      monthNum > 12 ||
      yearNum < 1900 ||
      yearNum > 2100
    ) {
      return '';
    }

    // Create date and validate it's real
    const date = new Date(yearNum, monthNum - 1, dayNum);
    if (
      date.getDate() !== dayNum ||
      date.getMonth() !== monthNum - 1 ||
      date.getFullYear() !== yearNum
    ) {
      return '';
    }

    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  // Update display value when value prop changes
  useEffect(() => {
    setDisplayValue(formatForDisplay(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);

    // Validate as user types
    const isoDate = parseFromDisplay(inputValue);
    const valid = !inputValue || (inputValue.length === 10 && isoDate);
    setIsValid(valid);

    if (valid && isoDate) {
      onChange(isoDate);
    } else if (!inputValue) {
      onChange('');
    }
  };

  const handleBlur = () => {
    // On blur, try to parse and format the date
    const isoDate = parseFromDisplay(displayValue);
    if (isoDate) {
      setDisplayValue(formatForDisplay(isoDate));
      onChange(isoDate);
      setIsValid(true);
    } else if (displayValue) {
      setIsValid(false);
    }

    // Call parent onBlur if provided
    if (onBlur) {
      onBlur();
    }
  };

  const handleCalendarClick = () => {
    if (datePickerRef.current) {
      // Try to use showPicker() if available (modern browsers)
      if (typeof datePickerRef.current.showPicker === 'function') {
        try {
          datePickerRef.current.showPicker();
        } catch (err) {
          // Fallback: focus and click if showPicker fails
          datePickerRef.current.focus();
          datePickerRef.current.click();
        }
      } else {
        // Fallback for browsers that don't support showPicker()
        // Make input temporarily visible and clickable
        datePickerRef.current.style.position = 'fixed';
        datePickerRef.current.style.top = '50%';
        datePickerRef.current.style.left = '50%';
        datePickerRef.current.style.transform = 'translate(-50%, -50%)';
        datePickerRef.current.style.opacity = '0.01';
        datePickerRef.current.style.width = '1px';
        datePickerRef.current.style.height = '1px';
        datePickerRef.current.focus();
        datePickerRef.current.click();
        // Reset after a short delay
        setTimeout(() => {
          if (datePickerRef.current) {
            datePickerRef.current.style.position = 'absolute';
            datePickerRef.current.style.top = '';
            datePickerRef.current.style.left = '';
            datePickerRef.current.style.transform = '';
            datePickerRef.current.style.opacity = '0';
          }
        }, 100);
      }
    }
  };

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    if (selectedDate) {
      onChange(selectedDate);
      setDisplayValue(formatForDisplay(selectedDate));
      setIsValid(true);
    }
    setShowDatePicker(false);
  };

  return (
    <div className='relative'>
      {/* Text input */}
      <input
        type='text'
        id={id}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        required={required}
        placeholder={placeholder}
        className={`pl-10 pr-10 rounded-material shadow-sm transition-all duration-material ${className} ${
          !isValid ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
        }`}
      />

      {/* Clickable calendar icon with larger click area */}
      <button
        type='button'
        className='absolute inset-y-0 left-0 pl-3 pr-2 flex items-center cursor-pointer hover:bg-gray-50 rounded-l-md transition-colors z-10 focus:outline-none focus:ring-2 focus:ring-blue-500'
        onClick={handleCalendarClick}
        title={placeholder || 'Click to open date picker'}
        aria-label='Open date picker'
      >
        <Calendar className='h-5 w-5 text-gray-400 hover:text-gray-600' />
      </button>

      {/* Native date picker - positioned off-screen but accessible */}
      <input
        ref={datePickerRef}
        type='date'
        value={value}
        onChange={handleDatePickerChange}
        className='absolute opacity-0 pointer-events-none'
        style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', zIndex: -1 }}
        aria-hidden='true'
        tabIndex={-1}
      />

      {!isValid && displayValue && (
        <p className='mt-1 text-sm text-red-600'>Please enter a valid date in DD/MM/YYYY format</p>
      )}
    </div>
  );
};

export default DateInput;
