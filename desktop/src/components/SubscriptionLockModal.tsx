import React, { useState } from 'react';
import { Lock, KeyRound, MessageCircle, AlertTriangle, CheckCircle2, LogOut, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { redeemActivationCode } from '../services';

const SUPPORT_WHATSAPP = '2349113380364';

export default function SubscriptionLockModal() {
  const { organization, isSubscriptionExpired, refreshSubscription, logout } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isSubscriptionExpired) {
    return null;
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits, max 8 characters
    const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
    setCode(digits);
    if (error) setError('');
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 8) {
      setError('Please enter the complete 8-digit code.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await redeemActivationCode(code);
      setSuccess(res?.message || 'Subscription successfully renewed! Unlocking TimeLogic...');
      setTimeout(async () => {
        await refreshSubscription();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired activation code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const orgName = organization?.name || 'Your Organization';
  const whatsappUrl = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(
    `Hello TimeLogic Support, our organization "${orgName}" subscription has expired. Please send our 8-digit monthly activation code.`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none">
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Top warning stripe */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 p-6 text-white flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-inner">
            <Lock className="w-8 h-8 text-white stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider bg-white/25 px-2.5 py-0.5 rounded-full inline-block mb-1">
              Service Locked
            </span>
            <h2 className="text-xl font-black tracking-tight leading-snug">Subscription Expired</h2>
            <p className="text-xs text-white/90 font-medium truncate max-w-xs">{orgName}</p>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800 text-xs">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="font-semibold leading-relaxed">{error}</div>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="text-xs text-[var(--text-muted)] space-y-1.5 leading-relaxed">
            <p>
              Your monthly subscription for <strong className="text-[var(--text-main)]">{orgName}</strong> has ended.
            </p>
            <p>
              Desktop operations and attendance kiosk punch-ins are temporarily suspended. Please enter your <strong>8-digit activation code</strong> below to immediately unlock the system for the next 30 days.
            </p>
          </div>

          <form onSubmit={handleRedeem} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)] mb-1.5">
                8-Digit Activation Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  maxLength={8}
                  placeholder="0000 0000"
                  value={code}
                  onChange={handleCodeChange}
                  disabled={loading || !!success}
                  className="w-full text-center text-2xl font-mono font-black tracking-[0.35em] py-3.5 px-4 rounded-2xl border-2 border-[var(--border)] bg-[var(--hover-bg)] text-[var(--text-main)] focus:outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-500/20 transition-all placeholder:text-[var(--text-muted)]/40"
                />
                <KeyRound className="w-5 h-5 text-[var(--text-muted)] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" />
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1.5 text-center">
                {code.length}/8 digits entered
              </p>
            </div>

            <button
              type="submit"
              disabled={code.length !== 8 || loading || !!success}
              className="w-full py-3.5 px-4 bg-primary-700 hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition shadow-lg shadow-primary-700/25 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Activate & Unlock System</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* WhatsApp Support Callout */}
          <div className="pt-2 border-t border-[var(--border)] flex flex-col gap-2">
            <p className="text-[11px] text-[var(--text-muted)] text-center">
              Don't have an activation code? Contact TimeLogic Support to renew:
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 font-bold text-xs transition"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Contact Support on WhatsApp (+234 911 338 0364)</span>
            </a>
          </div>
        </div>

        {/* Footer logout */}
        <div className="bg-[var(--hover-bg)] px-6 py-3 border-t border-[var(--border)] flex items-center justify-between text-xs">
          <span className="text-[var(--text-muted)]">Signed in as {organization?.name}</span>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 font-semibold text-red-600 hover:text-red-700 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
