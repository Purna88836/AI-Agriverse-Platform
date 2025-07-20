import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Calendar from 'react-calendar';
import { 
  Leaf, 
  Calendar as CalendarIcon, 
  Clock, 
  Droplets, 
  Sun, 
  Zap,
  CheckCircle,
  ArrowRight,
  MapPin,
  Thermometer
} from 'lucide-react';

const EnhancedCropPlanning = ({ selectedLand, onBack }) => {
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [region, setRegion] = useState('');
  const [cropSuggestions, setCropSuggestions] = useState([]);
  const [farmingSchedule, setFarmingSchedule] = useState([]);

  // Mock crop data with region-specific suggestions
  const cropData = {
    'north-india': [
      {
        id: 1,
        name: 'Wheat',
        image: '🌾',
        benefits: ['High yield', 'Drought resistant', 'Good market price'],
        season: 'Rabi',
        duration: '120 days',
        waterNeeds: 'Medium',
        temperature: '20-25°C',
        description: 'Perfect for North Indian climate with good soil fertility'
      },
      {
        id: 2,
        name: 'Rice',
        image: '🌾',
        benefits: ['High demand', 'Good for rotation', 'Multiple varieties'],
        season: 'Kharif',
        duration: '150 days',
        waterNeeds: 'High',
        temperature: '25-35°C',
        description: 'Ideal for monsoon season with proper irrigation'
      },
      {
        id: 3,
        name: 'Sugarcane',
        image: '🎋',
        benefits: ['High value crop', 'Long shelf life', 'Good for industry'],
        season: 'Year-round',
        duration: '365 days',
        waterNeeds: 'High',
        temperature: '25-30°C',
        description: 'Excellent for commercial farming with good returns'
      }
    ],
    'south-india': [
      {
        id: 4,
        name: 'Coconut',
        image: '🥥',
        benefits: ['Multiple uses', 'Long life', 'High value'],
        season: 'Year-round',
        duration: '1825 days',
        waterNeeds: 'Medium',
        temperature: '25-35°C',
        description: 'Perfect for coastal regions with tropical climate'
      },
      {
        id: 5,
        name: 'Banana',
        image: '🍌',
        benefits: ['Quick harvest', 'High demand', 'Good profit'],
        season: 'Year-round',
        duration: '365 days',
        waterNeeds: 'High',
        temperature: '25-30°C',
        description: 'Ideal for tropical climate with good water availability'
      }
    ]
  };

  // Mock farming schedule data
  const scheduleData = {
    wheat: [
      { phase: 'Preparation', duration: '2 weeks', tasks: ['Soil testing', 'Land preparation', 'Seed selection'] },
      { phase: 'Sowing', duration: '1 week', tasks: ['Seed treatment', 'Sowing', 'Initial irrigation'] },
      { phase: 'Growth', duration: '8 weeks', tasks: ['Fertilization', 'Weeding', 'Pest control'] },
      { phase: 'Flowering', duration: '2 weeks', tasks: ['Irrigation', 'Fertilization', 'Monitoring'] },
      { phase: 'Harvesting', duration: '1 week', tasks: ['Harvest', 'Threshing', 'Storage'] }
    ],
    rice: [
      { phase: 'Nursery', duration: '3 weeks', tasks: ['Seed selection', 'Nursery preparation', 'Seedling care'] },
      { phase: 'Transplanting', duration: '1 week', tasks: ['Land preparation', 'Transplanting', 'Water management'] },
      { phase: 'Vegetative', duration: '6 weeks', tasks: ['Fertilization', 'Weeding', 'Water control'] },
      { phase: 'Reproductive', duration: '4 weeks', tasks: ['Panicle initiation', 'Flowering', 'Grain filling'] },
      { phase: 'Harvesting', duration: '2 weeks', tasks: ['Harvest', 'Drying', 'Storage'] }
    ]
  };

  // Detect region based on coordinates
  const detectRegion = (lat, lng) => {
    if (lat > 20) return 'north-india';
    return 'south-india';
  };

  useEffect(() => {
    if (selectedLand) {
      const detectedRegion = detectRegion(selectedLand.location.lat, selectedLand.location.lng);
      setRegion(detectedRegion);
      setCropSuggestions(cropData[detectedRegion] || []);
    }
  }, [selectedLand]);

  // Handle crop selection
  const handleCropSelect = (crop) => {
    setSelectedCrop(crop);
    setFarmingSchedule(scheduleData[crop.name.toLowerCase()] || []);
    setShowTimeline(true);
  };

  // Get current month for timeline
  const getCurrentMonth = () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[new Date().getMonth()];
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
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Crop Planning</h1>
              <p className="text-gray-600">
                {selectedLand?.name} • {region.replace('-', ' ').toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {!showTimeline ? (
            <motion.div
              key="crop-selection"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Region Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-6 shadow-lg"
              >
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="text-blue-600" size={24} />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Region: {region.replace('-', ' ').toUpperCase()}
                  </h2>
                </div>
                <p className="text-gray-600">
                  Based on your land location, here are the best crops for your region and current season.
                </p>
              </motion.div>

              {/* Crop Suggestions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Recommended Crops for {getCurrentMonth()}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cropSuggestions.map((crop, index) => (
                    <motion.div
                      key={crop.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleCropSelect(crop)}
                      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 group"
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-4xl">{crop.image}</div>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-green-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ArrowRight size={20} />
                          </motion.div>
                        </div>
                        
                        <h4 className="text-xl font-semibold text-gray-900 mb-2">{crop.name}</h4>
                        <p className="text-gray-600 text-sm mb-4">{crop.description}</p>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CalendarIcon size={14} />
                            <span>{crop.season} • {crop.duration}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Droplets size={14} />
                            <span>Water: {crop.waterNeeds}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Thermometer size={14} />
                            <span>{crop.temperature}</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-700">Benefits:</p>
                          {crop.benefits.map((benefit, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                              <CheckCircle size={12} className="text-green-500" />
                              {benefit}
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
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
                  <div className="text-4xl">{selectedCrop?.image}</div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedCrop?.name}</h2>
                    <p className="text-gray-600">{selectedCrop?.description}</p>
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
                    <p className="text-sm font-medium text-gray-900">{selectedCrop?.waterNeeds}</p>
                    <p className="text-xs text-gray-600">Water Needs</p>
                  </div>
                  <div className="text-center">
                    <Sun className="mx-auto text-blue-600 mb-2" size={20} />
                    <p className="text-sm font-medium text-gray-900">{selectedCrop?.season}</p>
                    <p className="text-xs text-gray-600">Season</p>
                  </div>
                  <div className="text-center">
                    <Thermometer className="mx-auto text-blue-600 mb-2" size={20} />
                    <p className="text-sm font-medium text-gray-900">{selectedCrop?.temperature}</p>
                    <p className="text-xs text-gray-600">Temperature</p>
                  </div>
                </div>
              </motion.div>

              {/* Farming Timeline */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Farming Timeline</h3>
                
                <div className="space-y-6">
                  {farmingSchedule.map((phase, index) => (
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
                        {/* Phase Icon */}
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <Zap className="text-green-600" size={20} />
                          </div>
                        </div>
                        
                        {/* Phase Content */}
                        <div className="flex-1 bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{phase.phase}</h4>
                            <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded">
                              {phase.duration}
                            </span>
                          </div>
                          
                          <div className="space-y-1">
                            {phase.tasks.map((task, taskIndex) => (
                              <div key={taskIndex} className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                {task}
                              </div>
                            ))}
                          </div>
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
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Start Planning
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EnhancedCropPlanning; 