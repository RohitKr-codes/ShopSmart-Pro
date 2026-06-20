export default function Loader({ fullPage = false }) {
  if (fullPage) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:16 }}>
      <div className="spinner" style={{ width:40, height:40, borderWidth:4 }} />
      <p style={{ color:'var(--text-muted)', fontSize:14 }}>Loading...</p>
    </div>
  )
  return <div style={{ display:'flex', justifyContent:'center', padding:40 }}><div className="spinner" /></div>
}