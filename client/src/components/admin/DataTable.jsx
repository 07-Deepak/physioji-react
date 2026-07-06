import { useMemo } from 'react'

export default function DataTable({
  columns,
  rows,
  rowKey = 'id',
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your filters.',
  renderRowActions,
}) {
  const safeRows = Array.isArray(rows) ? rows : []

  const header = useMemo(() => {
    return columns?.map((c) => (
      <th key={c.key} className={c.thClassName || ''}>
        {c.label}
      </th>
    ))
  }, [columns])

  return (
    <div className="admin-table-wrap">
      {safeRows.length === 0 ? (
        <div className="admin-empty-table">
          <div className="admin-empty-table-title">{emptyTitle}</div>
          <div className="admin-empty-table-desc">{emptyDescription}</div>
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              {header}
              {renderRowActions ? <th className="admin-th-actions">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {safeRows.map((row, idx) => {
              const key = row?.[rowKey] ?? row?.id ?? row?._id ?? idx
              return (
                <tr key={key}>
                  {columns.map((col) => {
                    const value = row?.[col.key]
                    return (
                      <td key={col.key} className={col.tdClassName || ''}>
                        {col.render ? col.render(value, row) : value}
                      </td>
                    )
                  })}
                  {renderRowActions ? (
                    <td className="admin-td-actions">{renderRowActions(row)}</td>
                  ) : null}
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

