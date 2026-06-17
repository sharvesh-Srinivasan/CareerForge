import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Plus, Search, Eye, Pencil, Trash2, X, ChevronDown, ExternalLink,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import StatusBadge from '../components/StatusBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import {
  getApplications, createApplication, updateApplication,
  deleteApplication, getResumes,
} from '../api';

const STATUSES = [
  'Applied', 'OA Scheduled', 'OA Cleared',
  'Technical Round 1', 'Technical Round 2', 'Technical Round 3',
  'HR Round', 'Offer Received', 'Accepted', 'Rejected', 'Declined',
];

const SlideOver = ({ isOpen, onClose, onSuccess, editApp, resumes }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editApp) {
      reset({
        ...editApp,
        application_date: editApp.application_date?.split('T')[0] || '',
        deadline: editApp.deadline?.split('T')[0] || '',
      });
    } else {
      reset({ application_date: new Date().toISOString().split('T')[0], deadline: '' });
    }
  }, [editApp, reset]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (editApp) {
        await updateApplication(editApp.id, data);
      } else {
        await createApplication(data);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-screen w-[480px] bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-text-main">
            {editApp ? 'Edit Application' : 'Add Application'}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-main p-1">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-text-muted mb-1">Company Name *</label>
              <input className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none ${errors.company_name ? 'border-danger' : 'border-border'}`}
                placeholder="Google" {...register('company_name', { required: true })} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-text-muted mb-1">Role *</label>
              <input className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none ${errors.role ? 'border-danger' : 'border-border'}`}
                placeholder="Software Engineer Intern" {...register('role', { required: true })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Location</label>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                placeholder="Bangalore" {...register('location')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Package</label>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                placeholder="12 LPA" {...register('package')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Application Date *</label>
              <input type="date" className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none ${errors.application_date ? 'border-danger' : 'border-border'}`}
                {...register('application_date', { required: true })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Deadline</label>
              <input type="date" className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                {...register('deadline')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Status</label>
              <select className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                {...register('status')}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-text-muted mb-1">Application Link</label>
              <input type="url" className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                placeholder="https://..." {...register('application_link')} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-text-muted mb-1">Resume Version</label>
              <select className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                {...register('resume_version_id')}>
                <option value="">None</option>
                {resumes.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.version})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Referral Name</label>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                placeholder="John Doe" {...register('referral_name')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Referral LinkedIn</label>
              <input type="url" className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                placeholder="https://linkedin.com/in/..." {...register('referral_linkedin')} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-text-muted mb-1">Notes</label>
              <textarea rows={3} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                placeholder="Any notes about this application..."
                {...register('notes')} />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-border">
          <button type="button" onClick={onClose} className="flex-1 py-2 text-sm font-medium border border-border rounded-lg hover:bg-background transition-colors text-text-main">
            Cancel
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={loading}
            className="flex-1 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-60"
          >
            {loading ? 'Saving...' : editApp ? 'Update' : 'Add Application'}
          </button>
        </div>
      </div>
    </>
  );
};

const Applications = () => {
  const { toasts, toast, removeToast } = useToast();
  const [applications, setApplications] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('created_at');
  const [slideOpen, setSlideOpen] = useState(false);
  const [editApp, setEditApp] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const location = useLocation();

  // Auto-open Add panel if ?add=true in URL (used by CareerForge Clipper extension)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('add') === 'true') {
      setEditApp(null);
      setSlideOpen(true);
    }
  }, [location.search]);

  const fetchApplications = useCallback(async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      params.sort = sort;
      const res = await getApplications(params);
      setApplications(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load applications');
    }
  }, [statusFilter, search, sort]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [appsRes, resumesRes] = await Promise.all([
          getApplications({ sort }),
          getResumes(),
        ]);
        setApplications(appsRes.data.data || []);
        setResumes(resumesRes.data.data || []);
      } catch (err) {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!loading) fetchApplications();
  }, [statusFilter, search, sort]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteApplication(deleteTarget.id);
      toast.success('Application deleted');
      setDeleteTarget(null);
      fetchApplications();
    } catch (err) {
      toast.error('Failed to delete application');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEdit = (app) => {
    setEditApp(app);
    setSlideOpen(true);
  };

  const openAdd = () => {
    setEditApp(null);
    setSlideOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <Toast toasts={toasts} removeToast={removeToast} />
      <main className="ml-60 flex-1 p-8 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-2xl font-bold text-text-main">Applications</h1>
            <p className="text-sm text-text-muted mt-1">{applications.length} total applications</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            <Plus size={15} />
            Add Application
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search company or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white text-text-main"
          >
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white text-text-main"
          >
            <option value="created_at">Sort: Newest</option>
            <option value="company_name">Sort: Company</option>
            <option value="status">Sort: Status</option>
            <option value="application_date">Sort: App Date</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <LoadingSkeleton type="table" count={5} />
        ) : applications.length === 0 ? (
          <div className="bg-white border border-border rounded-xl">
            <EmptyState
              icon="briefcase"
              title="No applications yet"
              description={search || statusFilter ? 'No applications match your filters.' : 'Start by adding your first job or internship application.'}
              actionLabel={!search && !statusFilter ? 'Add Application' : undefined}
              onAction={!search && !statusFilter ? openAdd : undefined}
            />
          </div>
        ) : (
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-background">
                    <th className="text-left px-5 py-3 text-xs font-medium text-text-muted">Company</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-text-muted">Role</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-text-muted">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-text-muted">Package</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-text-muted">Date</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-text-muted">Deadline</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-text-muted">Resume</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-background/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-semibold text-text-main">{app.company_name}</p>
                        {app.location && <p className="text-xs text-text-muted">{app.location}</p>}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm text-text-muted max-w-48 truncate">{app.role}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm text-text-muted">{app.package || '—'}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-xs text-text-muted">
                          {new Date(app.application_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-xs text-text-muted font-medium">
                          {app.deadline ? new Date(app.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        {app.resume_name ? (
                          <span className="text-xs text-text-muted">{app.resume_name}</span>
                        ) : (
                          <span className="text-xs text-border">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <Link
                            to={`/applications/${app.id}`}
                            className="p-1.5 rounded-lg text-text-muted hover:bg-primary-pale hover:text-primary transition-colors"
                            title="View"
                          >
                            <Eye size={14} />
                          </Link>
                          <button
                            onClick={() => openEdit(app)}
                            className="p-1.5 rounded-lg text-text-muted hover:bg-background hover:text-text-main transition-colors"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(app)}
                            className="p-1.5 rounded-lg text-text-muted hover:bg-red-50 hover:text-danger transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Slide-over */}
        <SlideOver
          isOpen={slideOpen}
          onClose={() => setSlideOpen(false)}
          onSuccess={() => { fetchApplications(); toast.success(editApp ? 'Application updated!' : 'Application added!'); }}
          editApp={editApp}
          resumes={resumes}
        />

        {/* Confirm delete */}
        <ConfirmDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Delete Application"
          description={`Are you sure you want to delete the application to ${deleteTarget?.company_name}? This will also remove all interview rounds.`}
          confirmLabel="Delete"
          loading={deleteLoading}
        />
      </main>
    </div>
  );
};

export default Applications;
