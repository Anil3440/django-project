import React from 'react';

const STATUS_CONFIGS = {
  PROPOSED: {
    label: 'Proposed',
    bg: 'bg-slate-100 text-slate-700 border-slate-300',
    dot: 'bg-slate-400',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
  },
  APPROVED: {
    label: 'Approved',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  COMPENSATION_PAID: {
    label: 'Compensation Paid',
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-teal-50 text-teal-800 border-teal-300',
    dot: 'bg-teal-600',
  },
  REJECTED: {
    label: 'Rejected',
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
  },
};

export default function StatusBadge({ status, size = 'sm' }) {
  const config = STATUS_CONFIGS[status] || {
    label: status,
    bg: 'bg-gray-100 text-gray-700 border-gray-200',
    dot: 'bg-gray-400',
  };

  const sizeClasses = size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${config.bg} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      {config.label}
    </span>
  );
}

export function RoleBadge({ role }) {
  const roleStyles = {
    Admin: 'bg-purple-100 text-purple-700 border-purple-200',
    Officer: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Viewer: 'bg-sky-100 text-sky-700 border-sky-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-md border ${
        roleStyles[role] || 'bg-gray-100 text-gray-600 border-gray-200'
      }`}
    >
      {role}
    </span>
  );
}

