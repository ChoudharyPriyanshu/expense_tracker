const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export default function ExpenseList({ expenses, loading, error, onDelete }) {
  if (loading) return <p className="muted">Loading...</p>;
  if (error) return <p className="error">{error}</p>;
  if (expenses.length === 0) return <p className="muted">No expenses yet</p>;

  return (
    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Amount</th>
          <th>Category</th>
          <th>Date</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {expenses.map((expense) => (
          <tr key={expense._id}>
            <td>{expense.title}</td>
            <td>₹{expense.amount}</td>
            <td>
              <span className="tag">{expense.category}</span>
            </td>
            <td>{formatDate(expense.createdAt)}</td>
            <td>
              <button className="danger" onClick={() => onDelete(expense._id)}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
