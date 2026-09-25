import React, { useEffect, useState } from 'react';
import { Shield, Wifi, Smartphone, Lock, Clock, Building2, AlertTriangle, EyeOff, UserCheck, GraduationCap, KeyRound } from 'lucide-react';
import { fetchAdminOrg, setStationPassword as apiSetStationPassword, fetchStationPasswordStatus } from '../services';
import { useAuth } from '../context/AuthContext';

// Read-only badge for a setting that's locked to Super Admin
function StateBadge({ on }: { on: boolean }) {
  return (
    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${on ? 'bg-primary-100 text-primary-700' : 'bg-[var(--hover-bg)] text-[var(--text-muted)]'}`}>
      {on ? 'Enabled' : 'Disabled'}
    </span>
  );
}

export default function Settings() {
  const { organization } = useAuth();
  const [orgDetails, setOrgDetails] = useState<any>(null);
  const [offices, setOffices]   = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [hasStationPassword, setHasStationPassword] = useState(false);
  const [stationPasswordVal, setStationPasswordVal] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadOrg = async () => {
    try {
      const [org, status] = await Promise.all([
        fetchAdminOrg(),
        fetchStationPasswordStatus().catch(() => null),
      ]);
      setOrgDetails(org);
      const offs = org?.offices ?? [];
      setOffices(offs);
      if (offs.length && !selected) setSelected(offs[0]);
      if (status?.data?.hasStationPassword !== undefined) {
        setHasStationPassword(status.data.hasStationPassword);
      } else if (org?.hasStationPassword !== undefined) {
        setHasStationPassword(org.hasStationPassword);
      }
    } finally { setLoading(false); }
  };

  useEffect(() => {
    loadOrg();
  }, []);

  const handleSetStationPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stationPasswordVal || stationPasswordVal.length < 6) {
      setPwdMsg({ type: 'error', text: 'Station password must be at least 6 characters.' });
      return;
    }
    setSavingPwd(true);
    setPwdMsg(null);
    try {
      await apiSetStationPassword(stationPasswordVal);
      setPwdMsg({ type: 'success', text: 'PWA 2.0 Station Password saved successfully! Station devices can now authenticate with this password.' });
      setStationPasswordVal('');
      setHasStationPassword(true);
    } catch (err: any) {
      setPwdMsg({ type: 'error', text: err?.message || 'Failed to update station password.' });
    } finally {
      setSavingPwd(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent" /></div>;
  }

  const s = selected?.securitySettings ?? {};
  const capabilities = {
    allowDeviceCheckIn: orgDetails?.allowDeviceCheckIn ?? organization?.allowDeviceCheckIn ?? false,
    allowManualCheckIn: orgDetails?.allowManualCheckIn ?? organization?.allowManualCheckIn ?? false,
    hasStudents: orgDetails?.hasStudents ?? organization?.hasStudents ?? false,
  };
  const row = 'flex items-center justify-between py-3 border-b border-[var(--border)] last:border-0';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 py-5 border-b border-[var(--border)] bg-[var(--card-bg)]">
        <h1 className="text-xl font-bold text-[var(--text-main)]">Check-In Policy</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">View your organization's attendance & security policy.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Locked notice */}
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
          <EyeOff size={18} className="text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            These settings are <b>managed by the Super Admin</b> and are read-only here. Contact your Super Admin to change Wi-Fi, work hours, or security options.
          </p>
        </div>

        {/* Organization-wide capabilities (managed by Super Admin) */}
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] p-5">
          <h3 className="font-bold text-[var(--text-main)] mb-1 flex items-center gap-2"><Shield size={16} className="text-primary-600" />Attendance Channels</h3>
          <p className="text-xs text-[var(--text-muted)] mb-3">These permissions control which tabs and employee check-in methods are available throughout the desktop app.</p>
          <div className={row}>
            <div className="flex items-center gap-3"><Smartphone size={15} className="text-[var(--text-muted)]" /><div><span className="text-sm font-semibold text-[var(--text-main)]">Phone / Device Check-In</span><p className="text-xs text-[var(--text-muted)]">Employees may use an approved device when their own method permits it.</p></div></div>
            <StateBadge on={capabilities.allowDeviceCheckIn} />
          </div>
          <div className={row}>
            <div className="flex items-center gap-3"><UserCheck size={15} className="text-[var(--text-muted)]" /><div><span className="text-sm font-semibold text-[var(--text-main)]">Manual Employee Check-In</span><p className="text-xs text-[var(--text-muted)]">Shows the password-protected Manual Check-In station.</p></div></div>
            <StateBadge on={capabilities.allowManualCheckIn} />
          </div>
          <div className={row}>
            <div className="flex items-center gap-3"><GraduationCap size={15} className="text-[var(--text-muted)]" /><div><span className="text-sm font-semibold text-[var(--text-main)]">Students</span><p className="text-xs text-[var(--text-muted)]">Shows organization-scoped student records and attendance.</p></div></div>
            <StateBadge on={capabilities.hasStudents} />
          </div>
        </div>

        {/* PWA 2.0 Station Password Card */}
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] p-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-bold text-[var(--text-main)] flex items-center gap-2">
                <KeyRound size={16} className="text-primary-600" />
                PWA 2.0 Station Password
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Set the dedicated password used to unlock and monitor PWA 2.0 attendance kiosks. This is completely separate from your Desktop Admin account password.
              </p>
            </div>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${hasStationPassword ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30'}`}>
              {hasStationPassword ? 'Station Password Set' : 'Default / Not Set'}
            </span>
          </div>

          <form onSubmit={handleSetStationPassword} className="space-y-3 mt-4 max-w-md">
            {pwdMsg && (
              <div className={`p-3 rounded-xl text-xs font-semibold ${pwdMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {pwdMsg.text}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">New Station Password</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={stationPasswordVal}
                  onChange={(e) => setStationPasswordVal(e.target.value)}
                  placeholder="Min 6 characters"
                  className="flex-1 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-main)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  disabled={savingPwd || stationPasswordVal.length < 6}
                  className="px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  {savingPwd ? 'Saving...' : 'Save Password'}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              Note: Desktop Admin passwords can only be changed by the Super Administrator. The password set here will only be accepted on PWA 2.0 stations.
            </p>
          </form>
        </div>

        {/* Configured Shift Schedules Card */}
        {orgDetails?.shiftSchedules && (
          <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] p-5">
            <h3 className="font-bold text-[var(--text-main)] mb-1 flex items-center gap-2">
              <Clock size={16} className="text-primary-600" />
              Configured Shift Schedules
            </h3>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              Shift hours are configured for your organization and ensure employee lateness and absence sweeps do not clash.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(orgDetails.shiftSchedules).map(([key, s]: [string, any]) => (
                <div key={key} className="bg-[var(--hover-bg)] border border-[var(--border)] rounded-xl p-3.5">
                  <p className="text-xs font-bold text-primary-600 uppercase tracking-wider">{key.replace('_', ' ')}</p>
                  <p className="text-base font-bold text-[var(--text-main)] mt-1">{s.openTime} – {s.closeTime}</p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{s.label || `${key} shift`}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {offices.length === 0 ? (
          <div className="text-center py-16 text-[var(--text-muted)]">
            <Building2 size={40} className="mx-auto mb-3 opacity-30" />
            <p>No offices found for your organization.</p>
          </div>
        ) : (
          <>
            {offices.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {offices.map((o) => (
                  <button key={o.id} onClick={() => setSelected(o)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${selected?.id === o.id ? 'bg-primary-700 text-white' : 'bg-[var(--card-bg)] border border-[var(--border)] text-[var(--text-main)] hover:bg-[var(--hover-bg)]'}`}>
                    {o.name}
                  </button>
                ))}
              </div>
            )}

            {/* Work hours */}
            <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] p-5">
              <h3 className="font-bold text-[var(--text-main)] mb-3 flex items-center gap-2"><Clock size={16} className="text-primary-600" />Work Hours</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Opens (check-in)', value: selected?.openTime ?? '—' },
                  { label: 'Closes (check-out)', value: selected?.closeTime ?? '—' },
                  { label: 'Break allowance', value: `${selected?.breakMinutes ?? 0} min` },
                ].map((x) => (
                  <div key={x.label} className="bg-[var(--hover-bg)] rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-[var(--text-main)]">{x.value}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{x.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Verification (read-only) */}
            <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] p-5">
              <h3 className="font-bold text-[var(--text-main)] mb-3 flex items-center gap-2"><Shield size={16} className="text-primary-600" />Verification Methods</h3>
              <div className={row}>
                <div className="flex items-center gap-3"><Smartphone size={15} className="text-[var(--text-muted)]" /><span className="text-sm font-semibold text-[var(--text-main)]">Device Binding</span></div>
                <StateBadge on={s.deviceBindingEnabled !== false} />
              </div>
              <div className={row}>
                <div className="flex items-center gap-3"><Wifi size={15} className="text-[var(--text-muted)]" /><div><span className="text-sm font-semibold text-[var(--text-main)]">WiFi Required</span><p className="text-xs text-[var(--text-muted)]">{selected?.wifiSSID ? `Network: ${selected.wifiSSID}` : 'No network set'}</p></div></div>
                <StateBadge on={s.wifiRequired !== false} />
              </div>
              <div className={row}>
                <div className="flex items-center gap-3"><Lock size={15} className="text-[var(--text-muted)]" /><span className="text-sm font-semibold text-[var(--text-main)]">Code Challenge</span></div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary-100 text-primary-700">Always On</span>
              </div>
              <div className={row}>
                <div className="flex items-center gap-3"><Lock size={15} className="text-[var(--text-muted)]" /><span className="text-sm font-semibold text-[var(--text-main)]">Screenshot Block</span></div>
                <StateBadge on={s.screenshotProtection !== false} />
              </div>
              <div className={row}>
                <div className="flex items-center gap-3"><AlertTriangle size={15} className="text-[var(--text-muted)]" /><span className="text-sm font-semibold text-[var(--text-main)]">Auto-Lock on Fraud</span></div>
                <StateBadge on={s.autoLockOnFraud !== false} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
