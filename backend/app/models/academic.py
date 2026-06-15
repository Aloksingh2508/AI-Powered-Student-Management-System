from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.database.connection import Base

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    code = Column(String, unique=True, index=True, nullable=False)

    marks = relationship("Mark", back_populates="subject", cascade="all, delete-orphan")
    exam_papers = relationship("ExamPaper", back_populates="subject", cascade="all, delete-orphan")

class Mark(Base):
    __tablename__ = "marks"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    marks_obtained = Column(Float, nullable=False)
    max_marks = Column(Float, default=100.0)
    semester = Column(String, default="Semester 1")  # Semester 1, Semester 2
    exam_type = Column(String, default="Final Exam")  # Quiz, Mid-Term, Final Exam

    student = relationship("Student", back_populates="marks")
    subject = relationship("Subject", back_populates="marks")

class ExamPaper(Base):
    __tablename__ = "exam_papers"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    difficulty = Column(String, nullable=False)  # Easy, Medium, Hard
    content = Column(Text, nullable=False)  # JSON string of questions
    created_at = Column(String, nullable=False)

    subject = relationship("Subject", back_populates="exam_papers")

class Scholarship(Base):
    __tablename__ = "scholarships"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=False)
    eligibility_min_percentage = Column(Float, nullable=False)
    eligibility_category = Column(String, default="All")  # All, SC, ST, OBC
    amount = Column(Float, nullable=False)
