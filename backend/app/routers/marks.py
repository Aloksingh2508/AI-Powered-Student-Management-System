from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.app.database.connection import get_db
import backend.app.schemas as schemas
import backend.app.services.crud_service as crud_service
import backend.app.services.auth_service as auth_service

router = APIRouter(prefix="/api/marks", tags=["Marks"])

@router.get("/subjects", response_model=List[schemas.SubjectResponse])
def list_subjects(
    db: Session = Depends(get_db),
    current_user = Depends(auth_service.get_current_user)
):
    return crud_service.get_subjects(db)

@router.post("/subjects", response_model=schemas.SubjectResponse)
def create_subject(
    subject_data: schemas.SubjectCreate, 
    db: Session = Depends(get_db),
    current_user = Depends(auth_service.get_teacher_or_admin)
):
    existing = crud_service.get_subject_by_name(db, subject_data.name)
    if existing:
        raise HTTPException(status_code=400, detail="Subject name already exists")
    existing_code = crud_service.get_subject_by_code(db, subject_data.code)
    if existing_code:
        raise HTTPException(status_code=400, detail="Subject code already exists")
    return crud_service.create_subject(db, subject_data.name, subject_data.code)

@router.get("/student/{student_id}", response_model=List[schemas.MarkResponse])
def get_student_marks(
    student_id: int, 
    semester: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(auth_service.get_current_user)
):
    if current_user.role == "Student" and current_user.student_id != student_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    marks = crud_service.get_marks_for_student(db, student_id, semester)
    response_marks = []
    for m in marks:
        rm = schemas.MarkResponse.from_orm(m)
        rm.subject_name = m.subject.name
        response_marks.append(rm)
    return response_marks

@router.post("", response_model=schemas.MarkResponse)
def enter_marks(
    mark_data: schemas.MarkCreate, 
    db: Session = Depends(get_db),
    current_user = Depends(auth_service.get_teacher_or_admin)
):
    student = crud_service.get_student(db, mark_data.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    subject = db.query(crud_service.Subject).filter(crud_service.Subject.id == mark_data.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
        
    db_mark = crud_service.create_or_update_mark(db, mark_data)
    
    response = schemas.MarkResponse.from_orm(db_mark)
    response.subject_name = subject.name
    return response

@router.get("/report-card/{student_id}", response_model=schemas.ReportCardResponse)
def get_report_card(
    student_id: int, 
    semester: str = "Semester 1",
    db: Session = Depends(get_db),
    current_user = Depends(auth_service.get_current_user)
):
    if current_user.role == "Student" and current_user.student_id != student_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    student = crud_service.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    marks = crud_service.get_marks_for_student(db, student_id, semester)
    total_obtained, total_max, overall_pct, overall_grade = crud_service.calculate_student_percentage_and_grade(marks)
    class_rank = crud_service.get_student_rank_in_class(db, student_id, student.class_name, semester)
    
    mark_details = []
    for m in marks:
        pct = (m.marks_obtained / m.max_marks * 100) if m.max_marks > 0 else 0
        mark_details.append(schemas.MarkDetail(
            subject_name=m.subject.name,
            marks_obtained=m.marks_obtained,
            max_marks=m.max_marks,
            percentage=round(pct, 2),
            grade=crud_service.get_grade_from_percentage(pct)
        ))
        
    # Cap CGPA to 10
    cgpa = round(overall_pct / 9.5, 2) if overall_pct > 0 else 0.0
    cgpa = min(10.0, cgpa)
        
    return schemas.ReportCardResponse(
        student_id=student.id,
        roll_number=student.roll_number,
        first_name=student.first_name,
        last_name=student.last_name,
        class_name=student.class_name,
        semester=semester,
        marks=mark_details,
        total_marks=round(total_obtained, 2),
        max_total_marks=round(total_max, 2),
        overall_percentage=round(overall_pct, 2),
        overall_grade=overall_grade,
        class_rank=class_rank,
        cgpa=cgpa
    )


# --- Dashboard Overview Endpoint ---
@router.get("/analytics/dashboard", response_model=schemas.DashboardStatsResponse, tags=["Analytics"])
def get_dashboard_stats(
    class_name: Optional[str] = None,
    semester: str = "Semester 1",
    db: Session = Depends(get_db),
    current_user = Depends(auth_service.get_current_user)
):
    if current_user.role == "Student":
        student = crud_service.get_student(db, current_user.student_id)
        class_name = student.class_name
        
    return crud_service.get_dashboard_stats(db, class_name, semester)


# --- Leaderboard Endpoint ---
@router.get("/analytics/leaderboard", tags=["Analytics"])
def get_leaderboard(
    class_name: Optional[str] = None,
    semester: str = "Semester 1",
    db: Session = Depends(get_db),
    current_user = Depends(auth_service.get_current_user)
):
    """Compile class or system-wide leaderboard based on overall percentage."""
    students = crud_service.get_students(db, class_name=class_name)
    leaderboard_data = []
    
    for s in students:
        marks = crud_service.get_marks_for_student(db, s.id, semester)
        _, _, pct, grade = crud_service.calculate_student_percentage_and_grade(marks)
        if marks:
            leaderboard_data.append({
                "student_id": s.id,
                "name": f"{s.first_name} {s.last_name}",
                "roll_number": s.roll_number,
                "class_name": s.class_name,
                "percentage": round(pct, 2),
                "grade": grade,
                "cgpa": min(10.0, round(pct / 9.5, 2))
            })
            
    # Sort descending
    leaderboard_data.sort(key=lambda x: x["percentage"], reverse=True)
    
    # Attach ranks
    for idx, item in enumerate(leaderboard_data):
        item["rank"] = idx + 1
        
    return leaderboard_data
