import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Car, Navigation, CreditCard, Wallet,
  Tag, DollarSign, Headphones, Gift, FileText, Settings, X, Zap
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/drivers', icon: Car, label: 'Drivers' },
  { to: '/rides', icon: Navigation, label: 'Rides' },
  { to: '/payments', icon: CreditCard, label: 'Payments' },
  { to: '/withdrawals', icon: Wallet, label: 'Withdrawals' },
  { to: '/promo-codes', icon: Tag, label: 'Promo Codes' },
  { to: '/fare-config', icon: DollarSign, label: 'Fare Config' },
  { to: '/support', icon: Headphones, label: 'Support' },
  { to: '/offers', icon: Gift, label: 'Offers' },
  { to: '/document-types', icon: FileText, label: 'Document Types' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          'fixed left-0 top-0 z-30 h-full w-64 bg-white dark:bg-gray-900',
          'border-r border-gray-200 dark:border-gray-700 flex flex-col',
          'transition-transform duration-300 ease-in-out',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-amber-500 p-2">
              <Zap size={18} className="text-gray-900" />
            </div>
            <div>
              <span className="text-base font-bold text-gray-900 dark:text-gray-100">Vandigo</span>
              <p className="text-xs text-gray-400 dark:text-gray-500 leading-none">Admin Panel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                clsx('sidebar-link', isActive && 'active')
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="shrink-0 px-3 py-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-center text-gray-400 dark:text-gray-600">v1.0.0 · Vandigo Admin</p>
        </div>
      </aside>
    </>
  );
}
