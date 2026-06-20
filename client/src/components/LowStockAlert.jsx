import { useState, useEffect } from 'react'
import { getLowStockAPI } from '../api/inventory.api'
import { FiAlertTriangle } from 'react-icons/fi'

export default function LowStockAlert() {
  const [items, setItems] = useState([])

  useEffect(() => {
    const check = async () => {
      try {
        const res = await getLowStockAPI()
        setItems(res.data.products || [])
      } catch {}
    }
    check()
    const interval = setInterval(check, 30000)
    return () => clearInterval(interval)
  }, [])

  if (items.length === 0) return null

  return (
    <div style={{
      background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10,
      padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10, animation: 'slideDown 0.3s ease'
    }}>
      <FiAlertTriangle color="#d97706" size={18} style={{ flexShrink: 0, marginTop: 1 }} />
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#92400e', marginBottom: 4 }}>
          {items.length} product{items.length > 1 ? 's' : ''} running low on stock
        </div>
        <div style={{ fontSize: 12, color: '#b45309' }}>
          {items.slice(0, 3).map(i => `${i.name} (${i.stock} left)`).join(' • ')}
          {items.length > 3 && ` • +${items.length - 3} more`}
        </div>
      </div>
    </div>
  )
}