const API_BASE = "http://localhost:8000/api";

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

export { API_BASE };
