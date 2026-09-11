import { SignJWT } from 'jose';
import type { Role, User } from '@prisma/client';
import { AUTH_SESSION_MAX_AGE_SECONDS } from '@/lib/auth-cookie';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function createAuthToken(user: Pick<User, 'id' | 'email' | 'role' | 'name'>) {
  return new SignJWT({
    userId: user.id,
    email: user.email,
    role: user.role as Role,
    name: user.name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${AUTH_SESSION_MAX_AGE_SECONDS}s`)
    .sign(JWT_SECRET);
}
