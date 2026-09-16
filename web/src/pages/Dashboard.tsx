import React, { useEffect, useState } from 'react';
import { Plus, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import StatCards         from '../components/dashboard/StatCards';
import AttendanceChart   from '../components/dashboard/AttendanceChart';
import OrgList           from '../components/dashboard/OrgList';
import RecentCheckIns    from '../components/dashboard/RecentCheckIns';
import AttendanceGauge   from '../components/dashboard/AttendanceGauge';
import { fetchSystemStats, fetchAllOrgs } from '../services';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats,   setStats]   = useState<any>(null);
  const [orgs,    setOrgs]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    const load = () => Promise.all([
      fetchSystemStats().catch(() => null),
      fetchAllOrgs(),
    ]).then(([s, o]) => { setStats(s); setOrgs(o); setLoadError(''); }).catch((error) => {
      setLoadError(error instanceof Error ? error.message : 'Could not load live Super Admin data.');
    }).finally(() => setLoading(false));
    load();
    const t = setInterval(load, 20_000);
    return () => clearInterval(t);
  }, []);

  const present = stats?.presentToday ?? 0;
  const late    = stats?.lateToday    ?? 0;
  const absent  = (stats?.totalUsers  ?? 0) - present - late;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <Header
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/organizations')}
              className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold px-3 sm:px-4 py-2 rounded-xl transition-colors shadow-md shadow-primary-200/30 flex-shrink-0"
            >
              <Plus size={15} /> <span className="hidden sm:inline">Add Organization</span>
            </button>
            <button className="flex items-center gap-2 border border-[var(--border)] bg-[var(--card-bg)] hover:bg-[var(--hover-bg)] text-[var(--text-main)] text-sm font-semibold px-3 sm:px-4 py-2 rounded-xl transition-colors flex-shrink-0">
              <Upload size={14} /> <span className="hidden sm:inline">Export Data</span>
            </button>
          </div>
        }
      />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5">
        {loadError && <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-300">{loadError} Refresh the page after signing in again.</div>}

        {/* Page heading */}
        <div>
          <h1 className="text-2xl font-black text-[var(--text-main)]">Dashboard</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Monitor organizations, track attendance, and manage your platform.</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{today}</p>
        </div>

        {/* Row 1 — 4 stat cards */}
        <StatCards stats={stats} />

        {/* Row 2 — Analytics | Org List */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-6"><AttendanceChart /></div>
          <div className="col-span-12 lg:col-span-6"><OrgList orgs={orgs} /></div>
        </div>

        {/* Row 3 — Recent check-ins | Attendance gauge */}
        <div className="grid grid-cols-12 gap-4 pb-2">
          <div className="col-span-12 lg:col-span-7"><RecentCheckIns /></div>
          <div className="col-span-12 lg:col-span-5"><AttendanceGauge present={present} late={late} absent={Math.max(0, absent)} /></div>
        </div>

      </div>
    </div>
  );
}
