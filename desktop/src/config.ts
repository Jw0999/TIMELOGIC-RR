const configuredApiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '');
const localApiUrl = 'http://localhost:5000/api';
export const API_URL = configuredApiUrl || localApiUrl;
export const LOCAL_API_URL = localApiUrl;
export const LOCAL_SALES_API_URL = localApiUrl;
export const SOCKET_URL = API_URL.replace(/\/api$/, '');

// Strictly for local development with local backend (NOT included in installation package/production builds)
export const IS_LOCAL_PART = Boolean(
  import.meta.env.DEV &&
  !API_URL.includes('herokuapp.com')
);
