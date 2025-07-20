import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  X, 
  Eye,
  Trash2,
  Clock,
  MapPin,
  Leaf
} from 'lucide-react';

const AlertsComponent = () => {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, disease, schedule, weather

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  // Fetch alerts
  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/alerts`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark alert as read
  const markAsRead = async (alertId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/alerts/${alertId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setAlerts(alerts.map(alert => 
          alert.id === alertId ? { ...alert, is_read: true } : alert
        ));
      }
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  // Delete alert
  const deleteAlert = async (alertId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/alerts/${alertId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setAlerts(alerts.filter(alert => alert.id !== alertId));
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  // Get alert icon based on type
  const getAlertIcon = (alertType) => {
    switch (alertType) {
      case 'disease':
        return <AlertTriangle className="text-red-600" size={20} />;
      case 'schedule':
        return <Clock className="text-blue-600" size={20} />;
      case 'weather':
        return <Info className="text-yellow-600" size={20} />;
      case 'maintenance':
        return <Leaf className="text-green-600" size={20} />;
      default:
        return <Bell className="text-gray-600" size={20} />;
    }
  };

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'high':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'low':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !alert.is_read;
    return alert.alert_type === filter;
  });

  useEffect(() => {
    fetchAlerts();
  }, []);

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
            <Bell className="text-green-600" size={24} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Alerts & Notifications</h1>
              <p className="text-gray-600">
                Stay updated with your farm's health and schedule
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All Alerts', count: alerts.length },
              { key: 'unread', label: 'Unread', count: alerts.filter(a => !a.is_read).length },
              { key: 'disease', label: 'Disease', count: alerts.filter(a => a.alert_type === 'disease').length },
              { key: 'schedule', label: 'Schedule', count: alerts.filter(a => a.alert_type === 'schedule').length },
              { key: 'weather', label: 'Weather', count: alerts.filter(a => a.alert_type === 'weather').length }
            ].map(tab => (
              <motion.button
                key={tab.key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label} ({tab.count})
              </motion.button>
            ))}
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading alerts...</p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 bg-white rounded-xl shadow-lg"
            >
              <CheckCircle className="text-green-600 mx-auto mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No alerts</h3>
              <p className="text-gray-600">You're all caught up! No new alerts to show.</p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {filteredAlerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${
                    alert.is_read ? 'opacity-75' : ''
                  } ${
                    alert.severity === 'critical' ? 'border-l-red-500' :
                    alert.severity === 'high' ? 'border-l-orange-500' :
                    alert.severity === 'medium' ? 'border-l-yellow-500' :
                    'border-l-blue-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getAlertIcon(alert.alert_type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {alert.title}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                            {alert.severity}
                          </span>
                          {!alert.is_read && (
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-3">{alert.message}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>{new Date(alert.created_at).toLocaleDateString()}</span>
                          </div>
                          {alert.land_id && (
                            <div className="flex items-center gap-1">
                              <MapPin size={14} />
                              <span>Land #{alert.land_id.slice(-6)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!alert.is_read && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => markAsRead(alert.id)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Mark as read"
                        >
                          <Eye size={16} />
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => deleteAlert(alert.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete alert"
                      >
                        <Trash2 size={16} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertsComponent; 