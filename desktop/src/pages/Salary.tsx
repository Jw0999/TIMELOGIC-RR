import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Banknote,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Filter,
  Info,
  MessageCircle,
  Pencil,
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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SET' | 'UNSET'>('ALL');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals state
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

  const formatMoney = useCallback((amount: number, curr = 'NGN') => {
    const symbol = curr === 'NGN' ? '₦' : curr === 'USD' ? '$' : curr === 'GBP' ? '£' : `${curr} `;
    return `${symbol}${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, []);

  const loadPayroll = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetchPayrollOverview(selectedYear, selectedMonth);
      if (res) {
        setEmployees(res.employees || []);
        setSummary(res.summary || null);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to load payroll overview' });
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
      console.warn('Failed to load settings:', err);
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
    setMessage(null);
    try {
      await calculatePayroll({ year: selectedYear, month: selectedMonth });
      setMessage({
        type: 'success',
        text: `Successfully calculated and finalized payroll for ${monthNames[selectedMonth - 1]} ${selectedYear}. Deductions and net salaries have been updated.`,
      });
      await loadPayroll();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to calculate payroll' });
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

      // Recalculate monthly payroll snapshot to apply change
      await calculatePayroll({ year: selectedYear, month: selectedMonth });
      await loadPayroll();

      setMessage({
        type: 'success',
        text: `Base salary for ${salaryModalEmployee.name} updated to ${formatMoney(val, currencyInput)} and payroll synchronized!`,
      });
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
      setMessage({
        type: 'success',
        text: 'Automated payroll and WhatsApp dispatch schedule updated successfully.',
      });
      setSettingsModalOpen(false);
      await loadPayroll();
      await loadSettings();
    } catch (err: any) {
      alert(err?.message || 'Failed to update payroll settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDownloadPdf = async (emp: EmployeePayroll) => {
    if (!emp.payslipId) {
      // Auto-calculate first if payslip record does not exist yet
      try {
        await calculatePayroll({ year: selectedYear, month: selectedMonth });
        const res = await fetchPayrollOverview(selectedYear, selectedMonth);
        const updated = res.employees.find((e: any) => e.id === emp.id);
        if (updated?.payslipId) {
          emp = updated;
        }
      } catch (e: any) {
        alert('Could not generate payslip: ' + e.message);
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
      // Calculate first
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
      const res = await sendPayslipWhatsApp(emp.payslipId);
      if (res?.directUrl && settingsData.whatsappProvider === 'WEB_LINK') {
        window.open(res.directUrl, '_blank');
      }
      setMessage({
        type: 'success',
        text: `WhatsApp notification for ${emp.name} dispatched successfully!`,
      });
      await loadPayroll();
    } catch (err: any) {
      alert(err?.message || 'Failed to dispatch WhatsApp notification');
    } finally {
      setSendingId(null);
    }
  };

  const handleBatchSendWhatsApp = async () => {
    if (!window.confirm(`Are you sure you want to dispatch WhatsApp payslips to all employees for ${monthNames[selectedMonth - 1]} ${selectedYear}?`)) {
      return;
    }

    setBatchSending(true);
    setMessage(null);
    try {
      // Finalize calculations first
      await calculatePayroll({ year: selectedYear, month: selectedMonth });
      const res = await batchSendWhatsApp({ year: selectedYear, month: selectedMonth });
      setMessage({
        type: 'success',
        text: `Batch WhatsApp dispatch complete! Sent: ${res.sent || 0}, Skipped: ${res.skipped || 0}, Failed: ${res.failed || 0}.`,
      });
      await loadPayroll();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to complete batch WhatsApp send' });
    } finally {
      setBatchSending(false);
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.phone && emp.phone.includes(searchQuery)) ||
        emp.departmentName.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'SET') return emp.baseSalary > 0;
      if (statusFilter === 'UNSET') return emp.baseSalary === 0;
      return true;
    });
  }, [employees, searchQuery, statusFilter]);

  const currency = summary?.currency || 'NGN';

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[var(--page-bg)] text-[var(--text-primary)]">
      <Header title="Salary & Payroll Automation" />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Banner / Notification */}
        {message && (
          <div
            className={`p-4 rounded-xl flex items-center justify-between transition-all ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400'
            }`}
          >
            <div className="flex items-center gap-3">
              {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-sm opacity-70 hover:opacity-100">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Top Controls Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[var(--card-bg)] p-4 rounded-2xl border border-[var(--border-color)] shadow-sm">
          {/* Month & Year Navigator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-primary-50 dark:bg-slate-800 rounded-xl p-1 border border-primary-200 dark:border-slate-700">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all text-slate-700 dark:text-slate-200"
                title="Previous Month"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="px-3 flex items-center gap-2">
                <Calendar size={16} className="text-primary-600 dark:text-primary-400" />
                <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 min-w-[130px] text-center">
                  {monthNames[selectedMonth - 1]} {selectedYear}
                </span>
              </div>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all text-slate-700 dark:text-slate-200"
                title="Next Month"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <button
              onClick={loadPayroll}
              disabled={loading}
              className="p-2.5 rounded-xl border border-[var(--border-color)] hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-300"
              title="Refresh Data"
            >
              <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setSettingsModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-700 dark:text-slate-200"
            >
              <Settings size={15} />
              Payday & WhatsApp Settings
            </button>

            <button
              onClick={handleCalculatePayroll}
              disabled={calculating}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              <Sparkles size={15} className={calculating ? 'animate-spin text-amber-400' : 'text-amber-400'} />
              {calculating ? 'Calculating...' : 'Calculate Monthly Payroll'}
            </button>

            <button
              onClick={handleBatchSendWhatsApp}
              disabled={batchSending}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              <MessageCircle size={15} />
              {batchSending ? 'Sending WhatsApp...' : 'Batch Send WhatsApp'}
            </button>
          </div>
        </div>

        {/* Executive Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Base Salary Card */}
          <div className="bg-[var(--card-bg)] p-5 rounded-2xl border border-[var(--border-color)] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                Total Base Payroll
              </p>
              <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">
                {formatMoney(summary?.totalBasePayroll || 0, currency)}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <Users size={12} /> {summary?.totalEmployees || 0} registered employees
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
              <Banknote size={24} />
            </div>
          </div>

          {/* Total Deductions / Penalties */}
          <div className="bg-[var(--card-bg)] p-5 rounded-2xl border border-[var(--border-color)] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                Penalties Deducted
              </p>
              <h3 className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">
                -{formatMoney(summary?.totalDeductions || 0, currency)}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <ShieldAlert size={12} /> Lateness + Disciplinary deductions
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0">
              <ShieldAlert size={24} />
            </div>
          </div>

          {/* Total Net Payout */}
          <div className="bg-[var(--card-bg)] p-5 rounded-2xl border border-[var(--border-color)] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                Net Payout (Disbursable)
              </p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                {formatMoney(summary?.totalNetPayout || 0, currency)}
              </h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 size={12} /> Base Salary minus Penalties
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Wallet size={24} />
            </div>
          </div>

          {/* Automated Payday Schedule */}
          <div className="bg-[var(--card-bg)] p-5 rounded-2xl border border-[var(--border-color)] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                Payday Automation
              </p>
              <h3 className="text-lg font-bold mt-1 text-slate-900 dark:text-white">
                Day {settingsData.salaryPayoutDay || 28} of Month
              </h3>
              <span
                className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  settingsData.salaryAutomationEnabled
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {settingsData.salaryAutomationEnabled ? '● Automation Active' : '○ Manual Only'}
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
              <Calendar size={24} />
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employee, ID, phone..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Filter size={14} className="text-[var(--text-muted)]" />
            <div className="flex bg-[var(--card-bg)] p-1 rounded-xl border border-[var(--border-color)]">
              {(['ALL', 'SET', 'UNSET'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    statusFilter === filter
                      ? 'bg-primary-600 text-white'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {filter === 'ALL' ? 'All Staff' : filter === 'SET' ? 'Salary Set' : 'Salary Not Set'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Employee Payroll Table */}
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-[var(--border-color)] text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4 font-semibold">Employee</th>
                  <th className="py-3.5 px-4 font-semibold">Department</th>
                  <th className="py-3.5 px-4 font-semibold">Base Salary</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Attendance</th>
                  <th className="py-3.5 px-4 font-semibold">Penalties Deducted</th>
                  <th className="py-3.5 px-4 font-semibold">Net Payable</th>
                  <th className="py-3.5 px-4 font-semibold text-center">WhatsApp</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw size={24} className="animate-spin text-primary-500" />
                        <span>Loading employee salaries and penalties...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <p className="font-semibold text-slate-500">No employees found matching criteria.</p>
                      <p className="text-[11px] mt-1">Try clearing your search filter or selecting another month.</p>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => {
                    const hasSalary = emp.baseSalary > 0;
                    return (
                      <tr
                        key={emp.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Employee Name & Staff Code */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-bold flex items-center justify-center text-xs flex-shrink-0">
                              {emp.firstName?.[0]}{emp.lastName?.[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 dark:text-white truncate">
                                {emp.name}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                <span>{emp.employeeCode}</span>
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

                        {/* Department */}
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px]">
                            {emp.departmentName}
                          </span>
                        </td>

                        {/* Base Salary */}
                        <td className="py-3.5 px-4">
                          {hasSalary ? (
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">
                                {formatMoney(emp.baseSalary, emp.currency)}
                              </p>
                              {emp.bankName && emp.accountNumber && (
                                <p className="text-[10px] text-slate-400 truncate max-w-[130px]">
                                  {emp.bankName} - {emp.accountNumber.slice(-4)}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded text-[10px] font-semibold">
                              <AlertTriangle size={11} /> Not Set
                            </span>
                          )}
                        </td>

                        {/* Attendance Summary */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-semibold text-slate-700 dark:text-slate-200">
                            {emp.totalPresentDays}d
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1">
                            ({emp.totalWorkHours}h)
                          </span>
                          {emp.totalLateDays > 0 && (
                            <div className="text-[10px] text-red-500 font-medium">
                              {emp.totalLateDays} late
                            </div>
                          )}
                        </td>

                        {/* Penalties Deducted */}
                        <td className="py-3.5 px-4">
                          {emp.totalDeductions > 0 ? (
                            <button
                              onClick={() => setBreakdownModalEmployee(emp)}
                              className="text-left group"
                              title="Click to view breakdown"
                            >
                              <p className="font-bold text-red-600 dark:text-red-400 group-hover:underline flex items-center gap-1">
                                -{formatMoney(emp.totalDeductions, emp.currency)}
                                <Info size={11} className="opacity-60" />
                              </p>
                              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                <span>Late: {formatMoney(emp.attendancePenalties, emp.currency)}</span>
                                {emp.manualPenalties > 0 && (
                                  <span>• HR: {formatMoney(emp.manualPenalties, emp.currency)}</span>
                                )}
                              </div>
                            </button>
                          ) : (
                            <span className="text-slate-400 font-medium text-[11px]">₦0.00</span>
                          )}
                        </td>

                        {/* Net Payable */}
                        <td className="py-3.5 px-4">
                          <p className={`font-bold text-sm ${emp.netSalary > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                            {formatMoney(emp.netSalary, emp.currency)}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {emp.payslipStatus === 'GENERATED' ? 'Snapshot Ready' : 'Live Calculation'}
                          </span>
                        </td>

                        {/* WhatsApp Status */}
                        <td className="py-3.5 px-4 text-center">
                          {emp.whatsappStatus === 'SENT' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                              <CheckCircle2 size={11} /> Sent
                            </span>
                          ) : emp.whatsappStatus === 'FAILED' ? (
                            <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                              <ShieldAlert size={11} /> Failed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-[10px]">
                              Pending
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Employee Salary Button */}
                            <button
                              onClick={() => openSalaryModal(emp)}
                              className="px-2.5 py-1.5 rounded-lg border border-[var(--border-color)] hover:bg-primary-50 hover:border-primary-300 dark:hover:bg-primary-950/40 text-primary-600 dark:text-primary-400 font-semibold transition-all flex items-center gap-1"
                              title="Set or update employee salary"
                            >
                              <Pencil size={12} />
                              <span>{hasSalary ? 'Edit Salary' : 'Employee Salary'}</span>
                            </button>

                            {/* Download PDF Payslip */}
                            <button
                              onClick={() => handleDownloadPdf(emp)}
                              disabled={downloadingId === emp.id}
                              className="p-1.5 rounded-lg border border-[var(--border-color)] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all disabled:opacity-50"
                              title="Download branded payslip PDF"
                            >
                              <Download size={14} className={downloadingId === emp.id ? 'animate-bounce text-primary-500' : ''} />
                            </button>

                            {/* WhatsApp Send */}
                            <button
                              onClick={() => handleSendWhatsApp(emp)}
                              disabled={sendingId === emp.id}
                              className="p-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-all disabled:opacity-50"
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
        </div>

        {/* ── MODAL: SET EMPLOYEE SALARY ── */}
        {salaryModalEmployee && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-5 border-b border-[var(--border-color)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 flex items-center justify-center font-bold">
                    <Banknote size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Employee Salary Setup
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {salaryModalEmployee.name} ({salaryModalEmployee.employeeCode})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSalaryModalEmployee(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                {/* Monthly Base Salary */}
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Monthly Base Salary *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                      {currencyInput}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={salaryInput}
                      onChange={(e) => setSalaryInput(e.target.value)}
                      placeholder="e.g. 250000"
                      className="w-full pl-16 pr-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--page-bg)] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    This is the fixed monthly gross salary before attendance lateness & disciplinary deductions.
                  </p>
                </div>

                {/* Currency */}
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Salary Currency
                  </label>
                  <select
                    value={currencyInput}
                    onChange={(e) => setCurrencyInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--page-bg)] font-medium"
                  >
                    <option value="NGN">NGN (₦ - Nigerian Naira)</option>
                    <option value="USD">USD ($ - US Dollar)</option>
                    <option value="GBP">GBP (£ - British Pound)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                    <option value="GHS">GHS (GH₵ - Ghanaian Cedi)</option>
                    <option value="KES">KES (KSh - Kenyan Shilling)</option>
                  </select>
                </div>

                {/* Bank Account Details */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-[var(--border-color)] space-y-3">
                  <p className="font-semibold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wide">
                    Disbursement Bank Details (Optional)
                  </p>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">Bank Name</label>
                    <input
                      type="text"
                      value={bankNameInput}
                      onChange={(e) => setBankNameInput(e.target.value)}
                      placeholder="e.g. Access Bank, Zenith Bank, GTBank"
                      className="w-full px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5">Account Number</label>
                      <input
                        type="text"
                        value={accountNumberInput}
                        onChange={(e) => setAccountNumberInput(e.target.value)}
                        placeholder="0123456789"
                        className="w-full px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5">Account Name</label>
                      <input
                        type="text"
                        value={accountNameInput}
                        onChange={(e) => setAccountNameInput(e.target.value)}
                        placeholder="Beneficiary Name"
                        className="w-full px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Net Pay Preview Calculation */}
                {parseFloat(salaryInput) > 0 && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                        Projected Net for {monthNames[selectedMonth - 1]}
                      </p>
                      <p className="text-base font-bold text-emerald-700 dark:text-emerald-300">
                        {formatMoney(
                          Math.max(0, parseFloat(salaryInput) - salaryModalEmployee.totalDeductions),
                          currencyInput
                        )}
                      </p>
                    </div>
                    <div className="text-right text-[10px] text-slate-500">
                      <span>Penalties: -{formatMoney(salaryModalEmployee.totalDeductions, currencyInput)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-[var(--border-color)] flex items-center justify-end gap-2">
                <button
                  onClick={() => setSalaryModalEmployee(null)}
                  className="px-4 py-2 rounded-xl border border-[var(--border-color)] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSalary}
                  disabled={savingSalary}
                  className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  {savingSalary ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  <span>{savingSalary ? 'Saving...' : 'Save & Calculate'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL: PAYDAY & WHATSAPP SETTINGS ── */}
        {settingsModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-5 border-b border-[var(--border-color)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                    <Settings size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Payday & WhatsApp Automation Settings
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Configure monthly payout day and automated dispatch
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSettingsModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                {/* Day of Month */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Monthly Payout Day *
                    </label>
                    <div className="relative">
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
                        className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--page-bg)] font-semibold text-sm"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">e.g. 28th of every month</p>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Default Currency
                    </label>
                    <select
                      value={settingsData.salaryCurrency}
                      onChange={(e) =>
                        setSettingsData((prev) => ({ ...prev, salaryCurrency: e.target.value }))
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--page-bg)] font-medium"
                    >
                      <option value="NGN">NGN (₦)</option>
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                </div>

                {/* Automation Toggle */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-[var(--border-color)] flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      Enable Automated Payday Cron
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Auto-computes deductions and triggers WhatsApp dispatch on the payout day
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

                {/* WhatsApp Provider Option */}
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    WhatsApp Delivery Provider
                  </label>
                  <select
                    value={settingsData.whatsappProvider}
                    onChange={(e) =>
                      setSettingsData((prev) => ({ ...prev, whatsappProvider: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--page-bg)] font-medium"
                  >
                    <option value="WEB_LINK">WhatsApp Web / Click-to-Chat (Instant 1-Click)</option>
                    <option value="META">Meta WhatsApp Business Cloud API</option>
                  </select>
                </div>

                {settingsData.whatsappProvider === 'META' && (
                  <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-[var(--border-color)]">
                    <p className="font-semibold text-[11px] text-slate-700 dark:text-slate-300">
                      Meta Cloud API Credentials
                    </p>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5">Phone Number ID</label>
                      <input
                        type="text"
                        value={settingsData.whatsappPhoneId || ''}
                        onChange={(e) =>
                          setSettingsData((prev) => ({ ...prev, whatsappPhoneId: e.target.value }))
                        }
                        placeholder="e.g. 104829104820194"
                        className="w-full px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5">System User Access Token</label>
                      <input
                        type="password"
                        value={settingsData.whatsappApiToken || ''}
                        onChange={(e) =>
                          setSettingsData((prev) => ({ ...prev, whatsappApiToken: e.target.value }))
                        }
                        placeholder="EAAB..."
                        className="w-full px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-[var(--border-color)] flex items-center justify-end gap-2">
                <button
                  onClick={() => setSettingsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--border-color)] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  {savingSettings ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  <span>{savingSettings ? 'Saving...' : 'Save Settings'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL: DEDUCTIONS & PENALTIES AUDIT BREAKDOWN ── */}
        {breakdownModalEmployee && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-5 border-b border-[var(--border-color)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center font-bold">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Penalties & Deductions Breakdown
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {breakdownModalEmployee.name} • {monthNames[selectedMonth - 1]} {selectedYear}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setBreakdownModalEmployee(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-3 text-xs max-h-[350px] overflow-y-auto">
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between">
                  <span className="font-semibold text-red-700 dark:text-red-400">Total Deductions</span>
                  <span className="font-bold text-base text-red-700 dark:text-red-400">
                    -{formatMoney(breakdownModalEmployee.totalDeductions, breakdownModalEmployee.currency)}
                  </span>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-[var(--border-color)]">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">Attendance Lateness Deductions</p>
                      <p className="text-[10px] text-slate-400">Calculated from late check-ins & grace threshold overages</p>
                    </div>
                    <span className="font-bold text-red-600">
                      -{formatMoney(breakdownModalEmployee.attendancePenalties, breakdownModalEmployee.currency)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-[var(--border-color)]">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">HR Administrative Penalties</p>
                      <p className="text-[10px] text-slate-400">Manual administrative/disciplinary penalties issued by HR</p>
                    </div>
                    <span className="font-bold text-red-600">
                      -{formatMoney(breakdownModalEmployee.manualPenalties, breakdownModalEmployee.currency)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-[var(--border-color)] flex items-center justify-end">
                <button
                  onClick={() => setBreakdownModalEmployee(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
