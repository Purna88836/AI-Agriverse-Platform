import React, { useState, useEffect, useRef } from 'react';
import './App.css';

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
    if (user) {
      if (user.user_type === 'farmer') {
        fetchFarmerData();
      } else {
        fetchCustomerData();
      }
    }
  }, [user]);

  const fetchProfile = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
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
      if (landsResponse.ok) {
        const landsData = await landsResponse.json();
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
        setSuccess('Login successful!');
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
        setSuccess('Registration successful!');
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
        setSuccess('Land added successfully!');
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
        setSuccess('Product added successfully!');
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
        setSuccess('Disease detection completed!');
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
        setSuccess('Plant plan created successfully!');
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

  const renderFarmerDashboard = () => (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {user?.name}!</h1>
        <div className="dashboard-nav">
          <button 
            onClick={() => setCurrentView('lands')} 
            className={currentView === 'lands' ? 'nav-btn active' : 'nav-btn'}
          >
            My Lands
          </button>
          <button 
            onClick={() => setCurrentView('products')} 
            className={currentView === 'products' ? 'nav-btn active' : 'nav-btn'}
          >
            My Products
          </button>
          <button 
            onClick={() => setCurrentView('disease-detection')} 
            className={currentView === 'disease-detection' ? 'nav-btn active' : 'nav-btn'}
          >
            Disease Detection
          </button>
          <button 
            onClick={() => setCurrentView('plant-planning')} 
            className={currentView === 'plant-planning' ? 'nav-btn active' : 'nav-btn'}
          >
            Plant Planning
          </button>
        </div>
      </div>

      {currentView === 'lands' && (
        <div className="section">
          <h2>My Lands</h2>
          <div className="add-form">
            <h3>Add New Land</h3>
            <form onSubmit={handleAddLand} className="form-grid">
              <input
                type="text"
                placeholder="Land Name"
                value={newLand.name}
                onChange={(e) => setNewLand({ ...newLand, name: e.target.value })}
                required
              />
              <input
                type="number"
                placeholder="Size (acres)"
                value={newLand.size}
                onChange={(e) => setNewLand({ ...newLand, size: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Soil Type"
                value={newLand.soil_type}
                onChange={(e) => setNewLand({ ...newLand, soil_type: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Crops (comma-separated)"
                value={newLand.crops}
                onChange={(e) => setNewLand({ ...newLand, crops: e.target.value })}
              />
              <button type="submit" className="btn btn-primary">Add Land</button>
            </form>
          </div>
          <div className="items-grid">
            {lands.map(land => (
              <div key={land.id} className="item-card">
                <h4>{land.name}</h4>
                <p>Size: {land.size} acres</p>
                <p>Soil: {land.soil_type}</p>
                <p>Crops: {land.crops.join(', ')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentView === 'products' && (
        <div className="section">
          <h2>My Products</h2>
          <div className="add-form">
            <h3>Add New Product</h3>
            <form onSubmit={handleAddProduct} className="form-grid">
              <input
                type="text"
                placeholder="Product Name"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Description"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                required
              />
              <input
                type="number"
                placeholder="Price"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                required
              />
              <select
                value={newProduct.unit}
                onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
              >
                <option value="kg">kg</option>
                <option value="ton">ton</option>
                <option value="piece">piece</option>
                <option value="bag">bag</option>
              </select>
              <input
                type="number"
                placeholder="Quantity"
                value={newProduct.quantity}
                onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Category"
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                required
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, (base64) => setNewProduct({ ...newProduct, image_base64: base64 }))}
              />
              <button type="submit" className="btn btn-primary">Add Product</button>
            </form>
          </div>
          <div className="items-grid">
            {products.map(product => (
              <div key={product.id} className="item-card">
                {product.image_base64 && (
                  <img src={`data:image/jpeg;base64,${product.image_base64}`} alt={product.name} />
                )}
                <h4>{product.name}</h4>
                <p>{product.description}</p>
                <p>Price: ${product.price} per {product.unit}</p>
                <p>Quantity: {product.quantity} {product.unit}</p>
                <p>Category: {product.category}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentView === 'disease-detection' && (
        <div className="section">
          <h2>Disease Detection</h2>
          <div className="add-form">
            <h3>Analyze Crop Image</h3>
            <form onSubmit={handleDiseaseDetection} className="form-grid">
              <input
                type="text"
                placeholder="Crop Name"
                value={diseaseForm.crop_name}
                onChange={(e) => setDiseaseForm({ ...diseaseForm, crop_name: e.target.value })}
                required
              />
              <select
                value={diseaseForm.land_id}
                onChange={(e) => setDiseaseForm({ ...diseaseForm, land_id: e.target.value })}
              >
                <option value="">Select Land (Optional)</option>
                {lands.map(land => (
                  <option key={land.id} value={land.id}>{land.name}</option>
                ))}
              </select>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, (base64) => setDiseaseForm({ ...diseaseForm, image_base64: base64 }))}
                required
              />
              <button type="submit" className="btn btn-primary">Analyze Disease</button>
            </form>
          </div>
          <div className="items-grid">
            {diseaseReports.map(report => (
              <div key={report.id} className="item-card">
                <img src={`data:image/jpeg;base64,${report.image_base64}`} alt={report.crop_name} />
                <h4>{report.crop_name}</h4>
                <p>Confidence: {report.confidence}%</p>
                <div className="diagnosis">
                  <h5>AI Diagnosis:</h5>
                  <p>{report.ai_diagnosis}</p>
                </div>
                <div className="recommendations">
                  <h5>Recommendations:</h5>
                  {report.recommendations.map((rec, idx) => (
                    <p key={idx}>{rec}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentView === 'plant-planning' && (
        <div className="section">
          <h2>Plant Planning</h2>
          <div className="add-form">
            <h3>Create Plant Plan</h3>
            <form onSubmit={handleCreatePlantPlan} className="form-grid">
              <select
                value={plantPlanForm.land_id}
                onChange={(e) => setPlantPlanForm({ ...plantPlanForm, land_id: e.target.value })}
                required
              >
                <option value="">Select Land</option>
                {lands.map(land => (
                  <option key={land.id} value={land.id}>{land.name}</option>
                ))}
              </select>
              <select
                value={plantPlanForm.season}
                onChange={(e) => setPlantPlanForm({ ...plantPlanForm, season: e.target.value })}
              >
                <option value="spring">Spring</option>
                <option value="summer">Summer</option>
                <option value="fall">Fall</option>
                <option value="winter">Winter</option>
              </select>
              <input
                type="text"
                placeholder="Preferred Crops (comma-separated)"
                value={plantPlanForm.preferred_crops}
                onChange={(e) => setPlantPlanForm({ ...plantPlanForm, preferred_crops: e.target.value })}
                required
              />
              <textarea
                placeholder="Goals and Requirements"
                value={plantPlanForm.goals}
                onChange={(e) => setPlantPlanForm({ ...plantPlanForm, goals: e.target.value })}
                required
              />
              <button type="submit" className="btn btn-primary">Create Plan</button>
            </form>
          </div>
          <div className="items-grid">
            {plantPlans.map(plan => (
              <div key={plan.id} className="item-card">
                <h4>{plan.season.charAt(0).toUpperCase() + plan.season.slice(1)} Plan</h4>
                <p>Crops: {plan.crops.join(', ')}</p>
                <p>Goals: {plan.plan_details}</p>
                <div className="ai-recommendations">
                  <h5>AI Recommendations:</h5>
                  <p>{plan.ai_recommendations}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

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
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        {currentView === 'home' && renderHome()}
        {currentView === 'login' && renderLogin()}
        {currentView === 'register' && renderRegister()}
        {currentView === 'dashboard' && user?.user_type === 'farmer' && renderFarmerDashboard()}
        {currentView === 'dashboard' && user?.user_type === 'customer' && renderCustomerDashboard()}
        {user?.user_type === 'farmer' && ['lands', 'products', 'disease-detection', 'plant-planning'].includes(currentView) && renderFarmerDashboard()}
      </main>
    </div>
  );
}

export default App;