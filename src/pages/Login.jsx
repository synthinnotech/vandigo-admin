import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Phone, Lock, Eye, EyeOff, CarTaxiFront, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import loginBg from '../assets/login-bg.png';

export default function Login() {
  const { token, login } = useAuth();
  const { addToast } = useToast();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="relative min-h-screen w-full overflow-hidden bg-gray-950">
      {/* Full-bleed background photo */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{ backgroundImage: `url(${loginBg})` }}
      />
      {/* Depth + readability overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/70" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

      {/* Decorative glow accents */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-[28rem] w-[28rem] rounded-full bg-amber-500/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
      {/* Dotted texture, top-right */}
      <div
        className="pointer-events-none absolute right-0 top-0 hidden h-72 w-72 opacity-20 sm:block"
        style={{
          backgroundImage: 'radial-gradient(rgba(251,191,36,0.7) 1.5px, transparent 1.5px)',
          backgroundSize: '18px 18px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-12 px-6 py-12 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:px-20">
        {/* Brand / hero copy, floats directly on the photo */}
        <div className="max-w-xl text-center text-white lg:text-left">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 shadow-lg shadow-amber-500/40 ring-4 ring-amber-400/20 lg:mx-0">
            <CarTaxiFront size={30} className="text-gray-900" />
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight drop-shadow-md sm:text-5xl">
            Smart Rides,
            <br />
            <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
              Better Journeys
            </span>
          </h1>
          <p className="mt-5 text-lg text-gray-200 drop-shadow">
            Seamless. Safe. Reliable.
            <br />
            Every ride, every time.
          </p>

          <div className="mt-12 hidden items-center justify-center gap-2 text-gray-200 lg:flex lg:justify-start">
            <MapPin size={20} className="shrink-0 text-amber-400" />
            <span className="text-sm leading-snug">
              Every ride, Every city,
              <br />
              Connected.
            </span>
          </div>
        </div>

        {/* Floating glass card */}
        <div className="w-full max-w-md">
          <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/95 p-8 shadow-2xl shadow-black/50 backdrop-blur-xl dark:bg-gray-900/90 sm:p-10">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500" />

            <div className="mb-8 flex flex-col items-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 shadow-lg shadow-amber-500/30 ring-4 ring-amber-500/10">
                <CarTaxiFront size={26} className="text-gray-900" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Login</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Welcome back! Please login to continue.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Phone Number"
                type="tel"
                icon={Phone}
                accent="amber"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={errors.phone}
                maxLength={10}
                autoComplete="username"
              />
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                icon={Lock}
                accent="amber"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                autoComplete="current-password"
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => addToast('Please contact support to reset your password', 'info')}
                  className="text-sm font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400"
                >
                  Forgot Password?
                </button>
              </div>

              <Button
                type="submit"
                variant="amber"
                size="lg"
                className="w-full justify-center font-semibold"
                loading={loading}
              >
                Login
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
