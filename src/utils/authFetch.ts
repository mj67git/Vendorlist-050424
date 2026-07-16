export const authFetch = (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('app_jwt_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
  return fetch(url, { ...options, headers }).then(res => {
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('app_jwt_token');
      localStorage.removeItem('app_currentUser');
      localStorage.removeItem('app_viewHistory');
      window.location.reload();
      throw new Error("Session has expired. Please log in again.");
    }
    return res;
  });
};
