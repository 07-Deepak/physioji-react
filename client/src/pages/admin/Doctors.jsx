import { useEffect, useMemo, useState } from 'react'
import { FiEdit2, FiPlus, FiRefreshCw, FiSearch, FiShield, FiTrash2 } from 'react-icons/fi'
import axios from 'axios'
import Loader from '../../components/admin/Loader'
import EmptyState from '../../components/admin/EmptyState'
import Pagination from '../../components/admin/Pagination'
import SearchBar from '../../components/admin/SearchBar'
import ConfirmModal from '../../components/admin/ConfirmModal'
import FormModal from '../../components/admin/FormModal'
import DataTable from '../../components/admin/DataTable'
import { useToast } from '../../contexts/ToastContext'
import { useAdmin } from '../../contexts/AdminContext'
import { API_BASE_URL } from '../../utils/apiUrl'

const PAGE_SIZE = 10

const defaultForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  specialization: '',
  qualification: '',
  experience: '',
  bio: '',
  profileImage: '',
  status: 'active',
}

const safeString = (value, fallback = 'N/A') => {
  const text = String(value ?? '').trim()
  return text || fallback
}

const safeDate = (value) => {
  if (!value) return 'N/A'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString()
}

const safeCount = (value) => Number(value || 0).toLocaleString()

const mapDoctor = (doctor) => ({
  _id: doctor?._id,
  name: doctor?.name || 'Doctor',
  email: doctor?.email || 'N/A',
  phone: doctor?.phone || 'N/A',
  specialization: doctor?.specialization || 'General',
  qualification: doctor?.qualification || 'N/A',
  experience: doctor?.experience || 'N/A',
  bio: doctor?.bio || 'No bio added',
  profileImage: doctor?.profileImage || '',
  status: doctor?.status || 'active',
  role: doctor?.role || 'doctor',
  createdAt: doctor?.createdAt || null,
  updatedAt: doctor?.updatedAt || null,
})

export default function Doctors() {
  const { showToast } = useToast()
  const { adminToken } = useAdmin()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [doctors, setDoctors] = useState([])
  const [filteredCount, setFilteredCount] = useState(0)
  const [stats, setStats] = useState({
    totalDoctors: 0,
    activeDoctors: 0,
    blockedDoctors: 0,
    latestDoctorDate: null,
  })
  const [formOpen, setFormOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState(defaultForm)

  const api = useMemo(() => {
    return axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true,
      headers: adminToken
        ? {
            Authorization: `Bearer ${adminToken}`,
          }
        : undefined,
    })
  }, [adminToken])

  const loadDoctors = async () => {
    try {
      setLoading(true)
      const [listRes, statsRes] = await Promise.all([
        api.get('/admin/doctors', {
          params: {
            q: search || undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            page,
            limit: PAGE_SIZE,
          },
        }),
        api.get('/admin/doctors/stats'),
      ])

      const items = Array.isArray(listRes.data?.doctors) ? listRes.data.doctors : []
      setDoctors(items.map(mapDoctor))
      setFilteredCount(Number(listRes.data?.count || items.length || 0))

      const nextStats = statsRes.data?.stats || statsRes.data || {}
      setStats({
        totalDoctors: Number(nextStats.totalDoctors || 0),
        activeDoctors: Number(nextStats.activeDoctors || 0),
        blockedDoctors: Number(nextStats.blockedDoctors || 0),
        latestDoctorDate: nextStats.latestDoctorDate || null,
      })
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to load doctors', 'error')
      setDoctors([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDoctors()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, page])

  const total = Number(filteredCount || 0)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const openCreate = () => {
    setSelectedDoctor(null)
    setForm(defaultForm)
    setFormOpen(true)
  }

  const openEdit = async (doctor) => {
    try {
      const res = await api.get(`/admin/doctors/${doctor._id}`)
      const payload = res.data?.doctor || res.data?.data || res.data
      setSelectedDoctor(mapDoctor(payload || doctor))
      setForm({
        name: payload?.name || doctor.name || '',
        email: payload?.email || doctor.email || '',
        phone: payload?.phone || doctor.phone || '',
        password: '',
        specialization: payload?.specialization || doctor.specialization || '',
        qualification: payload?.qualification || doctor.qualification || '',
        experience: payload?.experience || doctor.experience || '',
        bio: payload?.bio || doctor.bio || '',
        profileImage: payload?.profileImage || doctor.profileImage || '',
        status: payload?.status || doctor.status || 'active',
      })
      setFormOpen(true)
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to load doctor details', 'error')
    }
  }

  const submitForm = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      showToast('Name, email and phone are required', 'error')
      return
    }

    if (!selectedDoctor && !form.password.trim()) {
      showToast('Password is required for new doctor accounts', 'error')
      return
    }

    try {
      setSaving(true)
      const payload = {
        ...form,
        experience: form.experience,
      }

      if (selectedDoctor) {
        if (!payload.password) delete payload.password
        const res = await api.put(`/admin/doctors/${selectedDoctor._id}`, payload)
        const updated = res.data?.doctor || res.data?.data || res.data
        setDoctors((current) =>
          current.map((doctor) => (doctor._id === selectedDoctor._id ? mapDoctor(updated || doctor) : doctor))
        )
        showToast('Doctor updated successfully', 'success')
      } else {
        const res = await api.post('/admin/doctors', payload)
        const created = res.data?.doctor || res.data?.data || res.data
        setDoctors((current) => [mapDoctor(created), ...current].slice(0, PAGE_SIZE))
        showToast('Doctor created successfully', 'success')
      }

      setFormOpen(false)
      setSelectedDoctor(null)
      setForm(defaultForm)
      await loadDoctors()
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to save doctor', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusToggle = async (doctor) => {
    const nextStatus = String(doctor.status).toLowerCase() === 'active' ? 'blocked' : 'active'
    try {
      await api.patch(`/admin/doctors/${doctor._id}/status`, { status: nextStatus })
      showToast(`Doctor ${nextStatus === 'active' ? 'unblocked' : 'blocked'} successfully`, 'success')
      await loadDoctors()
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to update doctor status', 'error')
    }
  }

  const requestDelete = (doctor) => {
    setDeleteTarget(doctor)
    setConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget?._id) return
    try {
      await api.delete(`/admin/doctors/${deleteTarget._id}`)
      showToast('Doctor deleted successfully', 'success')
      setConfirmOpen(false)
      setDeleteTarget(null)
      await loadDoctors()
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to delete doctor', 'error')
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Doctor',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 700 }}>{row?.name || 'Doctor'}</div>
          <div style={{ color: 'var(--muted)' }}>{row?.email || 'N/A'}</div>
        </div>
      ),
    },
    {
      key: 'specialization',
      label: 'Specialization',
      render: (value) => <span>{safeString(value, 'General')}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        const status = String(value || 'active').toLowerCase()
        return <span className={`status-pill status-${status}`}>{status}</span>
      },
    },
    {
      key: 'experience',
      label: 'Experience',
      render: (value) => <span>{safeString(value, 'N/A')}</span>,
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (value) => <span>{safeDate(value)}</span>,
    },
  ]

  if (loading) {
    return <Loader text="Loading doctors..." />
  }

  return (
    <div className="admin-page doctors-page">
      <div className="admin-page-header">
        <div>
          <div className="admin-kicker">Doctor Management</div>
          <h2>Doctors</h2>
          <p className="admin-muted">Create, block, update, and manage doctor accounts from one place.</p>
        </div>

        <div className="admin-actions">
          <button type="button" className="btn" onClick={loadDoctors}>
            <FiRefreshCw /> Refresh
          </button>
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <FiPlus /> Add Doctor
          </button>
        </div>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="label">Total Doctors</div>
          <div className="value">{safeCount(stats.totalDoctors)}</div>
        </div>
        <div className="admin-stat-card">
          <div className="label">Active Doctors</div>
          <div className="value">{safeCount(stats.activeDoctors)}</div>
        </div>
        <div className="admin-stat-card">
          <div className="label">Blocked Doctors</div>
          <div className="value">{safeCount(stats.blockedDoctors)}</div>
        </div>
        <div className="admin-stat-card">
          <div className="label">Latest Doctor</div>
          <div className="value">{safeDate(stats.latestDoctorDate)}</div>
        </div>
      </div>

      <div className="admin-toolbar">
        <SearchBar
          value={search}
          onChange={(value) => {
            setPage(1)
            setSearch(value)
          }}
          placeholder="Search by name, email, specialization, phone..."
          rightSlot={<FiSearch />}
        />

        <select
          className="admin-input"
          value={statusFilter}
          onChange={(e) => {
            setPage(1)
            setStatusFilter(e.target.value)
          }}
          style={{ maxWidth: 180 }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={doctors}
        rowKey="_id"
        emptyTitle="No doctors found"
        emptyDescription="Try widening your search or add a new doctor account."
        renderRowActions={(doctor) => (
          <div className="admin-row-actions">
            <button type="button" className="btn btn-small" onClick={() => openEdit(doctor)}>
              <FiEdit2 /> Edit
            </button>
            <button type="button" className="btn btn-small" onClick={() => handleStatusToggle(doctor)}>
              <FiShield /> {String(doctor.status).toLowerCase() === 'active' ? 'Block' : 'Unblock'}
            </button>
            <button type="button" className="btn btn-small btn-danger" onClick={() => requestDelete(doctor)}>
              <FiTrash2 /> Delete
            </button>
          </div>
        )}
      />

      <div className="admin-footer">
        <div className="admin-muted">
          Showing {Math.min(doctors.length, PAGE_SIZE)} of {safeCount(total)} doctors
        </div>
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>

      <FormModal
        open={formOpen}
        title={selectedDoctor ? 'Edit Doctor' : 'Add Doctor'}
        description="Create or update a doctor account. Password is only required when creating a new account."
        submitText={saving ? 'Saving...' : 'Save Doctor'}
        submitDisabled={saving}
        onClose={() => {
          setFormOpen(false)
          setSelectedDoctor(null)
          setForm(defaultForm)
        }}
        onSubmit={submitForm}
        width={840}
      >
        <div className="admin-form-grid">
          <label className="admin-field">
            <span>Name</span>
            <input
              className="admin-input"
              value={form.name}
              onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
              placeholder="Doctor name"
            />
          </label>

          <label className="admin-field">
            <span>Email</span>
            <input
              className="admin-input"
              type="email"
              value={form.email}
              onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
              placeholder="doctor@example.com"
            />
          </label>

          <label className="admin-field">
            <span>Phone</span>
            <input
              className="admin-input"
              value={form.phone}
              onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))}
              placeholder="Phone number"
            />
          </label>

          <label className="admin-field">
            <span>Password {selectedDoctor ? '(leave blank to keep current)' : ''}</span>
            <input
              className="admin-input"
              type="password"
              value={form.password}
              onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))}
              placeholder={selectedDoctor ? 'Optional new password' : 'Create a password'}
            />
          </label>

          <label className="admin-field">
            <span>Specialization</span>
            <input
              className="admin-input"
              value={form.specialization}
              onChange={(e) => setForm((current) => ({ ...current, specialization: e.target.value }))}
              placeholder="Physiotherapy"
            />
          </label>

          <label className="admin-field">
            <span>Qualification</span>
            <input
              className="admin-input"
              value={form.qualification}
              onChange={(e) => setForm((current) => ({ ...current, qualification: e.target.value }))}
              placeholder="BPT / MPT"
            />
          </label>

          <label className="admin-field">
            <span>Experience</span>
            <input
              className="admin-input"
              value={form.experience}
              onChange={(e) => setForm((current) => ({ ...current, experience: e.target.value }))}
              placeholder="5 years"
            />
          </label>

          <label className="admin-field">
            <span>Status</span>
            <select
              className="admin-input"
              value={form.status}
              onChange={(e) => setForm((current) => ({ ...current, status: e.target.value }))}
            >
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>
          </label>

          <label className="admin-field admin-field-full">
            <span>Profile Image URL</span>
            <input
              className="admin-input"
              value={form.profileImage}
              onChange={(e) => setForm((current) => ({ ...current, profileImage: e.target.value }))}
              placeholder="/uploads/doctors/profile.jpg"
            />
          </label>

          <label className="admin-field admin-field-full">
            <span>Bio</span>
            <textarea
              className="admin-input admin-textarea"
              rows={4}
              value={form.bio}
              onChange={(e) => setForm((current) => ({ ...current, bio: e.target.value }))}
              placeholder="Doctor biography..."
            />
          </label>
        </div>
      </FormModal>

      <ConfirmModal
        open={confirmOpen}
        title="Delete doctor"
        description={`Delete ${selectedDoctor?.name || deleteTarget?.name || 'this doctor'} permanently? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        danger
        onClose={() => {
          setConfirmOpen(false)
          setDeleteTarget(null)
        }}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
