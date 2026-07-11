import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPayments } from '../api/payments';
import { Table } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Pagination from '../components/ui/Pagination';
import { formatDate, formatCurrency } from '../lib/utils';

const PAGE_SIZE = 20;

export default function Payments() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['payments', page],
    queryFn: () => getPayments({ page, limit: PAGE_SIZE }).then((r) => r.data),
  });

  const payments = Array.isArray(data) ? data : (data?.items ?? data?.payments ?? []);
  const total = Array.isArray(data) ? payments.length : (data?.total ?? payments.length);

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
      key: 'method', label: 'Method',
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
        <p className="text-sm text-gray-500 dark:text-gray-400">{total} records</p>
      </div>
      <Table
        columns={columns}
        data={payments}
        loading={isLoading}
        emptyMessage="No payment records found"
      />
      <Pagination page={page} limit={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  );
}
