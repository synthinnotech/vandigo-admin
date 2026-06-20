import { useQuery } from '@tanstack/react-query';
import { getPayments } from '../api/payments';
import { Table } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import { formatDate, formatCurrency } from '../lib/utils';

export default function Payments() {
  const { data, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: () => getPayments().then((r) => r.data),
  });

  const payments = Array.isArray(data) ? data : (data?.items ?? data?.payments ?? []);

  const statusColor = (s) => {
    if (s === 'completed') return 'success';
    if (s === 'pending') return 'warning';
    if (s === 'failed') return 'danger';
    return 'default';
  };

  const columns = [
    { key: 'id', label: 'Payment ID', render: (v) => <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">#{v}</span> },
    { key: 'customer_id', label: 'Customer', render: (v) => <span className="font-mono text-xs text-gray-500">#{v}</span> },
    { key: 'ride_id', label: 'Ride', render: (v) => <span className="font-mono text-xs text-gray-500">{v ? `#${v}` : '—'}</span> },
    { key: 'amount', label: 'Amount', render: (v) => <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(v)}</span> },
    {
      key: 'payment_method', label: 'Method',
      render: (v) => <Badge variant="info">{v ?? '—'}</Badge>,
    },
    {
      key: 'status', label: 'Status',
      render: (v) => <Badge variant={statusColor(v)}>{v ?? '—'}</Badge>,
    },
    {
      key: 'created_at', label: 'Date',
      render: (v) => <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(v)}</span>,
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Payments</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{payments.length} records</p>
      </div>
      <Table
        columns={columns}
        data={payments}
        loading={isLoading}
        emptyMessage="No payment records found"
      />
    </div>
  );
}
