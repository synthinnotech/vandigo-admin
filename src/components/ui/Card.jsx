import clsx from 'clsx';

export default function Card({ children, className, padding = true }) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm',
        padding && 'p-6',
        className
      )}
    >
      {children}
    </div>
  );
}
