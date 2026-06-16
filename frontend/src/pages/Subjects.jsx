import React, { useState } from 'react';
import { Book, Plus, Trash2, Loader2, Search, AlertTriangle } from 'lucide-react';

export default function Subjects({ subjects, loadSubjectsList, fetchAPI }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAddSubject = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const trimmedName = name.trim();
    const trimmedCode = code.trim();
    
    if (!trimmedName || !trimmedCode) {
      setError("Please fill in both the Subject Name and Subject Code.");
      return;
    }

    setLoading(true);
    try {
      await fetchAPI('/marks/subjects', {
        method: 'POST',
        body: {
          name: trimmedName,
          code: trimmedCode
        }
      });
      setSuccess(`Subject "${trimmedName}" created successfully!`);
      setName('');
      setCode('');
      await loadSubjectsList();
    } catch (err) {
      setError(err.message || "Failed to create subject.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = async (subjectId, subjectName) => {
    if (!window.confirm(`Are you sure you want to delete the subject "${subjectName}"? Warning: This will delete all marks records and exam papers associated with this subject!`)) {
      return;
    }
    
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      await fetchAPI(`/marks/subjects/${subjectId}`, {
        method: 'DELETE'
      });
      setSuccess(`Subject "${subjectName}" deleted successfully.`);
      await loadSubjectsList();
    } catch (err) {
      setError(err.message || "Failed to delete subject.");
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black dark:text-white flex items-center gap-2">
            <Book className="h-6 w-6 text-primary-500" />
            <span>Manage Academic Courses</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Configure classes, assign course codes, and control active curricula.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Add Course Form */}
        <div className="bg-white dark:bg-[#161D30] rounded-2xl p-6 border border-slate-200/50 dark:border-[#222F4D]/60 shadow-sm h-fit">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-[#222F4D]/40 pb-3 flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary-450" />
            <span>Register New Subject</span>
          </h3>

          <form onSubmit={handleAddSubject} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-950/40 border border-rose-800/60 text-rose-350 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-450" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                <span className="h-4 w-4 shrink-0 text-emerald-400 font-bold">✓</span>
                <span>{success}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Subject Name</label>
              <input 
                type="text"
                placeholder="e.g. Computer Science"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#0B0F19] border border-slate-250 dark:border-[#222F4D] text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm font-semibold transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Course Code</label>
              <input 
                type="text"
                placeholder="e.g. CS101"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#0B0F19] border border-slate-250 dark:border-[#222F4D] text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm font-mono font-semibold transition-all"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={loading}
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-primary-600 to-indigo-650 hover:from-primary-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-md shadow-primary-600/15"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Register Course</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Side: Subjects List */}
        <div className="lg:col-span-2 bg-white dark:bg-[#161D30] rounded-2xl p-6 border border-slate-200/50 dark:border-[#222F4D]/60 shadow-sm flex flex-col min-h-[400px]">
          
          {/* Table Header and Search */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Book className="h-4 w-4 text-indigo-450" />
              <span>Active Curriculum ({subjects.length})</span>
            </h3>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search subjects..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#0B0F19] border border-slate-250 dark:border-[#222F4D] text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none text-xs font-semibold"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Subjects Table */}
          <div className="flex-1 overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#222F4D]/40 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="py-3 px-4">Subject Name</th>
                  <th className="py-3 px-4">Subject Code</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#222F4D]/20">
                {filteredSubjects.length > 0 ? (
                  filteredSubjects.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-[#111726]/10 transition-colors">
                      <td className="py-4 px-4 font-bold text-sm text-slate-800 dark:text-slate-200">
                        {s.name}
                      </td>
                      <td className="py-4 px-4 text-xs font-mono font-bold text-slate-500 dark:text-slate-455">
                        {s.code}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => handleDeleteSubject(s.id, s.name)}
                          disabled={loading}
                          className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg active:scale-95 transition-all cursor-pointer inline-flex items-center justify-center border border-transparent hover:border-rose-500/20"
                          title="Delete Course"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="py-8 text-center text-xs text-slate-450">
                      No subjects found matching the query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>

    </div>
  );
}
