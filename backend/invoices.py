"""AMYA order-confirmation PDF invoice generation (ReportLab).

Deterministic: the same order record always renders the same PDF, so invoices can
be regenerated on demand instead of being stored on (ephemeral) disk.
"""
import io
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, HRFlowable,
)

# AMYA brand palette
TERRACOTTA = colors.HexColor("#B5643C")
TERRACOTTA_DEEP = colors.HexColor("#8F4A2A")
INK = colors.HexColor("#3B2A20")
INK_SOFT = colors.HexColor("#6B5647")
IVORY = colors.HexColor("#FBF3E9")
IVORY_WARM = colors.HexColor("#F6E8D8")
LINE = colors.HexColor("#E3D3C0")

LOGO_PATH = "/app/frontend/public/brand/amya-logo-terracotta.png"

SERIF = "Times-Roman"
SERIF_BOLD = "Times-Bold"
SANS = "Helvetica"
SANS_BOLD = "Helvetica-Bold"


def _inr(v):
    if v is None:
        return "To be confirmed"
    return f"Rs. {float(v):,.2f}"


def _p(text, font=SANS, size=9, color=INK, leading=None, align=0):
    style = ParagraphStyle("p", fontName=font, fontSize=size, textColor=color,
                           leading=leading or size * 1.35, alignment=align)
    return Paragraph(text if text not in (None, "") else "&mdash;", style)


def build_invoice_pdf(order: dict, cfg: dict) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4,
                            leftMargin=16 * mm, rightMargin=16 * mm,
                            topMargin=14 * mm, bottomMargin=14 * mm,
                            title=f"AMYA Order {order.get('order_number','')}")
    page_w = A4[0] - 32 * mm
    el = []

    legal_name = cfg.get("legal_name") or "AMYA Artisanal Foods"
    address = cfg.get("business_address") or ""
    fssai = cfg.get("fssai_number") or ""
    support_email = cfg.get("support_email") or ""
    support_phone = cfg.get("support_phone") or ""
    website = cfg.get("website") or "amyafoods.in"

    # ---- Header: logo + document title ----
    header_left = []
    if os.path.exists(LOGO_PATH):
        try:
            img = Image(LOGO_PATH)
            ratio = img.imageWidth / float(img.imageHeight)
            img.drawHeight = 14 * mm
            img.drawWidth = 14 * mm * ratio
            img.hAlign = "LEFT"
            header_left.append(img)
        except Exception:
            header_left.append(_p("AMYA", SERIF_BOLD, 22, TERRACOTTA))
    else:
        header_left.append(_p("AMYA", SERIF_BOLD, 22, TERRACOTTA))

    header_right = [
        _p("ORDER CONFIRMATION", SANS_BOLD, 12, TERRACOTTA_DEEP, align=2),
        _p("Order confirmation &mdash; not a tax invoice", SANS, 7.5, INK_SOFT, align=2),
    ]
    head = Table([[header_left, header_right]], colWidths=[page_w * 0.5, page_w * 0.5])
    head.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    el += [head, Spacer(1, 6)]

    # business identity line
    biz_bits = [f"<b>{legal_name}</b>"]
    if address:
        biz_bits.append(address.replace("\n", ", "))
    contact_bits = []
    if fssai:
        contact_bits.append(f"FSSAI: {fssai}")
    if support_phone:
        contact_bits.append(f"Phone: {support_phone}")
    if support_email:
        contact_bits.append(f"Email: {support_email}")
    contact_bits.append(f"Web: {website}")
    el += [_p(" &nbsp;|&nbsp; ".join(biz_bits), SANS, 8.5, INK),
           _p(" &nbsp;|&nbsp; ".join(contact_bits), SANS, 8, INK_SOFT),
           Spacer(1, 4),
           HRFlowable(width="100%", thickness=1, color=TERRACOTTA, spaceBefore=2, spaceAfter=8)]

    # ---- Meta + Bill-to (two columns) ----
    pay_method = {"cod": "Cash on Delivery"}.get(order.get("payment_method"), order.get("payment_method", "")).upper()
    pay_status = (order.get("payment_status") or "").replace("_", " ").upper()
    meta = [
        _p("ORDER DETAILS", SANS_BOLD, 8.5, TERRACOTTA_DEEP),
        _p(f"Order No: <b>{order.get('order_number','')}</b>", SANS, 9),
        _p(f"Invoice No: {order.get('invoice_number','')}", SANS, 9),
        _p(f"Date: {order.get('invoice_date','')}", SANS, 9),
        _p(f"Payment: {pay_method} &middot; {pay_status}", SANS, 9),
    ]
    cust = order.get("customer", {})
    addr = (cust.get("address") or "").replace("\n", "<br/>")
    billto = [
        _p("BILL TO / DELIVER TO", SANS_BOLD, 8.5, TERRACOTTA_DEEP),
        _p(f"<b>{cust.get('name','')}</b>", SANS, 9),
        _p(f"Mobile: {cust.get('mobile','')}", SANS, 9),
    ]
    if cust.get("email"):
        billto.append(_p(f"Email: {cust.get('email')}", SANS, 9))
    if addr:
        billto.append(_p(addr, SANS, 9))
    mt = Table([[meta, billto]], colWidths=[page_w * 0.5, page_w * 0.5])
    mt.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"),
                            ("LEFTPADDING", (1, 0), (1, 0), 10)]))
    el += [mt, Spacer(1, 10)]

    # ---- Items table ----
    rows = [[_p("#", SANS_BOLD, 8.5, IVORY, align=1),
             _p("ITEM", SANS_BOLD, 8.5, IVORY),
             _p("QTY", SANS_BOLD, 8.5, IVORY, align=1),
             _p("UNIT PRICE", SANS_BOLD, 8.5, IVORY, align=2),
             _p("LINE TOTAL", SANS_BOLD, 8.5, IVORY, align=2)]]
    for i, it in enumerate(order.get("items", []), 1):
        name = it.get("name", "")
        if it.get("pack_label"):
            name += f"<br/><font size=7.5 color='#6B5647'>Pack size: {it['pack_label']}</font>"
        rows.append([
            _p(str(i), SANS, 9, INK, align=1),
            _p(name, SANS, 9, INK),
            _p(str(it.get("qty", 1)), SANS, 9, INK, align=1),
            _p(_inr(it.get("unit_price")), SANS, 9, INK, align=2),
            _p(_inr(it.get("line_total")), SANS, 9, INK, align=2),
        ])
    tbl = Table(rows, colWidths=[page_w * 0.07, page_w * 0.52, page_w * 0.1, page_w * 0.15, page_w * 0.16])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), TERRACOTTA),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("LINEBELOW", (0, 1), (-1, -1), 0.5, LINE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [IVORY, IVORY_WARM]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    el += [tbl, Spacer(1, 8)]

    # ---- Totals ----
    tot_rows = [["Subtotal", _inr(order.get("subtotal"))]]
    if order.get("discount"):
        tot_rows.append(["Discount", f"- {_inr(order.get('discount'))}"])
    dc = order.get("delivery_charge")
    tot_rows.append(["Delivery", _inr(dc) if dc else (cfg.get("delivery_note") and "To be confirmed" or "Rs. 0.00")])
    if cfg.get("gst_enabled") and order.get("gst_amount") is not None:
        tot_rows.append([f"GST ({cfg.get('gst_rate', 0)}%)", _inr(order.get("gst_amount"))])
    tot_rows.append(["TOTAL PAYABLE", _inr(order.get("total"))])

    trows = []
    for i, (label, val) in enumerate(tot_rows):
        last = i == len(tot_rows) - 1
        trows.append([
            _p(label, SANS_BOLD if last else SANS, 10 if last else 9,
               IVORY if last else INK_SOFT, align=2),
            _p(val, SANS_BOLD if last else SANS, 10 if last else 9,
               IVORY if last else INK, align=2),
        ])
    tt = Table(trows, colWidths=[page_w * 0.24, page_w * 0.24])
    style = [("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
             ("RIGHTPADDING", (0, 0), (-1, -1), 7),
             ("BACKGROUND", (0, len(tot_rows) - 1), (-1, len(tot_rows) - 1), TERRACOTTA)]
    tt.setStyle(TableStyle(style))
    wrap = Table([[ "", tt]], colWidths=[page_w * 0.52, page_w * 0.48])
    wrap.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    el += [wrap, Spacer(1, 10)]

    # ---- Notes + thank you ----
    note = cfg.get("delivery_note") or ""
    if note:
        el.append(_p(note, SANS, 8, INK_SOFT))
    el.append(_p("This document confirms your order. It is an order confirmation and not a tax invoice.", SANS, 8, INK_SOFT))
    el.append(Spacer(1, 10))
    el.append(HRFlowable(width="100%", thickness=0.75, color=LINE, spaceAfter=8))
    el.append(_p("Thank you for choosing AMYA.", SERIF_BOLD, 13, TERRACOTTA_DEEP))
    el.append(_p("Every batch is prepared with patience, care and a genuine love for good food. "
                 "We will confirm availability, delivery and the final payable amount with you shortly.", SANS, 8.5, INK_SOFT))
    foot = []
    if support_phone:
        foot.append(f"Phone: {support_phone}")
    if support_email:
        foot.append(f"Email: {support_email}")
    foot.append(website)
    el.append(Spacer(1, 6))
    el.append(_p(" &nbsp;|&nbsp; ".join(foot), SANS, 8, INK_SOFT, align=1))

    doc.build(el)
    return buf.getvalue()
