const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function parseBody<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    throw new ApiError(res.status, body?.error || `So'rov xato bilan tugadi (${res.status})`);
  }
  return body as T;
}

// Access tokens are short-lived (15 min). Without this, any admin action
// performed after that window hits a 401 and looks like a random logout.
// One shared in-flight refresh so concurrent 401s (e.g. a page firing several
// requests at once) don't each trigger their own /auth/refresh call.
let refreshPromise: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/api/auth/refresh`, { method: 'POST', credentials: 'include' })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (res.status === 401 && path !== '/api/auth/refresh') {
    const refreshed = await refreshSession();
    if (refreshed) {
      const retryRes = await fetch(`${API_BASE}${path}`, init);
      return parseBody<T>(retryRes);
    }
  }
  return parseBody<T>(res);
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
  return request<T>(`${path}${buildQuery(params)}`, { credentials: 'include' });
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export function apiDelete<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE', credentials: 'include' });
}

export function apiUpload<T>(path: string, formData: FormData, method: 'POST' | 'DELETE' = 'POST'): Promise<T> {
  return request<T>(path, { method, credentials: 'include', body: formData });
}
