import { useCallback, useEffect, useState } from 'react';
import * as api from './api.js';
import { CATEGORIES } from './api.js';
import ExpenseForm from './components/ExpenseForm.jsx';
import ExpenseList from './components/ExpenseList.jsx';
import Summary from './components/Summary.jsx';

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState([]);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (selected) => {
    setLoading(true);
    setError('');
    try {
      const [list, totals] = await Promise.all([
        api.getExpenses(selected),
        api.getSummary(),
      ]);
      setExpenses(list);
      setSummary(totals);
    } catch (err) {
      setError(err.message);
      setExpenses([]);
      setSummary([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(category);
  }, [category, load]);

  
  const handleAdd = async (expense) => {
    await api.createExpense(expense);
    await load(category);
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteExpense(id);
      await load(category);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main>
      <h1>Mini Expense Tracker</h1>

      <ExpenseForm onAdd={handleAdd} />

      <Summary summary={summary} />

      <section className="card">
        <div className="list-header">
          <h2>Expenses</h2>
          <label>
            Filter
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="all">All</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        <ExpenseList
          expenses={expenses}
          loading={loading}
          error={error}
          onDelete={handleDelete}
        />
      </section>
    </main>
  );
}
