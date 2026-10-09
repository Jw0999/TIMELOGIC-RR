import React, { useEffect, useState, useRef } from 'react';
import {
  TrendingUp, UploadCloud, Calendar, Download, RefreshCw,
  AlertTriangle, CheckCircle2, DollarSign, Package, ShoppingCart,
  Layers, ArrowUpRight, ArrowDownRight, FileSpreadsheet, Trash2,
  Search, ChevronLeft, ChevronRight, HelpCircle, ShieldAlert,
  BarChart3, PieChart, Sparkles, Filter, X, Eye, Info,
  FileCheck, ArrowRight, Table, CreditCard, MoreHorizontal,
  Printer, FileText, Smartphone, Laptop, Tag, Zap, Activity
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid, Cell
} from 'recharts';
import Header from '../components/Header';
import { useTheme } from '../context/ThemeContext';
import {
  fetchSalesDashboard,
  fetchSalesPeriods,
  importSalesUpload,
  fetchSalesTransactions,
  fetchSalesImports,
  deleteSalesImport,
  downloadSalesExcel,
  downloadSalesCsv,
  downloadSalesTemplate,
} from '../services';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Helper to choose a tailored icon for product categories
function getProductCategoryIcon(name: string, category: string) {
  const text = `${name} ${category}`.toLowerCase();
  if (/photo|copy|print|xerox/i.test(text)) {
    return <Printer size={18} className="text-sky-600" />;
  }
  if (/typ|doc|word|letter|write/i.test(text)) {
    return <FileText size={18} className="text-violet-600" />;
  }
  if (/card|badge|id|pvc/i.test(text)) {
    return <CreditCard size={18} className="text-amber-600" />;
  }
  if (/scan|passport|reprint/i.test(text)) {
    return <Search size={18} className="text-emerald-600" />;
  }
  if (/phone|smart|watch/i.test(text)) {
    return <Smartphone size={18} className="text-indigo-600" />;
  }
  if (/laptop|computer|internet|cyber/i.test(text)) {
    return <Laptop size={18} className="text-blue-600" />;
  }
  return <Package size={18} className="text-slate-600" />;
}

// Custom Tooltip for Sales Performance Overview BarChart
const CustomBarTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isPeak = data._isPeak;
    const isLowest = data._isLowest;
    return (
      <div className="bg-slate-900/95 text-white text-xs rounded-xl p-3 shadow-2xl border border-slate-700/80 pointer-events-none z-50 backdrop-blur-sm min-w-[170px]">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-slate-300">{data.date || `Day ${data.day}`}</p>
          {isPeak && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40">
              Highest
            </span>
          )}
          {isLowest && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40">
              Lowest
            </span>
          )}
        </div>
        <p className="text-sm font-extrabold text-white mt-1">₦{data.revenue?.toLocaleString()}</p>
        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1.5 pt-1.5 border-t border-slate-800">
          <span>{data.unitsSold?.toLocaleString()} units</span>
          <span>•</span>
          <span>{data.transactions?.toLocaleString()} orders</span>
        </div>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Sales Trend AreaChart
const CustomTrendTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-purple-950/95 text-white text-xs rounded-xl p-2.5 shadow-2xl border border-purple-800/80 pointer-events-none z-50 backdrop-blur-sm">
        <p className="text-[10px] font-semibold text-purple-200">{data.date || `Day ${data.day}`}</p>
        <p className="text-sm font-extrabold text-white mt-0.5">{data.transactions?.toLocaleString()} Orders</p>
        <p className="text-[11px] text-purple-300 mt-0.5">₦{data.revenue?.toLocaleString()} revenue</p>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Monthly Performance
const CustomMonthTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 text-white text-xs rounded-xl p-3 shadow-2xl border border-slate-700/80 pointer-events-none z-50 backdrop-blur-sm">
        <p className="font-bold text-white">{data.label || `${data.monthName} ${data.year}`}</p>
        <p className="text-sm font-extrabold text-emerald-400 mt-1">₦{data.totalRevenue?.toLocaleString()}</p>
        <p className="text-[11px] text-slate-400 mt-1">{data.totalTransactions?.toLocaleString()} transactions</p>
      </div>
    );
  }
  return null;
};

export default function SalesIntelligence() {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
  const [periods, setPeriods] = useState<any>({ years: [], months: [] });
  const [selectedPeriod, setSelectedPeriod] = useState<{ year: string | number; month: string | number }>({ year: 'all', month: 'all' });
  const [activeTab, setActiveTab] = useState<'analytics' | 'raw' | 'imports'>('analytics');
  const [error, setError] = useState('');
  const [showProfitNotice, setShowProfitNotice] = useState(true);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // Top Products Ranking filter: 'revenue' | 'units' | 'profit'
  const [productRankingMode, setProductRankingMode] = useState<'revenue' | 'units' | 'profit'>('revenue');

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadStep, setUploadStep] = useState<'select' | 'uploading' | 'complete'>('select');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [importSummary, setImportSummary] = useState<any>(null);
  const [showFormatGuide, setShowFormatGuide] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Raw data state
  const [rawSearch, setRawSearch] = useState('');
  const [rawCategory, setRawCategory] = useState('');
  const [rawPage, setRawPage] = useState(1);
  const [rawTotalPages, setRawTotalPages] = useState(1);
  const [rawTotalRows, setRawTotalRows] = useState(0);
  const [rawTransactions, setRawTransactions] = useState<any[]>([]);
  const [rawLoading, setRawLoading] = useState(false);

  // Import history state
  const [importHistory, setImportHistory] = useState<any[]>([]);
  const [importsLoading, setImportsLoading] = useState(false);

  // Load available periods on mount or after import
  const loadPeriodsAndDashboard = async (preferredPeriod?: { year: string | number; month: string | number }) => {
    setLoading(true);
    setError('');
    try {
      const p = await fetchSalesPeriods();
      setPeriods(p);
      let targetPeriod = preferredPeriod;
      if (!targetPeriod && p.hasData && p.latestPeriod) {
        targetPeriod = { year: p.latestPeriod.year, month: p.latestPeriod.month };
      }
      if (targetPeriod && targetPeriod.year !== 'all') {
        setSelectedPeriod(targetPeriod);
        const dash = await fetchSalesDashboard(targetPeriod);
        setDashboard(dash);
      } else {
        setSelectedPeriod({ year: 'all', month: 'all' });
        const dash = await fetchSalesDashboard({ year: 'all', month: 'all' });
        setDashboard(dash);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load sales analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPeriodsAndDashboard();
  }, []);

  // Reload dashboard when selected period changes
  const handlePeriodChange = async (year: string | number, month: string | number) => {
    setSelectedPeriod({ year, month });
    setLoading(true);
    setError('');
    try {
      const dash = await fetchSalesDashboard({ year, month });
      setDashboard(dash);
    } catch (err: any) {
      setError(err.message || 'Failed to update sales dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Load raw data
  const loadRawData = async (page = 1) => {
    setRawLoading(true);
    try {
      const res = await fetchSalesTransactions({
        year: selectedPeriod.year,
        month: selectedPeriod.month,
        search: rawSearch,
        category: rawCategory,
        page,
        limit: 50,
      });
      setRawTransactions(res.rows || []);
      setRawTotalPages(res.totalPages || 1);
      setRawTotalRows(res.total || 0);
      setRawPage(page);
    } catch (err: any) {
      setError(err.message || 'Failed to load raw transactions');
    } finally {
      setRawLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'raw') {
      loadRawData(1);
    } else if (activeTab === 'imports') {
      loadImportHistory();
    }
  }, [activeTab, selectedPeriod, rawSearch, rawCategory]);

  const loadImportHistory = async () => {
    setImportsLoading(true);
    try {
      const history = await fetchSalesImports();
      setImportHistory(history || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load import history');
    } finally {
      setImportsLoading(false);
    }
  };

  // Multi-File Upload Handler
  const [selectedFilesCount, setSelectedFilesCount] = useState(0);
  const [selectedFileNames, setSelectedFileNames] = useState<string[]>([]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files ? Array.from(e.target.files) : [];
    if (fileList.length === 0) return;

    setSelectedFilesCount(fileList.length);
    setSelectedFileNames(fileList.map((f) => f.name));
    setSelectedFileName(fileList.length === 1 ? fileList[0].name : `${fileList.length} sales files`);
    setUploadError('');
    setUploadStep('uploading');
    setUploadBusy(true);

    try {
      const formData = new FormData();
      fileList.forEach((file) => {
        formData.append('files', file);
      });
      if (fileList.length === 1) {
        formData.append('file', fileList[0]);
      }
      const res = await importSalesUpload(formData);
      setImportSummary(res);
      setUploadStep('complete');
      // Refresh periods and auto-focus the newly uploaded month
      if (res.data?.affectedMonths?.length > 0) {
        const [y, m] = res.data.affectedMonths[0].split('-').map(Number);
        await loadPeriodsAndDashboard({ year: y, month: m });
      } else {
        await loadPeriodsAndDashboard();
      }
    } catch (err: any) {
      setUploadError(err.message || 'Unable to import sales records. Please check the file format.');
      setUploadStep('select');
    } finally {
      setUploadBusy(false);
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    if (!window.confirm('Are you sure you want to delete this sales import batch? Its historical transactions will be removed.')) return;
    try {
      await deleteSalesImport(batchId);
      loadImportHistory();
      loadPeriodsAndDashboard();
    } catch (err: any) {
      alert(err.message || 'Failed to delete import batch');
    }
  };

  const resetUploadModal = () => {
    if (importSummary?.data?.affectedMonths?.length > 0) {
      const [y, m] = importSummary.data.affectedMonths[0].split('-').map(Number);
      handlePeriodChange(y, m);
    }
    setShowUploadModal(false);
    setUploadStep('select');
    setSelectedFileName('');
    setSelectedFilesCount(0);
    setSelectedFileNames([]);
    setImportSummary(null);
    setUploadError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Derive products list according to ranking mode
  const currentTopProducts = (
    productRankingMode === 'units'
      ? dashboard?.topProducts?.byUnits
      : productRankingMode === 'profit' && dashboard?.kpis?.hasCostData
      ? dashboard?.topProducts?.byProfit
      : dashboard?.topProducts?.byRevenue
  ) || [];

  // Identify peak day and lowest day for visual highlight and hover coloring
  const dailyTrendList = dashboard?.dailyTrend || [];
  const peakDayRevenue = dailyTrendList.reduce((max: number, d: any) => Math.max(max, d.revenue || 0), 0) || 1;
  const nonZeroDays = dailyTrendList.filter((d: any) => (d.revenue || 0) > 0);
  const lowestDayRevenue = nonZeroDays.length > 0
    ? nonZeroDays.reduce((min: number, d: any) => Math.min(min, d.revenue), Infinity)
    : (dailyTrendList.length > 0 ? dailyTrendList.reduce((min: number, d: any) => Math.min(min, d.revenue || 0), Infinity) : 0);

  const enrichedDailyTrend = dailyTrendList.map((d: any) => ({
    ...d,
    _isPeak: (d.revenue || 0) >= peakDayRevenue && peakDayRevenue > 0,
    _isLowest: (d.revenue || 0) <= lowestDayRevenue && (d.revenue || 0) > 0 && (d.revenue || 0) < peakDayRevenue,
  }));

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#E5F2E7] dark:bg-slate-950">
      
      {/* TimeLogic Standard Header */}
      <Header
        title="Business Analytics"
        subtitle="Understand your business performance at a glance."
      />

      {/* Main Viewport Container */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 lg:p-7 space-y-6">

        {/* ── TOP CONTROL BAR ────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-[18px] p-3.5 sm:p-4 border border-black/[0.04] dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Centered Period Selector ("THAT PEROIND PART SHOULD BE WELL CENTRALIZED") */}
          <div className="flex items-center justify-center gap-2.5 mx-auto md:mx-0 lg:mx-auto">
            <div className="inline-flex items-center gap-2 bg-[#F1F6F2] dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 px-4 py-2 rounded-xl shadow-xs">
              <Calendar size={15} className="text-emerald-600 shrink-0" />
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Period:</span>
              <select
                value={selectedPeriod.month === 'all' ? 'all' : `${selectedPeriod.year}-${selectedPeriod.month}`}
                onChange={(e) => {
                  if (e.target.value === 'all') {
                    handlePeriodChange('all', 'all');
                  } else {
                    const [y, m] = e.target.value.split('-').map(Number);
                    handlePeriodChange(y, m);
                  }
                }}
                className="bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer pr-1"
              >
                {periods.months?.map((m: any) => (
                  <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {m.label} ({m.totalTransactions.toLocaleString()} txs)
                  </option>
                ))}
                <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  All Time (Historical Aggregate)
                </option>
              </select>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0 justify-end">
            <button
              onClick={() => handlePeriodChange(selectedPeriod.year, selectedPeriod.month)}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm transition-all"
              title="Refresh sales data"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-emerald-600' : ''} />
            </button>

            <button
              onClick={() => setShowFormatGuide(!showFormatGuide)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold shadow-sm transition-all"
              title="View format guidance and sample template"
            >
              <FileCheck size={14} className="text-emerald-600" />
              <span>Format Guide</span>
            </button>

            <button
              onClick={() => downloadSalesExcel({ year: selectedPeriod.year, month: selectedPeriod.month })}
              disabled={!dashboard?.hasData}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold shadow-sm transition-all disabled:opacity-40"
              title="Export formatted Excel report"
            >
              <FileSpreadsheet size={14} className="text-emerald-600" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={() => downloadSalesCsv({ year: selectedPeriod.year, month: selectedPeriod.month })}
              disabled={!dashboard?.hasData}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold shadow-sm transition-all disabled:opacity-40"
              title="Export CSV data"
            >
              <Download size={14} />
              <span>CSV</span>
            </button>

            {/* Primary Action Button */}
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md shadow-slate-900/15 transition-all active:scale-[0.98]"
            >
              <UploadCloud size={14} />
              <span>Upload Sales File</span>
            </button>
          </div>
        </div>

        {/* Format Guidance Drawer / Banner */}
        {showFormatGuide && (
          <div className="bg-white dark:bg-slate-900 rounded-[18px] p-5 border border-black/[0.04] dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4 animate-fade-in">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileCheck size={16} className="text-emerald-600" />
                  <span>Recommended Sales Spreadsheet Format</span>
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  TimeLogic automatically identifies dates, items, quantities, and sales amounts from your everyday files.
                </p>
              </div>
              <button
                onClick={() => setShowFormatGuide(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs">
              <div className="bg-[#F8FAF9] dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-750">
                <span className="font-bold text-emerald-800 dark:text-emerald-400 block text-[11px]">Date</span>
                <span className="text-[10px] text-slate-400">e.g. 01/09/2026 or daily ledger</span>
              </div>
              <div className="bg-[#F8FAF9] dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-750">
                <span className="font-bold text-emerald-800 dark:text-emerald-400 block text-[11px]">Product Name</span>
                <span className="text-[10px] text-slate-400">Item, Description, Goods</span>
              </div>
              <div className="bg-[#F8FAF9] dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-750">
                <span className="font-bold text-emerald-800 dark:text-emerald-400 block text-[11px]">Quantity</span>
                <span className="text-[10px] text-slate-400">Units sold (e.g. 1, 5, 10)</span>
              </div>
              <div className="bg-[#F8FAF9] dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-750">
                <span className="font-bold text-emerald-800 dark:text-emerald-400 block text-[11px]">Sales Amount</span>
                <span className="text-[10px] text-slate-400">Revenue / Total paid (₦)</span>
              </div>
              <div className="bg-[#F8FAF9] dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-750">
                <span className="font-bold text-slate-700 dark:text-slate-300 block text-[11px]">Cost Price (Opt)</span>
                <span className="text-[10px] text-slate-400">Enables gross profit & margin</span>
              </div>
              <div className="bg-[#F8FAF9] dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-750">
                <span className="font-bold text-slate-700 dark:text-slate-300 block text-[11px]">Category (Opt)</span>
                <span className="text-[10px] text-slate-400">Services, Stationery, Goods</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1 flex-wrap">
              <button
                onClick={() => downloadSalesTemplate('excel')}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm"
              >
                <Download size={14} />
                <span>Download Sample Excel Template (.xlsx)</span>
              </button>
              <button
                onClick={() => downloadSalesTemplate('csv')}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-all"
              >
                <Download size={14} />
                <span>Download Sample CSV (.csv)</span>
              </button>
            </div>
          </div>
        )}

        {/* View Tabs */}
        <div className="flex items-center gap-2 border-b border-black/[0.06] dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-black/[0.04] dark:border-slate-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 size={15} className={activeTab === 'analytics' ? 'text-emerald-600' : ''} />
            <span>Executive Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('raw')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'raw'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-black/[0.04] dark:border-slate-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers size={15} className={activeTab === 'raw' ? 'text-emerald-600' : ''} />
            <span>Sales Records ({rawTotalRows ? rawTotalRows.toLocaleString() : 'All'})</span>
          </button>

          <button
            onClick={() => setActiveTab('imports')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'imports'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-black/[0.04] dark:border-slate-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileSpreadsheet size={15} className={activeTab === 'imports' ? 'text-emerald-600' : ''} />
            <span>Upload History</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-[14px] bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* ── TAB 1: EXECUTIVE ANALYTICS DASHBOARD ──────────────────────── */}
        {activeTab === 'analytics' && (
          <>
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <RefreshCw size={28} className="animate-spin text-emerald-600" />
                <p className="text-xs font-medium">Computing sales intelligence metrics...</p>
              </div>
            )}

            {!loading && !dashboard?.hasData && (
              <div className="bg-white dark:bg-slate-900 rounded-[18px] p-12 text-center border border-black/[0.04] dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] max-w-xl mx-auto my-8 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[#EAF7EE] border border-emerald-100 dark:border-emerald-900/40 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <TrendingUp size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Understand How Your Business Is Performing</h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                  Upload the sales record you normally use for your business (.xlsx, .xlsm, .csv, or SQLite .db). TimeLogic will automatically inspect it, analyze your sales, and explain the results in plain language.
                </p>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all"
                  >
                    <UploadCloud size={16} />
                    <span>Upload Sales File</span>
                  </button>
                  <button
                    onClick={() => setShowFormatGuide(true)}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all"
                  >
                    <FileCheck size={16} className="text-emerald-600" />
                    <span>See Expected Format</span>
                  </button>
                </div>
              </div>
            )}

            {!loading && dashboard?.hasData && (
              <div className="space-y-6 animate-fade-in">

                {/* ── ROW 1: FIVE METRIC CARDS (INCLUDING DEDICATED PROFIT BOX) ─ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
                  
                  {/* Card 1: Total Sales */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-[18px] border border-black/[0.04] dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Sales</span>
                        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-750 flex items-center justify-center text-slate-700 dark:text-slate-300">
                          <TrendingUp size={15} className="text-slate-800 dark:text-slate-200" />
                        </div>
                      </div>
                      <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 dark:text-white mt-2">
                        ₦{dashboard.kpis.totalRevenue?.toLocaleString()}
                      </p>
                    </div>

                    <div className="pt-4 mt-1 border-t border-slate-100/60 dark:border-slate-800/60">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF7EE] text-[#16A34A] border border-[#DCF1E2]">
                        <ArrowUpRight size={12} />
                        <span>+8.4% vs Prev</span>
                      </span>
                    </div>
                  </div>

                  {/* Card 2: Total Profit (Dedicated Profit Box!) */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-[18px] border border-black/[0.04] dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Profit</span>
                        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-750 flex items-center justify-center text-slate-700 dark:text-slate-300">
                          <DollarSign size={15} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                      </div>
                      {dashboard.kpis.hasCostData ? (
                        <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 dark:text-white mt-2">
                          ₦{dashboard.kpis.totalProfit?.toLocaleString()}
                        </p>
                      ) : (
                        <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-400 dark:text-slate-500 mt-2">
                          Unavailable
                        </p>
                      )}
                    </div>

                    <div className="pt-4 mt-1 border-t border-slate-100/60 dark:border-slate-800/60">
                      {dashboard.kpis.hasCostData ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF7EE] text-[#16A34A] border border-[#DCF1E2]">
                          <ArrowUpRight size={12} />
                          <span>{dashboard.kpis.profitMargin}% Margin</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60">
                          <AlertTriangle size={11} />
                          <span>No Cost Data</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card 3: Units Sold */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-[18px] border border-black/[0.04] dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Units Sold</span>
                        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-750 flex items-center justify-center text-slate-700 dark:text-slate-300">
                          <Package size={15} className="text-slate-800 dark:text-slate-200" />
                        </div>
                      </div>
                      <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 dark:text-white mt-2">
                        {dashboard.kpis.totalUnitsSold?.toLocaleString()}
                      </p>
                    </div>

                    <div className="pt-4 mt-1 border-t border-slate-100/60 dark:border-slate-800/60">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF7EE] text-[#16A34A] border border-[#DCF1E2]">
                        <ArrowUpRight size={12} />
                        <span>Volume • Active</span>
                      </span>
                    </div>
                  </div>

                  {/* Card 4: Transactions */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-[18px] border border-black/[0.04] dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Transactions</span>
                        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-750 flex items-center justify-center text-slate-700 dark:text-slate-300">
                          <ShoppingCart size={15} className="text-slate-800 dark:text-slate-200" />
                        </div>
                      </div>
                      <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 dark:text-white mt-2">
                        {dashboard.kpis.totalTransactions?.toLocaleString()}
                      </p>
                    </div>

                    <div className="pt-4 mt-1 border-t border-slate-100/60 dark:border-slate-800/60">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF7EE] text-[#16A34A] border border-[#DCF1E2]">
                        <ArrowUpRight size={12} />
                        <span>Orders Processed</span>
                      </span>
                    </div>
                  </div>

                  {/* Card 5: Average Order Value */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-[18px] border border-black/[0.04] dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Average Order Value</span>
                        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-750 flex items-center justify-center text-slate-700 dark:text-slate-300">
                          <CreditCard size={15} className="text-slate-800 dark:text-slate-200" />
                        </div>
                      </div>
                      <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 dark:text-white mt-2">
                        ₦{dashboard.kpis.averageOrderValue?.toLocaleString()}
                      </p>
                    </div>

                    <div className="pt-4 mt-1 border-t border-slate-100/60 dark:border-slate-800/60">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF7EE] text-[#16A34A] border border-[#DCF1E2]">
                        <ArrowUpRight size={12} />
                        <span>Per Order (AOV)</span>
                      </span>
                    </div>
                  </div>

                </div>

                {/* Dismissible Profit Notice (when cost price is not provided) */}
                {!dashboard.kpis.hasCostData && showProfitNotice && (
                  <div className="p-4 rounded-[16px] bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-amber-900/40 shadow-sm flex items-start justify-between gap-3 animate-fade-in">
                    <div className="flex items-start gap-3">
                      <Info size={17} className="text-amber-500 shrink-0 mt-0.5" />
                      <div className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                        <span className="font-bold text-slate-900 dark:text-white mr-1.5">
                          Profit information isn't available yet:
                        </span>
                        Your sales file contains revenue information, but product costs were not found. You can still see your sales performance and best-selling products below. To unlock gross profit and margin calculations, simply include a cost price column in your future records.
                      </div>
                    </div>
                    <button
                      onClick={() => setShowProfitNotice(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg shrink-0 transition-colors"
                      title="Dismiss notice"
                    >
                      <X size={15} />
                    </button>
                  </div>
                )}

                {/* ── ROW 2: SALES PERFORMANCE (~64%) & TOP PRODUCTS (~36%) ─ */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  
                  {/* Left: Sales Performance Overview (~64% width / 8 cols) */}
                  <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-[18px] p-5 sm:p-6 border border-black/[0.04] dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                    
                    {/* Header with Title and Big Stat */}
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Sales Performance</h3>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            ₦{dashboard.kpis.totalRevenue?.toLocaleString()}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF7EE] text-[#16A34A] border border-[#DCF1E2]">
                            <ArrowUpRight size={12} />
                            <span>+8.4%</span>
                          </span>
                        </div>
                      </div>

                      {/* Channel / Category Pills (Reference Style) */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {dashboard.categoryPerformance?.slice(0, 2).map((cat: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F8FAF9] dark:bg-slate-800 border border-slate-100 dark:border-slate-750 text-xs"
                          >
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{cat.name}</span>
                            <span className="text-slate-400 font-mono">₦{cat.revenue?.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Chart Legend */}
                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Highest Sales (Peak)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                        <span>Daily Sales</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-[11px] text-slate-400 border-l border-slate-200 dark:border-slate-800 pl-3">
                        <span className="font-medium">On Hover:</span>
                        <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
                          <span className="w-2 h-2 rounded-full bg-blue-600" /> Blue (Highest)
                        </span>
                        <span className="inline-flex items-center gap-1 text-red-500 dark:text-red-400 font-semibold">
                          <span className="w-2 h-2 rounded-full bg-red-500" /> Red (Lowest)
                        </span>
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                          <span className="w-2 h-2 rounded-full bg-emerald-600" /> Green (Standard)
                        </span>
                      </div>
                    </div>

                    {/* Recharts Bar Chart */}
                    <div className="h-[270px] w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={enrichedDailyTrend}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                          onMouseMove={(state: any) => {
                            if (state && typeof state.activeTooltipIndex === 'number') {
                              setHoveredBarIndex(state.activeTooltipIndex);
                            }
                          }}
                          onMouseLeave={() => setHoveredBarIndex(null)}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#F1F5F9'} />
                          <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#64748B' }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: isDark ? '#94A3B8' : '#64748B' }}
                            tickFormatter={(val) => `₦${(val / 1000).toFixed(0)}k`}
                          />
                          <Tooltip cursor={false} content={<CustomBarTooltip />} />
                          <Bar
                            dataKey="revenue"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={28}
                          >
                            {enrichedDailyTrend.map((entry: any, index: number) => {
                              const isPeak = entry._isPeak;
                              const isLowest = entry._isLowest;
                              const isHovered = hoveredBarIndex === index;

                              // Resting state: peak is colored orange (#F97316 - the way it is now), others are neutral
                              let barFill = isPeak ? '#F97316' : (isDark ? '#334155' : '#CBD5E1');

                              // Hover state: blue for highest, red for lowest, and matching emerald green for remaining
                              if (isHovered) {
                                if (isPeak) {
                                  barFill = '#2563EB'; // Blue for highest
                                } else if (isLowest) {
                                  barFill = '#EF4444'; // Red for lowest
                                } else {
                                  barFill = '#10B981'; // Matching emerald green for remaining
                                }
                              }

                              return (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={barFill}
                                  onMouseEnter={() => setHoveredBarIndex(index)}
                                  onMouseLeave={() => setHoveredBarIndex(null)}
                                  className="transition-colors duration-150 cursor-pointer"
                                />
                              );
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                  </div>

                  {/* Right: Top Products (~36% width / 4 cols) */}
                  <div
                    id="top-products-section"
                    className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-[18px] p-5 sm:p-6 border border-black/[0.04] dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between"
                  >
                    <div>
                      {/* Header with Title and Mode Switcher */}
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Top Products</h3>
                        
                        {/* Filter Pill Selector */}
                        <select
                          value={productRankingMode}
                          onChange={(e: any) => setProductRankingMode(e.target.value)}
                          className="bg-[#F8FAF9] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                        >
                          <option value="revenue">Highest Revenue</option>
                          <option value="units">Best-Selling (Units)</option>
                          {dashboard.kpis.hasCostData && (
                            <option value="profit">Most Profitable</option>
                          )}
                        </select>
                      </div>

                      {/* Top 5 Products List */}
                      <div className="space-y-3.5">
                        {currentTopProducts.slice(0, 5).map((p: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-[#F8FAF9] dark:hover:bg-slate-800/60 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-[#F1F6F2] dark:bg-slate-800 border border-slate-100 dark:border-slate-750 flex items-center justify-center shrink-0">
                                {getProductCategoryIcon(p.name, p.category)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[160px]">
                                  {p.name}
                                </p>
                                <p className="text-[11px] text-slate-400 truncate max-w-[160px] mt-0.5">
                                  {p.category || 'General'} • {p.unitsSold?.toLocaleString()} sold
                                </p>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                                ₦{(productRankingMode === 'profit' && p.profit !== undefined ? p.profit : p.revenue)?.toLocaleString()}
                              </p>
                              {p.shareOfRevenue && (
                                <span className="text-[10px] text-emerald-600 font-semibold block">
                                  {p.shareOfRevenue}% share
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* View All Action */}
                    <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                      <button
                        onClick={() => setActiveTab('raw')}
                        className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 inline-flex items-center gap-1 transition-colors"
                      >
                        <span>View All Products in Catalog</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>

                  </div>

                </div>

                {/* ── ROW 3: SALES TREND & MONTHLY PERFORMANCE ───────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  
                  {/* Left: Customer Orders / Sales Trend (~42% / 5 cols) */}
                  <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-[18px] p-5 sm:p-6 border border-black/[0.04] dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Customer Orders</h3>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {dashboard.period?.label || 'Recorded Period'}
                          </p>
                        </div>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#EAF7EE] text-[#16A34A] border border-[#DCF1E2]">
                          +9.4% ↗
                        </span>
                      </div>

                      <div className="flex items-baseline gap-3 mt-3">
                        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                          {dashboard.kpis.totalTransactions?.toLocaleString()}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          Total Orders
                        </span>
                      </div>
                    </div>

                    {/* Recharts Area Chart */}
                    <div className="h-[210px] w-full pt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={dashboard.dailyTrend || []}
                          margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#F8FAFC'} />
                          <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: isDark ? '#94A3B8' : '#64748B' }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: isDark ? '#94A3B8' : '#64748B' }}
                          />
                          <Tooltip cursor={false} content={<CustomTrendTooltip />} />
                          <Area
                            type="monotone"
                            dataKey="transactions"
                            stroke="#8B5CF6"
                            strokeWidth={2.5}
                            fill="url(#purpleGradient)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Peak Day Summary */}
                    {dashboard.bestDay && (
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                        <span>Strongest order day:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {dashboard.bestDay.date} ({dashboard.bestDay.transactions} orders)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right: Monthly Performance (Replaces Country Map!) (~58% / 7 cols) */}
                  <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-[18px] p-5 sm:p-6 border border-black/[0.04] dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Monthly Performance</h3>
                          <p className="text-[11px] text-slate-400 mt-0.5">Keep track of all sales across billing cycles</p>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#F8FAF9] dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700">
                          {periods.months?.length || 1} Period(s) Recorded
                        </span>
                      </div>

                      {/* Performance Highlights Callout */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-[#F8FAF9] dark:bg-slate-800/80 border border-slate-100 dark:border-slate-750">
                          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Top Performing Month</p>
                          <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">
                            {periods.latestPeriod?.label || 'Current Period'}
                          </p>
                          <p className="text-xs font-bold text-emerald-600 mt-0.5">
                            ₦{periods.latestPeriod?.totalRevenue?.toLocaleString()}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-[#F8FAF9] dark:bg-slate-800/80 border border-slate-100 dark:border-slate-750">
                          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Average Order Value</p>
                          <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">
                            ₦{dashboard.kpis.averageOrderValue?.toLocaleString()}
                          </p>
                          <p className="text-xs font-medium text-slate-400 mt-0.5">
                            Across all {dashboard.kpis.totalTransactions?.toLocaleString()} orders
                          </p>
                        </div>
                      </div>

                      {/* Recharts Monthly Performance Bar Chart */}
                      <div className="h-[180px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={dashboard.monthlyComparison || periods.months || []}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#F1F5F9'} />
                            <XAxis
                              dataKey="label"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#64748B' }}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: isDark ? '#94A3B8' : '#64748B' }}
                              tickFormatter={(val) => `₦${(val / 1000).toFixed(0)}k`}
                            />
                            <Tooltip cursor={false} content={<CustomMonthTooltip />} />
                            <Bar
                              dataKey="totalRevenue"
                              fill="#10B981"
                              radius={[6, 6, 0, 0]}
                              onClick={(entry: any) => {
                                const item = entry?.payload || entry;
                                if (item && item.year && item.month) {
                                  handlePeriodChange(item.year, item.month);
                                }
                              }}
                              className="cursor-pointer hover:opacity-80 transition-opacity"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-2 text-center">
                      Click any month bar to explore its day-by-day sales breakdown
                    </p>
                  </div>

                </div>

                {/* ── ROW 4: "WHAT TIMELOGIC FOUND" (BUSINESS INSIGHTS) ──── */}
                {(dashboard.businessInsights?.length > 0 || dashboard.alerts?.length > 0) && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-emerald-600" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        What TimeLogic Found
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {dashboard.alerts?.map((a: any) => (
                        <div
                          key={a.id}
                          className="p-4 rounded-[16px] bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-amber-900/40 shadow-sm flex items-start gap-3"
                        >
                          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{a.title}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                              {a.text}
                            </p>
                          </div>
                        </div>
                      ))}

                      {dashboard.businessInsights?.filter((i: any) => i.id !== 'no-cost-data').map((ins: any) => (
                        <div
                          key={ins.id}
                          className="p-4 rounded-[16px] bg-white dark:bg-slate-900 border border-black/[0.04] dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-start gap-3"
                        >
                          <Sparkles size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{ins.title}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                              {ins.text}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </>
        )}

        {/* ── TAB 2: RAW TRANSACTIONS EXPLORER ──────────────────────────── */}
        {activeTab === 'raw' && (
          <div className="bg-white dark:bg-slate-900 rounded-[18px] p-5 sm:p-6 border border-black/[0.04] dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Individual Sales Records</h3>
                <p className="text-xs text-slate-400">
                  {rawTotalRows.toLocaleString()} transaction line items in selected period
                </p>
              </div>

              {/* Search and Filters */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={rawSearch}
                    onChange={(e) => setRawSearch(e.target.value)}
                    placeholder="Search product or reference..."
                    className="pl-9 pr-3 py-1.5 rounded-xl bg-[#F8FAF9] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-56"
                  />
                  {rawSearch && (
                    <button
                      onClick={() => setRawSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => downloadSalesExcel({ year: selectedPeriod.year, month: selectedPeriod.month })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <Download size={13} />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Quantity</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Sales Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {rawLoading && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        <RefreshCw size={20} className="animate-spin inline mr-2 text-emerald-600" />
                        Loading transaction records...
                      </td>
                    </tr>
                  )}
                  {!rawLoading && rawTransactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No sales transactions found for this search criteria.
                      </td>
                    </tr>
                  )}
                  {!rawLoading && rawTransactions.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-[#F8FAF9] dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {tx.transactionDate ? String(tx.transactionDate).slice(0, 10) : '-'}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {tx.productName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px]">
                          {tx.categoryName || 'General'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                        {tx.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                        ₦{tx.unitPrice?.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-900 dark:text-white">
                        ₦{tx.revenue?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {rawTotalPages > 1 && (
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-400">
                  Page {rawPage} of {rawTotalPages} ({rawTotalRows.toLocaleString()} total)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadRawData(rawPage - 1)}
                    disabled={rawPage <= 1 || rawLoading}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-30 hover:bg-slate-50"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => loadRawData(rawPage + 1)}
                    disabled={rawPage >= rawTotalPages || rawLoading}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-30 hover:bg-slate-50"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: UPLOAD HISTORY ────────────────────────────────────── */}
        {activeTab === 'imports' && (
          <div className="bg-white dark:bg-slate-900 rounded-[18px] p-5 sm:p-6 border border-black/[0.04] dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Sales Import History</h3>
                <p className="text-xs text-slate-400">
                  {importHistory.length} sales ledger batches uploaded into TimeLogic
                </p>
              </div>

              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all"
              >
                <UploadCloud size={14} />
                <span>Upload Sales File</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                    <th className="py-2.5 px-3">File Name</th>
                    <th className="py-2.5 px-3">Format</th>
                    <th className="py-2.5 px-3">Detected Period</th>
                    <th className="py-2.5 px-3 text-right">Imported</th>
                    <th className="py-2.5 px-3 text-right">Skipped (Dup)</th>
                    <th className="py-2.5 px-3">Uploaded At</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {importsLoading && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        <RefreshCw size={20} className="animate-spin inline mr-2 text-emerald-600" />
                        Loading upload history...
                      </td>
                    </tr>
                  )}
                  {!importsLoading && importHistory.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No sales import batches found yet.
                      </td>
                    </tr>
                  )}
                  {!importsLoading && importHistory.map((b: any) => (
                    <tr key={b.id} className="hover:bg-[#F8FAF9] dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200 max-w-xs truncate">
                        {b.fileName}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                          {b.fileFormat || 'EXCEL'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-emerald-700 dark:text-emerald-400">
                        {b.detectedPeriod || 'Historical'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                        +{b.importedRows?.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                        {b.skippedRows?.toLocaleString() || 0}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                        {b.uploadedAt ? new Date(b.uploadedAt).toLocaleString() : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleDeleteBatch(b.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete this import batch"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ── ZERO-FRICTION MULTI-FILE UPLOAD MODAL ──────────────────────── */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[20px] max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-5 animate-scale-in">
            
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Upload Sales Record</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload the sales file you normally use. TimeLogic analyzes it automatically.
                </p>
              </div>
              <button
                onClick={resetUploadModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            {uploadError && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* STEP 1: Select File */}
            {uploadStep === 'select' && (
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-emerald-200 dark:border-emerald-900/60 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-8 text-center cursor-pointer transition-all bg-[#F8FAF9] dark:bg-slate-800/40 hover:bg-[#F1F6F2] group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".xlsx,.xlsm,.xlsb,.xls,.csv,.tsv,.db,.sqlite,.sqlite3,.json"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mx-auto text-emerald-600 mb-3 group-hover:scale-105 transition-transform">
                    <UploadCloud size={24} />
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Click to choose your sales file (or select multiple daily files)
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Excel (.xlsx, .xlsm, .xls) • CSV • SQLite • JSON
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>Automatic Intelligence</span>
                  </div>
                  <p className="text-slate-400">
                    You can select 1 or 30 daily files at once. TimeLogic automatically detects dates, separates days, removes duplicates, and updates monthly reporting.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 2: Processing */}
            {uploadStep === 'uploading' && (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin mx-auto" />
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Analyzing {selectedFileName}...
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Extracting transactions, grouping by day/month, and preventing duplicates
                  </p>
                </div>
              </div>
            )}

            {/* STEP 3: Complete / Success */}
            {uploadStep === 'complete' && importSummary && (
              <div className="space-y-4 text-center py-2 animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={28} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {importSummary.data?.totalFiles > 1
                      ? `${importSummary.data.totalFiles} Sales Files Processed Successfully`
                      : 'Sales Records Imported Successfully'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">Historical analytics and monthly dashboard updated</p>
                </div>

                <div className="p-4 rounded-xl bg-[#F8FAF9] dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs space-y-2 text-left">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Period(s) Updated:</span>
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
                      {importSummary.data?.detectedPeriod || importSummary.detectedPeriod}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">New records imported:</span>
                    <span className="font-extrabold text-emerald-600">
                      +{(importSummary.data?.importedRows ?? importSummary.importedRows ?? 0).toLocaleString()} transactions
                    </span>
                  </div>
                  {(importSummary.data?.totalRevenue ?? importSummary.totalRevenue) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Sales Value:</span>
                      <span className="font-extrabold text-slate-900 dark:text-white font-mono">
                        ₦{(importSummary.data?.totalRevenue ?? importSummary.totalRevenue).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {(importSummary.data?.skippedRows ?? importSummary.skippedRows ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Duplicate records skipped:</span>
                      <span className="font-bold text-slate-400">
                        {(importSummary.data?.skippedRows ?? importSummary.skippedRows).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={resetUploadModal}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all"
                >
                  View Business Dashboard
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
