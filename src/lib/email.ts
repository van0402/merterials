import nodemailer from 'nodemailer';

export interface EmailVerificationCodeData {
  email: string;
  name: string;
  code: string;
  expiresInMinutes: number;
}

class EmailService {
  // Người gửi theo nhà cung cấp mail đang dùng (Resend dùng domain đã verify, SMTP dùng SMTP_FROM)
  private defaultFrom =
    process.env.EMAIL_PROVIDER === 'smtp'
      ? process.env.SMTP_FROM || process.env.RESEND_FROM_EMAIL || 'SMEE <no-reply@mail.smee.vn>'
      : process.env.RESEND_FROM_EMAIL || process.env.SMTP_FROM || 'SMEE <no-reply@mail.smee.vn>';

  /** Escape HTML special characters to prevent XSS in email templates */
  private escapeHtml(str: string): string {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
    replyTo?: string;
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
          replyTo: params.replyTo,
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
        replyTo: params.replyTo,
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
          <p>Dùng mã bên dưới để hoàn tất đăng ký tài khoản SMEE của bạn.</p>
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

    // Mail báo cho công ty biết có khách vừa gửi yêu cầu báo giá
  async sendNewInquiryEmail(data: {
    to: string; // email công ty nhận
    companyName: string;
    senderName: string;
    senderPhone?: string | null;
    senderEmail?: string | null;
    message: string;
    productName?: string | null;
  }): Promise<{ success: boolean; message: string }> {
    const e = (v: string) => this.escapeHtml(v); // chống chèn mã HTML từ nội dung khách nhập
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/supplier/dashboard/inquiries`;

    const row = (label: string, value?: string | null) =>
      value
        ? `<tr><td style="padding:6px 0;color:#6b7280;width:110px;vertical-align:top">${label}</td><td style="padding:6px 0;color:#111827;font-weight:600">${e(value)}</td></tr>`
        : '';

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1f2937">
        <div style="background:#f97316;color:#fff;padding:22px 26px;border-radius:16px 16px 0 0">
          <h2 style="margin:0;font-size:20px">Có khách hỏi báo giá trên SMEE</h2>
        </div>
        <div style="background:#fff;border:1px solid #fed7aa;border-top:none;padding:26px;border-radius:0 0 16px 16px">
          <p style="margin-top:0">Xin chào <b>${e(data.companyName)}</b>,</p>
          <p>Một khách hàng vừa gửi yêu cầu tới doanh nghiệp của bạn:</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            ${row('Người gửi', data.senderName)}
            ${row('Điện thoại', data.senderPhone)}
            ${row('Email', data.senderEmail)}
            ${row('Sản phẩm', data.productName)}
          </table>
          <div style="margin:16px 0;padding:14px 16px;background:#fff7ed;border-radius:12px;font-size:14px;white-space:pre-wrap">${e(data.message)}</div>
          <p style="font-size:14px">Bạn hãy liên hệ trực tiếp với khách theo thông tin trên${data.senderEmail ? ' (hoặc bấm "Trả lời" email này)' : ''}.</p>
          <p style="font-size:13px;color:#6b7280">Có tài khoản nhà cung cấp, bạn quản lý tất cả yêu cầu tại <a href="${dashboardUrl}" style="color:#ea580c">trang quản lý</a>.</p>
        </div>
      </div>`;

    return this.sendEmail({
      to: data.to,
      subject: 'Có khách hỏi báo giá trên SMEE',
      html,
      replyTo: data.senderEmail || undefined, // công ty bấm "Trả lời" là gửi thẳng cho khách
    });
  }

  // Mail báo cho người đăng bài "Cần mua" biết có nhà cung cấp vừa gửi báo giá
  async sendNewSourcingQuoteEmail(data: {
    to: string;
    posterName: string;
    postTitle: string;
    companyName: string;
    message: string;
  }): Promise<{ success: boolean; message: string }> {
    const e = (v: string) => this.escapeHtml(v);
    const listUrl = `${process.env.NEXT_PUBLIC_APP_URL}/can-mua/cua-toi`;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1f2937">
        <div style="background:#f97316;color:#fff;padding:22px 26px;border-radius:16px 16px 0 0">
          <h2 style="margin:0;font-size:20px">Bạn có báo giá mới trên SMEE</h2>
        </div>
        <div style="background:#fff;border:1px solid #fed7aa;border-top:none;padding:26px;border-radius:0 0 16px 16px">
          <p style="margin-top:0">Xin chào <b>${e(data.posterName)}</b>,</p>
          <p><b>${e(data.companyName)}</b> vừa gửi báo giá cho nhu cầu của bạn: <b>${e(data.postTitle)}</b></p>
          <div style="margin:16px 0;padding:14px 16px;background:#fff7ed;border-radius:12px;font-size:14px;white-space:pre-wrap">${e(data.message)}</div>
          <p style="font-size:14px"><a href="${listUrl}" style="color:#ea580c;font-weight:bold">Xem tất cả báo giá của bạn</a></p>
          <p style="font-size:12px;color:#6b7280">Báo giá này chỉ mình bạn nhìn thấy.</p>
        </div>
      </div>`;

    return this.sendEmail({
      to: data.to,
      subject: `Có báo giá mới cho: ${data.postTitle}`,
      html,
    });
  }

}

export const emailService = new EmailService();

