/**
 * Portfolio Dashboard
 * Multi-building overview with aggregate KPIs and analytics
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Calendar,
  FileWarning,
  BarChart3,
  PieChart,
  Home,
  Wrench,
} from 'lucide-react';
import { PortfolioMetrics, MaintenancePrediction } from '../../types';
import { getPortfolioMetrics, getPortfolioTrends } from '../../services/portfolioService';
import { generatePortfolioPredictions } from '../../services/predictiveMaintenanceService';
import { logger } from '../../utils/logger';
import LoadingSpinner from '../common/LoadingSpinner';
import { Line, Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const PortfolioDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [predictions, setPredictions] = useState<MaintenancePrediction[]>([]);
  const [trends, setTrends] = useState<any>(null);

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    }
  }, [currentUser]);

  const loadDashboardData = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const customerId = currentUser.companyId || currentUser.uid;

      const [metricsData, trendsData, predictionsData] = await Promise.all([
        getPortfolioMetrics(customerId),
        getPortfolioTrends(customerId, 6),
        generatePortfolioPredictions(customerId),
      ]);

      setMetrics(metricsData);
      setTrends(trendsData);
      setPredictions(predictionsData.slice(0, 5)); // Top 5 predictions
    } catch (error) {
      logger.error('Error loading portfolio dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <LoadingSpinner />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className='p-6 text-center'>
        <p className='text-gray-600'>No portfolio data available</p>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  // Chart data
  const trendsChartData = trends
    ? {
        labels: trends.months.map((m: string) => {
          const date = new Date(m + '-01');
          return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        }),
        datasets: [
          {
            label: 'Income',
            data: trends.income,
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            tension: 0.4,
          },
          {
            label: 'Costs',
            data: trends.costs,
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4,
          },
        ],
      }
    : null;

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Portfolio Overview</h1>
          <p className='text-gray-600 mt-1'>Manage and analyze your building portfolio</p>
        </div>
        <button
          onClick={() => navigate('/portal/buildings')}
          className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition'
        >
          View All Buildings
        </button>
      </div>

      {/* Key Metrics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <MetricCard
          icon={Building2}
          label='Total Buildings'
          value={metrics.totalBuildings.toString()}
          iconColor='text-blue-600'
          bgColor='bg-blue-100'
        />
        <MetricCard
          icon={DollarSign}
          label='Portfolio Value'
          value={`€${(metrics.totalValue / 1000000).toFixed(2)}M`}
          iconColor='text-green-600'
          bgColor='bg-green-100'
        />
        <MetricCard
          icon={TrendingUp}
          label='Portfolio ROI'
          value={`${metrics.portfolioROI.toFixed(1)}%`}
          iconColor='text-purple-600'
          bgColor='bg-purple-100'
        />
        <MetricCard
          icon={Home}
          label='Avg Condition'
          value={`${metrics.averageConditionScore.toFixed(0)}/100`}
          iconColor='text-indigo-600'
          bgColor='bg-indigo-100'
        />
      </div>

      {/* Alerts */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
        <AlertCard
          icon={AlertTriangle}
          label='Requires Attention'
          value={metrics.buildingsRequiringAttention}
          color='red'
          onClick={() => navigate('/portal/buildings?filter=attention')}
        />
        <AlertCard
          icon={Calendar}
          label='Upcoming Maintenance'
          value={metrics.upcomingMaintenanceCount}
          color='orange'
          onClick={() => navigate('/portal/scheduled-visits')}
        />
        <AlertCard
          icon={FileWarning}
          label='Expiring Documents'
          value={metrics.expiringDocumentsCount}
          color='yellow'
          onClick={() => navigate('/portal/documents')}
        />
      </div>

      {/* Financial Trends Chart */}
      {trendsChartData && (
        <div className='bg-white rounded-lg shadow p-6'>
          <h2 className='text-xl font-semibold mb-4 flex items-center'>
            <BarChart3 className='w-5 h-5 mr-2' />
            Financial Trends (6 Months)
          </h2>
          <Line
            data={trendsChartData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' as const },
                title: { display: false },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: (value) => `€${(Number(value) / 1000).toFixed(0)}k`,
                  },
                },
              },
            }}
          />
        </div>
      )}

      {/* Predictive Maintenance */}
      <div className='bg-white rounded-lg shadow p-6'>
        <h2 className='text-xl font-semibold mb-4 flex items-center'>
          <Wrench className='w-5 h-5 mr-2' />
          Recommended Actions
        </h2>
        {predictions.length > 0 ? (
          <div className='space-y-3'>
            {predictions.map((prediction, index) => (
              <div
                key={index}
                className='p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition cursor-pointer'
                onClick={() => navigate(`/portal/buildings/${prediction.buildingId}`)}
              >
                <div className='flex justify-between items-start'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-2 mb-1'>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${getPriorityColor(prediction.priority)}`}
                      >
                        {prediction.priority.toUpperCase()}
                      </span>
                      <span className='text-sm text-gray-500'>{prediction.buildingName}</span>
                    </div>
                    <p className='font-medium text-gray-900'>{prediction.recommendedAction}</p>
                    <p className='text-sm text-gray-600 mt-1'>{prediction.reasoning}</p>
                    {prediction.estimatedCost && (
                      <p className='text-sm text-gray-500 mt-1'>
                        Est. Cost: €{prediction.estimatedCost.min.toLocaleString()} - €
                        {prediction.estimatedCost.max.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className='text-right'>
                    <span className='text-xs text-gray-500'>
                      {prediction.confidence}% confidence
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className='text-gray-500 text-center py-8'>
            No immediate maintenance recommendations. All buildings in good condition!
          </p>
        )}
      </div>

      {/* Quick Stats */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='bg-white rounded-lg shadow p-6'>
          <h3 className='text-lg font-semibold mb-3'>Financial Summary</h3>
          <div className='space-y-2'>
            <div className='flex justify-between'>
              <span className='text-gray-600'>Total Area:</span>
              <span className='font-semibold'>{metrics.totalArea.toLocaleString()} m²</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-600'>Annual Income:</span>
              <span className='font-semibold text-green-600'>
                €{metrics.totalAnnualIncome.toLocaleString()}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-600'>Annual Costs:</span>
              <span className='font-semibold text-red-600'>
                €{metrics.totalAnnualCosts.toLocaleString()}
              </span>
            </div>
            <div className='flex justify-between pt-2 border-t'>
              <span className='text-gray-900 font-semibold'>Net Cash Flow:</span>
              <span
                className={`font-bold ${
                  metrics.totalAnnualIncome - metrics.totalAnnualCosts > 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                €{(metrics.totalAnnualIncome - metrics.totalAnnualCosts).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg shadow p-6'>
          <h3 className='text-lg font-semibold mb-3'>Portfolio Health</h3>
          <div className='space-y-4'>
            <div>
              <div className='flex justify-between mb-1'>
                <span className='text-sm text-gray-600'>Avg Condition Score</span>
                <span className='text-sm font-semibold'>
                  {metrics.averageConditionScore.toFixed(0)}/100
                </span>
              </div>
              <div className='w-full bg-gray-200 rounded-full h-2'>
                <div
                  className={`h-2 rounded-full ${
                    metrics.averageConditionScore >= 80
                      ? 'bg-green-500'
                      : metrics.averageConditionScore >= 60
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${metrics.averageConditionScore}%` }}
                />
              </div>
            </div>
            <div className='flex items-center justify-between p-3 bg-gray-50 rounded'>
              <span className='text-sm text-gray-600'>Buildings in Good Condition</span>
              <span className='text-lg font-bold text-green-600'>
                {metrics.totalBuildings - metrics.buildingsRequiringAttention}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard: React.FC<{
  icon: any;
  label: string;
  value: string;
  iconColor: string;
  bgColor: string;
}> = ({ icon: Icon, label, value, iconColor, bgColor }) => (
  <div className='bg-white rounded-lg shadow p-6'>
    <div className='flex items-center justify-between'>
      <div>
        <p className='text-sm text-gray-600'>{label}</p>
        <p className='text-2xl font-bold text-gray-900 mt-1'>{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${bgColor}`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
    </div>
  </div>
);

// Alert Card Component
const AlertCard: React.FC<{
  icon: any;
  label: string;
  value: number;
  color: 'red' | 'orange' | 'yellow';
  onClick: () => void;
}> = ({ icon: Icon, label, value, color, onClick }) => {
  const colorClasses = {
    red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', icon: 'text-red-600' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', icon: 'text-orange-600' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200', icon: 'text-yellow-600' },
  };

  const classes = colorClasses[color];

  return (
    <div
      onClick={onClick}
      className={`${classes.bg} border ${classes.border} rounded-lg p-4 cursor-pointer hover:shadow-md transition`}
    >
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Icon className={`w-5 h-5 ${classes.icon}`} />
          <span className={`text-sm font-medium ${classes.text}`}>{label}</span>
        </div>
        <span className={`text-2xl font-bold ${classes.text}`}>{value}</span>
      </div>
    </div>
  );
};

export default PortfolioDashboard;
