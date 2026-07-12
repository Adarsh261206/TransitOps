import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';
import { AuthRequest } from '../middleware/auth.js';
import { loginSchema, registerSchema } from '../utils/validation.js';

const JWT_SECRET = process.env.JWT_SECRET || 'transitops-super-secret-key-2026';

function generateToken(user: { id: string; email: string; role: string }) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

export async function login(req: AuthRequest, res: Response) {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err: any) {
    if (err.issues) return res.status(400).json({ error: 'Validation error', details: err.issues });
    res.status(500).json({ error: err.message });
  }
}

export async function register(req: AuthRequest, res: Response) {
  try {
    const data = registerSchema.parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) return res.status(400).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: { email: data.email, password: hashed, name: data.name, role: data.role || 'FLEET_MANAGER' },
    });

    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err: any) {
    if (err.issues) return res.status(400).json({ error: 'Validation error', details: err.issues });
    res.status(500).json({ error: err.message });
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
