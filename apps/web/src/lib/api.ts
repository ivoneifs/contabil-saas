const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('accessToken');
}

export function setToken(token: string) {
  window.localStorage.setItem('accessToken', token);
}

export function clearToken() {
  window.localStorage.removeItem('accessToken');
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json() : undefined;

  if (!res.ok) {
    const message = (body && (body.message || body.error)) || `Erro ${res.status}`;
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }

  return body as T;
}
