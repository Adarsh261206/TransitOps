import { Response } from 'express';
import { prisma } from '../index.js';
import { AuthRequest } from '../middleware/auth.js';
import { expenseSchema } from '../utils/validation.js';
import { createAuditLog } from '../services/audit.js';

export async function getExpenses(req: AuthRequest, res: Response) {
  try {
    const { vehicleId, type, category, page = '1', limit = '50' } = req.query;
    const where: any = {};
    if (vehicleId) where.vehicleId = vehicleId;
    if (type) where.type = type;
    if (category) where.category = category;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where, skip, take: parseInt(limit as string), orderBy: { date: 'desc' },
        include: { vehicle: { select: { id: true, name: true, registrationNumber: true } } },
      }),
      prisma.expense.count({ where }),
    ]);
    res.json({ data: expenses, total, page: parseInt(page as string), totalPages: Math.ceil(total / parseInt(limit as string)) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getExpense(req: AuthRequest, res: Response) {
  try {
    const expense = await prisma.expense.findUnique({ where: { id: req.params.id }, include: { vehicle: true } });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    res.json(expense);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function createExpense(req: AuthRequest, res: Response) {
  try {
    const data = expenseSchema.parse(req.body);
    const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    const expense = await prisma.expense.create({ data: { ...data, date: new Date(data.date) } });
    
    await createAuditLog({ action: 'Expense Added', entity: 'Expense', entityId: expense.id, description: `${data.type} expense of $${data.amount} for ${vehicle.name}`, userId: req.user!.id, vehicleId: data.vehicleId });

    res.status(201).json(expense);
  } catch (err: any) {
    if (err.issues) return res.status(400).json({ error: 'Validation error', details: err.issues });
    res.status(500).json({ error: err.message });
  }
}

export async function updateExpense(req: AuthRequest, res: Response) {
  try {
    const data = expenseSchema.partial().parse(req.body);
    const updateData: any = { ...data };
    if (data.date) updateData.date = new Date(data.date);
    const expense = await prisma.expense.update({ where: { id: req.params.id }, data: updateData });
    res.json(expense);
  } catch (err: any) {
    if (err.issues) return res.status(400).json({ error: 'Validation error', details: err.issues });
    res.status(500).json({ error: err.message });
  }
}

export async function deleteExpense(req: AuthRequest, res: Response) {
  try {
    await prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ message: 'Expense deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
