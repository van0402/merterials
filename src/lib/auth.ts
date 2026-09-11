// Authentication and session management for the affiliate platform
import { type User, Role, UserStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { vi } from '@/lib/i18n/vi';

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email?: string;
  phone?: string;
  password: string;
  name: string;
  role: string; // 'affiliate' or 'admin' from the form
}

class AuthService {
  private readonly TOKEN_EXPIRY_HOURS = 24;

  private generateReferralCode(name: string): string {
    const cleanName = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
    const random = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 4);
    return `${cleanName.substr(0, 6)}-${random}`;
  }

  /**
   * Register a new user and create their profile.
   * This is a server-side only method.
   */
  async register(data: RegisterData): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const email = data.email;
      if (!email) {
        return { success: false, message: 'Email is required' };
      }

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            ...(data.phone ? [{ phone: data.phone }] : []),
          ],
        },
      });

      if (existingUser) {
        return { success: false, message: 'User already exists with this email or phone number' };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 12);

      // Determine initial status based on role
      const userRoleLower = data.role.toLowerCase();
      // KOL/KOC accounts can verify and sign in immediately. Becoming a seller
      // is a separate SMEE-reviewed application.
      const initialStatus = 'ACTIVE';

      // Create user using prisma client directly or db service
      // We'll use prisma client here since we've already hashed the password
      const role = data.role.toUpperCase() as Role;
      if (!Object.values(Role).includes(role)) {
        return { success: false, message: 'Invalid role' };
      }

      const user = await prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            email,
            phone: data.phone,
            name: data.name,
            password: hashedPassword,
            role,
            status: initialStatus as UserStatus,
          }
        });
        if (userRoleLower === 'affiliate') {
          await tx.affiliate.create({
            data: {
              userId: created.id,
              referralCode: this.generateReferralCode(data.name),
              payoutDetails: {},
              balanceCents: 0,
            },
          });
        }
        return created;
      });

      return {
        success: true,
        message: 'Registration successful',
        user: user
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: vi.auth.registerFailed };
    }
  }

  /**
   * Update a user's password.
   * Server-side only.
   */
  async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return { success: false, message: 'Current password is incorrect' };
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });

      return { success: true, message: 'Password updated successfully' };
    } catch (error) {
      console.error('Update password error:', error);
      return { success: false, message: 'Password update failed' };
    }
  }
}

export const auth = new AuthService();
