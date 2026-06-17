import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft, Pencil, Trash2, ExternalLink, Calendar, MapPin,
  DollarSign, Link as LinkIcon, User, FileText, Plus, X, Save,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import StatusBadge from '../components/StatusBadge';
import InterviewTimeline from '../components/InterviewTimeline';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import {
  getApplication, updateApplication, deleteApplication,
  addRound, updateRound, deleteRound,
} from '../api';

const STATUSES = [
  'Applied', 'OA Scheduled', 'OA Cleared',
  'Technical Round 1', 'Technical Round 2', 'Technical Round 3',
  'HR Round', 'Offer Received', 'Accepted', 'Rejected', 'Declined',
];

const InfoRow = ({ icon: Icon, label, value, href }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <Icon size={15} className="text-text-muted mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-muted mb-0.5">{label}</p>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:text-primary-hover flex items-center gap-1">
            {value} <ExternalLink size={11} />
          </a>
        ) : (
          <p className="text-sm text-text-main">{value}</p>
        )}
      </div>
    </div>
  );
};

const ApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toasts, toast, removeToast } = useToast();

  const [app, setApp] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [addRoundOpen, setAddRoundOpen] = useState(false);
  const [savingRound, setSavingRound] = useState(false);
  const [savingApp, setSavingApp] = useState(false);

  const { register: registerApp, handleSubmit: handleAppSubmit, reset: resetApp } = useForm();
  const { register: registerRound, handleSubmit: handleRoundSubmit, reset: resetRound } = useForm();

  const fetchApp = async () => {
    try {
      const res = await getApplication(id);
      const data = res.data.data;
      setApp(data);
      setRounds(data.interview_rounds || []);
      resetApp({
        ...data,
        application_date: data.application_date?.split('T')[0] || '',
      });
    } catch (err) {
      toast.error('Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApp(); }, [id]);

  const handleSaveApp = async (data) => {
    setSavingApp(true);
    try {
      await updateApplication(id, data);
      toast.success('Application updated!');
      setEditMode(false);
      fetchApp();
    } catch (err) {
      toast.error('Failed to update application');
    } finally {
      setSavingApp(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteApplication(id);
      navigate('/applications');
    } catch (err) {
      toast.error('Failed to delete application');
      setDeleteLoading(false);
    }
  };

  const handleAddRound = async (data) => {
    setSavingRound(true);
    try {
      await addRound(id, data);
      toast.success('Interview round added!');
      setAddRoundOpen(false);
      resetRound({});
      fetchApp();
    } catch (err) {
      toast.error('Failed to add round');
    } finally {
      setSavingRound(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="ml-60 flex-1 p-8">
          <div className="skeleton h-8 w-48 rounded mb-6" />
          <div className="grid grid-cols-2 gap-5">
            <div className="skeleton h-64 rounded-xl" />
            <div className="skeleton h-64 rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="ml-60 flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <p className="text-text-muted">Application not found</p>
            <Link to="/applications" className="text-primary text-sm mt-2 block">← Back to applications</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <Toast toasts={toasts} removeToast={removeToast} />

      <main className="ml-60 flex-1 p-8 min-w-0">
        {/* Back */}
        <Link to="/applications" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-main mb-5 transition-colors">
          <ArrowLeft size={14} /> Back to Applications
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-text-main">{app.company_name}</h1>
              <StatusBadge status={app.status} size="md" />
            </div>
            <p className="text-text-muted">{app.role}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditMode(!editMode)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                editMode
                  ? 'border-primary text-primary bg-primary-pale'
                  : 'border-border text-text-muted hover:bg-background hover:text-text-main'
              }`}
            >
              <Pencil size={13} />
              {editMode ? 'Editing...' : 'Edit'}
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-border text-text-muted hover:bg-red-50 hover:text-danger hover:border-danger/20 transition-colors"
            >
              <Trash2 size={13} />
              Delete
            </button>
          </div>
        </div>

        {/* Two column layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Left: Application details */}
          <div className="space-y-5">
            <div className="bg-white border border-border rounded-xl p-6">
              <h2 className="text-sm font-semibold text-text-main mb-4">Application Details</h2>

              {editMode ? (
                <form onSubmit={handleAppSubmit(handleSaveApp)} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">Company</label>
                      <input className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        {...registerApp('company_name')} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">Role</label>
                      <input className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        {...registerApp('role')} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">Status</label>
                      <select className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                        {...registerApp('status')}>
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">Location</label>
                      <input className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        {...registerApp('location')} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">Package</label>
                      <input className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        {...registerApp('package')} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">Date</label>
                      <input type="date" className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        {...registerApp('application_date')} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-text-muted mb-1">Notes</label>
                      <textarea rows={3} className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                        {...registerApp('notes')} />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setEditMode(false)} className="flex-1 py-2 text-sm border border-border rounded-lg hover:bg-background text-text-main">Cancel</button>
                    <button type="submit" disabled={savingApp} className="flex-1 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-60 flex items-center justify-center gap-1.5">
                      <Save size={13} /> {savingApp ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <InfoRow icon={Calendar} label="Application Date" value={new Date(app.application_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />
                  <InfoRow icon={MapPin} label="Location" value={app.location} />
                  <InfoRow icon={DollarSign} label="Package" value={app.package} />
                  <InfoRow icon={LinkIcon} label="Application Link" value={app.application_link ? 'View Application' : null} href={app.application_link} />
                  {app.referral_name && <InfoRow icon={User} label="Referred By" value={app.referral_name} />}
                  {app.referral_linkedin && <InfoRow icon={LinkIcon} label="Referral LinkedIn" value="View Profile" href={app.referral_linkedin} />}
                  {app.resume_name && (
                    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
                      <FileText size={15} className="text-text-muted mt-0.5" />
                      <div>
                        <p className="text-xs text-text-muted mb-0.5">Resume Used</p>
                        <a href={app.resume_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:text-primary-hover flex items-center gap-1">
                          {app.resume_name} ({app.resume_version}) <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>
                  )}
                  {app.notes && (
                    <div className="pt-3">
                      <p className="text-xs font-medium text-text-muted mb-1.5">Notes</p>
                      <p className="text-sm text-text-main whitespace-pre-wrap leading-relaxed bg-background rounded-lg px-4 py-3">{app.notes}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right: Interview Timeline */}
          <div className="space-y-5">
            <div className="bg-white border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-text-main">Interview Timeline</h2>
                <button
                  onClick={() => { setAddRoundOpen(true); resetRound({}); }}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-hover bg-primary-pale px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus size={13} />
                  Add Round
                </button>
              </div>
              <InterviewTimeline rounds={rounds} />
            </div>
          </div>
        </div>

        {/* Delete confirm */}
        <ConfirmDialog
          isOpen={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleDelete}
          title="Delete Application"
          description={`Delete the application to ${app.company_name}? All interview rounds will also be deleted.`}
          confirmLabel="Delete"
          loading={deleteLoading}
        />

        {/* Add Round Modal */}
        <Modal isOpen={addRoundOpen} onClose={() => setAddRoundOpen(false)} title="Add Interview Round" size="md">
          <form onSubmit={handleRoundSubmit(handleAddRound)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-text-muted mb-1">Round Name *</label>
                <input className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="e.g. Technical Round 1" {...registerRound('round_name', { required: true })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Date</label>
                <input type="date" className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  {...registerRound('round_date')} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Difficulty</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                  {...registerRound('difficulty')}>
                  <option value="">Select...</option>
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-text-muted mb-1">Outcome</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                  {...registerRound('outcome')}>
                  <option value="Pending">Pending</option>
                  <option value="Cleared">Cleared</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-text-muted mb-1">Questions Asked</label>
                <textarea rows={2} className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  placeholder="Describe the questions..." {...registerRound('questions_asked')} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-text-muted mb-1">Topics Covered</label>
                <input className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="e.g. Arrays, DP, System Design" {...registerRound('topics_covered')} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-text-muted mb-1">Personal Notes</label>
                <textarea rows={2} className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  placeholder="What went well, what to improve..." {...registerRound('personal_notes')} />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setAddRoundOpen(false)} className="flex-1 py-2 text-sm border border-border rounded-lg hover:bg-background text-text-main">Cancel</button>
              <button type="submit" disabled={savingRound} className="flex-1 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-60">
                {savingRound ? 'Adding...' : 'Add Round'}
              </button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
};

export default ApplicationDetail;
