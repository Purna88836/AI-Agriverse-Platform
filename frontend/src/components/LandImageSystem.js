import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sun, 
  Droplets, 
  Thermometer, 
  Wind
} from 'lucide-react';

const LandImageSystem = ({ 
  landData, 
  cropStage, 
  nextAction, 
  progress = 0,
  isActive = false,
  weatherData = null
}) => {
  
  // PUBG-style grass field configurations with fruits
  const cropStages = {
    'no-crop-planted': {
      name: 'Land Ready',
      description: 'Land is prepared and ready for planting',
      grassDensity: 0.3,
      grassHeight: 0.1,
      grassColor: '#8B4513',
      showPlow: true,
      soilTexture: 'dry',
      hasFruits: false
    },
    'just-planted': {
      name: 'Seeds Planted',
      description: 'Seeds have been planted in the soil',
      grassDensity: 0.4,
      grassHeight: 0.2,
      grassColor: '#228B22',
      showPlow: false,
      soilTexture: 'moist',
      hasFruits: false
    },
    'germination': {
      name: 'Germination',
      description: 'Seeds are sprouting and breaking through soil',
      grassDensity: 0.6,
      grassHeight: 0.4,
      grassColor: '#32CD32',
      showPlow: false,
      soilTexture: 'moist',
      hasFruits: false
    },
    'vegetative-growth': {
      name: 'Vegetative Growth',
      description: 'Plants are growing leaves and stems',
      grassDensity: 0.8,
      grassHeight: 0.7,
      grassColor: '#228B22',
      showPlow: false,
      soilTexture: 'moist',
      hasFruits: false
    },
    'flowering': {
      name: 'Flowering',
      description: 'Plants are producing flowers',
      grassDensity: 0.9,
      grassHeight: 0.9,
      grassColor: '#228B22',
      showPlow: false,
      soilTexture: 'moist',
      hasFruits: false
    },
    'fruiting': {
      name: 'Fruiting',
      description: 'Fruits are developing on the plants',
      grassDensity: 1.0,
      grassHeight: 1.0,
      grassColor: '#228B22',
      showPlow: false,
      soilTexture: 'moist',
      hasFruits: true,
      fruitColor: '#FF4500'
    },
    'harvest-ready': {
      name: 'Harvest Ready',
      description: 'Crops are ready for harvest',
      grassDensity: 1.0,
      grassHeight: 1.0,
      grassColor: '#DAA520',
      showPlow: false,
      soilTexture: 'dry',
      hasFruits: true,
      fruitColor: '#FFD700'
    }
  };

  // Dynamic weather conditions
  const getWeatherCondition = () => {
    if (!weatherData) return 'sunny';
    
    const temp = weatherData.temperature || 25;
    const humidity = weatherData.humidity || 50;
    const windSpeed = weatherData.wind_speed || 5;
    const description = (weatherData.description || '').toLowerCase();
    
    if (description.includes('rain') || description.includes('drizzle') || humidity > 80) {
      return 'rainy';
    } else if (description.includes('cloud') || description.includes('overcast')) {
      return 'cloudy';
    } else if (windSpeed > 15 || description.includes('wind')) {
      return 'windy';
    } else {
      return 'sunny';
    }
  };

  const [weather, setWeather] = useState({
    temperature: weatherData?.temperature || 28,
    humidity: weatherData?.humidity || 65,
    windSpeed: weatherData?.wind_speed || 8,
    condition: getWeatherCondition(),
    windDirection: 'right'
  });

  useEffect(() => {
    if (weatherData) {
      setWeather({
        temperature: weatherData.temperature || 28,
        humidity: weatherData.humidity || 65,
        windSpeed: weatherData.wind_speed || 8,
        condition: getWeatherCondition(),
        windDirection: weatherData.wind_speed > 15 ? 'right' : 'left'
      });
    }
  }, [weatherData]);

  const getValidStage = (stage) => {
    if (!stage) return 'no-crop-planted';
    
    const normalizedStage = stage.toLowerCase().replace(/\s+/g, '-');
    
    if (cropStages[normalizedStage]) {
      return normalizedStage;
    }
    
    const stageKeys = Object.keys(cropStages);
    const matchingStage = stageKeys.find(key => 
      key.includes(normalizedStage) || normalizedStage.includes(key)
    );
    
    return matchingStage || 'no-crop-planted';
  };

  const currentStage = getValidStage(cropStage);
  const stage = cropStages[currentStage] || cropStages['no-crop-planted'];

  // Performance-optimized grass generation with useMemo
  const grassBlades = useMemo(() => {
    const blades = [];
    const gridSize = 15; // Reduced for performance
    const density = stage.grassDensity;
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (Math.random() < density) {
          const x = (i / gridSize) * 100 + (Math.random() - 0.5) * 5;
          const y = (j / gridSize) * 100 + (Math.random() - 0.5) * 5;
          const height = stage.grassHeight + (Math.random() - 0.5) * 0.2;
          
          blades.push({
            x: Math.max(0, Math.min(100, x)),
            y: Math.max(0, Math.min(100, y)),
            height: Math.max(0.1, Math.min(1.0, height)),
            index: i * gridSize + j,
            hasFruit: stage.hasFruits && Math.random() > 0.7 // 30% chance for fruits
          });
        }
      }
    }
    
    return blades;
  }, [stage.grassDensity, stage.grassHeight, stage.hasFruits]);

  // PUBG-style Grass Blade Component with Fruits and Rain Response
  const GrassBlade = ({ x, y, height, index, isWindy, windIntensity, hasFruit }) => {
    const bladeWidth = 1 + (height * 2);
    const bladeHeight = 10 + (height * 80);
    const bladeColor = stage.grassColor;
    
    // Create natural variation
    const variation = Math.sin(index * 0.5) * 0.3;
    const windOffset = isWindy ? Math.sin(index * 0.2 + Date.now() * 0.001) * windIntensity * 5 : 0;
    
    // Rain makes grass move slowly and continuously
    const isRaining = weather.condition === 'rainy';
    const rainMovement = isRaining ? Math.sin(index * 0.1 + Date.now() * 0.0005) * 2 : 0;
    
    return (
      <motion.div
        className="absolute"
        style={{
          left: `${x}%`,
          bottom: `${y}%`,
          width: `${bladeWidth}px`,
          height: `${bladeHeight}px`,
          transformOrigin: 'bottom center'
        }}
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ 
          scaleY: 1, 
          opacity: 0.8 + variation,
          rotate: isWindy ? [-2 + windOffset, 2 + windOffset, -2 + windOffset] : 
                  isRaining ? [-1 + rainMovement, 1 + rainMovement, -1 + rainMovement] : 0,
          x: isWindy ? windOffset : isRaining ? rainMovement : 0,
          y: isRaining ? [0, -1, 0] : 0
        }}
        transition={{
          scaleY: { delay: index * 0.005, duration: 0.3 },
          opacity: { delay: index * 0.005, duration: 0.3 },
          rotate: isWindy ? {
            duration: 2 + Math.random(),
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          } : isRaining ? {
            duration: 4 + Math.random(),
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          } : {},
          x: isWindy ? {
            duration: 1.5 + Math.random(),
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          } : isRaining ? {
            duration: 3 + Math.random(),
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          } : {},
          y: isRaining ? {
            duration: 2 + Math.random(),
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          } : {}
        }}
      >
        {/* Grass blade with gradient and shadow */}
        <div
          className="w-full h-full relative"
          style={{
            background: `linear-gradient(90deg, 
              ${bladeColor}40 0%, 
              ${bladeColor} 20%, 
              ${bladeColor} 80%, 
              ${bladeColor}40 100%)`,
            borderRadius: '50% 50% 0 0',
            boxShadow: `
              inset -1px 0 2px rgba(0,0,0,0.3),
              inset 1px 0 2px rgba(255,255,255,0.2),
              0 2px 4px rgba(0,0,0,0.2)
            `,
            transform: 'perspective(100px) rotateX(5deg)',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
          }}
        />
        
        {/* Grass blade tip */}
        <div
          className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0 h-0"
          style={{
            borderLeft: `${bladeWidth * 0.3}px solid transparent`,
            borderRight: `${bladeWidth * 0.3}px solid transparent`,
            borderBottom: `${bladeHeight * 0.1}px solid ${bladeColor}`,
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
          }}
        />

        {/* Fruit on grass blade */}
        {hasFruit && stage.hasFruits && (
          <motion.div
            className="absolute"
            style={{
              left: '50%',
              top: `${bladeHeight * 0.3}px`,
              transform: 'translateX(-50%)',
              width: `${bladeWidth * 2}px`,
              height: `${bladeWidth * 2}px`,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${stage.fruitColor} 0%, ${stage.fruitColor}80 70%, ${stage.fruitColor}40 100%)`,
              boxShadow: `
                inset -1px -1px 3px rgba(0,0,0,0.3),
                inset 1px 1px 3px rgba(255,255,255,0.3),
                0 2px 6px rgba(0,0,0,0.4)
              `,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: 1,
              y: isWindy ? [0, -2, 0] : isRaining ? [0, -1, 0] : 0
            }}
            transition={{
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
              y: isWindy ? { duration: 2, repeat: Infinity, ease: "easeInOut" } :
                  isRaining ? { duration: 3, repeat: Infinity, ease: "easeInOut" } : {}
            }}
          />
        )}
      </motion.div>
    );
  };

  // Animated Sun Component
  const AnimatedSun = () => (
    <motion.div
      className="absolute top-8 right-8 w-16 h-16"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, duration: 1 }}
    >
      {/* Sun glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,0,0.8) 0%, rgba(255,255,0,0.4) 50%, transparent 100%)',
          filter: 'blur(8px)'
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.6, 0.8, 0.6]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Sun core */}
      <div
        className="absolute inset-2 rounded-full"
        style={{
          background: 'radial-gradient(circle, #FFD700 0%, #FFA500 50%, #FF8C00 100%)',
          boxShadow: '0 0 20px rgba(255,215,0,0.6)'
        }}
      />
      
      {/* Sun rays */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-6 bg-yellow-400 rounded-full"
          style={{
            left: '50%',
            top: '50%',
            transformOrigin: 'center bottom',
            transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-12px)`
          }}
          animate={{
            scaleY: [1, 1.3, 1],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut"
          }}
        />
      ))}
    </motion.div>
  );

  // Enhanced Animated Clouds Component with Realistic Shapes
  const AnimatedClouds = () => {
    const clouds = [
      // Close clouds
      { size: 60, speed: 0.3, delay: 0, opacity: 0.8, distance: 'close', shape: 'cumulus' },
      { size: 40, speed: 0.5, delay: 2, opacity: 0.6, distance: 'close', shape: 'stratus' },
      { size: 80, speed: 0.2, delay: 4, opacity: 0.7, distance: 'close', shape: 'cumulonimbus' },
      { size: 50, speed: 0.4, delay: 6, opacity: 0.5, distance: 'close', shape: 'cirrus' },
      // Distant clouds
      { size: 100, speed: 0.1, delay: 1, opacity: 0.3, distance: 'distant', shape: 'cumulus' },
      { size: 70, speed: 0.15, delay: 3, opacity: 0.2, distance: 'distant', shape: 'stratus' },
      { size: 120, speed: 0.08, delay: 5, opacity: 0.25, distance: 'distant', shape: 'cumulonimbus' }
    ];

    const getCloudShape = (shape, size) => {
      switch (shape) {
        case 'cumulus':
          return (
            <div className="w-full h-full relative">
              <div
                className="absolute w-4/5 h-4/5 rounded-full"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 70%, rgba(255,255,255,0.3) 100%)',
                  top: '10%',
                  left: '10%',
                  filter: 'blur(1px)'
                }}
              />
              <div
                className="absolute w-3/5 h-3/5 rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.8)',
                  top: '20%',
                  right: '15%',
                  filter: 'blur(1px)'
                }}
              />
              <div
                className="absolute w-2/5 h-2/5 rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  bottom: '10%',
                  left: '20%',
                  filter: 'blur(1px)'
                }}
              />
            </div>
          );
        case 'stratus':
          return (
            <div className="w-full h-full relative">
              <div
                className="absolute w-full h-3/4 rounded-full"
                style={{
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.5) 100%)',
                  top: '10%',
                  filter: 'blur(2px)'
                }}
              />
            </div>
          );
        case 'cumulonimbus':
          return (
            <div className="w-full h-full relative">
              <div
                className="absolute w-5/6 h-5/6 rounded-full"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.9) 0%, rgba(200,200,200,0.7) 70%, rgba(150,150,150,0.4) 100%)',
                  top: '5%',
                  left: '5%',
                  filter: 'blur(1px)'
                }}
              />
              <div
                className="absolute w-3/4 h-3/4 rounded-full"
                style={{
                  background: 'rgba(180,180,180,0.8)',
                  top: '15%',
                  right: '10%',
                  filter: 'blur(1px)'
                }}
              />
              <div
                className="absolute w-1/2 h-1/2 rounded-full"
                style={{
                  background: 'rgba(160,160,160,0.6)',
                  bottom: '5%',
                  left: '15%',
                  filter: 'blur(1px)'
                }}
              />
            </div>
          );
        case 'cirrus':
          return (
            <div className="w-full h-full relative">
              <div
                className="absolute w-full h-1/2 rounded-full"
                style={{
                  background: 'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
                  top: '25%',
                  filter: 'blur(3px)'
                }}
              />
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <>
        {clouds.map((cloud, index) => (
          <motion.div
            key={index}
            className="absolute"
            style={{
              width: `${cloud.size}px`,
              height: `${cloud.size * 0.6}px`,
              top: cloud.distance === 'distant' ? `${5 + index * 8}%` : `${20 + index * 12}%`,
              left: '-60px',
              opacity: cloud.opacity,
              zIndex: cloud.distance === 'distant' ? 1 : 2
            }}
            initial={{ x: -60 }}
            animate={{ x: '100vw' }}
            transition={{
              duration: cloud.distance === 'distant' ? 40 / cloud.speed : 20 / cloud.speed,
              delay: cloud.delay,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            {getCloudShape(cloud.shape, cloud.size)}
          </motion.div>
        ))}
      </>
    );
  };

  // Enhanced Wind Flow Effect
  const WindFlow = () => {
    if (weather.condition !== 'windy') return null;
    
    const windIntensity = Math.min(weather.windSpeed / 20, 1);
    
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <linearGradient id="windGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="30%" stopColor="rgba(255,255,255,0.1)" />
              <stop offset="70%" stopColor="rgba(255,255,255,0.1)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
          
          {[...Array(6)].map((_, i) => (
            <motion.path
              key={i}
              d={`M -50 ${15 + i * 12} Q 25 ${10 + i * 12} 100 ${15 + i * 12}`}
              stroke="url(#windGradient)"
              strokeWidth="1"
              fill="none"
              opacity="0.3"
              initial={{ pathLength: 0, x: -50 }}
              animate={{ 
                pathLength: 1, 
                x: weather.windDirection === 'right' ? [0, 150] : [150, 0],
                opacity: [0, 0.3, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "easeInOut"
              }}
            />
          ))}
        </svg>
      </div>
    );
  };

  // Enhanced Rain Effect
  const RainEffect = () => {
    if (weather.condition !== 'rainy') return null;
    
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-0.5 bg-blue-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              height: `${10 + Math.random() * 20}px`,
              opacity: 0.6,
              filter: 'blur(0.5px)'
            }}
            initial={{ y: -50, opacity: 0 }}
            animate={{ 
              y: '100vh',
              opacity: [0, 0.6, 0]
            }}
            transition={{
              duration: 1 + Math.random(),
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "linear"
            }}
          />
        ))}
      </div>
    );
  };

  const windIntensity = weather.condition === 'windy' ? Math.min(weather.windSpeed / 20, 1) : 0;

  return (
    <div className="relative w-full h-96 rounded-2xl overflow-hidden shadow-2xl">
      {/* Realistic Sky Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-blue-200 to-blue-100">
        {/* Sky depth layers */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/10 to-transparent"></div>
      </div>

      {/* Animated Sun */}
      <AnimatedSun />

      {/* Animated Clouds */}
      <AnimatedClouds />

      {/* Weather Effects */}
      <WindFlow />
      <RainEffect />

      {/* Ground Layer */}
      <div className="absolute bottom-0 left-0 right-0 h-2/3">
        {/* Dark Brown Soil Background */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, 
              ${stage.soilTexture === 'dry' ? '#3E2723' : '#2E1A0E'} 0%, 
              ${stage.soilTexture === 'dry' ? '#5D4037' : '#4E342E'} 30%, 
              ${stage.soilTexture === 'dry' ? '#8D6E63' : '#6D4C41'} 70%, 
              ${stage.soilTexture === 'dry' ? '#A1887F' : '#8D6E63'} 100%)`,
            boxShadow: 'inset 0 10px 20px rgba(0,0,0,0.5)'
          }}
        >
          {/* Soil texture overlay */}
          <div className="absolute inset-0 opacity-40">
            {[...Array(80)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-black rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  opacity: Math.random() * 0.8
                }}
              />
            ))}
          </div>
        </div>

        {/* Actual Plough Marks */}
        {stage.showPlow && (
          <div className="absolute inset-0">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-full"
                style={{
                  top: `${8 + i * 10}%`,
                  height: '3px',
                  background: 'linear-gradient(to right, transparent 0%, #1B0F02 20%, #1B0F02 80%, transparent 100%)',
                  transform: 'rotate(-1deg)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.8), inset 0 1px 2px rgba(255,255,255,0.1)',
                  borderRadius: '2px'
                }}
              />
            ))}
            {/* Cross plough marks */}
            {[...Array(4)].map((_, i) => (
              <div
                key={`cross-${i}`}
                className="absolute w-full"
                style={{
                  top: `${15 + i * 15}%`,
                  height: '2px',
                  background: 'linear-gradient(to right, transparent 0%, #1B0F02 30%, #1B0F02 70%, transparent 100%)',
                  transform: 'rotate(1deg)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.6)',
                  borderRadius: '1px'
                }}
              />
            ))}
          </div>
        )}

        {/* Grass Layer */}
        <div className="absolute inset-0">
          {grassBlades.map((blade) => (
            <GrassBlade
              key={blade.index}
              x={blade.x}
              y={blade.y}
              height={blade.height}
              index={blade.index}
              isWindy={weather.condition === 'windy'}
              windIntensity={windIntensity}
              hasFruit={blade.hasFruit}
            />
          ))}
        </div>
      </div>

      {/* Weather Panel */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-white/50">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Thermometer size={14} className="text-red-500" />
              <span className="font-medium">{weather.temperature}°C</span>
            </div>
            <div className="flex items-center gap-1">
              <Droplets size={14} className="text-blue-500" />
              <span className="font-medium">{weather.humidity}%</span>
            </div>
            <div className="flex items-center gap-1">
              <Wind size={14} className="text-gray-500" />
              <span className="font-medium">{weather.windSpeed} km/h</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandImageSystem; 