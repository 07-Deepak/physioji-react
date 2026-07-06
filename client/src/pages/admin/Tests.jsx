import { useMemo, useState } from 'react'
import { FiEdit2, FiEye, FiPlus, FiPlay, FiRefreshCw, FiTrash2 } from 'react-icons/fi'
import { FiCheckCircle } from 'react-icons/fi'
import { useToast } from '../../contexts/ToastContext'
import Loader from '../../components/admin/Loader'
import EmptyState from '../../components/admin/EmptyState'
import SearchBar from '../../components/admin/SearchBar'
import ConfirmModal from '../../components/admin/ConfirmModal'
import FormModal from '../../components/admin/FormModal'
import Pagination from '../../components/admin/Pagination'
import DataTable from '../../components/admin/DataTable'

const makeTests = () => {
  const categories = ['Kinematics', 'Physiology', 'Rehab', 'Anatomy']
  const questions = (cat) => [
    {
      id: 'q1',
      text: `What is key concept of ${cat}?`,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctIndex: 1,
    },
    {
      id: 'q2',
      text: `Which is best practice in ${cat}?`,
      options: ['Best 1', 'Best 2', 'Best 3', 'Best 4'],
      correctIndex: 0,
    },
  ]

  return Array.from({ length: 10 }).map((_, i) => {
    const category = categories[i % categories.length]
    const title = `${category} Quick Test ${i + 1}`
    const published = i % 2 === 0
    return {
      id: `t-${i + 1}`,
      title,
      category,
      published,
      questions: questions(category),
      attempts: 80 + i * 14,
      avgScore: Math.round((70 + i * 3) * 10) / 10,
      results: [
        { id: `res-${i}-1`, user: 'Student A', score: 86 },
        { id: `res-${i}-2`, user: 'Student B', score: 78 },
      ],
    }
  })
}

const formatAvg = (n) => `${Number(n).toFixed(1)}%`

export default function Tests() {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [tests, setTests] = useState(() => makeTests())

  // simulate one-time loading
  const [bootstrapped, setBootstrapped] = useState(false)
  if (loading && !bootstrapped) {
    setTimeout(() => {
      setLoading(false)
      setBootstrapped(true)
    }, 350)
  }

  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const [page, setPage] = useState(1)
  const pageSize = 6

  const [confirm, setConfirm] = useState({ open: false, id: null })

  const [addOpen, setAddOpen] = useState(false)
  const [viewId, setViewId] = useState(null)
  const [editId, setEditId] = useState(null)

  const [testForm, setTestForm] = useState({ title: '', category: 'Kinematics', published: false })
  const [questionForm, setQuestionForm] = useState({ text: '', optionA: '', optionB: '', optionC: '', optionD: '', correctIndex: 0 })

  const categories = useMemo(() => ['all', ...Array.from(new Set(tests.map((t) => t.category)))], [tests])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tests.filter((t) => {
      const matchesQ = !q || t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
      const matchesC = categoryFilter === 'all' || t.category === categoryFilter
      return matchesQ && matchesC
    })
  }, [tests, query, categoryFilter])

  const total = filtered.length
  const pageRows = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page])

  const selected = useMemo(() => tests.find((t) => t.id === viewId) || null, [tests, viewId])
  const editing = useMemo(() => tests.find((t) => t.id === editId) || null, [tests, editId])

  const columns = useMemo(
    () => [
      { key: 'title', label: 'Test', tdClassName: 'admin-td-strong' },
      { key: 'category', label: 'Category' },
      {
        key: 'published',
        label: 'Published',
        render: (v) => (
          <span style={{ fontWeight: 900, color: v ? '#0F766E' : '#94a3b8' }}>{v ? 'PUBLISHED' : 'DRAFT'}</span>
        ),
      },
      { key: 'attempts', label: 'Total Attempts', render: (v) => Number(v).toLocaleString() },
      { key: 'avgScore', label: 'Average Score', render: (v) => formatAvg(v) },
    ],
    []
  )

  const renderActions = (t) => (
    <div className="admin-row-actions">
      <button className="icon-btn" type="button" aria-label="View test" onClick={() => setViewId(t.id)}>
        <FiEye />
      </button>
      <button
        className="icon-btn"
        type="button"
        aria-label="Edit test"
        onClick={() => {
          setEditId(t.id)
          setAddOpen(false)
        }}
      >
        <FiEdit2 />
      </button>
      <button
        className="icon-btn"
        type="button"
        aria-label={t.published ? 'Unpublish test' : 'Publish test'}
        onClick={() => {
          setTests((cur) => cur.map((x) => (x.id === t.id ? { ...x, published: !x.published } : x)))
          showToast(t.published ? 'Test unpublished' : 'Test published', 'success')
        }}
      >
        {t.published ? <FiRefreshCw /> : <FiPlay />}
      </button>
      <button className="icon-btn" type="button" aria-label="Delete test" onClick={() => setConfirm({ open: true, id: t.id })}>
        <FiTrash2 />
      </button>
    </div>
  )

  if (loading) return <Loader text="Loading tests..." />

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="kicker">Tests</div>
        <h2>Create & manage tests</h2>
      </div>

      <div className="admin-filters">
        <div style={{ flex: 1, minWidth: 240 }}>
          <SearchBar value={query} onChange={(v) => { setQuery(v); setPage(1) }} placeholder="Search tests" />
        </div>

        <div className="admin-filter-selects">
          <select className="admin-select" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}>
            {categories.map((c) => (
              <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
            ))}
          </select>
        </div>

        <div className="admin-filter-actions">
          <button className="btn" type="button" onClick={() => { setQuery(''); setCategoryFilter('all'); setPage(1); showToast('Filters reset', 'success') }}>
            <FiRefreshCw /> Reset
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => {
              setAddOpen(true)
              setEditId(null)
              setViewId(null)
              setTestForm({ title: '', category: 'Kinematics', published: false })
            }}
          >
            <FiPlus /> Create Test
          </button>
        </div>
      </div>

      {total === 0 ? (
        <EmptyState title="No tests" description="Create a test to get started." />
      ) : (
        <>
          <DataTable columns={columns} rows={pageRows} rowKey="id" renderRowActions={renderActions} />
          <div className="admin-page-footer">
            <div className="admin-muted">Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} of {total}</div>
            <Pagination page={page} pageSize={pageSize} total={total} onPageChange={(p) => setPage(p)} />
          </div>
        </>
      )}

      {/* View modal */}
      <FormModal
        open={!!viewId}
        title="Test Results"
        onClose={() => setViewId(null)}
        submitText="Close"
        onSubmit={(e) => { e.preventDefault(); setViewId(null) }}
        width={920}
      >
        {selected ? (
          <div className="admin-form-grid">
            <div className="admin-field" style={{ gridColumn: 'span 2' }}>
              <label>Test</label>
              <div className="admin-readonly" style={{ fontWeight: 950 }}>{selected.title}</div>
            </div>
            <div className="admin-field">
              <label>Category</label>
              <div className="admin-readonly">{selected.category}</div>
            </div>
            <div className="admin-field">
              <label>Attempts</label>
              <div className="admin-readonly">{Number(selected.attempts).toLocaleString()}</div>
            </div>
            <div className="admin-field" style={{ gridColumn: 'span 2' }}>
              <label>Questions (dummy)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selected.questions.map((q) => (
                  <div key={q.id} className="admin-panel" style={{ padding: 12 }}>
                    <div style={{ fontWeight: 900 }}>{q.text}</div>
                    <div className="admin-muted">Correct answer: {q.options[q.correctIndex]}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="admin-field" style={{ gridColumn: 'span 2' }}>
              <label>Results Table (dummy)</label>
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Score</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.results.map((r) => (
                      <tr key={r.id}>
                        <td className="admin-td-strong">{r.user}</td>
                        <td>{r.score}%</td>
                        <td>
                          {r.score >= 80 ? <FiCheckCircle style={{ color: '#0F766E' }} /> : <span style={{ color: '#ef4444', fontWeight: 900 }}>Needs Improve</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState title="Test not found" description="This test may have been removed." />
        )}
      </FormModal>

      {/* Create modal */}
      <FormModal
        open={addOpen}
        title="Create Test"
        onClose={() => setAddOpen(false)}
        submitText="Create"
        onSubmit={(e) => {
          e.preventDefault()
          if (!testForm.title.trim()) {
            showToast('Title is required', 'error')
            return
          }
          const id = `t-${Math.random().toString(16).slice(2)}`
          setTests((cur) => [
            {
              id,
              title: testForm.title.trim(),
              category: testForm.category,
              published: testForm.published,
              questions: [],
              attempts: 0,
              avgScore: 0,
              results: [],
            },
            ...cur,
          ])
          setAddOpen(false)
          showToast('Test created (dummy)', 'success')
        }}
        width={820}
      >
        <div className="admin-form-grid">
          <div className="admin-field" style={{ gridColumn: 'span 2' }}>
            <label>Title</label>
            <input value={testForm.title} onChange={(e) => setTestForm((f) => ({ ...f, title: e.target.value }))} required />
          </div>
          <div className="admin-field">
            <label>Category</label>
            <input value={testForm.category} onChange={(e) => setTestForm((f) => ({ ...f, category: e.target.value }))} />
          </div>
          <div className="admin-field">
            <label>Publish?</label>
            <select className="admin-select" value={testForm.published ? 'yes' : 'no'} onChange={(e) => setTestForm((f) => ({ ...f, published: e.target.value === 'yes' }))}>
              <option value="no">Draft</option>
              <option value="yes">Publish</option>
            </select>
          </div>
        </div>

        <div className="admin-panel" style={{ marginTop: 14 }}>
          <div className="admin-panel-title">Add Questions (dummy)</div>
          <div className="admin-form-grid">
            <div className="admin-field" style={{ gridColumn: 'span 2' }}>
              <label>Question Text</label>
              <input value={questionForm.text} onChange={(e) => setQuestionForm((f) => ({ ...f, text: e.target.value }))} />
            </div>
            {['optionA', 'optionB', 'optionC', 'optionD'].map((k, idx) => (
              <div key={k} className="admin-field">
                <label>Option {['A', 'B', 'C', 'D'][idx]}</label>
                <input
                  value={questionForm[k]}
                  onChange={(e) => setQuestionForm((f) => ({ ...f, [k]: e.target.value }))}
                />
              </div>
            ))}
            <div className="admin-field" style={{ gridColumn: 'span 2' }}>
              <label>Correct Option</label>
              <select className="admin-select" value={questionForm.correctIndex} onChange={(e) => setQuestionForm((f) => ({ ...f, correctIndex: Number(e.target.value) }))}>
                {[0, 1, 2, 3].map((i) => (
                  <option key={i} value={i}>{['A', 'B', 'C', 'D'][i]}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <button
              className="btn"
              type="button"
              onClick={() => {
                showToast('Add questions via Edit (dummy)', 'success')
              }}
            >
              <FiPlus /> Save Question
            </button>
            <div className="admin-muted" style={{ alignSelf: 'center' }}>
              Questions are fully editable in the Edit modal.
            </div>
          </div>
        </div>
      </FormModal>

      {/* Edit modal */}
      <FormModal
        open={!!editId}
        title="Edit Test & Questions"
        onClose={() => setEditId(null)}
        submitText="Close"
        onSubmit={(e) => { e.preventDefault(); setEditId(null) }}
        width={980}
      >
        {editing ? (
          <div className="admin-form-grid">
            <div className="admin-field" style={{ gridColumn: 'span 2' }}>
              <label>Title</label>
              <input
                value={editing.title}
                onChange={(e) => {
                  const val = e.target.value
                  setTests((cur) => cur.map((x) => (x.id === editing.id ? { ...x, title: val } : x)))
                }}
              />
            </div>
            <div className="admin-field">
              <label>Category</label>
              <input
                value={editing.category}
                onChange={(e) => {
                  const val = e.target.value
                  setTests((cur) => cur.map((x) => (x.id === editing.id ? { ...x, category: val } : x)))
                }}
              />
            </div>
            <div className="admin-field">
              <label>Publish</label>
              <select
                className="admin-select"
                value={editing.published ? 'yes' : 'no'}
                onChange={(e) => {
                  const val = e.target.value === 'yes'
                  setTests((cur) => cur.map((x) => (x.id === editing.id ? { ...x, published: val } : x)))
                }}
              >
                <option value="no">Unpublish</option>
                <option value="yes">Publish</option>
              </select>
            </div>

            <div className="admin-field" style={{ gridColumn: 'span 2' }}>
              <label>Questions</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {editing.questions.length === 0 ? (
                  <EmptyState title="No questions yet" description="Add a question below." />
                ) : (
                  editing.questions.map((q, idx) => (
                    <div key={q.id} className="admin-panel" style={{ padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ fontWeight: 950 }}>Q{idx + 1}</div>
                        <button
                          className="btn"
                          type="button"
                          onClick={() => {
                            setTests((cur) =>
                              cur.map((x) =>
                                x.id === editing.id
                                  ? { ...x, questions: x.questions.filter((qq) => qq.id !== q.id) }
                                  : x
                              )
                            )
                            showToast('Question deleted', 'success')
                          }}
                        >
                          <FiTrash2 /> Delete
                        </button>
                      </div>
                      <div className="admin-muted" style={{ marginTop: 6 }}>
                        {q.text}
                      </div>
                      <div className="admin-muted" style={{ marginTop: 6 }}>
                        Correct: {q.options[q.correctIndex]}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="admin-panel" style={{ marginTop: 14, padding: 12 }}>
                <div className="admin-panel-title">Add Question</div>
                <div className="admin-form-grid">
                  <div className="admin-field" style={{ gridColumn: 'span 2' }}>
                    <label>Question Text</label>
                    <input value={questionForm.text} onChange={(e) => setQuestionForm((f) => ({ ...f, text: e.target.value }))} />
                  </div>
                  {['optionA', 'optionB', 'optionC', 'optionD'].map((k, idx) => (
                    <div key={k} className="admin-field">
                      <label>Option {['A', 'B', 'C', 'D'][idx]}</label>
                      <input value={questionForm[k]} onChange={(e) => setQuestionForm((f) => ({ ...f, [k]: e.target.value }))} />
                    </div>
                  ))}
                  <div className="admin-field" style={{ gridColumn: 'span 2' }}>
                    <label>Correct Option</label>
                    <select
                      className="admin-select"
                      value={questionForm.correctIndex}
                      onChange={(e) => setQuestionForm((f) => ({ ...f, correctIndex: Number(e.target.value) }))}
                    >
                      {[0, 1, 2, 3].map((i) => (
                        <option key={i} value={i}>{['A', 'B', 'C', 'D'][i]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() => {
                      const text = questionForm.text.trim()
                      if (!text) {
                        showToast('Question text required', 'error')
                        return
                      }
                      const options = [questionForm.optionA, questionForm.optionB, questionForm.optionC, questionForm.optionD].map((x) => x.trim())
                      if (options.some((x) => !x)) {
                        showToast('All options required', 'error')
                        return
                      }

                      const newQ = {
                        id: `q-${Math.random().toString(16).slice(2)}`,
                        text,
                        options,
                        correctIndex: Number(questionForm.correctIndex),
                      }

                      setTests((cur) =>
                        cur.map((x) => (x.id === editing.id ? { ...x, questions: [...x.questions, newQ] } : x))
                      )
                      showToast('Question added', 'success')
                      setQuestionForm({ text: '', optionA: '', optionB: '', optionC: '', optionD: '', correctIndex: 0 })
                    }}
                  >
                    <FiPlus /> Add Question
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState title="Test not found" description="This test may have been removed." />
        )}
      </FormModal>

      <ConfirmModal
        open={confirm.open}
        danger
        title="Delete Test?"
        description="This test and its questions will be removed (dummy action)."
        confirmText="Delete"
        cancelText="Cancel"
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={() => {
          setTests((cur) => cur.filter((t) => t.id !== confirm.id))
          showToast('Test deleted', 'success')
          setConfirm({ open: false, id: null })
          setViewId(null)
          setEditId(null)
        }}
      />
    </div>
  )
}

