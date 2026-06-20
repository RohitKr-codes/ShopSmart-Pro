import { useEffect, useState } from 'react'
import { getDashboardAPI } from '../api/dashboard.api'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDateTime } from '../utils/formatDate'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts'
import {
  FiTrendingUp, FiShoppingCart, FiPackage, FiAlertTriangle,
  FiUsers, FiDollarSign, FiArrowRight, FiRefreshCw,
  FiFileText, FiActivity
} from 'react-icons/fi'
import '../styles/dashboard.css'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#1e293b', color: '#fff', padding: '10px 14px', borderRadius: 10, fontSize: 13 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color || '#818cf8' }}>
            {p.name}: <strong>{p.name === 'revenue' ? formatCurrency(p.value) : p.value}</strong>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await getDashboardAPI()
      setData(res.data)
    } catch {}
    finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { load() }, [])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading dashboard...</p>
    </div>
  )

  const stats = data?.stats || {}

  const statCards = [
    {
      icon: <FiDollarSign size={22} />, label: "Today's Revenue",
      value: formatCurrency(stats.today_sales), sub: `${stats.today_bills || 0} bills today`,
      color: 'blue', link: '/invoices'
    },
    {
      icon: <FiTrendingUp size={22} />, label: 'Monthly Revenue',
      value: formatCurrency(stats.month_sales), sub: `${stats.month_bills || 0} bills this month`,
      color: 'green', link: '/reports'
    },
    {
      icon: <FiPackage size={22} />, label: 'Total Products',
      value: stats.total_products || 0, sub: `${stats.low_stock_count || 0} low on stock`,
      color: stats.low_stock_count > 0 ? 'orange' : 'purple', link: '/products'
    },
    {
      icon: <FiUsers size={22} />, label: 'Total Customers',
      value: stats.total_customers || 0, sub: 'All time customers',
      color: 'teal', link: '/customers'
    },
    {
      icon: <FiDollarSign size={22} />, label: 'Total Revenue',
      value: formatCurrency(stats.total_revenue), sub: 'All time earnings',
      color: 'blue', link: '/reports'
    },
    {
      icon: <FiAlertTriangle size={22} />, label: 'Low Stock Items',
      value: stats.low_stock_count || 0, sub: stats.low_stock_count > 0 ? 'Need restocking!' : 'All stocks OK ✅',
      color: stats.low_stock_count > 0 ? 'red' : 'green', link: '/inventory'
    },
  ]

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#14b8a6']

  return (
    <div className="fade-in" style={{ paddingBottom: 40 }}>

      {/* Greeting */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
            {greeting()}, {user?.name?.split(' ')[0]}! 👋
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {user?.shop_name && ` • ${user.shop_name}`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => load(true)} disabled={refreshing}>
            <FiRefreshCw size={13} style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/billing')}>
            <FiShoppingCart size={13} /> New Bill
          </button>
        </div>
      </div>

      {/* Low stock alert banner */}
      {stats.low_stock_count > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7, #fde68a)', border: '1px solid #fde68a',
          borderRadius: 12, padding: '14px 18px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
          transition: 'transform 0.18s', animation: 'slideDown 0.3s ease'
        }}
          onClick={() => navigate('/inventory')}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <FiAlertTriangle size={20} color="#d97706" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#92400e' }}>
              ⚠ {stats.low_stock_count} product{stats.low_stock_count > 1 ? 's' : ''} running low on stock
            </div>
            <div style={{ fontSize: 12, color: '#b45309', marginTop: 2 }}>
              {(data?.lowStockProducts || []).slice(0, 3).map(p => `${p.name} (${p.stock} left)`).join(' • ')}
              {(data?.lowStockProducts || []).length > 3 && ` • +${(data?.lowStockProducts || []).length - 3} more`}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#92400e', fontWeight: 600, fontSize: 13, flexShrink: 0 }}>
            Restock now <FiArrowRight size={14} />
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {statCards.map((card, i) => (
          <div key={i}
            className={`stat-card ${card.color}`}
            style={{ animationDelay: `${i * 0.06}s`, cursor: 'pointer' }}
            onClick={() => navigate(card.link)}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className={`stat-icon ${card.color}`}>{card.icon}</div>
              <FiArrowRight size={14} style={{ color: 'var(--text-muted)', marginTop: 4 }} />
            </div>
            <div className="stat-label" style={{ marginTop: 12 }}>{card.label}</div>
            <div className="stat-value">{card.value}</div>
            <div className="stat-sub">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 18, marginBottom: 20 }}>

        {/* Revenue Chart */}
        <div className="chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <div className="chart-title">Revenue — Last 7 Days</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Daily sales performance</div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>
              {formatCurrency((data?.last7Days || []).reduce((s, d) => s + d.revenue, 0))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={data?.last7Days || []} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `₹${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#revGrad)" dot={{ fill: '#6366f1', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products Chart */}
        <div className="chart-card">
          <div style={{ marginBottom: 18 }}>
            <div className="chart-title">Top Products</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>By quantity sold</div>
          </div>
          {(data?.topProducts || []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              No sales data yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(data?.topProducts || []).slice(0, 5).map((p, i) => {
                const maxQty = Math.max(...(data?.topProducts || []).map(x => x.total_qty))
                const pct = maxQty ? (p.total_qty / maxQty) * 100 : 0
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{p.product_name}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: COLORS[i % COLORS.length], flexShrink: 0 }}>{p.total_qty} sold</span>
                    </div>
                    <div style={{ background: '#f1f5f9', borderRadius: 99, height: 7, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, background: COLORS[i % COLORS.length], height: '100%', borderRadius: 99, transition: 'width 0.8s ease', transitionDelay: `${i * 0.1}s` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

        {/* Recent Bills */}
        <div className="card">
          <div style={{ padding: '18px 20px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Recent Bills</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Latest transactions</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/invoices')} style={{ fontSize: 12 }}>
              View all <FiArrowRight size={12} />
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Bill No', 'Customer', 'Amount', 'Status'].map(h => (
                    <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.recentBills || []).map((b, i) => (
                  <tr key={b.id} style={{ borderTop: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.13s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    onClick={() => navigate('/invoices')}>
                    <td style={{ padding: '11px 16px', fontWeight: 700, color: 'var(--primary)', fontSize: 12 }}>{b.bill_number}</td>
                    <td style={{ padding: '11px 16px', fontWeight: 500 }}>{b.customer_name}</td>
                    <td style={{ padding: '11px 16px', fontWeight: 700 }}>{formatCurrency(b.total)}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>
                        {b.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
                {!(data?.recentBills?.length) && (
                  <tr><td colSpan={4} style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No bills yet — create your first bill!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock + Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Low Stock */}
          <div className="card" style={{ flex: 1 }}>
            <div style={{ padding: '18px 20px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: stats.low_stock_count > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
                  {stats.low_stock_count > 0 ? '⚠ Low Stock' : '✅ Stock Status'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Items needing attention</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/inventory')} style={{ fontSize: 12 }}>
                Manage <FiArrowRight size={12} />
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Product', 'Stock', 'Limit'].map(h => (
                      <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.lowStockProducts || []).map((p, i) => (
                    <tr key={p.id} style={{ borderTop: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.13s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fff9f0'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      onClick={() => navigate('/inventory')}>
                      <td style={{ padding: '11px 16px', fontWeight: 600 }}>{p.name}</td>
                      <td style={{ padding: '11px 16px' }}>
                        <span style={{ fontWeight: 800, color: p.stock === 0 ? 'var(--danger)' : 'var(--warning)', fontSize: 15 }}>{p.stock}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 3 }}>{p.unit}</span>
                      </td>
                      <td style={{ padding: '11px 16px', color: 'var(--text-muted)', fontSize: 12 }}>{p.low_stock_threshold}</td>
                    </tr>
                  ))}
                  {!(data?.lowStockProducts?.length) && (
                    <tr><td colSpan={3} style={{ padding: '28px', textAlign: 'center', color: 'var(--success)', fontSize: 13, fontWeight: 600 }}>All stock levels are healthy ✅</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div style={{ padding: '16px 20px 10px', fontWeight: 700, fontSize: 14 }}>⚡ Quick Actions</div>
            <div style={{ padding: '0 12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'New Bill', icon: <FiShoppingCart size={16} />, color: 'var(--success)', bg: '#d1fae5', link: '/billing' },
                { label: 'Add Product', icon: <FiPackage size={16} />, color: 'var(--primary)', bg: '#e0e7ff', link: '/products' },
                { label: 'View Reports', icon: <FiActivity size={16} />, color: '#8b5cf6', bg: '#ede9fe', link: '/reports' },
                { label: 'All Invoices', icon: <FiFileText size={16} />, color: '#0891b2', bg: '#cffafe', link: '/invoices' },
              ].map((a, i) => (
                <button key={i} onClick={() => navigate(a.link)}
                  style={{
                    padding: '12px 10px', borderRadius: 10,
                    border: `1.5px solid ${a.bg}`, background: a.bg,
                    color: a.color, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 7,
                    fontSize: 13, fontWeight: 600, transition: 'all 0.18s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                  {a.icon} {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}