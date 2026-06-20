import { useState, useEffect } from 'react'
import { getLowStockAPI, updateStockAPI, getInventoryLogsAPI } from '../api/inventory.api'
import { getProductsAPI } from '../api/product.api'
import { useToast } from '../context/ToastContext'
import Modal from '../components/Modal'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDateTime } from '../utils/formatDate'
import {
  FiPlus, FiMinus, FiAlertTriangle, FiList,
  FiPackage, FiTrendingUp, FiTrendingDown,
  FiSearch, FiX, FiRefreshCw
} from 'react-icons/fi'

export default function Inventory() {
  const [products, setProducts] = useState([])
  const [logs, setLogs] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [loading, setLoading] = useState(true)
  const [logsLoading, setLogsLoading] = useState(false)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ product_id: '', type: 'in', quantity: '', reason: '' })
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('products')
  const [search, setSearch] = useState('')
  const [logType, setLogType] = useState('')
  const { showSuccess, showError } = useToast()

  // ── Load products + low stock ──
  const load = async () => {
    setLoading(true)
    try {
      const [p, ls] = await Promise.all([getProductsAPI(), getLowStockAPI()])
      setProducts(p.data.products || [])
      setLowStock(ls.data.products || [])
    } catch { showError('Failed to load inventory') }
    finally { setLoading(false) }
  }

  // ── Load stock logs ──
  const loadLogs = async () => {
    setLogsLoading(true)
    try {
      const res = await getInventoryLogsAPI({ limit: 100, type: logType || undefined })
      setLogs(res.data.logs || [])
    } catch { showError('Failed to load logs') }
    finally { setLogsLoading(false) }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { if (tab === 'logs') loadLogs() }, [tab, logType])

  // ── Open stock modal ──
  const openModal = (product = null, type = 'in') => {
    setForm({
      product_id: product ? String(product.id) : '',
      type,
      quantity: '',
      reason: ''
    })
    setModal(true)
  }

  // ── Quantity input — integers only ──
  const handleQtyChange = (e) => {
    const raw = e.target.value
    if (raw === '') { setForm(f => ({ ...f, quantity: '' })); return }
    const intVal = Math.floor(parseFloat(raw))
    if (isNaN(intVal) || intVal < 0) return
    setForm(f => ({ ...f, quantity: String(intVal) }))
  }

  // ── Submit stock update ──
  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!form.product_id) { showError('Please select a product'); return }
    const qty = parseInt(form.quantity)
    if (!qty || qty <= 0) { showError('Please enter a valid quantity (minimum 1)'); return }

    setSaving(true)
    try {
      const res = await updateStockAPI({
        product_id: parseInt(form.product_id),
        type: form.type,
        quantity: qty,
        reason: form.reason
      })
      showSuccess(`✅ Stock ${form.type === 'in' ? 'added' : 'removed'}! New stock: ${res.data.new_stock}`)
      setModal(false)
      setForm({ product_id: '', type: 'in', quantity: '', reason: '' })
      load()
      if (tab === 'logs') loadLogs()
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update stock')
    } finally { setSaving(false) }
  }

  // ── Filtered products for table ──
  const filteredProducts = products.filter(p =>
    !search.trim() ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category_name || '').toLowerCase().includes(search.toLowerCase())
  )

  // ── Selected product preview in modal ──
  const selectedProduct = products.find(p => p.id === parseInt(form.product_id))

  // ── Summary numbers ──
  const totalStock = products.reduce((s, p) => s + (p.stock || 0), 0)
  const totalValue = products.reduce((s, p) => s + ((p.price || 0) * (p.stock || 0)), 0)
  const outOfStock = products.filter(p => p.stock === 0).length
  const totalIn = logs.filter(l => l.type === 'in').reduce((s, l) => s + l.quantity, 0)
  const totalOut = logs.filter(l => l.type === 'out').reduce((s, l) => s + l.quantity, 0)

  // ── Stock status helper ──
  const getStockStatus = (p) => {
    if (p.stock === 0) return { label: 'Out of Stock', bg: '#fee2e2', color: '#b91c1c' }
    if (p.stock <= p.low_stock_threshold) return { label: 'Low Stock', bg: '#fef3c7', color: '#92400e' }
    return { label: 'In Stock', bg: '#dcfce7', color: '#15803d' }
  }

  return (
    <div className="fade-in" style={{ paddingBottom: 40 }}>

      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <div className="page-title">Stock Manager</div>
          <div className="page-subtitle">
            {lowStock.length > 0
              ? <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
                  ⚠ {lowStock.length} product{lowStock.length > 1 ? 's' : ''} need restocking
                </span>
              : <span style={{ color: 'var(--success)' }}>✅ All stock levels are healthy</span>
            }
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={load}>
            <FiRefreshCw size={13} /> Refresh
          </button>
          <button className="btn btn-success" onClick={() => openModal(null, 'in')}>
            <FiPlus size={14} /> Stock In
          </button>
          <button className="btn btn-danger" onClick={() => openModal(null, 'out')}>
            <FiMinus size={14} /> Stock Out
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid-4" style={{ marginBottom: 22 }}>
        {[
          { label: 'Total Products', value: products.length, color: '#6366f1', bg: '#e0e7ff', icon: <FiPackage size={20} /> },
          { label: 'Total Stock Units', value: totalStock.toLocaleString('en-IN'), color: '#10b981', bg: '#d1fae5', icon: <FiTrendingUp size={20} /> },
          { label: 'Low / Out of Stock', value: `${lowStock.length} / ${outOfStock}`, color: '#f59e0b', bg: '#fef3c7', icon: <FiAlertTriangle size={20} /> },
          { label: 'Inventory Value', value: formatCurrency(totalValue), color: '#8b5cf6', bg: '#ede9fe', icon: <FiList size={20} /> },
        ].map((card, i) => (
          <div key={i} className="card" style={{ padding: '18px 20px', transition: 'all 0.22s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: card.bg, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {card.icon}
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2 }}>{card.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: card.color, lineHeight: 1 }}>{card.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Low Stock Alert Banner ── */}
      {lowStock.length > 0 && (
        <div style={{
          background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 12,
          padding: '14px 18px', marginBottom: 20,
          display: 'flex', alignItems: 'flex-start', gap: 12,
          animation: 'slideDown 0.3s ease'
        }}>
          <FiAlertTriangle color="#d97706" size={20} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 8, fontSize: 14 }}>
              Products needing restock:
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {lowStock.map(p => (
                <button
                  key={p.id}
                  onClick={() => openModal(p, 'in')}
                  style={{
                    background: '#fff', border: '1px solid #fde68a',
                    borderRadius: 8, padding: '5px 12px', fontSize: 13,
                    cursor: 'pointer', color: '#92400e', transition: 'all 0.18s',
                    fontWeight: 500
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#d97706'; e.currentTarget.style.color = '#fff' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#92400e' }}>
                  {p.name}: <strong>{p.stock} {p.unit}</strong> left
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          ['products', <FiPackage size={14} />, 'All Products'],
          ['logs', <FiList size={14} />, 'Stock Logs']
        ].map(([key, icon, label]) => (
          <button
            key={key}
            className={`btn ${tab === key ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab(key)}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ══════════ PRODUCTS TAB ══════════ */}
      {tab === 'products' && (
        <div className="card">
          <div className="card-body">
            {/* Search */}
            <div style={{ marginBottom: 16 }}>
              <div className="search-bar" style={{ maxWidth: 360 }}>
                <FiSearch size={14} />
                <input
                  placeholder="Search by product name or category..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <FiX size={13} style={{ cursor: 'pointer', flexShrink: 0 }}
                    onClick={() => setSearch('')} />
                )}
              </div>
            </div>

            {/* Table */}
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 180 }}>Product</th>
                    <th style={{ minWidth: 110 }}>Category</th>
                    <th style={{ minWidth: 100 }}>Sell Price</th>
                    <th style={{ minWidth: 100 }}>Cost Price</th>
                    <th style={{ minWidth: 90 }}>Ship Cost</th>
                    <th style={{ minWidth: 100 }}>Stock</th>
                    <th style={{ minWidth: 60 }}>Unit</th>
                    <th style={{ minWidth: 80 }}>Alert At</th>
                    <th style={{ minWidth: 110 }}>Status</th>
                    <th style={{ minWidth: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: 48 }}>
                        <div className="spinner" style={{ margin: '0 auto' }} />
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={10}>
                        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                          <FiPackage size={36} style={{ opacity: 0.25, display: 'block', margin: '0 auto 12px' }} />
                          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-secondary)', marginBottom: 4 }}>
                            {search ? `No products found for "${search}"` : 'No products yet'}
                          </div>
                          <div style={{ fontSize: 13 }}>Add products from the Products page first</div>
                        </div>
                      </td>
                    </tr>
                  ) : filteredProducts.map(p => {
                    const st = getStockStatus(p)
                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                          {p.barcode && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>#{p.barcode}</div>}
                        </td>
                        <td>
                          <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: 99, fontSize: 12, fontWeight: 500 }}>
                            {p.category_name || 'General'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: '#059669' }}>{formatCurrency(p.price)}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{formatCurrency(p.cost_price)}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{formatCurrency(p.shipping_cost || 0)}</td>
                        <td>
                          <span style={{
                            fontWeight: 800, fontSize: 17,
                            color: p.stock === 0 ? '#ef4444' : p.stock <= p.low_stock_threshold ? '#d97706' : 'var(--text-primary)'
                          }}>
                            {p.stock}
                          </span>
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{p.unit}</td>
                        <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{p.low_stock_threshold}</td>
                        <td>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center',
                            padding: '4px 10px', borderRadius: 99,
                            fontSize: 12, fontWeight: 600,
                            background: st.bg, color: st.color
                          }}>
                            {st.label}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="action-btn edit"
                              onClick={() => openModal(p, 'in')}
                              title="Add Stock">
                              <FiPlus size={13} />
                            </button>
                            <button
                              className="action-btn delete"
                              onClick={() => openModal(p, 'out')}
                              title="Remove Stock">
                              <FiMinus size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ LOGS TAB ══════════ */}
      {tab === 'logs' && (
        <div className="card">
          <div className="card-body">
            {/* Log filters + summary */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Filter:</span>
              {[['', 'All Movements'], ['in', 'Stock In Only'], ['out', 'Stock Out Only']].map(([val, label]) => (
                <button
                  key={val}
                  className={`btn btn-sm ${logType === val ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setLogType(val)}>
                  {label}
                </button>
              ))}
              {logs.length > 0 && (
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, fontSize: 13 }}>
                  <span style={{ color: 'var(--success)', fontWeight: 700 }}>
                    <FiTrendingUp size={13} style={{ marginRight: 4 }} />
                    Total In: +{totalIn}
                  </span>
                  <span style={{ color: 'var(--danger)', fontWeight: 700 }}>
                    <FiTrendingDown size={13} style={{ marginRight: 4 }} />
                    Total Out: -{totalOut}
                  </span>
                </div>
              )}
            </div>

            {/* Logs Table */}
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 160 }}>Product</th>
                    <th style={{ minWidth: 100 }}>Type</th>
                    <th style={{ minWidth: 80 }}>Quantity</th>
                    <th style={{ minWidth: 90 }}>Previous</th>
                    <th style={{ minWidth: 90 }}>New Stock</th>
                    <th style={{ minWidth: 180 }}>Reason</th>
                    <th style={{ minWidth: 160 }}>Date & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logsLoading ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 48 }}>
                        <div className="spinner" style={{ margin: '0 auto' }} />
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                          <FiList size={36} style={{ opacity: 0.25, display: 'block', margin: '0 auto 12px' }} />
                          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-secondary)', marginBottom: 4 }}>
                            No stock movements yet
                          </div>
                          <div style={{ fontSize: 13 }}>Add or remove stock to see logs here</div>
                        </div>
                      </td>
                    </tr>
                  ) : logs.map((l, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{l.product_name}</td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '3px 10px', borderRadius: 99,
                          fontSize: 12, fontWeight: 600,
                          background: l.type === 'in' ? '#dcfce7' : '#fee2e2',
                          color: l.type === 'in' ? '#15803d' : '#b91c1c'
                        }}>
                          {l.type === 'in'
                            ? <FiTrendingUp size={11} />
                            : <FiTrendingDown size={11} />
                          }
                          {l.type === 'in' ? 'Stock In' : 'Stock Out'}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          fontWeight: 800, fontSize: 16,
                          color: l.type === 'in' ? 'var(--success)' : 'var(--danger)'
                        }}>
                          {l.type === 'in' ? '+' : '-'}{l.quantity}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 14 }}>{l.previous_stock}</td>
                      <td style={{ fontWeight: 700, fontSize: 15 }}>{l.new_stock}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{l.reason || '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {formatDateTime(l.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ STOCK UPDATE MODAL ══════════ */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={form.type === 'in' ? '📦 Add Stock (Stock In)' : '📤 Remove Stock (Stock Out)'}
      >
        <form onSubmit={handleUpdate}>

          {/* Product select */}
          <div className="form-group">
            <label className="form-label">Select Product *</label>
            <select
              className="form-control"
              value={form.product_id}
              onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))}
              required
            >
              <option value="">— Choose a product —</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} | Stock: {p.stock} {p.unit} | ₹{p.price}
                </option>
              ))}
            </select>
          </div>

          {/* Selected product info preview */}
          {selectedProduct && (
            <div style={{
              background: 'var(--bg)', borderRadius: 10,
              padding: '12px 16px', marginBottom: 16,
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12
            }}>
              {[
                { label: 'Current Stock', value: `${selectedProduct.stock} ${selectedProduct.unit}`, color: selectedProduct.stock <= selectedProduct.low_stock_threshold ? 'var(--warning)' : 'var(--text-primary)' },
                { label: 'Sell Price', value: formatCurrency(selectedProduct.price), color: 'var(--success)' },
                { label: 'Cost Price', value: formatCurrency(selectedProduct.cost_price), color: 'var(--text-secondary)' },
                { label: 'Status', value: selectedProduct.stock === 0 ? '❌ Out' : selectedProduct.stock <= selectedProduct.low_stock_threshold ? '⚠ Low' : '✅ OK', color: 'var(--text-primary)' },
              ].map((item, i) => (
                <div key={i}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>{item.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Type toggle */}
          <div className="form-group">
            <label className="form-label">Transaction Type *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                ['in', '+ Stock In (Add)', 'var(--success)', '#dcfce7'],
                ['out', '- Stock Out (Remove)', 'var(--danger)', '#fee2e2']
              ].map(([val, label, color, bg]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: val }))}
                  style={{
                    padding: '11px 12px', borderRadius: 9,
                    border: `2px solid ${form.type === val ? color : 'var(--border)'}`,
                    background: form.type === val ? bg : '#fff',
                    color: form.type === val ? color : 'var(--text-secondary)',
                    fontWeight: 700, fontSize: 13,
                    cursor: 'pointer', transition: 'all 0.18s'
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity — integers only, no decimals */}
          <div className="form-group">
            <label className="form-label">Quantity * (whole numbers only)</label>
            <input
              className="form-control"
              type="number"
              min="1"
              step="1"
              value={form.quantity}
              onChange={handleQtyChange}
              onKeyDown={e => {
                // Block decimal point, comma, minus, e
                if (['.', ',', '-', 'e', 'E', '+'].includes(e.key)) {
                  e.preventDefault()
                }
              }}
              onFocus={e => {
                e.target.select()
                e.target.style.borderColor = 'var(--primary)'
              }}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
              required
              placeholder="Enter quantity (e.g. 10)"
              autoFocus
            />
          </div>

          {/* Stock preview after update */}
          {form.quantity && selectedProduct && parseInt(form.quantity) > 0 && (
            <div style={{
              padding: '12px 16px', borderRadius: 10, marginBottom: 8,
              background: form.type === 'in' ? '#dcfce7' : '#fee2e2',
              border: `1px solid ${form.type === 'in' ? '#86efac' : '#fca5a5'}`
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: form.type === 'in' ? '#15803d' : '#b91c1c' }}>
                📊 Stock Preview
              </div>
              <div style={{ fontSize: 14, marginTop: 4, color: form.type === 'in' ? '#166534' : '#991b1b' }}>
                {selectedProduct.stock} {selectedProduct.unit}
                <span style={{ margin: '0 8px', fontSize: 18 }}>→</span>
                <strong style={{ fontSize: 18 }}>
                  {form.type === 'in'
                    ? selectedProduct.stock + parseInt(form.quantity)
                    : Math.max(0, selectedProduct.stock - parseInt(form.quantity))
                  }
                </strong>
                {' '}{selectedProduct.unit}
                {form.type === 'out' && selectedProduct.stock - parseInt(form.quantity) < 0 && (
                  <span style={{ color: '#b91c1c', fontWeight: 700, marginLeft: 8 }}>⚠ Insufficient stock!</span>
                )}
              </div>
            </div>
          )}

          {/* Reason */}
          <div className="form-group">
            <label className="form-label">Reason / Note</label>
            <input
              className="form-control"
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              placeholder="e.g. New shipment, Customer return, Damaged goods..."
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>
              Cancel
            </button>
            <button
              type="submit"
              className={`btn ${form.type === 'in' ? 'btn-success' : 'btn-danger'}`}
              disabled={saving}
            >
              {saving
                ? <span className="spinner" style={{ width: 14, height: 14, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />
                : form.type === 'in' ? '✓ Add Stock' : '✓ Remove Stock'
              }
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}