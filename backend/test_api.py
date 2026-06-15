import json
import os
import sys

# Add both workspace root and backend directory to path to support execution namespaces
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_system():
    print("==========================================================")
    print(" Running Automated API Verification Suite...")
    print("==========================================================\n")

    # 1. Test Login Endpoint
    print("[TEST] Verifying Admin Login Endpoint...")
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    response = client.post("/api/auth/login", data=login_data)
    assert response.status_code == 200, f"Login failed: {response.text}"
    token_data = response.json()
    assert "access_token" in token_data, "No access token in response"
    assert token_data["role"] == "Admin", "Admin role mismatch"
    token = token_data["access_token"]
    print(" [SUCCESS] Login verified. Token received.")

    # Headers for authenticated requests
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Test Students list
    print("\n[TEST] Verifying Students List Retrieval...")
    response = client.get("/api/students", headers=headers)
    assert response.status_code == 200, f"Failed to list students: {response.text}"
    students = response.json()
    assert len(students) > 0, "No students returned"
    print(f" [SUCCESS] Retreived {len(students)} student profiles.")

    # 3. Test Student Creation
    print("\n[TEST] Verifying Student Creation & Account Seeding...")
    new_student = {
        "roll_number": "S1099",
        "first_name": "Test",
        "last_name": "User",
        "class_name": "Class 10-A",
        "email": "test.user@school.edu",
        "contact_number": "1234567890",
        "date_of_birth": "2010-01-01",
        "create_account": True,
        "password": "testuser123"
    }
    response = client.post("/api/students", json=new_student, headers=headers)
    assert response.status_code == 200, f"Failed to create student: {response.text}"
    student_res = response.json()
    student_id = student_res["id"]
    assert student_res["roll_number"] == "S1099"
    print(" [SUCCESS] New student created.")

    # 4. Test Student Login (Verify automated account creation)
    print("\n[TEST] Verifying Auto-Created Student Account Login...")
    student_login = {
        "username": "s1099",
        "password": "testuser123"
    }
    response = client.post("/api/auth/login", data=student_login)
    assert response.status_code == 200, f"Student login failed: {response.text}"
    stu_token_data = response.json()
    assert stu_token_data["role"] == "Student"
    assert stu_token_data["student_id"] == student_id
    print(" [SUCCESS] Student account login validated.")

    # 5. Test Marks Report Card
    print("\n[TEST] Verifying Report Card Performance Calculations (John Doe)...")
    response = client.get("/api/marks/report-card/1?semester=Semester 1", headers=headers)
    assert response.status_code == 200, f"Failed to fetch report card: {response.text}"
    report = response.json()
    assert report["student_id"] == 1
    assert "overall_percentage" in report
    assert "class_rank" in report
    print(f" [SUCCESS] Percentage: {report['overall_percentage']}%, Class Rank: {report['class_rank']}.")

    # 6. Test Exports PDF
    print("\n[TEST] Verifying PDF Report Card Generator payload...")
    response = client.get("/api/export/pdf/1?semester=Semester 1", headers=headers)
    assert response.status_code == 200, "Failed to generate PDF"
    assert response.headers["content-type"] == "application/pdf"
    assert len(response.content) > 0, "PDF payload empty"
    print(f" [SUCCESS] PDF Report Card generated successfully ({len(response.content)} bytes).")

    # 7. Test Exports Excel
    print("\n[TEST] Verifying Excel Roster Generator payload...")
    response = client.get("/api/export/excel?class_name=Class 10-A&semester=Semester 1", headers=headers)
    assert response.status_code == 200, "Failed to generate Excel"
    assert response.headers["content-type"] == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    assert len(response.content) > 0, "Excel payload empty"
    print(f" [SUCCESS] Excel Roster compiled successfully ({len(response.content)} bytes).")

    # 8. Test AI Fallback/Live Endpoints
    print("\n[TEST] Verifying AI Performance Analysis Fallback...")
    response = client.get("/api/ai/analyze/1?semester=Semester 1", headers=headers)
    assert response.status_code == 200, f"AI analysis failed: {response.text}"
    ai_feedback = response.json()
    assert "content" in ai_feedback
    print(" [SUCCESS] AI Feedback retrieved.")

    print("\n[TEST] Verifying AI Academic Chatbot...")
    chat_payload = {
        "message": "What is my rank and how is my math grade?",
        "student_id": 1,
        "chat_history": []
      }
    response = client.post("/api/ai/chat", json=chat_payload, headers=headers)
    assert response.status_code == 200, f"AI Chat failed: {response.text}"
    chat_res = response.json()
    assert "reply" in chat_res
    print(f" [SUCCESS] AI Advisor Chatbot replied: \"{chat_res['reply'][:60]}...\"")

    # Clean up test student
    print("\n[TEST] Cleaning up test student...")
    response = client.delete(f"/api/students/{student_id}", headers=headers)
    assert response.status_code == 200
    print(" [SUCCESS] Cleanup finished.")

    print("\n==========================================================")
    print(" ALL TESTS COMPLETED SUCCESSFULLY! ")
    print("==========================================================")

if __name__ == "__main__":
    try:
        test_system()
    except AssertionError as e:
        print(f"\n[FAIL] Test assertion failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] Test run encountered error: {e}")
        sys.exit(1)
