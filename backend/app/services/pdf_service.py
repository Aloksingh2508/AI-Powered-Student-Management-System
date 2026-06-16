import io
from typing import List, Dict, Any
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from backend.app.config import settings

def export_student_pdf(
    student_info: Dict[str, Any], 
    marks_list: List[Dict[str, Any]], 
    rank: int, 
    percentage: float, 
    grade: str, 
    comments: str
) -> bytes:
    """
    Generates a high-quality PDF Report Card for a single student.
    """
    buffer = io.BytesIO()
    
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=letter, 
        rightMargin=36, 
        leftMargin=36, 
        topMargin=36, 
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#1A365D'),
        alignment=1, 
        spaceAfter=15
    )
    
    section_title_style = ParagraphStyle(
        'SectionTitle',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#2B6CB0'),
        spaceBefore=10,
        spaceAfter=5
    )
    
    cell_style = ParagraphStyle(
        'GridCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=12,
        textColor=colors.HexColor('#2D3748')
    )
    
    cell_bold_style = ParagraphStyle(
        'GridCellBold',
        parent=cell_style,
        fontName='Helvetica-Bold'
    )
    
    label_style = ParagraphStyle(
        'Label',
        parent=cell_style,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor('#4A5568')
    )

    story = []

    # Title Banner
    story.append(Paragraph(f"{settings.SCHOOL_NAME.upper()} - ACADEMIC PROGRESS REPORT", title_style))
    story.append(Spacer(1, 10))

    # Student Details Grid
    student_name = f"{student_info.get('first_name')} {student_info.get('last_name')}"
    details_data = [
        [
            Paragraph("Student Name:", label_style), Paragraph(student_name, cell_style),
            Paragraph("Roll Number:", label_style), Paragraph(student_info.get("roll_number"), cell_style)
        ],
        [
            Paragraph("Class / Section:", label_style), Paragraph(student_info.get("class_name"), cell_style),
            Paragraph("Date of Birth:", label_style), Paragraph(student_info.get("date_of_birth") or "N/A", cell_style)
        ],
        [
            Paragraph("Email Address:", label_style), Paragraph(student_info.get("email") or "N/A", cell_style),
            Paragraph("Contact No:", label_style), Paragraph(student_info.get("contact_number") or "N/A", cell_style)
        ]
    ]
    
    details_table = Table(details_data, colWidths=[110, 160, 100, 170])
    details_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    
    story.append(details_table)
    story.append(Spacer(1, 15))

    # Academic Marks Table Header
    story.append(Paragraph("Subject-Wise Academic Grades", section_title_style))
    story.append(Spacer(1, 5))
    
    marks_headers = [
        Paragraph("Subject Name", cell_bold_style),
        Paragraph("Marks Obtained", cell_bold_style),
        Paragraph("Max Marks", cell_bold_style),
        Paragraph("Percentage", cell_bold_style),
        Paragraph("Grade", cell_bold_style),
        Paragraph("Status", cell_bold_style)
    ]
    
    marks_data = [marks_headers]
    total_obtained = 0.0
    total_max = 0.0
    
    for m in marks_list:
        score = m.get("marks_obtained", 0)
        max_score = m.get("max_marks", 100)
        total_obtained += score
        total_max += max_score
        
        pct = (score / max_score * 100) if max_score > 0 else 0
        grade_str = m.get("grade", "-")
        status_str = "Pass" if grade_str != "F" else "Fail"
        
        marks_data.append([
            Paragraph(m.get("subject_name"), cell_style),
            Paragraph(str(score), cell_style),
            Paragraph(str(max_score), cell_style),
            Paragraph(f"{pct:.1f}%", cell_style),
            Paragraph(grade_str, cell_bold_style),
            Paragraph(status_str, cell_bold_style if status_str == "Pass" else ParagraphStyle('FailTxt', parent=cell_bold_style, textColor=colors.HexColor('#E53E3E')))
        ])
        
    marks_table = Table(marks_data, colWidths=[180, 80, 80, 80, 60, 60])
    marks_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#EDF2F7')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E0')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    
    story.append(marks_table)
    story.append(Spacer(1, 15))
    
    # Results Summary
    story.append(Paragraph("Performance Summary", section_title_style))
    story.append(Spacer(1, 5))
    
    summary_data = [
        [
            Paragraph("Total Marks:", label_style), Paragraph(f"{total_obtained} / {total_max}", cell_style),
            Paragraph("Overall Percentage:", label_style), Paragraph(f"{percentage:.2f}%", cell_style)
        ],
        [
            Paragraph("Final Grade:", label_style), Paragraph(grade, cell_bold_style),
            Paragraph("Class Rank:", label_style), Paragraph(f"Rank {rank}", cell_bold_style)
        ]
    ]
    
    summary_table = Table(summary_data, colWidths=[110, 160, 130, 140])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F7FAFC')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 15))

    # Comments Section
    story.append(Paragraph("Teacher's Remarks & AI Recommendations", section_title_style))
    story.append(Spacer(1, 5))
    
    comment_text = comments or "No comments available for this academic cycle."
    comment_box_style = ParagraphStyle(
        'CommentBox',
        parent=cell_style,
        fontSize=10,
        leading=14
    )
    
    comment_table = Table([[Paragraph(comment_text.replace('\n', '<br/>'), comment_box_style)]], colWidths=[540])
    comment_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), colors.HexColor('#F7FAFC')),
        ('GRID', (0,0), (0,0), 0.5, colors.HexColor('#CBD5E0')),
        ('TOPPADDING', (0,0), (0,0), 8),
        ('BOTTOMPADDING', (0,0), (0,0), 8),
        ('LEFTPADDING', (0,0), (0,0), 8),
        ('RIGHTPADDING', (0,0), (0,0), 8),
    ]))
    story.append(comment_table)
    story.append(Spacer(1, 30))
    
    # Signature Lines
    sig_data = [
        [
            Paragraph("________________________<br/>Class Teacher", label_style),
            Paragraph("", label_style),
            Paragraph("________________________<br/>Principal", label_style)
        ]
    ]
    sig_table = Table(sig_data, colWidths=[200, 140, 200])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
    ]))
    story.append(sig_table)

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


def export_student_resume(student_info: Dict[str, Any], cgpa: float, skills: str = "") -> bytes:
    """
    Generates an ATS-friendly, single-page professional resume for final-year students.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=54, # 0.75 inch margins for professional look
        leftMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    # ATS fonts & colors (Dark text, clean formatting)
    name_style = ParagraphStyle(
        'ResumeName',
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#1A202C'),
        alignment=1, # Center
        spaceAfter=4
    )
    
    contact_style = ParagraphStyle(
        'ResumeContact',
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#4A5568'),
        alignment=1,
        spaceAfter=15
    )
    
    section_hdr_style = ParagraphStyle(
        'ResumeSecHeader',
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=14,
        textColor=colors.HexColor('#2C5282'),
        spaceBefore=10,
        spaceAfter=4
    )
    
    body_style = ParagraphStyle(
        'ResumeBody',
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#2D3748')
    )
    
    body_bold_style = ParagraphStyle(
        'ResumeBodyBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    story = []

    # Name and Contacts header
    fullname = f"{student_info.get('first_name')} {student_info.get('last_name')}"
    story.append(Paragraph(fullname.upper(), name_style))
    
    email = student_info.get("email") or "student@edumind.edu"
    phone = student_info.get("contact_number") or "+91 99999 88888"
    roll = student_info.get("roll_number")
    cls = student_info.get("class_name")
    
    contact_text = f"Roll No: {roll} | {cls} | Email: {email} | Phone: {phone} | Location: Delhi, India"
    story.append(Paragraph(contact_text, contact_style))

    # --- EDUCATION SECTION ---
    story.append(Paragraph("EDUCATION", section_hdr_style))
    story.append(Table([[Paragraph("", body_style)]], colWidths=[504], rowHeights=[1], style=TableStyle([('LINEABOVE', (0,0), (-1,-1), 1, colors.HexColor('#2C5282'))])))
    story.append(Spacer(1, 4))
    
    edu_data = [
        [
            Paragraph(f"<b>{settings.SCHOOL_NAME}</b>", body_style),
            Paragraph("<b>Graduation: 2026</b>", ParagraphStyle('RightText', parent=body_style, alignment=2))
        ],
        [
            Paragraph(f"Coursework: Science & Mathematics (CBSE) | Cumulative CGPA: <b>{cgpa:.2f}/10.0</b>", body_style),
            Paragraph("", body_style)
        ]
    ]
    edu_table = Table(edu_data, colWidths=[380, 124])
    edu_table.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP'), ('LEFTPADDING', (0,0), (-1,-1), 0), ('RIGHTPADDING', (0,0), (-1,-1), 0), ('BOTTOMPADDING', (0,0), (-1,-1), 2)]))
    story.append(edu_table)
    story.append(Spacer(1, 10))

    # --- TECHNICAL SKILLS SECTION ---
    story.append(Paragraph("AREAS OF EXPERTISE & SKILLS", section_hdr_style))
    story.append(Table([[Paragraph("", body_style)]], colWidths=[504], rowHeights=[1], style=TableStyle([('LINEABOVE', (0,0), (-1,-1), 1, colors.HexColor('#2C5282'))])))
    story.append(Spacer(1, 4))
    
    skills_text = skills if skills else "Python, SQL, HTML, CSS, Javascript, React, Machine Learning, Data Analytics, Communication, Team Collaboration"
    story.append(Paragraph(f"<b>Core Technologies:</b> {skills_text}", body_style))
    story.append(Paragraph("<b>Tools & Frameworks:</b> FastAPI, Git, VS Code, Excel Data Modeling, OpenCV Basics", body_style))
    story.append(Spacer(1, 10))

    # --- ACADEMIC PROJECTS ---
    story.append(Paragraph("KEY ACADEMIC PROJECTS", section_hdr_style))
    story.append(Table([[Paragraph("", body_style)]], colWidths=[504], rowHeights=[1], style=TableStyle([('LINEABOVE', (0,0), (-1,-1), 1, colors.HexColor('#2C5282'))])))
    story.append(Spacer(1, 4))
    
    proj_data = [
        [
            Paragraph("<b>Student Analytics Console</b>", body_bold_style),
            Paragraph("Python, FastAPI, SQLite", ParagraphStyle('RightText', parent=body_style, alignment=2))
        ],
        [
            Paragraph("• Designed an API endpoint to parse student roster grades and calculate class rankings automatically.<br/>"
                      "• Integrated scikit-learn Linear Regression model to predict next semester marks using historical averages.", body_style),
            Paragraph("", body_style)
        ],
        [
            Paragraph("<b>Computer Vision Smart Attendance</b>", body_bold_style),
            Paragraph("OpenCV, NumPy", ParagraphStyle('RightText', parent=body_style, alignment=2))
        ],
        [
            Paragraph("• Developed face identification module using Haar Cascade classifiers to identify and log student presence.<br/>"
                      "• Reduced manual rolls logging overhead by 90% and verified attendance impact analytics.", body_style),
            Paragraph("", body_style)
        ]
    ]
    proj_table = Table(proj_data, colWidths=[380, 124])
    proj_table.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP'), ('LEFTPADDING', (0,0), (-1,-1), 0), ('RIGHTPADDING', (0,0), (-1,-1), 0), ('BOTTOMPADDING', (0,0), (-1,-1), 4)]))
    story.append(proj_table)
    story.append(Spacer(1, 10))

    # --- HONORS & EXTRACURRICULARS ---
    story.append(Paragraph("HONORS & ACHIEVEMENTS", section_hdr_style))
    story.append(Table([[Paragraph("", body_style)]], colWidths=[504], rowHeights=[1], style=TableStyle([('LINEABOVE', (0,0), (-1,-1), 1, colors.HexColor('#2C5282'))])))
    story.append(Spacer(1, 4))
    
    story.append(Paragraph("• <b>Academic Topper Badge</b>: Awarded for securing Rank #1 in Class Semester Evaluations.", body_style))
    story.append(Paragraph("• <b>Attendance Champion Badge</b>: Recognized for maintaining above 95% attendance record.", body_style))
    story.append(Paragraph("• Participated in School STEM Innovation Expo showcasing automated prediction analytics.", body_style))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
