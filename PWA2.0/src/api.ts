import { API_URL } from './config';

let accessToken = localStorage.getItem('timelogic_admin_access');
let refreshPromise: Promise<boolean> | null = null;

export function getAccessToken() { return accessToken; }
export function clearSession() {
  accessToken = null;
  localStorage.removeItem('timelogic_admin_access');
  localStorage.removeItem('timelogic_admin_refresh');
}

async function refresh(): Promise<boolean> {
  const token = localStorage.getItem('timelogic_admin_refresh');
  if (!token) return false;
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: token }),
    }).then(async (response) => {
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.data?.accessToken) return false;
      accessToken = body.data.accessToken;
      localStorage.setItem('timelogic_admin_access', body.data.accessToken);
      return true;
    }).catch(() => false).finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error('Cannot reach the TimeLogic backend. Check your connection.');
  }
  const body = await response.json().catch(() => null);
  if (response.status === 401 && retry && !path.includes('/auth/')) {
    if (await refresh()) return request<T>(path, options, false);
    clearSession();
    throw new Error('Your session expired. Please sign in again.');
  }
  if (!response.ok) throw new Error(body?.message || `Request failed (${response.status})`);
  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(data) }),
};

export async function login(identifier: string, password: string) {
  const body = identifier.includes('@') ? { email: identifier, password } : { employeeCode: identifier, password };
  const response = await api.post<{ data: { accessToken: string; refreshToken: string; user: AdminUser } }>('/auth/login', body);
  if (!['ADMIN', 'SUPER_ADMIN'].includes(response.data.user.role)) throw new Error('Only administrator accounts can use this station.');
  accessToken = response.data.accessToken;
  localStorage.setItem('timelogic_admin_access', response.data.accessToken);
  localStorage.setItem('timelogic_admin_refresh', response.data.refreshToken);
  return response.data.user;
}

export interface AdminUser { id: string; firstName: string; lastName: string; role: string; orgId: string; organization?: Organization }
export interface Organization { id: string; name: string; allowManualCheckIn: boolean; timezone?: string | null }
export interface Attendance { sessionId?: string; clockInTime?: string | null; clockOutTime?: string | null; status?: string | null; penalty?: number | null; session?: { office?: { timezone?: string | null } | null } | null }
export interface Employee { id: string; firstName: string; lastName: string; employeeCode?: string | null; department?: { name?: string | null } | string | null; checkInMethod: string; attendance?: Attendance | null }
export interface Session { id: string; sessionName?: string | null; office?: { name?: string | null; timezone?: string | null } | string | null; startTime?: string | null; endTime?: string | null }
export interface Dashboard { enabled: boolean; serverTime: string; organization: Organization; activeSessions: Session[]; selectedSession: Session | null; employees: Employee[]; total?: number; totalPages?: number }
export interface ActionResult { record?: Attendance; status?: string; penalty?: number; clockInTime?: string; clockOutTime?: string; serverTime?: string }

export async function getMe() { return (await api.get<{ data: AdminUser }>('/auth/me')).data; }
export async function getDashboard(sessionId?: string, search?: string) {
  const query = new URLSearchParams({ page: '1', limit: '200' });
  if (sessionId) query.set('sessionId', sessionId);
  if (search) query.set('search', search);
  return (await api.get<{ data: Dashboard }>(`/admin/manual-attendance?${query}`)).data;
}
export async function manualCheckIn(employeeId: string, sessionId: string, password: string) {
  return (await api.post<{ data: ActionResult }>('/admin/manual-attendance/check-in', { employeeId, sessionId, password })).data;
}
export async function manualCheckOut(employeeId: string, sessionId: string | undefined, password: string) {
  return (await api.post<{ data: ActionResult }>('/admin/manual-attendance/check-out', { employeeId, sessionId, password })).data;
}
