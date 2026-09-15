type PaginationItem = number | 'ellipsis-left' | 'ellipsis-right'

type PaginationProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  ariaLabel?: string
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  ariaLabel = 'Phân trang',
}: PaginationProps) {
  if (totalPages <= 1) return null

  const safeCurrentPage = clampPage(currentPage, totalPages)
  const items = getPaginationItems(safeCurrentPage, totalPages)

  function goToPage(page: number) {
    const nextPage = clampPage(page, totalPages)

    if (nextPage !== safeCurrentPage) {
      onPageChange(nextPage)
    }
  }

  return (
    <nav className="app-pagination" aria-label={ariaLabel}>
      <button
        type="button"
        className="app-pagination-arrow"
        disabled={safeCurrentPage === 1}
        aria-label="Trang trước"
        onClick={() => goToPage(safeCurrentPage - 1)}
      >
        ‹
      </button>

      {items.map((item) =>
        typeof item === 'number' ? (
          <button
            type="button"
            className={item === safeCurrentPage ? 'active' : undefined}
            aria-current={item === safeCurrentPage ? 'page' : undefined}
            key={item}
            onClick={() => goToPage(item)}
          >
            {item}
          </button>
        ) : (
          <span className="app-pagination-ellipsis" aria-hidden="true" key={item}>
            ...
          </span>
        ),
      )}

      <button
        type="button"
        className="app-pagination-arrow"
        disabled={safeCurrentPage === totalPages}
        aria-label="Trang sau"
        onClick={() => goToPage(safeCurrentPage + 1)}
      >
        ›
      </button>
    </nav>
  )
}

function clampPage(page: number, totalPages: number) {
  return Math.min(Math.max(page, 1), totalPages)
}

function getPaginationItems(
  currentPage: number,
  totalPages: number,
): PaginationItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (currentPage <= 2) {
    return [1, 2, 'ellipsis-right', totalPages - 1, totalPages]
  }

  if (currentPage === 3) {
    return [1, 2, 3, 'ellipsis-right', totalPages - 1, totalPages]
  }

  if (currentPage >= totalPages - 1) {
    return [1, 2, 'ellipsis-left', totalPages - 1, totalPages]
  }

  if (currentPage === totalPages - 2) {
    return [1, 2, 'ellipsis-left', totalPages - 2, totalPages - 1, totalPages]
  }

  return [
    1,
    'ellipsis-left',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    'ellipsis-right',
    totalPages,
  ]
}
