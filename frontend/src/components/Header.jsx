import React from 'react';
import { Brain, Sun, Moon, LogOut } from 'lucide-react';

export default function Header({ semester, setSemester, darkMode, setDarkMode, username, userRole, handleLogout }) {
  return (
    <header className="bg-white/80 dark:bg-[#161D30]/85 backdrop-blur-md border-b border-slate-200/50 dark:border-[#222F4D]/40 sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-primary-500 to-indigo-500 text-white rounded-xl shadow-md shadow-primary-500/10">
          <Brain className="h-6 w-6" />
        </div>
        <div className="text-left">
          <h1 className="text-xl font-extrabold tracking-tight dark:text-white leading-none bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-primary-950 dark:from-white dark:to-primary-200">
            EduMind <span className="text-primary-600 dark:text-primary-400">AI</span>
          </h1>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-1 block">ACADEMIC INSIGHT PLATFORM</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Semester Selector */}
        <div className="flex bg-slate-100 dark:bg-[#0B0F19]/60 rounded-xl p-1 border border-slate-200/40 dark:border-[#222F4D]/40">
          {['Semester 1', 'Semester 2'].map(s => (
            <button 
              key={s} 
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                semester === s 
                  ? 'bg-white dark:bg-primary-600 text-slate-900 dark:text-white shadow-sm font-bold' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
              onClick={() => setSemester(s)}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Dark Mode Toggle */}
        <button 
          onClick={() => setDarkMode(!darkMode)}
          className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#0B0F19] rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-[#222F4D]"
        >
          {darkMode ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-primary-700" />}
        </button>

        <div className="h-6 w-[1px] bg-slate-200 dark:bg-[#222F4D]" />
        
        {/* Profile Card */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-gradient-to-tr from-primary-500 to-indigo-500 text-white rounded-xl flex items-center justify-center font-bold shadow-md shadow-primary-500/20">
            {username.substring(0, 2).toUpperCase()}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-bold leading-tight dark:text-white">{username}</p>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{userRole}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
