import React, { useEffect, useRef, useState } from 'react';
import { X, Ruler, Trash2 } from 'lucide-react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface RoofSizeMeasurerProps {
  lat: number;
  lon: number;
  onAreaCalculated: (areaInSquareMeters: number) => void;
  onClose: () => void;
  initialArea?: number; // Optional initial area value
}

// Helper function to calculate area of a polygon in square meters
const calculatePolygonArea = (latlngs: L.LatLng[]): number => {
  if (latlngs.length < 3) return 0;

  let area = 0;
  const R = 6371000; // Earth's radius in meters

  for (let i = 0; i < latlngs.length; i++) {
    const j = (i + 1) % latlngs.length;
    const lat1 = (latlngs[i].lat * Math.PI) / 180;
    const lat2 = (latlngs[j].lat * Math.PI) / 180;
    const dLon = ((latlngs[j].lng - latlngs[i].lng) * Math.PI) / 180;

    area +=
      Math.atan2(
        Math.sin(dLon) * Math.cos(lat2),
        Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)
      ) * R * R;
  }

  return Math.abs(area);
};

const RoofSizeMeasurer: React.FC<RoofSizeMeasurerProps> = ({
  lat,
  lon,
  onAreaCalculated,
  onClose,
  initialArea,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polygonRef = useRef<L.Polygon | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [area, setArea] = useState<number | null>(initialArea || null);
  const [points, setPoints] = useState<L.LatLng[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current, {
      center: [lat, lon],
      zoom: 19,
      minZoom: 15,
      maxZoom: 21,
      zoomControl: true,
      attributionControl: true,
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

    // Handle map clicks for drawing
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!isDrawing) return;

      const newPoint = e.latlng;
      const newPoints = [...points, newPoint];
      setPoints(newPoints);

      // Add marker at click point with proper z-index
      const marker = L.marker(newPoint, {
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

        const polygon = L.polygon(newPoints, {
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.3,
          weight: 2,
        }).addTo(map);

        polygonRef.current = polygon;

        // Calculate area
        const calculatedArea = calculatePolygonArea(newPoints);
        setArea(calculatedArea);
      }
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lon, isDrawing, points]);

  const handleStartDrawing = () => {
    setIsDrawing(true);
    setPoints([]);
    setArea(null);
    
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

  const handleConfirm = () => {
    if (area !== null && area > 0) {
      onAreaCalculated(area);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Measure Roof Size</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-blue-50 border-b border-gray-200">
          <p className="text-sm text-gray-700">
            {isDrawing ? (
              <>
                <strong>Drawing mode:</strong> Click on the map to add points around the roof perimeter. 
                You need at least 3 points to form a polygon. The area will be calculated automatically.
              </>
            ) : (
              <>
                Click "Start Drawing" to begin measuring. Then click on the map to mark the corners of the roof.
              </>
            )}
          </p>
        </div>

        {/* Map */}
        <div className="flex-1 relative" style={{ zIndex: 1 }}>
          <div ref={mapRef} className="w-full h-full min-h-[400px]" style={{ zIndex: 1 }} />
          <style>{`
            .roof-point-marker {
              z-index: 1000 !important;
            }
            .leaflet-marker-icon {
              z-index: 1000 !important;
            }
          `}</style>
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {!isDrawing ? (
                <button
                  onClick={handleStartDrawing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Start Drawing
                </button>
              ) : (
                <>
                  <button
                    onClick={handleClear}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear
                  </button>
                  <span className="text-sm text-gray-600">
                    Points: {points.length} {points.length >= 3 && '(Minimum reached)'}
                  </span>
                </>
              )}
            </div>

            {area !== null && (
              <div className="text-right">
                <div className="text-sm text-gray-600">Calculated Area</div>
                <div className="text-2xl font-bold text-blue-600">
                  {area.toFixed(2)} m²
                </div>
                <div className="text-xs text-gray-500">
                  {(area * 10.764).toFixed(2)} sq ft
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={area === null || area === 0}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Use This Area
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoofSizeMeasurer;

