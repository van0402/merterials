import { Role, UserStatus, type User } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export type AuthenticatedUser = User;

export type AuthResult =
  | { user: AuthenticatedUser }
  | { response: NextResponse };

function authError(message: string, status: 401 | 403): AuthResult {
  return {
    response: NextResponse.json({ success: false, error: message }, { status }),
  };
}

export async function requireUser(request: NextRequest): Promise<AuthResult> {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return authError('Authentication required', 401);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return authError('User not found', 401);
  }
  if (user.status !== UserStatus.ACTIVE) {
    return authError('Account is not active', 403);
  }
  if (!user.emailVerifiedAt) {
    return authError('Email is not verified', 403);
  }

  return { user };
}

export async function requireAdmin(request: NextRequest): Promise<AuthResult> {
  const result = await requireUser(request);
  if ('response' in result) return result;
  if (result.user.role !== Role.ADMIN) {
    return authError('SMEE administrator access required', 403);
  }
  return result;
}

export async function requireSupplier(request: NextRequest): Promise<AuthResult> {
  const result = await requireUser(request);
  if ('response' in result) return result;
  if (result.user.role !== Role.SUPPLIER && result.user.role !== Role.ADMIN) {
    return authError('Supplier access required', 403);
  }
  return result;
}

