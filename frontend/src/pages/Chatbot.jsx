import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Loader2 } from 'lucide-react';

export default function Chatbot({ chatMessages, setChatMessages, chatLoading, setChatLoading, fetchAPI, studentId, selectedStudent }) {
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  const handleChatSend = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const activeStudentId = studentId || (selectedStudent ? selectedStudent.id : null);
      const historyPayload = chatMessages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        content: msg.text
      }));

      const res = await fetchAPI('/ai/chat', {
        method: 'POST',
        body: {
          message: userMsg,
          student_id: activeStudentId,
          chat_history: historyPayload
        }
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { sender: 'ai', text: "Sorry, I had trouble reading your request. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col bg-white dark:bg-[#161D30] rounded-2xl overflow-hidden border border-slate-200/50 dark:border-[#222F4D]/60 shadow-lg text-left">
      
      {/* Title bar */}
      <div className="px-6 py-4 bg-slate-50 dark:bg-[#0B0F19]/40 border-b border-slate-200/40 dark:border-[#222F4D]/40 flex items-center gap-3">
        <div className="p-2.5 bg-primary-50/10 text-primary-600 dark:text-primary-455 rounded-xl">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-extrabold dark:text-white">Cognitive Advisor doubt Solver</h3>
          <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">EduMind AI Live Connection</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/10 dark:bg-[#080C14]/10">
        {chatMessages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[70%] rounded-2xl p-4 text-sm leading-relaxed ${
              msg.sender === 'user' 
                ? 'bg-gradient-to-tr from-primary-600 to-indigo-650 text-white rounded-tr-none shadow-md' 
                : 'bg-white dark:bg-[#161D30]/70 border border-slate-200/10 dark:border-[#222F4D]/60 rounded-tl-none font-medium dark:text-slate-300'
            }`}>
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        
        {chatLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-[#161D30]/70 border border-slate-200/10 dark:border-[#222F4D]/60 rounded-2xl rounded-tl-none p-4 shadow flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">AI Thinking...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Prompts list */}
      <div className="px-6 py-2.5 bg-slate-100/50 dark:bg-[#0B0F19]/30 flex flex-wrap gap-2 border-t border-slate-250/20 dark:border-[#222F4D]/40">
        {[
          "How do I improve in Mathematics?",
          "Explain what career matches my grades",
          "Recommend study resources for Science"
        ].map((promptText, i) => (
          <button 
            key={i}
            onClick={() => setChatInput(promptText)}
            className="px-3 py-1.5 bg-white dark:bg-[#161D30]/60 hover:bg-slate-50 dark:hover:bg-[#222F4D] border border-slate-200/40 dark:border-[#222F4D]/40 text-[10px] font-bold rounded-full transition-all cursor-pointer shadow-sm dark:text-slate-350"
          >
            {promptText}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleChatSend} className="p-4 bg-white dark:bg-[#161D30]/60 border-t border-slate-200/45 dark:border-[#222F4D]/40 flex gap-3">
        <input 
          type="text" 
          className="w-full px-4 py-3 bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#222F4D] text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent transition-all text-sm" 
          placeholder="Ask advisor a doubt question about your grades or request a study plan..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          disabled={chatLoading}
        />
        <button 
          type="submit" 
          disabled={chatLoading || !chatInput.trim()}
          className="px-4 py-3 bg-gradient-to-r from-primary-600 to-indigo-650 hover:from-primary-500 hover:to-indigo-500 text-white font-semibold rounded-xl active:scale-[0.98] transition-all flex items-center justify-center shrink-0 shadow-md shadow-primary-600/20 cursor-pointer"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>

    </div>
  );
}
