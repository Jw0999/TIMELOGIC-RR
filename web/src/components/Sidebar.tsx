import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, MapPin, LayoutList,
  Users, Shield, BarChart3, LogOut, Settings, AlertOctagon,
  LucideIcon, Smartphone, Laptop,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MENU_NAV: { to: string; icon: LucideIcon; label: string; badge?: string }[] = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/organizations', icon: Building2,        label: 'Organizations' },
  { to: '/devices',       icon: Laptop,           label: 'Devices' },
  { to: '/offices',       icon: MapPin,           label: 'Offices' },
  { to: '/departments',   icon: LayoutList,       label: 'Departments' },
  { to: '/users',         icon: Users,            label: 'All Users' },
  { to: '/fraud-alerts',  icon: AlertOctagon,     label: 'Fraud Alerts' },
  { to: '/security',      icon: Shield,           label: 'Security' },
  { to: '/reports',       icon: BarChart3,        label: 'Reports' },
];

const GENERAL_NAV: { to: string; icon: LucideIcon; label: string }[] = [
  { to: '/settings', icon: Settings, label: 'Settings' },
];

function NavItem({ to, icon: Icon, label, badge, onClick }: { to: string; icon: LucideIcon; label: string; badge?: string; onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
          isActive
            ? 'bg-primary-700 text-white shadow-sm'
            : 'text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-main)]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
          )}
          <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} className="flex-shrink-0" />
          <span className="flex-1">{label}</span>
          {badge && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
              isActive ? 'bg-white/25 text-white' : 'bg-primary-100 text-primary-700'
            }`}>{badge}</span>
          )}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ open = false, onClose }: { open?: boolean; onClose?: () => void }) {
  const { logout } = useAuth();
  const navigate   = useNavigate();

  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-50 w-[230px] flex flex-col flex-shrink-0 bg-[var(--sidebar-bg)] border-r border-[var(--border)] h-screen overflow-hidden transform transition-transform duration-200 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[var(--border)] flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white border border-[var(--border)] flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
            <img src="/logo.jpg" alt="TimeLogic" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <p className="font-bold text-[15px] text-[var(--text-main)] leading-tight">TimeLogic</p>
            <p className="text-[10px] text-[var(--text-muted)]">Super Admin</p>
          </div>
        </div>
      </div>

      {/* Scrollable nav */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {/* MENU group */}
        <div>
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-3 mb-2">Menu</p>
          <nav className="space-y-0.5">
            {MENU_NAV.map((item) => (
              <NavItem key={item.to} {...item} onClick={onClose} />
            ))}
          </nav>
        </div>

        {/* GENERAL group */}
        <div>
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-3 mb-2">General</p>
          <nav className="space-y-0.5">
            {GENERAL_NAV.map((item) => (
              <NavItem key={item.to} {...item} onClick={onClose} />
            ))}
            <button
              onClick={() => { logout(); navigate('/login'); onClose?.(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:bg-red-50 hover:text-red-600 transition-all"
            >
              <LogOut size={17} strokeWidth={1.8} />
              Logout
            </button>
          </nav>
        </div>
      </div>

      {/* Bottom promo card */}
      <div className="px-3 pb-4 flex-shrink-0">
        <div className="rounded-2xl p-4 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f2d6e 0%, #1d4ed8 100%)' }}>
          {/* Background decoration */}
          <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-4 w-24 h-24 rounded-full bg-white/5" />
          <div className="relative z-10">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-2">
              <Smartphone size={15} className="text-white" />
            </div>
            <p className="font-bold text-[13px] leading-snug mb-0.5">Download our<br />Mobile App</p>
            <p className="text-[10px] text-white/60 mb-3">Get easy attendance tracking</p>
            <button className="w-full bg-primary-500 hover:bg-primary-400 text-white text-xs font-bold py-2 rounded-xl transition-colors">
              Download
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
