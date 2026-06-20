import { useState, useEffect } from 'react'
import { getCustomersAPI, createCustomerAPI, updateCustomerAPI, deleteCustomerAPI } from '../api/customer.api'
import { useToast } from '../context/ToastContext'
import Modal from '../components/Modal'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate } from '../utils/formatDate'
import {
  FiPlus, FiEdit2, FiTrash2, FiSearch,
  FiX, FiAlertTriangle, FiStar, FiUser, FiRefreshCw
} from 'react-icons/fi'

const empty = { name: '', phone: '', email: '', address: '' }

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [pinned, setPinned] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pinnedCustomers') || '[]') } catch { return [] }
  })
  const { showSuccess, showError } = useToast()
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const load = async () => {
    setLoading(true)
    try {
      const res = await getCustomersAPI({ search })
      setCustomers(res.data.customers || [])
    } catch { showError('Failed to load customers') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [search])

  const togglePin = (id) => {
    setPinned(prev => {
      const next = prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
      localStorage.setItem('pinnedCustomers', JSON.stringify(next))
      return next
    })
  }

  const sorted = [...customers].sort((a, b) => {
    const aP = pinned.includes(a.id), bP = pinned.includes(b.id)
    if (aP && !bP) return -1
    if (!aP && bP) return 1
    return 0
  })

  const openAdd = () => { setEditing(null); setForm(empty); setModal(true) }
  const openEdit = c => { setEditing(c); setForm({ name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '' }); setModal(true) }

  const handleSave = async e => {
    e.preventDefault()
    if (!form.name.trim()) { showError('Customer name is required'); return }
    setSaving(true)
    try {
      if (editing) { await updateCustomerAPI(editing.id, form); showSuccess('Customer updated!') }
      else { await createCustomerAPI(form); showSuccess('Customer added!') }
      setModal(false); load()
    } catch (err) { showError(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteCustomerAPI(confirm.id)
      showSuccess('Customer deleted')
      setPinned(prev => { const n = prev.filter(p => p !== confirm.id); localStorage.setItem('pinnedCustomers', JSON.stringify(n)); return n })
      setConfirm(null); load()
    } catch { showError('Failed to delete customer') }
    finally { setDeleting(false) }
  }

  const totalPurchases = customers.reduce((s, c) => s + (c.total_purchases || 0), 0)

  return (
    <div className="fade-in" style={{ paddingBottom: 40 }}>

      <div className="page-header">
        <div>
          <div className="page-title">Customers</div>
          <div className="page-subtitle">{customers.length} customers • {pinned.length} pinned</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={load}><FiRefreshCw size={13} /> Refresh</button>
          <button className="btn btn-primary" onClick={openAdd}><FiPlus size={14} /> Add Customer</button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid-3" style={{ marginBottom: 22 }}>
        {[
          { label: 'Total Customers', value: customers.length, color: '#6366f1', bg: '#e0e7ff', icon: <FiUser size={20} /> },
          { label: 'Pinned Customers', value: pinned.length, color: '#f59e0b', bg: '#fef3c7', icon: <FiStar size={20} /> },
          { label: 'Total Revenue', value: formatCurrency(totalPurchases), color: '#10b981', bg: '#d1fae5', icon: <FiUser size={20} /> },
        ].map((card, i) => (
          <div key={i} className="card" style={{ padding: '16px 20px' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 11, background: card.bg, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{card.icon}</div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 1 }}>{card.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: card.color }}>{card.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-body">
          {/* Search */}
          <div style={{ marginBottom: 16 }}>
            <div className="search-bar" style={{ maxWidth: 360 }}>
              <FiSearch size={14} />
              <input placeholder="Search by name, phone or email..." value={search} onChange={e => setSearch(e.target.value)} />
              {search && <FiX size={13} style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => setSearch('')} />}
            </div>
            {pinned.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>⭐ Pinned:</span>
                {customers.filter(c => pinned.includes(c.id)).map(c => (
                  <span key={c.id} style={{ background: '#fef3c7', color: '#92400e', fontSize: 12, fontWeight: 500, padding: '3px 10px', borderRadius: 99 }}>{c.name}</span>
                ))}
              </div>
            )}
          </div>

          {/* Table */}
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 44 }}></th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Total Purchases</th>
                  <th>Member Since</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                ) : sorted.length === 0 ? (
                  <tr><td colSpan={7}>
                    <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                      <FiUser size={36} style={{ opacity: 0.25, display: 'block', margin: '0 auto 12px' }} />
                      <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-secondary)', marginBottom: 4 }}>No customers found</div>
                      <div style={{ fontSize: 13 }}>Add your first customer to get started</div>
                    </div>
                  </td></tr>
                ) : sorted.map(c => {
                  const isPinned = pinned.includes(c.id)
                  return (
                    <tr key={c.id} style={{ background: isPinned ? '#fffbeb' : undefined }}>
                      <td style={{ paddingLeft: 16 }}>
                        <button
                          onClick={() => togglePin(c.id)}
                          title={isPinned ? 'Unpin customer' : 'Pin to top'}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, color: isPinned ? '#f59e0b' : 'var(--text-muted)', transition: 'all 0.18s' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#f59e0b'}
                          onMouseLeave={e => e.currentTarget.style.color = isPinned ? '#f59e0b' : 'var(--text-muted)'}>
                          <FiStar size={16} fill={isPinned ? '#f59e0b' : 'none'} />
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: isPinned ? '#fef3c7' : 'var(--primary-light)', color: isPinned ? '#92400e' : 'var(--primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                            {c.name[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                              {c.name}
                              {isPinned && <span style={{ fontSize: 10, background: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: 99, marginLeft: 6, fontWeight: 600 }}>PINNED</span>}
                            </div>
                            {c.address && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.address.slice(0, 40)}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 14 }}>{c.phone || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                      <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{c.email || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                      <td><span style={{ fontWeight: 700, color: '#059669', fontSize: 14 }}>{formatCurrency(c.total_purchases)}</span></td>
                      <td><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(c.created_at)}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button className="action-btn edit" onClick={() => openEdit(c)} title="Edit customer"><FiEdit2 size={13} /></button>
                          <button className="action-btn delete" onClick={() => setConfirm(c)} title="Delete customer"><FiTrash2 size={13} /></button>
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

      {/* Add/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? `Edit: ${editing.name}` : 'Add New Customer'}>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="form-control" value={form.name} onChange={set('name')} required placeholder="Customer full name" autoFocus={!editing} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input className="form-control" value={form.phone} onChange={set('phone')} placeholder="9876543210" />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-control" type="email" value={form.email} onChange={set('email')} placeholder="email@example.com" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea className="form-control" value={form.address} onChange={set('address')} placeholder="Full address..." rows={2} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editing ? '✓ Update Customer' : '+ Add Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      {confirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'fadeIn 0.2s ease' }}>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 400, padding: 32, textAlign: 'center', animation: 'scaleIn 0.25s ease' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <FiAlertTriangle size={26} color="#ef4444" />
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Delete Customer?</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 6 }}>
              Are you sure you want to delete
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary)', marginBottom: 16 }}>{confirm.name}</div>
            <div style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 500, marginBottom: 24 }}>This action cannot be undone.</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setConfirm(null)} disabled={deleting} style={{ minWidth: 96 }}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={deleting} style={{ minWidth: 120 }}>
                {deleting ? <><span className="spinner" style={{ width: 13, height: 13, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> Deleting...</> : <><FiTrash2 size={13} /> Yes, Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}