from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Tuple, Dict
from datetime import datetime

from backend.app.models.auth import User
from backend.app.models.student import Student, Attendance
from backend.app.models.academic import Subject, Mark, ExamPaper, Scholarship
from backend.app.models.ai import AIAnalysis
from backend.app.models.gamification import Badge, StudentBadge
from backend.app.schemas import StudentCreate, StudentUpdate, MarkCreate, UserCreate, AttendanceCreate
from backend.app.services.auth_service import get_password_hash

# --- User CRUD ---
def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(func.lower(User.username) == func.lower(username)).first()

def create_user(db: Session, user: UserCreate) -> User:
    hashed_pwd = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        hashed_password=hashed_pwd,
        role=user.role,
        student_id=user.student_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- Student CRUD ---
def get_student(db: Session, student_id: int) -> Optional[Student]:
    return db.query(Student).filter(Student.id == student_id).first()

def get_student_by_roll_number(db: Session, roll_number: str) -> Optional[Student]:
    return db.query(Student).filter(func.lower(Student.roll_number) == func.lower(roll_number)).first()

def get_students(db: Session, search: Optional[str] = None, class_name: Optional[str] = None) -> List[Student]:
    query = db.query(Student)
    if class_name:
        query = query.filter(Student.class_name == class_name)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Student.first_name.ilike(search_filter)) |
            (Student.last_name.ilike(search_filter)) |
            (Student.roll_number.ilike(search_filter))
        )
    return query.all()

def create_student(db: Session, student: StudentCreate) -> Student:
    db_student = Student(
        roll_number=student.roll_number,
        first_name=student.first_name,
        last_name=student.last_name,
        class_name=student.class_name,
        email=student.email,
        contact_number=student.contact_number,
        date_of_birth=student.date_of_birth,
        category=student.category or "General"
    )
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

def update_student(db: Session, student_id: int, student_update: StudentUpdate) -> Optional[Student]:
    db_student = get_student(db, student_id)
    if not db_student:
        return None
    for key, value in student_update.dict(exclude_unset=True).items():
        setattr(db_student, key, value)
    db.commit()
    db.refresh(db_student)
    return db_student

def delete_student(db: Session, student_id: int) -> bool:
    db_student = get_student(db, student_id)
    if not db_student:
        return False
    db.delete(db_student)
    db.commit()
    return True

# --- Attendance CRUD ---
def get_attendance_for_student(db: Session, student_id: int) -> List[Attendance]:
    return db.query(Attendance).filter(Attendance.student_id == student_id).all()

def create_or_update_attendance(db: Session, record: AttendanceCreate) -> Attendance:
    existing = db.query(Attendance).filter(
        Attendance.student_id == record.student_id,
        Attendance.date == record.date
    ).first()
    
    if existing:
        existing.status = record.status
        existing.verified_by_face = record.verified_by_face
        db_record = existing
    else:
        db_record = Attendance(
            student_id=record.student_id,
            date=record.date,
            status=record.status,
            verified_by_face=record.verified_by_face
        )
        db.add(db_record)
        
    db.commit()
    db.refresh(db_record)
    
    # Auto-evaluate attendance badges
    evaluate_badges_for_student(db, record.student_id)
    return db_record

# --- Subject CRUD ---
def get_subjects(db: Session) -> List[Subject]:
    return db.query(Subject).all()

def get_subject_by_name(db: Session, name: str) -> Optional[Subject]:
    return db.query(Subject).filter(func.lower(Subject.name) == func.lower(name)).first()

def get_subject_by_code(db: Session, code: str) -> Optional[Subject]:
    return db.query(Subject).filter(func.lower(Subject.code) == func.lower(code)).first()

def create_subject(db: Session, name: str, code: str) -> Subject:
    db_subject = Subject(name=name, code=code)
    db.add(db_subject)
    db.commit()
    db.refresh(db_subject)
    return db_subject

# --- Mark CRUD ---
def get_marks_for_student(db: Session, student_id: int, semester: Optional[str] = None) -> List[Mark]:
    query = db.query(Mark).filter(Mark.student_id == student_id)
    if semester:
        query = query.filter(Mark.semester == semester)
    return query.all()

def get_mark_for_student_subject(db: Session, student_id: int, subject_id: int, semester: str) -> Optional[Mark]:
    return db.query(Mark).filter(
        Mark.student_id == student_id,
        Mark.subject_id == subject_id,
        Mark.semester == semester
    ).first()

def create_or_update_mark(db: Session, mark_data: MarkCreate) -> Mark:
    existing = get_mark_for_student_subject(
        db, mark_data.student_id, mark_data.subject_id, mark_data.semester
    )
    if existing:
        existing.marks_obtained = mark_data.marks_obtained
        existing.max_marks = mark_data.max_marks
        existing.exam_type = mark_data.exam_type or "Final Exam"
        db_record = existing
    else:
        db_record = Mark(
            student_id=mark_data.student_id,
            subject_id=mark_data.subject_id,
            marks_obtained=mark_data.marks_obtained,
            max_marks=mark_data.max_marks,
            semester=mark_data.semester,
            exam_type=mark_data.exam_type or "Final Exam"
        )
        db.add(db_record)
        
    db.commit()
    db.refresh(db_record)
    
    # Auto-evaluate badges on new marks entries
    evaluate_badges_for_student(db, mark_data.student_id)
    return db_record

def delete_mark(db: Session, mark_id: int) -> bool:
    db_mark = db.query(Mark).filter(Mark.id == mark_id).first()
    if not db_mark:
        return False
    db.delete(db_mark)
    db.commit()
    return True

# --- AI Analysis CRUD ---
def get_latest_ai_analysis(db: Session, student_id: int, analysis_type: str) -> Optional[AIAnalysis]:
    return db.query(AIAnalysis).filter(
        AIAnalysis.student_id == student_id,
        AIAnalysis.analysis_type == analysis_type
    ).order_by(AIAnalysis.id.desc()).first()

def save_ai_analysis(db: Session, student_id: int, analysis_type: str, content: str) -> AIAnalysis:
    # Clear older cache of this specific type
    db.query(AIAnalysis).filter(
        AIAnalysis.student_id == student_id,
        AIAnalysis.analysis_type == analysis_type
    ).delete()
    
    db_analysis = AIAnalysis(
        student_id=student_id,
        analysis_type=analysis_type,
        content=content,
        created_at=datetime.now().strftime("%Y-%m-%d")
    )
    db.add(db_analysis)
    db.commit()
    db.refresh(db_analysis)
    return db_analysis

# --- Complex Calculations & Analytics ---
def get_grade_from_percentage(pct: float) -> str:
    if pct >= 90: return "A+"
    if pct >= 80: return "A"
    if pct >= 70: return "B"
    if pct >= 60: return "C"
    if pct >= 50: return "D"
    if pct >= 40: return "E"
    return "F"

def calculate_student_percentage_and_grade(marks: List[Mark]) -> Tuple[float, float, float, str]:
    if not marks:
        return 0.0, 0.0, 0.0, "N/A"
    total_obtained = sum(m.marks_obtained for m in marks)
    total_max = sum(m.max_marks for m in marks)
    percentage = (total_obtained / total_max * 100) if total_max > 0 else 0.0
    grade = get_grade_from_percentage(percentage)
    return total_obtained, total_max, percentage, grade

def get_class_students_sorted_by_performance(db: Session, class_name: str, semester: str) -> List[Tuple[Student, float]]:
    students = db.query(Student).filter(Student.class_name == class_name).all()
    results = []
    for s in students:
        marks = get_marks_for_student(db, s.id, semester)
        _, _, pct, _ = calculate_student_percentage_and_grade(marks)
        results.append((s, pct))
    results.sort(key=lambda x: x[1], reverse=True)
    return results

def get_student_rank_in_class(db: Session, student_id: int, class_name: str, semester: str) -> int:
    sorted_students = get_class_students_sorted_by_performance(db, class_name, semester)
    for idx, (s, _) in enumerate(sorted_students):
        if s.id == student_id:
            return idx + 1
    return 1

def get_dashboard_stats(db: Session, class_name: Optional[str] = None, semester: str = "Semester 1") -> Dict:
    students = get_students(db, class_name=class_name)
    subjects = get_subjects(db)
    
    total_students = len(students)
    total_subjects = len(subjects)
    
    if total_students == 0:
        return {
            "total_students": 0,
            "total_subjects": total_subjects,
            "class_average": 0.0,
            "pass_rate": 0.0,
            "subject_performances": [],
            "toppers": []
        }
        
    all_student_pcts = []
    pass_count = 0
    fail_count = 0
    student_performances = []
    
    for s in students:
        marks = get_marks_for_student(db, s.id, semester)
        _, _, pct, grade = calculate_student_percentage_and_grade(marks)
        if marks:
            all_student_pcts.append(pct)
            student_performances.append({
                "student_id": s.id,
                "name": f"{s.first_name} {s.last_name}",
                "roll_number": s.roll_number,
                "class_name": s.class_name,
                "overall_percentage": pct
            })
            if grade != "F":
                pass_count += 1
            else:
                fail_count += 1
                
    class_average = sum(all_student_pcts) / len(all_student_pcts) if all_student_pcts else 0.0
    total_graded = pass_count + fail_count
    pass_rate = (pass_count / total_graded * 100) if total_graded > 0 else 100.0
    
    subject_performances = []
    for subj in subjects:
        query = db.query(Mark.marks_obtained, Mark.max_marks).join(Student).filter(
            Mark.subject_id == subj.id,
            Mark.semester == semester
        )
        if class_name:
            query = query.filter(Student.class_name == class_name)
        marks_list = query.all()
        
        if marks_list:
            sub_pcts = [(m[0]/m[1]*100) if m[1] > 0 else 0 for m in marks_list]
            avg_score = sum(sub_pcts) / len(sub_pcts)
        else:
            avg_score = 0.0
            
        subject_performances.append({
            "subject_name": subj.name,
            "average_score": round(avg_score, 2)
        })
        
    student_performances.sort(key=lambda x: x["overall_percentage"], reverse=True)
    toppers = student_performances[:3]
    
    return {
        "total_students": total_students,
        "total_subjects": total_subjects,
        "class_average": round(class_average, 2),
        "pass_rate": round(pass_rate, 2),
        "subject_performances": subject_performances,
        "toppers": toppers
    }

# --- Gamification Badges Evaluation ---
def award_badge(db: Session, student_id: int, badge_name: str):
    """Internal helper to award a badge if not already possessed."""
    badge = db.query(Badge).filter(Badge.name == badge_name).first()
    if not badge:
        return
        
    existing_award = db.query(StudentBadge).filter(
        StudentBadge.student_id == student_id,
        StudentBadge.badge_id == badge.id
    ).first()
    
    if not existing_award:
        award = StudentBadge(
            student_id=student_id,
            badge_id=badge.id,
            awarded_at=datetime.now().strftime("%Y-%m-%d")
        )
        db.add(award)
        db.commit()

def evaluate_badges_for_student(db: Session, student_id: int):
    """Automatically check and award badges based on marks and attendance."""
    student = get_student(db, student_id)
    if not student:
        return
        
    # 1. Attendance Champion (attendance >= 95%)
    att_records = get_attendance_for_student(db, student_id)
    if len(att_records) >= 5:
        presents = sum(1 for r in att_records if r.status == "Present")
        pct = (presents / len(att_records) * 100)
        if pct >= 95:
            award_badge(db, student_id, "Attendance Champion")
            
    # 2. Subject Expert (marks >= 95% on any subject)
    s1_marks = get_marks_for_student(db, student_id, "Semester 1")
    s2_marks = get_marks_for_student(db, student_id, "Semester 2")
    all_marks = s1_marks + s2_marks
    if any((m.marks_obtained / m.max_marks * 100) >= 95 for m in all_marks):
        award_badge(db, student_id, "Subject Expert")

    # 3. Top Performer (class rank = 1)
    if s1_marks:
        rank = get_student_rank_in_class(db, student_id, student.class_name, "Semester 1")
        if rank == 1:
            award_badge(db, student_id, "Top Performer")
            
    # 4. Fast Learner (Semester 2 average > Semester 1 average by 10% or more)
    if s1_marks and s2_marks:
        _, _, s1_pct, _ = calculate_student_percentage_and_grade(s1_marks)
        _, _, s2_pct, _ = calculate_student_percentage_and_grade(s2_marks)
        if s2_pct - s1_pct >= 10:
            award_badge(db, student_id, "Fast Learner")
