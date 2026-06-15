from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict
import json

from backend.app.database.connection import get_db
from backend.app.models.academic import Scholarship
import backend.app.schemas as schemas
import backend.app.services.crud_service as crud_service
import backend.app.services.auth_service as auth_service
import backend.app.ai_modules.gemini_client as gemini_client

router = APIRouter(prefix="/api/ai", tags=["AI Features"])

def get_student_marks_summary_dicts(db: Session, student_id: int, semester: str = "Semester 1") -> List[dict]:
    marks = crud_service.get_marks_for_student(db, student_id, semester)
    if not marks:
        raise HTTPException(status_code=400, detail="No marks available for this student. Log marks first.")
    return [{"subject_name": m.subject.name, "marks_obtained": m.marks_obtained, "max_marks": m.max_marks} for m in marks]

@router.get("/coach/{student_id}")
def get_academic_coach(
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
        
    cached = crud_service.get_latest_ai_analysis(db, student_id, "coach")
    if cached:
        return {"content": cached.content}
        
    marks = get_student_marks_summary_dicts(db, student_id, semester)
    content = gemini_client.generate_performance_coach(f"{student.first_name} {student.last_name}", marks)
    crud_service.save_ai_analysis(db, student_id, "coach", content)
    return {"content": content}

@router.get("/career/{student_id}")
def get_career_recommendations(
    student_id: int, 
    semester: str = "Semester 1", 
    interests: str = "",
    db: Session = Depends(get_db), 
    current_user = Depends(auth_service.get_current_user)
):
    if current_user.role == "Student" and current_user.student_id != student_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    student = crud_service.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    cached = crud_service.get_latest_ai_analysis(db, student_id, "career")
    if cached:
        return {"content": cached.content}
        
    marks = get_student_marks_summary_dicts(db, student_id, semester)
    content = gemini_client.generate_career_recommendations(f"{student.first_name} {student.last_name}", marks, interests)
    crud_service.save_ai_analysis(db, student_id, "career", content)
    return {"content": content}

@router.get("/comments/{student_id}")
def get_teacher_comments(
    student_id: int, 
    semester: str = "Semester 1", 
    db: Session = Depends(get_db), 
    current_user = Depends(auth_service.get_teacher_or_admin)
):
    student = crud_service.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    cached = crud_service.get_latest_ai_analysis(db, student_id, "comments")
    if cached:
        return {"content": cached.content}
        
    marks = get_student_marks_summary_dicts(db, student_id, semester)
    content = gemini_client.generate_teacher_comment(f"{student.first_name} {student.last_name}", marks)
    crud_service.save_ai_analysis(db, student_id, "comments", content)
    return {"content": content}

@router.get("/parent-report/{student_id}")
def get_parent_report(
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
        
    cached = crud_service.get_latest_ai_analysis(db, student_id, "parent_report")
    if cached:
        return {"content": cached.content}
        
    marks = get_student_marks_summary_dicts(db, student_id, semester)
    
    # Calculate attendance
    att = crud_service.get_attendance_for_student(db, student_id)
    presents = sum(1 for r in att if r.status == "Present")
    attendance_pct = (presents / len(att) * 100) if att else 85.0
    
    content = gemini_client.generate_parent_report(f"{student.first_name} {student.last_name}", marks, attendance_pct)
    crud_service.save_ai_analysis(db, student_id, "parent_report", content)
    return {"content": content}

@router.get("/scholarships/{student_id}", response_model=List[schemas.ScholarshipResponse])
def get_scholarships(
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
    _, _, pct, _ = crud_service.calculate_student_percentage_and_grade(marks)
    
    # Query database for matches + AI enhancement recommendation
    scholarships = db.query(Scholarship).filter(
        Scholarship.eligibility_min_percentage <= pct
    ).all()
    
    # Check category eligibility
    matches = []
    for s in scholarships:
        if s.eligibility_category == "All" or s.eligibility_category == student.category:
            matches.append(s)
            
    # If DB is unseeded, query procedural matcher
    if not matches:
        procedural_list = gemini_client.generate_scholarship_recommendation(
            f"{student.first_name} {student.last_name}", pct, student.category
        )
        return [schemas.ScholarshipResponse(**s) for s in procedural_list]
        
    return matches

@router.post("/generate-exam")
def generate_exam(
    payload: schemas.ExamPaperCreate, 
    db: Session = Depends(get_db),
    current_user = Depends(auth_service.get_teacher_or_admin)
):
    subject = db.query(crud_service.Subject).filter(crud_service.Subject.id == payload.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
        
    exam_paper = gemini_client.generate_exam_paper(subject.name, payload.difficulty)
    return exam_paper

@router.get("/learning-path/{student_id}")
def get_learning_path(
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
        
    cached = crud_service.get_latest_ai_analysis(db, student_id, "learning_path")
    if cached:
        return {"content": cached.content}
        
    marks = get_student_marks_summary_dicts(db, student_id, semester)
    content = gemini_client.generate_learning_path(f"{student.first_name} {student.last_name}", marks)
    crud_service.save_ai_analysis(db, student_id, "learning_path", content)
    return {"content": content}

@router.post("/chat", response_model=schemas.AIChatResponse)
def solve_doubt(
    chat_req: schemas.AIChatRequest,
    db: Session = Depends(get_db),
    current_user = Depends(auth_service.get_current_user)
):
    student_id = chat_req.student_id
    if current_user.role == "Student":
        student_id = current_user.student_id
        
    context_str = "No specific student profile loaded."
    if student_id:
        student = crud_service.get_student(db, student_id)
        if student:
            marks = crud_service.get_marks_for_student(db, student_id, "Semester 1")
            _, _, overall_pct, overall_grade = crud_service.calculate_student_percentage_and_grade(marks)
            marks_summary = ", ".join([f"{m.subject.name}: {m.marks_obtained}/{m.max_marks}" for m in marks])
            context_str = (
                f"Student Name: {student.first_name} {student.last_name}\n"
                f"Class: {student.class_name}\n"
                f"Roll Number: {student.roll_number}\n"
                f"Grades: {marks_summary}\n"
                f"Overall Percentage: {overall_pct:.2f}%\n"
                f"Overall Grade: {overall_grade}\n"
            )
            
    reply = gemini_client.generate_doubt_reply(chat_req.message, context_str, chat_req.chat_history)
    return schemas.AIChatResponse(reply=reply)

@router.get("/twin/{student_id}")
def get_digital_twin(
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
        
    cached = crud_service.get_latest_ai_analysis(db, student_id, "twin")
    if cached:
        return json.loads(cached.content)
        
    marks = get_student_marks_summary_dicts(db, student_id, semester)
    
    # Calculate attendance
    att = crud_service.get_attendance_for_student(db, student_id)
    presents = sum(1 for r in att if r.status == "Present")
    attendance_pct = (presents / len(att) * 100) if att else 85.0
    
    twin_data = gemini_client.generate_digital_twin(f"{student.first_name} {student.last_name}", marks, attendance_pct)
    crud_service.save_ai_analysis(db, student_id, "twin", json.dumps(twin_data))
    return twin_data

@router.get("/badges/{student_id}", response_model=List[schemas.BadgeResponse])
def get_awarded_badges(
    student_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(auth_service.get_current_user)
):
    if current_user.role == "Student" and current_user.student_id != student_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    awards = db.query(crud_service.StudentBadge).filter(crud_service.StudentBadge.student_id == student_id).all()
    badges = []
    for a in awards:
        badges.append(schemas.BadgeResponse(
            name=a.badge.name,
            icon=a.badge.icon,
            description=a.badge.description,
            awarded_at=a.awarded_at
        ))
    return badges
