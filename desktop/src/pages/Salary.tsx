import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Banknote,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Filter,
  Info,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldAlert,
  Sparkles,
  Users,
  Wallet,
  X,
  AlertTriangle,
  Building,
  CreditCard,
} from 'lucide-react';
import Header from '../components/Header';
import {
  fetchPayrollOverview,
  setEmployeeSalary,
  fetchPayrollSettings,
  updatePayrollSettings,
  calculatePayroll,
  sendPayslipEmail,
  completePayout,
  downloadPayslipPdf,
} from '../services';

interface EmployeePayroll {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  cleanPhone?: string | null;
  employeeCode: string;
  status: string;
  departmentName: string;
  officeName: string;
  baseSalary: number;
  currency: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  totalWorkHours: number;
  totalPresentDays: number;
  totalLateDays: number;
  attendancePenalties: number;
  breakPenalties: number;
  manualPenalties: number;
  totalDeductions: number;
  netSalary: number;
  payslipId: string | null;
  payslipStatus: string;
  whatsappStatus: string;
  whatsappSentAt?: string | null;
}

interface PayrollSummary {
  totalEmployees: number;
  totalBasePayroll: number;
  totalDeductions: number;
  totalNetPayout: number;
  salaryPayoutDay: number;
  currency: string;
  periodStart?: string;
  periodEnd?: string;
  periodLabel?: string;
  cycleStatus?: 'ACTIVE' | 'COMPLETED' | 'UPCOMING';
}

interface PayrollSettingsData {
  salaryPayoutDay: number;
  salaryAutomationEnabled: boolean;
  salaryCurrency: string;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUser?: string | null;
  smtpPass?: string | null;
  smtpFrom?: string | null;
  smtpSecure?: boolean;
  hasSmtpCredentials?: boolean;
}

export default function Salary() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [hasUserNavigated, setHasUserNavigated] = useState<boolean>(false);

  const [employees, setEmployees] = useState<EmployeePayroll[]>([]);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [batchSending, setBatchSending] = useState<boolean>(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SET' | 'UNSET'>('ALL');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Modals
  const [salaryModalEmployee, setSalaryModalEmployee] = useState<EmployeePayroll | null>(null);
  const [salaryInput, setSalaryInput] = useState<string>('');
  const [bankNameInput, setBankNameInput] = useState<string>('');
  const [accountNumberInput, setAccountNumberInput] = useState<string>('');
  const [accountNameInput, setAccountNameInput] = useState<string>('');
  const [currencyInput, setCurrencyInput] = useState<string>('NGN');
  const [savingSalary, setSavingSalary] = useState<boolean>(false);

  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
  const [settingsData, setSettingsData] = useState<PayrollSettingsData>({
    salaryPayoutDay: 28,
    salaryAutomationEnabled: true,
    salaryCurrency: 'NGN',
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    smtpFrom: '',
    smtpSecure: false,
    hasSmtpCredentials: false,
  });
  const [savingSettings, setSavingSettings] = useState<boolean>(false);

  const [breakdownModalEmployee, setBreakdownModalEmployee] = useState<EmployeePayroll | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthLabel = `${monthNames[selectedMonth - 1]} ${selectedYear}`;

  const formatMoney = useCallback((amount: number, curr = 'NGN') => {
    const symbol = curr === 'NGN' ? '₦' : curr === 'USD' ? '$' : curr === 'GBP' ? '£' : `${curr} `;
    return `${symbol}${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, []);

  const getActiveCycle = useCallback((payoutDay: number) => {
    const now = new Date();
    let y = now.getFullYear();
    let m = now.getMonth() + 1;
    if (now.getDate() > payoutDay) {
      if (m === 12) {
        y += 1;
        m = 1;
      } else {
        m += 1;
      }
    }
    return { year: y, month: m };
  }, []);

  const loadPayroll = useCallback(async (overrideYear?: number, overrideMonth?: number) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const y = overrideYear ?? selectedYear;
      const m = overrideMonth ?? selectedMonth;
      const res = await fetchPayrollOverview(y, m);
      if (res) {
        setEmployees(res.employees || []);
        setSummary(res.summary || null);
        if (res.year && res.month && !hasUserNavigated && (res.year !== selectedYear || res.month !== selectedMonth)) {
          setSelectedYear(res.year);
          setSelectedMonth(res.month);
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not load payroll overview.');
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth, hasUserNavigated]);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetchPayrollSettings();
      if (res) {
        const payoutDay = res.salaryPayoutDay ?? 28;
        setSettingsData({
          salaryPayoutDay: payoutDay,
          salaryAutomationEnabled: res.salaryAutomationEnabled ?? true,
          salaryCurrency: res.salaryCurrency || 'NGN',
          smtpHost: res.smtpHost || '',
          smtpPort: res.smtpPort ?? 587,
          smtpUser: res.smtpUser || '',
          smtpPass: res.smtpPass || '',
          smtpFrom: res.smtpFrom || '',
          smtpSecure: res.smtpSecure ?? false,
          hasSmtpCredentials: res.hasSmtpCredentials ?? false,
        });

        if (!hasUserNavigated) {
          const active = getActiveCycle(payoutDay);
          if (active.year !== selectedYear || active.month !== selectedMonth) {
            setSelectedYear(active.year);
            setSelectedMonth(active.month);
          }
        }
      }
    } catch (err: any) {
      console.warn('Failed to load payroll settings:', err);
    }
  }, [hasUserNavigated, getActiveCycle, selectedYear, selectedMonth]);

  useEffect(() => {
    loadPayroll();
    loadSettings();
  }, [loadPayroll, loadSettings]);

  const handlePrevMonth = () => {
    setHasUserNavigated(true);
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    setHasUserNavigated(true);
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const handleCalculatePayroll = async () => {
    setCalculating(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await calculatePayroll({ year: selectedYear, month: selectedMonth });
      setSuccessMsg(`Payroll finalized and deductions updated for ${monthLabel}.`);
      await loadPayroll();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to calculate payroll');
    } finally {
      setCalculating(false);
    }
  };

  const openSalaryModal = (emp: EmployeePayroll) => {
    setSalaryModalEmployee(emp);
    setSalaryInput(emp.baseSalary ? String(emp.baseSalary) : '');
    setBankNameInput(emp.bankName || '');
    setAccountNumberInput(emp.accountNumber || '');
    setAccountNameInput(emp.accountName || '');
    setCurrencyInput(emp.currency || summary?.currency || 'NGN');
  };

  const handleSaveSalary = async () => {
    if (!salaryModalEmployee) return;
    const val = parseFloat(salaryInput);
    if (isNaN(val) || val < 0) {
      alert('Please enter a valid salary amount.');
      return;
    }

    setSavingSalary(true);
    try {
      await setEmployeeSalary(salaryModalEmployee.id, {
        baseSalary: val,
        salaryCurrency: currencyInput,
        bankName: bankNameInput.trim() || undefined,
        accountNumber: accountNumberInput.trim() || undefined,
        accountName: accountNameInput.trim() || undefined,
      });

      await calculatePayroll({ year: selectedYear, month: selectedMonth });
      await loadPayroll();

      setSuccessMsg(`Base salary for ${salaryModalEmployee.name} updated to ${formatMoney(val, currencyInput)}.`);
      setSalaryModalEmployee(null);
    } catch (err: any) {
      alert(err?.message || 'Failed to update employee salary');
    } finally {
      setSavingSalary(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await updatePayrollSettings(settingsData);
      setSuccessMsg('Automated payday schedule and email payout settings saved.');
      setSettingsModalOpen(false);
      // Recalculate current month with new payday cutoff
      await calculatePayroll({ year: selectedYear, month: selectedMonth });
      await loadPayroll();
      await loadSettings();
    } catch (err: any) {
      alert(err?.message || 'Failed to update settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDownloadPdf = async (emp: EmployeePayroll) => {
    setDownloadingId(emp.id);
    try {
      // Ensure current month payroll is synchronized with live attendance & deductions
      let payslipId = emp.payslipId;
      try {
        await calculatePayroll({ year: selectedYear, month: selectedMonth });
        const res = await fetchPayrollOverview(selectedYear, selectedMonth);
        if (res?.employees) {
          setEmployees(res.employees);
          if (res.summary) setSummary(res.summary);
          const updated = res.employees.find((e: any) => e.id === emp.id);
          if (updated?.payslipId) payslipId = updated.payslipId;
        }
      } catch (calcErr) {
        console.warn('Live calculation before download:', calcErr);
      }

      if (!payslipId) {
        throw new Error('Unable to find or generate payslip record.');
      }

      const fileName = `Payslip-${emp.employeeCode || emp.firstName}-${monthNames[selectedMonth - 1]}-${selectedYear}.pdf`;
      await downloadPayslipPdf(payslipId, fileName);
    } catch (err: any) {
      alert(err?.message || 'Failed to download PDF payslip');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSendEmail = async (emp: EmployeePayroll) => {
    if (!emp.email || !emp.email.includes('@')) {
      alert(`Cannot send email: ${emp.name} does not have a valid registered email address.`);
      return;
    }

    setSendingId(emp.id);
    try {
      // Ensure current month payroll is synchronized with live attendance & deductions
      let payslipId = emp.payslipId;
      try {
        await calculatePayroll({ year: selectedYear, month: selectedMonth });
        const res = await fetchPayrollOverview(selectedYear, selectedMonth);
        if (res?.employees) {
          setEmployees(res.employees);
          if (res.summary) setSummary(res.summary);
          const updated = res.employees.find((e: any) => e.id === emp.id);
          if (updated?.payslipId) payslipId = updated.payslipId;
        }
      } catch (calcErr) {
        console.warn('Live calculation before email dispatch:', calcErr);
      }

      if (!payslipId) {
        throw new Error('Unable to find or generate payslip record.');
      }

      const res = await sendPayslipEmail(payslipId);
      if (res?.success) {
        setSuccessMsg(`Official payslip PDF emailed successfully to ${emp.name} (${emp.email}).`);
      } else {
        alert(res?.error || 'Failed to dispatch email.');
      }
      await loadPayroll();
    } catch (err: any) {
      alert(err?.message || 'Failed to dispatch email payslip');
    } finally {
      setSendingId(null);
    }
  };

  const handleCompletePayout = async () => {
    if (!window.confirm(`Are you sure you want to complete payout and dispatch official payslips via email to all employees for ${monthLabel}?`)) {
      return;
    }

    setBatchSending(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await calculatePayroll({ year: selectedYear, month: selectedMonth });
      const res = await completePayout({ year: selectedYear, month: selectedMonth });
      setSuccessMsg(`Complete Payout finalized! ${res.sent || 0} payslip(s) emailed to employees, ${res.skipped || 0} skipped.`);
      await loadPayroll();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to complete payout dispatch');
    } finally {
      setBatchSending(false);
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (emp.status === 'SUSPENDED' || emp.status === 'TERMINATED') return false;

      const q = search.toLowerCase();
      const matchesSearch =
        emp.name.toLowerCase().includes(q) ||
        emp.employeeCode.toLowerCase().includes(q) ||
        (emp.phone && emp.phone.includes(q)) ||
        emp.departmentName.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (statusFilter === 'SET') return emp.baseSalary > 0;
      if (statusFilter === 'UNSET') return emp.baseSalary === 0;
      return true;
    });
  }, [employees, search, statusFilter]);

  const currency = summary?.currency || 'NGN';
  const inputCls = 'w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-main)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-[var(--text-muted)]';
  const labelCls = 'block text-xs font-semibold text-[var(--text-muted)] mb-1.5';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* TimeLogic Standard App Header */}
      <Header
        title="Salary & Payroll"
        subtitle={`Automated monthly compensation, deductions & payslip dispatch · ${summary?.periodLabel ? `Pay Period: ${summary.periodLabel} (${monthLabel})` : monthLabel}`}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSettingsModalOpen(true)}
              className="flex items-center gap-1.5 bg-[var(--card-bg)] border border-[var(--border)] text-[var(--text-main)] hover:bg-[var(--hover-bg)] text-xs font-semibold px-3 py-2 rounded-xl transition shadow-sm"
            >
              <Settings size={14} className="text-primary-600 dark:text-primary-400" />
              <span>Payday Settings</span>
            </button>

            <button
              onClick={handleCalculatePayroll}
              disabled={calculating}
              className="flex items-center gap-1.5 bg-primary-700 hover:bg-primary-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-sm disabled:opacity-60"
            >
              <Sparkles size={14} className={calculating ? 'animate-spin text-amber-300' : 'text-amber-300'} />
              <span>{calculating ? 'Calculating...' : 'Recalculate'}</span>
            </button>

            <button
              onClick={handleCompletePayout}
              disabled={batchSending}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-sm disabled:opacity-60"
              title="Finalize payroll and complete payout by emailing official payslip PDFs to all employees"
            >
              <CheckCircle2 size={14} className={batchSending ? 'animate-spin' : ''} />
              <span>{batchSending ? 'Dispatching...' : 'Complete Payout'}</span>
            </button>
          </div>
        }
      />

      {/* Main Scrollable Viewport (Inherits entire height and scrolls cleanly) */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Alerts / Banners */}
        {errorMsg && (
          <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg('')}><X size={15} /></button>
          </div>
        )}
        {successMsg && (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')}><X size={15} /></button>
          </div>
        )}

        {/* Month Selector Bar & Quick Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[var(--card-bg)] p-3 rounded-2xl border border-[var(--border)] shadow-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-[var(--hover-bg)] rounded-xl p-1 border border-[var(--border)]">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-[var(--card-bg)] text-[var(--text-main)] rounded-lg transition"
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="px-3 flex items-center gap-2 font-bold text-xs text-[var(--text-main)] min-w-[130px] justify-center">
                <Calendar size={13} className="text-primary-600" />
                <span>{monthLabel}</span>
              </div>
              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-[var(--card-bg)] text-[var(--text-main)] rounded-lg transition"
                title="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <button
              onClick={() => loadPayroll()}
              disabled={loading}
              className="p-2 border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--hover-bg)] rounded-xl transition"
              title="Refresh Payroll"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin text-primary-600' : ''} />
            </button>

            {summary?.periodLabel && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800/60 text-xs font-semibold text-primary-700 dark:text-primary-300">
                <Clock size={13} className="text-primary-600 dark:text-primary-400" />
                <span>Cycle: {summary.periodLabel}</span>
              </div>
            )}

            {summary?.cycleStatus === 'ACTIVE' ? (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Cycle (Cutoff on {settingsData.salaryPayoutDay || 28}th)
              </span>
            ) : summary?.cycleStatus === 'COMPLETED' ? (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                <CheckCircle2 size={11} className="text-slate-500" />
                Completed Cycle
              </span>
            ) : null}

            {summary?.cycleStatus !== 'ACTIVE' && (
              <button
                onClick={() => {
                  const active = getActiveCycle(settingsData.salaryPayoutDay || 28);
                  setSelectedYear(active.year);
                  setSelectedMonth(active.month);
                  setHasUserNavigated(true);
                }}
                className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 ml-1"
              >
                Go to Active Cycle →
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1 font-semibold text-[var(--text-main)]">
              <Calendar size={13} className="text-amber-500" /> Payday:
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-[var(--hover-bg)] border border-[var(--border)] font-bold text-[var(--text-main)]">
              Every {settingsData.salaryPayoutDay || 28}th
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              settingsData.salaryAutomationEnabled
                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
            }`}>
              {settingsData.salaryAutomationEnabled ? 'Auto-Active' : 'Manual'}
            </span>
          </div>
        </div>

        {/* 4 Summary Cards (Exact TimeLogic standard aesthetic) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[var(--card-bg)] p-4 rounded-2xl border border-[var(--border)] shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-muted)]">Base Payroll</span>
              <Banknote size={16} className="text-primary-600" />
            </div>
            <p className="text-xl font-bold text-[var(--text-main)] mt-2">
              {formatMoney(summary?.totalBasePayroll || 0, currency)}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1 flex items-center gap-1">
              <Users size={11} /> {employees.length} employees on file
            </p>
          </div>

          <div className="bg-[var(--card-bg)] p-4 rounded-2xl border border-[var(--border)] shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-muted)]">Total Deductions</span>
              <ShieldAlert size={16} className="text-red-500" />
            </div>
            <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-2">
              -{formatMoney(summary?.totalDeductions || 0, currency)}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1 truncate" title={summary?.periodLabel ? `Cutoff: ${summary.periodLabel}` : 'Lateness + Disciplinary'}>
              {summary?.periodLabel ? `Cutoff: ${summary.periodLabel}` : 'Lateness + Disciplinary'}
            </p>
          </div>

          <div className="bg-[var(--card-bg)] p-4 rounded-2xl border border-[var(--border)] shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-muted)]">Net Payout</span>
              <Wallet size={16} className="text-emerald-600" />
            </div>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
              {formatMoney(summary?.totalNetPayout || 0, currency)}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Base minus Deductions</p>
          </div>

          <div className="bg-[var(--card-bg)] p-4 rounded-2xl border border-[var(--border)] shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-muted)]">Salary Status</span>
              <CheckCircle2 size={16} className="text-blue-500" />
            </div>
            <p className="text-xl font-bold text-[var(--text-main)] mt-2">
              {employees.filter((e) => e.baseSalary > 0).length} / {employees.length}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Staff with base salary set</p>
          </div>
        </div>

        {/* Main Employee Payroll Table Card */}
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden transition-colors">
          {/* Controls Bar */}
          <div className="px-5 py-4 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-bold text-[var(--text-main)]">Employee Compensation & Deductions</h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Manage base salary rates, view attendance lateness & HR deductions, generate payslips, and complete payout via email.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Search */}
              <div className="relative w-full sm:w-60">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search staff, ID, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-main)] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Status Filters */}
              <div className="flex bg-[var(--hover-bg)] p-0.5 rounded-xl border border-[var(--border)]">
                {(['ALL', 'SET', 'UNSET'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setStatusFilter(mode)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition ${
                      statusFilter === mode
                        ? 'bg-primary-700 text-white'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    {mode === 'ALL' ? 'All' : mode === 'SET' ? 'Salary Set' : 'Not Set'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table Container */}
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <RefreshCw size={24} className="animate-spin text-primary-600" />
              <span className="text-xs text-[var(--text-muted)] font-medium">Loading payroll records...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[960px]">
                <thead>
                  <tr className="bg-[var(--hover-bg)] border-b border-[var(--border)]">
                    <th className="text-left text-xs font-semibold text-[var(--text-muted)] px-4 py-3">Employee</th>
                    <th className="text-left text-xs font-semibold text-[var(--text-muted)] px-4 py-3">Dept / Bank</th>
                    <th className="text-left text-xs font-semibold text-[var(--text-muted)] px-4 py-3">Base Salary</th>
                    <th className="text-center text-xs font-semibold text-[var(--text-muted)] px-4 py-3">Attendance</th>
                    <th className="text-left text-xs font-semibold text-[var(--text-muted)] px-4 py-3">Deductions</th>
                    <th className="text-left text-xs font-semibold text-[var(--text-muted)] px-4 py-3">Net Payable</th>
                    <th className="text-center text-xs font-semibold text-[var(--text-muted)] px-4 py-3">Email Delivery</th>
                    <th className="sticky right-0 bg-[var(--hover-bg)] text-right text-xs font-semibold text-[var(--text-muted)] px-4 py-3 shadow-[-4px_0_6px_rgba(0,0,0,0.06)] z-10">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[var(--text-muted)] text-xs">
                        No employees found matching the search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const hasSalary = emp.baseSalary > 0;
                      return (
                        <tr key={emp.id} className="hover:bg-[var(--hover-bg)] transition-colors">
                          {/* Employee Name & Code */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-bold flex items-center justify-center text-xs flex-shrink-0 border border-primary-200 dark:border-primary-800">
                                {emp.firstName?.[0]}{emp.lastName?.[0]}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-[var(--text-main)] truncate">
                                  {emp.name}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                                  <span className="font-mono text-primary-600 dark:text-primary-400">{emp.employeeCode}</span>
                                  {emp.phone && (
                                    <>
                                      <span>•</span>
                                      <span>{emp.phone}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Dept / Bank */}
                          <td className="px-4 py-3">
                            <p className="text-xs font-medium text-[var(--text-main)]">
                              {emp.departmentName || 'General'}
                            </p>
                            {emp.bankName ? (
                              <p className="text-[11px] text-[var(--text-muted)] truncate max-w-[130px]">
                                {emp.bankName} ({emp.accountNumber?.slice(-4) || '••••'})
                              </p>
                            ) : (
                              <p className="text-[11px] text-[var(--text-muted)] italic">No bank set</p>
                            )}
                          </td>

                          {/* Base Salary */}
                          <td className="px-4 py-3">
                            {hasSalary ? (
                              <div>
                                <span className="font-bold text-[var(--text-main)]">
                                  {formatMoney(emp.baseSalary, emp.currency)}
                                </span>
                                <span className="block text-[10px] text-[var(--text-muted)]">Monthly rate</span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded text-[11px] font-semibold border border-amber-200 dark:border-amber-800">
                                <AlertTriangle size={11} /> Unset
                              </span>
                            )}
                          </td>

                          {/* Attendance */}
                          <td className="px-4 py-3 text-center">
                            <span className="font-semibold text-[var(--text-main)]">
                              {emp.totalPresentDays}d
                            </span>
                            <span className="text-xs text-[var(--text-muted)] ml-1">
                              ({emp.totalWorkHours}h)
                            </span>
                            {emp.totalLateDays > 0 && (
                              <span className="block text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                {emp.totalLateDays} late
                              </span>
                            )}
                          </td>

                          {/* Deductions */}
                          <td className="px-4 py-3">
                            {emp.totalDeductions > 0 ? (
                              <button
                                onClick={() => setBreakdownModalEmployee(emp)}
                                className="text-left group cursor-pointer"
                                title="Click to view breakdown"
                              >
                                <span className="font-bold text-red-600 dark:text-red-400 group-hover:underline flex items-center gap-1">
                                  -{formatMoney(emp.totalDeductions, emp.currency)}
                                  <Info size={11} className="opacity-70" />
                                </span>
                                <span className="block text-[10px] text-[var(--text-muted)]">
                                  Late: {formatMoney(emp.attendancePenalties, emp.currency)}
                                  {emp.breakPenalties > 0 && ` + Break: ${formatMoney(emp.breakPenalties, emp.currency)}`}
                                  {emp.manualPenalties > 0 && ` + HR: ${formatMoney(emp.manualPenalties, emp.currency)}`}
                                </span>
                              </button>
                            ) : (
                              <span className="text-[var(--text-muted)] text-xs">₦0.00</span>
                            )}
                          </td>

                          {/* Net Payable */}
                          <td className="px-4 py-3">
                            <span className={`font-bold text-sm ${emp.netSalary > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-muted)]'}`}>
                              {formatMoney(emp.netSalary, emp.currency)}
                            </span>
                            <span className="block text-[10px] text-[var(--text-muted)]">
                              {emp.payslipStatus === 'GENERATED' ? 'Snapshot Ready' : 'Live Estimate'}
                            </span>
                          </td>

                          {/* Email Delivery Status */}
                          <td className="px-4 py-3 text-center">
                            {emp.whatsappStatus === 'SENT' ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                                <CheckCircle2 size={11} /> Emailed
                              </span>
                            ) : emp.whatsappStatus === 'FAILED' ? (
                              <span className="inline-flex items-center gap-1 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                                <ShieldAlert size={11} /> Failed
                              </span>
                            ) : emp.whatsappStatus === 'SKIPPED' || !emp.email ? (
                              <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                                <AlertTriangle size={11} /> No Email
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[var(--text-muted)] bg-[var(--hover-bg)] px-2 py-0.5 rounded-full text-[10px]">
                                Ready
                              </span>
                            )}
                          </td>

                          {/* Sticky Actions Column */}
                          <td className="sticky right-0 bg-[var(--card-bg)] px-4 py-3 text-right shadow-[-4px_0_6px_rgba(0,0,0,0.06)] z-10">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Employee Salary Button */}
                              <button
                                onClick={() => openSalaryModal(emp)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] hover:bg-[var(--hover-bg)] text-xs font-semibold text-[var(--text-main)] transition shadow-sm"
                                title="Set or edit employee base salary and bank info"
                              >
                                <Pencil size={12} className="text-primary-600" />
                                <span>Employee Salary</span>
                              </button>

                              {/* Download PDF Payslip */}
                              <button
                                onClick={() => handleDownloadPdf(emp)}
                                disabled={downloadingId === emp.id}
                                className="p-1.5 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition shadow-sm disabled:opacity-50"
                                title="Download PDF Payslip"
                              >
                                <Download size={14} className={downloadingId === emp.id ? 'animate-bounce text-primary-600' : ''} />
                              </button>

                              {/* Email Dispatch */}
                              <button
                                onClick={() => handleSendEmail(emp)}
                                disabled={sendingId === emp.id}
                                className="p-1.5 rounded-xl border border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition shadow-sm disabled:opacity-50"
                                title="Email official PDF payslip directly to employee"
                              >
                                <Mail size={14} className={sendingId === emp.id ? 'animate-spin' : ''} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL: SET EMPLOYEE SALARY ── */}
      {salaryModalEmployee && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-3xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-main)]">Set Employee Salary</h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {salaryModalEmployee.name} ({salaryModalEmployee.employeeCode})
                </p>
              </div>
              <button
                onClick={() => setSalaryModalEmployee(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className={labelCls}>Monthly Base Salary *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-xs text-[var(--text-muted)]">
                    {currencyInput}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={salaryInput}
                    onChange={(e) => setSalaryInput(e.target.value)}
                    placeholder="e.g. 250000"
                    className={`${inputCls} pl-14 font-semibold`}
                  />
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  Fixed gross monthly salary before lateness and disciplinary deductions.
                </p>
              </div>

              <div>
                <label className={labelCls}>Currency</label>
                <select
                  value={currencyInput}
                  onChange={(e) => setCurrencyInput(e.target.value)}
                  className={inputCls}
                >
                  <option value="NGN">NGN (₦ - Nigerian Naira)</option>
                  <option value="USD">USD ($ - US Dollar)</option>
                  <option value="GBP">GBP (£ - British Pound)</option>
                  <option value="EUR">EUR (€ - Euro)</option>
                  <option value="GHS">GHS (GH₵ - Ghanaian Cedi)</option>
                  <option value="KES">KES (KSh - Kenyan Shilling)</option>
                </select>
              </div>

              {/* Bank Disbursement Section */}
              <div className="pt-2 border-t border-[var(--border)] space-y-3">
                <span className="block text-xs font-semibold text-[var(--text-main)]">
                  Disbursement Bank Account (Optional)
                </span>
                <div>
                  <label className={labelCls}>Bank Name</label>
                  <input
                    type="text"
                    value={bankNameInput}
                    onChange={(e) => setBankNameInput(e.target.value)}
                    placeholder="e.g. Access Bank, Zenith Bank, GTBank"
                    className={inputCls}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Account Number</label>
                    <input
                      type="text"
                      value={accountNumberInput}
                      onChange={(e) => setAccountNumberInput(e.target.value)}
                      placeholder="0123456789"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Account Name</label>
                    <input
                      type="text"
                      value={accountNameInput}
                      onChange={(e) => setAccountNameInput(e.target.value)}
                      placeholder="Account holder"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              {/* Net Projection */}
              {parseFloat(salaryInput) > 0 && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 block">
                      Estimated Net Payout ({monthNames[selectedMonth - 1]})
                    </span>
                    <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                      {formatMoney(
                        Math.max(0, parseFloat(salaryInput) - salaryModalEmployee.totalDeductions),
                        currencyInput
                      )}
                    </span>
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">
                    Deductions: -{formatMoney(salaryModalEmployee.totalDeductions, currencyInput)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 px-6 pb-6 pt-3 border-t border-[var(--border)]">
              <button
                onClick={() => setSalaryModalEmployee(null)}
                className="px-4 py-2 border border-[var(--border)] text-[var(--text-main)] text-sm font-semibold rounded-xl hover:bg-[var(--hover-bg)] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSalary}
                disabled={savingSalary}
                className="px-6 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold rounded-xl transition disabled:opacity-60 flex items-center gap-1.5"
              >
                {savingSalary ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                <span>{savingSalary ? 'Saving...' : 'Save Salary'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: PAYDAY & EMAIL PAYOUT SETTINGS ── */}
      {settingsModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-main)]">Payday & Payout Settings</h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Configure the recurring monthly payout schedule and automated email dispatch.
                </p>
              </div>
              <button
                onClick={() => setSettingsModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Monthly Payday (1-31) *</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={settingsData.salaryPayoutDay}
                    onChange={(e) =>
                      setSettingsData((prev) => ({
                        ...prev,
                        salaryPayoutDay: parseInt(e.target.value, 10) || 28,
                      }))
                    }
                    className={`${inputCls} font-semibold`}
                  />
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">
                    e.g. 3rd of every month. Penalties are calculated up to this payday cutoff, resetting for the next cycle afterward while preserving historical payroll records.
                  </p>
                </div>

                <div>
                  <label className={labelCls}>Default Currency</label>
                  <select
                    value={settingsData.salaryCurrency}
                    onChange={(e) =>
                      setSettingsData((prev) => ({ ...prev, salaryCurrency: e.target.value }))
                    }
                    className={inputCls}
                  >
                    <option value="NGN">NGN (₦)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              {/* Automation Switch */}
              <div className="p-4 bg-[var(--hover-bg)] rounded-2xl border border-[var(--border)] flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-[var(--text-main)]">Enable Automated Payday Processing</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Automatically computes penalties, generates official payslips with attendance performance grades, and dispatches via email on the payout day.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settingsData.salaryAutomationEnabled}
                  onChange={(e) =>
                    setSettingsData((prev) => ({
                      ...prev,
                      salaryAutomationEnabled: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 cursor-pointer"
                />
              </div>

              {/* Email Delivery Info Box */}
              <div className="p-4 bg-[var(--hover-bg)] rounded-2xl border border-[var(--border)] space-y-1.5">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-primary-600" />
                  <span className="text-xs font-bold text-[var(--text-main)]">
                    On-Demand Email Payout Dispatch
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Payslip dispatch is fully controlled by the admin: click <strong>Complete Payout</strong> to instantly email official PDF payslips to all employees at once, or click the individual <strong>Mail</strong> icon next to any employee to email only that employee. Automated background dispatch is disabled.
                </p>
              </div>

              {/* Custom SMTP Configuration */}
              <div className="p-4 bg-[var(--hover-bg)] rounded-2xl border border-[var(--border)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-primary-600" />
                    <span className="text-xs font-bold text-[var(--text-main)]">
                      Organization SMTP Email Configuration
                    </span>
                  </div>
                  {settingsData.hasSmtpCredentials && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                      Custom SMTP Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Configure your company&apos;s mail server (Gmail App Password, Outlook 365, Brevo, SendGrid, or private SMTP) to dispatch official payslip PDFs directly from your own domain. Leave blank to use system defaults.
                </p>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className={labelCls}>SMTP Host / Server</label>
                    <input
                      type="text"
                      placeholder="e.g. smtp.gmail.com"
                      value={settingsData.smtpHost || ''}
                      onChange={(e) =>
                        setSettingsData((prev) => ({ ...prev, smtpHost: e.target.value }))
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Port</label>
                    <input
                      type="number"
                      placeholder="587"
                      value={settingsData.smtpPort || 587}
                      onChange={(e) =>
                        setSettingsData((prev) => ({
                          ...prev,
                          smtpPort: parseInt(e.target.value, 10) || 587,
                        }))
                      }
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>SMTP Username / Email</label>
                    <input
                      type="text"
                      placeholder="e.g. payroll@company.com"
                      value={settingsData.smtpUser || ''}
                      onChange={(e) =>
                        setSettingsData((prev) => ({ ...prev, smtpUser: e.target.value }))
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>SMTP Password / App Password</label>
                    <input
                      type="password"
                      placeholder={settingsData.hasSmtpCredentials ? '•••••••• (leave blank to keep)' : 'App Password'}
                      value={settingsData.smtpPass || ''}
                      onChange={(e) =>
                        setSettingsData((prev) => ({ ...prev, smtpPass: e.target.value }))
                      }
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <label className={labelCls}>Sender Name & Email (From)</label>
                    <input
                      type="text"
                      placeholder='e.g. "Acme Payroll" <payroll@company.com>'
                      value={settingsData.smtpFrom || ''}
                      onChange={(e) =>
                        setSettingsData((prev) => ({ ...prev, smtpFrom: e.target.value }))
                      }
                      className={inputCls}
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-4">
                    <input
                      type="checkbox"
                      id="smtpSecureToggle"
                      checked={Boolean(settingsData.smtpSecure)}
                      onChange={(e) =>
                        setSettingsData((prev) => ({ ...prev, smtpSecure: e.target.checked }))
                      }
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 cursor-pointer"
                    />
                    <label htmlFor="smtpSecureToggle" className="text-xs text-[var(--text-main)] cursor-pointer">
                      Use SSL/TLS (Port 465)
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 pb-6 pt-3 border-t border-[var(--border)]">
              <button
                onClick={() => setSettingsModalOpen(false)}
                className="px-4 py-2 border border-[var(--border)] text-[var(--text-main)] text-sm font-semibold rounded-xl hover:bg-[var(--hover-bg)] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="px-6 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold rounded-xl transition disabled:opacity-60 flex items-center gap-1.5"
              >
                {savingSettings ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                <span>{savingSettings ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: PENALTIES BREAKDOWN ── */}
      {breakdownModalEmployee && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-3xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-main)]">Penalties & Deductions</h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {breakdownModalEmployee.name} • {monthLabel}
                </p>
              </div>
              <button
                onClick={() => setBreakdownModalEmployee(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl flex items-center justify-between">
                <span className="text-xs font-semibold text-red-800 dark:text-red-300">Total Deductions</span>
                <span className="text-base font-bold text-red-700 dark:text-red-400">
                  -{formatMoney(breakdownModalEmployee.totalDeductions, breakdownModalEmployee.currency)}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--hover-bg)] border border-[var(--border)]">
                  <div>
                    <p className="font-semibold text-xs text-[var(--text-main)]">Attendance Lateness Deductions</p>
                    <p className="text-[11px] text-[var(--text-muted)]">Automatic lateness & grace overage penalties</p>
                  </div>
                  <span className="font-bold text-xs text-red-600 dark:text-red-400">
                    -{formatMoney(breakdownModalEmployee.attendancePenalties, breakdownModalEmployee.currency)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--hover-bg)] border border-[var(--border)]">
                  <div>
                    <p className="font-semibold text-xs text-[var(--text-main)]">Break Overstay Deductions</p>
                    <p className="text-[11px] text-[var(--text-muted)]">Automatic deductions for exceeded break limits</p>
                  </div>
                  <span className="font-bold text-xs text-red-600 dark:text-red-400">
                    -{formatMoney(breakdownModalEmployee.breakPenalties || 0, breakdownModalEmployee.currency)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--hover-bg)] border border-[var(--border)]">
                  <div>
                    <p className="font-semibold text-xs text-[var(--text-main)]">HR Administrative Penalties</p>
                    <p className="text-[11px] text-[var(--text-muted)]">Manual disciplinary or policy violation adjustments</p>
                  </div>
                  <span className="font-bold text-xs text-red-600 dark:text-red-400">
                    -{formatMoney(breakdownModalEmployee.manualPenalties, breakdownModalEmployee.currency)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end px-6 pb-6 pt-3 border-t border-[var(--border)]">
              <button
                onClick={() => setBreakdownModalEmployee(null)}
                className="px-5 py-2 bg-[var(--hover-bg)] border border-[var(--border)] text-[var(--text-main)] text-sm font-semibold rounded-xl hover:bg-[var(--border)] transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
