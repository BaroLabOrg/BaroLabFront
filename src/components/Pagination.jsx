import './Pagination.css';

const MAX_VISIBLE_PAGES = 5;

function getPageItems(currentPage, totalPages) {
    if (totalPages <= MAX_VISIBLE_PAGES) {
        return Array.from({ length: totalPages }, (_, index) => index);
    }

    const half = Math.floor(MAX_VISIBLE_PAGES / 2);
    let start = Math.max(0, currentPage - half);
    let end = Math.min(totalPages - 1, start + MAX_VISIBLE_PAGES - 1);

    if (end - start + 1 < MAX_VISIBLE_PAGES) {
        start = Math.max(0, end - MAX_VISIBLE_PAGES + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export default function Pagination({
    page = 0,
    totalPages = 0,
    hasNext = false,
    hasPrevious = false,
    disabled = false,
    onPageChange,
}) {
    if (totalPages <= 1) return null;

    const pageItems = getPageItems(page, totalPages);
    const canGoPrevious = !disabled && hasPrevious;
    const canGoNext = !disabled && hasNext;

    return (
        <nav className="pagination glass-card" aria-label="Pagination">
            <button
                type="button"
                className="pagination-nav"
                disabled={!canGoPrevious}
                onClick={() => onPageChange(page - 1)}
            >
                Back
            </button>

            <div className="pagination-pages">
                {pageItems.map((pageIndex) => (
                    <button
                        key={pageIndex}
                        type="button"
                        className={`pagination-page ${pageIndex === page ? 'active' : ''}`}
                        disabled={disabled || pageIndex === page}
                        onClick={() => onPageChange(pageIndex)}
                    >
                        {pageIndex + 1}
                    </button>
                ))}
            </div>

            <button
                type="button"
                className="pagination-nav"
                disabled={!canGoNext}
                onClick={() => onPageChange(page + 1)}
            >
                Next
            </button>
        </nav>
    );
}
