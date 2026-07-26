import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';
import { getRideAlerts, resolveRideAlert } from '../api/rideAlerts';
import { useToast } from '../context/ToastContext';
import { Table } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { formatDate, getErrorMessage } from '../lib/utils';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'resolved', label: 'Resolved' },
];

const TYPE_LABELS = {
  sos: 'SOS',
  route_deviation: 'Route Deviation',
};

function statusVariant(status) {
  if (status === 'open') return 'danger';
  if (status === 'acknowledged') return 'warning';
  if (status === 'resolved') return 'success';
  return 'default';
}

export default function SafetyAlerts() {
  const { addToast } = useToast();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['ride-alerts', statusFilter],
    queryFn: () => getRideAlerts(statusFilter ? { status: statusFilter } : {}).then((r) => r.data),
    refetchInterval: 15000,
  });

  const alerts = Array.isArray(data) ? data : [];

  const resolve = useMutation({
    mutationFn: ({ id, status }) => resolveRideAlert(id, { status }),
    onSuccess: (_, { status }) => {
      qc.invalidateQueries({ queryKey: ['ride-alerts'] });
      addToast(status === 'resolved' ? 'Alert resolved' : 'Alert acknowledged', 'success');
    },
    onError: (err) => addToast(getErrorMessage(err, 'Failed to update alert'), 'error'),
  });

  const columns = [
    { key: 'id', label: 'ID', width: 60, render: (v) => <span className="font-mono text-xs text-gray-500">#{v}</span> },
    {
      key: 'type', label: 'Type',
      render: (v) => (
        <span className="inline-flex items-center gap-1.5 font-medium text-gray-900 dark:text-gray-100">
          <ShieldAlert size={14} className={v === 'sos' ? 'text-red-500' : 'text-amber-500'} />
          {TYPE_LABELS[v] ?? v}
        </span>
      ),
    },
    { key: 'ride_id', label: 'Ride', render: (v) => <span className="font-mono text-xs">#{v}</span> },
    { key: 'customer_id', label: 'Customer', render: (v) => <span className="font-mono text-xs">#{v}</span> },
    {
      key: 'lat', label: 'Location',
      render: (v, row) => (v != null && row.lng != null ? `${v.toFixed(4)}, ${row.lng.toFixed(4)}` : '—'),
    },
    { key: 'status', label: 'Status', render: (v) => <Badge variant={statusVariant(v)}>{v}</Badge> },
    { key: 'created_at', label: 'Raised', render: (v) => <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(v)}</span> },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {row.status === 'open' && (
            <Button size="xs" variant="ghost" onClick={() => resolve.mutate({ id: row.id, status: 'acknowledged' })}>
              Acknowledge
            </Button>
          )}
          {row.status !== 'resolved' && (
            <Button
              size="xs"
              variant="ghost"
              icon={CheckCircle2}
              className="text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
              onClick={() => resolve.mutate({ id: row.id, status: 'resolved' })}
            >
              Resolve
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Safety Alerts</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{alerts.length} alerts</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      <Table columns={columns} data={alerts} loading={isLoading} emptyMessage="No safety alerts" />
    </div>
  );
}
