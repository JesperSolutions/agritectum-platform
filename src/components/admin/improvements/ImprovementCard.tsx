/**
 * Improvement Card Component
 *
 * Displays and allows configuration of a single roof improvement type
 */

import React from 'react';
import { Switch, Slider } from 'lucide-react';
import { RoofImprovement, ImprovementType } from '../../../types';
import { IMPROVEMENT_COST_FACTORS } from '../../../utils/improvementCalculations';
import { useIntl } from '../../../hooks/useIntl';

interface ImprovementCardProps {
  type: ImprovementType;
  improvement: RoofImprovement | null;
  roofArea: number;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onUpdate: (improvement: RoofImprovement) => void;
  maxPercentage: number; // Remaining percentage available
}

const ImprovementCard: React.FC<ImprovementCardProps> = ({
  type,
  improvement,
  roofArea,
  enabled,
  onToggle,
  onUpdate,
  maxPercentage,
}) => {
  const { t } = useIntl();

  const improvementLabels: Record<ImprovementType, string> = {
    green_roof: t('admin.improvements.greenRoof') || 'Green Roof',
    solar_panels: t('admin.improvements.solarPanels') || 'Solar Panels',
    water_management: t('admin.improvements.waterManagement') || 'Water Management',
    insulation: t('admin.improvements.insulation') || 'Enhanced Insulation',
    cooling: t('admin.improvements.cooling') || 'Cooling Systems',
    biodiversity: t('admin.improvements.biodiversity') || 'Biodiversity',
  };

  const improvementDescriptions: Record<ImprovementType, string> = {
    green_roof:
      t('admin.improvements.greenRoofDesc') ||
      'Sedum/green roof for CO2 absorption and water retention',
    solar_panels:
      t('admin.improvements.solarPanelsDesc') || 'Solar panels for renewable energy generation',
    water_management:
      t('admin.improvements.waterManagementDesc') || 'Water collection and retention systems',
    insulation:
      t('admin.improvements.insulationDesc') || 'Enhanced insulation for energy efficiency',
    cooling: t('admin.improvements.coolingDesc') || 'Cooling systems for temperature regulation',
    biodiversity:
      t('admin.improvements.biodiversityDesc') || 'Biodiversity enhancements for ecosystem support',
  };

  const handlePercentageChange = (value: number) => {
    if (!enabled) return;
    const clampedValue = Math.min(value, maxPercentage);
    const currentImprovement = improvement || {
      type,
      percentage: 0,
      startYear: 0,
      costPerSqm: IMPROVEMENT_COST_FACTORS[type],
    };
    onUpdate({
      ...currentImprovement,
      percentage: clampedValue,
    });
  };

  const handleCostChange = (value: number) => {
    if (!enabled || !improvement) return;
    onUpdate({
      ...improvement,
      costPerSqm: Math.max(0, value),
    });
  };

  const handleStartYearChange = (value: number) => {
    if (!enabled || !improvement) return;
    onUpdate({
      ...improvement,
      startYear: Math.max(0, Math.floor(value)),
    });
  };

  const currentImprovement = improvement || {
    type,
    percentage: 0,
    startYear: 0,
    costPerSqm: IMPROVEMENT_COST_FACTORS[type],
  };

  const areaForImprovement = roofArea * (currentImprovement.percentage / 100);
  const estimatedCost = areaForImprovement * currentImprovement.costPerSqm;

  return (
    <div
      className={`bg-white rounded-lg border-2 p-4 transition-all ${
        enabled ? 'border-green-500 shadow-md' : 'border-gray-200 opacity-60'
      }`}
    >
      <div className='flex items-center justify-between mb-4'>
        <div className='flex-1'>
          <h3 className='text-lg font-semibold text-gray-900'>{improvementLabels[type]}</h3>
          <p className='text-sm text-gray-600 mt-1'>{improvementDescriptions[type]}</p>
        </div>
        <label className='flex items-center cursor-pointer'>
          <input
            type='checkbox'
            checked={enabled}
            onChange={e => onToggle(e.target.checked)}
            className='sr-only'
          />
          <div
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enabled ? 'bg-green-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </div>
        </label>
      </div>

      {enabled && (
        <div className='space-y-4 mt-4'>
          {/* Percentage Slider */}
          <div>
            <div className='flex items-center justify-between mb-2'>
              <label className='text-sm font-medium text-gray-700'>
                {t('admin.improvements.percentage') || 'Percentage of Roof Area'}
              </label>
              <span className='text-sm font-bold text-green-600'>
                {currentImprovement.percentage}%
              </span>
            </div>
            <input
              type='range'
              min='0'
              max={maxPercentage}
              value={currentImprovement.percentage}
              onChange={e => handlePercentageChange(parseFloat(e.target.value))}
              className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600'
            />
            <div className='flex justify-between text-xs text-gray-500 mt-1'>
              <span>0%</span>
              <span>{maxPercentage}%</span>
            </div>
          </div>

          {/* Cost per m² */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              {t('admin.improvements.costPerSqm') || 'Cost per m²'} (EUR)
            </label>
            <input
              type='number'
              min='0'
              step='1'
              value={currentImprovement.costPerSqm}
              onChange={e => handleCostChange(parseFloat(e.target.value) || 0)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500'
            />
          </div>

          {/* Start Year */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              {t('admin.improvements.startYear') || 'Start Year'} (0 = immediate)
            </label>
            <input
              type='number'
              min='0'
              step='1'
              value={currentImprovement.startYear}
              onChange={e => handleStartYearChange(parseFloat(e.target.value) || 0)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500'
            />
          </div>

          {/* Estimated Cost */}
          <div className='bg-green-50 border border-green-200 rounded-lg p-3'>
            <div className='flex justify-between items-center'>
              <span className='text-sm font-medium text-gray-700'>
                {t('admin.improvements.estimatedCost') || 'Estimated Cost'}
              </span>
              <span className='text-lg font-bold text-green-600'>
                €{estimatedCost.toLocaleString()}
              </span>
            </div>
            <p className='text-xs text-gray-500 mt-1'>
              {areaForImprovement.toFixed(1)} m² × €{currentImprovement.costPerSqm.toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImprovementCard;
