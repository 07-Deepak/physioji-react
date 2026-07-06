import { useEffect } from 'react'

const iconMap = {
  success: '✓',
  error: '!',
  warning: '⚠',
  info: 'i',
}

export default function ToastContainer({ toasts, onDismiss }) {
  useEffect(() => {
    const timers = toasts.map((toast) => setTimeout(() => onDismiss(toast.id), 4000))
    return () => timers.forEach((timer) => clearTimeout(timer))
  }, [toasts, onDismiss])

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.type || 'info'}`}>
          <div className="toast-icon">{iconMap[toast.type] || 'i'}</div>
          <div className="toast-message">{toast.message}</div>
          <button className="toast-close" type="button" onClick={() => onDismiss(toast.id)} aria-label="Dismiss toast">
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
