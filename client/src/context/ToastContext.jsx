import { createContext, useContext } from 'react'
import toast, { Toaster } from 'react-hot-toast'

const ToastContext = createContext(null)

export const ToastProvider = ({ children }) => {
  const showSuccess = (msg) => toast.success(msg, { duration: 3000 })
  const showError = (msg) => toast.error(msg, { duration: 4000 })
  const showLoading = (msg) => toast.loading(msg)
  const dismiss = (id) => toast.dismiss(id)

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showLoading, dismiss }}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { borderRadius: '10px', background: '#1e293b', color: '#f8fafc', fontSize: '14px' },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
        }}
      />
      {children}
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)