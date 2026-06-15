import React from 'react';
import { Search, Plus, Edit, Trash2, Upload, FileText, CheckSquare, Award } from 'lucide-react';

export default function Roster({ 
  filteredStudents, searchQuery, setSearchQuery, 
  openStudentModal, openMarksModal, viewStudentDashboard, 
  handleDeleteStudent, userRole, handleCSVImport 
}) {
  
  const triggerCSVUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleCSVImport(file);
    }
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Action Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search by student name or roll number..." 
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#161D30] border border-slate-200 dark:border-[#222F4D] text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent transition-all text-sm" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-end">
          {/* CSV Import */}
          <label className="flex items-center gap-2 px-4 py-3 bg-slate-100 dark:bg-[#222F4D] hover:bg-slate-200 dark:hover:bg-[#1D2A47] text-slate-800 dark:text-slate-200 font-semibold rounded-xl text-xs cursor-pointer active:scale-95 transition-all border border-slate-250 dark:border-transparent shadow-sm">
            <Upload className="h-4 w-4" />
            <span>Upload CSV</span>
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              onChange={triggerCSVUpload} 
            />
          </label>

          {/* Add Student */}
          <button 
            onClick={() => openStudentModal(null)}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-600 to-indigo-650 hover:from-primary-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs active:scale-[0.98] transition-all shadow-md shadow-primary-600/20 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Register Student</span>
          </button>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white dark:bg-[#161D30] rounded-2xl overflow-hidden border border-slate-200/50 dark:border-[#222F4D]/60 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/50 dark:bg-[#0B0F19]/60 border-b border-slate-200/50 dark:border-[#222F4D]/40">
                <th className="p-4.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Roll Number</th>
                <th className="p-4.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Full Name</th>
                <th className="p-4.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Class Section</th>
                <th className="p-4.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Category</th>
                <th className="p-4.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Email Address</th>
                <th className="p-4.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Grades Console</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/30 dark:divide-slate-800/30">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => (
                  <tr 
                    key={student.id} 
                    className="hover:bg-slate-100/30 dark:hover:bg-[#0B0F19]/20 transition-colors duration-150"
                  >
                    <td className="p-4.5 font-mono text-sm font-bold text-primary-500">{student.roll_number}</td>
                    <td className="p-4.5 text-sm font-bold dark:text-white">{student.first_name} {student.last_name}</td>
                    <td className="p-4.5 text-sm font-medium">{student.class_name}</td>
                    <td className="p-4.5 text-sm font-medium">
                      <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide bg-slate-100 dark:bg-[#222F4D] rounded-full text-slate-600 dark:text-slate-300">
                        {student.category || "General"}
                      </span>
                    </td>
                    <td className="p-4.5 text-sm text-slate-400">{student.email || '-'}</td>
                    <td className="p-4.5 flex items-center justify-center gap-2">
                      <button 
                        onClick={() => viewStudentDashboard(student)}
                        className="px-3.5 py-1.5 bg-primary-500/10 text-primary-600 dark:text-primary-400 hover:bg-primary-600 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>View Card</span>
                      </button>
                      <button 
                        onClick={() => openMarksModal(student)}
                        className="px-3.5 py-1.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-600 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <CheckSquare className="h-3.5 w-3.5" />
                        <span>Log Marks</span>
                      </button>
                      <button 
                        onClick={() => openStudentModal(student)}
                        className="p-2 text-slate-400 hover:text-primary-500 hover:bg-slate-100 dark:hover:bg-[#0B0F19] rounded-lg transition-all"
                        title="Edit Profile"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {userRole === 'Admin' && (
                        <button 
                          onClick={() => handleDeleteStudent(student.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                          title="Delete Profile"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400 font-medium">
                    No student profiles matched your search queries.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
