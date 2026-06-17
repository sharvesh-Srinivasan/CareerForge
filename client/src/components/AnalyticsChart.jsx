import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const STATUS_COLORS = {
  'Applied': '#3B82F6',
  'OA Scheduled': '#F59E0B',
  'OA Cleared': '#10B981',
  'Technical Round 1': '#8B5CF6',
  'Technical Round 2': '#7C3AED',
  'Technical Round 3': '#6D28D9',
  'HR Round': '#6366F1',
  'Offer Received': '#059669',
  'Accepted': '#16A34A',
  'Rejected': '#DC2626',
  'Declined': '#94A3B8',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-border rounded-lg px-3 py-2 shadow-md">
        <p className="text-xs text-text-muted mb-1">{label}</p>
        <p className="text-sm font-semibold text-text-main">{payload[0].value} applications</p>
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-border rounded-lg px-3 py-2 shadow-md">
        <p className="text-xs font-medium text-text-main">{payload[0].name}</p>
        <p className="text-sm font-semibold text-text-main">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export const MonthlyBarChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-text-muted text-sm">
        No data for selected period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: '#64748B' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#64748B' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#EFF6FF' }} />
        <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const StatusPieChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-text-muted text-sm">
        No data available
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: d.status,
    value: parseInt(d.count),
    color: STATUS_COLORS[d.status] || '#94A3B8',
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<PieTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span style={{ fontSize: '11px', color: '#64748B' }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

const AnalyticsChart = { MonthlyBarChart, StatusPieChart };
export default AnalyticsChart;
