from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func
from sqlalchemy.orm import Session
from backend.app.database.connection import get_db
import backend.app.schemas as schemas
import backend.app.services.crud_service as crud_service
import backend.app.services.auth_service as auth_service
import backend.app.ai_modules.face_rec as face_rec

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# --- First-Time Admin Setup (One-Time Only) ---
@router.get("/setup-status")
def check_setup_status(db: Session = Depends(get_db)):
    """Check if the system needs first-time admin setup."""
    admin_exists = db.query(crud_service.User).filter(crud_service.User.role == "Admin").first()
    return {"needs_setup": admin_exists is None}

@router.post("/setup")
def first_time_admin_setup(payload: dict, db: Session = Depends(get_db)):
    """Create the very first admin account. Only works when no admin exists."""
    # Guard: if an admin already exists, block this endpoint permanently
    admin_exists = db.query(crud_service.User).filter(crud_service.User.role == "Admin").first()
    if admin_exists:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account already exists. This setup can only be used once."
        )

    username = (payload.get("username") or "").strip()
    password = (payload.get("password") or "").strip()
    confirm_password = (payload.get("confirm_password") or "").strip()

    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password are required.")
    if len(username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters.")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
    if password != confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    # Check for duplicate username
    existing = crud_service.get_user_by_username(db, username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken.")

    hashed_pwd = auth_service.get_password_hash(password)
    admin_user = crud_service.User(
        username=username,
        hashed_password=hashed_pwd,
        role="Admin",
        student_id=None
    )
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)

    # Auto-login: return a token so the admin is logged in immediately
    access_token = auth_service.create_access_token(data={"sub": admin_user.username, "role": admin_user.role})
    return {
        "detail": "Admin account created successfully!",
        "access_token": access_token,
        "token_type": "bearer",
        "role": admin_user.role,
        "username": admin_user.username,
        "student_id": None
    }

@router.post("/register", response_model=schemas.UserResponse)
def register_user(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud_service.get_user_by_username(db, user_data.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
        
    if user_data.student_id:
        student = crud_service.get_student(db, user_data.student_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student ID does not exist")
            
    return crud_service.create_user(db, user_data)

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    input_username = form_data.username
    
    # If the user typed an email, resolve it to their registered username or roll number
    if "@" in input_username:
        # Check if email belongs to a User directly (Admin/Teacher/Student user accounts)
        user_by_email = db.query(crud_service.User).filter(func.lower(crud_service.User.email) == func.lower(input_username)).first()
        if user_by_email:
            input_username = user_by_email.username
        else:
            # Check if it is a student's email from student profile
            student_by_email = db.query(crud_service.Student).filter(func.lower(crud_service.Student.email) == func.lower(input_username)).first()
            if student_by_email:
                input_username = student_by_email.roll_number
            else:
                # Handle legacy admin/teacher email defaults
                prefix = input_username.split("@")[0].lower()
                if prefix in ["admin", "teacher"]:
                    input_username = prefix

    # Check if the username matches a Student's roll number
    student = db.query(crud_service.Student).filter(func.lower(crud_service.Student.roll_number) == func.lower(input_username)).first()
    
    if student:
        # If student exists, find or create their student User account
        user = db.query(crud_service.User).filter(crud_service.User.student_id == student.id).first()
        if not user:
            username = student.roll_number.lower()
            hashed_pwd = auth_service.get_password_hash(f"{student.roll_number}123")
            user = crud_service.User(
                username=username,
                hashed_password=hashed_pwd,
                role="Student",
                student_id=student.id
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Verify the student's password
        if not auth_service.verify_password(form_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
    else:
        user = crud_service.get_user_by_username(db, input_username)
        if not user or not auth_service.verify_password(form_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    access_token = auth_service.create_access_token(data={"sub": user.username, "role": user.role})
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": user.role,
        "username": user.username,
        "student_id": user.student_id
    }

@router.post("/register-face")
def register_face(payload: dict, db: Session = Depends(get_db), current_user = Depends(auth_service.get_current_user)):
    """Extract and register face template for a student."""
    image_b64 = payload.get("image")
    student_id = payload.get("student_id")
    
    # Check permissions
    if current_user.role == "Student" and current_user.student_id != student_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    student = crud_service.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    # Get associated User
    user = db.query(crud_service.User).filter(crud_service.User.student_id == student_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student user account not found. Register user first.")
        
    # Process image with OpenCV
    img = face_rec.decode_base64_image(image_b64)
    if img is None:
        raise HTTPException(status_code=400, detail="Could not read webcam frame.")
        
    normalized_face_b64 = face_rec.extract_and_normalize_face(img)
    if not normalized_face_b64:
        raise HTTPException(status_code=400, detail="No face detected or image quality too low. Ensure adequate lighting.")
        
    # Save base64 face to db
    user.face_image_path = normalized_face_b64
    db.commit()
    return {"detail": "Face profile registered successfully!"}

@router.post("/face-login", response_model=schemas.Token)
def face_login(payload: dict, db: Session = Depends(get_db)):
    """Authenticate via OpenCV face comparison."""
    username = payload.get("username")
    image_b64 = payload.get("image")
    
    user = crud_service.get_user_by_username(db, username)
    if not user:
        raise HTTPException(status_code=404, detail="Username not found.")
        
    if not user.face_image_path:
        raise HTTPException(status_code=400, detail="No face registered on this account. Use password to log in first and register face.")
        
    probe_img = face_rec.decode_base64_image(image_b64)
    if probe_img is None:
        raise HTTPException(status_code=400, detail="Failed to capture webcam frame.")
        
    match = face_rec.verify_faces(user.face_image_path, probe_img)
    if not match:
        raise HTTPException(status_code=401, detail="Face authentication failed. Access Denied.")
        
    # Successful match
    access_token = auth_service.create_access_token(data={"sub": user.username, "role": user.role})
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": user.role,
        "username": user.username,
        "student_id": user.student_id
    }

@router.post("/google-login", response_model=schemas.Token)
def google_login(payload: dict, db: Session = Depends(get_db)):
    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    student = db.query(crud_service.Student).filter(func.lower(crud_service.Student.email) == func.lower(email)).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No student profile found with email: {email}."
        )
    
    user = db.query(crud_service.User).filter(crud_service.User.student_id == student.id).first()
    if not user:
        username = student.roll_number.lower()
        hashed_pwd = auth_service.get_password_hash(f"{student.roll_number}123")
        user = crud_service.User(
            username=username,
            hashed_password=hashed_pwd,
            role="Student",
            student_id=student.id
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    access_token = auth_service.create_access_token(data={"sub": user.username, "role": user.role})
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": user.role,
        "username": user.username,
        "student_id": user.student_id
    }

@router.post("/forgot-password")
def forgot_password(payload: dict, db: Session = Depends(get_db)):
    username = payload.get("username")
    if not username:
        raise HTTPException(status_code=400, detail="Username or Roll Number is required")
        
    # Find student by roll number
    student = db.query(crud_service.Student).filter(func.lower(crud_service.Student.roll_number) == func.lower(username)).first()
    
    user = None
    if student:
        user = db.query(crud_service.User).filter(crud_service.User.student_id == student.id).first()
        if not user:
            username_val = student.roll_number.lower()
            hashed_pwd = auth_service.get_password_hash(f"{student.roll_number}123")
            user = crud_service.User(
                username=username_val,
                hashed_password=hashed_pwd,
                role="Student",
                student_id=student.id
            )
            db.add(user)
            db.commit()
            db.refresh(user)
    else:
        user = crud_service.get_user_by_username(db, username)
        
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.role != "Student":
        raise HTTPException(status_code=400, detail="Only student accounts can request password resets.")
        
    # Flag that password reset is requested
    user.password_reset_requested = True
    db.commit()
    
    return {"detail": "Your password reset request has been submitted to the administrator."}

@router.get("/reset-requests")
def list_reset_requests(
    db: Session = Depends(get_db),
    current_user = Depends(auth_service.get_current_user)
):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Unauthorized. Only Admin can manage password requests.")
        
    requests = db.query(crud_service.User).filter(crud_service.User.password_reset_requested == True).all()
    
    result = []
    for r in requests:
        # Get student details if available
        student_name = ""
        roll_number = ""
        if r.student_id:
            student = db.query(crud_service.Student).filter(crud_service.Student.id == r.student_id).first()
            if student:
                student_name = f"{student.first_name} {student.last_name}"
                roll_number = student.roll_number
                
        result.append({
            "id": r.id,
            "username": r.username,
            "role": r.role,
            "student_name": student_name,
            "roll_number": roll_number
        })
    return result

@router.post("/approve-reset/{user_id}")
def approve_reset(
    user_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user = Depends(auth_service.get_current_user)
):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Unauthorized. Only Admin can manage password requests.")
        
    new_password = payload.get("new_password")
    if not new_password:
        raise HTTPException(status_code=400, detail="New password is required")
        
    user = db.query(crud_service.User).filter(crud_service.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Update password and clear request flag
    user.hashed_password = auth_service.get_password_hash(new_password)
    user.password_reset_requested = False
    db.commit()
    
    return {"detail": "Password reset approved and updated successfully."}

@router.post("/reject-reset/{user_id}")
def reject_reset(
    user_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(auth_service.get_current_user)
):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Unauthorized. Only Admin can manage password requests.")
        
    user = db.query(crud_service.User).filter(crud_service.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.password_reset_requested = False
    db.commit()
    
    return {"detail": "Password reset request rejected."}

@router.post("/change-password")
def change_password(
    payload: schemas.PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user = Depends(auth_service.get_current_user)
):
    """Allow any authenticated user to change their own password."""
    # Verify current password
    if not auth_service.verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    # Hash and update new password
    current_user.hashed_password = auth_service.get_password_hash(payload.new_password)
    db.commit()
    return {"detail": "Password changed successfully"}

@router.post("/create-user", response_model=schemas.UserResponse)
def admin_create_user(
    user_data: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user = Depends(auth_service.get_current_user)
):
    """Admin-only endpoint to register a new user account (Admin, Teacher, or Student)."""
    if current_user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrator accounts can register new users directly."
        )
        
    db_user = crud_service.get_user_by_username(db, user_data.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
        
    if user_data.student_id:
        student = crud_service.get_student(db, user_data.student_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student ID does not exist")
            
    return crud_service.create_user(db, user_data)

@router.get("/teachers", response_model=List[schemas.UserResponse])
def list_teachers(
    db: Session = Depends(get_db),
    current_user = Depends(auth_service.get_current_user)
):
    """Admin-only endpoint to list all teacher accounts."""
    if current_user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrator accounts can view the user list."
        )
    return db.query(crud_service.User).filter(crud_service.User.role == "Teacher").all()
