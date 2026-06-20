export default function Badge({ type = 'gray', children }) {
  return <span className={`badge badge-${type}`}>{children}</span>
}