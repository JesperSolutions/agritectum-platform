import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import { useIntl } from '../hooks/useIntl';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import html2canvas from 'html2canvas';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

interface AddressWithMapV2Props {
  value: string;
  onChange: (address: string) => void;
  onSatelliteImageConfirm?: (imageUrl: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  // New prop to trigger capture manually
  triggerCapture?: boolean;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
}

const AddressWithMapV2: React.FC<AddressWithMapV2Props> = ({
  value,
  onChange,
  onSatelliteImageConfirm,
  placeholder = 'Enter address...',
  error,
  required = false,
  className = '',
  disabled = false,
  triggerCapture = false,
}) => {
  const { t } = useIntl();
  const [isOpen, setIsOpen] = useState(false);
  const [predictions, setPredictions] = useState<NominatimResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [map, setMap] = useState<L.Map | null>(null);
  const [marker, setMarker] = useState<L.Marker | null>(null);
  const [addressSelected, setAddressSelected] = useState(false);
  const [capturingImage, setCapturingImage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tilesLoading, setTilesLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Nominatim geocoding function
  const searchAddress = useCallback(
    async (query: string) => {
      if (!query || query.length < 3) {
        setPredictions([]);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);
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
        setErrorMessage(t('address.errors.network'));
      } finally {
        setIsLoading(false);
      }
    },
    [t]
  );

  // Initialize Leaflet map with satellite tiles
  const initializeMap = useCallback(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const newMap = L.map(mapRef.current, {
      center: [59.334591, 18.06324], // Stockholm default
      zoom: 13,
      zoomControl: true,
      attributionControl: true,
    });

    // Add Esri World Imagery satellite tile layer with caching and progressive loading
    const tileLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles © Esri',
        maxZoom: 20,
        maxNativeZoom: 19, // Reduce tile requests at highest zoom
        crossOrigin: true,
        // Enable tile caching for faster subsequent loads
        keepBuffer: 2,
      }
    );

    tileLayer.addTo(newMap);
    tileLayerRef.current = tileLayer;

    // Monitor tile loading progress
    let tilesLoaded = 0;
    const tilesRequired = 0;

    tileLayer.on('loading', () => {
      setTilesLoading(true);
    });

    tileLayer.on('load', () => {
      tilesLoaded++;
      if (tilesLoaded >= tilesRequired * 0.8) {
        // Consider map "ready" when 80% of tiles are loaded
        setTilesLoading(false);
      }
    });

    // Store in ref for immediate access
    mapInstanceRef.current = newMap;
    setMap(newMap);

    return () => {
      if (newMap) {
        newMap.remove();
      }
    };
  }, []);

  // Initialize map only when address is selected
  useEffect(() => {
    if (addressSelected && mapRef.current && !map) {
      initializeMap();
    }
  }, [addressSelected, mapRef.current]);

  // Trigger image capture when triggerCapture prop changes
  useEffect(() => {
    if (
      triggerCapture &&
      addressSelected &&
      mapInstanceRef.current &&
      !capturingImage &&
      onSatelliteImageConfirm
    ) {
      // Directly invoke capture logic here to avoid circular dependency
      setCapturingImage(true);
      setErrorMessage(null);
      const capture = async () => {
        try {
          if (mapRef.current) {
            const canvas = await html2canvas(mapRef.current, {
              useCORS: true,
              logging: false,
              backgroundColor: null,
            });
            const dataUrl = canvas.toDataURL('image/png');
            onSatelliteImageConfirm(dataUrl);
          }
        } catch (err) {
          console.error('Error capturing map image:', err);
          setErrorMessage(t('address.map.captureError'));
        } finally {
          setCapturingImage(false);
          setTimeout(() => setErrorMessage(null), 3000);
        }
      };
      capture();
    }
  }, [triggerCapture, addressSelected, capturingImage, onSatelliteImageConfirm, t]);

  // Capture map as image
  const captureMapImage = useCallback(async () => {
    if (mapRef.current && onSatelliteImageConfirm) {
      setCapturingImage(true);
      setErrorMessage(null);
      try {
        const canvas = await html2canvas(mapRef.current, {
          useCORS: true,
          logging: false,
          backgroundColor: null,
        });
        const dataUrl = canvas.toDataURL('image/png');
        onSatelliteImageConfirm(dataUrl);
        // Success - error state will show briefly, then clear
      } catch (err) {
        console.error('Error capturing map image:', err);
        setErrorMessage(t('address.map.captureError'));
      } finally {
        setCapturingImage(false);
        // Clear success message after 3 seconds
        setTimeout(() => setErrorMessage(null), 3000);
      }
    }
  }, [onSatelliteImageConfirm, t]);

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
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
    }, 500); // 500ms delay for Nominatim rate limiting

    setIsOpen(true);
  };

  // Handle place selection or Enter key press
  const handlePlaceSelect = useCallback(
    async (prediction?: NominatimResult) => {
      setIsOpen(false);

      // If no prediction provided, use the first prediction if available
      const selectedPrediction = prediction || (predictions.length > 0 ? predictions[0] : null);

      if (!selectedPrediction) return;

      const address = selectedPrediction.display_name;
      onChange(address);
      setAddressSelected(true);

      const lat = parseFloat(selectedPrediction.lat);
      const lon = parseFloat(selectedPrediction.lon);

      // Initialize map if not already done
      if (!mapInstanceRef.current && mapRef.current) {
        try {
          initializeMap();
        } catch (err) {
          setErrorMessage(t('address.errors.mapInit'));
          return;
        }
      }

      // Wait for map to be ready using ref (immediate access)
      const setupMap = () => {
        if (mapInstanceRef.current) {
          try {
            // Start at zoom 18 for faster initial load (progressive loading)
            mapInstanceRef.current.setView([lat, lon], 18);
            setTilesLoading(true);

            // Remove existing marker if any
            if (markerRef.current) {
              mapInstanceRef.current.removeLayer(markerRef.current);
            }

            // Add new marker
            const newMarker = L.marker([lat, lon]).addTo(mapInstanceRef.current);
            markerRef.current = newMarker;
            setMarker(newMarker);

            // After initial tiles load, smoothly zoom to level 20 for detail
            setTimeout(() => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.setView([lat, lon], 20, {
                  animate: true,
                  duration: 1.0,
                  easeLinearity: 0.25,
                });
                // Give zoom animation time to complete before hiding loader
                setTimeout(() => {
                  setTilesLoading(false);
                }, 1500);
              }
            }, 800); // Wait 800ms for initial tiles at zoom 18
          } catch (err) {
            console.error('Error setting up map:', err);
            setErrorMessage(t('address.errors.geocoding'));
            setTilesLoading(false);
          }
        }
      };

      // Try to set up map immediately if it exists
      if (mapInstanceRef.current) {
        setupMap();
      } else {
        // Otherwise wait for it to be initialized
        const checkInterval = setInterval(() => {
          if (mapInstanceRef.current) {
            clearInterval(checkInterval);
            setupMap();
          }
        }, 100);

        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!mapInstanceRef.current) {
            setErrorMessage(t('address.errors.mapInit'));
          }
        }, 5000);
      }

      if (inputRef.current) {
        inputRef.current.focus();
      }
    },
    [predictions, captureMapImage, onChange, initializeMap, t]
  );

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && predictions.length > 0) {
      e.preventDefault();
      handlePlaceSelect();
    }
  };

  // Clear selection
  const handleClear = () => {
    onChange('');
    setPredictions([]);
    setAddressSelected(false);
    if (marker && map) {
      map.removeLayer(marker);
      setMarker(null);
    }
    if (map) {
      map.remove();
      setMap(null);
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Handle click outside
  useEffect(() => {
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

  const hasError = !!(error || errorMessage);
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
          value={value}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder || t('address.placeholder')}
          disabled={disabled}
          required={required}
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
                onClick={() => handlePlaceSelect(prediction)}
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

      {/* Map Preview - Only show after address selection */}
      {addressSelected && (
        <div
          className='mt-3 border border-gray-200 rounded-lg overflow-hidden relative'
          style={{ height: '400px' }}
        >
          {(!map || tilesLoading) && (
            <div className='absolute inset-0 w-full h-full bg-gray-100 flex items-center justify-center z-10'>
              <div className='text-center'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2'></div>
                <p className='text-sm text-gray-600'>
                  {tilesLoading ? t('address.map.loading') : 'Initialiserar...'}
                </p>
              </div>
            </div>
          )}
          <div ref={mapRef} className='w-full h-full' style={{ display: map ? 'block' : 'none' }} />
        </div>
      )}

      {/* Error Message */}
      {(error || errorMessage) && (
        <p className='mt-1 text-sm text-red-600 flex items-center'>
          <span className='mr-1'>⚠</span>
          {error || errorMessage}
        </p>
      )}
    </div>
  );
};

export default AddressWithMapV2;
