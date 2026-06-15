from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="Student")  # Admin, Teacher, Student
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=True)

    student = relationship("Student", back_populates="user")

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    roll_number = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    class_name = Column(String, nullable=False)  # e.g., "Class 10-A"
    email = Column(String, nullable=True)
    contact_number = Column(String, nullable=True)
    date_of_birth = Column(String, nullable=True)

    user = relationship("User", back_populates="student", uselist=False, cascade="all, delete-orphan")
    marks = relationship("Mark", back_populates="student", cascade="all, delete-orphan")
    ai_analyses = relationship("AIAnalysis", back_populates="student", cascade="all, delete-orphan")

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)

    marks = relationship("Mark", back_populates="subject", cascade="all, delete-orphan")

class Mark(Base):
    __tablename__ = "marks"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    marks_obtained = Column(Float, nullable=False)
    max_marks = Column(Float, default=100.0)
    semester = Column(String, nullable=False)  # e.g., "Semester 1", "Finals"

    student = relationship("Student", back_populates="marks")
    subject = relationship("Subject", back_populates="marks")

    __table_args__ = (
        UniqueConstraint('student_id', 'subject_id', 'semester', name='_student_subject_semester_uc'),
    )

class AIAnalysis(Base):
    __tablename__ = "ai_analyses"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    analysis_type = Column(String, nullable=False)  # feedback, recommendation, risk, career, summary
    content = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), default=func.now())

    student = relationship("Student", back_populates="ai_analyses")
