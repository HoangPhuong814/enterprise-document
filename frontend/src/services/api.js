const BASE_URL = 'http://localhost:8080';

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
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    // Tự động logout nếu token không hợp lệ / hết hạn
    if (response.status === 401 && !url.startsWith('/auth/login')) {
      localStorage.removeItem('token');
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
