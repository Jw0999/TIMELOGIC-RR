import React, { useEffect, useState } from 'react';
import { Shield, Smartphone, Lock, AlertTriangle, QrCode, Clock, MapPin, Users, Building2, Wifi } from 'lucide-react';
import Header from '../components/Header';
import { fetchAllOrgs, updateOfficeSecurity } from '../services';
import { api } from '../services/api';

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-primary-600' : 'bg-[var(--border)]'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}
function Spinner() {
  return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent" /></div>;
}
export default function SecuritySettings() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [selectedOffice, setSelectedOffice] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [settings, setSettings] = useState<any>({});
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const allOffices = orgs.flatMap((o: any) => (o.offices ?? []).map((off: any) => ({ ...off, orgName: o.name })));
  useEffect(() => { fetchAllOrgs().then(setOrgs).finally(() => setLoadingOrgs(false)); }, []);
  const selectOffice = async (office: any) => {
    setSelectedOffice(office); setDetail(null); setSettings({}); setLoadingDetail(true);
    try {
      const res = await api.get<any>(`/super/offices/${office.id}/security`);
      const off = res.data.office ?? {};
      // Merge office-level enforcement fields (wifi/geo) into the editable settings state
      setDetail(res.data);
      setSettings({
        ...(res.data.settings ?? {}),
        wifiSSID:  off.wifiSSID  ?? '',
        publicIp:  off.publicIp  ?? '',
        openTime:  off.openTime  ?? '08:00',
        closeTime: off.closeTime ?? '17:00',
        breakMinutes: off.breakMinutes ?? 60,
      });
    } catch { setDetail({ office, settings: {}, adminCount: 0, employeeCount: 0, activeSessions: 0 }); setSettings({}); }
    finally { setLoadingDetail(false); }
  };
  const update = (key: string, value: any) => setSettings((p: any) => ({ ...p, [key]: value }));
  const save = async () => {
    if (!selectedOffice) return; setSaving(true);
    try { await updateOfficeSecurity(selectedOffice.id, settings); alert('Settings saved.'); }
    catch (err: any) { alert(err?.message ?? 'Save failed'); } finally { setSaving(false); }
  };
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Security Settings" subtitle="Live office security policies" />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] shadow-sm p-5 mb-5 transition-colors">
          <h3 className="font-bold text-[var(--text-main)] mb-3 flex items-center gap-2"><MapPin size={16} className="text-primary-600" />Select Office</h3>
          {loadingOrgs ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent" />
            : allOffices.length === 0 ? <p className="text-sm text-[var(--text-muted)]">No offices. Add an organization first.</p>
            : <div className="flex flex-wrap gap-2">
              {allOffices.map((o: any) => (
                <button key={o.id} onClick={() => selectOffice(o)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${selectedOffice?.id === o.id ? 'bg-primary-700 text-white' : 'bg-[var(--hover-bg)] border border-[var(--border)] text-[var(--text-main)] hover:bg-[var(--border)]'}`}>
                  {o.name} <span className="font-normal opacity-70">({o.orgName})</span>
                </button>
              ))}
            </div>
          }
        </div>
        {!selectedOffice ? (
          <div className="text-center py-16 text-[var(--text-muted)]"><Shield size={40} className="mx-auto mb-3 opacity-30" /><p>Select an office to view its live security details.</p></div>
        ) : loadingDetail ? <Spinner /> : detail && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Organization', value: detail.office?.organization?.name ?? '—', icon: Building2, color: 'text-primary-700', bg: 'bg-primary-100 dark:bg-primary-900/40' },
                { label: 'Timezone', value: detail.office?.timezone ?? 'Africa/Lagos', icon: Clock, color: 'text-violet-600', bg: 'bg-violet-100 dark:bg-violet-900/40' },
                { label: 'Admins', value: detail.adminCount ?? 0, icon: Users, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/40' },
                { label: 'Employees', value: detail.employeeCount ?? 0, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/40' },
              ].map((s) => (
                <div key={s.label} className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] p-4 transition-colors">
                  <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-2`}><s.icon size={18} className={s.color} /></div>
                  <p className="text-xl font-black text-[var(--text-main)]">{s.value}</p>
                  <p className="text-xs text-[var(--text-muted)]">{s.label}</p>
                </div>
              ))}
            </div>
            {/* ── Check-In Enforcement ───────────────────────────────────── */}
            <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] shadow-sm p-5 transition-colors">
              <h3 className="font-bold text-[var(--text-main)] mb-1 flex items-center gap-2"><Shield size={16} className="text-primary-600" />Check-In Enforcement</h3>
              <p className="text-xs text-[var(--text-muted)] mb-4">Controls how employees are verified when they clock in & out from the mobile app.</p>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                {[
                  { key: 'deviceBindingEnabled', label: 'Device Binding', sub: 'One phone per employee', icon: Smartphone },
                  { key: 'wifiRequired',         label: 'WiFi Required',   sub: 'Must be on company WiFi', icon: Wifi },
                  { key: 'challengeRequired',    label: 'Code Challenge',  sub: 'Enter a one-time code', icon: Lock, alwaysOn: true },
                ].map(({ key, label, sub, icon: Icon, alwaysOn }) => (
                  <div key={key} className="border border-[var(--border)] rounded-xl p-3 bg-[var(--hover-bg)]">
                    <div className="flex items-center justify-between mb-1">
                      <Icon size={15} className="text-primary-600" />
                      {alwaysOn
                        ? <span className="text-[10px] font-bold text-primary-600 bg-primary-100 px-2 py-0.5 rounded-full">Always On</span>
                        : <Toggle value={!!settings[key]} onChange={(v) => update(key, v)} />}
                    </div>
                    <p className="text-sm font-bold text-[var(--text-main)]">{label}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">{sub}</p>
                  </div>
                ))}
              </div>

              {/* WiFi SSID */}
              <div className="mb-2">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-main)] mb-1.5"><Wifi size={13} className="text-[var(--text-muted)]" />Approved Company WiFi (SSID)</label>
                <input type="text" value={settings.wifiSSID ?? ''} onChange={(e) => update('wifiSSID', e.target.value)}
                  placeholder="e.g. MyOffice_WiFi"
                  className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-main)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                <p className="text-[11px] text-[var(--text-muted)] mt-1">Android app: employees must be on this exact network name to check in. The one-time code challenge always applies.</p>
              </div>

              {/* Office Public IP — for iOS / web PWA check-in */}
              <div className="mb-2">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-main)] mb-1.5"><Wifi size={13} className="text-[var(--text-muted)]" />Office Public IP (iOS / Web app)</label>
                <input type="text" value={settings.publicIp ?? ''} onChange={(e) => update('publicIp', e.target.value)}
                  placeholder="e.g. 102.89.34.12"
                  className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-main)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                <p className="text-[11px] text-[var(--text-muted)] mt-1">Verifies iOS / web (PWA) check-ins. Auto-detected and kept current from Android employees' Wi-Fi-verified check-ins, so this usually fills itself in. Set manually only if this office has no Android users.</p>
              </div>

              {/* Work hours + break */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-main)] mb-1.5"><Clock size={13} className="text-[var(--text-muted)]" />Open Time</label>
                  <input type="time" value={settings.openTime ?? '08:00'} onChange={(e) => update('openTime', e.target.value)}
                    className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-main)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-main)] mb-1.5"><Clock size={13} className="text-[var(--text-muted)]" />Close Time</label>
                  <input type="time" value={settings.closeTime ?? '17:00'} onChange={(e) => update('closeTime', e.target.value)}
                    className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-main)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-main)] mb-1.5"><Clock size={13} className="text-[var(--text-muted)]" />Break (min)</label>
                  <input type="number" min={0} value={settings.breakMinutes ?? 60} onChange={(e) => update('breakMinutes', Number(e.target.value))}
                    className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-main)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-2">Check-in opens at <b>Open Time</b>; the daily session auto-closes at <b>Close Time</b>. These drive check-in/out across all apps.</p>

              <div className="flex justify-end mt-4">
                <button onClick={save} disabled={saving} className="bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold px-5 py-2 rounded-xl transition disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save Enforcement Settings'}
                </button>
              </div>
            </div>

            <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden transition-colors">
              <div className="px-5 py-4 bg-primary-50 dark:bg-primary-900/20 border-b border-primary-100 dark:border-primary-800 flex items-center justify-between gap-3">
                <div className="min-w-0"><h3 className="font-bold text-primary-900 dark:text-primary-300 truncate">{selectedOffice.name}</h3><p className="text-xs text-primary-600 truncate">{selectedOffice.orgName}</p></div>
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 flex-shrink-0 whitespace-nowrap"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />{detail.activeSessions} active</span>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase mb-3">Verification</h4>
                  {[
                    { key: 'screenshotProtection', label: 'Screenshot Block', icon: Lock },
                    { key: 'autoLockOnFraud', label: 'Auto-Lock on Fraud', icon: AlertTriangle },
                  ].map(({ key, label, icon: Icon }) => (
                    <div key={key} className="flex items-center justify-between py-2.5 border-b border-[var(--border)]">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-[var(--hover-bg)] flex items-center justify-center"><Icon size={13} className="text-[var(--text-muted)]" /></div>
                        <span className="text-sm font-semibold text-[var(--text-main)]">{label}</span>
                      </div>
                      <Toggle value={!!settings[key]} onChange={(v) => update(key, v)} />
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase mb-3">Thresholds</h4>
                  {[
                    { key: 'qrRotationSeconds', label: 'QR Rotation (sec)', icon: QrCode },
                    { key: 'maxDevicesPerEmployee', label: 'Max Devices', icon: Smartphone },
                    { key: 'lateThresholdMinutes', label: 'Late Threshold (min)', icon: Clock },
                    { key: 'maxFailedAttempts', label: 'Max Failed Scans', icon: AlertTriangle },
                  ].map(({ key, label, icon: Icon }) => (
                    <div key={key} className="mb-4">
                      <label className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-main)] mb-1"><Icon size={12} className="text-[var(--text-muted)]" />{label}</label>
                      <input type="number" value={settings[key] ?? 0} onChange={(e) => update(key, Number(e.target.value))}
                        className="w-24 border border-[var(--input-border)] bg-[var(--input-bg)] text-primary-700 dark:text-primary-400 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 text-center" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-5 py-3 bg-[var(--hover-bg)] border-t border-[var(--border)] flex justify-end">
                <button onClick={save} disabled={saving} className="bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold px-5 py-2 rounded-xl transition disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
