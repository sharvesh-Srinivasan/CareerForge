import React, { useEffect, useState } from 'react';
import { TrendingUp, Briefcase, Award, Clock } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { MonthlyBarChart, StatusPieChart } from '../components/AnalyticsChart';
import ApplicationFunnel from '../components/ApplicationFunnel';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { getApplicationStats, getResumes } from '../api';

const MetricCard = ({ label, value, sub, icon: Icon, iconBg, iconColor }) => (
  <div className="bg-white border border-border rounded-xl p-5">
    <div className="flex items-center justify-between mb-3">
      <p className="text-xs font-medium text-text-muted uppercase tracking-wide">{label}</p>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon size={16} className={iconColor} />
      </div>
    </div>
    <p className="text-2xl font-bold text-text-main">{value}</p>
    {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
  </div>
);

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, resumesRes] = await Promise.all([
          getApplicationStats(),
          getResumes(),
        ]);
        setStats(statsRes.data.data);
        setResumes(resumesRes.data.data || []);
      } catch (err) {
        console.error('Analytics load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const counts = stats?.counts || {};
  const total = parseInt(counts.total) || 0;
  const offers = parseInt(counts.offers) || 0;
  const interviews = parseInt(counts.interviews) || 0;

  const interviewRate = total > 0 ? `${Math.round((interviews / total) * 100)}%` : '—';
  const offerRate = interviews > 0 ? `${Math.round((offers / interviews) * 100)}%` : '—';

  // Find most common rejection stage from statusBreakdown
  const rejectionStages = (stats?.statusBreakdown || []).filter((s) =>
    ['Technical Round 1', 'Technical Round 2', 'HR Round', 'OA Scheduled'].includes(s.status)
  );

  const sortedResumes = [...resumes].sort((a, b) => parseFloat(b.success_rate) - parseFloat(a.success_rate));

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="ml-60 flex-1 p-8 min-w-0">
        {/* Header */}
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-text-main">Analytics</h1>
          <p className="text-sm text-text-muted mt-1">Insights into your placement performance</p>
        </div>

        {loading ? (
          <>
            <LoadingSkeleton type="stat" count={4} />
            <div className="mt-5 grid grid-cols-2 gap-5">
              <div className="skeleton h-64 rounded-xl" />
              <div className="skeleton h-64 rounded-xl" />
            </div>
          </>
        ) : (
          <>
            {/* Row 1: Metrics */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              <MetricCard
                label="Total Applications"
                value={total.toLocaleString('en-IN')}
                icon={Briefcase}
                iconBg="bg-primary-pale"
                iconColor="text-primary"
              />
              <MetricCard
                label="Interview Conversion"
                value={interviewRate}
                sub={`${interviews} of ${total} reached interviews`}
                icon={TrendingUp}
                iconBg="bg-purple-50"
                iconColor="text-purple-600"
              />
              <MetricCard
                label="Offer Conversion"
                value={offerRate}
                sub={`${offers} offers from ${interviews} interviews`}
                icon={Award}
                iconBg="bg-green-50"
                iconColor="text-success"
              />
              <MetricCard
                label="Active Applications"
                value={(total - (parseInt(counts.rejected) || 0)).toLocaleString('en-IN')}
                sub="Excluding rejections"
                icon={Clock}
                iconBg="bg-yellow-50"
                iconColor="text-warning"
              />
            </div>

            {/* Row 2: Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
              <div className="bg-white border border-border rounded-xl p-6">
                <h2 className="text-sm font-semibold text-text-main mb-5">Applications Per Month</h2>
                <MonthlyBarChart data={stats?.monthly || []} />
              </div>
              <div className="bg-white border border-border rounded-xl p-6">
                <h2 className="text-sm font-semibold text-text-main mb-5">Status Breakdown</h2>
                <StatusPieChart data={stats?.statusBreakdown || []} />
              </div>
            </div>

            {/* Row 3: Funnel + Resume performance */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
              <div className="bg-white border border-border rounded-xl p-6">
                <h2 className="text-sm font-semibold text-text-main mb-5">Application Funnel</h2>
                <ApplicationFunnel data={stats?.funnel || []} />
              </div>

              <div className="bg-white border border-border rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                  <h2 className="text-sm font-semibold text-text-main">Resume Performance</h2>
                </div>
                {resumes.length === 0 ? (
                  <div className="py-12 text-center text-text-muted text-sm">Upload resumes to see performance data</div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-background">
                        <th className="text-left px-5 py-3 text-xs font-medium text-text-muted">Resume</th>
                        <th className="text-right px-5 py-3 text-xs font-medium text-text-muted">Apps</th>
                        <th className="text-right px-5 py-3 text-xs font-medium text-text-muted">Interviews</th>
                        <th className="text-right px-5 py-3 text-xs font-medium text-text-muted">Success</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {sortedResumes.map((r) => {
                        const rate = parseFloat(r.success_rate) || 0;
                        return (
                          <tr key={r.id} className="hover:bg-background">
                            <td className="px-5 py-3">
                              <p className="text-sm font-medium text-text-main">{r.name}</p>
                              <p className="text-xs text-text-muted">{r.version}</p>
                            </td>
                            <td className="px-5 py-3 text-right text-sm text-text-muted">{r.application_count}</td>
                            <td className="px-5 py-3 text-right text-sm text-text-muted">{r.interview_count}</td>
                            <td className="px-5 py-3 text-right">
                              <span className={`text-sm font-semibold ${rate > 30 ? 'text-success' : rate >= 15 ? 'text-warning' : 'text-danger'}`}>
                                {rate.toFixed(0)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Row 4: Rejection stages */}
            {rejectionStages.length > 0 && (
              <div className="bg-white border border-border rounded-xl p-6">
                <h2 className="text-sm font-semibold text-text-main mb-5">Where Applications Stall</h2>
                <div className="space-y-3">
                  {rejectionStages.map((stage) => {
                    const pct = total > 0 ? Math.round((stage.count / total) * 100) : 0;
                    return (
                      <div key={stage.status}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-text-muted">{stage.status}</span>
                          <span className="text-sm font-medium text-text-main">{stage.count} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-background rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Analytics;
