import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, MessageCircle } from 'lucide-react';
import './App.css';
import EnhancedLandManagement from './components/EnhancedLandManagement';
import LandDetailsDashboard from './components/LandDetailsDashboard';
import AIEnhancedCropPlanning from './components/AIEnhancedCropPlanning';
import EnhancedMarketplace from './components/EnhancedMarketplace';
import AIChatAssistant from './components/AIChatAssistant';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    email: '', password: '', name: '', user_type: 'farmer', phone: '', address: ''
  });
  
  // Farmer states
  const [lands, setLands] = useState([]);
  const [products, setProducts] = useState([]);
  const [diseaseReports, setDiseaseReports] = useState([]);
  const [plantPlans, setPlantPlans] = useState([]);
  const [cropSchedules, setCropSchedules] = useState([]);
  const [selectedLand, setSelectedLand] = useState(null);
  const [showLandDashboard, setShowLandDashboard] = useState(false);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [newLand, setNewLand] = useState({
    name: '', size: '', soil_type: '', location: { lat: 0, lng: 0 }, crops: []
  });
  const [newProduct, setNewProduct] = useState({
    name: '', description: '', price: '', unit: 'kg', quantity: '', category: '',
    location: { lat: 0, lng: 0 }, image_base64: ''
  });
  
  // Disease detection states
  const [diseaseForm, setDiseaseForm] = useState({
    crop_name: '', land_id: '', image_base64: ''
  });
  const [plantPlanForm, setPlantPlanForm] = useState({
    land_id: '', season: 'spring', preferred_crops: [], goals: ''
  });
  
  // Customer states
  const [availableProducts, setAvailableProducts] = useState([]);
  const [userLocation, setUserLocation] = useState({ lat: 0, lng: 0 });
  
  // Refs
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Add auto-dismiss for success messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Add auto-dismiss for error messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchProfile(token);
    }
    
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.log('Location error:', error)
      );
    }
  }, []);

  useEffect(() => {
    console.log('🔄 User state changed:', user ? user.user_type : 'null');
    if (user) {
      if (user.user_type === 'farmer') {
        console.log('🌾 Fetching farmer data...');
        fetchFarmerData();
      } else {
        console.log('🛒 Fetching customer data...');
        fetchCustomerData();
      }
    }
  }, [user]);

  const fetchProfile = async (token) => {
    console.log('🔄 Fetching user profile...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const userData = await response.json();
        console.log('✅ User profile loaded:', userData.user_type);
        setUser(userData);
      } else {
        console.log('❌ Profile fetch failed, removing token');
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
    }
  };

  const fetchFarmerData = async () => {
    const token = localStorage.getItem('token');
    try {
      // Fetch lands
      const landsResponse = await fetch(`${API_BASE_URL}/api/lands`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      let landsData = [];
      if (landsResponse.ok) {
        landsData = await landsResponse.json();
        setLands(landsData);
      }

      // Fetch products
      const productsResponse = await fetch(`${API_BASE_URL}/api/my-products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setProducts(productsData);
      }

      // Fetch disease reports
      const reportsResponse = await fetch(`${API_BASE_URL}/api/disease-reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        setDiseaseReports(reportsData);
      }

      // Fetch plant plans
      const plansResponse = await fetch(`${API_BASE_URL}/api/plant-plans`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        setPlantPlans(plansData);
      }

      // Fetch crop schedules for all lands
      if (landsData.length > 0) {
        console.log('🔄 Fetching crop schedules for', landsData.length, 'lands');
        const schedulesPromises = landsData.map(land => 
          fetch(`${API_BASE_URL}/api/crop-schedules/${land.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          }).then(res => res.ok ? res.json() : [])
        );
        
        const schedulesResults = await Promise.all(schedulesPromises);
        const allSchedules = schedulesResults.flat();
        console.log('📋 Total crop schedules loaded:', allSchedules.length);
        setCropSchedules(allSchedules);
      } else {
        console.log('⚠️ No lands found, skipping crop schedule fetch');
        setCropSchedules([]);
      }
    } catch (error) {
      console.error('Farmer data fetch error:', error);
    }
  };

  const fetchCustomerData = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/products?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=50`
      );
      if (response.ok) {
        const productsData = await response.json();
        setAvailableProducts(productsData);
      }
    } catch (error) {
      console.error('Customer data fetch error:', error);
    }
  };

  // Function to refresh crop schedules for a specific land
  const refreshCropSchedules = async (landId) => {
    console.log('🔄 Refreshing crop schedules for land:', landId);
    const token = localStorage.getItem('token');
    try {
      // Fetch both crop schedules and cultivation cycles
      const [schedulesResponse, cyclesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/crop-schedules/${landId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/cultivation-cycles/${landId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      let allSchedules = [];
      
      // Process crop schedules
      if (schedulesResponse.ok) {
        const cropSchedules = await schedulesResponse.json();
        console.log('📋 Crop schedules received for land', landId, ':', cropSchedules.length, 'schedules');
        allSchedules.push(...cropSchedules);
      } else {
        console.error('❌ Failed to fetch crop schedules, status:', schedulesResponse.status);
      }
      
      // Process cultivation cycles
      if (cyclesResponse.ok) {
        const cultivationCycles = await cyclesResponse.json();
        console.log('🌾 Cultivation cycles received for land', landId, ':', cultivationCycles.length, 'cycles');
        
        // Convert cultivation cycles to schedule format for compatibility
        const convertedCycles = cultivationCycles.map(cycle => {
          // For cultivation cycles, we'll use calendar days since they don't have task-based progress
          let daysElapsed = 0;
          if (cycle.start_date) {
            try {
              const startDate = new Date(cycle.start_date);
              const today = new Date();
              const timeDiff = today.getTime() - startDate.getTime();
              daysElapsed = Math.floor(timeDiff / (1000 * 3600 * 24));
            } catch (e) {
              console.log('Error calculating days elapsed:', e);
            }
          }
          
          // Determine current stage based on days elapsed and status
          let currentStage = cycle.status;
          if (cycle.status === 'active') {
            if (daysElapsed < 7) {
              currentStage = 'Germination';
            } else if (daysElapsed < 30) {
              currentStage = 'Vegetative';
            } else if (daysElapsed < 60) {
              currentStage = 'Flowering';
            } else if (daysElapsed < 90) {
              currentStage = 'Fruiting';
            } else {
              currentStage = 'Harvest Ready';
            }
          } else if (cycle.status === 'completed') {
            currentStage = 'Harvested';
          }
          
          return {
            ...cycle,
            // Map cycle fields to schedule fields
            active: cycle.status === 'active',
            current_stage: currentStage,
            days_elapsed: daysElapsed,
            schedule: [] // Cycles don't have tasks in the same format
          };
        });
        
        allSchedules.push(...convertedCycles);
      } else {
        console.error('❌ Failed to fetch cultivation cycles, status:', cyclesResponse.status);
      }
      
      // Log all schedules
      allSchedules.forEach(schedule => {
        console.log(`  - ${schedule.crop_name} (${schedule.active ? 'ACTIVE' : 'inactive'}) - Stage: ${schedule.current_stage}`);
        if (schedule.schedule) {
          const completedTasks = schedule.schedule.filter(task => task.completed || task.skipped).length;
          const totalTasks = schedule.schedule.length;
          console.log(`    Tasks: ${completedTasks}/${totalTasks} completed/skipped`);
        }
      });
      
      setCropSchedules(prev => {
        // Remove old schedules for this land and add new ones
        const filtered = prev.filter(schedule => schedule.land_id !== landId);
        const updated = [...filtered, ...allSchedules];
        console.log('📊 Updated crop schedules total:', updated.length);
        return updated;
      });
    } catch (error) {
      console.error('Error refreshing crop schedules:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        setUser(data.user);
        setCurrentView('dashboard');
        setSuccess(`Welcome back, ${data.user.name}! 🎉 You're now logged in to AgriVerse.`);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm)
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        setUser(data.user);
        setCurrentView('dashboard');
        setSuccess(`Welcome to AgriVerse, ${data.user.name}! 🌾 Your account has been created successfully.`);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Registration failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCurrentView('home');
  };

  const handleFileUpload = (e, callback) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target.result.split(',')[1];
        callback(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddLand = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/lands`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...newLand,
          size: parseFloat(newLand.size),
          crops: newLand.crops.split(',').map(c => c.trim()).filter(c => c)
        })
      });
      
      if (response.ok) {
        const landData = await response.json();
        setLands([...lands, landData]);
        setNewLand({ name: '', size: '', soil_type: '', location: { lat: 0, lng: 0 }, crops: [] });
        setSuccess(`🌱 Land "${landData.name}" added successfully! You can now start planning your crops.`);
      } else {
        setError('Failed to add land');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...newProduct,
          price: parseFloat(newProduct.price),
          quantity: parseInt(newProduct.quantity)
        })
      });
      
      if (response.ok) {
        const productData = await response.json();
        setProducts([...products, productData]);
        setNewProduct({
          name: '', description: '', price: '', unit: 'kg', quantity: '', category: '',
          location: { lat: 0, lng: 0 }, image_base64: ''
        });
        setSuccess(`🛒 Product "${productData.name}" added to marketplace successfully!`);
      } else {
        setError('Failed to add product');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleDiseaseDetection = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/detect-disease`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(diseaseForm)
      });
      
      if (response.ok) {
        const reportData = await response.json();
        setDiseaseReports([reportData, ...diseaseReports]);
        setDiseaseForm({ crop_name: '', land_id: '', image_base64: '' });
        setSuccess(`🔬 Disease detection completed! Check your reports for detailed analysis.`);
      } else {
        setError('Failed to detect disease');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleCreatePlantPlan = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/plant-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...plantPlanForm,
          preferred_crops: plantPlanForm.preferred_crops.split(',').map(c => c.trim()).filter(c => c)
        })
      });
      
      if (response.ok) {
        const planData = await response.json();
        setPlantPlans([planData, ...plantPlans]);
        setPlantPlanForm({ land_id: '', season: 'spring', preferred_crops: [], goals: '' });
        setSuccess(`📋 Plant plan created successfully! Your AI-powered farming strategy is ready.`);
      } else {
        setError('Failed to create plant plan');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  const renderHome = () => (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Welcome to AgriVerse</h1>
          <p className="hero-subtitle">
            Empowering farmers with AI-powered tools for disease detection, smart planning, and marketplace access
          </p>
          <div className="hero-buttons">
            <button onClick={() => setCurrentView('login')} className="btn btn-primary">
              Get Started
            </button>
            <button onClick={() => setCurrentView('register')} className="btn btn-secondary">
              Join as Farmer
            </button>
          </div>
        </div>
        <div className="hero-image">
          <img src="https://images.unsplash.com/photo-1647268772035-85a4cf15d37a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwzfHxzbWFydCUyMGZhcm1pbmd8ZW58MHx8fGdyZWVufDE3NTI4Njk1MDB8MA&ixlib=rb-4.1.0&q=85" alt="Smart Farming" />
        </div>
      </div>
      
      <div className="features-section">
        <h2 className="section-title">Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <img src="https://images.unsplash.com/photo-1720071702672-d18c69cb475c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwxfHxhZ3JpY3VsdHVyYWwlMjB0ZWNobm9sb2d5fGVufDB8fHxncmVlbnwxNzUyODY5NTExfDA&ixlib=rb-4.1.0&q=85" alt="AI Disease Detection" />
            <h3>AI Disease Detection</h3>
            <p>Upload crop images and get instant AI-powered disease diagnosis with treatment recommendations</p>
          </div>
          <div className="feature-card">
            <img src="https://images.unsplash.com/photo-1558906307-1a1c52b5ac8a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwyfHxhZ3JpY3VsdHVyYWwlMjB0ZWNobm9sb2d5fGVufDB8fHxncmVlbnwxNzUyODY5NTExfDA&ixlib=rb-4.1.0&q=85" alt="Smart Planning" />
            <h3>Smart Farm Planning</h3>
            <p>Get AI-generated planting schedules, crop rotation plans, and yield optimization strategies</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🛒</div>
            <h3>Marketplace</h3>
            <p>Connect directly with customers and sell your produce through our integrated marketplace</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLogin = () => (
    <div className="auth-container">
      <form onSubmit={handleLogin} className="auth-form">
        <h2>Login to AgriVerse</h2>
        <div className="form-group">
          <input
            type="email"
            placeholder="Email"
            value={loginForm.email}
            onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="Password"
            value={loginForm.password}
            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <p>
          Don't have an account?{' '}
          <button type="button" onClick={() => setCurrentView('register')} className="link-btn">
            Register here
          </button>
        </p>
      </form>
    </div>
  );

  const renderRegister = () => (
    <div className="auth-container">
      <form onSubmit={handleRegister} className="auth-form">
        <h2>Join AgriVerse</h2>
        <div className="form-group">
          <input
            type="text"
            placeholder="Full Name"
            value={registerForm.name}
            onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <input
            type="email"
            placeholder="Email"
            value={registerForm.email}
            onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="Password"
            value={registerForm.password}
            onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <select
            value={registerForm.user_type}
            onChange={(e) => setRegisterForm({ ...registerForm, user_type: e.target.value })}
            required
          >
            <option value="farmer">Farmer</option>
            <option value="customer">Customer</option>
          </select>
        </div>
        <div className="form-group">
          <input
            type="tel"
            placeholder="Phone Number"
            value={registerForm.phone}
            onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
          />
        </div>
        <div className="form-group">
          <input
            type="text"
            placeholder="Address"
            value={registerForm.address}
            onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
        <p>
          Already have an account?{' '}
          <button type="button" onClick={() => setCurrentView('login')} className="link-btn">
            Login here
          </button>
        </p>
      </form>
    </div>
  );

  const renderFarmerDashboard = () => {
    // Show marketplace
    if (showMarketplace) {
      return (
        <EnhancedMarketplace
          user={user}
          onBack={() => setShowMarketplace(false)}
        />
      );
    }

    // If a land is selected, show the land dashboard
    if (showLandDashboard && selectedLand) {
      return (
        <LandDetailsDashboard
          selectedLand={selectedLand}
          cropSchedules={cropSchedules.filter(schedule => schedule.land_id === selectedLand.id)}
          onScheduleSaved={() => refreshCropSchedules(selectedLand.id)}
          onBack={() => {
            setShowLandDashboard(false);
            setSelectedLand(null);
          }}
        />
      );
    }

    // Show enhanced land management
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white shadow-sm border-b"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Farmer Dashboard</h1>
                <p className="text-gray-600">Welcome back, {user?.name}!</p>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowMarketplace(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <ShoppingCart size={20} />
                  Marketplace
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAIChat(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <MessageCircle size={20} />
                  AI Assistant
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EnhancedLandManagement
            user={user}
            lands={lands}
            cropSchedules={cropSchedules}
            onLandAdded={(newLand) => {
              setLands(prev => [...prev, newLand]);
            }}
            onLandSelected={(land) => {
              setSelectedLand(land);
              setShowLandDashboard(true);
            }}
          />
        </div>

        {/* AI Chat Assistant */}
        <AIChatAssistant
          selectedLand={selectedLand}
          isOpen={showAIChat}
          onToggle={() => setShowAIChat(!showAIChat)}
          onClose={() => setShowAIChat(false)}
        />
      </div>
    );
  };

  const renderCustomerDashboard = () => (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {user?.name}!</h1>
        <p>Discover fresh produce from local farmers</p>
      </div>
      <div className="section">
        <h2>Available Products Near You</h2>
        <div className="items-grid">
          {availableProducts.map(product => (
            <div key={product.id} className="item-card">
              {product.image_base64 && (
                <img src={`data:image/jpeg;base64,${product.image_base64}`} alt={product.name} />
              )}
              <h4>{product.name}</h4>
              <p>{product.description}</p>
              <p className="price">${product.price} per {product.unit}</p>
              <p>Available: {product.quantity} {product.unit}</p>
              <p>Category: {product.category}</p>
              <button className="btn btn-primary">Contact Farmer</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="App">
      <header className="header">
        <div className="header-content">
          <h1 className="logo" onClick={() => setCurrentView('home')}>🌾 AgriVerse</h1>
          <nav className="nav">
            {!user ? (
              <>
                <button onClick={() => setCurrentView('home')} className="nav-btn">Home</button>
                <button onClick={() => setCurrentView('login')} className="nav-btn">Login</button>
                <button onClick={() => setCurrentView('register')} className="nav-btn">Register</button>
              </>
            ) : (
              <>
                <button onClick={() => setCurrentView('dashboard')} className="nav-btn">Dashboard</button>
                <button onClick={handleLogout} className="nav-btn">Logout</button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="main">
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-100 border border-red-400 text-red-700 px-6 py-3 rounded-lg shadow-lg max-w-md"
          >
            <div className="flex items-center gap-2">
              <span className="text-red-500">⚠️</span>
              <span>{error}</span>
              <button 
                onClick={() => setError('')} 
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-green-100 border border-green-400 text-green-700 px-6 py-3 rounded-lg shadow-lg max-w-md"
          >
            <div className="flex items-center gap-2">
              <span className="text-green-500">✅</span>
              <span>{success}</span>
              <button 
                onClick={() => setSuccess('')} 
                className="ml-auto text-green-500 hover:text-green-700"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
        
        {currentView === 'home' && renderHome()}
        {currentView === 'login' && renderLogin()}
        {currentView === 'register' && renderRegister()}
        {currentView === 'dashboard' && user?.user_type === 'farmer' && renderFarmerDashboard()}
        {currentView === 'dashboard' && user?.user_type === 'customer' && renderCustomerDashboard()}
      </main>
    </div>
  );
}

export default App;