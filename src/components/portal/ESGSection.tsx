/**
 * ESG Section Component
 *
 * Displays ESG metrics for a building including:
 * - Sustainability score
 * - Carbon footprint
 * - Solar potential
 * - Recycling potential
 * - SDG alignment
 *
 * Adapted from agritectum-roof-calculator/src/components/ESGDashboard.tsx
 */

import React from 'react';
import {
  Leaf,
  Sun,
  Recycle,
  TrendingUp,
  Target,
  Award,
  Calendar,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { ESGMetrics } from '../../types';
import { useIntl } from '../../hooks/useIntl';
import ListCard from '../shared/cards/ListCard';
import IconLabel from '../shared/layouts/IconLabel';
import StatusBadge from '../shared/badges/StatusBadge';

interface ESGSectionProps {
  metrics: ESGMetrics | null;
  loading?: boolean;
  error?: string | null;
}

const ESGSection: React.FC<ESGSectionProps> = ({ metrics, loading = false, error = null }) => {
  const { t } = useIntl();

  if (loading) {
    return (
      <div className='bg-white rounded-lg shadow p-6 border border-slate-200'>
        <div className='flex items-center justify-center py-12'>
          <Loader2 className='w-8 h-8 text-green-600 animate-spin' />
          <span className='ml-3 text-gray-600'>
            {t('buildings.esg.calculating') || 'Calculating ESG metrics...'}
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-white rounded-lg shadow p-6 border border-slate-200'>
        <div className='flex items-center space-x-3 text-red-600'>
          <AlertCircle className='w-5 h-5' />
          <p>{error || t('buildings.esg.error') || 'Failed to load ESG metrics'}</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className='bg-white rounded-lg shadow p-6 border border-slate-200'>
        <div className='text-center py-12'>
          <Leaf className='w-16 h-16 text-gray-400 mx-auto mb-4' />
          <p className='text-gray-600'>
            {t('buildings.esg.noData') || 'ESG metrics not available for this building'}
          </p>
        </div>
      </div>
    );
  }

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
    <div className='space-y-6'>
      {/* Header */}
      <div className='bg-white rounded-lg shadow p-6 border border-slate-200'>
        <h2 className='text-xl font-semibold mb-4 flex items-center'>
          <Leaf className='w-5 h-5 mr-2 text-green-600' />
          {t('buildings.esg.title') || 'ESG Metrics'}
        </h2>
        <p className='text-sm text-gray-600 mb-4'>
          {t('buildings.esg.description') ||
            'Environmental, Social, and Governance metrics for this building'}
        </p>
      </div>

      {/* Key Metrics Summary */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {/* Sustainability Score */}
        <ListCard>
          <div className='text-center'>
            <div
              className={`inline-flex items-center justify-center w-16 h-16 rounded-full border-4 mb-3 ${getScoreBgColor(
                metrics.sustainabilityScore
              )} ${getScoreColor(metrics.sustainabilityScore)}`}
            >
              <span className='text-2xl font-bold'>{metrics.sustainabilityScore}</span>
            </div>
            <p className='text-sm font-medium text-gray-900'>
              {t('buildings.esg.sustainabilityScore') || 'Sustainability Score'}
            </p>
            <p className='text-xs text-gray-500 mt-1'>{metrics.rating}</p>
          </div>
        </ListCard>

        {/* Carbon Footprint */}
        <ListCard>
          <div className='text-center'>
            <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 border-4 border-blue-200 mb-3'>
              <TrendingUp className='w-8 h-8 text-blue-600' />
            </div>
            <p className='text-2xl font-bold text-blue-600'>
              {metrics.carbonFootprint.toLocaleString()}
            </p>
            <p className='text-sm font-medium text-gray-900'>
              {t('buildings.esg.carbonFootprint') || 'Carbon Footprint'}
            </p>
            <p className='text-xs text-gray-500 mt-1'>kg CO₂</p>
          </div>
        </ListCard>

        {/* Solar Potential */}
        <ListCard>
          <div className='text-center'>
            <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-50 border-4 border-yellow-200 mb-3'>
              <Sun className='w-8 h-8 text-yellow-600' />
            </div>
            <p className='text-2xl font-bold text-yellow-600'>
              {metrics.solarPotential.toLocaleString()}
            </p>
            <p className='text-sm font-medium text-gray-900'>
              {t('buildings.esg.solarPotential') || 'Solar Potential'}
            </p>
            <p className='text-xs text-gray-500 mt-1'>kWh/year</p>
          </div>
        </ListCard>

        {/* Recycling Potential */}
        <ListCard>
          <div className='text-center'>
            <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 border-4 border-green-200 mb-3'>
              <Recycle className='w-8 h-8 text-green-600' />
            </div>
            <p className='text-2xl font-bold text-green-600'>{metrics.recyclingPotential}%</p>
            <p className='text-sm font-medium text-gray-900'>
              {t('buildings.esg.recyclingPotential') || 'Recycling Potential'}
            </p>
            <p className='text-xs text-gray-500 mt-1'>
              {t('buildings.esg.materialRecyclable') || 'Material recyclable'}
            </p>
          </div>
        </ListCard>
      </div>

      {/* Detailed Metrics */}
      <div className='bg-white rounded-lg shadow p-6 border border-slate-200'>
        <h3 className='text-lg font-semibold mb-4 flex items-center'>
          <Target className='w-5 h-5 mr-2 text-green-600' />
          {t('buildings.esg.detailedMetrics') || 'Detailed Metrics'}
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-4'>
            <IconLabel
              icon={TrendingUp}
              label={t('buildings.esg.annualCO2Offset') || 'Annual CO₂ Offset'}
              value={`${metrics.annualCO2Offset.toLocaleString()} kg CO₂/year`}
            />
            {metrics.neutralityTimeline && (
              <IconLabel
                icon={Calendar}
                label={t('buildings.esg.neutralityTimeline') || 'CO₂ Neutrality Timeline'}
                value={`${metrics.neutralityTimeline} ${t('buildings.esg.years') || 'years'}`}
              />
            )}
            <IconLabel
              icon={Award}
              label={t('buildings.esg.rating') || 'Sustainability Rating'}
              value={metrics.rating}
            />
          </div>
          <div className='space-y-4'>
            <div>
              <p className='text-sm font-medium text-gray-700 mb-2'>
                {t('buildings.esg.sdgAlignment') || 'SDG Alignment'}
              </p>
              <div className='flex flex-wrap gap-2'>
                {metrics.sdgAlignment.length > 0 ? (
                  metrics.sdgAlignment.map(sdg => (
                    <StatusBadge
                      key={sdg}
                      status='active'
                      label={sdg}
                      className='bg-blue-100 text-blue-800'
                      useTranslation={false}
                    />
                  ))
                ) : (
                  <span className='text-sm text-gray-500'>
                    {t('buildings.esg.noSDGs') || 'No SDGs identified'}
                  </span>
                )}
              </div>
              <p className='text-xs text-gray-500 mt-2'>
                {t('buildings.esg.sdgScore') || 'SDG Score'}: {metrics.sdgScore}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className='bg-white rounded-lg shadow p-6 border border-slate-200'>
        <h3 className='text-lg font-semibold mb-4 flex items-center'>
          <Target className='w-5 h-5 mr-2 text-blue-600' />
          {t('buildings.esg.recommendations') || 'Recommendations'}
        </h3>
        <div className='space-y-3'>
          {metrics.sustainabilityScore < 60 && (
            <div className='p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
              <p className='text-sm text-gray-700'>
                {t('buildings.esg.recommendation.lowScore') ||
                  'Consider upgrading to more sustainable roofing materials to improve your ESG score.'}
              </p>
            </div>
          )}
          {metrics.solarPotential > 0 && (
            <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
              <p className='text-sm text-gray-700'>
                {t('buildings.esg.recommendation.solar') ||
                  `This building has significant solar potential (${metrics.solarPotential.toLocaleString()} kWh/year). Consider installing solar panels to reduce carbon footprint.`}
              </p>
            </div>
          )}
          {metrics.recyclingPotential >= 70 && (
            <div className='p-4 bg-green-50 border border-green-200 rounded-lg'>
              <p className='text-sm text-gray-700'>
                {t('buildings.esg.recommendation.recycling') ||
                  'Your roofing material has high recycling potential. Ensure proper recycling at end of life.'}
              </p>
            </div>
          )}
          {metrics.neutralityTimeline && metrics.neutralityTimeline > 20 && (
            <div className='p-4 bg-orange-50 border border-orange-200 rounded-lg'>
              <p className='text-sm text-gray-700'>
                {(
                  t('buildings.esg.recommendation.neutrality') ||
                  'CO₂ neutrality is projected in {years} years. Consider additional improvements to accelerate this timeline.'
                ).replace('{years}', metrics.neutralityTimeline.toString())}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Last Calculated */}
      {metrics.lastCalculated && (
        <div className='text-xs text-gray-500 text-center'>
          {t('buildings.esg.lastCalculated') || 'Last calculated'}:{' '}
          {new Date(metrics.lastCalculated).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

export default ESGSection;
