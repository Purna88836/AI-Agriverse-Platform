# AgriVerse Platform

AgriVerse is a full-stack AI-powered smart farming platform for crop planning, disease detection, growth monitoring, and marketplace management. It consists of a React frontend and a FastAPI backend, with MongoDB for data storage and OpenAI for AI-driven features.

---

## 🚀 Features
- **AI-Powered Crop Planning**: Get intelligent crop suggestions and schedules based on your land and weather.
- **Disease Detection**: Upload or capture crop images to detect diseases using AI.
- **Growth Monitoring**: Track crop health, progress, and receive actionable recommendations.
- **Land Management**: Add, edit, and visualize your farm lands with OpenStreetMap integration.
- **Marketplace**: Buy and sell produce, connect with local farmers.
- **Task Management**: Sequential farming tasks with progress tracking and reminders.
- **PWA Ready**: Can be installed on mobile devices for a native-like experience.

---

## 🏗️ Project Structure

```
agriverse-emergentlabs/
├── backend/      # FastAPI backend (Python)
│   ├── server.py
│   ├── requirements.txt
│   └── ...
├── frontend/     # React frontend (JavaScript)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
├── README.md     # Global project README (this file)
└── ...
```

---

## 🛠️ Prerequisites
- **Node.js** (v16+ recommended)
- **Python** (3.8+)
- **MongoDB** (local or Atlas)
- **OpenAI API Key** (for AI features)

---

## ⚡ Quick Start (Local Development)

### 1. **Clone the Repository**
```bash
git clone <your-repo-url>
cd agriverse-emergentlabs
```

### 2. **Backend Setup**
```bash
cd backend
pip install -r requirements.txt
# Create .env file with your keys (see backend/README.md)
uvicorn server:app --reload --port 8001
```

### 3. **Frontend Setup**
```bash
cd ../frontend
yarn install # or npm install
# Create .env file with backend URL (see frontend/README.md)
yarn start # or npm start
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:8001](http://localhost:8001)

---

## 🌐 Deployment
- **Frontend:** Deploy to Vercel, Netlify, or AWS Amplify for zero/low cost.
- **Backend:** Deploy to Railway, Render, AWS EC2, or similar.
- **MongoDB:** Use MongoDB Atlas for managed cloud database.
- **Secrets:** Store API keys and sensitive data in environment variables or secret managers.

---

## 📦 How to Build for Production
- **Frontend:**
  ```bash
  yarn build # or npm run build
  # Deploy the build/ folder to your static host
  ```
- **Backend:**
  ```bash
  uvicorn server:app --host 0.0.0.0 --port 8001
  # Or use a production WSGI server like gunicorn/uvicorn
  ```

---

## 📚 Documentation
- See `frontend/README.md` and `backend/README.md` for detailed instructions, features, and API endpoints.

---

## 🤝 Contributing
Pull requests and issues are welcome! Please see the individual READMEs for code style and contribution guidelines.

---

## 📝 License
This project is part of the AgriVerse platform. All rights reserved.
