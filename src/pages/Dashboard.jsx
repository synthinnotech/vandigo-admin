import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users, Car, CheckCircle, Navigation, Activity, TrendingUp, Wallet
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { getStats } from '../api/admin';
import { getRides } from '../api/rides';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { StatCardSkeleton, Skeleton } from '../components/ui/Skeleton';
import { formatDate, formatCurrency, getStatusColor } from '../lib/utils';

function generateMockRideData() {
  const data = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    data.push({
      date: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      rides: Math.floor(20 + Math.random() * 60),
    });
  }
  return data;
}

const PIE_COLORS = ['#4f46e5', '#10b981', '#ef4444', '#f59e0b'];

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => getStats().then((r) => r.data),
  });

  const { data: ridesData, isLoading: ridesLoading } = useQuery({
    queryKey: ['rides'],
    queryFn: () => getRides({ limit: 5 }).then((r) => r.data),
  });

  const chartData = useMemo(() => generateMockRideData(), []);

  const recentRides = Array.isArray(ridesData)
    ? ridesData.slice(0, 5)
    : (ridesData?.items ?? ridesData?.rides ?? []).slice(0, 5);

  const pieData = stats
    ? [
        { name: 'Active', value: stats.active_rides ?? 0 },
        { name: 'Completed', value: stats.completed_rides ?? 0 },
        { name: 'Cancelled', value: (stats.total_rides ?? 0) - (stats.active_rides ?? 0) - (stats.completed_rides ?? 0) },
      ].filter((d) => d.value > 0)
    : [];

  const statCards = [
    { label: 'Total Users', value: stats?.total_users, icon: Users, color: 'indigo' },
    { label: 'Total Drivers', value: stats?.total_drivers, icon: Car, color: 'blue' },
    { label: 'Approved Drivers', value: stats?.approved_drivers, icon: CheckCircle, color: 'green' },
    { label: 'Total Rides', value: stats?.total_rides, icon: Navigation, color: 'purple' },
    { label: 'Active Rides', value: stats?.active_rides, icon: Activity, color: 'orange' },
    { label: 'Completed Rides', value: stats?.completed_rides, icon: TrendingUp, color: 'green' },
    { label: 'Pending Withdrawals', value: stats?.pending_withdrawals, icon: Wallet, color: 'yellow' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Overview</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Platform performance at a glance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {statsLoading
          ? Array.from({ length: 7 }).map((_, i) => <StatCardSkeleton key={i} />)
          : statCards.map((card) => <StatCard key={card.label} {...card} />)}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2" padding={false}>
          <div className="px-6 pt-5 pb-2 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Rides Over Time</h3>
            <p className="text-xs text-gray-400 mt-0.5">Last 30 days</p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(107,114,128,0.15)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                  interval={4}
                />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--tw-bg, #fff)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="rides"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card padding={false}>
          <div className="px-6 pt-5 pb-2 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Ride Status</h3>
            <p className="text-xs text-gray-400 mt-0.5">Distribution</p>
          </div>
          <div className="p-4">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={65}
                    outerRadius={95}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => v.toLocaleString()} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : statsLoading ? (
              <div className="h-64 flex items-center justify-center">
                <Skeleton className="h-40 w-40 rounded-full" />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-sm text-gray-400">No data</div>
            )}
          </div>
        </Card>
      </div>

      <Card padding={false}>
        <div className="px-6 pt-5 pb-3 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Recent Rides</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                {['Ride ID', 'Status', 'Pickup', 'Dropoff', 'Fare', 'Date'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {ridesLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-6 py-3">
                          <Skeleton className="h-4 w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                : recentRides.length === 0
                ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-400">
                        No rides yet
                      </td>
                    </tr>
                  )
                : recentRides.map((ride) => (
                    <tr key={ride.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">#{ride.id}</td>
                      <td className="px-6 py-3">
                        <Badge variant={getStatusColor(ride.status)}>{ride.status ?? '—'}</Badge>
                      </td>
                      <td className="px-6 py-3 text-gray-700 dark:text-gray-300 max-w-[140px] truncate">{ride.pickup_address ?? '—'}</td>
                      <td className="px-6 py-3 text-gray-700 dark:text-gray-300 max-w-[140px] truncate">{ride.dropoff_address ?? '—'}</td>
                      <td className="px-6 py-3 text-gray-700 dark:text-gray-300">{formatCurrency(ride.final_fare ?? ride.estimated_fare)}</td>
                      <td className="px-6 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(ride.started_at ?? ride.created_at)}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
