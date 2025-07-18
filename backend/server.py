import os
import uuid
import base64
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import asyncio
from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Body
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import jwt
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
import io
import tempfile

# Initialize FastAPI app
app = FastAPI(title="AgriVerse API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security setup
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "your-secret-key-here"
ALGORITHM = "HS256"

# Database setup
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = "agriverse"

client = AsyncIOMotorClient(MONGO_URL)
db = client[DATABASE_NAME]

# Collections
users_collection = db.users
lands_collection = db.lands
products_collection = db.products
disease_reports_collection = db.disease_reports
plant_plans_collection = db.plant_plans

# Pydantic models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password: str
    user_type: str  # "farmer" or "customer"
    name: str
    phone: Optional[str] = None
    location: Optional[Dict[str, float]] = None  # {"lat": 0.0, "lng": 0.0}
    address: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserLogin(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    email: str
    password: str
    user_type: str
    name: str
    phone: Optional[str] = None
    location: Optional[Dict[str, float]] = None
    address: Optional[str] = None

class Land(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    farmer_id: Optional[str] = None
    name: str
    size: float  # in acres
    location: Dict[str, float]  # {"lat": 0.0, "lng": 0.0}
    soil_type: str
    crops: List[str] = []
    last_updated: datetime = Field(default_factory=datetime.utcnow)

class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    farmer_id: Optional[str] = None
    name: str
    description: str
    price: float
    unit: str  # "kg", "ton", "piece", etc.
    quantity: int
    category: str
    image_base64: Optional[str] = None
    location: Dict[str, float]
    available: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DiseaseReport(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    farmer_id: Optional[str] = None
    land_id: Optional[str] = None
    crop_name: str
    image_base64: str
    ai_diagnosis: str
    confidence: float
    recommendations: List[str]
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PlantPlan(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    farmer_id: Optional[str] = None
    land_id: str
    season: str
    crops: List[str]
    plan_details: str
    ai_recommendations: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DiseaseDetectionRequest(BaseModel):
    image_base64: str
    crop_name: str
    land_id: Optional[str] = None

class PlantPlanRequest(BaseModel):
    land_id: str
    season: str
    preferred_crops: List[str]
    goals: str

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user = await users_collection.find_one({"id": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

# Initialize Gemini Chat
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyDdu3I3cZrDcOLg1vssTrXOTSyxBO2KGhk")

def get_gemini_chat():
    return LlmChat(
        api_key=GEMINI_API_KEY,
        session_id=f"agriverse-{str(uuid.uuid4())}",
        system_message="You are an expert agricultural AI assistant specializing in crop disease detection, farm planning, and agricultural recommendations. Provide detailed, practical advice for farmers."
    ).with_model("gemini", "gemini-2.0-flash")

# Routes
@app.get("/")
async def root():
    return {"message": "AgriVerse API - Empowering Farmers with AI"}

@app.post("/api/register")
async def register(user_data: UserRegister):
    # Check if user already exists
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    user = User(
        email=user_data.email,
        password=hashed_password,
        user_type=user_data.user_type,
        name=user_data.name,
        phone=user_data.phone,
        location=user_data.location,
        address=user_data.address
    )
    
    await users_collection.insert_one(user.dict())
    
    # Create access token
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "user_type": user.user_type,
            "name": user.name
        }
    }

@app.post("/api/login")
async def login(user_credentials: UserLogin):
    user = await users_collection.find_one({"email": user_credentials.email})
    if not user or not verify_password(user_credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user["id"]}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "user_type": user["user_type"],
            "name": user["name"]
        }
    }

@app.get("/api/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "user_type": current_user["user_type"],
        "name": current_user["name"],
        "phone": current_user.get("phone"),
        "location": current_user.get("location"),
        "address": current_user.get("address")
    }

# Farmer routes
@app.post("/api/lands")
async def create_land(land_data: Land, current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "farmer":
        raise HTTPException(status_code=403, detail="Only farmers can create lands")
    
    land_data.farmer_id = current_user["id"]
    await lands_collection.insert_one(land_data.dict())
    return land_data

@app.get("/api/lands")
async def get_lands(current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "farmer":
        raise HTTPException(status_code=403, detail="Only farmers can view lands")
    
    lands = await lands_collection.find({"farmer_id": current_user["id"]}, {"_id": 0}).to_list(100)
    return lands

@app.post("/api/detect-disease")
async def detect_disease(request: DiseaseDetectionRequest, current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "farmer":
        raise HTTPException(status_code=403, detail="Only farmers can detect diseases")
    
    try:
        # Initialize Gemini chat
        chat = get_gemini_chat()
        
        # Create image content
        image_content = ImageContent(image_base64=request.image_base64)
        
        # Create analysis prompt
        prompt = f"""
        Analyze this image of a {request.crop_name} crop for any diseases or health issues.
        
        Please provide:
        1. Disease identification (if any)
        2. Confidence level (0-100%)
        3. Detailed symptoms visible
        4. Treatment recommendations
        5. Prevention measures
        
        Format your response as:
        DISEASE: [disease name or "Healthy"]
        CONFIDENCE: [0-100]%
        SYMPTOMS: [detailed symptoms]
        TREATMENT: [treatment recommendations]
        PREVENTION: [prevention measures]
        """
        
        user_message = UserMessage(
            text=prompt,
            file_contents=[image_content]
        )
        
        response = await chat.send_message(user_message)
        
        # Parse response
        ai_diagnosis = response
        confidence = 85.0  # Default confidence
        recommendations = []
        
        # Extract confidence and recommendations from response
        if "CONFIDENCE:" in response:
            try:
                confidence_str = response.split("CONFIDENCE:")[1].split("%")[0].strip()
                confidence = float(confidence_str)
            except:
                pass
        
        if "TREATMENT:" in response:
            treatment_section = response.split("TREATMENT:")[1].split("PREVENTION:")[0].strip()
            recommendations.append(treatment_section)
        
        if "PREVENTION:" in response:
            prevention_section = response.split("PREVENTION:")[1].strip()
            recommendations.append(prevention_section)
        
        # Create disease report
        disease_report = DiseaseReport(
            farmer_id=current_user["id"],
            land_id=request.land_id,
            crop_name=request.crop_name,
            image_base64=request.image_base64,
            ai_diagnosis=ai_diagnosis,
            confidence=confidence,
            recommendations=recommendations
        )
        
        await disease_reports_collection.insert_one(disease_report.dict())
        
        return disease_report
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Disease detection failed: {str(e)}")

@app.get("/api/disease-reports")
async def get_disease_reports(current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "farmer":
        raise HTTPException(status_code=403, detail="Only farmers can view disease reports")
    
    reports = await disease_reports_collection.find({"farmer_id": current_user["id"]}).to_list(100)
    return reports

@app.post("/api/plant-plan")
async def create_plant_plan(request: PlantPlanRequest, current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "farmer":
        raise HTTPException(status_code=403, detail="Only farmers can create plant plans")
    
    try:
        # Get land details
        land = await lands_collection.find_one({"id": request.land_id, "farmer_id": current_user["id"]})
        if not land:
            raise HTTPException(status_code=404, detail="Land not found")
        
        # Initialize Gemini chat
        chat = get_gemini_chat()
        
        prompt = f"""
        Create a comprehensive farm plant plan for:
        
        Land Details:
        - Name: {land['name']}
        - Size: {land['size']} acres
        - Soil Type: {land['soil_type']}
        - Current Crops: {', '.join(land.get('crops', []))}
        
        Planning Requirements:
        - Season: {request.season}
        - Preferred Crops: {', '.join(request.preferred_crops)}
        - Goals: {request.goals}
        
        Please provide:
        1. Detailed planting schedule
        2. Crop rotation recommendations
        3. Soil preparation steps
        4. Irrigation requirements
        5. Pest and disease prevention
        6. Expected yield estimates
        7. Market timing advice
        
        Format as a comprehensive farming plan.
        """
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Create plant plan
        plant_plan = PlantPlan(
            farmer_id=current_user["id"],
            land_id=request.land_id,
            season=request.season,
            crops=request.preferred_crops,
            plan_details=request.goals,
            ai_recommendations=response
        )
        
        await plant_plans_collection.insert_one(plant_plan.dict())
        
        return plant_plan
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Plant plan creation failed: {str(e)}")

@app.get("/api/plant-plans")
async def get_plant_plans(current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "farmer":
        raise HTTPException(status_code=403, detail="Only farmers can view plant plans")
    
    plans = await plant_plans_collection.find({"farmer_id": current_user["id"]}).to_list(100)
    return plans

@app.post("/api/products")
async def create_product(product_data: Product, current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "farmer":
        raise HTTPException(status_code=403, detail="Only farmers can create products")
    
    product_data.farmer_id = current_user["id"]
    await products_collection.insert_one(product_data.dict())
    return product_data

@app.get("/api/my-products")
async def get_my_products(current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "farmer":
        raise HTTPException(status_code=403, detail="Only farmers can view their products")
    
    products = await products_collection.find({"farmer_id": current_user["id"]}).to_list(100)
    return products

# Customer routes
@app.get("/api/products")
async def get_products(lat: Optional[float] = None, lng: Optional[float] = None, radius: Optional[float] = 50):
    query = {"available": True}
    
    # If location is provided, filter by proximity
    if lat is not None and lng is not None:
        # Simple proximity filter (in a real app, you'd use geo-spatial queries)
        products = await products_collection.find(query).to_list(100)
        
        # Filter by distance (simple calculation)
        nearby_products = []
        for product in products:
            if product.get("location"):
                product_lat = product["location"].get("lat", 0)
                product_lng = product["location"].get("lng", 0)
                
                # Simple distance calculation (not accurate, but for demo)
                distance = ((lat - product_lat) ** 2 + (lng - product_lng) ** 2) ** 0.5
                if distance <= radius / 111:  # Rough conversion
                    nearby_products.append(product)
        
        return nearby_products
    
    products = await products_collection.find(query).to_list(100)
    return products

@app.get("/api/products/{product_id}")
async def get_product(product_id: str):
    product = await products_collection.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)