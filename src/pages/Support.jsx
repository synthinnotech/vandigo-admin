import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { getTickets, getTicket, replyToTicket } from '../api/support';
import { useToast } from '../context/ToastContext';
import { Table } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Drawer from '../components/ui/Drawer';
import { Skeleton } from '../components/ui/Skeleton';
import { formatDate, getStatusColor } from '../lib/utils';
import clsx from 'clsx';

function TicketThread({ ticketId }) {
  const { addToast } = useToast();
  const qc = useQueryClient();
  const [replyText, setReplyText] = useState('');
  const bottomRef = useRef(null);

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['support-ticket', ticketId],
    queryFn: () => getTicket(ticketId).then((r) => r.data),
    enabled: !!ticketId,
    refetchInterval: 10000,
  });

  const reply = useMutation({
    mutationFn: (text) => replyToTicket(ticketId, { text }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['support-ticket', ticketId] });
      setReplyText('');
    },
    onError: () => addToast('Failed to send reply', 'error'),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  if (isLoading) {
    return <div className="px-6 py-4 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>;
  }

  if (!ticket) return null;

  const messages = ticket.messages ?? [];

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 space-y-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{ticket.subject}</p>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusColor(ticket.status)}>{ticket.status}</Badge>
          {ticket.category && <Badge variant="default">{ticket.category}</Badge>}
        </div>
        {ticket.ride_id && <p className="text-xs text-gray-400">Ride #{ticket.ride_id}</p>}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">No messages yet</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={clsx('flex', msg.is_agent ? 'justify-end' : 'justify-start')}>
              <div
                className={clsx(
                  'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
                  msg.is_agent
                    ? 'bg-amber-500 text-gray-900 rounded-br-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm'
                )}
              >
                <p>{msg.text}</p>
                <p className={clsx('text-xs mt-1 opacity-70', msg.is_agent ? 'text-right' : '')}>{formatDate(msg.created_at)}</p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <form
          onSubmit={(e) => { e.preventDefault(); if (replyText.trim()) reply.mutate(replyText.trim()); }}
          className="flex gap-2"
        >
          <input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type a reply…"
            className="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-gray-400"
          />
          <Button type="submit" icon={Send} loading={reply.isPending} disabled={!replyText.trim()}>
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function Support() {
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: () => getTickets().then((r) => r.data),
  });

  const tickets = Array.isArray(data) ? data : (data?.items ?? data?.tickets ?? []);

  const columns = [
    { key: 'id', label: 'ID', render: (v) => <span className="font-mono text-xs text-gray-500">#{v}</span> },
    { key: 'user_id', label: 'User', render: (v) => <span className="font-mono text-xs text-gray-500">#{v}</span> },
    { key: 'subject', label: 'Subject', render: (v) => <span className="font-medium text-gray-900 dark:text-gray-100 max-w-[200px] truncate block">{v ?? '—'}</span> },
    { key: 'category', label: 'Category', render: (v) => v ? <Badge variant="info">{v}</Badge> : '—' },
    {
      key: 'status', label: 'Status',
      render: (v) => <Badge variant={getStatusColor(v)}>{v ?? '—'}</Badge>,
    },
    { key: 'ride_id', label: 'Ride', render: (v) => v ? <span className="font-mono text-xs text-gray-500">#{v}</span> : '—' },
    { key: 'created_at', label: 'Created', render: (v) => <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(v)}</span> },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Support Tickets</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{tickets.length} tickets</p>
      </div>

      <Table
        columns={columns}
        data={tickets}
        loading={isLoading}
        onRowClick={(row) => setSelectedTicketId(row.id)}
        emptyMessage="No support tickets"
      />

      <Drawer
        isOpen={!!selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
        title={`Ticket #${selectedTicketId}`}
      >
        {selectedTicketId && <TicketThread ticketId={selectedTicketId} />}
      </Drawer>
    </div>
  );
}
