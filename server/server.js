import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { connectDB } from './config/db.js';
import expenseRoutes from './routes/expenseRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/expenses', expenseRoutes);

app.use(notFound);
app.use(errorHandler);

// Only start listening once the DB is reachable, so requests never hit a dead connection.
try {
  await connectDB(process.env.MONGO_URI);
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
} catch (err) {
  console.error('Failed to start server:', err.message);
  process.exit(1);
}
