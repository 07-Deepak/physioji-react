import { useEffect, useMemo, useState } from 'react'

export default function FormModal({
  open,
  title,
  description,
  children,
  onClose,
  onSubmit,
  submitText = 'Save',
  cancelText = 'Cancel',
  danger = false,
  submitDisabled = false,
  width = 760,
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (open) setMounted(true)
  }, [open])

  const descId = useMemo(() => `form-modal-desc-${Math.random().toString(16).slice(2)}`, [])

  useEffect(() => {
    if (!open) return undefined

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="admin-modal-overlay" role="dialog" aria-modal="true" aria-describedby={description ? descId : undefined}>
      <div className={`admin-modal admin-form-modal ${mounted ? 'mounted' : ''}`} style={{ maxWidth: width }} tabIndex={-1}>
        <div className="admin-modal-header">
          <div className="admin-modal-title">{title}</div>
        </div>

        <div className="admin-modal-body" id={descId}>
          {description ? <div className="admin-modal-description">{description}</div> : null}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              onSubmit?.(e)
            }}
          >
            {children}
            <div className="admin-modal-actions">
              <button className="btn btn-ghost" type="button" onClick={onClose}>
                {cancelText}
              </button>
              <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} type="submit" disabled={submitDisabled}>
                {submitText}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
