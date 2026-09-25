import React, { useEffect, useState } from 'react';
import { Search, Check, X, Plus } from 'lucide-react';
import Header from '../components/Header';
import { fetchAdminLeaves, approveLeave, rejectLeave, stopLeave, fetchEmployees, grantEmployeeLeave } from '../services';

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
};

function Spinner() {
  return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent" /></div>;
}

export default function Leaves() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('PENDING');
  const [employees, setEmployees] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  const load = () => fetchAdminLeaves().then(setRequests).finally(() => setLoading(false));
  useEffect(() => { load(); fetchEmployees().then(setEmployees).catch(() => {}); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);

  const filtered = requests.filter((r) => {
    const name = `${r.employee?.firstName} ${r.employee?.lastName}`.toLowerCase();
    return name.includes(search.toLowerCase()) && (filter === 'All' || r.status === filter);
  });

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Leave Requests" subtitle={`${requests.filter((r) => r.status === 'PENDING').length} pending`} action={<button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary-700 text-white text-sm font-bold"><Plus size={15} />Add leave</button>} />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee..." className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          {['All', 'PENDING', 'APPROVED', 'REJECTED'].map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={`text-xs font-semibold px-3 py-2 rounded-xl transition ${filter === s ? 'bg-primary-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{s}</button>
          ))}
        </div>
        {loading ? <Spinner /> : (
          <div className="space-y-3">
            {filtered.map((r: any) => (
              <div key={r.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary-700">{r.employee?.firstName?.[0]}{r.employee?.lastName?.[0]}</span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{r.employee?.firstName} {r.employee?.lastName}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <span className="text-xs font-bold bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">{r.leaveType}</span>
                        <span className="text-sm text-slate-600">{fmtDate(r.startDate)} → {fmtDate(r.endDate)}</span>
                        <span className="text-sm font-semibold text-slate-700">({r.totalDays}d)</span>
                      </div>
                      {r.reason && <p className="text-sm text-slate-500 mt-1 italic">"{r.reason}"</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLE[r.status] ?? 'bg-slate-100 text-slate-500'}`}>{r.status}</span>
                    {r.status === 'APPROVED' && (
                      <button onClick={async () => { await stopLeave(r.id); load(); }} className="flex items-center gap-1 bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-xl">Stop leave</button>
                    )}
                    {r.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button onClick={async () => { await approveLeave(r.id); load(); }} className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-xl"><Check size={13} />Approve</button>
                        <button onClick={async () => { const reason = prompt('Rejection reason:') ?? 'Rejected'; await rejectLeave(r.id, reason); load(); }} className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-2 rounded-xl"><X size={13} />Reject</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="text-center text-slate-400 py-16">No leave requests found</div>}
          </div>
        )}
      </div>
      {showAdd && <AddLeaveModal employees={employees} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); setFilter('All'); load(); }} />}
    </div>
  );
}

function AddLeaveModal({ employees, onClose, onSaved }: { employees: any[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ employeeId: employees[0]?.id ?? '', leaveType: 'ANNUAL', startDate: '', endDate: '', reason: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!form.employeeId || !form.startDate || !form.endDate || !form.reason.trim()) { setError('Employee, dates, and reason are required.'); return; }
    if (form.endDate < form.startDate) { setError('End date must be on or after start date.'); return; }
    setSaving(true); setError('');
    try { await grantEmployeeLeave({ ...form, reason: form.reason.trim() }); onSaved(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not add leave.'); }
    finally { setSaving(false); }
  };
  const input = 'w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-main)] rounded-xl px-3 py-2.5 text-sm';
  return <div className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center"><div className="w-full max-w-md bg-[var(--card-bg)] rounded-3xl shadow-2xl"><div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]"><h2 className="font-bold text-[var(--text-main)]">Give employee leave</h2><button onClick={onClose}><X size={18} /></button></div><div className="p-6 space-y-4">{error && <p className="text-sm text-red-600">{error}</p>}<label className="block text-xs font-semibold text-[var(--text-muted)]">Employee<select className={`${input} mt-1`} value={form.employeeId} onChange={(e) => setForm((p) => ({ ...p, employeeId: e.target.value }))}>{employees.filter((e) => e.status === 'ACTIVE').map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}</select></label><label className="block text-xs font-semibold text-[var(--text-muted)]">Leave type<select className={`${input} mt-1`} value={form.leaveType} onChange={(e) => setForm((p) => ({ ...p, leaveType: e.target.value }))}>{['ANNUAL', 'SICK', 'CASUAL', 'MATERNITY', 'PATERNITY', 'UNPAID', 'COMPASSIONATE'].map((type) => <option key={type}>{type}</option>)}</select></label><div className="grid grid-cols-2 gap-3"><label className="block text-xs font-semibold text-[var(--text-muted)]">From<input type="date" className={`${input} mt-1`} value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} /></label><label className="block text-xs font-semibold text-[var(--text-muted)]">To<input type="date" className={`${input} mt-1`} value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} /></label></div><label className="block text-xs font-semibold text-[var(--text-muted)]">Reason<textarea className={`${input} mt-1 min-h-24`} value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} /></label></div><div className="px-6 pb-6 flex justify-end gap-3"><button onClick={onClose} className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-semibold">Cancel</button><button onClick={() => void submit()} disabled={saving} className="px-5 py-2 rounded-xl bg-primary-700 text-white text-sm font-bold disabled:opacity-50">{saving ? 'Adding...' : 'Add leave'}</button></div></div></div>;
}
