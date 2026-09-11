import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def make_pdf(filename, title, customer, product, strength, batch, mfg, exp, qty, desc):
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    doc = SimpleDocTemplate(filename, pagesize=letter, leftMargin=40, rightMargin=40, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()
    story = []
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#0f172a'),
        fontName='Helvetica-Bold'
    )
    story.append(Paragraph('PHARMACEUTICAL QUALITY ASSURANCE - COMPLAINT REPORT', title_style))
    story.append(Paragraph('<font color="#64748b" size="9">Form QMS-QA-089 / Regulatory Customer Incident Intake</font>', styles['Normal']))
    story.append(Spacer(1, 15))
    
    data = [
        ['Customer / Facility:', customer, 'Date Received:', '2026-09-10'],
        ['Product Name:', product, 'Grade / Strength:', strength],
        ['Batch / Lot Number:', batch, 'Quantity Affected:', qty],
        ['Manufacturing Date:', mfg, 'Expiry Date:', exp],
        ['Complaint Classification:', 'Packaging Defect / Seal Integrity', 'Intake Source:', 'Field Quality Incident Report']
    ]
    
    t = Table(data, colWidths=[140, 160, 120, 110])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#1e293b')),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
    ]))
    story.append(t)
    story.append(Spacer(1, 15))
    
    story.append(Paragraph('<b>Detailed Incident & Defect Description:</b>', styles['Heading3']))
    story.append(Spacer(1, 4))
    desc_style = ParagraphStyle('Desc', parent=styles['Normal'], fontSize=9.5, leading=14, textColor=colors.HexColor('#334155'))
    story.append(Paragraph(desc, desc_style))
    story.append(Spacer(1, 15))
    
    story.append(Paragraph('<b>Immediate Corrective Actions Requested:</b>', styles['Heading3']))
    story.append(Paragraph('1. Request immediate quarantine advisory for batch lot in central repository.<br/>2. Issue Return Material Authorization (RMA) and arrange pickup of affected drums for QC investigation.<br/>3. Expedite replacement shipment to prevent API formulation downtime.', desc_style))
    
    doc.build(story)
    print(f'Successfully built {filename}')

if __name__ == '__main__':
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'sample_data'))
    
    make_pdf(
        os.path.join(base_dir, 'metformin_complaint_report.pdf'),
        'METFORMIN HYDROCHLORIDE API COMPLAINT',
        'Medico Pharma Labs Ltd.',
        'Metformin hydrochloride API',
        'IP/BP',
        'MFH260712A',
        '2026-02-10',
        '2029-02-09',
        '100 kg (4 HDPE drums)',
        'During raw material incoming quality control inspection of Metformin hydrochloride API, lot MFH260712A, our receiving warehouse noted that 2 out of 4 HDPE drums had broken tamper-evident seals and breached inner polyethylene liners. Possible foreign particulate ingress and moisture exposure noted.'
    )

    make_pdf(
        os.path.join(base_dir, 'sample_complaint_pdf.pdf'),
        'AMOXICILLIN CAPSULES QUALITY COMPLAINT',
        'Apollo Pharmacy',
        'Amoxicillin Capsules',
        '500 mg',
        'BMX24602',
        '2026-04-12',
        '2028-04-11',
        '48 capsules (4 blister packs)',
        'Apollo Pharmacy dispensing branch #14 reported discolored capsules in Amoxicillin capsules 500 mg from batch BMX24602. Multiple capsules showed mottled brownish spots and softened gelatin shell integrity. Customer returned unit for QA investigation.'
    )
