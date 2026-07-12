import { Response } from 'express';
import { prisma } from '../index.js';
import { AuthRequest } from '../middleware/auth.js';
import { sendEmail, testEmailConnection } from '../services/email.js';
import { runLicenseExpiryJob, runVehicleDocumentJob, runTokenCleanup } from '../jobs/scheduler.js';

// ─── Email Logs ───────────────────────────────────────────────────────────────

export async function getEmailLogs(req: AuthRequest, res: Response) {
  try {
    const { status, recipient, template, page = '1', limit = '20', from, to } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (recipient) where.recipient = { contains: recipient as string, mode: 'insensitive' };
    if (template) where.template = { contains: template as string, mode: 'insensitive' };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from as string);
      if (to) where.createdAt.lte = new Date(to as string);
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [logs, total] = await Promise.all([
      prisma.emailLog.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.emailLog.count({ where }),
    ]);

    res.json({ data: logs, total, page: parseInt(page as string), totalPages: Math.ceil(total / parseInt(limit as string)) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getEmailLog(req: AuthRequest, res: Response) {
  try {
    const log = await prisma.emailLog.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { name: true, email: true } } },
    });
    if (!log) return res.status(404).json({ error: 'Email log not found' });
    res.json(log);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getEmailStats(req: AuthRequest, res: Response) {
  try {
    const [total, sent, failed, pending] = await Promise.all([
      prisma.emailLog.count(),
      prisma.emailLog.count({ where: { status: 'SENT' } }),
      prisma.emailLog.count({ where: { status: 'FAILED' } }),
      prisma.emailLog.count({ where: { status: 'PENDING' } }),
    ]);
    res.json({ total, sent, failed, pending, successRate: total > 0 ? Math.round((sent / total) * 100) : 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// ─── Email Settings ───────────────────────────────────────────────────────────

export async function getEmailSettings(req: AuthRequest, res: Response) {
  try {
    let settings = await prisma.emailSetting.findUnique({ where: { id: 'default' } });
    if (!settings) {
      settings = await prisma.emailSetting.create({ data: { id: 'default' } });
    }
    // Mask password
    res.json({ ...settings, smtpPassword: settings.smtpPassword ? '••••••••' : null });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateEmailSettings(req: AuthRequest, res: Response) {
  try {
    const { smtpHost, smtpPort, smtpSecure, smtpUser, smtpPassword, senderName, senderEmail, replyTo, supportEmail, maxRetries } = req.body;

    const data: any = {};
    if (smtpHost !== undefined) data.smtpHost = smtpHost;
    if (smtpPort !== undefined) data.smtpPort = parseInt(smtpPort);
    if (smtpSecure !== undefined) data.smtpSecure = smtpSecure;
    if (smtpUser !== undefined) data.smtpUser = smtpUser;
    if (smtpPassword && smtpPassword !== '••••••••') data.smtpPassword = smtpPassword;
    if (senderName !== undefined) data.senderName = senderName;
    if (senderEmail !== undefined) data.senderEmail = senderEmail;
    if (replyTo !== undefined) data.replyTo = replyTo;
    if (supportEmail !== undefined) data.supportEmail = supportEmail;
    if (maxRetries !== undefined) data.maxRetries = parseInt(maxRetries);

    const settings = await prisma.emailSetting.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...data },
      update: data,
    });

    res.json({ ...settings, smtpPassword: settings.smtpPassword ? '••••••••' : null });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// ─── Test Email ───────────────────────────────────────────────────────────────

export async function sendTestEmail(req: AuthRequest, res: Response) {
  try {
    const { to } = req.body;
    const recipient = to || req.user?.email;
    if (!recipient) return res.status(400).json({ error: 'Recipient email is required' });

    // First verify connection
    const conn = await testEmailConnection();
    if (!conn.success) {
      return res.status(400).json({ error: `SMTP connection failed: ${conn.error}` });
    }

    const result = await sendEmail({
      to: recipient,
      subject: 'TransitOps — Test Email',
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:40px 20px;">
          <h2 style="color:#1e40af;">TransitOps Email Test ✓</h2>
          <p style="color:#475569;">This is a test email from your TransitOps platform.</p>
          <p style="color:#475569;">If you received this, your SMTP configuration is working correctly.</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;" />
          <p style="font-size:12px;color:#94a3b8;">Sent from TransitOps · ${new Date().toLocaleString()}</p>
        </div>
      `,
      template: 'test_email',
      userId: req.user?.id,
    });

    if (result.success) {
      res.json({ success: true, message: `Test email sent to ${recipient}` });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// ─── Manual Job Triggers ──────────────────────────────────────────────────────

export async function triggerJobs(req: AuthRequest, res: Response) {
  const { job } = req.body;

  try {
    if (job === 'license') {
      await runLicenseExpiryJob();
      return res.json({ message: 'License expiry job completed' });
    }
    if (job === 'documents') {
      await runVehicleDocumentJob();
      return res.json({ message: 'Vehicle document job completed' });
    }
    if (job === 'cleanup') {
      await runTokenCleanup();
      return res.json({ message: 'Token cleanup job completed' });
    }
    if (job === 'all') {
      await runLicenseExpiryJob();
      await runVehicleDocumentJob();
      await runTokenCleanup();
      return res.json({ message: 'All jobs completed' });
    }
    res.status(400).json({ error: 'Invalid job. Use: license | documents | cleanup | all' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
