import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT

def generate_health_report(data, filename):
    doc = SimpleDocTemplate(filename, pagesize=A4, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor("#4C1D95"), # Purple-900 (NutriVision brand)
        alignment=TA_CENTER,
        spaceAfter=20
    )
    
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Heading2'],
        fontSize=18,
        textColor=colors.HexColor("#1E40AF"), # Blue-800
        spaceBefore=15,
        spaceAfter=10,
        borderPadding=5,
        backgroundColor=colors.HexColor("#EFF6FF")
    )

    sub_header_style = ParagraphStyle(
        'SubHeaderStyle',
        parent=styles['Heading3'],
        fontSize=14,
        textColor=colors.HexColor("#065F46"), # Emerald-800
        spaceBefore=10,
        spaceAfter=5
    )

    body_style = styles['BodyText']
    body_style.fontSize = 11
    body_style.leading = 14

    elements = []

    # Title
    elements.append(Paragraph("NutriVision Health Report", title_style))
    elements.append(Paragraph(f"Generated on: {data.get('timestamp', 'N/A')[:10]}", body_style))
    elements.append(Spacer(1, 0.2 * inch))

    # Patient Information
    elements.append(Paragraph("Patient Information", header_style))
    p_data = data.get('patient_data', {})
    patient_info = [
        [Paragraph(f"<b>Name:</b> {p_data.get('name', 'N/A')}", body_style), Paragraph(f"<b>Patient ID:</b> {data.get('patient_id', 'N/A')}", body_style)],
        [Paragraph(f"<b>Age:</b> {p_data.get('age', 'N/A')} yrs", body_style), Paragraph(f"<b>Gender:</b> {p_data.get('gender', 'N/A')}", body_style)],
        [Paragraph(f"<b>Height:</b> {p_data.get('height', 'N/A')} cm", body_style), Paragraph(f"<b>Weight:</b> {p_data.get('weight', 'N/A')} kg", body_style)],
        [Paragraph(f"<b>Location:</b> {p_data.get('location', 'N/A')}", body_style), ""]
    ]
    
    t = Table(patient_info, colWidths=[2.5 * inch, 2.5 * inch])
    t.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 0.2 * inch))

    # Assessment Results
    elements.append(Paragraph("Assessment Results", header_style))
    result = data.get('result', {})
    
    risk_color = "#10B981" # Green
    if result.get('risk_level') in ["Critical", "High"]:
        risk_color = "#EF4444" # Red
    elif result.get('risk_level') == "Moderate":
        risk_color = "#F59E0B" # Amber

    results_table = [
        [Paragraph("<b>Metric</b>", body_style), Paragraph("<b>Value</b>", body_style), Paragraph("<b>Status</b>", body_style)],
        [Paragraph("Body Mass Index (BMI)", body_style), Paragraph(f"{result.get('bmi', 0):.1f}", body_style), Paragraph(result.get('bmi_category', 'N/A'), body_style)],
        [Paragraph("Malnutrition Risk", body_style), Paragraph(f"{result.get('malnutrition_risk', 0)*100:.0f}%", body_style), Paragraph(f"<font color='{risk_color}'><b>{result.get('risk_level', 'N/A')}</b></font>", body_style)]
    ]
    
    rt = Table(results_table, colWidths=[2 * inch, 1.5 * inch, 1.5 * inch])
    rt.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F9FAFB")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (1, 1), (1, -1), 'CENTER'),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(rt)
    elements.append(Spacer(1, 0.3 * inch))

    # Health Schedule
    elements.append(Paragraph("Daily Fitness & Health Schedule", header_style))
    schedule_data = [
        ["06:00 – 06:30", "Wake Up & Hydrate", "Large glass of water (16-24 oz)"],
        ["06:30 – 07:00", "Morning Movement", "15-30 min workout (Yoga, Walking)"],
        ["07:30 – 08:00", "Balanced Breakfast", "Protein-rich (Eggs, Yogurt) + Fiber"],
        ["11:00 – 11:15", "Mid-Morning Boost", "Healthy snack (Fruit/Nuts) + Water"],
        ["12:30 – 13:15", "Nutritious Lunch", "50% Veg, 25% Protein, 25% Carbs"],
        ["13:15 – 13:30", "Post-Lunch Walk", "10-15 min to aid digestion"],
        ["16:00 – 16:15", "Afternoon Break", "Tea + Small healthy snack"],
        ["19:00 – 19:45", "Dinner", "Lighter, protein-focused meal"],
        ["21:00 – 22:00", "Digital Detox", "No screens to improve sleep"],
        ["22:00 – 06:00", "Sleep", "7-9 hours of quality recovery"]
    ]
    
    st = Table(schedule_data, colWidths=[1.2 * inch, 1.8 * inch, 2.5 * inch])
    st.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor("#F3F4F6")),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('LINEBELOW', (0, 0), (-1, -1), 0.5, colors.lightblue),
    ]))
    elements.append(st)
    
    elements.append(PageBreak())

    # Core Habits
    elements.append(Paragraph("Core Healthy Habits", header_style))
    habits = [
        "<b>Hydration Goal:</b> Aim to consume 3-4 liters of water throughout the day.",
        "<b>Movement Breaks:</b> Stand or move every 30-60 minutes if sedentary.",
        "<b>Pre-planning:</b> Set out workout clothes and snacks the night before.",
        "<b>Consistency over Intensity:</b> 20 mins daily is better than 2 hours once a week.",
        "<b>Mindful Eating:</b> Avoid processed food, focus on whole nutrient-dense meals."
    ]
    for habit in habits:
        elements.append(Paragraph(f"• {habit}", body_style))
        elements.append(Spacer(1, 0.05 * inch))

    # Recommendations
    elements.append(Paragraph("Personalized Guidance", header_style))
    recs = result.get('recommendations', {})
    
    if recs.get('daily_habits'):
        elements.append(Paragraph("Lifestyle Suggestions", sub_header_style))
        for r in recs['daily_habits']:
            elements.append(Paragraph(f"• {r.get('text', '')}", body_style))
            
    if recs.get('dietary_tips'):
        elements.append(Paragraph("Nutritional Guidance", sub_header_style))
        for r in recs['dietary_tips']:
            elements.append(Paragraph(f"• {r.get('text', '')}", body_style))
            
    if recs.get('next_steps'):
        elements.append(Paragraph("Next Steps & Monitoring", sub_header_style))
        for r in recs['next_steps']:
            elements.append(Paragraph(f"• {r.get('text', '')}", body_style))

    # Footer Disclaimer
    elements.append(Spacer(1, 0.5 * inch))
    elements.append(Paragraph("<hr/>", body_style))
    disclaimer = "<i>Disclaimer: This report is for informational purposes only and does not constitute medical advice. Please consult with a healthcare professional before making major lifestyle changes.</i>"
    elements.append(Paragraph(disclaimer, ParagraphStyle('Disclaimer', parent=body_style, fontSize=8, textColor=colors.grey, alignment=TA_CENTER)))

    doc.build(elements)
    return filename

if __name__ == "__main__":
    # Test data
    test_data = {
        "patient_id": "PAT-2403-1234",
        "timestamp": "2024-03-07T10:00:00",
        "patient_data": {
            "name": "John Doe",
            "age": "45",
            "gender": "Male",
            "height": "175",
            "weight": "85",
            "location": "New York"
        },
        "result": {
            "bmi": 27.8,
            "bmi_category": "Overweight",
            "risk_level": "Moderate",
            "malnutrition_risk": 0.35,
            "recommendations": {
                "daily_habits": [{"text": "Walk 30 mins daily"}],
                "dietary_tips": [{"text": "Reduce sugar intake"}],
                "next_steps": [{"text": "Check BP regularly"}]
            }
        }
    }
    generate_health_report(test_data, "test_report.pdf")
    print("Test report generated: test_report.pdf")
