const configuredApiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '');
const localApiUrl = 'http://localhost:5000/api';
export const API_URL = configuredApiUrl || localApiUrl;
export const SOCKET_URL = API_URL.replace(/\/api$/, '');
