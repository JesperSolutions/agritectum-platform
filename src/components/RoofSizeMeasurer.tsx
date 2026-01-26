import React, { useEffect, useRef, useState } from 'react';
import { useIntl } from '../hooks/useIntl';
import { X, Ruler, Trash2 } from 'lucide-react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface RoofSizeMeasurerProps {
  lat: number;
  lon: number;
  onAreaCalculated: (
    areaInSquareMeters: number,
    snapshotDataUrl?: string,
    polygonPoints?: L.LatLng[]
  ) => void;
  onClose: () => void;
  initialArea?: number; // Optional initial area value
  initialSnapshot?: string; // Optional initial snapshot data URL
  initialPolygonPoints?: L.LatLng[]; // Optional initial polygon points for redrawing
  address?: string; // Optional address to display in header
}

// Helper function to calculate area of a polygon in square meters
// Uses planar geometry (Shoelace formula) with lat/lng to meter conversion
// This is accurate for small areas like roofs where Earth's curvature is negligible
const calculatePolygonArea = (latlngs: L.LatLng[]): number => {
  if (latlngs.length < 3) return 0;

  // Convert lat/lng to meters using local projection
  // 1 degree latitude ≈ 111,320 meters (constant)
  // 1 degree longitude ≈ 111,320 * cos(latitude) meters (varies by latitude)
  const metersPerDegreeLat = 111320;

  // Use the average latitude for longitude conversion
  const avgLat = latlngs.reduce((sum, p) => sum + p.lat, 0) / latlngs.length;
  const metersPerDegreeLon = 111320 * Math.cos((avgLat * Math.PI) / 180);

  // Convert all points to meters (using first point as origin to minimize rounding errors)
  const originLat = latlngs[0].lat;
  const originLon = latlngs[0].lng;

  const pointsInMeters = latlngs.map(p => ({
    x: (p.lng - originLon) * metersPerDegreeLon,
    y: (p.lat - originLat) * metersPerDegreeLat,
  }));

  // Shoelace formula for polygon area
  let area = 0;
  for (let i = 0; i < pointsInMeters.length; i++) {
    const j = (i + 1) % pointsInMeters.length;
    area += pointsInMeters[i].x * pointsInMeters[j].y;
    area -= pointsInMeters[j].x * pointsInMeters[i].y;
  }

  return Math.abs(area) / 2;
};

const RoofSizeMeasurer: React.FC<RoofSizeMeasurerProps> = ({
  lat,
  lon,
  onAreaCalculated,
  onClose,
  initialArea,
  initialSnapshot,
  initialPolygonPoints,
  address,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polygonRef = useRef<L.Polygon | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const pointsRef = useRef<L.LatLng[]>(initialPolygonPoints || []);
  const isDrawingRef = useRef(false);
  const { t } = useIntl();
  const [isDrawing, setIsDrawing] = useState(false);
  const [area, setArea] = useState<number | null>(initialArea || null);
  const [points, setPoints] = useState<L.LatLng[]>(initialPolygonPoints || []);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(initialSnapshot || null);

  // Initialize map only once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map with mobile optimizations
    const map = L.map(mapRef.current, {
      center: [lat, lon],
      zoom: 19,
      minZoom: 15,
      maxZoom: 21,
      zoomControl: true,
      attributionControl: true,
      // Mobile optimizations
      touchZoom: true,
      doubleClickZoom: true,
      boxZoom: false, // Disable box zoom on mobile
      keyboard: false, // Disable keyboard on mobile
      scrollWheelZoom: true,
      dragging: true,
      // Use SVG for better mobile performance (lighter than Canvas)
      preferCanvas: false,
    });

    // Add satellite tile layer
    const tileLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: '© Esri',
        maxZoom: 20,
        crossOrigin: true,
      }
    ).addTo(map);

    mapInstanceRef.current = map;

    // Invalidate map size on mobile orientation change
    const handleResize = () => {
      if (mapInstanceRef.current) {
        setTimeout(() => {
          mapInstanceRef.current?.invalidateSize();
        }, 100);
      }
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Handle map clicks/touches for drawing - use refs to access latest values
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!isDrawingRef.current) return;

      // Prevent default map behaviors when drawing
      L.DomEvent.stopPropagation(e.originalEvent);

      const newPoint = e.latlng;
      const currentPoints = pointsRef.current;
      const newPoints = [...currentPoints, newPoint];

      // Update ref immediately
      pointsRef.current = newPoints;
      setPoints(newPoints);

      // Add marker at click point with proper z-index
      const marker = L.marker([newPoint.lat, newPoint.lng], {
        icon: L.divIcon({
          className: 'roof-point-marker',
          html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); z-index: 1000; position: relative;"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        }),
        zIndexOffset: 1000,
      }).addTo(map);

      markersRef.current.push(marker);

      // Update polygon if we have at least 3 points
      if (newPoints.length >= 3) {
        if (polygonRef.current) {
          map.removeLayer(polygonRef.current);
        }

        const polygon = L.polygon(
          newPoints.map(p => [p.lat, p.lng]),
          {
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.3,
            weight: 2,
          }
        ).addTo(map);

        polygonRef.current = polygon;

        // Calculate area
        const calculatedArea = calculatePolygonArea(newPoints);
        setArea(calculatedArea);
      }
    };

    // Leaflet automatically handles touch events and converts them to click events
    // So we only need to listen to 'click' which works on both desktop and mobile
    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lon]);

  // Update map view when coordinates change (without re-initializing)
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lon], 19);
    }
  }, [lat, lon]);

  // Update refs when state changes (without re-initializing map)
  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  useEffect(() => {
    isDrawingRef.current = isDrawing;
  }, [isDrawing]);

  const handleStartDrawing = () => {
    setIsDrawing(true);
    setPoints([]);
    setArea(null);
    pointsRef.current = [];

    // Clear existing polygon and markers
    if (polygonRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(polygonRef.current);
      polygonRef.current = null;
    }
    markersRef.current.forEach(marker => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(marker);
      }
    });
    markersRef.current = [];
  };

  const handleClear = () => {
    setPoints([]);
    setArea(null);
    setIsDrawing(false);
    pointsRef.current = [];

    if (polygonRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(polygonRef.current);
      polygonRef.current = null;
    }
    markersRef.current.forEach(marker => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(marker);
      }
    });
    markersRef.current = [];
  };

  const captureSnapshot = async (): Promise<string | undefined> => {
    if (!mapInstanceRef.current) return undefined;

    try {
      // Get the map container
      const container = mapInstanceRef.current.getContainer();

      // Create a temporary canvas to combine tile canvases + SVG overlays
      const tempCanvas = document.createElement('canvas');
      const mapSize = mapInstanceRef.current.getSize();
      tempCanvas.width = mapSize.x;
      tempCanvas.height = mapSize.y;
      const ctx = tempCanvas.getContext('2d');

      if (!ctx) return undefined;

      // Draw raster canvas layers first (tile layers)
      const canvases = container.querySelectorAll('canvas');
      canvases.forEach(canvas => {
        try {
          ctx.drawImage(canvas as HTMLCanvasElement, 0, 0);
        } catch (e) {
          console.warn('Could not draw a canvas layer (possible CORS):', e);
        }
      });

      // Draw any SVG overlays (vector layers like polygons)
      const svgs = container.querySelectorAll('svg');
      for (const svg of Array.from(svgs)) {
        try {
          const svgClone = svg.cloneNode(true) as SVGElement;
          const xml = new XMLSerializer().serializeToString(svgClone);
          const svg64 = btoa(unescape(encodeURIComponent(xml)));
          const img = new Image();
          img.src = `data:image/svg+xml;base64,${svg64}`;

          await new Promise<void>(resolve => {
            img.onload = () => {
              try {
                ctx.drawImage(img, 0, 0);
                resolve();
              } catch (err) {
                resolve();
              }
            };
            img.onerror = () => resolve();
          });
        } catch (err) {
          console.warn('Could not draw SVG overlay:', err);
        }
      }

      // Attempt to draw marker DOM elements approximately
      const markerEls = container.querySelectorAll('.roof-point-marker, .leaflet-marker-icon');
      markerEls.forEach(el => {
        try {
          const rect = (el as HTMLElement).getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          const x = rect.left - containerRect.left;
          const y = rect.top - containerRect.top;
          ctx.beginPath();
          ctx.fillStyle = '#3b82f6';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.arc(
            x + rect.width / 2,
            y + rect.height / 2,
            Math.max(6, rect.width / 2),
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.stroke();
        } catch (err) {
          // ignore marker draw errors
        }
      });

      const dataUrl = tempCanvas.toDataURL('image/png');
      return dataUrl;
    } catch (error) {
      console.error('Error capturing snapshot:', error);
      return undefined;
    }
  };

  const handleConfirm = async () => {
    if (area !== null && area > 0) {
      // Capture snapshot before confirming
      const snapshot = await captureSnapshot();
      setSnapshotUrl(snapshot || null);

      onAreaCalculated(area, snapshot, pointsRef.current);
      onClose();
    }
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50'>
      <div className='bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 border-b border-gray-200'>
          <div className='flex items-center gap-2'>
            <Ruler className='w-5 h-5 text-blue-600' />
            <div>
              <h2 className='text-xl font-bold text-gray-900'>
                {t('reportForm.roofMeasurer.title') || 'Measure Roof Size'}
              </h2>
              {address && <p className='text-sm text-gray-600 mt-1'>{address}</p>}
            </div>
          </div>
          <button onClick={onClose} className='text-gray-400 hover:text-gray-600 transition-colors'>
            <X className='w-6 h-6' />
          </button>
        </div>

        {/* Instructions */}
        <div className='p-4 bg-blue-50 border-b border-gray-200'>
          <p className='text-sm text-gray-700'>
            {isDrawing ? (
              <>
                {t('reportForm.roofMeasurer.instructions.drawing') ||
                  'Drawing mode: Click on the map to add points around the roof perimeter. You need at least 3 points to form a polygon. The area will be calculated automatically.'}
              </>
            ) : (
              <>
                {t('reportForm.roofMeasurer.instructions.start') ||
                  'Click "Start Drawing" to begin measuring. Then click on the map to mark the corners of the roof.'}
              </>
            )}
          </p>
        </div>

        {/* Map */}
        <div className='flex-1 relative' style={{ zIndex: 1 }}>
          <div
            ref={mapRef}
            className='w-full h-full min-h-[400px]'
            style={{
              zIndex: 1,
              touchAction: isDrawing ? 'none' : 'pan-x pan-y pinch-zoom', // Prevent panning when drawing
            }}
          />
          <style>{`
            .roof-point-marker {
              z-index: 1000 !important;
              touch-action: none; /* Prevent touch events on markers */
            }
            .leaflet-marker-icon {
              z-index: 1000 !important;
              touch-action: none;
            }
            .leaflet-container {
              touch-action: ${isDrawing ? 'none' : 'pan-x pan-y pinch-zoom'};
            }
            /* Mobile optimizations */
            @media (max-width: 640px) {
              .leaflet-control-zoom {
                font-size: 18px !important;
                margin: 10px !important;
              }
              .leaflet-control-zoom a {
                width: 36px !important;
                height: 36px !important;
                line-height: 36px !important;
              }
            }
          `}</style>
        </div>

        {/* Controls */}
        <div className='p-3 sm:p-4 border-t border-gray-200 bg-gray-50'>
          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-3'>
            <div className='flex items-center gap-2 sm:gap-4 flex-wrap'>
              {!isDrawing ? (
                <button
                  onClick={handleStartDrawing}
                  className='px-4 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 active:bg-slate-900 transition-colors font-medium text-sm sm:text-base touch-manipulation shadow-sm'
                  style={{ minHeight: '44px' }} // iOS touch target minimum
                >
                  {t('reportForm.roofMeasurer.startDrawing') || 'Start Drawing'}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleClear}
                    className='px-3 sm:px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 active:bg-gray-400 transition-colors font-medium flex items-center gap-2 text-sm sm:text-base touch-manipulation'
                    style={{ minHeight: '44px' }}
                  >
                    <Trash2 className='w-4 h-4' />
                    {t('reportForm.roofMeasurer.clear') || 'Clear'}
                  </button>
                  <span className='text-xs sm:text-sm text-gray-600 self-center'>
                    {t('reportForm.roofMeasurer.points', { count: points.length }) ||
                      `Points: ${points.length}`}{' '}
                    {points.length >= 3 &&
                      ` (${t('reportForm.roofMeasurer.minimumReached') || 'Minimum reached'})`}
                  </span>
                </>
              )}
            </div>

            {area !== null && (
              <div className='text-left sm:text-right w-full sm:w-auto'>
                <div className='text-xs sm:text-sm text-gray-600'>
                  {t('reportForm.roofMeasurer.calculatedArea') || 'Calculated Area'}
                </div>
                <div className='text-xl sm:text-2xl font-bold text-blue-600'>
                  {area.toFixed(2)} m²
                </div>
                <div className='text-xs text-gray-500'>
                  {(area * 10.764).toFixed(2)} {t('reportForm.roofMeasurer.sqft') || 'sq ft'}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className='flex gap-2 sm:gap-3'>
            <button
              onClick={onClose}
              className='flex-1 px-4 sm:px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors font-semibold text-sm sm:text-base touch-manipulation'
              style={{ minHeight: '44px' }}
            >
              {t('form.buttons.cancel')}
            </button>
            <button
              onClick={handleConfirm}
              disabled={area === null || area === 0}
              className='flex-1 px-4 sm:px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base touch-manipulation'
              style={{ minHeight: '44px' }}
            >
              {t('reportForm.roofMeasurer.useThisArea') || 'Use This Area'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoofSizeMeasurer;
