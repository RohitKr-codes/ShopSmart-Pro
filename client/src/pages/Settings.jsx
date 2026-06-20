import { useState } from 'react'
import { updateProfileAPI, changePasswordAPI } from '../api/auth.api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { FiUser, FiLock, FiSave } from 'react-icons/fi'

export default function Settings() {
  const { user, login } = useAuth()
  const { showSuccess, showError } = useToast()
  const [profile, setProfile] = useState({ name:user?.name||'', shop_name:user?.shop_name||'', phone:user?.phone||'', address:user?.address||'' })
  const [passwords, setPasswords] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' })
  const [savingP, setSavingP] = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const sp = k => e => setProfile(f=>({...f,[k]:e.target.value}))
  const spw = k => e => setPasswords(f=>({...f,[k]:e.target.value}))

  const saveProfile = async (e) => {
    e.preventDefault(); setSavingP(true)
    try {
      const res = await updateProfileAPI(profile)
      const token = localStorage.getItem('token')
      login(token, res.data.user)
      showSuccess('Profile updated!')
    } catch { showError('Failed to update profile') }
    finally { setSavingP(false) }
  }

  const savePassword = async (e) => {
    e.preventDefault()
    if (passwords.newPassword !== passwords.confirmPassword) { showError('Passwords do not match'); return }
    if (passwords.newPassword.length < 6) { showError('Password must be at least 6 characters'); return }
    setSavingPw(true)
    try { await changePasswordAPI({ currentPassword:passwords.currentPassword, newPassword:passwords.newPassword }); showSuccess('Password changed!'); setPasswords({currentPassword:'',newPassword:'',confirmPassword:''}) }
    catch (err) { showError(err.response?.data?.message || 'Failed') }
    finally { setSavingPw(false) }
  }

  return (
    <div className="fade-in" style={{maxWidth:680}}>
      <div className="page-header">
        <div><div className="page-title">Settings</div><div className="page-subtitle">Manage your account and shop details</div></div>
      </div>

      <div className="card" style={{marginBottom:20}}>
        <div className="card-body">
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
            <div style={{width:52,height:52,background:'var(--primary)',borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:700,color:'#fff'}}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{fontWeight:700,fontSize:17}}>{user?.name}</div>
              <div style={{fontSize:13,color:'var(--text-muted)'}}>{user?.email} · <span style={{textTransform:'capitalize',color:'var(--primary)'}}>{user?.role}</span></div>
            </div>
          </div>
          <hr className="divider" />
          <div style={{fontWeight:600,marginBottom:16,display:'flex',alignItems:'center',gap:8}}><FiUser /> Profile Details</div>
          <form onSubmit={saveProfile}>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Full Name</label><input className="form-control" value={profile.name} onChange={sp('name')} required /></div>
              <div className="form-group"><label className="form-label">Shop Name</label><input className="form-control" value={profile.shop_name} onChange={sp('shop_name')} /></div>
            </div>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Phone</label><input className="form-control" value={profile.phone} onChange={sp('phone')} /></div>
              <div className="form-group"><label className="form-label">Address</label><input className="form-control" value={profile.address} onChange={sp('address')} /></div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingP}><FiSave /> {savingP?'Saving...':'Save Profile'}</button>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div style={{fontWeight:600,marginBottom:16,display:'flex',alignItems:'center',gap:8}}><FiLock /> Change Password</div>
          <form onSubmit={savePassword}>
            <div className="form-group"><label className="form-label">Current Password</label><input type="password" className="form-control" value={passwords.currentPassword} onChange={spw('currentPassword')} required /></div>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">New Password</label><input type="password" className="form-control" value={passwords.newPassword} onChange={spw('newPassword')} required /></div>
              <div className="form-group"><label className="form-label">Confirm Password</label><input type="password" className="form-control" value={passwords.confirmPassword} onChange={spw('confirmPassword')} required /></div>
            </div>
            <button type="submit" className="btn btn-warning" disabled={savingPw}><FiLock /> {savingPw?'Changing...':'Change Password'}</button>
          </form>
        </div>
      </div>
    </div>
  )
}