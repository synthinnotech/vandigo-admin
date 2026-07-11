import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { getOffersAdmin, createOffer, updateOffer, deleteOffer } from '../api/offers';
import { useToast } from '../context/ToastContext';
import { Table } from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Pagination from '../components/ui/Pagination';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { formatDate, getErrorMessage } from '../lib/utils';

const PAGE_SIZE = 20;

const EMPTY_FORM = {
  code: '', title: '', subtitle: '', badge_label: '', badge_color: '',
  expiry_date: '', discount_type: 'percent', discount_value: '0', min_ride_value: '0',
  is_active: true, sort_order: '0', image_url: '',
};

function BadgePreview({ label, color }) {
  if (!label?.trim()) return <span className="text-xs text-gray-400 dark:text-gray-500">No badge</span>;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm"
      style={{ backgroundColor: color?.trim() || '#6b7280' }}
    >
      {label}
    </span>
  );
}

function OfferForm({ initial = EMPTY_FORM, apiError, onSubmit, loading, onClose }) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }));
  }

  function validate() {
    const e = {};
    const code = form.code.trim();
    if (!code) e.code = 'Code is required';
    else if (code.length < 3 || code.length > 50) e.code = 'Code must be 3-50 characters';
    if (!form.title.trim()) e.title = 'Title is required';
    if (form.discount_value !== '' && (isNaN(Number(form.discount_value)) || Number(form.discount_value) < 0)) {
      e.discount_value = 'Must be zero or a positive number';
    }
    if (form.min_ride_value !== '' && (isNaN(Number(form.min_ride_value)) || Number(form.min_ride_value) < 0)) {
      e.min_ride_value = 'Must be zero or a positive number';
    }
    if (form.sort_order !== '' && !Number.isInteger(Number(form.sort_order))) {
      e.sort_order = 'Must be a whole number';
    }
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSubmit({
      code: form.code.trim().toUpperCase(),
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || undefined,
      badge_label: form.badge_label.trim() || undefined,
      badge_color: form.badge_color.trim() || undefined,
      expiry_date: form.expiry_date || undefined,
      discount_type: form.discount_type,
      discount_value: form.discount_value === '' ? 0 : Number(form.discount_value),
      min_ride_value: form.min_ride_value === '' ? 0 : Number(form.min_ride_value),
      is_active: form.is_active,
      sort_order: form.sort_order === '' ? 0 : Number(form.sort_order),
      image_url: form.image_url.trim() || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Offer Code" value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} error={errors.code || apiError?.code} placeholder="WELCOME10" />
      <Input label="Title" value={form.title} onChange={(e) => set('title', e.target.value)} error={errors.title} placeholder="Welcome Offer" />
      <Input label="Subtitle (optional)" value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} placeholder="For your first ride" />

      <div className="grid grid-cols-2 gap-4">
        <Input label="Badge Label (optional)" value={form.badge_label} onChange={(e) => set('badge_label', e.target.value)} placeholder="NEW" />
        <Input label="Badge Color (optional)" value={form.badge_color} onChange={(e) => set('badge_color', e.target.value)} placeholder="#f59e0b" />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Preview:</span>
        <BadgePreview label={form.badge_label} color={form.badge_color} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Discount Type</label>
        <select
          value={form.discount_type}
          onChange={(e) => set('discount_type', e.target.value)}
          className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="percent">Percentage (%)</option>
          <option value="flat">Flat Amount (₹)</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Discount Value" type="number" value={form.discount_value} onChange={(e) => set('discount_value', e.target.value)} error={errors.discount_value} placeholder={form.discount_type === 'percent' ? '20' : '50'} />
        <Input label="Min Ride Value" type="number" value={form.min_ride_value} onChange={(e) => set('min_ride_value', e.target.value)} error={errors.min_ride_value} placeholder="0" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Sort Order" type="number" value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} error={errors.sort_order} placeholder="0" />
        <Input label="Expires At (optional)" type="datetime-local" value={form.expiry_date} onChange={(e) => set('expiry_date', e.target.value)} />
      </div>

      <Input label="Image URL (optional)" value={form.image_url} onChange={(e) => set('image_url', e.target.value)} placeholder="https://…" />

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="offer_is_active"
          checked={form.is_active}
          onChange={(e) => set('is_active', e.target.checked)}
          className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
        />
        <label htmlFor="offer_is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</label>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>Save</Button>
      </div>
    </form>
  );
}

function toFormValues(offer) {
  return {
    ...offer,
    subtitle: offer.subtitle ?? '',
    badge_label: offer.badge_label ?? '',
    badge_color: offer.badge_color ?? '',
    expiry_date: offer.expiry_date ? offer.expiry_date.slice(0, 16) : '',
    discount_value: String(offer.discount_value ?? 0),
    min_ride_value: String(offer.min_ride_value ?? 0),
    sort_order: String(offer.sort_order ?? 0),
    image_url: offer.image_url ?? '',
  };
}

export default function Offers() {
  const { addToast } = useToast();
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const [modal, setModal] = useState(() => (searchParams.get('action') === 'create' ? { mode: 'create' } : null));
  const [apiError, setApiError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['offers-admin'],
    queryFn: () => getOffersAdmin().then((r) => r.data),
  });

  const offers = Array.isArray(data) ? data : (data?.items ?? data?.offers ?? []);
  const total = offers.length;
  const paged = offers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function openModal(next) {
    setApiError(null);
    setModal(next);
  }

  const create = useMutation({
    mutationFn: createOffer,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['offers-admin'] }); addToast('Offer created!', 'success'); setModal(null); },
    onError: (err) => {
      if (err.response?.status === 409) setApiError({ code: getErrorMessage(err) });
      else addToast(getErrorMessage(err, 'Failed to create offer'), 'error');
    },
  });

  const update = useMutation({
    mutationFn: ({ id, ...data }) => updateOffer(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['offers-admin'] }); addToast('Offer updated', 'success'); setModal(null); },
    onError: (err) => {
      if (err.response?.status === 409) {
        setApiError({ code: getErrorMessage(err) });
      } else if (err.response?.status === 404) {
        addToast(getErrorMessage(err, 'This offer no longer exists'), 'error');
        qc.invalidateQueries({ queryKey: ['offers-admin'] });
        setModal(null);
      } else {
        addToast(getErrorMessage(err, 'Failed to update offer'), 'error');
      }
    },
  });

  const remove = useMutation({
    mutationFn: (id) => deleteOffer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['offers-admin'] });
      addToast('Offer deleted', 'success');
      setDeleteTarget(null);
    },
    onError: (err) => {
      addToast(getErrorMessage(err, 'Failed to delete offer'), 'error');
      if (err.response?.status === 404) qc.invalidateQueries({ queryKey: ['offers-admin'] });
      setDeleteTarget(null);
    },
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }) => updateOffer(id, { is_active }),
    onMutate: async ({ id, is_active }) => {
      await qc.cancelQueries({ queryKey: ['offers-admin'] });
      const previous = qc.getQueryData(['offers-admin']);
      qc.setQueryData(['offers-admin'], (old) => {
        const list = Array.isArray(old) ? old : (old?.items ?? old?.offers ?? []);
        const next = list.map((o) => (o.id === id ? { ...o, is_active } : o));
        if (Array.isArray(old)) return next;
        if (old?.items) return { ...old, items: next };
        if (old?.offers) return { ...old, offers: next };
        return old;
      });
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous !== undefined) qc.setQueryData(['offers-admin'], context.previous);
      addToast(getErrorMessage(err, 'Failed to update status'), 'error');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['offers-admin'] }),
  });

  function handleToggle(offer) {
    toggleActive.mutate({ id: offer.id, is_active: !offer.is_active });
  }

  const columns = [
    { key: 'id', label: 'ID', width: 60, render: (v) => <span className="font-mono text-xs text-gray-500">#{v}</span> },
    { key: 'code', label: 'Code', render: (v) => <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">{v}</span> },
    {
      key: 'title', label: 'Title',
      render: (v, row) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">{v}</p>
          {row.subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{row.subtitle}</p>}
        </div>
      ),
    },
    {
      key: 'badge_label', label: 'Badge',
      render: (v, row) => <BadgePreview label={v} color={row.badge_color} />,
    },
    {
      key: 'discount_value', label: 'Discount',
      render: (v, row) => <span className="font-medium">{row.discount_type === 'percent' ? `${v}%` : `₹${v}`}</span>,
    },
    { key: 'min_ride_value', label: 'Min Fare', render: (v) => `₹${v}` },
    { key: 'sort_order', label: 'Order' },
    {
      key: 'is_active', label: 'Active',
      render: (v, row) => (
        <button
          onClick={(e) => { e.stopPropagation(); handleToggle(row); }}
          className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${v ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
          <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${v ? 'translate-x-4' : 'translate-x-0'}`} />
        </button>
      ),
    },
    { key: 'expiry_date', label: 'Expires', render: (v) => <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(v)}</span> },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="xs" variant="ghost" icon={Edit2} onClick={() => openModal({ mode: 'edit', offer: row })}>
            Edit
          </Button>
          <Button size="xs" variant="ghost" icon={Trash2} className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20" onClick={() => setDeleteTarget(row)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Offers</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{total} offers</p>
        </div>
        <Button icon={Plus} onClick={() => openModal({ mode: 'create' })}>New Offer</Button>
      </div>

      <Table columns={columns} data={paged} loading={isLoading} emptyMessage="No offers found" />

      <Pagination page={page} limit={PAGE_SIZE} total={total} onPageChange={setPage} />

      <Modal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'edit' ? 'Edit Offer' : 'Create Offer'}
        size="md"
      >
        {modal && (
          <OfferForm
            initial={modal.mode === 'edit' ? toFormValues(modal.offer) : EMPTY_FORM}
            apiError={apiError}
            loading={modal.mode === 'edit' ? update.isPending : create.isPending}
            onClose={() => setModal(null)}
            onSubmit={(formData) => {
              setApiError(null);
              if (modal.mode === 'edit') update.mutate({ id: modal.offer.id, ...formData });
              else create.mutate(formData);
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => remove.mutate(deleteTarget.id)}
        title="Delete Offer"
        message={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={remove.isPending}
      />
    </div>
  );
}
