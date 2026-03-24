import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const SALT_ROUNDS = 12;
const JWT_EXPIRY = '7d';

// Use env SECRET or generate a random one (persisted for server lifetime)
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

export interface JwtPayload {
  userId: number;
  email: string;
  username: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function getJwtSecret(): string {
  return JWT_SECRET;
}
