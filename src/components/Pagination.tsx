import React from 'react';

type Props = {
  page: number; // 1-based
  pageCount: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

/** Compact page list with ellipses, e.g. 1 … 4 5 [6] 7 8 … 20 */
function pageWindow(page: number, pageCount: number): (number | '…')[] {
  if (pageCount <= 7) {
    return Array.from({length: pageCount}, (_, i) => i + 1);
  }
  const out: (number | '…')[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);
  if (start > 2) out.push('…');
  for (let p = start; p <= end; p += 1) out.push(p);
  if (end < pageCount - 1) out.push('…');
  out.push(pageCount);
  return out;
}

export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
}: Props) {
  if (total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <nav className="pagination" aria-label="Inventory pages">
      <p className="pagination-summary" aria-live="polite">
        Showing <strong>{from}</strong>–<strong>{to}</strong> of{' '}
        <strong>{total}</strong>
      </p>

      {pageCount > 1 ? (
        <div className="pagination-controls">
          <button
            type="button"
            className="pagination-button"
            disabled={page <= 1}
            aria-label="Previous page"
            onClick={() => onPageChange(page - 1)}>
            ‹ Prev
          </button>

          {pageWindow(page, pageCount).map((item, index) =>
            item === '…' ? (
              <span
                key={`gap-${index}`}
                className="pagination-gap"
                aria-hidden="true">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                className={
                  item === page
                    ? 'pagination-page active'
                    : 'pagination-page'
                }
                aria-label={`Page ${item}`}
                aria-current={item === page ? 'page' : undefined}
                onClick={() => onPageChange(item)}>
                {item}
              </button>
            ),
          )}

          <button
            type="button"
            className="pagination-button"
            disabled={page >= pageCount}
            aria-label="Next page"
            onClick={() => onPageChange(page + 1)}>
            Next ›
          </button>
        </div>
      ) : null}
    </nav>
  );
}
