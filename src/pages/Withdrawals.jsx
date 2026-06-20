import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle } from 'lucide-react';
import { getWithdrawals, processWithdrawal } from '../api/withdrawals';
import { useToast } from '../context/ToastContext';
import { Table } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { formatDate, formatCurrency, getStatusColor } from '../lib/utils';
import clsx from 'clsx';

const FILTERS = ['all', 'pending', 'approved', 'rejected'];

export default function Withdrawals() {
  const { addToast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [confirm, setConfirm] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['withdrawals', filter],
    queryFn: () => getWithdrawals(filter !== 'all' ? { status: filter } : {}).then((r) => r.data),
  });

  const withdrawals = Array.isArray(data) ? data : (data?.items ?? data?.withdrawals ?? []);

  const process = useMutation({
    mutationFn: ({ id, status }) => processWithdrawal(id, { status }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['withdrawals'] });
      addToast(`Withdrawal ${vars.status}`, vars.status === 'approved' ? 'success' : 'warning');
      setConfirm(null);
    },
    onError: () => addToast('Operation failed', 'error'),
  });

  const columns = [
    { key: 'id', label: 'ID', render: (v) => <span className="font-mono text-xs text-gray-500">#{v}</span> },
    { key: 'driver_id', label: 'Driver', render: (v) => <span className="font-mono text-xs text-gray-500">#{v}</span> },
    { key: 'amount', label: 'Amount', render: (v) => <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(v)}</span> },
    {
      key: 'status', label: 'Status',
      render: (v) => <Badge variant={getStatusColor(v)}>{v ?? '—'}</Badge>,
    },
    { key: 'requested_at', label: 'Requested', render: (v) => <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(v)}</span> },
    { key: 'processed_at', label: 'Processed', render: (v) => <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(v)}</span> },
    {
      key: 'actions', label: 'Actions',
      render: (_, row) => row.status === 'pending' ? (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            size="xs"
            variant="success"
            icon={CheckCircle}
            onClick={() => setConfirm({ withdrawal: row, action: 'approved' })}
          >
            Approve
          </Button>
          <Button
            size="xs"
            variant="danger"
            icon={XCircle}
            onClick={() => setConfirm({ withdrawal: row, action: 'rejected' })}
          >
            Reject
          </Button>
        </div>
      ) : <span className="text-gray-400 text-xs">—</span>,
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Withdrawals</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{withdrawals.length} records</p>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors',
              filter === f
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <Table
        columns={columns}
        data={withdrawals}
        loading={isLoading}
        emptyMessage="No withdrawals found"
      />

      <ConfirmDialog
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.action === 'approved' ? 'Approve Withdrawal' : 'Reject Withdrawal'}
        message={
          confirm
            ? `Are you sure you want to ${confirm.action === 'approved' ? 'approve' : 'reject'} withdrawal of ${formatCurrency(confirm.withdrawal.amount)} for driver #${confirm.withdrawal.driver_id}?`
            : ''
        }
        confirmLabel={confirm?.action === 'approved' ? 'Approve' : 'Reject'}
        confirmVariant={confirm?.action === 'approved' ? 'success' : 'danger'}
        loading={process.isPending}
        onConfirm={() => process.mutate({ id: confirm.withdrawal.id, status: confirm.action })}
      />
    </div>
  );
}
