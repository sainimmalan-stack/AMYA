"""Secure admin bootstrap + credential-change — backend regression tests.

STATE-AWARE and NON-DESTRUCTIVE: these tests never create or delete admins and
never change an existing admin's credentials. They adapt to whichever state the
environment is in (fresh = needs setup, or an admin already exists).

To exercise the authenticated guard paths, set TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD
in the environment for a known admin account; otherwise those tests skip.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
API = f"{BASE_URL}/api"


def _needs_setup():
    r = requests.get(f"{API}/auth/setup-status")
    assert r.status_code == 200
    return r.json()["needs_setup"]


def _login_token():
    email = os.environ.get("TEST_ADMIN_EMAIL")
    pw = os.environ.get("TEST_ADMIN_PASSWORD")
    if not (email and pw):
        return None
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": pw})
    return r.json().get("token") if r.status_code == 200 else None


def test_setup_status_returns_boolean():
    assert isinstance(_needs_setup(), bool)


def test_setup_blocked_when_admin_exists():
    if _needs_setup():
        pytest.skip("Fresh environment (no admin yet) — setup is intentionally open.")
    r = requests.post(f"{API}/auth/setup",
                      json={"name": "X", "email": "blocked@qa-amya.com", "password": "abcd1234"})
    assert r.status_code == 403


def test_setup_rejects_weak_password_when_open():
    if not _needs_setup():
        pytest.skip("An admin already exists — cannot safely test the open setup path.")
    # Weak password must be rejected (400) WITHOUT creating an admin.
    r = requests.post(f"{API}/auth/setup",
                      json={"name": "X", "email": "weak@qa-amya.com", "password": "short"})
    assert r.status_code == 400
    assert _needs_setup() is True  # still no admin created


def test_admin_orders_requires_auth():
    assert requests.get(f"{API}/admin/orders").status_code == 401


def test_change_credentials_requires_auth():
    r = requests.post(f"{API}/auth/change-credentials",
                      json={"current_password": "x", "new_password": "abcd1234"})
    assert r.status_code == 401


def test_reset_password_rejects_bad_token():
    r = requests.post(f"{API}/auth/reset-password",
                      json={"token": "definitely-not-a-real-token", "new_password": "abcd1234"})
    assert r.status_code == 400


def test_forgot_password_is_generic_for_unknown_email():
    r = requests.post(f"{API}/auth/forgot-password", json={"email": "nobody@qa-amya.com"})
    assert r.status_code == 200
    assert r.json().get("ok") is True


def test_change_credentials_wrong_current_password_rejected():
    token = _login_token()
    if not token:
        pytest.skip("No TEST_ADMIN_EMAIL/PASSWORD provided for authenticated test.")
    h = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    r = requests.post(f"{API}/auth/change-credentials", headers=h,
                      json={"current_password": "WRONG-PASSWORD", "new_password": "abcd1234"})
    assert r.status_code == 401
