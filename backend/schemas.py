from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str
    student_id: Optional[int] = None

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    username: str
    role: str  # Admin, Teacher, Student

class UserCreate(UserBase):
    password: str
    student_id: Optional[int] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    student_id: Optional[int]

    class Config:
        from_attributes = True

# Student Schemas
class StudentBase(BaseModel):
    roll_number: str
    first_name: str
    last_name: str
    class_name: str
    email: Optional[EmailStr] = None
    contact_number: Optional[str] = None
    date_of_birth: Optional[str] = None

class StudentCreate(StudentBase):
    create_account: Optional[bool] = True
    password: Optional[str] = None  # Optional password for auto-created student account

class StudentUpdate(BaseModel):
    roll_number: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    class_name: Optional[str] = None
    email: Optional[EmailStr] = None
    contact_number: Optional[str] = None
    date_of_birth: Optional[str] = None

class StudentResponse(StudentBase):
    id: int

    class Config:
        from_attributes = True

# Subject Schemas
class SubjectBase(BaseModel):
    name: str

class SubjectCreate(SubjectBase):
    pass

class SubjectResponse(SubjectBase):
    id: int

    class Config:
        from_attributes = True

# Mark Schemas
class MarkBase(BaseModel):
    student_id: int
    subject_id: int
    marks_obtained: float
    max_marks: float = 100.0
    semester: str

class MarkCreate(MarkBase):
    pass

class MarkUpdate(BaseModel):
    marks_obtained: float

class MarkResponse(MarkBase):
    id: int
    subject_name: Optional[str] = None

    class Config:
        from_attributes = True

# Mark details specifically for report card
class MarkDetail(BaseModel):
    subject_name: str
    marks_obtained: float
    max_marks: float
    percentage: float
    grade: str

class ReportCardResponse(BaseModel):
    student_id: int
    roll_number: str
    first_name: str
    last_name: str
    class_name: str
    semester: str
    marks: List[MarkDetail]
    total_marks: float
    max_total_marks: float
    overall_percentage: float
    overall_grade: str
    class_rank: int

# AI Analysis Schemas
class AIAnalysisBase(BaseModel):
    student_id: int
    analysis_type: str
    content: str

class AIAnalysisCreate(AIAnalysisBase):
    pass

class AIAnalysisResponse(AIAnalysisBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class AIChatRequest(BaseModel):
    message: str
    student_id: Optional[int] = None
    chat_history: Optional[List[dict]] = None

class AIChatResponse(BaseModel):
    reply: str

# Analytics Schemas
class SubjectAverage(BaseModel):
    subject_name: str
    average_score: float

class PassFailStats(BaseModel):
    pass_count: int
    fail_count: int
    pass_rate: float

class TopperInfo(BaseModel):
    student_id: int
    name: str
    roll_number: str
    class_name: str
    overall_percentage: float

class DashboardStatsResponse(BaseModel):
    total_students: int
    total_subjects: int
    class_average: float
    pass_rate: float
    subject_performances: List[SubjectAverage]
    toppers: List[TopperInfo]
