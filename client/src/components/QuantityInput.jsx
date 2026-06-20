import { useState, useEffect, useRef } from 'react'
import { FiPlus, FiMinus } from 'react-icons/fi'

export default function QuantityInput({ value, max, onChange, onError }) {
  const [display, setDisplay] = useState(String(value))
  const inputRef = useRef(null)

  useEffect(() => {
    setDisplay(String(value))
  }, [value])

  const commit = (raw) => {
    // Parse as INTEGER only — no decimals
    const num = Math.floor(parseFloat(raw))
    if (isNaN(num) || num < 1) {
      setDisplay(String(value))
      return
    }
    if (max !== undefined && num > max) {
      onError?.(`Max available: ${max}`)
      setDisplay(String(max))
      onChange(max)
      return
    }
    setDisplay(String(num))
    onChange(num)
  }

  const handleChange = (e) => {
    setDisplay(e.target.value)
  }

  const handleBlur = () => {
    commit(display)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { commit(display); inputRef.current?.blur() }
    if (e.key === 'ArrowUp') { e.preventDefault(); const next = Math.min(value + 1, max ?? Infinity); setDisplay(String(next)); onChange(next) }
    if (e.key === 'ArrowDown') { e.preventDefault(); const next = Math.max(value - 1, 1); setDisplay(String(next)); onChange(next) }
    // Block decimal point and minus
    if (e.key === '.' || e.key === ',' || e.key === '-') { e.preventDefault() }
  }

  const handleFocus = (e) => {
    e.target.select()
  }

  const inc = () => {
    if (max !== undefined && value >= max) { onError?.(`Max available: ${max}`); return }
    const next = value + 1
    setDisplay(String(next))
    onChange(next)
  }

  const dec = () => {
    if (value <= 1) return
    const next = value - 1
    setDisplay(String(next))
    onChange(next)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <button
        type="button"
        onClick={dec}
        disabled={value <= 1}
        style={{
          width: 30, height: 30, borderRadius: 7,
          border: '1.5px solid var(--border)',
          background: value <= 1 ? '#f8fafc' : '#fff',
          color: value <= 1 ? '#cbd5e1' : '#ef4444',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: value <= 1 ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s', flexShrink: 0
        }}
        onMouseEnter={e => { if (value > 1) { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.borderColor = '#ef4444' } }}
        onMouseLeave={e => { e.currentTarget.style.background = value <= 1 ? '#f8fafc' : '#fff'; e.currentTarget.style.borderColor = 'var(--border)' }}>
        <FiMinus size={12} />
      </button>

      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={display}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        style={{
          width: 48, textAlign: 'center',
          padding: '6px 4px', borderRadius: 7,
          border: '1.5px solid var(--border)',
          fontSize: 15, fontWeight: 700,
          color: 'var(--text-primary)', background: '#fff',
          outline: 'none', fontFamily: 'inherit',
          transition: 'border-color 0.15s'
        }}
        onMouseEnter={e => e.target.style.borderColor = 'var(--primary)'}
        onMouseLeave={e => { if (document.activeElement !== e.target) e.target.style.borderColor = 'var(--border)' }}
      />

      <button
        type="button"
        onClick={inc}
        disabled={max !== undefined && value >= max}
        style={{
          width: 30, height: 30, borderRadius: 7,
          border: '1.5px solid var(--border)',
          background: (max !== undefined && value >= max) ? '#f8fafc' : '#fff',
          color: (max !== undefined && value >= max) ? '#cbd5e1' : '#10b981',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: (max !== undefined && value >= max) ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s', flexShrink: 0
        }}
        onMouseEnter={e => { if (!(max !== undefined && value >= max)) { e.currentTarget.style.background = '#dcfce7'; e.currentTarget.style.borderColor = '#10b981' } }}
        onMouseLeave={e => { e.currentTarget.style.background = (max !== undefined && value >= max) ? '#f8fafc' : '#fff'; e.currentTarget.style.borderColor = 'var(--border)' }}>
        <FiPlus size={12} />
      </button>
    </div>
  )
}