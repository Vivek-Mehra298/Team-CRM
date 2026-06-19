import { useAuthStore } from '../store/authStore';

const stripTrailingSlashes = (value: string) => value.replace(/\/+$/, '');

const ensureApiBasePath = (value: string) => {
  const normalized = stripTrailingSlashes(value.trim());

  if (!normalized) {
    return '';
  }

  try {
    const url = new URL(normalized);

    if (!url.pathname || url.pathname === '/') {
      url.pathname = '/api';
      return stripTrailingSlashes(url.toString());
    }

    return normalized;
  } catch {
    return normalized;
  }
};

const API_URL = ensureApiBasePath(
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : '')
);

interface FetchOptions extends RequestInit {
  bodyData?: any;
}

export const apiFetch = async (endpoint: string, options: FetchOptions = {}) => {
  const { bodyData, headers = {}, ...rest } = options;
  const token = useAuthStore.getState().token;

  const requestHeaders: Record<string, string> = {};

  // Copy standard headers
  Object.keys(headers).forEach((key) => {
    requestHeaders[key] = (headers as any)[key];
  });

  // Skip content-type header for FormData so browser sets correct boundary
  if (bodyData && !(bodyData instanceof FormData)) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...rest,
    headers: requestHeaders,
  };

  if (bodyData) {
    config.body = bodyData instanceof FormData ? bodyData : JSON.stringify(bodyData);
  }

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const response = await fetch(`${API_URL}${normalizedEndpoint}`, config);

  if (response.status === 401) {
    // Session expired or token invalid
    if (typeof window !== 'undefined') {
      useAuthStore.getState().logout();
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
};
export { API_URL };
