import React, { useEffect, useState, useRef } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ResumeCard from '../components/ResumeCard';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { getResumes, uploadResume, deleteResume } from '../api';

const ResumeManager = () => {
  const { toasts, toast, removeToast } = useToast();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [resumeName, setResumeName] = useState('');
  const [resumeVersion, setResumeVersion] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const fetchResumes = async () => {
    try {
      const res = await getResumes();
      setResumes(res.data.data || []);
    } catch {
      toast.error('Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResumes(); }, []);

  const handleFileSelect = (file) => {
    if (!file) return;
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|docx)$/i)) {
      toast.error('Only PDF and DOCX files are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB');
      return;
    }
    setSelectedFile(file);
    if (!resumeName) setResumeName(file.name.replace(/\.[^/.]+$/, ''));
    if (!resumeVersion) setResumeVersion('v1.0');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !resumeName || !resumeVersion) {
      toast.error('Please fill in all fields');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', selectedFile);
      formData.append('name', resumeName);
      formData.append('version', resumeVersion);
      await uploadResume(formData);
      toast.success('Resume uploaded successfully!');
      setSelectedFile(null);
      setResumeName('');
      setResumeVersion('');
      fetchResumes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteResume(deleteTarget.id);
      toast.success('Resume deleted');
      setDeleteTarget(null);
      fetchResumes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete resume');
    } finally {
      setDeleteLoading(false);
    }
  };

  const sortedResumes = [...resumes].sort((a, b) => parseFloat(b.success_rate) - parseFloat(a.success_rate));

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <Toast toasts={toasts} removeToast={removeToast} />

      <main className="ml-60 flex-1 p-8 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-2xl font-bold text-text-main">Resume Manager</h1>
            <p className="text-sm text-text-muted mt-1">Upload and track performance of your resume versions</p>
          </div>
        </div>

        {/* Upload Area */}
        <div className="bg-white border border-border rounded-xl p-6 mb-7">
          <h2 className="text-sm font-semibold text-text-main mb-4">Upload New Resume</h2>

          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragOver
                ? 'border-primary bg-primary-pale'
                : selectedFile
                ? 'border-success bg-green-50'
                : 'border-border hover:border-primary/40 hover:bg-background'
            }`}
            onClick={() => !selectedFile && fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files[0])}
            />

            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <FileText size={18} className="text-success" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-text-main">{selectedFile.name}</p>
                  <p className="text-xs text-text-muted">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setResumeName(''); setResumeVersion(''); }}
                  className="ml-2 text-text-muted hover:text-danger p-1 rounded"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-primary-pale rounded-xl flex items-center justify-center mx-auto mb-3">
                  <UploadCloud size={22} className="text-primary" />
                </div>
                <p className="text-sm font-medium text-text-main mb-1">Drag and drop or click to upload</p>
                <p className="text-xs text-text-muted">PDF or DOCX · Max 5MB</p>
              </>
            )}
          </div>

          {/* Name & Version inputs */}
          {selectedFile && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Resume Name *</label>
                <input
                  type="text"
                  value={resumeName}
                  onChange={(e) => setResumeName(e.target.value)}
                  placeholder="Software Engineer Resume"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Version *</label>
                <input
                  type="text"
                  value={resumeVersion}
                  onChange={(e) => setResumeVersion(e.target.value)}
                  placeholder="v1.0"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div className="col-span-2">
                <button
                  onClick={handleUpload}
                  disabled={uploading || !resumeName || !resumeVersion}
                  className="flex items-center gap-2 bg-primary text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-60"
                >
                  {uploading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading...</>
                  ) : (
                    <><UploadCloud size={14} /> Upload Resume</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Resumes grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="skeleton h-52 rounded-xl" />)}
          </div>
        ) : resumes.length === 0 ? (
          <div className="bg-white border border-border rounded-xl">
            <EmptyState
              icon="file"
              title="No resumes uploaded"
              description="Upload your first resume to track its performance across applications."
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-7">
              {resumes.map((resume) => (
                <ResumeCard
                  key={resume.id}
                  resume={resume}
                  onDelete={(r) => setDeleteTarget(r)}
                  onView={(url) => window.open(url, '_blank')}
                />
              ))}
            </div>

            {/* Performance table */}
            <div className="bg-white border border-border rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-text-main">Performance Comparison</h2>
                <p className="text-xs text-text-muted mt-0.5">Sorted by success rate</p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-background">
                    <th className="text-left px-5 py-3 text-xs font-medium text-text-muted">Resume</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-text-muted">Applications</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-text-muted">Interviews</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-text-muted">Success Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sortedResumes.map((r) => {
                    const rate = parseFloat(r.success_rate) || 0;
                    return (
                      <tr key={r.id} className="hover:bg-background">
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-medium text-text-main">{r.name}</p>
                          <p className="text-xs text-text-muted">{r.version}</p>
                        </td>
                        <td className="px-5 py-3.5 text-right text-sm text-text-muted">{r.application_count}</td>
                        <td className="px-5 py-3.5 text-right text-sm text-text-muted">{r.interview_count}</td>
                        <td className="px-5 py-3.5 text-right">
                          <span className={`text-sm font-semibold ${rate > 30 ? 'text-success' : rate >= 15 ? 'text-warning' : 'text-danger'}`}>
                            {rate.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Delete confirm */}
        <ConfirmDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Delete Resume"
          description={`Delete "${deleteTarget?.name} (${deleteTarget?.version})"? This cannot be undone. If this resume is linked to applications, deletion will be blocked.`}
          confirmLabel="Delete"
          loading={deleteLoading}
        />
      </main>
    </div>
  );
};

export default ResumeManager;
