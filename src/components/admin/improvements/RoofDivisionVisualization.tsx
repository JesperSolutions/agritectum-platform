/**
 * Roof Division Visualization Component
 *
 * Visual representation of roof area allocation across improvements
 */

import React from 'react';
import { RoofImprovement, ImprovementType } from '../../../types';
import { useIntl } from '../../../hooks/useIntl';

interface RoofDivisionVisualizationProps {
  improvements: RoofImprovement[];
  roofArea: number;
}

const RoofDivisionVisualization: React.FC<RoofDivisionVisualizationProps> = ({
  improvements,
  roofArea,
}) => {
  const { t } = useIntl();

  const improvementColors: Record<ImprovementType, string> = {
    green_roof: 'bg-green-500',
    solar_panels: 'bg-yellow-500',
    water_management: 'bg-blue-500',
    insulation: 'bg-purple-500',
    cooling: 'bg-cyan-500',
    biodiversity: 'bg-emerald-500',
  };

  const improvementLabels: Record<ImprovementType, string> = {
    green_roof: t('admin.improvements.greenRoof') || 'Green Roof',
    solar_panels: t('admin.improvements.solarPanels') || 'Solar Panels',
    water_management: t('admin.improvements.waterManagement') || 'Water Management',
    insulation: t('admin.improvements.insulation') || 'Insulation',
    cooling: t('admin.improvements.cooling') || 'Cooling',
    biodiversity: t('admin.improvements.biodiversity') || 'Biodiversity',
  };

  const totalPercentage = improvements.reduce((sum, imp) => sum + imp.percentage, 0);
  const remainingPercentage = 100 - totalPercentage;

  const activeImprovements = improvements.filter(imp => imp.percentage > 0);

  return (
    <div className='bg-white rounded-lg border border-slate-200 p-6'>
      <h3 className='text-lg font-semibold mb-4'>
        {t('admin.improvements.roofDivision') || 'Roof Area Division'}
      </h3>

      {/* Horizontal Bar Chart */}
      <div className='mb-6'>
        <div className='flex h-12 rounded-lg overflow-hidden border-2 border-gray-300'>
          {activeImprovements.map(improvement => (
            <div
              key={improvement.type}
              className={`${improvementColors[improvement.type]} transition-all`}
              style={{ width: `${improvement.percentage}%` }}
              title={`${improvementLabels[improvement.type]}: ${improvement.percentage}%`}
            />
          ))}
          {remainingPercentage > 0 && (
            <div
              className='bg-gray-200'
              style={{ width: `${remainingPercentage}%` }}
              title={`Unallocated: ${remainingPercentage}%`}
            />
          )}
        </div>
        <div className='flex justify-between text-xs text-gray-500 mt-2'>
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Legend */}
      <div className='space-y-2'>
        {activeImprovements.map(improvement => {
          const area = roofArea * (improvement.percentage / 100);
          return (
            <div
              key={improvement.type}
              className='flex items-center justify-between p-2 bg-gray-50 rounded'
            >
              <div className='flex items-center space-x-3'>
                <div className={`w-4 h-4 rounded ${improvementColors[improvement.type]}`} />
                <span className='text-sm font-medium text-gray-700'>
                  {improvementLabels[improvement.type]}
                </span>
              </div>
              <div className='text-right'>
                <span className='text-sm font-semibold text-gray-900'>
                  {improvement.percentage}%
                </span>
                <span className='text-xs text-gray-500 ml-2'>({area.toFixed(1)} m²)</span>
              </div>
            </div>
          );
        })}
        {remainingPercentage > 0 && (
          <div className='flex items-center justify-between p-2 bg-gray-50 rounded'>
            <div className='flex items-center space-x-3'>
              <div className='w-4 h-4 rounded bg-gray-300' />
              <span className='text-sm font-medium text-gray-700'>
                {t('admin.improvements.unallocated') || 'Unallocated'}
              </span>
            </div>
            <div className='text-right'>
              <span className='text-sm font-semibold text-gray-900'>{remainingPercentage}%</span>
              <span className='text-xs text-gray-500 ml-2'>
                ({(roofArea * (remainingPercentage / 100)).toFixed(1)} m²)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Total Summary */}
      <div className='mt-4 pt-4 border-t border-gray-200'>
        <div className='flex justify-between items-center'>
          <span className='text-sm font-medium text-gray-700'>
            {t('admin.improvements.totalAllocated') || 'Total Allocated'}
          </span>
          <span
            className={`text-lg font-bold ${
              totalPercentage === 100
                ? 'text-green-600'
                : totalPercentage > 100
                  ? 'text-red-600'
                  : 'text-yellow-600'
            }`}
          >
            {totalPercentage}%
          </span>
        </div>
        {totalPercentage > 100 && (
          <p className='text-xs text-red-600 mt-1'>
            {t('admin.improvements.overAllocated') || 'Warning: Total exceeds 100%'}
          </p>
        )}
        {totalPercentage < 100 && remainingPercentage > 5 && (
          <p className='text-xs text-gray-500 mt-1'>
            {t('admin.improvements.underAllocated') || 'You can allocate more area to improvements'}
          </p>
        )}
      </div>
    </div>
  );
};

export default RoofDivisionVisualization;
