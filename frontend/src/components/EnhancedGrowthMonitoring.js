import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Camera, 
  Upload, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Droplets,
  Sun,
  Thermometer,
  Wind,
  Cloud,
  BarChart3,
  Target,
  Leaf,
  Zap,
  Brain,
  Eye,
  Download,
  Share2,
  Plus,
  X,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  Minimize2,
  MessageCircle,
  RefreshCw
} from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const EnhancedGrowthMonitoring = ({ selectedLand, cropSchedules, onBack, onScheduleSaved }) => {
  const [currentView, setCurrentView] = useState('overview');
  const [growthData, setGrowthData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [showYieldAnalysis, setShowYieldAnalysis] = useState(false);
  const [yieldAnalysisData, setYieldAnalysisData] = useState(null);
  const [isAnalyzingYield, setIsAnalyzingYield] = useState(false);
  
  // New AI Analysis states
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [aiAnalysisData, setAiAnalysisData] = useState(null);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Get the most recent active crop schedule
  useEffect(() => {
    const active = cropSchedules
      .filter(schedule => schedule.active === true)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    setActiveSchedule(active);
  }, [cropSchedules]);

  // Fetch growth data
  const fetchGrowthData = async () => {
    if (!activeSchedule) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/growth-data/${activeSchedule.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setGrowthData(data);
      } else {
        // If no growth data exists, create mock data based on schedule
        createMockGrowthData();
      }
    } catch (error) {
      console.error('Error fetching growth data:', error);
      createMockGrowthData();
    } finally {
      setIsLoading(false);
    }
  };

  // Create mock growth data based on active schedule
  const createMockGrowthData = () => {
    if (!activeSchedule) return;

    const daysElapsed = activeSchedule.days_elapsed || 0;
    const totalDays = activeSchedule.schedule ? Math.max(...activeSchedule.schedule.map(t => t.day)) : 90;
    const progress = Math.min((daysElapsed / totalDays) * 100, 100);
    
    // Calculate health score based on completed tasks (no random variation)
    const completedTasks = activeSchedule.schedule ? activeSchedule.schedule.filter(t => t.completed).length : 0;
    const totalTasks = activeSchedule.schedule ? activeSchedule.schedule.length : 0;
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    // Base health score on task completion (realistic calculation)
    let healthScore = taskCompletionRate;
    if (taskCompletionRate >= 90) {
      healthScore = 95; // Excellent
    } else if (taskCompletionRate >= 80) {
      healthScore = 85; // Very good
    } else if (taskCompletionRate >= 70) {
      healthScore = 75; // Good
    } else if (taskCompletionRate >= 60) {
      healthScore = 65; // Fair
    } else if (taskCompletionRate >= 50) {
      healthScore = 55; // Poor
    } else {
      healthScore = 45; // Very poor
    }

    const mockData = {
      currentStage: getGrowthStage(daysElapsed),
      daysElapsed: daysElapsed,
      totalDays: totalDays,
      progress: progress,
      healthScore: Math.round(healthScore),
      growthRate: calculateGrowthRate(daysElapsed, progress),
      yieldPrediction: calculateYieldPrediction(healthScore, progress),
      weatherImpact: calculateWeatherImpact(),
      recommendations: [], // Removed fake recommendations - now using only AI-generated ones
      photos: [],
      measurements: generateMeasurements(daysElapsed),
      alerts: generateAlerts(daysElapsed, healthScore),
      trends: generateTrends(daysElapsed, progress)
    };

    setGrowthData(mockData);
  };

  // Get growth stage based on days elapsed
  const getGrowthStage = (days) => {
    if (days === 0) return 'Just Planted';
    if (days <= 7) return 'Germination';
    if (days <= 21) return 'Vegetative Growth';
    if (days <= 45) return 'Flowering';
    if (days <= 90) return 'Fruiting';
    return 'Harvest Ready';
  };

  // Calculate growth rate
  const calculateGrowthRate = (days, progress) => {
    if (days === 0) return 0;
    const rate = progress / days;
    return Math.min(rate, 2); // Cap at 2% per day
  };

  // Calculate yield prediction
  const calculateYieldPrediction = (healthScore, progress) => {
    const baseYield = 100; // kg per acre
    const healthMultiplier = healthScore / 100;
    const progressMultiplier = progress / 100;
    return Math.round(baseYield * healthMultiplier * progressMultiplier);
  };

  // Calculate yield percentage based on health score and risk level
  const calculateYieldPercentage = (healthScore, riskLevel) => {
    // Base yield percentage starts at health score
    let baseYieldPercentage = healthScore;
    
    // Adjust based on risk level
    switch (riskLevel?.toLowerCase()) {
      case 'low':
        // Low risk: boost yield by 5-10%
        baseYieldPercentage += Math.random() * 5 + 5;
        break;
      case 'medium':
        // Medium risk: slight reduction 0-5%
        baseYieldPercentage -= Math.random() * 5;
        break;
      case 'high':
        // High risk: significant reduction 10-20%
        baseYieldPercentage -= Math.random() * 10 + 10;
        break;
      default:
        // Unknown risk: no adjustment
        break;
    }
    
    // Ensure yield percentage is within reasonable bounds (50-100%)
    baseYieldPercentage = Math.max(50, Math.min(100, baseYieldPercentage));
    
    // Return as a range (e.g., 75-85%)
    const range = Math.round(Math.random() * 10 + 5); // 5-15% range
    const lowerBound = Math.round(baseYieldPercentage - range / 2);
    const upperBound = Math.round(baseYieldPercentage + range / 2);
    
    return `${lowerBound}-${upperBound}%`;
  };

  // Calculate weather impact
  const calculateWeatherImpact = () => {
    return {
      positive: ['Optimal temperature', 'Good rainfall'],
      negative: ['High humidity risk'],
      neutral: ['Normal wind conditions']
    };
  };

  // Generate AI recommendations
  // Removed fake generateRecommendations function - now using only AI-generated recommendations

  // Generate measurements
  const generateMeasurements = (days) => {
    const measurements = [];
    
    if (days > 0) {
      // Calculate realistic measurements based on days elapsed
      const baseHeight = 10 + (days * 0.5);
      const baseLeafCount = 4 + (days * 0.3);
      const baseHealthScore = 60 + (days * 0.5);
      
      measurements.push({
        date: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        height: Math.round(baseHeight),
        leafCount: Math.round(baseLeafCount),
        healthScore: Math.round(baseHealthScore)
      });
    }
    
    return measurements;
  };

  // Generate alerts
  const generateAlerts = (days, healthScore) => {
    const alerts = [];
    
    if (healthScore < 50) {
      alerts.push({
        type: 'critical',
        title: 'Low Health Score',
        message: 'Crop health is below optimal levels. Immediate attention required.',
        icon: '⚠️'
      });
    }
    
    if (days > 0 && days % 7 === 0) {
      alerts.push({
        type: 'info',
        title: 'Weekly Check Due',
        message: 'Time for weekly growth monitoring and photo documentation.',
        icon: '📸'
      });
    }
    
    return alerts;
  };

  // Generate trends
  const generateTrends = (days, progress) => {
    return {
      growth: 'increasing',
      health: days > 0 ? 'stable' : 'new',
      yield: 'promising',
      weather: 'favorable'
    };
  };

  // Fetch weather data
  const fetchWeatherData = async () => {
    if (!selectedLand?.location) return;
    
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

  // Photo capture and analysis
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg');
      setCapturedImage(imageData);
      setShowPhotoModal(false);
      analyzePhoto(imageData);
    }
  };

  // Analyze captured photo
  const analyzePhoto = async (imageData) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze-growth-photo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          image_base64: imageData,
          land_id: selectedLand.id,
          crop_name: activeSchedule?.crop_name
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setAnalysisResult(result);
      } else {
        // Mock analysis result
        setAnalysisResult({
          health_score: Math.round(70 + Math.random() * 20),
          growth_stage: getGrowthStage(activeSchedule?.days_elapsed || 0),
          issues: [],
          recommendations: ['Continue current care routine', 'Monitor for pests']
        });
      }
    } catch (error) {
      console.error('Error analyzing photo:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Analyze yield with user feedback
  const analyzeYield = async (yieldData) => {
    setIsAnalyzingYield(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze-yield`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          schedule_id: activeSchedule.id,
          current_yield_estimate: yieldData.currentYield,
          target_yield: yieldData.targetYield,
          concerns: yieldData.concerns,
          weather_conditions: yieldData.weatherConditions,
          soil_conditions: yieldData.soilConditions
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setYieldAnalysisData(result);
        setShowYieldAnalysis(true);
      } else {
        alert('Failed to analyze yield. Please try again.');
      }
    } catch (error) {
      console.error('Error analyzing yield:', error);
      alert('Error analyzing yield. Please try again.');
    } finally {
      setIsAnalyzingYield(false);
    }
  };

  // Comprehensive AI Farm Analysis
  const performAIAnalysis = async () => {
    if (!activeSchedule) return;
    
    // Clear previous AI analysis data when starting new analysis
    setAiAnalysisData(null);
    setShowAIAnalysis(false);
    
    setIsAnalyzingAI(true);
    try {
      // Prepare comprehensive data for AI analysis
      const analysisData = {
        land_id: selectedLand.id,
        schedule_id: activeSchedule.id,
        current_observations: growthData?.currentObservations || '',
        pesticide_usage: growthData?.pesticideUsage || '',
        additional_notes: growthData?.additionalNotes || '',
        // Add all active crop data
        crop_data: {
          name: activeSchedule.crop_name,
          current_stage: growthData?.currentStage || 'Unknown',
          days_elapsed: activeSchedule.days_elapsed || 0,
          health_score: growthData?.healthScore || 0,
          progress: growthData?.progress || 0,
          soil_type: selectedLand?.soil_type || 'Unknown',
          land_size: selectedLand?.size || 0
        },
        // Add all schedules with pending and completed tasks
        schedule_data: {
          total_tasks: activeSchedule.schedule?.length || 0,
          completed_tasks: activeSchedule.schedule?.filter(task => task.completed)?.length || 0,
          pending_tasks: activeSchedule.schedule?.filter(task => !task.completed && !task.skipped)?.length || 0,
          skipped_tasks: activeSchedule.schedule?.filter(task => task.skipped)?.length || 0,
          tasks: activeSchedule.schedule?.map(task => ({
            task: task.task,
            description: task.description,
            day: task.day,
            phase: task.phase,
            priority: task.priority,
            completed: task.completed,
            skipped: task.skipped,
            completed_at: task.completed_at
          })) || []
        },
        // Add weather data
        weather_data: weatherData || null,
        // Add growth measurements
        growth_measurements: growthData?.measurements || []
      };

      console.log('Sending AI analysis data:', analysisData);

      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      console.log('Using token:', token.substring(0, 20) + '...');

      const response = await fetch(`${API_BASE_URL}/api/ai-farm-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(analysisData)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ AI Analysis successful:', data);
        console.log('Number of action items received:', data.action_items?.length || 0);
        console.log('Action items:', data.action_items);
        
        // Save AI analysis data to localStorage for persistence
        if (selectedLand?.id) {
          const dataWithTimestamp = {
            ...data,
            analysis_timestamp: new Date().toISOString(),
            land_id: selectedLand.id
          };
          
          // Log detailed information about action items before saving
          console.log('🔍 Before saving to localStorage:');
          console.log('  - action_items length:', data.action_items?.length);
          console.log('  - action_items:', data.action_items);
          console.log('  - Full data structure:', data);
          
          const jsonString = JSON.stringify(dataWithTimestamp);
          console.log('  - JSON string length:', jsonString.length);
          
          localStorage.setItem(`ai_analysis_${selectedLand.id}`, jsonString);
          console.log('💾 AI Analysis data saved to localStorage with timestamp');
          
          // Verify what was saved
          const savedData = localStorage.getItem(`ai_analysis_${selectedLand.id}`);
          const parsedSavedData = JSON.parse(savedData);
          console.log('🔍 After saving to localStorage:');
          console.log('  - Saved action_items length:', parsedSavedData.action_items?.length);
          console.log('  - Saved action_items:', parsedSavedData.action_items);
        }
        
        setAiAnalysisData(data);
        setShowAIAnalysis(true);
      } else {
        const errorData = await response.json();
        console.error('AI Analysis failed:', errorData);
        
        if (response.status === 401) {
          alert('Authentication failed. Please log in again.');
          // Redirect to login or refresh token
        } else {
          alert(`AI Analysis failed: ${errorData.detail || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error performing AI analysis:', error);
      alert('Error performing AI analysis. Please try again.');
    } finally {
      setIsAnalyzingAI(false);
    }
  };





  // Initialize camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  // Load AI analysis data from localStorage on component mount
  useEffect(() => {
    if (selectedLand?.id) {
      const storedAnalysis = localStorage.getItem(`ai_analysis_${selectedLand.id}`);
      if (storedAnalysis) {
        try {
          const parsedData = JSON.parse(storedAnalysis);
          
          // Check if analysis is too old (more than 7 days)
          if (parsedData.analysis_timestamp) {
            const analysisDate = new Date(parsedData.analysis_timestamp);
            const now = new Date();
            const daysDiff = (now - analysisDate) / (1000 * 60 * 60 * 24);
            
            if (daysDiff > 7) {
              console.log('🗑️ AI analysis data is too old, clearing...');
              localStorage.removeItem(`ai_analysis_${selectedLand.id}`);
              return;
            }
          }
          
          // Log detailed information about loaded data
          console.log('📂 Loaded AI analysis data from localStorage:');
          console.log('  - action_items length:', parsedData.action_items?.length);
          console.log('  - action_items:', parsedData.action_items);
          console.log('  - Full parsed data:', parsedData);
          
          setAiAnalysisData(parsedData);
          setShowAIAnalysis(true);
        } catch (error) {
          console.error('Error parsing stored AI analysis:', error);
        }
      }
    }
  }, [selectedLand?.id]);

  useEffect(() => {
    const initializeGrowthMonitoring = async () => {
      await fetchGrowthData();
      await fetchWeatherData();
      // Don't auto-trigger AI analysis - let user click the button
    };
    
    initializeGrowthMonitoring();
  }, [activeSchedule]);

  useEffect(() => {
    if (showPhotoModal) {
      startCamera();
    }
  }, [showPhotoModal]);

  if (!activeSchedule) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Leaf className="text-gray-400" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Active Crop</h2>
          <p className="text-gray-600 mb-6">Start a crop schedule to begin growth monitoring</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Back to Dashboard
          </motion.button>
        </div>
      </div>
    );
  }

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
              <span className="font-medium">Back to Dashboard</span>
            </motion.button>
            
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                  <Activity className="text-blue-600" size={24} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Growth Monitoring</h1>
                  <p className="text-gray-600 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span className="font-semibold text-blue-600">{activeSchedule.crop_name}</span>
                    <span className="text-gray-400">•</span>
                    <span>{selectedLand?.name}</span>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPhotoModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Camera size={16} />
                Capture Photo
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={32} />
              <p className="text-gray-600">Loading growth data...</p>
            </div>
          </div>
        ) : !growthData ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Activity className="text-gray-400" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">No Growth Data Available</h2>
              <p className="text-gray-600 mb-6">Start monitoring your crop growth to see detailed insights and AI-powered recommendations.</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={performAIAnalysis}
                disabled={isAnalyzingAI}
                className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 flex items-center gap-3 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzingAI ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain size={20} />
                    Start AI Farm Analysis
                  </>
                )}
              </motion.button>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {currentView === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                {/* Growth Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                        <TrendingUp className="text-green-600" size={24} />
                      </div>
                      <span className="text-2xl font-bold text-gray-900">{growthData?.progress?.toFixed(1)}%</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Growth Progress</h3>
                    <p className="text-sm text-gray-600">{growthData?.currentStage}</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                        <Activity className="text-blue-600" size={24} />
                      </div>
                      <span className="text-2xl font-bold text-gray-900">
                        {aiAnalysisData?.health_score || growthData?.healthScore}%
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Health Score</h3>
                    <p className="text-sm text-gray-600">AI Assessment</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl flex items-center justify-center">
                        <Target className="text-yellow-600" size={24} />
                      </div>
                      <span className="text-2xl font-bold text-gray-900">
                        {aiAnalysisData?.yield_estimation?.yield_percentage || growthData?.yieldPrediction + 'kg'}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Yield Prediction</h3>
                    <p className="text-sm text-gray-600">Expected per acre</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                        <Clock className="text-purple-600" size={24} />
                      </div>
                      <span className="text-2xl font-bold text-gray-900">{growthData?.daysElapsed}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Days Elapsed</h3>
                    <p className="text-sm text-gray-600">Since planting</p>
                  </motion.div>
                </div>

                {/* AI Insights and Recommendations */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center">
                        <Brain className="text-white" size={24} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">AI Insights & Recommendations</h2>
                        <p className="text-gray-600">Smart analysis and actionable advice</p>
                      </div>
                    </div>
                    {!aiAnalysisData ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={performAIAnalysis}
                        disabled={isAnalyzingAI}
                        className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isAnalyzingAI ? (
                          <>
                            <Loader2 className="animate-spin" size={16} />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Brain size={16} />
                            Run AI Analysis
                          </>
                        )}
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={performAIAnalysis}
                        disabled={isAnalyzingAI}
                        className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isAnalyzingAI ? (
                          <>
                            <Loader2 className="animate-spin" size={16} />
                            Refreshing...
                          </>
                        ) : (
                          <>
                            <RefreshCw size={16} />
                            Refresh Analysis
                          </>
                        )}
                      </motion.button>
                    )}
                  </div>

                  {aiAnalysisData && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                          <Eye className="text-white" size={16} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">AI Farm Analysis Results</h3>
                      </div>
                      {aiAnalysisData.current_state_analysis && (
                        <p className="text-gray-700 leading-relaxed mb-3">{aiAnalysisData.current_state_analysis}</p>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-600">Health Score</p>
                          <p className="text-xl font-bold text-green-600">{aiAnalysisData.health_score}%</p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-600">Yield Prediction</p>
                          <p className="text-xl font-bold text-yellow-600">
                            {aiAnalysisData.yield_estimation?.yield_percentage || 
                             (aiAnalysisData.health_score && aiAnalysisData.risk_assessment?.risk_level ? 
                              calculateYieldPercentage(aiAnalysisData.health_score, aiAnalysisData.risk_assessment.risk_level) : 
                              'Calculating...')}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-600">Risk Level</p>
                          <p className="text-xl font-bold text-blue-600 capitalize">{aiAnalysisData.risk_assessment?.risk_level}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recommendations */}
                    <div className="flex flex-col">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Zap className="text-yellow-600" size={20} />
                        Recommendations
                        {aiAnalysisData?.action_items?.length > 0 && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                            AI Generated ({aiAnalysisData.action_items.length})
                          </span>
                        )}
                      </h3>
                      <div className="space-y-3 flex-1 overflow-y-auto max-h-96">
                        {aiAnalysisData?.action_items?.length > 0 ? (
                          <>
                            {/* Debug info - remove this later */}
                            <div className="text-xs text-gray-500 mb-2">
                              Showing {aiAnalysisData.action_items.length} recommendations
                              {aiAnalysisData.action_items.length > 2 && (
                                <span className="text-blue-600 ml-2">(Scroll to see all)</span>
                              )}
                              {aiAnalysisData.analysis_timestamp && (
                                <span className="text-gray-400 ml-2">
                                  • Updated: {new Date(aiAnalysisData.analysis_timestamp).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                                                        {aiAnalysisData.action_items.map((item, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * index }}
                                className={`p-4 rounded-lg border ${
                                  item.priority === 'high' ? 'bg-red-50 border-red-200' :
                                  item.priority === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                                  'bg-green-50 border-green-200'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <span className="text-2xl">
                                    {item.icon === 'water-drop' ? '💧' :
                                     item.icon === 'magnifying-glass' ? '🔍' :
                                     item.icon === 'thermometer' ? '🌡️' :
                                     item.icon === 'sun' ? '☀️' :
                                     item.icon === 'shield' ? '🛡️' :
                                     item.icon === 'leaf' ? '🌱' :
                                     item.icon === 'zap' ? '⚡' :
                                     item.icon === 'target' ? '🎯' : '📋'}
                                  </span>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900">{item.title}</h4>
                                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                                  </div>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    item.priority === 'high' ? 'bg-red-100 text-red-800' :
                                    item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {item.priority}
                                  </span>
                                </div>
                              </motion.div>
                            ))}
                          </>
                        ) : (
                          <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Brain className="text-white" size={24} />
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-2">No AI Recommendations Yet</h4>
                            <p className="text-sm text-gray-600 mb-4">
                              Run AI Farm Analysis to get personalized recommendations based on your farm data.
                            </p>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={performAIAnalysis}
                              disabled={isAnalyzingAI}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                            >
                              {isAnalyzingAI ? (
                                <>
                                  <Loader2 className="animate-spin" size={16} />
                                  Analyzing...
                                </>
                              ) : (
                                <>
                                  <Brain size={16} />
                                  Run AI Analysis
                                </>
                              )}
                            </motion.button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Weather Impact */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Cloud className="text-blue-600" size={20} />
                        Weather Impact
                      </h3>
                      <div className="space-y-3">
                        {weatherData ? (
                          <>
                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <Thermometer className="text-blue-600" size={16} />
                              <span className="text-sm text-blue-800">Temperature: {weatherData.temperature}°C</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                              <Droplets className="text-green-600" size={16} />
                              <span className="text-sm text-green-800">Humidity: {weatherData.humidity}%</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                              <Wind className="text-purple-600" size={16} />
                              <span className="text-sm text-purple-800">Wind: {weatherData.wind_speed} m/s</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                              <Cloud className="text-yellow-600" size={16} />
                              <span className="text-sm text-yellow-800">{weatherData.description}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            {growthData?.weatherImpact?.positive?.map((impact, index) => (
                              <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                <CheckCircle className="text-green-600" size={16} />
                                <span className="text-sm text-green-800">{impact}</span>
                              </div>
                            ))}
                            {growthData?.weatherImpact?.negative?.map((impact, index) => (
                              <div key={index} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                                <AlertTriangle className="text-red-600" size={16} />
                                <span className="text-sm text-red-800">{impact}</span>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Growth Trends */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center">
                        <BarChart3 className="text-white" size={24} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Growth Trends</h2>
                        <p className="text-gray-600">Performance indicators and predictions</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {['7d', '30d', '90d'].map((period) => (
                        <button
                          key={period}
                          onClick={() => setSelectedTimeframe(period)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            selectedTimeframe === period
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {period}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <TrendingUp className="text-white" size={24} />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">Growth Rate</h3>
                      <p className="text-2xl font-bold text-green-600">
                        {growthData?.growthRate ? growthData.growthRate.toFixed(1) : '0.0'}%
                      </p>
                      <p className="text-sm text-gray-600">per day</p>
                    </div>

                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Activity className="text-white" size={24} />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">Health Trend</h3>
                      <p className="text-2xl font-bold text-blue-600">
                        {aiAnalysisData?.health_score ? `${aiAnalysisData.health_score}%` : 
                         growthData?.healthScore ? `${growthData.healthScore}%` : 'New'}
                      </p>
                      <p className="text-sm text-gray-600">status</p>
                    </div>

                    <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
                      <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Target className="text-white" size={24} />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">Yield Outlook</h3>
                      <p className="text-2xl font-bold text-yellow-600">
                        {aiAnalysisData?.yield_estimation?.yield_percentage || 
                         (aiAnalysisData?.health_score && aiAnalysisData?.risk_assessment?.risk_level ? 
                          calculateYieldPercentage(aiAnalysisData.health_score, aiAnalysisData.risk_assessment.risk_level) :
                          growthData?.yieldPrediction ? `${growthData.yieldPrediction}kg` : 'Early')}
                      </p>
                      <p className="text-sm text-gray-600">prediction</p>
                    </div>

                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                      <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Cloud className="text-white" size={24} />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">Weather</h3>
                      <p className="text-2xl font-bold text-purple-600">
                        {weatherData?.temperature ? `${weatherData.temperature}°C` : 'Favorable'}
                      </p>
                      <p className="text-sm text-gray-600">conditions</p>
                    </div>
                  </div>
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setCurrentView('analytics')}
                      className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
                    >
                      <BarChart3 size={20} />
                      <span className="font-semibold">Detailed Analytics</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setCurrentView('photos')}
                      className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300"
                    >
                      <Camera size={20} />
                      <span className="font-semibold">Photo Gallery</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={performAIAnalysis}
                      disabled={isAnalyzingAI}
                      className="flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl hover:from-yellow-600 hover:to-yellow-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAnalyzingAI ? (
                        <Loader2 className="animate-spin" size={20} />
                      ) : (
                        <MessageCircle size={20} />
                      )}
                      <span className="font-semibold">
                        {isAnalyzingAI ? 'Analyzing...' : 'AI Feedback'}
                      </span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={performAIAnalysis}
                      disabled={isAnalyzingAI}
                      className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAnalyzingAI ? (
                        <Loader2 className="animate-spin" size={20} />
                      ) : (
                        <Brain size={20} />
                      )}
                      <span className="font-semibold">
                        {isAnalyzingAI ? 'Analyzing...' : 'AI Farm Analysis'}
                      </span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowYieldAnalysis(true)}
                      className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300"
                    >
                      <Target size={20} />
                      <span className="font-semibold">Yield Analysis</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setCurrentView('reports')}
                      className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300"
                    >
                      <Download size={20} />
                      <span className="font-semibold">Generate Report</span>
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {currentView === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Analytics content will be implemented */}
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Detailed Analytics</h2>
                  <p className="text-gray-600">Advanced analytics features coming soon...</p>
                </div>
              </motion.div>
            )}

            {currentView === 'photos' && (
              <motion.div
                key="photos"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Photos content will be implemented */}
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Photo Gallery</h2>
                  <p className="text-gray-600">Photo documentation features coming soon...</p>
                </div>
              </motion.div>
            )}

            {currentView === 'reports' && (
              <motion.div
                key="reports"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Reports content will be implemented */}
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Generate Report</h2>
                  <p className="text-gray-600">Report generation features coming soon...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Photo Capture Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 shadow-xl max-w-2xl w-full mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Capture Growth Photo</h3>
              <button
                onClick={() => setShowPhotoModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-64 bg-gray-100 rounded-lg"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Upload Photo
              </button>
              <button
                onClick={capturePhoto}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Capture Photo
              </button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    setCapturedImage(e.target?.result);
                    setShowPhotoModal(false);
                    analyzePhoto(e.target?.result);
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="hidden"
            />
          </motion.div>
        </div>
      )}

      {/* Photo Analysis Result */}
      {analysisResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 shadow-xl max-w-md w-full mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Photo Analysis Result</h3>
              <button
                onClick={() => setAnalysisResult(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl mb-2">🌱</div>
                <h4 className="font-semibold text-gray-900">{analysisResult.growth_stage}</h4>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">Health Score</span>
                  <span className="text-2xl font-bold text-blue-600">{analysisResult.health_score}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${analysisResult.health_score}%` }}
                  ></div>
                </div>
              </div>
              
              {analysisResult.recommendations?.length > 0 && (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Recommendations</h5>
                  <ul className="space-y-1">
                    {analysisResult.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                        <CheckCircle className="text-green-600" size={14} />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setAnalysisResult(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setAnalysisResult(null);
                  setShowPhotoModal(true);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Take Another
              </button>
            </div>
          </motion.div>
        </div>
      )}



      {/* Yield Analysis Result */}
      {showYieldAnalysis && yieldAnalysisData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">AI Yield Analysis</h3>
              <button
                onClick={() => setShowYieldAnalysis(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Yield Gap Analysis */}
              {yieldAnalysisData.yield_gap && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Yield Gap Analysis</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Current vs Target</p>
                      <p className="text-lg font-bold text-blue-600">{yieldAnalysisData.yield_gap.current_vs_target}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Percentage Gap</p>
                      <p className="text-lg font-bold text-blue-600">{yieldAnalysisData.yield_gap.percentage_gap}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Feasibility</p>
                      <p className="text-lg font-bold text-blue-600 capitalize">{yieldAnalysisData.yield_gap.feasibility}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Key Factors */}
              {yieldAnalysisData.key_factors && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Key Factors Affecting Yield</h4>
                  <div className="space-y-2">
                    {yieldAnalysisData.key_factors.map((factor, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className={`w-3 h-3 rounded-full ${
                          factor.impact === 'positive' ? 'bg-green-500' :
                          factor.impact === 'negative' ? 'bg-red-500' : 'bg-yellow-500'
                        }`} />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{factor.factor}</p>
                          <p className="text-sm text-gray-600">{factor.description}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          factor.impact === 'positive' ? 'bg-green-100 text-green-800' :
                          factor.impact === 'negative' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {factor.impact}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {yieldAnalysisData.recommendations && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">AI Recommendations</h4>
                  <div className="space-y-3">
                    {yieldAnalysisData.recommendations.map((rec, index) => (
                      <div key={index} className={`p-4 rounded-lg border ${
                        rec.priority === 'high' ? 'bg-red-50 border-red-200' :
                        rec.priority === 'medium' ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-semibold text-gray-900">{rec.action}</h5>
                          <div className="flex gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                              rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {rec.priority}
                            </span>
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                              {rec.type}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{rec.expected_impact}</p>
                        <p className="text-xs text-gray-500">Timeline: {rec.timeline}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risk Assessment */}
              {yieldAnalysisData.risk_assessment && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Risk Assessment</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h5 className="font-semibold text-red-800 mb-2">High Risks</h5>
                      <ul className="space-y-1">
                        {yieldAnalysisData.risk_assessment.high_risks.map((risk, index) => (
                          <li key={index} className="text-sm text-red-700 flex items-center gap-2">
                            <AlertTriangle size={12} />
                            {risk}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h5 className="font-semibold text-green-800 mb-2">Mitigation Strategies</h5>
                      <ul className="space-y-1">
                        {yieldAnalysisData.risk_assessment.mitigation_strategies.map((strategy, index) => (
                          <li key={index} className="text-sm text-green-700 flex items-center gap-2">
                            <CheckCircle size={12} />
                            {strategy}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Optimization Tips */}
              {yieldAnalysisData.optimization_tips && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Optimization Tips</h4>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <ul className="space-y-2">
                      {yieldAnalysisData.optimization_tips.map((tip, index) => (
                        <li key={index} className="text-sm text-yellow-800 flex items-center gap-2">
                          <Zap size={12} />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowYieldAnalysis(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowYieldAnalysis(false);
                  setShowFeedbackModal(true);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get More Analysis
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* AI Farm Analysis Modal */}
      {showAIAnalysis && aiAnalysisData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-xl flex items-center justify-center">
                  <Brain className="text-white" size={20} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">AI Farm Analysis</h3>
              </div>
              <button
                onClick={() => setShowAIAnalysis(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-8">
              {/* Current State Analysis */}
              {aiAnalysisData.current_state_analysis && (
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Eye size={20} className="text-blue-600" />
                    Current Farm State Analysis
                  </h4>
                  <p className="text-gray-700 leading-relaxed">{aiAnalysisData.current_state_analysis}</p>
                </div>
              )}

              {/* Health Score & Yield Estimation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Activity size={20} className="text-green-600" />
                    Health Score Analysis
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Current Score:</span>
                      <span className="text-2xl font-bold text-green-600">{aiAnalysisData.health_score}%</span>
                    </div>
                    {aiAnalysisData.health_score_analysis?.factors && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Key Factors:</p>
                        <ul className="space-y-1">
                          {aiAnalysisData.health_score_analysis.factors.map((factor, index) => (
                            <li key={index} className="text-sm text-gray-700 flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Target size={20} className="text-yellow-600" />
                    Yield Estimation
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Current Estimate:</p>
                      <p className="text-lg font-semibold text-gray-900">{aiAnalysisData.yield_estimation?.current_estimate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Potential Improvement:</p>
                      <p className="text-sm text-gray-700">{aiAnalysisData.yield_estimation?.potential_improvement}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Confidence:</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        aiAnalysisData.yield_estimation?.confidence_level === 'high' ? 'bg-green-100 text-green-800' :
                        aiAnalysisData.yield_estimation?.confidence_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {aiAnalysisData.yield_estimation?.confidence_level || 'medium'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Recommendations */}
              {aiAnalysisData.recommendations && aiAnalysisData.recommendations.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Zap size={20} className="text-purple-600" />
                    AI Recommendations
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {aiAnalysisData.recommendations.map((rec, index) => (
                      <div key={index} className={`p-4 rounded-xl border ${
                        rec.priority === 'high' ? 'bg-red-50 border-red-200' :
                        rec.priority === 'medium' ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-semibold text-gray-900">{rec.title}</h5>
                          <div className="flex gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                              rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {rec.priority}
                            </span>
                            <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                              {rec.category}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{rec.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Tasks */}
              {aiAnalysisData.next_tasks && aiAnalysisData.next_tasks.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-blue-600" />
                    Recommended Next Tasks
                  </h4>
                  <div className="space-y-3">
                    {aiAnalysisData.next_tasks.map((task, index) => (
                      <div key={index} className={`p-4 rounded-xl border ${
                        task.priority === 'high' ? 'bg-red-50 border-red-200' :
                        task.priority === 'medium' ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-semibold text-gray-900">{task.task}</h5>
                          <div className="flex gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              task.priority === 'high' ? 'bg-red-100 text-red-800' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {task.priority}
                            </span>
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                              {task.timeline}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{task.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risk Assessment */}
              {aiAnalysisData.risk_assessment && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertTriangle size={20} className="text-red-600" />
                    Risk Assessment
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                      <h5 className="font-semibold text-red-800 mb-3">Current Risks</h5>
                      <ul className="space-y-2">
                        {aiAnalysisData.risk_assessment.current_risks?.map((risk, index) => (
                          <li key={index} className="text-sm text-red-700 flex items-center gap-2">
                            <AlertTriangle size={12} />
                            {risk}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          aiAnalysisData.risk_assessment.risk_level === 'high' ? 'bg-red-100 text-red-800' :
                          aiAnalysisData.risk_assessment.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          Risk Level: {aiAnalysisData.risk_assessment.risk_level}
                        </span>
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                      <h5 className="font-semibold text-green-800 mb-3">Mitigation Strategies</h5>
                      <ul className="space-y-2">
                        {aiAnalysisData.risk_assessment.mitigation_strategies?.map((strategy, index) => (
                          <li key={index} className="text-sm text-green-700 flex items-center gap-2">
                            <CheckCircle size={12} />
                            {strategy}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Updated Analysis from Questions */}
              {/* This section is removed as per the edit hint to simplify AI analysis */}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAIAnalysis(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              {/* This button is removed as per the edit hint to simplify AI analysis */}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default EnhancedGrowthMonitoring; 