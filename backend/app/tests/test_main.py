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
    
    print("\n==========================================================")
    print(" ALL BACKEND API MODULE TESTS COMPLETED SUCCESSFULLY! ")
    print("==========================================================")

if __name__ == "__main__":
    test_system_flow()
