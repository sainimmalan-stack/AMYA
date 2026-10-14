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
import secrets
import json
from urllib.parse import urlparse
from pydantic import EmailStr
from fastapi import Query
from invoices import build_invoice_pdf
import emailer

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


def validate_password_strength(pw: str) -> None:
    if len(pw or "") < 8 or not re.search(r"[A-Za-z]", pw) or not re.search(r"\d", pw):
        raise HTTPException(status_code=400,
            detail="Password must be at least 8 characters and include at least one letter and one number.")


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
    signature: bool = False
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
    # Invoice / business identity (admin-editable; blank => shown as placeholder, never invented)
    legal_name: str = ""
    business_address: str = ""
    fssai_number: str = ""
    support_email: str = ""
    support_phone: str = ""
    business_notify_email: str = ""
    website: str = "amyafoods.in"
    gst_enabled: bool = False
    gstin: str = ""
    gst_rate: float = 0.0
    delivery_charge: float = 0.0
    delivery_note: str = "Delivery charges, if any, will be confirmed with you when we confirm your order."


class LoginIn(BaseModel):
    email: str
    password: str


class AdminSetupIn(BaseModel):
    name: str
    email: EmailStr
    password: str


class ChangeCredentialsIn(BaseModel):
    current_password: str
    new_email: Optional[EmailStr] = None
    new_password: Optional[str] = None


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class ResetPasswordIn(BaseModel):
    token: str
    new_password: str


class StatusUpdate(BaseModel):
    status: str


class OrderItemIn(BaseModel):
    slug: str
    pack_label: Optional[str] = None
    qty: int = 1


class OrderCreate(BaseModel):
    customer_name: str
    customer_mobile: str
    customer_email: Optional[EmailStr] = None
    delivery_address: str
    country: str = "IN"
    postcode: Optional[str] = None
    items: List[OrderItemIn]
    client_ref: Optional[str] = None
    payment_method: str = "razorpay"  # razorpay only (Cash on Delivery removed)


def india_shipping(postcode: Optional[str]):
    """Returns (charge:int|None, status:'ok'|'quote'). Hyderabad=100, AP/TS=180, else quote."""
    pin = (postcode or "").strip()
    if not pin.isdigit() or len(pin) != 6:
        return None, "quote"
    if pin[:4] in ("5000", "5001"):
        return 100, "ok"          # Hyderabad eligible service area
    if pin[:2] in ("50", "51", "52", "53"):
        return 180, "ok"          # Telangana / Andhra Pradesh
    return None, "quote"


class RazorpayVerify(BaseModel):
    order_number: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class OrderStatusUpdate(BaseModel):
    payment_status: Optional[str] = None
    order_status: Optional[str] = None
    preparation_status: Optional[str] = None
    dispatch_status: Optional[str] = None
    tracking_reference: Optional[str] = None
    courier_name: Optional[str] = None
    cancellation_reason: Optional[str] = None
    note: Optional[str] = None


class BulkOrderAction(BaseModel):
    order_numbers: List[str] = []


# Order lifecycle (single source of truth) and payment states
ORDER_STATUSES = ["placed", "confirmed", "preparing", "ready_to_dispatch", "shipped", "delivered", "cancelled"]
# COD: cod_pending -> cod_collected ; Online: pending -> paid / failed ; Refund: refund_processing -> refunded
PAYMENT_STATUSES = ["cod_pending", "cod_collected", "pending", "paid", "failed", "refund_processing", "refunded"]
BUSINESS_FALLBACK_EMAIL = "Contactamyafoods@gmail.com"


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


@api.get("/auth/setup-status")
async def setup_status():
    """Public: tells the frontend whether a first-run admin account still needs creating."""
    count = await db.users.count_documents({"role": "admin"})
    return {"needs_setup": count == 0}


@api.post("/auth/setup")
async def setup_admin(payload: AdminSetupIn, response: Response):
    """Create the FIRST admin account. Succeeds only while zero admins exist."""
    if await db.users.count_documents({"role": "admin"}) > 0:
        raise HTTPException(status_code=403, detail="Setup has already been completed. Please sign in.")
    email = payload.email.lower().strip()
    name = (payload.name or "").strip() or "Admin"
    validate_password_strength(payload.password)
    try:
        res = await db.users.insert_one({
            "email": email, "password_hash": hash_password(payload.password),
            "name": name, "role": "admin", "created_at": now_iso(),
        })
    except Exception:
        # Unique index race / duplicate email
        raise HTTPException(status_code=403, detail="Setup has already been completed. Please sign in.")
    uid = str(res.inserted_id)
    access, refresh = create_access_token(uid, email), create_refresh_token(uid)
    set_auth_cookies(response, access, refresh)
    logger.info("First admin created via secure setup: %s", email)
    return {"id": uid, "email": email, "name": name, "role": "admin", "token": access}


@api.post("/auth/change-credentials")
async def change_credentials(payload: ChangeCredentialsIn, response: Response,
                             admin: dict = Depends(get_current_admin)):
    """Logged-in admin updates their own email and/or password securely."""
    user = await db.users.find_one({"_id": ObjectId(admin["_id"])})
    if not user or not verify_password(payload.current_password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Current password is incorrect.")
    updates = {}
    if payload.new_email:
        new_email = payload.new_email.lower().strip()
        if new_email != user["email"]:
            clash = await db.users.find_one({"email": new_email})
            if clash:
                raise HTTPException(status_code=400, detail="That email is already in use.")
            updates["email"] = new_email
    if payload.new_password:
        validate_password_strength(payload.new_password)
        updates["password_hash"] = hash_password(payload.new_password)
    if not updates:
        raise HTTPException(status_code=400, detail="Provide a new email and/or a new password.")
    await db.users.update_one({"_id": user["_id"]}, {"$set": updates})
    email = updates.get("email", user["email"])
    uid = str(user["_id"])
    set_auth_cookies(response, create_access_token(uid, email), create_refresh_token(uid))
    return {"id": uid, "email": email, "name": user.get("name"), "role": user.get("role")}


@api.post("/auth/forgot-password")
async def forgot_password(payload: ForgotPasswordIn, request: Request):
    """Email a one-time reset link. Always returns a generic message (no account enumeration)."""
    email = payload.email.lower().strip()
    generic = {"ok": True, "message": "If an admin account exists for that email, a password reset link has been sent."}
    user = await db.users.find_one({"email": email, "role": "admin"})
    if not user:
        return generic
    token = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    await db.password_reset_tokens.insert_one({
        "token": token, "user_id": str(user["_id"]), "email": email, "used": False,
        "created_at": now.isoformat(), "expires_at": now + timedelta(hours=1),
        "expires_ts": (now + timedelta(hours=1)).timestamp(),
    })
    reset_url = f"{_site_origin(request)}/admin/reset-password?token={token}"
    res = await emailer.send_email(
        to=email, subject="Reset your AMYA admin password",
        html=emailer.admin_reset_email_html(user.get("name") or "there", reset_url))
    logger.info("Admin password reset requested for %s (email ok=%s)", email, res.get("ok"))
    return generic


@api.post("/auth/reset-password")
async def reset_password(payload: ResetPasswordIn):
    doc = await db.password_reset_tokens.find_one({"token": payload.token})
    now_ts = datetime.now(timezone.utc).timestamp()
    if not doc or doc.get("used") or now_ts > doc.get("expires_ts", 0):
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired. Please request a new one.")
    validate_password_strength(payload.new_password)
    await db.users.update_one({"_id": ObjectId(doc["user_id"])},
                              {"$set": {"password_hash": hash_password(payload.new_password)}})
    await db.password_reset_tokens.update_one({"_id": doc["_id"]}, {"$set": {"used": True}})
    return {"ok": True, "message": "Your password has been reset. You can now sign in."}


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
        "short_description": "Groundnut oil, prepared to order in small batches.",
        "description": "Groundnut oil, prepared to order in small batches. Request a live session to observe the actual preparation process and ask questions before you order.",
        "extraction_method": "",
        "ingredients": "100% groundnuts (peanuts).",
        "allergens": "Contains peanuts.",
        "storage": "Store in a cool, dry place away from direct sunlight.",
        "delivery_info": "Dispatched after preparation. Delivery timeline shared on confirmation.",
        "returns_info": "As a fresh-pressed food product, returns are limited. Contact AMYA for any issue with your order.",
        "food_label_info": "Food-label details are added once finalised by AMYA.",
        "images": ["/products/amya-groundnut-oil.jpg?v=3"],
        "pack_sizes": [{"label": "1 litre", "price": None}],
        "availability": "coming-soon", "live_press": True, "featured": False, "sort_order": 16,
    },
    {
        "slug": "sesame-oil", "name": "Sesame Oil", "category": "oils",
        "short_description": "Aromatic sesame (gingelly) oil, prepared in small batches.",
        "description": "Availability opens as production is ready — request a live session to see the process.",
        "extraction_method": "",
        "ingredients": "100% sesame seeds.",
        "allergens": "Contains sesame.",
        "storage": "Store in a cool, dry place away from direct sunlight.",
        "delivery_info": "Dispatched after preparation. Delivery timeline shared on confirmation.",
        "returns_info": "Contact AMYA for any issue with your order.",
        "food_label_info": "Food-label details are added once finalised by AMYA.",
        "images": ["/products/amya-sesame-oil.jpg?v=3"],
        "pack_sizes": [{"label": "1 litre", "price": None}],
        "availability": "coming-soon", "live_press": True, "featured": False, "sort_order": 17,
    },
    {
        "slug": "coconut-oil", "name": "Coconut Oil", "category": "oils",
        "short_description": "Coconut oil, prepared in small batches.",
        "description": "Availability opens as production is ready.",
        "extraction_method": "",
        "ingredients": "100% dried coconut.",
        "allergens": "May contain traces depending on shared handling. Details confirmed by AMYA.",
        "storage": "Store in a cool, dry place. May solidify in cooler temperatures.",
        "delivery_info": "Dispatched after preparation. Delivery timeline shared on confirmation.",
        "returns_info": "Contact AMYA for any issue with your order.",
        "food_label_info": "Food-label details are added once finalised by AMYA.",
        "images": ["/products/amya-coconut-oil.jpg?v=3"],
        "pack_sizes": [{"label": "1 litre", "price": None}],
        "availability": "coming-soon", "live_press": True, "featured": False, "sort_order": 18,
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
        "availability": "available", "live_press": False, "featured": True, "sort_order": 6,
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
        "availability": "available", "live_press": False, "featured": True, "sort_order": 7,
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
        "images": ["/products/amya-coriander-powder.jpg?v=2"],
        "pack_sizes": [{"label": "250 g", "price": None}, {"label": "500 g", "price": None}, {"label": "1 kg", "price": None}],
        "availability": "available", "live_press": False, "featured": False, "sort_order": 9,
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
        "images": ["/products/amya-cumin-powder.jpg?v=2"],
        "pack_sizes": [{"label": "250 g", "price": None}, {"label": "500 g", "price": None}, {"label": "1 kg", "price": None}],
        "availability": "available", "live_press": False, "featured": False, "sort_order": 8,
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
        "images": ["/products/kaju-bites.jpg?v=2"],
        "pack_sizes": [],
        "availability": "available", "live_press": False, "featured": False, "sort_order": 1,
    },

    {
        "slug": "amya-nuvvula-podi", "name": "Nuvvula Podi", "category": "spices",
        "short_description": "Bring home the comforting taste of traditional Andhra cooking with AMYA Nuvvula Podi. This sesame-based podi pairs beautifully with hot rice and ghee, making everyday meals feel special.",
        "description": "AMYA Nuvvula Podi is a traditional sesame podi, prepared by Amulya's mother-in-law, Leela, in small batches for an authentic, home-style flavour.",
        "origin": "Andhra Pradesh, India",
        "highlights": ["Traditional Andhra-style sesame podi", "Prepared by Amulya's mother-in-law, Leela", "A familiar, home-style flavour"],
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
        "recipe_story": {"heading": "AMYA SIGNATURE PODI", "body": "Meet AMYA's signature Nuvvula Podi, lovingly prepared by Amulya's mother-in-law, Leela. Rooted in traditional Andhra cooking, this sesame-based podi brings a distinctive, nutty flavour to everyday meals. Enjoy it with hot rice and ghee or alongside your favourite traditional dishes."},
        "signature": True,
        "availability": "order", "live_press": False, "featured": True, "sort_order": 2,
    },
    {
        "slug": "amya-karivepaku-podi", "name": "Karivepaku Podi", "category": "spices",
        "short_description": "A traditional curry leaf podi made to bring a familiar, comforting taste to everyday meals.",
        "description": "AMYA Karivepaku Podi is a traditional curry leaf podi, prepared by Amulya's mother-in-law, Leela, in small batches to bring a familiar, comforting taste to everyday meals.",
        "origin": "Andhra Pradesh, India",
        "highlights": ["Traditional Andhra-style curry leaf podi", "Prepared by Amulya's mother-in-law, Leela", "Familiar, comforting everyday flavour"],
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
        "recipe_story": {"heading": "A TRADITIONAL FAMILY RECIPE", "body": "Our Karivepaku Podi is prepared by Amulya's mother-in-law, Leela, with a love for traditional Andhra flavours. Made in small batches, this familiar curry-leaf podi brings a comforting homemade touch to everyday meals."},
        "availability": "order", "live_press": False, "featured": True, "sort_order": 3,
    },
    {
        "slug": "amya-nallakaram", "name": "Nallakaram Podi", "category": "spices",
        "short_description": "A traditional Andhra-style podi made for those who love bold, comforting flavours.",
        "description": "AMYA Nallakaram Podi is a traditional Andhra-style podi, prepared by Amulya's mother-in-law, Leela, in small batches for those who love bold, comforting flavours.",
        "origin": "Andhra Pradesh, India",
        "highlights": ["Traditional Andhra-style nallakaram podi", "Prepared by Amulya's mother-in-law, Leela", "Bold, comforting flavour"],
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
        "recipe_story": {"heading": "A TRADITIONAL FAMILY RECIPE", "body": "Our Nallakaram Podi is prepared by Amulya's mother-in-law, Leela, drawing on traditional Andhra cooking. Made in small batches, it brings a distinctive, savoury flavour to meals and celebrates the taste of a traditional home kitchen."},
        "availability": "order", "live_press": False, "featured": True, "sort_order": 4,
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
        "availability": "order", "live_press": False, "featured": True, "sort_order": 5,
    },
    {
        "slug": "avakai-pickle", "name": "Avakai Pickle", "category": "pickles",
        "short_description": "Traditional Andhra-style raw mango pickle.",
        "description": "A traditional Andhra-style raw mango pickle, prepared using carefully selected ingredients and traditional recipes. Launching soon.",
        "diet": "veg",
        "food_label_info": "Ingredients, pack sizes and pricing confirmed at launch.",
        "images": [],
        "pack_sizes": [],
        "recipe_story": {"heading": "A CHERISHED FAMILY RECIPE", "body": "Our Avakai follows the traditional recipe of Amulya's mother-in-law, Leela, bringing the much-loved flavours of Andhra mango pickle to your table. Rooted in family tradition and prepared with care, it celebrates a cherished taste of home."},
        "availability": "out-of-stock", "live_press": False, "featured": False, "sort_order": 14,
    },
    {
        "slug": "maagai-pickle", "name": "Maagai Pickle", "category": "pickles",
        "short_description": "Traditional mango preparation inspired by Andhra culinary traditions.",
        "description": "A traditional mango pickle inspired by Andhra culinary traditions, prepared with thoughtful care. Launching soon.",
        "diet": "veg",
        "food_label_info": "Ingredients, pack sizes and pricing confirmed at launch.",
        "images": [],
        "pack_sizes": [],
        "recipe_story": {"heading": "A CHERISHED FAMILY RECIPE", "body": "Our Magai follows the traditional recipe of Amulya's mother-in-law, Leela, preserving a cherished Andhra preparation shaped by years of cooking experience. Each batch reflects the care, patience and familiar flavours of a traditional family kitchen."},
        "availability": "out-of-stock", "live_press": False, "featured": False, "sort_order": 15,
    },
    {
        "slug": "allam-sweet-pickle", "name": "Allam Sweet Pickle", "category": "pickles",
        "short_description": "A distinctive ginger-based sweet pickle combining traditional flavours.",
        "description": "A distinctive ginger-based sweet pickle that combines traditional flavours in a comforting preparation. Launching soon.",
        "diet": "veg",
        "food_label_info": "Ingredients, pack sizes and pricing confirmed at launch.",
        "images": [],
        "pack_sizes": [],
        "recipe_story": {"heading": "A RECIPE FROM AMULYA'S AMMAMMA", "body": "Our Allam Sweet Pickle is prepared by Amulya using a cherished recipe passed down by her ammamma. Its distinctive sweet-and-ginger character brings a treasured family tradition to the AMYA kitchen."},
        "availability": "in-stock", "live_press": False, "featured": False, "sort_order": 13,
    },
    {
        "slug": "chicken-pickle", "name": "Chicken Pickle", "category": "pickles",
        "short_description": "A flavourful non-vegetarian pickle prepared using chicken.",
        "description": "A flavourful non-vegetarian pickle prepared using chicken, in a traditional style. Launching soon.",
        "diet": "non-veg",
        "food_label_info": "Non-vegetarian. Ingredients, pack sizes and pricing confirmed at launch.",
        "images": [],
        "pack_sizes": [],
        "recipe_story": {"heading": "PREPARED BY AMULYA", "body": "Prepared by Amulya in small batches, our Chicken Pickle celebrates the bold, authentic flavours of traditional Andhra home cooking. Carefully prepared with attention to taste and texture, it brings a much-loved homemade favourite to your table."},
        "availability": "in-stock", "live_press": False, "featured": False, "sort_order": 10,
    },
    {
        "slug": "mutton-pickle", "name": "Mutton Pickle", "category": "pickles",
        "short_description": "A rich, traditional-style mutton pickle.",
        "description": "A rich, traditional-style mutton pickle prepared with careful attention to flavour. Launching soon.",
        "diet": "non-veg",
        "food_label_info": "Non-vegetarian. Ingredients, pack sizes and pricing confirmed at launch.",
        "images": [],
        "pack_sizes": [],
        "recipe_story": {"heading": "PREPARED BY AMULYA", "body": "Crafted by Amulya in small batches, our Mutton Pickle brings together rich, traditional Andhra flavours and the care of homemade preparation. Every batch is prepared with attention to flavour, texture and tradition."},
        "availability": "in-stock", "live_press": False, "featured": False, "sort_order": 11,
    },
    {
        "slug": "prawn-pickle", "name": "Prawn Pickle", "category": "pickles",
        "short_description": "A seafood pickle inspired by regional Indian flavours.",
        "description": "A seafood pickle inspired by regional Indian flavours, prepared in a traditional style. Launching soon.",
        "diet": "non-veg",
        "food_label_info": "Non-vegetarian. Ingredients, pack sizes and pricing confirmed at launch.",
        "images": [],
        "pack_sizes": [],
        "recipe_story": {"heading": "PREPARED BY AMULYA", "body": "Prepared by Amulya in small batches, our Prawn Pickle captures the distinctive, bold flavours of Andhra-style seafood pickles. Made with care, it is a traditional favourite for those who love authentic homemade taste."},
        "availability": "in-stock", "live_press": False, "featured": False, "sort_order": 12,
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
    await db.password_reset_tokens.create_index("token", unique=True)
    await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)
    # Backfill soft-delete marker so active/trash queries are consistent for legacy orders.
    await db.orders.update_many({"deleted_at": {"$exists": False}}, {"$set": {"deleted_at": None}})

    # SECURITY: No default/hardcoded admin is ever created. The very first admin
    # account is created by the founder via the one-time secure setup flow
    # (POST /api/auth/setup), which succeeds ONLY while zero admins exist.
    # This guarantees there is no shipped default password in any environment.

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
        "kaju-bites",
        "groundnut-oil", "sesame-oil", "coconut-oil",
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
            p["pack_sizes"] = [{"label": "1 litre", "price": None}]
        elif p.get("category") == "pickles":
            prices = PICKLE_PRICES.get(p["slug"], [None, None, None])
            p["pack_sizes"] = [
                {"label": "250 g", "price": prices[0]},
                {"label": "500 g", "price": prices[1]},
                {"label": "1 kg", "price": prices[2]},
            ]
            p["images"] = [f"/products/{p['slug']}.jpg?v=5"]
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


# ---------------------------------------------------------------------------
# Orders + PDF invoices
# ---------------------------------------------------------------------------
import razorpay as _razorpay_sdk

RZP_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "")
RZP_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")
RZP_WEBHOOK_SECRET = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "")


def _razorpay_client():
    if not (RZP_KEY_ID and RZP_KEY_SECRET):
        return None
    return _razorpay_sdk.Client(auth=(RZP_KEY_ID, RZP_KEY_SECRET))


async def _settings_dict() -> dict:
    s = await db.settings.find_one({"_id": "site"})
    if not s:
        s = Settings().model_dump()
    s.pop("_id", None)
    return s


def _gen_order_number() -> str:
    day = datetime.now(timezone.utc).strftime("%Y%m%d")
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    suffix = "".join(secrets.choice(alphabet) for _ in range(4))
    return f"AMYA-{day}-{suffix}"


def _site_origin(request: Request) -> str:
    origin = request.headers.get("origin") or ""
    if origin.startswith("https://"):
        return origin.rstrip("/")
    ref = request.headers.get("referer") or ""
    if ref.startswith("https://"):
        p = urlparse(ref)
        return f"{p.scheme}://{p.netloc}"
    return (os.environ.get("PUBLIC_BASE_URL") or "https://amyafoods.in").rstrip("/")


async def _build_order_doc(payload: OrderCreate, request: Request) -> dict:
    if not payload.items:
        raise HTTPException(status_code=400, detail="Your cart is empty.")
    cfg = await _settings_dict()
    items, subtotal, any_unpriced = [], 0.0, False
    for raw in payload.items:
        product = await db.products.find_one({"slug": raw.slug})
        if not product:
            raise HTTPException(status_code=400, detail=f"Product not found: {raw.slug}")
        qty = max(1, int(raw.qty))
        unit_price, note = None, None
        packs = product.get("pack_sizes") or []
        if raw.pack_label:
            match = next((p for p in packs if p.get("label") == raw.pack_label), None)
            if not match:
                raise HTTPException(status_code=400, detail=f"Invalid pack size for {product.get('name')}")
            unit_price = match.get("price")
            note = match.get("note")
        elif packs:
            unit_price = packs[0].get("price")
            note = packs[0].get("note")
        line_total = round(unit_price * qty, 2) if unit_price is not None else None
        if line_total is None:
            any_unpriced = True
        else:
            subtotal += line_total
        items.append({"slug": raw.slug, "name": product.get("name"),
                      "pack_label": raw.pack_label, "unit_price": unit_price,
                      "qty": qty, "line_total": line_total, "note": note})
    subtotal = round(subtotal, 2)
    ship_charge, _ship_status = india_shipping(payload.postcode)
    delivery_charge = round(float(ship_charge or 0), 2)
    discount = 0.0
    gst_amount = None
    total = None if any_unpriced else round(subtotal + delivery_charge - discount, 2)
    if not any_unpriced and cfg.get("gst_enabled") and cfg.get("gst_rate"):
        gst_amount = round(subtotal * float(cfg["gst_rate"]) / 100.0, 2)
        total = round(total + gst_amount, 2)

    order_number = _gen_order_number()
    while await db.orders.find_one({"order_number": order_number}):
        order_number = _gen_order_number()
    suffix = order_number.split("-")[-1]
    now = datetime.now(timezone.utc)
    doc = {
        "order_number": order_number,
        "invoice_number": f"INV-{now.strftime('%Y%m%d')}-{suffix}",
        "created_at": now.isoformat(),
        "invoice_date": now.strftime("%d %b %Y"),
        "customer": {"name": payload.customer_name.strip(), "mobile": payload.customer_mobile.strip(),
                     "email": (payload.customer_email or "").strip() or None,
                     "address": payload.delivery_address.strip()},
        "items": items,
        "subtotal": subtotal, "delivery_charge": delivery_charge, "discount": discount,
        "gst_amount": gst_amount, "total": total, "total_pending": any_unpriced,
        "payment_method": "razorpay" if payload.payment_method == "razorpay" else "cod",
        "payment_status": "pending" if payload.payment_method == "razorpay" else "cod_pending",
        "razorpay_order_id": None,
        "razorpay_payment_id": None,
        "order_status": "placed", "preparation_status": "pending", "dispatch_status": "not_dispatched",
        "tracking_reference": "", "courier_name": "", "cancellation_reason": "",
        "status_history": [],
        "download_token": secrets.token_urlsafe(24),
        "invoice_generated": True,
        "site_origin": _site_origin(request),
        "client_ref": payload.client_ref,
        "notifications": [],
    }
    return doc


def _public_order(doc: dict) -> dict:
    d = {k: v for k, v in doc.items() if k not in ("_id", "download_token", "notifications", "site_origin")}
    d["download_token"] = doc.get("download_token")  # returned to the order owner only (fresh creation / token match)
    return d


@api.post("/orders")
async def create_order(payload: OrderCreate, request: Request):
    # Cash on Delivery has been removed — only verified online payment is accepted.
    if payload.payment_method != "razorpay":
        raise HTTPException(status_code=400, detail="Cash on Delivery is no longer available. Please pay online to place your order.")
    # Online payment & INR charging are enabled for eligible India destinations only.
    if (payload.country or "IN").upper() != "IN":
        raise HTTPException(status_code=400, detail="International orders require a shipping and payment quote. Please use the enquiry option to place your order.")
    _ship, _ship_status = india_shipping(payload.postcode)
    if _ship_status != "ok":
        raise HTTPException(status_code=400, detail="This PIN code needs a shipping quote before online payment. Please use the enquiry option.")
    # Idempotency: same client cart reference returns the existing order (no duplicates)
    if payload.client_ref:
        existing = await db.orders.find_one({"client_ref": payload.client_ref})
        if existing:
            return _public_order(existing)
    doc = await _build_order_doc(payload, request)

    # Online payment: create a Razorpay order (amount in paise) before persisting
    rzp_out = {}
    if payload.payment_method == "razorpay":
        client = _razorpay_client()
        if not client:
            raise HTTPException(status_code=503, detail="Online payment is temporarily unavailable. Please contact us on WhatsApp to place your order.")
        if doc.get("total_pending") or doc.get("total") is None or doc["total"] <= 0:
            raise HTTPException(status_code=400, detail="This order needs price confirmation before it can be paid online. Please contact us on WhatsApp to confirm.")
        rz = client.order.create({
            "amount": int(round(doc["total"] * 100)),
            "currency": "INR",
            "payment_capture": 1,
            "receipt": doc["order_number"][:40],
        })
        doc["razorpay_order_id"] = rz["id"]
        rzp_out = {"razorpay_order_id": rz["id"], "razorpay_key_id": RZP_KEY_ID,
                   "amount": rz["amount"], "currency": "INR"}

    await db.orders.insert_one(dict(doc))
    out = _public_order(doc)
    out.update(rzp_out)

    # Best-effort notifications (customer + business). Never block the order.
    # For online payment, confirmation emails are sent after payment is verified.
    send_now = payload.payment_method != "razorpay"
    invoice_url = f"{doc['site_origin']}/api/orders/{doc['order_number']}/invoice?token={doc['download_token']}"
    admin_url = f"{doc['site_origin']}/admin"
    logs = []
    if send_now and doc["customer"]["email"]:
        res = await emailer.send_email(
            to=doc["customer"]["email"],
            subject=f"Your AMYA order {doc['order_number']} is confirmed",
            html=emailer.customer_email_html(doc, invoice_url))
        logs.append({"type": "customer_email", "to": doc["customer"]["email"],
                     "ok": res.get("ok"), "detail": res.get("id") or res.get("error"), "at": now_iso()})
    cfg = await _settings_dict()
    biz_email = cfg.get("business_notify_email") or BUSINESS_FALLBACK_EMAIL
    if send_now and biz_email:
        res = await emailer.send_email(
            to=biz_email, subject=f"New AMYA order {doc['order_number']} — {doc['customer']['name']}",
            html=emailer.business_email_html(doc, admin_url))
        logs.append({"type": "business_email", "to": biz_email,
                     "ok": res.get("ok"), "detail": res.get("id") or res.get("error"), "at": now_iso()})
    if logs:
        await db.orders.update_one({"order_number": doc["order_number"]},
                                   {"$push": {"notifications": {"$each": logs}}})
        doc["notifications"] = logs
    return out


@api.get("/orders/{order_number}")
async def get_order_public(order_number: str, token: str = Query(...)):
    doc = await db.orders.find_one({"order_number": order_number})
    if not doc or doc.get("download_token") != token:
        raise HTTPException(status_code=404, detail="Order not found")
    return _public_order(doc)


def _invoice_response(doc: dict, cfg: dict) -> Response:
    pdf = build_invoice_pdf(doc, cfg)
    return Response(content=pdf, media_type="application/pdf", headers={
        "Content-Disposition": f'inline; filename="AMYA-{doc["order_number"]}.pdf"'})


@api.get("/orders/{order_number}/invoice")
async def download_invoice(order_number: str, token: str = Query(...)):
    doc = await db.orders.find_one({"order_number": order_number})
    if not doc or doc.get("download_token") != token:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return _invoice_response(doc, await _settings_dict())


@api.get("/payments/razorpay/config")
async def razorpay_config():
    return {"enabled": bool(RZP_KEY_ID and RZP_KEY_SECRET), "key_id": RZP_KEY_ID}


async def _send_order_emails(doc: dict):
    logs = []
    invoice_url = f"{doc.get('site_origin') or 'https://amyafoods.in'}/api/orders/{doc['order_number']}/invoice?token={doc['download_token']}"
    admin_url = f"{doc.get('site_origin') or 'https://amyafoods.in'}/admin"
    if doc["customer"].get("email"):
        res = await emailer.send_email(to=doc["customer"]["email"],
            subject=f"Your AMYA order {doc['order_number']} is confirmed",
            html=emailer.customer_email_html(doc, invoice_url))
        logs.append({"type": "customer_email", "to": doc["customer"]["email"], "ok": res.get("ok"),
                     "detail": res.get("id") or res.get("error"), "at": now_iso()})
    cfg = await _settings_dict()
    biz_email = cfg.get("business_notify_email") or BUSINESS_FALLBACK_EMAIL
    if biz_email:
        res = await emailer.send_email(to=biz_email,
            subject=f"New AMYA order {doc['order_number']} — {doc['customer']['name']}",
            html=emailer.business_email_html(doc, admin_url))
        logs.append({"type": "business_email", "to": biz_email, "ok": res.get("ok"),
                     "detail": res.get("id") or res.get("error"), "at": now_iso()})
    if logs:
        await db.orders.update_one({"order_number": doc["order_number"]}, {"$push": {"notifications": {"$each": logs}}})


@api.post("/payments/razorpay/verify")
async def razorpay_verify(payload: RazorpayVerify):
    client = _razorpay_client()
    if not client:
        raise HTTPException(status_code=503, detail="Online payment not configured")
    doc = await db.orders.find_one({"order_number": payload.order_number})
    if not doc or doc.get("razorpay_order_id") != payload.razorpay_order_id:
        raise HTTPException(status_code=404, detail="Order not found")
    try:
        client.utility.verify_payment_signature({
            "razorpay_order_id": payload.razorpay_order_id,
            "razorpay_payment_id": payload.razorpay_payment_id,
            "razorpay_signature": payload.razorpay_signature,
        })
    except Exception:
        raise HTTPException(status_code=400, detail="Payment verification failed")
    if doc.get("payment_status") != "paid":
        await db.orders.update_one({"order_number": payload.order_number}, {"$set": {
            "payment_status": "paid", "razorpay_payment_id": payload.razorpay_payment_id,
            "order_status": "confirmed"}})
        doc = await db.orders.find_one({"order_number": payload.order_number})
        await _send_order_emails(doc)
    return {"ok": True}


@api.post("/payments/razorpay/webhook")
async def razorpay_webhook(request: Request):
    if not RZP_WEBHOOK_SECRET:
        raise HTTPException(status_code=503, detail="Webhook not configured")
    body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")
    client = _razorpay_client()
    try:
        client.utility.verify_webhook_signature(body.decode(), signature, RZP_WEBHOOK_SECRET)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")
    data = json.loads(body.decode())
    entity = (((data.get("payload") or {}).get("payment") or {}).get("entity")) or {}
    rzp_order_id, rzp_payment_id = entity.get("order_id"), entity.get("id")
    if data.get("event") in ("payment.captured", "order.paid") and rzp_order_id:
        doc = await db.orders.find_one({"razorpay_order_id": rzp_order_id})
        if doc and doc.get("payment_status") != "paid":
            await db.orders.update_one({"_id": doc["_id"]}, {"$set": {
                "payment_status": "paid", "razorpay_payment_id": rzp_payment_id, "order_status": "confirmed"}})
            doc = await db.orders.find_one({"_id": doc["_id"]})
            await _send_order_emails(doc)
    return {"status": "ok"}


# -------------------- Admin: orders --------------------
def _admin_order(doc: dict) -> dict:
    """Serialize an order for the admin dashboard with safe defaults for legacy docs."""
    doc.pop("_id", None)
    doc.setdefault("tracking_reference", "")
    doc.setdefault("courier_name", "")
    doc.setdefault("cancellation_reason", "")
    doc.setdefault("status_history", [])
    doc.setdefault("deleted_at", None)
    doc.setdefault("deleted_by", None)
    doc.setdefault("deletion_log", [])
    return doc


# A record with real financial/tax significance must be retained (soft-delete only).
def _has_retained_financial_record(doc: dict) -> bool:
    return bool(doc.get("razorpay_payment_id")) or (
        doc.get("payment_status") in {"paid", "cod_collected", "refund_processing", "refunded"})


@api.get("/admin/orders")
async def admin_orders(admin: dict = Depends(get_current_admin)):
    # Active orders only — soft-deleted orders live in Trash and are excluded
    # from the dashboard, counts and revenue.
    docs = await db.orders.find({"deleted_at": None}).sort("created_at", -1).to_list(2000)
    return [_admin_order(d) for d in docs]


@api.get("/admin/orders/deleted")
async def admin_orders_deleted(admin: dict = Depends(get_current_admin)):
    docs = await db.orders.find({"deleted_at": {"$ne": None}}).sort("deleted_at", -1).to_list(2000)
    return [_admin_order(d) for d in docs]


@api.get("/admin/orders/{order_number}")
async def admin_order_detail(order_number: str, admin: dict = Depends(get_current_admin)):
    doc = await db.orders.find_one({"order_number": order_number})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    return _admin_order(doc)


@api.patch("/admin/orders/{order_number}")
async def admin_update_order(order_number: str, payload: OrderStatusUpdate, admin: dict = Depends(get_current_admin)):
    doc = await db.orders.find_one({"order_number": order_number})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")

    data = payload.model_dump()
    note = (data.get("note") or "").strip()

    # Validate enum values
    if data.get("order_status") and data["order_status"] not in ORDER_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid order status")
    if data.get("payment_status") and data["payment_status"] not in PAYMENT_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid payment status")

    # Guardrail: 'paid' is only ever set by verified Razorpay signature/webhook — never manually.
    if data.get("payment_status") == "paid" and doc.get("payment_status") != "paid":
        raise HTTPException(status_code=400,
            detail="An order can only be marked PAID by a verified Razorpay payment. Use 'COD collected' for cash orders.")

    # Cancellation requires a recorded reason.
    if data.get("order_status") == "cancelled":
        if not (data.get("cancellation_reason") or "").strip():
            raise HTTPException(status_code=400, detail="A cancellation reason is required to cancel an order.")

    updates, history = {}, []
    by, by_email = admin.get("name") or "Admin", admin.get("email") or ""
    at = now_iso()

    for field in ("order_status", "payment_status", "preparation_status", "dispatch_status"):
        new_val = data.get(field)
        if new_val is not None and new_val != doc.get(field):
            updates[field] = new_val
            history.append({"field": field, "from": doc.get(field), "to": new_val,
                            "by": by, "by_email": by_email, "at": at, "note": note})

    for field in ("tracking_reference", "courier_name", "cancellation_reason"):
        new_val = data.get(field)
        if new_val is not None:
            updates[field] = new_val.strip()

    if not updates:
        raise HTTPException(status_code=400, detail="No changes to apply.")

    ops = {"$set": updates}
    if history:
        ops["$push"] = {"status_history": {"$each": history}}
    await db.orders.update_one({"order_number": order_number}, ops)
    doc = await db.orders.find_one({"order_number": order_number})

    # Best-effort customer email on meaningful transitions (shipped / delivered). Never blocks.
    email_result = None
    new_os = updates.get("order_status")
    if new_os in ("shipped", "delivered") and doc.get("customer", {}).get("email"):
        invoice_url = f"{doc.get('site_origin') or 'https://amyafoods.in'}/api/orders/{order_number}/invoice?token={doc['download_token']}"
        res = await emailer.send_email(
            to=doc["customer"]["email"],
            subject=f"Your AMYA order {order_number} is {'on its way' if new_os == 'shipped' else 'delivered'}",
            html=emailer.status_update_email_html(doc, new_os, invoice_url))
        email_result = {"ok": res.get("ok"), "detail": res.get("id") or res.get("error")}
        await db.orders.update_one({"order_number": order_number}, {"$push": {"notifications": {
            "type": f"status_email_{new_os}", "to": doc["customer"]["email"],
            "ok": res.get("ok"), "detail": res.get("id") or res.get("error"), "at": now_iso()}}})

    out = _admin_order(doc)
    out["email_result"] = email_result
    return out


@api.get("/admin/orders/{order_number}/invoice")
async def admin_download_invoice(order_number: str, admin: dict = Depends(get_current_admin)):
    doc = await db.orders.find_one({"order_number": order_number})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    return _invoice_response(doc, await _settings_dict())


@api.post("/admin/orders/{order_number}/resend-email")
async def admin_resend_email(order_number: str, admin: dict = Depends(get_current_admin)):
    doc = await db.orders.find_one({"order_number": order_number})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    email = doc.get("customer", {}).get("email")
    if not email:
        raise HTTPException(status_code=400, detail="This order has no customer email on file.")
    invoice_url = f"{doc.get('site_origin') or 'https://amyafoods.in'}/api/orders/{order_number}/invoice?token={doc['download_token']}"
    res = await emailer.send_email(to=email,
                                   subject=f"Your AMYA order {order_number} — invoice",
                                   html=emailer.customer_email_html(doc, invoice_url))
    log = {"type": "customer_email_resend", "to": email, "ok": res.get("ok"),
           "detail": res.get("id") or res.get("error"), "at": now_iso()}
    await db.orders.update_one({"order_number": order_number}, {"$push": {"notifications": log}})
    if not res.get("ok"):
        raise HTTPException(status_code=502, detail=f"Email not sent: {res.get('error')}")
    return {"ok": True, "detail": res.get("id")}


# -------------------- Admin: order deletion (soft delete / trash / restore) --------------------
async def _audit_deletion(order_number: str, action: str, admin: dict, extra: dict = None):
    """Durable deletion audit trail (survives even a permanent delete)."""
    entry = {"order_number": order_number, "action": action,
             "by": admin.get("name") or "Admin", "by_email": admin.get("email") or "",
             "at": now_iso()}
    if extra:
        entry.update(extra)
    await db.deletion_audit.insert_one(dict(entry))
    return entry


async def _soft_delete_one(order_number: str, admin: dict) -> str:
    """Returns 'deleted' | 'not_found' | 'already'."""
    doc = await db.orders.find_one({"order_number": order_number})
    if not doc:
        return "not_found"
    if doc.get("deleted_at"):
        return "already"
    entry = await _audit_deletion(order_number, "soft_delete", admin)
    await db.orders.update_one({"order_number": order_number}, {
        "$set": {"deleted_at": entry["at"], "deleted_by": entry["by"], "deleted_by_email": entry["by_email"]},
        "$push": {"deletion_log": {"action": "soft_delete", "by": entry["by"], "by_email": entry["by_email"], "at": entry["at"]}},
    })
    return "deleted"


@api.delete("/admin/orders/{order_number}")
async def admin_soft_delete_order(order_number: str, admin: dict = Depends(get_current_admin)):
    """Move a single order to Trash (soft delete). The record is retained, just hidden."""
    result = await _soft_delete_one(order_number, admin)
    if result == "not_found":
        raise HTTPException(status_code=404, detail="Order not found")
    if result == "already":
        raise HTTPException(status_code=400, detail="This order is already in Trash.")
    return {"ok": True, "status": "deleted"}


@api.post("/admin/orders/bulk-delete")
async def admin_bulk_delete_orders(payload: BulkOrderAction, admin: dict = Depends(get_current_admin)):
    """Move multiple orders to Trash (soft delete)."""
    if not payload.order_numbers:
        raise HTTPException(status_code=400, detail="No orders selected.")
    deleted, skipped = 0, 0
    for on in payload.order_numbers:
        res = await _soft_delete_one(on, admin)
        if res == "deleted":
            deleted += 1
        else:
            skipped += 1
    return {"ok": True, "deleted": deleted, "skipped": skipped}


@api.post("/admin/orders/{order_number}/restore")
async def admin_restore_order(order_number: str, admin: dict = Depends(get_current_admin)):
    doc = await db.orders.find_one({"order_number": order_number})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    if not doc.get("deleted_at"):
        raise HTTPException(status_code=400, detail="This order is not in Trash.")
    entry = await _audit_deletion(order_number, "restore", admin)
    await db.orders.update_one({"order_number": order_number}, {
        "$set": {"deleted_at": None, "deleted_by": None, "deleted_by_email": None},
        "$push": {"deletion_log": {"action": "restore", "by": entry["by"], "by_email": entry["by_email"], "at": entry["at"]}},
    })
    return {"ok": True, "status": "restored"}


@api.delete("/admin/orders/{order_number}/permanent")
async def admin_permanent_delete_order(order_number: str, admin: dict = Depends(get_current_admin)):
    """Permanently delete an order — ONLY if it carries no retained financial/tax record."""
    doc = await db.orders.find_one({"order_number": order_number})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    if not doc.get("deleted_at"):
        raise HTTPException(status_code=400, detail="Move the order to Trash first, then permanently delete it.")
    if _has_retained_financial_record(doc):
        raise HTTPException(status_code=403,
            detail="This order has a verified payment or refund record and must be retained for tax/accounting compliance. It can stay in Trash but cannot be permanently deleted.")
    # Record a durable audit snapshot BEFORE removing the order document.
    await _audit_deletion(order_number, "permanent_delete", admin, extra={
        "customer_name": (doc.get("customer") or {}).get("name"),
        "total": doc.get("total"), "payment_status": doc.get("payment_status"),
        "order_status": doc.get("order_status"), "created_at": doc.get("created_at")})
    await db.orders.delete_one({"order_number": order_number})
    return {"ok": True, "status": "permanently_deleted"}


@api.get("/admin/deletion-audit")
async def admin_deletion_audit(admin: dict = Depends(get_current_admin)):
    docs = await db.deletion_audit.find().sort("at", -1).to_list(2000)
    for d in docs:
        d.pop("_id", None)
    return docs


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
