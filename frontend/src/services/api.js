const BASE_URL = 'http://localhost:8080';

let refreshPromise = null;

const performRefresh = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (res.ok) {
      const data = await res.json();
      return data.result;
    }
  } catch (err) {
    console.error("Failed to perform silent token refresh", err);
  }
  return null;
};

const request = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    ...options.headers,
  };

  // Đính kèm JWT token nếu có (không đính kèm khi gọi api login/register công khai)
  if (token && !url.startsWith('/auth/') && !url.startsWith('/users/create') && !url.startsWith('/shares/')) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Nếu body là Object thông thường và không phải Form Data, tự động convert sang JSON
  let processedOptions = { ...options };
  if (processedOptions.body && !(processedOptions.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    processedOptions.body = JSON.stringify(processedOptions.body);
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    ...processedOptions,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    // Tự động logout/refresh nếu token không hợp lệ / hết hạn
    if (response.status === 401 && !url.startsWith('/auth/login') && !url.startsWith('/auth/refresh')) {
      if (!refreshPromise) {
        refreshPromise = performRefresh();
      }
      const refreshResult = await refreshPromise;
      refreshPromise = null; // Reset for subsequent requests

      if (refreshResult) {
        const { token: newToken, refreshToken: newRefreshToken } = refreshResult;
        localStorage.setItem('token', newToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Retry original request with new token
        const retryHeaders = {
          ...headers,
          'Authorization': `Bearer ${newToken}`
        };
        const retryResponse = await fetch(`${BASE_URL}${url}`, {
          ...processedOptions,
          headers: retryHeaders
        });
        const retryData = await retryResponse.json();
        if (retryResponse.ok) {
          return retryData;
        }
      }

      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-logout'));
    }
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};

export const api = {
  get: (url, options) => request(url, { method: 'GET', ...options }),
  post: (url, body, options) => request(url, { method: 'POST', body, ...options }),
  put: (url, body, options) => request(url, { method: 'PUT', body, ...options }),
  delete: (url, options) => request(url, { method: 'DELETE', ...options }),
};
