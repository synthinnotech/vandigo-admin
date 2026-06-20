import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserCheck, UserX, Shield } from 'lucide-react';
import { getUsers, activateUser, deactivateUser } from '../api/users';
import { useToast } from '../context/ToastContext';
import { Table } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Drawer from '../components/ui/Drawer';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { formatDate } from '../lib/utils';

function UserDetail({ user }) {
  if (!user) return null;
  const fields = [
    ['ID', user.id],
    ['Full Name', user.full_name ?? user.name],
    ['Phone', user.phone],
    ['Email', user.email],
    ['Role', user.role],
    ['Status', user.is_active ? 'Active' : 'Inactive'],
    ['Verified', user.is_verified ? 'Yes' : 'No'],
    ['Joined', formatDate(user.created_at)],
  ];
  return (
    <div className="px-6 py-4 space-y-4">
      <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="h-14 w-14 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xl font-bold">
          {(user.full_name ?? user.name ?? 'U')[0].toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">{user.full_name ?? user.name ?? '—'}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email ?? user.phone}</p>
        </div>
      </div>
      <dl className="space-y-3">
        {fields.map(([label, val]) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="text-sm text-gray-500 dark:text-gray-400 shrink-0">{label}</dt>
            <dd className="text-sm font-medium text-gray-900 dark:text-gray-100 text-right break-all">{val ?? '—'}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function Users() {
  const { addToast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers().then((r) => r.data),
  });

  const users = Array.isArray(data) ? data : (data?.items ?? data?.users ?? []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (u.full_name ?? u.name ?? '').toLowerCase().includes(q) ||
      (u.phone ?? '').includes(q) ||
      (u.email ?? '').toLowerCase().includes(q)
    );
  });

  const activate = useMutation({
    mutationFn: (id) => activateUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      addToast('User activated successfully', 'success');
      setConfirm(null);
    },
    onError: () => addToast('Failed to activate user', 'error'),
  });

  const deactivate = useMutation({
    mutationFn: (id) => deactivateUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      addToast('User deactivated', 'success');
      setConfirm(null);
    },
    onError: () => addToast('Failed to deactivate user', 'error'),
  });

  const columns = [
    { key: 'id', label: 'ID', width: 60, render: (v) => <span className="font-mono text-xs text-gray-500">#{v}</span> },
    {
      key: 'full_name', label: 'Name',
      render: (v, row) => (
        <span className="font-medium text-gray-900 dark:text-gray-100">{v ?? row.name ?? '—'}</span>
      ),
    },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email', render: (v) => <span className="text-gray-500 dark:text-gray-400">{v ?? '—'}</span> },
    {
      key: 'role', label: 'Role',
      render: (v) => <Badge variant="indigo">{v ?? 'user'}</Badge>,
    },
    {
      key: 'is_active', label: 'Status',
      render: (v) => <Badge variant={v ? 'success' : 'default'}>{v ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'is_verified', label: 'Verified',
      render: (v) => v ? (
        <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-medium">
          <Shield size={12} /> Verified
        </span>
      ) : <span className="text-gray-400 text-xs">—</span>,
    },
    { key: 'created_at', label: 'Joined', render: (v) => <span className="text-gray-500 text-xs whitespace-nowrap">{formatDate(v)}</span> },
    {
      key: 'actions', label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {row.is_active ? (
            <Button
              size="xs"
              variant="danger"
              icon={UserX}
              onClick={() => setConfirm({ type: 'deactivate', user: row })}
            >
              Deactivate
            </Button>
          ) : (
            <Button
              size="xs"
              variant="success"
              icon={UserCheck}
              onClick={() => setConfirm({ type: 'activate', user: row })}
            >
              Activate
            </Button>
          )}
        </div>
      ),
    },
  ];

  const isLoading2 = activate.isPending || deactivate.isPending;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Users</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{filtered.length} total</p>
        </div>
        <div className="w-full sm:w-72">
          <Input
            icon={Search}
            placeholder="Search by name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={filtered}
        loading={isLoading}
        onRowClick={setSelectedUser}
        emptyMessage="No users found"
      />

      <Drawer
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="User Details"
      >
        <UserDetail user={selectedUser} />
      </Drawer>

      <ConfirmDialog
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.type === 'activate' ? 'Activate User' : 'Deactivate User'}
        message={
          confirm?.type === 'activate'
            ? `Activate ${confirm?.user?.full_name ?? confirm?.user?.name}? They will regain access to the platform.`
            : `Deactivate ${confirm?.user?.full_name ?? confirm?.user?.name}? They will lose access to the platform.`
        }
        confirmLabel={confirm?.type === 'activate' ? 'Activate' : 'Deactivate'}
        confirmVariant={confirm?.type === 'activate' ? 'success' : 'danger'}
        loading={isLoading2}
        onConfirm={() => {
          if (confirm?.type === 'activate') activate.mutate(confirm.user.id);
          else deactivate.mutate(confirm.user.id);
        }}
      />
    </div>
  );
}
