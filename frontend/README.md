# AgriVerse Frontend

This is the frontend for the AgriVerse platform, a modern web application for AI-powered smart farming, crop planning, disease detection, and marketplace management.

## 🚀 Features
- **AI-Powered Crop Planning**: Get intelligent crop suggestions and schedules based on your land and weather.
- **Disease Detection**: Upload or capture crop images to detect diseases using AI.
- **Growth Monitoring**: Track crop health, progress, and receive actionable recommendations.
- **Land Management**: Add, edit, and visualize your farm lands with OpenStreetMap integration.
- **Marketplace**: Buy and sell produce, connect with local farmers.
- **Task Management**: Sequential farming tasks with progress tracking and reminders.
- **PWA Ready**: Can be installed on mobile devices for a native-like experience.

## 🗂️ Main Components
- `App.js`: Main app shell and routing.
- `components/EnhancedLandManagement.js`: Land management dashboard.
- `components/LandDetailsDashboard.js`: Detailed view for each land, crop status, and schedule.
- `components/AIEnhancedCropPlanning.js`: AI-powered crop planning and scheduling.
- `components/EnhancedDiseaseDetection.js`: Disease detection and analysis.
- `components/EnhancedMarketplace.js`: Marketplace for products.
- `components/AIChatAssistant.js`: AI chat assistant for farming queries.

## 🛠️ How to Run Locally

1. **Install dependencies:**
   ```bash
   cd frontend
   yarn install # or npm install
   ```
2. **Set environment variables:**
   - Create a `.env` file in `frontend/` with:
     ```
     REACT_APP_BACKEND_URL=http://localhost:8001
     ```
3. **Start the development server:**
   ```bash
   yarn start # or npm start
   ```
   The app will run at [http://localhost:3000](http://localhost:3000)

## 📱 PWA & Mobile
- The app is PWA-ready. You can "Add to Home Screen" on Android/iOS for a native-like experience.
- For true APK/IPA builds, use Capacitor or similar tools.

## 📦 Build for Production
```bash
yarn build # or npm run build
```

## 🤖 AI & API Integration
- The frontend communicates with the FastAPI backend for AI analysis, disease detection, and data storage.
- Make sure the backend is running and accessible at the URL specified in `.env`.

## 📝 Notes
- No proprietary badges or watermarks are present.
- For mobile app builds, see the main project README for guidance on Capacitor/React Native.
