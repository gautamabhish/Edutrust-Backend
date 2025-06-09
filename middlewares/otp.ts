
import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

interface SendMailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export class SmtpService {
  private transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = port === 465; // true for 465, false for other ports

    if (!host || !user || !pass) {
      throw new Error('SMTP configuration is missing in environment variables');
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    } as SMTPTransport.Options);
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    const fromAddress = process.env.SMTP_FROM || `"No Reply" <${process.env.SMTP_USER}>`;

    await this.transporter.sendMail({
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
  }

  async sendOtpEmail(to: string, code: string, requestType: 'register' | 'forgot-password'): Promise<void> {
    const subject = `Your OTP for ${requestType === 'register' ? 'Registration' : 'Password Reset'}`;
    const text = `Hello,\n\nWe received a request to ${requestType === 'register' ? 'register your account' : 'reset your password'}.\n\nIf this wasn't you, please ignore this email.\n\nYour OTP code is: ${code}\n\nThanks,\nTeam`;
    const html = `
      <p>Hello,</p>
      <p>We received a request to <strong>${requestType === 'register' ? 'register your account' : 'reset your password'}</strong>.</p>
      <p>If this wasn't you, you can ignore this email.</p>
      <h2 style="color: #095ef1;">OTP: ${code}</h2>
      <p>Thanks,<br/>EduTrust</p>
    `;

    await this.sendMail({ to, subject, text, html });
  }
}

// Usage example:
// const smtpService = new SmtpService();
// await smtpService.sendOtpEmail('user@example.com', '123456', 'register');
