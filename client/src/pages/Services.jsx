import FeatureCard from '../components/FeatureCard'

const services = [
  {
    icon: '❓',
    title: 'AI Doubt Solver',
    description:
      'Ask any medical question. Get instant AI-powered answers with references to latest research, or route to real doctors for complex queries. Average response: 15 minutes.',
  },
  {
    icon: '📚',
    title: 'Curated Study Notes',
    description:
      '500+ high-quality study materials created by specialists. Organized by topic, searchable, downloadable. Covers MBBS, Nursing, Physiotherapy, Dental, and more.',
  },
  {
    icon: '🎬',
    title: 'Video Lectures',
    description:
      'Learn from 50+ award-winning medical educators. High-quality, animated explanations of complex concepts. Watch offline anytime, anywhere.',
  },
  {
    icon: '🧪',
    title: 'Mock Tests & MCQs',
    description:
      'Practice with 10,000+ questions across all subjects. Timed tests mimic real exams. Instant grading with explanations and performance analytics.',
  },
  {
    icon: '📄',
    title: 'Previous Year Papers',
    description:
      'Access solved papers from NEET, AIIMS, JIPMER, MCI exams. Get detailed solutions and trending topics analysis to focus your prep.',
  },
  {
    icon: '🏆',
    title: 'Certificates & Badges',
    description:
      'Earn verified certificates by completing courses and achieving test milestones. Share on LinkedIn and in your resume.',
  },
]

export default function Services() {
  return (
    <section className="page active" id="page-services">
      <div className="page-header">
        <div className="eyebrow">What We Offer</div>
        <h1>Our Services</h1>
      </div>
      <div className="section">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '30px' }}>
          {services.map((service) => (
            <div className="fcard light" key={service.title}>
              <div className="fcard-icon">{service.icon}</div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
