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
  MessageCircle,
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
  sendPayslipWhatsApp,
  batchSendWhatsApp,
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
}

interface PayrollSettingsData {
  salaryPayoutDay: number;
  salaryAutomationEnabled: boolean;
  salaryCurrency: string;
  whatsappProvider: string;
  whatsappPhoneId?: string | null;
  whatsappSenderNumber?: string | null;
  whatsappApiToken?: string | null;
  hasWhatsappToken?: boolean;
}

export default function Salary() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);

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
    whatsappProvider: 'WEB_LINK',
    whatsappPhoneId: '',
    whatsappSenderNumber: '',
    whatsappApiToken: '',
    hasWhatsappToken: false,
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

  const loadPayroll = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetchPayrollOverview(selectedYear, selectedMonth);
      if (res) {
        setEmployees(res.employees || []);
        setSummary(res.summary || null);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not load payroll overview.');
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetchPayrollSettings();
      if (res) {
        setSettingsData({
          salaryPayoutDay: res.salaryPayoutDay ?? 28,
          salaryAutomationEnabled: res.salaryAutomationEnabled ?? true,
          salaryCurrency: res.salaryCurrency || 'NGN',
          whatsappProvider: res.whatsappProvider || 'WEB_LINK',
          whatsappPhoneId: res.whatsappPhoneId || '',
          whatsappSenderNumber: res.whatsappSenderNumber || '',
          whatsappApiToken: res.whatsappApiToken || '',
          hasWhatsappToken: res.hasWhatsappToken ?? false,
        });
      }
    } catch (err: any) {
      console.warn('Failed to load payroll settings:', err);
    }
  }, []);

  useEffect(() => {
    loadPayroll();
    loadSettings();
  }, [loadPayroll, loadSettings]);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
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
      setSuccessMsg('Automated payday schedule and WhatsApp dispatch settings saved.');
      setSettingsModalOpen(false);
      await loadPayroll();
      await loadSettings();
    } catch (err: any) {
      alert(err?.message || 'Failed to update settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDownloadPdf = async (emp: EmployeePayroll) => {
    if (!emp.payslipId) {
      try {
        await calculatePayroll({ year: selectedYear, month: selectedMonth });
        const res = await fetchPayrollOverview(selectedYear, selectedMonth);
        const updated = res.employees.find((e: any) => e.id === emp.id);
        if (updated?.payslipId) emp = updated;
      } catch (e: any) {
        alert('Could not prepare payslip: ' + e.message);
        return;
      }
    }

    if (!emp.payslipId) return;

    setDownloadingId(emp.id);
    try {
      const fileName = `Payslip-${emp.employeeCode || emp.firstName}-${monthNames[selectedMonth - 1]}-${selectedYear}.pdf`;
      await downloadPayslipPdf(emp.payslipId, fileName);
    } catch (err: any) {
      alert(err?.message || 'Failed to download PDF payslip');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSendWhatsApp = async (emp: EmployeePayroll) => {
    if (!emp.phone) {
      alert(`Cannot send WhatsApp: ${emp.name} does not have a registered phone number.`);
      return;
    }

    if (!emp.payslipId) {
      try {
        await calculatePayroll({ year: selectedYear, month: selectedMonth });
        const res = await fetchPayrollOverview(selectedYear, selectedMonth);
        const updated = res.employees.find((e: any) => e.id === emp.id);
        if (updated?.payslipId) emp = updated;
      } catch (e: any) {
        alert('Could not prepare payslip: ' + e.message);
        return;
      }
    }

    if (!emp.payslipId) return;

    setSendingId(emp.id);
    try {
      // 1. Auto-download official PDF to local device so admin has the file ready in Downloads
      try {
        const fileName = `Payslip-${emp.employeeCode || emp.firstName}-${monthNames[selectedMonth - 1]}-${selectedYear}.pdf`;
        await downloadPayslipPdf(emp.payslipId, fileName);
      } catch (pdfErr) {
        console.warn('Auto PDF download skipped:', pdfErr);
      }

      // 2. Dispatch/prepare WhatsApp message
      const res = await sendPayslipWhatsApp(emp.payslipId);
      if (res?.directUrl && settingsData.whatsappProvider === 'WEB_LINK') {
        const opened = await (window as any).electronAPI?.openExternal?.(res.directUrl);
        if (!opened) {
          window.open(res.directUrl, '_blank');
        }
      }
      setSuccessMsg(`WhatsApp payslip opened for ${emp.name}. PDF downloaded.`);
      await loadPayroll();
    } catch (err: any) {
      alert(err?.message || 'Failed to dispatch WhatsApp notification');
    } finally {
      setSendingId(null);
    }
  };

  const handleBatchSendWhatsApp = async () => {
    if (!window.confirm(`Are you sure you want to dispatch WhatsApp payslips to all employees for ${monthLabel}?`)) {
      return;
    }

    setBatchSending(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await calculatePayroll({ year: selectedYear, month: selectedMonth });
      const res = await batchSendWhatsApp({ year: selectedYear, month: selectedMonth });
      setSuccessMsg(`Batch WhatsApp completed: ${res.sent || 0} sent, ${res.skipped || 0} skipped.`);
      await loadPayroll();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to complete batch WhatsApp send');
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
        subtitle={`Automated monthly compensation, deductions & payslip dispatch · ${monthLabel}`}
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
              onClick={handleBatchSendWhatsApp}
              disabled={batchSending}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-sm disabled:opacity-60"
            >
              <MessageCircle size={14} />
              <span>{batchSending ? 'Sending...' : 'Batch WhatsApp'}</span>
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
          <div className="flex items-center gap-2">
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
              onClick={loadPayroll}
              disabled={loading}
              className="p-2 border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--hover-bg)] rounded-xl transition"
              title="Refresh Payroll"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin text-primary-600' : ''} />
            </button>
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
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Lateness + Disciplinary</p>
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
                Manage base salary rates, view attendance lateness & HR deductions, generate payslips, and dispatch via WhatsApp.
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
                    <th className="text-center text-xs font-semibold text-[var(--text-muted)] px-4 py-3">WhatsApp</th>
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

                          {/* WhatsApp Status */}
                          <td className="px-4 py-3 text-center">
                            {emp.whatsappStatus === 'SENT' ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                                <CheckCircle2 size={11} /> Sent
                              </span>
                            ) : emp.whatsappStatus === 'FAILED' ? (
                              <span className="inline-flex items-center gap-1 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                                <ShieldAlert size={11} /> Failed
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

                              {/* WhatsApp Dispatch */}
                              <button
                                onClick={() => handleSendWhatsApp(emp)}
                                disabled={sendingId === emp.id}
                                className="p-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition shadow-sm disabled:opacity-50"
                                title="Send payslip summary to employee via WhatsApp"
                              >
                                <Send size={14} className={sendingId === emp.id ? 'animate-spin' : ''} />
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

      {/* ── MODAL: PAYDAY & WHATSAPP SETTINGS ── */}
      {settingsModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-main)]">Payday & WhatsApp Settings</h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Configure the recurring monthly payout schedule and notification channels.
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
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">e.g. 28th of every month</p>
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
                    Automatically computes penalties, generates PDFs, and triggers WhatsApp on the payout day.
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

              {/* WhatsApp Provider */}
              <div>
                <label className={labelCls}>WhatsApp Delivery Provider</label>
                <select
                  value={settingsData.whatsappProvider}
                  onChange={(e) =>
                    setSettingsData((prev) => ({ ...prev, whatsappProvider: e.target.value }))
                  }
                  className={inputCls}
                >
                  <option value="WEB_LINK">WhatsApp Web / Click-to-Chat (1-Click Instant)</option>
                  <option value="META">Meta WhatsApp Business Cloud API</option>
                </select>
              </div>

              {settingsData.whatsappProvider === 'META' && (
                <div className="space-y-3 p-4 bg-[var(--hover-bg)] rounded-2xl border border-[var(--border)]">
                  <span className="block text-xs font-semibold text-[var(--text-main)]">
                    Meta Cloud API Credentials
                  </span>
                  <div>
                    <label className={labelCls}>Phone Number ID</label>
                    <input
                      type="text"
                      value={settingsData.whatsappPhoneId || ''}
                      onChange={(e) =>
                        setSettingsData((prev) => ({ ...prev, whatsappPhoneId: e.target.value }))
                      }
                      placeholder="e.g. 104829104820194"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Permanent System User Access Token</label>
                    <input
                      type="password"
                      value={settingsData.whatsappApiToken || ''}
                      onChange={(e) =>
                        setSettingsData((prev) => ({ ...prev, whatsappApiToken: e.target.value }))
                      }
                      placeholder="EAAB..."
                      className={inputCls}
                    />
                  </div>
                </div>
              )}
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
