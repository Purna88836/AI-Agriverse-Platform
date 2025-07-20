# AgriVerse Backend

This is the backend for the AgriVerse platform, built with FastAPI and Python. It provides AI-powered APIs for crop planning, disease detection, growth monitoring, and marketplace management.

## 🚀 Features
- **AI-Powered Crop Planning**: Generates crop suggestions and schedules using OpenAI GPT models.
- **Disease Detection**: Analyzes crop images and provides disease diagnosis and treatment recommendations.
- **Growth Monitoring**: Tracks crop health, progress, and provides actionable insights.
- **Marketplace Management**: Handles product listings, buying, and selling.
- **User Management**: Supports farmer and customer roles, authentication, and profile management.
- **MongoDB Integration**: Stores all user, land, crop, and product data.

## 🗂️ Main Files
- `server.py`: Main FastAPI app with all API endpoints.
- `requirements.txt`: Python dependencies.
- `.env`: Environment variables (not committed; see below).

## 🛠️ How to Run Locally

1. **Install dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
2. **Set environment variables:**
   - Create a `.env` file in `backend/` with:
     ```
     OPENAI_API_KEY=your-openai-key
     MONGO_URL=mongodb+srv://... # or your local MongoDB URI
     ```
3. **Start the FastAPI server:**
   ```bash
   uvicorn server:app --reload --port 8001
   ```
   The API will run at [http://localhost:8001](http://localhost:8001)

## 🤖 AI & ML Integration
- Uses OpenAI GPT-3.5/4 for crop planning, recommendations, and disease analysis.
- Image analysis for disease detection (extendable for custom ML models).

## 📚 Key API Endpoints
- `/api/crop-suggestions`: Get AI-powered crop suggestions.
- `/api/generate-schedule`: Generate a farming schedule for a crop.
- `/api/detect-disease`: Analyze crop images for disease.
- `/api/lands`: CRUD for land management.
- `/api/products`: Marketplace product management.
- `/api/profile`: User profile and authentication.

## 📝 Notes
- **Do NOT commit your `.env` file or API keys to git.**
- For production, set environment variables securely (AWS Secrets Manager, Railway, etc).
- MongoDB Atlas is recommended for cloud deployments.

## 🏃‍♂️ Quick Start
```bash
pip install -r requirements.txt
uvicorn server:app --reload --port 8001
```

## 📦 Deployment
- Can be deployed to Railway, Render, AWS EC2, or any cloud supporting Python & FastAPI.
- For CI/CD, use GitHub Actions or your preferred pipeline.

## 📱 Frontend
- See the `../frontend/README.md` for running the React frontend. 