export default function SearchBar({ value, onChange, placeholder = 'Search...', rightSlot }) {
  return (
    <div className="admin-searchbar">
      <input className="admin-input" value={value} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder} />
      {rightSlot ? <div aria-hidden="true">{rightSlot}</div> : null}
    </div>
  )
}
