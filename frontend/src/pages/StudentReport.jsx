import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { 
  Download, Award, BookOpen, AlertTriangle, Briefcase, FileText, CheckCircle2, Loader2, Sparkles, Zap, ShieldAlert 
} from 'lucide-react';

export default function StudentReport({ 
  studentReport, reportLoading, handleExportPDF, fetchAPI, semester, API_BASE, token 
}) {
  const [activeTab, setActiveTab] = useState('grades'); // grades, twin, resume, badges
  const [digitalTwin, setDigitalTwin] = useState(null);
  const [twinLoading, setTwinLoading] = useState(false);
  
  const [badges, setBadges] = useState([]);
  const [badgesLoading, setBadgesLoading] = useState(false);

  // Resume state
  const [skillsInput, setSkillsInput] = useState("Python, SQL, HTML, CSS, JavaScript, React, Machine Learning, Data Analytics");
  const [resumeLoading, setResumeLoading] = useState(false);

  useEffect(() => {
    if (studentReport?.student_id) {
      if (activeTab === 'twin') loadDigitalTwin();
      if (activeTab === 'badges') loadStudentBadges();
    }
  }, [activeTab, studentReport]);

  const loadDigitalTwin = async () => {
    setTwinLoading(true);
    try {
      const res = await fetchAPI(`/ai/twin/${studentReport.student_id}?semester=${semester}`);
      const data = await res.json();
      setDigitalTwin(data);
    } catch (err) {
      console.error(err);
    } finally {
      setTwinLoading(false);
    }
  };

  const loadStudentBadges = async () => {
    setBadgesLoading(true);
    try {
      const res = await fetchAPI(`/ai/badges/${studentReport.student_id}`);
      const data = await res.json();
      setBadges(data);
    } catch (err) {
      console.error(err);
    } finally {
      setBadgesLoading(false);
    }
  };

  const downloadATSResume = () => {
    window.open(`${API_BASE}/export/resume/${studentReport.student_id}?semester=${semester}&skills=${encodeURIComponent(skillsInput)}&token=${token}`, '_blank');
  };

  if (reportLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-9 w-9 animate-spin text-primary-500" />
        <p className="text-sm text-slate-450">Downloading academic cards...</p>
      </div>
    );
  }

  if (!studentReport) {
    return (
      <div className="h-96 flex items-center justify-center text-slate-400 font-medium bg-white dark:bg-[#161D30] border border-slate-200/50 dark:border-[#222F4D]/60 rounded-2xl">
        Roster profile is empty. Select a student from the Roster registry.
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      
      {/* Student Profile Header card */}
      <div className="bg-white dark:bg-[#161D30] rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-200/50 dark:border-[#222F4D]/60 border-l-4 border-l-primary-500 shadow-md">
        <div className="text-left w-full md:w-auto">
          <h2 className="text-2xl font-extrabold tracking-tight dark:text-white">{studentReport.first_name} {studentReport.last_name}</h2>
          <p className="text-xs text-slate-400 mt-1.5 font-medium">Roll Number: <span className="font-mono text-primary-500 font-bold">{studentReport.roll_number}</span> • Class: <b>{studentReport.class_name}</b></p>
          <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500 font-medium">
            <span>DOB: {studentReport.date_of_birth || 'N/A'}</span>
            <span>•</span>
            <span>Category: <span className="font-bold text-slate-400">{studentReport.category || 'General'}</span></span>
          </div>
        </div>

        {/* Global Stats */}
        <div className="flex flex-wrap gap-4 w-full md:w-auto justify-start md:justify-end">
          <div className="bg-slate-100/50 dark:bg-[#0B0F19]/60 rounded-xl px-5 py-3 text-center min-w-24 border border-slate-200/20 dark:border-[#222F4D]/40">
            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Class Rank</p>
            <h4 className="text-lg font-black dark:text-white mt-0.5">Rank {studentReport.class_rank}</h4>
          </div>

          <div className="bg-slate-100/50 dark:bg-[#0B0F19]/60 rounded-xl px-5 py-3 text-center min-w-24 border border-slate-200/20 dark:border-[#222F4D]/40">
            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">CGPA Score</p>
            <h4 className="text-lg font-black text-primary-500 mt-0.5">{studentReport.cgpa} / 10</h4>
          </div>

          <div className="bg-slate-100/50 dark:bg-[#0B0F19]/60 rounded-xl px-5 py-3 text-center min-w-24 border border-slate-200/20 dark:border-[#222F4D]/40">
            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Percentage</p>
            <h4 className="text-lg font-black text-primary-500 mt-0.5">{studentReport.overall_percentage}%</h4>
          </div>

          <div className="bg-slate-100/50 dark:bg-[#0B0F19]/60 rounded-xl px-5 py-3 text-center min-w-24 border border-slate-200/20 dark:border-[#222F4D]/40">
            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Grade Award</p>
            <h4 className={`text-lg font-black mt-0.5 ${
              studentReport.overall_grade === 'F' ? 'text-rose-500' : 'text-emerald-500'
            }`}>{studentReport.overall_grade}</h4>
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-200 dark:border-[#222F4D]/60 gap-4">
        {[
          { key: 'grades', label: 'Semester Grades' },
          { key: 'twin', label: 'Digital Academic Twin' },
          { key: 'badges', label: 'Smart Achievements' },
          { key: 'resume', label: 'ATS Resume Compiler' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              activeTab === tab.key 
                ? 'border-primary-500 text-primary-600 dark:text-primary-400 font-black' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        
        {/* GRADES TAB */}
        {activeTab === 'grades' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Grades Table List */}
            <div className="lg:col-span-2 bg-white dark:bg-[#161D30] rounded-2xl p-6 border border-slate-200/50 dark:border-[#222F4D]/60 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider text-slate-400">
                  <FileText className="h-5 w-5 text-primary-500" />
                  <span>Academic Grades Summary</span>
                </h3>
                <button 
                  onClick={() => handleExportPDF(studentReport.student_id)}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-primary-600/10 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download PDF Report</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200/40 dark:border-[#222F4D]/40 pb-3 text-slate-450 text-[10px] uppercase font-bold tracking-widest">
                      <th className="pb-3">Subject Name</th>
                      <th className="pb-3 text-center">Marks Obtained</th>
                      <th className="pb-3 text-center">Max Marks</th>
                      <th className="pb-3 text-center">Percentage</th>
                      <th className="pb-3 text-center">Grade</th>
                      <th className="pb-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {studentReport.marks.map((m, i) => (
                      <tr key={i} className="hover:bg-slate-100/20 dark:hover:bg-[#0B0F19]/10">
                        <td className="py-3.5 font-bold dark:text-white">{m.subject_name}</td>
                        <td className="py-3.5 text-center font-medium">{m.marks_obtained}</td>
                        <td className="py-3.5 text-center text-slate-400">{m.max_marks}</td>
                        <td className="py-3.5 text-center font-semibold text-slate-650 dark:text-slate-350">{m.percentage}%</td>
                        <td className="py-3.5 text-center font-black text-primary-500">{m.grade}</td>
                        <td className="py-3.5 text-center">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            m.grade === 'F' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/10' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/10'
                          }`}>
                            {m.grade === 'F' ? 'Fail' : 'Pass'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Subject Visual Chart */}
            <div className="bg-white dark:bg-[#161D30] rounded-2xl p-6 border border-slate-200/50 dark:border-[#222F4D]/60 shadow-sm">
              <h3 className="text-sm font-bold mb-6 flex items-center gap-2 uppercase tracking-wider text-slate-400">
                <Sparkles className="h-5 w-5 text-primary-500" />
                <span>Performance Visualizer</span>
              </h3>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={studentReport.marks}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222F4D" />
                    <XAxis dataKey="subject_name" stroke="#94A3B8" tick={{ fontSize: 9 }} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="#94A3B8" tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="marks_obtained" fill="#4c61f7" radius={[4, 4, 0, 0]} name="Score" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* DIGITAL ACADEMIC TWIN TAB */}
        {activeTab === 'twin' && (
          <div className="bg-white dark:bg-[#161D30] rounded-2xl p-6 border border-slate-200/50 dark:border-[#222F4D]/60 shadow-md space-y-6">
            <div className="border-b border-[#222F4D]/60 pb-3 flex justify-between items-center">
              <h3 className="font-extrabold text-md flex items-center gap-2 dark:text-white">
                <Sparkles className="h-5 w-5 text-primary-400" />
                <span>AI Digital Academic Twin profile</span>
              </h3>
              <span className="text-[10px] font-bold text-primary-500 bg-primary-500/10 px-2 py-1 rounded-md">LIVE COGNITIVE SYNAPSE</span>
            </div>

            {twinLoading ? (
              <div className="h-48 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              </div>
            ) : digitalTwin ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Learning metrics */}
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-[#0B0F19]/50 border border-slate-250 dark:border-[#222F4D] rounded-xl text-left">
                    <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Learning Velocity Profile</p>
                    <p className="text-sm font-extrabold dark:text-white mt-1">{digitalTwin.learning_speed}</p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-[#0B0F19]/50 border border-slate-250 dark:border-[#222F4D] rounded-xl text-left">
                    <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Retention Capacity</p>
                    <p className="text-sm font-extrabold dark:text-white mt-1">{digitalTwin.retention_rate}</p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-[#0B0F19]/50 border border-slate-250 dark:border-[#222F4D] rounded-xl text-left">
                    <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Academic Growth Index</p>
                    <p className="text-sm font-extrabold dark:text-white mt-1">{digitalTwin.academic_growth_trend}</p>
                  </div>
                </div>

                {/* Strong/Weak & Potential */}
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-[#0B0F19]/50 border border-slate-250 dark:border-[#222F4D] rounded-xl text-left">
                    <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Cognitive Strengths</p>
                    <p className="text-sm font-extrabold text-emerald-450 mt-1">{digitalTwin.strong_subjects?.join(', ')}</p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-[#0B0F19]/50 border border-slate-250 dark:border-[#222F4D] rounded-xl text-left">
                    <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Focus Areas</p>
                    <p className="text-sm font-extrabold text-rose-400 mt-1">{digitalTwin.weak_subjects?.join(', ')}</p>
                  </div>

                  <div className="p-4 bg-[#4c61f7]/10 border border-[#4c61f7]/30 rounded-xl text-left">
                    <p className="text-[9px] uppercase font-bold text-indigo-400 tracking-wider">Career Alignment Potential</p>
                    <p className="text-sm font-extrabold text-white mt-1">{digitalTwin.career_potential}</p>
                  </div>
                </div>

              </div>
            ) : (
              <p className="text-sm text-slate-450">Digital twin metadata not calculated yet.</p>
            )}
          </div>
        )}

        {/* SMART ACHIEVEMENTS TAB */}
        {activeTab === 'badges' && (
          <div className="bg-white dark:bg-[#161D30] rounded-2xl p-6 border border-slate-200/50 dark:border-[#222F4D]/60 shadow-md">
            <h3 className="font-extrabold text-md border-b border-[#222F4D]/60 pb-3 mb-6 flex items-center gap-2 dark:text-white">
              <Award className="h-5 w-5 text-primary-400" />
              <span>Smart Achievements & Badges</span>
            </h3>

            {badgesLoading ? (
              <div className="h-48 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              </div>
            ) : badges.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                {badges.map((badge, idx) => (
                  <div key={idx} className="p-5 bg-gradient-to-br from-indigo-950/20 to-[#1D2A47]/40 border border-[#222F4D] rounded-2xl flex flex-col items-center text-center hover:scale-105 hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/5 transition-all duration-300 relative group">
                    <div className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full bg-primary-500 shadow-md shadow-primary-500/50" />
                    <div className="p-4 bg-primary-500/10 text-primary-500 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                      <Zap className="h-7 w-7" />
                    </div>
                    <h4 className="font-bold text-sm text-white">{badge.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">{badge.description}</p>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-4">Earned: {badge.awarded_at}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8">
                <ShieldAlert className="h-10 w-10 text-slate-500 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-350 mb-1">No Badges Awarded Yet</p>
                <p className="text-xs text-slate-450 max-w-sm mx-auto leading-relaxed">Continue logging grades above 95% or maintaining above 95% attendance to unlock achievements!</p>
              </div>
            )}
          </div>
        )}

        {/* ATS RESUME COMPILER TAB */}
        {activeTab === 'resume' && (
          <div className="bg-white dark:bg-[#161D30] rounded-2xl p-6 border border-slate-200/50 dark:border-[#222F4D]/60 shadow-md text-left">
            <h3 className="font-extrabold text-md border-b border-[#222F4D]/60 pb-3 mb-5 flex items-center gap-2 dark:text-white">
              <Briefcase className="h-5 w-5 text-primary-400" />
              <span>ATS-Friendly Portfolio Resume Compiler</span>
            </h3>

            <div className="max-w-xl space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Automatically compiles a professional, formatted single-page PDF resume using standard ATS template layouts. Educations, ranks, and earned badges are automatically embedded.
              </p>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Configure Core Skills (Comma Separated)</label>
                <textarea 
                  rows="3"
                  className="w-full px-4 py-3 bg-[#0B0F19]/50 border border-slate-200 dark:border-[#222F4D] text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm font-medium"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                />
              </div>

              <button
                onClick={downloadATSResume}
                className="btn-primary py-3.5 px-6 text-xs font-bold flex items-center gap-2 shadow-lg shadow-primary-600/20 active:scale-95 transition-all cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Compile & Download PDF Resume</span>
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
