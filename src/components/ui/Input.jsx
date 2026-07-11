import clsx from 'clsx';
import { forwardRef } from 'react';

const accentRing = {
  indigo: 'focus:ring-indigo-500 focus:border-indigo-500',
  amber: 'focus:ring-amber-500 focus:border-amber-500',
};

const Input = forwardRef(({ label, error, icon: Icon, rightElement, className, accent = 'indigo', ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Icon size={16} className="text-gray-400" />
          </div>
        )}
        <input
          ref={ref}
          className={clsx(
            'block w-full rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm transition-colors',
            'focus:outline-none focus:ring-2',
            error
              ? 'border-red-400 dark:border-red-600 focus:ring-red-400'
              : ['border-gray-300 dark:border-gray-600', accentRing[accent]],
            Icon ? 'pl-10' : 'px-3',
            rightElement ? 'pr-10' : 'pr-3',
            'py-2.5 text-sm',
            className
          )}
          {...props}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
