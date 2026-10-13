from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import logging
from pydantic import BaseModel, Field, BeforeValidator, ConfigDict
from typing import List, Optional, Annotated, Any
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import bcrypt
import jwt
import re

# ---------------------------------------------------------------------------
# DB
# ---------------------------------------------------------------------------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
BUSINESS_WHATSAPP = os.environ.get('BUSINESS_WHATSAPP', '919675334567')
BUSINESS_PHONE = os.environ.get('BUSINESS_PHONE', '9675334567')

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("amya")

# ---------------------------------------------------------------------------
# Mongo base model
# ---------------------------------------------------------------------------
PyObjectId = Annotated[str, BeforeValidator(lambda v: str(v) if isinstance(v, ObjectId) else v)]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class BaseDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)
    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    @classmethod
    def from_mongo(cls, doc: dict):
        if not doc:
            return None
        return cls(**doc)

    def to_mongo(self) -> dict:
        data = self.model_dump(by_alias=True, exclude_none=True)
        data.pop("_id", None)
        return data


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "type": "access",
               "exp": datetime.now(timezone.utc) + timedelta(hours=12)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "type": "refresh",
               "exp": datetime.now(timezone.utc) + timedelta(days=7)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_admin(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user or user.get("role") != "admin":
            raise HTTPException(status_code=401, detail="Not authorised")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def set_auth_cookies(response: Response, access: str, refresh: str):
    response.set_cookie("access_token", access, httponly=True, secure=True,
                        samesite="none", max_age=43200, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True,
                        samesite="none", max_age=604800, path="/")


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class PackSize(BaseModel):
    label: str
    price: Optional[float] = None
    note: Optional[str] = None


class DeliveryRegion(BaseModel):
    region: str
    text: str


class RecipeStory(BaseModel):
    heading: str
    body: str


class Product(BaseDocument):
    slug: str
    name: str
    category: str  # oils | cashew-brittles | pickles
    short_description: str = ""
    description: str = ""
    extraction_method: str = ""
    ingredients: str = ""
    allergens: str = ""
    origin: str = ""
    highlights: List[str] = []
    diet: Optional[str] = None  # veg | non-veg | None
    storage: str = ""
    delivery_info: str = ""
    returns_info: str = ""
    food_label_info: str = ""
    batch_info: str = ""
    serving: str = ""
    serving_highlight: str = ""
    preparation: str = ""
    dispatch: str = ""
    delivery_details: List[DeliveryRegion] = []
    recipe_story: Optional[RecipeStory] = None
    images: List[str] = []
    pack_sizes: List[PackSize] = []
    availability: str = "coming-soon"  # ready | order | available | coming-soon | enquire | unavailable
    live_press: bool = False
    featured: bool = False
    sort_order: int = 0
    created_at: str = Field(default_factory=now_iso)


class ProductIn(BaseModel):
    slug: Optional[str] = None
    name: str
    category: str
    short_description: str = ""
    description: str = ""
    extraction_method: str = ""
    ingredients: str = ""
    allergens: str = ""
    origin: str = ""
    highlights: List[str] = []
    diet: Optional[str] = None
    storage: str = ""
    delivery_info: str = ""
    returns_info: str = ""
    food_label_info: str = ""
    batch_info: str = ""
    serving: str = ""
    serving_highlight: str = ""
    preparation: str = ""
    dispatch: str = ""
    delivery_details: List[DeliveryRegion] = []
    images: List[str] = []
    pack_sizes: List[PackSize] = []
    availability: str = "coming-soon"
    live_press: bool = False
    featured: bool = False
    sort_order: int = 0


class Booking(BaseDocument):
    name: str
    mobile: str
    whatsapp: Optional[str] = None
    product_slug: Optional[str] = None
    product_name: str
    quantity: str
    preferred_date: str
    preferred_time: str
    postcode: Optional[str] = None
    instructions: Optional[str] = None
    wants_recording: bool = False
    status: str = "pending"  # pending | confirmed | rejected
    created_at: str = Field(default_factory=now_iso)


class BookingIn(BaseModel):
    name: str
    mobile: str
    whatsapp: Optional[str] = None
    product_slug: Optional[str] = None
    product_name: str
    quantity: str
    preferred_date: str
    preferred_time: str
    postcode: Optional[str] = None
    instructions: Optional[str] = None
    wants_recording: bool = False


class Enquiry(BaseDocument):
    type: str = "general"  # general | shipping | order
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    postcode: Optional[str] = None
    product_name: Optional[str] = None
    message: str = ""
    status: str = "new"  # new | in-progress | closed
    created_at: str = Field(default_factory=now_iso)


class EnquiryIn(BaseModel):
    type: str = "general"
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    postcode: Optional[str] = None
    product_name: Optional[str] = None
    message: str = ""


class Batch(BaseDocument):
    batch_id: str
    product_name: str
    production_date: str
    extraction_method: str = ""
    ingredient_source: str = ""
    quality_report_url: str = ""
    video_url: str = ""
    notes: str = ""
    created_at: str = Field(default_factory=now_iso)


class BatchIn(BaseModel):
    batch_id: str
    product_name: str
    production_date: str
    extraction_method: str = ""
    ingredient_source: str = ""
    quality_report_url: str = ""
    video_url: str = ""
    notes: str = ""


class Settings(BaseModel):
    announcement_enabled: bool = True
    announcement_text: str = "Pre-launch — booking & enquiries open. Online checkout opens once food-business approvals are confirmed."
    prelaunch_mode: bool = True
    checkout_enabled: bool = False
    bank_details: str = ""
    upi_id: str = ""
    oils_video_url: str = ""
    policies: dict = {}


class LoginIn(BaseModel):
    email: str
    password: str


class StatusUpdate(BaseModel):
    status: str


# ---------------------------------------------------------------------------
# App + router
# ---------------------------------------------------------------------------
app = FastAPI(title="AMYA Artisanal Foods API")
api = APIRouter(prefix="/api")


def slugify(text: str) -> str:
    s = re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')
    return s or "product"


# -------------------- Public config --------------------
@api.get("/")
async def root():
    return {"message": "AMYA Artisanal Foods API"}


@api.get("/config")
async def get_config():
    s = await db.settings.find_one({"_id": "site"})
    if not s:
        s = Settings().model_dump()
    else:
        s.pop("_id", None)
    return {
        "settings": s,
        "business": {"whatsapp": BUSINESS_WHATSAPP, "phone": BUSINESS_PHONE},
    }


# -------------------- Products (public) --------------------
@api.get("/products")
async def list_products(category: Optional[str] = None):
    q = {}
    if category:
        q["category"] = category
    docs = await db.products.find(q).sort("sort_order", 1).to_list(500)
    return [Product.from_mongo(d).model_dump(by_alias=False) for d in docs]


@api.get("/products/{slug}")
async def get_product(slug: str):
    doc = await db.products.find_one({"slug": slug})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    return Product.from_mongo(doc).model_dump(by_alias=False)


# -------------------- Bookings (public create) --------------------
@api.post("/bookings")
async def create_booking(payload: BookingIn):
    booking = Booking(**payload.model_dump())
    res = await db.bookings.insert_one(booking.to_mongo())
    return {"id": str(res.inserted_id), "status": "pending",
            "message": "Booking request received. AMYA will contact you to confirm your slot."}


# -------------------- Enquiries (public create) --------------------
@api.post("/enquiries")
async def create_enquiry(payload: EnquiryIn):
    enquiry = Enquiry(**payload.model_dump())
    res = await db.enquiries.insert_one(enquiry.to_mongo())
    return {"id": str(res.inserted_id), "message": "Thank you. We'll be in touch soon."}


# -------------------- Batches (public read) --------------------
@api.get("/batches")
async def list_batches():
    docs = await db.batches.find().sort("created_at", -1).to_list(500)
    return [Batch.from_mongo(d).model_dump(by_alias=False) for d in docs]


# ===========================================================================
# AUTH
# ===========================================================================
@api.post("/auth/login")
async def login(payload: LoginIn, response: Response):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    uid = str(user["_id"])
    access = create_access_token(uid, email)
    refresh = create_refresh_token(uid)
    set_auth_cookies(response, access, refresh)
    return {"id": uid, "email": email, "name": user.get("name"),
            "role": user.get("role"), "token": access}


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out"}


@api.get("/auth/me")
async def me(admin: dict = Depends(get_current_admin)):
    return admin


# ===========================================================================
# ADMIN — products
# ===========================================================================
@api.post("/admin/products")
async def admin_create_product(payload: ProductIn, admin: dict = Depends(get_current_admin)):
    data = payload.model_dump()
    data["slug"] = payload.slug or slugify(payload.name)
    existing = await db.products.find_one({"slug": data["slug"]})
    if existing:
        data["slug"] = f"{data['slug']}-{int(datetime.now().timestamp())}"
    product = Product(**data)
    res = await db.products.insert_one(product.to_mongo())
    doc = await db.products.find_one({"_id": res.inserted_id})
    return Product.from_mongo(doc).model_dump(by_alias=False)


@api.put("/admin/products/{pid}")
async def admin_update_product(pid: str, payload: ProductIn, admin: dict = Depends(get_current_admin)):
    data = payload.model_dump()
    if payload.slug:
        data["slug"] = payload.slug
    elif not data.get("slug"):
        data.pop("slug", None)
    await db.products.update_one({"_id": ObjectId(pid)}, {"$set": data})
    doc = await db.products.find_one({"_id": ObjectId(pid)})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    return Product.from_mongo(doc).model_dump(by_alias=False)


@api.patch("/admin/products/{pid}/availability")
async def admin_set_availability(pid: str, payload: StatusUpdate, admin: dict = Depends(get_current_admin)):
    await db.products.update_one({"_id": ObjectId(pid)}, {"$set": {"availability": payload.status}})
    return {"ok": True}


@api.delete("/admin/products/{pid}")
async def admin_delete_product(pid: str, admin: dict = Depends(get_current_admin)):
    await db.products.delete_one({"_id": ObjectId(pid)})
    return {"ok": True}


# -------------------- Admin — bookings --------------------
@api.get("/admin/bookings")
async def admin_bookings(admin: dict = Depends(get_current_admin)):
    docs = await db.bookings.find().sort("created_at", -1).to_list(1000)
    return [Booking.from_mongo(d).model_dump(by_alias=False) for d in docs]


@api.patch("/admin/bookings/{bid}")
async def admin_booking_status(bid: str, payload: StatusUpdate, admin: dict = Depends(get_current_admin)):
    await db.bookings.update_one({"_id": ObjectId(bid)}, {"$set": {"status": payload.status}})
    return {"ok": True}


# -------------------- Admin — enquiries --------------------
@api.get("/admin/enquiries")
async def admin_enquiries(admin: dict = Depends(get_current_admin)):
    docs = await db.enquiries.find().sort("created_at", -1).to_list(1000)
    return [Enquiry.from_mongo(d).model_dump(by_alias=False) for d in docs]


@api.patch("/admin/enquiries/{eid}")
async def admin_enquiry_status(eid: str, payload: StatusUpdate, admin: dict = Depends(get_current_admin)):
    await db.enquiries.update_one({"_id": ObjectId(eid)}, {"$set": {"status": payload.status}})
    return {"ok": True}


# -------------------- Admin — batches --------------------
@api.post("/admin/batches")
async def admin_create_batch(payload: BatchIn, admin: dict = Depends(get_current_admin)):
    batch = Batch(**payload.model_dump())
    res = await db.batches.insert_one(batch.to_mongo())
    doc = await db.batches.find_one({"_id": res.inserted_id})
    return Batch.from_mongo(doc).model_dump(by_alias=False)


@api.delete("/admin/batches/{bid}")
async def admin_delete_batch(bid: str, admin: dict = Depends(get_current_admin)):
    await db.batches.delete_one({"_id": ObjectId(bid)})
    return {"ok": True}


# -------------------- Admin — settings --------------------
@api.put("/admin/settings")
async def admin_update_settings(payload: Settings, admin: dict = Depends(get_current_admin)):
    data = payload.model_dump()
    await db.settings.update_one({"_id": "site"}, {"$set": data}, upsert=True)
    return {"ok": True}


# ---------------------------------------------------------------------------
# Startup: indexes, admin seed, product + settings seed
# ---------------------------------------------------------------------------
INITIAL_PRODUCTS = [
    {
        "slug": "groundnut-oil", "name": "Groundnut Oil", "category": "oils",
        "short_description": "Cold-extracted groundnut oil, prepared to order in small batches.",
        "description": "Groundnut oil extracted using our own oil-extraction setup, in small batches. Request a live session to observe the actual preparation process and ask questions before you order.",
        "extraction_method": "Our own cold-extraction setup.",
        "ingredients": "100% groundnuts (peanuts).",
        "allergens": "Contains peanuts.",
        "storage": "Store in a cool, dry place away from direct sunlight.",
        "delivery_info": "Dispatched after preparation. Delivery timeline shared on confirmation.",
        "returns_info": "As a fresh-pressed food product, returns are limited. Contact AMYA for any issue with your order.",
        "food_label_info": "Food-label details are added once finalised by AMYA.",
        "images": ["/products/amya-groundnut-oil.jpg?v=1"],
        "pack_sizes": [{"label": "500 ml", "price": None, "note": "Pricing confirmed at launch"},
                        {"label": "1 L", "price": None, "note": "Pricing confirmed at launch"}],
        "availability": "coming-soon", "live_press": True, "featured": False, "sort_order": 16,
    },
    {
        "slug": "sunflower-oil", "name": "Sunflower Oil", "category": "oils",
        "short_description": "Light sunflower oil, cold-extracted in small batches.",
        "description": "Sunflower oil prepared using our own mechanical cold-extraction setup. Availability opens as production is ready — request a live session to see the process.",
        "extraction_method": "Our own mechanical cold-extraction setup.",
        "ingredients": "100% sunflower seeds.",
        "allergens": "Allergen details confirmed by AMYA.",
        "storage": "Store in a cool, dry place away from direct sunlight.",
        "delivery_info": "Dispatched after preparation. Delivery timeline shared on confirmation.",
        "returns_info": "Contact AMYA for any issue with your order.",
        "food_label_info": "Food-label details are added once finalised by AMYA.",
        "images": ["/products/amya-sunflower-oil.jpg?v=1"],
        "pack_sizes": [{"label": "500 ml", "price": None, "note": "Pricing confirmed at launch"}],
        "availability": "coming-soon", "live_press": True, "featured": False, "sort_order": 17,
    },
    {
        "slug": "sesame-oil", "name": "Sesame Oil", "category": "oils",
        "short_description": "Aromatic sesame (gingelly) oil, cold-extracted in small batches.",
        "description": "Sesame oil prepared using our own oil-extraction setup. Availability opens as production is ready — request a live session to see the process.",
        "extraction_method": "Our own cold-extraction setup.",
        "ingredients": "100% sesame seeds.",
        "allergens": "Contains sesame.",
        "storage": "Store in a cool, dry place away from direct sunlight.",
        "delivery_info": "Dispatched after preparation. Delivery timeline shared on confirmation.",
        "returns_info": "Contact AMYA for any issue with your order.",
        "food_label_info": "Food-label details are added once finalised by AMYA.",
        "images": ["/products/amya-sesame-oil.jpg?v=1"],
        "pack_sizes": [{"label": "500 ml", "price": None, "note": "Pricing confirmed at launch"}],
        "availability": "coming-soon", "live_press": True, "featured": False, "sort_order": 18,
    },
    {
        "slug": "coconut-oil", "name": "Coconut Oil", "category": "oils",
        "short_description": "Coconut oil, cold-extracted in small batches.",
        "description": "Coconut oil prepared using our own oil-extraction setup. Availability opens as production is ready.",
        "extraction_method": "Our own mechanical cold-extraction setup.",
        "ingredients": "100% dried coconut.",
        "allergens": "May contain traces depending on shared handling. Details confirmed by AMYA.",
        "storage": "Store in a cool, dry place. May solidify in cooler temperatures.",
        "delivery_info": "Dispatched after preparation. Delivery timeline shared on confirmation.",
        "returns_info": "Contact AMYA for any issue with your order.",
        "food_label_info": "Food-label details are added once finalised by AMYA.",
        "images": ["/products/amya-coconut-oil.jpg?v=1"],
        "pack_sizes": [{"label": "500 ml", "price": None, "note": "Pricing confirmed at launch"}],
        "availability": "coming-soon", "live_press": True, "featured": False, "sort_order": 19,
    },
    {
        "slug": "cashew-brittle", "name": "Cashew Brittle", "category": "cashew-brittles",
        "short_description": "A little sweetness. A lot of crunch.\n\nMade in small batches with premium cashews and jaggery, AMYA Cashew Brittle delivers a rich caramelised crunch in every bite. Thoughtfully crafted for festive gifting, sharing with loved ones, or enjoying as your own special treat.",
        "description": "Made in small batches with premium cashews and jaggery for a rich caramelised crunch. Hyderabad orders can be delivered on the day of ordering, subject to order timing and availability. Orders outside Hyderabad are dispatched through courier on the second day. Domestic and international enquiries are welcome.",
        "extraction_method": "",
        "ingredients": "Whole roasted cashews, jaggery.",
        "allergens": "Contains cashews (tree nuts). May contain traces of other nuts.",
        "storage": "Store in an airtight container in a cool, dry place.",
        "delivery_info": "Dispatched after the order is confirmed. Delivery timeline shared on confirmation.",
        "returns_info": "As a perishable homemade food, returns are limited. Contact AMYA for any issue.",
        "food_label_info": "Food-label details are added once finalised by AMYA.",
        "images": ["/products/cashew-brittle.jpg?v=3"],
        "pack_sizes": [
            {"label": "500 g", "price": 500, "note": "10 pieces"},
            {"label": "1 kg", "price": 900, "note": "20 pieces"},
            {"label": "10 kg", "price": 8500},
        ],
        "delivery_details": [
            {"region": "Hyderabad", "text": "Orders can be received on the same day you order, subject to order confirmation and delivery arrangements."},
            {"region": "Outside Hyderabad", "text": "For locations outside Hyderabad, orders are dispatched through courier on the 2nd day."},
            {"region": "USA & UK", "text": "USA and UK orders are accepted, subject to confirmation of international courier availability, shipping charges and delivery timelines."},
        ],
        "availability": "ready", "live_press": False, "featured": True, "sort_order": 0,
    },
    {
        "slug": "guntur-sannam-chilli-powder", "name": "Chilli Powder", "category": "spices",
        "short_description": "The AMYA Chilli Blend — a carefully selected blend of red chillies for balanced colour, flavour and taste.",
        "description": "THE AMYA CHILLI BLEND\n\nA carefully selected blend of red chillies, combining 20% Guntur chillies with 80% other selected varieties to achieve a balanced colour, flavour and taste.\n\nFor over 20 years, our family has followed this blending approach, carefully selecting chillies to create the distinctive flavour we want in every batch.\n\nRather than relying on Guntur chillies alone, we balance different varieties to achieve our preferred combination of colour, flavour and spice.\n\nAt AMYA, our focus is simple: carefully selected ingredients, a consistent blend and traditional experience in every batch.",
        "origin": "Andhra Pradesh, India",
        "highlights": ["20% Guntur chillies", "80% carefully selected red chillies", "Balanced colour and flavour", "A blending tradition spanning over 20 years"],
        "diet": "veg",
        "ingredients": "A blend of red chillies — 20% Guntur chillies and 80% other carefully selected varieties.",
        "storage": "Refrigerate after opening to help preserve the chilli powder's colour and freshness.",
        "delivery_info": "Dispatched after the order is confirmed. Delivery timeline shared on confirmation.",
        "returns_info": "Contact AMYA for any issue with your order.",
        "food_label_info": "AMYA Signature Spice. Pack sizes and pricing confirmed at launch.",
        "images": ["/products/guntur-sannam-chilli-powder.jpg?v=3"],
        "pack_sizes": [{"label": "250 g", "price": None}, {"label": "500 g", "price": None}, {"label": "1 kg", "price": None}],
        "availability": "available", "live_press": False, "featured": True, "sort_order": 12,
    },
    {
        "slug": "amya-turmeric-powder", "name": "Turmeric Powder", "category": "spices",
        "short_description": "A premium turmeric powder, carefully sourced from Srikakulam, Andhra Pradesh.",
        "description": "AMYA Turmeric Powder is carefully sourced from Srikakulam, Andhra Pradesh, and prepared in small batches with hygienic handling.\n\nWith its naturally rich golden colour and warm, earthy character, it is a beautiful addition to traditional Indian cooking.",
        "origin": "Srikakulam, Andhra Pradesh, India",
        "highlights": ["Turmeric carefully sourced from Srikakulam, Andhra Pradesh", "Small-batch preparation", "Hygienic handling and processing", "Naturally rich golden colour", "Suitable for everyday cooking and traditional recipes"],
        "diet": "veg",
        "ingredients": "Turmeric.",
        "storage": "Store in an airtight container in a cool, dry place away from direct sunlight.",
        "delivery_info": "Dispatched after the order is confirmed. Delivery timeline shared on confirmation.",
        "returns_info": "Contact AMYA for any issue with your order.",
        "food_label_info": "AMYA Signature Spice. Pack sizes and pricing confirmed on enquiry.",
        "images": ["/products/amya-turmeric-powder.jpg?v=3"],
        "pack_sizes": [{"label": "250 g", "price": None}, {"label": "500 g", "price": None}, {"label": "1 kg", "price": None}],
        "availability": "available", "live_press": False, "featured": True, "sort_order": 13,
    },
    {
        "slug": "coriander-powder", "name": "Coriander Powder", "category": "spices",
        "short_description": "Aromatic coriander powder, prepared in small batches.",
        "description": "AMYA Coriander Powder is prepared in small batches with hygienic handling, delivering the warm, citrusy aroma of freshly ground coriander for everyday Indian cooking.",
        "origin": "Andhra Pradesh, India",
        "highlights": ["Prepared in small batches", "Hygienic handling and processing", "Warm, citrusy aroma", "Suitable for everyday cooking and traditional recipes"],
        "diet": "veg",
        "ingredients": "Coriander.",
        "storage": "Store in an airtight container in a cool, dry place away from direct sunlight.",
        "delivery_info": "Dispatched after the order is confirmed. Delivery timeline shared on confirmation.",
        "returns_info": "Contact AMYA for any issue with your order.",
        "food_label_info": "AMYA Signature Spice. Pack sizes shown; pricing confirmed on enquiry.",
        "images": ["/products/amya-coriander-powder.jpg?v=1"],
        "pack_sizes": [{"label": "250 g", "price": None}, {"label": "500 g", "price": None}, {"label": "1 kg", "price": None}],
        "availability": "available", "live_press": False, "featured": False, "sort_order": 15,
    },
    {
        "slug": "cumin-powder", "name": "Cumin Powder", "category": "spices",
        "short_description": "Freshly ground cumin powder, prepared in small batches.",
        "description": "AMYA Cumin Powder is prepared in small batches with hygienic handling, delivering the warm, earthy aroma of freshly ground cumin for everyday Indian cooking.",
        "origin": "India",
        "highlights": ["Prepared in small batches", "Hygienic handling and processing", "Warm, earthy cumin aroma", "Suitable for everyday cooking and traditional recipes"],
        "diet": "veg",
        "ingredients": "Cumin.",
        "storage": "Store in an airtight container in a cool, dry place away from direct sunlight.",
        "delivery_info": "Dispatched after the order is confirmed. Delivery timeline shared on confirmation.",
        "returns_info": "Contact AMYA for any issue with your order.",
        "food_label_info": "AMYA Signature Spice. Pack sizes shown; pricing confirmed on enquiry.",
        "images": ["/products/amya-cumin-powder.jpg?v=1"],
        "pack_sizes": [{"label": "250 g", "price": None}, {"label": "500 g", "price": None}, {"label": "1 kg", "price": None}],
        "availability": "available", "live_press": False, "featured": False, "sort_order": 14,
    },
    {
        "slug": "kaju-bites", "name": "Kaju Bites", "category": "cashew-brittles",
        "short_description": "A premium AMYA cashew snack in an elegant glass jar. Details coming soon.",
        "description": "Kaju Bites is a premium AMYA cashew snack, presented in a premium transparent glass jar with a glossy black lid. Final weight options and pricing will be announced soon.",
        "origin": "India",
        "highlights": ["Premium AMYA cashew snack", "Presented in a premium glass jar with a glossy black lid", "Weight options and pricing announced soon"],
        "diet": "veg",
        "ingredients": "Cashew.",
        "storage": "Store in an airtight container in a cool, dry place away from direct sunlight.",
        "delivery_info": "Dispatched after the order is confirmed. Delivery timeline shared on confirmation.",
        "returns_info": "Contact AMYA for any issue with your order.",
        "food_label_info": "Details coming soon. Enquire for details.",
        "images": [],
        "pack_sizes": [],
        "availability": "available", "live_press": False, "featured": False, "sort_order": 1,
    },

    {
        "slug": "amya-nuvvula-podi", "name": "Nuvvula Podi", "category": "spices",
        "short_description": "Bring home the comforting taste of traditional Andhra cooking with AMYA Nuvvula Podi. This sesame-based podi pairs beautifully with hot rice and ghee, making everyday meals feel special.",
        "description": "AMYA Nuvvula Podi is a traditional sesame podi, prepared by Amulya in small batches for an authentic, home-style flavour.",
        "origin": "Andhra Pradesh, India",
        "highlights": ["Traditional Andhra-style sesame podi", "Prepared by Amulya in small batches", "A familiar, home-style flavour"],
        "diet": "veg",
        "serving": "Enjoy with hot rice and ghee, or serve alongside idli and dosa.",
        "serving_highlight": "",
        "storage": "Store in an airtight container in a cool, dry place away from direct sunlight.",
        "delivery_info": "Dispatched after the order is confirmed. Delivery timeline shared on confirmation.",
        "returns_info": "Contact AMYA for any issue with your order.",
        "food_label_info": "AMYA Signature Spice. Ingredients, pack sizes and pricing shared on enquiry.",
        "images": ["/products/amya-nuvvula-podi.jpg?v=3"],
        "pack_sizes": [{"label": "250 g", "price": 250}, {"label": "500 g", "price": 450}, {"label": "1 kg", "price": 800}],
        "preparation": "",
        "dispatch": "",
        "delivery_details": [],
        "recipe_story": {"heading": "LEELA'S TRADITIONAL RECIPE", "body": "Our Nuvvula Podi follows Leela's traditional family recipe, shaped by more than 30 years of cooking experience. Prepared with care and inspired by the flavours she has perfected over the years, this recipe brings a cherished family tradition to the AMYA kitchen."},
        "availability": "order", "live_press": False, "featured": True, "sort_order": 8,
    },
    {
        "slug": "amya-karivepaku-podi", "name": "Karivepaku Podi", "category": "spices",
        "short_description": "A traditional curry leaf podi made to bring a familiar, comforting taste to everyday meals.",
        "description": "AMYA Karivepaku Podi is a traditional curry leaf podi, prepared by Amulya in small batches to bring a familiar, comforting taste to everyday meals.",
        "origin": "Andhra Pradesh, India",
        "highlights": ["Traditional Andhra-style curry leaf podi", "Prepared by Amulya in small batches", "Familiar, comforting everyday flavour"],
        "diet": "veg",
        "serving": "Best enjoyed mixed with piping-hot rice and ghee.",
        "serving_highlight": "Best enjoyed with very hot rice + ghee",
        "storage": "Store in an airtight container in a cool, dry place away from direct sunlight.",
        "delivery_info": "Dispatched after the order is confirmed. Delivery timeline shared on confirmation.",
        "returns_info": "Contact AMYA for any issue with your order.",
        "food_label_info": "AMYA Signature Spice. Ingredients, pack sizes and pricing shared on enquiry.",
        "images": ["/products/amya-karivepaku-podi.jpg?v=3"],
        "pack_sizes": [{"label": "250 g", "price": 250}, {"label": "500 g", "price": 450}, {"label": "1 kg", "price": 800}],
        "preparation": "Prepared fresh against your order. Please allow 2 days for preparation.",
        "dispatch": "Dispatch on Day 3.",
        "delivery_details": [
            {"region": "Hyderabad", "text": "Hyderabad delivery may be available on Day 3, subject to delivery location and order timing."},
            {"region": "Other locations in India", "text": "Dispatched through courier on the 3rd day. A delivery date is not guaranteed."},
            {"region": "USA & UK", "text": "International courier dispatch is available, subject to confirmation of shipping arrangements, charges and delivery timelines."},
        ],
        "availability": "order", "live_press": False, "featured": True, "sort_order": 9,
    },
    {
        "slug": "amya-nallakaram", "name": "Nallakaram Podi", "category": "spices",
        "short_description": "A traditional Andhra-style podi made for those who love bold, comforting flavours.",
        "description": "AMYA Nallakaram Podi is a traditional Andhra-style podi, prepared by Amulya in small batches for those who love bold, comforting flavours.",
        "origin": "Andhra Pradesh, India",
        "highlights": ["Traditional Andhra-style nallakaram podi", "Prepared by Amulya in small batches", "Bold, comforting flavour"],
        "diet": "veg",
        "serving": "Enjoy with dosa, or mix with piping-hot rice and ghee.",
        "serving_highlight": "Best enjoyed with very hot rice + ghee",
        "storage": "Store in an airtight container in a cool, dry place away from direct sunlight.",
        "delivery_info": "Dispatched after the order is confirmed. Delivery timeline shared on confirmation.",
        "returns_info": "Contact AMYA for any issue with your order.",
        "food_label_info": "AMYA Signature Spice. Ingredients, pack sizes and pricing shared on enquiry.",
        "images": ["/products/amya-nallakaram.jpg?v=3"],
        "pack_sizes": [{"label": "250 g", "price": 250}, {"label": "500 g", "price": 450}, {"label": "1 kg", "price": 800}],
        "preparation": "Prepared fresh against your order. Please allow 2 days for preparation.",
        "dispatch": "Dispatch on Day 3.",
        "delivery_details": [
            {"region": "Hyderabad", "text": "Hyderabad delivery may be available on Day 3, subject to delivery location and order timing."},
            {"region": "Other locations in India", "text": "Dispatched through courier on the 3rd day. A delivery date is not guaranteed."},
            {"region": "USA & UK", "text": "International courier dispatch is available, subject to confirmation of shipping arrangements, charges and delivery timelines."},
        ],
        "availability": "order", "live_press": False, "featured": True, "sort_order": 10,
    },
    {
        "slug": "amya-garam-masala", "name": "Garam Masala", "category": "spices",
        "short_description": "AMYA Garam Masala — a traditional Indian spice blend crafted to bring warmth, aroma and depth to your everyday cooking.",
        "description": "AMYA Garam Masala — a traditional Indian spice blend crafted to bring warmth, aroma and depth to your everyday cooking.",
        "origin": "Andhra Pradesh, India",
        "highlights": ["Traditional Indian spice blend", "Prepared by Amulya in small batches", "Adds warmth, aroma and depth to everyday cooking"],
        "diet": "veg",
        "storage": "Store in an airtight container in a cool, dry place away from direct sunlight.",
        "delivery_info": "Dispatched after the order is confirmed. Delivery timeline shared on confirmation.",
        "returns_info": "Contact AMYA for any issue with your order.",
        "food_label_info": "AMYA Signature Spice. Further details added when finalised by AMYA.",
        "images": ["/products/amya-garam-masala.jpg?v=3"],
        "pack_sizes": [{"label": "250 g", "price": 300}, {"label": "500 g", "price": 550}, {"label": "1 kg", "price": 1000}],
        "preparation": "Prepared fresh against your order. Please allow 2 days for preparation.",
        "dispatch": "Dispatch on Day 3.",
        "delivery_details": [
            {"region": "Hyderabad", "text": "Hyderabad delivery may be available on Day 3, subject to delivery location and order timing."},
            {"region": "Other locations in India", "text": "Dispatched through courier on the 3rd day. A delivery date is not guaranteed."},
            {"region": "USA & UK", "text": "International courier dispatch is available, subject to confirmation of shipping arrangements, charges and delivery timelines."},
        ],
        "availability": "order", "live_press": False, "featured": True, "sort_order": 11,
    },
    {
        "slug": "avakai-pickle", "name": "Avakai Pickle", "category": "pickles",
        "short_description": "Traditional Andhra-style raw mango pickle.",
        "description": "A traditional Andhra-style raw mango pickle, prepared using carefully selected ingredients and traditional recipes. Launching soon.",
        "diet": "veg",
        "food_label_info": "Ingredients, pack sizes and pricing confirmed at launch.",
        "images": [],
        "pack_sizes": [],
        "recipe_story": {"heading": "A FAMILY RECIPE BY LEELA", "body": "Our Avakai follows Leela's family recipe, carrying the traditional Andhra pickle-making knowledge she has developed over more than 30 years of cooking experience. A recipe rooted in family tradition and prepared with care."},
        "availability": "out-of-stock", "live_press": False, "featured": False, "sort_order": 6,
    },
    {
        "slug": "maagai-pickle", "name": "Maagai Pickle", "category": "pickles",
        "short_description": "Traditional mango preparation inspired by Andhra culinary traditions.",
        "description": "A traditional mango pickle inspired by Andhra culinary traditions, prepared with thoughtful care. Launching soon.",
        "diet": "veg",
        "food_label_info": "Ingredients, pack sizes and pricing confirmed at launch.",
        "images": [],
        "pack_sizes": [],
        "recipe_story": {"heading": "A FAMILY RECIPE BY LEELA", "body": "Our Magai follows Leela's traditional family recipe, reflecting more than 30 years of cooking experience and a love for authentic Andhra flavours. A treasured family preparation, brought to you by AMYA."},
        "availability": "out-of-stock", "live_press": False, "featured": False, "sort_order": 7,
    },
    {
        "slug": "allam-sweet-pickle", "name": "Allam Sweet Pickle", "category": "pickles",
        "short_description": "A distinctive ginger-based sweet pickle combining traditional flavours.",
        "description": "A distinctive ginger-based sweet pickle that combines traditional flavours in a comforting preparation. Launching soon.",
        "diet": "veg",
        "food_label_info": "Ingredients, pack sizes and pricing confirmed at launch.",
        "images": [],
        "pack_sizes": [],
        "recipe_story": {"heading": "AMMU'S AMMAMMA'S ORIGINAL RECIPE", "body": "Some recipes are too special to leave behind. AMYA's Sweet Allam Pickle comes from Ammu's Ammamma's family recipe, preserving a much-loved taste passed down through generations. It is a tribute to the original recipe and the family memories that make traditional food so special."},
        "availability": "in-stock", "live_press": False, "featured": False, "sort_order": 5,
    },
    {
        "slug": "chicken-pickle", "name": "Chicken Pickle", "category": "pickles",
        "short_description": "A flavourful non-vegetarian pickle prepared using chicken.",
        "description": "A flavourful non-vegetarian pickle prepared using chicken, in a traditional style. Launching soon.",
        "diet": "non-veg",
        "food_label_info": "Non-vegetarian. Ingredients, pack sizes and pricing confirmed at launch.",
        "images": [],
        "pack_sizes": [],
        "recipe_story": {"heading": "AMMU'S PICKLE SPECIALITIES", "body": "Ammu prepares AMYA's non-vegetarian pickles, bringing her passion and skill for pickles and podis into every batch. Her focus is on creating deeply satisfying flavours through careful preparation and thoughtfully selected ingredients. These recipes reflect Ammu's love of cooking and her commitment to sharing food she is proud to serve."},
        "availability": "in-stock", "live_press": False, "featured": False, "sort_order": 2,
    },
    {
        "slug": "mutton-pickle", "name": "Mutton Pickle", "category": "pickles",
        "short_description": "A rich, traditional-style mutton pickle.",
        "description": "A rich, traditional-style mutton pickle prepared with careful attention to flavour. Launching soon.",
        "diet": "non-veg",
        "food_label_info": "Non-vegetarian. Ingredients, pack sizes and pricing confirmed at launch.",
        "images": [],
        "pack_sizes": [],
        "recipe_story": {"heading": "AMMU'S PICKLE SPECIALITIES", "body": "Ammu prepares AMYA's non-vegetarian pickles, bringing her passion and skill for pickles and podis into every batch. Her focus is on creating deeply satisfying flavours through careful preparation and thoughtfully selected ingredients. These recipes reflect Ammu's love of cooking and her commitment to sharing food she is proud to serve."},
        "availability": "in-stock", "live_press": False, "featured": False, "sort_order": 3,
    },
    {
        "slug": "prawn-pickle", "name": "Prawn Pickle", "category": "pickles",
        "short_description": "A seafood pickle inspired by regional Indian flavours.",
        "description": "A seafood pickle inspired by regional Indian flavours, prepared in a traditional style. Launching soon.",
        "diet": "non-veg",
        "food_label_info": "Non-vegetarian. Ingredients, pack sizes and pricing confirmed at launch.",
        "images": [],
        "pack_sizes": [],
        "recipe_story": {"heading": "AMMU'S PICKLE SPECIALITIES", "body": "Ammu prepares AMYA's non-vegetarian pickles, bringing her passion and skill for pickles and podis into every batch. Her focus is on creating deeply satisfying flavours through careful preparation and thoughtfully selected ingredients. These recipes reflect Ammu's love of cooking and her commitment to sharing food she is proud to serve."},
        "availability": "in-stock", "live_press": False, "featured": False, "sort_order": 4,
    },
]

DEFAULT_POLICIES = {
    "terms": "Terms & Conditions will be published here. AMYA is a founder-led, pre-launch brand; these terms will be finalised before commercial checkout is enabled.",
    "privacy": "We collect only the information needed to respond to your enquiry or booking (such as name, phone and WhatsApp number). We do not sell your data. A full privacy policy will be published before launch.",
    "shipping": "AMYA serves customers across India, and intends to offer shipping to the UK and USA subject to product eligibility, import regulations and confirmed carrier charges. International shipping is quoted individually.",
    "refund": "Cancellation and refund terms depend on the product and its preparation stage. For fresh-pressed and homemade foods, returns are limited. Please contact AMYA for any order issue.",
    "food_disclosure": "AMYA is building its food-business documentation. Required food-safety approvals, GST and other registrations will be confirmed before commercial checkout is enabled.",
}


async def seed():
    await db.users.create_index("email", unique=True)

    admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "email": admin_email, "password_hash": hash_password(admin_password),
            "name": "Amulya Nimmala", "role": "admin", "created_at": now_iso(),
        })
        logger.info("Seeded admin %s", admin_email)
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email},
                                  {"$set": {"password_hash": hash_password(admin_password)}})

    # Upsert the canonical catalog by slug (idempotent) so every environment
    # — preview and production — always carries the full, latest product set.
    # `images` is only set on first insert so genuine photos uploaded later
    # (e.g. via admin) are never overwritten on restart/redeploy.
    # Exception: the products below ship with the founder's real product
    # photographs, so their images are force-synced on every deploy.
    FORCE_IMAGE_SLUGS = {
        "cashew-brittle", "guntur-sannam-chilli-powder", "amya-turmeric-powder",
        "amya-nuvvula-podi", "amya-karivepaku-podi", "amya-nallakaram", "amya-garam-masala",
        "coriander-powder", "cumin-powder",
        "groundnut-oil", "sunflower-oil", "sesame-oil", "coconut-oil",
        "chicken-pickle", "avakai-pickle", "maagai-pickle",
        "allam-sweet-pickle", "mutton-pickle", "prawn-pickle",
    }
    # Confirmed pickle pricing (per 250 g / 500 g / 1 kg). Availability stays
    # "coming-soon" until the founder approves enabling checkout.
    PICKLE_PRICES = {
        "chicken-pickle": [400, 750, 1400],
        "avakai-pickle": [200, 300, 500],
        "maagai-pickle": [200, 300, 500],
        "allam-sweet-pickle": [200, 300, 500],
        "mutton-pickle": [500, 900, 1700],
        "prawn-pickle": [600, 1000, 1900],
    }
    for p in INITIAL_PRODUCTS:
        p = dict(p)
        # Standard pack-size options by category (fixed set for coming-soon ranges).
        if p.get("category") == "oils":
            p["pack_sizes"] = [{"label": "500 ml", "price": None}, {"label": "1 litre", "price": None}]
        elif p.get("category") == "pickles":
            prices = PICKLE_PRICES.get(p["slug"], [None, None, None])
            p["pack_sizes"] = [
                {"label": "250 g", "price": prices[0]},
                {"label": "500 g", "price": prices[1]},
                {"label": "1 kg", "price": prices[2]},
            ]
            p["images"] = [f"/products/{p['slug']}.jpg?v=3"]
        images = p.pop("images", [])
        # `availability` is admin-managed inventory: set it only on first insert so
        # changes made in the admin panel (e.g. marking stock back in) persist across
        # restarts/redeploys. A one-time migration below sets the initial statuses.
        avail = p.pop("availability", "coming-soon")
        set_fields = dict(p)
        on_insert = {"created_at": now_iso(), "availability": avail}
        if p["slug"] in FORCE_IMAGE_SLUGS:
            set_fields["images"] = images
        else:
            on_insert["images"] = images
        await db.products.update_one(
            {"slug": p["slug"]},
            {"$set": set_fields, "$setOnInsert": on_insert},
            upsert=True,
        )
    # Remove obsolete products that are no longer in the catalog.
    valid_slugs = [p["slug"] for p in INITIAL_PRODUCTS]
    await db.products.delete_many({"slug": {"$nin": valid_slugs}})
    logger.info("Upserted %d products", len(INITIAL_PRODUCTS))

    # One-time migration: apply the confirmed initial pickle stock statuses to
    # existing databases (preview & production). Runs once per DB; afterwards the
    # admin panel fully controls these statuses.
    if not await db.migrations.find_one({"_id": "pickle_stock_v1"}):
        pickle_status = {
            "chicken-pickle": "in-stock", "allam-sweet-pickle": "in-stock",
            "mutton-pickle": "in-stock", "prawn-pickle": "in-stock",
            "avakai-pickle": "out-of-stock", "maagai-pickle": "out-of-stock",
        }
        for slug, st in pickle_status.items():
            await db.products.update_one({"slug": slug}, {"$set": {"availability": st}})
        await db.migrations.insert_one({"_id": "pickle_stock_v1"})
        logger.info("Applied pickle_stock_v1 migration")

    existing_settings = await db.settings.find_one({"_id": "site"})
    if not existing_settings:
        s = Settings().model_dump()
        s["policies"] = DEFAULT_POLICIES
        s["_id"] = "site"
        await db.settings.insert_one(s)
    elif not existing_settings.get("policies"):
        await db.settings.update_one({"_id": "site"}, {"$set": {"policies": DEFAULT_POLICIES}})


@app.on_event("startup")
async def on_startup():
    await seed()


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origin_regex=".*",
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
