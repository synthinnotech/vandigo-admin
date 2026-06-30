import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, FileText, Star, Award } from 'lucide-react';
import { getAllDrivers, getPendingDrivers, approveDriver, getDriverDocuments, reviewDocument } from '../api/drivers';
import { useToast } from '../context/ToastContext';
import { Table } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Drawer from '../components/ui/Drawer';
import { formatDate, getStatusColor } from '../lib/utils';
import clsx from 'clsx';

function DocumentReview({ driverId, onClose }) {
  const { addToast } = useToast();
  const qc = useQueryClient();
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewingDocId, setReviewingDocId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['driver-documents', driverId],
    queryFn: () => getDriverDocuments(driverId).then((r) => r.data),
    enabled: !!driverId,
  });

  const docs = Array.isArray(data) ? data : (data?.documents ?? data?.items ?? []);

  const review = useMutation({
    mutationFn: ({ docId, status, reason }) =>
      reviewDocument(docId, { status, rejection_reason: reason || undefined }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['driver-documents', driverId] });
      addToast(`Document ${vars.status}`, vars.status === 'approved' ? 'success' : 'warning');
      setReviewingDocId(null);
    },
    onError: () => addToast('Review failed', 'error'),
  });

  if (isLoading) {
    return <div className="px-6 py-8 text-center text-sm text-gray-400">Loading documents…</div>;
  }

  if (docs.length === 0) {
    return <div className="px-6 py-8 text-center text-sm text-gray-400">No documents uploaded</div>;
  }

  return (
    <div className="px-6 py-4 space-y-4">
      {docs.map((doc) => (
        <div key={doc.id} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{doc.document_type ?? doc.title ?? `Document #${doc.id}`}</span>
            </div>
            <Badge variant={getStatusColor(doc.status)}>{doc.status ?? 'pending'}</Badge>
          </div>
          {doc.file_url && (
            <a
              href={doc.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View file ↗
            </a>
          )}
          {doc.status === 'pending' && (
            <div className="flex flex-col gap-2">
              <textarea
                placeholder="Rejection reason (optional)"
                className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                rows={2}
                value={reviewingDocId === doc.id ? rejectionReason : ''}
                onChange={(e) => { setReviewingDocId(doc.id); setRejectionReason(e.target.value); }}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="success"
                  loading={review.isPending && reviewingDocId === doc.id}
                  onClick={() => review.mutate({ docId: doc.id, status: 'approved' })}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  loading={review.isPending && reviewingDocId === doc.id}
                  onClick={() => review.mutate({ docId: doc.id, status: 'rejected', reason: rejectionReason })}
                >
                  Reject
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function DriverTable({ data, loading, onApprove, onDocs, approvingId }) {
  const columns = [
    { key: 'id', label: 'ID', render: (v) => <span className="font-mono text-xs text-gray-500">#{v}</span> },
    {
      key: 'full_name', label: 'Name',
      render: (v, row) => <span className="font-medium text-gray-900 dark:text-gray-100">{v ?? row.name ?? row.user?.full_name ?? '—'}</span>,
    },
    { key: 'phone', label: 'Phone', render: (v, row) => v ?? row.user?.phone ?? '—' },
    {
      key: 'is_approved', label: 'Approved',
      render: (v) => <Badge variant={v ? 'success' : 'warning'}>{v ? 'Approved' : 'Pending'}</Badge>,
    },
    {
      key: 'rating', label: 'Rating',
      render: (v) => v ? (
        <span className="flex items-center gap-1 text-sm">
          <Star size={13} className="text-yellow-400 fill-yellow-400" />
          {Number(v).toFixed(1)}
        </span>
      ) : '—',
    },
    {
      key: 'is_gold', label: 'Gold',
      render: (v) => v ? <Award size={16} className="text-yellow-500" /> : <span className="text-gray-300">—</span>,
    },
    { key: 'created_at', label: 'Joined', render: (v) => <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(v)}</span> },
    {
      key: 'actions', label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {!row.is_approved && (
            <Button
              size="xs"
              variant="success"
              icon={CheckCircle}
              loading={approvingId === row.id}
              onClick={() => onApprove(row.id)}
            >
              Approve
            </Button>
          )}
          <Button size="xs" variant="secondary" icon={FileText} onClick={() => onDocs(row.id)}>
            Docs
          </Button>
        </div>
      ),
    },
  ];

  return <Table columns={columns} data={data} loading={loading} emptyMessage="No drivers found" />;
}

export default function Drivers() {
  const { addToast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState('all');
  const [docsDriverId, setDocsDriverId] = useState(null);
  const [approvingId, setApprovingId] = useState(null);

  const { data: allData, isLoading: allLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => getAllDrivers().then((r) => r.data),
  });

  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ['drivers', 'pending'],
    queryFn: () => getPendingDrivers().then((r) => r.data),
    enabled: tab === 'pending',
  });

  const approve = useMutation({
    mutationFn: (id) => approveDriver(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drivers'] });
      addToast('Driver approved!', 'success');
      setApprovingId(null);
    },
    onError: () => { addToast('Approval failed', 'error'); setApprovingId(null); },
  });

  function handleApprove(id) {
    setApprovingId(id);
    approve.mutate(id);
  }

  const allDrivers = Array.isArray(allData) ? allData : (allData?.items ?? allData?.drivers ?? []);
  const pendingDrivers = Array.isArray(pendingData) ? pendingData : (pendingData?.items ?? pendingData?.drivers ?? []);

  const tabs = [
    { key: 'all', label: 'All Drivers', count: allDrivers.length },
    { key: 'pending', label: 'Pending Approval', count: pendingDrivers.length },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Drivers</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage driver accounts and approvals</p>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
              tab === t.key
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            )}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-1.5 text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full px-1.5 py-0.5">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'all' ? (
        <DriverTable
          data={allDrivers}
          loading={allLoading}
          onApprove={handleApprove}
          onDocs={setDocsDriverId}
          approvingId={approvingId}
        />
      ) : (
        <DriverTable
          data={pendingDrivers}
          loading={pendingLoading}
          onApprove={handleApprove}
          onDocs={setDocsDriverId}
          approvingId={approvingId}
        />
      )}

      <Drawer
        isOpen={!!docsDriverId}
        onClose={() => setDocsDriverId(null)}
        title="Driver Documents"
      >
        <DocumentReview driverId={docsDriverId} onClose={() => setDocsDriverId(null)} />
      </Drawer>
    </div>
  );
}
