from sqlalchemy import Column, Integer, String, Date, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database.connection import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    roll_number = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    class_name = Column(String, nullable=False)  # Class 10-A, Class 10-B
    email = Column(String, nullable=True)
    contact_number = Column(String, nullable=True)
    date_of_birth = Column(String, nullable=True)
    category = Column(String, default="General")  # General, OBC, SC, ST for scholarship eligibility
    academic_growth_trend = Column(String, default="Stable")  # Stable, Improving, Declining

    # Relationships
    user = relationship("User", back_populates="student", uselist=False, cascade="all, delete-orphan")
    marks = relationship("Mark", back_populates="student", cascade="all, delete-orphan")
    attendance_records = relationship("Attendance", back_populates="student", cascade="all, delete-orphan")
    badge_awards = relationship("StudentBadge", back_populates="student", cascade="all, delete-orphan")
    ai_analyses = relationship("AIAnalysis", back_populates="student", cascade="all, delete-orphan")

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    date = Column(String, nullable=False)  # YYYY-MM-DD
    status = Column(String, nullable=False)  # Present, Absent, Late
    verified_by_face = Column(Boolean, default=False)

    student = relationship("Student", back_populates="attendance_records")
