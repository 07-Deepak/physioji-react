export default function Button({
  type = 'button',
  variant = 'dark',
  size = 'normal',
  className = '',
  onClick,
  children,
  disabled = false,
}) {
  const classes = ['btn', `btn-${variant}`, size === 'small' ? 'btn-small' : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}
