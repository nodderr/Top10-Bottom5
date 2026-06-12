export interface AuthUser {
  id: string;
  email: string;
  handle: string;
  displayName: string;
}

interface ApiError {
  error?: string;
}

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const body = (await res.json()) as ApiError;
      if (body.error) msg = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

export async function fetchMe(): Promise<AuthUser | null> {
  const data = await jsonFetch<{ user: AuthUser | null }>('/api/auth/me');
  return data.user;
}

export async function loginRequest(email: string, password: string): Promise<AuthUser> {
  const data = await jsonFetch<{ user: AuthUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return data.user;
}

export async function registerRequest(input: {
  email: string;
  password: string;
  handle: string;
  displayName: string;
}): Promise<AuthUser> {
  const data = await jsonFetch<{ user: AuthUser }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return data.user;
}

export async function logoutRequest(): Promise<void> {
  await jsonFetch<{ ok: true }>('/api/auth/logout', { method: 'POST' });
}
