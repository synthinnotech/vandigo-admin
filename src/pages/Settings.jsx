import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sun, Moon, Save, Activity, User, Palette, Globe, Info } from 'lucide-react';
import { getCurrentUser, updateCurrentUser } from '../api/users';
import { getHealth } from '../api/admin';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import clsx from 'clsx';

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/30 p-2.5">
        <Icon size={18} className="text-indigo-600 dark:text-indigo-400" />
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

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => getCurrentUser().then((r) => r.data),
  });

  const [form, setForm] = useState({ full_name: '', email: '' });
  useEffect(() => {
    if (user) setForm({ full_name: user.full_name ?? user.name ?? '', email: user.email ?? '' });
  }, [user]);

  const update = useMutation({
    mutationFn: (data) => updateCurrentUser(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['current-user'] }); addToast('Profile updated!', 'success'); },
    onError: () => addToast('Update failed', 'error'),
  });

  return (
    <Card>
      <SectionHeader icon={User} title="Profile" description="Update your admin profile information" />
      <div className="space-y-4 max-w-sm">
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
        <Button icon={Save} loading={update.isPending} onClick={() => update.mutate(form)}>
          Save Changes
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
      <div className="flex gap-3">
        {options.map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            onClick={() => { if (theme !== value) toggle(); }}
            className={clsx(
              'flex flex-col items-center gap-2 px-6 py-4 rounded-xl border-2 transition-all text-sm font-medium',
              theme === value
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
            )}
          >
            <Icon size={20} />
            {label}
          </button>
        ))}
      </div>
    </Card>
  );
}

function ApiSection() {
  const { addToast } = useToast();
  const [url, setUrl] = useState(() => localStorage.getItem('vandigo_api_url') || 'http://localhost:8000');

  function save() {
    localStorage.setItem('vandigo_api_url', url.trim());
    addToast('API base URL saved!', 'success');
  }

  return (
    <Card>
      <SectionHeader icon={Globe} title="API Configuration" description="Set the API base URL for this admin panel" />
      <div className="flex gap-3 max-w-md">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="http://localhost:8000"
          className="flex-1"
        />
        <Button onClick={save} icon={Save}>Save</Button>
      </div>
      <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Changes take effect on the next API call</p>
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
      <dl className="space-y-3 max-w-sm">
        {[
          ['Version', 'v1.0.0'],
          ['Build Date', 'Jun 19, 2026'],
          ['React Query', 'v5'],
          ['Tailwind CSS', 'v4'],
        ].map(([label, val]) => (
          <div key={label} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
            <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
            <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{val}</dd>
          </div>
        ))}
        <div className="flex justify-between items-center py-2">
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

function PasswordSection() {
  return (
    <Card>
      <SectionHeader icon={User} title="Change Password" />
      <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          To change your password, please contact a super admin. Password self-service is not available in this version.
        </p>
      </div>
    </Card>
  );
}

export default function Settings() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account and panel preferences</p>
      </div>
      <ProfileSection />
      <AppearanceSection />
      <ApiSection />
      <PasswordSection />
      <AboutSection />
    </div>
  );
}
