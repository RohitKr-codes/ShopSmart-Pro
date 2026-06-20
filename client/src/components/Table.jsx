export default function Table({ columns, data, loading, emptyMessage = 'No data found' }) {
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>{columns.map((col, i) => <th key={i} style={col.style}>{col.label}</th>)}</tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: 40 }}>
              <div className="spinner" style={{ margin: '0 auto' }} />
            </td></tr>
          ) : data?.length === 0 ? (
            <tr><td colSpan={columns.length}>
              <div className="empty-state"><p>{emptyMessage}</p></div>
            </td></tr>
          ) : (
            data?.map((row, i) => (
              <tr key={i} style={{ animationDelay: `${i * 0.04}s` }}>
                {columns.map((col, j) => <td key={j} style={col.style}>{col.render ? col.render(row) : row[col.key]}</td>)}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}