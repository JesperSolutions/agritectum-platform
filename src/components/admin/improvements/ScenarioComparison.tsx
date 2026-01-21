/**
 * Scenario Comparison Component
 *
 * Displays comparison table of optimistic, realistic, and pessimistic scenarios
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ImprovementMetrics } from '../../../types';
import { useIntl } from '../../../hooks/useIntl';

interface ScenarioComparisonProps {
  scenarios: {
    optimistic: ImprovementMetrics;
    realistic: ImprovementMetrics;
    pessimistic: ImprovementMetrics;
  };
}

const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({ scenarios }) => {
  const { t } = useIntl();

  const formatCurrency = (value: number) => {
    return `€${value.toLocaleString()}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatYears = (value: number) => {
    if (value === Infinity) return '∞';
    return `${value.toFixed(1)} ${t('admin.improvements.years') || 'years'}`;
  };

  return (
    <div className='bg-white rounded-lg border border-slate-200 p-6'>
      <h3 className='text-lg font-semibold mb-4 flex items-center'>
        <TrendingUp className='w-5 h-5 mr-2 text-blue-600' />
        {t('admin.improvements.scenarioAnalysis') || 'Scenario Analysis'}
      </h3>

      <div className='overflow-x-auto'>
        <table className='w-full'>
          <thead>
            <tr className='border-b border-gray-200'>
              <th className='text-left py-3 px-4 font-medium text-gray-900'>
                {t('admin.improvements.scenario') || 'Scenario'}
              </th>
              <th className='text-right py-3 px-4 font-medium text-gray-900'>
                {t('admin.improvements.npv') || 'NPV'}
              </th>
              <th className='text-right py-3 px-4 font-medium text-gray-900'>
                {t('admin.improvements.irr') || 'IRR'}
              </th>
              <th className='text-right py-3 px-4 font-medium text-gray-900'>
                {t('admin.improvements.payback') || 'Payback'}
              </th>
              <th className='text-right py-3 px-4 font-medium text-gray-900'>
                {t('admin.improvements.annualSavings') || 'Annual Savings'}
              </th>
              <th className='text-right py-3 px-4 font-medium text-gray-900'>
                {t('admin.improvements.roi') || 'ROI (10yr)'}
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Optimistic Scenario */}
            <tr className='border-b border-gray-100 hover:bg-green-50'>
              <td className='py-3 px-4 font-medium'>
                <div className='flex items-center'>
                  <TrendingUp className='w-4 h-4 text-green-600 mr-2' />
                  <span className='capitalize'>
                    {t('admin.improvements.optimistic') || 'Optimistic'}
                  </span>
                </div>
              </td>
              <td className='py-3 px-4 text-right text-green-600 font-semibold'>
                {formatCurrency(scenarios.optimistic.npv)}
              </td>
              <td className='py-3 px-4 text-right text-green-600 font-semibold'>
                {formatPercentage(scenarios.optimistic.irr)}
              </td>
              <td className='py-3 px-4 text-right'>
                {formatYears(scenarios.optimistic.paybackPeriod)}
              </td>
              <td className='py-3 px-4 text-right text-green-600 font-semibold'>
                {formatCurrency(scenarios.optimistic.annualSavings)}
              </td>
              <td className='py-3 px-4 text-right text-green-600 font-semibold'>
                {formatPercentage(scenarios.optimistic.roi)}
              </td>
            </tr>

            {/* Realistic Scenario */}
            <tr className='border-b border-gray-100 hover:bg-blue-50'>
              <td className='py-3 px-4 font-medium'>
                <div className='flex items-center'>
                  <Minus className='w-4 h-4 text-blue-600 mr-2' />
                  <span className='capitalize'>
                    {t('admin.improvements.realistic') || 'Realistic'}
                  </span>
                </div>
              </td>
              <td className='py-3 px-4 text-right text-blue-600 font-semibold'>
                {formatCurrency(scenarios.realistic.npv)}
              </td>
              <td className='py-3 px-4 text-right text-blue-600 font-semibold'>
                {formatPercentage(scenarios.realistic.irr)}
              </td>
              <td className='py-3 px-4 text-right'>
                {formatYears(scenarios.realistic.paybackPeriod)}
              </td>
              <td className='py-3 px-4 text-right text-blue-600 font-semibold'>
                {formatCurrency(scenarios.realistic.annualSavings)}
              </td>
              <td className='py-3 px-4 text-right text-blue-600 font-semibold'>
                {formatPercentage(scenarios.realistic.roi)}
              </td>
            </tr>

            {/* Pessimistic Scenario */}
            <tr className='border-b border-gray-100 hover:bg-red-50'>
              <td className='py-3 px-4 font-medium'>
                <div className='flex items-center'>
                  <TrendingDown className='w-4 h-4 text-red-600 mr-2' />
                  <span className='capitalize'>
                    {t('admin.improvements.pessimistic') || 'Pessimistic'}
                  </span>
                </div>
              </td>
              <td className='py-3 px-4 text-right text-red-600 font-semibold'>
                {formatCurrency(scenarios.pessimistic.npv)}
              </td>
              <td className='py-3 px-4 text-right text-red-600 font-semibold'>
                {formatPercentage(scenarios.pessimistic.irr)}
              </td>
              <td className='py-3 px-4 text-right'>
                {formatYears(scenarios.pessimistic.paybackPeriod)}
              </td>
              <td className='py-3 px-4 text-right text-red-600 font-semibold'>
                {formatCurrency(scenarios.pessimistic.annualSavings)}
              </td>
              <td className='py-3 px-4 text-right text-red-600 font-semibold'>
                {formatPercentage(scenarios.pessimistic.roi)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className='mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
        <p className='text-sm text-gray-700'>
          <strong>{t('admin.improvements.scenarioNote') || 'Note:'}</strong>{' '}
          {t('admin.improvements.scenarioDescription') ||
            'Scenarios are based on performance variations: Optimistic assumes 20% better performance and 10% lower costs, Pessimistic assumes 20% worse performance and 10% higher costs.'}
        </p>
      </div>
    </div>
  );
};

export default ScenarioComparison;
