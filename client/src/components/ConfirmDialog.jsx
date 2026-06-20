import { FiAlertTriangle } from 'react-icons/fi'

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, loading }) {
  if (!open) return null
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="confirm-dialog">
          <div className="confirm-icon"><FiAlertTriangle color="#ef4444" size={48} /></div>
          <div className="confirm-title">{title || 'Are you sure?'}</div>
          <div className="confirm-message">{message || 'This action cannot be undone.'}</div>
          <div className="confirm-actions">
            <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
            <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
              {loading ? <span className="spinner" /> : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}