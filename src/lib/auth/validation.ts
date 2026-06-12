// Validators return null on success, or a user-facing error string.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HANDLE_RE = /^[a-z0-9_]{3,20}$/;

export function validateEmail(email: unknown): string | null {
  if (typeof email !== 'string') return 'Email is required.';
  const v = email.trim();
  if (v.length === 0) return 'Email is required.';
  if (v.length > 254) return 'Email is too long.';
  if (!EMAIL_RE.test(v)) return 'Enter a valid email address.';
  return null;
}

export function validatePassword(password: unknown): string | null {
  if (typeof password !== 'string') return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (password.length > 200) return 'Password is too long.';
  return null;
}

export function validateHandle(handle: unknown): string | null {
  if (typeof handle !== 'string') return 'Handle is required.';
  const v = handle.trim().toLowerCase();
  if (!HANDLE_RE.test(v)) {
    return 'Handle must be 3–20 chars, letters / digits / underscore.';
  }
  return null;
}

export function validateDisplayName(name: unknown): string | null {
  if (typeof name !== 'string') return 'Display name is required.';
  const v = name.trim();
  if (v.length === 0) return 'Display name is required.';
  if (v.length > 40) return 'Display name is too long (40 chars max).';
  return null;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeHandle(handle: string): string {
  return handle.trim().toLowerCase();
}
