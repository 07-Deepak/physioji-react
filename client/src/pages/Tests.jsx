import { useState } from 'react'
import SelectInput from '../components/SelectInput'
import { useToast } from '../contexts/ToastContext'

const tests = [
  {
    title: 'Musculoskeletal System - MCQ Test 1',
    difficulty: 'MEDIUM',
    difficultyClass: 'difficulty-medium',
    details: '50 questions · 90 minutes · Your score: 42/50 (84%)',
    buttons: ['Retake Test', 'Review Answers', 'View Analytics'],
  },
  {
    title: 'Neurology - Advanced Quiz',
    difficulty: 'HARD',
    difficultyClass: 'difficulty-hard',
    details: '30 questions · 60 minutes · Not attempted yet · 267 ratings',
    buttons: ['Start Test'],
  },
  {
    title: 'Pharmacology - Drug Interactions',
    difficulty: 'EASY',
    difficultyClass: 'difficulty-easy',
    details: '20 questions · 30 minutes · Not attempted yet · 145 ratings',
    buttons: ['Start Test'],
  },
]

export default function Tests() {
  const { showToast } = useToast()
  const [subject, setSubject] = useState('All subjects')
  const [difficulty, setDifficulty] = useState('Difficulty: All')
  const [sort, setSort] = useState('Sort: Newest')

  return (
    <section className="page active" id="page-tests">
      <div className="page-header">
        <div className="eyebrow">Practice</div>
        <h1>Mock Tests & MCQ Quizzes</h1>
      </div>
      <div className="toolbar">
        <SelectInput
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          options={['All subjects', 'Anatomy', 'Physiology', 'Pharmacology', 'Pathology']}
        />
        <SelectInput
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          options={['Difficulty: All', 'Easy', 'Medium', 'Hard']}
        />
        <SelectInput
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          options={['Sort: Newest', 'Most popular', 'Highest rated']}
        />
      </div>
      <div style={{ padding: '0 48px 100px', maxWidth: '1400px', margin: '0 auto' }}>
        {tests.map((item) => (
          <div key={item.title} className="fcard light" style={{ minHeight: 'auto', padding: '20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: '0 0 8px 0', cursor: 'pointer' }}>{item.title}</h3>
              <span className={`difficulty-badge ${item.difficultyClass}`}>{item.difficulty}</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '12px' }}>{item.details}</div>
            <div className="rating-stars" style={{ marginBottom: '12px' }}>
              {Array.from({ length: 5 }, (_, index) => (
                <span key={index} className={`star ${index < 4 ? 'filled' : ''}`}>★</span>
              ))}
              <span className="rating-value">({item.buttons.length === 3 ? '312 ratings' : item.buttons.length === 1 && item.difficulty === 'HARD' ? '267 ratings' : '145 ratings'})</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {item.buttons.map((button) => (
                <button
                  key={button}
                  className={`btn ${button === 'Start Test' || button === 'Retake Test' ? 'btn-dark' : 'btn-outline'} btn-small`}
                  type="button"
                  onClick={() => showToast(button.includes('Start') ? 'Test started! Answer all questions to complete.' : button.includes('Retake') ? 'Test started! Answer all questions to complete.' : 'Review mode opened.', 'success')}
                >
                  {button}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
