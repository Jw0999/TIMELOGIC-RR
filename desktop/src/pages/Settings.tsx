import React, { useEffect, useState } from 'react';
import { Shield, Wifi, Smartphone, Lock, Clock, Building2, AlertTriangle, EyeOff, UserCheck, GraduationCap, KeyRound, Monitor, Calendar, Moon, Sun, CheckCircle, Edit3, Save, X } from 'lucide-react';
import { fetchAdminOrg, setStationPassword as apiSetStationPassword, fetchStationPasswordStatus, fetchKioskDevices, releaseKioskDevice, fetchShiftConfiguration, updateShiftConfiguration } from '../services';
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

  // Shift schedules & auto-checkout policy
  const [shiftConfig, setShiftConfig] = useState<any>(null);
  const [editingShifts, setEditingShifts] = useState(false);
  const [editSchedules, setEditSchedules] = useState<any>({});
  const [editAutoCheckout, setEditAutoCheckout] = useState<any>({
    midnightAutoCheckout: true,
    dayShiftCutoffTime: '00:00',
    nightShiftMaxHours: 14,
  });
  const [savingShifts, setSavingShifts] = useState(false);
  const [shiftMsg, setShiftMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [kioskData, setKioskData] = useState<{
    organization?: {
      subscriptionTier?: string;
      maxEmployees?: number | null;
      maxKiosks?: number | null;
      maxDesktopAdmins?: number | null;
      activeEmployeesCount?: number;
      boundKiosksCount?: number;
      boundDesktopAdminsCount?: number;
    };
    devices?: any[];
  } | null>(null);
  const [loadingKiosks, setLoadingKiosks] = useState(false);
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [kioskMsg, setKioskMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadKiosks = async () => {
    try {
      setLoadingKiosks(true);
      const res = await fetchKioskDevices();
      setKioskData(res);
    } catch (_) {}
    finally { setLoadingKiosks(false); }
  };

  const handleReleaseKiosk = async (deviceId: string, deviceName?: string) => {
    const confirmRelease = window.confirm(
      `Are you sure you want to release "${deviceName || 'this kiosk device'}"?\n\nOnce released, this PC will no longer be locked to the kiosk slot, allowing another PC to authenticate and become the authorized terminal.`
    );
    if (!confirmRelease) return;
    try {
      setReleasingId(deviceId);
      setKioskMsg(null);
      await releaseKioskDevice(deviceId);
      setKioskMsg({ type: 'success', text: 'Kiosk device released successfully. You can now log in on a new PC to bind it.' });
      await loadKiosks();
    } catch (err: any) {
      setKioskMsg({ type: 'error', text: err?.message || 'Failed to release device' });
    } finally {
      setReleasingId(null);
    }
  };

  const loadOrg = async () => {
    try {
      const [org, status, shifts] = await Promise.all([
        fetchAdminOrg(),
        fetchStationPasswordStatus().catch(() => null),
        fetchShiftConfiguration().catch(() => null),
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
      if (shifts?.data) {
        setShiftConfig(shifts.data);
        setEditSchedules(shifts.data.shiftSchedules || {});
        setEditAutoCheckout(shifts.data.autoCheckoutPolicy || {
          midnightAutoCheckout: true,
          dayShiftCutoffTime: '00:00',
          nightShiftMaxHours: 14,
        });
      }
      await loadKiosks();
    } finally { setLoading(false); }
  };

  useEffect(() => {
    loadOrg();
  }, []);

  const handleSaveShifts = async () => {
    setSavingShifts(true);
    setShiftMsg(null);
    try {
      await updateShiftConfiguration({
        shiftSchedules: editSchedules,
        autoCheckoutPolicy: editAutoCheckout,
      });
      setShiftMsg({ type: 'success', text: 'Shift schedules & auto check-out policies saved successfully.' });
      setEditingShifts(false);
      const updated = await fetchShiftConfiguration().catch(() => null);
      if (updated?.data) {
        setShiftConfig(updated.data);
      }
    } catch (err: any) {
      setShiftMsg({ type: 'error', text: err?.message || 'Failed to save shift configuration.' });
    } finally {
      setSavingShifts(false);
    }
  };

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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
            <div>
              <h3 className="font-bold text-[var(--text-main)] flex items-center gap-2">
                <KeyRound size={16} className="text-primary-600" />
                PWA 2.0 Station Password
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Set the dedicated password used to unlock and monitor PWA 2.0 attendance kiosks. This is completely separate from your Desktop Admin account password.
              </p>
            </div>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${hasStationPassword ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30'}`}>
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

        {/* Authorized Kiosks & Desktop Admin Hardware Binding Card */}
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] p-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-[var(--text-main)] mb-1 flex items-center gap-2">
                <Monitor size={16} className="text-primary-600" />
                Authorized Hardware & System Device Bindings
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Desktop Admin apps and Attendance Kiosks are locked to authorized physical systems. Desktop Admin locks can only be released by the Super Administrator.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                kioskData?.organization?.subscriptionTier === 'enterprise'
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                  : kioskData?.organization?.subscriptionTier === 'custom'
                  ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
              }`}>
                {kioskData?.organization?.subscriptionTier === 'enterprise' ? 'Enterprise (3 Desktop, Unlimited Kiosks)' : kioskData?.organization?.subscriptionTier === 'custom' ? 'Custom Plan (Unlimited)' : 'Starter Plan (1 Desktop, 1 Kiosk)'}
              </span>
            </div>
          </div>

          {/* Quota overview */}
          {kioskData?.organization && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 p-3 rounded-xl bg-[var(--hover-bg)] border border-[var(--border)]">
              <div>
                <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Desktop Admin Systems</p>
                <p className="text-sm font-black text-[var(--text-main)] mt-0.5">
                  {kioskData.organization.boundDesktopAdminsCount ?? 0} / {kioskData.organization.maxDesktopAdmins !== null && kioskData.organization.maxDesktopAdmins !== undefined ? kioskData.organization.maxDesktopAdmins : 'Unlimited'} Active
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Attendance Kiosks</p>
                <p className="text-sm font-black text-[var(--text-main)] mt-0.5">
                  {kioskData.organization.boundKiosksCount ?? 0} / {kioskData.organization.maxKiosks !== null && kioskData.organization.maxKiosks !== undefined ? kioskData.organization.maxKiosks : 'Unlimited'} Active
                </p>
              </div>
            </div>
          )}

          {kioskMsg && (
            <div className={`p-3 rounded-xl text-xs font-semibold mt-4 ${kioskMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {kioskMsg.text}
            </div>
          )}

          <div className="mt-4">
            {loadingKiosks ? (
              <div className="py-6 text-center text-xs text-[var(--text-muted)]">Loading bound systems…</div>
            ) : !kioskData?.devices?.length ? (
              <div className="p-4 rounded-xl bg-[var(--hover-bg)] border border-[var(--border)] text-xs text-[var(--text-muted)] flex items-center justify-between">
                <span>No hardware devices currently registered. Log into Desktop Admin or PWA Kiosk to bind a device.</span>
                <span className="text-[11px] font-bold text-emerald-600">Slots Available</span>
              </div>
            ) : (
              <div className="space-y-3">
                {kioskData.devices.map((device: any) => {
                  const isDesktop = device.deviceType === 'DESKTOP_ADMIN';
                  return (
                    <div
                      key={device.id}
                      className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--hover-bg)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                            isDesktop
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                          }`}>
                            {isDesktop ? 'Desktop Admin' : 'Kiosk Terminal'}
                          </span>
                          <span className="text-xs font-bold text-[var(--text-main)]">
                            {device.deviceName || (isDesktop ? 'Desktop Admin PC' : 'Kiosk Terminal')}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            device.isBound
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {device.isBound ? 'Bound & Locked' : 'Released / Open'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          Platform: {device.platform || 'Unknown OS'} {device.firmwareVersion ? `(${device.firmwareVersion})` : ''} {device.ipAddress ? `· IP: ${device.ipAddress}` : ''} · Last active: {new Date(device.lastLoginAt).toLocaleString()}
                        </p>
                      </div>

                      {device.isBound ? (
                        isDesktop ? (
                          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 shrink-0 self-start sm:self-center">
                            Locked (Super Admin Unlock Only)
                          </span>
                        ) : (
                          <button
                            onClick={() => handleReleaseKiosk(device.id, device.deviceName)}
                            disabled={releasingId === device.id}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 shrink-0 self-start sm:self-center"
                          >
                            {releasingId === device.id ? 'Releasing…' : 'Release Device Binding'}
                          </button>
                        )
                      ) : (
                        <span className="text-xs font-semibold text-[var(--text-muted)] shrink-0">Unbound</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Shift Schedules & Intelligent Auto Check-Out Rules */}
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[var(--border)]">
            <div>
              <h3 className="font-bold text-[var(--text-main)] flex items-center gap-2">
                <Calendar size={18} className="text-primary-600" />
                Shift Schedules & Intelligent Auto Check-Out
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Configure shift hours, overtime start windows, and intelligent midnight auto check-out rules.
              </p>
            </div>
            <button
              onClick={() => {
                if (editingShifts) {
                  setEditingShifts(false);
                  setShiftMsg(null);
                } else {
                  setEditSchedules(shiftConfig?.shiftSchedules || {});
                  setEditAutoCheckout(shiftConfig?.autoCheckoutPolicy || {
                    midnightAutoCheckout: true,
                    dayShiftCutoffTime: '00:00',
                    nightShiftMaxHours: 14,
                  });
                  setEditingShifts(true);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-[var(--border)] bg-[var(--hover-bg)] text-[var(--text-main)] hover:border-primary-500 transition"
            >
              {editingShifts ? <><X size={14} />Cancel</> : <><Edit3 size={14} />Edit Shifts & Policies</>}
            </button>
          </div>

          {shiftMsg && (
            <div className={`p-3 rounded-xl mb-4 text-xs font-semibold border ${shiftMsg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'}`}>
              {shiftMsg.text}
            </div>
          )}

          {editingShifts ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {['FULL_TIME', 'MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'FLEXIBLE'].map((key) => {
                  const s = editSchedules[key] || {
                    name: key.replace('_', ' '),
                    openTime: key === 'MORNING' ? '07:00' : key === 'NIGHT' ? '21:00' : '08:00',
                    closeTime: key === 'MORNING' ? '14:00' : key === 'NIGHT' ? '05:00' : key === 'EVENING' ? '22:00' : '17:00',
                  };
                  return (
                    <div key={key} className="bg-[var(--hover-bg)] border border-[var(--border)] rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">{s.name || key.replace('_', ' ')}</span>
                        {key === 'NIGHT' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                            Overnight
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[11px] text-[var(--text-muted)] font-semibold block mb-1">Start Time</label>
                          <input
                            type="time"
                            value={s.openTime || '08:00'}
                            onChange={(e) => setEditSchedules({
                              ...editSchedules,
                              [key]: { ...s, openTime: e.target.value }
                            })}
                            className="w-full px-2.5 py-1.5 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-main)] rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-[var(--text-muted)] font-semibold block mb-1">End Time</label>
                          <input
                            type="time"
                            value={s.closeTime || '17:00'}
                            onChange={(e) => setEditSchedules({
                              ...editSchedules,
                              [key]: { ...s, closeTime: e.target.value }
                            })}
                            className="w-full px-2.5 py-1.5 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-main)] rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Auto Check-Out Settings */}
              <div className="bg-[var(--hover-bg)] border border-[var(--border)] rounded-xl p-4 mt-3">
                <h4 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock size={14} className="text-primary-600" />
                  Auto Check-Out Cutoff Rules
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-[11px] text-[var(--text-muted)] font-semibold block mb-1">Day Shift Auto Check-Out Cutoff</label>
                    <input
                      type="text"
                      value={editAutoCheckout.dayShiftCutoffTime || '00:00'}
                      onChange={(e) => setEditAutoCheckout({ ...editAutoCheckout, dayShiftCutoffTime: e.target.value })}
                      placeholder="00:00"
                      className="w-full px-3 py-2 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-main)] rounded-xl text-xs font-mono"
                    />
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">Default is 00:00 (Midnight). Day workers who forget to clock out are auto-checked out at this time.</p>
                  </div>
                  <div>
                    <label className="text-[11px] text-[var(--text-muted)] font-semibold block mb-1">Night Shift Max Working Limit (Hours)</label>
                    <input
                      type="number"
                      min={8}
                      max={24}
                      value={editAutoCheckout.nightShiftMaxHours || 14}
                      onChange={(e) => setEditAutoCheckout({ ...editAutoCheckout, nightShiftMaxHours: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-main)] rounded-xl text-xs font-mono"
                    />
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">Night workers are not checked out at midnight. They are only auto-closed if they exceed this safety duration.</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingShifts(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-main)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveShifts}
                  disabled={savingShifts}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {savingShifts ? <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" /> : <Save size={14} />}
                  Save Shift Settings
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                {Object.entries(shiftConfig?.shiftSchedules || {}).map(([key, s]: [string, any]) => {
                  const isNight = key === 'NIGHT' || s.isOvernight;
                  return (
                    <div key={key} className="bg-[var(--hover-bg)] border border-[var(--border)] rounded-xl p-3.5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-bold text-primary-600 uppercase tracking-wider">{s.name || key.replace('_', ' ')}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isNight ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'}`}>
                            {isNight ? 'Overnight' : 'Day Shift'}
                          </span>
                        </div>
                        <p className="text-base font-bold text-[var(--text-main)] mt-0.5">{s.openTime} – {s.closeTime}</p>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] mt-2">
                        {isNight ? 'Passes 00:00 midnight (Active till manual checkout)' : 'Auto checks out at 00:00 midnight with 0 overtime/penalty'}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Policy Explanation Banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-900/10">
                  <p className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5 mb-1">
                    <Moon size={14} /> Midnight Auto Check-Out (00:00)
                  </p>
                  <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80">
                    Day shift workers who forget to check out are automatically checked out at <b>00:00</b> midnight with <b>0 overtime and 0 penalties</b> (no salary additions or deductions).
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-violet-200 dark:border-violet-900/40 bg-violet-50/50 dark:bg-violet-900/10">
                  <p className="text-xs font-bold text-violet-800 dark:text-violet-300 flex items-center gap-1.5 mb-1">
                    <Shield size={14} /> Overnight Shift Protection
                  </p>
                  <p className="text-[11px] text-violet-700/80 dark:text-violet-300/80">
                    Night workers whose shifts span past midnight are <b>never checked out at 00:00</b>. They stay clocked in to check out by themselves when their shift finishes, with overtime calculated normally.
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-900/10">
                  <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 mb-1">
                    <CheckCircle size={14} /> Continuous Shift Access
                  </p>
                  <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
                    Closed attendance sessions <b>never block shift workers</b>. Morning, evening, and night workers can always check in, take breaks, and check out seamlessly.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

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
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { label: 'Opens (check-in)', value: selected?.openTime ?? '—', sub: 'Session opens' },
                  { label: 'Closes (check-out)', value: selected?.closeTime ?? '—', sub: 'Standard work close' },
                  { label: 'Break allowance', value: `${selected?.breakMinutes ?? 0} min`, sub: 'Daily break limit' },
                  { label: 'Overstay rate', value: `₦${Number(selected?.overtimeFeePerHour ?? 0).toLocaleString()}/hr`, sub: '+ Added to salary after close' },
                  { label: 'Break penalty', value: `₦${Number(selected?.overstayPenalty ?? 0).toLocaleString()}`, sub: '- Deducted for overbreak' },
                ].map((x) => (
                  <div key={x.label} className="bg-[var(--hover-bg)] rounded-xl p-3.5 text-center border border-[var(--border)]">
                    <p className="text-xl font-black text-[var(--text-main)]">{x.value}</p>
                    <p className="text-xs font-semibold text-[var(--text-muted)] mt-1">{x.label}</p>
                    <p className="text-[10px] text-[var(--text-muted)] opacity-80 mt-0.5">{x.sub}</p>
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
