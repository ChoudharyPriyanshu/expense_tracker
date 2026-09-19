import mongoose from 'mongoose';

export const CATEGORIES = ['food', 'travel', 'bills', 'shopping', 'other'];

const expenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [2, 'Title must be at least 2 characters'],
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
   
    validate: {
      validator: (value) => value > 0,
      message: 'Amount must be greater than 0',
    },
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    lowercase: true,
    enum: {
      values: CATEGORIES,
      message: `Category must be one of: ${CATEGORIES.join(', ')}`,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


expenseSchema.index({ category: 1, createdAt: -1 });

export default mongoose.model('Expense', expenseSchema);
