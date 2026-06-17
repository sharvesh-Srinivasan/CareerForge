import React from 'react';
import { Briefcase, FileText, Bell, BarChart2, Plus } from 'lucide-react';

const iconMap = {
  briefcase: Briefcase,
  file: FileText,
  bell: Bell,
  chart: BarChart2,
  plus: Plus,
};

const EmptyState = ({
  icon = 'briefcase',
  title = 'Nothing here yet',
  description = 'Get started by adding your first item.',
  actionLabel,
  onAction,
}) => {
  const Icon = iconMap[icon] || Briefcase;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-primary-pale flex items-center justify-center mb-4">
        <Icon size={24} className="text-primary" />
      </div>
      <h3 className="text-base font-medium text-text-main mb-2">{title}</h3>
      <p className="text-sm text-text-muted max-w-xs leading-relaxed mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary-hover transition-colors"
        >
          <Plus size={14} />
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
