import React from 'react';
import { FileText, ExternalLink, Trash2, TrendingUp } from 'lucide-react';

const ResumeCard = ({ resume, onDelete, onView }) => {
  const successRate = parseFloat(resume.success_rate) || 0;

  const getRateColor = (rate) => {
    if (rate > 30) return 'text-success';
    if (rate >= 15) return 'text-warning';
    return 'text-danger';
  };

  const getRateBg = (rate) => {
    if (rate > 30) return 'bg-green-50';
    if (rate >= 15) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-sm transition-all group">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary-pale flex items-center justify-center flex-shrink-0">
          <FileText size={18} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-text-main truncate">{resume.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-block px-2 py-0.5 bg-primary-pale text-primary text-xs font-medium rounded-full">
              {resume.version}
            </span>
            {resume.created_at && (
              <span className="text-xs text-text-muted">{formatDate(resume.created_at)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-background rounded-lg">
          <p className="text-lg font-bold text-text-main">{resume.application_count || 0}</p>
          <p className="text-xs text-text-muted">Applications</p>
        </div>
        <div className="text-center p-2 bg-background rounded-lg">
          <p className="text-lg font-bold text-text-main">{resume.interview_count || 0}</p>
          <p className="text-xs text-text-muted">Interviews</p>
        </div>
        <div className={`text-center p-2 rounded-lg ${getRateBg(successRate)}`}>
          <p className={`text-lg font-bold ${getRateColor(successRate)}`}>
            {successRate.toFixed(0)}%
          </p>
          <p className={`text-xs ${getRateColor(successRate)}`}>Success</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onView(resume.cloudinary_url)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-background border border-border rounded-lg text-xs font-medium text-text-main hover:bg-primary-pale hover:text-primary hover:border-primary/20 transition-colors"
        >
          <ExternalLink size={12} />
          View PDF
        </button>
        <button
          onClick={() => onDelete(resume)}
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-background border border-border rounded-lg text-xs font-medium text-text-muted hover:bg-red-50 hover:text-danger hover:border-danger/20 transition-colors"
          title="Delete resume"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
};

export default ResumeCard;
