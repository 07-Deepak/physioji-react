import { useState } from 'react'

export default function Accordion({ items }) {
  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <div className="accordion">
      {items.map((item, index) => {
        const active = activeIndex === index
        return (
          <div key={item.title} className={`accordion-item${active ? ' active' : ''}`}>
            <div className="accordion-header" onClick={() => setActiveIndex(active ? -1 : index)}>
              <h3>{item.title}</h3>
              <span className="accordion-icon">⌄</span>
            </div>
            <div className="accordion-content">
              <div className="accordion-body">{item.content}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
