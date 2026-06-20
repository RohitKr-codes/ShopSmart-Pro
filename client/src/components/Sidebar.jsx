import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  FiGrid, FiPackage, FiArchive, FiFileText, FiUsers,
  FiBarChart2, FiSettings, FiLogOut, FiShoppingCart,
  FiMenu, FiX, FiChevronLeft, FiChevronRight
} from 'react-icons/fi'
import '../styles/sidebar.css'

const navItems = [
  { label: 'MAIN', items: [
    { to: '/dashboard', icon: <FiGrid size={18} />, label: 'Dashboard' },
    { to: '/billing', icon: <FiShoppingCart size={18} />, label: 'New Bill' },
  ]},
  { label: 'INVENTORY', items: [
    { to: '/products', icon: <FiPackage size={18} />, label: 'Products' },
    { to: '/inventory', icon: <FiArchive size={18} />, label: 'Stock Manager' },
  ]},
  { label: 'SALES', items: [
    { to: '/invoices', icon: <FiFileText size={18} />, label: 'Invoices' },
    { to: '/customers', icon: <FiUsers size={18} />, label: 'Customers' },
  ]},
  { label: 'ANALYTICS', items: [
    { to: '/reports', icon: <FiBarChart2 size={18} />, label: 'Reports' },
    { to: '/settings', icon: <FiSettings size={18} />, label: 'Settings' },
  ]}
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  useEffect(() => {
    const handler = (e) => {
      if (mobileOpen && !e.target.closest('.sidebar') && !e.target.closest('.mobile-menu-btn')) {
        setMobileOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [mobileOpen])

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.55)',
            zIndex: 99, backdropFilter: 'blur(3px)'
          }}
        />
      )}

      {/* Mobile hamburger */}
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileOpen(v => !v)}
        style={{
          display: 'none',
          position: 'fixed', top: 12, left: 14,
          zIndex: 200, width: 40, height: 40,
          borderRadius: 10, background: 'var(--primary)',
          border: 'none', color: '#fff',
          alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: 'var(--shadow)'
        }}>
        {mobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
      </button>

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''} ${collapsed ? 'collapsed' : ''}`}>

        {/* ── Logo / Header ──
            Click logo to toggle collapse on desktop */}
        <div
          className="sidebar-logo"
          onClick={() => setCollapsed(v => !v)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{ cursor: 'pointer' }}
        >
          {/* Logo icon — always visible */}
          <div className="sidebar-logo-icon">
            <FiPackage size={20} color="#fff" />
          </div>

          {/* Text — hidden when collapsed */}
          {!collapsed && (
            <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
              <div className="sidebar-logo-text">StockMaster</div>
              <div className="sidebar-logo-sub">{user?.shop_name || 'Pro Edition'}</div>
            </div>
          )}

          {/* Arrow icon — shows direction */}
          <div className="collapse-arrow">
            {collapsed ? <FiChevronRight size={16} /> : <FiChevronLeft size={16} />}
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="sidebar-nav">
          {navItems.map((section, i) => (
            <div className="sidebar-section" key={i}>
              {!collapsed && (
                <div className="sidebar-section-title">{section.label}</div>
              )}
              {section.items.map((item, j) => (
                <NavLink
                  key={j}
                  to={item.to}
                  className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                  title={item.label}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  {!collapsed && (
                    <span className="sidebar-label">{item.label}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* ── Footer ── */}
        <div className="sidebar-footer">
          {!collapsed && (
            <div className="sidebar-user">
              <div className="sidebar-avatar">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                <div className="sidebar-user-name">
                  {user?.name}
                </div>
                <div className="sidebar-user-role">{user?.role}</div>
              </div>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="sidebar-item logout-btn"
            title="Logout"
          >
            <span className="sidebar-icon">
              <FiLogOut size={18} />
            </span>
            {!collapsed && (
              <span className="sidebar-label">Logout</span>
            )}
          </button>
        </div>

      </aside>
    </>
  )
}