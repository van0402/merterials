const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?\d{9,15}$/;

export type AuthIdentifier =
  | { type: 'email'; value: string }
  | { type: 'phone'; value: string };

export function normalizePhone(value: string): string {
  return value.trim().replace(/[\s().-]/g, '');
}

export function parseAuthIdentifier(value: unknown): AuthIdentifier | null {
  if (typeof value !== 'string') return null;

  const raw = value.trim();
  if (!raw) return null;

  if (EMAIL_REGEX.test(raw)) {
    return { type: 'email', value: raw.toLowerCase() };
  }

  const phone = normalizePhone(raw);
  if (PHONE_REGEX.test(phone)) {
    return { type: 'phone', value: phone };
  }

  return null;
}

export function syntheticEmailForPhone(phone: string): string {
  const safePhone = phone.replace(/^\+/, 'plus-');
  return `${safePhone}@phone.refferq.local`;
}
