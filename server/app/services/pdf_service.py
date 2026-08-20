"""
PDF Generation Service — NusantaraExport.AI
All 9 export document types generated via ReportLab.
Layout modeled after templates in /templates/ folder.
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer,
    HRFlowable, KeepTogether
)
from reportlab.platypus.flowables import Image as RLImage
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from datetime import datetime
import os, uuid, requests, tempfile

EXPORT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "exports"
)
os.makedirs(EXPORT_DIR, exist_ok=True)

# ─────────────────────────────────────────────────────────────────
# Shared helpers
# ─────────────────────────────────────────────────────────────────
ACCENT = colors.HexColor("#1A3C5E")       # dark navy
ACCENT_LIGHT = colors.HexColor("#EBF1F8")
GOLD = colors.HexColor("#C9A84C")
WHITE = colors.white
GREY = colors.HexColor("#6B7280")
LIGHT_GREY = colors.HexColor("#F3F4F6")

def _styles():
    s = getSampleStyleSheet()
    s.add(ParagraphStyle("DocTitle", fontSize=18, leading=22,
                          textColor=WHITE, fontName="Helvetica-Bold",
                          alignment=TA_LEFT))
    s.add(ParagraphStyle("DocSubtitle", fontSize=8, leading=10,
                          textColor=WHITE, fontName="Helvetica",
                          alignment=TA_LEFT))
    s.add(ParagraphStyle("FieldLabel", fontSize=7.5, leading=9,
                          textColor=GREY, fontName="Helvetica"))
    s.add(ParagraphStyle("FieldValue", fontSize=8.5, leading=11,
                          textColor=colors.black, fontName="Helvetica-Bold"))
    s.add(ParagraphStyle("SectionHead", fontSize=8, leading=10,
                          textColor=WHITE, fontName="Helvetica-Bold",
                          alignment=TA_LEFT))
    s.add(ParagraphStyle("TableHeader", fontSize=7.5, leading=9,
                          textColor=WHITE, fontName="Helvetica-Bold",
                          alignment=TA_CENTER))
    s.add(ParagraphStyle("TableCell", fontSize=7.5, leading=9,
                          textColor=colors.black, fontName="Helvetica"))
    s.add(ParagraphStyle("TableCellC", fontSize=7.5, leading=9,
                          textColor=colors.black, fontName="Helvetica",
                          alignment=TA_CENTER))
    s.add(ParagraphStyle("TableCellR", fontSize=7.5, leading=9,
                          textColor=colors.black, fontName="Helvetica",
                          alignment=TA_RIGHT))
    s.add(ParagraphStyle("SmallNote", fontSize=7, leading=8.5,
                          textColor=GREY, fontName="Helvetica"))
    s.add(ParagraphStyle("BodyText2", fontSize=8, leading=10,
                          textColor=colors.black, fontName="Helvetica"))
    s.add(ParagraphStyle("TotalLabel", fontSize=9, leading=11,
                          textColor=ACCENT, fontName="Helvetica-Bold",
                          alignment=TA_RIGHT))
    s.add(ParagraphStyle("TotalValue", fontSize=10, leading=12,
                          textColor=ACCENT, fontName="Helvetica-Bold",
                          alignment=TA_RIGHT))
    return s


def _header_table(data: dict, doc_title: str, doc_subtitle: str, s):
    """Render dark-navy header with company info + document title."""
    co = data.get("company_name", "")
    addr = (data.get("company_address") or "").replace("\n", "<br/>")
    phone = data.get("company_phone", "")
    email = data.get("company_email", "")
    web = data.get("company_website", "")

    contact_parts = [x for x in [phone, email, web] if x]
    contact_str = "  |  ".join(contact_parts)

    left = [
        Paragraph(f"<b>{co}</b>", ParagraphStyle("", fontSize=10, textColor=WHITE,
                                                    fontName="Helvetica-Bold")),
        Paragraph(addr, ParagraphStyle("", fontSize=7.5, textColor=colors.HexColor("#CBD5E1"),
                                        fontName="Helvetica", leading=10)),
        Spacer(1, 2),
        Paragraph(contact_str, ParagraphStyle("", fontSize=7, textColor=colors.HexColor("#94A3B8"),
                                               fontName="Helvetica")),
    ]
    right = [
        Paragraph(doc_title, ParagraphStyle("", fontSize=15, leading=18, textColor=WHITE,
                                              fontName="Helvetica-Bold", alignment=TA_RIGHT)),
        Spacer(1, 4),
        Paragraph(doc_subtitle, ParagraphStyle("", fontSize=8, leading=10, textColor=colors.HexColor("#E2E8F0"),
                                                fontName="Helvetica", alignment=TA_RIGHT)),
    ]

    tbl = Table([[left, right]], colWidths=[310, 200])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), ACCENT),
        ("PADDING", (0, 0), (-1, -1), 10),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
    ]))
    return tbl


def _section_label(text: str):
    """Dark navy section separator."""
    t = Table([[Paragraph(text, ParagraphStyle(
        "", fontSize=7.5, textColor=WHITE, fontName="Helvetica-Bold"
    ))]], colWidths=[510])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), ACCENT),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    return t


def _kv_table(pairs: list, s):
    """Two-column key-value info grid."""
    rows = []
    row = []
    for i, (k, v) in enumerate(pairs):
        cell = [Paragraph(k, s["FieldLabel"]), Paragraph(str(v or "—"), s["FieldValue"])]
        row.append(cell)
        if len(row) == 2:
            rows.append(row)
            row = []
    if row:
        row.append([Paragraph("", s["FieldLabel"]), Paragraph("", s["FieldValue"])])
        rows.append(row)

    col_w = [115, 140] * 2
    t = Table(rows, colWidths=col_w, hAlign="LEFT")
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [ACCENT_LIGHT, WHITE]),
    ]))
    return t


def _signature_row(signatories: list, s):
    """Bottom signature row. signatories = [{label, name}]"""
    cells = []
    for sig in signatories:
        cell = [
            Paragraph(sig["label"], ParagraphStyle("", fontSize=7.5, textColor=GREY,
                                                    fontName="Helvetica")),
            Spacer(1, 35),
            HRFlowable(width="80%", thickness=0.5, color=GREY),
            Paragraph(sig["name"], ParagraphStyle("", fontSize=8, fontName="Helvetica-Bold")),
        ]
        cells.append(cell)

    col_w = [510 // len(signatories)] * len(signatories)
    t = Table([cells], colWidths=col_w)
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("PADDING", (0, 0), (-1, -1), 8),
    ]))
    return t


def _items_table(items: list, s, show_bags=True):
    """Standard product items table."""
    headers = ["No", "Deskripsi / HS Code", "Qty (Kg)", "Qty (Bags)" if show_bags else "Unit",
               "Harga Satuan (USD)", "Total (USD)"]
    rows = [[Paragraph(h, s["TableHeader"]) for h in headers]]
    grand_total = 0
    for i, item in enumerate(items, 1):
        try:
            total = float(item.get("total_usd") or 0)
        except Exception:
            total = 0
        grand_total += total
        rows.append([
            Paragraph(str(i), s["TableCellC"]),
            Paragraph(f"{item.get('name', '')}<br/><font size=6 color=grey>HS: {item.get('hs_code', '')}</font>",
                      s["TableCell"]),
            Paragraph(f"{item.get('qty_kg', '')}", s["TableCellC"]),
            Paragraph(f"{item.get('qty_bags', '')}", s["TableCellC"]),
            Paragraph(f"USD {item.get('price_usd', '')}", s["TableCellR"]),
            Paragraph(f"USD {total:,.2f}", s["TableCellR"]),
        ])

    col_w = [25, 200, 55, 55, 85, 90]
    t = Table(rows, colWidths=col_w, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), ACCENT),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#E2E8F0")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, ACCENT_LIGHT]),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    return t, grand_total


def _total_box(grand_total: float, s, extras: list = None):
    """Green-tinted total summary box."""
    rows = []
    if extras:
        for label, val in extras:
            rows.append([Paragraph(label, s["FieldLabel"]),
                         Paragraph(str(val), s["TableCellR"])])
    rows.append([Paragraph("<b>GRAND TOTAL</b>", s["TotalLabel"]),
                 Paragraph(f"<b>USD {grand_total:,.2f}</b>", s["TotalValue"])])

    t = Table(rows, colWidths=[395, 115])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), ACCENT_LIGHT),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#DBEAFE")),
        ("PADDING", (0, 0), (-1, -1), 6),
        ("LINEABOVE", (0, -1), (-1, -1), 1, ACCENT),
    ]))
    return t


def _filepath(filename: str) -> str:
    return os.path.join(EXPORT_DIR, filename)


def _auto_filename(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}.pdf"


# ─────────────────────────────────────────────────────────────────
# 1. COMMERCIAL INVOICE
# ─────────────────────────────────────────────────────────────────
def generate_invoice_pdf(data: dict, filename: str = None) -> str:
    filename = filename or _auto_filename("invoice")
    fp = _filepath(filename)
    doc = SimpleDocTemplate(fp, pagesize=A4,
                            leftMargin=15*mm, rightMargin=15*mm,
                            topMargin=12*mm, bottomMargin=15*mm)
    s = _styles()
    items = data.get("items", [])
    inv_no = data.get("invoice_ref_no") or f"INV-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
    date_str = data.get("transaction_date") or datetime.now().strftime("%d %B %Y")

    content = []
    content.append(_header_table(data, "COMMERCIAL INVOICE", inv_no, s))
    content.append(Spacer(1, 8))

    # Seller / Buyer
    content.append(_section_label("INFORMASI PENJUAL & PEMBELI"))
    content.append(_kv_table([
        ("Eksportir / Penjual", data.get("company_name", "")),
        ("Nomor Invoice", inv_no),
        ("Alamat", data.get("company_address", "")),
        ("Tanggal", str(date_str)),
        ("Pembeli / Importir", data.get("buyer_name", "")),
        ("Incoterm", data.get("incoterm", "")),
        ("Negara Pembeli", data.get("buyer_country", "")),
        ("Syarat Pembayaran", data.get("payment_method", "")),
        ("Alamat Pembeli", data.get("buyer_address", "")),
        ("Asal Barang", "Indonesia"),
    ], s))
    content.append(Spacer(1, 8))

    # Shipping info
    content.append(_section_label("INFORMASI PENGIRIMAN"))
    content.append(_kv_table([
        ("Pelabuhan Muat", data.get("port_loading", "")),
        ("Pelabuhan Tujuan", data.get("port_destination", "")),
        ("Nama Kapal", data.get("vessel_name", "")),
        ("No. Container", data.get("container_no", "")),
        ("ETD", str(data.get("etd_date", ""))),
        ("ETA", str(data.get("eta_date", ""))),
    ], s))
    content.append(Spacer(1, 8))

    # Items
    content.append(_section_label("RINCIAN BARANG"))
    content.append(Spacer(1, 4))
    if items:
        tbl, grand_total = _items_table(items, s)
        content.append(tbl)
        content.append(Spacer(1, 6))

        incoterm = (data.get("incoterm") or "FOB").upper()
        kurs = float(data.get("usd_idr_rate") or 16000)
        ins_pct = float(data.get("insurance_pct") or 0)
        dep_pct = float(data.get("deposit_pct") or 0)

        extras = []
        final_total = grand_total

        # Penyesuaian berdasarkan Incoterm (FOB vs CIF/CFR):
        if incoterm in ["CIF", "CFR", "CNF"]:
            trucking_idr = float(data.get("trucking_cost") or 0)
            thc_idr = float(data.get("thc_cost") or 0)
            freight_usd = (trucking_idr + thc_idr) / kurs if kurs > 0 else 0
            insurance_usd = grand_total * ins_pct / 100

            if freight_usd > 0:
                extras.append(("Freight / Ongkos Kirim", f"USD {freight_usd:,.2f}"))
                final_total += freight_usd
            if insurance_usd > 0 and incoterm == "CIF":
                extras.append((f"Asuransi ({ins_pct}%)", f"USD {insurance_usd:,.2f}"))
                final_total += insurance_usd
        elif dep_pct > 0:
            deposit_usd = grand_total * dep_pct / 100
            balance_usd = grand_total - deposit_usd
            extras.append((f"Down Payment ({dep_pct:.0f}%)", f"USD {deposit_usd:,.2f}"))
            extras.append(("Balance Due / Sisa Tagihan", f"USD {balance_usd:,.2f}"))

        content.append(_total_box(final_total, s, extras))
    content.append(Spacer(1, 20))

    # Signature
    content.append(_signature_row([
        {"label": "Eksportir / Penjual", "name": data.get("owner_name", "")},
        {"label": "Pembeli / Importir", "name": data.get("buyer_name", "")},
    ], s))

    doc.build(content)
    return fp


# ─────────────────────────────────────────────────────────────────
# 2. PROFORMA INVOICE
# ─────────────────────────────────────────────────────────────────
def generate_proforma_invoice_pdf(data: dict, filename: str = None) -> str:
    filename = filename or _auto_filename("proforma_invoice")
    fp = _filepath(filename)
    doc = SimpleDocTemplate(fp, pagesize=A4,
                            leftMargin=15*mm, rightMargin=15*mm,
                            topMargin=12*mm, bottomMargin=15*mm)
    s = _styles()
    items = data.get("items", [])
    inv_no = data.get("invoice_ref_no") or f"PI-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
    date_str = data.get("transaction_date") or datetime.now().strftime("%d %B %Y")
    content = []
    content.append(_header_table(data, "PROFORMA INVOICE", f"No. {inv_no} (PRELIMINARY)", s))
    content.append(Spacer(1, 8))

    content.append(_section_label("INFORMASI PENJUAL & PEMBELI"))
    content.append(_kv_table([
        ("Penjual (Seller)", data.get("company_name", "")),
        ("No. Invoice", inv_no),
        ("Alamat Penjual", data.get("company_address", "")),
        ("Tanggal", str(date_str)),
        ("Pembeli (Buyer)", data.get("buyer_name", "")),
        ("Incoterm / Syarat", data.get("incoterm", "")),
        ("Negara Pembeli", data.get("buyer_country", "")),
        ("Syarat Pembayaran", data.get("payment_method", "")),
    ], s))
    content.append(Spacer(1, 6))

    content.append(_section_label("INFORMASI PENGIRIMAN"))
    content.append(_kv_table([
        ("Pelabuhan Muat", data.get("port_loading", "Tanjung Priok")),
        ("Pelabuhan Tujuan", data.get("port_destination", "")),
        ("Mode Transportasi", "Laut / Sea"),
        ("Asal Barang", "Indonesia"),
        ("Nama Kapal", data.get("vessel_name", "TBA")),
        ("ETD", str(data.get("etd_date", "TBA"))),
        ("No. Container", data.get("container_no", "TBA")),
        ("ETA", str(data.get("eta_date", "TBA"))),
        ("No. Seal", data.get("seal_no", "TBA")),
        ("Tipe Container", data.get("container_type", "")),
    ], s))
    content.append(Spacer(1, 6))

    content.append(_section_label("RINCIAN BARANG"))
    content.append(Spacer(1, 4))
    if items:
        tbl, grand_total = _items_table(items, s)
        content.append(tbl)
        content.append(Spacer(1, 6))

        dep_pct = float(data.get("deposit_pct") or 30)
        deposit = grand_total * dep_pct / 100
        balance = grand_total - deposit
        extras = [
            (f"Deposit / DP ({dep_pct}%)", f"USD {deposit:,.2f}"),
            ("Sisa Pembayaran (Balance)", f"USD {balance:,.2f}"),
        ]
        content.append(_total_box(grand_total, s, extras))

    content.append(Spacer(1, 8))
    content.append(_section_label("DEKLARASI & KETENTUAN"))
    content.append(Spacer(1, 4))
    content.append(Paragraph(
        "1. Barang bebas diimpor dan tidak termasuk dalam daftar negatif sesuai kebijakan perdagangan yang berlaku.<br/>"
        "2. Menyatakan bahwa barang merupakan produk asli Indonesia.<br/>"
        "3. <b>CATATAN KETENTUAN:</b> Dokumen ini adalah Proforma Invoice (faktur penawaran sementara) untuk pengurusan pembayaran uang muka (DP) dan kepabeanan awal, <b>bukan</b> merupakan faktur penjualan komersial final (Final Commercial Invoice) yang diterbitkan setelah pengapalan barang.",
        s["BodyText2"]
    ))
    content.append(Spacer(1, 16))
    content.append(_signature_row([
        {"label": "Penjual / Seller", "name": data.get("owner_name", "")},
        {"label": "Pembeli / Buyer", "name": data.get("buyer_name", "")},
    ], s))

    doc.build(content)
    return fp


# ─────────────────────────────────────────────────────────────────
# 3. PACKING LIST
# ─────────────────────────────────────────────────────────────────
def generate_packing_list_pdf(data: dict, filename: str = None) -> str:
    filename = filename or _auto_filename("packing_list")
    fp = _filepath(filename)
    doc = SimpleDocTemplate(fp, pagesize=A4,
                            leftMargin=15*mm, rightMargin=15*mm,
                            topMargin=12*mm, bottomMargin=15*mm)
    s = _styles()
    items = data.get("items", [])
    pl_no = data.get("invoice_ref_no") or f"PL-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
    date_str = data.get("transaction_date") or datetime.now().strftime("%d %B %Y")

    content = []
    content.append(_header_table(data, "PACKING LIST", pl_no, s))
    content.append(Spacer(1, 8))

    content.append(_section_label("INFORMASI PENGIRIMAN"))
    content.append(_kv_table([
        ("Shipper / Eksportir", data.get("company_name", "")),
        ("No. P/L", pl_no),
        ("Alamat Shipper", data.get("company_address", "")),
        ("Tanggal", str(date_str)),
        ("Consignee / Pembeli", data.get("buyer_name", "")),
        ("Pelabuhan Muat", data.get("port_loading", "")),
        ("Negara Consignee", data.get("buyer_country", "")),
        ("Pelabuhan Bongkar", data.get("port_destination", "")),
        ("Nama Kapal", data.get("vessel_name", "")),
        ("No. Container", data.get("container_no", "")),
        ("ETD", str(data.get("etd_date", ""))),
        ("No. Seal", data.get("seal_no", "")),
    ], s))
    content.append(Spacer(1, 8))

    content.append(_section_label("RINCIAN PENGEPAKAN"))
    content.append(Spacer(1, 4))

    headers = ["No", "Deskripsi Barang", "Qty (Kg)", "Qty (Bags)", "Berat Netto (Kg)", "Berat Bruto (Kg)"]
    rows = [[Paragraph(h, s["TableHeader"]) for h in headers]]
    total_kg = 0
    total_bags = 0
    total_netto = 0
    total_bruto = 0
    for i, item in enumerate(items, 1):
        netto = float(item.get("qty_kg") or 0)
        bruto = netto * 1.02  # standard 2% for packaging
        total_kg += netto
        total_bags += float(item.get("qty_bags") or 0)
        total_netto += netto
        total_bruto += bruto
        rows.append([
            Paragraph(str(i), s["TableCellC"]),
            Paragraph(f"{item.get('name', '')}", s["TableCell"]),
            Paragraph(f"{netto:,.0f}", s["TableCellC"]),
            Paragraph(f"{item.get('qty_bags', '')}", s["TableCellC"]),
            Paragraph(f"{netto:,.0f}", s["TableCellR"]),
            Paragraph(f"{bruto:,.0f}", s["TableCellR"]),
        ])

    rows.append([
        Paragraph("", s["TableCell"]),
        Paragraph("<b>TOTAL</b>", s["FieldValue"]),
        Paragraph(f"<b>{total_kg:,.0f}</b>", s["TableCellC"]),
        Paragraph(f"<b>{total_bags:,.0f}</b>", s["TableCellC"]),
        Paragraph(f"<b>{total_netto:,.0f}</b>", s["TableCellR"]),
        Paragraph(f"<b>{total_bruto:,.0f}</b>", s["TableCellR"]),
    ])

    t = Table(rows, colWidths=[25, 200, 60, 60, 85, 80], repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), ACCENT),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#E2E8F0")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [WHITE, ACCENT_LIGHT]),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#DBEAFE")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    content.append(t)
    content.append(Spacer(1, 20))
    content.append(_signature_row([
        {"label": "Shipper / Eksportir", "name": data.get("owner_name", "")},
        {"label": "Sales Director", "name": ""},
    ], s))

    doc.build(content)
    return fp


# ─────────────────────────────────────────────────────────────────
# 4. SHIPPING INSTRUCTION
# ─────────────────────────────────────────────────────────────────
def generate_shipping_instruction_pdf(data: dict, filename: str = None) -> str:
    filename = filename or _auto_filename("shipping_instruction")
    fp = _filepath(filename)
    doc = SimpleDocTemplate(fp, pagesize=A4,
                            leftMargin=15*mm, rightMargin=15*mm,
                            topMargin=12*mm, bottomMargin=15*mm)
    s = _styles()
    items = data.get("items", [])
    si_no = data.get("invoice_ref_no") or f"SI-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
    date_str = data.get("transaction_date") or datetime.now().strftime("%d %B %Y")

    content = []
    content.append(_header_table(data, "SHIPPING INSTRUCTION", si_no, s))
    content.append(Spacer(1, 8))

    content.append(_section_label("INSTRUKSI PENGIRIMAN"))
    content.append(_kv_table([
        ("Kepada (To)", data.get("forwarder_name", "EVERGREEN")),
        ("Nomor SI", si_no),
        ("Dari (Shipper)", data.get("company_name", "")),
        ("Tanggal", str(date_str)),
        ("Nama Kapal", data.get("vessel_name", "")),
        ("ETD", str(data.get("etd_date", ""))),
        ("Port of Loading", data.get("port_loading", "")),
        ("ETA", str(data.get("eta_date", ""))),
        ("Port of Destination", data.get("port_destination", "")),
        ("No. Container", data.get("container_no", "")),
    ], s))
    content.append(Spacer(1, 6))

    content.append(_section_label("CONSIGNEE & NOTIFY PARTY"))
    content.append(_kv_table([
        ("Consignee", data.get("buyer_name", "")),
        ("Notify Party", data.get("buyer_name", "")),
        ("Alamat Consignee", data.get("buyer_address", "")),
        ("Negara Tujuan", data.get("buyer_country", "")),
    ], s))
    content.append(Spacer(1, 6))

    content.append(_section_label("DESKRIPSI BARANG & KONTAINER"))
    content.append(Spacer(1, 4))
    desc_rows = []
    for item in items:
        desc_text = f"• <b>{item.get('name', '')}</b> — {item.get('qty_kg', '')} Kg / {item.get('qty_bags', '')} Bags"
        if item.get("hs_code"):
            desc_text += f" (HS Code: {item.get('hs_code')})"
        desc_rows.append([Paragraph(desc_text, s["BodyText2"])])
    if not desc_rows:
        desc_rows.append([Paragraph("Tidak ada rincian barang.", s["BodyText2"])])
    t_desc = Table(desc_rows, colWidths=[510])
    t_desc.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#E2E8F0")),
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
        ("PADDING", (0, 0), (-1, -1), 8),
    ]))
    content.append(t_desc)
    content.append(Spacer(1, 6))

    total_netto = sum(float(item.get("qty_kg") or 0) for item in items)
    total_bruto = total_netto * 1.02
    content.append(_kv_table([
        ("Berat Netto", f"{total_netto:,.0f} KGS"),
        ("Berat Bruto", f"{total_bruto:,.0f} KGS"),
        ("Tipe Container", data.get("container_type", "20 Feet")),
        ("No. Seal", data.get("seal_no", "")),
        ("Freight", "PREPAID"),
        ("Kondisi", "CY - CY"),
        ("Total B/L", "3 ORIGINAL + 10 COPY"),
        ("Pembayaran B/L", "JAKARTA"),
    ], s))
    content.append(Spacer(1, 6))

    content.append(_section_label("INSTRUKSI TAMBAHAN"))
    content.append(Spacer(1, 4))
    content.append(Paragraph(
        f"Rekening pembayaran: {data.get('bank_account', '-')}<br/>"
        "Mohon diterbitkan B/L sesuai instruksi di atas.",
        s["BodyText2"]
    ))
    content.append(Spacer(1, 16))
    content.append(_signature_row([
        {"label": "Shipper", "name": data.get("owner_name", "")},
    ], s))

    doc.build(content)
    return fp


# ─────────────────────────────────────────────────────────────────
# 5. SURAT PENAWARAN (EXPORT QUOTATION)
# ─────────────────────────────────────────────────────────────────
def generate_surat_penawaran_pdf(data: dict, filename: str = None) -> str:
    filename = filename or _auto_filename("surat_penawaran")
    fp = _filepath(filename)
    doc = SimpleDocTemplate(fp, pagesize=A4,
                            leftMargin=15*mm, rightMargin=15*mm,
                            topMargin=12*mm, bottomMargin=15*mm)
    s = _styles()
    items = data.get("items", [])
    date_str = data.get("transaction_date") or datetime.now().strftime("%d %B %Y")

    content = []
    content.append(_header_table(data, "SURAT PENAWARAN", "Export Quotation", s))
    content.append(Spacer(1, 8))

    content.append(_section_label("KEPADA / TO"))
    content.append(_kv_table([
        ("Kepada", data.get("buyer_name", "Sir/Madam")),
        ("Tanggal / Date", str(date_str)),
        ("Negara", data.get("buyer_country", "")),
        ("Alamat", data.get("buyer_address", "")),
    ], s))
    content.append(Spacer(1, 8))

    content.append(Paragraph(
        "Dengan hormat,<br/><br/>"
        "Kami dengan senang hati mengajukan penawaran kepada Anda sebagai bentuk apresiasi atas "
        "ketertarikan Anda terhadap produk kami. Sebagai perusahaan ekspor terkemuka dari Indonesia, "
        "kami berkomitmen untuk menyediakan produk berkualitas tinggi dengan harga yang kompetitif. "
        "Berikut penawaran kami untuk Anda:",
        s["BodyText2"]
    ))
    content.append(Spacer(1, 8))

    content.append(_section_label("RINCIAN PRODUK / PRODUCT DESCRIPTION"))
    content.append(Spacer(1, 4))

    headers = ["No", "Nama Produk / Spesifikasi", "HS Code", "Qty (Kg)", "Harga Satuan (USD)", "Total (USD)"]
    rows = [[Paragraph(h, s["TableHeader"]) for h in headers]]
    grand_total = 0
    for i, item in enumerate(items, 1):
        total = float(item.get("total_usd") or 0)
        grand_total += total
        rows.append([
            Paragraph(str(i), s["TableCellC"]),
            Paragraph(f"{item.get('name', '')}<br/><font size=6>{data.get('product_spec', '')}</font>",
                      s["TableCell"]),
            Paragraph(str(item.get("hs_code", "")), s["TableCellC"]),
            Paragraph(str(item.get("qty_kg", "")), s["TableCellC"]),
            Paragraph(f"USD {item.get('price_usd', '')}", s["TableCellR"]),
            Paragraph(f"USD {total:,.2f}", s["TableCellR"]),
        ])

    t = Table(rows, colWidths=[25, 185, 55, 55, 100, 90], repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), ACCENT),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#E2E8F0")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, ACCENT_LIGHT]),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    content.append(t)
    content.append(Spacer(1, 6))
    content.append(_total_box(grand_total, s))
    content.append(Spacer(1, 8))

    content.append(_section_label("SYARAT & KETENTUAN / TERMS AND CONDITIONS"))
    content.append(Spacer(1, 4))
    content.append(Paragraph(
        f"• <b>Pembayaran:</b> {data.get('payment_method', '-')}<br/>"
        f"• <b>Pengiriman:</b> {data.get('incoterm', '-')} via laut<br/>"
        f"• <b>Kualitas:</b> Produk kami memenuhi standar kualitas internasional dan akan "
        "diperiksa dengan teliti sebelum pengiriman.<br/>"
        f"• <b>Kontak:</b> {data.get('company_phone', '')} | {data.get('company_email', '')}",
        s["BodyText2"]
    ))
    content.append(Spacer(1, 16))
    content.append(_signature_row([
        {"label": "Hormat Kami / Yours Sincerely", "name": data.get("owner_name", "")},
        {"label": data.get("company_name", ""), "name": ""},
    ], s))

    doc.build(content)
    return fp


# ─────────────────────────────────────────────────────────────────
# 6. SALES CONTRACT (BUYER)
# ─────────────────────────────────────────────────────────────────
def generate_sales_contract_buyer_pdf(data: dict, filename: str = None) -> str:
    filename = filename or _auto_filename("sales_contract_buyer")
    fp = _filepath(filename)
    doc = SimpleDocTemplate(fp, pagesize=A4,
                            leftMargin=15*mm, rightMargin=15*mm,
                            topMargin=12*mm, bottomMargin=15*mm)
    s = _styles()
    items = data.get("items", [])
    sc_no = data.get("invoice_ref_no") or f"SC-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
    date_str = data.get("transaction_date") or datetime.now().strftime("%d %B %Y")
    grand_total = sum(float(item.get("total_usd") or 0) for item in items)

    content = []
    content.append(_header_table(data, "SALES CONTRACT", f"No. {sc_no}", s))
    content.append(Spacer(1, 8))

    content.append(Paragraph(
        f"Kontrak Penjualan Barang ini dibuat pada tanggal <b>{date_str}</b> antara:",
        s["BodyText2"]
    ))
    content.append(Spacer(1, 6))

    content.append(_section_label("PIHAK-PIHAK DALAM KONTRAK"))
    content.append(_kv_table([
        ("Eksportir (Seller)", data.get("company_name", "")),
        ("Importir (Buyer)", data.get("buyer_name", "")),
        ("Alamat Eksportir", data.get("company_address", "")),
        ("Negara Buyer", data.get("buyer_country", "")),
        ("Alamat Buyer", data.get("buyer_address", "")),
    ], s))
    content.append(Spacer(1, 6))

    content.append(_section_label("I. DESKRIPSI BARANG"))
    content.append(Spacer(1, 4))
    headers = ["No", "Artikel & Deskripsi", "Qty (Kg)", "Qty (Bags)", "Harga Satuan (USD)", "Total (USD)"]
    rows = [[Paragraph(h, s["TableHeader"]) for h in headers]]
    for i, item in enumerate(items, 1):
        total = float(item.get("total_usd") or 0)
        rows.append([
            Paragraph(str(i), s["TableCellC"]),
            Paragraph(item.get("name", ""), s["TableCell"]),
            Paragraph(str(item.get("qty_kg", "")), s["TableCellC"]),
            Paragraph(str(item.get("qty_bags", "")), s["TableCellC"]),
            Paragraph(f"USD {item.get('price_usd', '')}", s["TableCellR"]),
            Paragraph(f"USD {total:,.2f}", s["TableCellR"]),
        ])
    rows.append([
        Paragraph("", s["TableCellC"]),
        Paragraph("<b>TOTAL</b>", s["FieldValue"]),
        Paragraph("", s["TableCellC"]),
        Paragraph("", s["TableCellC"]),
        Paragraph("", s["TableCellC"]),
        Paragraph(f"<b>USD {grand_total:,.2f}</b>", s["TableCellR"]),
    ])
    t = Table(rows, colWidths=[25, 195, 55, 55, 90, 90], repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), ACCENT),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#E2E8F0")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [WHITE, ACCENT_LIGHT]),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#DBEAFE")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    content.append(t)
    content.append(Spacer(1, 8))

    content.append(_section_label("II. PENGIRIMAN"))
    content.append(_kv_table([
        ("Incoterm", data.get("incoterm", "")),
        ("Tanggal Pengiriman", str(data.get("etd_date", ""))),
        ("Pelabuhan Muat", data.get("port_loading", "")),
        ("Tujuan", data.get("port_destination", "")),
        ("Partial Shipment", "Not Allowed"),
        ("Transshipment", "Not Allowed"),
    ], s))
    content.append(Spacer(1, 6))

    content.append(_section_label("III. SYARAT PEMBAYARAN"))
    content.append(Spacer(1, 4))
    dep_pct = float(data.get("deposit_pct") or 30)
    bal_pct = 100 - dep_pct
    content.append(Paragraph(
        f"Pembayaran: {data.get('payment_method', '')}. "
        f"DP {dep_pct:.0f}% sebelum pengiriman dan sisa {bal_pct:.0f}% setelah terima Bill of Lading.<br/>"
        f"Rekening bank: {data.get('bank_account', '-')}",
        s["BodyText2"]
    ))
    content.append(Spacer(1, 6))

    content.append(_section_label("IV. DOKUMEN YANG DIPERLUKAN"))
    content.append(Spacer(1, 4))
    content.append(Paragraph(
        "1. Full set clean on board ocean Bill of Lading<br/>"
        "2. Signed Commercial Invoice (rangkap 3)<br/>"
        "3. Certificate of Origin dari Kemendag RI<br/>"
        "4. Signed Packing List (rangkap 2)",
        s["BodyText2"]
    ))
    content.append(Spacer(1, 20))

    content.append(_signature_row([
        {"label": "SELLER / PENJUAL", "name": data.get("owner_name", "")},
        {"label": "BUYER / PEMBELI", "name": data.get("buyer_name", "")},
    ], s))

    doc.build(content)
    return fp


# ─────────────────────────────────────────────────────────────────
# 7. KONTRAK SUPPLIER (PERJANJIAN KERJASAMA)
# ─────────────────────────────────────────────────────────────────
def generate_kontrak_supplier_pdf(data: dict, filename: str = None) -> str:
    filename = filename or _auto_filename("kontrak_supplier")
    fp = _filepath(filename)
    doc = SimpleDocTemplate(fp, pagesize=A4,
                            leftMargin=15*mm, rightMargin=15*mm,
                            topMargin=12*mm, bottomMargin=15*mm)
    s = _styles()
    sc_no = data.get("invoice_ref_no") or f"KS-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
    date_str = data.get("transaction_date") or datetime.now().strftime("%d %B %Y")
    buyer_co = data.get("buyer_country", "Luar Negeri")
    buyer_nm = data.get("buyer_name", "Buyer Luar Negeri")

    content = []
    content.append(_header_table(data, "PERJANJIAN KERJASAMA", f"Kontrak Eksklusif No. {sc_no}", s))
    content.append(Spacer(1, 8))

    content.append(Paragraph(
        f"<b>PERJANJIAN KERJASAMA KONTRAK EKSLUSIF</b><br/><font size=8 color='#475569'>Nomor: {sc_no}</font>",
        ParagraphStyle("", fontSize=10, leading=13, fontName="Helvetica-Bold",
                        textColor=ACCENT, alignment=TA_CENTER)
    ))
    content.append(Spacer(1, 6))

    content.append(Paragraph("Yang bertanda tangan di bawah ini:", s["BodyText2"]))
    content.append(Spacer(1, 4))

    # Pihak Pertama
    content.append(_section_label("PIHAK PERTAMA (BUSINESS DEVELOPMENT / PERANTARA EKSPOR)"))
    content.append(_kv_table([
        ("Nama", data.get("agent_name") or "...................................................."),
        ("No. KTP / NIK", data.get("agent_nik") or "...................................................."),
        ("Alamat", data.get("agent_address") or "...................................................."),
        ("Kapasitas", "Bertindak atas nama sendiri (Pihak Pertama)"),
    ], s))
    content.append(Spacer(1, 6))

    # Pihak Kedua
    content.append(_section_label("PIHAK KEDUA (SUPPLIER / PERUSAHAAN EKSPOR)"))
    content.append(_kv_table([
        ("Nama Perusahaan", data.get("company_name", "")),
        ("Diwakili oleh", data.get("owner_name", "")),
        ("Jabatan", "Direktur / Pemilik Usaha"),
        ("Alamat Perusahaan", data.get("company_address", "")),
        ("No. Telepon / HP", data.get("company_phone", "")),
        ("Kapasitas", "Bertindak mewakili Direksi (Pihak Kedua)"),
    ], s))
    content.append(Spacer(1, 8))

    pasal_title = ParagraphStyle("PasalTitle", fontSize=8.5, leading=11, fontName="Helvetica-Bold",
                                 textColor=ACCENT, spaceBefore=6, spaceAfter=2)
    body = ParagraphStyle("PasalBody", fontSize=7.8, leading=10, fontName="Helvetica",
                          textColor=colors.HexColor("#1E293B"))

    # PENDAHULUAN
    content.append(Paragraph("<b>PENDAHULUAN</b>", pasal_title))
    content.append(Paragraph(
        "1. PIHAK PERTAMA merupakan individu/pihak yang menjalankan kegiatan usaha dalam membantu penjualan dan penawaran produk PIHAK KEDUA terhadap calon Pembeli Luar Negeri.<br/>"
        "2. PIHAK KEDUA merupakan badan usaha/perseroan yang menjalankan kegiatan usahanya di bidang produksi dan ekspor komoditas Indonesia.<br/>"
        "3. Dalam rangka memperluas jaringan bisnis dan memperoleh keuntungan bersama, Para Pihak sepakat untuk melakukan kerjasama dengan syarat dan ketentuan sebagai berikut:",
        body
    ))
    content.append(Spacer(1, 4))

    # Pasal 1
    content.append(Paragraph("<b>1. Definisi</b>", pasal_title))
    content.append(Paragraph(
        "<b>1.1.</b> Dalam Perjanjian ini, istilah-istilah berikut mempunyai arti sebagaimana dijabarkan dalam Pasal ini:<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>a. SEPAKAT:</b> Para Pihak secara sadar tanpa adanya paksaan menerima ketentuan-ketentuan yang terdapat dalam surat PERJANJIAN KERJASAMA KONTRAK EKSLUSIF ini.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>b. PIHAK:</b> Penyebutan secara sendiri-sendiri antara PIHAK PERTAMA dan PIHAK KEDUA.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>c. PARA PIHAK:</b> Penyebutan secara bersama-sama antara PIHAK PERTAMA dan PIHAK KEDUA.<br/>"
        f"&nbsp;&nbsp;&nbsp;&nbsp;<b>d. BUYER:</b> Pembeli dari Luar Negeri ({buyer_nm}) yang diperkenalkan atau difasilitasi oleh Pihak Pertama kepada Pihak Kedua, sehingga segala bentuk informasi yang menyangkut hal ini berasal dari Pihak Pertama.<br/>"
        f"&nbsp;&nbsp;&nbsp;&nbsp;<b>e. PIHAK BUYER:</b> Entitas/individu yang berasal dari Luar Negeri ({buyer_co}) yang melakukan transaksi pembelian ke Pihak Kedua melalui Pihak Pertama.",
        body
    ))
    content.append(Spacer(1, 4))

    # Pasal 2
    content.append(Paragraph("<b>2. Ruang Lingkup Kerjasama</b>", pasal_title))
    content.append(Paragraph(
        "<b>2.1.</b> Para Pihak dengan ini sepakat untuk melakukan Kerjasama dalam rangka KONTRAK EKSLUSIF, serta menaati hal-hal lain yang diatur dalam Perjanjian ini.<br/>"
        "<b>2.2.</b> Masing-masing Pihak berkewajiban untuk menjaga nama baik Pihak lainnya dan dilarang untuk membuat atau mempublikasikan pernyataan apapun dan/atau melakukan tindakan lainnya yang dapat merusak atau merugikan kepentingan, reputasi, atau nama baik Pihak lainnya tersebut dan afiliasinya.<br/>"
        "<b>2.3.</b> Masing-masing Pihak berkewajiban untuk melakukan kesepakatan kerjasama ini secara jujur dan adil tanpa adanya suatu tindakan yang merugikan Pihak yang lainnya.<br/>"
        "<b>2.4.</b> Jikalau ada terjadinya bentuk-bentuk ketidakjujuran, kerugian maupun kecurangan yang dilakukan oleh salah satu Pihak dalam bentuk sengaja maupun tidak sengaja terhadap pihak yang lain, maka Pihak yang dirugikan memiliki hak untuk menyelesaikan permasalahan tersebut melalui jalur hukum.<br/>"
        "<b>2.5.</b> Surat KERJASAMA KONTRAK EKSLUSIF ini berlaku di setiap terjadinya suatu kegiatan yang melibatkan Pihak Pertama, Pihak Kedua, dan Pihak Buyer.",
        body
    ))
    content.append(Spacer(1, 4))

    # Pasal 3
    content.append(Paragraph("<b>3. Hak dan Kewajiban</b>", pasal_title))
    content.append(Paragraph(
        "<b>3.1. Hak dan Kewajiban Pihak Pertama:</b><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;a. Pihak Pertama memiliki hak atas dasar informasi (termasuk dokumen-dokumen yang diperlukan dalam transaksi dengan Pihak Buyer), dan pembagian dari setiap hasil transaksi terhadap Buyer yang dilakukan oleh Pihak Kedua.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;b. Pihak Pertama memiliki hak untuk mendapatkan bukti dalam setiap transaksi yang dilakukan oleh Pihak Kedua kepada Pihak Buyer ataupun sebaliknya.<br/>"
        f"&nbsp;&nbsp;&nbsp;&nbsp;c. Pihak Pertama memiliki kewajiban dalam membantu Pihak Kedua untuk menawarkan dan membantu dalam penjualan produk Pihak Kedua ke Pihak Buyer di Luar Negeri ({buyer_co}).<br/>"
        f"&nbsp;&nbsp;&nbsp;&nbsp;d. Pihak Pertama memiliki kewajiban untuk memastikan tidak ada tindakan kecurangan ketika barang sudah sampai ke lokasi pengiriman di negara Buyer ({buyer_co}), termasuk memfasilitasi pengecekan kontainer barang yang baru sampai ke lokasi pengiriman.<br/>"
        "<b>3.2. Hak dan Kewajiban Pihak Kedua:</b><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;a. Pihak Kedua memiliki hak terhadap Pihak Pertama untuk membantu menawarkan dan membantu penjualan produk ekspor yang dimiliki oleh Pihak Kedua.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;b. Pihak Kedua memiliki hak untuk mendapatkan informasi seputar kegiatan dan rencana yang akan dilakukan oleh Pihak Pertama dengan Buyer yang berkaitan dengan Pihak Kedua.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;c. Pihak Kedua memiliki hak untuk mendapatkan Buyer yang terpercaya dan terjamin kelegalitasannya oleh Pihak Pertama.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;d. Pihak Kedua memiliki kewajiban untuk memberikan pembagian hasil secara adil dan jujur kepada Pihak Pertama sesuai dengan kesepakatan bersama disetiap transaksi yang dilakukan.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;e. Pihak Kedua memiliki kewajiban untuk memenuhi pesanan dari Pihak Buyer dengan baik dan jujur sesuai spesifikasi yang disepakati.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;f. Pihak Kedua memiliki kewajiban untuk menyampaikan informasi seputar kondisi barang baik kualitas, kuantitas, dan asal barang kepada Pihak Pertama sebelum terjadinya transaksi ke Pihak Buyer.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;g. Pihak Kedua memiliki kewajiban untuk menyampaikan ke Pihak Pertama jikalau terjadinya suatu perubahan yang menyangkut asal barang, kualitas, dan kuantitas barang.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;h. Pihak Kedua memiliki kewajiban untuk mengurus segala bentuk dokumen yang diperlukan agar proses pengapalan, pengiriman, dan perizinan ekspor berjalan lancar.",
        body
    ))
    content.append(Spacer(1, 4))

    # Pasal 4
    bank_info = data.get("bank_account") or "Bank: .......................................  |  No. Rek: .......................................  |  a.n: ......................................."
    content.append(Paragraph("<b>4. Komisi dan Pembayaran</b>", pasal_title))
    content.append(Paragraph(
        "<b>4.1.</b> Pihak Pertama berhak mendapatkan pembayaran atas setiap transaksi yang dilakukan oleh Pihak Kedua dengan Pihak Buyer (dalam bentuk pembagian hasil) dengan nominal yang disepakati di setiap transaksi.<br/>"
        "<b>4.2.</b> Transaksi pembayaran dari Pihak Buyer tidak akan melalui Pihak Pertama, melainkan langsung diterima oleh rekening Pihak Kedua.<br/>"
        "<b>4.3.</b> Setiap transaksi pembayaran dengan pihak Buyer akan melalui rekening resmi Pihak Kedua.<br/>"
        "<b>4.4.</b> Pihak Kedua selambat-lambatnya harus mentransfer pembayaran komisi/bagi hasil ke Pihak Pertama dalam waktu <b>2 x 24 jam</b> setelah pembayaran diterima oleh Pihak Kedua dari Pihak Buyer.<br/>"
        f"<b>4.5.</b> Pembayaran komisi akan dibayarkan oleh Pihak Kedua kepada Pihak Pertama melalui transfer rekening:<br/>&nbsp;&nbsp;&nbsp;&nbsp;<b>{bank_info}</b><br/>"
        "<b>4.6.</b> Masing-masing Pihak akan menanggung pajak yang timbul dari pelaksanaan Perjanjian ini sesuai dengan kewajibannya berdasarkan hukum yang berlaku.",
        body
    ))
    content.append(Spacer(1, 4))

    # Pasal 5
    content.append(Paragraph("<b>5. Pernyataan dan Jaminan</b>", pasal_title))
    content.append(Paragraph(
        "<b>5.1.</b> Masing-masing Pihak dengan ini menyatakan dan menjamin bahwa orang yang menandatangani Perjanjian ini berwenang bertindak atas nama entitas masing-masing, izin usaha sah berlaku, dan seluruh data pendukung yang diserahkan adalah benar sesuai aslinya.",
        body
    ))
    content.append(Spacer(1, 4))

    # Pasal 6
    content.append(Paragraph("<b>6. Dokumen Tambahan</b>", pasal_title))
    content.append(Paragraph(
        "<b>6.1.</b> Masing-masing Pihak dengan ini menyerahkan salinan identitas resmi (KTP/Paspor/NIB) yang disertakan sebagai bagian tak terpisahkan dari perjanjian ini.<br/>"
        "<b>6.2.</b> Pihak Kedua menyerahkan bukti legalitas wewenang dalam mewakili perusahaan untuk menandatangani surat perjanjian kerjasama ini.",
        body
    ))
    content.append(Spacer(1, 4))

    # Pasal 7
    content.append(Paragraph("<b>7. Kerahasiaan (Non-Disclosure)</b>", pasal_title))
    content.append(Paragraph(
        "<b>7.1.</b> Setiap dan seluruh informasi yang berhubungan dengan rencana bisnis, data buyer, data harga, dan rincian transaksi dianggap sebagai Informasi Rahasia.<br/>"
        "<b>7.2.</b> Para Pihak diharuskan untuk menjaga kerahasiaan Informasi Rahasia dan dilarang mengungkapkannya kepada pihak ketiga tanpa persetujuan tertulis dari Para Pihak.",
        body
    ))
    content.append(Spacer(1, 4))

    # Pasal 8
    content.append(Paragraph("<b>8. Penyelesaian Perselisihan</b>", pasal_title))
    content.append(Paragraph(
        "<b>8.1.</b> Perjanjian ini diatur oleh dan tunduk pada hukum yang berlaku di Republik Indonesia.<br/>"
        "<b>8.2.</b> Perselisihan diselesaikan terlebih dahulu melalui musyawarah mufakat dalam jangka waktu 30 (tiga puluh) hari. Apabila tidak tercapai mufakat, Para Pihak sepakat untuk menyelesaikan perselisihan melalui Pengadilan Negeri yang berwenang di Indonesia.",
        body
    ))
    content.append(Spacer(1, 4))

    # Pasal 9
    content.append(Paragraph("<b>9. Pemberitahuan Resmi</b>", pasal_title))
    content.append(Paragraph(
        f"<b>Pihak Pertama:</b> {data.get('agent_name', 'Business Development')}  |  Telp: {data.get('agent_phone', '—')}  |  Email: {data.get('agent_email', '—')}<br/>"
        f"<b>Pihak Kedua:</b> {data.get('company_name', 'Perusahaan Ekspor')}  |  Telp: {data.get('company_phone', '—')}  |  Email: {data.get('company_email', '—')}",
        body
    ))
    content.append(Spacer(1, 4))

    # Pasal 10
    content.append(Paragraph("<b>10. Ketentuan Lain-Lain & Penutup</b>", pasal_title))
    content.append(Paragraph(
        f"Perubahan atau penambahan isi Perjanjian hanya sah bila dibuat tertulis dan ditandatangani oleh Para Pihak. "
        f"Demikian Perjanjian Kontrak Eksklusif ini dibuat dan ditandatangani pada tanggal <b>{date_str}</b> dalam rangkap yang mempunyai kekuatan hukum yang sama.",
        body
    ))
    content.append(Spacer(1, 16))

    content.append(_signature_row([
        {"label": "PIHAK PERTAMA (BD / PERANTARA)", "name": data.get("agent_name") or data.get("buyer_name", "")},
        {"label": f"PIHAK KEDUA ({data.get('company_name', 'SUPPLIER')})", "name": data.get("owner_name", "")},
    ], s))

    doc.build(content)
    return fp


# ─────────────────────────────────────────────────────────────────
# 8. SURAT JALAN
# ─────────────────────────────────────────────────────────────────
def generate_surat_jalan_pdf(data: dict, filename: str = None) -> str:
    filename = filename or _auto_filename("surat_jalan")
    fp = _filepath(filename)
    doc = SimpleDocTemplate(fp, pagesize=A4,
                            leftMargin=15*mm, rightMargin=15*mm,
                            topMargin=12*mm, bottomMargin=15*mm)
    s = _styles()
    items = data.get("items", [])
    inv_no = data.get("invoice_ref_no") or f"SJ-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
    date_str = data.get("transaction_date") or datetime.now().strftime("%d %B %Y")

    content = []
    content.append(_header_table(data, "SURAT JALAN", inv_no, s))
    content.append(Spacer(1, 8))

    content.append(_section_label("INFORMASI PENGIRIMAN"))
    content.append(_kv_table([
        ("Kepada (Forwarder)", data.get("forwarder_name", "PT. Forwarder Logistics Indonesia")),
        ("No. Invoice Ref", inv_no),
        ("Alamat Penjemputan", data.get("pickup_address", data.get("company_address", ""))),
        ("Tanggal Penjemputan", str(date_str)),
        ("Deskripsi Pengiriman", f"Trucking Kontainer {data.get('container_type', '20 feet')}"),
        ("No. Container", data.get("container_no", "")),
        ("No. Seal", data.get("seal_no", "")),
        ("Tujuan", data.get("port_loading", "")),
    ], s))
    content.append(Spacer(1, 8))

    content.append(_section_label("RINCIAN BARANG"))
    content.append(Spacer(1, 4))

    headers = ["No", "Nama Barang", "Qty (Kg)", "Qty (Bags)"]
    rows = [[Paragraph(h, s["TableHeader"]) for h in headers]]
    total_kg = 0
    total_bags = 0
    for i, item in enumerate(items, 1):
        kg = float(item.get("qty_kg") or 0)
        bags = float(item.get("qty_bags") or 0)
        total_kg += kg
        total_bags += bags
        rows.append([
            Paragraph(str(i), s["TableCellC"]),
            Paragraph(item.get("name", ""), s["TableCell"]),
            Paragraph(f"{kg:,.0f}", s["TableCellC"]),
            Paragraph(f"{bags:,.0f}", s["TableCellC"]),
        ])

    rows.append([
        Paragraph("", s["TableCell"]),
        Paragraph("<b>TOTAL</b>", s["FieldValue"]),
        Paragraph(f"<b>{total_kg:,.0f}</b>", s["TableCellC"]),
        Paragraph(f"<b>{total_bags:,.0f}</b>", s["TableCellC"]),
    ])

    t = Table(rows, colWidths=[30, 290, 95, 95], repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), ACCENT),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#E2E8F0")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [WHITE, ACCENT_LIGHT]),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#DBEAFE")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    content.append(t)
    content.append(Spacer(1, 30))

    content.append(_signature_row([
        {"label": "Pengirim", "name": data.get("owner_name", "")},
        {"label": "Driver", "name": ""},
        {"label": "Penerima", "name": data.get("forwarder_name", "")},
    ], s))

    doc.build(content)
    return fp


# ─────────────────────────────────────────────────────────────────
# 9. PERHITUNGAN BIAYA EKSPOR
# ─────────────────────────────────────────────────────────────────
def generate_perhitungan_biaya_pdf(data: dict, filename: str = None) -> str:
    filename = filename or _auto_filename("perhitungan_biaya")
    fp = _filepath(filename)
    doc = SimpleDocTemplate(fp, pagesize=A4,
                            leftMargin=15*mm, rightMargin=15*mm,
                            topMargin=12*mm, bottomMargin=15*mm)
    s = _styles()
    items = data.get("items", [])
    date_str = data.get("transaction_date") or datetime.now().strftime("%d %B %Y")

    kurs = float(data.get("usd_idr_rate") or 16000)
    hpp = float(data.get("price_at_warehouse") or 0)
    grand_total_usd = sum(float(i.get("total_usd") or 0) for i in items)
    qty_kg = float(data.get("qty_kg") or sum(float(i.get("qty_kg") or 0) for i in items))
    if qty_kg <= 0:
        qty_kg = 1

    loading = float(data.get("loading_cost") or 0)
    trucking = float(data.get("trucking_cost") or 0)
    thc = float(data.get("thc_cost") or 0)
    ins_pct = float(data.get("insurance_pct") or 0)

    # 1. EXW (Ex-Works) Calculation
    if hpp > 0:
        exw_idr = hpp * qty_kg
        exw_usd = exw_idr / kurs if kurs > 0 else 0
    else:
        exw_usd = grand_total_usd
        exw_idr = exw_usd * kurs

    # 2. Local Port Logistics & FOB Calculation
    total_local_idr = loading + trucking + thc
    total_local_usd = total_local_idr / kurs if kurs > 0 else 0
    fob_idr = exw_idr + total_local_idr
    fob_usd = fob_idr / kurs if kurs > 0 else 0

    # 3. Insurance & CIF Calculation
    insurance_idr = fob_idr * ins_pct / 100
    insurance_usd = fob_usd * ins_pct / 100
    cif_idr = fob_idr + insurance_idr
    cif_usd = fob_usd + insurance_usd

    content = []
    content.append(_header_table(data, "PERHITUNGAN BIAYA EKSPOR", f"Export Cost Calculation — {date_str}", s))
    content.append(Spacer(1, 8))

    content.append(_section_label("INFORMASI PRODUK & KURS"))
    content.append(_kv_table([
        ("Nama Produk", data.get("product_name", "") or (items[0].get("name", "") if items else "Produk Ekspor")),
        ("Kurs USD → IDR", f"Rp {kurs:,.0f}"),
        ("HS Code", data.get("hs_code", "") or (items[0].get("hs_code", "") if items else "—")),
        ("Tipe Container", data.get("container_type", "20 Feet")),
        ("Jumlah Pengiriman", f"{qty_kg:,.0f} Kg"),
        ("Harga di Gudang", f"Rp {hpp:,.0f}/Kg" if hpp > 0 else f"USD {exw_usd/qty_kg:,.2f}/Kg"),
    ], s))
    content.append(Spacer(1, 8))

    content.append(_section_label("KALKULASI BIAYA EKSPOR (EXW → FOB → CIF)"))
    content.append(Spacer(1, 4))

    def money_row(label, idr_val, usd_val, bold=False):
        fn = "Helvetica-Bold" if bold else "Helvetica"
        lbl = Paragraph(f"<b>{label}</b>" if bold else label,
                         ParagraphStyle("", fontSize=8, fontName=fn))
        idr = Paragraph(f"{'<b>' if bold else ''}Rp {idr_val:,.0f}{'</b>' if bold else ''}",
                         ParagraphStyle("", fontSize=8, fontName=fn, alignment=TA_RIGHT))
        usd = Paragraph(f"{'<b>' if bold else ''}USD {usd_val:,.2f}{'</b>' if bold else ''}",
                         ParagraphStyle("", fontSize=8, fontName=fn, alignment=TA_RIGHT))
        return [lbl, idr, usd]

    calc_rows = [
        [Paragraph("Komponen Biaya", s["TableHeader"]),
         Paragraph("Nilai IDR (Rp)", s["TableHeader"]),
         Paragraph("Nilai USD ($)", s["TableHeader"])],
        money_row("1. Harga di Gudang (A. Total EXW)", exw_idr, exw_usd, bold=True),
        money_row("   • Biaya Loading / Stuffing", loading, loading / kurs if kurs else 0),
        money_row("   • Biaya Trucking Gudang ke Pelabuhan", trucking, trucking / kurs if kurs else 0),
        money_row("   • Terminal Handling Charge (THC) & Dokumen", thc, thc / kurs if kurs else 0),
        money_row(f"2. Total FOB {data.get('port_loading') or 'Pelabuhan'} (B. EXW + Lokal)", fob_idr, fob_usd, bold=True),
        money_row(f"   • Asuransi Pengapalan ({ins_pct}%)", insurance_idr, insurance_usd),
        money_row(f"3. Total CIF {data.get('port_destination') or 'Tujuan'} (C. FOB + Asuransi)", cif_idr, cif_usd, bold=True),
    ]

    t = Table(calc_rows, colWidths=[250, 130, 130], repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), ACCENT),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#E2E8F0")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, ACCENT_LIGHT]),
        ("BACKGROUND", (0, 1), (-1, 1), colors.HexColor("#F1F5F9")),
        ("BACKGROUND", (0, 5), (-1, 5), colors.HexColor("#DBEAFE")),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#DCFCE7")),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    content.append(t)
    content.append(Spacer(1, 8))

    content.append(_section_label("INFORMASI CONTAINER"))
    content.append(Spacer(1, 4))
    ct = data.get("container_type", "20 Feet")
    dims = {"20 Feet": "6,058 × 2,438 × 2,591 mm",
            "40 Feet": "12,192 × 2,438 × 2,591 mm"}.get(ct, "—")
    content.append(_kv_table([
        ("Tipe Container", ct),
        ("Dimensi (P×L×T)", dims),
        ("No. Container", data.get("container_no", "")),
        ("No. Seal", data.get("seal_no", "")),
    ], s))
    content.append(Spacer(1, 16))
    content.append(_signature_row([
        {"label": "Dibuat oleh", "name": data.get("owner_name", "")},
        {"label": data.get("company_name", ""), "name": ""},
    ], s))

    doc.build(content)
    return fp


# ─────────────────────────────────────────────────────────────────
# Router helper — map doc_type → generator function
# ─────────────────────────────────────────────────────────────────
DOC_GENERATORS = {
    "invoice": generate_invoice_pdf,
    "proforma-invoice": generate_proforma_invoice_pdf,
    "packing-list": generate_packing_list_pdf,
    "shipping-instruction": generate_shipping_instruction_pdf,
    "surat-penawaran": generate_surat_penawaran_pdf,
    "sales-contract-buyer": generate_sales_contract_buyer_pdf,
    "kontrak-supplier": generate_kontrak_supplier_pdf,
    "surat-jalan": generate_surat_jalan_pdf,
    "perhitungan-biaya": generate_perhitungan_biaya_pdf,
}


def generate_doc(doc_type: str, data: dict) -> str:
    """Dispatch to the correct generator. Returns filepath."""
    fn = DOC_GENERATORS.get(doc_type)
    if not fn:
        raise ValueError(f"Unknown doc_type: {doc_type}")
    prefix = doc_type.replace("-", "_")
    filename = _auto_filename(prefix)
    return fn(data, filename)
