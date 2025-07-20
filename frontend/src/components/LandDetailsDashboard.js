import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Leaf, 
  Camera, 
  Calendar, 
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
  Loader2
} from 'lucide-react';
import AIEnhancedCropPlanning from './AIEnhancedCropPlanning';
import EnhancedDiseaseDetection from './EnhancedDiseaseDetection';
import EnhancedGrowthMonitoring from './EnhancedGrowthMonitoring';
import LandImageSystem from './LandImageSystem';

const LandDetailsDashboard = ({ selectedLand, cropSchedules, onScheduleSaved, onBack }) => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [weatherData, setWeatherData] = useState(null);
  const [showCompleteSchedule, setShowCompleteSchedule] = useState(false);
  const [completeSchedule, setCompleteSchedule] = useState(null);
  const [cropPlanningHistory, setCropPlanningHistory] = useState([]);
  const [diseaseHistory, setDiseaseHistory] = useState([]);
  const [historicalData, setHistoricalData] = useState(null);
  const [forceRefresh, setForceRefresh] = useState(0);
  const [updatingTask, setUpdatingTask] = useState(null);
  const [cycleNumber, setCycleNumber] = useState(1);
  const [aiAnalysisData, setAiAnalysisData] = useState(null);
  
  // Get the most recent active crop schedule
  const activeSchedule = cropSchedules
    .filter(schedule => schedule.active === true)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]; // Sort by created_at

  const [growthData, setGrowthData] = useState({
    currentStage: activeSchedule?.current_stage || 'No crop planted',
    daysPlanted: activeSchedule?.days_elapsed || 0,
    healthScore: activeSchedule?.health_score || 0,
    nextAction: activeSchedule?.next_action || 'Plant a crop to get started',
    weather: {
      temperature: '--',
      humidity: '--',
      rainfall: '--'
    }
  });

  const [cropData, setCropData] = useState({
    name: activeSchedule?.crop_name || 'No crop planted',
    variety: activeSchedule?.crop_name || '--',
    plantedDate: activeSchedule?.start_date ? new Date(activeSchedule.start_date).toLocaleDateString() : '--',
    expectedHarvest: activeSchedule?.end_date ? new Date(activeSchedule.end_date).toLocaleDateString() : '--',
    area: selectedLand?.size ? `${selectedLand.size} acres` : '--'
  });

  // Fetch real weather data when component mounts
  useEffect(() => {
    if (selectedLand?.location?.lat && selectedLand?.location?.lng) {
      fetchWeatherData();
    }
  }, [selectedLand]);

  // Load AI analysis data from localStorage
  useEffect(() => {
    if (selectedLand?.id) {
      const storedAnalysis = localStorage.getItem(`ai_analysis_${selectedLand.id}`);
      if (storedAnalysis) {
        try {
          setAiAnalysisData(JSON.parse(storedAnalysis));
        } catch (error) {
          console.error('Error parsing stored AI analysis:', error);
        }
      }
    }
  }, [selectedLand?.id, forceRefresh]);

  // Function to refresh AI analysis data
  const refreshAIAnalysisData = () => {
    if (selectedLand?.id) {
      const storedAnalysis = localStorage.getItem(`ai_analysis_${selectedLand.id}`);
      if (storedAnalysis) {
        try {
          setAiAnalysisData(JSON.parse(storedAnalysis));
          console.log('✅ AI Analysis data refreshed from localStorage');
        } catch (error) {
          console.error('Error parsing stored AI analysis:', error);
        }
      }
    }
  };

  // Update crop data when schedules change
  useEffect(() => {
    console.log('🔄 Updating crop data. All schedules:', cropSchedules);
    console.log('🏞️ Land ID:', selectedLand?.id);
    
    const activeSchedules = cropSchedules.filter(schedule => schedule.active === true);
    console.log('📋 Active schedules:', activeSchedules);
    if (activeSchedules.length === 0) {
      console.log('❌ No active schedules found - showing "No crop planted"');
    } else if (activeSchedules.length > 1) {
      console.log('⚠️ Multiple active schedules found - this should not happen!');
      activeSchedules.forEach((schedule, index) => {
        console.log(`  ${index + 1}. ${schedule.crop_name} (active) - Created: ${schedule.created_at}`);
      });
    }
    const activeSchedule = activeSchedules
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]; // Sort by created_at instead of start_date
    console.log('📋 Selected active schedule:', activeSchedule);
    
    // Debug: Log all available fields in active schedule
    if (activeSchedule) {
      console.log('🔍 Active schedule fields:');
      console.log('  - start_date:', activeSchedule.start_date);
      console.log('  - end_date:', activeSchedule.end_date);
      console.log('  - created_at:', activeSchedule.created_at);
      console.log('  - crop_name:', activeSchedule.crop_name);
      console.log('  - current_stage:', activeSchedule.current_stage);
      console.log('  - days_elapsed:', activeSchedule.days_elapsed);
    }

    // Calculate next action based on current task status
    let nextAction = 'Plant a crop to get started';
    if (activeSchedule && activeSchedule.schedule) {
      const pendingTasks = activeSchedule.schedule.filter(task => !task.completed && !task.skipped);
      if (pendingTasks.length > 0) {
        // Get the next task (first pending task)
        const nextTask = pendingTasks[0];
        nextAction = `${nextTask.task} (Day ${nextTask.day})`;
      } else {
        nextAction = 'All tasks completed!';
      }
    }

    // Calculate days based on task progress (not calendar days)
    let daysPlanted = 0;
    if (activeSchedule?.schedule && activeSchedule.schedule.length > 0) {
      // Find the highest day number from completed or skipped tasks
      const completedOrSkippedTasks = activeSchedule.schedule.filter(task => task.completed || task.skipped);
      if (completedOrSkippedTasks.length > 0) {
        const maxDay = Math.max(...completedOrSkippedTasks.map(task => task.day));
        daysPlanted = maxDay;
        console.log('  ✅ Days planted based on task progress:', daysPlanted);
      } else {
        // No tasks completed yet, check if we have a start date for initial day
        if (activeSchedule?.start_date) {
          try {
            const startDate = new Date(activeSchedule.start_date);
            const today = new Date();
            const timeDiff = today.getTime() - startDate.getTime();
            const calendarDays = Math.floor(timeDiff / (1000 * 3600 * 24));
            // If calendar days > 0, show day 1, otherwise show 0
            daysPlanted = calendarDays > 0 ? 1 : 0;
            console.log('  ✅ Days planted based on calendar (no tasks completed):', daysPlanted);
          } catch (e) {
            console.log('  ❌ Error calculating initial days:', e);
            daysPlanted = 0;
          }
        } else {
          daysPlanted = 0;
          console.log('  ✅ No start date, showing 0 days');
        }
      }
    } else {
      // No schedule available, fall back to calendar calculation
      if (activeSchedule?.start_date) {
        try {
          const startDate = new Date(activeSchedule.start_date);
          const today = new Date();
          const timeDiff = today.getTime() - startDate.getTime();
          daysPlanted = Math.floor(timeDiff / (1000 * 3600 * 24));
          console.log('  ✅ Days planted calculated from start_date (fallback):', daysPlanted);
        } catch (e) {
          console.log('  ❌ Error calculating days planted:', e);
          daysPlanted = activeSchedule?.days_elapsed || 0;
        }
      } else if (activeSchedule?.created_at) {
        try {
          const createdDate = new Date(activeSchedule.created_at);
          const today = new Date();
          const timeDiff = today.getTime() - createdDate.getTime();
          daysPlanted = Math.floor(timeDiff / (1000 * 3600 * 24));
          console.log('  ✅ Days planted calculated from created_at (fallback):', daysPlanted);
        } catch (e) {
          console.log('  ❌ Error calculating days from created_at:', e);
          daysPlanted = activeSchedule?.days_elapsed || 0;
        }
      }
    }

    // Calculate current stage based on task progress days
    let currentStage = 'No crop planted';
    if (activeSchedule?.crop_name && daysPlanted >= 0) {
      if (daysPlanted === 0) {
        currentStage = 'Just Planted';
      } else if (daysPlanted <= 7) {
        currentStage = 'Germination';
      } else if (daysPlanted <= 21) {
        currentStage = 'Vegetative Growth';
      } else if (daysPlanted <= 45) {
        currentStage = 'Flowering';
      } else if (daysPlanted <= 90) {
        currentStage = 'Fruiting';
      } else {
        currentStage = 'Harvest Ready';
      }
    }

    setGrowthData(prev => ({
      ...prev,
      currentStage: currentStage,
      daysPlanted: daysPlanted,
      healthScore: aiAnalysisData?.health_score || activeSchedule?.health_score || 0,
      nextAction: nextAction
    }));

    // Debug: Log date information
    console.log('📅 Date calculation debug:');
    console.log('  - start_date:', activeSchedule?.start_date);
    console.log('  - end_date:', activeSchedule?.end_date);
    console.log('  - created_at:', activeSchedule?.created_at);
    
    // Calculate planted date
    let plantedDate = '--';
    if (activeSchedule?.start_date) {
      try {
        plantedDate = new Date(activeSchedule.start_date).toLocaleDateString();
        console.log('  ✅ Planted date calculated:', plantedDate);
      } catch (e) {
        console.log('  ❌ Error parsing start_date:', e);
        if (activeSchedule?.created_at) {
          plantedDate = new Date(activeSchedule.created_at).toLocaleDateString();
          console.log('  🔄 Using created_at as fallback:', plantedDate);
        }
      }
    } else if (activeSchedule?.created_at) {
      plantedDate = new Date(activeSchedule.created_at).toLocaleDateString();
      console.log('  🔄 Using created_at for planted date:', plantedDate);
    }
    
    // Calculate expected harvest date
    let expectedHarvest = '--';
    if (activeSchedule?.end_date) {
      try {
        expectedHarvest = new Date(activeSchedule.end_date).toLocaleDateString();
        console.log('  ✅ End date found:', expectedHarvest);
      } catch (e) {
        console.log('  ❌ Error parsing end_date:', e);
      }
    } else if (activeSchedule?.start_date) {
      try {
        // Calculate expected harvest as start_date + 90 days (typical crop cycle)
        const startDate = new Date(activeSchedule.start_date);
        const harvestDate = new Date(startDate);
        harvestDate.setDate(startDate.getDate() + 90);
        expectedHarvest = harvestDate.toLocaleDateString();
        console.log('  ✅ Calculated harvest date:', expectedHarvest);
      } catch (e) {
        console.log('  ❌ Error calculating harvest date:', e);
      }
    }
    
    setCropData({
      name: activeSchedule?.crop_name || 'No crop planted',
      variety: activeSchedule?.crop_name || '--',
      plantedDate: plantedDate,
      expectedHarvest: expectedHarvest,
      area: selectedLand?.size ? `${selectedLand.size} acres` : '--'
    });

    // Force a re-render by updating the complete schedule if it's currently shown
    if (showCompleteSchedule && completeSchedule && activeSchedule) {
      setCompleteSchedule(activeSchedule);
    }
  }, [cropSchedules, selectedLand, showCompleteSchedule, completeSchedule, forceRefresh]);

  // Fetch history data when component mounts
  useEffect(() => {
    if (selectedLand?.id) {
      fetchCropPlanningHistory();
      fetchDiseaseHistory();
    }
  }, [selectedLand]);



  const fetchWeatherData = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001'}/api/weather/${selectedLand.location.lat}/${selectedLand.location.lng}`
      );
      if (response.ok) {
        const data = await response.json();
        setWeatherData(data);
        setGrowthData(prev => ({
          ...prev,
          weather: {
            temperature: `${data.temperature}°C`,
            humidity: `${data.humidity}%`,
            rainfall: `${data.description}`
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }
  };

  const handleTaskAction = async (task, action) => {
    if (!activeSchedule) {
      console.error('❌ No active schedule found');
      return;
    }
    
    // Set updating state
    setUpdatingTask(`${task.task}-${action}`);
    
    try {
      const token = localStorage.getItem('token');
      console.log('🔄 TASK ACTION STARTED:');
      console.log('   - Task:', task.task);
      console.log('   - Action:', action);
      console.log('   - Schedule ID:', activeSchedule.id);
      console.log('   - Active Schedule:', activeSchedule);
      console.log('   - Task object:', task);
      
      // Find the exact task index
      const taskIndex = activeSchedule.schedule.findIndex(t => 
        t.task === task.task && t.day === task.day
      );
      
      console.log('🔍 Task search result:', taskIndex);
      console.log('📋 All tasks in schedule:', activeSchedule.schedule);
      
      if (taskIndex === -1) {
        console.error('❌ Task not found in schedule');
        alert('Task not found in schedule. Please refresh the page.');
        return;
      }
      
      console.log('📋 Task index found:', taskIndex);
      
      // Sequential validation - check if previous tasks are completed
      if (action === 'done') {
        const previousTasks = activeSchedule.schedule.slice(0, taskIndex);
        const incompletePreviousTasks = previousTasks.filter(t => !t.completed && !t.skipped);
        
        if (incompletePreviousTasks.length > 0) {
          setUpdatingTask(null);
          return;
        }
      }
      
      const requestBody = {
        task_index: taskIndex,
        action: action // 'done' or 'skip'
      };
      
      console.log('📤 Making API request:');
      console.log('   - URL:', `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001'}/api/crop-schedules/${activeSchedule.id}/task-action`);
      console.log('   - Method: PUT');
      console.log('   - Body:', requestBody);
      console.log('   - Token:', token ? 'Present' : 'Missing');
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001'}/api/crop-schedules/${activeSchedule.id}/task-action`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('📥 Response received:');
      console.log('   - Status:', response.status);
      console.log('   - OK:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Task updated successfully:', result.message);
        console.log('📋 Response data:', result);
        
        // Show success message
        const actionText = action === 'done' ? 'completed' : 'skipped';
        alert(`Task "${task.task}" ${actionText} successfully!`);
        
        // Update the completeSchedule state immediately
        if (completeSchedule) {
          console.log('🔄 Updating completeSchedule state...');
          const updatedSchedule = { ...completeSchedule };
          if (updatedSchedule.schedule && updatedSchedule.schedule[taskIndex]) {
            updatedSchedule.schedule[taskIndex][action] = true;
            updatedSchedule.schedule[taskIndex].completed_at = new Date().toISOString();
            setCompleteSchedule(updatedSchedule);
            console.log('✅ completeSchedule state updated');
          } else {
            console.log('❌ Could not update completeSchedule - task not found at index', taskIndex);
          }
        } else {
          console.log('⚠️ No completeSchedule to update');
        }
        
        // Add a small delay to ensure backend processing is complete
        setTimeout(() => {
          console.log('🔄 Refreshing schedules after task update...');
          onScheduleSaved();
          // Force a re-render
          setForceRefresh(prev => prev + 1);
          
          // If complete schedule modal is open, refresh it
          if (showCompleteSchedule && completeSchedule) {
            console.log('🔄 Refreshing complete schedule modal...');
            fetchCompleteSchedule(activeSchedule.id);
          }
        }, 500);
      } else {
        const errorData = await response.json();
        console.error('❌ Task update failed:', errorData);
        console.error('❌ Response status:', response.status);
        console.error('❌ Response text:', await response.text());
        alert(`Failed to update task: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error updating task:', error);
      alert('Error updating task. Please try again.');
    } finally {
      // Clear updating state
      setUpdatingTask(null);
    }
  };

  const fetchCompleteSchedule = async (scheduleId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001'}/api/crop-schedules/${scheduleId}/complete`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const schedule = await response.json();
        setCompleteSchedule(schedule);
        setShowCompleteSchedule(true);
      }
    } catch (error) {
      console.error('Error fetching complete schedule:', error);
    }
  };

  const [showUseAgainModal, setShowUseAgainModal] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  // Helper function to check if a task can be completed (sequential validation)
  const canCompleteTask = (taskIndex, schedule) => {
    if (!schedule || !schedule.schedule) return false;
    
    const previousTasks = schedule.schedule.slice(0, taskIndex);
    const incompletePreviousTasks = previousTasks.filter(t => !t.completed && !t.skipped);
    
    return incompletePreviousTasks.length === 0;
  };

  // Check if a task should show disease detection button
  const shouldShowDiseaseButton = (task) => {
    const taskName = task.task.toLowerCase();
    return (
      taskName.includes('monitoring') ||
      taskName.includes('pest control') ||
      taskName.includes('fertilization') ||
      taskName.includes('second fertilization') ||
      taskName.includes('disease monitoring') ||
      taskName.includes('health check')
    );
  };

  const handleUseAgain = (historyItem) => {
    setSelectedHistoryItem(historyItem);
    setShowUseAgainModal(true);
  };

  const handleUseAgainConfirm = () => {
    if (selectedHistoryItem) {
      // Simply pass the historical data to crop planning
      setHistoricalData(selectedHistoryItem);
      setCurrentView('crop-planning');
      setShowUseAgainModal(false);
      setSelectedHistoryItem(null);
    }
  };



  const fetchCropPlanningHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001'}/api/crop-planning-history/${selectedLand.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const history = await response.json();
        setCropPlanningHistory(history);
      }
    } catch (error) {
      console.error('Error fetching crop planning history:', error);
    }
  };

  const fetchDiseaseHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001'}/api/disease-reports`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const reports = await response.json();
        // Filter reports for this land
        const landReports = reports.filter(report => report.land_id === selectedLand.id);
        setDiseaseHistory(landReports);
      }
    } catch (error) {
      console.error('Error fetching disease history:', error);
    }
  };



  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Land Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100"
      >
        <div className="flex items-center gap-6 mb-6">
          <motion.div 
            className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ duration: 0.3 }}
          >
            <MapPin className="text-green-600" size={32} />
          </motion.div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{selectedLand.name}</h2>
            <p className="text-gray-600 flex items-center gap-2 mt-2">
              <span className="font-semibold text-green-600">{selectedLand.size} acres</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">{selectedLand.soil_type}</span>
              {selectedLand.location && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-500">
                    {selectedLand.location.lat.toFixed(4)}, {selectedLand.location.lng.toFixed(4)}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <motion.div 
            className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200"
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <Droplets className="mx-auto text-blue-600 mb-3" size={24} />
            <p className="text-lg font-bold text-gray-900">{growthData.weather.humidity}</p>
            <p className="text-sm text-gray-600">Humidity</p>
          </motion.div>
          <motion.div 
            className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200"
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <Thermometer className="mx-auto text-orange-600 mb-3" size={24} />
            <p className="text-lg font-bold text-gray-900">{growthData.weather.temperature}</p>
            <p className="text-sm text-gray-600">Temperature</p>
          </motion.div>
          <motion.div 
            className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200"
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <Sun className="mx-auto text-yellow-600 mb-3" size={24} />
            <p className="text-lg font-bold text-gray-900">{growthData.weather.rainfall}</p>
            <p className="text-sm text-gray-600">Rainfall</p>
          </motion.div>
          <motion.div 
            className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200"
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <Activity className="mx-auto text-green-600 mb-3" size={24} />
            <p className="text-lg font-bold text-gray-900">
              {aiAnalysisData?.health_score ? `${aiAnalysisData.health_score}%` : 
               growthData.healthScore > 0 ? `${growthData.healthScore}%` : '0%'}
              {aiAnalysisData?.health_score && (
                <span className="text-xs text-green-600 ml-1">✨</span>
              )}
            </p>
            <p className="text-sm text-gray-600">
              Health
              {aiAnalysisData?.health_score && (
                <span className="text-xs text-green-600 ml-1">(AI)</span>
              )}
            </p>
            {aiAnalysisData?.analysis_timestamp && (
              <p className="text-xs text-gray-500 mt-1">
                Updated: {new Date(aiAnalysisData.analysis_timestamp).toLocaleDateString()}
              </p>
            )}
            {!aiAnalysisData?.health_score && growthData.healthScore === 0 && (
              <div className="text-xs text-gray-500 mt-1">
                <div className="flex items-center justify-center gap-1">
                  <span>No health data</span>
                  <button 
                    onClick={() => setCurrentView('growth-monitoring')}
                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    Run AI Analysis →
                  </button>
                </div>
              </div>
            )}
          </motion.div>
          <motion.div 
            className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200"
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <Calendar className="mx-auto text-purple-600 mb-3" size={24} />
            <p className="text-lg font-bold text-gray-900">{cycleNumber}</p>
            <p className="text-sm text-gray-600">Cycle #</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Crop Stage Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100"
      >
        <div className="flex items-center gap-4 mb-6">
          <motion.div 
            className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center"
            whileHover={{ scale: 1.1, rotate: 10 }}
            transition={{ duration: 0.3 }}
          >
            <Leaf className="text-white" size={24} />
          </motion.div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Crop Stage Visualization</h3>
            <p className="text-gray-600">Real-time farm field visualization with weather effects</p>
          </div>
        </div>
        
        <LandImageSystem
          landData={selectedLand}
          cropStage={growthData.currentStage}
          nextAction={growthData.nextAction}
          progress={growthData.healthScore}
          isActive={activeSchedule?.active || false}
          weatherData={weatherData}
        />
      </motion.div>

      {/* Current Crop Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100"
      >
        <div className="flex items-center gap-4 mb-6">
          <motion.div 
            className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center"
            whileHover={{ scale: 1.1, rotate: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Leaf className="text-white" size={24} />
          </motion.div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Current Crop Status</h3>
            <p className="text-gray-600">Detailed information about your current crop</p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Crop:</span>
              <span className="font-medium">{cropData.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Variety:</span>
              <span className="font-medium">{cropData.variety}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Area:</span>
              <span className="font-medium">{cropData.area}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Stage:</span>
              <span className="font-medium text-green-600">{growthData.currentStage}</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Planted:</span>
              <span className="font-medium">{cropData.plantedDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Days Growing:</span>
              <span className="font-medium">{growthData.daysPlanted} days</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Expected Harvest:</span>
              <span className="font-medium">{cropData.expectedHarvest}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Next Action:</span>
              <span className="font-medium text-blue-600">{growthData.nextAction}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-6"
      >
        <motion.button
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCurrentView('crop-planning')}
          className="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl hover:shadow-lg transition-all duration-300 border border-green-200 group"
        >
          <motion.div 
            className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
            whileHover={{ rotate: 5 }}
          >
            <Leaf className="text-white" size={28} />
          </motion.div>
          <span className="font-semibold text-gray-900 text-lg">Crop Planning</span>
          <span className="text-sm text-gray-600 text-center">Plan next season</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCurrentView('disease-detection')}
          className="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl hover:shadow-lg transition-all duration-300 border border-red-200 group"
        >
          <motion.div 
            className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
            whileHover={{ rotate: -5 }}
          >
            <Camera className="text-white" size={28} />
          </motion.div>
          <span className="font-semibold text-gray-900 text-lg">Disease Detection</span>
          <span className="text-sm text-gray-600 text-center">Scan for issues</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setCurrentView('growth-monitoring');
            // Refresh AI data when returning from growth monitoring
            setTimeout(() => {
              refreshAIAnalysisData();
            }, 1000);
          }}
          className="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl hover:shadow-lg transition-all duration-300 border border-blue-200 group"
        >
          <motion.div 
            className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
            whileHover={{ rotate: 5 }}
          >
            <Activity className="text-white" size={28} />
          </motion.div>
          <span className="font-semibold text-gray-900 text-lg">Growth Monitoring</span>
          <span className="text-sm text-gray-600 text-center">Track progress</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCurrentView('ai-chat')}
          className="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl hover:shadow-lg transition-all duration-300 border border-purple-200 group"
        >
          <motion.div 
            className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
            whileHover={{ rotate: -5 }}
          >
            <MessageCircle className="text-white" size={28} />
          </motion.div>
          <span className="font-semibold text-gray-900 text-lg">AI Assistant</span>
          <span className="text-sm text-gray-600 text-center">Get help</span>
        </motion.button>
      </motion.div>

      {/* Active Schedule Section */}
      {activeSchedule ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <motion.div 
                className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
              >
                <Calendar className="text-white" size={24} />
              </motion.div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Active Schedule</h3>
                <p className="text-gray-600">{activeSchedule.crop_name} • {growthData.currentStage}</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fetchCompleteSchedule(activeSchedule.id)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              View All Tasks
            </motion.button>
          </div>

          {/* Schedule Summary */}
          <div className="mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{activeSchedule.schedule.length}</p>
                <p className="text-sm text-gray-600">Total Tasks</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {activeSchedule.schedule.filter(task => task.completed).length}
                </p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">
                  {activeSchedule.schedule.filter(task => !task.completed && !task.skipped).length}
                </p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round((activeSchedule.schedule.filter(task => task.completed || task.skipped).length / activeSchedule.schedule.length) * 100)}%
                </p>
                <p className="text-sm text-gray-600">Progress</p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Task Completion</span>
              <span>{Math.round((activeSchedule.schedule.filter(task => task.completed || task.skipped).length / activeSchedule.schedule.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div 
                className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(activeSchedule.schedule.filter(task => task.completed || task.skipped).length / activeSchedule.schedule.length) * 100}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              ></motion.div>
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="text-orange-600" size={20} />
              Pending Tasks
            </h4>
            <div className="space-y-3">
              {activeSchedule.schedule
                .filter(task => !task.completed && !task.skipped)
                .slice(0, 3)
                .map((task, index) => {
                  const canComplete = canCompleteTask(
                    activeSchedule.schedule.findIndex(t => t.task === task.task),
                    activeSchedule
                  );
                  const isNextTask = index === 0; // Only the first pending task is the immediate next action
                  
                  // Check if this task should show the scan button
                  const shouldShowScanButton = shouldShowDiseaseButton(task);
                  
                  return (
                    <motion.div
                      key={task.task}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{task.task}</p>
                        <p className="text-sm text-gray-600 mb-1">Day {task.day} • {task.priority}</p>
                        <p className="text-xs text-gray-500">{task.description || 'Complete this task to progress'}</p>
                      </div>
                      <div className="flex gap-2">
                        {isNextTask ? (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleTaskAction(task, 'done')}
                              disabled={!canComplete || updatingTask === `${task.task}-done`}
                              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                canComplete 
                                  ? 'bg-green-600 text-white hover:bg-green-700' 
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                              title={canComplete ? "Complete this task" : "Complete previous tasks first"}
                            >
                              {updatingTask === `${task.task}-done` ? (
                                <>
                                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                  Updating...
                                </>
                              ) : (
                                <>
                                  <CheckCircle size={12} />
                                  Done
                                </>
                              )}
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleTaskAction(task, 'skip')}
                              disabled={updatingTask === `${task.task}-skip`}
                              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                !updatingTask
                                  ? 'bg-gray-600 text-white hover:bg-gray-700' 
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                              title="Skip this task"
                            >
                              {updatingTask === `${task.task}-skip` ? (
                                <>
                                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                  Updating...
                                </>
                              ) : (
                                <>
                                  <XCircle size={12} />
                                  Skip
                                </>
                              )}
                            </motion.button>
                            {shouldShowScanButton && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setCurrentView('disease-detection')}
                                className="px-3 py-1 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                title="Scan for diseases and get AI recommendations"
                              >
                                <Camera size={12} />
                                Scan
                              </motion.button>
                            )}
                          </>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-500">
                            Waiting for previous tasks
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              {activeSchedule.schedule.filter(task => !task.completed && !task.skipped).length > 3 && (
                <div className="text-center mt-3">
                  <button
                    onClick={() => fetchCompleteSchedule(activeSchedule.id)}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    View all {activeSchedule.schedule.filter(task => !task.completed && !task.skipped).length} pending tasks
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activities Section - Now below pending tasks */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="text-green-600" size={20} />
              Recent Activities
            </h4>
            <div className="space-y-3">
              {activeSchedule.schedule
                .filter(task => task.completed || task.skipped)
                .slice(-3)
                .reverse()
                .map((task, index) => (
                  <motion.div
                    key={task.task}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{task.task}</p>
                      <p className="text-sm text-gray-600 mb-1">
                        Day {task.day} • {task.completed ? 'Completed' : 'Skipped'}
                      </p>
                      <p className="text-xs text-gray-500">{task.description || 'Task completed successfully'}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      task.completed 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {task.completed ? '✓ Done' : '⏭ Skip'}
                    </div>
                  </motion.div>
                ))}
              {activeSchedule.schedule.filter(task => task.completed || task.skipped).length > 3 && (
                <div className="text-center mt-3">
                  <button
                    onClick={() => fetchCompleteSchedule(activeSchedule.id)}
                    className="text-sm text-green-600 hover:text-green-800 underline"
                  >
                    View all {activeSchedule.schedule.filter(task => task.completed || task.skipped).length} completed activities
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center py-8 bg-white rounded-2xl shadow-xl border border-gray-100"
        >
          <motion.div 
            className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.3 }}
          >
            <Leaf className="text-gray-400" size={24} />
          </motion.div>
          <p className="text-gray-600">No active crop schedule</p>
          <p className="text-sm text-gray-500">Create a crop plan to see activities</p>
        </motion.div>
      )}

      {/* Crop Planning History */}
      {cropPlanningHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <History className="text-green-600" size={24} />
            Crop Planning History
          </h3>
          <div className="space-y-3">
            {cropPlanningHistory.slice(0, 3).map((history, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Leaf className="text-green-600" size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {history.soil_type} soil • {history.season} season
                  </p>
                  <p className="text-xs text-gray-600">
                    {history.crop_suggestions.length} crops suggested • {new Date(history.created_at).toLocaleDateString()}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleUseAgain(history)}
                  className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                >
                  Use Again
                </motion.button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Disease Detection History */}
      {diseaseHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="text-red-600" size={24} />
            Disease Detection History
          </h3>
          <div className="space-y-3">
            {diseaseHistory.slice(0, 3).map((report, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="text-red-600" size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{report.crop_name}</p>
                  <p className="text-xs text-gray-600">
                    {report.ai_diagnosis} • {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${
                  report.confidence > 0.7 ? 'bg-green-100 text-green-800' : 
                  report.confidence > 0.4 ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'
                }`}>
                  {Math.round(report.confidence * 100)}% confidence
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Complete Schedule Modal - Rendered outside dashboard to prevent interference */}
      {showCompleteSchedule && completeSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Complete Schedule: {completeSchedule.crop_name}
                </h2>
                <p className="text-gray-600">All tasks and their current status</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowCompleteSchedule(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </motion.button>
            </div>
            
            <div className="space-y-4">
              {completeSchedule.schedule?.map((task, index) => {
                const canComplete = canCompleteTask(index, completeSchedule);
                // Find the first pending task to determine which one can be skipped
                const pendingTasks = completeSchedule.schedule.filter(t => !t.completed && !t.skipped);
                const isNextTask = pendingTasks.length > 0 && pendingTasks[0].task === task.task && pendingTasks[0].day === task.day;
                
                // Only show action buttons for the immediate next task (consistent with main dashboard)
                const shouldShowActionButtons = isNextTask;
                
                // Check if this task should show the scan button
                const shouldShowScanButton = shouldShowDiseaseButton(task);
                
                return (
                  <motion.div
                    key={task.task}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-lg border ${
                      task.completed 
                        ? 'bg-green-50 border-green-200' 
                        : task.skipped 
                        ? 'bg-gray-50 border-gray-200' 
                        : 'bg-orange-50 border-orange-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{task.task}</p>
                        <p className="text-sm text-gray-600">
                          Day {task.day} • {task.priority} • {task.phase}
                        </p>
                        {task.description && (
                          <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        {!task.completed && !task.skipped && shouldShowActionButtons && (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleTaskAction(task, 'done')}
                              disabled={!canComplete || updatingTask === `${task.task}-done`}
                              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                canComplete 
                                  ? 'bg-green-600 text-white hover:bg-green-700' 
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                              title={canComplete ? "Complete this task" : "Complete previous tasks first"}
                            >
                              {updatingTask === `${task.task}-done` ? (
                                <>
                                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                  Updating...
                                </>
                              ) : (
                                <>
                                  <CheckCircle size={12} />
                                  Done
                                </>
                              )}
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleTaskAction(task, 'skip')}
                              disabled={updatingTask === `${task.task}-skip`}
                              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                !updatingTask
                                  ? 'bg-gray-600 text-white hover:bg-gray-700' 
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                              title="Skip this task"
                            >
                              {updatingTask === `${task.task}-skip` ? (
                                <>
                                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                  Updating...
                                </>
                              ) : (
                                <>
                                  <XCircle size={12} />
                                  Skip
                                </>
                              )}
                            </motion.button>
                            {shouldShowScanButton && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  setShowCompleteSchedule(false);
                                  setCurrentView('disease-detection');
                                }}
                                className="px-3 py-1 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                title="Scan for diseases and get AI recommendations"
                              >
                                <Camera size={12} />
                                Scan
                              </motion.button>
                            )}
                          </>
                        )}
                        {!task.completed && !task.skipped && !shouldShowActionButtons && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-500">
                            Waiting for previous tasks
                          </span>
                        )}
                        {(task.completed || task.skipped) && (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            task.completed 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {task.completed ? '✓ Completed' : '⏭ Skipped'}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Use Again Modal */}
      {showUseAgainModal && selectedHistoryItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Use Historical Data
            </h3>
            <p className="text-gray-600 mb-6">
              This will load the crop planning data from {new Date(selectedHistoryItem.created_at).toLocaleDateString()} 
              with {selectedHistoryItem.crop_suggestions.length} crop suggestions.
            </p>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowUseAgainModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleUseAgainConfirm}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Use Again
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );

  const renderGrowthMonitoring = () => (
    <EnhancedGrowthMonitoring
      selectedLand={selectedLand}
      cropSchedules={cropSchedules}
      onBack={() => {
        setCurrentView('dashboard');
        refreshAIAnalysisData(); // Refresh AI data when returning to dashboard
      }}
      onScheduleSaved={onScheduleSaved}
    />
  );

  const renderAIChat = () => (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">AI Assistant</h3>
      <p className="text-gray-600">AI chat features coming soon...</p>
    </div>
  );

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
              <span className="font-medium">Back to Lands</span>
            </motion.button>
            
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                  <MapPin className="text-green-600" size={24} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{selectedLand?.name}</h1>
                  <p className="text-gray-600 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="font-semibold text-green-600">{selectedLand?.size} acres</span>
                    <span className="text-gray-400">•</span>
                    <span className="capitalize">{selectedLand?.soil_type} soil</span>
                    <span className="text-gray-400">•</span>
                    <span>Land Details Dashboard</span>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Active</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {currentView === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {renderDashboard()}
            </motion.div>
          )}

          {currentView === 'crop-planning' && (
            <motion.div
              key="crop-planning"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <AIEnhancedCropPlanning 
                selectedLand={selectedLand} 
                onBack={() => {
                  setCurrentView('dashboard');
                  setHistoricalData(null); // Clear historical data when going back
                }}
                onScheduleSaved={onScheduleSaved}
                historicalData={historicalData}
              />
            </motion.div>
          )}

          {currentView === 'disease-detection' && (
            <motion.div
              key="disease-detection"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <EnhancedDiseaseDetection 
                selectedLand={selectedLand} 
                onBack={() => setCurrentView('dashboard')}
                cropSchedules={cropSchedules}
                onScheduleSaved={onScheduleSaved}
              />
            </motion.div>
          )}

          {currentView === 'growth-monitoring' && (
            <motion.div
              key="growth-monitoring"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {renderGrowthMonitoring()}
            </motion.div>
          )}

          {currentView === 'ai-chat' && (
            <motion.div
              key="ai-chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {renderAIChat()}
            </motion.div>
          )}


        </AnimatePresence>
      </div>

      {/* Use Again Modal */}
      {showUseAgainModal && selectedHistoryItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-xl p-6 shadow-xl max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Use Historical Data
            </h3>
            <p className="text-gray-600 mb-6">
              This will load the crop planning data from {new Date(selectedHistoryItem.created_at).toLocaleDateString()} 
              with {selectedHistoryItem.crop_suggestions.length} crop suggestions.
            </p>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowUseAgainModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleUseAgainConfirm}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Use Again
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default LandDetailsDashboard; 