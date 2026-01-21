import React, { useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIntl } from '../../hooks/useIntl';

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

  useEffect(() => {
    console.log('[BuildingsMapOverview] useEffect triggered', {
      mapRef: !!mapRef.current,
      mapInstanceRef: !!mapInstanceRef.current,
      buildingsCount: buildings.length,
    });

    if (!mapRef.current) {
      console.log('[BuildingsMapOverview] No mapRef, returning');
      return;
    }
    if (mapInstanceRef.current) {
      console.log('[BuildingsMapOverview] Map already initialized');
      return; // Already initialized
    }

    // Filter buildings with valid coordinates
    const buildingsWithCoords = buildings.filter(
      b => b.latitude && b.longitude && !isNaN(b.latitude) && !isNaN(b.longitude)
    );
    console.log(
      '[BuildingsMapOverview] Buildings with coords:',
      buildingsWithCoords.length,
      buildingsWithCoords
    );

    if (buildingsWithCoords.length === 0) {
      console.log('[BuildingsMapOverview] No buildings with coordinates');
      setIsLoading(false);
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

      console.log('[BuildingsMapOverview] Initializing map at center:', { avgLat, avgLon });

      // Initialize map
      const map = L.map(mapRef.current, {
        center: [avgLat, avgLon],
        zoom: 12,
        minZoom: 8,
        maxZoom: 18,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      // Add tile layer (OpenStreetMap)
      console.log('[BuildingsMapOverview] Adding tile layer');
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Add markers for each building
      console.log(
        '[BuildingsMapOverview] Adding markers for',
        buildingsWithCoords.length,
        'buildings'
      );
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
      }

      mapInstanceRef.current = map;
      console.log(
        '[BuildingsMapOverview] Map initialization complete, added',
        markers.length,
        'markers'
      );
      setIsLoading(false);

      // Invalidate size after a short delay
      setTimeout(() => {
        console.log('[BuildingsMapOverview] Invalidating map size');
        map.invalidateSize();
      }, 200);

      // Cleanup
      return () => {
        markersRef.current.forEach(marker => marker.remove());
        if (map) {
          try {
            map.remove();
          } catch (e) {
            console.error('Error removing map:', e);
          }
        }
      };
    } catch (err) {
      console.error('Error initializing buildings map:', err);
      setIsLoading(false);
    }
  }, [buildings, navigate, t]);

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
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className='absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded-lg'>
          <Loader2 className='w-8 h-8 text-slate-400 animate-spin' />
        </div>
      )}
      <div
        ref={mapRef}
        className='w-full rounded-lg border border-slate-200 overflow-hidden'
        style={{ minHeight: '300px', height: '300px' }}
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
