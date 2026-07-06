export default function SelectInput({ value, onChange, options }) {
  return (
    <div className="select-input">
      <select value={value} onChange={onChange}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span aria-hidden="true">⌄</span>
    </div>
  )
}
