import React, { useState, useEffect } from 'react';
import { 
  Brain, Award, Sparkles, TrendingUp, AlertTriangle, Briefcase, Loader2, Compass 
} from 'lucide-react';

export default function AIHub({ studentReport, fetchAPI, semester }) {
  const [activeTab, setActiveTab] = useState('coach'); // coach, prediction, career, scholarships
  const [loading, setLoading] = useState(false);
  
  // AI content states
  const [coachContent, setCoachContent] = useState('');
  const [mlPredictions, setMlPredictions] = useState(null);
  const [careerContent, setCareerContent] = useState('');
  const [interestsInput, setInterestsInput] = useState('');
  const [scholarships, setScholarships] = useState([]);

  useEffect(() => {
    if (studentReport?.student_id) {
      loadTabContent();
    }
  }, [activeTab, studentReport]);

  const loadTabContent = async () => {
    setLoading(true);
    try {
      if (activeTab === 'coach') {
        const res = await fetchAPI(`/ai/coach/${studentReport.student_id}?semester=${semester}`);
        const data = await res.json();
        setCoachContent(data.content);
      }
      else if (activeTab === 'prediction') {
        const res = await fetchAPI(`/ml/predict/${studentReport.student_id}?semester=${semester}`);
        const data = await res.json();
        setMlPredictions(data);
      }
      else if (activeTab === 'career') {
        const res = await fetchAPI(`/ai/career/${studentReport.student_id}?semester=${semester}&interests=${encodeURIComponent(interestsInput)}`);
        const data = await res.json();
        setCareerContent(data.content);
      }
      else if (activeTab === 'scholarships') {
        const res = await fetchAPI(`/ai/scholarships/${studentReport.student_id}?semester=${semester}`);
        const data = await res.json();
        setScholarships(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCareerSearch = (e) => {
    e.preventDefault();
    loadTabContent();
  };

  if (!studentReport) {
    return (
      <div className="h-96 flex items-center justify-center text-slate-400 font-medium bg-white dark:bg-[#161D30] border border-slate-200/50 dark:border-[#222F4D]/60 rounded-2xl">
        Roster profile is empty. Select a student from the Roster registry.
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      
      {/* Title */}
      <h2 className="text-2xl font-black tracking-tight flex items-center gap-2 dark:text-white">
        <Brain className="h-6 w-6 text-primary-500 animate-pulse" />
        <span>Academic AI Core Insights</span>
      </h2>

      {/* Tabs Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { key: 'coach', label: 'Academic Coach', desc: 'LLM performance coaching', icon: Brain },
          { key: 'prediction', label: 'ML Predictions', desc: 'Next term forecasts', icon: TrendingUp },
          { key: 'career', label: 'Career advisory', desc: 'Subject-strength tracks', icon: Briefcase },
          { key: 'scholarships', label: 'Scholarship Finder', desc: 'Marks & category matches', icon: Award }
        ].map(item => (
          <button 
            key={item.key} 
            onClick={() => setActiveTab(item.key)}
            className={`p-4.5 rounded-2xl text-left flex items-center gap-4 transition-all hover:scale-[1.02] border cursor-pointer ${
              activeTab === item.key 
                ? 'bg-[#161D30] border-primary-500 ring-2 ring-primary-500/50 text-white shadow-md' 
                : 'bg-white dark:bg-[#161D30] border-slate-200 dark:border-[#222F4D]/60 text-slate-800 dark:text-slate-200'
            }`}
          >
            <div className="p-3 bg-primary-500/10 text-primary-500 rounded-xl">
              <item.icon className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs leading-tight">{item.label}</h4>
              <p className="text-[9px] text-slate-400 mt-1 font-semibold">{item.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="bg-white dark:bg-[#161D30] rounded-2xl p-6 min-h-64 border border-slate-200/50 dark:border-[#222F4D]/60 shadow-lg text-left">
        {loading ? (
          <div className="h-48 flex flex-col items-center justify-center gap-2.5">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            <p className="text-xs text-slate-400 uppercase font-black tracking-widest">Running AI algorithms...</p>
          </div>
        ) : (
          <div className="whitespace-pre-wrap leading-relaxed text-sm">
            
            {/* COACH PANEL */}
            {activeTab === 'coach' && (
              <div className="max-w-4xl">
                <h3 className="text-md font-bold mb-4 text-primary-500 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles className="h-4.5 w-4.5 text-primary-500" />
                  <span>Personalized Academic Review Remarks</span>
                </h3>
                <div className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-slate-50 dark:bg-[#090D1C] p-5 rounded-2xl border border-slate-200 dark:border-[#222F4D]/60 shadow-inner">
                  {coachContent}
                </div>
              </div>
            )}

            {/* PREDICTIONS PANEL */}
            {activeTab === 'prediction' && mlPredictions && (
              <div className="space-y-6 max-w-3xl">
                <h3 className="text-md font-bold text-primary-500 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="h-4.5 w-4.5 text-primary-500" />
                  <span>Scikit-Learn Predictive Model Analysis</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-[#090D1C] rounded-xl border border-slate-200 dark:border-[#222F4D]">
                    <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Next Semester Predicted Score</p>
                    <h4 className="text-xl font-black text-white mt-1">{mlPredictions.predicted_next_semester_percentage}%</h4>
                    <p className="text-[9px] text-slate-500 mt-1">GPA Scale: {mlPredictions.predicted_next_semester_cgpa} / 10</p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-[#090D1C] rounded-xl border border-slate-200 dark:border-[#222F4D]">
                    <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Improvement Probability</p>
                    <h4 className="text-xl font-black text-emerald-450 mt-1">{mlPredictions.probability_of_improvement_pct}%</h4>
                    <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${mlPredictions.probability_of_improvement_pct}%` }} />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-[#090D1C] rounded-xl border border-slate-200 dark:border-[#222F4D]">
                    <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Failure / Drop Risk Score</p>
                    <h4 className={`text-xl font-black mt-1 ${
                      mlPredictions.risk_level === 'High' ? 'text-rose-500' : 'text-slate-400'
                    }`}>{mlPredictions.risk_of_failure_pct}%</h4>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                      mlPredictions.risk_level === 'High' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>{mlPredictions.risk_level} Risk</span>
                  </div>
                </div>
              </div>
            )}

            {/* CAREER PANEL */}
            {activeTab === 'career' && (
              <div className="max-w-4xl space-y-4">
                <h3 className="text-md font-bold text-primary-500 uppercase tracking-widest flex items-center gap-2">
                  <Briefcase className="h-4.5 w-4.5 text-primary-500" />
                  <span>AI Career Recommendations Engine</span>
                </h3>

                <form onSubmit={handleCareerSearch} className="flex gap-3 max-w-lg mb-4">
                  <input 
                    type="text" 
                    placeholder="Enter hobby or interest (e.g. Coding, Drawing, Public Speaking)..." 
                    className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-[#0B0F19]/60 border border-slate-200 dark:border-[#222F4D] text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 text-xs font-semibold"
                    value={interestsInput}
                    onChange={(e) => setInterestsInput(e.target.value)}
                  />
                  <button type="submit" className="px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl text-xs active:scale-95 transition-all cursor-pointer">
                    Map Tracks
                  </button>
                </form>

                <div className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-slate-50 dark:bg-[#090D1C] p-5 rounded-2xl border border-slate-200 dark:border-[#222F4D]/60 shadow-inner">
                  {careerContent}
                </div>
              </div>
            )}

            {/* SCHOLARSHIPS PANEL */}
            {activeTab === 'scholarships' && (
              <div className="space-y-4 max-w-4xl">
                <h3 className="text-md font-bold text-primary-500 uppercase tracking-widest flex items-center gap-2">
                  <Award className="h-4.5 w-4.5 text-primary-500" />
                  <span>Matching Scholarships Finder</span>
                </h3>

                {scholarships.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {scholarships.map((sch, i) => (
                      <div key={i} className="p-5 bg-gradient-to-br from-indigo-950/20 to-[#1D2A47]/20 border border-slate-200 dark:border-[#222F4D]/80 rounded-2xl flex flex-col justify-between hover:border-primary-500/30 transition-all duration-300">
                        <div className="text-left">
                          <h4 className="font-extrabold text-sm text-white mb-2">{sch.name}</h4>
                          <p className="text-xs text-slate-400 leading-relaxed font-medium">{sch.description}</p>
                          <div className="flex gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-4">
                            <span>Min Marks: {sch.eligibility_min_percentage}%</span>
                            <span>Category: {sch.eligibility_category}</span>
                          </div>
                        </div>
                        <div className="mt-5 border-t border-[#222F4D] pt-3 flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-400">Award Amount:</span>
                          <span className="text-sm font-black text-emerald-450 bg-emerald-500/10 px-2 py-1 rounded-md">${sch.amount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-450 leading-relaxed">No matching scholarships found for your current category and percentages.</p>
                )}
              </div>
            )}

          </div>
        )}
      </div>

    </div>
  );
}
