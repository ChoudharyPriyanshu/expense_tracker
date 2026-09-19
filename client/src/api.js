const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const CATEGORIES = ['food', 'travel', 'bills', 'shopping', 'other'];


async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new Error('Cannot reach the server. Is the API running on port 5000?');
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }
  return data;
}

export const getExpenses = (category) =>
  request(`/expenses${category && category !== 'all' ? `?category=${category}` : ''}`);

export const getSummary = () => request('/expenses/summary');

export const createExpense = (expense) =>
  request('/expenses', { method: 'POST', body: JSON.stringify(expense) });

export const deleteExpense = (id) => request(`/expenses/${id}`, { method: 'DELETE' });
