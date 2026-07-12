import { Router } from 'express';
import { getExpenses, getExpense, createExpense, updateExpense, deleteExpense } from '../controllers/expenseController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', getExpenses);
router.get('/:id', getExpense);
router.post('/', authorize('FLEET_MANAGER', 'FINANCIAL_ANALYST'), createExpense);
router.put('/:id', authorize('FLEET_MANAGER', 'FINANCIAL_ANALYST'), updateExpense);
router.delete('/:id', authorize('FLEET_MANAGER'), deleteExpense);

export default router;
