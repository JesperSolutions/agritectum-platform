import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
// Import markercluster - it extends L namespace
import 'leaflet.markercluster';
import { ServiceAgreement } from '../../types';
import { useIntl } from '../../hooks/useIntl';
import LoadingSpinner from '../common/LoadingSpinner';

interface ServiceAgreementMapProps {
  agreements: ServiceAgreement[];
  onAgreementClick: (agreement: ServiceAgreement) => void;
}

const ServiceAgreementMap: React.FC<ServiceAgreementMapProps> = ({
  agreements,
  onAgreementClick,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const { t } = useIntl();
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

  // Get marker color based on urgency (using brand colors)
  const getMarkerColor = (daysUntilDue: number): { bg: string; border: string } => {
    if (daysUntilDue < 0) {
      // Overdue - Red
      return { bg: '#ef4444', border: '#dc2626' };
    } else if (daysUntilDue === 0 || daysUntilDue === 1) {
      // Due today/tomorrow - Brand Orange
      return { bg: '#f97316', border: '#ea580c' };
    } else if (daysUntilDue <= 3) {
      // Due in 3 days - Warm Yellow
      return { bg: '#fbbf24', border: '#f59e0b' };
    } else if (daysUntilDue <= 7) {
      // Due in a week - Brand Blue
      return { bg: '#3b82f6', border: '#2563eb' };
    } else {
      // Due later - Lighter Blue
      return { bg: '#60a5fa', border: '#3b82f6' };
    }
  };

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Wait for container to be visible
    const checkAndInit = () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      // Check if container has dimensions
      if (mapRef.current.offsetWidth === 0 || mapRef.current.offsetHeight === 0) {
        // Try again after a short delay
        setTimeout(checkAndInit, 100);
        return;
      }

      try {
        // Initialize map
        const map = L.map(mapRef.current, {
          center: [59.334591, 18.06324], // Stockholm default
          zoom: 10,
          zoomControl: true,
          attributionControl: true,
        });

        // Add satellite tile layer
        const tileLayer = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          {
            attribution: 'Tiles © Esri',
            maxZoom: 20,
            crossOrigin: true,
            keepBuffer: 2,
            updateWhenIdle: true,
          }
        );

        tileLayer.addTo(map);
        tileLayerRef.current = tileLayer;
        mapInstanceRef.current = map;

        // Hide loading - map is initialized
        setIsLoading(false);

        // Invalidate size to ensure proper rendering
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
              console.error('Error removing map:', e);
            }
          }
        };
      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('Failed to initialize map. Please try refreshing the page.');
        setIsLoading(false);
      }
    };

    // Start initialization check
    const timer = setTimeout(checkAndInit, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Clear existing markers and cluster group
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current = null;
    }
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Create cluster group
    // MarkerClusterGroup is added to L namespace by the import
    clusterGroupRef.current = new (L as any).MarkerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: cluster => {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<div style="
            width: 40px;
            height: 40px;
            background-color: #3b82f6;
            border: 3px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">${count}</div>`,
          className: 'marker-cluster',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });
      },
    });
    const markerGroup = clusterGroupRef.current;
    markerGroup.addTo(map);

    // Add markers for agreements with coordinates
    agreements.forEach(agreement => {
      if (agreement.latitude && agreement.longitude) {
        // Determine marker color based on due date
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const nextServiceDate = new Date(agreement.nextServiceDate);
        nextServiceDate.setHours(0, 0, 0, 0);
        const daysUntilDue = Math.ceil(
          (nextServiceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        const colors = getMarkerColor(daysUntilDue);

        const icon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="
            width: 24px;
            height: 24px;
            background-color: ${colors.bg};
            border: 3px solid ${colors.border};
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            cursor: pointer;
            transition: transform 0.2s;
          "></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([agreement.latitude, agreement.longitude], {
          icon,
          riseOnHover: true,
        });

        // Create popup content
        const popupContent = `
          <div style="min-width: 220px; font-family: Inter, sans-serif;">
            <h3 style="font-weight: 600; margin-bottom: 8px; color: #1f2937; font-size: 16px;">${agreement.title}</h3>
            <p style="margin: 4px 0; color: #6b7280; font-size: 14px;"><strong>${t('serviceAgreement.table.customer')}:</strong> ${agreement.customerName}</p>
            <p style="margin: 4px 0; color: #6b7280; font-size: 14px;"><strong>${t('serviceAgreement.table.nextService')}:</strong> ${new Date(agreement.nextServiceDate).toLocaleDateString()}</p>
            <p style="margin: 4px 0; color: #6b7280; font-size: 14px;"><strong>${t('serviceAgreement.table.status')}:</strong> ${t(`serviceAgreement.status.${agreement.status}`)}</p>
            <button 
              onclick="window.dispatchEvent(new CustomEvent('agreement-click', { detail: '${agreement.id}' }))"
              style="margin-top: 12px; padding: 6px 12px; background: #f97316; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 14px; transition: background 0.2s;"
              onmouseover="this.style.background='#ea580c'"
              onmouseout="this.style.background='#f97316'"
            >
              ${t('serviceAgreement.viewAgreement') || 'View Details'}
            </button>
          </div>
        `;

        marker.bindPopup(popupContent, {
          maxWidth: 250,
          className: 'custom-popup',
        });

        marker.on('click', () => {
          onAgreementClick(agreement);
        });

        marker.addTo(markerGroup);
        markersRef.current.push(marker);
      }
    });

    // Fit map to show all markers
    if (markersRef.current.length > 0) {
      map.fitBounds(markerGroup.getBounds().pad(0.1));
    }
  }, [agreements, onAgreementClick, t]);

  // Handle popup button clicks
  useEffect(() => {
    const handleAgreementClick = (event: CustomEvent) => {
      const agreement = agreements.find(a => a.id === event.detail);
      if (agreement) {
        onAgreementClick(agreement);
      }
    };

    window.addEventListener('agreement-click' as any, handleAgreementClick as EventListener);
    return () => {
      window.removeEventListener('agreement-click' as any, handleAgreementClick as EventListener);
    };
  }, [agreements, onAgreementClick]);

  const agreementsWithLocation = agreements.filter(a => a.latitude && a.longitude);

  if (agreementsWithLocation.length === 0) {
    return (
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'>
        <div className='flex items-center justify-center h-96 bg-gray-50'>
          <div className='text-center'>
            <p className='text-gray-500 text-lg mb-2'>
              {t('serviceAgreement.map.noLocation') || 'No agreements with location data'}
            </p>
            <p className='text-sm text-gray-400'>Agreements need addresses to appear on the map</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative'>
      {mapError && (
        <div className='absolute top-2 left-2 right-2 z-[1000] bg-yellow-50 border border-yellow-200 rounded p-2 text-sm text-yellow-800'>
          {mapError}
        </div>
      )}
      {/* Always render map container so ref is available */}
      <div ref={mapRef} className='w-full h-96' style={{ minHeight: '384px' }} />
      {/* Loading overlay */}
      {isLoading && (
        <div className='absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50'>
          <div className='text-center'>
            <LoadingSpinner
              size='lg'
              text={t('serviceAgreement.map.loading') || 'Loading map...'}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceAgreementMap;
