import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2, Plus, DollarSign } from 'lucide-react';
import { getFareConfigs, createFareConfig, updateFareConfig } from '../api/fareConfig';
import { useToast } from '../context/ToastContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';

const EMPTY_FORM = { vehicle_type: '', base_fare: '', per_km_rate: '', per_min_rate: '', min_fare: '', is_active: true };

function FareForm({ initial = EMPTY_FORM, mode, onSubmit, loading, onClose }) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })); }

  function validate() {
    const e = {};
    if (mode === 'create' && !form.vehicle_type.trim()) e.vehicle_type = 'Vehicle type is required';
    if (!form.base_fare) e.base_fare = 'Required';
    if (!form.per_km_rate) e.per_km_rate = 'Required';
    if (!form.per_min_rate) e.per_min_rate = 'Required';
    if (!form.min_fare) e.min_fare = 'Required';
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const payload = {
      base_fare: Number(form.base_fare),
      per_km_rate: Number(form.per_km_rate),
      per_min_rate: Number(form.per_min_rate),
      min_fare: Number(form.min_fare),
      is_active: form.is_active,
    };
    if (mode === 'create') payload.vehicle_type = form.vehicle_type.trim();
    onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === 'create' && (
        <Input label="Vehicle Type" value={form.vehicle_type} onChange={(e) => set('vehicle_type', e.target.value)} error={errors.vehicle_type} placeholder="sedan, auto, bike…" />
      )}
      <div className="grid grid-cols-2 gap-4">
        <Input label="Base Fare (₹)" type="number" step="0.01" value={form.base_fare} onChange={(e) => set('base_fare', e.target.value)} error={errors.base_fare} placeholder="30" />
        <Input label="Per KM Rate (₹)" type="number" step="0.01" value={form.per_km_rate} onChange={(e) => set('per_km_rate', e.target.value)} error={errors.per_km_rate} placeholder="12" />
        <Input label="Per Min Rate (₹)" type="number" step="0.01" value={form.per_min_rate} onChange={(e) => set('per_min_rate', e.target.value)} error={errors.per_min_rate} placeholder="1.5" />
        <Input label="Min Fare (₹)" type="number" step="0.01" value={form.min_fare} onChange={(e) => set('min_fare', e.target.value)} error={errors.min_fare} placeholder="50" />
      </div>
      <div className="flex items-center gap-3">
        <input type="checkbox" id="fc_active" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
        <label htmlFor="fc_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</label>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>Save Config</Button>
      </div>
    </form>
  );
}

function FareCard({ config, onEdit }) {
  const rows = [
    ['Base Fare', `₹${config.base_fare}`],
    ['Per KM', `₹${config.per_km_rate}`],
    ['Per Minute', `₹${config.per_min_rate}`],
    ['Min Fare', `₹${config.min_fare}`],
  ];

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-indigo-100 dark:bg-indigo-900/30 p-2.5">
            <DollarSign size={18} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 capitalize">{config.vehicle_type}</h3>
            <Badge variant={config.is_active ? 'success' : 'default'} className="mt-0.5">
              {config.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
        <Button size="xs" variant="secondary" icon={Edit2} onClick={() => onEdit(config)}>Edit</Button>
      </div>
      <dl className="space-y-2">
        {rows.map(([label, val]) => (
          <div key={label} className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-gray-700">
            <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
            <dd className="text-sm font-semibold text-gray-900 dark:text-gray-100">{val}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

export default function FareConfig() {
  const { addToast } = useToast();
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['fare-config'],
    queryFn: () => getFareConfigs().then((r) => r.data),
  });

  const configs = Array.isArray(data) ? data : (data?.items ?? data?.fare_configs ?? []);

  const create = useMutation({
    mutationFn: createFareConfig,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fare-config'] }); addToast('Fare config created!', 'success'); setModal(null); },
    onError: () => addToast('Creation failed', 'error'),
  });

  const update = useMutation({
    mutationFn: ({ vehicle_type, ...rest }) => updateFareConfig(vehicle_type, rest),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fare-config'] }); addToast('Config updated', 'success'); setModal(null); },
    onError: () => addToast('Update failed', 'error'),
  });

  function handleEdit(config) {
    setModal({
      mode: 'edit',
      config,
      initial: {
        vehicle_type: config.vehicle_type,
        base_fare: String(config.base_fare),
        per_km_rate: String(config.per_km_rate),
        per_min_rate: String(config.per_min_rate),
        min_fare: String(config.min_fare),
        is_active: config.is_active,
      },
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Fare Configuration</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Pricing rules per vehicle type</p>
        </div>
        <Button icon={Plus} onClick={() => setModal({ mode: 'create' })}>Add Config</Button>
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
      ) : configs.length === 0 ? (
        <Card className="py-12 text-center text-gray-400">No fare configs yet. Add one to get started.</Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {configs.map((c) => <FareCard key={c.vehicle_type ?? c.id} config={c} onEdit={handleEdit} />)}
        </div>
      )}

      <Modal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'edit' ? `Edit — ${modal?.config?.vehicle_type}` : 'Add Fare Config'}
        size="md"
      >
        {modal && (
          <FareForm
            initial={modal.initial ?? EMPTY_FORM}
            mode={modal.mode}
            loading={modal.mode === 'edit' ? update.isPending : create.isPending}
            onClose={() => setModal(null)}
            onSubmit={(formData) => {
              if (modal.mode === 'edit') update.mutate({ vehicle_type: modal.config.vehicle_type, ...formData });
              else create.mutate(formData);
            }}
          />
        )}
      </Modal>
    </div>
  );
}
