import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

// Services
import { fetchAPI, API_BASE } from './services/api';

// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import VoiceAssistant from './components/VoiceAssistant';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Roster from './pages/Roster';
import Attendance from './pages/Attendance';
import StudentReport from './pages/StudentReport';
import AIHub from './pages/AIHub';
import ExamGenerator from './pages/ExamGenerator';
import Chatbot from './pages/Chatbot';
import Subjects from './pages/Subjects';
import AdminPanel from './pages/AdminPanel';

export default function App() {
  // --- Auth States ---
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userRole, setUserRole] = useState(localStorage.getItem('role') || '');
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [studentId, setStudentId] = useState(localStorage.getItem('student_id') ? parseInt(localStorage.getItem('student_id')) : null);
  
  // --- Global States ---
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') !== 'light');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [semester, setSemester] = useState('Semester 1');
  const [classFilter, setClassFilter] = useState('');

  // --- Data States ---
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- Student Details tab cache ---
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentReport, setStudentReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  // --- Doubt Chat Messages ---
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: "Welcome to EduMind AI! I am your doubt solving advisor. Ask me questions about ranks, marks, scholarships, or study plans." }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // --- CRUD Modals ---
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentForm, setStudentForm] = useState({
    roll_number: '', first_name: '', last_name: '', class_name: 'Class 10-A', 
    email: '', contact_number: '', date_of_birth: '', category: 'General',
    create_account: true, password: ''
  });

  const [marksModalOpen, setMarksModalOpen] = useState(false);
  const [marksStudent, setMarksStudent] = useState(null);
  const [marksForm, setMarksForm] = useState({});
  const [marksLoading, setMarksLoading] = useState(false);

  // --- Theme effect ---
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // --- Load initial data on login ---
  useEffect(() => {
    if (token) {
      loadInitialData();
    }
  }, [token, semester, classFilter]);

  const loadInitialData = async () => {
    try {
      if (userRole === 'Student') {
        if (studentId) {
          loadStudentReport(studentId);
        }
      } else {
        loadStudentsList();
        loadSubjectsList();
        loadDashboardStatistics();
      }
    } catch (err) {
      console.error("Error loading initial data: ", err);
    }
  };

  // --- Data Load Actions ---
  const loadStudentsList = async () => {
    try {
      const res = await fetchAPI(`/students?class_name=${classFilter}`);
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      console.error("Failed to load students: ", err);
    }
  };

  const loadSubjectsList = async () => {
    try {
      const res = await fetchAPI('/marks/subjects');
      const data = await res.json();
      setSubjects(data);
    } catch (err) {
      console.error("Failed to load subjects: ", err);
    }
  };

  const loadDashboardStatistics = async () => {
    setDashboardLoading(true);
    try {
      const res = await fetchAPI(`/marks/analytics/dashboard?semester=${semester}&class_name=${classFilter}`);
      const data = await res.json();
      setDashboardStats(data);
    } catch (err) {
      console.error("Failed to load dashboard stats: ", err);
    } finally {
      setDashboardLoading(false);
    }
  };

  const loadStudentReport = async (sId) => {
    setReportLoading(true);
    try {
      const res = await fetchAPI(`/marks/report-card/${sId}?semester=${semester}`);
      const data = await res.json();
      setStudentReport(data);
    } catch (err) {
      console.error("Failed to load report card: ", err);
    } finally {
      setReportLoading(false);
    }
  };

  // --- Auth Handlers ---
  const handlePasswordLogin = async (usernameInput, passwordInput) => {
    const formData = new FormData();
    formData.append('username', usernameInput);
    formData.append('password', passwordInput);

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      throw new Error("Invalid username or password");
    }

    const data = await res.json();
    setSessionData(data);
  };

  const handleFaceLogin = async (usernameInput, base64Image) => {
    const res = await fetch(`${API_BASE}/auth/face-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameInput, image: base64Image })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Face biometric match failed." }));
      throw new Error(err.detail || "Face login failed.");
    }

    const data = await res.json();
    setSessionData(data);
  };

  const handleGoogleLogin = async (emailInput) => {
    const res = await fetch(`${API_BASE}/auth/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailInput })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Google account verification failed." }));
      throw new Error(err.detail || "Google login failed.");
    }

    const data = await res.json();
    setSessionData(data);
  };

  const handleForgotPassword = async (usernameInput) => {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameInput })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || "Failed to reset password.");
    }
    return data.detail;
  };

  const setSessionData = (data) => {
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('role', data.role);
    localStorage.setItem('username', data.username);
    if (data.student_id) {
      localStorage.setItem('student_id', data.student_id);
    } else {
      localStorage.removeItem('student_id');
    }

    setToken(data.access_token);
    setUserRole(data.role);
    setUsername(data.username);
    setStudentId(data.student_id);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('student_id');
    setToken('');
    setUserRole('');
    setUsername('');
    setStudentId(null);
    setStudents([]);
    setStudentReport(null);
    setDashboardStats(null);
  };

  // --- Student Roster CRUD Actions ---
  const openStudentModal = (student = null) => {
    if (student) {
      setEditingStudent(student);
      setStudentForm({
        roll_number: student.roll_number,
        first_name: student.first_name,
        last_name: student.last_name,
        class_name: student.class_name,
        email: student.email || '',
        contact_number: student.contact_number || '',
        date_of_birth: student.date_of_birth || '',
        category: student.category || 'General',
        create_account: false,
        password: ''
      });
    } else {
      setEditingStudent(null);
      setStudentForm({
        roll_number: '', first_name: '', last_name: '', class_name: 'Class 10-A', 
        email: '', contact_number: '', date_of_birth: '', category: 'General',
        create_account: true, password: ''
      });
    }
    setStudentModalOpen(true);
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await fetchAPI(`/students/${editingStudent.id}`, {
          method: 'PUT',
          body: studentForm
        });
      } else {
        await fetchAPI('/students', {
          method: 'POST',
          body: studentForm
        });
      }
      setStudentModalOpen(false);
      loadStudentsList();
      loadDashboardStatistics();
    } catch (err) {
      alert("Error saving student record: " + err.message);
    }
  };

  const handleDeleteStudent = async (sId) => {
    if (!confirm("Are you sure you want to delete this student and all their marks records?")) return;
    try {
      await fetchAPI(`/students/${sId}`, { method: 'DELETE' });
      loadStudentsList();
      loadDashboardStatistics();
    } catch (err) {
      alert("Error deleting student: " + err.message);
    }
  };

  // --- CSV Import ---
  const handleCSVImport = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetchAPI("/students/import-csv", {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      alert(data.detail);
      loadStudentsList();
      loadDashboardStatistics();
    } catch (err) {
      alert("CSV import failed: " + err.message);
    }
  };

  // --- Log Marks Modal Actions ---
  const openMarksModal = async (student) => {
    setMarksStudent(student);
    setMarksForm({});
    setMarksModalOpen(true);
    setMarksLoading(true);
    try {
      const res = await fetchAPI(`/marks/student/${student.id}?semester=${semester}`);
      const data = await res.json();
      const loadedMarks = {};
      data.forEach(m => {
        loadedMarks[m.subject_id] = m.marks_obtained;
      });
      setMarksForm(loadedMarks);
    } catch (err) {
      console.error("Error loading marks: ", err);
    } finally {
      setMarksLoading(false);
    }
  };

  const handleMarksSubmit = async (e) => {
    e.preventDefault();
    try {
      for (const subId of Object.keys(marksForm)) {
        const marksVal = parseFloat(marksForm[subId]);
        if (isNaN(marksVal)) continue;
        
        await fetchAPI('/marks', {
          method: 'POST',
          body: {
            student_id: marksStudent.id,
            subject_id: parseInt(subId),
            marks_obtained: marksVal,
            max_marks: 100.0,
            semester: semester,
            exam_type: "Final Exam"
          }
        });
      }
      setMarksModalOpen(false);
      loadDashboardStatistics();
      if (selectedStudent && selectedStudent.id === marksStudent.id) {
        loadStudentReport(marksStudent.id);
      }
      alert("Marks saved successfully!");
    } catch (err) {
      alert("Error saving marks: " + err.message);
    }
  };

  // --- Navigation actions ---
  const viewStudentDashboard = (student) => {
    setSelectedStudent(student);
    loadStudentReport(student.id);
    setActiveTab('student-details');
  };

  const handleExportPDF = (sId) => {
    window.open(`${API_BASE}/export/pdf/${sId}?semester=${semester}&token=${token}`, '_blank');
  };

  const handleExportExcel = () => {
    if (!classFilter) {
      alert("Please choose a class (e.g. Class 10-A) before downloading the Excel roster!");
      return;
    }
    window.open(`${API_BASE}/export/excel?class_name=${classFilter}&semester=${semester}&token=${token}`, '_blank');
  };

  // --- Filtering ---
  const filteredStudents = students.filter(s => 
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.roll_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Logged out state ---
  if (!token) {
    return (
      <Login 
        handlePasswordLogin={handlePasswordLogin} 
        handleFaceLogin={handleFaceLogin} 
        handleGoogleLogin={handleGoogleLogin} 
        handleForgotPassword={handleForgotPassword}
        onSetupComplete={setSessionData}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-[#070A13] dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      
      {/* Header bar */}
      <Header 
        semester={semester}
        setSemester={setSemester}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        username={username}
        userRole={userRole}
        handleLogout={handleLogout}
      />

      {/* Main deck structure */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Sidebar navigation */}
        <Sidebar 
          userRole={userRole}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          handleLogout={handleLogout}
          classFilter={classFilter}
          setClassFilter={setClassFilter}
          handleExportExcel={handleExportExcel}
        />

        {/* Content deck */}
        <main className="flex-1 p-6 overflow-y-auto">
          
          {/* Dashboard (overview metrics) */}
          {userRole !== 'Student' && activeTab === 'dashboard' && (
            <Dashboard 
              dashboardStats={dashboardStats}
              dashboardLoading={dashboardLoading}
              darkMode={darkMode}
              userRole={userRole}
              fetchAPI={fetchAPI}
            />
          )}

          {/* Student Report (student dashboard / detailed report card) */}
          {(activeTab === 'student-details' || (userRole === 'Student' && activeTab === 'dashboard')) && (
            <StudentReport 
              studentReport={studentReport}
              reportLoading={reportLoading}
              handleExportPDF={handleExportPDF}
              fetchAPI={fetchAPI}
              semester={semester}
              API_BASE={API_BASE}
              token={token}
            />
          )}

          {/* Roster list */}
          {userRole !== 'Student' && activeTab === 'students' && (
            <Roster 
              filteredStudents={filteredStudents}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              openStudentModal={openStudentModal}
              openMarksModal={openMarksModal}
              viewStudentDashboard={viewStudentDashboard}
              handleDeleteStudent={handleDeleteStudent}
              userRole={userRole}
              handleCSVImport={handleCSVImport}
            />
          )}

          {/* Attendance sheet */}
          {userRole !== 'Student' && activeTab === 'attendance' && (
            <Attendance 
              students={students}
              fetchAPI={fetchAPI}
              classFilter={classFilter}
              semester={semester}
            />
          )}

          {/* AI Insights (Coach, predict, scholarships) */}
          {activeTab === 'ai-insights' && (
            <AIHub 
              studentReport={studentReport || { student_id: studentId }}
              fetchAPI={fetchAPI}
              semester={semester}
            />
          )}

          {/* Exam generator */}
          {userRole !== 'Student' && activeTab === 'exam-generator' && (
            <ExamGenerator 
              subjects={subjects}
              fetchAPI={fetchAPI}
              difficulty="Medium"
            />
          )}

          {/* Subjects list */}
          {userRole !== 'Student' && activeTab === 'subjects' && (
            <Subjects 
              subjects={subjects}
              loadSubjectsList={loadSubjectsList}
              fetchAPI={fetchAPI}
            />
          )}

          {/* Admin Panel */}
          {userRole === 'Admin' && activeTab === 'admin-panel' && (
            <AdminPanel 
              fetchAPI={fetchAPI}
            />
          )}

          {/* Solved Doubt Chatbot */}
          {activeTab === 'chatbot' && (
            <Chatbot 
              chatMessages={chatMessages}
              setChatMessages={setChatMessages}
              chatLoading={chatLoading}
              setChatLoading={setChatLoading}
              fetchAPI={fetchAPI}
              studentId={studentId}
              selectedStudent={selectedStudent}
            />
          )}

        </main>
      </div>

      {/* Floating Voice Assistant */}
      <VoiceAssistant 
        userRole={userRole}
        setActiveTab={setActiveTab}
        studentReport={studentReport}
        handleExportPDF={handleExportPDF}
      />

      {/* --- CRUD STUDENT PROFILE MODAL --- */}
      {studentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#161D30] border border-[#222F4D] w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl text-slate-100">
            <div className="px-6 py-4 bg-[#0B0F19]/60 border-b border-[#222F4D]/40 flex justify-between items-center">
              <h3 className="font-bold text-md">{editingStudent ? 'Edit Student Profile' : 'Register New Student'}</h3>
              <button onClick={() => setStudentModalOpen(false)} className="text-slate-400 hover:text-white text-sm cursor-pointer">✕</button>
            </div>
            
            <form onSubmit={handleStudentSubmit} className="p-6 space-y-4 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Roll Number</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 bg-[#0B0F19] border border-[#222F4D] text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 font-mono text-sm" 
                    value={studentForm.roll_number}
                    onChange={(e) => setStudentForm({...studentForm, roll_number: e.target.value})}
                    required
                    disabled={!!editingStudent}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Class Section</label>
                  <select 
                    className="w-full bg-[#0B0F19] border border-[#222F4D] text-slate-100 rounded-lg p-2 focus:outline-none"
                    value={studentForm.class_name}
                    onChange={(e) => setStudentForm({...studentForm, class_name: e.target.value})}
                  >
                    <option value="Class 10-A">Class 10-A</option>
                    <option value="Class 10-B">Class 10-B</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">First Name</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 bg-[#0B0F19] border border-[#222F4D] text-slate-100 rounded-lg focus:outline-none" 
                    value={studentForm.first_name}
                    onChange={(e) => setStudentForm({...studentForm, first_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Last Name</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 bg-[#0B0F19] border border-[#222F4D] text-slate-100 rounded-lg focus:outline-none" 
                    value={studentForm.last_name}
                    onChange={(e) => setStudentForm({...studentForm, last_name: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Category (Scholarship eligibility)</label>
                  <select 
                    className="w-full bg-[#0B0F19] border border-[#222F4D] text-slate-100 rounded-lg p-2 focus:outline-none"
                    value={studentForm.category}
                    onChange={(e) => setStudentForm({...studentForm, category: e.target.value})}
                  >
                    <option value="General">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Email Address</label>
                  <input 
                    type="email" 
                    className="w-full px-3 py-2 bg-[#0B0F19] border border-[#222F4D] text-slate-100 rounded-lg focus:outline-none" 
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({...studentForm, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contact Number</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 bg-[#0B0F19] border border-[#222F4D] text-slate-100 rounded-lg focus:outline-none" 
                    value={studentForm.contact_number}
                    onChange={(e) => setStudentForm({...studentForm, contact_number: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date of Birth</label>
                  <input 
                    type="date" 
                    className="w-full px-3 py-2 bg-[#0B0F19] border border-[#222F4D] text-slate-400 rounded-lg focus:outline-none" 
                    value={studentForm.date_of_birth}
                    onChange={(e) => setStudentForm({...studentForm, date_of_birth: e.target.value})}
                  />
                </div>
              </div>

              {!editingStudent && (
                <div className="p-4 bg-[#0B0F19]/60 rounded-xl border border-[#222F4D]/40 space-y-3">
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={studentForm.create_account} 
                      onChange={(e) => setStudentForm({...studentForm, create_account: e.target.checked})}
                    />
                    <span>Automatically seed user login account</span>
                  </label>
                  
                  {studentForm.create_account && (
                    <div>
                      <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-widest mb-1">Password (Default: rollnumber123)</label>
                      <input 
                        type="password" 
                        className="w-full px-3 py-2 bg-[#161D30] border border-[#222F4D] text-slate-100 rounded-lg focus:outline-none" 
                        placeholder="e.g. custom_password" 
                        value={studentForm.password}
                        onChange={(e) => setStudentForm({...studentForm, password: e.target.value})}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 flex gap-3 justify-end border-t border-[#222F4D]/40">
                <button type="button" onClick={() => setStudentModalOpen(false)} className="px-4 py-2 bg-[#222F4D] text-slate-200 rounded-lg text-xs font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-semibold cursor-pointer">
                  {editingStudent ? 'Save Profile' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ENTER MARKS MODAL --- */}
      {marksModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#161D30] border border-[#222F4D] w-full max-w-md rounded-2xl overflow-hidden shadow-2xl text-slate-100">
            <div className="px-6 py-4 bg-[#0B0F19]/60 border-b border-[#222F4D]/40 flex justify-between items-center text-left">
              <div>
                <h3 className="font-bold text-md">Log Term Grades</h3>
                <span className="text-xs text-slate-400">Student: <b>{marksStudent?.first_name} {marksStudent?.last_name}</b> ({semester})</span>
              </div>
              <button onClick={() => setMarksModalOpen(false)} className="text-slate-400 hover:text-white text-sm cursor-pointer">✕</button>
            </div>
            
            {marksLoading ? (
              <div className="h-48 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              </div>
            ) : (
              <form onSubmit={handleMarksSubmit} className="p-6 space-y-4 text-left">
                <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
                  {subjects.map(subj => (
                    <div key={subj.id} className="flex items-center justify-between gap-4">
                      <label className="text-xs font-bold text-slate-300 w-1/2">{subj.name}</label>
                      <div className="flex items-center gap-2 w-1/2 justify-end">
                        <input 
                          type="number" 
                          className="px-3 py-2 bg-[#0B0F19] border border-[#222F4D] text-slate-150 rounded-lg text-center font-bold text-sm max-w-24 focus:outline-none" 
                          placeholder="-" 
                          min="0" 
                          max="100"
                          step="0.5"
                          value={marksForm[subj.id] !== undefined ? marksForm[subj.id] : ''}
                          onChange={(e) => setMarksForm({
                            ...marksForm,
                            [subj.id]: e.target.value
                          })}
                        />
                        <span className="text-xs text-slate-500 font-bold">/100</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex gap-3 justify-end border-t border-[#222F4D]/40">
                  <button type="button" onClick={() => setMarksModalOpen(false)} className="px-4 py-2 bg-[#222F4D] text-slate-200 rounded-lg text-xs font-semibold cursor-pointer">Cancel</button>
                  <button type="submit" className="px-5 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-semibold cursor-pointer">Save Grades</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
