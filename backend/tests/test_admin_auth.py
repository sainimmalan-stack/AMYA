"""Secure admin bootstrap + credential-change — backend regression tests.

These are SAFE to run against the preview environment (an admin already exists):
they never create a new admin, never change the existing admin's credentials,
and only exercise guard/negative paths plus setup-status + login.
"""
import os
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "amulya@amayafoods.in"
ADMIN_PASSWORD = "AmyaFounder@2026"


def _token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["token"]


def test_login_works():
    assert _token()


def test_setup_status_reports_no_setup_needed_when_admin_exists():
    r = requests.get(f"{API}/auth/setup-status")
    assert r.status_code == 200
    assert r.json()["needs_setup"] is False


def test_setup_blocked_once_admin_exists():
    r = requests.post(f"{API}/auth/setup",
                      json={"name": "X", "email": "x@example.com", "password": "abcd1234"})
    assert r.status_code == 403


def test_change_credentials_requires_auth():
    r = requests.post(f"{API}/auth/change-credentials",
                      json={"current_password": "x", "new_password": "abcd1234"})
    assert r.status_code == 401


def test_change_credentials_wrong_current_password_rejected():
    h = {"Authorization": f"Bearer {_token()}", "Content-Type": "application/json"}
    r = requests.post(f"{API}/auth/change-credentials", headers=h,
                      json={"current_password": "WRONG-PASSWORD", "new_password": "abcd1234"})
    assert r.status_code == 401


def test_change_credentials_weak_password_rejected():
    h = {"Authorization": f"Bearer {_token()}", "Content-Type": "application/json"}
    r = requests.post(f"{API}/auth/change-credentials", headers=h,
                      json={"current_password": ADMIN_PASSWORD, "new_password": "short"})
    assert r.status_code == 400


def test_change_credentials_no_fields_rejected():
    h = {"Authorization": f"Bearer {_token()}", "Content-Type": "application/json"}
    r = requests.post(f"{API}/auth/change-credentials", headers=h,
                      json={"current_password": ADMIN_PASSWORD})
    assert r.status_code == 400
