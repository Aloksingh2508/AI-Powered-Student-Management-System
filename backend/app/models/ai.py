from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database.connection import Base

class AIAnalysis(Base):
    __tablename__ = "ai_analyses"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    analysis_type = Column(String, index=True, nullable=False)  # twin, feedback, recommendation, risk, career, pathway
    content = Column(Text, nullable=False)  # JSON or plain markdown response
    created_at = Column(String, nullable=False)

    student = relationship("Student", back_populates="ai_analyses")
