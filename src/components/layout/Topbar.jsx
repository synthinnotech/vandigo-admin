import { useEffect, useRef, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, Sun, Moon, Bell, ChevronDown, LogOut, Settings } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUnreadCount, getNotifications, markAllRead, markOneRead } from '../../api/notifications';
import { getCurrentUser } from '../../api/users';
import { formatDate } from '../../lib/utils';
import ConfirmDialog from '../ui/ConfirmDialog';

const BREADCRUMB_MAP = {
  '/dashboard': 'Dashboard',
  '/users': 'Users',
  '/drivers': 'Drivers',
  '/rides': 'Rides',
  '/payments': 'Payments',
  '/withdrawals': 'Withdrawals',
  '/promo-codes': 'Promo Codes',
  '/fare-config': 'Fare Config',
  '/support': 'Support Tickets',
  '/offers': 'Offers',
  '/document-types': 'Document Types',
  '/notifications': 'Notifications',
  '/settings': 'Settings',
};

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const qc = useQueryClient();

  const { data: countData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => getUnreadCount().then((r) => r.data),
    refetchInterval: 30000,
  });

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications({ unread_only: false, limit: 20 }).then((r) => r.data),
    enabled: open,
  });

  const markAll = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markOne = useMutation({
    mutationFn: (id) => markOneRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = countData?.unread_count ?? 0;
  const notifications = Array.isArray(notifData) ? notifData : (notifData?.items ?? []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-xl p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</span>
            {unread > 0 && (
              <button
                onClick={() => markAll.mutate()}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
            {notifications.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">No notifications</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && markOne.mutate(n.id)}
                  className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${!n.is_read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                >
                  <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">{n.message ?? n.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(n.created_at)}</p>
                </div>
              ))
            )}
          </div>
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-xs text-indigo-600 dark:text-indigo-400 hover:underline py-1"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const ref = useRef(null);
  const { logout } = useAuth();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => getCurrentUser().then((r) => r.data),
  });

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const name = user?.full_name ?? user?.name ?? 'Admin';
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  function handleSignOutClick() {
    setOpen(false);
    setConfirmOpen(true);
  }

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>
          <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
            {name}
          </span>
          <ChevronDown size={14} className="text-gray-400 hidden md:block" />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email ?? 'admin'}</p>
            </div>
            <Link
              to="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Settings size={15} /> Settings
            </Link>
            <button
              onClick={handleSignOutClick}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut size={15} /> Sign out
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={logout}
        title="Sign out"
        message="Are you sure you want to sign out of Vandigo Admin?"
        confirmLabel="Sign out"
        confirmVariant="danger"
      />
    </>
  );
}

export default function Topbar({ onMenuClick }) {
  const location = useLocation();
  const { theme, toggle } = useTheme();
  const crumb = BREADCRUMB_MAP[location.pathname] ?? 'Page';

  return (
    <header className="fixed top-0 left-0 right-0 lg:left-64 z-10 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-3">
      <button
        onClick={onMenuClick}
        className="lg:hidden rounded-xl p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">{crumb}</h1>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={toggle}
          className="rounded-xl p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
