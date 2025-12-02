import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Eye, EyeOff, ExternalLink, Search } from 'lucide-react';

interface AddressWithMapProps {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  required?: boolean;
}

const AddressWithMap: React.FC<AddressWithMapProps> = ({
  value,
  onChange,
  placeholder = "Ange fastighetsadress",
  className = '',
  error,
  required = false
}) => {
  const [showMap, setShowMap] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Google Maps API configuration - using environment variable for security
  // DEPRECATED: This component is no longer used. Replaced by AddressWithMapV2.tsx using Leaflet.js
  const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'DEPRECATED-NO-LONGER-USED';
  const MAP_SIZE = '600x400'; // Larger map
  const ZOOM_LEVEL = 19; // Higher zoom for better building detail
  const MAP_TYPE = 'satellite';

  // Address autocomplete using Google Places API
  const getAddressSuggestions = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      // Using Google Places Autocomplete API
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=address&key=${API_KEY}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const suggestions = data.predictions?.slice(0, 5).map((prediction: any) => prediction.description) || [];
        setSuggestions(suggestions);
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      setSuggestions([]);
    }
  };

  // Debounced search for suggestions
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      getAddressSuggestions(value);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowSuggestions(true);
    setSelectedSuggestionIndex(-1);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    inputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionSelect(suggestions[selectedSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  // Generate map URL
  const generateMapUrl = (address: string): string => {
    const encodedAddress = encodeURIComponent(address);
    return `https://maps.googleapis.com/maps/api/staticmap?center=${encodedAddress}&zoom=${ZOOM_LEVEL}&size=${MAP_SIZE}&maptype=${MAP_TYPE}&markers=color:red%7Csize:large%7C${encodedAddress}&key=${API_KEY}`;
  };

  // Open in Google Maps
  const openInGoogleMaps = () => {
    const encodedAddress = encodeURIComponent(value);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    window.open(googleMapsUrl, '_blank');
  };

  // Toggle map visibility
  const handleToggleMap = () => {
    if (!showMap) {
      setIsLoading(true);
      setMapError(null);
    }
    setShowMap(!showMap);
  };

  // Test map loading
  useEffect(() => {
    if (showMap && value) {
      const img = new Image();
      img.onload = () => {
        setIsLoading(false);
        setMapError(null);
      };
      img.onerror = () => {
        setIsLoading(false);
        setMapError('Kunde inte ladda kartan. Kontrollera adressen.');
      };
      img.src = generateMapUrl(value);
    }
  }, [showMap, value]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Address Input with Autocomplete */}
      <div className="relative">
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPin className="h-4 w-4 text-gray-400" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            className={`block w-full pl-10 pr-10 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
              error ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder={placeholder}
            required={required}
            autoComplete="off"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Address Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`px-4 py-3 cursor-pointer hover:bg-gray-50 ${
                  index === selectedSuggestionIndex ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleSuggestionSelect(suggestion)}
              >
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900">{suggestion}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>

      {/* Map Controls */}
      {value && value.trim().length >= 5 && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>Satellitvy för takinspektion</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleMap}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
              >
                {showMap ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showMap ? 'Dölj karta' : 'Visa satellitvy'}
              </button>
              {showMap && (
                <button
                  type="button"
                  onClick={openInGoogleMaps}
                  className="flex items-center gap-1 px-3 py-2 text-sm bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Öppna i Google Maps
                </button>
              )}
            </div>
          </div>

          {/* Map Display */}
          {showMap && (
            <div className="relative">
              {isLoading && (
                <div className="w-full h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Laddar satellitvy...</p>
                  </div>
                </div>
              )}
              
              {mapError && (
                <div className="w-full h-[400px] bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-8 h-8 text-red-400 mx-auto mb-2" />
                    <p className="text-sm text-red-600">{mapError}</p>
                  </div>
                </div>
              )}

              {!isLoading && !mapError && (
                <div className="relative">
                  <img
                    src={generateMapUrl(value)}
                    alt={`Satellitvy av ${value}`}
                    className="w-full h-[400px] object-cover rounded-lg border border-gray-200 shadow-sm"
                    onLoad={() => setIsLoading(false)}
                    onError={() => {
                      setIsLoading(false);
                      setMapError('Kunde inte ladda kartan. Kontrollera adressen.');
                    }}
                  />
                  <div className="absolute top-3 left-3 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm">
                    Zoom: {ZOOM_LEVEL} • Satellitvy • Takinspektion
                  </div>
                </div>
              )}

              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>💡 Tips för takinspektörer:</strong> Satellitvyn visar takets struktur och omgivningar. 
                  Använd den för att planera inspektionen och identifiera potentiella problem innan besöket.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AddressWithMap;
