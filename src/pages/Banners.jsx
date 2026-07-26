import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Upload } from 'lucide-react';
import { getBannersAdmin, createBanner, updateBanner, deleteBanner, uploadBannerImage } from '../api/banners';
import { useToast } from '../context/ToastContext';
import { Table } from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { getErrorMessage } from '../lib/utils';

const EMPTY_FORM = { title: '', subtitle: '', image_url: '', is_active: true, sort_order: '0' };

function ImagePicker({ imageUrl, onUploaded }) {
  const { addToast } = useToast();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadBannerImage(file);
      onUploaded(res.data.file_url);
    } catch (err) {
      addToast(getErrorMessage(err, 'Failed to upload image'), 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Banner Image</label>
      <div className="flex items-center gap-3">
        <div className="h-16 w-28 shrink-0 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
          {imageUrl ? (
            <img src={imageUrl} alt="Banner preview" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400"><Upload size={18} /></div>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
        <Button type="button" variant="secondary" size="sm" loading={uploading} onClick={() => fileInputRef.current?.click()}>
          {imageUrl ? 'Replace Image' : 'Upload Image'}
        </Button>
      </div>
    </div>
  );
}

function BannerForm({ initial = EMPTY_FORM, onSubmit, loading, onClose }) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.image_url) { setErrors({ image_url: 'Upload a banner image' }); return; }
    if (form.sort_order !== '' && !Number.isInteger(Number(form.sort_order))) {
      setErrors({ sort_order: 'Must be a whole number' });
      return;
    }
    onSubmit({
      title: form.title.trim() || undefined,
      subtitle: form.subtitle.trim() || undefined,
      image_url: form.image_url,
      is_active: form.is_active,
      sort_order: form.sort_order === '' ? 0 : Number(form.sort_order),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ImagePicker imageUrl={form.image_url} onUploaded={(url) => set('image_url', url)} />
      {errors.image_url && <p className="text-xs text-red-500">{errors.image_url}</p>}

      <Input label="Title (optional)" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Special rides discount" />
      <Input label="Subtitle (optional)" value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} placeholder="just for you" />
      <Input label="Sort Order" type="number" value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} error={errors.sort_order} placeholder="0" />

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="banner_is_active"
          checked={form.is_active}
          onChange={(e) => set('is_active', e.target.checked)}
          className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
        />
        <label htmlFor="banner_is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</label>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>Save</Button>
      </div>
    </form>
  );
}

function toFormValues(banner) {
  return {
    title: banner.title ?? '',
    subtitle: banner.subtitle ?? '',
    image_url: banner.image_url ?? '',
    is_active: banner.is_active,
    sort_order: String(banner.sort_order ?? 0),
  };
}

export default function Banners() {
  const { addToast } = useToast();
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['banners-admin'],
    queryFn: () => getBannersAdmin().then((r) => r.data),
  });

  const banners = Array.isArray(data) ? data : [];

  const create = useMutation({
    mutationFn: createBanner,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['banners-admin'] }); addToast('Banner created!', 'success'); setModal(null); },
    onError: (err) => addToast(getErrorMessage(err, 'Failed to create banner'), 'error'),
  });

  const update = useMutation({
    mutationFn: ({ id, ...data }) => updateBanner(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['banners-admin'] }); addToast('Banner updated', 'success'); setModal(null); },
    onError: (err) => addToast(getErrorMessage(err, 'Failed to update banner'), 'error'),
  });

  const remove = useMutation({
    mutationFn: (id) => deleteBanner(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['banners-admin'] }); addToast('Banner deleted', 'success'); setDeleteTarget(null); },
    onError: (err) => { addToast(getErrorMessage(err, 'Failed to delete banner'), 'error'); setDeleteTarget(null); },
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }) => updateBanner(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['banners-admin'] }),
    onError: (err) => addToast(getErrorMessage(err, 'Failed to update status'), 'error'),
  });

  const columns = [
    {
      key: 'image_url', label: 'Preview',
      render: (v) => (
        <div className="h-12 w-24 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
          <img src={v} alt="Banner" className="h-full w-full object-cover" />
        </div>
      ),
    },
    {
      key: 'title', label: 'Title',
      render: (v, row) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">{v || '—'}</p>
          {row.subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{row.subtitle}</p>}
        </div>
      ),
    },
    { key: 'sort_order', label: 'Order' },
    {
      key: 'is_active', label: 'Active',
      render: (v, row) => (
        <button
          onClick={(e) => { e.stopPropagation(); toggleActive.mutate({ id: row.id, is_active: !v }); }}
          className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${v ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
          <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${v ? 'translate-x-4' : 'translate-x-0'}`} />
        </button>
      ),
    },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="xs" variant="ghost" icon={Edit2} onClick={() => setModal({ mode: 'edit', banner: row })}>Edit</Button>
          <Button size="xs" variant="ghost" icon={Trash2} className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20" onClick={() => setDeleteTarget(row)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Banners</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{banners.length} banners shown on the home screen</p>
        </div>
        <Button icon={Plus} onClick={() => setModal({ mode: 'create' })}>New Banner</Button>
      </div>

      <Table columns={columns} data={banners} loading={isLoading} emptyMessage="No banners yet" />

      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'edit' ? 'Edit Banner' : 'Create Banner'} size="md">
        {modal && (
          <BannerForm
            initial={modal.mode === 'edit' ? toFormValues(modal.banner) : EMPTY_FORM}
            loading={modal.mode === 'edit' ? update.isPending : create.isPending}
            onClose={() => setModal(null)}
            onSubmit={(formData) => {
              if (modal.mode === 'edit') update.mutate({ id: modal.banner.id, ...formData });
              else create.mutate(formData);
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => remove.mutate(deleteTarget.id)}
        title="Delete Banner"
        message={`Delete this banner? This cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={remove.isPending}
      />
    </div>
  );
}
