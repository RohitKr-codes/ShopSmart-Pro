import { Link } from 'react-router-dom'
export default function NotFound() {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100vh',gap:16,textAlign:'center',padding:20}}>
      <div style={{fontSize:80,fontWeight:800,color:'var(--primary)',lineHeight:1}}>404</div>
      <div style={{fontSize:22,fontWeight:700,color:'var(--text-primary)'}}>Page not found</div>
      <div style={{color:'var(--text-muted)',fontSize:15}}>The page you're looking for doesn't exist.</div>
      <Link to="/dashboard" className="btn btn-primary" style={{marginTop:8}}>← Go to Dashboard</Link>
    </div>
  )
}