import { Button } from './Button'

/** Prev/next pager driven by Laravel's paginator `meta`. */
export function Pagination({ meta, onPageChange, disabled }) {
  if (!meta || meta.total === 0) return null

  const { current_page: page, last_page: lastPage, from, to, total } = meta

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4 px-4 py-3 text-sm text-slate-600">
      <p>
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" disabled={disabled || page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <span aria-current="page" className="px-1">
          Page {page} of {lastPage}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={disabled || page >= lastPage}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  )
}
