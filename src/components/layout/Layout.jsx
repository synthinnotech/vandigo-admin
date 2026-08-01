import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getCurrentUser } from '../../api/users';
import {
  connectNotificationSocket,
  disconnectNotificationSocket,
  onNotificationEvent,
} from '../../api/notificationSocket';
import { registerPushNotifications, onForegroundPush } from '../../api/pushNotifications';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { token } = useAuth();
  const { addToast } = useToast();
  const qc = useQueryClient();

  // Shared with Topbar's UserMenu (['current-user']) so this doesn't add an
  // extra network call — react-query dedupes by key.
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => getCurrentUser().then((r) => r.data),
    enabled: !!token,
  });

  useEffect(() => {
    if (!token || !currentUser?.id) return undefined;
    connectNotificationSocket(currentUser.id, token);
    registerPushNotifications();

    const unsubscribe = onNotificationEvent((msg) => {
      if (msg?.event !== 'notification') return;
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      if (msg.data?.type === 'safety') {
        qc.invalidateQueries({ queryKey: ['ride-alerts'] });
      }
    });

    // FCM only auto-renders a system notification when the tab is
    // backgrounded (handled by firebase-messaging-sw.js); while focused we
    // have to surface it ourselves.
    let unsubscribeForeground = () => {};
    onForegroundPush((data) => {
      addToast(data.body || data.title || 'New notification', 'info');
    }).then((unsub) => {
      unsubscribeForeground = unsub;
    });

    return () => {
      unsubscribe();
      unsubscribeForeground();
      disconnectNotificationSocket();
    };
  }, [token, currentUser?.id, qc, addToast]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-theme">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Topbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="lg:ml-64 pt-16 min-h-screen">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
