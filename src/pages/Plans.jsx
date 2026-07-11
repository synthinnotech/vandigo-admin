import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2, Plus, Layers, Star } from 'lucide-react';
import { getPlans, createPlan, updatePlan } from '../api/plans';
import { useToast } from '../context/ToastContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';

const EMPTY_FORM = { name: '', vehicle_type: '', daily_price: '', features: '', is_popular: false, is_active: true };

function PlanForm({ initial = EMPTY_FORM, mode, onSubmit, loading, onClose }) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })); }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (mode === 'create' && !form.vehicle_type.trim()) e.vehicle_type = 'Vehicle type is required';
    if (!form.daily_price) e.daily_price = 'Required';
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const payload = {
      name: form.name.trim(),
      daily_price: Number(form.daily_price),
      features: form.features.split('\n').map((f) => f.trim()).filter(Boolean),
      is_popular: form.is_popular,
      is_active: form.is_active,
    };
    if (mode === 'create') payload.vehicle_type = form.vehicle_type.trim();
    onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Plan Name" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} placeholder="Cab Plan" />
      {mode === 'create' && (
        <Input label="Vehicle Type" value={form.vehicle_type} onChange={(e) => set('vehicle_type', e.target.value)} error={errors.vehicle_type} placeholder="sedan, auto, bike…" />
      )}
      <Input label="Daily Price (₹)" type="number" step="0.01" value={form.daily_price} onChange={(e) => set('daily_price', e.target.value)} error={errors.daily_price} placeholder="50" />
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Features (one per line)</label>
        <textarea
          rows={4}
          value={form.features}
          onChange={(e) => set('features', e.target.value)}
          placeholder={'Unlimited rides\nPriority support'}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <input type="checkbox" id="plan_popular" checked={form.is_popular} onChange={(e) => set('is_popular', e.target.checked)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
          <label htmlFor="plan_popular" className="text-sm font-medium text-gray-700 dark:text-gray-300">Popular</label>
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="plan_active" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
          <label htmlFor="plan_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</label>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>Save Plan</Button>
      </div>
    </form>
  );
}

function PlanCard({ plan, onEdit }) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-indigo-100 dark:bg-indigo-900/30 p-2.5">
            <Layers size={18} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{plan.name}</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">{plan.vehicle_type}</p>
          </div>
        </div>
        <Button size="xs" variant="secondary" icon={Edit2} onClick={() => onEdit(plan)}>Edit</Button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Badge variant={plan.is_active ? 'success' : 'default'}>{plan.is_active ? 'Active' : 'Inactive'}</Badge>
        {plan.is_popular && (
          <Badge variant="warning" className="flex items-center gap-1">
            <Star size={12} /> Popular
          </Badge>
        )}
      </div>

      <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-gray-700 mb-2">
        <dt className="text-sm text-gray-500 dark:text-gray-400">Daily Price</dt>
        <dd className="text-sm font-semibold text-gray-900 dark:text-gray-100">₹{plan.daily_price}</dd>
      </div>

      {plan.features?.length > 0 && (
        <ul className="space-y-1 mt-2">
          {plan.features.map((f, i) => (
            <li key={i} className="text-sm text-gray-600 dark:text-gray-300">• {f}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function Plans() {
  const { addToast } = useToast();
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => getPlans().then((r) => r.data),
  });

  const plans = Array.isArray(data) ? data : (data?.items ?? []);

  const create = useMutation({
    mutationFn: createPlan,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['plans'] }); addToast('Plan created!', 'success'); setModal(null); },
    onError: () => addToast('Creation failed', 'error'),
  });

  const update = useMutation({
    mutationFn: ({ id, ...rest }) => updatePlan(id, rest),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['plans'] }); addToast('Plan updated', 'success'); setModal(null); },
    onError: () => addToast('Update failed', 'error'),
  });

  function handleEdit(plan) {
    setModal({
      mode: 'edit',
      plan,
      initial: {
        name: plan.name,
        vehicle_type: plan.vehicle_type,
        daily_price: String(plan.daily_price),
        features: (plan.features ?? []).join('\n'),
        is_popular: plan.is_popular,
        is_active: plan.is_active,
      },
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Plans</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Wallet access plans per vehicle type</p>
        </div>
        <Button icon={Plus} onClick={() => setModal({ mode: 'create' })}>Add Plan</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-6 w-1/2 mb-4" />
              {Array.from({ length: 4 }).map((__, j) => <Skeleton key={j} className="h-4 mb-2" />)}
            </Card>
          ))}
        </div>
      ) : plans.length === 0 ? (
        <Card className="py-12 text-center text-gray-400">No plans yet. Add one to get started.</Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((p) => <PlanCard key={p.id} plan={p} onEdit={handleEdit} />)}
        </div>
      )}

      <Modal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'edit' ? `Edit — ${modal?.plan?.name}` : 'Add Plan'}
        size="md"
      >
        {modal && (
          <PlanForm
            initial={modal.initial ?? EMPTY_FORM}
            mode={modal.mode}
            loading={modal.mode === 'edit' ? update.isPending : create.isPending}
            onClose={() => setModal(null)}
            onSubmit={(formData) => {
              if (modal.mode === 'edit') update.mutate({ id: modal.plan.id, ...formData });
              else create.mutate(formData);
            }}
          />
        )}
      </Modal>
    </div>
  );
}
