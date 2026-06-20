import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerAPI } from '../api/auth.api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { FiPackage } from 'react-icons/fi'
import '../styles/auth.css'

export default function Register() {
  const [form, setForm] = useState({ name:'', email:'', password:'', shop_name:'', phone:'' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { showSuccess, showError } = useToast()
  const navigate = useNavigate()

  const set = (k) => (e) => setForm(prev => ({...prev, [k]: e.target.value}))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) {
      showError('Name, email and password are required')
      return
    }
    if (form.password.length < 6) {
      showError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      const res = await registerAPI({ ...form, role: 'owner' })
      login(res.data.token, res.data.user)
      showSuccess(`Welcome, ${res.data.user.name}! Account created successfully.`)
      navigate('/dashboard')
    } catch (err) {
      showError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-left">
        <div style={{ marginBottom: 12, display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ background:'rgba(255,255,255,0.2)', borderRadius:12, padding:10 }}>
            <FiPackage size={28} color="#fff" />
          </div>
          <span style={{ fontSize:22, fontWeight:800, color:'#fff' }}>StockMaster Pro</span>
        </div>
        <h1>Start managing your<br />inventory today</h1>
        <p>Join thousands of shop owners who trust StockMaster for their daily operations.</p>
      </div>

      <div className="auth-right fade-in">
        <div className="auth-logo">
          <div className="auth-logo-icon"><FiPackage size={22} color="#fff" /></div>
          <span>StockMaster Pro</span>
        </div>
        <h2 className="auth-title">Create your account</h2>
        <p className="auth-subtitle">Get started for free, no credit card needed</p>

        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                className="form-control"
                type="text"
                placeholder="Ramesh Kumar"
                value={form.name}
                onChange={set('name')}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Shop Name</label>
              <input
                className="form-control"
                type="text"
                placeholder="My Store"
                value={form.shop_name}
                onChange={set('shop_name')}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              className="form-control"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={set('email')}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              className="form-control"
              type="text"
              placeholder="9876543210"
              value={form.phone}
              onChange={set('phone')}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password *</label>
            <input
              className="form-control"
              type="password"
              placeholder="Min 6 characters"
              value={form.password}
              onChange={set('password')}
              required
            />
          </div>

          <button
            className="btn btn-primary btn-lg"
            type="submit"
            disabled={loading}
            style={{ width:'100%', justifyContent:'center', marginTop:8 }}
          >
            {loading
              ? <><span className="spinner" style={{borderTopColor:'#fff', borderColor:'rgba(255,255,255,0.3)'}} /> Creating account...</>
              : 'Create Account'
            }
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  )
}