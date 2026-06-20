import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2 } from 'lucide-react';
import { getPromoCodes, createPromoCode, updatePromoCode } from '../api/promoCodes';
import { useToast } from '../context/ToastContext';
import { Table } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { formatDate } from '../lib/utils';

const EMPTY_FORM = {
  code: '', discount_type: 'percentage', discount_value: '', max_uses: '', is_active: true, expires_at: '',
};

function PromoForm({ initial = EMPTY_FORM, onSubmit, loading, onClose }) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }));
  }

  function validate() {
    const e = {};
    if (!form.code.trim()) e.code = 'Code is required';
    if (!form.discount_value) e.discount_value = 'Discount value is required';
    else if (isNaN(Number(form.discount_value)) || Number(form.discount_value) <= 0) e.discount_value = 'Must be a positive number';
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
      <Input label="Promo Code" value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} error={errors.code} placeholder="SAVE20" />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Discount Type</label>
        <select
          value={form.discount_type}
          onChange={(e) => set('discount_type', e.target.value)}
          className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="percentage">Percentage (%)</option>
          <option value="flat">Flat Amount (₹)</option>
        </select>
      </div>

      <Input label="Discount Value" type="number" value={form.discount_value} onChange={(e) => set('discount_value', e.target.value)} error={errors.discount_value} placeholder={form.discount_type === 'percentage' ? '20' : '50'} />
      <Input label="Max Uses (optional)" type="number" value={form.max_uses} onChange={(e) => set('max_uses', e.target.value)} placeholder="100" />
      <Input label="Expires At (optional)" type="datetime-local" value={form.expires_at} onChange={(e) => set('expires_at', e.target.value)} />

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="is_active"
          checked={form.is_active}
          onChange={(e) => set('is_active', e.target.checked)}
          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
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
  const [modal, setModal] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['promo-codes'],
    queryFn: () => getPromoCodes().then((r) => r.data),
  });

  const promos = Array.isArray(data) ? data : (data?.items ?? data?.promo_codes ?? []);

  const create = useMutation({
    mutationFn: createPromoCode,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['promo-codes'] }); addToast('Promo code created!', 'success'); setModal(null); },
    onError: () => addToast('Failed to create promo code', 'error'),
  });

  const update = useMutation({
    mutationFn: ({ id, ...data }) => updatePromoCode(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['promo-codes'] }); addToast('Promo code updated', 'success'); setModal(null); },
    onError: () => addToast('Failed to update promo code', 'error'),
  });

  function handleToggle(promo) {
    update.mutate({ id: promo.id, is_active: !promo.is_active });
  }

  const columns = [
    { key: 'code', label: 'Code', render: (v) => <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">{v}</span> },
    {
      key: 'discount_type', label: 'Type',
      render: (v) => <Badge variant="info">{v === 'percentage' ? 'Percentage' : 'Flat'}</Badge>,
    },
    {
      key: 'discount_value', label: 'Value',
      render: (v, row) => <span className="font-medium">{row.discount_type === 'percentage' ? `${v}%` : `₹${v}`}</span>,
    },
    { key: 'max_uses', label: 'Max Uses', render: (v) => v ?? '∞' },
    { key: 'used_count', label: 'Used' },
    {
      key: 'is_active', label: 'Active',
      render: (v, row) => (
        <button
          onClick={(e) => { e.stopPropagation(); handleToggle(row); }}
          className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${v ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
          <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${v ? 'translate-x-4' : 'translate-x-0'}`} />
        </button>
      ),
    },
    { key: 'expires_at', label: 'Expires', render: (v) => <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(v)}</span> },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <Button size="xs" variant="ghost" icon={Edit2} onClick={(e) => { e.stopPropagation(); setModal({ mode: 'edit', promo: row }); }}>
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
          <p className="text-sm text-gray-500 dark:text-gray-400">{promos.length} codes</p>
        </div>
        <Button icon={Plus} onClick={() => setModal({ mode: 'create' })}>New Code</Button>
      </div>

      <Table columns={columns} data={promos} loading={isLoading} emptyMessage="No promo codes found" />

      <Modal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'edit' ? 'Edit Promo Code' : 'Create Promo Code'}
        size="md"
      >
        {modal && (
          <PromoForm
            initial={modal.mode === 'edit' ? { ...modal.promo, discount_value: String(modal.promo.discount_value), max_uses: String(modal.promo.max_uses ?? ''), expires_at: modal.promo.expires_at ? modal.promo.expires_at.slice(0, 16) : '' } : EMPTY_FORM}
            loading={modal.mode === 'edit' ? update.isPending : create.isPending}
            onClose={() => setModal(null)}
            onSubmit={(formData) => {
              if (modal.mode === 'edit') update.mutate({ id: modal.promo.id, ...formData });
              else create.mutate(formData);
            }}
          />
        )}
      </Modal>
    </div>
  );
}
