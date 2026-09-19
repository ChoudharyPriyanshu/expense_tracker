import { useState } from 'react';
import { CATEGORIES } from '../api.js';

const EMPTY_FORM = { title: '', amount: '', category: 'food' };

export default function ExpenseForm({ onAdd }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
     
      await onAdd({ ...form, amount: Number(form.amount) });
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Add Expense</h2>

      <div className="row">
        <label>
          Title
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Lunch"
          />
        </label>

        <label>
          Amount
          <input
            name="amount"
            type="number"
            step="0.01"
            value={form.amount}
            onChange={handleChange}
            placeholder="0.00"
          />
        </label>

        <label>
          Category
          <select name="category" value={form.category} onChange={handleChange}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Add'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}
    </form>
  );
}
