import { Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../index.js';
import { AuthRequest } from '../middleware/auth.js';
import { createAuditLog } from '../services/audit.js';
import { sendEmail } from '../services/email.js';
import { userManagementTemplate, accountStatusTemplate } from '../services/emailTemplates.js';

// ─── List Users ───────────────────────────────────────────────────────────────

export async function getUsers(req: AuthRequest, res: Response) {
  try {
    const { search, role, status } = req.query;
    const where: any = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, status: true, isVerified: true, createdAt: true },
    });
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// ─── Create User (by Fleet Manager) ──────────────────────────────────────────

export async function createUser(req: AuthRequest, res: Response) {
  try {
    const { name, email, role } = req.body;
    if (!name || !email || !role) return res.status(400).json({ error: 'Name, email, and role are required' });

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ error: 'Email already registered' });

    // Generate a temporary password
    const tempPassword = crypto.randomBytes(6).toString('hex'); // 12 char hex
    const hashed = await bcrypt.hash(tempPassword, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashed, role, isVerified: true, status: 'ACTIVE' },
      select: { id: true, name: true, email: true, role: true, status: true, isVerified: true, createdAt: true },
    });

    await createAuditLog({
      action: 'User Created',
      entity: 'User',
      entityId: user.id,
      description: `User ${name} (${email}) created with role ${role}`,
      userId: req.user!.id,
    });

    // Send welcome + credentials email
    sendEmail({
      to: email,
      subject: 'Welcome to TransitOps — Your account is ready',
      html: userManagementTemplate({
        recipientName: name,
        event: 'ACCOUNT_CREATED',
        email,
        tempPassword,
      }),
      template: 'user_account_created',
      userId: user.id,
    }).catch(() => {});

    res.status(201).json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// ─── Update User Role ─────────────────────────────────────────────────────────

export async function updateUserRole(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!role) return res.status(400).json({ error: 'Role is required' });

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (id === req.user!.id) return res.status(400).json({ error: 'Cannot change your own role' });

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true, status: true, isVerified: true },
    });

    await createAuditLog({
      action: 'User Role Changed',
      entity: 'User',
      entityId: id,
      description: `Role changed from ${user.role} to ${role}`,
      oldValue: { role: user.role },
      newValue: { role },
      userId: req.user!.id,
    });

    sendEmail({
      to: user.email,
      subject: 'TransitOps — Your role has been updated',
      html: userManagementTemplate({ recipientName: user.name, event: 'ROLE_CHANGED', newRole: role }),
      template: 'user_role_changed',
      userId: id,
    }).catch(() => {});

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// ─── Update User Status (Enable / Disable / Suspend) ─────────────────────────

export async function updateUserStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const validStatuses = ['ACTIVE', 'DISABLED', 'SUSPENDED'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    if (id === req.user!.id) return res.status(400).json({ error: 'Cannot change your own status' });

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updated = await prisma.user.update({
      where: { id },
      data: { status },
      select: { id: true, name: true, email: true, role: true, status: true, isVerified: true },
    });

    await createAuditLog({
      action: 'User Status Changed',
      entity: 'User',
      entityId: id,
      description: `Status changed from ${user.status} to ${status}${reason ? ` — ${reason}` : ''}`,
      oldValue: { status: user.status },
      newValue: { status },
      userId: req.user!.id,
    });

    // Email the affected user
    const emailEvent = status === 'ACTIVE' ? 'ACCOUNT_ENABLED' : status === 'DISABLED' ? 'ACCOUNT_DISABLED' : null;
    if (emailEvent) {
      sendEmail({
        to: user.email,
        subject: `TransitOps — Account ${status === 'ACTIVE' ? 'Reactivated' : 'Disabled'}`,
        html: userManagementTemplate({ recipientName: user.name, event: emailEvent, reason }),
        template: `user_${emailEvent.toLowerCase()}`,
        userId: id,
      }).catch(() => {});
    }

    // Also send accountStatus template for suspended
    if (status === 'SUSPENDED') {
      sendEmail({
        to: user.email,
        subject: 'TransitOps — Account Suspended',
        html: accountStatusTemplate(user.name, 'SUSPENDED', reason),
        template: 'user_account_suspended',
        userId: id,
      }).catch(() => {});
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// ─── Delete User ──────────────────────────────────────────────────────────────

export async function deleteUser(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    if (id === req.user!.id) return res.status(400).json({ error: 'Cannot delete your own account' });

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    await prisma.user.delete({ where: { id } });

    await createAuditLog({
      action: 'User Deleted',
      entity: 'User',
      entityId: id,
      description: `User ${user.name} (${user.email}) deleted`,
      userId: req.user!.id,
    });

    res.json({ message: 'User deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
