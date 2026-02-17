import React from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Building as BuildingIcon, TrendingUp, TrendingDown, AlertTriangle, Download } from 'lucide-react';
import { Building, Report } from '../../types';
import { useIntl } from '../../hooks/useIntl';

interface BuildingWithHealth extends Building {
  healthScore: number;
  healthGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  daysSinceInspection?: number;
  lastInspectionDate?: string;
  status: 'good' | 'check-soon' | 'urgent';
}

interface Props {
  buildings: BuildingWithHealth[];
  reports: Report[];
  onExportPDF?: () => void;
}

const COLORS = {
  A: '#10b981', // green
  B: '#3b82f6', // blue
  C: '#f59e0b', // amber
  D: '#f97316', // orange
  F: '#ef4444', // red
};

const PortfolioHealthReport: React.FC<Props> = ({ buildings, reports, onExportPDF }) => {
  const { t, locale } = useIntl();
  // Calculate grade distribution
  const gradeData = [
    { grade: 'A', count: buildings.filter(b => b.healthGrade === 'A').length, color: COLORS.A },
    { grade: 'B', count: buildings.filter(b => b.healthGrade === 'B').length, color: COLORS.B },
    { grade: 'C', count: buildings.filter(b => b.healthGrade === 'C').length, color: COLORS.C },
    { grade: 'D', count: buildings.filter(b => b.healthGrade === 'D').length, color: COLORS.D },
    { grade: 'F', count: buildings.filter(b => b.healthGrade === 'F').length, color: COLORS.F },
  ];

  // Calculate health score trend (last 6 months)
  const trendData = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthName = date.toLocaleDateString(locale, { month: 'short' });
    
    // Filter reports from that month
    const monthReports = reports.filter(r => {
      const reportDate = new Date(r.inspectionDate);
      return reportDate.getMonth() === date.getMonth() && reportDate.getFullYear() === date.getFullYear();
    });

    // Calculate average health for that month
    const avgHealthMonth = monthReports.length > 0
      ? monthReports.reduce((sum, r) => sum + (calculateReportHealth(r)), 0) / monthReports.length
      : 0;

    trendData.push({
      month: monthName,
      health: Math.round(avgHealthMonth),
      inspections: monthReports.length,
    });
  }

  // Building comparison data
  const comparisonData = buildings
    .sort((a, b) => b.healthScore - a.healthScore)
    .slice(0, 10)
    .map(b => ({
      name: b.name || b.address.substring(0, 20) + '...',
      score: b.healthScore,
      grade: b.healthGrade,
    }));

  // Smart recommendations
  const recommendations = generateRecommendations(buildings, reports, t);

  // Average health score
  const avgHealth = buildings.length > 0
    ? Math.round(buildings.reduce((sum, b) => sum + b.healthScore, 0) / buildings.length)
    : 0;

  // Buildings needing attention
  const needsAttention = buildings.filter(b => b.status === 'urgent' || b.status === 'check-soon').length;

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const inspectionsLastSixMonths = reports.filter(r => new Date(r.inspectionDate) >= sixMonthsAgo).length;

  // Trend direction
  const recentHealth = trendData[trendData.length - 1]?.health || 0;
  const previousHealth = trendData[trendData.length - 2]?.health || 0;
  const trend = recentHealth - previousHealth;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('portal.portfolioReport.title')}</h2>
          <p className="text-gray-600 mt-1">{t('portal.portfolioReport.subtitle')}</p>
        </div>
        {onExportPDF && (
          <button
            onClick={onExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            {t('portal.portfolioReport.exportPdf')}
          </button>
        )}
      </div>

      {/* Smart Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-amber-900">{t('portal.portfolioReport.recommendations.title')}</h3>
              <p className="text-sm text-amber-800 mb-3">{t('portal.portfolioReport.recommendations.desc')}</p>
              <ul className="space-y-2">
                {recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-amber-800">
                    <span className="font-bold">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
          <p className="text-sm font-medium text-gray-600 mb-1">{t('portal.portfolioReport.cards.totalBuildings.title')}</p>
          <p className="text-3xl font-bold text-gray-900">{buildings.length}</p>
          <p className="text-xs text-gray-500 mt-2">{t('portal.portfolioReport.cards.totalBuildings.desc')}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
          <p className="text-sm font-medium text-gray-600 mb-1">{t('portal.portfolioReport.cards.averageHealth.title')}</p>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-bold text-gray-900">{avgHealth}</p>
            {trend !== 0 && (
              <span className={`flex items-center text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(trend)}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">{t('portal.portfolioReport.cards.averageHealth.desc')}</p>
        </div>

        <div className="bg-amber-50 rounded-lg shadow p-5 border border-amber-200">
          <p className="text-sm font-semibold text-amber-900 mb-1">{t('portal.portfolioReport.cards.needsAttention.title')}</p>
          <p className="text-4xl font-bold text-amber-700">{needsAttention}</p>
          <p className="text-xs text-amber-800 mt-2">{t('portal.portfolioReport.cards.needsAttention.desc')}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
          <p className="text-sm font-medium text-gray-600 mb-1">{t('portal.portfolioReport.cards.inspections.title')}</p>
          <p className="text-3xl font-bold text-gray-900">{inspectionsLastSixMonths}</p>
          <p className="text-xs text-gray-500 mt-2">{t('portal.portfolioReport.cards.inspections.desc')}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Health Score Trend */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-semibold">{t('portal.portfolioReport.trend.title')}</h3>
          <p className="text-sm text-gray-600 mb-4">{t('portal.portfolioReport.trend.desc')}</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="health"
                stroke="#3b82f6"
                strokeWidth={2}
                name={t('portal.portfolioReport.trend.legend')}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Grade Distribution */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-semibold">{t('portal.portfolioReport.grade.title')}</h3>
          <p className="text-sm text-gray-600 mb-4">{t('portal.portfolioReport.grade.desc')}</p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={gradeData.filter(d => d.count > 0)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.grade}: ${entry.count}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {gradeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Building Comparison */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h3 className="text-lg font-semibold">{t('portal.portfolioReport.comparison.title')}</h3>
        <p className="text-sm text-gray-600 mb-4">{t('portal.portfolioReport.comparison.desc')}</p>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={comparisonData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} />
            <YAxis dataKey="name" type="category" width={150} />
            <Tooltip />
            <Legend />
            <Bar dataKey="score" name={t('portal.portfolioReport.comparison.legend')}>
              {comparisonData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.grade as keyof typeof COLORS]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Helper function to calculate health from report
function calculateReportHealth(report: Report): number {
  const criticalIssues = report.issuesFound?.filter(i => i.severity === 'critical' || i.severity === 'high').length || 0;
  let score = 100;
  
  // Deduct for critical issues
  score -= criticalIssues * 15;
  
  // Consider report age
  const daysSince = Math.floor((Date.now() - new Date(report.inspectionDate).getTime()) / (1000 * 60 * 60 * 24));
  if (daysSince > 365) score -= 30;
  else if (daysSince > 180) score -= 15;
  
  return Math.max(0, score);
}

// Generate smart recommendations
function generateRecommendations(
  buildings: BuildingWithHealth[],
  reports: Report[],
  t: (id: string, values?: Record<string, any>) => string
): string[] {
  const recs: string[] = [];
  
  const urgentBuildings = buildings.filter(b => b.status === 'urgent');
  if (urgentBuildings.length > 0) {
    recs.push(t('portal.recommendations.urgent', { count: urgentBuildings.length }));
  }
  
  const checkSoonBuildings = buildings.filter(b => b.status === 'check-soon');
  if (checkSoonBuildings.length > 0) {
    recs.push(t('portal.recommendations.checkSoon', { count: checkSoonBuildings.length }));
  }
  
  const lowGradeBuildings = buildings.filter(b => b.healthGrade === 'D' || b.healthGrade === 'F');
  if (lowGradeBuildings.length > 0) {
    recs.push(t('portal.recommendations.lowGrades', { count: lowGradeBuildings.length }));
  }
  
  const avgHealth = buildings.length > 0
    ? buildings.reduce((sum, b) => sum + b.healthScore, 0) / buildings.length
    : 0;
  
  if (avgHealth < 70) {
    recs.push(t('portal.recommendations.lowAverage'));
  }
  
  const recentReports = reports.filter(r => {
    const daysSince = Math.floor((Date.now() - new Date(r.inspectionDate).getTime()) / (1000 * 60 * 60 * 24));
    return daysSince <= 90;
  });
  
  if (recentReports.length < buildings.length * 0.25) {
    recs.push(t('portal.recommendations.lowCoverage'));
  }
  
  return recs;
}

export default PortfolioHealthReport;
