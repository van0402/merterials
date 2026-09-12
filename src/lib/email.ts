import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { EmailTemplateType } from '@prisma/client';

// Initialize Resend with API key only when needed (server-side)
let resendInstance: Resend | null = null;

function getResendClient(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

export const resend = {
  get emails() {
    return getResendClient().emails;
  }
};

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

// Move private helper out of class if needed, or keep it. I'll keep it.

export interface WelcomeEmailData {
  name: string;
  email: string;
  role: 'affiliate' | 'admin';
  loginUrl: string;
  password?: string;
}

export interface EmailVerificationCodeData {
  email: string;
  name: string;
  code: string;
  expiresInMinutes: number;
}

class EmailService {
  private defaultFrom = process.env.SMTP_FROM || process.env.RESEND_FROM_EMAIL || 'Refferq <noreply@refferq.com>';

  /** Escape HTML special characters to prevent XSS in email templates */
  private escapeHtml(str: string): string {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private async getCurrencySymbol(): Promise<string> {
    const { getCurrencySymbol } = await import('./currency');
    return await getCurrencySymbol();
  }

  private formatAmount(cents: number, symbol: string): string {
    const { formatCurrency } = require('./currency'); // Use require if import is problematic in this context, or just import at top if possible
    return formatCurrency(cents, symbol);
  }

  private async getTemplateFromDb(type: EmailTemplateType) {
    try {
      const { prisma } = await import('./prisma');
      return await prisma.emailTemplate.findFirst({
        where: { type, isActive: true }
      });
    } catch (error) {
      console.error(`Failed to fetch email template ${type}:`, error);
      return null;
    }
  }

  private replaceVariables(content: string, variables: Record<string, any>): string {
    return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? String(variables[key]) : match;
    });
  }

  private async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      if (process.env.EMAIL_PROVIDER === 'smtp') {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: this.defaultFrom,
          to: params.to,
          subject: params.subject,
          html: params.html,
        });

        return { success: true, message: 'Email sent successfully' };
      }

      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      const result = await resend.emails.send({
        from: this.defaultFrom,
        to: params.to,
        subject: params.subject,
        html: params.html,
      });

      if (result.error) {
        console.error('Resend email error:', result.error);
        return { success: false, message: 'Failed to send email' };
      }

      return { success: true, message: 'Email sent successfully' };
    } catch (error) {
      console.error('Email sending error:', error);
      return { success: false, message: 'Failed to send email' };
    }
  }

  private async sendTemplatedEmail(params: {
    to: string;
    templateType: EmailTemplateType;
    fallbackSubject: string;
    variables: Record<string, any>;
    generateFallbackHtml: () => Promise<string> | string;
  }): Promise<{ success: boolean; message: string }> {
    const dbTemplate = await this.getTemplateFromDb(params.templateType);

    let subject = params.fallbackSubject;
    let html = '';

    if (dbTemplate) {
      subject = this.replaceVariables(dbTemplate.subject, params.variables);
      html = this.replaceVariables(dbTemplate.body, params.variables);
    } else {
      html = await Promise.resolve(params.generateFallbackHtml());
    }

    return this.sendEmail({
      to: params.to,
      subject,
      html,
    });
  }

  private generateWelcomeEmailHTML(data: WelcomeEmailData): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to Refferq</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Welcome to Refferq! ðŸŽ‰</h1>
      </div>
      <div class="content">
        <h2>Hello ${this.escapeHtml(data.name)}!</h2>
        <p>Thank you for joining our affiliate platform as a <strong>${this.escapeHtml(data.role)}</strong>.</p>
        
        ${data.role === 'affiliate' ? `
        <p>Your account is currently pending approval. Our admin team will review your application and activate your account within 24-48 hours.</p>
        <p>Once approved, you'll be able to:</p>
        <ul>
          <li>Generate unique referral links</li>
          <li>Submit manual referrals</li>
          <li>Track your commissions and earnings</li>
          <li>Access marketing materials</li>
        </ul>
        ` : `
        <p>Your admin account has been created and is ready to use.</p>
        <p>You can now:</p>
        <ul>
          <li>Manage affiliate applications</li>
          <li>Review and approve referrals</li>
          <li>Process commission payments</li>
          <li>Access platform analytics</li>
        </ul>
        `}

        ${data.password ? `
        <div style="background: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; margin: 20px 0;">
          <p style="margin-top: 0; font-weight: bold; color: #64748b;">Your Initial Password:</p>
          <code style="background: #f1f5f9; padding: 10px; display: block; border-radius: 4px; font-size: 18px; text-align: center; color: #0f172a;">${this.escapeHtml(data.password)}</code>
          <p style="margin-bottom: 0; font-size: 13px; color: #94a3b8; text-align: center; margin-top: 10px;">For security, please change your password after your first login.</p>
        </div>
        ` : ''}
        
        <div style="text-align: center;">
          <a href="${data.loginUrl}" class="button">Login to Your Account</a>
        </div>
        
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        
        <p>Best regards,<br>The Refferq Team</p>
      </div>
      <div class="footer">
        <p>This email was sent to ${this.escapeHtml(data.email)}</p>
        <p>Â© ${new Date().getFullYear()} Refferq. All rights reserved.</p>
      </div>
    </body>
    </html>
    `;
  }

  async sendWelcomeEmail(data: WelcomeEmailData): Promise<{ success: boolean; message: string }> {
    return this.sendTemplatedEmail({
      to: data.email,
      templateType: 'WELCOME_EMAIL',
      fallbackSubject: `Welcome to Refferq - ${data.role === 'affiliate' ? 'Affiliate' : 'Admin'} Account Created`,
      variables: data,
      generateFallbackHtml: () => this.generateWelcomeEmailHTML(data),
    });
  }


  async sendPasswordResetEmail(email: string, resetToken: string): Promise<{ success: boolean; message: string }> {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
    return this.sendTemplatedEmail({
      to: email,
      templateType: 'PASSWORD_RESET',
      fallbackSubject: 'Password Reset Request - Refferq',
      variables: { resetUrl },
      generateFallbackHtml: () => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset Request</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Password Reset Request ðŸ”</h1>
        </div>
        <div class="content">
          <h2>Hello!</h2>
          <p>We received a request to reset your password for your affiliate platform account.</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Your Password</a>
          </div>
          
          <div class="warning">
            <strong>âš ï¸ Security Notice:</strong>
            <ul>
              <li>This link will expire in 1 hour</li>
              <li>If you didn't request this reset, please ignore this email</li>
              <li>Never share this link with others</li>
            </ul>
          </div>
          
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 5px;">${resetUrl}</p>
          
          <p>Best regards,<br>The Refferq Team</p>
        </div>
      </body>
      </html>
      `,
    });
  }

  async sendEmailVerificationCode(data: EmailVerificationCodeData): Promise<{ success: boolean; message: string }> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Mã xác thực email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc; }
          .header { background: linear-gradient(135deg, #f97316 0%, #f59e0b 100%); color: white; padding: 30px; text-align: center; border-radius: 18px 18px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #fed7aa; border-top: none; border-radius: 0 0 18px 18px; }
          .code { letter-spacing: 12px; font-size: 34px; font-weight: 900; text-align: center; color: #ea580c; background: #fff7ed; border: 1px dashed #fb923c; border-radius: 14px; padding: 18px 10px; margin: 24px 0; }
          .footer { color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Xác thực email SMEE</h1>
        </div>
        <div class="content">
          <h2>Chào ${this.escapeHtml(data.name)}!</h2>
          <p>Dùng mã bên dưới để hoàn tất đăng ký tài khoản KOL/KOC của bạn.</p>
          <div class="code">${this.escapeHtml(data.code)}</div>
          <p>Mã có hiệu lực trong <strong>${data.expiresInMinutes} phút</strong>. Nếu bạn không thực hiện đăng ký, vui lòng bỏ qua email này.</p>
          <p>SMEE Team</p>
        </div>
        <p class="footer">Email này được gửi tới ${this.escapeHtml(data.email)}</p>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: data.email,
      subject: 'Mã xác thực email SMEE',
      html,
    });
  }
  async sendVerificationEmail(email: string, verificationToken: string): Promise<{ success: boolean; message: string }> {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`;
    return this.sendTemplatedEmail({
      to: email,
      templateType: 'EMAIL_VERIFICATION',
      fallbackSubject: 'Verify Your Email Address - Refferq',
      variables: { verificationUrl },
      generateFallbackHtml: () => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email Address</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Verify Your Email Address âœ‰ï¸</h1>
        </div>
        <div class="content">
          <h2>Hello!</h2>
          <p>Thank you for registering with our affiliate platform. Please verify your email address to complete your registration.</p>
          
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </div>
          
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 5px;">${verificationUrl}</p>
          
          <p>This verification link will expire in 24 hours.</p>
          
          <p>Best regards,<br>The Refferq Team</p>
        </div>
      </body>
      </html>
      `,
    });
  }

  async sendCustomEmail(to: string, subject: string, html: string): Promise<{ success: boolean; message: string }> {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      const result = await resend.emails.send({
        from: this.defaultFrom,
        to,
        subject,
        html,
      });

      console.log('Custom email sent:', result);
      return { success: true, message: 'Email sent successfully' };
    } catch (error) {
      console.error('Failed to send custom email:', error);
      return { success: false, message: 'Failed to send email' };
    }
  }

  // â”€â”€â”€ Generic Email (for system notifications) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async sendGenericEmail(to: string, data: { subject: string; body: string }) {
    const html = `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: #ffffff; font-size: 22px; margin: 0;">Refferq Notification</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
          <p style="color: #374151; font-size: 15px; line-height: 1.6;">${this.escapeHtml(data.body)}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">This is an automated notification from Refferq.</p>
        </div>
      </div>
    `;
    return this.sendEmail({ to, subject: data.subject, html });
  }
}

export const emailService = new EmailService();

