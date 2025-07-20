# Agriverse Backend

AI-Powered Agricultural Management Platform Backend

## 🏗️ Project Structure

```
backend/
├── app/                          # Main application package
│   ├── __init__.py
│   ├── main.py                   # FastAPI app initialization
│   ├── config/                   # Configuration
│   │   ├── __init__.py
│   │   ├── database.py           # Database connection
│   │   └── settings.py           # Environment variables
│   ├── models/                   # Database models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── land.py
│   │   ├── crop.py
│   │   └── disease.py
│   ├── schemas/                  # API request/response schemas
│   │   ├── __init__.py
│   │   └── auth.py
│   ├── api/                      # API routes
│   │   ├── __init__.py
│   │   └── v1/                   # API version 1
│   │       ├── __init__.py
│   │       ├── auth.py
│   │       ├── users.py
│   │       ├── lands.py
│   │       ├── crops.py
│   │       ├── diseases.py
│   │       └── schedules.py
│   ├── services/                 # Business logic
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── crop_service.py
│   │   ├── disease_service.py
│   │   ├── weather_service.py
│   │   └── ai_service.py
│   └── utils/                    # Utilities
│       ├── __init__.py
│       └── security.py
├── server.py                     # Legacy entry point
├── server_new.py                 # New modular entry point
├── requirements.txt
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- MongoDB
- Required Python packages (see requirements.txt)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd agriverse-emergentlabs/backend
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file
   cp .env.example .env
   
   # Edit .env with your configuration
   MONGODB_URL=mongodb://localhost:27017
   DATABASE_NAME=agriverse
   SECRET_KEY=your-secret-key-here
   OPENAI_API_KEY=your-openai-api-key
   ```

4. **Start MongoDB**
   ```bash
   # Start MongoDB service
   mongod
   ```

5. **Run the server**
   ```bash
   # Using the new modular structure
   python server_new.py
   
   # Or using uvicorn directly
   uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
   ```

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URL` | MongoDB connection string | `mongodb://localhost:27017` |
| `DATABASE_NAME` | Database name | `agriverse` |
| `SECRET_KEY` | JWT secret key | `your-secret-key-here` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT token expiry | `30` |
| `OPENAI_API_KEY` | OpenAI API key | `None` |
| `WEATHER_API_KEY` | Weather API key | `None` |
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port | `8001` |
| `DEBUG` | Debug mode | `False` |

## 🏛️ Architecture

### Layers

1. **API Layer** (`app/api/`)
   - FastAPI routes and endpoints
   - Request/response handling
   - Input validation

2. **Service Layer** (`app/services/`)
   - Business logic
   - External API integrations
   - Data processing

3. **Model Layer** (`app/models/`)
   - Database models
   - Data validation
   - Schema definitions

4. **Configuration Layer** (`app/config/`)
   - Environment settings
   - Database connections
   - Application configuration

### Key Features

- **Modular Design**: Clean separation of concerns
- **Type Safety**: Full Pydantic model validation
- **Async Support**: Non-blocking database operations
- **Security**: JWT authentication, password hashing
- **Documentation**: Auto-generated API docs
- **Testing**: Ready for unit and integration tests

## 🔄 Migration from Legacy

The old `server.py` is still available for reference. The new modular structure provides:

- **Better organization**: Related code grouped together
- **Easier maintenance**: Smaller, focused files
- **Improved testing**: Isolated components
- **Better documentation**: Clear structure and purpose
- **Scalability**: Easy to add new features

## 🧪 Development

### Adding New Features

1. **Create models** in `app/models/`
2. **Define schemas** in `app/schemas/`
3. **Implement services** in `app/services/`
4. **Add API routes** in `app/api/v1/`
5. **Update main.py** to include new routers

### Code Style

- Follow PEP 8
- Use type hints
- Add docstrings
- Keep functions small and focused
- Use meaningful variable names

## 📝 License

This project is part of the Agriverse platform. 