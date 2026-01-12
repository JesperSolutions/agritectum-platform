/**
 * Improvement Results Component
 * 
 * Displays calculated ESG impact results from improvements
 */

import React from 'react';
import {
  TrendingUp,
  Leaf,
  Sun,
  Droplet,
  DollarSign,
  Calendar,
  Award,
  Download,
  FileText,
} from 'lucide-react';
import { useIntl } from '../../../hooks/useIntl';
import ListCard from '../../shared/cards/ListCard';
import IconLabel from '../../shared/layouts/IconLabel';
import ScenarioComparison from './ScenarioComparison';

interface ImprovementResultsProps {
  metrics: {
    totalCost: number;
    annualCO2Reduction: number;
    annualEnergySavings: number;
    annualWaterSavings: number;
    paybackPeriod: number;
    roi10Year: number;
    sustainabilityScore: number;
    neutralityTimeline: number | null;
    financialMetrics: {
      totalCost: number;
      annualSavings: number;
      paybackPeriod: number;
      npv: number;
      irr: number;
      roi: number;
    };
    scenarios: {
      optimistic: any;
      realistic: any;
      pessimistic: any;
    };
  };
  onExport?: (format: 'PDF' | 'Excel') => void;
}

const ImprovementResults: React.FC<ImprovementResultsProps> = ({
  metrics,
  onExport,
}) => {
  const { t } = useIntl();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-blue-50 border-blue-200';
    if (score >= 40) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-6">
      {/* Header with Export */}
      <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Award className="w-5 h-5 mr-2 text-green-600" />
            {t('admin.improvements.results') || 'Improvement Impact Results'}
          </h2>
          {onExport && (
            <div className="flex space-x-2">
              <button
                onClick={() => onExport('PDF')}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </button>
              <button
                onClick={() => onExport('Excel')}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Excel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cost */}
        <ListCard>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-50 border-4 border-purple-200 mb-3">
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-600">
              €{metrics.totalCost.toLocaleString()}
            </p>
            <p className="text-sm font-medium text-gray-900">
              {t('admin.improvements.totalCost') || 'Total Investment'}
            </p>
          </div>
        </ListCard>

        {/* Annual CO2 Reduction */}
        <ListCard>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 border-4 border-green-200 mb-3">
              <Leaf className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">
              {metrics.annualCO2Reduction.toLocaleString()}
            </p>
            <p className="text-sm font-medium text-gray-900">
              {t('admin.improvements.annualCO2Reduction') || 'Annual CO₂ Reduction'}
            </p>
            <p className="text-xs text-gray-500 mt-1">kg CO₂/year</p>
          </div>
        </ListCard>

        {/* Annual Energy Savings */}
        <ListCard>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-50 border-4 border-yellow-200 mb-3">
              <Sun className="w-8 h-8 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-yellow-600">
              {metrics.annualEnergySavings.toLocaleString()}
            </p>
            <p className="text-sm font-medium text-gray-900">
              {t('admin.improvements.annualEnergySavings') || 'Annual Energy Savings'}
            </p>
            <p className="text-xs text-gray-500 mt-1">kWh/year</p>
          </div>
        </ListCard>

        {/* Annual Water Savings */}
        <ListCard>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 border-4 border-blue-200 mb-3">
              <Droplet className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {metrics.annualWaterSavings.toFixed(1)}
            </p>
            <p className="text-sm font-medium text-gray-900">
              {t('admin.improvements.annualWaterSavings') || 'Annual Water Savings'}
            </p>
            <p className="text-xs text-gray-500 mt-1">m³/year</p>
          </div>
        </ListCard>
      </div>

      {/* Financial Metrics */}
      <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <DollarSign className="w-5 h-5 mr-2 text-green-600" />
          {t('admin.improvements.financialAnalysis') || 'Financial Analysis'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <IconLabel
            icon={TrendingUp}
            label={t('admin.improvements.npv') || 'Net Present Value (10yr)'}
            value={`€${metrics.financialMetrics.npv.toLocaleString()}`}
          />
          <IconLabel
            icon={TrendingUp}
            label={t('admin.improvements.irr') || 'Internal Rate of Return'}
            value={`${metrics.financialMetrics.irr.toFixed(1)}%`}
          />
          <IconLabel
            icon={Calendar}
            label={t('admin.improvements.paybackPeriod') || 'Payback Period'}
            value={
              metrics.financialMetrics.paybackPeriod === Infinity
                ? '∞'
                : `${metrics.financialMetrics.paybackPeriod.toFixed(1)} ${t('admin.improvements.years') || 'years'}`
            }
          />
          <IconLabel
            icon={DollarSign}
            label={t('admin.improvements.annualSavings') || 'Annual Savings'}
            value={`€${metrics.financialMetrics.annualSavings.toLocaleString()}`}
          />
          <IconLabel
            icon={Award}
            label={t('admin.improvements.roi10Year') || 'ROI (10 years)'}
            value={`${metrics.financialMetrics.roi.toFixed(1)}%`}
          />
          {metrics.neutralityTimeline && (
            <IconLabel
              icon={Leaf}
              label={t('admin.improvements.neutralityTimeline') || 'CO₂ Neutrality'}
              value={`${metrics.neutralityTimeline} ${t('admin.improvements.years') || 'years'}`}
            />
          )}
        </div>
      </div>

      {/* Sustainability Score */}
      <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Award className="w-5 h-5 mr-2 text-green-600" />
          {t('admin.improvements.sustainabilityScore') || 'Sustainability Score'}
        </h3>
        <div className="flex items-center justify-center">
          <div
            className={`inline-flex items-center justify-center w-32 h-32 rounded-full border-8 ${getScoreBgColor(
              metrics.sustainabilityScore
            )} ${getScoreColor(metrics.sustainabilityScore)}`}
          >
            <span className="text-5xl font-bold">{metrics.sustainabilityScore}</span>
          </div>
        </div>
        <p className="text-center text-sm text-gray-600 mt-4">
          {t('admin.improvements.sustainabilityNote') ||
            'Score improved by configured improvements'}
        </p>
      </div>

      {/* Scenario Comparison */}
      <ScenarioComparison scenarios={metrics.scenarios} />
    </div>
  );
};

export default ImprovementResults;
