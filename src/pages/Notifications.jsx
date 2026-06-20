import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { getNotifications, getUnreadCount, markAllRead, markOneRead } from '../api/notifications';
import Button from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { formatDate } from '../lib/utils';
import clsx from 'clsx';

export default function Notifications() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications-page'],
    queryFn: () => getNotifications({ unread_only: false, limit: 50 }).then((r) => r.data),
  });

  const { data: countData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => getUnreadCount().then((r) => r.data),
  });

  const markAll = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications-page'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  const markOne = useMutation({
    mutationFn: (id) => markOneRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications-page'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  const notifications = Array.isArray(data) ? data : (data?.items ?? data?.notifications ?? []);
  const unread = countData?.unread_count ?? 0;

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Notifications</h2>
          {unread > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{unread} unread</p>
          )}
        </div>
        {unread > 0 && (
          <Button
            variant="secondary"
            size="sm"
            icon={CheckCheck}
            loading={markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            Mark all read
          </Button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-5 py-4 flex items-start gap-3">
              <Skeleton className="h-9 w-9 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
            <Bell size={36} strokeWidth={1.5} />
            <p className="text-sm font-medium">You're all caught up</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markOne.mutate(n.id)}
              className={clsx(
                'px-5 py-4 flex items-start gap-3 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50',
                !n.is_read && 'bg-indigo-50/60 dark:bg-indigo-900/10'
              )}
            >
              <div className={clsx(
                'h-9 w-9 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                n.is_read ? 'bg-gray-100 dark:bg-gray-700 text-gray-400' : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
              )}>
                <Bell size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-gray-100 leading-snug">{n.message ?? n.title}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDate(n.created_at)}</p>
              </div>
              {!n.is_read && (
                <div className="h-2 w-2 rounded-full bg-indigo-500 shrink-0 mt-2" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
