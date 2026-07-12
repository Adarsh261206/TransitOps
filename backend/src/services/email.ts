import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { prisma } from '../index.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  template?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  senderName: string;
  senderEmail: string;
  maxRetries: number;
}

// ─── Config Resolution ────────────────────────────────────────────────────────
// Priority: DB EmailSetting → .env fallback

async function resolveSmtpConfig(): Promise<SmtpConfig> {
  try {
    const setting = await prisma.emailSetting.findUnique({ where: { id: 'default' } });

    if (setting?.smtpHost && setting?.smtpUser && setting?.smtpPassword) {
      return {
        host: setting.smtpHost,
        port: setting.smtpPort ?? 587,
        secure: setting.smtpSecure,
        user: setting.smtpUser,
        pass: setting.smtpPassword,
        senderName: setting.senderName,
        senderEmail: setting.senderEmail,
        maxRetries: setting.maxRetries,
      };
    }
  } catch {
    // fall through to env
  }

  // .env fallback
  return {
    host: process.env.SMTP_HOST ?? '',
    port: parseInt(process.env.SMTP_PORT ?? '587'),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    senderName: process.env.SMTP_FROM_NAME ?? 'TransitOps',
    senderEmail: process.env.SMTP_FROM_EMAIL ?? 'noreply@transitops.com',
    maxRetries: 3,
  };
}

// ─── Transporter Factory ──────────────────────────────────────────────────────

async function createTransporter(): Promise<{ transporter: Transporter; config: SmtpConfig }> {
  const config = await resolveSmtpConfig();

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  return { transporter, config };
}

// ─── Email Logger ─────────────────────────────────────────────────────────────

async function logEmail(data: {
  recipient: string;
  subject: string;
  template: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const log = await prisma.emailLog.create({
    data: {
      recipient: data.recipient,
      subject: data.subject,
      template: data.template,
      status: 'PENDING',
      userId: data.userId ?? null,
      metadata: data.metadata ?? {},
    },
  });
  return log.id;
}

async function markEmailSent(logId: string) {
  await prisma.emailLog.update({
    where: { id: logId },
    data: { status: 'SENT', sentAt: new Date() },
  });
}

async function markEmailFailed(logId: string, reason: string, retryCount: number) {
  await prisma.emailLog.update({
    where: { id: logId },
    data: { status: 'FAILED', failedReason: reason, retryCount },
  });
}

// ─── Core Send Function ───────────────────────────────────────────────────────

export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; logId?: string; error?: string }> {
  const logId = await logEmail({
    recipient: options.to,
    subject: options.subject,
    template: options.template ?? 'custom',
    userId: options.userId,
    metadata: options.metadata,
  });

  let lastError = '';

  const { transporter, config } = await createTransporter();
  const maxRetries = config.maxRetries;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await transporter.sendMail({
        from: `"${config.senderName}" <${config.senderEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text ?? stripHtml(options.html),
      });

      await markEmailSent(logId);
      return { success: true, logId };
    } catch (err: any) {
      lastError = err?.message ?? 'Unknown error';

      if (attempt === maxRetries) {
        await markEmailFailed(logId, lastError, attempt);
      }

      // brief backoff before retry
      if (attempt < maxRetries) {
        await sleep(attempt * 2000);
      }
    }
  }

  return { success: false, logId, error: lastError };
}

// ─── Connection Test ──────────────────────────────────────────────────────────

export async function testEmailConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const { transporter } = await createTransporter();
    await transporter.verify();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Connection failed' };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
