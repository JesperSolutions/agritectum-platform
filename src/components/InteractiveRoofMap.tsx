import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, Loader2 } from 'lucide-react';
import { useIntl } from '../hooks/useIntl';
import { useToast } from '../contexts/ToastContext';
import { logger } from '../utils/logger';
import { MapMarker } from '../types';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface InteractiveRoofMapProps {
  lat: number;
  lon: number;
  onImageCapture: (imageUrl: string) => void;
  onCancel?: () => void;
  availableIssues?: Array<{ id: string; title: string }>;
  existingMarkers?: MapMarker[]; // Load existing markers
  onMarkersChange?: (markers: MapMarker[]) => void; // Callback when markers change
}

const InteractiveRoofMap: React.FC<InteractiveRoofMapProps> = ({
  lat,
  lon,
  onImageCapture,
  onCancel,
  availableIssues = [],
  existingMarkers = [],
  onMarkersChange,
}) => {
  const { t } = useIntl();
  const { showError } = useToast();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const availableIssuesRef = useRef(availableIssues);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [tilesLoading, setTilesLoading] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [markers, setMarkers] = useState<MapMarker[]>(existingMarkers);
  const tilesInitialLoadRef = useRef(false);

  // Sync markers when existingMarkers changes and round coordinates
  useEffect(() => {
    const roundedMarkers = existingMarkers.map(marker => ({
      ...marker,
      lat: Math.round(marker.lat * 100) / 100,
      lon: Math.round(marker.lon * 100) / 100,
    }));
    setMarkers(roundedMarkers);
  }, [existingMarkers]);

  // Keep availableIssues ref up to date
  useEffect(() => {
    availableIssuesRef.current = availableIssues;
  }, [availableIssues]);

  useEffect(() => {
    // Initialize map
    const initMap = () => {
      if (!mapRef.current) return;

      try {
        // Add custom CSS for high z-index popups
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

        // Initialize map with zoom constraints to prevent breaking
        const map = L.map(mapRef.current, {
          center: [lat, lon],
          zoom: 18,
          minZoom: 13, // Prevent zooming out too far
          maxZoom: 20, // Prevent zooming in beyond tile resolution
          zoomControl: true,
          attributionControl: true,
        });

        // Add satellite tile layer with PERFORMANCE OPTIMIZATIONS
        const tileLayer = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          {
            attribution: '© Esri',
            maxZoom: 20,
            // PERFORMANCE OPTIMIZATIONS
            keepBuffer: 4, // Keep extra tiles cached
            updateWhenIdle: true, // Avoid redraws while panning
            crossOrigin: true,
          }
        ).addTo(map);

        tileLayerRef.current = tileLayer;
        mapInstanceRef.current = map;

        // Track tile loading
        let loadingCount = 0;
        const checkReady = () => {
          loadingCount++;
          setTilesLoading(prev => prev + 1);
        };
        const checkLoaded = () => {
          loadingCount--;
          setTilesLoading(prev => Math.max(0, prev - 1));

          // Consider map ready when all tiles are loaded
          if (loadingCount === 0 && !tilesInitialLoadRef.current) {
            tilesInitialLoadRef.current = true;
            setIsReady(true);
            setIsMapReady(true);
          }
        };

        tileLayer.on('tileloadstart', checkReady);
        tileLayer.on('tileload', checkLoaded);
        tileLayer.on('tileerror', checkLoaded);

        // Smoothly zoom to detail level (within bounds)
        setTimeout(() => {
          if (mapInstanceRef.current) {
            // Zoom to max detail level (already constrained by minZoom: 13, maxZoom: 20)
            mapInstanceRef.current.setView([lat, lon], 20, {
              animate: true,
              duration: 1.5,
            });
          }
        }, 800);

        // Enforce zoom bounds on zoom change
        map.on('zoomend', () => {
          const currentZoom = map.getZoom();
          if (currentZoom < 13) {
            map.setZoom(13, { animate: true });
          } else if (currentZoom > 20) {
            map.setZoom(20, { animate: true });
          }
        });

        // Load existing markers
        const addMarkerToMap = (markerData: MapMarker, isExisting = false) => {
          // Round coordinates to 2 decimal places
          const roundedLat = Math.round(markerData.lat * 100) / 100;
          const roundedLon = Math.round(markerData.lon * 100) / 100;

          const customIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="background-color: ${markerData.issueId ? '#10b981' : '#ef4444'}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });

          const marker = L.marker([roundedLat, roundedLon], {
            icon: customIcon,
            draggable: true,
          }).addTo(map);

          // Add click handler to rebuild popup with latest issues
          marker.on('click', () => {
            // Rebuild popup content with latest issues
            const issueOptions = availableIssuesRef.current
              .map(
                issue =>
                  `<option value="${issue.id}" ${issue.id === markerData.issueId ? 'selected' : ''}>${issue.title || 'Issue #' + issue.id}</option>`
              )
              .join('');

            const popupContent = `
              <div style="text-align: center; min-width: 200px;">
                <p style="margin: 0 0 8px 0; font-weight: bold;">Link to Issue</p>
                <select id="issue-select-${markerData.id}" style="width: 100%; padding: 4px; margin-bottom: 8px;">
                  <option value="">-- Select Issue --</option>
                  ${issueOptions}
                </select>
                <div style="display: flex; gap: 4px;">
                  <button id="save-marker-${markerData.id}" style="flex: 1; padding: 4px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Save
                  </button>
                  <button id="remove-marker-${markerData.id}" style="flex: 1; padding: 4px; background: red; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Remove
                  </button>
                </div>
              </div>
            `;

            const popup = L.popup({
              maxWidth: 250,
            }).setContent(popupContent);

            marker.unbindPopup().bindPopup(popup).openPopup();

            // Handle popup button clicks
            setTimeout(() => {
              const select = document.getElementById(`issue-select-${markerData.id}`);
              const saveBtn = document.getElementById(`save-marker-${markerData.id}`);
              const removeBtn = document.getElementById(`remove-marker-${markerData.id}`);

              const saveHandler = () => {
                const issueId = (select as HTMLSelectElement)?.value;
                if (issueId) {
                  markerData.issueId = issueId;
                  const updatedMarkers = markers.map(m =>
                    m.id === markerData.id ? { ...m, issueId } : m
                  );
                  setMarkers(updatedMarkers);
                  onMarkersChange?.(updatedMarkers);
                  // Update marker color
                  const linkedIcon = L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="background-color: #10b981; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10],
                  });
                  marker.setIcon(linkedIcon);
                  marker.closePopup();
                }
                saveBtn?.removeEventListener('click', saveHandler);
                removeBtn?.removeEventListener('click', removeHandler);
              };

              const removeHandler = () => {
                map.removeLayer(marker);
                const updatedMarkers = markers.filter(m => m.id !== markerData.id);
                setMarkers(updatedMarkers);
                onMarkersChange?.(updatedMarkers);
                const index = markersRef.current.indexOf(marker);
                if (index > -1) {
                  markersRef.current.splice(index, 1);
                }
                saveBtn?.removeEventListener('click', saveHandler);
                removeBtn?.removeEventListener('click', removeHandler);
              };

              saveBtn?.addEventListener('click', saveHandler);
              removeBtn?.addEventListener('click', removeHandler);
            }, 100);
          });

          // Handle drag
          marker.on('dragend', () => {
            const position = marker.getLatLng();
            // Round coordinates to 2 decimal places
            const roundedLat = Math.round(position.lat * 100) / 100;
            const roundedLon = Math.round(position.lng * 100) / 100;
            const updatedMarkers = markers.map(m =>
              m.id === markerData.id ? { ...m, lat: roundedLat, lon: roundedLon } : m
            );
            setMarkers(updatedMarkers);
            onMarkersChange?.(updatedMarkers);
          });

          markersRef.current.push(marker);
        };

        // Load existing markers
        existingMarkers.forEach(markerData => {
          addMarkerToMap(markerData);
        });

        // Add click handler to place markers
        map.on('click', (e: any) => {
          const { lat: clickedLat, lng: clickedLon } = e.latlng;

          // Round coordinates to 2 decimal places
          const roundedLat = Math.round(clickedLat * 100) / 100;
          const roundedLon = Math.round(clickedLon * 100) / 100;

          // Generate marker ID first
          const markerId = `marker_${Date.now()}`;
          const markerData: MapMarker = {
            id: markerId,
            lat: roundedLat,
            lon: roundedLon,
            severity: 'medium', // Default severity
          };

          // Create a custom marker with a different color
          const customIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="background-color: red; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });

          const marker = L.marker([roundedLat, roundedLon], {
            icon: customIcon,
            draggable: true,
          }).addTo(map);

          // Build popup with issue linking (use ref to get latest issues)
          const issueOptions = availableIssuesRef.current
            .map(
              issue => `<option value="${issue.id}">${issue.title || 'Issue #' + issue.id}</option>`
            )
            .join('');

          const popupContent = `
            <div style="text-align: center; min-width: 200px;">
              <p style="margin: 0 0 8px 0; font-weight: bold;">Link to Issue</p>
              <select id="issue-select-${markerId}" style="width: 100%; padding: 4px; margin-bottom: 8px;">
                <option value="">-- Select Issue --</option>
                ${issueOptions}
              </select>
              <div style="display: flex; gap: 4px;">
                <button id="save-marker-${markerId}" style="flex: 1; padding: 4px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer;">
                  Save
                </button>
                <button id="remove-marker-${markerId}" style="flex: 1; padding: 4px; background: red; color: white; border: none; border-radius: 4px; cursor: pointer;">
                  Remove
                </button>
              </div>
            </div>
          `;

          const popup = L.popup({
            maxWidth: 250,
          }).setContent(popupContent);

          marker.bindPopup(popup).openPopup();

          markersRef.current.push(marker);
          const newMarkers = [...markers, markerData];
          setMarkers(newMarkers);
          onMarkersChange?.(newMarkers);

          // Handle popup button clicks (delegated)
          setTimeout(() => {
            const popupContent = marker.getPopup()?.getContent();
            const popupElement =
              typeof popupContent === 'string' ? null : (popupContent as HTMLElement);

            const select = document.getElementById(`issue-select-${markerId}`);
            const saveBtn = popupElement?.querySelector(`#save-marker-${markerId}`);
            const removeBtn = popupElement?.querySelector(`#remove-marker-${markerId}`);

            saveBtn?.addEventListener('click', () => {
              const issueId = (select as HTMLSelectElement)?.value;
              if (issueId) {
                markerData.issueId = issueId;
                const updatedMarkers = markers.map(m =>
                  m.id === markerId ? { ...m, issueId } : m
                );
                setMarkers(updatedMarkers);
                onMarkersChange?.(updatedMarkers);
                // Change marker color to green to indicate it's linked
                const linkedIcon = L.divIcon({
                  className: 'custom-marker',
                  html: `<div style="background-color: #10b981; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                  iconSize: [20, 20],
                  iconAnchor: [10, 10],
                });
                marker.setIcon(linkedIcon);
                marker.closePopup();
              }
            });

            removeBtn?.addEventListener('click', () => {
              map.removeLayer(marker);
              const updatedMarkers = markers.filter(m => m.id !== markerId);
              setMarkers(updatedMarkers);
              onMarkersChange?.(updatedMarkers);
              const index = markersRef.current.indexOf(marker);
              if (index > -1) {
                markersRef.current.splice(index, 1);
              }
            });
          }, 100);

          // Handle marker drag
          marker.on('dragend', () => {
            const position = marker.getLatLng();
            const updatedMarkers = markers.map(m =>
              m.id === markerId ? { ...m, lat: position.lat, lon: position.lng } : m
            );
            setMarkers(updatedMarkers);
            onMarkersChange?.(updatedMarkers);
          });
        });

        // Mark map as initialized
        setTilesLoading(0);
        setIsMapReady(true);
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initMap();

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, [lat, lon]);

  const handleCapture = async () => {
    if (!mapRef.current || !mapInstanceRef.current) return;

    setIsCapturing(true);

    try {
      // Import html2canvas
      const html2canvas = await import('html2canvas');
      await import('html2canvas');

      // Capture the map
      const canvas = await html2canvas.default(mapRef.current, {
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: mapRef.current.offsetWidth,
        height: mapRef.current.offsetHeight,
      });

      const dataUrl = canvas.toDataURL('image/png');
      onImageCapture(dataUrl);
    } catch (error) {
      logger.error('Error capturing map:', error);
      showError('Failed to capture map image');
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div
      className='relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden border-2 border-blue-200'
      style={{ zIndex: 0 }}
    >
      {/* Map Container */}
      <div ref={mapRef} className='w-full h-full' style={{ zIndex: 0 }} />

      {/* Loading Overlay */}
      {(!isMapReady || tilesLoading > 0) && (
        <div className='absolute inset-0 bg-gray-200 bg-opacity-75 flex items-center justify-center z-10'>
          <div className='text-center'>
            <Loader2 className='animate-spin h-8 w-8 text-blue-600 mx-auto mb-2' />
            <p className='text-sm text-gray-700'>{t('address.map.loading')}</p>
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div className='absolute top-4 right-4 flex flex-col gap-2 z-[1000]'>
        {onCancel && (
          <button
            type='button'
            onClick={onCancel}
            className='bg-white hover:bg-gray-50 p-2 rounded-md shadow-md transition-colors'
            title='Close map'
          >
            <X className='w-5 h-5 text-gray-600' />
          </button>
        )}
      </div>

      {/* Capture Button - Primary Action */}
      <div className='absolute bottom-4 left-0 right-0 flex justify-center z-[1000] px-4'>
        <button
          type='button'
          onClick={handleCapture}
          disabled={isCapturing || !isReady}
          className='inline-flex items-center px-6 py-3 border border-transparent text-base font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-xl transition-all transform hover:scale-105'
        >
          {isCapturing ? (
            <>
              <Loader2 className='w-5 h-5 mr-2 animate-spin' />
              {t('address.map.capturing')}
            </>
          ) : (
            <>
              <Camera className='w-5 h-5 mr-2' />
              {t('address.map.captureButton') || 'Ta satellitvy'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default InteractiveRoofMap;
