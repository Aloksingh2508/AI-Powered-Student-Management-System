from sqlalchemy import Column, Integer, String
from backend.app.database.connection import Base

class SchoolSettings(Base):
    __tablename__ = "school_settings"

    id = Column(Integer, primary_key=True, default=1)
    school_code = Column(String, nullable=True, default="")
    school_name = Column(String, nullable=True, default="EduMind AI School")
