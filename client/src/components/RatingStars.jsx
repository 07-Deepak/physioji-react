import { useState } from 'react'

export default function RatingStars({ initialRating = 5, ratingText = '', onRate }) {
  const [rating, setRating] = useState(initialRating)

  const handleClick = (index) => {
    const nextRating = index + 1
    setRating(nextRating)
    if (onRate) {
      onRate(nextRating)
    }
  }

  return (
    <div className="rating-stars">
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          className={`star ${index < rating ? 'filled' : ''}`}
          onClick={() => handleClick(index)}
        >
          ★
        </span>
      ))}
      {ratingText ? <span className="rating-value">{ratingText}</span> : null}
    </div>
  )
}
