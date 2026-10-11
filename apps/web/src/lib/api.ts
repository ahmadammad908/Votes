const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  statusCode: number;
  error: string;

  constructor(message: string, statusCode = 500, error = 'Error') {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.error = error;
  }
}

export function getImageUrl(url?: string | null): string {
  if (!url) {
    return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const apiServerUrl = API_BASE_URL.replace('/api/v1', '');
  return `${apiServerUrl}${url.startsWith('/') ? url : `/${url}`}`;
}

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Check for local storage token if available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('campusface_auth_token');
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include' // Send cookies
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      data.message || `Request failed with status ${response.status}`,
      response.status,
      data.error || 'RequestError'
    );
  }

  return data as T;
}
