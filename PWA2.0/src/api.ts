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
export interface Organization { id: string; name: string; allowManualCheckIn: boolean; hasStudents?: boolean; requireFaceVerification?: boolean; timezone?: string | null }
export interface Attendance { sessionId?: string; clockInTime?: string | null; clockOutTime?: string | null; status?: string | null; penalty?: number | null; session?: { office?: { timezone?: string | null } | null } | null }
export interface Employee { id: string; firstName: string; lastName: string; email?: string | null; employeeCode?: string | null; profileImageUrl?: string | null; hasFaceEnrolled?: boolean; department?: { name?: string | null } | string | null; checkInMethod: string; attendance?: Attendance | null }
export interface Session { id: string; sessionName?: string | null; office?: { name?: string | null; timezone?: string | null } | string | null; startTime?: string | null; endTime?: string | null }
export interface Dashboard { enabled: boolean; serverTime: string; organization: Organization; activeSessions: Session[]; selectedSession: Session | null; employees: Employee[]; total?: number; totalPages?: number }
export interface LiveAttendance { employeeId: string; clockInTime?: string | null; clockOutTime?: string | null; employee?: Employee }
export interface ActionResult { record?: Attendance; status?: string; penalty?: number; clockInTime?: string; clockOutTime?: string; serverTime?: string }
export interface BreakRecord { id: string; employeeId: string; breakType: string; startTime: string; endTime?: string | null; durationMinutes?: number | null; lifecycleStatus?: string }
export interface Student { id: string; firstName: string; lastName: string; studentCode: string; className?: string | null; status: string; todayAttendance?: { id: string; checkInTime: string; checkOutTime?: string | null } | null }

export async function getMe() { return (await api.get<{ data: AdminUser }>('/auth/me')).data; }
export async function getDashboard(sessionId?: string, search?: string) {
  const query = new URLSearchParams({ page: '1', limit: '200' });
  if (sessionId) query.set('sessionId', sessionId);
  if (search) query.set('search', search);
  return (await api.get<{ data: Dashboard }>(`/admin/manual-attendance?${query}`)).data;
}
export async function findManualEmployee(email: string) {
  const query = new URLSearchParams({ email });
  return (await api.get<{ data: Employee }>(`/admin/manual-attendance/employee?${query}`)).data;
}
export async function manualCheckIn(employeeId: string, sessionId: string, password: string, faceImage?: string) {
  return (await api.post<{ data: ActionResult }>('/admin/manual-attendance/check-in', { employeeId, sessionId, password, faceImage })).data;
}
export async function manualCheckOut(employeeId: string, sessionId: string | undefined, password: string) {
  return (await api.post<{ data: ActionResult }>('/admin/manual-attendance/check-out', { employeeId, sessionId, password })).data;
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
