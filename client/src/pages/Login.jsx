import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginAPI } from '../api/auth.api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { FiMail, FiLock, FiPackage, FiTrendingUp, FiShield, FiZap } from 'react-icons/fi'
import '../styles/auth.css'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { showSuccess, showError } = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await loginAPI(form)
      login(res.data.token, res.data.user)
      showSuccess(`Welcome back, ${res.data.user.name}!`)
      navigate('/dashboard')
    } catch (err) {
      showError(err.response?.data?.message || 'Login failed')
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
        <h1>Manage your<br />business smarter</h1>
        <p>Complete inventory, billing, and analytics platform for modern businesses.</p>
        <div className="auth-features">
          {[
            { icon: <FiTrendingUp />, text: 'Real-time sales analytics' },
            { icon: <FiShield />, text: 'Secure JWT authentication' },
            { icon: <FiZap />, text: 'Instant PDF invoice generation' },
          ].map((f, i) => (
            <div className="auth-feature" key={i}>
              <div className="auth-feature-icon">{f.icon}</div>
              <span>{f.text}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="auth-right fade-in">
        <div className="auth-logo">
          <div className="auth-logo-icon"><FiPackage size={22} color="#fff" /></div>
          <span>StockMaster Pro</span>
        </div>
        <h2 className="auth-title">Welcome back 👋</h2>
        <p className="auth-subtitle">Sign in to your account to continue</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position:'relative' }}>
              <FiMail style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
              <input className="form-control" style={{ paddingLeft:38 }} type="email" placeholder="you@example.com"
                value={form.email} onChange={e => setForm({...form, email:e.target.value})} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position:'relative' }}>
              <FiLock style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
              <input className="form-control" style={{ paddingLeft:38 }} type="password" placeholder="••••••••"
                value={form.password} onChange={e => setForm({...form, password:e.target.value})} required />
            </div>
          </div>
          <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width:'100%', justifyContent:'center', marginTop:8 }}>
            {loading ? <><span className="spinner" style={{borderTopColor:'#fff',borderColor:'rgba(255,255,255,0.3)'}} /> Signing in...</> : 'Sign In'}
          </button>
        </form>
        <div className="auth-footer" style={{ marginTop:24 }}>
          Don't have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  )
}