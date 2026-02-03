import React, { useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import { useIntl } from '../../hooks/useIntl';
import { logger } from '../../utils/logger';

interface BuildingMapProps {
  latitude?: number;
  longitude?: number;
  address: string;
  buildingId?: string;
  className?: string;
}

const BuildingMap: React.FC<BuildingMapProps> = ({
  latitude,
  longitude,
  address,
  buildingId,
  className = '',
}) => {
  const { t } = useIntl();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    latitude && longitude ? { lat: latitude, lon: longitude } : null
  );

  // Geocode address if coordinates are missing
  useEffect(() => {
    const geocodeAddress = async () => {
      if (coords || !address || address.trim().length < 5) {
        return;
      }

      try {
        const encodedAddress = encodeURIComponent(address);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
          {
            headers: {
              'User-Agent': 'Agritectum Platform',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Geocoding request failed');
        }

        const data = await response.json();
        if (data && data.length > 0) {
          setCoords({
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon),
          });
        } else {
          setError(t('buildings.map.geocodeFailed') || 'Could not find location');
          setIsLoading(false);
        }
      } catch (err) {
        logger.error('Error geocoding address:', err);
        setError(t('buildings.map.geocodeError') || 'Failed to load map location');
        setIsLoading(false);
      }
    };

    geocodeAddress();
  }, [address, coords, t]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !coords) return;
    if (mapInstanceRef.current) return; // Already initialized

    try {
      // Add custom CSS for popup z-index
      if (!document.getElementById('leaflet-popup-override-style')) {
        const style = document.createElement('style');
        style.id = 'leaflet-popup-override-style';
        style.textContent = `
          .leaflet-popup {
            z-index: 10000 !important;
          }
          .leaflet-popup-content-wrapper {
            z-index: 10000 !important;
          }
        `;
        document.head.appendChild(style);
      }

      // Initialize map
      const map = L.map(mapRef.current, {
        center: [coords.lat, coords.lon],
        zoom: 16,
        minZoom: 10,
        maxZoom: 20,
        zoomControl: true,
        attributionControl: true,
      });

      // Add satellite tile layer
      const tileLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '© Esri',
          maxZoom: 20,
          keepBuffer: 2,
          updateWhenIdle: true,
          crossOrigin: true,
        }
      );

      tileLayer.addTo(map);
      tileLayerRef.current = tileLayer;
      mapInstanceRef.current = map;

      // Track tile loading
      let tilesLoading = 0;
      const checkReady = () => {
        tilesLoading++;
      };
      const checkLoaded = () => {
        tilesLoading--;
        if (tilesLoading === 0) {
          setIsLoading(false);
        }
      };

      tileLayer.on('tileloadstart', checkReady);
      tileLayer.on('tileload', checkLoaded);
      tileLayer.on('tileerror', checkLoaded);

      // Add marker for building location
      const markerIcon = L.divIcon({
        className: 'custom-building-marker',
        html: `<div style="
          width: 32px;
          height: 32px;
          background-color: #ef4444;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([coords.lat, coords.lon], { icon: markerIcon }).addTo(map);

      // Create popup with address and coordinates
      const popupContent = `
        <div style="padding: 8px; min-width: 200px;">
          <strong style="display: block; margin-bottom: 4px; font-size: 14px;">${address}</strong>
          <div style="font-size: 12px; color: #666;">
            ${coords.lat.toFixed(6)}, ${coords.lon.toFixed(6)}
          </div>
        </div>
      `;
      marker.bindPopup(popupContent);
      markerRef.current = marker;

      // Invalidate size after a short delay to ensure proper rendering
      setTimeout(() => {
        if (map && map.invalidateSize) {
          map.invalidateSize();
        }
      }, 200);

      // Cleanup function
      return () => {
        if (map) {
          try {
            map.remove();
          } catch (e) {
            logger.warn('Error removing map:', e);
          }
        }
      };
    } catch (err) {
      logger.error('Error initializing map:', err);
      setError(t('buildings.map.initError') || 'Failed to initialize map');
      setIsLoading(false);
    }
  }, [coords, address, t]);

  if (error && !coords) {
    return (
      <div
        className={`bg-slate-50 rounded-lg border border-slate-200 p-8 flex flex-col items-center justify-center ${className}`}
        style={{ minHeight: '400px' }}
      >
        <AlertCircle className='w-12 h-12 text-slate-400 mb-4' />
        <p className='text-slate-600 text-center'>{error}</p>
        <p className='text-sm text-slate-500 mt-2 text-center'>{address}</p>
      </div>
    );
  }

  if (!coords) {
    return (
      <div
        className={`bg-slate-50 rounded-lg border border-slate-200 p-8 flex items-center justify-center ${className}`}
        style={{ minHeight: '400px' }}
      >
        <Loader2 className='w-8 h-8 text-slate-400 animate-spin' />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className='absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded-lg'>
          <Loader2 className='w-8 h-8 text-slate-400 animate-spin' />
        </div>
      )}
      <div
        ref={mapRef}
        className='w-full rounded-lg border border-slate-200 overflow-hidden'
        style={{ minHeight: '400px', height: '400px' }}
      />
      <div className='mt-2 flex items-center justify-between text-sm text-slate-600'>
        <div className='flex items-center gap-2'>
          <MapPin className='w-4 h-4' />
          <span>{address}</span>
        </div>
        <a
          href={`https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lon}&zoom=16`}
          target='_blank'
          rel='noopener noreferrer'
          className='text-blue-600 hover:text-blue-700 hover:underline'
        >
          {t('buildings.map.viewOnMap') || 'View on OpenStreetMap'}
        </a>
      </div>
    </div>
  );
};

export default BuildingMap;
