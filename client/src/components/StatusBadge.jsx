import React from 'react';

const statusStyles = {
  'Applied': 'bg-blue-50 text-blue-700',
  'OA Scheduled': 'bg-yellow-50 text-yellow-700',
  'OA Cleared': 'bg-green-50 text-green-700',
  'Technical Round 1': 'bg-purple-50 text-purple-700',
  'Technical Round 2': 'bg-purple-50 text-purple-700',
  'Technical Round 3': 'bg-purple-50 text-purple-700',
  'HR Round': 'bg-indigo-50 text-indigo-700',
  'Offer Received': 'bg-emerald-50 text-emerald-700',
  'Accepted': 'bg-green-50 text-green-700',
  'Rejected': 'bg-red-50 text-red-700',
  'Declined': 'bg-gray-100 text-gray-600',
};

const StatusBadge = ({ status, size = 'sm' }) => {
  const styles = statusStyles[status] || 'bg-gray-100 text-gray-600';
  const sizeClass = size === 'md' ? 'px-3 py-1 text-xs' : 'px-2.5 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${styles} ${sizeClass}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
