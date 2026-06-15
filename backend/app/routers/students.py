from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import csv
import io
from datetime import datetime

from backend.app.database.connection import get_db
import backend.app.schemas as schemas
import backend.app.services.crud_service as crud_service
import backend.app.services.auth_service as auth_service

router = APIRouter(prefix="/api/students", tags=["Students"])

@router.get("", response_model=List[schemas.StudentResponse])
def list_students(
    search: Optional[str] = None, 
    class_name: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(auth_service.get_teacher_or_admin)
):
    return crud_service.get_students(db, search, class_name)

@router.get("/{student_id}", response_model=schemas.StudentResponse)
def get_student(
    student_id: int, 
    db: Session = Depends(get_db),
    current_user = Depends(auth_service.get_current_user)
):
    if current_user.role == "Student" and current_user.student_id != student_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    student = crud_service.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@router.post("", response_model=schemas.StudentResponse)
def create_student(
    student_data: schemas.StudentCreate, 
    db: Session = Depends(get_db),
    current_user = Depends(auth_service.get_teacher_or_admin)
):
    existing = crud_service.get_student_by_roll_number(db, student_data.roll_number)
    if existing:
        raise HTTPException(status_code=400, detail="Student with this roll number already exists")
    
    student = crud_service.create_student(db, student_data)
    
    # Auto account creation
    if student_data.create_account:
        username = student_data.roll_number.lower()
        password = student_data.password or f"{student_data.roll_number}123"
        user_create = schemas.UserCreate(
            username=username,
            password=password,
            role="Student",
            student_id=student.id
        )
        crud_service.create_user(db, user_create)
    return student

@router.put("/{student_id}", response_model=schemas.StudentResponse)
def update_student(
    student_id: int, 
    student_update: schemas.StudentUpdate, 
    db: Session = Depends(get_db),
    current_user = Depends(auth_service.get_teacher_or_admin)
):
    student = crud_service.update_student(db, student_id, student_update)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@router.delete("/{student_id}")
def delete_student(
    student_id: int, 
    db: Session = Depends(get_db),
    current_user = Depends(auth_service.get_admin_user)
):
    success = crud_service.delete_student(db, student_id)
    if not success:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"detail": "Student deleted successfully"}

# --- CSV Import ---
@router.post("/import-csv")
async def import_students_csv(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user = Depends(auth_service.get_teacher_or_admin)
):
    """Import multiple student profiles from CSV."""
    contents = await file.read()
    buffer = io.StringIO(contents.decode('utf-8'))
    reader = csv.DictReader(buffer)
    
    imported_count = 0
    skipped_count = 0
    
    for row in reader:
        # Require columns: roll_number, first_name, last_name, class_name
        roll_num = row.get("roll_number")
        first = row.get("first_name")
        last = row.get("last_name")
        cls = row.get("class_name")
        
        if not (roll_num and first and last and cls):
            skipped_count += 1
            continue
            
        existing = crud_service.get_student_by_roll_number(db, roll_num)
        if existing:
            skipped_count += 1
            continue
            
        student_data = schemas.StudentCreate(
            roll_number=roll_num,
            first_name=first,
            last_name=last,
            class_name=cls,
            email=row.get("email"),
            contact_number=row.get("contact_number"),
            date_of_birth=row.get("date_of_birth"),
            category=row.get("category", "General"),
            create_account=True,
            password=f"{roll_num}123"
        )
        
        # Save student
        student = crud_service.create_student(db, student_data)
        
        # Save matching user
        user_create = schemas.UserCreate(
            username=roll_num.lower(),
            password=f"{roll_num}123",
            role="Student",
            student_id=student.id
        )
        crud_service.create_user(db, user_create)
        imported_count += 1
        
    return {"detail": f"CSV import finished: {imported_count} imported, {skipped_count} skipped."}

# --- Attendance Routes ---
@router.post("/attendance", response_model=schemas.AttendanceResponse)
def log_attendance(
    record: schemas.AttendanceCreate,
    db: Session = Depends(get_db),
    current_user = Depends(auth_service.get_teacher_or_admin)
):
    return crud_service.create_or_update_attendance(db, record)

@router.get("/attendance/student/{student_id}", response_model=List[schemas.AttendanceResponse])
def get_student_attendance(
    student_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(auth_service.get_current_user)
):
    if current_user.role == "Student" and current_user.student_id != student_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    return crud_service.get_attendance_for_student(db, student_id)
