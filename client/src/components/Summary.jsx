export default function Summary({ summary }) {
  
  const grandTotal = summary.reduce((sum, row) => sum + row.total, 0);

  return (
    <section className="card">
      <h2>Summary</h2>

      {summary.length === 0 ? (
        <p className="muted">Nothing to summarise yet</p>
      ) : (
        <>
          <ul className="summary-list">
            {summary.map((row) => (
              <li key={row.category}>
                <span className="tag">{row.category}</span>
                <strong>₹{row.total}</strong>
              </li>
            ))}
          </ul>
          <p className="grand-total">
            Grand total: <strong>₹{grandTotal}</strong>
          </p>
        </>
      )}
    </section>
  );
}
