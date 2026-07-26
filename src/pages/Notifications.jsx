import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Megaphone } from 'lucide-react';
import {
  getNotifications, getUnreadCount, markAllRead, markOneRead, broadcastNotification,
} from '../api/notifications';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../context/ToastContext';
import { formatDate, getErrorMessage } from '../lib/utils';
import clsx from 'clsx';

const EMPTY_BROADCAST = { title: '', body: '', target: 'all_customers' };

function BroadcastForm({ onSubmit, loading, onClose }) {
  const [form, setForm] = useState(EMPTY_BROADCAST);
  const [errors, setErrors] = useState({});

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.body.trim()) errs.body = 'Message is required';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSubmit({ title: form.title.trim(), body: form.body.trim(), target: form.target });
  }

  const targets = [
    { value: 'all_customers', label: 'All customers' },
    { value: 'all_drivers', label: 'All drivers' },
    { value: 'all', label: 'Everyone' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Title" value={form.title} onChange={(e) => set('title', e.target.value)} error={errors.title} placeholder="Weekend Offer!" />
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Message</label>
        <textarea
          value={form.body}
          onChange={(e) => set('body', e.target.value)}
          rows={3}
          placeholder="Get 20% off your next ride this weekend."
          className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        {errors.body && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.body}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Send to</label>
        <div className="flex gap-2">
          {targets.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => set('target', t.value)}
              className={clsx(
                'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                form.target === t.value
                  ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                  : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>Send</Button>
      </div>
    </form>
  );
}

export default function Notifications() {
  const qc = useQueryClient();
  const { addToast } = useToast();
  const [composeOpen, setComposeOpen] = useState(false);

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

  const broadcast = useMutation({
    mutationFn: broadcastNotification,
    onSuccess: () => {
      addToast('Notification queued for delivery', 'success');
      setComposeOpen(false);
    },
    onError: (err) => addToast(getErrorMessage(err, 'Failed to send notification'), 'error'),
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
        <div className="flex items-center gap-2">
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
          <Button size="sm" icon={Megaphone} onClick={() => setComposeOpen(true)}>
            Send Notification
          </Button>
        </div>
      </div>

      <Modal isOpen={composeOpen} onClose={() => setComposeOpen(false)} title="Send Notification" size="md">
        <BroadcastForm
          loading={broadcast.isPending}
          onClose={() => setComposeOpen(false)}
          onSubmit={(data) => broadcast.mutate(data)}
        />
      </Modal>

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
                !n.is_read && 'bg-amber-50/60 dark:bg-amber-900/10'
              )}
            >
              <div className={clsx(
                'h-9 w-9 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                n.is_read ? 'bg-gray-100 dark:bg-gray-700 text-gray-400' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'
              )}>
                <Bell size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug">{n.title}</p>
                {n.body && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">{n.body}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">{formatDate(n.created_at)}</p>
              </div>
              {!n.is_read && (
                <div className="h-2 w-2 rounded-full bg-amber-500 shrink-0 mt-2" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
