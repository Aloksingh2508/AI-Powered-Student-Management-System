import datetime
from sqlalchemy.orm import Session

from backend.app.database.connection import Base, engine, SessionLocal
from backend.app.models.auth import User
from backend.app.models.student import Student, Attendance
from backend.app.models.academic import Subject, Mark, Scholarship
from backend.app.models.gamification import Badge
from backend.app.services.auth_service import get_password_hash

def seed_db():
    print("Initializing database...")
    # Drop and recreate all tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 1. Create Default Badges
        print("Seeding gamification badges...")
        badges_data = [
            {"name": "Top Performer", "icon": "Award", "description": "Secured Rank #1 in Class Semester Evaluations."},
            {"name": "Attendance Champion", "icon": "Zap", "description": "Maintained above 95% attendance record."},
            {"name": "Fast Learner", "icon": "TrendingUp", "description": "Improved overall semester percentage by 10% or more."},
            {"name": "Subject Expert", "icon": "BookOpen", "description": "Scored 95% or higher in any academic course."}
        ]
        for b in badges_data:
            db_badge = Badge(name=b["name"], icon=b["icon"], description=b["description"])
            db.add(db_badge)

        # 2. Create Default Scholarships
        print("Seeding scholarships...")
        scholarships_data = [
            {"name": "Lumina Academic Merit Scholarship", "description": "Awarded to elite academic scorers scoring above 90% in final examinations.", "eligibility_min_percentage": 90.0, "eligibility_category": "All", "amount": 5000.0},
            {"name": "EduMind Opportunity Scholarship", "description": "Financial assistance for OBC category students with excellent performance records.", "eligibility_min_percentage": 75.0, "eligibility_category": "OBC", "amount": 3000.0},
            {"name": "Inclusion Education Aid Scheme", "description": "Government-backed financial aid for SC/ST category students to support technical learning.", "eligibility_min_percentage": 60.0, "eligibility_category": "SC", "amount": 4000.0},
            {"name": "Tech Talents Inclusion Fellowship", "description": "Fostering STEM engineering pursuits among high-achieving ST category students.", "eligibility_min_percentage": 80.0, "eligibility_category": "ST", "amount": 4500.0}
        ]
        for s in scholarships_data:
            db_s = Scholarship(**s)
            db.add(db_s)

        # 3. Create Subjects
        print("Seeding subjects...")
        subject_names = [
            ("Mathematics", "MATH101"),
            ("Science", "SCI101"),
            ("English", "ENG101"),
            ("Social Studies", "SST101"),
            ("Biology", "BIO101")
        ]
        subjects = {}
        for name, code in subject_names:
            sub = Subject(name=name, code=code)
            db.add(sub)
            db.flush()
            subjects[name] = sub

        # 4. Create Students
        print("Seeding students...")
        students_data = [
            # Roll, First, Last, Class, Email, Contact, DOB, Category
            ("S1001", "John", "Doe", "Class 10-A", "john.doe@school.edu", "9876543210", "2010-05-15", "General"),
            ("S1002", "Jane", "Smith", "Class 10-A", "jane.smith@school.edu", "9876543211", "2010-08-22", "OBC"),
            ("S1003", "Alice", "Johnson", "Class 10-A", "alice.johnson@school.edu", "9876543212", "2010-11-03", "SC"),
            ("S1004", "Bob", "Brown", "Class 10-B", "bob.brown@school.edu", "9876543213", "2010-03-12", "General"),
            ("S1005", "Charlie", "Green", "Class 10-B", "charlie.green@school.edu", "9876543214", "2010-09-30", "ST")
        ]
        
        db_students = []
        for roll, f_name, l_name, cls, email, ph, dob, cat in students_data:
            stu = Student(
                roll_number=roll,
                first_name=f_name,
                last_name=l_name,
                class_name=cls,
                email=email,
                contact_number=ph,
                date_of_birth=dob,
                category=cat
            )
            db.add(stu)
            db.flush()
            db_students.append(stu)

        # 5. Create Users
        print("Seeding user accounts...")
        # Admin account
        admin_user = User(
            username="admin",
            hashed_password=get_password_hash("admin123"),
            role="Admin"
        )
        db.add(admin_user)

        # Teacher account
        teacher_user = User(
            username="teacher",
            hashed_password=get_password_hash("teacher123"),
            role="Teacher"
        )
        db.add(teacher_user)

        # Student accounts
        student_user = User(
            username="student",
            hashed_password=get_password_hash("student123"),
            role="Student",
            student_id=db_students[0].id
        )
        db.add(student_user)

        student_user_alice = User(
            username="alice",
            hashed_password=get_password_hash("alice123"),
            role="Student",
            student_id=db_students[2].id # Alice
        )
        db.add(student_user_alice)

        # 6. Create Attendance Records
        print("Seeding student attendance records...")
        dates = ["2026-06-08", "2026-06-09", "2026-06-10", "2026-06-11", "2026-06-12"]
        
        # John, Jane, Charlie: Present (high attendance)
        # Alice: Absent/Late (low attendance)
        attendance_patterns = {
            1: ["Present", "Present", "Present", "Present", "Present"], # 100%
            2: ["Present", "Present", "Late", "Present", "Present"], # 100%
            3: ["Absent", "Late", "Absent", "Present", "Absent"], # 40% (low)
            4: ["Present", "Absent", "Present", "Present", "Late"], # 80%
            5: ["Present", "Present", "Present", "Present", "Present"]  # 100%
        }
        
        for student_idx, status_list in attendance_patterns.items():
            for i, d in enumerate(dates):
                att = Attendance(
                    student_id=student_idx,
                    date=d,
                    status=status_list[i],
                    verified_by_face=False
                )
                db.add(att)

        # 7. Create Marks
        print("Seeding student marks...")
        marks_data = [
            # John Doe (Student ID 1) - Semester 1
            (1, "Mathematics", 92.0, "Semester 1"),
            (1, "Science", 88.0, "Semester 1"),
            (1, "English", 82.0, "Semester 1"),
            (1, "Social Studies", 85.0, "Semester 1"),
            (1, "Biology", 78.0, "Semester 1"),
            # John Doe - Semester 2
            (1, "Mathematics", 95.0, "Semester 2"),
            (1, "Science", 91.0, "Semester 2"),
            (1, "English", 84.0, "Semester 2"),
            (1, "Social Studies", 87.0, "Semester 2"),
            (1, "Biology", 80.0, "Semester 2"),

            # Jane Smith (Student ID 2) - Semester 1
            (2, "Mathematics", 80.0, "Semester 1"),
            (2, "Science", 89.0, "Semester 1"),
            (2, "English", 94.0, "Semester 1"),
            (2, "Social Studies", 90.0, "Semester 1"),
            (2, "Biology", 96.0, "Semester 1"),
            # Jane Smith - Semester 2
            (2, "Mathematics", 82.0, "Semester 2"),
            (2, "Science", 92.0, "Semester 2"),
            (2, "English", 95.0, "Semester 2"),
            (2, "Social Studies", 91.0, "Semester 2"),
            (2, "Biology", 98.0, "Semester 2"),

            # Alice Johnson (Student ID 3) - Semester 1 (Struggling)
            (3, "Mathematics", 35.0, "Semester 1"),
            (3, "Science", 38.0, "Semester 1"),
            (3, "English", 52.0, "Semester 1"),
            (3, "Social Studies", 48.0, "Semester 1"),
            (3, "Biology", 40.0, "Semester 1"),
            # Alice Johnson - Semester 2
            (3, "Mathematics", 39.0, "Semester 2"),
            (3, "Science", 42.0, "Semester 2"),
            (3, "English", 55.0, "Semester 2"),
            (3, "Social Studies", 50.0, "Semester 2"),
            (3, "Biology", 45.0, "Semester 2"),

            # Bob Brown (Student ID 4) - Semester 1
            (4, "Mathematics", 65.0, "Semester 1"),
            (4, "Science", 62.0, "Semester 1"),
            (4, "English", 68.0, "Semester 1"),
            (4, "Social Studies", 70.0, "Semester 1"),
            (4, "Biology", 58.0, "Semester 1"),
            # Bob Brown - Semester 2
            (4, "Mathematics", 68.0, "Semester 2"),
            (4, "Science", 65.0, "Semester 2"),
            (4, "English", 70.0, "Semester 2"),
            (4, "Social Studies", 72.0, "Semester 2"),
            (4, "Biology", 60.0, "Semester 2"),

            # Charlie Green (Student ID 5) - Semester 1
            (5, "Mathematics", 74.0, "Semester 1"),
            (5, "Science", 76.0, "Semester 1"),
            (5, "English", 70.0, "Semester 1"),
            (5, "Social Studies", 78.0, "Semester 1"),
            (5, "Biology", 82.0, "Semester 1"),
            # Charlie Green - Semester 2
            (5, "Mathematics", 78.0, "Semester 2"),
            (5, "Science", 80.0, "Semester 2"),
            (5, "English", 72.0, "Semester 2"),
            (5, "Social Studies", 82.0, "Semester 2"),
            (5, "Biology", 85.0, "Semester 2"),
        ]

        for student_id, subject_name, mark, sem in marks_data:
            db_mark = Mark(
                student_id=student_id,
                subject_id=subjects[subject_name].id,
                marks_obtained=mark,
                max_marks=100.0,
                semester=sem,
                exam_type="Final Exam"
            )
            db.add(db_mark)

        db.commit()
        print("Database seeded successfully with users, students, marks, attendance, scholarships, and badges!")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
