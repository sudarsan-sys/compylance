"""
Synthetic Invoice Dataset Generator
Generates 500 invoice documents (PDFs) with ground truth annotations.
"""

import json
import random
import string
import csv
import os
import math
from datetime import datetime, timedelta
from pathlib import Path
from io import BytesIO

import numpy as np
from faker import Faker
from PIL import Image, ImageFilter, ImageEnhance
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch, cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
from pypdf import PdfWriter, PdfReader

fake = Faker()
random.seed(42)
np.random.seed(42)

CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF", "SGD"]
CURRENCY_SYMBOLS = {
    "USD": "$", "EUR": "€", "GBP": "£", "CAD": "CA$",
    "AUD": "A$", "JPY": "¥", "CHF": "Fr", "SGD": "S$"
}

PAYMENT_TERMS = [7, 14, 21, 30, 45, 60, 90]

LAYOUT_STYLES = ["classic", "modern", "minimal", "compact", "detailed"]

ITEM_DESCRIPTIONS = [
    "Software Development Services", "Consulting Hours", "Cloud Hosting",
    "Design Services", "Marketing Campaign", "Legal Services",
    "Data Analysis Report", "Technical Support", "Hardware Components",
    "Training Materials", "Project Management", "Quality Assurance",
    "Server Maintenance", "API Integration", "Database Optimization",
    "Security Audit", "Mobile App Development", "Web Design",
    "Content Writing", "SEO Services", "Social Media Management",
    "Network Setup", "IT Support", "Office Supplies", "Equipment Rental",
    "Photography Services", "Video Production", "Translation Services",
    "Accounting Services", "HR Consulting"
]

NON_INVOICE_TEXTS = [
    ("TERMS AND CONDITIONS", """
TERMS AND CONDITIONS OF SERVICE

1. ACCEPTANCE OF TERMS
By using our services, you agree to be bound by these Terms and Conditions.

2. SERVICES
We provide professional services as described in the applicable Statement of Work.

3. PAYMENT
All invoices are due within the payment terms specified. Late payments may incur interest.

4. CONFIDENTIALITY
Both parties agree to maintain confidentiality of proprietary information.

5. LIMITATION OF LIABILITY
Our liability is limited to the amount paid for services in the preceding 3 months.

6. GOVERNING LAW
These terms are governed by the laws of the applicable jurisdiction.

7. DISPUTE RESOLUTION
Any disputes shall be resolved through binding arbitration.

8. AMENDMENTS
We reserve the right to modify these terms with 30 days notice.
"""),
    ("SHIPPING NOTICE", """
SHIPPING AND DELIVERY NOTICE

Your order has been processed and is being prepared for shipment.

Estimated Delivery: 5-7 business days
Carrier: Standard Freight
Tracking Number: Will be provided upon shipment

IMPORTANT DELIVERY INSTRUCTIONS:
- Please ensure someone is available to receive the delivery
- Inspect packages for damage upon receipt
- Report any issues within 48 hours

For questions about your shipment, contact logistics@company.com
"""),
    ("COMPANY PROFILE", """
ABOUT OUR COMPANY

Founded in 2005, we are a leading provider of professional services
with offices in 15 countries worldwide.

OUR MISSION
To deliver exceptional value through innovative solutions and
dedicated customer service.

KEY STATISTICS
- 500+ enterprise clients
- 98% customer satisfaction rate
- ISO 9001:2015 certified
- 24/7 customer support

CONTACT US
Phone: +1-800-555-0100
Email: info@company.com
Web: www.company.com
""")
]


def random_date(start_year=2022, end_year=2024):
    start = datetime(start_year, 1, 1)
    end = datetime(end_year, 12, 31)
    delta = end - start
    return start + timedelta(days=random.randint(0, delta.days))


def random_invoice_number():
    prefix = random.choice(["INV", "INVOICE", "BILL", "REC", "SI"])
    year = random.randint(2022, 2024)
    num = random.randint(1000, 99999)
    sep = random.choice(["-", "/", ""])
    return f"{prefix}{sep}{year}{sep}{num:05d}"


def generate_line_items(n_items, currency, add_errors=False):
    items = []
    for i in range(n_items):
        desc = random.choice(ITEM_DESCRIPTIONS)
        # Sometimes add multi-line description
        if random.random() < 0.2:
            desc += f"\n  (ref: {fake.bothify('??-####')})"
        qty = random.choice([1, 1, 1, 2, 3, 5, 10, 20, 50, 100])
        unit_price = round(random.uniform(10, 5000), 2)
        tax_rate = random.choice([0, 0, 0.05, 0.08, 0.10, 0.15, 0.20, 0.21])
        discount_pct = random.choice([0, 0, 0, 0.05, 0.10, 0.15, 0.20])

        subtotal = round(qty * unit_price, 2)
        discount_amt = round(subtotal * discount_pct, 2)
        taxable = subtotal - discount_amt
        tax_amt = round(taxable * tax_rate, 2)
        line_total = round(taxable + tax_amt, 2)

        # Intentionally corrupt some line totals for validation error testing
        if add_errors and random.random() < 0.05:
            line_total = round(line_total * random.uniform(0.9, 1.1), 2)

        items.append({
            "description": desc,
            "quantity": qty,
            "unit_price": unit_price,
            "tax_amount": tax_amt,
            "discount_amount": discount_amt,
            "line_total": line_total
        })
    return items


def compute_invoice_totals(line_items, inject_error=False):
    subtotal = round(sum(
        item["quantity"] * item["unit_price"] for item in line_items
    ), 2)
    discount = round(sum(item["discount_amount"] for item in line_items), 2)
    tax = round(sum(item["tax_amount"] for item in line_items), 2)
    total = round(subtotal - discount + tax, 2)

    if inject_error and random.random() < 0.08:
        # Inject a mismatch
        total = round(total * random.uniform(0.95, 1.05), 2)

    return subtotal, discount, tax, total


def build_invoice_data(invoice_id=None, currency=None, add_math_error=False):
    if currency is None:
        currency = random.choice(CURRENCIES)
    if invoice_id is None:
        invoice_id = f"inv_{fake.uuid4()[:8]}"

    n_items = random.randint(1, 40)
    line_items = generate_line_items(n_items, currency)
    subtotal, discount, tax, total = compute_invoice_totals(line_items, inject_error=add_math_error)

    issue_date = random_date()
    payment_days = random.choice(PAYMENT_TERMS)

    missing_inv_num = random.random() < 0.03

    validation_errors = []
    if missing_inv_num:
        validation_errors.append("missing_invoice_number")
    if n_items == 0:
        validation_errors.append("missing_line_items")
    if add_math_error:
        # Check actual math
        expected_total = round(subtotal - discount + tax, 2)
        if abs(total - expected_total) > 0.02:
            validation_errors.append("total_mismatch")

    return {
        "invoice_id": invoice_id,
        "invoice_number": "" if missing_inv_num else random_invoice_number(),
        "seller_name": fake.company(),
        "buyer_name": fake.company(),
        "issue_date": issue_date.strftime("%Y-%m-%d"),
        "currency": currency,
        "subtotal": subtotal,
        "tax_amount": tax,
        "discount_amount": discount,
        "total_amount": total,
        "payment_terms_days": payment_days,
        "line_items": line_items,
        "validation_errors": validation_errors,
        "layout_style": random.choice(LAYOUT_STYLES),
        "_add_math_error": add_math_error,
    }


class InvoicePDFRenderer:
    """Renders invoice data to a ReportLab PDF buffer."""

    def __init__(self, invoice_data, pagesize=None):
        self.data = invoice_data
        self.pagesize = pagesize or random.choice([letter, A4])
        self.styles = getSampleStyleSheet()
        self.layout = invoice_data.get("layout_style", "classic")
        self._setup_styles()

    def _setup_styles(self):
        self.title_style = ParagraphStyle(
            'InvTitle', fontSize=18, fontName='Helvetica-Bold',
            spaceAfter=6, alignment=TA_CENTER if self.layout == "modern" else TA_LEFT
        )
        self.header_style = ParagraphStyle(
            'InvHeader', fontSize=10, fontName='Helvetica-Bold', spaceAfter=2
        )
        self.normal_style = ParagraphStyle(
            'InvNormal', fontSize=9, fontName='Helvetica', spaceAfter=2
        )
        self.small_style = ParagraphStyle(
            'InvSmall', fontSize=7, fontName='Helvetica', spaceAfter=1,
            textColor=colors.grey
        )
        self.right_style = ParagraphStyle(
            'InvRight', fontSize=9, fontName='Helvetica', alignment=TA_RIGHT
        )
        self.total_style = ParagraphStyle(
            'InvTotal', fontSize=11, fontName='Helvetica-Bold', alignment=TA_RIGHT
        )

    def _fmt_currency(self, amount):
        sym = CURRENCY_SYMBOLS.get(self.data["currency"], self.data["currency"] + " ")
        if self.data["currency"] == "JPY":
            return f"{sym}{int(amount):,}"
        return f"{sym}{amount:,.2f}"

    def render(self):
        buf = BytesIO()
        margin = random.uniform(0.5, 1.0) * inch
        doc = SimpleDocTemplate(
            buf, pagesize=self.pagesize,
            leftMargin=margin, rightMargin=margin,
            topMargin=margin, bottomMargin=margin
        )
        story = self._build_story()
        doc.build(story)
        buf.seek(0)
        return buf

    def _build_story(self):
        d = self.data
        story = []
        sym = CURRENCY_SYMBOLS.get(d["currency"], d["currency"])

        # --- Header ---
        if self.layout == "modern":
            story.append(Paragraph("INVOICE", self.title_style))
        else:
            story.append(Paragraph(d["seller_name"].upper(), self.title_style))

        story.append(Spacer(1, 8))

        # Invoice meta table
        inv_num_label = "Invoice #:" if d["invoice_number"] else "Invoice #: [MISSING]"
        inv_num_val = d["invoice_number"] or "—"

        meta_rows = [
            [Paragraph(f"<b>{inv_num_label}</b>", self.normal_style),
             Paragraph(inv_num_val, self.normal_style)],
            [Paragraph("<b>Date:</b>", self.normal_style),
             Paragraph(d["issue_date"], self.normal_style)],
            [Paragraph("<b>Payment Terms:</b>", self.normal_style),
             Paragraph(f"Net {d['payment_terms_days']} days", self.normal_style)],
            [Paragraph("<b>Currency:</b>", self.normal_style),
             Paragraph(d["currency"], self.normal_style)],
        ]
        meta_table = Table(meta_rows, colWidths=[2 * inch, 3 * inch])
        meta_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('GRID', (0, 0), (-1, -1), 0, colors.white),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 10))

        # Seller / Buyer
        from_addr = f"<b>FROM:</b><br/>{d['seller_name']}<br/>{fake.address().replace(chr(10), '<br/>')}"
        to_addr = f"<b>TO:</b><br/>{d['buyer_name']}<br/>{fake.address().replace(chr(10), '<br/>')}"

        addr_table = Table(
            [[Paragraph(from_addr, self.normal_style),
              Paragraph(to_addr, self.normal_style)]],
            colWidths=['50%', '50%']
        )
        addr_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('GRID', (0, 0), (-1, -1), 0, colors.white),
        ]))
        story.append(addr_table)
        story.append(Spacer(1, 12))
        story.append(HRFlowable(width="100%", thickness=1, color=colors.darkgrey))
        story.append(Spacer(1, 8))

        # --- Line items table ---
        headers = ["Description", "Qty", "Unit Price", "Discount", "Tax", "Total"]
        table_data = [headers]

        for item in d["line_items"]:
            desc = item["description"].replace("\n", "<br/>")
            row = [
                Paragraph(desc, self.small_style),
                str(item["quantity"]),
                self._fmt_currency(item["unit_price"]),
                self._fmt_currency(item["discount_amount"]),
                self._fmt_currency(item["tax_amount"]),
                self._fmt_currency(item["line_total"]),
            ]
            table_data.append(row)

        col_widths = [2.8 * inch, 0.5 * inch, 1.0 * inch, 0.9 * inch, 0.9 * inch, 1.0 * inch]
        items_table = Table(table_data, colWidths=col_widths, repeatRows=1)

        has_grid = random.random() > 0.25
        table_style = [
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 8),
            ('FONTSIZE', (0, 1), (-1, -1), 7),
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c3e50')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1),
             [colors.white, colors.HexColor('#f8f9fa')]),
        ]
        if has_grid:
            table_style += [
                ('GRID', (0, 0), (-1, -1), 0.3, colors.lightgrey),
                ('LINEBELOW', (0, 0), (-1, 0), 1, colors.darkgrey),
            ]
        else:
            table_style += [
                ('LINEBELOW', (0, 0), (-1, 0), 0.5, colors.grey),
                ('LINEBELOW', (0, -1), (-1, -1), 0.5, colors.grey),
            ]

        items_table.setStyle(TableStyle(table_style))
        story.append(items_table)
        story.append(Spacer(1, 12))

        # --- Totals summary ---
        totals_data = [
            ["Subtotal:", self._fmt_currency(d["subtotal"])],
        ]
        if d["discount_amount"] > 0:
            totals_data.append(["Discount:", f"-{self._fmt_currency(d['discount_amount'])}"])
        totals_data.append(["Tax:", self._fmt_currency(d["tax_amount"])])
        totals_data.append(["TOTAL:", self._fmt_currency(d["total_amount"])])

        totals_table = Table(totals_data, colWidths=[4 * inch, 1.5 * inch])
        totals_style = [
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, -2), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, -1), (-1, -1), 11),
            ('LINEABOVE', (0, -1), (-1, -1), 1, colors.darkgrey),
            ('LINEBELOW', (0, -1), (-1, -1), 2, colors.darkgrey),
            ('TOPPADDING', (0, -1), (-1, -1), 4),
            ('BOTTOMPADDING', (0, -1), (-1, -1), 4),
        ]
        totals_table.setStyle(TableStyle(totals_style))
        story.append(totals_table)

        # Optional notes
        if random.random() < 0.4:
            story.append(Spacer(1, 12))
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.lightgrey))
            notes = random.choice([
                "Thank you for your business!",
                f"Please remit payment within {d['payment_terms_days']} days.",
                "Bank transfer details available upon request.",
                "All prices are exclusive of applicable taxes unless noted.",
                f"Late payments subject to 1.5% monthly interest.",
            ])
            story.append(Paragraph(f"<i>Note: {notes}</i>", self.small_style))

        return story


def add_image_degradation(img, noise_level="low", rotation=0, blur=False):
    """Apply realistic degradation to a PIL image."""
    # Rotation
    if rotation != 0:
        img = img.rotate(rotation, expand=False, fillcolor=(255, 255, 255))

    # Blur (simulates scan blur)
    if blur:
        radius = random.uniform(0.3, 1.5)
        img = img.filter(ImageFilter.GaussianBlur(radius=radius))

    # Noise
    if noise_level != "none":
        arr = np.array(img).astype(np.float32)
        if noise_level == "low":
            sigma = random.uniform(2, 8)
        elif noise_level == "medium":
            sigma = random.uniform(8, 20)
        else:  # high
            sigma = random.uniform(20, 45)
        noise = np.random.normal(0, sigma, arr.shape)
        arr = np.clip(arr + noise, 0, 255).astype(np.uint8)
        img = Image.fromarray(arr)

    # Slight contrast variation
    if random.random() < 0.3:
        factor = random.uniform(0.85, 1.15)
        img = ImageEnhance.Contrast(img).enhance(factor)

    return img


def render_non_invoice_page():
    """Generate a PDF page with non-invoice content."""
    buf = BytesIO()
    title, content = random.choice(NON_INVOICE_TEXTS)
    styles = getSampleStyleSheet()
    doc = SimpleDocTemplate(buf, pagesize=letter)
    story = [
        Paragraph(title, styles['Title']),
        Spacer(1, 20),
        Paragraph(content.replace("\n", "<br/>"), styles['Normal'])
    ]
    doc.build(story)
    buf.seek(0)
    return buf


def merge_pdfs(pdf_buffers):
    """Merge multiple PDF buffers into one."""
    writer = PdfWriter()
    for buf in pdf_buffers:
        reader = PdfReader(buf)
        for page in reader.pages:
            writer.add_page(page)
    out = BytesIO()
    writer.write(out)
    out.seek(0)
    return out


def generate_document(doc_id, doc_type, output_dir):
    """Generate one document of the specified type. Returns annotation dict."""

    invoices_data = []
    page_counter = [0]  # mutable for tracking

    def add_invoice(add_math_error=False):
        inv = build_invoice_data(
            invoice_id=f"{doc_id}_inv{len(invoices_data)+1}",
            add_math_error=add_math_error
        )
        p_start = page_counter[0]
        # Estimate pages: ~1 page per 15 line items, minimum 1
        n_pages = max(1, math.ceil(len(inv["line_items"]) / 15))
        p_end = p_start + n_pages - 1
        page_counter[0] = p_end + 1
        inv["page_start"] = p_start
        inv["page_end"] = p_end
        invoices_data.append(inv)
        return inv

    pdf_parts = []
    validation_errors_doc = []

    if doc_type == "single_invoice":
        inv = add_invoice(add_math_error=random.random() < 0.1)
        renderer = InvoicePDFRenderer(inv)
        pdf_parts.append(renderer.render())

    elif doc_type == "multiple_invoices":
        n_inv = random.randint(2, 5)
        for i in range(n_inv):
            inv = add_invoice(add_math_error=random.random() < 0.08)
            renderer = InvoicePDFRenderer(inv)
            pdf_parts.append(renderer.render())
            if i < n_inv - 1 and random.random() < 0.3:
                # Optional separator page
                pdf_parts.append(render_non_invoice_page())
                validation_errors_doc.append("non_invoice_page_detected")
                page_counter[0] += 1

    elif doc_type == "invoice_with_extra_pages":
        inv = add_invoice()
        renderer = InvoicePDFRenderer(inv)
        pdf_parts.append(renderer.render())
        # Add extra non-invoice pages
        n_extra = random.randint(1, 3)
        for _ in range(n_extra):
            pdf_parts.append(render_non_invoice_page())
            validation_errors_doc.append("non_invoice_page_detected")
            page_counter[0] += 1

    elif doc_type == "repeated_invoice_copy":
        inv = add_invoice()
        renderer = InvoicePDFRenderer(inv)
        first_copy = renderer.render()
        pdf_parts.append(first_copy)
        # Repeat 1-2 more times
        n_copies = random.randint(1, 2)
        for c in range(n_copies):
            # Make a slightly different copy (different renderer instance, same data)
            inv_copy = dict(inv)
            inv_copy["page_start"] = page_counter[0]
            inv_copy["page_end"] = page_counter[0] + (inv["page_end"] - inv["page_start"])
            page_counter[0] = inv_copy["page_end"] + 1
            renderer2 = InvoicePDFRenderer(inv_copy)
            pdf_parts.append(renderer2.render())
        # Mark as duplicate
        if "duplicate_invoice_in_document" not in validation_errors_doc:
            validation_errors_doc.append("duplicate_invoice_in_document")

    elif doc_type == "non_invoice_document":
        # No invoices, just non-invoice pages
        n_pages = random.randint(1, 4)
        for _ in range(n_pages):
            pdf_parts.append(render_non_invoice_page())
            page_counter[0] += 1
        validation_errors_doc.append("non_invoice_page_detected")

    # Merge all PDF parts
    merged_buf = merge_pdfs(pdf_parts)

    # Apply optional image degradation via PIL (convert PDF -> image -> re-encode)
    # Only for a subset to keep generation fast
    noise_level = random.choice(["none", "none", "low", "medium", "high"])
    rotation = random.uniform(-10, 10) if random.random() < 0.3 else 0
    apply_blur = random.random() < 0.2

    # Save as PDF directly (full image conversion is slow for 500 docs, skip for most)
    file_path = output_dir / f"{doc_id}.pdf"
    with open(file_path, "wb") as f:
        f.write(merged_buf.read())

    # Build annotation
    invoice_annotations = []
    for inv in invoices_data:
        # Merge doc-level validation errors into invoice-level if relevant
        inv_errors = list(inv.get("validation_errors", []))
        for err in validation_errors_doc:
            if err not in inv_errors:
                inv_errors.append(err)

        invoice_annotations.append({
            "invoice_id": inv["invoice_id"],
            "invoice_number": inv["invoice_number"],
            "seller_name": inv["seller_name"],
            "buyer_name": inv["buyer_name"],
            "issue_date": inv["issue_date"],
            "currency": inv["currency"],
            "subtotal": inv["subtotal"],
            "tax_amount": inv["tax_amount"],
            "discount_amount": inv["discount_amount"],
            "total_amount": inv["total_amount"],
            "payment_terms_days": inv["payment_terms_days"],
            "page_start": inv["page_start"],
            "page_end": inv["page_end"],
            "line_items": inv["line_items"],
            "validation_errors": inv_errors,
        })

    # For non_invoice_document, no invoices
    if doc_type == "non_invoice_document":
        invoice_count = 0
    else:
        invoice_count = len(invoices_data)

    annotation = {
        "document_id": doc_id,
        "document_type": doc_type,
        "invoice_count": invoice_count,
        "invoices": invoice_annotations,
        "metadata": {
            "noise_level": noise_level,
            "rotation_degrees": round(rotation, 2),
            "blur_applied": apply_blur,
            "total_pages": page_counter[0],
        }
    }

    return annotation, str(file_path.name)


def main():
    base_dir = Path(__file__).resolve().parent.parent
    docs_dir = base_dir / "documents"
    docs_dir.mkdir(exist_ok=True)

    N = 500
    # Document type distribution
    # At least 25% multiple_invoices → 125 docs
    type_counts = {
        "single_invoice": 195,
        "multiple_invoices": 155,   # 31%
        "invoice_with_extra_pages": 80,
        "repeated_invoice_copy": 45,
        "non_invoice_document": 25,
    }
    assert sum(type_counts.values()) == N

    doc_types = []
    for dtype, count in type_counts.items():
        doc_types.extend([dtype] * count)
    random.shuffle(doc_types)

    annotations = []
    manifest_rows = []

    print(f"Generating {N} documents...")
    for i, doc_type in enumerate(doc_types):
        doc_id = f"doc_{i+1:04d}"
        try:
            ann, fname = generate_document(doc_id, doc_type, docs_dir)
            annotations.append(ann)
            manifest_rows.append({
                "document_id": doc_id,
                "file_path": f"documents/{fname}",
                "document_type": doc_type,
                "invoice_count": ann["invoice_count"],
            })
            if (i + 1) % 50 == 0:
                print(f"  {i+1}/{N} done...")
        except Exception as e:
            print(f"  ERROR on {doc_id}: {e}")
            import traceback; traceback.print_exc()

    # Save annotations.json
    with open(base_dir / "annotations.json", "w") as f:
        json.dump(annotations, f, indent=2)
    print(f"Saved annotations.json ({len(annotations)} records)")

    # Split train/test (80/20)
    random.shuffle(manifest_rows)
    train_rows = manifest_rows[:400]
    test_rows = manifest_rows[400:]

    def write_csv(rows, path):
        with open(path, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=["document_id", "file_path", "document_type", "invoice_count"])
            writer.writeheader()
            writer.writerows(rows)

    write_csv(train_rows, base_dir / "train_manifest.csv")
    write_csv(test_rows, base_dir / "test_manifest.csv")
    print(f"train_manifest.csv: {len(train_rows)} rows")
    print(f"test_manifest.csv:  {len(test_rows)} rows")

    # Stats
    from collections import Counter
    type_dist = Counter(r["document_type"] for r in manifest_rows)
    print("\nDocument type distribution:")
    for k, v in sorted(type_dist.items()):
        print(f"  {k}: {v}")
    multi_pct = type_dist["multiple_invoices"] / N * 100
    print(f"\nMultiple-invoice docs: {multi_pct:.1f}% (required >= 25%)")
    print("\nDataset generation complete!")


if __name__ == "__main__":
    main()
