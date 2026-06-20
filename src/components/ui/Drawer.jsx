import { useEffect } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

export default function Drawer({ isOpen, onClose, title, children, side = 'right' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <div
        className={clsx(
          'fixed top-0 z-50 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl',
          'flex flex-col transition-transform duration-300 ease-in-out',
          'border-l border-gray-200 dark:border-gray-700',
          side === 'right' ? 'right-0' : 'left-0',
          isOpen ? 'translate-x-0' : side === 'right' ? 'translate-x-full' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </>
  );
}
