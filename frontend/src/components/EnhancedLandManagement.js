import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import OpenStreetMapIntegration from './OpenStreetMapIntegration';
import { 
  MapPin, 
  Plus, 
  Camera, 
  Leaf, 
  Calendar, 
  Activity,
  MessageCircle,
  X,
  Save,
  Navigation,
  Search,
  Crop,
  Sparkles,
  Trash2,
  Globe,
  AlertTriangle
} from 'lucide-react';

const EnhancedLandManagement = ({ user, onLandAdded, onLandSelected }) => {
  const [lands, setLands] = useState([]);
  const [landCropCounts, setLandCropCounts] = useState({}); // Store crop counts for each land
  const [landProgress, setLandProgress] = useState({}); // Store progress for each land
  const [showAddLand, setShowAddLand] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedLand, setSelectedLand] = useState(null);
  const [landForm, setLandForm] = useState({
    name: '',
    size: '',
    soil_type: '',
    custom_soil_type: '',
    location: { lat: 0, lng: 0 },
    crops: [],
    intended_crops: []
  });
  const [mapCenter, setMapCenter] = useState({ lat: 20.5937, lng: 78.9629 }); // India center
  const [drawnShape, setDrawnShape] = useState(null);
  const [mapRef, setMapRef] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  // Soil type options
  const soilTypes = [
    { value: 'clay', label: 'Clay', description: 'Heavy, sticky soil that holds water well' },
    { value: 'loam', label: 'Loam', description: 'Rich, balanced soil ideal for most crops' },
    { value: 'sandy', label: 'Sandy', description: 'Light, well-draining soil' },
    { value: 'silt', label: 'Silt', description: 'Fine, fertile soil with good moisture retention' },
    { value: 'peaty', label: 'Peaty', description: 'Dark, organic-rich soil' },
    { value: 'saline', label: 'Saline', description: 'High salt content soil' },
    { value: 'chalky', label: 'Chalky', description: 'Alkaline soil with high calcium content' },
    { value: 'other', label: 'Other', description: 'Custom soil type' }
  ];

  const mapContainerStyle = {
    width: '100%',
    height: '400px'
  };

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(location);
          setMapCenter(location);
          setLandForm(prev => ({ ...prev, location }));
          console.log('Current location set:', location);
        },
        (error) => {
          console.log('Location error:', error);
          alert('Unable to get location. Please enable location services.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  // Search for locations using OpenStreetMap Nominatim API (free)
  const searchLocations = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();
      
      const results = data.map(item => ({
        description: item.display_name,
        place_id: item.place_id,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon)
      }));
      
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  // Handle search result selection
  const handleSearchResultSelect = (result) => {
    const location = {
      lat: result.lat,
      lng: result.lng
    };
    setMapCenter(location);
    setLandForm(prev => ({ ...prev, location }));
    setSearchQuery(result.description);
    setShowSearchResults(false);
    console.log('Selected location:', location);
  };

  // Map interaction handlers (now handled by EnhancedFreeMap)
  const handleMapLocationSelect = (latLng) => {
    const location = { lat: latLng[0], lng: latLng[1] };
    setLandForm(prev => ({ ...prev, location }));
  };

  const handleShapeUpdate = (shape) => {
    setDrawnShape(shape);
    if (shape.type === 'point' && shape.location) {
      setLandForm(prev => ({ 
        ...prev, 
        location: { lat: shape.location[0], lng: shape.location[1] }
      }));
    }
  };

  // Calculate area from drawn shape
  const calculateArea = () => {
    if (drawnShape && drawnShape.acres) {
      return drawnShape.acres;
    }
    return 0;
  };

  // Get AI crop suggestions
  const getAICropSuggestions = async (landData) => {
    setIsLoadingAI(true);
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001'}/api/crop-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          lat: landData.location.lat,
          lng: landData.location.lng,
          soil_type: landData.soil_type === 'other' ? landData.custom_soil_type : landData.soil_type,
          season: getCurrentSeason()
        })
      });

      if (response.ok) {
        const suggestions = await response.json();
        setAiSuggestions(suggestions);
        setShowAISuggestions(true);
      }
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Get current season
  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  };

  // Function to get farm-specific image based on progress and soil type
  const getFarmImage = (progress, soilType) => {
    // Use the same beautiful golden field landscape for all lands and stages
    return "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=200&fit=crop&crop=center";
  };

  // Fetch lands from backend
  const fetchLands = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001'}/api/lands`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const landsData = await response.json();
        setLands(landsData);
        
        // Fetch crop counts for each land
        await fetchCropCounts(landsData, token);
      }
    } catch (error) {
      console.error('Error fetching lands:', error);
    }
  };

  const fetchCropCounts = async (landsData, token) => {
    try {
      const cropCounts = {};
      const landProgress = {};
      
      // Fetch crop schedules for each land
      for (const land of landsData) {
        try {
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001'}/api/crop-schedules/${land.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.ok) {
            const schedules = await response.json();
            // Count active schedules (schedules that are currently being used)
            const activeSchedules = schedules.filter(schedule => schedule.active === true);
            cropCounts[land.id] = activeSchedules.length;
            
            // Calculate progress for active schedules
            if (activeSchedules.length > 0) {
              const activeSchedule = activeSchedules[0]; // Get the first active schedule
              if (activeSchedule.schedule && activeSchedule.schedule.length > 0) {
                const totalTasks = activeSchedule.schedule.length;
                const completedTasks = activeSchedule.schedule.filter(task => task.completed).length;
                const progressPercentage = Math.round((completedTasks / totalTasks) * 100);
                landProgress[land.id] = progressPercentage;
              } else {
                landProgress[land.id] = 0;
              }
            } else {
              landProgress[land.id] = 0;
            }
          } else {
            cropCounts[land.id] = 0;
            landProgress[land.id] = 0;
          }
        } catch (error) {
          console.error(`Error fetching crop schedules for land ${land.id}:`, error);
          cropCounts[land.id] = 0;
          landProgress[land.id] = 0;
        }
      }
      
      setLandCropCounts(cropCounts);
      setLandProgress(landProgress);
    } catch (error) {
      console.error('Error fetching crop counts:', error);
    }
  };

  useEffect(() => {
    fetchLands();
  }, []);

  // Listen for the triggerAddLand event from the white button
  useEffect(() => {
    const handleTriggerAddLand = () => {
      setShowAddLand(true);
    };

    window.addEventListener('triggerAddLand', handleTriggerAddLand);
    
    return () => {
      window.removeEventListener('triggerAddLand', handleTriggerAddLand);
    };
  }, []);

  // Map is now handled by EnhancedFreeMap component

  // Handle land form submission
  const handleAddLand = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    // Validate location
    if (landForm.location.lat === 0 && landForm.location.lng === 0) {
      alert('Please select a location on the map or use current location.');
      return;
    }

    // Calculate area or use manual input
    const calculatedArea = calculateArea();
    const finalSize = calculatedArea > 0 ? calculatedArea : parseFloat(landForm.size) || 0;
    
    if (finalSize <= 0) {
      alert('Please draw a shape on the map or enter a valid land size.');
      return;
    }

    const landData = {
      ...landForm,
      size: finalSize,
      soil_type: landForm.soil_type === 'other' ? landForm.custom_soil_type : landForm.soil_type
    };

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001'}/api/lands`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(landData)
      });

      if (response.ok) {
        const newLand = await response.json();
        setLands(prev => [...prev, newLand]);
        setShowAddLand(false);
        
        // Get AI suggestions immediately after land registration
        await getAICropSuggestions(newLand);
        
        // Reset form
        setLandForm({ 
          name: '', 
          size: '', 
          soil_type: '', 
          custom_soil_type: '',
          location: { lat: 0, lng: 0 }, 
          crops: [],
          intended_crops: []
        });
        setDrawnShape(null);
        setSearchQuery('');
        if (onLandAdded) onLandAdded(newLand);
      }
    } catch (error) {
      console.error('Error adding land:', error);
    }
  };

  // Handle land selection
  const handleLandSelect = (land) => {
    setSelectedLand(land);
    if (onLandSelected) onLandSelected(land);
  };

  // Delete land
  const deleteLand = async (landId) => {
    if (!window.confirm('Are you sure you want to delete this land? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001'}/api/lands/${landId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        // Remove from local state
        setLands(lands.filter(land => land.id !== landId));
        alert('Land deleted successfully');
      } else {
        alert('Failed to delete land');
      }
    } catch (error) {
      console.error('Error deleting land:', error);
      alert('Error deleting land');
    }
  };

  // Update land
  const updateLand = async (landId, updatedData) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001'}/api/lands/${landId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        const updatedLand = await response.json();
        setLands(lands.map(land => land.id === landId ? updatedLand : land));
        alert('Land updated successfully');
      } else {
        alert('Failed to update land');
      }
    } catch (error) {
      console.error('Error updating land:', error);
      alert('Error updating land');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-sm border-b"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Globe className="text-blue-600" size={24} />
                Land Management
              </h1>
              <p className="text-sm text-gray-600 mt-1">Powered by OpenStreetMap - Free & Unlimited</p>
            </div>
            <motion.button
              onClick={() => setShowAddLand(true)}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl border-0 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl backdrop-blur-sm"
            >
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <Plus size={16} className="text-white" />
              </div>
              <span className="font-semibold text-sm">Add Land with OpenStreetMap</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">


        {/* Lands Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          <AnimatePresence>
            {lands.map((land, index) => (
              <motion.div
                key={land.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onClick={() => handleLandSelect(land)}
                className="group relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden h-[520px] flex flex-col"
              >
                {/* Card Header with Land Image */}
                <div className="relative h-40 overflow-hidden">
                  {/* Land Image Background */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${getFarmImage(landProgress[land.id], land.soil_type)})`,
                    }}
                  >
                    <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                  </div>
                  
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white bg-opacity-90 shadow-sm ${
                      (landCropCounts[land.id] || 0) > 0 
                        ? 'text-green-700' 
                        : 'text-gray-600'
                    }`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        (landCropCounts[land.id] || 0) > 0 
                          ? 'bg-green-500 animate-pulse' 
                          : 'bg-gray-400'
                      }`}></div>
                      {(landCropCounts[land.id] || 0) > 0 ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  {/* Land Icon */}
                  <div className="absolute bottom-4 left-4">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Globe className="text-white" size={24} />
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteLand(land.id);
                      }}
                      className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                      title="Delete land"
                    >
                      <Trash2 size={14} />
                    </motion.button>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 flex-1 flex flex-col">
                  {/* Land Name and Location */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                      {land.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="text-green-500" size={14} />
                      <span className="truncate">
                        {land.address || `${land.location.lat.toFixed(4)}, ${land.location.lng.toFixed(4)}`}
                      </span>
                    </div>
                  </div>

                  {/* Land Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <div className="text-2xl font-bold text-green-600">{parseFloat(land.size).toFixed(2)}</div>
                      <div className="text-xs text-gray-600 font-medium">Acres</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <div className="text-2xl font-bold text-blue-600">{landCropCounts[land.id] || 0}</div>
                      <div className="text-xs text-gray-600 font-medium">Crops</div>
                    </div>
                  </div>

                  {/* Soil Type */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <span className="font-medium">Soil:</span>
                      <span className="capitalize">{land.soil_type}</span>
                    </div>
                  </div>

                  {/* Progress Bar (if active crop) */}
                  {(landCropCounts[land.id] || 0) > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Growth Progress</span>
                        <span>{landProgress[land.id] || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div 
                          className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${landProgress[land.id] || 0}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                        ></motion.div>
                      </div>
                    </div>
                  )}

                  {/* Inactive Land Alert - Ultra Compact Version */}
                  {(landCropCounts[land.id] || 0) === 0 && (
                    <div className="mb-3">
                      {/* Combined Alert and Suggestions in one compact box */}
                      <div className="bg-gradient-to-r from-red-50 to-green-50 border border-red-200 rounded-lg p-2">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 bg-red-100 rounded-full flex items-center justify-center">
                            <AlertTriangle className="text-red-600" size={8} />
                          </div>
                          <h4 className="text-xs font-semibold text-red-800">Land Not in Use</h4>
                        </div>
                        
                        {/* Compact crop suggestions inline */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-green-700 font-medium">Suggested:</span>
                          <div className="flex gap-1">
                            {land.soil_type === 'black' && (
                              <>
                                <span className="text-xs bg-white text-green-700 px-1 py-0.5 rounded border border-green-200">🌾</span>
                                <span className="text-xs bg-white text-green-700 px-1 py-0.5 rounded border border-green-200">🌽</span>
                                <span className="text-xs bg-white text-green-700 px-1 py-0.5 rounded border border-green-200">🌻</span>
                              </>
                            )}
                            {land.soil_type === 'loam' && (
                              <>
                                <span className="text-xs bg-white text-green-700 px-1 py-0.5 rounded border border-green-200">🥕</span>
                                <span className="text-xs bg-white text-green-700 px-1 py-0.5 rounded border border-green-200">🥬</span>
                                <span className="text-xs bg-white text-green-700 px-1 py-0.5 rounded border border-green-200">🍅</span>
                              </>
                            )}
                            {land.soil_type === 'clay' && (
                              <>
                                <span className="text-xs bg-white text-green-700 px-1 py-0.5 rounded border border-green-200">🥔</span>
                                <span className="text-xs bg-white text-green-700 px-1 py-0.5 rounded border border-green-200">🧅</span>
                                <span className="text-xs bg-white text-green-700 px-1 py-0.5 rounded border border-green-200">🥬</span>
                              </>
                            )}
                            {land.soil_type === 'sandy' && (
                              <>
                                <span className="text-xs bg-white text-green-700 px-1 py-0.5 rounded border border-green-200">🥜</span>
                                <span className="text-xs bg-white text-green-700 px-1 py-0.5 rounded border border-green-200">🥕</span>
                                <span className="text-xs bg-white text-green-700 px-1 py-0.5 rounded border border-green-200">🍠</span>
                              </>
                            )}
                            {land.soil_type === 'chalky' && (
                              <>
                                <span className="text-xs bg-white text-green-700 px-1 py-0.5 rounded border border-green-200">🌾</span>
                                <span className="text-xs bg-white text-green-700 px-1 py-0.5 rounded border border-green-200">🥬</span>
                                <span className="text-xs bg-white text-green-700 px-1 py-0.5 rounded border border-green-200">🥬</span>
                              </>
                            )}
                            {!['black', 'loam', 'clay', 'sandy', 'chalky'].includes(land.soil_type) && (
                              <>
                                <span className="text-xs bg-white text-green-700 px-1 py-0.5 rounded border border-green-200">🌾</span>
                                <span className="text-xs bg-white text-green-700 px-1 py-0.5 rounded border border-green-200">🥕</span>
                                <span className="text-xs bg-white text-green-700 px-1 py-0.5 rounded border border-green-200">🥬</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons - Always at bottom with proper spacing */}
                  <div className="grid grid-cols-2 gap-3 mt-auto pt-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                      <Camera size={16} />
                      Scan
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 shadow-md hover:shadow-lg ${
                        (landCropCounts[land.id] || 0) === 0
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 animate-pulse'
                          : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                      }`}
                    >
                      <Leaf size={16} />
                      {(landCropCounts[land.id] || 0) === 0 ? 'Start Planning!' : 'Plan'}
                    </motion.button>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-green-500 to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl pointer-events-none"></div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Add Land Modal */}
        <AnimatePresence>
          {showAddLand && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Add New Land</h2>
                    <button
                      onClick={() => setShowAddLand(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <form onSubmit={handleAddLand} className="space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Land Name
                        </label>
                        <input
                          type="text"
                          value={landForm.name}
                          onChange={(e) => setLandForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Soil Type
                        </label>
                        <select
                          value={landForm.soil_type}
                          onChange={(e) => setLandForm(prev => ({ ...prev, soil_type: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select soil type</option>
                          {soilTypes.map(soil => (
                            <option key={soil.value} value={soil.value}>
                              {soil.label}
                            </option>
                          ))}
                        </select>
                        {landForm.soil_type === 'other' && (
                          <input
                            type="text"
                            value={landForm.custom_soil_type}
                            onChange={(e) => setLandForm(prev => ({ ...prev, custom_soil_type: e.target.value }))}
                            placeholder="Enter custom soil type"
                            className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            required
                          />
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Land Size (acres)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={landForm.size}
                          onChange={(e) => setLandForm(prev => ({ ...prev, size: e.target.value }))}
                          placeholder="Enter size or draw on map"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Leave empty to calculate from map drawing
                        </p>
                      </div>
                    </div>

                    {/* Location Section */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location
                      </label>
                      
                      {/* Search Bar */}
                      <div className="relative mb-4">
                        <div className="flex gap-2">
                          <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => {
                                setSearchQuery(e.target.value);
                                searchLocations(e.target.value);
                              }}
                              placeholder="Search for location (address, city, etc.)"
                              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                            {showSearchResults && searchResults.length > 0 && (
                              <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                                {searchResults.map((result, index) => (
                                  <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleSearchResultSelect(result)}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                                  >
                                    {result.description}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Location Buttons */}
                      <div className="flex gap-2 mb-4 flex-wrap">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={getCurrentLocation}
                          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Navigation size={16} />
                          Use Current Location
                        </motion.button>
                      </div>

                      {/* Selected Location Display */}
                      {(landForm.location.lat !== 0 || landForm.location.lng !== 0) && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800">
                            <strong>Selected Location:</strong> {landForm.location.lat.toFixed(6)}, {landForm.location.lng.toFixed(6)}
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            Latitude: {landForm.location.lat.toFixed(6)} | Longitude: {landForm.location.lng.toFixed(6)}
                          </p>
                          {landForm.location.lat < -90 || landForm.location.lat > 90 || 
                           landForm.location.lng < -180 || landForm.location.lng > 180 ? (
                            <p className="text-xs text-red-600 mt-1 font-medium">
                              ⚠️ Invalid coordinates detected! Please reselect location.
                            </p>
                          ) : (
                            <p className="text-xs text-green-600 mt-1">
                              ✅ Valid coordinates
                            </p>
                          )}
                        </div>
                      )}

                      {/* OpenStreetMap Integration */}
                      <div className="relative">
                        <div className="mb-2 flex items-center gap-2">
                          <Globe className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">OpenStreetMap - Free & Unlimited</span>
                        </div>
                        <OpenStreetMapIntegration
                          onLandSelected={(landData) => {
                            console.log('Land data received:', landData);
                            
                            // Validate coordinates before setting
                            if (landData.location && 
                                landData.location.lat >= -90 && landData.location.lat <= 90 && 
                                landData.location.lng >= -180 && landData.location.lng <= 180) {
                              
                              setLandForm(prev => ({
                                ...prev,
                                name: landData.name,
                                location: landData.location,
                                size: landData.acres.toString()
                              }));
                              setDrawnShape({
                                type: landData.type,
                                area: landData.area,
                                acres: landData.acres,
                                coordinates: landData.coordinates
                              });
                              
                              console.log('Valid coordinates set:', landData.location);
                            } else {
                              console.error('Invalid coordinates received:', landData.location);
                              alert('Invalid coordinates received. Please try selecting the location again.');
                            }
                          }}
                          selectedLand={selectedLand}
                          onBack={() => setShowAddLand(false)}
                        />
                      </div>

                      {drawnShape && (
                        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-green-800 font-medium">
                                <strong>Estimated area:</strong> {drawnShape.acres ? drawnShape.acres.toFixed(2) : '0'} acres
                              </p>
                              <p className="text-xs text-green-600 mt-1">
                                {drawnShape.type === 'rectangle' && 'Rectangle area calculated'}
                                {drawnShape.type === 'polygon' && 'Polygon area calculated'}
                                {drawnShape.type === 'point' && 'Point selection (1 acre default)'}
                              </p>
                              {drawnShape.area && (
                                <p className="text-xs text-green-600">
                                  Square meters: {drawnShape.area.toFixed(0)} m²
                                </p>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-green-600 mt-2">
                            This will be used as the land size. You can also enter a manual size above.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => setShowAddLand(false)}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Save size={16} />
                        Save Land
                      </motion.button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Crop Suggestions Modal */}
        <AnimatePresence>
          {showAISuggestions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <Sparkles className="text-green-600" size={24} />
                      AI Crop Recommendations
                    </h2>
                    <button
                      onClick={() => setShowAISuggestions(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  {isLoadingAI ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                      <p className="mt-4 text-gray-600">Getting AI recommendations...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {aiSuggestions.map((crop, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-xl p-4 hover:shadow-lg transition-all"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <Crop className="text-green-600" size={20} />
                            <h3 className="font-semibold text-gray-900">{crop.name}</h3>
                          </div>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p><strong>Duration:</strong> {crop.duration}</p>
                            <p><strong>Water:</strong> {crop.water_requirement}</p>
                            <p><strong>Benefits:</strong> {crop.benefits}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end mt-6">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowAISuggestions(false)}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Got it!
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EnhancedLandManagement; 