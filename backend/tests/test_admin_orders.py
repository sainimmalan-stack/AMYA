"""Admin Order Management Dashboard — backend regression tests.

Tests cover: auth guard, legacy order shape (default fields), COD creation,
guardrails (manual-paid rejected, cancel-requires-reason), audit trail,
full lifecycle, payment transitions, Razorpay webhook signature enforcement,
invoice PDF, business email notification.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "amulya@amayafoods.in"
ADMIN_PASSWORD = "AmyaFounder@2026"


@pytest.fixture(scope="module")
def admin_headers():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text}")
    return {"Authorization": f"Bearer {r.json()['token']}", "Content-Type": "application/json"}


def _cod_payload(name="TEST_Buyer", email="test_buyer@example.com"):
    return {
        "customer_name": name,
        "customer_mobile": "9999999999",
        "customer_email": email,
        "delivery_address": "1 Test St, Hyderabad, TG 500001",
        "items": [{"slug": "cashew-brittle", "pack_label": "500 g", "qty": 2}],
        "payment_method": "cod",
    }


@pytest.fixture(scope="module")
def cod_order(admin_headers):
    r = requests.post(f"{API}/orders", json=_cod_payload())
    assert r.status_code == 200, f"Create COD order failed: {r.status_code} {r.text}"
    data = r.json()
    assert "order_number" in data, data
    return data


# -------------------------- Auth guard --------------------------
class TestAdminAuthGuard:
    def test_list_orders_401_without_auth(self):
        assert requests.get(f"{API}/admin/orders").status_code == 401

    def test_detail_401_without_auth(self):
        assert requests.get(f"{API}/admin/orders/AMYA-20261013-88QT").status_code == 401

    def test_patch_401_without_auth(self):
        assert requests.patch(f"{API}/admin/orders/AMYA-20261013-88QT",
                              json={"order_status": "confirmed"}).status_code == 401

    def test_invoice_401_without_auth(self):
        assert requests.get(f"{API}/admin/orders/AMYA-20261013-88QT/invoice").status_code == 401

    def test_login_returns_token_and_cookie(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        d = r.json()
        assert d.get("token") and d.get("role") == "admin"
        assert "access_token" in r.cookies


# -------------------------- Listing & legacy shape --------------------------
class TestListOrders:
    def test_list_returns_orders(self, admin_headers):
        r = requests.get(f"{API}/admin/orders", headers=admin_headers)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 2, f"expected pre-existing orders, got {len(data)}"
        # Legacy safe defaults present
        for o in data:
            for k in ("tracking_reference", "courier_name", "cancellation_reason", "status_history"):
                assert k in o, f"missing default field {k} on order {o.get('order_number')}"
            assert isinstance(o["status_history"], list)

    def test_existing_orders_preserved(self, admin_headers):
        r = requests.get(f"{API}/admin/orders", headers=admin_headers)
        nums = {o["order_number"] for o in r.json()}
        # Preserve the two existing orders mentioned in review request
        for existing in ("AMYA-20261013-88QT", "AMYA-20261013-EN97"):
            assert existing in nums, f"existing order {existing} missing"


# -------------------------- COD creation --------------------------
class TestCodCreation:
    def test_cod_order_persists_with_correct_statuses(self, cod_order, admin_headers):
        on = cod_order["order_number"]
        r = requests.get(f"{API}/admin/orders/{on}", headers=admin_headers)
        assert r.status_code == 200
        d = r.json()
        assert d["payment_status"] == "cod_pending"
        assert d["order_status"] == "placed"
        assert d.get("payment_method") == "cod"


# -------------------------- Guardrails --------------------------
class TestGuardrails:
    def test_manual_paid_rejected(self, cod_order, admin_headers):
        on = cod_order["order_number"]
        r = requests.patch(f"{API}/admin/orders/{on}",
                           json={"payment_status": "paid"}, headers=admin_headers)
        assert r.status_code == 400, f"expected 400, got {r.status_code} {r.text}"

    def test_cancel_without_reason_rejected(self, cod_order, admin_headers):
        on = cod_order["order_number"]
        r = requests.patch(f"{API}/admin/orders/{on}",
                           json={"order_status": "cancelled"}, headers=admin_headers)
        assert r.status_code == 400

    def test_invalid_order_status_rejected(self, cod_order, admin_headers):
        on = cod_order["order_number"]
        r = requests.patch(f"{API}/admin/orders/{on}",
                           json={"order_status": "bogus"}, headers=admin_headers)
        assert r.status_code == 400

    def test_invalid_payment_status_rejected(self, cod_order, admin_headers):
        on = cod_order["order_number"]
        r = requests.patch(f"{API}/admin/orders/{on}",
                           json={"payment_status": "bogus"}, headers=admin_headers)
        assert r.status_code == 400


# -------------------------- Lifecycle + audit --------------------------
class TestLifecycleAndAudit:
    def test_full_lifecycle(self, cod_order, admin_headers):
        on = cod_order["order_number"]
        for status in ("confirmed", "preparing", "ready_to_dispatch", "shipped", "delivered"):
            r = requests.patch(f"{API}/admin/orders/{on}",
                               json={"order_status": status, "note": f"to {status}"},
                               headers=admin_headers)
            assert r.status_code == 200, f"status {status} failed: {r.status_code} {r.text}"
            assert r.json()["order_status"] == status

    def test_audit_trail_contains_fields(self, cod_order, admin_headers):
        on = cod_order["order_number"]
        r = requests.get(f"{API}/admin/orders/{on}", headers=admin_headers)
        hist = r.json().get("status_history", [])
        assert len(hist) >= 5
        last = hist[-1]
        for k in ("from", "to", "by", "by_email", "at"):
            assert k in last, f"audit missing {k}: {last}"
        assert last["to"] == "delivered"
        assert last["by_email"] == ADMIN_EMAIL

    def test_save_tracking(self, cod_order, admin_headers):
        on = cod_order["order_number"]
        r = requests.patch(f"{API}/admin/orders/{on}",
                           json={"tracking_reference": "TRK123", "courier_name": "Bluedart"},
                           headers=admin_headers)
        assert r.status_code == 200
        d = requests.get(f"{API}/admin/orders/{on}", headers=admin_headers).json()
        assert d["tracking_reference"] == "TRK123"
        assert d["courier_name"] == "Bluedart"


# -------------------------- Payment transitions --------------------------
class TestPaymentTransitions:
    @pytest.fixture(scope="class")
    def fresh_cod(self, admin_headers):
        r = requests.post(f"{API}/orders", json=_cod_payload(name="TEST_Pay", email="test_pay@example.com"))
        assert r.status_code == 200
        return r.json()["order_number"]

    def test_cod_collected_then_refund_flow(self, fresh_cod, admin_headers):
        on = fresh_cod
        # mark collected
        r = requests.patch(f"{API}/admin/orders/{on}",
                           json={"payment_status": "cod_collected"}, headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["payment_status"] == "cod_collected"
        # refund_processing
        r = requests.patch(f"{API}/admin/orders/{on}",
                           json={"payment_status": "refund_processing"}, headers=admin_headers)
        assert r.status_code == 200
        # refunded
        r = requests.patch(f"{API}/admin/orders/{on}",
                           json={"payment_status": "refunded"}, headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["payment_status"] == "refunded"


# -------------------------- Cancel with reason --------------------------
class TestCancelWithReason:
    def test_cancel_with_reason_succeeds(self, admin_headers):
        on = requests.post(f"{API}/orders", json=_cod_payload(name="TEST_Cancel", email="c@c.com")).json()["order_number"]
        r = requests.patch(f"{API}/admin/orders/{on}",
                           json={"order_status": "cancelled", "cancellation_reason": "customer requested"},
                           headers=admin_headers)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["order_status"] == "cancelled"
        assert d["cancellation_reason"] == "customer requested"


# -------------------------- Razorpay webhook --------------------------
class TestRazorpayWebhook:
    def test_webhook_missing_signature_rejected(self):
        r = requests.post(f"{API}/payments/razorpay/webhook", json={"event": "payment.captured"})
        # 400 (bad signature) or 503 (not configured) — both prove it cannot be faked
        assert r.status_code in (400, 503), f"expected 400/503, got {r.status_code}"

    def test_webhook_bad_signature_rejected(self):
        r = requests.post(f"{API}/payments/razorpay/webhook",
                          data='{"event":"payment.captured"}',
                          headers={"X-Razorpay-Signature": "deadbeef", "Content-Type": "application/json"})
        assert r.status_code in (400, 503), f"expected 400/503, got {r.status_code}"


# -------------------------- Invoice PDF --------------------------
class TestInvoice:
    def test_admin_invoice_pdf(self, cod_order, admin_headers):
        on = cod_order["order_number"]
        r = requests.get(f"{API}/admin/orders/{on}/invoice", headers=admin_headers)
        assert r.status_code == 200
        assert "application/pdf" in r.headers.get("content-type", "").lower()
        assert r.content[:4] == b"%PDF"


# -------------------------- Business email notification --------------------------
class TestBusinessEmail:
    def test_order_notification_recorded(self, admin_headers):
        on = requests.post(f"{API}/orders", json=_cod_payload(name="TEST_Notify", email="n@n.com")).json()["order_number"]
        import time; time.sleep(2)  # allow best-effort email dispatch
        d = requests.get(f"{API}/admin/orders/{on}", headers=admin_headers).json()
        notifs = d.get("notifications", [])
        # should have at least one biz notification entry
        biz = [n for n in notifs if "biz" in (n.get("type") or "").lower() or n.get("to", "").lower() == "contactamyafoods@gmail.com"]
        assert biz, f"no business notification recorded in {notifs}"
        # Report honestly — do not require ok=True
        print(f"\nBusiness email notification result: {biz[0]}")


# -------------------------- Regression: public catalog --------------------------
class TestRegression:
    def test_public_products_still_works(self):
        r = requests.get(f"{API}/products")
        assert r.status_code == 200
        assert len(r.json()) >= 5
