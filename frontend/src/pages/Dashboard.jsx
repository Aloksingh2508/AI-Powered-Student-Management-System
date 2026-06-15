import React from 'react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { 
  TrendingUp, GraduationCap, BarChart3, Loader2, Award, Zap, AlertTriangle 
} from 'lucide-react';

export default function Dashboard({ dashboardStats, dashboardLoading, darkMode }) {
  if (dashboardLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-9 w-9 animate-spin text-primary-500" />
        <p className="text-sm text-slate-400 font-medium">Aggregating campus statistics...</p>
      </div>
    );
  }

  const cardStats = [
    { label: "Total Students Enrolled", value: dashboardStats?.total_students, color: "from-blue-500 to-indigo-500", icon: GraduationCap },
    { label: "Graded Courses", value: dashboardStats?.total_subjects, color: "from-purple-500 to-violet-500", icon: Award },
    { label: "Class Grade Average", value: dashboardStats ? `${dashboardStats.class_average}%` : null, color: "from-emerald-500 to-teal-500", icon: TrendingUp },
    { label: "Class Pass Rate", value: dashboardStats ? `${dashboardStats.pass_rate}%` : null, color: "from-amber-500 to-orange-500", icon: Zap }
  ];

  return (
    <div className="space-y-6 text-left">
      
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cardStats.map((card, idx) => (
          <div key={idx} className="bg-white dark:bg-[#161D30] backdrop-blur-md rounded-2xl p-6 relative overflow-hidden group hover:scale-[1.02] hover:shadow-lg transition-all duration-300 border border-slate-200/50 dark:border-[#222F4D]/60 border-t-2 border-t-primary-500/30">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{card.label}</p>
              <card.icon className="h-5 w-5 text-primary-500" />
            </div>
            <h3 className="text-3xl font-extrabold mt-3 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-primary-950 dark:from-white dark:to-primary-100">
              {card.value !== undefined ? card.value : "N/A"}
            </h3>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 from-primary-500 to-indigo-500" />
          </div>
        ))}
      </div>

      {/* Chart and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Subject-Wise Performance Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#161D30] rounded-2xl p-6 border border-slate-200/50 dark:border-[#222F4D]/60 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider text-slate-400">
              <BarChart3 className="h-5 w-5 text-primary-500" />
              <span>Subject Performance Index</span>
            </h3>
            <span className="text-[10px] font-bold text-primary-500 bg-primary-500/10 px-2.5 py-1 rounded-md">CLASS AVERAGES</span>
          </div>
          
          {dashboardStats && dashboardStats.subject_performances?.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardStats.subject_performances} barSize={35}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4c61f7" />
                      <stop offset="100%" stopColor="#3440ed" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#222F4D" : "#E2E8F0"} />
                  <XAxis dataKey="subject_name" stroke={darkMode ? "#94A3B8" : "#64748B"} fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke={darkMode ? "#94A3B8" : "#64748B"} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#161D30' : '#FFFFFF',
                      borderColor: darkMode ? '#222F4D' : '#CBD5E1',
                      borderRadius: '12px',
                      color: darkMode ? '#F8FAFC' : '#0F172A'
                    }} 
                  />
                  <Bar dataKey="average_score" fill="url(#barGrad)" radius={[6, 6, 0, 0]} name="Index Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-slate-450">
              No course grading averages found.
            </div>
          )}
        </div>

        {/* Toppers / Rank list */}
        <div className="bg-white dark:bg-[#161D30] rounded-2xl p-6 border border-slate-200/50 dark:border-[#222F4D]/60 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold mb-6 flex items-center gap-2 uppercase tracking-wider text-slate-400">
            <GraduationCap className="h-5 w-5 text-primary-500" />
            <span>EduMind Toppers Board</span>
          </h3>

          {dashboardStats && dashboardStats.toppers?.length > 0 ? (
            <div className="space-y-4 flex-1">
              {dashboardStats.toppers.map((topper, i) => (
                <div key={topper.student_id} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-100/50 dark:bg-[#0B0F19]/40 border border-slate-200/20 dark:border-[#222F4D]/40 hover:border-primary-500/20 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-black text-xs ${
                      i === 0 ? 'bg-amber-500/10 text-amber-500' :
                      i === 1 ? 'bg-slate-350/10 text-slate-400' :
                      'bg-orange-850/10 text-orange-400'
                    }`}>
                      #{i + 1}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold dark:text-white">{topper.name}</p>
                      <p className="text-[10px] text-slate-400">{topper.roll_number} • {topper.class_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-primary-500 bg-primary-500/10 px-2 py-1 rounded-md">
                      {topper.overall_percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-slate-400">
              No topper data calculated yet.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
