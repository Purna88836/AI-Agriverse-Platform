import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  MapPin, 
  Ruler, 
  Calculator, 
  Layers, 
  ZoomIn, 
  ZoomOut,
  RotateCcw,
  Save,
  Download,
  Share2,
  Info,
  Crosshair,
  Navigation,
  Globe,
  Compass,
  ArrowLeft,
  Hexagon,
  Box
} from 'lucide-react';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom drawing tools
const DrawingTools = ({ onAreaCalculated, onCoordinatesSelected, onDrawingStateChange }) => {
  const [drawingMode, setDrawingMode] = useState(null);
  const [currentShape, setCurrentShape] = useState(null);
  const [measurements, setMeasurements] = useState(null);
  const [drawnShapes, setDrawnShapes] = useState([]);
  const map = useMap();

  // Area calculation function (Shoelace formula for polygon area)
  const calculateArea = useCallback((coordinates) => {
    if (coordinates.length < 3) return 0;
    
    // Use Shoelace formula for accurate polygon area calculation
    let area = 0;
    const n = coordinates.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += coordinates[i].lng * coordinates[j].lat;
      area -= coordinates[j].lng * coordinates[i].lat;
    }
    
    area = Math.abs(area) / 2;
    
    // Convert to square meters using proper geographic conversion
    // This is a more accurate conversion for geographic coordinates
    const lat = coordinates[0].lat; // Use first coordinate for latitude
    const metersPerDegreeLat = 111320; // meters per degree latitude
    const metersPerDegreeLon = 111320 * Math.cos(lat * Math.PI / 180); // meters per degree longitude at this latitude
    
    const areaInSquareMeters = area * metersPerDegreeLat * metersPerDegreeLon;
    return areaInSquareMeters;
  }, []);

  // Convert square meters to acres
  const squareMetersToAcres = (sqMeters) => {
    return sqMeters * 0.000247105;
  };

  // Handle map clicks for drawing
  useMapEvents({
    click: (e) => {
      console.log('Map clicked:', e.latlng, 'Drawing mode:', drawingMode);
      
      // Validate coordinates
      const { lat, lng } = e.latlng;
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        console.error('Invalid coordinates received:', e.latlng);
        alert('Invalid coordinates received. Please try clicking again.');
        return;
      }
      
      console.log('Valid coordinates:', { lat, lng });
      
      if (drawingMode === 'polygon') {
        if (!currentShape) {
          setCurrentShape([e.latlng]);
          console.log('Started polygon drawing');
        } else {
          setCurrentShape([...currentShape, e.latlng]);
          console.log('Added point to polygon');
        }
      } else if (drawingMode === 'rectangle') {
        if (!currentShape) {
          setCurrentShape([e.latlng]);
          console.log('Started rectangle drawing at:', e.latlng);
        } else {
          // Complete rectangle
          const start = currentShape[0];
          const end = e.latlng;
          console.log('Completing rectangle from:', start, 'to:', end);
          
          const rectangleCoords = [
            start,
            { lat: start.lat, lng: end.lng },
            end,
            { lat: end.lat, lng: start.lng },
            start
          ];
          
          const area = calculateArea(rectangleCoords);
          const acres = squareMetersToAcres(area);
          
          console.log('Rectangle area calculated:', area, 'acres:', acres);
          
          setMeasurements({
            area: area,
            acres: acres,
            coordinates: rectangleCoords,
            type: 'rectangle'
          });
          
          setDrawnShapes([...drawnShapes, {
            type: 'rectangle',
            coordinates: rectangleCoords,
            area: area,
            acres: acres
          }]);
          
          setCurrentShape(null);
          setDrawingMode(null);
          onAreaCalculated && onAreaCalculated(area, acres, rectangleCoords);
        }
      } else if (drawingMode === 'point') {
        // For point selection, calculate a small default area (1 acre = 4046.86 sq meters)
        const defaultArea = 4046.86; // 1 acre in square meters
        const defaultAcres = 1;
        
        console.log('Point selected:', e.latlng);
        
        setMeasurements({
          area: defaultArea,
          acres: defaultAcres,
          coordinates: [e.latlng],
          type: 'point'
        });
        
        setDrawnShapes([...drawnShapes, {
          type: 'point',
          coordinates: [e.latlng],
          area: defaultArea,
          acres: defaultAcres
        }]);
        
        onCoordinatesSelected && onCoordinatesSelected(e.latlng);
        onAreaCalculated && onAreaCalculated(defaultArea, defaultAcres, [e.latlng]);
        setDrawingMode(null);
      } else {
        console.log('No drawing mode active, click ignored');
      }
    },
    dblclick: (e) => {
      if (drawingMode === 'polygon' && currentShape && currentShape.length >= 3) {
        // Complete polygon
        const polygonCoords = [...currentShape, currentShape[0]];
        const area = calculateArea(polygonCoords);
        const acres = squareMetersToAcres(area);
        
        console.log('Completing polygon with area:', area, 'acres:', acres);
        
        setMeasurements({
          area: area,
          acres: acres,
          coordinates: polygonCoords,
          type: 'polygon'
        });
        
        setDrawnShapes([...drawnShapes, {
          type: 'polygon',
          coordinates: polygonCoords,
          area: area,
          acres: acres
        }]);
        
        setCurrentShape(null);
        setDrawingMode(null);
        onAreaCalculated && onAreaCalculated(area, acres, polygonCoords);
      }
    }
  });

  const startDrawing = (mode) => {
    console.log('Starting drawing mode:', mode);
    setDrawingMode(mode);
    setCurrentShape(null);
    setMeasurements(null);
  };

  const clearDrawings = () => {
    console.log('Clearing all drawings');
    setDrawnShapes([]);
    setCurrentShape(null);
    setMeasurements(null);
    setDrawingMode(null);
  };

  const getCurrentLocation = () => {
    console.log('Getting current location');
    // Clear any active drawing mode when getting location
    setDrawingMode(null);
    setCurrentShape(null);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('Location obtained:', latitude, longitude);
          map.setView([latitude, longitude], 15);
          onCoordinatesSelected && onCoordinatesSelected({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please enable location services.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  return (
    <div className="absolute top-4 left-4 z-[1000] space-y-2">
      {/* Drawing Tools */}
      <div className="bg-white rounded-lg shadow-lg p-3 space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Drawing Tools</h3>
        
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => startDrawing('polygon')}
            className={`p-2 rounded-lg text-xs font-medium transition-colors ${
              drawingMode === 'polygon' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Hexagon className="w-4 h-4 mx-auto mb-1" />
            Polygon
          </button>
          
          <button
            onClick={() => startDrawing('rectangle')}
            className={`p-2 rounded-lg text-xs font-medium transition-colors ${
              drawingMode === 'rectangle' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Box className="w-4 h-4 mx-auto mb-1" />
            Rectangle
          </button>
          
          <button
            onClick={() => startDrawing('point')}
            className={`p-2 rounded-lg text-xs font-medium transition-colors ${
              drawingMode === 'point' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <MapPin className="w-4 h-4 mx-auto mb-1" />
            Point
          </button>
          
          <button
            onClick={getCurrentLocation}
            className="p-2 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700 transition-colors"
          >
            <Crosshair className="w-4 h-4 mx-auto mb-1" />
            My Location
          </button>
        </div>
        
        <button
          onClick={clearDrawings}
          className="w-full p-2 rounded-lg text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
        >
          <RotateCcw className="w-3 h-3 inline mr-1" />
          Clear All
        </button>
      </div>

      {/* Instructions */}
      {drawingMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800 font-medium mb-1">
            {drawingMode === 'polygon' && '🔷 Polygon Drawing Mode'}
            {drawingMode === 'rectangle' && '📐 Rectangle Drawing Mode'}
            {drawingMode === 'point' && '📍 Point Selection Mode'}
          </p>
          <p className="text-xs text-blue-700">
            {drawingMode === 'polygon' && 'Click to add points, double-click to complete'}
            {drawingMode === 'rectangle' && 'Click first corner, then click opposite corner to complete'}
            {drawingMode === 'point' && 'Click once to select a specific point (1 acre default)'}
          </p>
          {drawingMode === 'rectangle' && currentShape && (
            <p className="text-xs text-blue-600 mt-1">
              ✅ First corner set! Click opposite corner to complete rectangle
            </p>
          )}
        </div>
      )}

      {/* Measurements Display */}
      {measurements && (
        <div className="bg-white rounded-lg shadow-lg p-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Measurements</h3>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Area:</span>
              <span className="font-medium">{(measurements.area / 10000).toFixed(2)} hectares</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Acres:</span>
              <span className="font-medium">{measurements.acres.toFixed(2)} acres</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Square Meters:</span>
              <span className="font-medium">{measurements.area.toFixed(0)} m²</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Search component
const SearchComponent = ({ onLocationSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchLocation = async (query) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchLocation(searchQuery);
  };

  const selectLocation = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    onLocationSelect({ lat, lng }, result.display_name);
    setSearchResults([]);
    setSearchQuery('');
  };

  return (
    <div className="absolute top-4 right-4 z-[1000] w-80">
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for location..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
          <button
            type="submit"
            disabled={isSearching}
            className="absolute right-2 top-2 text-blue-500 hover:text-blue-700 disabled:text-gray-400"
          >
            {isSearching ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            ) : (
              'Search'
            )}
          </button>
        </div>
      </form>

      {/* Search Results */}
      <AnimatePresence>
        {searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto"
          >
            {searchResults.map((result, index) => (
              <button
                key={index}
                onClick={() => selectLocation(result)}
                className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="font-medium text-sm text-gray-900">{result.display_name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {parseFloat(result.lat).toFixed(4)}, {parseFloat(result.lon).toFixed(4)}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Map controls component
const MapControls = ({ map }) => {
  const zoomIn = () => map.zoomIn();
  const zoomOut = () => map.zoomOut();
  const resetView = () => map.setView([20, 0], 2);

  return (
    <div className="absolute bottom-4 right-4 z-[1000] space-y-2">
      <div className="bg-white rounded-lg shadow-lg p-2 space-y-1">
        <button
          onClick={zoomIn}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ZoomIn className="w-4 h-4 text-gray-600" />
        </button>
        <button
          onClick={zoomOut}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ZoomOut className="w-4 h-4 text-gray-600" />
        </button>
        <button
          onClick={resetView}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Globe className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </div>
  );
};

// Main OpenStreetMap component
const OpenStreetMapIntegration = ({ 
  onLandSelected, 
  selectedLand, 
  onBack,
  onScheduleSaved,
  onDrawingStateChange // Added prop
}) => {
  const [mapCenter, setMapCenter] = useState([20, 0]);
  const [mapZoom, setMapZoom] = useState(2);
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const mapRef = useRef(null);

  const handleAreaCalculated = (area, acres, coordinates) => {
    console.log('Area calculated in main component:', area, acres);
    console.log('Coordinates received:', coordinates);
    
    // Validate coordinates before processing
    if (coordinates && coordinates.length > 0) {
      const validCoordinates = coordinates.filter(coord => {
        const isValid = coord.lat >= -90 && coord.lat <= 90 && coord.lng >= -180 && coord.lng <= 180;
        if (!isValid) {
          console.error('Invalid coordinate found:', coord);
        }
        return isValid;
      });
      
      if (validCoordinates.length === 0) {
        console.error('No valid coordinates found');
        return;
      }
      
      coordinates = validCoordinates;
    }
    
    setSelectedArea({ area, acres, coordinates });
    
    // Get location name for coordinates
    const center = coordinates[Math.floor(coordinates.length / 2)];
    fetchLocationName(center.lat, center.lng);
    
    // Pass data to parent component
    if (onLandSelected) {
      const landData = {
        id: Date.now(),
        name: locationName || `Land at ${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`,
        location: center,
        area: area,
        acres: acres,
        coordinates: coordinates,
        type: 'area',
        created_at: new Date().toISOString()
      };
      onLandSelected(landData);
    }
  };

  const handleCoordinatesSelected = (coordinates) => {
    console.log('Coordinates selected in main component:', coordinates);
    
    // Validate coordinates
    if (!coordinates || coordinates.lat < -90 || coordinates.lat > 90 || coordinates.lng < -180 || coordinates.lng > 180) {
      console.error('Invalid coordinates received:', coordinates);
      return;
    }
    
    setSelectedCoordinates(coordinates);
    fetchLocationName(coordinates.lat, coordinates.lng);
    
    // Pass data to parent component
    if (onLandSelected) {
      const landData = {
        id: Date.now(),
        name: locationName || `Land at ${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`,
        location: coordinates,
        area: 4046.86, // 1 acre default
        acres: 1,
        coordinates: [coordinates],
        type: 'point',
        created_at: new Date().toISOString()
      };
      onLandSelected(landData);
    }
  };

  const handleLocationSelect = (coordinates, name) => {
    setMapCenter([coordinates.lat, coordinates.lng]);
    setMapZoom(15);
    setSelectedCoordinates(coordinates);
    setLocationName(name);
  };

  const fetchLocationName = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`
      );
      const data = await response.json();
      setLocationName(data.display_name);
    } catch (error) {
      console.error('Error fetching location name:', error);
    }
  };

  const saveLandSelection = () => {
    if (selectedArea || selectedCoordinates) {
      const landData = {
        id: Date.now(),
        name: locationName || `Land at ${selectedCoordinates?.lat.toFixed(4)}, ${selectedCoordinates?.lng.toFixed(4)}`,
        location: selectedCoordinates || selectedArea.coordinates[0],
        area: selectedArea?.area || 0,
        acres: selectedArea?.acres || 0,
        coordinates: selectedArea?.coordinates || [selectedCoordinates],
        type: selectedArea ? 'area' : 'point',
        created_at: new Date().toISOString()
      };
      
      onLandSelected && onLandSelected(landData);
    }
  };

  const exportData = () => {
    const data = {
      land: selectedArea || selectedCoordinates,
      locationName,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `land-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative h-[500px] w-full">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <DrawingTools 
          onAreaCalculated={handleAreaCalculated}
          onCoordinatesSelected={handleCoordinatesSelected}
          onDrawingStateChange={onDrawingStateChange} // Pass prop down
        />
        
        <SearchComponent onLocationSelect={handleLocationSelect} />
        
        <MapControls map={mapRef.current} />
        
        {/* Display selected coordinates */}
        {selectedCoordinates && (
          <Marker position={[selectedCoordinates.lat, selectedCoordinates.lng]}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">Selected Location</div>
                <div className="text-gray-600">
                  {selectedCoordinates.lat.toFixed(6)}, {selectedCoordinates.lng.toFixed(6)}
                </div>
                {locationName && (
                  <div className="text-gray-500 text-xs mt-1">{locationName}</div>
                )}
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Display temporary drawing points */}
        {/* currentShape is managed by DrawingTools, not directly here */}
        
        {/* Display selected area */}
        {selectedArea && selectedArea.coordinates && (
          <Polygon 
            positions={selectedArea.coordinates.map(coord => [coord.lat, coord.lng])}
            color="blue"
            fillColor="blue"
            fillOpacity={0.2}
            weight={2}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">Selected Area</div>
                <div className="text-gray-600">
                  Area: {selectedArea.acres.toFixed(2)} acres
                </div>
                <div className="text-gray-600">
                  {selectedArea.area.toFixed(0)} m²
                </div>
              </div>
            </Popup>
          </Polygon>
        )}
      </MapContainer>

      {/* Bottom Info Panel */}
      {(selectedArea || selectedCoordinates || locationName) && (
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {selectedArea && (
                <div className="bg-green-50 rounded-lg p-3">
                  <h3 className="font-semibold text-green-900 mb-2">Area Measurements</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">Area:</span>
                      <span className="font-medium">{(selectedArea.area / 10000).toFixed(2)} hectares</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Acres:</span>
                      <span className="font-medium">{selectedArea.acres.toFixed(2)} acres</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Square Meters:</span>
                      <span className="font-medium">{selectedArea.area.toFixed(0)} m²</span>
                    </div>
                  </div>
                </div>
              )}
              
              {selectedCoordinates && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <h3 className="font-semibold text-blue-900 mb-2">Coordinates</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Latitude:</span>
                      <span className="font-medium">{selectedCoordinates.lat.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Longitude:</span>
                      <span className="font-medium">{selectedCoordinates.lng.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Decimal:</span>
                      <span className="font-medium">{selectedCoordinates.lat.toFixed(4)}, {selectedCoordinates.lng.toFixed(4)}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {locationName && (
                <div className="bg-purple-50 rounded-lg p-3">
                  <h3 className="font-semibold text-purple-900 mb-2">Location</h3>
                  <div className="text-sm text-purple-700">
                    {locationName}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpenStreetMapIntegration; 