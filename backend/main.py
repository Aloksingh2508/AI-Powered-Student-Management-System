import os
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.config import settings
from backend.database import Base, engine, get_db
from backend.seed import seed_db
from backend import models
from backend import schemas
from backend import crud
from backend import auth
from backend import ai
from backend import export

# Automatically create tables / seed on startup if database is missing
db_filename = "student_results.db"
if not os.path.exists(db_filename):
    print("Database not found. Initializing and seeding...")
    seed_db()
else:
    Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

# CORS Middleware to support frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Authentication Endpoints ---

@app.post("/api/auth/register", response_model=schemas.UserResponse, tags=["Authentication"])
def register_user(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_username(db, user_data.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    if user_data.student_id:
        student = crud.get_student(db, user_data.student_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student ID does not exist")
    return crud.create_user(db, user_data)

@app.post("/api/auth/login", response_model=schemas.Token, tags=["Authentication"])
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    input_username = form_data.username
    
    # If the user typed an email, resolve it to their registered username or roll number
    if "@" in input_username:
        # Check if it is a student's email
        student_by_email = db.query(models.Student).filter(func.lower(models.Student.email) == func.lower(input_username)).first()
        if student_by_email:
            input_username = student_by_email.roll_number
        else:
            # Handle admin/teacher emails (e.g., admin@school.edu -> admin)
            prefix = input_username.split("@")[0]
            if prefix in ["admin", "teacher"]:
                input_username = prefix

    # Check if the username matches a Student's roll number
    student = db.query(models.Student).filter(func.lower(models.Student.roll_number) == func.lower(input_username)).first()
    
    if student:
        # If student exists, find or create their student User account
        user = db.query(models.User).filter(models.User.student_id == student.id).first()
        if not user:
            username = student.roll_number.lower()
            hashed_pwd = auth.get_password_hash(f"{student.roll_number}123")
            user = models.User(
                username=username,
                hashed_password=hashed_pwd,
                role="Student",
                student_id=student.id
            )
            db.add(user)
            db.commit()
            db.refresh(user)
    else:
        user = crud.get_user_by_username(db, input_username)
        if not user or not auth.verify_password(form_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    # Generate token
    access_token = auth.create_access_token(data={"sub": user.username, "role": user.role})
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": user.role,
        "username": user.username,
        "student_id": user.student_id
    }

@app.get("/api/auth/me", response_model=schemas.UserResponse, tags=["Authentication"])
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.post("/api/auth/google-login", response_model=schemas.Token, tags=["Authentication"])
def google_login(payload: dict, db: Session = Depends(get_db)):
    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    student = db.query(models.Student).filter(func.lower(models.Student.email) == func.lower(email)).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No student profile found with email: {email}."
        )
    user = db.query(models.User).filter(models.User.student_id == student.id).first()
    if not user:
        username = student.roll_number.lower()
        hashed_pwd = auth.get_password_hash(f"{student.roll_number}123")
        user = models.User(
            username=username,
            hashed_password=hashed_pwd,
            role="Student",
            student_id=student.id
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    access_token = auth.create_access_token(data={"sub": user.username, "role": user.role})
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": user.role,
        "username": user.username,
        "student_id": user.student_id
    }


# --- Students Endpoints ---

@app.get("/api/students", response_model=List[schemas.StudentResponse], tags=["Students"])
def list_students(
    search: Optional[str] = None, 
    class_name: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_teacher_or_admin)
):
    return crud.get_students(db, search, class_name)

@app.get("/api/students/{student_id}", response_model=schemas.StudentResponse, tags=["Students"])
def get_student(
    student_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # If student, restrict to viewing own record
    if current_user.role == "Student" and current_user.student_id != student_id:
        raise HTTPException(status_code=403, detail="Not authorized to view other profiles")
        
    student = crud.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@app.post("/api/students", response_model=schemas.StudentResponse, tags=["Students"])
def create_student(
    student_data: schemas.StudentCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_teacher_or_admin)
):
    existing = crud.get_student_by_roll_number(db, student_data.roll_number)
    if existing:
        raise HTTPException(status_code=400, detail="Student with this roll number already exists")
    
    # Create student
    student = crud.create_student(db, student_data)
    
    # Create matching user login if requested
    if student_data.create_account:
        username = student_data.roll_number.lower()
        password = student_data.password or f"{student_data.roll_number}123"
        user_create = schemas.UserCreate(
            username=username,
            password=password,
            role="Student",
            student_id=student.id
        )
        crud.create_user(db, user_create)
        
    return student

@app.put("/api/students/{student_id}", response_model=schemas.StudentResponse, tags=["Students"])
def update_student(
    student_id: int, 
    student_update: schemas.StudentUpdate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_teacher_or_admin)
):
    student = crud.update_student(db, student_id, student_update)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@app.delete("/api/students/{student_id}", tags=["Students"])
def delete_student(
    student_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_admin_user)
):
    success = crud.delete_student(db, student_id)
    if not success:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"detail": "Student deleted successfully"}


# --- Subjects Endpoints ---

@app.get("/api/subjects", response_model=List[schemas.SubjectResponse], tags=["Subjects"])
def list_subjects(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return crud.get_subjects(db)

@app.post("/api/subjects", response_model=schemas.SubjectResponse, tags=["Subjects"])
def create_subject(
    subject_data: schemas.SubjectCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_teacher_or_admin)
):
    existing = crud.get_subject_by_name(db, subject_data.name)
    if existing:
        raise HTTPException(status_code=400, detail="Subject already exists")
    return crud.create_subject(db, subject_data.name)


# --- Marks Endpoints ---

@app.get("/api/marks/student/{student_id}", response_model=List[schemas.MarkResponse], tags=["Marks"])
def get_student_marks(
    student_id: int, 
    semester: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role == "Student" and current_user.student_id != student_id:
        raise HTTPException(status_code=403, detail="Not authorized to view other grades")
        
    marks = crud.get_marks_for_student(db, student_id, semester)
    
    # Attach subject names for convenience
    response_marks = []
    for m in marks:
        rm = schemas.MarkResponse.from_orm(m)
        rm.subject_name = m.subject.name
        response_marks.append(rm)
    return response_marks

@app.post("/api/marks", response_model=schemas.MarkResponse, tags=["Marks"])
def enter_marks(
    mark_data: schemas.MarkCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_teacher_or_admin)
):
    student = crud.get_student(db, mark_data.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    subject = db.query(models.Subject).filter(models.Subject.id == mark_data.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
        
    db_mark = crud.create_or_update_mark(db, mark_data)
    
    # Clear AI cache when marks are modified
    cached_analyses = db.query(models.AIAnalysis).filter(models.AIAnalysis.student_id == mark_data.student_id).all()
    for analysis in cached_analyses:
        db.delete(analysis)
    db.commit()
    
    response = schemas.MarkResponse.from_orm(db_mark)
    response.subject_name = subject.name
    return response

@app.delete("/api/marks/{mark_id}", tags=["Marks"])
def remove_mark(
    mark_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_teacher_or_admin)
):
    success = crud.delete_mark(db, mark_id)
    if not success:
        raise HTTPException(status_code=404, detail="Mark record not found")
    return {"detail": "Mark deleted successfully"}

@app.get("/api/marks/report-card/{student_id}", response_model=schemas.ReportCardResponse, tags=["Marks"])
def get_report_card(
    student_id: int, 
    semester: str = "Semester 1",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role == "Student" and current_user.student_id != student_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this report card")
        
    student = crud.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    marks = crud.get_marks_for_student(db, student_id, semester)
    total_obtained, total_max, overall_pct, overall_grade = crud.calculate_student_percentage_and_grade(marks)
    class_rank = crud.get_student_rank_in_class(db, student_id, student.class_name, semester)
    
    mark_details = []
    for m in marks:
        pct = (m.marks_obtained / m.max_marks * 100) if m.max_marks > 0 else 0
        mark_details.append(schemas.MarkDetail(
            subject_name=m.subject.name,
            marks_obtained=m.marks_obtained,
            max_marks=m.max_marks,
            percentage=round(pct, 2),
            grade=crud.get_grade_from_percentage(pct)
        ))
        
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
        class_rank=class_rank
    )


# --- Dashboard & Analytics Endpoints ---

@app.get("/api/analytics/dashboard", response_model=schemas.DashboardStatsResponse, tags=["Analytics"])
def get_dashboard_stats(
    class_name: Optional[str] = None,
    semester: str = "Semester 1",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # If Student, restrict dashboard filters to their own class
    if current_user.role == "Student":
        student = crud.get_student(db, current_user.student_id)
        class_name = student.class_name
        
    return crud.get_dashboard_stats(db, class_name, semester)


# --- Export Endpoints ---

@app.get("/api/export/pdf/{student_id}", tags=["Exports"])
def download_pdf_report_card(
    student_id: int, 
    semester: str = "Semester 1",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role == "Student" and current_user.student_id != student_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    student = crud.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    marks = crud.get_marks_for_student(db, student_id, semester)
    if not marks:
        raise HTTPException(status_code=400, detail="No marks available to generate report card")
        
    total_obtained, total_max, overall_pct, overall_grade = crud.calculate_student_percentage_and_grade(marks)
    class_rank = crud.get_student_rank_in_class(db, student_id, student.class_name, semester)
    
    # Get/Generate Teacher Summary Remark
    summary_analysis = crud.get_latest_ai_analysis(db, student_id, "summary")
    if summary_analysis:
        comments = summary_analysis.content
    else:
        # Generate summary
        marks_dicts = [{"subject_name": m.subject.name, "marks_obtained": m.marks_obtained, "max_marks": m.max_marks} for m in marks]
        comments = ai.generate_report_card_summary(f"{student.first_name} {student.last_name}", marks_dicts)
        crud.save_ai_analysis(db, student_id, "summary", comments)
        
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
            "grade": crud.get_grade_from_percentage(pct)
        })
        
    pdf_data = export.export_student_pdf(
        student_info, marks_list, class_rank, overall_pct, overall_grade, comments
    )
    
    filename = f"report_card_{student.roll_number}_{semester.replace(' ', '_')}.pdf"
    return Response(
        content=pdf_data,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.get("/api/export/excel", tags=["Exports"])
def download_class_excel(
    class_name: str,
    semester: str = "Semester 1",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_teacher_or_admin)
):
    students = crud.get_students(db, class_name=class_name)
    if not students:
        raise HTTPException(status_code=404, detail="No students found in this class")
        
    export_list = []
    for s in students:
        marks = crud.get_marks_for_student(db, s.id, semester)
        total_obtained, total_max, overall_pct, overall_grade = crud.calculate_student_percentage_and_grade(marks)
        class_rank = crud.get_student_rank_in_class(db, s.id, class_name, semester)
        
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
        
    excel_data = export.export_class_excel(export_list, class_name, semester)
    filename = f"results_{class_name.replace(' ', '_')}_{semester.replace(' ', '_')}.xlsx"
    return Response(
        content=excel_data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# --- AI Features Endpoints ---

def get_student_marks_summary_dicts(db: Session, student_id: int, semester: str = "Semester 1") -> List[dict]:
    marks = crud.get_marks_for_student(db, student_id, semester)
    if not marks:
        raise HTTPException(status_code=400, detail="No marks available for AI analysis")
    return [{"subject_name": m.subject.name, "marks_obtained": m.marks_obtained, "max_marks": m.max_marks} for m in marks]

@app.get("/api/ai/analyze/{student_id}", tags=["AI Features"])
def get_ai_performance_analysis(
    student_id: int,
    semester: str = "Semester 1",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role == "Student" and current_user.student_id != student_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    student = crud.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    # Check cache first
    cached = crud.get_latest_ai_analysis(db, student_id, "feedback")
    if cached:
        return {"content": cached.content}
        
    marks = get_student_marks_summary_dicts(db, student_id, semester)
    content = ai.generate_performance_analysis(f"{student.first_name} {student.last_name}", student.class_name, semester, marks)
    crud.save_ai_analysis(db, student_id, "feedback", content)
    return {"content": content}

@app.get("/api/ai/recommendations/{student_id}", tags=["AI Features"])
def get_ai_recommendations(
    student_id: int,
    semester: str = "Semester 1",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role == "Student" and current_user.student_id != student_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    student = crud.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    cached = crud.get_latest_ai_analysis(db, student_id, "recommendation")
    if cached:
        return {"content": cached.content}
        
    marks = get_student_marks_summary_dicts(db, student_id, semester)
    content = ai.generate_study_recommendations(f"{student.first_name} {student.last_name}", marks)
    crud.save_ai_analysis(db, student_id, "recommendation", content)
    return {"content": content}

@app.get("/api/ai/risk-prediction/{student_id}", tags=["AI Features"])
def get_ai_risk_prediction(
    student_id: int,
    semester: str = "Semester 1",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role == "Student" and current_user.student_id != student_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    student = crud.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    cached = crud.get_latest_ai_analysis(db, student_id, "risk")
    if cached:
        try:
            return json.loads(cached.content)
        except Exception:
            pass
            
    marks = get_student_marks_summary_dicts(db, student_id, semester)
    risk_data = ai.predict_fail_risk(f"{student.first_name} {student.last_name}", marks)
    crud.save_ai_analysis(db, student_id, "risk", json.dumps(risk_data))
    return risk_data

@app.get("/api/ai/career-guidance/{student_id}", tags=["AI Features"])
def get_ai_career_guidance(
    student_id: int,
    semester: str = "Semester 1",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role == "Student" and current_user.student_id != student_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    student = crud.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    cached = crud.get_latest_ai_analysis(db, student_id, "career")
    if cached:
        return {"content": cached.content}
        
    marks = get_student_marks_summary_dicts(db, student_id, semester)
    content = ai.generate_career_guidance(f"{student.first_name} {student.last_name}", marks)
    crud.save_ai_analysis(db, student_id, "career", content)
    return {"content": content}

@app.post("/api/ai/chat", response_model=schemas.AIChatResponse, tags=["AI Features"])
def chat_assistant(
    chat_req: schemas.AIChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Context extraction
    student_id = chat_req.student_id
    if current_user.role == "Student":
        student_id = current_user.student_id
        
    context_str = "No specific student profile loaded."
    if student_id:
        student = crud.get_student(db, student_id)
        if student:
            marks = crud.get_marks_for_student(db, student_id, "Semester 1")
            total_obtained, total_max, overall_pct, overall_grade = crud.calculate_student_percentage_and_grade(marks)
            marks_summary = ", ".join([f"{m.subject.name}: {m.marks_obtained}/{m.max_marks}" for m in marks])
            context_str = (
                f"Student Name: {student.first_name} {student.last_name}\n"
                f"Class: {student.class_name}\n"
                f"Roll Number: {student.roll_number}\n"
                f"Grades: {marks_summary}\n"
                f"Overall Percentage: {overall_pct:.2f}%\n"
                f"Overall Grade: {overall_grade}\n"
            )
            
    reply = ai.generate_chat_response(chat_req.message, context_str, chat_req.chat_history)
    return schemas.AIChatResponse(reply=reply)

@app.get("/api/ai/class-insights", tags=["AI Features"])
def get_class_insights(
    class_name: str,
    semester: str = "Semester 1",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_teacher_or_admin)
):
    stats = crud.get_dashboard_stats(db, class_name, semester)
    students = crud.get_students(db, class_name=class_name)
    
    student_performances = []
    for s in students:
        marks = crud.get_marks_for_student(db, s.id, semester)
        _, _, pct, _ = crud.calculate_student_percentage_and_grade(marks)
        if marks:
            student_performances.append({
                "name": f"{s.first_name} {s.last_name}",
                "overall_percentage": pct
            })
            
    content = ai.generate_class_insights(class_name, stats, student_performances)
    return {"content": content}

@app.get("/api/ai/summary/{student_id}", tags=["AI Features"])
def get_ai_result_summary(
    student_id: int,
    semester: str = "Semester 1",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_teacher_or_admin)
):
    student = crud.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    cached = crud.get_latest_ai_analysis(db, student_id, "summary")
    if cached:
        return {"content": cached.content}
        
    marks = get_student_marks_summary_dicts(db, student_id, semester)
    content = ai.generate_report_card_summary(f"{student.first_name} {student.last_name}", marks)
    crud.save_ai_analysis(db, student_id, "summary", content)
    return {"content": content}
