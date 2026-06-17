import React from 'react';
import { Clock, Calendar, AlertCircle, Bell, FileText, Link, Trash2, Mail, MessageCircle } from 'lucide-react';

const typeConfig = {
  OA: { icon: Clock, color: 'text-warning', bg: 'bg-yellow-50', label: 'Online Assessment' },
  Interview: { icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Interview' },
  'Referral Follow Up': { icon: Link, color: 'text-cyan-600', bg: 'bg-cyan-50', label: 'Referral Follow Up' },
  'Application Deadline': { icon: AlertCircle, color: 'text-danger', bg: 'bg-red-50', label: 'Deadline' },
  'Resume Update': { icon: FileText, color: 'text-primary', bg: 'bg-primary-pale', label: 'Resume Update' },
  Other: { icon: Bell, color: 'text-text-muted', bg: 'bg-background', label: 'Reminder' },
};

const formatDateTime = (dateStr) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = d - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const dateString = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  let relative = '';
  if (diffDays === 0) relative = 'Today';
  else if (diffDays === 1) relative = 'Tomorrow';
  else if (diffDays > 1) relative = `In ${diffDays} days`;
  else relative = `${Math.abs(diffDays)} days ago`;

  return { timeStr, dateString, relative, isPast: diffMs < 0 };
};

const ReminderCard = ({ reminder, onDelete }) => {
  const config = typeConfig[reminder.reminder_type] || typeConfig.Other;
  const Icon = config.icon;
  const { timeStr, dateString, relative, isPast } = formatDateTime(reminder.remind_at);

  return (
    <div className={`bg-white border border-border rounded-xl p-4 flex items-start gap-3 hover:border-primary/20 hover:shadow-sm transition-all ${isPast || reminder.sent ? 'opacity-60' : ''}`}>
      {/* Type icon */}
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bg}`}>
        <Icon size={16} className={config.color} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-text-main leading-snug">{reminder.title}</p>
            {reminder.company_name && (
              <p className="text-xs text-text-muted mt-0.5">{reminder.company_name}</p>
            )}
          </div>
          {reminder.sent && (
            <span className="text-xs text-text-muted bg-background px-2 py-0.5 rounded-full flex-shrink-0">Sent</span>
          )}
        </div>

        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span className={`text-xs font-medium ${isPast ? 'text-text-muted' : 'text-text-main'}`}>
            {dateString} · {timeStr}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isPast
              ? 'bg-gray-100 text-gray-500'
              : 'bg-primary-pale text-primary'
          }`}>
            {relative}
          </span>
        </div>

        {/* Channel badges */}
        <div className="flex items-center gap-2 mt-2">
          {reminder.send_email && (
            <span className="inline-flex items-center gap-1 text-xs text-text-muted bg-background px-2 py-0.5 rounded-full">
              <Mail size={10} />
              Email
            </span>
          )}
          {reminder.send_whatsapp && (
            <span className="inline-flex items-center gap-1 text-xs text-success bg-green-50 px-2 py-0.5 rounded-full">
              <MessageCircle size={10} />
              WhatsApp
            </span>
          )}
        </div>
      </div>

      {/* Delete */}
      {!reminder.sent && (
        <button
          onClick={() => onDelete(reminder)}
          className="text-text-muted hover:text-danger transition-colors p-1.5 rounded-lg hover:bg-red-50 flex-shrink-0 mt-0.5"
          title="Delete reminder"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
};

export default ReminderCard;
