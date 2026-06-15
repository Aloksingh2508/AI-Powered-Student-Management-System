import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression, LogisticRegression
from sqlalchemy.orm import Session
import logging

from backend.app.models.student import Student, Attendance
from backend.app.models.academic import Mark

logger = logging.getLogger(__name__)

# In-memory cache for trained models to avoid re-training on every request
_grade_model = None
_improve_model = None

def train_ml_models(db: Session):
    """
    Train Scikit-Learn regression and classification models using historical student data.
    Features used: [current_average, attendance_pct]
    Target 1: next_semester_average (Linear Regression)
    Target 2: has_improved (Logistic Regression classification)
    """
    global _grade_model, _improve_model
    try:
        # 1. Fetch students
        students = db.query(Student).all()
        data_rows = []

        for student in students:
            # Get Semester 1 marks
            s1_marks = [m.marks_obtained for m in student.marks if m.semester == "Semester 1"]
            s2_marks = [m.marks_obtained for m in student.marks if m.semester == "Semester 2"]
            
            # Get attendance average
            att_records = [100.0 if r.status == "Present" else (50.0 if r.status == "Late" else 0.0) 
                           for r in student.attendance_records]
            
            avg_attendance = np.mean(att_records) if att_records else 85.0
            
            if s1_marks and s2_marks:
                s1_avg = np.mean(s1_marks)
                s2_avg = np.mean(s2_marks)
                data_rows.append({
                    "s1_avg": s1_avg,
                    "attendance": avg_attendance,
                    "s2_avg": s2_avg,
                    "improved": 1 if s2_avg > s1_avg else 0
                })

        # Check if we have enough historical data to fit models
        if len(data_rows) >= 3:
            df = pd.DataFrame(data_rows)
            X = df[["s1_avg", "attendance"]]
            
            # Fit Grade Predictor
            y_grades = df["s2_avg"]
            _grade_model = LinearRegression()
            _grade_model.fit(X, y_grades)
            
            # Fit Improvement Classifier
            y_improved = df["improved"]
            if len(df["improved"].unique()) > 1:
                _improve_model = LogisticRegression()
                _improve_model.fit(X, y_improved)
            else:
                _improve_model = None
                
            logger.info(f"Successfully trained ML models with {len(data_rows)} student profiles.")
        else:
            logger.warning("Insufficient data to train Scikit-Learn models. Heuristic fallbacks will be used.")
            _grade_model = None
            _improve_model = None
            
    except Exception as e:
        logger.error(f"Error training machine learning models: {e}")
        _grade_model = None
        _improve_model = None


def predict_student_performance(db: Session, student_id: int) -> dict:
    """
    Predict future metrics for a specific student.
    Returns:
    - predicted_gpa/predicted_percentage
    - probability_of_improvement
    - risk_of_failure
    """
    global _grade_model, _improve_model
    
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        return {"error": "Student not found"}

    # Aggregate current metrics
    current_marks = [m.marks_obtained for m in student.marks if m.semester == "Semester 1"]
    current_avg = np.mean(current_marks) if current_marks else 70.0
    
    att_records = [100.0 if r.status == "Present" else (50.0 if r.status == "Late" else 0.0) 
                   for r in student.attendance_records]
    current_attendance = np.mean(att_records) if att_records else 85.0

    # ML Inference
    if _grade_model:
        # Prepare feature vector
        X_test = pd.DataFrame([[current_avg, current_attendance]], columns=["s1_avg", "attendance"])
        pred_grade = _grade_model.predict(X_test)[0]
        pred_grade = max(0.0, min(100.0, pred_grade)) # Clamp to [0, 100]
    else:
        # Heuristic fallback based on attendance impact
        attendance_impact = (current_attendance - 75.0) * 0.2
        pred_grade = current_avg + attendance_impact
        pred_grade = max(0.0, min(100.0, pred_grade))

    if _improve_model:
        X_test = pd.DataFrame([[current_avg, current_attendance]], columns=["s1_avg", "attendance"])
        prob_improve = _improve_model.predict_proba(X_test)[0][1] * 100.0
    else:
        # Heuristic fallback
        prob_improve = 50.0 + (current_attendance - 80.0) * 1.5
        prob_improve = max(5.0, min(95.0, prob_improve))

    # Calculate Failure Risk Score (probability of failing average < 40 or low attendance < 75)
    fail_risk = 0.0
    if current_avg < 45:
        fail_risk += 45
    if current_attendance < 75:
        fail_risk += 40
    
    # Random variance / fine-tuning risk based on predictions
    if pred_grade < 40:
        fail_risk += 35
    elif pred_grade < 55:
        fail_risk += 15
        
    fail_risk = max(5.0, min(100.0, fail_risk))
    
    # Calculate predicted CGPA (based on standard 10-point scale)
    predicted_cgpa = round(pred_grade / 9.5, 2) if pred_grade > 0 else 0.0
    predicted_cgpa = min(10.0, predicted_cgpa)

    return {
        "student_id": student_id,
        "current_semester_average": round(current_avg, 2),
        "current_attendance": round(current_attendance, 2),
        "predicted_next_semester_percentage": round(pred_grade, 2),
        "predicted_next_semester_cgpa": predicted_cgpa,
        "probability_of_improvement_pct": round(prob_improve, 2),
        "risk_of_failure_pct": round(fail_risk, 2),
        "risk_level": "High" if fail_risk >= 70 else ("Medium" if fail_risk >= 35 else "Low")
    }
