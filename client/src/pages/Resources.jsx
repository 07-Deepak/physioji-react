import ResourceCard from '../components/ResourceCard'

const resources = [
  {
    type: { icon: '📹', label: 'Video' },
    title: 'Knee Joint: Complete Anatomy Walkthrough',
    description: '3D visualization with Dr. Raj explaining every structure, movements, and clinical importance.',
    footer: { left: '25 min', right: '⭐ 4.8/5 (142)' },
  },
  {
    type: { icon: '📊', label: 'Infographic' },
    title: 'Drug Interactions at a Glance',
    description: 'Quick reference chart for common drug interactions, contraindications, and adverse reactions.',
    footer: { left: 'High res PDF', right: '⭐ 4.6/5 (89)' },
  },
  {
    type: { icon: '📄', label: 'Article' },
    title: 'ACL Tear: Diagnosis & Management',
    description: 'Evidence-based clinical approach with latest guidelines, imaging interpretation, and treatment protocols.',
    footer: { left: '12 min read', right: '⭐ 4.9/5 (267)' },
  },
  {
    type: { icon: '🎬', label: 'Case Study' },
    title: 'Spinal Cord Injury: Clinical Case Analysis',
    description: 'Real-world case with clinical reasoning, differential diagnosis, and management decisions explained.',
    footer: { left: '18 min', right: '⭐ 4.7/5 (156)' },
  },
]

export default function Resources() {
  return (
    <section className="page active" id="page-resources">
      <div className="page-header">
        <div className="eyebrow">Learning Materials</div>
        <h1>Resources Hub</h1>
      </div>
      <div className="toolbar">
        <div className="search-input">
          🔍
          <input type="text" placeholder="Search resources..." />
        </div>
        <div className="select-input">
          <select>
            <option>All types</option>
            <option>Videos</option>
            <option>Infographics</option>
            <option>Articles</option>
            <option>Case Studies</option>
          </select>
          <span>⌄</span>
        </div>
      </div>
      <div className="resource-grid">
        {resources.map((resource) => (
          <ResourceCard key={resource.title} type={resource.type} title={resource.title} description={resource.description} footer={resource.footer} />
        ))}
      </div>
    </section>
  )
}
