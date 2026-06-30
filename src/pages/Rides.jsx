import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';
import { getRides, getRide } from '../api/rides';
import { Table } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';
import { formatDate, formatCurrency, getStatusColor } from '../lib/utils';
import clsx from 'clsx';

const STATUS_FILTERS = ['all', 'in_progress', 'completed', 'cancelled'];

function RideDetailModal({ rideId, onClose }) {
  const { data: ride, isLoading } = useQuery({
    queryKey: ['ride', rideId],
    queryFn: () => getRide(rideId).then((r) => r.data),
    enabled: !!rideId,
  });

  return (
    <Modal isOpen={!!rideId} onClose={onClose} title={`Ride #${rideId}`} size="md">
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
        </div>
      ) : ride ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant={getStatusColor(ride.status)} className="text-sm px-3 py-1">
              {ride.status}
            </Badge>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {[
              ['Customer ID', ride.customer_id],
              ['Driver ID', ride.driver_id],
              ['Pickup', ride.pickup_address],
              ['Dropoff', ride.dropoff_address],
              ['Estimated Fare', formatCurrency(ride.estimated_fare)],
              ['Final Fare', formatCurrency(ride.final_fare)],
              ['Started', formatDate(ride.started_at)],
              ['Completed', formatDate(ride.completed_at)],
              ['Cancel Reason', ride.cancel_reason],
              ['Cancelled By', ride.cancelled_by],
            ].map(([label, val]) => val != null && val !== '—' && (
              <div key={label} className="flex justify-between gap-4 py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 text-right">{val}</span>
              </div>
            ))}
          </div>
          {(ride.pickup_lat && ride.pickup_lng) && (
            <div className="mt-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 dark:text-gray-400">
              <p>Pickup: {ride.pickup_lat}, {ride.pickup_lng}</p>
              <p>Dropoff: {ride.dropoff_lat}, {ride.dropoff_lng}</p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-center text-gray-400 py-8">Ride not found</p>
      )}
    </Modal>
  );
}

export default function Rides() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRideId, setSelectedRideId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['rides', statusFilter],
    queryFn: () => getRides(statusFilter !== 'all' ? { status: statusFilter } : {}).then((r) => r.data),
  });

  const rides = Array.isArray(data) ? data : (data?.items ?? data?.rides ?? []);

  const columns = [
    { key: 'id', label: 'Ride ID', render: (v) => <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">#{v}</span> },
    { key: 'customer_id', label: 'Customer', render: (v) => <span className="font-mono text-xs text-gray-500">#{v}</span> },
    { key: 'driver_id', label: 'Driver', render: (v) => <span className="font-mono text-xs text-gray-500">{v ? `#${v}` : '—'}</span> },
    {
      key: 'pickup_address', label: 'Pickup',
      render: (v) => (
        <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400 max-w-[140px] truncate">
          <MapPin size={12} className="text-green-500 shrink-0" /> {v ?? '—'}
        </span>
      ),
    },
    {
      key: 'dropoff_address', label: 'Dropoff',
      render: (v) => (
        <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400 max-w-[140px] truncate">
          <MapPin size={12} className="text-red-400 shrink-0" /> {v ?? '—'}
        </span>
      ),
    },
    {
      key: 'status', label: 'Status',
      render: (v) => <Badge variant={getStatusColor(v)}>{v ?? '—'}</Badge>,
    },
    {
      key: 'final_fare', label: 'Fare',
      render: (v, row) => formatCurrency(v ?? row.estimated_fare),
    },
    {
      key: 'started_at', label: 'Date',
      render: (v, row) => <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(v ?? row.requested_at)}</span>,
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Rides</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{rides.length} rides</p>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit flex-wrap">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors',
              statusFilter === s
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <Table
        columns={columns}
        data={rides}
        loading={isLoading}
        onRowClick={(row) => setSelectedRideId(row.id)}
        emptyMessage="No rides found"
      />

      <RideDetailModal rideId={selectedRideId} onClose={() => setSelectedRideId(null)} />
    </div>
  );
}
