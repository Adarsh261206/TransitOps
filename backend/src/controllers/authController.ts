import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../index.js';
import { AuthRequest } from '../middleware/auth.js';
import { loginSchema, registerSchema } from '../utils/validation.js';
import { sendEmail } from '../services/email.js';
import { emailVerificationTemplate, passwordResetTemplate, welcomeTemplate } from '../services/emailTemplates.js';

const JWT_SECRET = process.env.JWT_SECRET || 'transitops-super-secret-key-2026';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateToken(user: { id: string; email: string; role: string }) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

function generateSecureToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

// ─── Register ─────────────────────────────────────────────────────────────────

export async function register(req: AuthRequest, res: Response) {
  try {
    const data = registerSchema.parse(req.body);

    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) return res.status(400).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashed,
        name: data.name,
        role: data.role || 'FLEET_MANAGER',
        isVerified: false,
        status: 'ACTIVE',
      },
    });

    // Generate verification token (24h expiry)
    const token = generateSecureToken();
    await prisma.emailVerificationToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Send verification email (non-blocking — don't fail registration if email fails)
    sendEmail({
      to: user.email,
      subject: 'Verify your TransitOps email address',
      html: emailVerificationTemplate(user.name, token),
      template: 'email_verification',
      userId: user.id,
    }).catch(() => {/* logged internally */});

    res.status(201).json({
      message: 'Account created. Please check your email to verify your account before logging in.',
      email: user.email,
    });
  } catch (err: any) {
    if (err.issues) return res.status(400).json({ error: 'Validation error', details: err.issues });
    res.status(500).json({ error: err.message });
  }
}

// ─── Verify Email ─────────────────────────────────────────────────────────────

export async function verifyEmail(req: AuthRequest, res: Response) {
  try {
    const { token } = req.query as { token: string };
    if (!token) return res.status(400).json({ error: 'Verification token is required' });

    const record = await prisma.emailVerificationToken.findUnique({ where: { token } });

    if (!record) return res.status(400).json({ error: 'Invalid verification link' });
    if (record.usedAt) return res.status(400).json({ error: 'This verification link has already been used' });
    if (record.expiresAt < new Date()) {
      return res.status(400).json({
        error: 'Verification link has expired',
        code: 'TOKEN_EXPIRED',
        email: (await prisma.user.findUnique({ where: { id: record.userId }, select: { email: true } }))?.email,
      });
    }

    // Mark token used and activate user
    await prisma.$transaction([
      prisma.emailVerificationToken.update({ where: { token }, data: { usedAt: new Date() } }),
      prisma.user.update({ where: { id: record.userId }, data: { isVerified: true } }),
    ]);

    // Send welcome email
    const user = await prisma.user.findUnique({ where: { id: record.userId } });
    if (user) {
      sendEmail({
        to: user.email,
        subject: 'Welcome to TransitOps — Your account is active',
        html: welcomeTemplate(user.name, user.role),
        template: 'welcome',
        userId: user.id,
      }).catch(() => {});
    }

    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// ─── Resend Verification ──────────────────────────────────────────────────────

export async function resendVerification(req: AuthRequest, res: Response) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await prisma.user.findUnique({ where: { email } });

    // Generic response to prevent user enumeration
    if (!user) return res.json({ message: 'If that email exists, a new verification link has been sent.' });
    if (user.isVerified) return res.status(400).json({ error: 'This account is already verified' });

    // Rate limit: max 1 resend per 2 minutes
    const recent = await prisma.emailVerificationToken.findFirst({
      where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 2 * 60 * 1000) } },
      orderBy: { createdAt: 'desc' },
    });
    if (recent) {
      return res.status(429).json({ error: 'Please wait 2 minutes before requesting another verification email' });
    }

    // Invalidate all previous tokens
    await prisma.emailVerificationToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    // Issue new token
    const token = generateSecureToken();
    await prisma.emailVerificationToken.create({
      data: { token, userId: user.id, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    });

    await sendEmail({
      to: user.email,
      subject: 'Verify your TransitOps email address',
      html: emailVerificationTemplate(user.name, token),
      template: 'email_verification',
      userId: user.id,
    });

    res.json({ message: 'If that email exists, a new verification link has been sent.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function login(req: AuthRequest, res: Response) {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    // Verification check
    if (!user.isVerified) {
      return res.status(403).json({
        error: 'Please verify your email before logging in.',
        code: 'EMAIL_NOT_VERIFIED',
        email: user.email,
      });
    }

    // Account status check
    if (user.status === 'DISABLED') {
      return res.status(403).json({ error: 'Your account has been disabled. Contact support.', code: 'ACCOUNT_DISABLED' });
    }
    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ error: 'Your account is currently suspended. Contact support.', code: 'ACCOUNT_SUSPENDED' });
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err: any) {
    if (err.issues) return res.status(400).json({ error: 'Validation error', details: err.issues });
    res.status(500).json({ error: err.message });
  }
}

// ─── Forgot Password ──────────────────────────────────────────────────────────

export async function forgotPassword(req: AuthRequest, res: Response) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await prisma.user.findUnique({ where: { email } });

    // Always respond generically to prevent enumeration
    const genericResponse = { message: 'If that email is registered, a password reset link has been sent.' };
    if (!user || !user.isVerified) return res.json(genericResponse);

    // Rate limit: 1 reset per 2 minutes
    const recent = await prisma.passwordResetToken.findFirst({
      where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 2 * 60 * 1000) } },
    });
    if (recent) return res.status(429).json({ error: 'Please wait 2 minutes before requesting another reset link' });

    // Invalidate old tokens
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    // New token — 15 min expiry
    const token = generateSecureToken();
    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt: new Date(Date.now() + 15 * 60 * 1000) },
    });

    await sendEmail({
      to: user.email,
      subject: 'Reset your TransitOps password',
      html: passwordResetTemplate(user.name, token),
      template: 'password_reset',
      userId: user.id,
    });

    res.json(genericResponse);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// ─── Reset Password ───────────────────────────────────────────────────────────

export async function resetPassword(req: AuthRequest, res: Response) {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and new password are required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const record = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!record) return res.status(400).json({ error: 'Invalid or expired reset link' });
    if (record.usedAt) return res.status(400).json({ error: 'This reset link has already been used' });
    if (record.expiresAt < new Date()) return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });

    const hashed = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.passwordResetToken.update({ where: { token }, data: { usedAt: new Date() } }),
      prisma.user.update({ where: { id: record.userId }, data: { password: hashed } }),
    ]);

    // Invalidate any remaining reset tokens for security
    await prisma.passwordResetToken.updateMany({
      where: { userId: record.userId, usedAt: null },
      data: { usedAt: new Date() },
    });

    res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// ─── Get Me ───────────────────────────────────────────────────────────────────

export async function getMe(req: AuthRequest, res: Response) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, name: true, role: true, isVerified: true, status: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// ─── Update Profile ───────────────────────────────────────────────────────────

export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    const { name, currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const data: any = {};
    if (name) data.name = name;

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ error: 'Current password is required' });
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });
      if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
      data.password = await bcrypt.hash(newPassword, 10);
    }

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data,
      select: { id: true, email: true, name: true, role: true, isVerified: true, status: true, createdAt: true },
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
