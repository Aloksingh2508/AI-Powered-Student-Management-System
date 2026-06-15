# EduMind AI - Full-Stack Student Result Management & Academic Intelligence Platform

EduMind AI is a production-ready, feature-rich EdTech dashboard combining academic administration (student rosters, attendance sheets, exam generators, grade ranks) with cutting-edge artificial intelligence modules (biometric OpenCV face verification, Scikit-Learn ML predictions, custom ReportLab ATS resumes builder, and Gemini doubt chatbots).

---

## 🛠 Features Matrix

### 1. Traditional Roster Management
- **Role-based Authentication**: Secure admin, teacher, and student dashboards via JWT tokens.
- **Student Roster CRUD**: Register, edit, search, and delete student profiles.
- **CSV Data Import**: Bulk imports of students and user login creations via CSV files.
- **Grades Logging Sheet**: Log individual or class-wide subject marks with automatic percentage, grade, rank, and CGPA calculations.
- **Reports Exportation**: 
  - **Excel Exports**: Automated generation of class results grids.
  - **PDF Report Cards**: High-fidelity, print-ready student progress reports compiled using ReportLab.

### 2. OpenCV Face Authentication Biometrics
- **Registration**: Grabs webcam screenshots via HTML5 Canvas, detects frontal faces with Haar Cascades, normalizes crops (150x150 gray), and saves templates.
- **Face Sign In**: Quick password-less login comparing probe frame correlation coefficients and histogram correlation matching.
- **Attendance Verification**: Biometric confirmation of student presence in class.

### 3. Scikit-Learn ML Predictive Engine
- **Grade Forecasting**: Predicts next semester performance percentage and CGPA using Linear Regression trained on historical grades and attendance rate.
- **Failure Risk Metrics**: Analyzes probability of failure or grade drop using Logistic Regression.
- **Improvement Rate**: Fits models to predict if a student's S2 grades will improve relative to S1.

### 4. Advanced AI Academic Core (Gemini)
- **AI Academic Coach**: Generates targeted study comments and feedback remarks.
- **Digital Academic Twin**: Details cognitive speed, retention rates, growth trends, and career potentials.
- **ATS Resume Generator**: Compiles professional single-page PDF resumes for students, auto-embedding CGPA, ranks, and earned badges.
- **Doubt Solver Chatbot**: Conversational assistant answering course doubts and preparations.
- **Exam Builder**: Creates MCQ test sheets and short/long theory questions.
- **Gamification Badges**: Automatically awards badges (*Top Performer*, *Fast Learner*, *Subject Expert*, *Attendance Champion*) upon grading.

---

## 📁 Folder Structure

```text
backend/
├── app/
│   ├── main.py              # FastAPI main startup file
│   ├── config.py            # Settings and secrets (.env loader)
│   ├── database/
│   │   └── connection.py    # DB Engine and Session Local
│   ├── models/
│   │   ├── auth.py          # User models
│   │   ├── student.py       # Student & Attendance models
│   │   ├── academic.py      # Subject, Marks, ExamPaper models
│   │   ├── ai.py            # AI Cache & Academic Twin models
│   │   └── gamification.py  # Badges & Achievements models
│   ├── routers/
│   │   ├── auth.py          # JWT, Register, Face login routes
│   │   ├── students.py      # CRUD for students & attendance
│   │   ├── marks.py         # Marks entry & analytics
│   │   ├── ai.py            # LLM endpoints (chatbot, pathways, comments, exams)
│   │   ├── ml.py            # Scikit-Learn predictions
│   │   └── exports.py       # PDF/Excel report generator routes
│   ├── services/
│   │   ├── auth_service.py  # Password hashing, token generation
│   │   ├── pdf_service.py   # ReportLab implementation
│   │   ├── excel_service.py # Openpyxl exports
│   │   └── ml_service.py    # Scikit-Learn prediction pipeline
│   ├── ai_modules/
│   │   ├── gemini_client.py # Gemini prompts & fallsback
│   │   └── face_rec.py      # OpenCV face register & recognizer
│   └── tests/
│       └── test_main.py     # FastAPI integration tests
├── requirements.txt         # Python dependencies
└── seed.py                  # Seed script with ML training sample datasets

frontend/
├── src/
│   ├── App.jsx              # Main React state router
│   ├── index.css            # Custom CSS & Tailwind base
│   ├── main.jsx             # React mount point
│   ├── components/
│   │   ├── Sidebar.jsx      # Left sidebar navigation
│   │   ├── Header.jsx       # Header navigation bar
│   │   ├── VoiceAssistant.jsx # Web Speech floating assistant
│   │   └── FaceAuthModal.jsx # Webcam capture login modal
│   ├── pages/
│   │   ├── Login.jsx        # Credentials/biometrics login form
│   │   ├── Dashboard.jsx    # Overview charts
│   │   ├── Roster.jsx       # Student list table
│   │   ├── Attendance.jsx   # Attendance sheet & impact plots
│   │   ├── StudentReport.jsx # Report cards & digital twin panels
│   │   ├── AIHub.jsx        # Learning plans & scholarship matchings
│   │   ├── ExamGenerator.jsx # MCQ builder panel
│   │   └── Chatbot.jsx      # Doubt solver interactive agent
│   └── services/
│       └── api.js           # API fetch client wrapper
```

---

## 🚀 Installation & Setup Guide

### 1. System Requirements
- Python 3.10+
- Node.js v18+
- Webcam (required for Face recognition features)

### 2. Backend Installation
```bash
cd backend
python -m venv venv
# Windows activate:
venv\Scripts\activate
# macOS/Linux activate:
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Database Seeding & Setup
Initialize the database schemas, seed attendance/grade records, and train Scikit-Learn ML models:
```bash
# Set PYTHONPATH to root directory to support package imports:
cmd /c "set PYTHONPATH=.&& python backend/seed.py"
```

### 4. Frontend Setup
```bash
cd ../frontend
npm install
```

### 5. Running the Application
Double-click `start_servers.bat` in the root directory to launch both servers automatically, or run:
- **Backend API**: `python -m uvicorn backend.app.main:app --reload --port 8000` (Access [http://localhost:8000/docs](http://localhost:8000/docs) for Swagger documentation).
- **Vite React Frontend**: `cmd.exe /c npm run dev` (Access [http://localhost:5173](http://localhost:5173)).

---

## 🔑 Demo Login Credentials

- **Admin**: `admin` / `admin123`
- **Teacher**: `teacher` / `teacher123`
- **Student**: `student` / `student123` (Maps to John Doe)
- **Struggling Student**: `alice` / `alice123` (Maps to Alice Johnson - triggers failure alerts)

---

## 💼 Resume Project Description (For Portfolio Credit)

**AI-Powered Student Result Management & Academic Intelligence Platform (EduMind AI)**
- **Technical Stack**: React.js, FastAPI, SQLite, Scikit-Learn, OpenCV, Gemini API, ReportLab, Tailwind CSS.
- **Key Contributions**:
  - Engineered an OpenCV biometric module using Haar Cascade classifiers and template correlation matching to enable webcam face login and attendance verification.
  - Formulated a predictive academic ML pipeline using Scikit-Learn linear regression and logistic classification to forecast semester grades (CGPA) and evaluate failure risk scores.
  - Developed a ReportLab PDF engine compiling ATS-friendly portfolio resumes and print-ready report cards on demand.
  - Configured high-fidelity prompts and procedural fallback pathways for exam generators, doubt solver chatbots, and scholarship eligibility matchers.
