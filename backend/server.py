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
    images: List[str] = []
    pack_sizes: List[PackSize] = []
    availability: str = "coming-soon"  # available | coming-soon | enquire | unavailable
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
        "images": ["https://static.prod-images.emergentagent.com/jobs/c0402d02-f82c-4c87-9632-5729cd09b0fd/images/b41788359d4289ac589981e8d5fa8b87c1507b776d5d7ab012b32b3f968e6e26.jpeg"],
        "pack_sizes": [{"label": "500 ml", "price": None, "note": "Pricing confirmed at launch"},
                        {"label": "1 L", "price": None, "note": "Pricing confirmed at launch"}],
        "availability": "coming-soon", "live_press": True, "featured": False, "sort_order": 1,
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
        "images": ["https://static.prod-images.emergentagent.com/jobs/c0402d02-f82c-4c87-9632-5729cd09b0fd/images/ef96b70740edd217319255f7967baff4c4dd26d527f22dfae28c93a0aa108a1e.jpeg"],
        "pack_sizes": [{"label": "500 ml", "price": None, "note": "Pricing confirmed at launch"}],
        "availability": "coming-soon", "live_press": True, "featured": False, "sort_order": 4,
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
        "images": ["https://static.prod-images.emergentagent.com/jobs/c0402d02-f82c-4c87-9632-5729cd09b0fd/images/3f1d901f274afb9df3339da23892b343c1aafe49019ce9fbba74b907c80a2101.jpeg"],
        "pack_sizes": [{"label": "500 ml", "price": None, "note": "Pricing confirmed at launch"}],
        "availability": "coming-soon", "live_press": True, "featured": False, "sort_order": 2,
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
        "images": ["https://static.prod-images.emergentagent.com/jobs/c0402d02-f82c-4c87-9632-5729cd09b0fd/images/6a581d418ed7498e36efa91dbde9de25b3155fd6b37bc340c9389a22dbfe2577.jpeg"],
        "pack_sizes": [{"label": "500 ml", "price": None, "note": "Pricing confirmed at launch"}],
        "availability": "coming-soon", "live_press": True, "featured": False, "sort_order": 3,
    },
    {
        "slug": "cashew-brittle", "name": "Cashew Brittle", "category": "cashew-brittles",
        "short_description": "Whole roasted cashews coated in jaggery. Small-batch handcrafted goodness.",
        "description": "Premium whole cashews, carefully roasted before being dipped in jaggery. The roasting brings out the rich, nutty flavour of the cashews, while the jaggery adds a delicious caramelised sweetness. Crafted in small batches by AMYA, this unique roasting process is the secret behind our exceptional taste and irresistible crunch.",
        "extraction_method": "",
        "ingredients": "Whole roasted cashews, jaggery.",
        "allergens": "Contains cashews (tree nuts). May contain traces of other nuts.",
        "storage": "Store in an airtight container in a cool, dry place.",
        "delivery_info": "Dispatched after the order is confirmed. Delivery timeline shared on confirmation.",
        "returns_info": "As a perishable homemade food, returns are limited. Contact AMYA for any issue.",
        "food_label_info": "Food-label details are added once finalised by AMYA.",
        "images": ["https://customer-assets-eiarnc6j.emergentagent.net/job_amya-artisanal/artifacts/eac99c5da7e65e63_1BFEC77A-D52E-4699-9209-806370EA3678.png"],
        "pack_sizes": [
            {"label": "500 g", "price": 500, "note": "10 pieces"},
            {"label": "1 kg", "price": 900, "note": "20 pieces"},
        ],
        "availability": "available", "live_press": False, "featured": True, "sort_order": 0,
    },
    {
        "slug": "guntur-sannam-chilli-powder", "name": "Guntur Sannam Chilli Powder (S4)", "category": "spices",
        "short_description": "Premium chilli powder from carefully selected Guntur Sannam (S4) chillies.",
        "description": "Exceptional flavour begins with exceptional chillies. AMYA Guntur Sannam Chilli Powder is made using carefully selected Guntur Sannam (S4) chillies, valued for their distinctive red colour, characteristic chilli flavour and culinary versatility.\n\nWe prepare our chilli powder in small batches, working with local village women who contribute their traditional knowledge and careful preparation techniques.\n\nOur focus is simple: carefully selected raw materials, hygienic preparation, consistent quality and authentic flavour.",
        "origin": "Guntur, Andhra Pradesh, India",
        "highlights": ["Carefully selected Guntur Sannam (S4) chillies", "Premium raw material selection", "Small-batch preparation", "Hygienic handling and processing", "Prepared with the support of local village women", "Suitable for traditional Indian cooking"],
        "diet": "veg",
        "ingredients": "Dried Guntur Sannam (S4) red chillies.",
        "storage": "Store in an airtight container in a cool, dry place away from direct sunlight.",
        "delivery_info": "Dispatched after the order is confirmed. Delivery timeline shared on confirmation.",
        "returns_info": "Contact AMYA for any issue with your order.",
        "food_label_info": "AMYA Signature Spice. Pack sizes and pricing confirmed at launch.",
        "images": ["/products/guntur-sannam-chilli-powder.jpg"],
        "pack_sizes": [],
        "availability": "enquire", "live_press": False, "featured": True, "sort_order": 6,
    },
    {
        "slug": "lakadong-turmeric-powder", "name": "Lakadong Turmeric Powder", "category": "spices",
        "short_description": "A premium turmeric made using carefully sourced Lakadong turmeric.",
        "description": "Discover the distinctive character of Lakadong turmeric, traditionally associated with Meghalaya's Jaintia Hills. AMYA aims to bring this prized regional ingredient to your kitchen through careful sourcing and thoughtful preparation.\n\nWith its naturally rich golden colour and distinctive turmeric character, Lakadong turmeric is a beautiful addition to traditional Indian cooking.",
        "origin": "Lakadong, Jaintia Hills, Meghalaya, India",
        "highlights": ["Lakadong turmeric sourced from Jaintia Hills, Meghalaya", "Premium regional ingredient", "Carefully handled and hygienically processed", "Suitable for everyday cooking and traditional recipes", "Premium ingredient selection"],
        "diet": "veg",
        "ingredients": "Lakadong turmeric.",
        "storage": "Store in an airtight container in a cool, dry place away from direct sunlight.",
        "delivery_info": "Dispatched after the order is confirmed. Delivery timeline shared on confirmation.",
        "returns_info": "Contact AMYA for any issue with your order.",
        "food_label_info": "AMYA Signature Spice. Verified curcumin content and sourcing details added once confirmed. Pack sizes and pricing confirmed at launch.",
        "images": ["/products/lakadong-turmeric-powder.jpg"],
        "pack_sizes": [],
        "availability": "enquire", "live_press": False, "featured": True, "sort_order": 7,
    },
    {
        "slug": "amya-nuvvula-podi", "name": "AMYA Nuvvula Podi", "category": "spices",
        "short_description": "Traditional Andhra-style sesame podi, prepared by Amulya in small batches for an authentic homemade flavour.",
        "description": "AMYA Nuvvula Podi is a traditional Andhra-style sesame powder (podi), prepared by Amulya in small batches for an authentic homemade flavour.\n\nServing suggestion: Enjoy with hot rice and ghee, or serve alongside idli and dosa.",
        "origin": "Andhra Pradesh, India",
        "highlights": ["Traditional Andhra-style sesame podi", "Prepared by Amulya in small batches", "Authentic homemade flavour", "Enjoy with hot rice and ghee, idli or dosa"],
        "diet": "veg",
        "storage": "Store in an airtight container in a cool, dry place away from direct sunlight.",
        "delivery_info": "Dispatched after the order is confirmed. Delivery timeline shared on confirmation.",
        "returns_info": "Contact AMYA for any issue with your order.",
        "food_label_info": "AMYA Signature Spice. Ingredients, pack sizes and pricing shared on enquiry.",
        "images": ["/products/amya-nuvvula-podi.jpg"],
        "pack_sizes": [],
        "availability": "enquire", "live_press": False, "featured": True, "sort_order": 8,
    },
    {
        "slug": "amya-karivepaku-podi", "name": "AMYA Karivepaku Podi", "category": "spices",
        "short_description": "Traditional Andhra-style curry leaf podi, prepared by Amulya in small batches to bring authentic South Indian flavour to everyday meals.",
        "description": "AMYA Karivepaku Podi is a traditional Andhra-style curry leaf powder (podi), prepared by Amulya in small batches to bring authentic South Indian flavour to everyday meals.\n\nServing suggestion: Enjoy with hot rice and ghee, or serve with idli and dosa.",
        "origin": "Andhra Pradesh, India",
        "highlights": ["Traditional Andhra-style curry leaf podi", "Prepared by Amulya in small batches", "Authentic South Indian flavour", "Enjoy with hot rice and ghee, idli or dosa"],
        "diet": "veg",
        "storage": "Store in an airtight container in a cool, dry place away from direct sunlight.",
        "delivery_info": "Dispatched after the order is confirmed. Delivery timeline shared on confirmation.",
        "returns_info": "Contact AMYA for any issue with your order.",
        "food_label_info": "AMYA Signature Spice. Ingredients, pack sizes and pricing shared on enquiry.",
        "images": ["/products/amya-karivepaku-podi.jpg"],
        "pack_sizes": [],
        "availability": "enquire", "live_press": False, "featured": True, "sort_order": 9,
    },
    {
        "slug": "avakai-pickle", "name": "Avakai Pickle", "category": "pickles",
        "short_description": "Traditional Andhra-style raw mango pickle.",
        "description": "A traditional Andhra-style raw mango pickle, prepared using carefully selected ingredients and traditional recipes. Launching soon.",
        "diet": "veg",
        "food_label_info": "Ingredients, pack sizes and pricing confirmed at launch.",
        "images": [],
        "pack_sizes": [],
        "availability": "coming-soon", "live_press": False, "featured": False, "sort_order": 14,
    },
    {
        "slug": "maagai-pickle", "name": "Maagai Pickle", "category": "pickles",
        "short_description": "Traditional mango preparation inspired by Andhra culinary traditions.",
        "description": "A traditional mango pickle inspired by Andhra culinary traditions, prepared with thoughtful care. Launching soon.",
        "diet": "veg",
        "food_label_info": "Ingredients, pack sizes and pricing confirmed at launch.",
        "images": [],
        "pack_sizes": [],
        "availability": "coming-soon", "live_press": False, "featured": False, "sort_order": 15,
    },
    {
        "slug": "allam-sweet-pickle", "name": "Allam Sweet Pickle", "category": "pickles",
        "short_description": "A distinctive ginger-based sweet pickle combining traditional flavours.",
        "description": "A distinctive ginger-based sweet pickle that combines traditional flavours in a comforting preparation. Launching soon.",
        "diet": "veg",
        "food_label_info": "Ingredients, pack sizes and pricing confirmed at launch.",
        "images": [],
        "pack_sizes": [],
        "availability": "coming-soon", "live_press": False, "featured": False, "sort_order": 16,
    },
    {
        "slug": "chicken-pickle", "name": "Chicken Pickle", "category": "pickles",
        "short_description": "A flavourful non-vegetarian pickle prepared using chicken.",
        "description": "A flavourful non-vegetarian pickle prepared using chicken, in a traditional style. Launching soon.",
        "diet": "non-veg",
        "food_label_info": "Non-vegetarian. Ingredients, pack sizes and pricing confirmed at launch.",
        "images": [],
        "pack_sizes": [],
        "availability": "coming-soon", "live_press": False, "featured": False, "sort_order": 17,
    },
    {
        "slug": "mutton-pickle", "name": "Mutton Pickle", "category": "pickles",
        "short_description": "A rich, traditional-style mutton pickle.",
        "description": "A rich, traditional-style mutton pickle prepared with careful attention to flavour. Launching soon.",
        "diet": "non-veg",
        "food_label_info": "Non-vegetarian. Ingredients, pack sizes and pricing confirmed at launch.",
        "images": [],
        "pack_sizes": [],
        "availability": "coming-soon", "live_press": False, "featured": False, "sort_order": 18,
    },
    {
        "slug": "prawn-pickle", "name": "Prawn Pickle", "category": "pickles",
        "short_description": "A seafood pickle inspired by regional Indian flavours.",
        "description": "A seafood pickle inspired by regional Indian flavours, prepared in a traditional style. Launching soon.",
        "diet": "non-veg",
        "food_label_info": "Non-vegetarian. Ingredients, pack sizes and pricing confirmed at launch.",
        "images": [],
        "pack_sizes": [],
        "availability": "coming-soon", "live_press": False, "featured": False, "sort_order": 19,
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
    for p in INITIAL_PRODUCTS:
        p = dict(p)
        images = p.pop("images", [])
        await db.products.update_one(
            {"slug": p["slug"]},
            {"$set": p, "$setOnInsert": {"created_at": now_iso(), "images": images}},
            upsert=True,
        )
    # Remove obsolete products that are no longer in the catalog.
    valid_slugs = [p["slug"] for p in INITIAL_PRODUCTS]
    await db.products.delete_many({"slug": {"$nin": valid_slugs}})
    logger.info("Upserted %d products", len(INITIAL_PRODUCTS))

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
