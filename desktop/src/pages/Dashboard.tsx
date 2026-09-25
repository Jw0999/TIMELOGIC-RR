import React, { useEffect, useState } from 'react';
import { Users, CheckCircle, Clock, XCircle, AlertTriangle, ShieldAlert, Activity, Calendar } from 'lucide-react';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import { fetchLiveStats, fetchAlerts } from '../services';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS: Record<string, string> = {
  PRESENT: 'bg-emerald-100 text-emerald-700',
  LATE: 'bg-amber-100 text-amber-700',
  COMPLETELY_LATE: 'bg-red-100 text-red-700',
  ABSENT: 'bg-red-100 text-red-700',
  ON_LEAVE: 'bg-primary-100 text-primary-700',
};

function Spinner() {
  return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent" /></div>;
}

export default function Dashboard() {
  const { serverNow, organizationTimezone } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const today = serverNow
    ? serverNow.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: organizationTimezone })
    : 'Loading current time...';

  const load = () => {
    Promise.all([fetchLiveStats(), fetchAlerts()])
      .then(([s, a]) => { setStats(s); setAlerts(Array.isArray(a) ? a.slice(0, 4) : []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // Auto-refresh dashboard every 15 seconds
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Dashboard" subtitle={today} />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {loading ? <Spinner /> : !stats ? (
          <div className="text-center text-slate-400 py-16">Could not load dashboard data. Make sure the backend is running.</div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Employees" value={stats.total ?? 0} icon={Users} color="text-primary-700" bgColor="bg-primary-100" />
              <StatCard label="Present Today" value={stats.present ?? 0} icon={CheckCircle} color="text-emerald-600" bgColor="bg-emerald-100" sub={`${stats.attendanceRate ?? 0}% rate`} />
              <StatCard label="Late Arrivals" value={stats.late ?? 0} icon={Clock} color="text-amber-600" bgColor="bg-amber-100" />
              <StatCard label="Absent" value={stats.absent ?? 0} icon={XCircle} color="text-red-500" bgColor="bg-red-100" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="On Leave" value={stats.onLeave ?? 0} icon={Calendar} color="text-violet-600" bgColor="bg-violet-100" />
              <StatCard label="Flagged Records" value={stats.flagged ?? 0} icon={AlertTriangle} color="text-orange-600" bgColor="bg-orange-100" />
              <StatCard label="Open Fraud Alerts" value={stats.openAlerts ?? 0} icon={ShieldAlert} color="text-red-600" bgColor="bg-red-100" />
              <StatCard label="Active Sessions" value={stats.activeSessions ?? 0} icon={Activity} color="text-primary-700" bgColor="bg-primary-100" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Attendance breakdown */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h3 className="font-bold text-slate-800 mb-4">Attendance Breakdown</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Present', value: stats.present ?? 0, color: 'bg-emerald-500' },
                    { label: 'Late', value: stats.late ?? 0, color: 'bg-amber-400' },
                    { label: 'Absent', value: stats.absent ?? 0, color: 'bg-red-400' },
                    { label: 'On Leave', value: stats.onLeave ?? 0, color: 'bg-violet-400' },
                  ].map((item) => {
                    const total = (stats.total ?? 1);
                    return (
                      <div key={item.label} className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 w-16 flex-shrink-0">{item.label}</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} rounded-full`} style={{ width: `${(item.value / total) * 100}%` }} />
                        </div>
                        <span className="text-xs font-bold text-slate-700 w-6 text-right">{item.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Fraud Alerts */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-50">
                  <h2 className="font-bold text-slate-800">Recent Fraud Alerts</h2>
                </div>
                {alerts.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">No alerts</div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {alerts.map((a: any) => (
                      <div key={a.id} className="px-5 py-3 flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${a.severity === 'HIGH' ? 'bg-red-500' : a.severity === 'MEDIUM' ? 'bg-amber-500' : 'bg-slate-300'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800">{a.employee?.firstName} {a.employee?.lastName}</p>
                          <p className="text-xs text-slate-500 truncate">{a.description}</p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${a.status === 'NEW' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>{a.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
