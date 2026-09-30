import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Building2, Shield, BarChart3, CheckCircle, ArrowLeft, Eye, EyeOff, KeyRound, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

/* ── Mini dashboard mockup shown on the right panel ───────────────────── */
function DashboardMockup() {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 text-white/90 text-[10px] font-medium select-none">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/15">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-md bg-white flex items-center justify-center overflow-hidden">
            <img src="/logo.jpg" alt="" className="w-4 h-4 object-contain" />
          </div>
          <span className="text-[10px] font-bold text-white/80">TimeLogic</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-400/80" />
          <span className="text-white/50 text-[9px]">Live</span>
        </div>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: 'Organizations', val: '12', up: true },
          { label: 'Employees', val: '947', up: true },
          { label: 'Checked In', val: '83%', up: false },
        ].map((s) => (
          <div key={s.label} className="bg-white/10 rounded-xl p-2">
            <p className="text-white font-black text-sm leading-none mb-0.5">{s.val}</p>
            <p className="text-white/50 text-[9px] leading-tight">{s.label}</p>
            <div className={`flex items-center gap-0.5 mt-1 ${s.up ? 'text-emerald-300' : 'text-amber-300'}`}>
              <span className="text-[8px]">{s.up ? '▲' : '▼'} 4.2%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bar chart area */}
      <div className="bg-white/10 rounded-xl p-2.5 mb-2">
        <p className="text-white/60 text-[9px] mb-2">Weekly Attendance</p>
        <div className="flex items-end gap-1 h-10">
          {[65, 80, 72, 90, 85, 78, 60].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end gap-0.5">
              <div className="rounded-sm opacity-60" style={{ height: `${h * 0.4}px`, background: i === 3 ? 'white' : 'rgba(255,255,255,0.4)' }} />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1.5">
          {['M','T','W','T','F','S','S'].map((d, i) => (
            <span key={i} className="text-white/30 text-[8px] flex-1 text-center">{d}</span>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white/10 rounded-xl p-2.5">
        <p className="text-white/60 text-[9px] mb-1.5">Recent Check-ins</p>
        {[
          { name: 'Sarah K.', time: '08:02 AM', status: 'On Time' },
          { name: 'James O.', time: '08:45 AM', status: 'Late' },
          { name: 'Amara N.', time: '07:58 AM', status: 'On Time' },
        ].map((r) => (
          <div key={r.name} className="flex items-center justify-between py-1 border-b border-white/10 last:border-0">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-[7px] font-bold">{r.name[0]}</span>
              </div>
              <span className="text-white/70 text-[9px]">{r.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-white/40 text-[9px]">{r.time}</span>
              <span className={`text-[8px] font-bold px-1 rounded ${r.status === 'Late' ? 'bg-amber-400/20 text-amber-300' : 'bg-emerald-400/20 text-emerald-300'}`}>
                {r.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type Mode = 'login' | 'forgot-email' | 'forgot-password';

export default function Login() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [mode, setMode]                     = useState<Mode>('login');
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [newPassword, setNewPassword]       = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword]     = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetToken, setResetToken]         = useState('');
  const [verifiedEmail, setVerifiedEmail]   = useState('');
  const [remember, setRemember]             = useState(false);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');
  const [success, setSuccess]               = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.ok) navigate('/dashboard');
    else setError(result.error ?? 'Unable to sign in.');
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      const res = await api.post<{ success: boolean; data: { resetToken: string; email: string; firstName: string } }>(
        '/auth/forgot-password/verify',
        { email }
      );
      setResetToken(res.data.resetToken);
      setVerifiedEmail(res.data.email);
      setMode('forgot-password');
      setSuccess(`Account verified for ${res.data.email}. Please set your new password.`);
    } catch (err: any) {
      setError(err.message || 'Unable to verify email address.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please retype carefully.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<{ success: boolean; message: string }>(
        '/auth/forgot-password/reset',
        {
          email: verifiedEmail,
          resetToken,
          newPassword,
        }
      );
      setSuccess(res.message || 'Password updated successfully! Please sign in with your new password.');
      setEmail(verifiedEmail);
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setResetToken('');
      setMode('login');
    } catch (err: any) {
      setError(err.message || 'Unable to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full px-3.5 py-2.5 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-main)] text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 transition placeholder-[var(--text-muted)]';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--page-bg)]">
      {/* Outer card — two-panel wrapper */}
      <div
        className="w-full bg-[var(--card-bg)] rounded-3xl overflow-hidden shadow-2xl border border-[var(--border)] flex"
        style={{ maxWidth: 900, minHeight: 560 }}
      >
        {/* ── LEFT: Form panel ───────────────────────────────────── */}
        <div className="flex-1 flex flex-col justify-between px-10 py-10 min-w-0">
          <div className="flex-1 flex flex-col justify-center w-full max-w-[340px] mx-auto">

            {/* Back button for forgot-password modes */}
            {mode !== 'login' && (
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setSuccess('');
                  if (mode === 'forgot-password') setMode('forgot-email');
                  else setMode('login');
                }}
                className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-primary-600 font-semibold mb-4 transition-colors w-fit"
              >
                <ArrowLeft size={14} />
                {mode === 'forgot-password' ? 'Change email' : 'Back to sign in'}
              </button>
            )}

            {/* Header Title & Subtitle */}
            <h1 className="text-[26px] font-black text-[var(--text-main)] leading-tight mb-1">
              {mode === 'login' && 'Welcome back'}
              {mode === 'forgot-email' && 'Reset password'}
              {mode === 'forgot-password' && 'New password'}
            </h1>
            <p className="text-sm text-[var(--text-muted)] mb-6">
              {mode === 'login' && 'Enter your details to access your account.'}
              {mode === 'forgot-email' && 'Enter your Gmail/email associated with your account.'}
              {mode === 'forgot-password' && `Create a new password for ${verifiedEmail}`}
            </p>

            {/* Success alert */}
            {success && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-medium text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
                <CheckCircle size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {/* Error alert */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {/* ── MODE 1: LOGIN ──────────────────────────────── */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-main)] mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className={inputCls}
                    required
                    autoComplete="email"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-main)] mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className={`${inputCls} pr-10`}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Remember me + Forgot */}
                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div
                      onClick={() => setRemember(!remember)}
                      className={`w-4 h-4 rounded flex items-center justify-center border transition-colors cursor-pointer ${
                        remember
                          ? 'bg-primary-600 border-primary-600'
                          : 'border-[var(--input-border)] bg-[var(--input-bg)]'
                      }`}
                    >
                      {remember && (
                        <svg viewBox="0 0 10 8" className="w-2.5 h-2.5 fill-none stroke-white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="1,4 4,7 9,1" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-[var(--text-main)]">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setSuccess('');
                      setMode('forgot-email');
                    }}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Sign In button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md shadow-primary-300/30 dark:shadow-primary-900/30 disabled:opacity-60 flex items-center justify-center gap-2 text-sm mt-1"
                >
                  {loading && (
                    <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />
                  )}
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>
            )}

            {/* ── MODE 2: FORGOT PASSWORD - STEP 1 (VERIFY EMAIL) ───── */}
            {mode === 'forgot-email' && (
              <form onSubmit={handleVerifyEmail} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-main)] mb-1.5 flex items-center gap-1.5">
                    <Mail size={15} className="text-primary-600" />
                    Account Email (Gmail)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. superadmin@acme.com"
                    className={inputCls}
                    required
                    autoFocus
                    autoComplete="email"
                  />
                  <p className="text-xs text-[var(--text-muted)] mt-1.5">
                    We will verify that this email is registered to an authorized administrator account.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md shadow-primary-300/30 dark:shadow-primary-900/30 disabled:opacity-60 flex items-center justify-center gap-2 text-sm mt-2"
                >
                  {loading && (
                    <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />
                  )}
                  {loading ? 'Verifying Account...' : 'Verify Email & Continue'}
                </button>
              </form>
            )}

            {/* ── MODE 3: FORGOT PASSWORD - STEP 2 (SET NEW PASSWORD) ─ */}
            {mode === 'forgot-password' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* New Password */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-main)] mb-1.5 flex items-center gap-1.5">
                    <KeyRound size={15} className="text-primary-600" />
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className={`${inputCls} pr-10`}
                      required
                      autoFocus
                      autoComplete="new-password"
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Retype / Confirm Password */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-main)] mb-1.5">
                    Retype New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className={`${inputCls} pr-10`}
                      required
                      autoComplete="new-password"
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !newPassword || !confirmPassword}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md shadow-primary-300/30 dark:shadow-primary-900/30 disabled:opacity-60 flex items-center justify-center gap-2 text-sm mt-2"
                >
                  {loading && (
                    <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />
                  )}
                  {loading ? 'Updating Password...' : 'Save New Password'}
                </button>
              </form>
            )}

          </div>

          {/* Footer */}
          <p className="text-center text-xs text-[var(--text-muted)] mt-6">
            © 2025 TimeLogic. All rights reserved.
          </p>
        </div>

        {/* ── RIGHT: Blue promo panel ─────────────────────────────── */}
        <div className="w-[46%] flex-shrink-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 dark:from-primary-700 dark:via-primary-800 dark:to-primary-900 p-9 flex flex-col hidden lg:flex">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-auto pb-6">
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center overflow-hidden">
              <img src="/logo.jpg" alt="TimeLogic" className="w-7 h-7 object-contain" />
            </div>
            <span className="text-white font-bold text-[15px]">TimeLogic</span>
          </div>

          {/* Headline */}
          <div className="mb-6">
            <h2 className="text-[28px] font-black text-white leading-snug mb-3">
              Effortless Attendance Management for Smarter Teams
            </h2>
            <p className="text-primary-200 text-sm leading-relaxed">
              Track check-ins, manage multiple organizations, and monitor your workforce — all in one powerful dashboard.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { icon: Building2, label: 'Multi-Organization' },
              { icon: Users,     label: 'Team Management' },
              { icon: Shield,    label: 'Fraud Detection' },
              { icon: BarChart3, label: 'Live Reports' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5">
                <Icon size={11} className="text-white/80" />
                <span className="text-white/90 text-[11px] font-semibold">{label}</span>
              </div>
            ))}
          </div>

          {/* Mini dashboard mockup */}
          <DashboardMockup />
        </div>
      </div>
    </div>
  );
}
