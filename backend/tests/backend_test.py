"""AMYA Artisanal Foods — backend API regression tests."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://amya-artisanal.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "amulya@amayafoods.in"
ADMIN_PASSWORD = "AmyaFounder@2026"


# -------------------------- Fixtures --------------------------
@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(session):
    r = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text}")
    return r.json()["token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# -------------------------- Public config --------------------------
class TestPublicConfig:
    def test_config(self, session):
        r = session.get(f"{API}/config")
        assert r.status_code == 200
        data = r.json()
        assert "settings" in data and "business" in data
        assert data["settings"]["prelaunch_mode"] is True
        assert data["settings"]["checkout_enabled"] is False
        assert data["business"]["whatsapp"] == "919675334567"
        assert data["business"]["phone"] == "9675334567"


# -------------------------- Products --------------------------
class TestProducts:
    def test_list_all(self, session):
        r = session.get(f"{API}/products")
        assert r.status_code == 200
        products = r.json()
        assert isinstance(products, list) and len(products) >= 5
        slugs = {p["slug"] for p in products}
        assert "groundnut-oil" in slugs

    def test_filter_oils(self, session):
        r = session.get(f"{API}/products", params={"category": "oils"})
        assert r.status_code == 200
        oils = r.json()
        assert all(p["category"] == "oils" for p in oils)
        assert len(oils) >= 3

    def test_get_by_slug(self, session):
        r = session.get(f"{API}/products/groundnut-oil")
        assert r.status_code == 200
        assert r.json()["slug"] == "groundnut-oil"

    def test_get_unknown_slug_404(self, session):
        r = session.get(f"{API}/products/does-not-exist-xyz")
        assert r.status_code == 404


# -------------------------- Bookings & Enquiries (public) --------------------------
class TestBookingsAndEnquiries:
    def test_create_booking(self, session):
        payload = {
            "name": "TEST_User",
            "mobile": "9999999999",
            "product_name": "Wood-Pressed Groundnut Oil",
            "product_slug": "groundnut-oil",
            "quantity": "1 L",
            "preferred_date": "2026-02-01",
            "preferred_time": "10:00",
        }
        r = session.post(f"{API}/bookings", json=payload)
        assert r.status_code == 200
        d = r.json()
        assert d["status"] == "pending" and "id" in d

    def test_create_enquiry(self, session):
        r = session.post(f"{API}/enquiries", json={"name": "TEST_User", "message": "hello", "email": "t@t.com"})
        assert r.status_code == 200
        assert "id" in r.json()

    def test_list_batches(self, session):
        r = session.get(f"{API}/batches")
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# -------------------------- Auth --------------------------
class TestAuth:
    def test_login_success(self, session):
        r = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        d = r.json()
        assert d["role"] == "admin" and d["token"] and d["email"] == ADMIN_EMAIL
        # cookies set
        assert "access_token" in r.cookies

    def test_login_wrong_password(self, session):
        r = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_me_with_bearer(self, admin_headers):
        r = requests.get(f"{API}/auth/me", headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL

    def test_me_without_auth_401(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_with_cookie(self):
        s = requests.Session()
        s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        r = s.get(f"{API}/auth/me")
        assert r.status_code == 200


# -------------------------- Admin endpoints --------------------------
class TestAdmin:
    def test_bookings_requires_auth(self):
        assert requests.get(f"{API}/admin/bookings").status_code == 401

    def test_enquiries_requires_auth(self):
        assert requests.get(f"{API}/admin/enquiries").status_code == 401

    def test_create_product_requires_auth(self):
        assert requests.post(f"{API}/admin/products", json={"name": "x", "category": "oils"}).status_code == 401

    def test_list_bookings(self, admin_headers):
        r = requests.get(f"{API}/admin/bookings", headers=admin_headers)
        assert r.status_code == 200 and isinstance(r.json(), list)

    def test_list_enquiries(self, admin_headers):
        r = requests.get(f"{API}/admin/enquiries", headers=admin_headers)
        assert r.status_code == 200 and isinstance(r.json(), list)

    def test_product_crud_and_availability(self, admin_headers):
        # CREATE
        payload = {"name": "TEST_Product", "category": "oils", "availability": "coming-soon"}
        r = requests.post(f"{API}/admin/products", json=payload, headers=admin_headers)
        assert r.status_code == 200
        p = r.json()
        pid = p["id"]
        assert p["name"] == "TEST_Product" and p["slug"].startswith("test-product")

        # UPDATE
        r = requests.put(f"{API}/admin/products/{pid}",
                         json={"name": "TEST_Product2", "category": "oils", "availability": "available"},
                         headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["name"] == "TEST_Product2"

        # Verify persistence via public GET by slug
        slug = r.json()["slug"]
        r2 = requests.get(f"{API}/products/{slug}")
        assert r2.status_code == 200 and r2.json()["name"] == "TEST_Product2"

        # PATCH availability
        r = requests.patch(f"{API}/admin/products/{pid}/availability",
                          json={"status": "unavailable"}, headers=admin_headers)
        assert r.status_code == 200
        r2 = requests.get(f"{API}/products/{slug}")
        assert r2.json()["availability"] == "unavailable"

        # DELETE
        r = requests.delete(f"{API}/admin/products/{pid}", headers=admin_headers)
        assert r.status_code == 200
        r2 = requests.get(f"{API}/products/{slug}")
        assert r2.status_code == 404

    def test_booking_status_update(self, admin_headers, session):
        # Create a booking first
        bk = session.post(f"{API}/bookings", json={
            "name": "TEST_StatBook", "mobile": "9999999999",
            "product_name": "Oil", "quantity": "1 L",
            "preferred_date": "2026-02-10", "preferred_time": "11:00"
        }).json()
        bid = bk["id"]
        r = requests.patch(f"{API}/admin/bookings/{bid}",
                          json={"status": "confirmed"}, headers=admin_headers)
        assert r.status_code == 200
        # verify through list
        bookings = requests.get(f"{API}/admin/bookings", headers=admin_headers).json()
        found = next((b for b in bookings if b["id"] == bid), None)
        assert found and found["status"] == "confirmed"

    def test_enquiry_status_update(self, admin_headers, session):
        eq = session.post(f"{API}/enquiries", json={"name": "TEST_StatEnq", "message": "m"}).json()
        eid = eq["id"]
        r = requests.patch(f"{API}/admin/enquiries/{eid}",
                          json={"status": "closed"}, headers=admin_headers)
        assert r.status_code == 200

    def test_batch_create_and_delete(self, admin_headers):
        payload = {"batch_id": "TEST_B1", "product_name": "TEST", "production_date": "2026-01-01"}
        r = requests.post(f"{API}/admin/batches", json=payload, headers=admin_headers)
        assert r.status_code == 200
        bid = r.json()["id"]
        r2 = requests.delete(f"{API}/admin/batches/{bid}", headers=admin_headers)
        assert r2.status_code == 200

    def test_settings_update(self, admin_headers):
        payload = {
            "announcement_enabled": True,
            "announcement_text": "TEST announcement",
            "prelaunch_mode": True,
            "checkout_enabled": False,
            "bank_details": "",
            "upi_id": "",
            "policies": {}
        }
        r = requests.put(f"{API}/admin/settings", json=payload, headers=admin_headers)
        assert r.status_code == 200
        # verify
        cfg = requests.get(f"{API}/config").json()
        assert cfg["settings"]["announcement_text"] == "TEST announcement"
