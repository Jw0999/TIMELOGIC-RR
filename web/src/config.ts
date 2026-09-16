const configuredApiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '');
const localApiUrl = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)
	? 'http://localhost:5000/api'
	: '';
export const API_URL = configuredApiUrl || localApiUrl || 'https://timelogic-backend.onrender.com/api';
export const SOCKET_URL = API_URL.replace(/\/api$/, '');
