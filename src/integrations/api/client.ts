const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function handle<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    throw new ApiError(res.status, body?.error || `So'rov xato bilan tugadi (${res.status})`);
  }
  return body as T;
}

function buildQuery(params?: Record<string, unknown>): string {
  if (!params) return '';
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) usp.set(key, value.join(','));
    else usp.set(key, String(value));
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
}

export function apiGet<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  return fetch(`${API_BASE}${path}${buildQuery(params)}`, { credentials: 'include' }).then((r) => handle<T>(r));
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return fetch(`${API_BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }).then((r) => handle<T>(r));
}

export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }).then((r) => handle<T>(r));
}

export function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }).then((r) => handle<T>(r));
}

export function apiDelete<T>(path: string): Promise<T> {
  return fetch(`${API_BASE}${path}`, { method: 'DELETE', credentials: 'include' }).then((r) => handle<T>(r));
}

export function apiUpload<T>(path: string, formData: FormData, method: 'POST' | 'DELETE' = 'POST'): Promise<T> {
  return fetch(`${API_BASE}${path}`, { method, credentials: 'include', body: formData }).then((r) => handle<T>(r));
}
