import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { getDocumentTypes, createDocumentType } from '../api/documentTypes';
import { useToast } from '../context/ToastContext';
import { Table } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';

export default function DocumentTypes() {
  const { addToast } = useToast();
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(() => searchParams.get('action') === 'create');
  const [form, setForm] = useState({ title: '', description: '', is_mandatory: false });
  const [errors, setErrors] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ['document-types'],
    queryFn: () => getDocumentTypes().then((r) => r.data),
  });

  const docTypes = Array.isArray(data) ? data : (data?.items ?? data?.document_types ?? []);

  const create = useMutation({
    mutationFn: createDocumentType,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['document-types'] });
      addToast('Document type created!', 'success');
      setModalOpen(false);
      setForm({ title: '', description: '', is_mandatory: false });
    },
    onError: () => addToast('Failed to create', 'error'),
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) { setErrors({ title: 'Title is required' }); return; }
    setErrors({});
    create.mutate({
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      is_mandatory: form.is_mandatory,
    });
  }

  const columns = [
    { key: 'id', label: 'ID', render: (v) => <span className="font-mono text-xs text-gray-500">#{v}</span> },
    { key: 'title', label: 'Title', render: (v) => <span className="font-medium text-gray-900 dark:text-gray-100">{v}</span> },
    { key: 'description', label: 'Description', render: (v) => <span className="text-gray-500 dark:text-gray-400">{v ?? '—'}</span> },
    {
      key: 'is_mandatory', label: 'Mandatory',
      render: (v) => <Badge variant={v ? 'warning' : 'default'}>{v ? 'Required' : 'Optional'}</Badge>,
    },
    {
      key: 'is_active', label: 'Status',
      render: (v) => <Badge variant={v !== false ? 'success' : 'default'}>{v !== false ? 'Active' : 'Inactive'}</Badge>,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Document Types</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Required driver document categories</p>
        </div>
        <Button icon={Plus} onClick={() => setModalOpen(true)}>Add Type</Button>
      </div>

      <Table
        columns={columns}
        data={docTypes}
        loading={isLoading}
        emptyMessage="No document types defined"
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Document Type" size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            error={errors.title}
            placeholder="e.g. Driving License"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description (optional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Brief description of this document type"
              rows={3}
              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none placeholder-gray-400"
            />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={form.is_mandatory}
              onChange={(e) => setForm((f) => ({ ...f, is_mandatory: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-amber-500 focus:ring-amber-500"
            />
            Mandatory document
          </label>
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={create.isPending}>Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
