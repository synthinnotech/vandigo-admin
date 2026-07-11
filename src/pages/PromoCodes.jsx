import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2 } from 'lucide-react';
import { getPromoCodes, createPromoCode, updatePromoCode } from '../api/promoCodes';
import { useToast } from '../context/ToastContext';
import { Table } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Pagination from '../components/ui/Pagination';
import { formatDate, getErrorMessage } from '../lib/utils';

const PAGE_SIZE = 20;

const EMPTY_FORM = {
  code: '', discount_type: 'percent', discount_value: '', max_uses: '', is_active: true, expires_at: '',
};

function PromoForm({ initial = EMPTY_FORM, apiError, onSubmit, loading, onClose }) {
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
    if (!form.discount_value) e.discount_value = 'Discount value is required';
    else if (isNaN(Number(form.discount_value)) || Number(form.discount_value) <= 0) e.discount_value = 'Must be a positive number';
    if (form.max_uses) {
      const n = Number(form.max_uses);
      if (!Number.isInteger(n) || n <= 0) e.max_uses = 'Must be a positive whole number';
    }
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSubmit({
      code: form.code.trim().toUpperCase(),
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      max_uses: form.max_uses ? Number(form.max_uses) : undefined,
      is_active: form.is_active,
      expires_at: form.expires_at || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Promo Code" value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} error={errors.code || apiError?.code} placeholder="SAVE20" />

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

      <Input label="Discount Value" type="number" value={form.discount_value} onChange={(e) => set('discount_value', e.target.value)} error={errors.discount_value} placeholder={form.discount_type === 'percent' ? '20' : '50'} />
      <Input label="Max Uses (optional)" type="number" value={form.max_uses} onChange={(e) => set('max_uses', e.target.value)} error={errors.max_uses} placeholder="100" />
      <Input label="Expires At (optional)" type="datetime-local" value={form.expires_at} onChange={(e) => set('expires_at', e.target.value)} />

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="is_active"
          checked={form.is_active}
          onChange={(e) => set('is_active', e.target.checked)}
          className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
        />
        <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</label>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>Save</Button>
      </div>
    </form>
  );
}

export default function PromoCodes() {
  const { addToast } = useToast();
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const [modal, setModal] = useState(() => (searchParams.get('action') === 'create' ? { mode: 'create' } : null));
  const [apiError, setApiError] = useState(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['promo-codes'],
    queryFn: () => getPromoCodes().then((r) => r.data),
  });

  const promos = Array.isArray(data) ? data : (data?.items ?? data?.promo_codes ?? []);
  const total = promos.length;
  const paged = promos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function openModal(next) {
    setApiError(null);
    setModal(next);
  }

  const create = useMutation({
    mutationFn: createPromoCode,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['promo-codes'] }); addToast('Promo code created!', 'success'); setModal(null); },
    onError: (err) => {
      if (err.response?.status === 409) setApiError({ code: getErrorMessage(err) });
      else addToast(getErrorMessage(err, 'Failed to create promo code'), 'error');
    },
  });

  const update = useMutation({
    mutationFn: ({ id, ...data }) => updatePromoCode(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['promo-codes'] }); addToast('Promo code updated', 'success'); setModal(null); },
    onError: (err) => {
      if (err.response?.status === 409) {
        setApiError({ code: getErrorMessage(err) });
      } else if (err.response?.status === 404) {
        addToast(getErrorMessage(err, 'This promo code no longer exists'), 'error');
        qc.invalidateQueries({ queryKey: ['promo-codes'] });
        setModal(null);
      } else {
        addToast(getErrorMessage(err, 'Failed to update promo code'), 'error');
      }
    },
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }) => updatePromoCode(id, { is_active }),
    onMutate: async ({ id, is_active }) => {
      await qc.cancelQueries({ queryKey: ['promo-codes'] });
      const previous = qc.getQueryData(['promo-codes']);
      qc.setQueryData(['promo-codes'], (old) => {
        const list = Array.isArray(old) ? old : (old?.items ?? old?.promo_codes ?? []);
        const next = list.map((p) => (p.id === id ? { ...p, is_active } : p));
        if (Array.isArray(old)) return next;
        if (old?.items) return { ...old, items: next };
        if (old?.promo_codes) return { ...old, promo_codes: next };
        return old;
      });
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous !== undefined) qc.setQueryData(['promo-codes'], context.previous);
      addToast(getErrorMessage(err, 'Failed to update status'), 'error');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['promo-codes'] }),
  });

  function handleToggle(promo) {
    toggleActive.mutate({ id: promo.id, is_active: !promo.is_active });
  }

  const columns = [
    { key: 'id', label: 'ID', width: 60, render: (v) => <span className="font-mono text-xs text-gray-500">#{v}</span> },
    { key: 'code', label: 'Code', render: (v) => <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">{v}</span> },
    {
      key: 'discount_type', label: 'Type',
      render: (v) => <Badge variant="info">{v === 'percent' ? 'Percentage' : 'Flat'}</Badge>,
    },
    {
      key: 'discount_value', label: 'Value',
      render: (v, row) => <span className="font-medium">{row.discount_type === 'percent' ? `${v}%` : `₹${v}`}</span>,
    },
    {
      key: 'usage', label: 'Usage',
      render: (_, row) => {
        const used = row.used_count ?? 0;
        const max = row.max_uses;
        const pct = max ? Math.min(100, (used / max) * 100) : 0;
        return (
          <div className="w-24">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">{used} / {max ?? '∞'}</p>
            {max != null && (
              <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div className="h-1.5 rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
              </div>
            )}
          </div>
        );
      },
    },
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
    { key: 'expires_at', label: 'Expires', render: (v) => <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(v)}</span> },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <Button size="xs" variant="ghost" icon={Edit2} onClick={(e) => { e.stopPropagation(); openModal({ mode: 'edit', promo: row }); }}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Promo Codes</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{total} codes</p>
        </div>
        <Button icon={Plus} onClick={() => openModal({ mode: 'create' })}>New Code</Button>
      </div>

      <Table columns={columns} data={paged} loading={isLoading} emptyMessage="No promo codes found" />

      <Pagination page={page} limit={PAGE_SIZE} total={total} onPageChange={setPage} />

      <Modal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'edit' ? 'Edit Promo Code' : 'Create Promo Code'}
        size="md"
      >
        {modal && (
          <PromoForm
            initial={modal.mode === 'edit' ? { ...modal.promo, discount_value: String(modal.promo.discount_value), max_uses: String(modal.promo.max_uses ?? ''), expires_at: modal.promo.expires_at ? modal.promo.expires_at.slice(0, 16) : '' } : EMPTY_FORM}
            apiError={apiError}
            loading={modal.mode === 'edit' ? update.isPending : create.isPending}
            onClose={() => setModal(null)}
            onSubmit={(formData) => {
              setApiError(null);
              if (modal.mode === 'edit') update.mutate({ id: modal.promo.id, ...formData });
              else create.mutate(formData);
            }}
          />
        )}
      </Modal>
    </div>
  );
}
