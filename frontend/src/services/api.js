const normalizeUrl = (url) => {
  if (!url) return "http://localhost:8000/api";
  let cleanUrl = url.trim();
  if (cleanUrl.endsWith('/')) {
    cleanUrl = cleanUrl.slice(0, -1);
  }
  if (!cleanUrl.endsWith('/api')) {
    cleanUrl = cleanUrl + '/api';
  }
  return cleanUrl;
};

export let API_BASE = normalizeUrl(localStorage.getItem('custom_api_url') || import.meta.env.VITE_API_URL);

export const setAPIBase = (url) => {
  if (url) {
    const cleanUrl = normalizeUrl(url);
    localStorage.setItem('custom_api_url', cleanUrl);
    API_BASE = cleanUrl;
  } else {
    localStorage.removeItem('custom_api_url');
    API_BASE = normalizeUrl(import.meta.env.VITE_API_URL);
  }
};

export const getAuthToken = () => localStorage.getItem('token') || '';
export const getUserRole = () => localStorage.getItem('role') || '';
export const getUsername = () => localStorage.getItem('username') || '';
export const getStudentId = () => {
  const sId = localStorage.getItem('student_id');
  return sId ? parseInt(sId) : null;
};

export const fetchAPI = async (path, options = {}) => {
  const token = getAuthToken();
  const headers = { ...options.headers };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (!(options.body instanceof FormData) && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }
  
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  
  if (res.status === 401) {
    // Session expired cleanup
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('student_id');
    window.location.reload();
    throw new Error("Session expired. Please login again.");
  }
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || "Request failed");
  }
  
  return res;
};

// API_BASE is already exported inline above
