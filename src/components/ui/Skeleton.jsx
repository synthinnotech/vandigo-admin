import clsx from 'clsx';

export function Skeleton({ className }) {
  return (
    <div
      className={clsx(
        'animate-pulse rounded-md bg-gray-200 dark:bg-gray-700',
        className
      )}
    />
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3 grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-3/4" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="bg-white dark:bg-gray-800/50 px-6 py-4 border-t border-gray-100 dark:border-gray-700 grid gap-4"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4" style={{ width: `${60 + Math.random() * 30}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
      <Skeleton className="h-4 w-1/2 mb-3" />
      <Skeleton className="h-8 w-1/3 mb-2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}
