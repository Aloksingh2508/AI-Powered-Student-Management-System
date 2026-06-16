from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from backend.app.database.connection import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # Admin, Teacher, Student
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=True)
    face_image_path = Column(String, nullable=True)  # Path to saved face template image
    password_reset_requested = Column(Boolean, default=False, server_default="0")

    student = relationship("Student", back_populates="user")
