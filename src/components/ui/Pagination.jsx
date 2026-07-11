import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

function getPageWindow(current, total, siblings = 1) {
  if (total <= 1) return [1];

  const start = Math.max(2, current - siblings);
  const end = Math.min(total - 1, current + siblings);

  const range = [1];
  if (start > 2) range.push('…');
  for (let i = start; i <= end; i++) range.push(i);
  if (end < total - 1) range.push('…');
  range.push(total);
  return range;
}

export default function Pagination({ page, limit, total, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-1">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Showing <span className="font-medium text-gray-700 dark:text-gray-300">{from}</span>
        {'–'}
        <span className="font-medium text-gray-700 dark:text-gray-300">{to}</span> of{' '}
        <span className="font-medium text-gray-700 dark:text-gray-300">{total}</span>
      </p>

      {total > 0 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 disabled:pointer-events-none disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <ChevronLeft size={16} />
          </button>

          {getPageWindow(page, totalPages).map((p, i) =>
            p === '…' ? (
              <span key={`ellipsis-${i}`} className="px-1.5 text-sm text-gray-400 dark:text-gray-500">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                aria-current={p === page ? 'page' : undefined}
                className={clsx(
                  'h-8 min-w-8 rounded-lg px-2.5 text-sm font-medium transition-colors',
                  p === page
                    ? 'bg-amber-500 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                )}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Next page"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 disabled:pointer-events-none disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
