import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sun, Moon, Save, Activity, User, Palette, Info, Lock, Camera, Eye, EyeOff, Phone, Bot, Volume2, FileText } from 'lucide-react';
import { getCurrentUser, updateCurrentUser, uploadProfilePicture, changePassword } from '../api/users';
import { getHealth } from '../api/admin';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useChat } from '../context/ChatContext';
import { AVAILABLE_MODELS } from '../config/aiModels';
import { aiPolicy } from '../content/aiPolicy';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import clsx from 'clsx';

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="rounded-xl bg-amber-50 dark:bg-amber-900/30 p-2.5">
        <Icon size={18} className="text-amber-600 dark:text-amber-400" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        {description && <p className="text-xs text-gray-400 dark:text-gray-500">{description}</p>}
      </div>
    </div>
  );
}

function ProfileSection() {
  const { addToast } = useToast();
  const qc = useQueryClient();
  const fileInputRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => getCurrentUser().then((r) => r.data),
  });

  const [form, setForm] = useState({ full_name: '', email: '', phone: '' });
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name ?? user.name ?? '',
        email: user.email ?? '',
        phone: user.phone ?? user.phone_number ?? '',
      });
    }
  }, [user]);

  const update = useMutation({
    mutationFn: (data) => updateCurrentUser(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['current-user'] });
      addToast('Profile updated!', 'success');
    },
    onError: () => addToast('Update failed', 'error'),
  });

  const picUpload = useMutation({
    mutationFn: (file) => uploadProfilePicture(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['current-user'] });
      addToast('Profile picture updated!', 'success');
    },
    onError: () => addToast('Upload failed', 'error'),
  });

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    picUpload.mutate(file);
    e.target.value = '';
  }

  const initials = form.full_name
    ? form.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'A';

  const avatarSrc = preview ?? (user?.profile_picture || null);

  return (
    <Card>
      <SectionHeader icon={User} title="Profile" description="Update your admin profile information" />

      <div className="flex items-center justify-between gap-4 mb-6 pb-5 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative flex-shrink-0">
            <div
              className="w-16 h-16 rounded-2xl overflow-hidden cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarSrc ? (
                <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-amber-500 flex items-center justify-center text-gray-900 font-bold text-lg">
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                <Camera size={18} className="text-white" />
              </div>
            </div>
            {picUpload.isPending && (
              <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="min-w-0">
            <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{form.full_name || 'Admin'}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 truncate">{form.email}</p>
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          icon={Camera}
          className="shrink-0"
          loading={picUpload.isPending}
          onClick={() => fileInputRef.current?.click()}
        >
          Change photo
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Full Name"
          value={form.full_name}
          onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
        <Input
          label="Phone"
          type="tel"
          icon={Phone}
          value={form.phone}
          placeholder="+91 00000 00000"
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
        />
      </div>

      <div className="mt-5">
        <Button icon={Save} loading={update.isPending} onClick={() => update.mutate(form)}>
          Save Changes
        </Button>
      </div>
    </Card>
  );
}

function PasswordSection() {
  const { addToast } = useToast();
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [validationError, setValidationError] = useState('');

  const change = useMutation({
    mutationFn: (data) => changePassword(data),
    onSuccess: () => {
      addToast('Password changed successfully!', 'success');
      setForm({ current_password: '', new_password: '', confirm_password: '' });
      setValidationError('');
    },
    onError: (e) => addToast(e?.response?.data?.detail ?? 'Failed to change password', 'error'),
  });

  function handleSubmit() {
    if (!form.current_password || !form.new_password || !form.confirm_password) {
      setValidationError('All fields are required');
      return;
    }
    if (form.new_password.length < 8) {
      setValidationError('New password must be at least 8 characters');
      return;
    }
    if (form.new_password !== form.confirm_password) {
      setValidationError('New passwords do not match');
      return;
    }
    setValidationError('');
    change.mutate({ current_password: form.current_password, new_password: form.new_password });
  }

  const eyeBtn = (field) => (
    <button
      type="button"
      onClick={() => setShow((s) => ({ ...s, [field]: !s[field] }))}
      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
    >
      {show[field] ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  return (
    <Card>
      <SectionHeader icon={Lock} title="Change Password" description="Update your account password" />
      <div className="space-y-4">
        <Input
          label="Current Password"
          type={show.current ? 'text' : 'password'}
          value={form.current_password}
          onChange={(e) => setForm((f) => ({ ...f, current_password: e.target.value }))}
          rightElement={eyeBtn('current')}
        />
        <Input
          label="New Password"
          type={show.new ? 'text' : 'password'}
          value={form.new_password}
          onChange={(e) => setForm((f) => ({ ...f, new_password: e.target.value }))}
          rightElement={eyeBtn('new')}
        />
        <Input
          label="Confirm New Password"
          type={show.confirm ? 'text' : 'password'}
          value={form.confirm_password}
          onChange={(e) => setForm((f) => ({ ...f, confirm_password: e.target.value }))}
          rightElement={eyeBtn('confirm')}
        />
        {validationError && (
          <p className="text-sm text-red-600 dark:text-red-400">{validationError}</p>
        )}
        <Button icon={Lock} loading={change.isPending} onClick={handleSubmit}>
          Change Password
        </Button>
      </div>
    </Card>
  );
}

function AppearanceSection() {
  const { theme, toggle } = useTheme();

  const options = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
  ];

  return (
    <Card>
      <SectionHeader icon={Palette} title="Appearance" description="Choose your preferred color theme" />
      <div className="grid grid-cols-2 gap-3">
        {options.map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            onClick={() => { if (theme !== value) toggle(); }}
            className={clsx(
              'flex flex-col items-center gap-2.5 py-5 rounded-xl border-2 transition-all text-sm font-medium',
              theme === value
                ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
            )}
          >
            <Icon size={22} />
            {label}
          </button>
        ))}
      </div>
    </Card>
  );
}

function AIAssistantSection() {
  const { modelId, setModelId, voiceEnabled, setVoiceEnabled } = useChat();
  const [policyOpen, setPolicyOpen] = useState(false);

  return (
    <Card>
      <SectionHeader icon={Bot} title="AI Assistant" description="Model and voice preferences for the chat assistant" />
      <div className="space-y-3">
        {AVAILABLE_MODELS.map((m) => (
          <button
            key={m.id}
            onClick={() => setModelId(m.id)}
            className={clsx(
              'flex w-full items-start justify-between gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all',
              modelId === m.id
                ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            )}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className={clsx('text-sm font-semibold', modelId === m.id ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-gray-100')}>
                  {m.name}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{m.description}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Volume2 size={16} className="text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Voice replies</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Read assistant responses aloud</p>
          </div>
        </div>
        <button
          role="switch"
          aria-checked={voiceEnabled}
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className={clsx(
            'relative h-6 w-11 shrink-0 rounded-full transition-colors',
            voiceEnabled ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'
          )}
        >
          <span
            className={clsx(
              'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
              voiceEnabled ? 'translate-x-5' : 'translate-x-0'
            )}
          />
        </button>
      </div>

      <Button
        variant="ghost"
        size="sm"
        icon={FileText}
        className="mt-4 w-full justify-center"
        onClick={() => setPolicyOpen(true)}
      >
        View AI Usage Policy
      </Button>

      <Modal isOpen={policyOpen} onClose={() => setPolicyOpen(false)} title={aiPolicy.title} size="md">
        <div className="space-y-4">
          {aiPolicy.sections.map((s) => (
            <div key={s.heading}>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{s.heading}</h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{s.body}</p>
            </div>
          ))}
        </div>
      </Modal>
    </Card>
  );
}

function AboutSection() {
  const { data: health, isLoading } = useQuery({
    queryKey: ['health'],
    queryFn: () => getHealth().then((r) => r.data),
    retry: false,
  });

  return (
    <Card>
      <SectionHeader icon={Info} title="About" description="Version and system information" />
      <dl className="space-y-0">
        {[
          ['Version', 'v1.0.0'],
          ['Build Date', 'Jun 19, 2026'],
          ['React Query', 'v5'],
          ['Tailwind CSS', 'v4'],
        ].map(([label, val]) => (
          <div key={label} className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-gray-700">
            <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
            <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{val}</dd>
          </div>
        ))}
        <div className="flex justify-between items-center pt-2.5">
          <dt className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <Activity size={14} /> API Health
          </dt>
          <dd>
            {isLoading ? (
              <Badge variant="default">Checking…</Badge>
            ) : health?.status === 'ok' ? (
              <Badge variant="success">Healthy</Badge>
            ) : (
              <Badge variant="danger">Unreachable</Badge>
            )}
          </dd>
        </div>
      </dl>
    </Card>
  );
}

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage your account and panel preferences</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <ProfileSection />
          <PasswordSection />
        </div>
        <div className="space-y-6">
          <AppearanceSection />
          <AIAssistantSection />
          <AboutSection />
        </div>
      </div>
    </div>
  );
}
