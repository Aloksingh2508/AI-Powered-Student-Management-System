import sys
import os
from fastapi.testclient import TestClient

# Adjust path to enable imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.app.main import app

client = TestClient(app)

def test_system_flow():
    # 1. Login verification
    print("[TEST] Verifying login endpoints...")
    response = client.post("/api/auth/login", data={"username": "admin", "password": "admin123"})
    assert response.status_code == 200
    res_data = response.json()
    token = res_data["access_token"]
    assert res_data["role"] == "Admin"
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Get students
    print("[TEST] Verifying student retrieval...")
    response = client.get("/api/students", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) > 0
    
    # 3. Get student report card (student ID = 1, John Doe)
    print("[TEST] Verifying student report card metrics...")
    response = client.get("/api/marks/report-card/1?semester=Semester 1", headers=headers)
    assert response.status_code == 200
    report = response.json()
    assert report["student_id"] == 1
    assert "cgpa" in report
    assert "overall_percentage" in report
    
    # 4. Get ML predictions
    print("[TEST] Verifying Scikit-Learn predictions...")
    response = client.get("/api/ml/predict/1", headers=headers)
    assert response.status_code == 200
    prediction = response.json()
    assert "predicted_next_semester_percentage" in prediction
    assert "risk_level" in prediction
    
    # 5. Get AI scholarship recommendation
    print("[TEST] Verifying AI scholarship suggestions...")
    response = client.get("/api/ai/scholarships/1", headers=headers)
    assert response.status_code == 200
    
    # 6. Verify doubt solving chatbot
    print("[TEST] Verifying AI doubt solving chatbot...")
    response = client.post("/api/ai/chat", json={
        "message": "Explain my grade in Mathematics and suggest career ideas",
        "student_id": 1,
        "chat_history": []
    }, headers=headers)
    assert response.status_code == 200
    assert "reply" in response.json()
    
    # 7. Verify ATS Resume generator PDF
    print("[TEST] Verifying ATS Resume generator payload...")
    response = client.get(f"/api/export/resume/1?token={token}")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    
    # 8. Verify digital twin profile
    print("[TEST] Verifying Digital Academic Twin payload...")
    response = client.get("/api/ai/twin/1", headers=headers)
    assert response.status_code == 200
    assert "learning_speed" in response.json()
    
    # 9. Verify Forgot Password functionality
    print("[TEST] Verifying Forgot Password functionality...")
    # Query an existing student roll number from the database dynamically
    from backend.app.database.connection import SessionLocal
    from backend.app.models.student import Student
    db_session = SessionLocal()
    any_student = db_session.query(Student).first()
    db_session.close()
    
    if any_student:
        student_roll = any_student.roll_number
        # Student login with incorrect password should fail
        response = client.post("/api/auth/login", data={"username": student_roll, "password": "wrong_password"})
        assert response.status_code == 401
        
        # Request forgot password for student
        response = client.post("/api/auth/forgot-password", json={"username": student_roll})
        assert response.status_code == 200
        assert "submitted to the administrator" in response.json()["detail"]
        
        # Admin gets reset requests list
        response = client.get("/api/auth/reset-requests", headers=headers)
        assert response.status_code == 200
        requests = response.json()
        student_req = [r for r in requests if r["roll_number"] == student_roll]
        assert len(student_req) > 0
        user_id = student_req[0]["id"]
        
        # Admin approves reset request with a new password
        response = client.post(f"/api/auth/approve-reset/{user_id}", json={"new_password": "studentnew123"}, headers=headers)
        assert response.status_code == 200
        assert "approved and updated" in response.json()["detail"]
        
        # Student login with new password should succeed
        response = client.post("/api/auth/login", data={"username": student_roll, "password": "studentnew123"})
        assert response.status_code == 200
        assert response.json()["role"] == "Student"
    else:
        print("[WARN] No students found in database to test forgot password.")
    
    # 10. Verify Subject Management (Add and Delete)
    print("[TEST] Verifying Subject Management (Add and Delete)...")
    # Add subject
    response = client.post("/api/marks/subjects", json={"name": "History", "code": "HIST101"}, headers=headers)
    assert response.status_code == 200
    subject_id = response.json()["id"]
    
    # Verify in list
    response = client.get("/api/marks/subjects", headers=headers)
    assert response.status_code == 200
    subjects_list = [s["name"] for s in response.json()]
    assert "History" in subjects_list
    
    # Delete subject
    response = client.delete(f"/api/marks/subjects/{subject_id}", headers=headers)
    assert response.status_code == 200
    assert "deleted successfully" in response.json()["detail"]
    
    # Verify no longer in list
    response = client.get("/api/marks/subjects", headers=headers)
    assert response.status_code == 200
    subjects_list = [s["name"] for s in response.json()]
    assert "History" not in subjects_list
    
    print("\n==========================================================")
    print(" ALL BACKEND API MODULE TESTS COMPLETED SUCCESSFULLY! ")
    print("==========================================================")

if __name__ == "__main__":
    test_system_flow()
