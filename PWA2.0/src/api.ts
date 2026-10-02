import { API_URL } from './config';
import {
  cacheStationAuth,
  verifyOfflineStationAuth,
  cacheRosterAndSessions,
  getCachedRoster,
  findEmployeeOffline,
  queueOfflineAttendance,
  getStationAuthCache,
} from './offline/db';

let accessToken = localStorage.getItem('timelogic_admin_access');
let refreshPromise: Promise<boolean> | null = null;

export function getAccessToken() {
  if (!accessToken) {
    accessToken = localStorage.getItem('timelogic_admin_access');
  }
  return accessToken;
}

export function clearSession() {
  accessToken = null;
  localStorage.removeItem('timelogic_admin_access');
  localStorage.removeItem('timelogic_admin_refresh');
}

async function refresh(): Promise<boolean> {
  let token = localStorage.getItem('timelogic_admin_refresh');
  if (!token) {
    const cached = await getStationAuthCache().catch(() => null);
    if (cached?.refreshToken) {
      token = cached.refreshToken;
      localStorage.setItem('timelogic_admin_refresh', token);
      if (cached.accessToken) {
        accessToken = cached.accessToken;
        localStorage.setItem('timelogic_admin_access', cached.accessToken);
      }
    }
  }
  if (!token) return false;
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: token }),
    }).then(async (response) => {
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.data?.accessToken) {
        if (response.status === 401 || response.status === 403) {
          return false;
        }
        return false;
      }
      accessToken = body.data.accessToken;
      localStorage.setItem('timelogic_admin_access', body.data.accessToken);
      if (body.data.refreshToken) {
        localStorage.setItem('timelogic_admin_refresh', body.data.refreshToken);
      }
      return true;
    }).catch(() => {
      return false;
    }).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const currentToken = getAccessToken();
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error('Unable to connect to TimeLogic services. Please check your internet connection and try again.');
  }
  const body = await response.json().catch(() => null);
  if (response.status === 401 && retry && !path.includes('/auth/')) {
    if (await refresh()) return request<T>(path, options, false);
    if (navigator.onLine) {
      clearSession();
      throw new Error('Your session expired. Please sign in again.');
    }
    throw new Error('Unable to connect to TimeLogic services. Offline mode active.');
  }
  if (response.status === 403 && body?.code === 'SUBSCRIPTION_EXPIRED') {
    window.dispatchEvent(new CustomEvent('kiosk:subscription_expired', { detail: body }));
  }
  if (!response.ok) {
    const error = new Error(body?.message || `Request failed (${response.status})`) as Error & { code?: string; status?: number };
    error.code = body?.code;
    error.status = response.status;
    throw error;
  }
  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(data) }),
  put: <T>(path: string, data: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(data) }),
};

export function getOrCreateKioskDeviceId(): string {
  let id = localStorage.getItem('timelogic_kiosk_device_id');
  if (!id) {
    id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `kiosk-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('timelogic_kiosk_device_id', id);
  }
  return id;
}

export function getKioskDeviceMeta() {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  let platform = 'PC Terminal';
  if (/windows/i.test(ua)) platform = 'Windows PC';
  else if (/macintosh|mac os x/i.test(ua)) platform = 'macOS Terminal';
  else if (/linux/i.test(ua)) platform = 'Linux Terminal';
  else if (/android/i.test(ua)) platform = 'Android Device';

  const host = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'kiosk';
  const deviceName = `${platform} (${host})`;

  return {
    deviceId: getOrCreateKioskDeviceId(),
    deviceName,
    platform,
  };
}

export async function login(identifier: string, password: string): Promise<AdminUser> {
  const meta = getKioskDeviceMeta();
  const body = identifier.includes('@')
    ? { email: identifier, password, ...meta }
    : { employeeCode: identifier, password, ...meta };

  try {
    const response = await api.post<{ data: { accessToken: string; refreshToken: string; user: AdminUser; boundDevice?: any } }>('/auth/station-login', body);
    if (!['ADMIN', 'SUPER_ADMIN'].includes(response.data.user.role)) throw new Error('Only administrator accounts can use this station.');
    accessToken = response.data.accessToken;
    localStorage.setItem('timelogic_admin_access', response.data.accessToken);
    localStorage.setItem('timelogic_admin_refresh', response.data.refreshToken);

    // Cache credentials and tokens for offline emergency unlocking and persistence
    await cacheStationAuth(response.data.user, identifier, password, {
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
    });

    return response.data.user;
  } catch (error: any) {
    if (!navigator.onLine || error.message?.includes('Unable to connect') || error.message?.includes('Failed to fetch')) {
      const offlineUser = await verifyOfflineStationAuth(identifier, password);
      if (offlineUser) {
        (offlineUser as any).isOffline = true;
        return offlineUser;
      }
      throw new Error('No internet connection. Offline credentials do not match or this station has not been authenticated online yet.');
    }
    throw error;
  }
}

export interface AdminUser { id: string; firstName: string; lastName: string; role: string; orgId: string; organization?: Organization; isOffline?: boolean }
export interface Organization { id: string; name: string; allowManualCheckIn: boolean; hasStudents?: boolean; requireFaceVerification?: boolean; timezone?: string | null }
export interface Attendance { sessionId?: string; clockInTime?: string | null; clockOutTime?: string | null; status?: string | null; penalty?: number | null; session?: { office?: { timezone?: string | null } | null } | null }
export interface Office { id: string; name: string; timezone?: string | null; openTime?: string | null; closeTime?: string | null; breakStart?: string | null; breakEnd?: string | null; breakMinutes?: number | null; graceMinutes?: number | null; lateAfterMinutes?: number | null }
export interface Employee { id: string; firstName: string; lastName: string; email?: string | null; employeeCode?: string | null; profileImageUrl?: string | null; hasFaceEnrolled?: boolean; department?: { name?: string | null } | string | null; officeId?: string | null; office?: Office | { id: string; name: string } | null; shiftType?: string | null; checkInMethod: string; attendance?: Attendance | null }
export interface Session { id: string; sessionName?: string | null; office?: Office | string | null; startTime?: string | null; endTime?: string | null }
export interface Dashboard { enabled: boolean; serverTime: string; organization: Organization; offices?: Office[]; activeSessions: Session[]; selectedSession: Session | null; employees: Employee[]; total?: number; totalPages?: number; isOffline?: boolean }
export interface LiveAttendance { employeeId: string; clockInTime?: string | null; clockOutTime?: string | null; employee?: Employee }
export interface ActionResult { record?: Attendance; status?: string; penalty?: number; clockInTime?: string; clockOutTime?: string; serverTime?: string; isOffline?: boolean }
export interface BreakRecord { id: string; employeeId: string; breakType: string; startTime: string; endTime?: string | null; durationMinutes?: number | null; lifecycleStatus?: string }
export interface Student { id: string; firstName: string; lastName: string; studentCode: string; className?: string | null; status: string; todayAttendance?: { id: string; checkInTime: string; checkOutTime?: string | null } | null }

export async function getMe() {
  if (!accessToken) {
    accessToken = localStorage.getItem('timelogic_admin_access');
    if (!accessToken) {
      const cached = await getStationAuthCache().catch(() => null);
      if (cached?.accessToken) {
        accessToken = cached.accessToken;
        localStorage.setItem('timelogic_admin_access', cached.accessToken);
        if (cached.refreshToken) {
          localStorage.setItem('timelogic_admin_refresh', cached.refreshToken);
        }
      }
    }
  }
  return (await api.get<{ data: AdminUser }>('/auth/me')).data;
}

export async function getDashboard(sessionId?: string, search?: string): Promise<Dashboard> {
  const query = new URLSearchParams({ page: '1', limit: '200' });
  if (sessionId) query.set('sessionId', sessionId);
  if (search) query.set('search', search);

  try {
    const data = (await api.get<{ data: Dashboard }>(`/admin/manual-attendance?${query}`)).data;
    if (data && Array.isArray(data.employees)) {
      cacheRosterAndSessions(data.employees, data.activeSessions || []).catch(() => {});

      // Overlay any still-pending outbox items so local headcount never flickers
      const { getPendingOutbox } = await import('./offline/db');
      const pending = await getPendingOutbox().catch(() => []);
      for (const item of pending) {
        const emp = data.employees.find((e) => e.id === item.employeeId);
        if (emp) {
          if (item.type === 'check_in') {
            emp.attendance = {
              ...(emp.attendance || {}),
              sessionId: item.sessionId || emp.attendance?.sessionId,
              clockInTime: item.timestamp,
              clockOutTime: null,
              status: 'PRESENT',
            };
          } else if (item.type === 'check_out') {
            if (emp.attendance) {
              emp.attendance.clockOutTime = item.timestamp;
            }
          }
        }
      }
    }
    return data;
  } catch (err: any) {
    if (!navigator.onLine || err.message?.includes('Unable to connect') || err.message?.includes('Failed to fetch')) {
      const cached = await getCachedRoster();
      if (cached.employees.length > 0) {
        let employees = cached.employees;
        if (search && search.trim()) {
          const s = search.trim().toLowerCase();
          employees = employees.filter(
            (e) =>
              e.firstName.toLowerCase().includes(s) ||
              e.lastName.toLowerCase().includes(s) ||
              e.employeeCode?.toLowerCase().includes(s) ||
              e.email?.toLowerCase().includes(s)
          );
        }
        const selectedSession = cached.sessions.find((s) => s.id === sessionId) || cached.sessions[0] || null;
        return {
          enabled: true,
          serverTime: new Date().toISOString(),
          organization: {
            id: 'offline-org',
            name: 'Offline Kiosk Terminal',
            allowManualCheckIn: true,
          },
          activeSessions: cached.sessions,
          selectedSession,
          employees,
          total: employees.length,
          totalPages: 1,
          isOffline: true,
        };
      }
    }
    throw err;
  }
}

export async function findManualEmployee(email: string): Promise<Employee> {
  try {
    const query = new URLSearchParams({ email });
    return (await api.get<{ data: Employee }>(`/admin/manual-attendance/employee?${query}`)).data;
  } catch (err: any) {
    if (!navigator.onLine || err.message?.includes('Unable to connect') || err.message?.includes('Failed to fetch')) {
      const offlineEmp = await findEmployeeOffline(email);
      if (offlineEmp) return offlineEmp;
    }
    throw err;
  }
}

export async function manualCheckIn(
  employeeId: string,
  sessionId: string,
  password: string,
  faceImage?: string,
  employeeName = 'Employee'
): Promise<ActionResult> {
  if (!navigator.onLine) {
    const clientTime = new Date().toISOString();
    await queueOfflineAttendance({
      employeeId,
      employeeName,
      type: 'check_in',
      sessionId,
      password,
      faceImage,
      timestamp: clientTime,
    });
    return {
      status: 'SAVED_OFFLINE',
      clockInTime: clientTime,
      serverTime: clientTime,
      isOffline: true,
    };
  }

  try {
    return (await api.post<{ data: ActionResult }>('/admin/manual-attendance/check-in', {
      employeeId,
      sessionId,
      password,
      faceImage,
    })).data;
  } catch (error: any) {
    if (error.message?.includes('Unable to connect') || error.message?.includes('Failed to fetch') || !navigator.onLine) {
      const clientTime = new Date().toISOString();
      await queueOfflineAttendance({
        employeeId,
        employeeName,
        type: 'check_in',
        sessionId,
        password,
        faceImage,
        timestamp: clientTime,
      });
      return {
        status: 'SAVED_OFFLINE',
        clockInTime: clientTime,
        serverTime: clientTime,
        isOffline: true,
      };
    }
    throw error;
  }
}

export async function manualCheckOut(
  employeeId: string,
  sessionId: string | undefined,
  password: string,
  employeeName = 'Employee'
): Promise<ActionResult> {
  if (!navigator.onLine) {
    const clientTime = new Date().toISOString();
    await queueOfflineAttendance({
      employeeId,
      employeeName,
      type: 'check_out',
      sessionId,
      password,
      timestamp: clientTime,
    });
    return {
      status: 'SAVED_OFFLINE',
      clockOutTime: clientTime,
      serverTime: clientTime,
      isOffline: true,
    };
  }

  try {
    return (await api.post<{ data: ActionResult }>('/admin/manual-attendance/check-out', {
      employeeId,
      sessionId,
      password,
    })).data;
  } catch (error: any) {
    if (error.message?.includes('Unable to connect') || error.message?.includes('Failed to fetch') || !navigator.onLine) {
      const clientTime = new Date().toISOString();
      await queueOfflineAttendance({
        employeeId,
        employeeName,
        type: 'check_out',
        sessionId,
        password,
        timestamp: clientTime,
      });
      return {
        status: 'SAVED_OFFLINE',
        clockOutTime: clientTime,
        serverTime: clientTime,
        isOffline: true,
      };
    }
    throw error;
  }
}
export async function startEmployeeBreak(employeeId: string, breakType = 'LUNCH') {
  return (await api.post<{ data: BreakRecord }>(`/admin/breaks/${employeeId}/start`, { breakType })).data;
}
export async function endEmployeeBreak(employeeId: string, breakId: string) {
  return (await api.put<{ data: BreakRecord }>(`/admin/breaks/${employeeId}/${breakId}/end`, {})).data;
}
export async function getEmployeeBreak(employeeId: string) {
  try {
    const records = (await api.get<{ data: BreakRecord[] }>(`/breaks/daily/${employeeId}`)).data;
    return records.find((record) => !record.endTime) ?? null;
  } catch (error) {
    const status = (error as Error & { status?: number }).status;
    if (status === 404) return null;
    throw error;
  }
}
export async function getLiveAttendance() {
  return (await api.get<{ data: LiveAttendance[] }>('/attendance/live')).data;
}
export async function getStudents(search = '') {
  const query = new URLSearchParams({ limit: '200', status: 'ACTIVE' });
  if (search.trim()) query.set('search', search.trim());
  try {
    return (await api.get<{ data: { students: Student[] } }>(`/admin/students?${query}`)).data;
  } catch {
    return (await api.get<{ data: { students: Student[] } }>(`/students?${query}`)).data;
  }
}
export async function checkInStudent(studentId: string) {
  try {
    return (await api.post<{ data: Student }>(`/admin/students/${studentId}/check-in`, {})).data;
  } catch {
    return (await api.post<{ data: Student }>(`/students/${studentId}/check-in`, {})).data;
  }
}
export async function checkOutStudent(studentId: string) {
  try {
    return (await api.post<{ data: Student }>(`/admin/students/${studentId}/check-out`, {})).data;
  } catch {
    return (await api.post<{ data: Student }>(`/students/${studentId}/check-out`, {})).data;
  }
}
export async function enrollFace(employeeId: string, photoBlob: Blob): Promise<{ success: boolean; data: { id: string; firstName: string; lastName: string; profileImageUrl: string } }> {
  const formData = new FormData();
  formData.append('photo', photoBlob, 'face.jpg');
  const response = await fetch(`${API_URL}/admin/users/${employeeId}/face`, {
    method: 'POST',
    headers: { ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
    body: formData,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || 'Failed to enroll face.');
  }
  return response.json();
}
