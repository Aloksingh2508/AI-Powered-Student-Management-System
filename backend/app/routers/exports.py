from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from typing import Optional

from backend.app.database.connection import get_db
import backend.app.services.crud_service as crud_service
import backend.app.services.auth_service as auth_service
import backend.app.services.pdf_service as pdf_service
import backend.app.services.excel_service as excel_service

router = APIRouter(prefix="/api/export", tags=["Exports"])

@router.get("/pdf/{student_id}")
def download_pdf_report_card(
    student_id: int, 
    semester: str = "Semester 1",
    token: Optional[str] = None, # Query token support for _blank downloads
    db: Session = Depends(get_db)
):
    # Retrieve current user from token
    if not token:
        raise HTTPException(status_code=401, detail="Token required")
    try:
        current_user = auth_service.get_current_user(token, db)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    if current_user.role == "Student" and current_user.student_id != student_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    student = crud_service.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    marks = crud_service.get_marks_for_student(db, student_id, semester)
    if not marks:
        raise HTTPException(status_code=400, detail="No marks available to generate report card")
        
    _, _, overall_pct, overall_grade = crud_service.calculate_student_percentage_and_grade(marks)
    class_rank = crud_service.get_student_rank_in_class(db, student_id, student.class_name, semester)
    
    # Get cached comments or construct placeholder
    summary_analysis = crud_service.get_latest_ai_analysis(db, student_id, "comments")
    comments = summary_analysis.content if summary_analysis else "Consistent engagement shown. Focus on review."
        
    student_info = {
        "roll_number": student.roll_number,
        "first_name": student.first_name,
        "last_name": student.last_name,
        "class_name": student.class_name,
        "email": student.email,
        "contact_number": student.contact_number,
        "date_of_birth": student.date_of_birth
    }
    
    marks_list = []
    for m in marks:
        pct = (m.marks_obtained / m.max_marks * 100) if m.max_marks > 0 else 0
        marks_list.append({
            "subject_name": m.subject.name,
            "marks_obtained": m.marks_obtained,
            "max_marks": m.max_marks,
            "grade": crud_service.get_grade_from_percentage(pct)
        })
        
    pdf_data = pdf_service.export_student_pdf(
        student_info, marks_list, class_rank, overall_pct, overall_grade, comments
    )
    
    filename = f"report_card_{student.roll_number}_{semester.replace(' ', '_')}.pdf"
    return Response(
        content=pdf_data,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/resume/{student_id}")
def download_ats_resume(
    student_id: int, 
    semester: str = "Semester 1",
    skills: Optional[str] = None,
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    if not token:
        raise HTTPException(status_code=401, detail="Token required")
    try:
        current_user = auth_service.get_current_user(token, db)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    if current_user.role == "Student" and current_user.student_id != student_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    student = crud_service.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    marks = crud_service.get_marks_for_student(db, student_id, semester)
    _, _, overall_pct, _ = crud_service.calculate_student_percentage_and_grade(marks)
    
    # Standard 10-point scale CGPA
    cgpa = min(10.0, overall_pct / 9.5) if overall_pct > 0 else 7.5
    
    student_info = {
        "roll_number": student.roll_number,
        "first_name": student.first_name,
        "last_name": student.last_name,
        "class_name": student.class_name,
        "email": student.email,
        "contact_number": student.contact_number
    }
    
    pdf_data = pdf_service.export_student_resume(student_info, cgpa, skills)
    
    filename = f"resume_{student.roll_number}.pdf"
    return Response(
        content=pdf_data,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/excel")
def download_class_excel(
    class_name: str,
    semester: str = "Semester 1",
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    if not token:
        raise HTTPException(status_code=401, detail="Token required")
    try:
        current_user = auth_service.get_current_user(token, db)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    if current_user.role == "Student":
        raise HTTPException(status_code=403, detail="Unauthorized")

    students = crud_service.get_students(db, class_name=class_name)
    if not students:
        raise HTTPException(status_code=404, detail="No students found in this class")
        
    export_list = []
    for s in students:
        marks = crud_service.get_marks_for_student(db, s.id, semester)
        total_obtained, total_max, overall_pct, overall_grade = crud_service.calculate_student_percentage_and_grade(marks)
        class_rank = crud_service.get_student_rank_in_class(db, s.id, class_name, semester)
        
        subjects_scores = {}
        for m in marks:
            subjects_scores[m.subject.name] = m.marks_obtained
            
        export_list.append({
            "roll_number": s.roll_number,
            "name": f"{s.first_name} {s.last_name}",
            "subjects": subjects_scores,
            "total": f"{total_obtained}/{total_max}" if marks else "N/A",
            "percentage": overall_pct if marks else "N/A",
            "grade": overall_grade if marks else "N/A",
            "rank": class_rank if marks else "N/A"
        })
        
    excel_data = excel_service.export_class_excel(export_list, class_name, semester)
    filename = f"results_{class_name.replace(' ', '_')}_{semester.replace(' ', '_')}.xlsx"
    return Response(
        content=excel_data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
