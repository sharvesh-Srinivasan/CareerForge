import React from 'react';
import { TrendingDown } from 'lucide-react';

const STAGE_COLORS = [
  'bg-blue-500',
  'bg-blue-600',
  'bg-blue-700',
  'bg-blue-800',
  'bg-blue-900',
];

const ApplicationFunnel = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-text-muted text-sm">
        <TrendingDown size={16} className="mr-2" /> No funnel data yet
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-2">
      {data.map((stage, index) => {
        const widthPct = maxCount > 0 ? Math.round((stage.count / maxCount) * 100) : 0;
        const prevCount = index > 0 ? data[index - 1].count : stage.count;
        const conversionRate =
          index > 0 && prevCount > 0
            ? Math.round((stage.count / prevCount) * 100)
            : 100;

        return (
          <div key={stage.stage} className="group">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-text-muted">{stage.stage}</span>
              <div className="flex items-center gap-3">
                {index > 0 && (
                  <span className="text-xs text-text-muted">
                    {conversionRate}% conversion
                  </span>
                )}
                <span className="text-sm font-semibold text-text-main">{stage.count}</span>
              </div>
            </div>
            <div className="h-7 bg-background rounded-lg overflow-hidden">
              <div
                className={`h-full ${STAGE_COLORS[index] || STAGE_COLORS[4]} rounded-lg transition-all duration-500 flex items-center justify-end pr-3`}
                style={{ width: `${Math.max(widthPct, stage.count > 0 ? 8 : 0)}%` }}
              >
                {widthPct > 15 && (
                  <span className="text-xs text-white font-medium">{stage.count}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ApplicationFunnel;
