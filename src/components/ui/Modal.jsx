import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import clsx from 'clsx';

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({ isOpen, onClose, title, children, size = 'md', footer }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={clsx(
          'relative w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl',
          'border border-gray-200 dark:border-gray-700',
          'flex flex-col max-h-[90vh]',
          sizes[size]
        )}
      >
        <div className={`flex items-center px-6 shrink-0 ${title ? 'justify-between py-4 border-b border-gray-200 dark:border-gray-700' : 'justify-end py-2'}`}>
          {title && <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h2>}
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
