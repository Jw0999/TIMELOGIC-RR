import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  DollarSign,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import Header from '../components/Header';
import {
  createManualPenalty,
  deleteManualPenalty,
  waiveEmployeeAutoPenalties,
  fetchEmployees,
  fetchMonthlyPenalties,
  fetchManualPenalties,
} from '../services';

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  employeeCode?: string | null;
};

type Penalty = {
  id: string;
  employeeId: string;
  amount: number;
  reason: string;
  createdAt: string;
  employee: Employee;
  createdBy?: { firstName: string; lastName: string };
};

type MonthlyTotal = {
  id?: string;
  employeeId?: string;
  employeeCode?: string | null;
  attendancePenalty: number;
  breakPenalty: number;
  overBreakPenalty?: number;
  latenessPenalty?: number;
  completelyLatePenalty?: number;
  absentPenalty?: number;
  autoPenalty?: number;
  manualPenalty: number;
  totalPenalty: number;
  attendanceCount?: number;
};

const currentMonth = () => new Date().toISOString().slice(0, 7);
const money = (value: number) => `NGN ${Number(value || 0).toLocaleString()}`;

export default function Penalties() {
  const [month, setMonth] = useState(currentMonth);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [automaticTotals, setAutomaticTotals] = useState<MonthlyTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [waivingEmployeeId, setWaivingEmployeeId] = useState<string | null>(null);

  const monthLabel = useMemo(() => {
    try {
      const [y, m] = month.split('-').map(Number);
      const d = new Date(Date.UTC(y, m - 1, 1));
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    } catch {
      return month;
    }
  }, [month]);

  const stepMonth = (delta: number) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(Date.UTC(y, m - 1 + delta, 1));
    setMonth(d.toISOString().slice(0, 7));
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [employeeRows, penaltyRows, monthly] = await Promise.all([
        fetchEmployees(),
        fetchManualPenalties(month),
        fetchMonthlyPenalties(month),
      ]);

      const rawMonthly: MonthlyTotal[] = Array.isArray(monthly)
        ? monthly
        : Array.isArray(monthly?.employees)
        ? monthly.employees
        : Array.isArray(monthly?.data?.employees)
        ? monthly.data.employees
        : [];

      setEmployees(employeeRows);
      setPenalties(penaltyRows);
      setAutomaticTotals(rawMonthly);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load penalties.');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    return penalties.reduce<Record<string, number>>((result, penalty) => {
      result[penalty.employeeId] = (result[penalty.employeeId] ?? 0) + penalty.amount;
      return result;
    }, {});
  }, [penalties]);

  const findAutomatic = useCallback(
    (emp: Employee) => {
      return automaticTotals.find(
        (item: any) =>
          item.id === emp.id ||
          item.employeeId === emp.id ||
          (item.employeeCode && emp.employeeCode && item.employeeCode === emp.employeeCode)
      );
    },
    [automaticTotals]
  );

  const overallStats = useMemo(() => {
    let totalManual = 0;
    let totalAuto = 0;
    let totalOverBreak = 0;
    let totalLate = 0;
    let totalCompletelyLate = 0;
    let employeesWithPenalties = 0;

    for (const emp of employees) {
      const manual = totals[emp.id] ?? 0;
      const autoObj = findAutomatic(emp);
      const auto =
        autoObj?.autoPenalty != null
          ? autoObj.autoPenalty
          : (autoObj?.attendancePenalty ?? 0) + (autoObj?.breakPenalty ?? 0);

      totalManual += manual;
      totalAuto += auto;
      totalOverBreak += autoObj?.overBreakPenalty ?? autoObj?.breakPenalty ?? 0;
      totalLate += autoObj?.latenessPenalty ?? 0;
      totalCompletelyLate += autoObj?.completelyLatePenalty ?? 0;

      if (manual + auto > 0) employeesWithPenalties++;
    }

    return {
      totalManual,
      totalAuto,
      totalOverBreak,
      totalLate,
      totalCompletelyLate,
      grandTotal: totalManual + totalAuto,
      employeesWithPenalties,
    };
  }, [employees, totals, findAutomatic]);

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
        (e.employeeCode && e.employeeCode.toLowerCase().includes(q))
    );
  }, [employees, search]);

  const handleDeleteManualPenalty = async (penalty: Penalty) => {
    const confirmMsg = `Remove penalty of ${money(penalty.amount)} for ${penalty.employee.firstName} ${penalty.employee.lastName} (${penalty.reason})?`;
    if (!window.confirm(confirmMsg)) return;

    setDeletingId(penalty.id);
    setError('');
    setSuccessMsg('');
    try {
      await deleteManualPenalty(penalty.id);
      setSuccessMsg(`Penalty of ${money(penalty.amount)} removed successfully.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove penalty.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleWaiveAutoPenalties = async (employee: Employee, autoAmount: number) => {
    const confirmMsg = `Remove all auto penalties (${money(autoAmount)}) for ${employee.firstName} ${employee.lastName} for ${monthLabel}?\n\nThis will clear Over Break, Lateness, and Completely Late penalties for this month.`;
    if (!window.confirm(confirmMsg)) return;

    setWaivingEmployeeId(employee.id);
    setError('');
    setSuccessMsg('');
    try {
      await waiveEmployeeAutoPenalties(employee.id, month);
      setSuccessMsg(`Auto penalties for ${employee.firstName} ${employee.lastName} cleared successfully.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not clear auto penalties.');
    } finally {
      setWaivingEmployeeId(null);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Penalties"
        subtitle={`Showing penalties for ${monthLabel} — Manual alongside automatic Over Break, Lateness, and Completely Late penalties`}
        action={
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] overflow-hidden">
              <button
                onClick={() => stepMonth(-1)}
                className="p-2 hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
                title="Previous month"
              >
                <ChevronLeft size={16} />
              </button>
              <input
                type="month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                className="bg-transparent text-[var(--text-main)] px-2 py-2 text-sm focus:outline-none"
              />
              <button
                onClick={() => stepMonth(1)}
                className="p-2 hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
                title="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <button
              onClick={() => void load()}
              disabled={loading}
              className="p-2 rounded-xl border border-[var(--border)] text-[var(--text-main)] hover:bg-[var(--hover-bg)] disabled:opacity-50 transition"
              title="Refresh"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => {
                setSelectedEmployeeId('');
                setShowAdd(true);
              }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary-700 text-white text-sm font-bold hover:bg-primary-800 transition shadow-sm"
            >
              <Plus size={15} />
              Add penalty
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-3.5 text-sm text-red-700 dark:text-red-300">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-3.5 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[var(--card-bg)] p-4 rounded-2xl border border-[var(--border)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-muted)]">Total Penalties</span>
              <DollarSign size={16} className="text-red-500" />
            </div>
            <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-2">
              {money(overallStats.grandTotal)}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">{monthLabel}</p>
          </div>

          <div className="bg-[var(--card-bg)] p-4 rounded-2xl border border-[var(--border)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-muted)]">Auto Penalties</span>
              <ShieldAlert size={16} className="text-amber-500" />
            </div>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-2">
              {money(overallStats.totalAuto)}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Break, Late & Completely Late</p>
          </div>

          <div className="bg-[var(--card-bg)] p-4 rounded-2xl border border-[var(--border)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-muted)]">Manual Penalties</span>
              <DollarSign size={16} className="text-primary-500" />
            </div>
            <p className="text-xl font-bold text-[var(--text-main)] mt-2">
              {money(overallStats.totalManual)}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">{penalties.length} recorded entries</p>
          </div>

          <div className="bg-[var(--card-bg)] p-4 rounded-2xl border border-[var(--border)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-muted)]">Employees Penalized</span>
              <Users size={16} className="text-blue-500" />
            </div>
            <p className="text-xl font-bold text-[var(--text-main)] mt-2">
              {overallStats.employeesWithPenalties} / {employees.length}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">In {monthLabel}</p>
          </div>
        </div>

        {/* Main Employee Penalties Table */}
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-bold text-[var(--text-main)]">Employee Penalties Overview ({monthLabel})</h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Monthly auto penalties (Over Break, Lateness, Completely Late) alongside manual adjustments
              </p>
            </div>
            <div className="relative max-w-xs w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search employee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-main)] rounded-xl text-xs"
              />
            </div>
          </div>

          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <RefreshCw className="animate-spin text-primary-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--hover-bg)] border-b border-[var(--border)]">
                    {['Employee', 'Manual', 'Entries', 'Auto Penalties', 'Total', 'Action'].map((heading) => (
                      <th
                        key={heading}
                        className="text-left text-xs font-semibold text-[var(--text-muted)] px-4 py-3"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredEmployees.map((employee) => {
                    const rows = penalties.filter((penalty) => penalty.employeeId === employee.id);
                    const manualTotal = totals[employee.id] ?? 0;
                    const automatic = findAutomatic(employee);

                    const autoTotal =
                      automatic?.autoPenalty != null
                        ? automatic.autoPenalty
                        : (automatic?.attendancePenalty ?? 0) + (automatic?.breakPenalty ?? 0);

                    const overBreak = automatic?.overBreakPenalty ?? automatic?.breakPenalty ?? 0;
                    const lateness = automatic?.latenessPenalty ?? 0;
                    const completelyLate = automatic?.completelyLatePenalty ?? 0;
                    const absent = automatic?.absentPenalty ?? 0;
                    const attPenalty = automatic?.attendancePenalty ?? 0;
                    const grandTotal = manualTotal + autoTotal;

                    return (
                      <tr key={employee.id} className="hover:bg-[var(--hover-bg)] transition">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-[var(--text-main)]">
                            {employee.firstName} {employee.lastName}
                          </p>
                          <p className="text-xs text-[var(--text-muted)] font-mono">
                            {employee.employeeCode ?? 'No code'}
                          </p>
                        </td>

                        {/* Manual column */}
                        <td className="px-4 py-3 font-semibold text-[var(--text-main)]">
                          {money(manualTotal)}
                        </td>

                        {/* Entries column */}
                        <td className="px-4 py-3 text-[var(--text-muted)]">{rows.length}</td>

                        {/* Auto Penalties column */}
                        <td className="px-4 py-3">
                          {autoTotal > 0 ? (
                            <div>
                              <span className="font-semibold text-amber-600 dark:text-amber-400">
                                {money(autoTotal)}
                              </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {overBreak > 0 && (
                                  <span
                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                                    title="Over break penalty"
                                  >
                                    <Coffee size={10} />
                                    Break: {money(overBreak)}
                                  </span>
                                )}
                                {lateness > 0 && (
                                  <span
                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                                    title="Lateness penalty"
                                  >
                                    <Clock size={10} />
                                    Late: {money(lateness)}
                                  </span>
                                )}
                                {completelyLate > 0 && (
                                  <span
                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300"
                                    title="Completely late penalty"
                                  >
                                    <AlertCircle size={10} />
                                    Compl. Late: {money(completelyLate)}
                                  </span>
                                )}
                                {absent > 0 && (
                                  <span
                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300"
                                    title="Absent penalty"
                                  >
                                    Absent: {money(absent)}
                                  </span>
                                )}
                                {lateness === 0 && completelyLate === 0 && absent === 0 && attPenalty > 0 && (
                                  <span
                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                                    title="Attendance penalty"
                                  >
                                    <Clock size={10} />
                                    Late: {money(attPenalty)}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[var(--text-muted)]">{money(0)}</span>
                          )}
                        </td>

                        {/* Total column */}
                        <td className="px-4 py-3 font-bold text-[var(--text-main)]">
                          <span className={grandTotal > 0 ? 'text-red-600 dark:text-red-400' : 'text-[var(--text-muted)]'}>
                            {money(grandTotal)}
                          </span>
                        </td>

                        {/* Action column */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedEmployeeId(employee.id);
                                setShowAdd(true);
                              }}
                              className="px-2.5 py-1 rounded-lg text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-950/30 text-xs font-bold transition"
                            >
                              Add penalty
                            </button>
                            {autoTotal > 0 && (
                              <button
                                onClick={() => void handleWaiveAutoPenalties(employee, autoTotal)}
                                disabled={waivingEmployeeId === employee.id}
                                className="px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold transition disabled:opacity-50"
                                title="Remove / waive auto penalties for this employee this month"
                              >
                                {waivingEmployeeId === employee.id ? 'Removing...' : 'Remove Auto'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredEmployees.length === 0 && (
            <p className="py-12 text-center text-sm text-[var(--text-muted)]">
              {search ? 'No matching employees found.' : 'No registered employees found.'}
            </p>
          )}
        </div>

        {/* Manual Penalty History Section */}
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <div>
              <h2 className="font-bold text-[var(--text-main)]">Manual Penalty History ({monthLabel})</h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Directly added organization penalties for {monthLabel}
              </p>
            </div>
            <span className="text-xs font-semibold text-[var(--text-muted)] bg-[var(--hover-bg)] px-2.5 py-1 rounded-full">
              {penalties.length} {penalties.length === 1 ? 'penalty' : 'penalties'}
            </span>
          </div>

          {penalties.length === 0 ? (
            <p className="p-5 text-sm text-[var(--text-muted)]">
              No manual penalties recorded for {monthLabel}.
            </p>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {penalties.map((penalty) => (
                <div
                  key={penalty.id}
                  className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-[var(--hover-bg)] transition"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[var(--text-main)]">
                      {penalty.employee.firstName} {penalty.employee.lastName}
                      {penalty.employee.employeeCode && (
                        <span className="ml-2 text-xs font-normal text-[var(--text-muted)] font-mono">
                          ({penalty.employee.employeeCode})
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                      {penalty.reason} · {new Date(penalty.createdAt).toLocaleDateString()}
                      {penalty.createdBy && ` · Added by ${penalty.createdBy.firstName} ${penalty.createdBy.lastName}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-red-600 dark:text-red-400 whitespace-nowrap">
                      {money(penalty.amount)}
                    </span>
                    <button
                      onClick={() => void handleDeleteManualPenalty(penalty)}
                      disabled={deletingId === penalty.id}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition disabled:opacity-50"
                      title="Remove this penalty"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <AddPenaltyModal
          employees={employees}
          selectedEmployeeId={selectedEmployeeId}
          onClose={() => setShowAdd(false)}
          onSaved={async () => {
            setShowAdd(false);
            setSuccessMsg('Penalty added successfully.');
            setTimeout(() => setSuccessMsg(''), 4000);
            await load();
          }}
        />
      )}
    </div>
  );
}

function AddPenaltyModal({
  employees,
  selectedEmployeeId,
  onClose,
  onSaved,
}: {
  employees: Employee[];
  selectedEmployeeId: string;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [employeeId, setEmployeeId] = useState(selectedEmployeeId || employees[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!employeeId || Number(amount) < 1 || !reason.trim()) {
      setError('Choose an employee, enter a positive amount, and provide a reason.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await createManualPenalty({
        employeeId,
        amount: Number(amount),
        reason: reason.trim(),
      });
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add penalty.');
    } finally {
      setSaving(false);
    }
  };

  const input =
    'w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-main)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-[var(--card-bg)] rounded-3xl shadow-2xl overflow-hidden border border-[var(--border)]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
          <h2 className="font-bold text-[var(--text-main)]">Add Employee Penalty</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <label className="block text-xs font-semibold text-[var(--text-muted)]">
            Employee
            <select
              value={employeeId}
              onChange={(event) => setEmployeeId(event.target.value)}
              className={`${input} mt-1`}
            >
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.firstName} {employee.lastName} {employee.employeeCode ? `(${employee.employeeCode})` : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-[var(--text-muted)]">
            Amount (NGN)
            <input
              type="number"
              min="1"
              placeholder="e.g. 5000"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className={`${input} mt-1`}
            />
          </label>
          <label className="block text-xs font-semibold text-[var(--text-muted)]">
            Reason
            <textarea
              placeholder="Explain the reason for this penalty..."
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className={`${input} mt-1 min-h-24`}
            />
          </label>
        </div>
        <div className="px-6 pb-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-semibold hover:bg-[var(--hover-bg)] transition"
          >
            Cancel
          </button>
          <button
            onClick={() => void submit()}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-primary-700 text-white text-sm font-bold hover:bg-primary-800 disabled:opacity-50 transition"
          >
            {saving ? 'Adding...' : 'Add penalty'}
          </button>
        </div>
      </div>
    </div>
  );
}