import { API_URL } from '../config';

// ── Token store — kept in memory AND persisted to localStorage ──────────────
let _token: string | null = null;
let _activeOrgId: string | null = null;

// Restore from localStorage on module load (page refresh / Electron restart)
try { _token = localStorage.getItem('accessToken'); } catch { _token = null; }
try { _activeOrgId = localStorage.getItem('activeOrgId'); } catch { _activeOrgId = null; }

export function setToken(t: string | null) {
  _token = t;
  try {
    if (t) localStorage.setItem('accessToken', t);
    else   localStorage.removeItem('accessToken');
  } catch { /* localStorage unavailable (rare) */ }
}

export function getToken() { return _token; }

export function setActiveOrgId(id: string | null) {
  _activeOrgId = id;
  try {
    if (id) localStorage.setItem('activeOrgId', id);
    else   localStorage.removeItem('activeOrgId');
  } catch { /* localStorage unavailable */ }
}

export function getActiveOrgId() { return _activeOrgId; }

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return false;
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        if (typeof window !== 'undefined' && (window as any).electronAPI?.apiRequest) {
          const res = await (window as any).electronAPI.apiRequest({
            path: '/auth/refresh',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: { refreshToken },
          });
          if (!res.ok || !res.data?.data?.accessToken) return false;
          setToken(res.data.data.accessToken);
          return true;
        }

        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        const body = await res.json().catch(() => null);
        if (!res.ok || !body?.data?.accessToken) return false;
        setToken(body.data.accessToken);
        return true;
      } catch {
        return false;
      }
    })().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

export async function authenticatedFetch(url: string, init: RequestInit = {}): Promise<Response> {
  if (typeof window !== 'undefined' && (window as any).electronAPI?.apiRequest) {
    const path = url.startsWith(API_URL) ? url.substring(API_URL.length) : url;
    const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
    let bodyToSend: any = init.body;

    if (isFormData) {
      const fd = init.body as FormData;
      const fields: Record<string, string> = {};
      const files: any[] = [];
      for (const [key, value] of (fd as any).entries()) {
        if (typeof File !== 'undefined' && (value instanceof File || value instanceof Blob)) {
          const buffer = await value.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          files.push({
            name: key,
            filename: (value as any).name || 'upload.bin',
            type: value.type || 'application/octet-stream',
            data: btoa(binary),
          });
        } else {
          fields[key] = String(value);
        }
      }
      bodyToSend = { isMultipart: true, fields, files };
    }

    const headers: Record<string, string> = {
      ...(init.headers as any || {}),
      ...(_token ? { Authorization: `Bearer ${_token}` } : {}),
      ...(_activeOrgId ? { 'X-Organization-Id': _activeOrgId } : {}),
    };
    if (isFormData) {
      delete headers['Content-Type'];
      delete headers['content-type'];
    }

    const res = await (window as any).electronAPI.apiRequest({
      path,
      method: init.method || 'GET',
      headers,
      body: bodyToSend,
      responseType: 'arraybuffer',
    });

    let bodyBytes: Uint8Array;
    if (res.data && res.isBase64) {
      const bin = atob(res.data);
      bodyBytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bodyBytes[i] = bin.charCodeAt(i);
    } else if (typeof res.data === 'string') {
      bodyBytes = new TextEncoder().encode(res.data);
    } else if (res.data) {
      bodyBytes = new TextEncoder().encode(JSON.stringify(res.data));
    } else {
      bodyBytes = new Uint8Array(0);
    }

    const resp = new Response(new Blob([bodyBytes as any]), {
      status: res.status,
      statusText: res.statusText,
      headers: new Headers(res.headers),
    });

    if (resp.status === 401 && await refreshAccessToken()) {
      return authenticatedFetch(url, init);
    }
    return resp;
  }

  const send = () => fetch(url, {
    ...init,
    headers: {
      ...(init.headers || {}),
      ...(_token ? { Authorization: `Bearer ${_token}` } : {}),
      ...(_activeOrgId ? { 'X-Organization-Id': _activeOrgId } : {}),
    },
  });
  let res = await send();
  if (res.status === 401 && await refreshAccessToken()) res = await send();
  return res;
}

// ─── HTTP client ──────────────────────────────────────────────────────────────
type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function request<T>(method: Method, path: string, body?: unknown, allowRefresh = true): Promise<T> {
  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    ...(_token ? { Authorization: `Bearer ${_token}` } : {}),
    ...(_activeOrgId ? { 'X-Organization-Id': _activeOrgId } : {}),
  };

  if (typeof window !== 'undefined' && (window as any).electronAPI?.apiRequest) {
    let res: any;
    try {
      res = await (window as any).electronAPI.apiRequest({
        path,
        method,
        headers: reqHeaders,
        body,
      });
    } catch (initialErr) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        res = await (window as any).electronAPI.apiRequest({
          path,
          method,
          headers: reqHeaders,
          body,
        });
      } catch (retryErr) {
        console.error('[API Connection Error]', initialErr, retryErr);
        throw new Error('Unable to connect to TimeLogic services. Please check your internet connection and try again.');
      }
    }

    if (res.status === 401 && path !== '/auth/login' && path !== '/auth/refresh') {
      if (allowRefresh && await refreshAccessToken()) {
        return request<T>(method, path, body, false);
      }
      setToken(null);
      localStorage.removeItem('refreshToken');
      window.dispatchEvent(new CustomEvent('auth:expired'));
      throw new Error('Session expired. Please log in again.');
    }

    if (res.status === 403 && res.data?.code === 'SUBSCRIPTION_EXPIRED') {
      window.dispatchEvent(new CustomEvent('subscription:expired', { detail: res.data }));
      throw new Error(res.data?.message || 'Organization subscription has expired. Please enter activation code to continue.');
    }

    if (!res.ok) {
      const errorMsg = res.data?.errors?.[0]?.message || res.data?.message || res.data?.error || `Request failed (${res.status})`;
      throw new Error(errorMsg);
    }
    return res.data as T;
  }

  const doFetch = () =>
    fetch(`${API_URL}${path}`, {
      method,
      headers: reqHeaders,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

  let res: Response;
  try {
    res = await doFetch();
  } catch (initialErr) {
    // Render free-tier cold starts can drop or delay initial connections; retry once after 2s
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      res = await doFetch();
    } catch (retryErr) {
      console.error('[API Connection Error]', initialErr, retryErr);
      throw new Error('Unable to connect to TimeLogic services. Please check your internet connection and try again.');
    }
  }

  const data = await res.json().catch(() => null);

  if (res.status === 401 && path !== '/auth/login' && path !== '/auth/refresh') {
    if (allowRefresh && await refreshAccessToken()) {
      return request<T>(method, path, body, false);
    }
    // Clear stale token — let AuthContext detect the missing user and redirect via React Router
    setToken(null);
    localStorage.removeItem('refreshToken');
    // Dispatch a custom event so AuthContext can react without a hard reload
    window.dispatchEvent(new CustomEvent('auth:expired'));
    throw new Error('Session expired. Please log in again.');
  }

  if (res.status === 403 && data?.code === 'SUBSCRIPTION_EXPIRED') {
    window.dispatchEvent(new CustomEvent('subscription:expired', { detail: data }));
    throw new Error(data?.message || 'Organization subscription has expired. Please enter activation code to continue.');
  }

  if (!res.ok) {
    const errorMsg = data?.errors?.[0]?.message || data?.message || data?.error || `Request failed (${res.status})`;
    throw new Error(errorMsg);
  }
  return data as T;
}

export const api = {
  get:    <T>(path: string)                => request<T>('GET',    path),
  post:   <T>(path: string, body: unknown) => request<T>('POST',   path, body),
  put:    <T>(path: string, body: unknown) => request<T>('PUT',    path, body),
  patch:  <T>(path: string, body: unknown) => request<T>('PATCH',  path, body),
  delete: <T>(path: string)               => request<T>('DELETE', path),
};
