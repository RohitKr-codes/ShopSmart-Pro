import { useState, useEffect } from 'react'
import {
  getProductsAPI, createProductAPI, updateProductAPI,
  deleteProductAPI, getCategoriesAPI, createCategoryAPI
} from '../api/product.api'
import { useToast } from '../context/ToastContext'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { formatCurrency } from '../utils/formatCurrency'
import { UNITS } from '../utils/constants'
import {
  FiPlus, FiEdit2, FiTrash2, FiSearch,
  FiPackage, FiTag, FiAlertTriangle, FiGrid,
  FiList, FiX, FiFilter, FiRefreshCw
} from 'react-icons/fi'

const emptyForm = {
  name: '', description: '', category_id: '',
  selling_price: '', cost_price: '', shipping_cost: '',
  stock: '', low_stock_threshold: 5, unit: 'kg', barcode: ''
}

export default function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [viewMode, setViewMode] = useState('table')
  const [modal, setModal] = useState(false)
  const [catModal, setCatModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [catName, setCatName] = useState('')
  const [savingCat, setSavingCat] = useState(false)
  const { showSuccess, showError } = useToast()

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const load = async () => {
    setLoading(true)
    try {
      const [p, c] = await Promise.all([
        getProductsAPI({ search, category_id: catFilter, low_stock: lowStockOnly }),
        getCategoriesAPI()
      ])
      setProducts(p.data.products || [])
      setCategories(c.data.categories || [])
    } catch { showError('Failed to load products') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [search, catFilter, lowStockOnly])

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModal(true) }
  const openEdit = p => {
    setEditing(p)
    setForm({
      name: p.name || '', description: p.description || '',
      category_id: p.category_id || '',
      selling_price: p.price || '',
      cost_price: p.cost_price || '',
      shipping_cost: p.shipping_cost || '',
      stock: p.stock || '',
      low_stock_threshold: p.low_stock_threshold || 5,
      unit: p.unit || 'kg', barcode: p.barcode || ''
    })
    setModal(true)
  }

  const handleSave = async e => {
    e.preventDefault()
    if (!form.name || !form.selling_price) {
      showError('Product name and selling price are required'); return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description || '',
        category_id: form.category_id || null,
        price: parseFloat(form.selling_price) || 0,
        cost_price: parseFloat(form.cost_price) || 0,
        shipping_cost: parseFloat(form.shipping_cost) || 0,
        stock: parseInt(form.stock) || 0,
        low_stock_threshold: parseInt(form.low_stock_threshold) || 5,
        unit: form.unit,
        barcode: form.barcode || null
      }
      if (editing) { await updateProductAPI(editing.id, payload); showSuccess('✅ Product updated!') }
      else { await createProductAPI(payload); showSuccess('✅ Product created!') }
      setModal(false); load()
    } catch (err) { showError(err.response?.data?.message || 'Failed to save product') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try { await deleteProductAPI(confirm.id); showSuccess('Product deleted'); setConfirm(null); load() }
    catch { showError('Failed to delete') }
    finally { setDeleting(false) }
  }

  const handleAddCategory = async e => {
    e.preventDefault(); setSavingCat(true)
    try {
      await createCategoryAPI({ name: catName.trim() })
      showSuccess('Category added!'); setCatName(''); setCatModal(false); load()
    } catch (err) { showError(err.response?.data?.message || 'Failed') }
    finally { setSavingCat(false) }
  }

  const getProfit = p => (parseFloat(p.price) || 0) - (parseFloat(p.cost_price) || 0) - (parseFloat(p.shipping_cost) || 0)
  const getProfitPct = p => {
    const cp = parseFloat(p.cost_price) || 0
    if (!cp) return null
    return ((getProfit(p) / cp) * 100).toFixed(1)
  }

  const getStockClass = p => {
    if (p.stock === 0) return { cls: 'stock-out', statusCls: 'status-badge status-out', label: 'Out of Stock' }
    if (p.stock <= p.low_stock_threshold) return { cls: 'stock-low', statusCls: 'status-badge status-low', label: 'Low Stock' }
    return { cls: 'stock-good', statusCls: 'status-badge status-in-stock', label: 'In Stock' }
  }

  const liveSP = parseFloat(form.selling_price) || 0
  const liveCP = parseFloat(form.cost_price) || 0
  const liveShip = parseFloat(form.shipping_cost) || 0
  const liveProfit = liveSP - liveCP - liveShip
  const liveMargin = liveCP ? ((liveProfit / liveCP) * 100).toFixed(1) : null

  const totalProducts = products.length
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= p.low_stock_threshold).length
  const outOfStock = products.filter(p => p.stock === 0).length
  const totalValue = products.reduce((s, p) => s + ((p.price || 0) * (p.stock || 0)), 0)

  return (
    <div className="fade-in" style={{ paddingBottom: 40 }}>

      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <div className="page-title">Products</div>
          <div className="page-subtitle">Manage your complete product catalog</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setCatModal(true)}>
            <FiTag size={14} /> Add Category
          </button>
          <button className="btn btn-ghost btn-sm" onClick={load}>
            <FiRefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={openAdd}>
            <FiPlus size={15} /> Add Product
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Products', value: totalProducts, color: '#6366f1', bg: '#e0e7ff', icon: <FiPackage size={20} /> },
          { label: 'Low Stock', value: lowStockCount, color: '#d97706', bg: '#fef3c7', icon: <FiAlertTriangle size={20} /> },
          { label: 'Out of Stock', value: outOfStock, color: '#ef4444', bg: '#fee2e2', icon: <FiX size={20} /> },
          { label: 'Inventory Value', value: formatCurrency(totalValue), color: '#10b981', bg: '#d1fae5', icon: <FiTag size={20} /> },
        ].map((card, i) => (
          <div key={i} className="card" style={{ padding: '18px 20px', cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: card.bg, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {card.icon}
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 2 }}>{card.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: card.color, lineHeight: 1 }}>{card.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Table Card ── */}
      <div className="card">
        <div className="card-body">

          {/* Toolbar */}
          <div className="table-toolbar">
            <div className="table-toolbar-left">
              <div className="search-bar" style={{ minWidth: 240, maxWidth: 320 }}>
                <FiSearch size={15} />
                <input
                  placeholder="Search products..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <FiX size={14} style={{ cursor: 'pointer', flexShrink: 0, color: 'var(--text-muted)' }}
                    onClick={() => setSearch('')} />
                )}
              </div>

              <select
                className="form-control"
                style={{ width: 170, height: 42 }}
                value={catFilter}
                onChange={e => setCatFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <button
                className={`btn btn-sm ${lowStockOnly ? 'btn-warning' : 'btn-ghost'}`}
                onClick={() => setLowStockOnly(v => !v)}
              >
                <FiFilter size={13} /> {lowStockOnly ? 'Show All' : 'Low Stock'}
              </button>
            </div>

            <div style={{ display: 'flex', border: '1.5px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              {[['table', <FiList size={15} />], ['grid', <FiGrid size={15} />]].map(([mode, icon]) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  style={{
                    padding: '7px 13px', border: 'none', cursor: 'pointer',
                    background: viewMode === mode ? 'var(--primary)' : '#fff',
                    color: viewMode === mode ? '#fff' : 'var(--text-muted)',
                    transition: 'all 0.18s', display: 'flex', alignItems: 'center'
                  }}>
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* ── TABLE VIEW ── */}
          {viewMode === 'table' && (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 180 }}>Product</th>
                    <th style={{ minWidth: 120 }}>Category</th>
                    <th style={{ minWidth: 110 }}>Sell Price</th>
                    <th style={{ minWidth: 110 }}>Cost Price</th>
                    <th style={{ minWidth: 100 }}>Ship Cost</th>
                    <th style={{ minWidth: 120 }}>Profit / Margin</th>
                    <th style={{ minWidth: 80 }}>Stock</th>
                    <th style={{ minWidth: 60 }}>Unit</th>
                    <th style={{ minWidth: 100 }}>Status</th>
                    <th style={{ minWidth: 90 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={10} style={{ padding: 48, textAlign: 'center' }}>
                        <div className="spinner" style={{ margin: '0 auto' }} />
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={10}>
                        <div className="table-empty">
                          <div className="table-empty-icon"><FiPackage /></div>
                          <h3>No products found</h3>
                          <p>Click "Add Product" to create your first product</p>
                        </div>
                      </td>
                    </tr>
                  ) : products.map(p => {
                    const profit = getProfit(p)
                    const pct = getProfitPct(p)
                    const st = getStockClass(p)
                    return (
                      <tr key={p.id}>
                        <td>
                          <div className="product-name-cell">
                            <div className="name">{p.name}</div>
                            {p.description && <div className="sub">{p.description.slice(0, 36)}{p.description.length > 36 ? '…' : ''}</div>}
                            {p.barcode && <div className="sub">#{p.barcode}</div>}
                          </div>
                        </td>
                        <td>
                          <span className="cat-badge">{p.category_name || 'Uncategorized'}</span>
                        </td>
                        <td>
                          <span className="price-cell price-green">{formatCurrency(p.price)}</span>
                        </td>
                        <td>
                          <span className="price-cell price-gray">{formatCurrency(p.cost_price)}</span>
                        </td>
                        <td>
                          <span className="price-cell price-muted">{formatCurrency(p.shipping_cost || 0)}</span>
                        </td>
                        <td>
                          <span className={profit >= 0 ? 'profit-positive' : 'profit-negative'}>
                            {formatCurrency(profit)}
                          </span>
                          {pct !== null && (
                            <span className="profit-pct">({pct}%)</span>
                          )}
                        </td>
                        <td>
                          <span className={st.cls}>{p.stock}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{p.unit}</span>
                        </td>
                        <td>
                          <span className={st.statusCls}>{st.label}</span>
                        </td>
                        <td>
                          <div className="actions">
                            <button className="action-btn edit" onClick={() => openEdit(p)} title="Edit product">
                              <FiEdit2 size={13} />
                            </button>
                            <button className="action-btn delete" onClick={() => setConfirm(p)} title="Delete product">
                              <FiTrash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── GRID VIEW ── */}
          {viewMode === 'grid' && (
            loading
              ? <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div>
              : products.length === 0
                ? <div className="table-empty"><div className="table-empty-icon"><FiPackage /></div><h3>No products found</h3></div>
                : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
                    {products.map(p => {
                      const profit = getProfit(p)
                      const st = getStockClass(p)
                      return (
                        <div key={p.id} className="card"
                          style={{ padding: 18, cursor: 'default', border: '1px solid var(--border)' }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow)' }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 8 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.3 }}>{p.name}</div>
                            <span className={st.statusCls} style={{ flexShrink: 0, fontSize: 11 }}>{st.label}</span>
                          </div>
                          <span className="cat-badge" style={{ marginBottom: 14, display: 'inline-flex' }}>{p.category_name || 'Uncategorized'}</span>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14, marginTop: 8 }}>
                            {[
                              { label: 'Sell Price', value: formatCurrency(p.price), color: '#059669' },
                              { label: 'Cost Price', value: formatCurrency(p.cost_price), color: 'var(--text-secondary)' },
                              { label: 'Ship Cost', value: formatCurrency(p.shipping_cost || 0), color: 'var(--text-muted)' },
                              { label: 'Profit', value: formatCurrency(profit), color: profit >= 0 ? '#059669' : '#dc2626' },
                            ].map((item, j) => (
                              <div key={j} style={{ background: 'var(--bg)', borderRadius: 8, padding: '8px 10px' }}>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>{item.label}</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: item.color }}>{item.value}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                              Stock: <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.stock} {p.unit}</span>
                            </div>
                            <div className="actions">
                              <button className="action-btn edit" onClick={() => openEdit(p)} title="Edit"><FiEdit2 size={13} /></button>
                              <button className="action-btn delete" onClick={() => setConfirm(p)} title="Delete"><FiTrash2 size={13} /></button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
          )}
        </div>
      </div>

      {/* ── ADD / EDIT MODAL ── */}
      <Modal open={modal} onClose={() => setModal(false)}
        title={editing ? `Edit: ${editing.name}` : 'Add New Product'} size="lg">
        <form onSubmit={handleSave}>
          {/* Basic Info */}
          <div style={{ marginBottom: 6, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Basic Information</div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input className="form-control" value={form.name} onChange={set('name')} required placeholder="e.g. Basmati Rice 1kg" autoFocus={!editing} />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-control" value={form.category_id} onChange={set('category_id')}>
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <textarea className="form-control" value={form.description} onChange={set('description')} placeholder="Short product description..." rows={2} />
          </div>

          {/* Pricing */}
          <div style={{ background: '#f8faff', border: '1px solid #e0e7ff', borderRadius: 10, padding: '16px 18px', marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#4338ca', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>💰 Pricing</div>
            <div className="grid-3">
              {[
                { label: 'Selling Price (₹) *', key: 'selling_price', required: true },
                { label: 'Cost Price (₹)', key: 'cost_price' },
                { label: 'Shipping Cost (₹)', key: 'shipping_cost' },
              ].map(field => (
                <div className="form-group" key={field.key} style={{ marginBottom: 0 }}>
                  <label className="form-label">{field.label}</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 13, pointerEvents: 'none' }}>₹</span>
                    <input
                      className="form-control"
                      style={{ paddingLeft: 26 }}
                      type="number" step="0.01" min="0"
                      value={form[field.key]}
                      onChange={set(field.key)}
                      required={field.required}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              ))}
            </div>
            {/* Live profit preview */}
            {(liveSP > 0 || liveCP > 0) && (
              <div style={{ marginTop: 14, display: 'flex', gap: 20, padding: '10px 14px', background: '#fff', borderRadius: 8, border: '1px solid #e0e7ff' }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Profit / Unit</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: liveProfit >= 0 ? '#059669' : '#dc2626' }}>{formatCurrency(liveProfit)}</div>
                </div>
                {liveMargin !== null && (
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Margin</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: parseFloat(liveMargin) >= 0 ? '#059669' : '#dc2626' }}>{liveMargin}%</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stock */}
          <div style={{ background: '#f8fff8', border: '1px solid #d1fae5', borderRadius: 10, padding: '16px 18px', marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#065f46', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>📦 Stock Details</div>
            <div className="grid-3">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Opening Stock *</label>
                <input className="form-control" type="number" min="0" value={form.stock} onChange={set('stock')} placeholder="0" required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Low Stock Alert</label>
                <input className="form-control" type="number" min="1" value={form.low_stock_threshold} onChange={set('low_stock_threshold')} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Unit</label>
                <select className="form-control" value={form.unit} onChange={set('unit')}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Barcode (Optional)</label>
            <input className="form-control" value={form.barcode} onChange={set('barcode')} placeholder="Scan or type barcode" />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving
                ? <><span className="spinner" style={{ width: 14, height: 14, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> Saving...</>
                : editing ? '✓ Update Product' : '+ Add Product'
              }
            </button>
          </div>
        </form>
      </Modal>

      {/* ── ADD CATEGORY MODAL ── */}
      <Modal open={catModal} onClose={() => setCatModal(false)} title="Add New Category">
        <form onSubmit={handleAddCategory}>
          <div className="form-group">
            <label className="form-label">Category Name *</label>
            <input className="form-control" value={catName} onChange={e => setCatName(e.target.value)} required placeholder="e.g. Electronics, Grocery..." autoFocus />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={() => setCatModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={savingCat}>
              {savingCat ? 'Adding...' : 'Add Category'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirm} onClose={() => setConfirm(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Product"
        message={`Are you sure you want to delete "${confirm?.name}"? This action cannot be undone.`}
      />
    </div>
  )
}