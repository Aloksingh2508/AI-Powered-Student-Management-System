import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, HelpCircle } from 'lucide-react';

export default function VoiceAssistant({ userRole, setActiveTab, studentReport, handleExportPDF }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';
      
      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onerror = () => setIsListening(false);
      
      rec.onresult = (event) => {
        const text = event.results[0][0].transcript.toLowerCase();
        setTranscript(text);
        processVoiceCommand(text);
      };
      setRecognition(rec);
    }
  }, [studentReport]);

  const speak = (msg) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(msg);
      window.speechSynthesis.speak(utterance);
      setResponse(msg);
    }
  };

  const processVoiceCommand = (command) => {
    if (command.includes("result") || command.includes("marks") || command.includes("grades")) {
      setActiveTab("dashboard");
      if (userRole === "Student" && studentReport) {
        speak(`Your overall percentage is ${studentReport.overall_percentage} percent, and final grade is ${studentReport.overall_grade}.`);
      } else {
        speak("Navigated to Overview Analytics dashboard.");
      }
    } 
    else if (command.includes("rank") || command.includes("position")) {
      if (userRole === "Student" && studentReport) {
        speak(`You rank number ${studentReport.class_rank} in your class section.`);
      } else {
        speak("Class ranking is available on student detail cards.");
      }
    } 
    else if (command.includes("report card") || command.includes("download") || command.includes("pdf")) {
      if (userRole === "Student" && studentReport) {
        speak("Compiling report card PDF and starting download.");
        handleExportPDF(studentReport.student_id);
      } else {
        speak("Please go to the student roster, choose a student, and click PDF Report.");
      }
    } 
    else if (command.includes("roster") || command.includes("student list") || command.includes("students")) {
      if (userRole !== "Student") {
        setActiveTab("students");
        speak("Navigating to Student Roster registry.");
      } else {
        speak("Access denied. Roster dashboard is reserved for teachers and administrators.");
      }
    } 
    else if (command.includes("attendance")) {
      if (userRole !== "Student") {
        setActiveTab("attendance");
        speak("Opened attendance sheets logging tab.");
      } else {
        speak("You can view attendance details on your digital twin card.");
      }
    } 
    else if (command.includes("chatbot") || command.includes("doubt") || command.includes("advisor")) {
      setActiveTab("chatbot");
      speak("Welcome to Doubt Solving chatbot deck. Ask me anything about your marks.");
    }
    else {
      speak(`Received: "${command}". Try saying 'show my result', 'what is my rank', or 'go to roster'.`);
    }
  };

  const toggleListen = () => {
    if (!recognition) {
      alert("Speech recognition is not supported in this browser. Try Chrome or Edge.");
      return;
    }
    if (isListening) {
      recognition.stop();
    } else {
      setTranscript('');
      setResponse('');
      recognition.start();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-[#161D30]/90 text-white p-4.5 rounded-2xl shadow-[0_4px_30px_rgba(99,102,241,0.25)] border border-indigo-500/30 flex items-center gap-4 max-w-sm backdrop-blur-md">
        <button 
          onClick={toggleListen}
          className={`p-3.5 rounded-xl transition-all cursor-pointer ${
            isListening 
              ? 'bg-rose-500 hover:bg-rose-600 animate-pulse' 
              : 'bg-primary-600 hover:bg-primary-500'
          }`}
          title="Toggle Result Voice Assistant"
        >
          {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>

        <div className="text-left flex-1 min-w-[180px]">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <span>Voice Result Assistant</span>
            {isListening && <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />}
          </p>
          <p className="text-xs font-semibold text-slate-200 mt-1 truncate">
            {transcript ? `"${transcript}"` : "Click Mic and say 'What is my rank?'"}
          </p>
          {response && (
            <p className="text-[10px] text-indigo-400 font-medium mt-1 leading-snug flex items-center gap-1">
              <Volume2 className="h-3 w-3 shrink-0" />
              <span>{response}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
