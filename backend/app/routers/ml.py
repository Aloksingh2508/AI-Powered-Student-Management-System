from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database.connection import get_db
import backend.app.services.auth_service as auth_service
import backend.app.services.ml_service as ml_service

router = APIRouter(prefix="/api/ml", tags=["Machine Learning"])

@router.get("/predict/{student_id}")
def predict_student_marks(
    student_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(auth_service.get_current_user)
):
    """Predict next semester grades, improvement, and failure risk using Scikit-Learn."""
    if current_user.role == "Student" and current_user.student_id != student_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    predictions = ml_service.predict_student_performance(db, student_id)
    if "error" in predictions:
        raise HTTPException(status_code=404, detail=predictions["error"])
        
    return predictions

@router.post("/train")
def train_models(
    db: Session = Depends(get_db),
    current_user = Depends(auth_service.get_teacher_or_admin)
):
    """Re-train the Scikit-Learn ML models on current database records."""
    ml_service.train_ml_models(db)
    return {"detail": "Scikit-Learn models trained successfully!"}
