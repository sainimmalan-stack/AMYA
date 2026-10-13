"""Order deletion (soft delete / trash / restore / permanent) — security regression.

NON-DESTRUCTIVE: verifies that every deletion-related endpoint rejects
unauthenticated requests. Deletion must never be possible without admin auth.
Functional happy-paths are exercised separately with a temporary admin.
"""
import os
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
API = f"{BASE_URL}/api"


def test_soft_delete_requires_auth():
    assert requests.delete(f"{API}/admin/orders/AMYA-TEST-0001").status_code == 401


def test_bulk_delete_requires_auth():
    assert requests.post(f"{API}/admin/orders/bulk-delete", json={"order_numbers": ["X"]}).status_code == 401


def test_restore_requires_auth():
    assert requests.post(f"{API}/admin/orders/AMYA-TEST-0001/restore").status_code == 401


def test_permanent_delete_requires_auth():
    assert requests.delete(f"{API}/admin/orders/AMYA-TEST-0001/permanent").status_code == 401


def test_deleted_list_requires_auth():
    assert requests.get(f"{API}/admin/orders/deleted").status_code == 401


def test_deletion_audit_requires_auth():
    assert requests.get(f"{API}/admin/deletion-audit").status_code == 401
