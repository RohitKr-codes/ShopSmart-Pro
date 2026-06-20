import { useState, useEffect, useCallback } from 'react'
import { getBillsAPI, deleteBillAPI, deleteMultipleBillsAPI, downloadPDFAPI } from '../api/billing.api'
import { useToast } from '../context/ToastContext'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDateTime } from '../utils/formatDate'
import {
  FiDownload, FiSearch, FiTrash2, FiX,
  FiCheckSquare, FiSquare, FiAlertTriangle,
  FiFileText, FiRefreshCw, FiFilter
} from 'react-icons/fi'

const LIMIT = 10

export default function Invoices() {
  const [bills, setBills] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState([])
  const [confirmSingle, setConfirmSingle] = useState(null)
  const [confirmBulk, setConfirmBulk] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [downloading, setDownloading] = useState(null)
  const { showSuccess, showError } = useToast()

  const load = useCallback(async (pg = page) => {
    setLoading(true)
    try {
      const res = await getBillsAPI({ search, from_date: fromDate, to_date: toDate, limit: LIMIT, page: pg })
      setBills(res.data.bills || [])
      setTotal(res.data.total || 0)
      setSelected([])
    } catch { showError('Failed to load invoices') }
    finally { setLoading(false) }
  }, [search, fromDate, toDate, page])

  useEffect(() => { setPage(1); load(1) }, [search, fromDate, toDate])
  useEffect(() => { load(page) }, [page])

  const downloadPDF = async (id, billNo) => {
    setDownloading(id)
    try {
      const res = await downloadPDFAPI(id)
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a'); a.href = url; a.download = `Invoice-${billNo}.pdf`; a.click()
      URL.revokeObjectURL(url)
      showSuccess('Invoice downloaded!')
    } catch { showError('Failed to download PDF') }
    finally { setDownloading(null) }
  }

  const handleDeleteSingle = async () => {
    if (!confirmSingle) return
    setDeleting(true)
    try {
      await deleteBillAPI(confirmSingle.id)
      showSuccess(`Bill ${confirmSingle.bill_number} deleted`)
      setConfirmSingle(null)
      load(page)
    } catch { showError('Failed to delete bill') }
    finally { setDeleting(false) }
  }

  const handleDeleteBulk = async () => {
    setDeleting(true)
    try {
      await deleteMultipleBillsAPI(selected)
      showSuccess(`${selected.length} bill(s) deleted`)
      setConfirmBulk(false)
      setSelected([])
      load(page)
    } catch { showError('Failed to delete bills') }
    finally { setDeleting(false) }
  }

  const toggleSelect = (id) => setSelected(prev =>
    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
  )

  const toggleAll = () => setSelected(prev =>
    prev.length === bills.length ? [] : bills.map(b => b.id)
  )

  const allSelected = bills.length > 0 && selected.length === bills.length
  const totalPages = Math.ceil(total / LIMIT)

  const statusStyle = (status) => ({
    display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
    borderRadius: 99, fontSize: 12, fontWeight: 600,
    background: status === 'paid' ? '#dcfce7' : '#fef3c7',
    color: status === 'paid' ? '#15803d' : '#92400e'
  })

  const payBadge = (method) => ({
    display: 'inline-flex', alignItems: 'center', padding: '3px 9px',
    borderRadius: 99, fontSize: 11, fontWeight: 600,
    background: '#e0e7ff', color: '#4338ca', textTransform: 'uppercase'
  })

  return (
    <div className="fade-in" style={{ paddingBottom: 40 }}>

      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Invoices</div>
          <div className="page-subtitle">{total} total bills</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {selected.length > 0 && (
            <button className="btn btn-danger btn-sm" onClick={() => setConfirmBulk(true)}>
              <FiTrash2 size={13} /> Delete Selected ({selected.length})
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => load(page)}>
            <FiRefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="search-bar" style={{ flex: 1, minWidth: 220, maxWidth: 320 }}>
              <FiSearch size={14} />
              <input placeholder="Search bill no. or customer..." value={search} onChange={e => setSearch(e.target.value)} />
              {search && <FiX size={13} style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => setSearch('')} />}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FiFilter size={13} style={{ color: 'var(--text-muted)' }} />
              <input type="date" className="form-control" style={{ width: 155, height: 42 }} value={fromDate} onChange={e => setFromDate(e.target.value)} />
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>to</span>
              <input type="date" className="form-control" style={{ width: 155, height: 42 }} value={toDate} onChange={e => setToDate(e.target.value)} />
              {(fromDate || toDate) && (
                <button className="btn btn-ghost btn-sm" onClick={() => { setFromDate(''); setToDate('') }}>
                  <FiX size={13} /> Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 44, paddingLeft: 16 }}>
                    <button onClick={toggleAll}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: allSelected ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 0 }}>
                      {allSelected ? <FiCheckSquare size={17} /> : <FiSquare size={17} />}
                    </button>
                  </th>
                  <th>Bill Number</th>
                  <th>Customer</th>
                  <th>Subtotal</th>
                  <th>Discount</th>
                  <th>GST</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={11} style={{ textAlign: 'center', padding: 48 }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
                  </td></tr>
                ) : bills.length === 0 ? (
                  <tr><td colSpan={11}>
                    <div style={{ textAlign: 'center', padding: '52px 20px', color: 'var(--text-muted)' }}>
                      <FiFileText size={40} style={{ opacity: 0.25, display: 'block', margin: '0 auto 12px' }} />
                      <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-secondary)', marginBottom: 4 }}>No invoices found</div>
                      <div style={{ fontSize: 13 }}>Create your first bill from the Billing page</div>
                    </div>
                  </td></tr>
                ) : bills.map(b => (
                  <tr key={b.id} style={{ background: selected.includes(b.id) ? '#f0f4ff' : undefined }}>
                    <td style={{ paddingLeft: 16 }}>
                      <button onClick={() => toggleSelect(b.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: selected.includes(b.id) ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 0 }}>
                        {selected.includes(b.id) ? <FiCheckSquare size={17} /> : <FiSquare size={17} />}
                      </button>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 13, letterSpacing: '0.02em' }}>{b.bill_number}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{b.customer_name}</div>
                      {b.created_by_name && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>by {b.created_by_name}</div>}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{formatCurrency(b.subtotal)}</td>
                    <td style={{ color: 'var(--danger)', fontSize: 13 }}>
                      {b.discount > 0 ? `-${formatCurrency(b.discount)}` : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{formatCurrency(b.gst_amount)}</td>
                    <td><span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>{formatCurrency(b.total)}</span></td>
                    <td><span style={payBadge(b.payment_method)}>{b.payment_method}</span></td>
                    <td><span style={statusStyle(b.payment_status)}>{b.payment_status}</span></td>
                    <td><span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDateTime(b.created_at)}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button
                          className="action-btn pdf"
                          onClick={() => downloadPDF(b.id, b.bill_number)}
                          disabled={downloading === b.id}
                          title="Download PDF Invoice">
                          {downloading === b.id
                            ? <span className="spinner" style={{ width: 12, height: 12, borderTopColor: '#92400e', borderColor: 'rgba(146,64,14,0.2)' }} />
                            : <FiDownload size={13} />}
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => setConfirmSingle(b)}
                          title="Delete this bill">
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Showing {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} of {total} bills
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p}
                    onClick={() => setPage(p)}
                    style={{
                      width: 34, height: 34, borderRadius: 8, border: '1.5px solid',
                      borderColor: page === p ? 'var(--primary)' : 'var(--border)',
                      background: page === p ? 'var(--primary)' : '#fff',
                      color: page === p ? '#fff' : 'var(--text-secondary)',
                      cursor: 'pointer', fontWeight: page === p ? 700 : 400, fontSize: 13,
                      transition: 'all 0.15s'
                    }}>{p}</button>
                ))}
                <button className="btn btn-ghost btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── SINGLE DELETE CONFIRM ── */}
      {confirmSingle && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'fadeIn 0.2s ease' }}>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 420, padding: 32, textAlign: 'center', animation: 'scaleIn 0.25s ease' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <FiAlertTriangle size={28} color="#ef4444" />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Delete Bill?</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.6 }}>
              Are you sure you want to delete bill
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary)', marginBottom: 6 }}>{confirmSingle.bill_number}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
              Customer: {confirmSingle.customer_name} • {formatCurrency(confirmSingle.total)}
              <br /><span style={{ color: 'var(--danger)', fontWeight: 500 }}>This action cannot be undone.</span>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setConfirmSingle(null)} disabled={deleting} style={{ minWidth: 100 }}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteSingle} disabled={deleting} style={{ minWidth: 120 }}>
                {deleting ? <><span className="spinner" style={{ width: 14, height: 14, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> Deleting...</> : <><FiTrash2 size={13} /> Yes, Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BULK DELETE CONFIRM ── */}
      {confirmBulk && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'fadeIn 0.2s ease' }}>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 420, padding: 32, textAlign: 'center', animation: 'scaleIn 0.25s ease' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <FiAlertTriangle size={28} color="#ef4444" />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Delete {selected.length} Bills?</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
              You are about to permanently delete <strong>{selected.length} selected bill(s)</strong>.
              <br /><span style={{ color: 'var(--danger)', fontWeight: 500 }}>This action cannot be undone.</span>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setConfirmBulk(false)} disabled={deleting} style={{ minWidth: 100 }}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteBulk} disabled={deleting} style={{ minWidth: 140 }}>
                {deleting ? <><span className="spinner" style={{ width: 14, height: 14, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> Deleting...</> : <><FiTrash2 size={13} /> Delete {selected.length} Bills</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}