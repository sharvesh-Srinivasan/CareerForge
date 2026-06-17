import React from 'react';

const SkeletonBlock = ({ className = '' }) => (
  <div className={`skeleton ${className}`} />
);

const StatSkeleton = () => (
  <div className="bg-white border border-border rounded-xl p-5 flex flex-col gap-3">
    <SkeletonBlock className="h-4 w-24 rounded" />
    <SkeletonBlock className="h-8 w-16 rounded" />
    <SkeletonBlock className="h-3 w-32 rounded" />
  </div>
);

const CardSkeleton = () => (
  <div className="bg-white border border-border rounded-xl p-6 flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <SkeletonBlock className="h-5 w-40 rounded" />
      <SkeletonBlock className="h-6 w-20 rounded-full" />
    </div>
    <SkeletonBlock className="h-4 w-full rounded" />
    <SkeletonBlock className="h-4 w-3/4 rounded" />
    <div className="flex gap-3 mt-2">
      <SkeletonBlock className="h-8 w-24 rounded-lg" />
      <SkeletonBlock className="h-8 w-24 rounded-lg" />
    </div>
  </div>
);

const TableRowSkeleton = () => (
  <tr>
    <td className="px-4 py-3"><SkeletonBlock className="h-4 w-32 rounded" /></td>
    <td className="px-4 py-3"><SkeletonBlock className="h-4 w-40 rounded" /></td>
    <td className="px-4 py-3"><SkeletonBlock className="h-6 w-24 rounded-full" /></td>
    <td className="px-4 py-3"><SkeletonBlock className="h-4 w-20 rounded" /></td>
    <td className="px-4 py-3"><SkeletonBlock className="h-4 w-24 rounded" /></td>
    <td className="px-4 py-3"><SkeletonBlock className="h-4 w-16 rounded" /></td>
  </tr>
);

const LoadingSkeleton = ({ type = 'card', count = 3 }) => {
  if (type === 'stat') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Array.from({ length: count }).map((_, i) => <StatSkeleton key={i} />)}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <SkeletonBlock className="h-5 w-40 rounded" />
        </div>
        <table className="w-full">
          <tbody>
            {Array.from({ length: count }).map((_, i) => <TableRowSkeleton key={i} />)}
          </tbody>
        </table>
      </div>
    );
  }

  // Default: card
  return (
    <div className="grid gap-4">
      {Array.from({ length: count }).map((_, i) => <CardSkeleton key={i} />)}
    </div>
  );
};

export default LoadingSkeleton;
