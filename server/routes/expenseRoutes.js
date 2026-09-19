import { Router } from 'express';
import {
  createExpense,
  getExpenses,
  deleteExpense,
  getSummary,
} from '../controllers/expenseController.js';

const router = Router();


router.get('/summary', getSummary);

router.route('/').get(getExpenses).post(createExpense);
router.delete('/:id', deleteExpense);

export default router;
