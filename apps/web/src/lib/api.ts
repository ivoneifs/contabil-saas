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
  window.localStorage.removeItem('isSuperAdmin');
}

export function setIsSuperAdmin(value: boolean) {
  window.localStorage.setItem('isSuperAdmin', value ? '1' : '0');
}

export function getIsSuperAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem('isSuperAdmin') === '1';
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

// Upload multipart (sem Content-Type: o navegador define o boundary).
export async function apiUpload<T>(path: string, form: FormData): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    body: form,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const body = res.headers.get('content-type')?.includes('application/json') ? await res.json() : undefined;
  if (!res.ok) {
    const message = (body && (body.message || body.error)) || `Erro ${res.status}`;
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }
  return body as T;
}

export async function apiDownload(path: string, nomeArquivo: string) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw new Error(`Erro ${res.status} ao baixar.`);
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(url);
}

// POST que devolve arquivo (ex.: exportação em ZIP).
export async function apiBaixarPost(path: string, corpo: unknown, nomeArquivo: string) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(corpo),
  });
  if (!res.ok) {
    const body = res.headers.get('content-type')?.includes('application/json') ? await res.json() : undefined;
    throw new Error((body && body.message) || `Erro ${res.status} ao exportar.`);
  }
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(url);
}

// Abre um arquivo protegido (PDF/XML) numa nova aba.
export async function apiAbrir(path: string) {
  const aba = window.open('', '_blank');
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) {
    aba?.close();
    throw new Error(`Erro ${res.status} ao abrir.`);
  }
  const url = URL.createObjectURL(await res.blob());
  if (aba) aba.location.href = url;
  else window.location.href = url;
}
