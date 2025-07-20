import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Upload, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  RotateCcw,
  Activity,
  Leaf,
  Droplets,
  Sun,
  Clock,
  Plus
} from 'lucide-react';

const EnhancedDiseaseDetection = ({ selectedLand, onBack, cropSchedules, onScheduleSaved }) => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState(null);
  const [cropName, setCropName] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedCropForPlan, setSelectedCropForPlan] = useState('');
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [showCustomCropInput, setShowCustomCropInput] = useState(false);
  const [customCropName, setCustomCropName] = useState('');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Mock disease data
  const mockDiseases = {
    'wheat': [
      {
        name: 'Leaf Blight',
        severity: 'Medium',
        confidence: 85,
        symptoms: ['Brown spots on leaves', 'Yellowing of leaf tips', 'Reduced growth'],
        treatment: [
          'Remove infected plant parts',
          'Apply fungicide treatment',
          'Improve air circulation',
          'Avoid overhead irrigation'
        ],
        prevention: [
          'Use disease-resistant varieties',
          'Maintain proper spacing',
          'Regular monitoring',
          'Crop rotation'
        ],
        image: '🍂'
      },
      {
        name: 'Rust Disease',
        severity: 'High',
        confidence: 92,
        symptoms: ['Orange-red pustules', 'Leaf yellowing', 'Stunted growth'],
        treatment: [
          'Apply systemic fungicides',
          'Remove infected plants',
          'Improve drainage',
          'Reduce humidity'
        ],
        prevention: [
          'Plant resistant varieties',
          'Avoid dense planting',
          'Regular fungicide application',
          'Monitor weather conditions'
        ],
        image: '🟠'
      }
    ],
    'rice': [
      {
        name: 'Bacterial Blight',
        severity: 'High',
        confidence: 88,
        symptoms: ['Wilting leaves', 'Yellow lesions', 'White bacterial ooze'],
        treatment: [
          'Remove infected plants',
          'Apply copper-based bactericides',
          'Improve field drainage',
          'Reduce nitrogen fertilization'
        ],
        prevention: [
          'Use certified seeds',
          'Maintain field hygiene',
          'Avoid excessive nitrogen',
          'Proper water management'
        ],
        image: '🦠'
      }
    ]
  };

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
        setCameraError('');
      }
    } catch (error) {
      console.error('Camera error:', error);
      setCameraError('Unable to access camera. Please check permissions.');
    }
  };

  // Capture photo
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      
      const imageData = canvasRef.current.toDataURL('image/jpeg');
      setCapturedImage(imageData);
      stopCamera();
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Analyze image
  const analyzeImage = async () => {
    if (!capturedImage || !cropName) return;
    
    setIsAnalyzing(true);
    
    try {
      // Convert base64 image (remove data:image/jpeg;base64, prefix)
      const base64Data = capturedImage.split(',')[1];
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001'}/api/detect-disease`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          image_base64: base64Data,
          crop_name: cropName,
          land_id: selectedLand?.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        setDiagnosis(data);
      } else {
        console.error('Disease detection failed');
        setDiagnosis({
          ai_diagnosis: 'Analysis failed. Please try again.',
          confidence: 0,
          recommendations: ['Please ensure the image is clear and try again.']
        });
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      setDiagnosis({
        ai_diagnosis: 'Network error. Please check your connection and try again.',
        confidence: 0,
        recommendations: ['Please check your internet connection and try again.']
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Reset analysis
  const resetAnalysis = () => {
    setCapturedImage(null);
    setDiagnosis(null);
    setCropName('');
    setCameraError('');
  };

  // Convert AI recommendations to actionable tasks
  const convertRecommendationsToTasks = (recommendations) => {
    const tasks = [];
    let dayCounter = 1;
    
    recommendations.forEach((recommendation, index) => {
      // Parse recommendation and create specific tasks
      const lowerRec = recommendation.toLowerCase();
      
      if (lowerRec.includes('fungicide') || lowerRec.includes('bactericide') || lowerRec.includes('chemical')) {
        tasks.push({
          day: dayCounter++,
          task: 'Apply Disease Treatment',
          description: recommendation,
          priority: 'High',
          phase: 'Disease Management',
          completed: false,
          skipped: false
        });
      } else if (lowerRec.includes('remove') || lowerRec.includes('sanitation') || lowerRec.includes('debris')) {
        tasks.push({
          day: dayCounter++,
          task: 'Field Sanitation',
          description: recommendation,
          priority: 'High',
          phase: 'Disease Management',
          completed: false,
          skipped: false
        });
      } else if (lowerRec.includes('drainage') || lowerRec.includes('water') || lowerRec.includes('irrigation')) {
        tasks.push({
          day: dayCounter++,
          task: 'Improve Water Management',
          description: recommendation,
          priority: 'Medium',
          phase: 'Disease Management',
          completed: false,
          skipped: false
        });
      } else if (lowerRec.includes('monitoring') || lowerRec.includes('scouting') || lowerRec.includes('detect')) {
        tasks.push({
          day: dayCounter++,
          task: 'Disease Monitoring',
          description: recommendation,
          priority: 'Medium',
          phase: 'Disease Management',
          completed: false,
          skipped: false
        });
      } else if (lowerRec.includes('spacing') || lowerRec.includes('circulation') || lowerRec.includes('air')) {
        tasks.push({
          day: dayCounter++,
          task: 'Improve Air Circulation',
          description: recommendation,
          priority: 'Medium',
          phase: 'Disease Management',
          completed: false,
          skipped: false
        });
      } else if (lowerRec.includes('fertilization') || lowerRec.includes('nitrogen') || lowerRec.includes('nutrient')) {
        tasks.push({
          day: dayCounter++,
          task: 'Adjust Fertilization',
          description: recommendation,
          priority: 'Medium',
          phase: 'Disease Management',
          completed: false,
          skipped: false
        });
      } else {
        // Generic task for other recommendations
        tasks.push({
          day: dayCounter++,
          task: 'Implement Disease Control',
          description: recommendation,
          priority: 'Medium',
          phase: 'Disease Management',
          completed: false,
          skipped: false
        });
      }
    });
    
    return tasks;
  };

  // Create disease management plan
  const createDiseaseManagementPlan = async () => {
    if (!selectedCropForPlan || !diagnosis) return;
    
    setIsCreatingPlan(true);
    
    try {
      // Convert recommendations to tasks
      const diseaseTasks = convertRecommendationsToTasks(diagnosis.recommendations);
      
      // Find the existing active schedule for the selected crop
      const existingSchedule = cropSchedules.find(schedule => 
        schedule.crop_name === selectedCropForPlan && schedule.active === true
      );
      
      if (existingSchedule) {
        // Integrate disease tasks into existing schedule
        console.log('🔗 Integrating disease tasks into existing schedule:', existingSchedule.id);
        
        const integrationData = {
          schedule_id: existingSchedule.id,
          disease_tasks: diseaseTasks,
          diagnosis: diagnosis.ai_diagnosis,
          confidence: diagnosis.confidence,
          integration_type: 'disease_management'
        };
        
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001'}/api/integrate-disease-tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(integrationData)
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Disease tasks integrated successfully:', result);
          alert(`Disease management tasks integrated into your existing ${selectedCropForPlan} schedule!`);
          
          // Refresh crop schedules
          if (onScheduleSaved) {
            onScheduleSaved();
          }
          
          setShowPlanModal(false);
          setSelectedCropForPlan('');
        } else {
          const errorData = await response.json();
          console.error('Backend error:', errorData);
          
          if (response.status === 401) {
            alert('Please log in to integrate disease management tasks.');
          } else if (response.status === 404) {
            alert('Backend service not available. Please check if the server is running.');
          } else {
            alert(`Failed to integrate tasks: ${errorData.detail || 'Unknown error'}`);
          }
        }
      } else {
        // No existing schedule found, create a new disease management plan
        console.log('🆕 No existing schedule found, creating new disease management plan');
        
        const planData = {
          land_id: selectedLand.id,
          crop_name: selectedCropForPlan,
          plan_type: 'disease_management',
          diagnosis: diagnosis.ai_diagnosis,
          confidence: diagnosis.confidence,
          schedule: diseaseTasks,
          start_date: new Date().toISOString().split('T')[0],
          active: true
        };
        
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001'}/api/disease-management-plan`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(planData)
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('New disease management plan created:', result);
          alert('New disease management plan created successfully!');
          
          // Refresh crop schedules
          if (onScheduleSaved) {
            onScheduleSaved();
          }
          
          setShowPlanModal(false);
          setSelectedCropForPlan('');
        } else {
          const errorData = await response.json();
          console.error('Backend error:', errorData);
          alert(`Failed to create plan: ${errorData.detail || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error creating disease management plan:', error);
      alert('Failed to create disease management plan. Please try again.');
    } finally {
      setIsCreatingPlan(false);
    }
  };

  // Get active crops from schedules
  const getActiveCrops = () => {
    console.log('🔍 getActiveCrops called with cropSchedules:', cropSchedules);
    
    if (!cropSchedules || cropSchedules.length === 0) {
      console.log('❌ No cropSchedules provided or empty array');
      return [];
    }
    
    const activeCrops = cropSchedules
      .filter(schedule => {
        console.log('🔍 Checking schedule:', schedule);
        console.log('🔍 Schedule active:', schedule.active);
        console.log('🔍 Schedule status:', schedule.status);
        // Check for active property (boolean) - this is the correct field
        return schedule.active === true;
      })
      .map(schedule => ({
        name: schedule.crop_name,
        displayName: `${schedule.crop_name} (Active)`,
        isActive: true
      }));
    
    console.log('✅ Active crops found:', activeCrops);
    return activeCrops;
  };

  // Handle crop selection
  const handleCropSelection = (value) => {
    if (value === 'custom') {
      setShowCustomCropInput(true);
      setCropName('');
    } else {
      setShowCustomCropInput(false);
      setCropName(value);
      setCustomCropName('');
    }
  };

  // Handle custom crop submission
  const handleCustomCropSubmit = () => {
    if (customCropName.trim()) {
      setCropName(customCropName.trim());
      setShowCustomCropInput(false);
    }
  };

  // Check if user is logged in
  const isLoggedIn = () => {
    return !!localStorage.getItem('token');
  };

  // Debug: Log cropSchedules when component receives them
  useEffect(() => {
    console.log('🔄 EnhancedDiseaseDetection received cropSchedules:', cropSchedules);
    if (cropSchedules && cropSchedules.length > 0) {
      console.log('📋 Total schedules:', cropSchedules.length);
      const activeCount = cropSchedules.filter(s => s.active === true).length;
      console.log('🌱 Active schedules:', activeCount);
      cropSchedules.forEach((schedule, index) => {
        console.log(`  ${index + 1}. ${schedule.crop_name} - active: ${schedule.active}, status: ${schedule.status}`);
      });
    }
  }, [cropSchedules]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Enhanced Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-lg border-b border-gray-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-6">
            <motion.button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200 border border-gray-200 hover:border-gray-300"
              whileHover={{ scale: 1.02, x: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back to Land</span>
            </motion.button>
            
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center">
                  <Camera className="text-red-600" size={24} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Crop Disease Detection</h1>
                  <p className="text-gray-600 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span className="font-semibold text-red-600">{selectedLand?.name}</span>
                    <span className="text-gray-400">•</span>
                    <span>AI-Powered Analysis</span>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                <span>Detection</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {!diagnosis ? (
            <motion.div
              key="capture"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Crop Selection */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                    <Leaf className="text-green-600" size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Select Crop Type</h2>
                </div>
                
                {/* Debug info for active crops */}
                {getActiveCrops().length > 0 ? (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-900">
                        🌱 Found {getActiveCrops().length} active crop(s) from your schedules
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm font-medium text-yellow-900">
                        ⚠️ No active crops found in your schedules
                      </span>
                    </div>
                    {/* Debug: Show raw data */}
                    {cropSchedules && cropSchedules.length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-yellow-700 cursor-pointer">Debug: Show cropSchedules data</summary>
                        <pre className="text-xs text-yellow-800 mt-1 bg-yellow-100 p-2 rounded overflow-auto max-h-32">
                          {JSON.stringify(cropSchedules, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                )}
                {cropName && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Leaf size={16} className="text-green-600" />
                      <span className="text-sm font-medium text-green-900">
                        Selected: {cropName}
                        {getActiveCrops().some(c => c.name === cropName) && (
                          <span className="ml-2 text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                            🌱 Active Crop
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                )}
                <select
                  value={cropName}
                  onChange={(e) => handleCropSelection(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Choose crop type</option>
                  
                  {/* Active crops from schedules */}
                  {getActiveCrops().length > 0 && (
                    <optgroup label="🌱 Active Crops">
                      {getActiveCrops().map((crop, index) => (
                        <option key={`active-${index}`} value={crop.name}>
                          {crop.displayName}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  
                  {/* Common crop types */}
                  <optgroup label="🌾 Common Crops">
                    <option value="wheat">Wheat</option>
                    <option value="rice">Rice</option>
                    <option value="corn">Corn</option>
                    <option value="soybeans">Soybeans</option>
                    <option value="cotton">Cotton</option>
                    <option value="tomato">Tomato</option>
                    <option value="potato">Potato</option>
                    <option value="onion">Onion</option>
                    <option value="cabbage">Cabbage</option>
                    <option value="carrot">Carrot</option>
                    <option value="pepper">Pepper</option>
                    <option value="cucumber">Cucumber</option>
                    <option value="lettuce">Lettuce</option>
                    <option value="spinach">Spinach</option>
                    <option value="okra">Okra</option>
                    <option value="eggplant">Eggplant</option>
                    <option value="beans">Beans</option>
                    <option value="peas">Peas</option>
                    <option value="squash">Squash</option>
                    <option value="pumpkin">Pumpkin</option>
                  </optgroup>
                  
                  {/* Custom crop option */}
                  <optgroup label="➕ Other">
                    <option value="custom">➕ Add Custom Crop</option>
                  </optgroup>
                </select>

                {showCustomCropInput && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Plus size={16} className="text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Add Custom Crop</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter crop name (e.g., Mango, Apple, etc.)"
                        value={customCropName}
                        onChange={(e) => setCustomCropName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleCustomCropSubmit()}
                        className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        autoFocus
                      />
                      <button
                        onClick={handleCustomCropSubmit}
                        disabled={!customCropName.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        <Plus size={14} />
                        Add
                      </button>
                    </div>
                    <p className="text-xs text-blue-700 mt-2">
                      💡 Tip: Enter the specific crop name for better AI analysis
                    </p>
                  </motion.div>
                )}
              </motion.div>

              {/* Image Capture */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100"
              >
                                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                      <Camera className="text-blue-600" size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Capture Crop Image</h2>
                  </div>
                
                {!capturedImage ? (
                  <div className="space-y-4">
                    {/* Camera Interface */}
                    {showCamera ? (
                      <div className="relative">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full h-64 object-cover rounded-lg bg-gray-100"
                        />
                        <canvas ref={canvasRef} className="hidden" />
                        
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={capturePhoto}
                            className="bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-colors"
                          >
                            <Camera size={24} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={stopCamera}
                            className="bg-red-600 text-white p-3 rounded-full shadow-lg hover:bg-red-700 transition-colors"
                          >
                            <X size={24} />
                          </motion.button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <div className="space-y-4">
                          <div className="text-6xl">📸</div>
                          <h3 className="text-lg font-medium text-gray-900">Capture Crop Image</h3>
                          <p className="text-gray-600">Take a photo of the affected crop area for AI analysis</p>
                          
                          <div className="flex justify-center gap-4">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={startCamera}
                              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <Camera size={20} />
                              Use Camera
                            </motion.button>
                            
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => fileInputRef.current?.click()}
                              className="flex items-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                            >
                              <Upload size={20} />
                              Upload Image
                            </motion.button>
                          </div>
                          
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </div>
                      </div>
                    )}
                    
                    {cameraError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-red-700">
                          <AlertTriangle size={16} />
                          {cameraError}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <img
                        src={capturedImage}
                        alt="Captured crop"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={resetAnalysis}
                        className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                      >
                        <RotateCcw size={16} />
                      </motion.button>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={analyzeImage}
                      disabled={isAnalyzing || !cropName}
                      className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Activity size={20} />
                          Analyze Image
                        </>
                      )}
                    </motion.button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="diagnosis"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Diagnosis Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">🔍</div>
                    <div>
                      <h2 className="text-2xl font-bold">AI Disease Analysis</h2>
                      <p className="text-red-100">Confidence: {diagnosis.confidence}%</p>
                    </div>
                  </div>
                </div>

                {/* AI Diagnosis */}
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Activity size={20} className="text-purple-600" />
                    AI Diagnosis
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-line">{diagnosis.ai_diagnosis}</p>
                  </div>
                </div>

                {/* Recommendations */}
                {diagnosis.recommendations && diagnosis.recommendations.length > 0 && (
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <CheckCircle size={20} className="text-green-600" />
                      Recommendations
                    </h3>
                    <div className="space-y-3">
                      {diagnosis.recommendations.map((recommendation, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-3 p-3 bg-green-50 rounded-lg"
                        >
                          <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <p className="text-gray-700">{recommendation}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetAnalysis}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ← New Analysis
                </motion.button>
                {isLoggedIn() ? (
                                  <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowPlanModal(true)}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Leaf size={16} />
                  Integrate Disease Tasks
                </motion.button>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      🔐 Please log in to create disease management plans
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Disease Management Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                🛡️ Integrate Disease Management Tasks
              </h3>
              <button
                onClick={() => setShowPlanModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Diagnosis Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">AI Diagnosis Summary</h4>
                <p className="text-sm text-blue-800">{diagnosis.ai_diagnosis}</p>
                <p className="text-xs text-blue-600 mt-2">Confidence: {diagnosis.confidence}%</p>
              </div>

              {/* Crop Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Crop to Integrate Disease Tasks
                </label>
                <select
                  value={selectedCropForPlan}
                  onChange={(e) => setSelectedCropForPlan(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Choose crop for plan</option>
                  {/* Show existing crops from schedules */}
                  {getActiveCrops().map((crop, index) => (
                    <option key={index} value={crop.name}>
                      {crop.displayName}
                    </option>
                  ))}
                  {/* Show the crop from current analysis if not in schedules */}
                  {cropName && !getActiveCrops().some(c => c.name === cropName) && (
                    <option value={cropName}>
                      {cropName} (New Plan)
                    </option>
                  )}
                </select>
              </div>

              {/* Generated Tasks Preview */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Disease Management Tasks to Add</h4>
                <p className="text-sm text-gray-600 mb-3">
                  These tasks will be added immediately to your existing crop schedule as high-priority disease management tasks. 
                  <span className="text-orange-600 font-medium">They are temporary and will be automatically removed once completed.</span>
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {diagnosis.recommendations && convertRecommendationsToTasks(diagnosis.recommendations).map((task, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {task.day === 0 ? 'NOW' : task.day}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{task.task}</p>
                        <p className="text-sm text-gray-600">{task.description}</p>
                        <div className="flex gap-2 mt-1">
                          <span className={`text-xs px-2 py-1 rounded ${
                            task.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {task.priority} Priority
                          </span>
                          <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                            {task.phase}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => setShowPlanModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createDiseaseManagementPlan}
                  disabled={!selectedCropForPlan || isCreatingPlan}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isCreatingPlan ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Integrating Tasks...
                    </>
                  ) : (
                    <>
                      <Leaf size={16} />
                      Integrate Tasks
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default EnhancedDiseaseDetection; 