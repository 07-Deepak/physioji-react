import { useMemo, useState } from 'react'
import { FiSave, FiUpload, FiShield, FiDatabase } from 'react-icons/fi'
import { useToast } from '../../contexts/ToastContext'
import Loader from '../../components/admin/Loader'
import EmptyState from '../../components/admin/EmptyState'
import FormModal from '../../components/admin/FormModal'
import ConfirmModal from '../../components/admin/ConfirmModal'

export default function Settings() {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)

  const [settings, setSettings] = useState(() => ({
    siteName: 'Physioji',
    theme: 'teal',
    allowBackups: true,
    backupSchedule: 'Daily',
    emailFrom: 'no-reply@physioji.com',
    smtpHost: 'smtp.example.com',
    smtpPort: 587,
    security: {
      enable2FA: false,
      sessionTimeoutMin: 120,
    },
  }))

  const [logo, setLogo] = useState(null)
  const [saveOpen, setSaveOpen] = useState(false)

  const backupPreview = useMemo(() => {
    return settings.allowBackups ? `Will generate ${settings.backupSchedule.toLowerCase()} backups (dummy)` : 'Backups disabled'
  }, [settings.allowBackups, settings.backupSchedule])

  if (loading) {
    setTimeout(() => setLoading(false), 350)
    return <Loader text="Loading settings..." />
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="kicker">Settings</div>
        <h2>General, security, email & backup</h2>
      </div>

      <div className="admin-grid-charts" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div>
          <div className="admin-panel">
            <div className="admin-panel-title">General Settings</div>

            <div className="admin-form-grid" style={{ marginTop: 10 }}>
              <div className="admin-field" style={{ gridColumn: 'span 2' }}>
                <label>Site Name</label>
                <input value={settings.siteName} onChange={(e) => setSettings((s) => ({ ...s, siteName: e.target.value }))} />
              </div>
              <div className="admin-field" style={{ gridColumn: 'span 2' }}>
                <label>Site Logo</label>
                <input type="file" onChange={(e) => setLogo(e.target.files?.[0] || null)} />
              </div>
              <div className="admin-field">
                <label>Theme</label>
                <select className="admin-select" value={settings.theme} onChange={(e) => setSettings((s) => ({ ...s, theme: e.target.value }))}>
                  <option value="teal">Teal (Medical)</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              <div className="admin-field">
                <label>Company Mode</label>
                <div className="admin-readonly" style={{ fontWeight: 900 }}>Production-ready UI</div>
              </div>
            </div>
          </div>

          <div className="admin-panel" style={{ marginTop: 14 }}>
            <div className="admin-panel-title">Email Settings</div>
            <div className="admin-form-grid" style={{ marginTop: 10 }}>
              <div className="admin-field" style={{ gridColumn: 'span 2' }}>
                <label>Email From</label>
                <input value={settings.emailFrom} onChange={(e) => setSettings((s) => ({ ...s, emailFrom: e.target.value }))} />
              </div>
              <div className="admin-field">
                <label>SMTP Host</label>
                <input value={settings.smtpHost} onChange={(e) => setSettings((s) => ({ ...s, smtpHost: e.target.value }))} />
              </div>
              <div className="admin-field">
                <label>SMTP Port</label>
                <input type="number" value={settings.smtpPort} onChange={(e) => setSettings((s) => ({ ...s, smtpPort: e.target.value }))} />
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="admin-panel">
            <div className="admin-panel-title">Security Settings</div>
            <div className="admin-form-grid" style={{ marginTop: 10 }}>
              <div className="admin-field">
                <label>Enable 2FA</label>
                <select className="admin-select" value={settings.security.enable2FA ? 'yes' : 'no'} onChange={(e) => setSettings((s) => ({ ...s, security: { ...s.security, enable2FA: e.target.value === 'yes' } }))}>
                  <option value="no">Disabled</option>
                  <option value="yes">Enabled</option>
                </select>
              </div>
              <div className="admin-field">
                <label>Session Timeout (min)</label>
                <input type="number" value={settings.security.sessionTimeoutMin} onChange={(e) => setSettings((s) => ({ ...s, security: { ...s.security, sessionTimeoutMin: e.target.value } }))} />
              </div>
              <div className="admin-field" style={{ gridColumn: 'span 2' }}>
                <label>Database Information</label>
                <div className="admin-readonly" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <FiDatabase /> <span>Connected (dummy): physioji_db</span>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-panel" style={{ marginTop: 14 }}>
            <div className="admin-panel-title">Backup Settings</div>
            <div className="admin-form-grid" style={{ marginTop: 10 }}>
              <div className="admin-field">
                <label>Allow Backups</label>
                <select className="admin-select" value={settings.allowBackups ? 'yes' : 'no'} onChange={(e) => setSettings((s) => ({ ...s, allowBackups: e.target.value === 'yes' }))}>
                  <option value="yes">Enabled</option>
                  <option value="no">Disabled</option>
                </select>
              </div>
              <div className="admin-field">
                <label>Schedule</label>
                <select className="admin-select" value={settings.backupSchedule} onChange={(e) => setSettings((s) => ({ ...s, backupSchedule: e.target.value }))}>
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                </select>
              </div>
              <div className="admin-field" style={{ gridColumn: 'span 2' }}>
                <label>Backup Preview</label>
                <div className="admin-readonly">{backupPreview}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" type="button" onClick={() => setSaveOpen(true)}>
              <FiSave /> Save Settings
            </button>
            <button className="btn" type="button" onClick={() => showToast('Dummy action: validated', 'success')}>
              <FiShield /> Validate (dummy)
            </button>
          </div>

          <div className="admin-muted" style={{ marginTop: 10 }}>
            {logo ? 'Logo file selected (dummy). Save to apply.' : 'No logo selected.'}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={saveOpen}
        title="Save settings?"
        description="Settings will be saved (dummy)."
        confirmText="Save"
        cancelText="Cancel"
        onClose={() => setSaveOpen(false)}
        onConfirm={() => {
          setSaveOpen(false)
          showToast('Settings saved (dummy)', 'success')
        }}
      />

      <FormModal
        open={false}
        title=""
        onClose={() => {}}
      />
    </div>
  )
}

