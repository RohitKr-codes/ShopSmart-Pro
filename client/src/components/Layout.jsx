import { useState } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { useLocation } from 'react-router-dom'

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/products': 'Products',
  '/inventory': 'Stock Manager',
  '/billing': 'New Bill',
  '/invoices': 'Invoices',
  '/customers': 'Customers',
  '/reports': 'Reports',
  '/settings': 'Settings'
}

export default function Layout({ children }) {
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'StockMaster'
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="layout">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className={`main-content ${collapsed ? 'collapsed' : ''}`}>
        <Navbar title={title} />
        <main className="page-content">{children}</main>
      </div>
    </div>
  )
}