import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import settings
from backend.app.database.connection import Base, engine, SessionLocal
from backend.app.routers import auth, students, marks, ai, ml, exports
from backend.app.services import ml_service

# Initialize Database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="EduMind AI - Student Result Management & Academic Intelligence Platform",
    description="Full-stack portfolio-ready EdTech platform utilizing FastAPI, React.js, Scikit-Learn, OpenCV, and Gemini AI.",
    version="1.0.0"
)

# CORS Middleware to support frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Bind Routers
app.include_router(auth.router)
app.include_router(students.router)
app.include_router(marks.router)
app.include_router(ai.router)
app.include_router(ml.router)
app.include_router(exports.router)

@app.on_event("startup")
def startup_event():
    """Trigger ML models training using database records on server boot."""
    db = SessionLocal()
    try:
        print("Training Scikit-Learn Machine Learning models on startup...")
        ml_service.train_ml_models(db)
    except Exception as e:
        print(f"Error training models during boot: {e}")
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Welcome to EduMind AI API Service! Check /docs for Swagger documentation."}
