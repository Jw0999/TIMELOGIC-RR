import React, { useEffect, useState, useMemo } from 'react';
import {
  Laptop, Monitor, Lock, Unlock, Trash2, Search,
  AlertTriangle, CheckCircle2, ShieldAlert, RefreshCw,
  Building2, HardDrive, Smartphone, Filter, Info, X,
  LayoutGrid, List, Cpu, Globe, Clock, ShieldCheck
} from 'lucide-react';
import PageShell from '../components/PageShell';
import { fetchSuperDevices, unlockSuperDevice, deleteSuperDevice } from '../services';
import { downloadCSV } from '../utils/csv';

interface DeviceItem {
  id: string;
  orgId: string;
  deviceId: string;
  deviceName?: string | null;
  deviceType: 'DESKTOP_ADMIN' | 'KIOSK';
  platform?: string | null;
  firmwareVersion?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  isBound: boolean;
  boundAt?: string | null;
  lastLoginAt: string;
  releasedAt?: string | null;
  organization?: {
    id: string;
    name: string;
    subscriptionTier: string;
    maxDesktopAdmins?: number | null;
    maxKiosks?: number | null;
  };
}

interface OrgQuota {
  id: string;
  name: string;
  subscriptionTier: string;
  maxDesktopAdmins: number | null;
  boundDesktopAdmins: number;
  maxKiosks: number | null;
  boundKiosks: number;
  isDesktopLocked: boolean;
}

interface Stats {
  totalDevices: number;
  totalBound: number;
  totalReleased: number;
  desktopAdminCount: number;
  kioskCount: number;
}

export default function Devices() {
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalDevices: 0,
    totalBound: 0,
    totalReleased: 0,
    desktopAdminCount: 0,
    kioskCount: 0,
  });
  const [orgQuotas, setOrgQuotas] = useState<OrgQuota[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Warning Release Confirmation Modal state
  const [unlockModalDevice, setUnlockModalDevice] = useState<DeviceItem | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  // Delete Modal state
  const [deleteModalDevice, setDeleteModalDevice] = useState<DeviceItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchSuperDevices();
      if (res) {
        setDevices(res.devices || []);
        if (res.stats) setStats(res.stats);
        if (res.orgQuotas) setOrgQuotas(res.orgQuotas);
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Failed to load registered devices' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUnlock = async () => {
    if (!unlockModalDevice) return;
    try {
      setUnlocking(true);
      await unlockSuperDevice(unlockModalDevice.id);
      setToast({
        type: 'success',
        message: `Hardware lock released successfully for "${unlockModalDevice.deviceName || unlockModalDevice.deviceId}". ${unlockModalDevice.organization?.name || 'The organization'} can now log in on a new computer.`,
      });
      setUnlockModalDevice(null);
      await loadData();
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Failed to release device lock' });
    } finally {
      setUnlocking(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModalDevice) return;
    try {
      setDeleting(true);
      await deleteSuperDevice(deleteModalDevice.id);
      setToast({
        type: 'success',
        message: `Device registration removed permanently.`,
      });
      setDeleteModalDevice(null);
      await loadData();
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Failed to remove device' });
    } finally {
      setDeleting(false);
    }
  };

  // Filtered devices based on tab, org filter, and search
  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      // Org dropdown filter
      if (selectedOrgId !== 'all' && d.orgId !== selectedOrgId) {
        return false;
      }

      // Tab filter
      if (activeTab === 1 && !d.isBound) return false;
      if (activeTab === 2 && d.deviceType !== 'DESKTOP_ADMIN') return false;
      if (activeTab === 3 && d.deviceType !== 'KIOSK') return false;
      if (activeTab === 4 && d.isBound) return false;

      // Text search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const name = (d.deviceName || '').toLowerCase();
        const id = (d.deviceId || '').toLowerCase();
        const platform = (d.platform || '').toLowerCase();
        const firmware = (d.firmwareVersion || '').toLowerCase();
        const ip = (d.ipAddress || '').toLowerCase();
        const orgName = (d.organization?.name || '').toLowerCase();
        return name.includes(q) || id.includes(q) || platform.includes(q) || firmware.includes(q) || ip.includes(q) || orgName.includes(q);
      }
      return true;
    });
  }, [devices, selectedOrgId, activeTab, search]);

  const exportData = () => {
    const rows = filteredDevices.map((d) => ({
      Device_Name: d.deviceName || 'Terminal',
      Device_ID: d.deviceId,
      Type: d.deviceType === 'DESKTOP_ADMIN' ? 'Desktop Admin PC' : 'Attendance Kiosk',
      Organization: d.organization?.name || 'Unknown',
      Plan_Tier: (d.organization?.subscriptionTier || 'starter').toUpperCase(),
      Platform: d.platform || 'Unknown',
      Firmware: d.firmwareVersion || '',
      IP_Address: d.ipAddress || '',
      Status: d.isBound ? 'Bound & Locked' : 'Released / Open',
      Bound_At: d.boundAt ? new Date(d.boundAt).toLocaleString() : '',
      Last_Active: new Date(d.lastLoginAt).toLocaleString(),
    }));
    downloadCSV('timelogic-registered-devices', rows);
  };

  const tabs = [
    { label: 'All Devices', count: stats.totalDevices },
    { label: 'Bound & Locked', count: stats.totalBound },
    { label: 'Desktop Admins', count: stats.desktopAdminCount },
    { label: 'Attendance Kiosks', count: stats.kioskCount },
    { label: 'Released / Open', count: stats.totalReleased },
  ];

  return (
    <PageShell
      breadcrumb={['System', 'Devices']}
      title="Hardware Devices & Single-System Locks"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      search={search}
      onSearch={setSearch}
      searchPlaceholder="Search by device name, hardware ID, organization, IP, firmware…"
      onExport={exportData}
      exportLabel="Export CSV"
      action={
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-main)] hover:bg-[var(--hover-bg)] transition shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      }
    >
      <div className="h-full overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* Toast Alert */}
        {toast && (
          <div
            className={`p-4 rounded-2xl flex items-center justify-between border text-xs font-semibold shadow-sm ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>{toast.message}</span>
            </div>
            <button onClick={() => setToast(null)} className="opacity-70 hover:opacity-100 p-1">
              <X size={15} />
            </button>
          </div>
        )}

        {/* 1. TOP METRIC COUNTER CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-4 shadow-sm hover:border-primary-400 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Total Registered</span>
              <HardDrive size={18} className="text-primary-600" />
            </div>
            <p className="text-2xl font-black text-[var(--text-main)] mt-2">{stats.totalDevices}</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Physical systems recorded</p>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-4 shadow-sm hover:border-amber-400 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Active Hardware Locks</span>
              <Lock size={18} className="text-amber-600" />
            </div>
            <p className="text-2xl font-black text-[var(--text-main)] mt-2">{stats.totalBound}</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Systems locked to organizations</p>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-4 shadow-sm hover:border-blue-400 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Desktop Admin PCs</span>
              <Laptop size={18} className="text-blue-600" />
            </div>
            <p className="text-2xl font-black text-[var(--text-main)] mt-2">{stats.desktopAdminCount}</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Single-system locked admin apps</p>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-4 shadow-sm hover:border-purple-400 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">Attendance Kiosks</span>
              <Monitor size={18} className="text-purple-600" />
            </div>
            <p className="text-2xl font-black text-[var(--text-main)] mt-2">{stats.kioskCount}</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Physical kiosk check-in terminals</p>
          </div>
        </div>

        {/* 2. FILTER & VIEW CONTROL BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--hover-bg)] border border-[var(--border)] p-3.5 rounded-2xl">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-primary-700" />
              <span className="text-xs font-bold text-[var(--text-main)]">Filter by Organization:</span>
            </div>
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
            >
              <option value="all">All Organizations ({orgQuotas.length})</option>
              {orgQuotas.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.subscriptionTier.toUpperCase()} · {org.boundDesktopAdmins} Desktop / {org.boundKiosks} Kiosks)
                </option>
              ))}
            </select>

            {selectedOrgId !== 'all' && (
              <button
                onClick={() => setSelectedOrgId('all')}
                className="text-xs font-semibold text-primary-700 hover:underline flex items-center gap-1"
              >
                Clear Filter
              </button>
            )}
          </div>

          {/* Right View Switcher */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-[var(--text-muted)] font-medium">
              Showing <strong>{filteredDevices.length}</strong> devices
            </span>
            <div className="flex items-center border border-[var(--border)] bg-[var(--card-bg)] rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'cards' ? 'bg-primary-700 text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
                title="Card View"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'table' ? 'bg-primary-700 text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
                title="Table View"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* 3. DEVICE LISTING */}
        {loading ? (
          <div className="py-20 text-center text-sm text-[var(--text-muted)]">
            <RefreshCw size={28} className="animate-spin mx-auto mb-3 opacity-50 text-primary-600" />
            Loading registered devices and hardware locks…
          </div>
        ) : filteredDevices.length === 0 ? (
          <div className="py-20 text-center bg-[var(--hover-bg)] border border-[var(--border)] rounded-2xl p-8">
            <Laptop size={42} className="mx-auto mb-3 opacity-30 text-[var(--text-muted)]" />
            <h3 className="text-sm font-bold text-[var(--text-main)]">No Devices Found</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {search || selectedOrgId !== 'all'
                ? 'No registered systems match the selected filter or search term.'
                : 'No hardware devices have registered or authenticated yet.'}
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          /* CARD VIEW: Prominent Organization Ownership & Hardware Lock Information */
          <div className="space-y-4">
            {filteredDevices.map((d) => {
              const isDesktop = d.deviceType === 'DESKTOP_ADMIN';
              const orgName = d.organization?.name || 'Unknown Organization';
              const planTier = (d.organization?.subscriptionTier || 'starter').toUpperCase();

              return (
                <div
                  key={d.id}
                  className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden"
                >
                  {/* ORGANISATION OWNERSHIP BANNER */}
                  <div className="px-5 py-3 bg-gradient-to-r from-primary-50/80 via-primary-50/40 to-transparent dark:from-primary-950/40 dark:via-primary-950/20 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-primary-700 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                        <Building2 size={15} />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-primary-700 dark:text-primary-400">
                          Hardware Ownership
                        </span>
                        <h4 className="text-sm font-black text-[var(--text-main)]">
                          This PC belongs to: <span className="text-primary-700 underline underline-offset-2">{orgName}</span>
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                        planTier === 'ENTERPRISE'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                          : planTier === 'CUSTOM'
                          ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        Plan: {planTier}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                        isDesktop
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                      }`}>
                        {isDesktop ? 'Desktop Admin App' : 'Attendance Kiosk Terminal'}
                      </span>
                    </div>
                  </div>

                  {/* HARDWARE DETAILS BODY */}
                  <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    {/* Left: Device Specs & IDs */}
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <div className={`p-3 rounded-2xl mt-0.5 shrink-0 ${
                          isDesktop
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                        }`}>
                          {isDesktop ? <Laptop size={22} /> : <Monitor size={22} />}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-[var(--text-main)]">
                              {d.deviceName || (isDesktop ? 'Desktop Admin PC' : 'Kiosk Terminal')}
                            </h3>
                            {d.isBound ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                <Lock size={11} />
                                Bound & Locked
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-[var(--border)]">
                                <Unlock size={11} />
                                Unbound / Slot Released
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--text-muted)] font-mono mt-1 select-all break-all">
                            Hardware UUID: {d.deviceId}
                          </p>
                        </div>
                      </div>

                      {/* Specs Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                        <div className="bg-[var(--hover-bg)] p-2.5 rounded-xl border border-[var(--border)] flex items-center gap-2">
                          <Cpu size={14} className="text-[var(--text-muted)] shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[10px] text-[var(--text-muted)] block uppercase font-bold">OS / Platform</span>
                            <span className="font-semibold text-[var(--text-main)] truncate block">
                              {d.platform || 'Unknown OS'}
                            </span>
                          </div>
                        </div>

                        <div className="bg-[var(--hover-bg)] p-2.5 rounded-xl border border-[var(--border)] flex items-center gap-2">
                          <Globe size={14} className="text-[var(--text-muted)] shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[10px] text-[var(--text-muted)] block uppercase font-bold">IP Address</span>
                            <span className="font-semibold text-[var(--text-main)] font-mono truncate block">
                              {d.ipAddress || 'Not recorded'}
                            </span>
                          </div>
                        </div>

                        <div className="bg-[var(--hover-bg)] p-2.5 rounded-xl border border-[var(--border)] flex items-center gap-2">
                          <Clock size={14} className="text-[var(--text-muted)] shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[10px] text-[var(--text-muted)] block uppercase font-bold">Last Active</span>
                            <span className="font-semibold text-[var(--text-main)] truncate block">
                              {new Date(d.lastLoginAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {d.firmwareVersion && (
                        <p className="text-[11px] text-[var(--text-muted)] italic">
                          Firmware detail: {d.firmwareVersion}
                        </p>
                      )}
                    </div>

                    {/* Right: Action Buttons with Warning Modal */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-[var(--border)]">
                      {d.isBound ? (
                        <button
                          onClick={() => setUnlockModalDevice(d)}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition active:scale-95"
                        >
                          <Unlock size={14} />
                          Release Hardware Binding
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-[var(--text-muted)] px-3 py-1.5 bg-[var(--hover-bg)] rounded-xl border border-[var(--border)]">
                          Slot Open for Login
                        </span>
                      )}

                      <button
                        onClick={() => setDeleteModalDevice(d)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                        title="Remove device record"
                      >
                        <Trash2 size={14} />
                        <span>Delete Record</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* TABLE VIEW OPTION */
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--hover-bg)] text-[var(--text-muted)] uppercase text-[10px] font-bold tracking-wider border-b border-[var(--border)]">
                <tr>
                  <th className="px-5 py-3.5">Device System</th>
                  <th className="px-5 py-3.5">Organization Ownership</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Platform & IP</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Last Active</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredDevices.map((d) => {
                  const isDesktop = d.deviceType === 'DESKTOP_ADMIN';
                  return (
                    <tr key={d.id} className="hover:bg-[var(--hover-bg)] transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          {isDesktop ? <Laptop size={16} className="text-blue-600 shrink-0" /> : <Monitor size={16} className="text-purple-600 shrink-0" />}
                          <div>
                            <p className="font-bold text-[var(--text-main)] text-sm">
                              {d.deviceName || (isDesktop ? 'Desktop Admin PC' : 'Kiosk Terminal')}
                            </p>
                            <p className="text-[11px] text-[var(--text-muted)] font-mono">
                              {d.deviceId}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-bold text-primary-700 text-sm block">
                          {d.organization?.name || 'Unknown'}
                        </span>
                        <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)]">
                          {d.organization?.subscriptionTier || 'Starter'} Plan
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isDesktop
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                        }`}>
                          {isDesktop ? 'Desktop App' : 'Kiosk'}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold text-[var(--text-main)]">{d.platform || 'Unknown OS'}</p>
                        <p className="text-[11px] text-[var(--text-muted)] font-mono">{d.ipAddress || '—'}</p>
                      </td>

                      <td className="px-5 py-4">
                        {d.isBound ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <Lock size={11} /> Bound & Locked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            <Unlock size={11} /> Released / Open
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-[11px] text-[var(--text-muted)]">
                        {new Date(d.lastLoginAt).toLocaleString()}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {d.isBound && (
                            <button
                              onClick={() => setUnlockModalDevice(d)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition"
                            >
                              Release Binding
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteModalDevice(d)}
                            className="p-1.5 text-[var(--text-muted)] hover:text-red-600 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. PROMINENT WARNING MODAL TO RELEASE HARDWARE BINDING */}
      {unlockModalDevice && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl space-y-5">
            {/* Warning Shield & Close */}
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center shadow-inner">
                <AlertTriangle size={26} />
              </div>
              <button
                onClick={() => setUnlockModalDevice(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Heading */}
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-1">
                Security & Hardware Binding Warning
              </span>
              <h3 className="text-xl font-black text-[var(--text-main)]">
                Release Hardware Device Binding?
              </h3>
            </div>

            {/* Target Details Highlight Box */}
            <div className="p-4 rounded-2xl bg-[var(--hover-bg)] border border-[var(--border)] space-y-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                <span className="font-semibold text-[var(--text-muted)]">Target System:</span>
                <span className="font-black text-[var(--text-main)]">
                  {unlockModalDevice.deviceName || unlockModalDevice.deviceId}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                <span className="font-semibold text-[var(--text-muted)]">Bound Organization:</span>
                <span className="font-black text-primary-700 text-sm">
                  {unlockModalDevice.organization?.name || 'Unknown'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[var(--text-muted)]">Device Category:</span>
                <span className="font-bold text-[var(--text-main)]">
                  {unlockModalDevice.deviceType === 'DESKTOP_ADMIN' ? 'Desktop Admin App' : 'Attendance Kiosk Terminal'}
                </span>
              </div>
            </div>

            {/* Detailed Consequence Warning */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                <ShieldAlert size={15} />
                Please review before proceeding:
              </p>
              <ul className="space-y-1.5 list-disc list-inside text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-300/90">
                <li>This will <strong>release the physical system lock</strong> for {unlockModalDevice.organization?.name}.</li>
                <li>The hardware seat will become open. <strong>Another computer will now be permitted to log in</strong> and claim this slot.</li>
                <li>This computer will not be able to log in again if all quota slots become occupied by other machines.</li>
              </ul>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setUnlockModalDevice(null)}
                disabled={unlocking}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-[var(--border)] text-[var(--text-main)] hover:bg-[var(--hover-bg)] transition"
              >
                Cancel, Keep Bound
              </button>
              <button
                onClick={handleUnlock}
                disabled={unlocking}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md transition disabled:opacity-50 active:scale-95 flex items-center gap-2"
              >
                <Unlock size={14} />
                {unlocking ? 'Releasing Lock…' : 'Yes, Release Hardware Binding'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. DELETE MODAL */}
      {deleteModalDevice && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/40 flex items-center justify-center">
                <Trash2 size={20} />
              </div>
              <button onClick={() => setDeleteModalDevice(null)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                <X size={18} />
              </button>
            </div>

            <div>
              <h3 className="text-lg font-black text-[var(--text-main)]">
                Delete Device Record?
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
                Permanently delete the registration record for <strong className="text-[var(--text-main)]">{deleteModalDevice.deviceName || deleteModalDevice.deviceId}</strong>?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeleteModalDevice(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--border)] text-[var(--text-main)] hover:bg-[var(--hover-bg)]"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
