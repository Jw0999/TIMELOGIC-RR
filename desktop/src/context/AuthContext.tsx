import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, setToken, getToken, setActiveOrgId, getActiveOrgId } from '../services/api';
import { fetchOrganizations } from '../services';
import type { AdminOrganization, AdminUser } from '../types/api';

interface AuthCtx {
  user: AdminUser | null;
  organization: AdminOrganization | null;
  organizations: any[];
  loading: boolean;
  login: (identifier: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  switchOrganization: (orgId: string) => void;
  serverNow: Date | null;
  organizationTimezone: string;
  currentTime: () => Date | null;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  organization: null,
  organizations: [],
  loading: true,
  login: async () => ({ ok: false, error: 'Authentication is unavailable.' }),
  logout: () => {},
  switchOrganization: () => {},
  serverNow: null,
  organizationTimezone: 'Africa/Lagos',
  currentTime: () => null,
});

function normalizeUser(raw: AdminUser, overrideOrg?: any): AdminUser {
  const organization = overrideOrg || raw.organization;
  const isSuper = raw.role === 'SUPER_ADMIN';
  return {
    ...raw,
    organization: {
      id: organization?.id ?? raw.orgId,
      name: organization?.name ?? 'Organization',
      allowDeviceCheckIn: organization?.allowDeviceCheckIn ?? true,
      allowManualCheckIn: isSuper ? true : (organization?.allowManualCheckIn ?? false),
      hasStudents: isSuper ? true : (organization?.hasStudents ?? false),
      openingTime: organization?.openingTime ?? null,
      timezone: organization?.timezone ?? null,
    },
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverNow, setServerNow] = useState<Date | null>(null);
  const [serverNowAt, setServerNowAt] = useState(0);

  const syncServerTime = async () => {
    const response = await api.get<{ success: boolean; data?: { now?: string } }>('/reports/server-time');
    const next = response.data?.now ? new Date(response.data.now) : null;
    if (next && !Number.isNaN(next.getTime())) {
      setServerNow(next);
      setServerNowAt(Date.now());
    }
  };

  const switchOrganization = (orgId: string) => {
    setActiveOrgId(orgId);
    const target = organizations.find((o: any) => o.id === orgId);
    if (target && user) {
      setUser(normalizeUser(user, target));
    }
  };

  // Restore session on mount
  useEffect(() => {
    const token = getToken();
    if (token) {
      api.get<{ success: boolean; data: AdminUser }>('/auth/me')
        .then((res) => {
          if (res.data && ['ADMIN', 'SUPER_ADMIN'].includes(res.data.role)) {
            setUser(normalizeUser(res.data));
          } else {
            setToken(null);
          }
        })
        .catch(() => {
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // For SUPER_ADMIN, fetch organizations and auto-select primary client organization
  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      fetchOrganizations()
        .then((orgs: any[]) => {
          setOrganizations(orgs);
          const currentActive = getActiveOrgId();
          const target = orgs.find((o: any) => o.id === currentActive)
            || orgs.find((o: any) => o.id !== 'platform-org' && (o.students?.length || o._count?.students || o.name?.includes('BEAMON')))
            || orgs.find((o: any) => o.id !== 'platform-org')
            || orgs[0];
          if (target) {
            setActiveOrgId(target.id);
            setUser((prev) => prev ? normalizeUser(prev, target) : null);
          }
        })
        .catch(() => {});
    }
  }, [user?.role]);

  // Listen for 401 events emitted by the api client
  useEffect(() => {
    const handler = () => { setUser(null); setLoading(false); };
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, []);

  // Capability changes are controlled by the Super Admin web app. Refresh them
  // while this Desktop session is open so tabs and employee-method choices stay current.
  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    const refreshUser = async () => {
      try {
        const response = await api.get<{ success: boolean; data: AdminUser }>('/auth/me');
        if (active && response.data && ['ADMIN', 'SUPER_ADMIN'].includes(response.data.role)) {
          const currentActive = getActiveOrgId();
          const targetOrg = organizations.find((o: any) => o.id === currentActive);
          setUser(normalizeUser(response.data, targetOrg));
        }
      } catch { /* the shared API client handles expired sessions */ }
    };
    const timer = window.setInterval(() => void refreshUser(), 30_000);
    const onFocus = () => void refreshUser();
    const clockTimer = window.setInterval(() => void syncServerTime().catch(() => {}), 30_000);
    void syncServerTime().catch(() => {});
    window.addEventListener('focus', onFocus);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.clearInterval(clockTimer);
      window.removeEventListener('focus', onFocus);
    };
  }, [user?.id, organizations]);

  const login = async (identifier: string, password: string) => {
    try {
      const isEmail = identifier.includes('@');
      const body = isEmail
        ? { email: identifier, password }
        : { employeeCode: identifier, password };

      const res = await api.post<{
        success: boolean;
        data: { accessToken: string; refreshToken: string; user: AdminUser };
      }>('/auth/login', body);

      if (!['ADMIN', 'SUPER_ADMIN'].includes(res.data.user.role)) {
        setToken(res.data.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        await api.post('/auth/logout', { refreshToken: res.data.refreshToken }).catch(() => {});
        setToken(null);
        localStorage.removeItem('refreshToken');
        return { ok: false, error: 'Employee accounts must use the Android app or employee PWA.' };
      }

      // Save both tokens
      setToken(res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);

      setUser(normalizeUser(res.data.user));
      void syncServerTime().catch(() => {});
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in.';
      return {
        ok: false,
        error: message === 'Invalid credentials'
          ? 'Invalid credentials. Check your email/code and password.'
          : message,
      };
    }
  };

  const logout = () => {
    const refresh = localStorage.getItem('refreshToken');
    if (refresh) {
      api.post('/auth/logout', { refreshToken: refresh }).catch(() => {});
    }
    setToken(null);
    setActiveOrgId(null);
    localStorage.removeItem('refreshToken');
    setUser(null);
    setServerNow(null);
    setServerNowAt(0);
  };

  const currentTime = () => serverNow ? new Date(serverNow.getTime() + Math.max(0, Date.now() - serverNowAt)) : null;

  return (
    <AuthContext.Provider value={{
      user,
      organization: user?.organization ?? null,
      organizations,
      loading,
      login,
      logout,
      switchOrganization,
      serverNow,
      organizationTimezone: user?.organization?.timezone || 'Africa/Lagos',
      currentTime,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
