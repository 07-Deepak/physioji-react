export const makeId = (prefix = 'id') => `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`

export const DUMMY_USERS = Array.from({ length: 42 }).map((_, i) => {
  const idx = i + 1
  return {
    id: idx,
    name: `User ${idx}`,
    email: `user${idx}@example.com`,
    phone: `+1-555-01${String(idx).padStart(2, '0')}`,
    role: idx % 7 === 0 ? 'patient' : 'user',
    status: idx % 9 === 0 ? 'blocked' : 'active',
    createdAt: new Date(Date.now() - idx * 86400000).toISOString(),
  }
})

export const DUMMY_NOTES = Array.from({ length: 25 }).map((_, i) => {
  const idx = i + 1
  const categories = ['Anatomy', 'Rehab', 'Exercises', 'Guides']
  return {
    id: idx,
    title: `Note ${idx}: ${categories[idx % categories.length]}`,
    category: categories[idx % categories.length],
    createdAt: new Date(Date.now() - idx * 43200000).toISOString(),
    updatedAt: new Date(Date.now() - idx * 22000000).toISOString(),
  }
})

export const DUMMY_RESOURCES = Array.from({ length: 18 }).map((_, i) => {
  const idx = i + 1
  const categories = ['PDF', 'Checklist', 'Docs']
  return {
    id: idx,
    title: `Resource ${idx}`,
    category: categories[idx % categories.length],
    size: `${(idx * 1.4).toFixed(1)} MB`,
    createdAt: new Date(Date.now() - idx * 86400000).toISOString(),
  }
})

export const DUMMY_VIDEOS = Array.from({ length: 24 }).map((_, i) => {
  const idx = i + 1
  const categories = ['Knee', 'Back', 'Shoulder', 'General']
  const durationMin = 3 + (idx % 11)
  return {
    id: idx,
    title: `Video ${idx}`,
    category: categories[idx % categories.length],
    duration: `${durationMin}:${String((idx * 7) % 60).padStart(2, '0')}`,
    thumbnail: `https://picsum.photos/seed/video_${idx}/400/240`,
  }
})

export const DUMMY_DOUBTS = Array.from({ length: 30 }).map((_, i) => {
  const idx = i + 1
  const topics = ['Pain', 'Exercises', 'Diet', 'Recovery']
  const resolved = idx % 6 === 0
