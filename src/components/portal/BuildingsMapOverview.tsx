import React, { useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIntl } from '../../hooks/useIntl';
import { logger } from '../../utils/logger';

interface Building {
  id: string;
  address: string;
  latitude?: number;
  longitude?: number;
  healthGrade?: 'A' | 'B' | 'C' | 'D' | 'F';
  healthScore?: number;
}

interface BuildingsMapOverviewProps {
  buildings: Building[];
  className?: string;
}

const BuildingsMapOverview: React.FC<BuildingsMapOverviewProps> = ({
  buildings,
  className = '',
}) => {
  const { t } = useIntl();
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get grade color for markers
  const getGradeColor = (grade?: string): string => {
    switch (grade) {
      case 'A':
        return '#059669'; // green-600
      case 'B':
        return '#2563eb'; // blue-600
      case 'C':
        return '#d97706'; // amber-600
      case 'D':
        return '#ea580c'; // orange-600
      case 'F':
        return '#dc2626'; // red-600
      default:
        return '#64748b'; // slate-600
    }
  };

  // Create custom marker icon based on grade
  const createMarkerIcon = (building: Building): L.DivIcon => {
    const color = getGradeColor(building.healthGrade);
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: 32px;
          height: 32px;
          background-color: ${color};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="
            transform: rotate(45deg);
            color: white;
            font-weight: bold;
            font-size: 14px;
          ">${building.healthGrade || '?'}</span>
        </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  };

  // Only re-initialize map if the number of buildings with valid coordinates changes
  // This prevents unnecessary re-initialization when non-location properties change
  useEffect(() => {
    // Filter buildings with valid coordinates
    const buildingsWithCoords = buildings.filter(
      b => b.latitude && b.longitude && !isNaN(b.latitude) && !isNaN(b.longitude)
    );

    if (!mapRef.current) {
      setIsLoading(false);
      return;
    }

    // If map is already initialized and building count hasn't changed, skip re-init
    if (mapInstanceRef.current && buildingsWithCoords.length > 0) {
      // Just update markers if needed, don't reinitialize
      logger.debug('[BuildingsMapOverview] Map already initialized, skipping reinit');
      setIsLoading(false);
      return;
    }

    if (buildingsWithCoords.length === 0) {
      setIsLoading(false);
      return;
    }

    // Delay initialization to ensure DOM and Leaflet CSS are fully loaded
    const initTimer = setTimeout(() => {
      if (!mapRef.current || mapInstanceRef.current) {
        // Either container is gone or map was initialized elsewhere
        setIsLoading(false);
        return;
      }

      const width = mapRef.current.offsetWidth;
      const height = mapRef.current.offsetHeight;

      if (width === 0 || height === 0) {
        // Retry once if container has no size
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
        return;
      }

      try {
        // Calculate center point
        const avgLat =
          buildingsWithCoords.reduce((sum, b) => sum + (b.latitude || 0), 0) /
          buildingsWithCoords.length;
        const avgLon =
          buildingsWithCoords.reduce((sum, b) => sum + (b.longitude || 0), 0) /
          buildingsWithCoords.length;

        // Initialize map with explicit container element
        const map = L.map(mapRef.current, {
          center: [avgLat, avgLon],
          zoom: 12,
          minZoom: 8,
          maxZoom: 18,
          zoomControl: true,
          scrollWheelZoom: true,
        });

        // Add tile layer (OpenStreetMap)
        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        });
        tileLayer.addTo(map);

        // Add markers for each building
        const markers: L.Marker[] = [];
        buildingsWithCoords.forEach(building => {
          if (!building.latitude || !building.longitude) return;

          const icon = createMarkerIcon(building);
          const marker = L.marker([building.latitude, building.longitude], { icon }).addTo(map);

          // Create popup content
          const popupContent = `
            <div style="padding: 8px; min-width: 200px; cursor: pointer;" class="building-popup" data-building-id="${building.id}">
              <div style="margin-bottom: 8px;">
                <span style="
                  display: inline-block;
                  background-color: ${getGradeColor(building.healthGrade)};
                  color: white;
                  font-weight: bold;
                  padding: 4px 8px;
                  border-radius: 4px;
                  font-size: 12px;
                  margin-right: 8px;
                ">${building.healthGrade || '?'}</span>
                <span style="font-size: 12px; color: #666;">Score: ${building.healthScore || 0}</span>
              </div>
              <strong style="display: block; margin-bottom: 4px; font-size: 14px;">${building.address}</strong>
              <div style="margin-top: 8px; text-align: center;">
                <span style="
                  display: inline-block;
                  padding: 4px 12px;
                  background-color: #475569;
                  color: white;
                  border-radius: 4px;
                  font-size: 12px;
                  cursor: pointer;
                ">${t('dashboard.viewDetails') || 'View Details'} →</span>
              </div>
            </div>
          `;

          marker.bindPopup(popupContent);

          // Handle popup click to navigate
          marker.on('popupopen', () => {
            setTimeout(() => {
              const popup = document.querySelector(`[data-building-id="${building.id}"]`);
              if (popup) {
                popup.addEventListener('click', () => {
                  navigate(`/portal/buildings/${building.id}`);
                });
              }
            }, 100);
          });

          markers.push(marker);
        });

        markersRef.current = markers;

        // Fit bounds to show all markers
        if (buildingsWithCoords.length > 1) {
          const bounds = L.latLngBounds(buildingsWithCoords.map(b => [b.latitude!, b.longitude!]));
          map.fitBounds(bounds, { padding: [50, 50] });
        } else {
          // Single marker - just show it
          map.setView([buildingsWithCoords[0].latitude!, buildingsWithCoords[0].longitude!], 12);
        }

        mapInstanceRef.current = map;
        setIsLoading(false);

        // Invalidate size to ensure proper rendering
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, 100);
      } catch (err) {
        logger.error('Error initializing buildings map:', err);
        setIsLoading(false);
      }
    }, 250);

    // Cleanup function - properly destroy map and markers
    return () => {
      clearTimeout(initTimer);
      
      // Clear all markers
      markersRef.current.forEach(marker => {
        try {
          marker.remove();
        } catch (e) {
          logger.warn('Error removing marker:', e);
        }
      });
      markersRef.current = [];
      
      // Properly destroy Leaflet map instance
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        } catch (e) {
          logger.warn('Error removing map:', e);
        }
      }
    };
  }, [buildings.length]); // Only depend on count, not array reference

  // Filter buildings with valid coordinates for display
  const buildingsWithCoords = buildings.filter(
    b => b.latitude && b.longitude && !isNaN(b.latitude) && !isNaN(b.longitude)
  );

  if (buildingsWithCoords.length === 0) {
    return (
      <div
        className={`bg-slate-50 rounded-lg border border-slate-200 p-8 flex flex-col items-center justify-center ${className}`}
        style={{ minHeight: '300px' }}
      >
        <MapPin className='w-12 h-12 text-slate-400 mb-4' />
        <p className='text-slate-600 text-center'>
          {t('dashboard.map.noLocations') || 'No building locations available'}
        </p>
        <p className='text-sm text-slate-500 mt-2 text-center'>
          {t('dashboard.map.addLocations') ||
            'Add addresses to your buildings to see them on the map'}
        </p>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${className}`} style={{ overflow: 'visible' }}>
      {isLoading && (
        <div className='absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded-lg'>
          <Loader2 className='w-8 h-8 text-slate-400 animate-spin' />
        </div>
      )}
      <div
        ref={mapRef}
        className='w-full rounded-lg border border-slate-200 overflow-hidden'
        style={{ 
          minHeight: '400px', 
          height: '400px',
          width: '100%',
          display: 'block',
          position: 'relative',
          // Allow parent container to handle drag events when being reordered in customizer
          touchAction: 'none'
        }}
      />
      <div className='mt-2 flex items-center text-sm text-slate-600'>
        <MapPin className='w-4 h-4' />
        <span className='ml-2'>
          {buildingsWithCoords.length} {t('dashboard.map.buildingsShown') || 'buildings shown'}
        </span>
      </div>
    </div>
  );
};

export default BuildingsMapOverview;
