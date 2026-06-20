import clsx from 'clsx';
import Card from './Card';

export default function StatCard({ label, value, icon: Icon, color = 'indigo', trend, subtext }) {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  };

  return (
    <Card className="flex items-start gap-4">
      {Icon && (
        <div className={clsx('rounded-xl p-3 shrink-0', colorMap[color])}>
          <Icon size={22} />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{label}</p>
        <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{value ?? '—'}</p>
        {subtext && <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{subtext}</p>}
      </div>
    </Card>
  );
}
