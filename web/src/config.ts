const isLocal = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
export const API_URL = isLocal ? 'http://localhost:5000/api' : '/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (isLocal ? 'http://localhost:5000' : '');

