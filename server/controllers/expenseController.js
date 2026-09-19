import mongoose from 'mongoose';
import Expense, { CATEGORIES } from '../models/Expense.js';

export async function createExpense(req, res, next) {
  try {
    const { title, amount, category } = req.body;
    const expense = await Expense.create({ title, amount, category });
    res.status(201).json(expense);
  } catch (err) {
    next(err);
  }
}

export async function getExpenses(req, res, next) {
  try {
    const { category } = req.query;
    const filter = {};

    if (category && category !== 'all') {
      if (!CATEGORIES.includes(category.toLowerCase())) {
        return res.status(400).json({
          message: `Invalid category filter. Use one of: ${CATEGORIES.join(', ')}`,
        });
      }
      filter.category = category.toLowerCase();
    }

    const expenses = await Expense.find(filter).sort({ createdAt: -1 });
    res.json(expenses);
  } catch (err) {
    next(err);
  }
}


export async function deleteExpense(req, res, next) {
  try {
    const { id } = req.params;

   
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid expense id' });
    }

    const deleted = await Expense.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted', id });
  } catch (err) {
    next(err);
  }
}


export async function getSummary(req, res, next) {
  try {
    const summary = await Expense.aggregate([
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $project: { _id: 0, category: '$_id', total: 1, count: 1 } },
      { $sort: { total: -1 } },
    ]);

    res.json(summary);
  } catch (err) {
    next(err);
  }
}
