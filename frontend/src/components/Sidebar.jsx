import React from 'react';
import { 
  User, TrendingUp, Brain, FileText, AlertTriangle, MessageSquare, Award, BookOpen, LogOut 
} from 'lucide-react';

export default function Sidebar({ userRole, activeTab, setActiveTab, handleLogout, classFilter, setClassFilter, handleExportExcel }) {
  return (
    <aside className="w-full md:w-64 bg-white/80 dark:bg-[#161D30]/85 backdrop-blur-md border-r border-slate-200/50 dark:border-[#222F4D]/60 p-4 flex flex-col gap-1.5 shadow-sm text-left">
      {userRole !== 'Student' && (
        <>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'dashboard' 
                ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md shadow-primary-600/25' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#111726]/45 hover:text-primary-600 dark:hover:text-primary-450'
            }`}
          >
            <TrendingUp className="h-5 w-5" />
            <span>Overview Analytics</span>
          </button>

          <button 
            onClick={() => setActiveTab('students')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'students' 
                ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md shadow-primary-600/25' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#111726]/45 hover:text-primary-600 dark:hover:text-primary-450'
            }`}
          >
            <User className="h-5 w-5" />
            <span>Student Roster</span>
          </button>

          <button 
            onClick={() => setActiveTab('attendance')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'attendance' 
                ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md shadow-primary-600/25' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#111726]/45 hover:text-primary-600 dark:hover:text-primary-450'
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
            <span>Attendance Logs</span>
          </button>

          <button 
            onClick={() => setActiveTab('exam-generator')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'exam-generator' 
                ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md shadow-primary-600/25' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#111726]/45 hover:text-primary-600 dark:hover:text-primary-450'
            }`}
          >
            <BookOpen className="h-5 w-5" />
            <span>AI Exam Generator</span>
          </button>
        </>
      )}

      {userRole === 'Student' && (
        <div className="space-y-1.5">
          <span className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Academic Deck</span>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'dashboard' 
                ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md shadow-primary-600/25' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#111726]/45 hover:text-primary-600 dark:hover:text-primary-450'
            }`}
          >
            <FileText className="h-5 w-5" />
            <span>My Report Card</span>
          </button>

          <button 
            onClick={() => setActiveTab('ai-insights')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'ai-insights' 
                ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md shadow-primary-600/25' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#111726]/45 hover:text-primary-600 dark:hover:text-primary-450'
            }`}
          >
            <Brain className="h-5 w-5" />
            <span>AI Insights Hub</span>
          </button>
        </div>
      )}

      <button 
        onClick={() => setActiveTab('chatbot')}
        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
          activeTab === 'chatbot' 
            ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md shadow-primary-600/25' 
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#111726]/45 hover:text-primary-600 dark:hover:text-primary-450'
        }`}
      >
        <MessageSquare className="h-5 w-5" />
        <span>Doubt Solving Chat</span>
      </button>

      <div className="my-4 border-t border-slate-200/50 dark:border-[#222F4D]/40" />
      
      {userRole !== 'Student' && (
        <div className="mt-2 px-2">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Class Filter</label>
          <select 
            className="w-full bg-slate-100 dark:bg-[#0B0F19]/70 border border-slate-200/50 dark:border-[#222F4D] text-sm rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 font-medium dark:text-white"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
          >
            <option value="">All Classes</option>
            <option value="Class 10-A">Class 10-A</option>
            <option value="Class 10-B">Class 10-B</option>
          </select>

          {classFilter && (
            <button 
              onClick={handleExportExcel}
              className="w-full mt-4 py-2.5 bg-slate-100 dark:bg-[#222F4D] hover:bg-slate-200 dark:hover:bg-[#1D2A47] text-slate-800 dark:text-slate-200 font-semibold rounded-lg text-xs flex items-center justify-center gap-2 border border-slate-200 dark:border-transparent active:scale-95 transition-all cursor-pointer"
            >
              <span>Download Excel</span>
            </button>
          )}
        </div>
      )}

      <div className="mt-auto pt-4 border-t border-slate-200/50 dark:border-[#222F4D]/40">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-500/10 transition-all"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout Session</span>
        </button>
      </div>
    </aside>
  );
}
