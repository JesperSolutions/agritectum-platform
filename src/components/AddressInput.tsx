import React, { useState, useRef } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import { useIntl } from '../hooks/useIntl';

interface AddressInputProps {
  value: string;
  onChange: (address: string, coordinates?: { lat: number; lon: number }) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
}

const AddressInput = React.forwardRef<HTMLInputElement, AddressInputProps>(
  (
    {
      value,
      onChange,
      placeholder = 'Enter address...',
      error,
      required = false,
      className = '',
      disabled = false,
    },
    ref
  ) => {
    const { t } = useIntl();
    const [isOpen, setIsOpen] = useState(false);
    const [predictions, setPredictions] = useState<NominatimResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [internalValue, setInternalValue] = useState<string>(() => value || '');
    const internalInputRef = useRef<HTMLInputElement>(null);
    const inputRef = ref || internalInputRef;
    const dropdownRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout>();
    const isUserTypingRef = useRef(false);

    // Initialize internal value when value prop changes from external source
    React.useEffect(() => {
      if (!isUserTypingRef.current && value !== internalValue) {
        setInternalValue(value || '');
      }
    }, [value]); // Only depend on value, not internalValue to avoid loops

    // Nominatim geocoding function
    const searchAddress = async (query: string) => {
      if (!query || query.length < 3) {
        setPredictions([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`
        );

        if (!response.ok) {
          throw new Error('Network error');
        }

        const data = await response.json();
        setPredictions(data || []);
      } catch (err) {
        console.error('Error fetching address predictions:', err);
        setPredictions([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Handle input change with debouncing
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      isUserTypingRef.current = true;
      setInternalValue(query);
      onChange(query);

      // Clear previous debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // If query is empty or too short, don't search
      if (!query || query.length < 2) {
        setPredictions([]);
        setIsOpen(false);
        return;
      }

      // Set new debounce to fetch predictions after user stops typing
      debounceRef.current = setTimeout(() => {
        searchAddress(query);
        // Reset typing flag after debounce completes
        setTimeout(() => {
          isUserTypingRef.current = false;
        }, 100);
      }, 500); // 500ms delay for Nominatim rate limiting

      setIsOpen(true);
    };

    // Handle place selection or Enter key press
    const handlePlaceSelect = (prediction?: NominatimResult) => {
      const selectedPrediction = prediction || (predictions.length > 0 ? predictions[0] : null);

      if (!selectedPrediction) {
        setIsOpen(false);
        return;
      }

      const address = selectedPrediction.display_name;
      const coordinates = {
        lat: parseFloat(selectedPrediction.lat),
        lon: parseFloat(selectedPrediction.lon),
      };

      // Update internal value immediately and show it
      setInternalValue(address);
      isUserTypingRef.current = true;
      setIsOpen(false);

      // Call onChange to update parent component
      onChange(address, coordinates);

      // Clear predictions after selection
      setPredictions([]);

      // After parent updates, clear typing flag so we use parent's value
      setTimeout(() => {
        isUserTypingRef.current = false;
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 150);
    };

    // Handle Enter key
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && predictions.length > 0) {
        e.preventDefault();
        handlePlaceSelect();
      }
    };

    // Clear selection
    const handleClear = () => {
      isUserTypingRef.current = false;
      setInternalValue('');
      onChange('');
      setPredictions([]);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    // Cleanup on unmount
    React.useEffect(() => {
      return () => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
      };
    }, []);

    // Handle click outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current &&
          !inputRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const hasError = !!error;
    const hasValue = !!value;

    return (
      <div className={`relative ${className}`}>
        {/* Input Field */}
        <div className='relative'>
          <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
            <MapPin className={`h-5 w-5 ${hasError ? 'text-red-500' : 'text-gray-400'}`} />
          </div>

          <input
            ref={inputRef}
            type='text'
            value={isUserTypingRef.current ? internalValue : value || ''}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onFocus={() => {
              setIsOpen(true);
              isUserTypingRef.current = true;
            }}
            onBlur={e => {
              // Small delay to allow onClick on suggestions to work
              // Check if the relatedTarget (where focus is going) is within the dropdown
              const relatedTarget = e.relatedTarget as HTMLElement;
              const isClickingDropdown = dropdownRef.current?.contains(relatedTarget);

              if (!isClickingDropdown) {
                setTimeout(() => {
                  if (!isOpen || predictions.length === 0) {
                    isUserTypingRef.current = false;
                    setInternalValue(value || '');
                  }
                }, 200);
              }
            }}
            placeholder={placeholder || t('address.placeholder')}
            disabled={disabled}
            required={required}
            autoComplete='street-address'
            aria-autocomplete='list'
            aria-expanded={isOpen}
            className={`
            block w-full pl-10 pr-10 py-3 text-gray-900 placeholder-gray-500
            border rounded-lg shadow-sm transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-0
            sm:text-sm
            ${
              hasError
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-600 focus:ring-blue-600'
            }
            ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
          `}
          />

          {/* Clear Button */}
          {hasValue && !disabled && (
            <button
              type='button'
              onClick={handleClear}
              className='absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600'
            >
              <X className='h-5 w-5 text-gray-400' />
            </button>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className='absolute inset-y-0 right-0 pr-3 flex items-center'>
              <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
            </div>
          )}
        </div>

        {/* Dropdown with Predictions */}
        {isOpen && (predictions.length > 0 || isLoading) && (
          <div
            ref={dropdownRef}
            className='absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto'
          >
            {isLoading ? (
              <div className='px-4 py-3 text-center text-gray-500'>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto'></div>
                <span className='ml-2'>Söker...</span>
              </div>
            ) : (
              predictions.map(prediction => (
                <button
                  key={prediction.place_id}
                  type='button'
                  onMouseDown={e => {
                    // Prevent input blur when clicking on suggestion
                    e.preventDefault();
                  }}
                  onClick={() => {
                    handlePlaceSelect(prediction);
                  }}
                  className='w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0'
                >
                  <div className='flex items-start'>
                    <Search className='h-4 w-4 text-gray-400 mt-0.5 mr-3 flex-shrink-0' />
                    <div className='flex-1 min-w-0'>
                      <div className='text-sm font-medium text-gray-900'>
                        {prediction.display_name}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <p className='mt-1 text-sm text-red-600 flex items-center'>
            <span className='mr-1'>⚠</span>
            {error}
          </p>
        )}
      </div>
    );
  }
);

AddressInput.displayName = 'AddressInput';

export default AddressInput;
