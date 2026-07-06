export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  siblingCount = 1,
}) {
  const safePage = Math.max(1, Number(page || 1))
  const totalPages = Math.max(1, Math.ceil((Number(total) || 0) / (Number(pageSize) || 1)))
  const clampPage = Math.min(totalPages, safePage)

  if (totalPages <= 1) return null

  const getRange = () => {
    const start = Math.max(1, clampPage - siblingCount)
    const end = Math.min(totalPages, clampPage + siblingCount)
    const leftEllipsis = start > 2
    const rightEllipsis = end < totalPages - 1
    const items = []

    for (let p = start; p <= end; p += 1) items.push(p)

    const res = [1]
    if (leftEllipsis) res.push('...')
    res.push(...items)
    if (rightEllipsis) res.push('...')
    if (totalPages !== 1) res.push(totalPages)

    return res.filter((x, idx, arr) => (x === '...' ? true : arr.indexOf(x) === idx))
  }

  return (
    <div className="admin-pagination" role="navigation" aria-label="Pagination">
      <button className="btn btn-ghost" type="button" onClick={() => onPageChange?.(clampPage - 1)} disabled={clampPage <= 1}>
        Prev
      </button>

      <div className="admin-pagination-pages">
        {getRange().map((p, idx) =>
          p === '...' ? (
            <span key={`ellipsis-${idx}`} className="admin-pagination-ellipsis">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`admin-pagination-page ${p === clampPage ? 'active' : ''}`}
              onClick={() => onPageChange?.(p)}
              aria-current={p === clampPage ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}
      </div>

      <button className="btn btn-ghost" type="button" onClick={() => onPageChange?.(clampPage + 1)} disabled={clampPage >= totalPages}>
        Next
      </button>
    </div>
  )
}
