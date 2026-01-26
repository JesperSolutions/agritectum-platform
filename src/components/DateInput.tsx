import React, { useRef } from 'react';

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
  const dateInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className='relative'>
      {/* Native date input */}
      <input
        ref={dateInputRef}
        type='date'
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        required={required}
        className={`w-full px-4 py-2 border border-gray-300 rounded-material shadow-sm transition-all duration-material focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
      />
    </div>
  );
};

export default DateInput;
