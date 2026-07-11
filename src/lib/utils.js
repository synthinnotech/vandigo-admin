export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(dateStr));
}

export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getStatusColor(status) {
  const map = {
    active: 'success',
    completed: 'success',
    approved: 'success',
    verified: 'success',
    pending: 'warning',
    processing: 'warning',
    cancelled: 'danger',
    rejected: 'danger',
    failed: 'danger',
    inactive: 'default',
    pending_approval: 'warning',
  };
  return map[status?.toLowerCase()] ?? 'default';
}

export function truncate(str, maxLen = 30) {
  if (!str) return '—';
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}

export function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  const detail = err?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  return fallback;
}
