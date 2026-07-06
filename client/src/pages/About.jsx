import Accordion from '../components/Accordion'

const accordionItems = [
  {
    title: 'Our Mission',
    content:
      'To democratize medical education by providing reliable, doctor-verified learning resources and personalized guidance to students across India. We believe every student deserves access to quality education, regardless of their background or location.',
  },
  {
    title: 'Why Physio Ji?',
    content:
      'Medical forums are filled with misinformation. We solved this by verifying every doctor, curating every note, and reviewing every test. Our 500+ verified doctors have collectively taught 100,000+ students. We\'re not just a platform — we\'re a community built on trust and expertise.',
  },
  {
    title: 'Our Team',
    content:
      'Founded by Dr. Rajesh Singh (former medical professor at AIIMS) and Arjun Kapoor (EdTech founder), we brought together experienced educators, doctors, and engineers to solve medical education\'s biggest problem: the gap between textbook knowledge and clinical understanding.',
  },
]

export default function About() {
  return (
    <section className="page active" id="page-about">
      <div className="page-header">
        <div className="eyebrow">Our Story</div>
        <h1>About Physio Ji</h1>
        <p>
          We&apos;re building the future of medical education by connecting students with real doctors who care about their learning.
        </p>
      </div>
      <div className="section">
        <Accordion items={accordionItems} />
      </div>
    </section>
  )
}
