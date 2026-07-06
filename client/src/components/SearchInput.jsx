export default function SearchInput({ placeholder, value, onChange }) {
  return (
    <div className="search-input">
      <span aria-hidden="true">⌕</span>
      <input type="text" placeholder={placeholder} value={value} onChange={onChange} />
    </div>
  )
}
