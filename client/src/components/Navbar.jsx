import { useState, useEffect, useRef } from 'react'
import { FiBell, FiUser, FiAlertTriangle, FiPackage, FiX, FiCheck } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { getLowStockAPI } from '../api/inventory.api'
import { useNavigate } from 'react-router-dom'

export default function Navbar({ title }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notifOpen, setNotifOpen] = useState(false)
  const [lowStock, setLowStock] = useState([])
  const [dismissed, setDismissed] = useState([])
  const notifRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getLowStockAPI()
        setLowStock(res.data.products || [])
      } catch {}
    }
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const activeNotifs = lowStock.filter(p => !dismissed.includes(p.id))
  const hasNotifs = activeNotifs.length > 0

  const dismiss = (id, e) => {
    e.stopPropagation()
    setDismissed(prev => [...prev, id])
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-title">{title}</div>
      </div>
      <div className="topbar-right">

        {/* Notification Bell */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            className="topbar-btn"
            onClick={() => setNotifOpen(v => !v)}
            title="Notifications"
            style={{ borderColor: notifOpen ? 'var(--primary)' : undefined, background: notifOpen ? 'var(--primary-light)' : undefined }}>
            <FiBell size={17} />
            {hasNotifs && <span className="notif-dot" />}
          </button>

          {notifOpen && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <span>🔔 Notifications</span>
                {activeNotifs.length > 0 && (
                  <span style={{ background: '#fee2e2', color: '#b91c1c', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 99 }}>
                    {activeNotifs.length} alert{activeNotifs.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {activeNotifs.length === 0 ? (
                <div className="notif-empty">
                  <FiCheck size={24} style={{ opacity: 0.3, display: 'block', margin: '0 auto 8px' }} />
                  All stock levels are healthy!
                </div>
              ) : (
                <>
                  {activeNotifs.slice(0, 6).map(p => (
                    <div key={p.id} className="notif-item"
                      onClick={() => { navigate('/inventory'); setNotifOpen(false) }}>
                      <div className="notif-icon" style={{ background: p.stock === 0 ? '#fee2e2' : '#fef3c7', color: p.stock === 0 ? '#ef4444' : '#d97706' }}>
                        {p.stock === 0 ? <FiX size={15} /> : <FiAlertTriangle size={15} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="notif-text">
                          <strong>{p.name}</strong>
                          {p.stock === 0
                            ? <span style={{ color: '#ef4444' }}> is out of stock!</span>
                            : <span style={{ color: '#d97706' }}> is low — only <strong>{p.stock} {p.unit}</strong> left</span>
                          }
                        </div>
                        <div className="notif-time">Click to go to Stock Manager</div>
                      </div>
                      <button
                        onClick={(e) => dismiss(p.id, e)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, borderRadius: 4, flexShrink: 0 }}
                        title="Dismiss">
                        <FiX size={13} />
                      </button>
                    </div>
                  ))}
                  {activeNotifs.length > 6 && (
                    <div style={{ padding: '10px 18px', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
                      +{activeNotifs.length - 6} more alerts
                    </div>
                  )}
                  <div
                    onClick={() => { navigate('/inventory'); setNotifOpen(false) }}
                    style={{ padding: '11px 18px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--primary)', cursor: 'pointer', background: '#f8faff', borderTop: '1px solid var(--border)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-light)'}
                    onMouseLeave={e => e.currentTarget.style.background = '#f8faff'}>
                    View Stock Manager →
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* User badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--primary-light)', borderRadius: 10, padding: '6px 12px',
          cursor: 'pointer', transition: 'var(--transition)'
        }}
          onClick={() => navigate('/settings')}
          onMouseEnter={e => e.currentTarget.style.background = '#c7d2fe'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--primary-light)'}
          title="Go to Settings">
          <div style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiUser size={13} color="#fff" />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary-dark)' }}>{user?.name}</span>
        </div>
      </div>
    </header>
  )
}