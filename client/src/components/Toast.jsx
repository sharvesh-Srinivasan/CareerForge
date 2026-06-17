import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const toastConfig = {
  success: {
    icon: CheckCircle,
    classes: 'bg-white border-l-4 border-success',
    iconClass: 'text-success',
    titleClass: 'text-success',
    title: 'Success',
  },
  error: {
    icon: XCircle,
    classes: 'bg-white border-l-4 border-danger',
    iconClass: 'text-danger',
    titleClass: 'text-danger',
    title: 'Error',
  },
  warning: {
    icon: AlertTriangle,
    classes: 'bg-white border-l-4 border-warning',
    iconClass: 'text-warning',
    titleClass: 'text-warning',
    title: 'Warning',
  },
  info: {
    icon: Info,
    classes: 'bg-white border-l-4 border-primary',
    iconClass: 'text-primary',
    titleClass: 'text-primary',
    title: 'Info',
  },
};

const ToastItem = ({ toast, onRemove }) => {
  const [exiting, setExiting] = useState(false);
  const config = toastConfig[toast.type] || toastConfig.info;
  const Icon = config.icon;

  useEffect(() => {
    const timeout = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration || 3500);

    return () => clearTimeout(timeout);
  }, [toast.id, toast.duration, onRemove]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-xl shadow-lg border border-border
        min-w-72 max-w-sm pointer-events-auto
        ${config.classes}
        ${exiting ? 'toast-exit' : 'toast-enter'}
      `}
    >
      <Icon size={18} className={`flex-shrink-0 mt-0.5 ${config.iconClass}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold uppercase tracking-wide mb-0.5 ${config.titleClass}`}>
          {config.title}
        </p>
        <p className="text-sm text-text-main leading-snug">{toast.message}</p>
      </div>
      <button
        onClick={handleClose}
        className="text-text-muted hover:text-text-main transition-colors flex-shrink-0 -mt-0.5"
      >
        <X size={14} />
      </button>
    </div>
  );
};

const Toast = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

export default Toast;
