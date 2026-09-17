import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Calendar, Play, RefreshCw, Search } from 'lucide-react';
import Header from '../components/Header';
import { fetchDailyBreaks, fetchAllBreaks, startEmployeeBreak, endEmployeeBreak, fetchEmployees, fetchLiveAttendance, waiveBreakPenalty } from '../services';
import { useAuth } from '../context/AuthContext';

const BREAK_COLORS: Record<string, string> = {
  LUNCH: 'bg-orange-100 text-orange-700',
  SHORT_BREAK: 'bg-primary-100 text-primary-700',
  PRAYER: 'bg-violet-100 text-violet-700',
  PERSONAL: 'bg-teal-100 text-teal-700',
  NURSING: 'bg-pink-100 text-pink-700',
};

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent" />
    </div>
  );
}

export default function Breaks() {
  const { serverNow, organizationTimezone } = useAuth();
  const [breaks, setBreaks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'today' | 'past' | 'all'>('all');
  const [date, setDate] = useState('');
  const [starting, setStarting] = useState<string | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [checkedInEmployees, setCheckedInEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  const takenEmployeeIds = new Set(
    breaks
      .filter((item) => {
        if (view === 'today') return true;
        const tz = item.employee?.organization?.timezone || organizationTimezone || 'Africa/Lagos';
        const todayStr = serverNow?.toLocaleDateString('en-CA', { timeZone: tz });
        const itemDateStr = item.startTime ? new Date(item.startTime).toLocaleDateString('en-CA', { timeZone: tz }) : '';
        return itemDateStr === todayStr;
      })
      .map((item) => item.employeeId)
  );

  const isToday = Boolean(
    serverNow && (view === 'today' || date === serverNow.toLocaleDateString('en-CA', { timeZone: organizationTimezone }))
  );

  const selectedEmpObj = employees.find((e) => e.id === selectedEmployee);
  const selectedPolicy = selectedEmpObj?.department?.breakPolicy;
  const breakStart = selectedPolicy?.breakStart;
  const breakEnd = selectedPolicy?.breakEnd;

  const breakWindowStatus = useMemo(() => {
    if (!selectedEmpObj) return null;
    if (!breakStart || !breakEnd) {
      return { allowed: false, text: 'No department break schedule assigned', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' };
    }
    if (!serverNow) return { allowed: true, text: `Break window: ${breakStart} - ${breakEnd}`, color: 'text-slate-600' };

    const tz = selectedEmpObj.organization?.timezone || organizationTimezone || 'Africa/Lagos';
    const timeStr = serverNow.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz });
    const [currH, currM] = timeStr.split(':').map(Number);
    const currMin = currH * 60 + currM;

    const [startH, startM] = breakStart.split(':').map(Number);
    const startMin = startH * 60 + startM;
    const [endH, endM] = breakEnd.split(':').map(Number);
    const endMin = endH * 60 + endM;

    if (currMin < startMin) {
      return { allowed: false, text: `Too early (Break time is ${breakStart} - ${breakEnd})`, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' };
    }
    if (currMin >= endMin) {
      return { allowed: false, text: `Too late (Break time was ${breakStart} - ${breakEnd})`, color: 'text-red-600 bg-red-50 dark:bg-red-950/30' };
    }
    return { allowed: true, text: `Break time open (${breakStart} - ${breakEnd})`, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' };
  }, [selectedEmpObj, breakStart, breakEnd, serverNow, organizationTimezone]);

  const load = async () => {
    setLoading(true);
    try {
      if (view === 'all') {
        const data = await fetchAllBreaks();
        setBreaks(data);
      } else if (view === 'today') {
        const todayStr = serverNow
          ? serverNow.toLocaleDateString('en-CA', { timeZone: organizationTimezone })
          : new Date().toISOString().slice(0, 10);
        const data = await fetchDailyBreaks(todayStr);
        setBreaks(data);
      } else {
        const targetDate = date || (serverNow ? serverNow.toLocaleDateString('en-CA', { timeZone: organizationTimezone }) : '');
        const data = await fetchDailyBreaks(targetDate);
        setBreaks(data);
      }
      const live = await fetchLiveAttendance();
      setCheckedInEmployees(live.filter((record: any) => record.clockInTime && !record.clockOutTime));
    } catch (err) {
      console.error('Failed to load breaks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!date && serverNow) {
      setDate(serverNow.toLocaleDateString('en-CA', { timeZone: organizationTimezone }));
    }
  }, [date, serverNow, organizationTimezone]);

  useEffect(() => {
    void load();
    fetchEmployees().then(setEmployees).catch(() => {});
  }, [view, date]);

  const startFor = async (employeeId: string, breakType: string) => {
    setStarting(employeeId);
    try {
      await startEmployeeBreak(employeeId, breakType, 'Started by organization admin');
      void load();
    } catch (err: any) {
      alert(err?.message ?? 'Could not start break.');
    } finally {
      setStarting(null);
    }
  };

  const endFor = async (employeeId: string, breakId: string) => {
    setStarting(employeeId);
    try {
      await endEmployeeBreak(employeeId, breakId);
      void load();
    } catch (err: any) {
      alert(err?.message ?? 'Could not end break.');
    } finally {
      setStarting(null);
    }
  };

  const fmtTime = (t: string | null, timezone?: string | null) =>
    t ? new Date(t).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: timezone || organizationTimezone || 'Africa/Lagos' }) : '—';

  const fmtDate = (t: string | null, timezone?: string | null) =>
    t ? new Date(t).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: timezone || organizationTimezone || 'Africa/Lagos' }) : '—';

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return breaks.filter((b) => {
      const matchSearch =
        !q ||
        `${b.employee?.firstName} ${b.employee?.lastName} ${b.employee?.employeeCode}`.toLowerCase().includes(q);
      const matchType = typeFilter === 'All' || b.breakType === typeFilter;
      return matchSearch && matchType;
    });
  }, [breaks, search, typeFilter]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Break Records"
        subtitle={
          view === 'all'
            ? `${filtered.length} total break record${filtered.length === 1 ? '' : 's'} across all dates`
            : view === 'today'
            ? `${filtered.length} break record${filtered.length === 1 ? '' : 's'} today`
            : `${filtered.length} break record${filtered.length === 1 ? '' : 's'} for ${date}`
        }
        action={(
          <div className="flex items-center gap-3"><span className="text-xs font-semibold text-emerald-600">{breaks.filter((item) => !item.endTime).length} active breaks</span><button
            onClick={() => void load()}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--text-main)] hover:bg-[var(--hover-bg)] disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button></div>
        )}
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* View mode toggle */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {(['all', 'today', 'past'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setView(opt)}
              className={`text-xs font-semibold px-3 py-2 rounded-xl transition ${
                view === opt
                  ? 'bg-primary-700 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              {opt === 'all' ? 'All History' : opt === 'today' ? 'Today' : 'Past Date'}
            </button>
          ))}
          {view === 'past' && (
            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-slate-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs bg-white dark:bg-slate-900 text-[var(--text-main)]"
              />
            </div>
          )}
        </div>

        {/* Action toolbar for Admin to record break today */}
        {view === 'today' && (
          <div className="flex flex-wrap items-center gap-3 mb-5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs bg-white dark:bg-slate-900 text-[var(--text-main)]"
            >
              <option value="">Select employee for admin break</option>
              {employees
                .filter((e) => e.status === 'ACTIVE')
                .map((e) => (
                  <option key={e.id} value={e.id} disabled={takenEmployeeIds.has(e.id)}>
                    {e.firstName} {e.lastName} ({e.department?.name ?? 'No department'})
                    {takenEmployeeIds.has(e.id) ? ' — break already taken today' : ''}
                  </option>
                ))}
            </select>
            {breakWindowStatus && (
              <span className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-current/20 ${breakWindowStatus.color}`}>
                {breakWindowStatus.text}
              </span>
            )}
            <button
              disabled={!isToday || !selectedEmployee || takenEmployeeIds.has(selectedEmployee) || !breakWindowStatus?.allowed || !!starting}
              onClick={() => startFor(selectedEmployee, 'LUNCH')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary-700 text-white text-xs font-semibold disabled:opacity-50 transition hover:bg-primary-800"
            >
              <Play size={13} /> Take lunch
            </button>
            <button
              disabled={!isToday || !selectedEmployee || takenEmployeeIds.has(selectedEmployee) || !breakWindowStatus?.allowed || !!starting}
              onClick={() => startFor(selectedEmployee, 'SHORT_BREAK')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700 text-white text-xs font-semibold disabled:opacity-50 transition hover:bg-slate-800"
            >
              Take short break
            </button>
          </div>
        )}

        <div className="mb-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/20 p-4">
          <div className="flex items-center justify-between mb-3">
            <div><h2 className="font-bold text-[var(--text-main)]">Checked-in employees</h2><p className="text-xs text-[var(--text-muted)]">Employees currently checked in stay visible here while they take or end a break.</p></div>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{checkedInEmployees.length} active</span>
          </div>
          {checkedInEmployees.length === 0 ? <p className="text-sm text-[var(--text-muted)]">No employees are currently checked in.</p> : <div className="flex flex-wrap gap-2">{checkedInEmployees.map((record: any) => { const active = breaks.find((item) => item.employeeId === record.employeeId && !item.endTime); const name = record.employee ? `${record.employee.firstName} ${record.employee.lastName}` : record.employeeName ?? record.name ?? record.employeeId; return <div key={record.id ?? record.employeeId} className="inline-flex items-center gap-2 rounded-xl bg-[var(--card-bg)] border border-emerald-200 dark:border-emerald-900 px-3 py-2"><span className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-sm font-semibold text-[var(--text-main)]">{name}</span><span className="text-[11px] font-bold text-[var(--text-muted)]">{active ? `On ${String(active.breakType).replace('_', ' ')}` : 'Available'}</span></div>; })}</div>}
        </div>

        {/* Search & Type filter */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee by name or code..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-xs text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          {(['All', 'LUNCH', 'SHORT_BREAK', 'PRAYER', 'PERSONAL', 'NURSING'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`text-xs font-semibold px-3 py-2 rounded-xl transition ${
                typeFilter === t
                  ? 'bg-primary-700 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <Spinner />
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-5 py-3">Employee</th>
                    <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Date</th>
                    <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Break Type</th>
                    <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Start</th>
                    <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">End</th>
                    <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Allowed Window</th>
                    <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Duration</th>
                    <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Status</th>
                    {view === 'today' && (
                      <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Admin Action</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {filtered.map((b: any) => {
                    const tz = b.employee?.organization?.timezone || organizationTimezone;
                    return (
                      <tr
                        key={b.id}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition ${
                          b.isAutoEnded ? 'bg-orange-50/50 dark:bg-orange-950/20' : ''
                        }`}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-primary-700 dark:text-primary-300">
                                {b.employee?.firstName?.[0]}
                                {b.employee?.lastName?.[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 dark:text-slate-200">
                                {b.employee?.firstName} {b.employee?.lastName}
                              </p>
                              <p className="text-xs text-slate-400 font-mono">{b.employee?.employeeCode}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {fmtDate(b.startTime, tz)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              BREAK_COLORS[b.breakType] ?? 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {b.breakType?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                          {fmtTime(b.startTime, tz)}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                          {b.endTime ? (
                            fmtTime(b.endTime, tz)
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs animate-pulse">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                          {b.employee?.department?.breakPolicy?.breakStart && b.employee?.department?.breakPolicy?.breakEnd
                            ? `${b.employee.department.breakPolicy.breakStart} - ${b.employee.department.breakPolicy.breakEnd}`
                            : 'Any time'}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">
                          {b.durationMinutes ?? '—'}m
                          {b.penalty > 0 && (
                            <div className="mt-1">
                              <span className="block text-xs text-red-600 font-semibold">
                                Penalty ₦{Number(b.penalty).toLocaleString()}
                              </span>
                              <button
                                onClick={async () => {
                                  if (window.confirm(`Waive break penalty of ₦${Number(b.penalty).toLocaleString()} for ${b.employee?.firstName}?`)) {
                                    await waiveBreakPenalty(b.id);
                                    void load();
                                  }
                                }}
                                className="text-[10px] text-rose-600 hover:text-rose-800 underline font-medium"
                                title="Waive break penalty"
                              >
                                Waive
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {b.isAutoEnded ? (
                            <div className="flex items-center gap-1 text-orange-600">
                              <AlertCircle size={13} />
                              <span className="text-xs font-semibold">Auto-ended</span>
                            </div>
                          ) : b.endTime ? (
                            <span
                              className={`text-xs font-semibold ${
                                b.penalty > 0 ? 'text-red-600' : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {b.penalty > 0 ? 'Overstayed' : 'Completed'}
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-primary-600">In progress</span>
                          )}
                        </td>
                        {view === 'today' && (
                          <td className="px-4 py-3">
                            {!b.endTime && (
                              <button
                                disabled={starting === b.employee?.id}
                                onClick={() => endFor(b.employee.id, b.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold disabled:opacity-50 transition"
                              >
                                {starting === b.employee?.id ? 'Ending...' : 'End break'}
                              </button>
                            )}
                            {b.endTime && (
                              <button
                                disabled={starting === b.employee?.id}
                                onClick={() => startFor(b.employee.id, 'SHORT_BREAK')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 text-xs font-semibold disabled:opacity-50 transition"
                              >
                                <Play size={12} />
                                {starting === b.employee?.id ? 'Starting...' : 'Start break'}
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm">
                No break records found
                {view === 'today' ? ' for today' : view === 'past' ? ` for ${date}` : ''}.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
