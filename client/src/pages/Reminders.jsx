import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ReminderCard from '../components/ReminderCard';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { getReminders, createReminder, deleteReminder, getApplications } from '../api';

const REMINDER_TYPES = ['OA', 'Interview', 'Referral Follow Up', 'Application Deadline', 'Resume Update', 'Other'];

const Reminders = () => {
  const { user } = useAuth();
  const { toasts, toast, removeToast } = useToast();
  const [reminders, setReminders] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: { send_email: true, send_whatsapp: false },
  });
  const sendWhatsapp = watch('send_whatsapp');

  const fetchReminders = async () => {
    try {
      const res = await getReminders();
      setReminders(res.data.data || []);
    } catch {
      toast.error('Failed to load reminders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [remRes, appsRes] = await Promise.all([getReminders(), getApplications()]);
        setReminders(remRes.data.data || []);
        setApplications(appsRes.data.data || []);
      } catch {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const onSubmit = async (data) => {
    setCreating(true);
    try {
      const payload = {
        ...data,
        application_id: data.application_id || null,
        send_email: !!data.send_email,
        send_whatsapp: !!data.send_whatsapp,
        remind_at: new Date(data.remind_at).toISOString(),
      };
      await createReminder(payload);
      toast.success('Reminder created!');
      setModalOpen(false);
      reset({ send_email: true, send_whatsapp: false });
      fetchReminders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create reminder');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteReminder(deleteTarget.id);
      toast.success('Reminder deleted');
      setDeleteTarget(null);
      fetchReminders();
    } catch {
      toast.error('Failed to delete reminder');
    } finally {
      setDeleteLoading(false);
    }
  };

  const upcoming = reminders.filter((r) => !r.sent && new Date(r.remind_at) > new Date());
  const past = reminders.filter((r) => r.sent || new Date(r.remind_at) <= new Date());

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <Toast toasts={toasts} removeToast={removeToast} />

      <main className="ml-60 flex-1 p-8 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-2xl font-bold text-text-main">Reminders</h1>
            <p className="text-sm text-text-muted mt-1">{upcoming.length} upcoming reminders</p>
          </div>
          <button
            onClick={() => { setModalOpen(true); reset({ send_email: true, send_whatsapp: false }); }}
            className="flex items-center gap-2 bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            <Plus size={15} />
            Add Reminder
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
          </div>
        ) : reminders.length === 0 ? (
          <div className="bg-white border border-border rounded-xl">
            <EmptyState
              icon="bell"
              title="No reminders set"
              description="Set reminders for OA dates, interviews, and application deadlines."
              actionLabel="Add Reminder"
              onAction={() => setModalOpen(true)}
            />
          </div>
        ) : (
          <>
            {/* Upcoming */}
            {upcoming.length > 0 && (
              <section className="mb-7">
                <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
                  Upcoming ({upcoming.length})
                </h2>
                <div className="space-y-2.5">
                  {upcoming.map((r) => (
                    <ReminderCard key={r.id} reminder={r} onDelete={setDeleteTarget} />
                  ))}
                </div>
              </section>
            )}

            {/* Past */}
            {past.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
                  Past / Sent ({past.length})
                </h2>
                <div className="space-y-2.5">
                  {past.map((r) => (
                    <ReminderCard key={r.id} reminder={r} onDelete={setDeleteTarget} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Add Reminder Modal */}
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Reminder" size="md">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Title *</label>
              <input
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none ${errors.title ? 'border-danger' : 'border-border'}`}
                placeholder="Zomato OA reminder"
                {...register('title', { required: true })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Type *</label>
                <select
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                  {...register('reminder_type', { required: true })}
                >
                  {REMINDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Application (optional)</label>
                <select
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                  {...register('application_id')}
                >
                  <option value="">None</option>
                  {applications.map(a => (
                    <option key={a.id} value={a.id}>{a.company_name} – {a.role}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Date & Time *</label>
              <input
                type="datetime-local"
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none ${errors.remind_at ? 'border-danger' : 'border-border'}`}
                {...register('remind_at', { required: true })}
              />
            </div>

            {/* Channels */}
            <div className="border border-border rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Notification Channels</p>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="rounded" {...register('send_email')} />
                <span className="text-sm text-text-main">📧 Send email reminder</span>
              </label>
              {user?.whatsapp_subscribed && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="rounded" {...register('send_whatsapp')} />
                  <span className="text-sm text-text-main">💬 Send WhatsApp reminder</span>
                </label>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2 text-sm border border-border rounded-lg hover:bg-background text-text-main">Cancel</button>
              <button type="submit" disabled={creating} className="flex-1 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-60">
                {creating ? 'Creating...' : 'Create Reminder'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Delete confirm */}
        <ConfirmDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Delete Reminder"
          description={`Delete "${deleteTarget?.title}"?`}
          confirmLabel="Delete"
          loading={deleteLoading}
        />
      </main>
    </div>
  );
};

export default Reminders;
