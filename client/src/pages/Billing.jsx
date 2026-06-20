import { useState, useEffect, useRef } from 'react'
import { getProductsAPI } from '../api/product.api'
import { getCustomersAPI } from '../api/customer.api'
import { createBillAPI } from '../api/billing.api'
import { useToast } from '../context/ToastContext'
import { useNavigate } from 'react-router-dom'
import { formatCurrency } from '../utils/formatCurrency'
import QuantityInput from '../components/QuantityInput'
import {
  FiSearch, FiTrash2, FiShoppingCart,
  FiX, FiUser, FiUsers, FiChevronDown
} from 'react-icons/fi'
import { PAYMENT_METHODS } from '../utils/constants'

const GST_PRESETS = [0, 5, 12, 18, 28]

export default function Billing() {
  const [allProducts, setAllProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [items, setItems] = useState([])

  // Customer
  const [customerType, setCustomerType] = useState('walkin')
  const [customerId, setCustomerId] = useState('')
  const [customerName, setCustomerName] = useState('Walk-in Customer')
  const [custSearch, setCustSearch] = useState('')
  const [custLimit, setCustLimit] = useState(5)

  // Bill
  const [discount, setDiscount] = useState('')
  const [gstPercent, setGstPercent] = useState(18)
  const [gstCustom, setGstCustom] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  const searchRef = useRef(null)
  const dropdownRef = useRef(null)
  const { showSuccess, showError } = useToast()
  const navigate = useNavigate()

  // Load products and customers
  useEffect(() => {
    const loadAll = async () => {
      setLoadingData(true)
      try {
        const [p, c] = await Promise.all([getProductsAPI(), getCustomersAPI()])
        setAllProducts(p.data.products || [])
        setCustomers(c.data.customers || [])
      } catch { showError('Failed to load data') }
      finally { setLoadingData(false) }
    }
    loadAll()
  }, [])

  // Close product dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        searchRef.current && !searchRef.current.contains(e.target)
      ) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Reset customer when type changes
  useEffect(() => {
    setCustomerId('')
    setCustSearch('')
    setCustLimit(5)
    setCustomerName(customerType === 'walkin' ? 'Walk-in Customer' : '')
  }, [customerType])

  // Filtered products for search dropdown
  const filteredProducts = allProducts.filter(p =>
    !search.trim() ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode || '').toLowerCase().includes(search.toLowerCase())
  )

  // Filtered customers for customer search
  const filteredCustomers = customers.filter(c =>
    !custSearch.trim() ||
    c.name.toLowerCase().includes(custSearch.toLowerCase()) ||
    (c.phone || '').includes(custSearch)
  )

  // ── Add product to bill ──
  const addItem = (product) => {
    if (product.stock <= 0) { showError(`${product.name} is out of stock!`); return }
    setItems(prev => {
      const existing = prev.find(i => i.product_id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) {
          showError(`Max available: ${product.stock} ${product.unit}`)
          return prev
        }
        return prev.map(i =>
          i.product_id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, {
        product_id: product.id,
        product_name: product.name,
        price: parseFloat(product.price) || 0,
        priceStr: String(parseFloat(product.price) || 0),
        original_price: parseFloat(product.price) || 0,
        quantity: 1,
        max_stock: product.stock,
        unit: product.unit || 'pcs'
      }]
    })
    setSearch('')
    setShowDropdown(false)
    setTimeout(() => {
      const inp = searchRef.current?.querySelector('input')
      if (inp) inp.focus()
    }, 60)
  }

  const removeItem = (id) => setItems(prev => prev.filter(i => i.product_id !== id))

  // ── Quantity change — from QuantityInput ──
  const handleQtyChange = (id, newQty) => {
    setItems(prev => prev.map(i =>
      i.product_id === id ? { ...i, quantity: newQty } : i
    ))
  }

  // ── Price editing ──
  const handlePriceFocus = (id) => {
    setItems(prev => prev.map(i =>
      i.product_id === id
        ? { ...i, priceStr: i.price === 0 ? '' : String(i.price) }
        : i
    ))
  }

  const handlePriceChange = (id, val) => {
    setItems(prev => prev.map(i =>
      i.product_id === id
        ? { ...i, priceStr: val, price: parseFloat(val) || 0 }
        : i
    ))
  }

  const handlePriceBlur = (id) => {
    setItems(prev => prev.map(i => {
      if (i.product_id !== id) return i
      const finalPrice = parseFloat(i.priceStr) || 0
      return { ...i, price: finalPrice, priceStr: String(finalPrice) }
    }))
  }

  // ── Calculations ──
  const subtotal = items.reduce((s, i) => s + (i.price * i.quantity), 0)
  const discountAmt = Math.min(parseFloat(discount) || 0, subtotal)
  const afterDiscount = subtotal - discountAmt
  const gstAmount = (afterDiscount * gstPercent) / 100
  const total = afterDiscount + gstAmount
  const totalQty = items.reduce((s, i) => s + i.quantity, 0)

  // ── Submit bill ──
  const handleSubmit = async () => {
    if (items.length === 0) { showError('Add at least one product'); return }
    setSaving(true)
    try {
      const res = await createBillAPI({
        customer_id: customerId || null,
        customer_name: customerId
          ? customers.find(c => c.id === parseInt(customerId))?.name
          : customerName || 'Walk-in Customer',
        items: items.map(i => ({
          product_id: i.product_id,
          price: i.price,
          quantity: i.quantity
        })),
        discount: discountAmt,
        gst_percent: gstPercent,
        payment_method: paymentMethod,
        notes
      })
      showSuccess(`✅ Bill ${res.data.bill.bill_number} created!`)
      navigate('/invoices')
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to create bill')
    } finally { setSaving(false) }
  }

  const clearAll = () => {
    setItems([])
    setSearch('')
    setDiscount('')
    setGstPercent(18)
    setGstCustom(false)
    setPaymentMethod('cash')
    setNotes('')
    setCustomerId('')
    setCustomerName('Walk-in Customer')
    setCustSearch('')
    setCustomerType('walkin')
  }

  return (
    <div className="fade-in" style={{ paddingBottom: 40 }}>

      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">New Bill / POS</div>
          <div className="page-subtitle">
            {items.length > 0
              ? `${items.length} product${items.length > 1 ? 's' : ''} • ${totalQty} unit${totalQty > 1 ? 's' : ''} • ${formatCurrency(total)}`
              : 'Search and add products to create a bill'
            }
          </div>
        </div>
        {items.length > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={clearAll}>
            <FiX size={13} /> Clear Bill
          </button>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 370px',
        gap: 20,
        alignItems: 'start'
      }}>

        {/* ════════ LEFT PANEL ════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Product Search Card */}
          <div className="card">
            <div className="card-body">
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 14 }}>
                🔍 Search & Add Products
              </div>

              <div style={{ position: 'relative' }}>
                {/* Search input */}
                <div
                  ref={searchRef}
                  className="search-bar"
                  style={{ borderColor: showDropdown ? 'var(--primary)' : 'var(--border)' }}
                  onClick={() => setShowDropdown(true)}
                >
                  <FiSearch size={15} />
                  <input
                    placeholder={loadingData ? 'Loading products...' : `Search from ${allProducts.length} products...`}
                    value={search}
                    onChange={e => { setSearch(e.target.value); setShowDropdown(true) }}
                    onFocus={() => setShowDropdown(true)}
                    disabled={loadingData}
                    autoFocus
                  />
                  {search && (
                    <FiX
                      size={14}
                      style={{ cursor: 'pointer', flexShrink: 0, color: 'var(--text-muted)' }}
                      onClick={() => { setSearch(''); setShowDropdown(false) }}
                    />
                  )}
                </div>

                {/* Products dropdown */}
                {showDropdown && (
                  <div
                    ref={dropdownRef}
                    style={{
                      position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                      zIndex: 300, background: '#fff',
                      border: '1.5px solid var(--primary)',
                      borderRadius: 12, boxShadow: 'var(--shadow-lg)',
                      maxHeight: 320, overflowY: 'auto'
                    }}
                  >
                    {filteredProducts.length === 0 ? (
                      <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                        {search ? `No products found for "${search}"` : 'No products available'}
                      </div>
                    ) : filteredProducts.map(p => {
                      const added = items.find(i => i.product_id === p.id)
                      const outOfStock = p.stock <= 0
                      return (
                        <div
                          key={p.id}
                          onClick={() => !outOfStock && addItem(p)}
                          style={{
                            padding: '11px 16px',
                            borderBottom: '1px solid #f1f5f9',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            cursor: outOfStock ? 'not-allowed' : 'pointer',
                            opacity: outOfStock ? 0.45 : 1,
                            background: added ? '#f0f4ff' : '#fff',
                            transition: 'background 0.13s'
                          }}
                          onMouseEnter={e => { if (!outOfStock) e.currentTarget.style.background = added ? '#e8eeff' : '#f8fafc' }}
                          onMouseLeave={e => { e.currentTarget.style.background = added ? '#f0f4ff' : '#fff' }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              {p.name}
                              {added && <span style={{ fontSize: 10, background: 'var(--primary)', color: '#fff', padding: '1px 6px', borderRadius: 99 }}>IN BILL</span>}
                              {outOfStock && <span style={{ fontSize: 10, background: '#fee2e2', color: '#b91c1c', padding: '1px 6px', borderRadius: 99 }}>OUT OF STOCK</span>}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                              <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '1px 7px', borderRadius: 99, fontSize: 11 }}>{p.category_name || 'General'}</span>
                              <span style={{ marginLeft: 8 }}>
                                Stock: <span style={{ fontWeight: 600, color: outOfStock ? '#ef4444' : p.stock <= p.low_stock_threshold ? '#d97706' : '#059669' }}>
                                  {p.stock} {p.unit}
                                </span>
                              </span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--primary)' }}>{formatCurrency(p.price)}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>per {p.unit}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                💡 Click any product to add it to the bill
              </div>
            </div>
          </div>

          {/* Bill Items Card */}
          <div className="card">
            <div className="card-body">
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 14 }}>
                🛒 Bill Items
                {items.length > 0 && (
                  <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>
                    ({items.length} item{items.length > 1 ? 's' : ''}, {totalQty} units)
                  </span>
                )}
              </div>

              {items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <FiShoppingCart size={40} style={{ opacity: 0.2, display: 'block', margin: '0 auto 12px' }} />
                  <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 4 }}>No items added yet</div>
                  <div style={{ fontSize: 13 }}>Search and click a product above to add it here</div>
                </div>
              ) : (
                <div>
                  {/* Column headers */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 148px 120px 90px 36px',
                    gap: 8,
                    padding: '7px 10px',
                    background: '#f8fafc',
                    borderRadius: 8,
                    marginBottom: 8,
                    fontSize: 11, fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    <span>Product</span>
                    <span style={{ textAlign: 'center' }}>Quantity</span>
                    <span style={{ textAlign: 'center' }}>Price (₹)</span>
                    <span style={{ textAlign: 'right' }}>Total</span>
                    <span></span>
                  </div>

                  {/* Item rows */}
                  {items.map((item, idx) => (
                    <div
                      key={item.product_id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 148px 120px 90px 36px',
                        gap: 8,
                        alignItems: 'center',
                        padding: '10px 10px',
                        borderRadius: 10,
                        marginBottom: 6,
                        background: idx % 2 === 0 ? '#fafbff' : '#fff',
                        border: '1px solid #f0f0f0',
                        transition: 'box-shadow 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                    >
                      {/* Product name */}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>
                          {item.product_name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          Max: {item.max_stock} {item.unit}
                          {item.price !== item.original_price && (
                            <span style={{ color: '#d97706', marginLeft: 6 }}>
                              (orig: {formatCurrency(item.original_price)})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* ── QUANTITY — QuantityInput component ── */}
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <QuantityInput
                          value={item.quantity}
                          max={item.max_stock}
                          onChange={(newQty) => handleQtyChange(item.product_id, newQty)}
                          onError={(msg) => showError(msg)}
                        />
                      </div>

                      {/* ── PRICE — editable input ── */}
                      <div style={{ position: 'relative' }}>
                        <span style={{
                          position: 'absolute', left: 9, top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--text-muted)', fontSize: 12,
                          pointerEvents: 'none', zIndex: 1
                        }}>₹</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.priceStr}
                          onFocus={e => {
                            e.target.style.borderColor = 'var(--primary)'
                            handlePriceFocus(item.product_id)
                          }}
                          onChange={e => handlePriceChange(item.product_id, e.target.value)}
                          onBlur={e => {
                            e.target.style.borderColor = 'var(--border)'
                            handlePriceBlur(item.product_id)
                          }}
                          style={{
                            width: '100%',
                            padding: '7px 8px 7px 22px',
                            borderRadius: 7,
                            border: '1.5px solid var(--border)',
                            fontSize: 13, fontWeight: 600,
                            outline: 'none',
                            fontFamily: 'inherit',
                            transition: 'border 0.15s',
                            color: 'var(--text-primary)',
                            background: '#fff'
                          }}
                        />
                      </div>

                      {/* Line total */}
                      <div style={{
                        textAlign: 'right',
                        fontWeight: 700,
                        color: 'var(--primary)',
                        fontSize: 14,
                        whiteSpace: 'nowrap'
                      }}>
                        {formatCurrency(item.price * item.quantity)}
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => removeItem(item.product_id)}
                        style={{
                          width: 30, height: 30,
                          borderRadius: 7, border: 'none',
                          background: '#fee2e2', color: 'var(--danger)',
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s', flexShrink: 0
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.color = '#fff' }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = 'var(--danger)' }}
                        title="Remove item"
                      >
                        <FiTrash2 size={12} />
                      </button>
                    </div>
                  ))}

                  {/* Items subtotal */}
                  <div style={{
                    display: 'flex', justifyContent: 'flex-end',
                    padding: '12px 10px 0',
                    borderTop: '2px dashed var(--border)',
                    marginTop: 6, gap: 12, alignItems: 'center'
                  }}>
                    <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Items Subtotal:</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ════════ RIGHT PANEL ════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 76 }}>

          {/* Customer Card */}
          <div className="card">
            <div className="card-body">
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiUser size={15} /> Customer
              </div>

              {/* Walk-in / Regular toggle */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                {[
                  { key: 'walkin', icon: <FiUser size={14} />, label: 'Walk-in', sub: 'One-time customer' },
                  { key: 'regular', icon: <FiUsers size={14} />, label: 'Regular', sub: 'Existing customer' }
                ].map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setCustomerType(opt.key)}
                    style={{
                      padding: '10px 8px', borderRadius: 10,
                      border: `2px solid ${customerType === opt.key ? 'var(--primary)' : 'var(--border)'}`,
                      background: customerType === opt.key ? 'var(--primary-light)' : '#fff',
                      cursor: 'pointer', transition: 'all 0.18s', textAlign: 'center'
                    }}
                  >
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      color: customerType === opt.key ? 'var(--primary-dark)' : 'var(--text-secondary)',
                      fontWeight: 600, fontSize: 13, marginBottom: 2
                    }}>
                      {opt.icon} {opt.label}
                    </div>
                    <div style={{ fontSize: 10, color: customerType === opt.key ? 'var(--primary)' : 'var(--text-muted)' }}>
                      {opt.sub}
                    </div>
                  </button>
                ))}
              </div>

              {/* Walk-in: just name input */}
              {customerType === 'walkin' && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Customer Name
                  </label>
                  <input
                    className="form-control"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Walk-in Customer"
                  />
                </div>
              )}

              {/* Regular: search existing customers */}
              {customerType === 'regular' && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Search Customer
                  </label>
                  <div className="search-bar" style={{ marginBottom: 8 }}>
                    <FiSearch size={13} />
                    <input
                      placeholder="Name or phone..."
                      value={custSearch}
                      onChange={e => { setCustSearch(e.target.value); setCustLimit(5); setCustomerId('') }}
                    />
                    {custSearch && (
                      <FiX size={12} style={{ cursor: 'pointer', flexShrink: 0 }}
                        onClick={() => { setCustSearch(''); setCustomerId(''); setCustLimit(5) }} />
                    )}
                  </div>

                  <div style={{ border: '1.5px solid var(--border)', borderRadius: 10, overflow: 'hidden', maxHeight: 220, overflowY: 'auto' }}>
                    {filteredCustomers.length === 0 ? (
                      <div style={{ padding: 16, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                        {custSearch ? `No customer found for "${custSearch}"` : 'No customers yet'}
                      </div>
                    ) : (
                      <>
                        {filteredCustomers.slice(0, custLimit).map(c => (
                          <div
                            key={c.id}
                            onClick={() => { setCustomerId(c.id.toString()); setCustomerName(c.name); setCustSearch(c.name) }}
                            style={{
                              padding: '10px 12px', cursor: 'pointer',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              borderBottom: '1px solid #f1f5f9',
                              background: customerId === c.id.toString() ? 'var(--primary-light)' : '#fff',
                              transition: 'background 0.13s'
                            }}
                            onMouseEnter={e => { if (customerId !== c.id.toString()) e.currentTarget.style.background = '#f8fafc' }}
                            onMouseLeave={e => { e.currentTarget.style.background = customerId === c.id.toString() ? 'var(--primary-light)' : '#fff' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                              <div style={{
                                width: 30, height: 30, borderRadius: 8,
                                background: customerId === c.id.toString() ? 'var(--primary)' : '#e0e7ff',
                                color: customerId === c.id.toString() ? '#fff' : 'var(--primary-dark)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, fontSize: 13, flexShrink: 0
                              }}>
                                {c.name[0].toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 13, color: customerId === c.id.toString() ? 'var(--primary-dark)' : 'var(--text-primary)' }}>
                                  {c.name}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.phone || 'No phone'}</div>
                              </div>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              ₹{Math.round(c.total_purchases || 0).toLocaleString('en-IN')}
                            </div>
                          </div>
                        ))}

                        {filteredCustomers.length > custLimit && (
                          <div
                            onClick={() => setCustLimit(l => l + 5)}
                            style={{
                              padding: '10px', textAlign: 'center', fontSize: 13,
                              color: 'var(--primary)', fontWeight: 600, cursor: 'pointer',
                              background: '#f8faff', borderTop: '1px solid var(--border)',
                              transition: 'background 0.15s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-light)'}
                            onMouseLeave={e => e.currentTarget.style.background = '#f8faff'}
                          >
                            <FiChevronDown size={13} style={{ marginRight: 4 }} />
                            Load more ({filteredCustomers.length - custLimit} remaining)
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {customerId && (
                    <div style={{ marginTop: 8, padding: '7px 12px', background: '#dcfce7', borderRadius: 8, fontSize: 12, color: '#15803d', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>✓ Selected: {customerName}</span>
                      <button
                        onClick={() => { setCustomerId(''); setCustSearch(''); setCustomerName('') }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#15803d', fontWeight: 800, fontSize: 16, lineHeight: 1 }}>
                        ×
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bill Summary Card */}
          <div className="card">
            <div className="card-body">
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>📋 Bill Summary</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Subtotal */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Subtotal ({totalQty} units)</span>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(subtotal)}</span>
                </div>

                {/* Discount */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Discount (₹)</span>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--text-muted)', pointerEvents: 'none' }}>₹</span>
                    <input
                      type="number" min="0" max={subtotal}
                      value={discount}
                      onChange={e => setDiscount(e.target.value)}
                      onFocus={e => { if (e.target.value === '0') e.target.value = ''; e.target.style.borderColor = 'var(--primary)' }}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'}
                      placeholder="0"
                      style={{
                        width: 90, paddingLeft: 22, padding: '6px 8px 6px 20px',
                        borderRadius: 7, border: '1.5px solid var(--border)',
                        fontSize: 13, textAlign: 'right', outline: 'none',
                        fontFamily: 'inherit', transition: 'border 0.15s'
                      }}
                    />
                  </div>
                </div>

                {discountAmt > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-muted)' }}>After Discount</span>
                    <span style={{ color: 'var(--success)', fontWeight: 600 }}>{formatCurrency(afterDiscount)}</span>
                  </div>
                )}

                {/* GST */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>GST</span>
                    <button
                      type="button"
                      onClick={() => setGstCustom(v => !v)}
                      style={{ fontSize: 11, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '2px 6px', borderRadius: 6 }}>
                      {gstCustom ? '← Use presets' : 'Custom %'}
                    </button>
                  </div>

                  {gstCustom ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)', flexShrink: 0 }}>GST %</span>
                      <input
                        type="number" min="0" max="100" step="0.1"
                        value={gstPercent}
                        onChange={e => setGstPercent(parseFloat(e.target.value) || 0)}
                        onFocus={e => { e.target.select(); e.target.style.borderColor = 'var(--primary)' }}
                        onBlur={e => e.target.style.borderColor = 'var(--border)'}
                        style={{
                          flex: 1, padding: '7px 10px', borderRadius: 7,
                          border: '1.5px solid var(--border)', fontSize: 15,
                          fontWeight: 700, outline: 'none',
                          textAlign: 'center', fontFamily: 'inherit'
                        }}
                      />
                      <span style={{ fontSize: 13, color: 'var(--text-muted)', flexShrink: 0 }}>%</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 5 }}>
                      {GST_PRESETS.map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setGstPercent(r)}
                          style={{
                            flex: 1, padding: '7px 4px',
                            borderRadius: 8,
                            border: `2px solid ${gstPercent === r ? 'var(--primary)' : 'var(--border)'}`,
                            background: gstPercent === r ? 'var(--primary)' : '#fff',
                            color: gstPercent === r ? '#fff' : 'var(--text-secondary)',
                            fontSize: 12, fontWeight: 700, cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}>
                          {r}%
                        </button>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 7, color: 'var(--text-muted)' }}>
                    <span>GST Amount ({gstPercent}%)</span>
                    <span>{formatCurrency(gstAmount)}</span>
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '2px dashed var(--border)', margin: '2px 0' }} />

                {/* Total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>TOTAL</span>
                  <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Card */}
          <div className="card">
            <div className="card-body">
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>💳 Payment Method</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 14 }}>
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    style={{
                      padding: '8px 4px', borderRadius: 8,
                      border: `2px solid ${paymentMethod === m ? 'var(--primary)' : 'var(--border)'}`,
                      background: paymentMethod === m ? 'var(--primary-light)' : '#fff',
                      color: paymentMethod === m ? 'var(--primary-dark)' : 'var(--text-secondary)',
                      fontWeight: paymentMethod === m ? 700 : 400,
                      fontSize: 11, cursor: 'pointer',
                      textTransform: 'uppercase', transition: 'all 0.15s'
                    }}>
                    {m}
                  </button>
                ))}
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Notes (Optional)
                </label>
                <textarea
                  className="form-control"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any special instructions..."
                  rows={2}
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Submit */}
              <button
                className="btn btn-success btn-lg"
                onClick={handleSubmit}
                disabled={saving || items.length === 0}
                style={{ width: '100%', justifyContent: 'center', fontSize: 15, fontWeight: 700 }}
              >
                {saving
                  ? <><span className="spinner" style={{ width: 16, height: 16, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> Creating Bill...</>
                  : <><FiShoppingCart size={16} /> Create Bill — {formatCurrency(total)}</>
                }
              </button>

              {items.length === 0 && (
                <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                  Add products above to enable billing
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}