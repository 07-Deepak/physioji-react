import { useMemo } from 'react'

export default function ConfirmModal({
  open,
  title = 'Confirm',
  description = 'Are you sure?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
  onConfirm,
  onClose,
}) {
  const descId = useMemo(() => `confirm-desc-${Math.random().toString(16).slice(2)}`, [])

  if (!open) return null

  return (
    <div className="admin-modal-overlay" role="dialog" aria-modal="true" aria-labelledby={descId}>
      <div className="admin-modal">
        <div className="admin-modal-header">
          <div className="admin-modal-title">{title}</div>
        </div>
        <div className="admin-modal-body" id={descId}>
          <p style={{ margin: 0, color: 'var(--muted)' }}>{description}</p>
        </div>
        <div className="admin-modal-actions">
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            {cancelText}
          </button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} type="button" onClick={() => onConfirm?.()}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
