import React, { useMemo, useState } from 'react';
import { Report } from '../../types';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingUp,
  Calendar,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Clock,
  Zap,
  Eye,
  FileText,
} from 'lucide-react';

interface EnhancedReportsViewProps {
  reports: Report[];
  onReportClick: (report: Report) => void;
  formatCurrency: (value: number) => string;
}

const EnhancedReportsView: React.FC<EnhancedReportsViewProps> = ({
  reports,
  onReportClick,
  formatCurrency,
}) => {
  const [viewMode, setViewMode] = useState<'charts' | 'grid'>('charts');

  // Calculate statistics
  const stats = useMemo(() => {
    const total = reports.length;
    const completed = reports.filter(r => r.status === 'completed').length;
    const draft = reports.filter(r => r.status === 'draft').length;
    const sent = reports.filter(r => r.status === 'sent').length;
    const totalRevenue = reports.reduce((sum, r) => sum + (r.estimatedCost || 0), 0);
    const avgRevenue = total > 0 ? totalRevenue / total : 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Group by status for pie chart
    const statusData = [
      { name: 'Completed', value: completed, color: '#10b981' },
      { name: 'Draft', value: draft, color: '#f59e0b' },
      { name: 'Sent', value: sent, color: '#3b82f6' },
    ].filter(s => s.value > 0);

    // Timeline data (last 7 days)
    const timelineData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const count = reports.filter(r => {
        const reportDate = new Date(r.createdAt || 0);
        return reportDate.toLocaleDateString() === date.toLocaleDateString();
      }).length;
      return { date: dateStr, count };
    });

    // Revenue trend
    const revenueTrend = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const revenue = reports
        .filter(r => {
          const reportDate = new Date(r.createdAt || 0);
          return reportDate.toLocaleDateString() === date.toLocaleDateString();
        })
        .reduce((sum, r) => sum + (r.estimatedCost || 0), 0);
      return { date: dateStr, revenue };
    });

    return {
      total,
      completed,
      draft,
      sent,
      totalRevenue,
      avgRevenue,
      completionRate,
      statusData,
      timelineData,
      revenueTrend,
    };
  }, [reports]);

  const StatCard = ({
    icon: Icon,
    label,
    value,
    subValue,
    trend,
    color,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string | number;
    subValue?: string;
    trend?: number;
    color: string;
  }) => (
    <div className='bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow'>
      <div className='flex items-start justify-between'>
        <div className='flex-1'>
          <p className='text-sm font-medium text-slate-600 mb-1'>{label}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          {subValue && <p className='text-xs text-slate-500 mt-2'>{subValue}</p>}
        </div>
        <Icon className={`w-8 h-8 ${color} opacity-20`} />
      </div>
      {trend !== undefined && (
        <div className='flex items-center gap-1 mt-4'>
          <TrendingUp className='w-4 h-4 text-green-600' />
          <span className='text-xs font-medium text-green-600'>{trend}% vs last week</span>
        </div>
      )}
    </div>
  );

  const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className='bg-white rounded-xl border border-slate-200 p-6 shadow-sm'>
      <h3 className='text-lg font-semibold text-slate-900 mb-4'>{title}</h3>
      {children}
    </div>
  );

  return (
    <div className='space-y-6'>
      {/* View Toggle */}
      <div className='flex items-center justify-between'>
        <h2 className='text-2xl font-bold text-slate-900'>Reports Dashboard</h2>
        <div className='flex items-center gap-2 bg-slate-100 rounded-lg p-1'>
          <button
            onClick={() => setViewMode('charts')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'charts'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'grid'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {viewMode === 'charts' ? (
        <>
          {/* Key Metrics */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
            <StatCard
              icon={FileText}
              label='Total Reports'
              value={stats.total}
              trend={12}
              color='text-blue-600'
            />
            <StatCard
              icon={CheckCircle}
              label='Completion Rate'
              value={`${stats.completionRate}%`}
              subValue={`${stats.completed} of ${stats.total} completed`}
              trend={8}
              color='text-green-600'
            />
            <StatCard
              icon={DollarSign}
              label='Total Revenue'
              value={formatCurrency(stats.totalRevenue)}
              subValue={`Avg: ${formatCurrency(stats.avgRevenue)}`}
              trend={15}
              color='text-emerald-600'
            />
            <StatCard
              icon={Clock}
              label='In Progress'
              value={stats.draft}
              subValue={`${stats.sent} sent`}
              color='text-orange-600'
            />
          </div>

          {/* Charts Grid */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Reports by Status */}
            <ChartCard title='Reports by Status'>
              <div className='h-64'>
                <ResponsiveContainer width='100%' height='100%'>
                  <PieChart>
                    <Pie
                      data={stats.statusData}
                      cx='50%'
                      cy='50%'
                      labelLine={false}
                      label={({ name, value, percent }) =>
                        `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                      }
                      outerRadius={100}
                      fill='#8884d8'
                      dataKey='value'
                    >
                      {stats.statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* Reports Created Trend */}
            <ChartCard title='Reports Created (7 Days)'>
              <div className='h-64'>
                <ResponsiveContainer width='100%' height='100%'>
                  <AreaChart data={stats.timelineData}>
                    <defs>
                      <linearGradient id='colorCount' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='5%' stopColor='#3b82f6' stopOpacity={0.3} />
                        <stop offset='95%' stopColor='#3b82f6' stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray='3 3' stroke='#e2e8f0' />
                    <XAxis dataKey='date' stroke='#94a3b8' />
                    <YAxis stroke='#94a3b8' />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                    />
                    <Area
                      type='monotone'
                      dataKey='count'
                      stroke='#3b82f6'
                      strokeWidth={2}
                      fillOpacity={1}
                      fill='url(#colorCount)'
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* Revenue Trend */}
            <ChartCard title='Revenue Trend (7 Days)'>
              <div className='h-64'>
                <ResponsiveContainer width='100%' height='100%'>
                  <LineChart data={stats.revenueTrend}>
                    <CartesianGrid strokeDasharray='3 3' stroke='#e2e8f0' />
                    <XAxis dataKey='date' stroke='#94a3b8' />
                    <YAxis stroke='#94a3b8' />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                      formatter={value => formatCurrency(value as number)}
                    />
                    <Line
                      type='monotone'
                      dataKey='revenue'
                      stroke='#10b981'
                      strokeWidth={2}
                      dot={{ fill: '#10b981', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* Status Distribution Bar */}
            <ChartCard title='Status Distribution'>
              <div className='h-64'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart
                    data={[
                      {
                        name: 'Reports',
                        completed: stats.completed,
                        draft: stats.draft,
                        sent: stats.sent,
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray='3 3' stroke='#e2e8f0' />
                    <XAxis dataKey='name' stroke='#94a3b8' />
                    <YAxis stroke='#94a3b8' />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                    />
                    <Legend />
                    <Bar dataKey='completed' stackId='a' fill='#10b981' name='Completed' />
                    <Bar dataKey='sent' stackId='a' fill='#3b82f6' name='Sent' />
                    <Bar dataKey='draft' stackId='a' fill='#f59e0b' name='Draft' />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
        </>
      ) : (
        /* Grid View */
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {reports.slice(0, 12).map(report => (
            <div
              key={report.id}
              onClick={() => onReportClick(report)}
              className='bg-white rounded-lg border border-slate-200 p-4 hover:shadow-lg hover:border-slate-300 transition-all cursor-pointer group'
            >
              <div className='flex items-start justify-between mb-3'>
                <div className='flex-1 min-w-0'>
                  <h4 className='font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors'>
                    {report.customerName}
                  </h4>
                  <p className='text-xs text-slate-500 truncate'>{report.customerAddress}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ml-2 ${
                    report.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : report.status === 'sent'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {report.status}
                </span>
              </div>

              <div className='space-y-2'>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-slate-600'>Revenue</span>
                  <span className='font-semibold text-slate-900'>
                    {formatCurrency(report.estimatedCost || 0)}
                  </span>
                </div>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-slate-600'>Created</span>
                  <span className='text-slate-500'>
                    {new Date(report.createdAt || 0).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <button className='mt-4 w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 rounded text-sm font-medium text-slate-700 transition-colors flex items-center justify-center gap-2'>
                <Eye className='w-4 h-4' />
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EnhancedReportsView;
