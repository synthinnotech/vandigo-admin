import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../../context/AuthContext';
import { getCurrentUser } from '../../api/users';
import {
  connectNotificationSocket,
  disconnectNotificationSocket,
  onNotificationEvent,
} from '../../api/notificationSocket';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { token } = useAuth();
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
    const unsubscribe = onNotificationEvent((msg) => {
      if (msg?.event !== 'notification') return;
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      if (msg.data?.type === 'safety') {
        qc.invalidateQueries({ queryKey: ['ride-alerts'] });
      }
    });
    return () => {
      unsubscribe();
      disconnectNotificationSocket();
    };
  }, [token, currentUser?.id, qc]);

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
