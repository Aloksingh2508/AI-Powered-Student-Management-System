import React, { useState } from 'react';
import { Brain, User, Lock, Camera, AlertTriangle, Loader2, School, Eye, EyeOff } from 'lucide-react';
import FaceAuthModal from '../components/FaceAuthModal';

export default function Login({ handlePasswordLogin, handleFaceLogin, handleGoogleLogin, handleForgotPassword }) {
  const [roleTab, setRoleTab] = useState('student'); // 'student' or 'admin-teacher'
  const [username, setUsername] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [faceModalOpen, setFaceModalOpen] = useState(false);
  const [googleChooserOpen, setGoogleChooserOpen] = useState(false);
  const [customEmail, setCustomEmail] = useState('');

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
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-[#070B18] text-slate-800 dark:text-slate-100 p-4 font-sans relative overflow-hidden w-full transition-colors duration-300">
      {/* Dark theme glow animations */}
      <div className="hidden dark:block absolute top-[10%] left-[5%] w-[400px] h-[400px] bg-primary-600/10 rounded-full blur-[140px] animate-pulse" />
      <div className="hidden dark:block absolute bottom-[10%] right-[5%] w-[450px] h-[450px] bg-violet-600/10 rounded-full blur-[140px]" />
      
      {/* Form Card */}
      <div className="w-full max-w-md bg-white dark:bg-[#161D30]/65 border border-slate-250/60 dark:border-primary-500/20 rounded-3xl p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] dark:shadow-[0_0_50px_0_rgba(99,102,241,0.12)] relative z-10 hover:border-slate-300 dark:hover:border-primary-500/30 transition-all duration-500">
        
        {/* Header Title */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
            Login to Your Account
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Enter your credentials to access your account
          </p>
        </div>

        {/* Dynamic Role Tab Selectors */}
        <div className="flex gap-4 my-6">
          {/* Student Tab */}
          <button
            type="button"
            onClick={() => setRoleTab('student')}
            className={`flex-1 flex flex-col items-center justify-center py-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
              roleTab === 'student'
                ? 'border-blue-500 bg-blue-50/70 text-blue-600 dark:border-blue-500 dark:bg-blue-950/20 dark:text-blue-400 font-bold shadow-sm'
                : 'border-slate-150 bg-slate-50/40 text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#111726]/40 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <School className={`h-6 w-6 mb-2 ${roleTab === 'student' ? 'text-blue-500' : 'text-slate-400 dark:text-slate-500'}`} />
            <span className="text-xs tracking-wide">Student</span>
          </button>

          {/* Admin/Teacher Tab */}
          <button
            type="button"
            onClick={() => setRoleTab('admin-teacher')}
            className={`flex-1 flex flex-col items-center justify-center py-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
              roleTab === 'admin-teacher'
                ? 'border-blue-500 bg-blue-50/70 text-blue-600 dark:border-blue-500 dark:bg-blue-950/20 dark:text-blue-400 font-bold shadow-sm'
                : 'border-slate-150 bg-slate-50/40 text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#111726]/40 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <User className={`h-6 w-6 mb-2 ${roleTab === 'admin-teacher' ? 'text-blue-500' : 'text-slate-400 dark:text-slate-500'}`} />
            <span className="text-xs tracking-wide">Admin/Teacher</span>
          </button>
        </div>

        {/* Errors & Success Banners */}
        {error && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2 text-left">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500 dark:text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2 text-left">
            <span className="h-4 w-4 shrink-0 text-emerald-500 dark:text-emerald-400 font-bold">✓</span>
            <span>{success}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          
          {/* Username / Email Input */}
          <div className="text-left">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {roleTab === 'student' ? 'Username' : 'Email'}
            </label>
            <input 
              type="text" 
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090D1C] text-slate-900 dark:text-white placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm shadow-sm" 
              placeholder={roleTab === 'student' ? "Enter your username" : "Enter your email"} 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          {/* School Code Input (Only visible for Student tab) */}
          {roleTab === 'student' && (
            <div className="text-left">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                School Code
              </label>
              <input 
                type="text" 
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090D1C] text-slate-900 dark:text-white placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm shadow-sm" 
                placeholder="Enter your school code" 
                value={schoolCode}
                onChange={(e) => setSchoolCode(e.target.value)}
              />
            </div>
          )}

          {/* Password Input with Visibility Eye toggle */}
          <div className="text-left">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <button
                type="button"
                onClick={handleForgotPasswordClick}
                className="text-xs text-blue-500 hover:text-blue-600 dark:text-primary-400 dark:hover:text-primary-300 font-bold transition-colors cursor-pointer"
              >
                Forgot?
              </button>
            </div>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                className="w-full pl-4 pr-12 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090D1C] text-slate-900 dark:text-white placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm shadow-sm" 
                placeholder="Enter your password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Login Actions Button Row */}
          <div className="flex gap-3 pt-2">
            <button 
              type="submit" 
              disabled={loading} 
              className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer text-sm shadow-md shadow-blue-500/10"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span>Login as {roleTab === 'student' ? 'Student' : 'Admin/Teacher'}</span>
              )}
            </button>

            {/* Face scan biometric button */}
            <button 
              type="button"
              onClick={() => {
                if (!username.trim()) {
                  setError("Please enter your Username first before performing face login.");
                  return;
                }
                setFaceModalOpen(true);
              }}
              className="py-3.5 px-4 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-650 dark:bg-[#090D1C] dark:hover:bg-[#111726] dark:border-slate-800 dark:text-slate-300 font-semibold rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              title="Sign in with Face Recognition"
            >
              <Camera className="h-5 w-5 text-blue-500 dark:text-primary-450" />
            </button>
          </div>
        </form>

        {/* Separator */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold">
            <span className="bg-white dark:bg-[#161D30] px-3 text-slate-400 dark:text-slate-500">Or continue with</span>
          </div>
        </div>

        {/* Google SSO chooser */}
        <button 
          type="button"
          onClick={() => setGoogleChooserOpen(true)}
          className="w-full py-3 bg-white hover:bg-slate-55 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-800 dark:text-slate-200 dark:bg-[#090D1C] dark:hover:bg-[#111726] font-bold rounded-xl flex items-center justify-center gap-3 cursor-pointer text-sm shadow-sm transition-all"
        >
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.555 0-6.437-2.883-6.437-6.437s2.882-6.437 6.437-6.437c1.537 0 2.935.542 4.036 1.44l3.125-3.124C19.123 2.115 15.908 1 12.24 1 6.033 1 12.24 6.033 1 12.24s5.033 11.24 11.24 11.24c5.898 0 10.743-4.254 10.743-11.24 0-.668-.078-1.32-.178-1.955H12.24z"
            />
          </svg>
          <span>Sign in with Google</span>
        </button>

      </div>

      {/* Face Authentication Modal */}
      <FaceAuthModal 
        isOpen={faceModalOpen}
        onClose={() => setFaceModalOpen(false)}
        onCapture={onFaceCapture}
        title="Biometric Face Login Scan"
      />

      {/* Google chooser pop-up */}
      {googleChooserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#161D30] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-left relative z-50">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white font-bold">Google Accounts</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Choose an account to sign in</p>
              </div>
              <button 
                onClick={() => setGoogleChooserOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold cursor-pointer"
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
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-[#090D1C] dark:hover:bg-[#111726] border border-slate-200 dark:border-slate-800 text-left transition-all cursor-pointer group"
                >
                  <div className="h-9 w-9 bg-blue-500/10 text-blue-600 dark:bg-primary-600/10 dark:text-primary-400 rounded-xl flex items-center justify-center font-bold">
                    {account.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-500 dark:group-hover:text-primary-400 transition-colors">{account.name}</p>
                    <p className="text-xs text-slate-500">{account.email}</p>
                  </div>
                </button>
              ))}

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold">
                  <span className="bg-white dark:bg-[#161D30] px-2 text-slate-400 dark:text-slate-500">Or use custom email</span>
                </div>
              </div>

              <div className="space-y-2">
                <input 
                  type="email" 
                  placeholder="Enter your student email" 
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090D1C] text-slate-900 dark:text-white placeholder-slate-450 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm shadow-sm"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!customEmail.trim()) return;
                    setGoogleChooserOpen(false);
                    setError('');
                    setLoading(true);
                    try {
                      await handleGoogleLogin(customEmail.trim());
                    } catch (err) {
                      setError(err.message || "Google login failed.");
                      setLoading(false);
                    }
                  }}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs active:scale-[0.98] transition-all cursor-pointer shadow-sm shadow-blue-500/10"
                >
                  Sign in with this Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
