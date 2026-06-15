from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database.connection import Base

class Badge(Base):
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    icon = Column(String, nullable=False)  # Lucide icon name, e.g., "Award", "Zap"
    description = Column(String, nullable=False)

    awards = relationship("StudentBadge", back_populates="badge", cascade="all, delete-orphan")

class StudentBadge(Base):
    __tablename__ = "student_badges"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    badge_id = Column(Integer, ForeignKey("badges.id", ondelete="CASCADE"), nullable=False)
    awarded_at = Column(String, nullable=False)  # Date string

    student = relationship("Student", back_populates="badge_awards")
    badge = relationship("Badge", back_populates="awards")
