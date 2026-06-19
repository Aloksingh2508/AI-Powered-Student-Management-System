import React, { useState, useEffect } from 'react';
import { Brain, User, Lock, Camera, AlertTriangle, Loader2, School, Eye, EyeOff, ShieldCheck, Sparkles, ArrowRight, Settings } from 'lucide-react';
import FaceAuthModal from '../components/FaceAuthModal';
import { API_BASE, setAPIBase } from '../services/api';

export default function Login({ handlePasswordLogin, handleFaceLogin, handleGoogleLogin, handleForgotPassword, onSetupComplete }) {
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

  // --- First-time setup state ---
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [setupUsername, setSetupUsername] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirm, setSetupConfirm] = useState('');
  const [showSetupPassword, setShowSetupPassword] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState('');
  const [setupSuccess, setSetupSuccess] = useState('');

  // --- API Configuration & Unreachability States ---
  const [isApiUnreachable, setIsApiUnreachable] = useState(false);
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [customApiInput, setCustomApiInput] = useState(API_BASE);
  const [apiSaveSuccess, setApiSaveSuccess] = useState(false);

  // --- Admin Registration states ---
  const [isRegisteringAdmin, setIsRegisteringAdmin] = useState(false);
  const [regUsername, setRegUsername] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const googleAccounts = [
    { name: "John Doe", email: "john.doe@school.edu", avatar: "JD" },
    { name: "Jane Smith", email: "jane.smith@school.edu", avatar: "JS" },
    { name: "Alice Johnson", email: "alice.johnson@school.edu", avatar: "AJ" },
  ];

  // Reusable verify connection helper
  const verifyConnection = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/setup-status`);
      const data = await res.json();
      setNeedsSetup(data.needs_setup === true);
      setIsApiUnreachable(false);
      return true;
    } catch (err) {
      console.error("Failed to connect to API:", err);
      setNeedsSetup(false);
      setIsApiUnreachable(true);
      return false;
    } finally {
      setCheckingSetup(false);
    }
  };

  // Check if this is first-time setup
  useEffect(() => {
    verifyConnection();
  }, []);

  const handleSaveApiBase = async (e) => {
    e.preventDefault();
    setApiSaveSuccess(false);
    setCheckingSetup(true);
    
    // Update live API_BASE
    setAPIBase(customApiInput.trim());
    
    // Re-verify connection
    const connected = await verifyConnection();
    if (connected) {
      setApiSaveSuccess(true);
      setTimeout(() => {
        setApiSaveSuccess(false);
        setShowApiConfig(false);
      }, 2000);
    }
  };

  const renderApiSettings = () => {
    return (
      <>
        {/* Settings button */}
        <button 
          type="button"
          onClick={() => setShowApiConfig(!showApiConfig)}
          className="absolute right-6 top-6 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-800/50 cursor-pointer z-20"
          title="API Connection Settings"
        >
          <Settings className={`h-5 w-5 ${showApiConfig ? 'animate-spin' : ''}`} />
        </button>

        {/* API settings panel */}
        {showApiConfig && (
          <div className="mb-6 p-4 bg-slate-50 dark:bg-[#090D1C] border border-slate-200 dark:border-slate-800 rounded-2xl text-left relative z-20">
            <h3 className="font-extrabold text-xs text-slate-900 dark:text-white mb-2 flex items-center gap-1.5 font-bold">
              <Settings className="h-3.5 w-3.5 text-indigo-500" />
              <span>API Gateway Configuration</span>
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
              If the backend is hosted on Render or routed via an HTTPS tunnel (e.g., ngrok), update the gateway URL below:
            </p>
            <form onSubmit={handleSaveApiBase} className="space-y-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-widest mb-1">
                  API Endpoint URL
                </label>
                <input 
                  type="url" 
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161D30] text-slate-900 dark:text-white placeholder-slate-450 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs shadow-sm font-mono" 
                  placeholder="e.g. https://your-backend.render.com/api" 
                  value={customApiInput}
                  onChange={(e) => setCustomApiInput(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={checkingSetup}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs active:scale-[0.98] transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  {checkingSetup ? <Loader2 className="h-3 w-3 animate-spin" /> : <span>Apply & Verify</span>}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setCustomApiInput("http://localhost:8000/api");
                    setAPIBase("http://localhost:8000/api");
                    setCheckingSetup(true);
                    await verifyConnection();
                  }}
                  className="px-3 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-350 dark:hover:bg-slate-700 text-slate-705 dark:text-slate-200 font-semibold rounded-lg text-xs transition-all cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </form>
            {apiSaveSuccess && (
              <p className="text-[10px] text-emerald-500 mt-2 font-bold flex items-center gap-1">✓ Connected successfully!</p>
            )}
            {isApiUnreachable && !apiSaveSuccess && (
              <p className="text-[10px] text-rose-500 mt-2 font-bold flex items-center gap-1">✗ Connection failed. Please check the URL.</p>
            )}
          </div>
        )}

        {/* API unreachable warning banner */}
        {isApiUnreachable && !showApiConfig && (
          <div className="mb-6 p-3 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-300 rounded-2xl text-[11px] text-left leading-relaxed relative z-20">
            <div className="flex gap-2 items-start">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
              <div>
                <span className="font-bold block text-xs">Backend API Unreachable</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Attempting to connect to <code className="font-mono text-[9px] bg-slate-200/50 dark:bg-slate-900 px-1 py-0.5 rounded">{API_BASE}</code>. 
                  If this is a production deployment on Vercel, please click the <button type="button" onClick={() => setShowApiConfig(true)} className="text-indigo-500 dark:text-indigo-400 hover:underline font-bold bg-transparent border-none p-0 cursor-pointer">settings gear</button> to configure your live API gateway.
                </span>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    setSetupError('');
    setSetupSuccess('');
    setSetupLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: setupUsername.trim(),
          password: setupPassword,
          confirm_password: setupConfirm
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Setup failed.");
      }

      setSetupSuccess(data.detail || "Admin account created!");

      // Auto-login with the returned token
      if (data.access_token && onSetupComplete) {
        setTimeout(() => {
          onSetupComplete(data);
        }, 1500);
      } else {
        setTimeout(() => {
          setNeedsSetup(false);
        }, 2000);
      }
    } catch (err) {
      setSetupError(err.message || "Failed to create admin account.");
    } finally {
      setSetupLoading(false);
    }
  };

  const handleAdminRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (regPassword !== regConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername.trim(),
          role: 'Admin',
          password: regPassword,
          full_name: regFullName.trim() || null,
          email: regEmail.trim() || null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Registration failed.");
      }

      setSuccess("Admin account created successfully! Please log in.");
      setIsRegisteringAdmin(false);
      setUsername(regUsername); // prefill username
      setPassword('');
      setRegUsername('');
      setRegFullName('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await handlePasswordLogin(username.trim(), password.trim());
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

  if (checkingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-[#070B18] transition-colors duration-300">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // --- First-Time Admin Setup Screen ---
  if (needsSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-[#070B18] text-slate-800 dark:text-slate-100 p-4 font-sans relative overflow-hidden w-full transition-colors duration-300">
        {/* Animated glow blobs */}
        <div className="hidden dark:block absolute top-[15%] left-[10%] w-[350px] h-[350px] bg-emerald-600/12 rounded-full blur-[120px] animate-pulse" />
        <div className="hidden dark:block absolute bottom-[15%] right-[8%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[140px]" />
        <div className="hidden dark:block absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/8 rounded-full blur-[160px]" />

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-full text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              <span>First-Time Setup</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#161D30]/65 border border-slate-250/60 dark:border-emerald-500/15 rounded-3xl p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] dark:shadow-[0_0_50px_0_rgba(16,185,129,0.08)] hover:border-slate-300 dark:hover:border-emerald-500/25 transition-all duration-500 relative">
            {renderApiSettings()}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25 mb-4">
                <ShieldCheck className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
                Create Admin Account
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Welcome to EduMind AI! Set up your administrator account to get started. This can only be done <strong className="text-slate-700 dark:text-slate-200">once</strong>.
              </p>
            </div>

            <div className="mb-5 p-3.5 bg-blue-50/70 dark:bg-blue-950/25 border border-blue-200/70 dark:border-blue-800/40 rounded-xl text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2.5 text-left">
              <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
              <span>This admin account will have full control over the system — managing students, teachers, marks, and all platform settings.</span>
            </div>

            {setupError && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2 text-left">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500 dark:text-rose-400" />
                <span>{setupError}</span>
              </div>
            )}

            {setupSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2 text-left">
                <span className="h-4 w-4 shrink-0 text-emerald-500 dark:text-emerald-400 font-bold">✓</span>
                <span>{setupSuccess} Redirecting to dashboard...</span>
              </div>
            )}

            <form onSubmit={handleSetupSubmit} className="space-y-4">
              <div className="text-left">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Admin Username
                </label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090D1C] text-slate-900 dark:text-white placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm shadow-sm" 
                  placeholder="e.g. admin, principal" 
                  value={setupUsername}
                  onChange={(e) => setSetupUsername(e.target.value)}
                  required
                  minLength={3}
                  disabled={setupLoading || !!setupSuccess}
                />
              </div>

              <div className="text-left">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input 
                    type={showSetupPassword ? "text" : "password"} 
                    className="w-full pl-4 pr-12 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090D1C] text-slate-900 dark:text-white placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm shadow-sm" 
                    placeholder="Minimum 6 characters" 
                    value={setupPassword}
                    onChange={(e) => setSetupPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={setupLoading || !!setupSuccess}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSetupPassword(!showSetupPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {showSetupPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="text-left">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm Password
                </label>
                <input 
                  type="password" 
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090D1C] text-slate-900 dark:text-white placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm shadow-sm" 
                  placeholder="Re-enter your password" 
                  value={setupConfirm}
                  onChange={(e) => setSetupConfirm(e.target.value)}
                  required
                  minLength={6}
                  disabled={setupLoading || !!setupSuccess}
                />
                {setupConfirm && setupPassword !== setupConfirm && (
                  <p className="text-xs text-rose-500 mt-1.5 font-medium">Passwords do not match</p>
                )}
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={setupLoading || !!setupSuccess || (setupConfirm && setupPassword !== setupConfirm)} 
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-400 disabled:to-slate-400 dark:disabled:from-slate-700 dark:disabled:to-slate-700 text-white font-bold rounded-xl active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2.5 cursor-pointer text-sm shadow-lg shadow-emerald-500/20"
                >
                  {setupLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : setupSuccess ? (
                    <span>✓ Account Created</span>
                  ) : (
                    <>
                      <span>Create Admin Account & Login</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <p className="text-center text-[11px] text-slate-400 dark:text-slate-600 mt-5">
            This setup wizard appears only once when the system has no admin account.
          </p>
        </div>
      </div>
    );
  }

  // --- Normal Login / Admin Register Screen ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-[#070B18] text-slate-800 dark:text-slate-100 p-4 font-sans relative overflow-hidden w-full transition-colors duration-300">
      {/* Dark theme glow animations */}
      <div className="hidden dark:block absolute top-[10%] left-[5%] w-[400px] h-[400px] bg-primary-600/10 rounded-full blur-[140px] animate-pulse" />
      <div className="hidden dark:block absolute bottom-[10%] right-[5%] w-[450px] h-[450px] bg-violet-600/10 rounded-full blur-[140px]" />
      
      {/* Form Card */}
      <div className="w-full max-w-md bg-white dark:bg-[#161D30]/65 border border-slate-250/60 dark:border-primary-500/20 rounded-3xl p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] dark:shadow-[0_0_50px_0_rgba(99,102,241,0.12)] relative z-10 hover:border-slate-300 dark:hover:border-primary-500/30 transition-all duration-500">
        {renderApiSettings()}
        
        {isRegisteringAdmin ? (
          <>
            {/* Header Title */}
            <div className="text-center mb-6">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
                Register Admin Account
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Create a new administrator account
              </p>
            </div>

            {/* Errors & Success Banners */}
            {error && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2 text-left">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500 dark:text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-350 rounded-xl text-xs flex items-center gap-2 text-left">
                <span className="h-4 w-4 shrink-0 text-emerald-500 dark:text-emerald-400 font-bold">✓</span>
                <span>{success}</span>
              </div>
            )}

            {/* Admin Register Form */}
            <form onSubmit={handleAdminRegister} className="space-y-4">
              {/* Username */}
              <div className="text-left">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Admin Username
                </label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090D1C] text-slate-900 dark:text-white placeholder-slate-450 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm shadow-sm" 
                  placeholder="e.g. admin_jane" 
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  required
                  minLength={3}
                />
              </div>

              {/* Full Name */}
              <div className="text-left">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090D1C] text-slate-900 dark:text-white placeholder-slate-450 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm shadow-sm" 
                  placeholder="e.g. Jane Doe" 
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                />
              </div>

              {/* Email */}
              <div className="text-left">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input 
                  type="email" 
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090D1C] text-slate-900 dark:text-white placeholder-slate-450 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm shadow-sm" 
                  placeholder="e.g. jane@school.edu" 
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </div>

              {/* Password */}
              <div className="text-left">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input 
                    type={showRegPassword ? "text" : "password"} 
                    className="w-full pl-4 pr-12 py-3 border border-slate-250 dark:border-slate-800 bg-white dark:bg-[#090D1C] text-slate-900 dark:text-white placeholder-slate-450 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm shadow-sm" 
                    placeholder="Minimum 6 characters" 
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {showRegPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="text-left">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm Password
                </label>
                <input 
                  type="password" 
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090D1C] text-slate-900 dark:text-white placeholder-slate-450 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm shadow-sm" 
                  placeholder="Re-enter your password" 
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer text-sm shadow-md"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <span>Register Admin Account</span>
                  )}
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setIsRegisteringAdmin(false);
                    setError('');
                    setSuccess('');
                  }}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-[#090D1C] dark:hover:bg-[#111726] border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-300 font-bold rounded-xl active:scale-[0.98] transition-all cursor-pointer text-sm"
                >
                  Back to Login
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
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
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-350 rounded-xl text-xs flex items-center gap-2 text-left">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500 dark:text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-350 rounded-xl text-xs flex items-center gap-2 text-left">
                <span className="h-4 w-4 shrink-0 text-emerald-500 dark:text-emerald-400 font-bold">✓</span>
                <span>{success}</span>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={onSubmit} className="space-y-4">
              {/* Username / Email Input */}
              <div className="text-left">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1">
                  {roleTab === 'student' ? 'Username / Roll Number' : 'Username or Email'}
                </label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090D1C] text-slate-900 dark:text-white placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm shadow-sm" 
                  placeholder={roleTab === 'student' ? "Enter your roll number" : "Enter username or email (e.g. admin)"} 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              {/* School Code Input (Only visible for Student tab) */}
              {roleTab === 'student' && (
                <div className="text-left">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1">
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
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPasswordClick}
                    className="text-xs text-blue-500 hover:text-blue-600 dark:text-primary-450 dark:hover:text-primary-350 font-bold transition-colors cursor-pointer"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className="w-full pl-4 pr-12 py-3 border border-slate-250 dark:border-slate-800 bg-white dark:bg-[#090D1C] text-slate-900 dark:text-white placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm shadow-sm" 
                    placeholder={roleTab === 'student' ? "Default: rollnumber + 123" : "Enter your password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {roleTab === 'student' && (
                  <p className="text-[11px] text-slate-400 dark:text-slate-550 mt-1.5">Default password: <span className="font-semibold text-slate-500 dark:text-slate-400">your roll number + 123</span></p>
                )}
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

            {roleTab === 'student' && (
              <>
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
              </>
            )}

            {roleTab === 'admin-teacher' && (
              <div className="mt-5 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Don't have an admin account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisteringAdmin(true);
                      setError('');
                      setSuccess('');
                    }}
                    className="text-blue-500 hover:text-blue-600 dark:text-primary-450 dark:hover:text-primary-350 font-bold transition-colors cursor-pointer"
                  >
                    Register Admin
                  </button>
                </p>
              </div>
            )}
          </>
        )}
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
                className="text-slate-400 hover:text-slate-650 dark:hover:text-white font-bold cursor-pointer"
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
