from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from jinja2 import Environment, FileSystemLoader
import os

TEMPLATES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")
EXPORT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "exports")

def generate_invoice_pdf(data: dict, filename: str):
    """
    Generate a Commercial Invoice PDF using ReportLab.
    data: Dictionary containing UMKM profile and transaction details.
    """
    filepath = os.path.join(EXPORT_DIR, filename)
    doc = SimpleDocTemplate(filepath, pagesize=A4)
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=18,
        alignment=1, # Center
        spaceAfter=20
    )
    
    content = []
    
    # 1. Header
    content.append(Paragraph("COMMERCIAL INVOICE", title_style))
    content.append(Spacer(1, 12))
    
    # 2. Seller & Buyer Info Table
    header_data = [
        [Paragraph(f"<b>SELLER:</b><br/>{data['business_name']}<br/>{data['location']}"), 
         Paragraph(f"<b>INVOICE NO:</b> {data['invoice_no']}<br/><b>DATE:</b> {data['date']}")]
    ]
    t1 = Table(header_data, colWidths=[300, 200])
    t1.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    content.append(t1)
    content.append(Spacer(1, 12))
    
    # 3. Product Details Table
    items_data = [["No", "Description / HS Code", "Qty", "Unit Price", "Total (USD)"]]
    for i, item in enumerate(data['items'], 1):
        items_data.append([
            str(i),
            f"{item['desc']}\nHS Code: {item['hs_code']}",
            f"{item['qty']} {item['unit']}",
            f"${item['price']}",
            f"${item['qty'] * item['price']}"
        ])
    
    t2 = Table(items_data, colWidths=[30, 250, 70, 70, 80])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
        ('TEXTCOLOR', (0,0), (-1,0), colors.black),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    content.append(t2)
    
    # 4. Footer / Signature
    content.append(Spacer(1, 40))
    content.append(Paragraph(f"<b>Authorized Signature:</b><br/><br/><br/>______________________<br/>{data['owner_name']}", styles['Normal']))
    
    # Build PDF
    doc.build(content)
    return filepath

def generate_packing_list_pdf(data: dict, filename: str):
    """
    Generate a Packing List PDF using ReportLab.
    """
    filepath = os.path.join(EXPORT_DIR, filename)
    doc = SimpleDocTemplate(filepath, pagesize=A4)
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=18,
        alignment=1, # Center
        spaceAfter=20
    )
    
    content = []
    content.append(Paragraph("PACKING LIST", title_style))
    content.append(Spacer(1, 12))
    
    header_data = [
        [Paragraph(f"<b>SHIPPER:</b><br/>{data['business_name']}<br/>{data['location']}"), 
         Paragraph(f"<b>P/L NO:</b> {data['pl_no']}<br/><b>DATE:</b> {data['date']}")]
    ]
    t1 = Table(header_data, colWidths=[300, 200])
    t1.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ]))
    content.append(t1)
    content.append(Spacer(1, 12))
    
    # Packing Details Table
    items_data = [["No", "Description", "HS Code", "Net Weight", "Gross Weight", "Measurement"]]
    for i, item in enumerate(data['items'], 1):
        items_data.append([
            str(i),
            item['desc'],
            item['hs_code'],
            f"{item['net_weight']} kg",
            f"{item['gross_weight']} kg",
            item['measurement']
        ])
    
    t2 = Table(items_data, colWidths=[30, 150, 60, 80, 80, 90])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ]))
    content.append(t2)
    
    doc.build(content)
    return filepath
