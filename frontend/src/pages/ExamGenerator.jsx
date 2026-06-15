import React, { useState } from 'react';
import { BookOpen, RefreshCw, Printer, AlertTriangle, FileText, ChevronRight, Copy, Check } from 'lucide-react';

export default function ExamGenerator({ subjects, fetchAPI }) {
  const [subjectId, setSubjectId] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [paper, setPaper] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!subjectId) {
      alert("Please select a subject first!");
      return;
    }
    setLoading(true);
    setPaper(null);
    try {
      const res = await fetchAPI("/ai/generate-exam", {
        method: 'POST',
        body: {
          subject_id: parseInt(subjectId),
          difficulty: difficulty
        }
      });
      const data = await res.json();
      setPaper(data);
    } catch (err) {
      alert("Error generating exam paper: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!paper) return;
    let text = `EXAM PAPER: ${subjects.find(s => s.id === parseInt(subjectId))?.name || ""} (${difficulty} Level)\n\n`;
    text += "SECTION A: MULTIPLE CHOICE QUESTIONS (MCQs)\n";
    paper.mcqs.forEach((m, idx) => {
      text += `${idx + 1}. ${m.question}\n   ${m.options.join("\n   ")}\n\n`;
    });
    text += "\nSECTION B: SHORT QUESTIONS\n";
    paper.short_questions.forEach((q, idx) => {
      text += `${idx + 1}. ${q}\n`;
    });
    text += "\nSECTION C: LONG QUESTIONS\n";
    paper.long_questions.forEach((q, idx) => {
      text += `${idx + 1}. ${q}\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const printPaper = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Configuration Header */}
      <div className="bg-white dark:bg-[#161D30] rounded-2xl p-5 border border-slate-200/50 dark:border-[#222F4D]/60 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-lg font-black dark:text-white">AI Exam Paper Generator</h2>
          <p className="text-xs text-slate-400 mt-1">Generate diagnostic MCQs and theoretical exam sheets instantly</p>
        </div>

        <form onSubmit={handleGenerate} className="flex flex-wrap gap-3 w-full md:w-auto items-center justify-end">
          <select 
            className="px-4 py-2 bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#222F4D] text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none font-bold text-xs"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            required
          >
            <option value="">Choose Course...</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select 
            className="px-4 py-2 bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#222F4D] text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none font-bold text-xs"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <button 
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 active:scale-95 transition-all shadow-md shadow-primary-600/20 cursor-pointer"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
            <span>Draft Paper</span>
          </button>
        </form>
      </div>

      {loading && (
        <div className="h-64 bg-white dark:bg-[#161D30] rounded-2xl border border-slate-200/50 dark:border-[#222F4D]/60 flex flex-col items-center justify-center gap-2.5">
          <RefreshCw className="h-8 w-8 animate-spin text-primary-500" />
          <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Compiling exam bank...</p>
        </div>
      )}

      {/* Generated Paper View */}
      {paper && (
        <div className="bg-white dark:bg-[#161D30] rounded-2xl border border-slate-200/50 dark:border-[#222F4D]/60 shadow-lg p-8 space-y-8 relative overflow-hidden" id="printable-exam">
          
          {/* Action Overlay */}
          <div className="absolute top-6 right-6 flex gap-2 no-print">
            <button 
              onClick={copyToClipboard}
              className="p-2.5 bg-slate-100 dark:bg-[#222F4D] hover:bg-slate-200 dark:hover:bg-[#1D2A47] text-slate-700 dark:text-slate-350 rounded-xl transition-all cursor-pointer border border-slate-200 dark:border-transparent"
              title="Copy to Clipboard"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-450" /> : <Copy className="h-4 w-4" />}
            </button>
            <button 
              onClick={printPaper}
              className="p-2.5 bg-slate-100 dark:bg-[#222F4D] hover:bg-slate-200 dark:hover:bg-[#1D2A47] text-slate-700 dark:text-slate-350 rounded-xl transition-all cursor-pointer border border-slate-200 dark:border-transparent"
              title="Print Exam Sheet"
            >
              <Printer className="h-4 w-4" />
            </button>
          </div>

          {/* Exam Header */}
          <div className="text-center space-y-2 border-b border-[#222F4D]/60 pb-6">
            <h1 className="text-2xl font-black tracking-tight dark:text-white uppercase">EduMind AI Secondary School</h1>
            <p className="text-sm font-bold text-slate-400">Diagostic Mock Evaluation Assessment</p>
            <div className="flex justify-center gap-6 text-xs text-slate-500 font-bold uppercase tracking-wider pt-2">
              <span>Subject: {subjects.find(s => s.id === parseInt(subjectId))?.name}</span>
              <span>•</span>
              <span>Level: {difficulty}</span>
              <span>•</span>
              <span>Duration: 90 Minutes</span>
            </div>
          </div>

          {/* SECTION A: MCQs */}
          <div className="space-y-4 text-left">
            <h3 className="font-extrabold text-sm border-b border-[#222F4D]/40 pb-2 dark:text-white">SECTION A: MULTIPLE CHOICE QUESTIONS (MCQs)</h3>
            <div className="space-y-4 pl-2">
              {paper.mcqs.map((m, idx) => (
                <div key={idx} className="space-y-2">
                  <p className="font-bold text-sm text-slate-200">{idx + 1}. {m.question}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4">
                    {m.options.map((opt, oIdx) => (
                      <span key={oIdx} className="text-xs text-slate-450 font-medium">{opt}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION B: SHORT QUESTIONS */}
          <div className="space-y-4 text-left">
            <h3 className="font-extrabold text-sm border-b border-[#222F4D]/40 pb-2 dark:text-white">SECTION B: SHORT QUESTIONS</h3>
            <ol className="list-decimal list-inside space-y-3 pl-2 text-sm text-slate-200 font-semibold">
              {paper.short_questions.map((q, idx) => (
                <li key={idx}>{q}</li>
              ))}
            </ol>
          </div>

          {/* SECTION C: LONG QUESTIONS */}
          <div className="space-y-4 text-left">
            <h3 className="font-extrabold text-sm border-b border-[#222F4D]/40 pb-2 dark:text-white">SECTION C: LONG QUESTIONS</h3>
            <ol className="list-decimal list-inside space-y-3 pl-2 text-sm text-slate-200 font-semibold">
              {paper.long_questions.map((q, idx) => (
                <li key={idx}>{q}</li>
              ))}
            </ol>
          </div>

        </div>
      )}

      {!paper && !loading && (
        <div className="bg-white dark:bg-[#161D30] rounded-2xl border border-slate-200/50 dark:border-[#222F4D]/60 p-12 text-center max-w-sm mx-auto shadow-sm">
          <BookOpen className="h-10 w-10 text-slate-500 mx-auto mb-3" />
          <p className="text-sm font-bold dark:text-white mb-1">Generate Diagnostic Mock Exams</p>
          <p className="text-xs text-slate-450 leading-relaxed">Choose a course and difficulty level from the options, then click Draft Paper to generate questions.</p>
        </div>
      )}

    </div>
  );
}
