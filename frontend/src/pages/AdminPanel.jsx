import React, { useState, useEffect } from 'react';
import { UserPlus, Users, KeyRound, Eye, EyeOff, Loader2, ShieldCheck, Mail, User } from 'lucide-react';

export default function AdminPanel({ fetchAPI }) {
  const [activeSubTab, setActiveSubTab] = useState('teachers'); // 'teachers' | 'create-user' | 'password'

  // --- Teacher States ---
  const [teachers, setTeachers] = useState([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [teacherForm, setTeacherForm] = useState({
    username: '',
    full_name: '',
    email: '',
    password: ''
  });
  const [teacherSubmitLoading, setTeacherSubmitLoading] = useState(false);
  const [teacherError, setTeacherError] = useState('');
  const [teacherSuccess, setTeacherSuccess] = useState('');

  // --- Create User States ---
  const [userForm, setUserForm] = useState({
    username: '',
    role: 'Teacher', // 'Admin' | 'Teacher' | 'Student'
    full_name: '',
    email: '',
    password: '',
    student_id: ''
  });
  const [userSubmitLoading, setUserSubmitLoading] = useState(false);
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');

  // --- Change Password States ---
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Fetch teachers list
  useEffect(() => {
    if (activeSubTab === 'teachers') {
      loadTeachers();
    }
  }, [activeSubTab]);

  const loadTeachers = async () => {
    setTeachersLoading(true);
    try {
      const res = await fetchAPI('/auth/teachers');
      const data = await res.json();
      if (res.ok) {
        setTeachers(data);
      }
    } catch (err) {
      console.error('Failed to load teachers:', err);
    } finally {
      setTeachersLoading(false);
    }
  };

  // Add teacher submit
  const handleTeacherSubmit = async (e) => {
    e.preventDefault();
    setTeacherError('');
    setTeacherSuccess('');
    setTeacherSubmitLoading(true);

    try {
      const res = await fetchAPI('/auth/create-user', {
        method: 'POST',
        body: {
          username: teacherForm.username.trim(),
          role: 'Teacher',
          password: teacherForm.password,
          full_name: teacherForm.full_name.trim() || null,
          email: teacherForm.email.trim() || null
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to create teacher account.');
      }

      setTeacherSuccess(`Teacher account "${data.username}" created successfully!`);
      setTeacherForm({ username: '', full_name: '', email: '', password: '' });
      loadTeachers();
    } catch (err) {
      setTeacherError(err.message || 'Error saving teacher account.');
    } finally {
      setTeacherSubmitLoading(false);
    }
  };

  // Create general user submit
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess('');
    setUserSubmitLoading(true);

    try {
      const res = await fetchAPI('/auth/create-user', {
        method: 'POST',
        body: {
          username: userForm.username.trim(),
          role: userForm.role,
          password: userForm.password,
          full_name: userForm.full_name.trim() || null,
          email: userForm.email.trim() || null,
          student_id: userForm.student_id ? parseInt(userForm.student_id) : null
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to create user account.');
      }

      setUserSuccess(`User account "${data.username}" (${data.role}) created successfully!`);
      setUserForm({ username: '', role: 'Teacher', full_name: '', email: '', password: '', student_id: '' });
    } catch (err) {
      setUserError(err.message || 'Error saving user account.');
    } finally {
      setUserSubmitLoading(false);
    }
  };

  // Change password submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await fetchAPI('/auth/change-password', {
        method: 'POST',
        body: {
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to change password.');
      }

      setPasswordSuccess('Your password has been changed successfully!');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setPasswordError(err.message || 'Error changing password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-6xl mx-auto">
      
      {/* Title block */}
      <div>
        <h1 className="text-2xl font-black dark:text-white flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-indigo-500" />
          <span>Administrative Console</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">Manage system authentication profiles, staff credentials, and secure administrator passwords.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200/50 dark:border-[#222F4D]/40 pb-px">
        <button
          onClick={() => setActiveSubTab('teachers')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all cursor-pointer ${
            activeSubTab === 'teachers'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-500/5'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Manage Teachers</span>
        </button>

        <button
          onClick={() => setActiveSubTab('create-user')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all cursor-pointer ${
            activeSubTab === 'create-user'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-500/5'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
          }`}
        >
          <UserPlus className="h-4 w-4" />
          <span>Create Account</span>
        </button>

        <button
          onClick={() => setActiveSubTab('password')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all cursor-pointer ${
            activeSubTab === 'password'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-500/5'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
          }`}
        >
          <KeyRound className="h-4 w-4" />
          <span>Change Password</span>
        </button>
      </div>

      {/* Subtab Contents */}
      <div className="pt-2">

        {/* 1. MANAGE TEACHERS TAB */}
        {activeSubTab === 'teachers' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left side: Add teacher form */}
            <div className="bg-white dark:bg-[#161D30] border border-slate-200/50 dark:border-[#222F4D]/60 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-sm dark:text-white mb-4 flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-indigo-500" />
                <span>Add Teacher Account</span>
              </h3>

              {teacherError && (
                <div className="p-3 mb-4 bg-rose-50 dark:bg-rose-950/45 border border-rose-250 dark:border-rose-800/40 text-rose-700 dark:text-rose-350 rounded-xl text-xs">
                  {teacherError}
                </div>
              )}

              {teacherSuccess && (
                <div className="p-3 mb-4 bg-emerald-50 dark:bg-emerald-950/45 border border-emerald-250 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-350 rounded-xl text-xs">
                  {teacherSuccess}
                </div>
              )}

              <form onSubmit={handleTeacherSubmit} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#222F4D] text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none"
                    placeholder="e.g. teacher_john"
                    value={teacherForm.username}
                    onChange={(e) => setTeacherForm({ ...teacherForm, username: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#222F4D] text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none"
                    placeholder="e.g. John Smith"
                    value={teacherForm.full_name}
                    onChange={(e) => setTeacherForm({ ...teacherForm, full_name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#222F4D] text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none"
                    placeholder="e.g. john@school.edu"
                    value={teacherForm.email}
                    onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Initial Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#222F4D] text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none"
                    placeholder="At least 6 characters"
                    value={teacherForm.password}
                    onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={teacherSubmitLoading}
                  className="w-full py-2.5 bg-gradient-to-r from-primary-600 to-indigo-650 hover:from-primary-500 hover:to-indigo-500 text-white rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {teacherSubmitLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span>Register Teacher Profile</span>
                  )}
                </button>
              </form>
            </div>

            {/* Right side: Teachers list table */}
            <div className="lg:col-span-2 bg-white dark:bg-[#161D30] border border-slate-200/50 dark:border-[#222F4D]/60 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200/50 dark:border-[#222F4D]/40">
                <h3 className="font-bold text-sm dark:text-white">Active Teachers Directory</h3>
              </div>

              {teachersLoading ? (
                <div className="h-48 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/50 dark:bg-[#0B0F19]/60 border-b border-slate-200/50 dark:border-[#222F4D]/40">
                        <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Username</th>
                        <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Name</th>
                        <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/30 dark:divide-slate-800/30">
                      {teachers.length > 0 ? (
                        teachers.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-100/30 dark:hover:bg-[#0B0F19]/25 transition-colors">
                            <td className="p-4 text-xs font-mono font-bold text-indigo-500">{t.username}</td>
                            <td className="p-4 text-xs font-bold dark:text-white">{t.full_name || '-'}</td>
                            <td className="p-4 text-xs text-slate-400">{t.email || '-'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="p-8 text-center text-slate-400 text-xs font-medium">
                            No registered teacher accounts found in the database.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* 2. CREATE ACCOUNT TAB */}
        {activeSubTab === 'create-user' && (
          <div className="max-w-xl bg-white dark:bg-[#161D30] border border-slate-200/50 dark:border-[#222F4D]/60 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-sm dark:text-white mb-4 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-indigo-500" />
              <span>Create Fresh Account</span>
            </h3>

            {userError && (
              <div className="p-3 mb-4 bg-rose-50 dark:bg-rose-950/45 border border-rose-250 dark:border-rose-800/40 text-rose-700 dark:text-rose-350 rounded-xl text-xs">
                {userError}
              </div>
            )}

            {userSuccess && (
              <div className="p-3 mb-4 bg-emerald-50 dark:bg-emerald-950/45 border border-emerald-250 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-350 rounded-xl text-xs">
                {userSuccess}
              </div>
            )}

            <form onSubmit={handleUserSubmit} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#222F4D] text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none"
                    placeholder="e.g. admin_assistant"
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Role Type</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#222F4D] text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none"
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Teacher">Teacher</option>
                    <option value="Student">Student</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#222F4D] text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none"
                    placeholder="Full Name (optional)"
                    value={userForm.full_name}
                    onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#222F4D] text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none"
                    placeholder="Email Address (optional)"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Secure Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#222F4D] text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none"
                  placeholder="Minimum 6 characters"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                />
              </div>

              {userForm.role === 'Student' && (
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Linked Student Database ID</label>
                  <input
                    type="number"
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#222F4D] text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none font-mono"
                    placeholder="Enter student DB primary ID"
                    value={userForm.student_id}
                    onChange={(e) => setUserForm({ ...userForm, student_id: e.target.value })}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={userSubmitLoading}
                className="w-full py-2.5 bg-gradient-to-r from-primary-600 to-indigo-650 hover:from-primary-500 hover:to-indigo-500 text-white rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                {userSubmitLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>Create User Profile</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* 3. CHANGE PASSWORD TAB */}
        {activeSubTab === 'password' && (
          <div className="max-w-md bg-white dark:bg-[#161D30] border border-slate-200/50 dark:border-[#222F4D]/60 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-sm dark:text-white mb-4 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-indigo-500" />
              <span>Change Security Password</span>
            </h3>

            {passwordError && (
              <div className="p-3 mb-4 bg-rose-50 dark:bg-rose-950/45 border border-rose-250 dark:border-rose-800/40 text-rose-700 dark:text-rose-350 rounded-xl text-xs">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 mb-4 bg-emerald-50 dark:bg-emerald-950/45 border border-emerald-250 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-350 rounded-xl text-xs">
                {passwordSuccess}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    className="w-full pl-3 pr-10 py-2 bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#222F4D] text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none"
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-200 transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    className="w-full pl-3 pr-10 py-2 bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#222F4D] text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-200 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#222F4D] text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full py-2.5 bg-gradient-to-r from-primary-600 to-indigo-650 hover:from-primary-500 hover:to-indigo-500 text-white rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                {passwordLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>Update Admin Password</span>
                )}
              </button>
            </form>
          </div>
        )}

      </div>

    </div>
  );
}
