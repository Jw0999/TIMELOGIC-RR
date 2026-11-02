import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HandCoins,
  Info,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
  Users,
  X,
  Award,
  Calendar,
} from 'lucide-react';
import Header from '../components/Header';
import {
  fetchSalaryAdditions,
  createSalaryAddition,
  deleteSalaryAddition,
  fetchEmployees,
  fetchPayrollOverview,
  type SalaryAdditionPayload,
} from '../services';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  employeeCode?: string | null;
  baseSalary?: number;
  salaryCurrency?: string;
  department?: { id: string; name: string } | null;
}

interface SalaryAddition {
  id: string;
  orgId: string;
  employeeId: string;
  amount: number;
  reason: string;
  type: string;
  createdAt: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode?: string | null;
    baseSalary?: number;
    salaryCurrency?: string;
    email?: string;
    department?: { id: string; name: string } | null;
  };
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
}

const ADDITION_TYPES = [
  { value: 'ALL', label: 'All Types' },
  { value: 'BONUS', label: 'Performance Bonus' },
  { value: 'ALLOWANCE', label: 'Allowance' },
  { value: 'INCREMENT', label: 'Salary Increment' },
  { value: 'COMMISSION', label: 'Commission' },
  { value: 'OTHER', label: 'Other Extra' },
];

export default function SalaryAdditions() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [additions, setAdditions] = useState<SalaryAddition[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState('ALL');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalEmployeeSearch, setModalEmployeeSearch] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [additionType, setAdditionType] = useState<'BONUS' | 'ALLOWANCE' | 'INCREMENT' | 'COMMISSION' | 'OTHER'>('BONUS');
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const formatMoney = useCallback((amt: number, curr = 'NGN') => {
    try {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: curr || 'NGN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amt);
    } catch {
      return `₦${Number(amt).toLocaleString()}`;
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [additionRes, empRes] = await Promise.all([
        fetchSalaryAdditions({ month }),
        fetchEmployees(),
      ]);

      const additionList: SalaryAddition[] = Array.isArray(additionRes)
        ? additionRes
        : Array.isArray(additionRes?.data)
        ? additionRes.data
        : [];

      const empList: Employee[] = Array.isArray(empRes)
        ? empRes
        : Array.isArray(empRes?.data)
        ? empRes.data
        : [];

      setAdditions(additionList);
      setEmployees(empList);
    } catch (err: any) {
      setError(err?.message || 'Failed to load salary additions.');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Statistics
  const stats = useMemo(() => {
    const totalAmount = additions.reduce((acc, a) => acc + Number(a.amount || 0), 0);
    const uniqueEmployees = new Set(additions.map((a) => a.employeeId)).size;
    const avgAmount = additions.length > 0 ? Math.round(totalAmount / additions.length) : 0;
    return {
      totalAmount,
      uniqueEmployees,
      avgAmount,
      totalCount: additions.length,
    };
  }, [additions]);

  // Filtered Additions
  const filteredAdditions = useMemo(() => {
    return additions.filter((item) => {
      if (activeType !== 'ALL' && item.type !== activeType) {
        return false;
      }
      if (!search.trim()) return true;
      const s = search.toLowerCase();
      const empName = `${item.employee?.firstName || ''} ${item.employee?.lastName || ''}`.toLowerCase();
      const code = (item.employee?.employeeCode || '').toLowerCase();
      const res = (item.reason || '').toLowerCase();
      return empName.includes(s) || code.includes(s) || res.includes(s);
    });
  }, [additions, activeType, search]);

  // Modal filtered employees
  const modalEmployees = useMemo(() => {
    if (!modalEmployeeSearch.trim()) return employees;
    const q = modalEmployeeSearch.toLowerCase();
    return employees.filter((e) => {
      const name = `${e.firstName} ${e.lastName}`.toLowerCase();
      const code = (e.employeeCode || '').toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  }, [employees, modalEmployeeSearch]);

  const selectedEmployee = useMemo(() => {
    return employees.find((e) => e.id === selectedEmployeeId);
  }, [employees, selectedEmployeeId]);

  const handleOpenAddModal = (preselectedEmpId?: string) => {
    setSelectedEmployeeId(preselectedEmpId || (employees[0]?.id || ''));
    setAmount('');
    setReason('');
    setAdditionType('BONUS');
    setEffectiveDate(new Date().toISOString().slice(0, 10));
    setModalEmployeeSearch('');
    setError('');
    setShowAddModal(true);
  };

  const handleSaveAddition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      setError('Please select an employee.');
      return;
    }
    const numAmt = parseFloat(amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      setError('Please enter a valid amount greater than zero.');
      return;
    }
    if (!reason.trim()) {
      setError('Please provide a mandatory reason for adding this salary.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const payload: SalaryAdditionPayload = {
        employeeId: selectedEmployeeId,
        amount: numAmt,
        reason: reason.trim(),
        type: additionType,
        effectiveDate,
      };

      await createSalaryAddition(payload);
      setSuccessMsg(`Successfully added ${formatMoney(numAmt)} to ${selectedEmployee?.firstName} ${selectedEmployee?.lastName}'s salary!`);
      setShowAddModal(false);
      void loadData();
      setTimeout(() => setSuccessMsg(''), 4500);
    } catch (err: any) {
      setError(err?.message || 'Failed to add salary.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAddition = async (id: string, empName: string, amt: number) => {
    if (!window.confirm(`Are you sure you want to remove this ${formatMoney(amt)} addition for ${empName}? This will immediately update the payroll calculations.`)) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteSalaryAddition(id);
      setSuccessMsg(`Addition removed and monthly payroll recalculated.`);
      void loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to remove salary addition.');
    } finally {
      setDeletingId(null);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'BONUS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Sparkles size={11} /> Performance Bonus
          </span>
        );
      case 'ALLOWANCE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <HandCoins size={11} /> Allowance
          </span>
        );
      case 'INCREMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <TrendingUp size={11} /> Base Increment
          </span>
        );
      case 'COMMISSION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Award size={11} /> Commission
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Banknote size={11} /> {type || 'Addition'}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--page-bg)]">
      <Header
        title="Salary Additions & Bonuses"
        subtitle="Award bonuses, allowances, and salary increments with automatic payroll synchronization"
      />

      <div className="flex-1 overflow-y-auto">
        <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Top Control & Month Picker */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-main)] flex items-center gap-2">
              <HandCoins className="text-emerald-600 dark:text-emerald-400" size={26} />
              Salary Additions & Bonuses
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Add money to employee salaries, award discretionary bonuses, and record formal reasons that automatically synchronize across payroll and official payslips.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Month Navigator */}
            <div className="flex items-center rounded-xl border border-[var(--border)] bg-[var(--card-bg)] shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => stepMonth(-1)}
                className="p-2 hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-1.5 text-xs font-bold text-[var(--text-main)] whitespace-nowrap min-w-[120px] text-center">
                {monthLabel}
              </span>
              <button
                type="button"
                onClick={() => stepMonth(1)}
                className="p-2 hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
                title="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading}
              className="p-2 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)] shadow-sm transition disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin text-emerald-600' : ''} />
            </button>

            {/* Prominent Add Button */}
            <button
              type="button"
              onClick={() => handleOpenAddModal()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md hover:shadow-lg transition active:scale-95"
            >
              <Plus size={16} />
              <span>Add to Salary</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 text-xs">
            <AlertCircle size={18} className="flex-shrink-0" />
            <span className="flex-1 font-medium">{error}</span>
            <button type="button" onClick={() => setError('')} className="text-red-600 hover:text-red-800">
              <X size={15} />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs">
            <CheckCircle2 size={18} className="flex-shrink-0" />
            <span className="flex-1 font-medium">{successMsg}</span>
            <button type="button" onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-800">
              <X size={15} />
            </button>
          </div>
        )}

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[var(--card-bg)] p-4 rounded-2xl border border-[var(--border)] shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-muted)]">Total Money Added</span>
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
                <HandCoins size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
              +{formatMoney(stats.totalAmount)}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Across all additions for {monthLabel}</p>
          </div>

          <div className="bg-[var(--card-bg)] p-4 rounded-2xl border border-[var(--border)] shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-muted)]">Staff Awarded</span>
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600">
                <Users size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-[var(--text-main)] mt-2">
              {stats.uniqueEmployees} Employee{stats.uniqueEmployees !== 1 ? 's' : ''}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Received salary bump this month</p>
          </div>

          <div className="bg-[var(--card-bg)] p-4 rounded-2xl border border-[var(--border)] shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-muted)]">Average Addition</span>
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600">
                <TrendingUp size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-[var(--text-main)] mt-2">
              {stats.avgAmount > 0 ? formatMoney(stats.avgAmount) : '—'}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Average award per addition entry</p>
          </div>

          <div className="bg-[var(--card-bg)] p-4 rounded-2xl border border-[var(--border)] shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-muted)]">Total Entries</span>
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600">
                <Award size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-[var(--text-main)] mt-2">
              {stats.totalCount} Award{stats.totalCount !== 1 ? 's' : ''}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Logged addition records</p>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[var(--card-bg)] p-4 rounded-2xl border border-[var(--border)] shadow-sm">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {ADDITION_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setActiveType(t.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  activeType === t.value
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-main)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[260px]">
            <Search className="absolute left-3 top-2.5 text-[var(--text-muted)]" size={15} />
            <input
              type="text"
              placeholder="Search by name, code, or reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>
        </div>

        {/* Additions Table Card */}
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[var(--text-main)]">Awarded Salary Additions</h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {filteredAdditions.length} record{filteredAdditions.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="text-xs text-[var(--text-muted)]">
              Period: <span className="font-semibold text-[var(--text-main)]">{monthLabel}</span>
            </div>
          </div>

          {filteredAdditions.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 mx-auto flex items-center justify-center">
                <HandCoins size={28} />
              </div>
              <h3 className="text-base font-bold text-[var(--text-main)]">No Salary Additions for this Period</h3>
              <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
                No extra money, bonuses, or allowances have been awarded for {monthLabel}. Click below to add extra money to any employee&apos;s salary with a required reason.
              </p>
              <button
                type="button"
                onClick={() => handleOpenAddModal()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition mt-2"
              >
                <Plus size={15} />
                <span>Add First Salary Addition</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--hover-bg)] text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[11px]">
                    <th className="px-5 py-3">Employee</th>
                    <th className="px-4 py-3">Base Salary</th>
                    <th className="px-4 py-3">Addition Type</th>
                    <th className="px-4 py-3">Amount Added</th>
                    <th className="px-5 py-3">Mandatory Reason</th>
                    <th className="px-4 py-3">Awarded On</th>
                    <th className="px-4 py-3">Awarded By</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredAdditions.map((item) => {
                    const empName = `${item.employee?.firstName || ''} ${item.employee?.lastName || ''}`.trim() || 'Employee';
                    const initials = `${item.employee?.firstName?.[0] || ''}${item.employee?.lastName?.[0] || ''}`.toUpperCase() || 'E';
                    const adminName = item.createdBy ? `${item.createdBy.firstName} ${item.createdBy.lastName}` : 'Administrator';
                    const dateFormatted = new Date(item.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });

                    return (
                      <tr key={item.id} className="hover:bg-[var(--hover-bg)] transition group">
                        {/* Employee Details */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-xs flex-shrink-0 border border-emerald-200 dark:border-emerald-800">
                              {initials}
                            </div>
                            <div>
                              <p className="font-bold text-[var(--text-main)] text-xs">{empName}</p>
                              <p className="text-[10px] text-[var(--text-muted)]">
                                {item.employee?.employeeCode ? `${item.employee.employeeCode} · ` : ''}
                                {item.employee?.department?.name || 'General Staff'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Base Salary */}
                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-[var(--text-main)]">
                            {item.employee?.baseSalary != null ? formatMoney(item.employee.baseSalary, item.employee?.salaryCurrency) : '—'}
                          </span>
                          <span className="block text-[10px] text-[var(--text-muted)]">Regular base</span>
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3.5">
                          {getTypeBadge(item.type)}
                        </td>

                        {/* Added Amount */}
                        <td className="px-4 py-3.5">
                          <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                            +{formatMoney(item.amount, item.employee?.salaryCurrency)}
                          </span>
                        </td>

                        {/* Reason */}
                        <td className="px-5 py-3.5 max-w-xs">
                          <div className="p-2 rounded-xl bg-[var(--page-bg)] border border-[var(--border)] text-[var(--text-main)] font-medium leading-relaxed">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold mr-1">&ldquo;</span>
                            {item.reason}
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-1">&rdquo;</span>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3.5 text-[var(--text-muted)] whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-medium text-[var(--text-main)]">
                            <Calendar size={13} className="text-[var(--text-muted)]" />
                            {dateFormatted}
                          </div>
                        </td>

                        {/* Added By */}
                        <td className="px-4 py-3.5 text-[var(--text-muted)] whitespace-nowrap">
                          <span className="font-medium text-[var(--text-main)]">{adminName}</span>
                        </td>

                        {/* Delete Action */}
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleDeleteAddition(item.id, empName, item.amount)}
                            disabled={deletingId === item.id}
                            className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/60 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition disabled:opacity-50"
                            title="Delete salary addition"
                          >
                            <Trash2 size={14} className={deletingId === item.id ? 'animate-spin' : ''} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          "+ Add to Salary" Modal Dialog
          ───────────────────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--page-bg)]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600">
                  <HandCoins size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-main)]">Add Money to Employee Salary</h3>
                  <p className="text-xs text-[var(--text-muted)]">Award bonuses, allowances, or permanent base increments.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-main)] transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveAddition} className="p-6 space-y-4 overflow-y-auto flex-1">
              {error && (
                <div className="p-3 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Employee Selector */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-main)] mb-1.5">
                  Select Employee <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-[var(--text-muted)]" size={14} />
                    <input
                      type="text"
                      placeholder="Type to filter employees..."
                      value={modalEmployeeSearch}
                      onChange={(e) => setModalEmployeeSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[var(--border)] bg-[var(--page-bg)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {modalEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} {emp.employeeCode ? `(${emp.employeeCode})` : ''} — Current Base: {formatMoney(emp.baseSalary || 0, emp.salaryCurrency)}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedEmployee && (
                  <div className="mt-2.5 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/60 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-emerald-900 dark:text-emerald-200">
                        {selectedEmployee.firstName} {selectedEmployee.lastName}
                      </p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                        Code: {selectedEmployee.employeeCode || 'N/A'} · Dept: {selectedEmployee.department?.name || 'General'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block font-semibold">Current Base</span>
                      <span className="font-bold text-emerald-900 dark:text-emerald-200">
                        {formatMoney(selectedEmployee.baseSalary || 0, selectedEmployee.salaryCurrency)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Amount and Addition Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-main)] mb-1.5">
                    Amount to Add (₦) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-emerald-600 font-bold text-sm">₦</span>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      placeholder="e.g. 50000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      className="w-full pl-8 pr-3 py-2 text-xs font-bold rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-main)] mb-1.5">
                    Addition Type
                  </label>
                  <select
                    value={additionType}
                    onChange={(e) => setAdditionType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="BONUS">Performance Bonus</option>
                    <option value="ALLOWANCE">Monthly Allowance</option>
                    <option value="INCREMENT">Base Salary Increment</option>
                    <option value="COMMISSION">Commission / Incentive</option>
                    <option value="OTHER">Other Discretionary</option>
                  </select>
                </div>
              </div>

              {/* Mandatory Reason */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-main)] mb-1.5 flex items-center justify-between">
                  <span>Mandatory Reason for Adding Salary <span className="text-red-500">*</span></span>
                  <span className="text-[10px] text-[var(--text-muted)] font-normal">Itemized on official PDF payslip</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="State the official business reason (e.g. Outstanding performance during product launch, Overtime milestone bonus, Cost of living allowance)..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed resize-none"
                />
              </div>

              {/* Effective Date */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-main)] mb-1.5">
                  Effective Date
                </label>
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Payroll Calculation Note */}
              <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/30 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                  Automatic Payroll & Payslip Integration
                </span>
                <p className="text-[11px] leading-relaxed text-emerald-700 dark:text-emerald-300/90">
                  This addition will be added to the employee&apos;s gross earnings for this payroll cycle. All penalties (lateness, break overstays, and disciplinary deductions) will be accurately subtracted from total earnings, and this reason will be officially itemized on their payslip.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-[var(--border)] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-main)] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md transition disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Saving & Recalculating...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={15} />
                      <span>Add Money & Update Payroll</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
