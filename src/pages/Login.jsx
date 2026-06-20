import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Phone, Lock, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function Login() {
  const { token, login } = useAuth();
  const { addToast } = useToast();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  if (token) return <Navigate to="/dashboard" replace />;

  function validate() {
    const e = {};
    if (!phone.trim()) e.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(phone.trim())) e.phone = 'Enter a valid 10-digit phone number';
    if (!password) e.password = 'Password is required';
    else if (password.length < 4) e.password = 'Password must be at least 4 characters';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await login(phone.trim(), password);
      addToast('Logged in successfully', 'success');
    } catch (err) {
      const msg = err.response?.data?.detail ?? 'Invalid credentials. Please try again.';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="rounded-2xl bg-indigo-600 p-3.5 mb-4 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
              <Zap size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Welcome back</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Sign in to Vandigo Admin</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Phone Number"
              type="tel"
              icon={Phone}
              placeholder="9999999999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={errors.phone}
              maxLength={10}
              autoComplete="username"
            />
            <Input
              label="Password"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              autoComplete="current-password"
            />

            <Button type="submit" className="w-full justify-center mt-2" loading={loading}>
              Sign in
            </Button>
          </form>

        </div>
      </div>
    </div>
  );
}
