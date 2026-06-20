import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import clsx from 'clsx';

const typeConfig = {
  success: { icon: CheckCircle, bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', text: 'text-green-800 dark:text-green-300', icon_color: 'text-green-500' },
  error: { icon: XCircle, bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', text: 'text-red-800 dark:text-red-300', icon_color: 'text-red-500' },
  warning: { icon: AlertTriangle, bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', text: 'text-yellow-800 dark:text-yellow-300', icon_color: 'text-yellow-500' },
  info: { icon: Info, bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-800 dark:text-blue-300', icon_color: 'text-blue-500' },
};

export default function Toast({ message, type = 'success', onClose }) {
  const cfg = typeConfig[type] ?? typeConfig.success;
  const Icon = cfg.icon;

  return (
    <div
      className={clsx(
        'pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-sm',
        cfg.bg, cfg.border
      )}
    >
      <Icon size={18} className={clsx('mt-0.5 shrink-0', cfg.icon_color)} />
      <p className={clsx('flex-1 text-sm font-medium', cfg.text)}>{message}</p>
      <button
        onClick={onClose}
        className={clsx('shrink-0 rounded p-0.5 hover:opacity-70 transition-opacity', cfg.text)}
      >
        <X size={14} />
      </button>
    </div>
  );
}
