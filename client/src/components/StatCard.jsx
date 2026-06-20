export default function StatCard({ icon, label, value, sub, color = 'blue', trend }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
      {trend && <div className={`stat-trend ${trend.dir}`}>{trend.dir === 'up' ? '↑' : '↓'} {trend.text}</div>}
    </div>
  )
}