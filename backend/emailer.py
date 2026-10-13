"""Emergent-managed Resend email — order confirmation + business notification.

Templates are server-side only; callers pass IDs/records, never HTML (G4).
"""
import os
import re
import ipaddress
import logging
import httpx
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse

logger = logging.getLogger("amya.email")

EMAIL_BASE_URL = "https://integrations.emergentagent.com"  # constant (survives deploy)
EMAIL_KEY = os.environ.get("EMERGENT_EMAIL_KEY")
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME", "AMYA Artisanal Foods")
EMAIL_REPLY_TO = os.environ.get("EMAIL_REPLY_TO")

_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "send us your password", "enter your password below", "confirm your card number",
             "your full card number", "seed phrase", "recovery phrase", "verify your card",
             "social security number", "confirm your bank details")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)


def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)


def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)


class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []

    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []


def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan(); scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks the recipient for credentials: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links/assets must be absolute https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Shortened, numeric-host or credential-bearing URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text {m.group(1)!r} != real link host {real!r} (G3)")


async def send_email(*, to: str, subject: str, html: str) -> dict:
    """Best-effort send. Returns {ok, id|error}. Never raises to the caller."""
    if not EMAIL_KEY:
        return {"ok": False, "error": "email_not_configured"}
    try:
        _assert_safe_email(subject, html)
    except ValueError as e:
        logger.error(f"Email blocked by guardrail: {e}")
        return {"ok": False, "error": f"guardrail:{e}"}
    payload = {"to": [to], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
    if EMAIL_REPLY_TO:
        payload["contact_email"] = EMAIL_REPLY_TO
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(f"{EMAIL_BASE_URL}/api/v1/email/send",
                                     headers={"X-Email-Key": EMAIL_KEY}, json=payload)
        resp.raise_for_status()
        return {"ok": True, "id": resp.json().get("id")}
    except httpx.HTTPStatusError as e:
        try:
            code = e.response.json().get("code", "")
        except ValueError:
            code = ""
        logger.warning(f"Email send failed {e.response.status_code} code={code}: {e.response.text[:200]}")
        return {"ok": False, "error": code or f"http_{e.response.status_code}"}
    except Exception as e:
        logger.error(f"Email send error: {e}")
        return {"ok": False, "error": "send_error"}


def _inr(v):
    return "To be confirmed" if v is None else f"Rs. {float(v):,.2f}"


def _items_rows(order):
    out = []
    for it in order.get("items", []):
        nm = escape(it.get("name", ""))
        if it.get("pack_label"):
            nm += f" &middot; {escape(it['pack_label'])}"
        out.append(
            f'<tr><td style="padding:6px 0;border-bottom:1px solid #E3D3C0;font-size:14px;color:#3B2A20">'
            f'{nm} &times; {it.get("qty",1)}</td>'
            f'<td style="padding:6px 0;border-bottom:1px solid #E3D3C0;font-size:14px;color:#3B2A20;text-align:right">'
            f'{_inr(it.get("line_total"))}</td></tr>')
    return "".join(out)


def _wrap(inner):
    return (f'<table role="presentation" width="100%" style="background:#FBF3E9;padding:0;margin:0">'
            f'<tr><td align="center" style="padding:24px 12px">'
            f'<table role="presentation" width="100%" style="max-width:560px;background:#ffffff;'
            f'border:1px solid #E3D3C0;border-radius:12px;overflow:hidden">'
            f'<tr><td style="background:#B5643C;padding:18px 24px">'
            f'<span style="font-family:Georgia,serif;font-size:22px;color:#FBF3E9;letter-spacing:2px">AMYA</span>'
            f'<span style="font-family:Arial,sans-serif;font-size:10px;color:#FBF3E9;letter-spacing:3px;display:block">ARTISANAL FOODS</span>'
            f'</td></tr>'
            f'<tr><td style="padding:24px;font-family:Arial,sans-serif">{inner}</td></tr>'
            f'<tr><td style="padding:16px 24px;background:#F6E8D8;font-family:Arial,sans-serif;font-size:11px;color:#6B5647">'
            f'Sent by {escape(EMAIL_FROM_NAME)}. This is an order confirmation, not a tax invoice. '
            f'We never ask for your password or card details by email.'
            f'</td></tr></table></td></tr></table>')


def customer_email_html(order, invoice_url):
    cust = order.get("customer", {})
    pay = (order.get("payment_status") or "").replace("_", " ").title()
    inner = (
        f'<p style="font-size:15px;color:#3B2A20;margin:0 0 12px">Hi {escape(cust.get("name",""))}, thank you for your order!</p>'
        f'<p style="font-size:14px;color:#6B5647;margin:0 0 16px">Your order <b>{escape(order.get("order_number",""))}</b> has been received. '
        f'Payment status: <b>{escape(pay)}</b>. We will confirm availability, delivery and the final payable amount shortly.</p>'
        f'<table role="presentation" width="100%" style="margin:0 0 16px">{_items_rows(order)}'
        f'<tr><td style="padding:10px 0 0;font-size:15px;color:#3B2A20"><b>Total</b></td>'
        f'<td style="padding:10px 0 0;font-size:15px;color:#B5643C;text-align:right"><b>{_inr(order.get("total"))}</b></td></tr></table>'
        f'<p style="margin:0 0 20px"><a href="{invoice_url}" '
        f'style="background:#B5643C;color:#FBF3E9;text-decoration:none;font-size:13px;letter-spacing:1px;'
        f'padding:12px 22px;border-radius:999px;display:inline-block">DOWNLOAD YOUR INVOICE</a></p>'
        f'<p style="font-size:12px;color:#6B5647;margin:0">If the button does not work, open this link:<br/>'
        f'<a href="{invoice_url}" style="color:#B5643C">{invoice_url}</a></p>')
    return _wrap(inner)


def business_email_html(order, admin_url):
    cust = order.get("customer", {})
    pay = (order.get("payment_status") or "").replace("_", " ").title()
    inner = (
        f'<p style="font-size:15px;color:#3B2A20;margin:0 0 12px"><b>New order received</b> &mdash; {escape(order.get("order_number",""))}</p>'
        f'<p style="font-size:14px;color:#6B5647;margin:0 0 6px">Customer: <b>{escape(cust.get("name",""))}</b> &middot; {escape(cust.get("mobile",""))}'
        f'{" &middot; " + escape(cust.get("email","")) if cust.get("email") else ""}</p>'
        f'<p style="font-size:14px;color:#6B5647;margin:0 0 14px">Deliver to: {escape((cust.get("address") or "").replace(chr(10), ", "))}</p>'
        f'<table role="presentation" width="100%" style="margin:0 0 14px">{_items_rows(order)}'
        f'<tr><td style="padding:10px 0 0;font-size:15px;color:#3B2A20"><b>Total</b></td>'
        f'<td style="padding:10px 0 0;font-size:15px;color:#B5643C;text-align:right"><b>{_inr(order.get("total"))}</b></td></tr></table>'
        f'<p style="font-size:14px;color:#6B5647;margin:0 0 18px">Payment: {escape(order.get("payment_method","").upper())} &middot; {escape(pay)}</p>'
        f'<p style="margin:0"><a href="{admin_url}" style="background:#B5643C;color:#FBF3E9;text-decoration:none;'
        f'font-size:13px;letter-spacing:1px;padding:12px 22px;border-radius:999px;display:inline-block">VIEW IN ADMIN</a></p>')
    return _wrap(inner)
