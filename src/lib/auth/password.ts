import bcrypt from 'bcryptjs';

const COST = 12;

export function hashPassword(raw: string): Promise<string> {
  return bcrypt.hash(raw, COST);
}

export function verifyPassword(raw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(raw, hash);
}
