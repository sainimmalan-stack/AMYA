"""Razorpay Payment Links (post-WhatsApp quote) — security regression.

NON-DESTRUCTIVE: verifies every admin payment-link endpoint rejects
unauthenticated requests. Creating/cancelling links must require admin auth.
"""
import os
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
API = f"{BASE_URL}/api"


def test_create_link_requires_auth():
    r = requests.post(f"{API}/admin/payment-links", json={
        "customer_name": "X", "customer_mobile": "9000090000", "subtotal": 500, "shipping": 100})
    assert r.status_code == 401


def test_list_links_requires_auth():
    assert requests.get(f"{API}/admin/payment-links").status_code == 401


def test_refresh_link_requires_auth():
    assert requests.post(f"{API}/admin/payment-links/AMYAPL-TEST/refresh").status_code == 401


def test_cancel_link_requires_auth():
    assert requests.post(f"{API}/admin/payment-links/AMYAPL-TEST/cancel").status_code == 401


def test_callback_route_exists_and_redirects():
    # Invalid/missing signature must not error out — it redirects to the done page.
    r = requests.get(f"{API}/payments/payment-link/callback", allow_redirects=False)
    assert r.status_code in (302, 303)
