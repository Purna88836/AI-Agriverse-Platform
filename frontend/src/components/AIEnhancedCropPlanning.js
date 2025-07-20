import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Leaf, 
  Camera, 
  Calendar as CalendarIcon, 
  MessageCircle,
  Activity,
  Droplets,
  Thermometer,
  Sun,
  Clock,
  ArrowLeft,
  ArrowRight,
  Plus,
  CheckCircle,
  AlertTriangle,
  XCircle,
  History,
  Shield,
  Save,
  Loader2,
  Zap,
  Brain,
  Eye,
  Wind,
  Cloud
} from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Simple debounce function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const AIEnhancedCropPlanning = ({ selectedLand, onBack, onScheduleSaved, historicalData }) => {
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [region, setRegion] = useState('');
  const [cropSuggestions, setCropSuggestions] = useState([]);
  const [farmingSchedule, setFarmingSchedule] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);
  const [generatingCropId, setGeneratingCropId] = useState(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [soilType, setSoilType] = useState(selectedLand?.soil_type || 'loam');
  const [season, setSeason] = useState('spring');
  const [isShowingAISuggestions, setIsShowingAISuggestions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [activationOption, setActivationOption] = useState('fresh');
  
  // Add a ref to track save requests
  const saveRequestRef = useRef(null);

  // Handle historical data when "Use Again" is clicked
  useEffect(() => {
    if (historicalData) {
      console.log('Loading historical data:', historicalData);
      setSoilType(historicalData.soil_type);
      setSeason(historicalData.season);
      setCropSuggestions(historicalData.crop_suggestions);
      setIsShowingAISuggestions(false); // This is historical data, not AI suggestions
      // Clear any existing timeline view
      setShowTimeline(false);
      setSelectedCrop(null);
      setFarmingSchedule([]);
    }
  }, [historicalData]);

  // Don't auto-fetch suggestions - wait for user to click "Start Planning"
  useEffect(() => {
    // Only fetch if explicitly requested (not on page load)
  }, [selectedLand, weatherData, historicalData]);

  // Get current season based on month
  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  };

  // Fetch weather data
  const fetchWeatherData = async () => {
    if (!selectedLand) return;
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/weather/${selectedLand.location.lat}/${selectedLand.location.lng}`
      );
      if (response.ok) {
        const data = await response.json();
        setWeatherData(data);
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
    }
  };

  // Get AI-powered crop suggestions
  const fetchCropSuggestions = async () => {
    if (!selectedLand) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/crop-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          latitude: selectedLand.location.lat,
          longitude: selectedLand.location.lng,
          soil_type: soilType,
          season: season,
          temperature: weatherData?.temperature,
          humidity: weatherData?.humidity
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Backend returns array directly, not wrapped in suggestions object
        setCropSuggestions(Array.isArray(data) ? data : []);
        setIsShowingAISuggestions(true); // Mark that these are fresh AI suggestions
      }
    } catch (error) {
      console.error('Error fetching crop suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate AI-powered schedule OR load historical data
  const generateSchedule = async (crop = null) => {
    const targetCrop = crop || selectedCrop;
    if (!targetCrop || !selectedLand) return;
    
    console.log('🔧 Starting generate schedule process...');
    console.log('📋 Target crop:', targetCrop);
    console.log('📚 Historical data:', historicalData);
    console.log('🤖 Is showing AI suggestions:', isShowingAISuggestions);
    console.log('🔄 Use Again option:', historicalData?.useAgainOption);
    
    setIsGeneratingSchedule(true);
    setGeneratingCropId(targetCrop.name);
    
    try {
      // If we have historical data and we're not showing AI suggestions, use historical data
      if (historicalData && !isShowingAISuggestions) {
        console.log('📚 Using historical data for schedule');
        setSelectedCrop(targetCrop);
        
        // Handle different useAgain options
        const useAgainOption = historicalData.useAgainOption || 'fresh';
        console.log('🔄 Processing useAgain option:', useAgainOption);
        
        // Check if a schedule already exists for this crop
        console.log('🔍 Checking for existing schedule...');
        console.log('🔍 Parameters:', {
          land_id: selectedLand.id,
          crop_name: targetCrop.name,
          soil_type: soilType,
          season: season
        });
        
        const checkResponse = await fetch(
          `${API_BASE_URL}/api/check-existing-schedule?land_id=${selectedLand.id}&crop_name=${targetCrop.name}&soil_type=${soilType}&season=${season}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          console.log('📋 Check response data:', checkData);
          
          if (checkData.exists) {
            // Use existing schedule with task reset based on option
            console.log('✅ Found existing schedule, processing with option:', useAgainOption);
            setSelectedCrop(targetCrop);
            
            let processedSchedule = checkData.schedule.schedule || [];
            
            // Apply task reset logic based on useAgain option
            if (useAgainOption === 'fresh') {
              // Reset all tasks
              processedSchedule = processedSchedule.map(task => ({
                ...task,
                completed: false,
                skipped: false,
                completed_at: null
              }));
              console.log('🔄 Fresh start: All tasks reset');
            } else if (useAgainOption === 'continue') {
              // Keep all task states as they are
              console.log('🔄 Continue progress: Keeping all task states');
            } else if (useAgainOption === 'smart') {
              // Keep completed tasks, reset only pending/skipped
              processedSchedule = processedSchedule.map(task => ({
                ...task,
                completed: task.completed, // Keep completed
                skipped: false, // Reset skipped
                completed_at: task.completed ? task.completed_at : null
              }));
              console.log('🔄 Smart reset: Keep completed, reset pending/skipped');
            } else if (useAgainOption === 'custom') {
              // For now, treat as fresh start (custom selection would need more UI)
              processedSchedule = processedSchedule.map(task => ({
                ...task,
                completed: false,
                skipped: false,
                completed_at: null
              }));
              console.log('🔄 Custom selection: Treating as fresh start for now');
            }
            
            setFarmingSchedule(processedSchedule);
            setShowTimeline(true);
            
            const optionMessages = {
              'fresh': 'Fresh start with all tasks reset',
              'continue': 'Continuing from previous progress',
              'smart': 'Smart reset - keeping completed tasks',
              'custom': 'Custom selection applied'
            };
            
            const message = `Found existing schedule for ${targetCrop.name}! ${optionMessages[useAgainOption] || 'Fresh start applied'}`;
            alert(message);
            return;
          } else {
            console.log('❌ No existing schedule found, will generate new one');
          }
        } else {
          console.log('❌ Failed to check for existing schedule');
        }
      }
      
      // Generate new AI schedule
      console.log('🤖 Generating new AI schedule...');
      const response = await fetch(`${API_BASE_URL}/api/generate-schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          crop_name: targetCrop.name,
          land_id: selectedLand.id,
          start_date: startDate
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedCrop(targetCrop);
        setFarmingSchedule(data.schedule || []);
        setShowTimeline(true);
        
        // Show appropriate message based on data source
        const message = historicalData && !isShowingAISuggestions 
          ? `New schedule generated for ${targetCrop.name} using historical crop data!`
          : `New AI schedule generated successfully for ${targetCrop.name}!`;
        alert(message);
      } else {
        const errorData = await response.json();
        alert(`Failed to generate schedule: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error generating schedule:', error);
      alert('Failed to generate schedule. Please try again.');
    } finally {
      setIsGeneratingSchedule(false);
      setGeneratingCropId(null);
    }
  };

  // Show activation modal with simple options
  const showActivationOptions = () => {
    setShowActivationModal(true);
  };

  // Activate any schedule (new AI-generated or historical)
  const activateSchedule = async () => {
    if (!selectedCrop || !selectedLand) return;
    
    // Prevent multiple saves with a more robust check using ref
    if (isSaving || saveRequestRef.current) {
      console.log('🔄 Activation already in progress, ignoring duplicate call');
      return;
    }
    
    // Generate unique request ID
    const requestId = `activate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    saveRequestRef.current = requestId;
    
    console.log('🔧 Starting activate schedule process...');
    console.log('🆔 Request ID:', requestId);
    console.log('📋 Selected crop:', selectedCrop);
    console.log('🏞️ Selected land:', selectedLand);
    console.log('📚 Historical data:', historicalData);
    console.log('🤖 Is showing AI suggestions:', isShowingAISuggestions);
    console.log('🔄 Activation option:', activationOption);
    console.log('⏰ Current timestamp:', new Date().toISOString());
    
    setIsSaving(true);
    setShowActivationModal(false);
    
    try {
      // Prepare request body for activation
      const requestBody = {
        land_id: selectedLand.id,
        crop_name: selectedCrop.name,
        request_id: requestId, // Add unique request ID
        activation_option: activationOption // Add activation option
      };
      
      console.log('📤 Request body:', requestBody);
      
      console.log('📡 Making API request to activate schedule...');
      const response = await fetch(`${API_BASE_URL}/api/save-schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Activate successful, response data:', data);
        const message = historicalData && !isShowingAISuggestions 
          ? `Historical schedule for ${selectedCrop.name} activated!`
          : `Schedule for ${selectedCrop.name} activated successfully!`;
        alert(message);
        
        // Call the callback to refresh the dashboard with a delay to ensure backend processing
        if (onScheduleSaved) {
          setTimeout(() => {
            console.log('🔄 Calling onScheduleSaved callback to refresh dashboard');
            onScheduleSaved();
          }, 1000);
        }
        
        // Navigate back to dashboard
        setTimeout(() => {
          onBack();
        }, 1500);
      } else {
        const errorData = await response.json();
        console.error('❌ Activate failed, error data:', errorData);
        alert(`Failed to activate schedule: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error activating schedule:', error);
      alert('Failed to activate schedule. Please try again.');
    } finally {
      setIsSaving(false);
      saveRequestRef.current = null; // Clear the ref
    }
  };

  useEffect(() => {
    setSeason(getCurrentSeason());
    if (selectedLand) {
      fetchWeatherData();
    }
  }, [selectedLand]);

  // Remove auto-fetching on weather data change
  useEffect(() => {
    // Weather data loaded, but don't auto-fetch suggestions
  }, [weatherData, soilType, season]);

  // Handle crop selection
  const handleCropSelect = (crop) => {
    setSelectedCrop(crop);
    setShowTimeline(false);
  };

  // Get current month for timeline
  const getCurrentMonth = () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[new Date().getMonth()];
  };

  // Get weather icon
  const getWeatherIcon = (iconCode) => {
    const iconMap = {
      '01d': '☀️', '01n': '🌙', '02d': '⛅', '02n': '☁️',
      '03d': '☁️', '03n': '☁️', '04d': '☁️', '04n': '☁️',
      '09d': '🌧️', '09n': '🌧️', '10d': '🌦️', '10n': '🌧️',
      '11d': '⛈️', '11n': '⛈️', '13d': '🌨️', '13n': '🌨️',
      '50d': '🌫️', '50n': '🌫️'
    };
    return iconMap[iconCode] || '🌤️';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Enhanced Header with Gradient */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-white via-purple-50 to-green-50 shadow-lg border-b border-gray-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-6">
            <motion.button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-white rounded-xl transition-all duration-300 border border-gray-200 hover:border-purple-300 hover:shadow-md"
              whileHover={{ scale: 1.02, x: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-semibold">Back to Land</span>
            </motion.button>
            
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Brain className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">
                    AI Crop Planning
                  </h1>
                  <p className="text-gray-600 flex items-center gap-2 mt-1">
                    <span className="font-semibold text-gray-800">{selectedLand?.name}</span>
                    <span className="text-purple-400">•</span>
                    <span className="text-purple-600">AI-Powered Recommendations</span>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 text-sm">
                <div className="flex items-center gap-2 bg-purple-100 px-3 py-2 rounded-full">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span className="font-medium text-purple-700">Planning</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Data Source Indicators */}
        {historicalData && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <History className="text-white" size={20} />
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-blue-900 mb-1">
                  📋 Historical Crop Planning Data
                </p>
                <p className="text-sm text-blue-700 mb-2">
                  {historicalData.soil_type} soil • {historicalData.season} season • {historicalData.crop_suggestions.length} crops
                </p>
                {historicalData.useAgainOption && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                      🔄 {historicalData.useAgainOption === 'fresh' ? 'Fresh Start' : 
                          historicalData.useAgainOption === 'continue' ? 'Continue Progress' :
                          historicalData.useAgainOption === 'smart' ? 'Smart Reset' :
                          historicalData.useAgainOption === 'custom' ? 'Custom Selection' : 'Unknown'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setHistoricalData(null);
                    setCropSuggestions([]);
                    setSoilType(selectedLand?.soil_type || 'loam');
                    setSeason('spring');
                    setIsShowingAISuggestions(false);
                  }}
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors text-sm font-medium"
                >
                  Clear & Start Fresh
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setHistoricalData(null);
                    fetchCropSuggestions();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Get Fresh AI Suggestions
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {isShowingAISuggestions && !historicalData && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Brain className="text-white" size={20} />
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-green-900 mb-1">
                  🤖 Fresh AI Crop Suggestions
                </p>
                <p className="text-sm text-green-700">
                  {soilType} soil • {season} season • {cropSuggestions.length} crops
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setCropSuggestions([]);
                  setIsShowingAISuggestions(false);
                }}
                className="px-4 py-2 bg-white text-green-600 rounded-lg border border-green-200 hover:bg-green-50 transition-colors text-sm font-medium"
              >
                Clear & Start Over
              </motion.button>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {!showTimeline ? (
            <motion.div
              key="crop-selection"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Enhanced Weather & Soil Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Brain className="text-white" size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      AI Analysis Parameters
                    </h2>
                    <p className="text-gray-600">Environmental factors and land conditions</p>
                  </div>
                </div>
                
                {/* Enhanced Weather Data Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {weatherData && (
                    <>
                      <motion.div 
                        whileHover={{ scale: 1.05, y: -5 }}
                        className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 shadow-lg"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                          <Thermometer className="text-white" size={24} />
                        </div>
                        <p className="text-2xl font-bold text-gray-900 mb-1">{weatherData.temperature}°C</p>
                        <p className="text-sm text-gray-600 font-medium">Temperature</p>
                      </motion.div>
                      <motion.div 
                        whileHover={{ scale: 1.05, y: -5 }}
                        className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200 shadow-lg"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                          <Droplets className="text-white" size={24} />
                        </div>
                        <p className="text-2xl font-bold text-gray-900 mb-1">{weatherData.humidity}%</p>
                        <p className="text-sm text-gray-600 font-medium">Humidity</p>
                      </motion.div>
                      <motion.div 
                        whileHover={{ scale: 1.05, y: -5 }}
                        className="text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 shadow-lg"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                          <Wind className="text-white" size={24} />
                        </div>
                        <p className="text-2xl font-bold text-gray-900 mb-1">{weatherData.wind_speed} m/s</p>
                        <p className="text-sm text-gray-600 font-medium">Wind Speed</p>
                      </motion.div>
                      <motion.div 
                        whileHover={{ scale: 1.05, y: -5 }}
                        className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl border border-yellow-200 shadow-lg"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                          <Cloud className="text-white" size={24} />
                        </div>
                        <p className="text-3xl mb-1">{getWeatherIcon(weatherData.icon)}</p>
                        <p className="text-sm text-gray-600 font-medium">{weatherData.description}</p>
                      </motion.div>
                    </>
                  )}
                </div>

                {/* Enhanced Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Soil Type
                    </label>
                    <select
                      value={soilType}
                      onChange={(e) => setSoilType(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                      <option value="loam">Loam</option>
                      <option value="clay">Clay</option>
                      <option value="sandy">Sandy</option>
                      <option value="silt">Silt</option>
                      <option value="black">Black Soil</option>
                      <option value="red">Red Soil</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Season
                    </label>
                    <select
                      value={season}
                      onChange={(e) => setSeason(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                      <option value="spring">Spring</option>
                      <option value="summer">Summer</option>
                      <option value="autumn">Autumn</option>
                      <option value="winter">Winter</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Location
                    </label>
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                        <MapPin className="text-white" size={16} />
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {selectedLand?.location.lat.toFixed(4)}, {selectedLand?.location.lng.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Enhanced AI Crop Suggestions */}
              <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Brain className="text-white" size={24} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        AI-Powered Crop Suggestions
                        {historicalData && (
                          <span className="text-sm font-normal text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                            Historical Data
                          </span>
                        )}
                      </h3>
                      <p className="text-gray-600">Intelligent recommendations based on your land conditions</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {historicalData && !isLoading && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={fetchCropSuggestions}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center gap-2 shadow-lg"
                      >
                        <Zap size={16} />
                        Get Fresh Suggestions
                      </motion.button>
                    )}
                    {isLoading && (
                      <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-xl">
                        <Loader2 className="animate-spin" size={16} />
                        <span className="font-medium">Analyzing conditions...</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {isLoading ? (
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-12 text-center border border-purple-200">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <Loader2 className="animate-spin text-white" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">AI Analysis in Progress</h3>
                    <p className="text-gray-600">Analyzing your land conditions and generating personalized crop recommendations...</p>
                  </div>
                ) : cropSuggestions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cropSuggestions.map((crop, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleCropSelect(crop)}
                        className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-100 group overflow-hidden"
                      >
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-6">
                            <div className="text-5xl">🌾</div>
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.2 }}
                              className="text-green-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <ArrowRight size={24} />
                            </motion.div>
                          </div>
                          
                          <h4 className="text-xl font-bold text-gray-900 mb-3">{crop.name}</h4>
                          <p className="text-gray-600 text-sm mb-6 leading-relaxed">{crop.benefits}</p>
                          
                          <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <CalendarIcon size={16} className="text-blue-600" />
                              </div>
                              <span className="font-medium">{crop.duration}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <Droplets size={16} className="text-green-600" />
                              </div>
                              <span className="font-medium">Water: {crop.water_needs}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <Sun size={16} className="text-yellow-600" />
                              </div>
                              <span className="font-medium">Planting: {crop.planting_time}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Activity size={16} className="text-purple-600" />
                              </div>
                              <span className="font-medium">Yield: {crop.yield_potential}</span>
                            </div>
                          </div>
                          
                          {/* Enhanced Action Buttons */}
                          <div className="space-y-3">
                            {isShowingAISuggestions ? (
                              <motion.button
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => generateSchedule(crop)}
                                disabled={generatingCropId !== null}
                                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-semibold shadow-lg"
                              >
                                {generatingCropId === crop.name ? (
                                  <>
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    >
                                      <Loader2 size={16} />
                                    </motion.div>
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <Zap size={16} />
                                    Generate Schedule
                                  </>
                                )}
                              </motion.button>
                            ) : (
                              <motion.button
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCropSelect(crop);
                                  generateSchedule(crop);
                                }}
                                disabled={generatingCropId !== null}
                                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-3 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-semibold shadow-lg"
                              >
                                {generatingCropId === crop.name ? (
                                  <>
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    >
                                      <Loader2 size={16} />
                                    </motion.div>
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <Eye size={16} />
                                    Review Schedule
                                  </>
                                )}
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-12 text-center border border-green-200">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <div className="text-4xl">🌾</div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Ready to Start Planning?</h3>
                    <p className="text-gray-600 mb-8 text-lg">Get AI-powered crop recommendations based on your land conditions</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={fetchCropSuggestions}
                      className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 flex items-center gap-3 mx-auto text-lg font-semibold shadow-lg"
                    >
                      <Brain size={20} />
                      Start Planning
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Schedule Generation */}
              {selectedCrop && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl p-6 shadow-lg"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                            Generate Schedule for {selectedCrop.name}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex items-end">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={generateSchedule}
                        disabled={!startDate || isGeneratingSchedule}
                        className="w-full bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isGeneratingSchedule ? (
                          <>
                            <Loader2 className="animate-spin" size={16} />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Zap size={16} />
                            Generate Schedule
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Selected Crop Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-6 shadow-lg"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl">🌾</div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedCrop?.name}</h2>
                    <p className="text-gray-600">
                      Farming Schedule
                    </p>
                    {!isShowingAISuggestions && (
                      <p className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded mt-1 inline-block">
                        📋 From saved historical data
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <Clock className="mx-auto text-blue-600 mb-2" size={20} />
                    <p className="text-sm font-medium text-gray-900">{selectedCrop?.duration}</p>
                    <p className="text-xs text-gray-600">Duration</p>
                  </div>
                  <div className="text-center">
                    <Droplets className="mx-auto text-blue-600 mb-2" size={20} />
                    <p className="text-sm font-medium text-gray-900">{selectedCrop?.water_needs}</p>
                    <p className="text-xs text-gray-600">Water Needs</p>
                  </div>
                  <div className="text-center">
                    <Sun className="mx-auto text-blue-600 mb-2" size={20} />
                    <p className="text-sm font-medium text-gray-900">{selectedCrop?.planting_time}</p>
                    <p className="text-xs text-gray-600">Planting Time</p>
                  </div>
                  <div className="text-center">
                    <Activity className="mx-auto text-blue-600 mb-2" size={20} />
                    <p className="text-sm font-medium text-gray-900">{selectedCrop?.yield_potential}</p>
                    <p className="text-xs text-gray-600">Yield Potential</p>
                  </div>
                </div>
              </motion.div>

              {/* AI-Generated Timeline */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  {isShowingAISuggestions ? (
                    <>
                      <Brain className="text-purple-600" size={24} />
                      AI-Generated Farming Timeline
                    </>
                  ) : (
                    <>
                      <History className="text-blue-600" size={24} />
                      Historical Farming Timeline
                    </>
                  )}
                </h3>
                
                <div className="space-y-6">
                  {farmingSchedule.map((task, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative"
                    >
                      {/* Timeline Line */}
                      {index < farmingSchedule.length - 1 && (
                        <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200"></div>
                      )}
                      
                      <div className="flex gap-4">
                        {/* Task Icon */}
                        <div className="flex-shrink-0">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            task.priority === 'High' ? 'bg-red-100' : 
                            task.priority === 'Medium' ? 'bg-yellow-100' : 'bg-green-100'
                          }`}>
                            <Zap className={`${
                              task.priority === 'High' ? 'text-red-600' : 
                              task.priority === 'Medium' ? 'text-yellow-600' : 'text-green-600'
                            }`} size={20} />
                          </div>
                        </div>
                        
                        {/* Task Content */}
                        <div className="flex-1 bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{task.task}</h4>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded">
                                Day {task.day}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                task.priority === 'High' ? 'bg-red-100 text-red-800' : 
                                task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {task.priority}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                          <p className="text-xs text-gray-500">Phase: {task.phase}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowTimeline(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ← Back to Crops
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={showActivationOptions}
                  disabled={isSaving}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Save size={16} />
                  Activate Schedule
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Activation Modal */}
      {showActivationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 shadow-xl max-w-md w-full mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                🌾 Activate {selectedCrop?.name} Schedule
              </h3>
              <button
                onClick={() => setShowActivationModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Choose how to activate this schedule:
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="activationOption"
                  value="fresh"
                  checked={activationOption === 'fresh'}
                  onChange={(e) => setActivationOption(e.target.value)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900">Fresh Cycle</div>
                  <div className="text-xs text-gray-600">Start completely new cycle - all tasks reset</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="activationOption"
                  value="continue"
                  checked={activationOption === 'continue'}
                  onChange={(e) => setActivationOption(e.target.value)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900">Pick Where Left Off</div>
                  <div className="text-xs text-gray-600">Keep previous task completions, continue from where left off</div>
                </div>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowActivationModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={activateSchedule}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Activating...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Activate
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AIEnhancedCropPlanning; 