import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error('Please define JWT_SECRET in environment variables');
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'super_admin' | 'kam';
  assigned_district?: string | null;
}

export function signToken(payload: JWTPayload): string {
  // Single token with no expiry (as per plan.md)
  return jwt.sign(payload, JWT_SECRET);
}

export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    throw new Error('Invalid token');
  }
}

