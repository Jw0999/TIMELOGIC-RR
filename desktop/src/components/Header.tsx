import React, { useState, useEffect, useRef } from 'react';
import { Bell, Sun, Moon, Monitor, X, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme, Theme } from '../context/ThemeContext';
import { api } from '../services/api';

interface Props { title: string; subtitle?: string; action?: React.ReactNode }

export default function Header({ title, subtitle, action }: Props) {
  const { user, organization, organizations, switchOrganization } = useAuth();
  const { theme, setTheme } = useTheme();
  const [showTheme, setShowTheme] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs] = useState<any[]>([]);
  const themeRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showNotifs) {
      api.get<any>('/admin/notifications').then((r) => setNotifs(r.data ?? [])).catch(() => {});
    }
  }, [showNotifs]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) setShowTheme(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const THEMES: { key: Theme; label: string; icon: React.ReactNode }[] = [
    { key: 'light',  label: 'Light',  icon: <Sun size={15} /> },
    { key: 'dark',   label: 'Dark',   icon: <Moon size={15} /> },
    { key: 'system', label: 'System', icon: <Monitor size={15} /> },
  ];

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-[var(--card-bg)] border-b border-[var(--border)] transition-colors gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-[var(--text-main)] truncate">{title}</h1>
        {subtitle && <p className="text-sm text-[var(--text-muted)] mt-0.5 truncate">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
        {user?.role === 'SUPER_ADMIN' && organizations?.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] shadow-sm">
            <Building2 size={15} className="text-primary-600 shrink-0" />
            <select
              value={organization?.id || ''}
              onChange={(e) => switchOrganization(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[var(--text-main)] focus:outline-none cursor-pointer"
            >
              {organizations.filter((o: any) => o.id !== 'platform-org').map((o: any) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {action}

        {/* Theme */}
        <div ref={themeRef} className="relative">
          <button onClick={() => setShowTheme(!showTheme)}
            className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-muted)] transition-colors">
            {theme === 'dark' ? <Moon size={18} /> : theme === 'light' ? <Sun size={18} /> : <Monitor size={18} />}
          </button>
          {showTheme && (
            <div className="absolute right-0 top-10 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl shadow-lg py-1 w-36 z-50">
              {THEMES.map((t) => (
                <button key={t.key} onClick={() => { setTheme(t.key); setShowTheme(false); }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--hover-bg)] ${theme === t.key ? 'text-primary-600 font-semibold' : 'text-[var(--text-main)]'}`}>
                  {t.icon}{t.label}
                  {theme === t.key && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button onClick={() => setShowNotifs(!showNotifs)}
            className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-muted)] transition-colors relative">
            <Bell size={18} />
            {notifs.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />}
          </button>
          {showNotifs && (
            <div className="absolute right-0 top-10 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl shadow-lg w-72 z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                <p className="font-semibold text-sm text-[var(--text-main)]">Notifications</p>
                <button onClick={() => setShowNotifs(false)} className="text-[var(--text-muted)]"><X size={14} /></button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifs.length === 0
                  ? <p className="text-center text-sm text-[var(--text-muted)] py-8">No recent notifications</p>
                  : notifs.map((n: any, i: number) => (
                    <div key={i} className="px-4 py-3 border-b border-[var(--border)] hover:bg-[var(--hover-bg)] transition-colors">
                      <p className="text-sm font-medium text-[var(--text-main)]">{n.title ?? n.channel}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{n.message ?? n.content}</p>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>

        {/* User */}
        <div className="flex items-center gap-2 pl-3 border-l border-[var(--border)]">
          <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center">
            <span className="text-white text-xs font-bold">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-main)] leading-tight">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-[var(--text-muted)]">{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
