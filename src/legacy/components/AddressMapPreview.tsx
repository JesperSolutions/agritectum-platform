/**
 * @legacy
 * @movedFrom src/components/AddressMapPreview.tsx
 * @movedDate 2025-01-11
 * @reason Not currently used in the application
 * @deprecated Do not use in new code. Kept for reference only.
 * 
 * This component was moved to legacy on 2025-01-11 because:
 * - Not currently used anywhere in the codebase
 * - Marked as deprecated in its own code comments
 * - AddressWithMapV2 provides similar functionality with better implementation
 * 
 * Migration: Use AddressWithMapV2 from src/components/AddressWithMapV2.tsx
 * See src/legacy/ARCHIVE_MANIFEST.md for details
 */

import React, { useState, useEffect } from 'react';
import { MapPin, Eye, EyeOff, ExternalLink } from 'lucide-react';

interface AddressMapPreviewProps {
  address: string;
  className?: string;
}

const AddressMapPreview: React.FC<AddressMapPreviewProps> = ({ address, className = '' }) => {
  const [showMap, setShowMap] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Google Maps Static API configuration (DEPRECATED - hardcoded key for legacy component)
  // This component is not currently used in the application
  const API_KEY = 'DEPRECATED-NO-LONGER-USED';
  const MAP_SIZE = '400x300';
  const ZOOM_LEVEL = 18; // High zoom to see building details
  const MAP_TYPE = 'satellite'; // Satellite view for roof inspection

  const generateMapUrl = (address: string): string => {
    const encodedAddress = encodeURIComponent(address);
    return `https://maps.googleapis.com/maps/api/staticmap?center=${encodedAddress}&zoom=${ZOOM_LEVEL}&size=${MAP_SIZE}&maptype=${MAP_TYPE}&markers=color:red%7C${encodedAddress}&key=${API_KEY}`;
  };

  const openInGoogleMaps = () => {
    const encodedAddress = encodeURIComponent(address);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    window.open(googleMapsUrl, '_blank');
  };

  const handleToggleMap = () => {
    if (!showMap) {
      setIsLoading(true);
      setMapError(null);
    }
    setShowMap(!showMap);
  };

  useEffect(() => {
    if (showMap && address) {
      // Test if the map loads successfully
      const img = new Image();
      img.onload = () => {
        setIsLoading(false);
        setMapError(null);
      };
      img.onerror = () => {
        setIsLoading(false);
        setMapError('Kunde inte ladda kartan. Kontrollera adressen.');
      };
      img.src = generateMapUrl(address);
    }
  }, [showMap, address]);

  if (!address || address.trim().length < 5) {
    return null;
  }

  return (
    <div className={`mt-3 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          <span>Satellitvy av fastigheten</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleMap}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
          >
            {showMap ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showMap ? 'Dölj karta' : 'Visa karta'}
          </button>
          {showMap && (
            <button
              type="button"
              onClick={openInGoogleMaps}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Öppna i Google Maps
            </button>
          )}
        </div>
      </div>

      {showMap && (
        <div className="relative">
          {isLoading && (
            <div className="w-full h-[300px] bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Laddar satellitvy...</p>
              </div>
            </div>
          )}
          
          {mapError && (
            <div className="w-full h-[300px] bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-sm text-red-600">{mapError}</p>
              </div>
            </div>
          )}

          {!isLoading && !mapError && (
            <div className="relative">
              <img
                src={generateMapUrl(address)}
                alt={`Satellitvy av ${address}`}
                className="w-full h-[300px] object-cover rounded-lg border border-gray-200 shadow-sm"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setMapError('Kunde inte ladda kartan. Kontrollera adressen.');
                }}
              />
              <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                Zoom: {ZOOM_LEVEL} • Satellitvy
              </div>
            </div>
          )}

          <div className="mt-2 text-xs text-gray-500">
            <p>💡 <strong>Tips:</strong> Satellitvyn hjälper dig att se takets struktur innan besöket. Klicka på "Öppna i Google Maps" för att zooma och utforska mer.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressMapPreview;
