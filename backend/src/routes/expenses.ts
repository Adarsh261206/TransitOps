import { Router } from 'express';
import { getExpenses, getExpense, createExpense, updateExpense, deleteExpense } from '../controllers/expenseController.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('expenses:read'), getExpenses);
router.get('/:id', requirePermission('expenses:read'), getExpense);
router.post('/', requirePermission('expenses:create'), createExpense);
router.put('/:id', requirePermission('expenses:create'), updateExpense);
router.delete('/:id', requirePermission('expenses:create'), deleteExpense);

export default router;
