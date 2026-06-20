import { useState, useEffect } from 'react'
import { getSalesReportAPI, getProductReportAPI, exportCSVAPI } from '../api/report.api'
import { useToast } from '../context/ToastContext'
import { formatCurrency } from '../utils/formatCurrency'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import {
  FiDownload, FiBarChart2, FiPackage, FiCalendar,
  FiTrendingUp, FiDollarSign, FiShoppingBag, FiRefreshCw
} from 'react-icons/fi'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444']

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#1e293b', color: '#fff', padding: '10px 14px', borderRadius: 10, fontSize: 13 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: '#818cf8' }}>
            {p.name}: <strong>{typeof p.value === 'number' && p.name.includes('revenue') ? formatCurrency(p.value) : p.value}</strong>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function Reports() {
  const [tab, setTab] = useState('sales')
  const [salesData, setSalesData] = useState([])
  const [productData, setProductData] = useState([])
  const [loading, setLoading] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [groupBy, setGroupBy] = useState('day')
  const { showSuccess, showError } = useToast()

  const totalRevenue = salesData.reduce((s, d) => s + (d.revenue || 0), 0)
  const totalBills = salesData.reduce((s, d) => s + (d.total_bills || 0), 0)
  const totalGST = salesData.reduce((s, d) => s + (d.total_gst || 0), 0)
  const totalDiscount = salesData.reduce((s, d) => s + (d.total_discount || 0), 0)
  const topProduct = productData[0]

  const loadReports = async () => {
    setLoading(true)
    try {
      const params = { from_date: fromDate, to_date: toDate, group_by: groupBy }
      const [s, p] = await Promise.all([getSalesReportAPI(params), getProductReportAPI(params)])
      setSalesData(s.data.report || [])
      setProductData(p.data.report || [])
    } catch { showError('Failed to load reports') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadReports() }, [fromDate, toDate, groupBy])

  const exportCSV = async (type) => {
    try {
      const res = await exportCSVAPI({ type, from_date: fromDate, to_date: toDate })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
      const a = document.createElement('a'); a.href = url; a.download = `${type}_report_${Date.now()}.csv`; a.click()
      URL.revokeObjectURL(url)
      showSuccess(`${type} report exported!`)
    } catch { showError('Export failed') }
  }

  const setQuickDate = (range) => {
    const now = new Date()
    const fmt = d => d.toISOString().slice(0, 10)
    if (range === 'today') { setFromDate(fmt(now)); setToDate(fmt(now)) }
    else if (range === '7d') { const d = new Date(now); d.setDate(d.getDate() - 6); setFromDate(fmt(d)); setToDate(fmt(now)) }
    else if (range === '30d') { const d = new Date(now); d.setDate(d.getDate() - 29); setFromDate(fmt(d)); setToDate(fmt(now)) }
    else if (range === 'month') { setFromDate(fmt(new Date(now.getFullYear(), now.getMonth(), 1))); setToDate(fmt(now)) }
    else { setFromDate(''); setToDate('') }
  }

  return (
    <div className="fade-in" style={{ paddingBottom: 40 }}>

      <div className="page-header">
        <div>
          <div className="page-title">Reports & Analytics</div>
          <div className="page-subtitle">Track sales performance and product insights</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => exportCSV('sales')}>
            <FiDownload size={13} /> Sales CSV
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => exportCSV('products')}>
            <FiDownload size={13} /> Products CSV
          </button>
          <button className="btn btn-ghost btn-sm" onClick={loadReports} disabled={loading}>
            <FiRefreshCw size={13} style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <FiCalendar size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Date Range:</span>
            <input type="date" className="form-control" style={{ width: 155, height: 40 }} value={fromDate} onChange={e => setFromDate(e.target.value)} />
            <span style={{ color: 'var(--text-muted)' }}>→</span>
            <input type="date" className="form-control" style={{ width: 155, height: 40 }} value={toDate} onChange={e => setToDate(e.target.value)} />
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {[['today', 'Today'], ['7d', 'Last 7 Days'], ['30d', 'Last 30 Days'], ['month', 'This Month'], ['all', 'All Time']].map(([val, label]) => (
                <button key={val} className="btn btn-ghost btn-sm"
                  onClick={() => setQuickDate(val)}
                  style={{ fontSize: 12 }}>
                  {label}
                </button>
              ))}
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Group by:</span>
              {[['day', 'Daily'], ['month', 'Monthly']].map(([val, label]) => (
                <button key={val}
                  onClick={() => setGroupBy(val)}
                  className={`btn btn-sm ${groupBy === val ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: 12 }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: <FiDollarSign size={20} />, color: '#6366f1', bg: '#e0e7ff' },
          { label: 'Total Bills', value: totalBills, icon: <FiShoppingBag size={20} />, color: '#10b981', bg: '#d1fae5' },
          { label: 'Total GST', value: formatCurrency(totalGST), icon: <FiTrendingUp size={20} />, color: '#f59e0b', bg: '#fef3c7' },
          { label: 'Total Discount', value: formatCurrency(totalDiscount), icon: <FiBarChart2 size={20} />, color: '#8b5cf6', bg: '#ede9fe' },
        ].map((card, i) => (
          <div key={i} className="card" style={{ padding: '16px 18px' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: card.bg, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{card.icon}</div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{card.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: card.color }}>{card.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {[
          ['sales', <FiBarChart2 size={14} />, 'Sales Report'],
          ['products', <FiPackage size={14} />, 'Product Report']
        ].map(([key, icon, label]) => (
          <button key={key} className={`btn ${tab === key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(key)}>
            {icon} {label}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <div className="spinner" style={{ width: 36, height: 36 }} />
        </div>
      )}

      {!loading && tab === 'sales' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {salesData.length === 0 ? (
            <div className="card">
              <div style={{ textAlign: 'center', padding: '52px 20px', color: 'var(--text-muted)' }}>
                <FiBarChart2 size={40} style={{ opacity: 0.2, display: 'block', margin: '0 auto 12px' }} />
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>No sales data found</div>
                <div style={{ fontSize: 13 }}>Try selecting a different date range or create some bills first</div>
              </div>
            </div>
          ) : (
            <>
              <div className="card">
                <div className="card-body">
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Revenue Trend</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 18 }}>
                    {fromDate && toDate ? `${fromDate} → ${toDate}` : 'All time'} • {groupBy === 'day' ? 'Daily view' : 'Monthly view'}
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `₹${v}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="revenue" name="revenue" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4, stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 7 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card">
                <div className="card-body" style={{ padding: 0 }}>
                  <div style={{ padding: '18px 20px 12px', fontWeight: 700, fontSize: 15 }}>Detailed Breakdown</div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Period</th>
                          <th>Bills</th>
                          <th>Revenue</th>
                          <th>Discount</th>
                          <th>GST</th>
                          <th>Avg Bill Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesData.map((r, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 600 }}>{r.period}</td>
                            <td>
                              <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>{r.total_bills}</span>
                            </td>
                            <td style={{ fontWeight: 700, color: '#059669' }}>{formatCurrency(r.revenue)}</td>
                            <td style={{ color: 'var(--danger)', fontSize: 13 }}>{r.total_discount > 0 ? `-${formatCurrency(r.total_discount)}` : '—'}</td>
                            <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{formatCurrency(r.total_gst)}</td>
                            <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{r.total_bills > 0 ? formatCurrency(r.revenue / r.total_bills) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: '#f8fafc', borderTop: '2px solid var(--border)' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 800, fontSize: 13 }}>TOTAL</td>
                          <td style={{ padding: '12px 16px', fontWeight: 700 }}>{totalBills}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 800, color: '#059669' }}>{formatCurrency(totalRevenue)}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--danger)' }}>{formatCurrency(totalDiscount)}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 700 }}>{formatCurrency(totalGST)}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                            {totalBills > 0 ? formatCurrency(totalRevenue / totalBills) : '—'}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {!loading && tab === 'products' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {topProduct && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 4 }}>
              {[
                { label: '🏆 Best Seller', value: topProduct.product_name, sub: `${topProduct.total_sold} units sold` },
                { label: '💰 Top Revenue', value: formatCurrency(productData.sort((a, b) => b.total_revenue - a.total_revenue)[0]?.total_revenue), sub: productData.sort((a, b) => b.total_revenue - a.total_revenue)[0]?.product_name },
                { label: '📦 Total Products Sold', value: productData.reduce((s, p) => s + (p.total_sold || 0), 0), sub: `Across ${productData.length} products` },
              ].map((item, i) => (
                <div key={i} className="card" style={{ padding: '16px 18px', borderLeft: `4px solid ${COLORS[i]}` }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>{item.label}</div>
                  <div style={{ fontWeight: 800, fontSize: 17, color: COLORS[i], marginBottom: 2 }}>{item.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.sub}</div>
                </div>
              ))}
            </div>
          )}

          {productData.length === 0 ? (
            <div className="card">
              <div style={{ textAlign: 'center', padding: '52px 20px', color: 'var(--text-muted)' }}>
                <FiPackage size={40} style={{ opacity: 0.2, display: 'block', margin: '0 auto 12px' }} />
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>No product data found</div>
                <div style={{ fontSize: 13 }}>Create some bills to see product reports</div>
              </div>
            </div>
          ) : (
            <>
              <div className="card">
                <div className="card-body">
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 18 }}>Top 10 Products by Units Sold</div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={productData.slice(0, 10)} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis type="category" dataKey="product_name" tick={{ fontSize: 11, fill: '#64748b' }} width={110} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="total_sold" name="units sold" radius={[0, 6, 6, 0]}>
                        {productData.slice(0, 10).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card">
                <div className="card-body" style={{ padding: 0 }}>
                  <div style={{ padding: '18px 20px 12px', fontWeight: 700, fontSize: 15 }}>Product Performance Table</div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th style={{ width: 36 }}>#</th>
                          <th>Product Name</th>
                          <th>Units Sold</th>
                          <th>Revenue</th>
                          <th>Times in Bills</th>
                          <th>Avg Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productData.map((r, i) => (
                          <tr key={i}>
                            <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{i + 1}</td>
                            <td style={{ fontWeight: 600 }}>
                              {i === 0 && <span style={{ fontSize: 12 }}>🏆 </span>}
                              {r.product_name}
                            </td>
                            <td>
                              <span style={{ fontWeight: 700, color: COLORS[i % COLORS.length], fontSize: 15 }}>{r.total_sold}</span>
                            </td>
                            <td style={{ fontWeight: 700, color: '#059669' }}>{formatCurrency(r.total_revenue)}</td>
                            <td style={{ color: 'var(--text-secondary)' }}>{r.times_sold}</td>
                            <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{r.times_sold > 0 ? formatCurrency(r.total_revenue / r.total_sold) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}