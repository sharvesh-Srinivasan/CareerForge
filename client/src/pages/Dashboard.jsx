import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase, Clock, Calendar, Trophy, XCircle,
  ArrowRight, Activity,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import StatusBadge from '../components/StatusBadge';
import ApplicationFunnel from '../components/ApplicationFunnel';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { getApplicationStats, getApplications, getReminders, getActivityLog } from '../api';

const StatCard = ({ label, value, icon: Icon, iconBg, iconColor, loading }) => (
  <div className="bg-white border border-border rounded-xl p-5 relative overflow-hidden">
    {loading ? (
      <div className="space-y-2">
        <div className="skeleton h-4 w-24 rounded" />
        <div className="skeleton h-8 w-16 rounded" />
      </div>
    ) : (
      <>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">{label}</p>
            <p className="text-2xl font-bold text-text-main">{value?.toLocaleString('en-IN') ?? '—'}</p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
            <Icon size={18} className={iconColor} />
          </div>
        </div>
      </>
    )}
  </div>
);

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentApps, setRecentApps] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, appsRes, remindersRes, activityRes] = await Promise.all([
          getApplicationStats(),
          getApplications({ sort: 'created_at', order: 'DESC' }),
          getReminders(),
          getActivityLog(),
        ]);
        setStats(statsRes.data.data);
        setRecentApps((appsRes.data.data || []).slice(0, 5));
        setReminders((remindersRes.data.data || []).filter((r) => !r.sent).slice(0, 3));
        setActivity((activityRes.data.data || []).slice(0, 8));
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const statCards = [
    { label: 'Total Applications', value: stats?.counts?.total, icon: Briefcase, iconBg: 'bg-primary-pale', iconColor: 'text-primary' },
    { label: 'OA Pending', value: stats?.counts?.oa_pending, icon: Clock, iconBg: 'bg-yellow-50', iconColor: 'text-warning' },
    { label: 'In Interviews', value: stats?.counts?.interviews, icon: Calendar, iconBg: 'bg-purple-50', iconColor: 'text-purple-600' },
    { label: 'Offers Received', value: stats?.counts?.offers, icon: Trophy, iconBg: 'bg-green-50', iconColor: 'text-success' },
    { label: 'Rejected', value: stats?.counts?.rejected, icon: XCircle, iconBg: 'bg-red-50', iconColor: 'text-danger' },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="ml-60 flex-1 p-8 min-w-0">
        {/* Header */}
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-text-main">Dashboard</h1>
          <p className="text-sm text-text-muted mt-1">Overview of your placement journey</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 mb-7">
          {statCards.map((card) => (
            <StatCard key={card.label} {...card} loading={loading} />
          ))}
        </div>

        {/* Middle row */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 mb-5">
          {/* Recent Applications */}
          <div className="xl:col-span-3 bg-white border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-text-main">Recent Applications</h2>
              <Link to="/applications" className="text-xs text-primary hover:text-primary-hover flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            {loading ? (
              <div className="p-4 space-y-3">
                {[1,2,3].map(i => <div key={i} className="skeleton h-12 rounded-lg" />)}
              </div>
            ) : recentApps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-text-muted">
                <Briefcase size={24} className="mb-2 text-border" />
                <p className="text-sm">No applications yet</p>
                <Link to="/applications" className="mt-2 text-xs text-primary">Add your first →</Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-6 py-3 text-xs font-medium text-text-muted">Company</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-text-muted">Role</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-text-muted">Status</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-text-muted">Date</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentApps.map((app) => (
                      <tr key={app.id} className="hover:bg-background transition-colors">
                        <td className="px-6 py-3.5">
                          <p className="text-sm font-medium text-text-main">{app.company_name}</p>
                        </td>
                        <td className="px-6 py-3.5">
                          <p className="text-sm text-text-muted truncate max-w-36">{app.role}</p>
                        </td>
                        <td className="px-6 py-3.5">
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="px-6 py-3.5">
                          <p className="text-xs text-text-muted">
                            {new Date(app.application_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </p>
                        </td>
                        <td className="px-6 py-3.5">
                          <Link to={`/applications/${app.id}`} className="text-xs text-primary hover:text-primary-hover">
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Application Funnel */}
          <div className="xl:col-span-2 bg-white border border-border rounded-xl">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-text-main">Application Funnel</h2>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-8 rounded-lg" />)}
                </div>
              ) : (
                <ApplicationFunnel data={stats?.funnel || []} />
              )}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Upcoming Reminders */}
          <div className="bg-white border border-border rounded-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-text-main">Upcoming Reminders</h2>
              <Link to="/reminders" className="text-xs text-primary hover:text-primary-hover flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="p-4 space-y-2">
              {loading ? (
                [1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)
              ) : reminders.length === 0 ? (
                <div className="py-8 text-center text-text-muted text-sm">No upcoming reminders</div>
              ) : (
                reminders.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 p-3 hover:bg-background rounded-xl transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-primary-pale flex items-center justify-center flex-shrink-0">
                      <Clock size={14} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-main truncate">{r.title}</p>
                      <p className="text-xs text-text-muted">
                        {new Date(r.remind_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white border border-border rounded-xl">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
              <Activity size={14} className="text-text-muted" />
              <h2 className="text-sm font-semibold text-text-main">Recent Activity</h2>
            </div>
            <div className="p-4 space-y-3">
              {loading ? (
                [1,2,3,4].map(i => <div key={i} className="skeleton h-8 rounded" />)
              ) : activity.length === 0 ? (
                <div className="py-8 text-center text-text-muted text-sm">No activity yet</div>
              ) : (
                activity.map((log) => (
                  <div key={log.id} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-main leading-snug">{log.action}</p>
                      <p className="text-xs text-text-muted mt-0.5">{timeAgo(log.created_at)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
