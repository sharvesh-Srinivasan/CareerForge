import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';

const outcomeConfig = {
  Cleared: { color: 'text-success', bg: 'bg-green-50', icon: CheckCircle, dot: 'bg-success' },
  Rejected: { color: 'text-danger', bg: 'bg-red-50', icon: XCircle, dot: 'bg-danger' },
  Pending: { color: 'text-warning', bg: 'bg-yellow-50', icon: Clock, dot: 'bg-warning' },
};

const difficultyColor = {
  Easy: 'text-success bg-green-50',
  Medium: 'text-warning bg-yellow-50',
  Hard: 'text-danger bg-red-50',
};

const RoundItem = ({ round, index, isLast }) => {
  const [expanded, setExpanded] = useState(false);
  const config = outcomeConfig[round.outcome] || outcomeConfig.Pending;
  const OutcomeIcon = config.icon;

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="relative">
      {/* Connector line */}
      {!isLast && (
        <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-border z-0" />
      )}

      <div className="relative flex gap-4">
        {/* Circle indicator */}
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10 mt-0.5 ${
          round.outcome === 'Cleared'
            ? 'bg-success border-success'
            : round.outcome === 'Rejected'
            ? 'bg-danger border-danger'
            : 'bg-white border-border'
        }`}>
          {round.outcome === 'Cleared' && <CheckCircle size={12} className="text-white" />}
          {round.outcome === 'Rejected' && <XCircle size={12} className="text-white" />}
          {round.outcome === 'Pending' && <div className="w-2 h-2 rounded-full bg-border" />}
        </div>

        {/* Content */}
        <div className={`flex-1 pb-5 ${isLast ? '' : ''}`}>
          <div
            className="bg-white border border-border rounded-xl overflow-hidden cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div>
                  <p className="text-sm font-medium text-text-main">{round.round_name}</p>
                  {round.round_date && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Calendar size={11} className="text-text-muted" />
                      <span className="text-xs text-text-muted">{formatDate(round.round_date)}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {round.difficulty && (
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${difficultyColor[round.difficulty] || ''}`}>
                    {round.difficulty}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                  <OutcomeIcon size={11} />
                  {round.outcome}
                </span>
                {expanded ? <ChevronUp size={14} className="text-text-muted" /> : <ChevronDown size={14} className="text-text-muted" />}
              </div>
            </div>

            {/* Expanded content */}
            {expanded && (
              <div className="px-4 pb-4 pt-0 border-t border-border bg-background space-y-3">
                {round.questions_asked && (
                  <div>
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">Questions Asked</p>
                    <p className="text-sm text-text-main whitespace-pre-wrap leading-relaxed">{round.questions_asked}</p>
                  </div>
                )}
                {round.topics_covered && (
                  <div>
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">Topics Covered</p>
                    <div className="flex flex-wrap gap-1.5">
                      {round.topics_covered.split(',').map((t, i) => (
                        <span key={i} className="px-2 py-0.5 bg-primary-pale text-primary text-xs rounded-full">
                          {t.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {round.personal_notes && (
                  <div>
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">Personal Notes</p>
                    <p className="text-sm text-text-muted whitespace-pre-wrap leading-relaxed">{round.personal_notes}</p>
                  </div>
                )}
                {!round.questions_asked && !round.topics_covered && !round.personal_notes && (
                  <p className="text-xs text-text-muted italic">No details recorded yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const InterviewTimeline = ({ rounds = [] }) => {
  if (rounds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-10 h-10 rounded-full bg-primary-pale flex items-center justify-center mb-3">
          <Clock size={18} className="text-primary" />
        </div>
        <p className="text-sm text-text-muted">No interview rounds recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {rounds.map((round, index) => (
        <RoundItem
          key={round.id}
          round={round}
          index={index}
          isLast={index === rounds.length - 1}
        />
      ))}
    </div>
  );
};

export default InterviewTimeline;
