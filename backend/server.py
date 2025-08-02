from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import os
from pymongo import MongoClient
import uuid
from datetime import datetime, timedelta
import hashlib
import jwt
import bcrypt
from passlib.context import CryptContext

app = FastAPI()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24  # 30 days

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = MongoClient(MONGO_URL)
db = client.gaming_store

# Collections
games_collection = db.games
news_collection = db.news
banners_collection = db.banners
orders_collection = db.orders
admins_collection = db.admins
users_collection = db.users

# Security
security = HTTPBearer(auto_error=False)

# Initialize admin user
def init_admin():
    existing_admin = admins_collection.find_one({"username": "admin"})
    if not existing_admin:
        admin_data = {
            "id": str(uuid.uuid4()),
            "username": "admin",
            "password": hashlib.sha256("xliunx".encode()).hexdigest(),
            "created_at": datetime.now().isoformat()
        }
        admins_collection.insert_one(admin_data)
        print("Admin user created")

init_admin()

# Models
class Game(BaseModel):
    name: str
    name_ar: str
    description: str
    description_ar: str
    image_url: str
    prices: List[dict]  # [{"amount": "100", "price": "5", "currency": "ريال"}]
    is_active: bool = True

class NewsItem(BaseModel):
    title: str
    title_ar: str
    content: str
    content_ar: str
    is_active: bool = True

class Banner(BaseModel):
    title: str
    title_ar: str
    image_url: str
    link: Optional[str] = None
    is_active: bool = True

class Order(BaseModel):
    game_id: str
    game_name: str
    player_id: str
    amount: str
    price: str
    currency: str
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None

class AdminLogin(BaseModel):
    username: str
    password: str

class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserProfile(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    username: str

# Admin authentication
def verify_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Simple token validation (in production, use proper JWT)
    token = credentials.credentials
    admin = admins_collection.find_one({"username": "admin"})
    expected_token = hashlib.sha256(f"admin:xliunx".encode()).hexdigest()
    
    if token != expected_token:
        raise HTTPException(status_code=401, detail="Invalid authentication")
    
    return admin

# Initialize sample data
def init_sample_data():
    # Check if games already exist
    if games_collection.count_documents({}) == 0:
        sample_games = [
            {
                "id": str(uuid.uuid4()),
                "name": "TikTok Coins",
                "name_ar": "عملات تيك توك",
                "description": "Buy TikTok coins to support your favorite creators",
                "description_ar": "اشتري عملات تيك توك لدعم المبدعين المفضلين لديك",
                "image_url": "https://images.unsplash.com/photo-1645109870868-e1b6f909e444?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwyfHxtb2JpbGUlMjBnYW1pbmd8ZW58MHx8fHwxNzU0MTU2MzI4fDA&ixlib=rb-4.1.0&q=85",
                "prices": [
                    {"amount": "70 عملة", "price": "5", "currency": "ريال"},
                    {"amount": "350 عملة", "price": "20", "currency": "ريال"},
                    {"amount": "700 عملة", "price": "35", "currency": "ريال"},
                    {"amount": "1400 عملة", "price": "70", "currency": "ريال"}
                ],
                "is_active": True,
                "created_at": datetime.now().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "PUBG Mobile UC",
                "name_ar": "يوسي ببجي موبايل",
                "description": "Get Unknown Cash for PUBG Mobile to buy skins and battle passes",
                "description_ar": "احصل على اليوسي لببجي موبايل لشراء الأسلحة والبطاقات الموسمية",
                "image_url": "https://images.unsplash.com/photo-1564049489314-60d154ff107d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwxfHxtb2JpbGUlMjBnYW1pbmd8ZW58MHx8fHwxNzU0MTU2MzI4fDA&ixlib=rb-4.1.0&q=85",
                "prices": [
                    {"amount": "60 يوسي", "price": "5", "currency": "ريال"},
                    {"amount": "325 يوسي", "price": "25", "currency": "ريال"},
                    {"amount": "660 يوسي", "price": "50", "currency": "ريال"},
                    {"amount": "1800 يوسي", "price": "100", "currency": "ريال"}
                ],
                "is_active": True,
                "created_at": datetime.now().isoformat()
            }
        ]
        games_collection.insert_many(sample_games)
    
    # Sample news
    if news_collection.count_documents({}) == 0:
        sample_news = [
            {
                "id": str(uuid.uuid4()),
                "title": "Welcome to Gaming Store 2025",
                "title_ar": "مرحباً بكم في متجر الألعاب 2025",
                "content": "Get the best gaming top-ups at amazing prices!",
                "content_ar": "احصل على أفضل شحنات الألعاب بأسعار مذهلة!",
                "is_active": True,
                "created_at": datetime.now().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Fast Delivery Guaranteed",
                "title_ar": "توصيل سريع مضمون",
                "content": "All orders processed within 5 minutes!",
                "content_ar": "جميع الطلبات تتم معالجتها خلال 5 دقائق!",
                "is_active": True,
                "created_at": datetime.now().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "24/7 Customer Support",
                "title_ar": "دعم عملاء على مدار الساعة",
                "content": "We're here to help you anytime!",
                "content_ar": "نحن هنا لمساعدتك في أي وقت!",
                "is_active": True,
                "created_at": datetime.now().isoformat()
            }
        ]
        news_collection.insert_many(sample_news)
    
    # Sample banners
    if banners_collection.count_documents({}) == 0:
        sample_banners = [
            {
                "id": str(uuid.uuid4()),
                "title": "Gaming Excellence",
                "title_ar": "تميز الألعاب",
                "image_url": "https://images.unsplash.com/photo-1542751371-adc38448a05e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwxfHxnYW1pbmd8ZW58MHx8fHwxNzU0MTU2MzIxfDA&ixlib=rb-4.1.0&q=85",
                "link": "#games",
                "is_active": True,
                "created_at": datetime.now().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Mobile Gaming Pro",
                "title_ar": "ألعاب الجوال المحترفة",
                "image_url": "https://images.unsplash.com/photo-1593305841991-05c297ba4575?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwzfHxnYW1pbmd8ZW58MHx8fHwxNzU0MTU2MzIxfDA&ixlib=rb-4.1.0&q=85",
                "link": "#games",
                "is_active": True,
                "created_at": datetime.now().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Ultimate Gaming Experience",
                "title_ar": "تجربة ألعاب لا تُنسى",
                "image_url": "https://images.unsplash.com/photo-1626686707291-7bda5c45e8a8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwzfHxtb2JpbGUlMjBnYW1pbmd8ZW58MHx8fHwxNzU0MTU2MzI4fDA&ixlib=rb-4.1.0&q=85",
                "link": "#games",
                "is_active": True,
                "created_at": datetime.now().isoformat()
            }
        ]
        banners_collection.insert_many(sample_banners)

init_sample_data()

# API Routes

@app.get("/")
def read_root():
    return {"message": "Gaming Store 2025 API"}

# Public routes
@app.get("/api/games")
def get_games():
    games = list(games_collection.find({"is_active": True}, {"_id": 0}))
    return {"games": games}

@app.get("/api/games/{game_id}")
def get_game(game_id: str):
    game = games_collection.find_one({"id": game_id, "is_active": True}, {"_id": 0})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game

@app.get("/api/news")
def get_news():
    news = list(news_collection.find({"is_active": True}, {"_id": 0}))
    return {"news": news}

@app.get("/api/banners")
def get_banners():
    banners = list(banners_collection.find({"is_active": True}, {"_id": 0}))
    return {"banners": banners}

@app.post("/api/orders")
def create_order(order: Order):
    order_data = order.dict()
    order_data["id"] = str(uuid.uuid4())
    order_data["status"] = "pending"
    order_data["created_at"] = datetime.now().isoformat()
    
    orders_collection.insert_one(order_data)
    
    return {
        "success": True,
        "order_id": order_data["id"],
        "whatsapp_url": f"https://wa.me/967777826667?text=طلب جديد%0A----%0Aاللعبة: {order.game_name}%0Aالآي دي: {order.player_id}%0Aالكمية: {order.amount}%0Aالسعر: {order.price} {order.currency}%0Aاسم العميل: {order.customer_name}%0Aرقم الهاتف: {order.customer_phone}%0A----%0Aرقم الطلب: {order_data['id']}"
    }

# Admin routes
@app.post("/api/admin/login")
def admin_login(login_data: AdminLogin):
    admin = admins_collection.find_one({"username": login_data.username})
    if not admin or admin["password"] != hashlib.sha256(login_data.password.encode()).hexdigest():
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = hashlib.sha256(f"{login_data.username}:{login_data.password}".encode()).hexdigest()
    return {"token": token, "message": "Login successful"}

@app.get("/api/admin/games")
def admin_get_games(admin=Depends(verify_admin)):
    games = list(games_collection.find({}, {"_id": 0}))
    return {"games": games}

@app.post("/api/admin/games")
def admin_create_game(game: Game, admin=Depends(verify_admin)):
    game_data = game.dict()
    game_data["id"] = str(uuid.uuid4())
    game_data["created_at"] = datetime.now().isoformat()
    
    games_collection.insert_one(game_data)
    return {"success": True, "id": game_data["id"]}

@app.put("/api/admin/games/{game_id}")
def admin_update_game(game_id: str, game: Game, admin=Depends(verify_admin)):
    result = games_collection.update_one(
        {"id": game_id},
        {"$set": {**game.dict(), "updated_at": datetime.now().isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Game not found")
    return {"success": True}

@app.delete("/api/admin/games/{game_id}")
def admin_delete_game(game_id: str, admin=Depends(verify_admin)):
    result = games_collection.delete_one({"id": game_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Game not found")
    return {"success": True}

@app.get("/api/admin/news")
def admin_get_news(admin=Depends(verify_admin)):
    news = list(news_collection.find({}, {"_id": 0}))
    return {"news": news}

@app.post("/api/admin/news")
def admin_create_news(news_item: NewsItem, admin=Depends(verify_admin)):
    news_data = news_item.dict()
    news_data["id"] = str(uuid.uuid4())
    news_data["created_at"] = datetime.now().isoformat()
    
    news_collection.insert_one(news_data)
    return {"success": True, "id": news_data["id"]}

@app.put("/api/admin/news/{news_id}")
def admin_update_news(news_id: str, news_item: NewsItem, admin=Depends(verify_admin)):
    result = news_collection.update_one(
        {"id": news_id},
        {"$set": {**news_item.dict(), "updated_at": datetime.now().isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="News not found")
    return {"success": True}

@app.delete("/api/admin/news/{news_id}")
def admin_delete_news(news_id: str, admin=Depends(verify_admin)):
    result = news_collection.delete_one({"id": news_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="News not found")
    return {"success": True}

@app.get("/api/admin/banners")
def admin_get_banners(admin=Depends(verify_admin)):
    banners = list(banners_collection.find({}, {"_id": 0}))
    return {"banners": banners}

@app.post("/api/admin/banners")
def admin_create_banner(banner: Banner, admin=Depends(verify_admin)):
    banner_data = banner.dict()
    banner_data["id"] = str(uuid.uuid4())
    banner_data["created_at"] = datetime.now().isoformat()
    
    banners_collection.insert_one(banner_data)
    return {"success": True, "id": banner_data["id"]}

@app.put("/api/admin/banners/{banner_id}")
def admin_update_banner(banner_id: str, banner: Banner, admin=Depends(verify_admin)):
    result = banners_collection.update_one(
        {"id": banner_id},
        {"$set": {**banner.dict(), "updated_at": datetime.now().isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Banner not found")
    return {"success": True}

@app.delete("/api/admin/banners/{banner_id}")
def admin_delete_banner(banner_id: str, admin=Depends(verify_admin)):
    result = banners_collection.delete_one({"id": banner_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Banner not found")
    return {"success": True}

@app.get("/api/admin/orders")
def admin_get_orders(admin=Depends(verify_admin)):
    orders = list(orders_collection.find({}, {"_id": 0}).sort("created_at", -1))
    return {"orders": orders}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)