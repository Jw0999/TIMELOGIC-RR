import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Plus, RefreshCw, X } from 'lucide-react';
import Header from '../components/Header';
import { createManualPenalty, fetchEmployees, fetchMonthlyPenalties, fetchManualPenalties } from '../services';

type Employee = { id: string; firstName: string; lastName: string; employeeCode?: string | null };
type Penalty = {
  id: string; employeeId: string; amount: number; reason: string; createdAt: string;
  employee: Employee; createdBy?: { firstName: string; lastName: string };
};
type MonthlyTotal = { employeeId: string; attendancePenalty: number; breakPenalty: number; manualPenalty: number; totalPenalty: number };

const currentMonth = () => new Date().toISOString().slice(0, 7);
const money = (value: number) => `NGN ${Number(value || 0).toLocaleString()}`;

export default function Penalties() {
  const [month, setMonth] = useState(currentMonth);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [automaticTotals, setAutomaticTotals] = useState<MonthlyTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [employeeRows, penaltyRows, monthly] = await Promise.all([fetchEmployees(), fetchManualPenalties(month), fetchMonthlyPenalties(month)]);
      setEmployees(employeeRows); setPenalties(penaltyRows); setAutomaticTotals(monthly?.employees ?? []);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not load penalties.'); }
    finally { setLoading(false); }
  }, [month]);

  useEffect(() => { void load(); }, [load]);

  const totals = useMemo(() => penalties.reduce<Record<string, number>>((result, penalty) => {
    result[penalty.employeeId] = (result[penalty.employeeId] ?? 0) + penalty.amount;
    return result;
  }, {}), [penalties]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Penalties" subtitle="Manual penalties alongside automatic attendance and break penalties"
        action={<div className="flex items-center gap-2"><input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-main)] rounded-xl px-3 py-2 text-sm" /><button onClick={() => void load()} className="p-2 rounded-xl border border-[var(--border)] text-[var(--text-main)] hover:bg-[var(--hover-bg)]" title="Refresh"><RefreshCw size={15} /></button><button onClick={() => { setSelectedEmployeeId(''); setShowAdd(true); }} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary-700 text-white text-sm font-bold hover:bg-primary-800"><Plus size={15} />Add penalty</button></div>} />
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {error && <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300"><AlertCircle size={16} />{error}</div>}
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] overflow-hidden">
          {loading ? <div className="h-48 flex items-center justify-center"><RefreshCw className="animate-spin text-primary-600" /></div> : <table className="w-full text-sm"><thead><tr className="bg-[var(--hover-bg)] border-b border-[var(--border)]">{['Employee', 'Manual', 'Entries', 'Automatic', 'Total', 'Action'].map((heading) => <th key={heading} className="text-left text-xs font-semibold text-[var(--text-muted)] px-4 py-3">{heading}</th>)}</tr></thead><tbody className="divide-y divide-[var(--border)]">{employees.map((employee) => { const rows = penalties.filter((penalty) => penalty.employeeId === employee.id); const manualTotal = totals[employee.id] ?? 0; const automatic = automaticTotals.find((item) => item.employeeId === employee.id); return <tr key={employee.id} className="hover:bg-[var(--hover-bg)]"><td className="px-4 py-3"><p className="font-semibold text-[var(--text-main)]">{employee.firstName} {employee.lastName}</p><p className="text-xs text-[var(--text-muted)]">{employee.employeeCode ?? 'No code'}</p></td><td className="px-4 py-3 font-semibold text-[var(--text-main)]">{money(manualTotal)}</td><td className="px-4 py-3 text-[var(--text-muted)]">{rows.length}</td><td className="px-4 py-3 text-[var(--text-muted)]">{money((automatic?.attendancePenalty ?? 0) + (automatic?.breakPenalty ?? 0))}</td><td className="px-4 py-3 font-bold text-[var(--text-main)]">{money(automatic?.totalPenalty ?? manualTotal)}</td><td className="px-4 py-3"><button onClick={() => { setSelectedEmployeeId(employee.id); setShowAdd(true); }} className="text-primary-700 dark:text-primary-300 text-xs font-bold">Add to employee</button></td></tr>; })}</tbody></table>}
          {!loading && employees.length === 0 && <p className="py-12 text-center text-sm text-[var(--text-muted)]">No registered employees found.</p>}
        </div>
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] overflow-hidden"><div className="px-5 py-4 border-b border-[var(--border)]"><h2 className="font-bold text-[var(--text-main)]">Manual penalty history</h2></div>{penalties.length === 0 ? <p className="p-5 text-sm text-[var(--text-muted)]">No manual penalties recorded for {month}.</p> : <div className="divide-y divide-[var(--border)]">{penalties.map((penalty) => <div key={penalty.id} className="px-5 py-3 flex items-center justify-between gap-4"><div><p className="font-semibold text-sm text-[var(--text-main)]">{penalty.employee.firstName} {penalty.employee.lastName}</p><p className="text-xs text-[var(--text-muted)]">{penalty.reason} · {new Date(penalty.createdAt).toLocaleDateString()}</p></div><span className="font-bold text-sm text-red-600">{money(penalty.amount)}</span></div>)}</div>}</div>
      </div>
      {showAdd && <AddPenaltyModal employees={employees} selectedEmployeeId={selectedEmployeeId} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); void load(); }} />}
    </div>
  );
}

function AddPenaltyModal({ employees, selectedEmployeeId, onClose, onSaved }: { employees: Employee[]; selectedEmployeeId: string; onClose: () => void; onSaved: () => void }) {
  const [employeeId, setEmployeeId] = useState(selectedEmployeeId || employees[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async () => { if (!employeeId || Number(amount) < 1 || !reason.trim()) { setError('Choose an employee, enter a positive amount, and provide a reason.'); return; } setSaving(true); setError(''); try { await createManualPenalty({ employeeId, amount: Number(amount), reason: reason.trim() }); onSaved(); } catch (err) { setError(err instanceof Error ? err.message : 'Could not add penalty.'); } finally { setSaving(false); } };
  const input = 'w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-main)] rounded-xl px-3 py-2.5 text-sm';
  return <div className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center"><div className="w-full max-w-md bg-[var(--card-bg)] rounded-3xl shadow-2xl"><div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]"><h2 className="font-bold text-[var(--text-main)]">Add employee penalty</h2><button onClick={onClose}><X size={18} /></button></div><div className="p-6 space-y-4">{error && <p className="text-sm text-red-600">{error}</p>}<label className="block text-xs font-semibold text-[var(--text-muted)]">Employee<select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} className={`${input} mt-1`}>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.firstName} {employee.lastName}</option>)}</select></label><label className="block text-xs font-semibold text-[var(--text-muted)]">Amount (NGN)<input type="number" min="1" value={amount} onChange={(event) => setAmount(event.target.value)} className={`${input} mt-1`} /></label><label className="block text-xs font-semibold text-[var(--text-muted)]">Reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} className={`${input} mt-1 min-h-24`} /></label></div><div className="px-6 pb-6 flex justify-end gap-3"><button onClick={onClose} className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-semibold">Cancel</button><button onClick={() => void submit()} disabled={saving} className="px-5 py-2 rounded-xl bg-primary-700 text-white text-sm font-bold disabled:opacity-50">{saving ? 'Adding...' : 'Add penalty'}</button></div></div></div>;
}