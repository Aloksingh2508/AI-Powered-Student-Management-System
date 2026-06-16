import React, { useState } from 'react';
import { Brain, User, Lock, Camera, AlertTriangle, Loader2 } from 'lucide-react';
import FaceAuthModal from '../components/FaceAuthModal';

export default function Login({ handlePasswordLogin, handleFaceLogin, handleGoogleLogin, handleForgotPassword }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [faceModalOpen, setFaceModalOpen] = useState(false);
  const [googleChooserOpen, setGoogleChooserOpen] = useState(false);

  const googleAccounts = [
    { name: "John Doe", email: "john.doe@school.edu", avatar: "JD" },
    { name: "Jane Smith", email: "jane.smith@school.edu", avatar: "JS" },
    { name: "Alice Johnson", email: "alice.johnson@school.edu", avatar: "AJ" },
  ];

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await handlePasswordLogin(username, password);
    } catch (err) {
      setError(err.message || "Failed to log in.");
      setLoading(false);
    }
  };

  const onFaceCapture = async (base64Image) => {
    setError('');
    setSuccess('');
    setLoading(true);
    setFaceModalOpen(false);
    try {
      if (!username.trim()) {
        throw new Error("Please enter your Username first to identify your account for face scan.");
      }
      await handleFaceLogin(username, base64Image);
    } catch (err) {
      setError(err.message || "Face login failed.");
      setLoading(false);
    }
  };

  const handleForgotPasswordClick = async () => {
    setError('');
    setSuccess('');
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError("Please enter your Username or Roll Number first to request a password reset.");
      return;
    }
    setLoading(true);
    try {
      const msg = await handleForgotPassword(trimmedUsername);
      setSuccess(msg || "Your password has been reset to the administrator's password.");
    } catch (err) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070B18] text-slate-100 p-4 font-sans relative overflow-hidden w-full">
      {/* Glow animations */}
      <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] bg-primary-600/15 rounded-full blur-[140px] animate-pulse" />
      <div className="absolute bottom-[10%] right-[5%] w-[450px] h-[450px] bg-violet-600/15 rounded-full blur-[140px]" />
      
      {/* Form Card */}
      <div className="w-full max-w-md bg-[#161D30]/60 backdrop-blur-xl rounded-3xl p-8 shadow-[0_0_50px_0_rgba(99,102,241,0.15)] relative z-10 border border-primary-500/20 hover:border-primary-500/30 transition-all duration-500">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-tr from-primary-500 to-indigo-500 rounded-2xl mb-4 shadow-[0_0_20px_rgba(99,102,241,0.4)]">
            <Brain className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-primary-200">
            LuminaGrade <span className="text-primary-400">AI</span>
          </h1>
          <p className="text-xs text-slate-400 mt-2 font-medium tracking-wide">COGNITIVE ACADEMIC CONSOLE</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 text-rose-350 rounded-xl text-xs flex items-center gap-2 text-left">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-450" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 rounded-xl text-xs flex items-center gap-2 text-left">
              <span className="h-4 w-4 shrink-0 text-emerald-400 font-bold">✓</span>
              <span>{success}</span>
            </div>
          )}

          <div className="text-left">
            <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-widest mb-2">Username / Roll Number</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
              <input 
                type="text" 
                className="w-full pl-11 pr-4 py-3 bg-[#090D1C] border border-slate-800 text-white placeholder-slate-650 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all text-sm" 
                placeholder="e.g. admin or S1001" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="text-left">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-widest">Secret Password</label>
              <button
                type="button"
                onClick={handleForgotPasswordClick}
                className="text-[10px] text-primary-400 hover:text-primary-300 font-bold transition-colors cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
              <input 
                type="password" 
                className="w-full pl-11 pr-4 py-3 bg-[#090D1C] border border-slate-800 text-white placeholder-slate-655 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all text-sm" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              type="submit" 
              disabled={loading} 
              className="flex-1 py-3.5 bg-gradient-to-r from-primary-600 to-indigo-650 hover:from-primary-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-[0_4px_20px_rgba(99,102,241,0.3)] active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span>Sign In</span>
              )}
            </button>

            <button 
              type="button"
              onClick={() => {
                if (!username.trim()) {
                  setError("Please fill in your Username first before performing face login.");
                  return;
                }
                setFaceModalOpen(true);
              }}
              className="py-3.5 px-4 bg-[#090D1C] hover:bg-[#111726] border border-slate-800 text-slate-300 font-semibold rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              title="Sign in with Face Recognition"
            >
              <Camera className="h-5 w-5 text-primary-450" />
            </button>
          </div>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-850"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold">
            <span className="bg-[#161D30] px-3 text-slate-500">Or continue with</span>
          </div>
        </div>

        <button 
          type="button"
          onClick={() => setGoogleChooserOpen(true)}
          className="w-full py-3 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl flex items-center justify-center gap-3 cursor-pointer text-sm shadow-sm transition-all"
        >
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.555 0-6.437-2.883-6.437-6.437s2.882-6.437 6.437-6.437c1.537 0 2.935.542 4.036 1.44l3.125-3.124C19.123 2.115 15.908 1 12.24 1 6.033 1 12.24 6.033 1 12.24s5.033 11.24 11.24 11.24c5.898 0 10.743-4.254 10.743-11.24 0-.668-.078-1.32-.178-1.955H12.24z"
            />
          </svg>
          <span>Sign in with Google</span>
        </button>

        <div className="mt-8 pt-6 border-t border-slate-800/85 text-center text-xs text-slate-500 space-y-2">
          <p>Admin / Teacher: <span className="text-slate-300 font-mono">admin / teacher</span> (pwd: <span className="text-slate-300 font-mono">admin123 / teacher123</span>)</p>
          <p>Students: <span className="text-slate-300 font-mono">student / alice</span> (pwd: <span className="text-slate-300 font-mono">student123 / alice123</span>)</p>
        </div>
      </div>

      <FaceAuthModal 
        isOpen={faceModalOpen}
        onClose={() => setFaceModalOpen(false)}
        onCapture={onFaceCapture}
        title="Biometric Face Login Scan"
      />

      {googleChooserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#161D30] border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-left relative z-50">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-extrabold text-lg text-white">Google Accounts</h3>
                <p className="text-xs text-slate-400 mt-1">Choose an account to sign in</p>
              </div>
              <button 
                onClick={() => setGoogleChooserOpen(false)}
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              {googleAccounts.map((account, idx) => (
                <button
                  key={idx}
                  onClick={async () => {
                    setGoogleChooserOpen(false);
                    setError('');
                    setLoading(true);
                    try {
                      await handleGoogleLogin(account.email);
                    } catch (err) {
                      setError(err.message || "Google login failed.");
                      setLoading(false);
                    }
                  }}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-[#090D1C] hover:bg-[#111726] border border-slate-800 text-left transition-all cursor-pointer group"
                >
                  <div className="h-9 w-9 bg-primary-600/10 text-primary-400 rounded-xl flex items-center justify-center font-bold">
                    {account.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-200 group-hover:text-primary-400 transition-colors">{account.name}</p>
                    <p className="text-xs text-slate-500">{account.email}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
