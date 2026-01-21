/**
 * Roof For Good ESG Calculator Component
 *
 * Multi-step wizard for calculating environmental impact of roof projects:
 * - Step 1: Select role/expertise level
 * - Step 2: Project location
 * - Step 3: Roof configuration with 4 division areas
 * - Step 4: Results and environmental impact analysis
 *
 * Adapted from Taklaget Roof For Good calculator
 */

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Leaf,
  Wind,
  Droplets,
  Users,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useIntl } from '../../hooks/useIntl';
import { useToast } from '../../contexts/ToastContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { Building, RoofDivisionAreas, ESGMetrics } from '../../types';
import { calculateESGFromDivisions } from '../../utils/esgCalculations';
import { getCurrencyCode, formatCurrency } from '../../utils/currency';
import type { SupportedLocale } from '../../utils/geolocation';

interface RoofSegment {
  id: number;
  name: string;
  percentage: number;
  area: number;
  solution: string;
  costPerSqm: number;
  benefits: string[];
  co2Offset: number;
  energy: number;
  lifespan: number;
  icon: React.ReactNode;
}

interface CalculatorState {
  step: number;
  totalRoofSize: number;
  selectedRole: 'homeowner' | 'professional' | 'investor' | null;
  location: {
    address: string;
    latitude?: number;
    longitude?: number;
    country?: string;
  };
  segments: RoofSegment[];
  metrics: ESGMetrics | null;
  loading: boolean;
  errors: { [key: string]: string };
}

const DEFAULT_SEGMENTS: RoofSegment[] = [
  {
    id: 1,
    name: 'Green Roof Area',
    percentage: 25,
    area: 0,
    solution: 'Green Roof System',
    costPerSqm: 45,
    benefits: ['Living roof with plants', 'Improves insulation', 'Enhances air quality'],
    co2Offset: 525,
    energy: 375,
    lifespan: 40,
    icon: <Leaf className='w-4 h-4' />,
  },
  {
    id: 2,
    name: 'NOₓ Reduction Area',
    percentage: 25,
    area: 0,
    solution: 'Photocatalytic Coating',
    costPerSqm: 3.12,
    benefits: ['Reduces air pollution', 'Photocatalytic technology', 'Sustainable material'],
    co2Offset: 485,
    energy: 0,
    lifespan: 15,
    icon: <Wind className='w-4 h-4' />,
  },
  {
    id: 3,
    name: 'Cool Roof Area',
    percentage: 25,
    area: 0,
    solution: 'White - Cool Roof Coating',
    costPerSqm: 55.55,
    benefits: ['Reflects sunlight', 'Reduces cooling costs', 'Lowers CO₂ emissions'],
    co2Offset: 1663,
    energy: 2125,
    lifespan: 20,
    icon: <Droplets className='w-4 h-4' />,
  },
  {
    id: 4,
    name: 'Social Activities Area',
    percentage: 25,
    area: 0,
    solution: 'Social Activities Area',
    costPerSqm: 64,
    benefits: ['Relaxation area', 'Furniture and plants', 'Community gathering space'],
    co2Offset: 125,
    energy: 0,
    lifespan: 25,
    icon: <Users className='w-4 h-4' />,
  },
];

const RoofForGoodCalculator: React.FC<{ building?: Building }> = ({ building }) => {
  const { t, locale } = useIntl();
  const { showSuccess, showError } = useToast();
  const currencyCode = getCurrencyCode(locale as SupportedLocale);

  const [state, setState] = useState<CalculatorState>({
    step: 1,
    totalRoofSize: building?.roofSize || 0,
    selectedRole: null,
    location: {
      address: building?.address || '',
      latitude: building?.latitude,
      longitude: building?.longitude,
    },
    segments: DEFAULT_SEGMENTS.map(seg => ({
      ...seg,
      area: building?.roofSize ? (building.roofSize * seg.percentage) / 100 : 0,
    })),
    metrics: null,
    loading: false,
    errors: {},
  });

  const handleRoofSizeChange = (size: string) => {
    const numSize = parseFloat(size) || 0;
    setState(prev => ({
      ...prev,
      totalRoofSize: numSize,
      segments: prev.segments.map(seg => ({
        ...seg,
        area: numSize > 0 ? (numSize * seg.percentage) / 100 : 0,
      })),
    }));
  };

  const handleSegmentPercentageChange = (id: number, percentage: number) => {
    const newSegments = state.segments.map(seg =>
      seg.id === id
        ? {
            ...seg,
            percentage,
            area: state.totalRoofSize > 0 ? (state.totalRoofSize * percentage) / 100 : 0,
          }
        : seg
    );

    // Auto-adjust other segments to maintain 100%
    const otherSegments = newSegments.filter(s => s.id !== id);
    const totalOtherPercentage = otherSegments.reduce((sum, s) => sum + s.percentage, 0);
    const remainingPercentage = 100 - percentage;

    if (totalOtherPercentage > 0) {
      const scaleFactor = remainingPercentage / totalOtherPercentage;
      const adjusted = newSegments.map(seg =>
        seg.id !== id
          ? {
              ...seg,
              percentage: Math.round(seg.percentage * scaleFactor * 10) / 10,
              area:
                state.totalRoofSize > 0
                  ? (state.totalRoofSize * (Math.round(seg.percentage * scaleFactor * 10) / 10)) /
                    100
                  : 0,
            }
          : seg
      );
      setState(prev => ({ ...prev, segments: adjusted }));
    } else {
      setState(prev => ({ ...prev, segments: newSegments }));
    }
  };

  const calculateMetrics = () => {
    if (state.totalRoofSize <= 0) {
      setState(prev => ({
        ...prev,
        errors: { roof: t('esg.calculator.errors.roofSizeRequired') || 'Roof size is required' },
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      const divisions: RoofDivisionAreas = {
        greenRoof: state.segments[0].percentage,
        noxReduction: state.segments[1].percentage,
        coolRoof: state.segments[2].percentage,
        socialActivities: state.segments[3].percentage,
      };

      const metrics = calculateESGFromDivisions(state.totalRoofSize, divisions);
      setState(prev => ({
        ...prev,
        metrics,
        loading: false,
        errors: {},
      }));

      if (state.step === 3) {
        setTimeout(() => {
          setState(prev => ({ ...prev, step: 4 }));
        }, 500);
      }
    } catch (error) {
      showError(t('esg.calculator.errors.calculationFailed') || 'Calculation failed');
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const getTotalAllocation = () => {
    return state.segments.reduce((sum, seg) => sum + seg.percentage, 0);
  };

  const getTotalCost = () => {
    return state.segments.reduce((sum, seg) => sum + seg.area * seg.costPerSqm, 0);
  };

  const getTotalCO2 = () => {
    return state.segments.reduce((sum, seg) => sum + seg.co2Offset, 0);
  };

  const getTotalEnergy = () => {
    return state.segments.reduce((sum, seg) => sum + seg.energy, 0);
  };

  const handleNext = () => {
    if (state.step === 1 && !state.selectedRole) {
      setState(prev => ({
        ...prev,
        errors: { role: t('esg.calculator.errors.roleRequired') || 'Please select a role' },
      }));
      return;
    }
    if (state.step === 2 && !state.location.address) {
      setState(prev => ({
        ...prev,
        errors: {
          location: t('esg.calculator.errors.locationRequired') || 'Please enter a location',
        },
      }));
      return;
    }
    if (state.step === 3 && state.totalRoofSize <= 0) {
      setState(prev => ({
        ...prev,
        errors: { roof: t('esg.calculator.errors.roofSizeRequired') || 'Please enter roof size' },
      }));
      return;
    }

    if (state.step === 3) {
      calculateMetrics();
    } else {
      setState(prev => ({ ...prev, step: prev.step + 1, errors: {} }));
    }
  };

  const handleBack = () => {
    setState(prev => ({ ...prev, step: Math.max(1, prev.step - 1), errors: {} }));
  };

  const renderStep1 = () => (
    <div className='space-y-6'>
      <div className='text-center mb-8'>
        <h2 className='text-3xl font-bold text-slate-900 mb-2'>
          {t('esg.calculator.step1.title') || 'Select Your Role'}
        </h2>
        <p className='text-slate-600'>
          {t('esg.calculator.step1.subtitle') || 'Tell us about your expertise level'}
        </p>
      </div>

      <div className='grid md:grid-cols-3 gap-4'>
        {[
          {
            value: 'homeowner',
            label: t('esg.calculator.roles.homeowner') || 'Homeowner',
            icon: '🏠',
          },
          {
            value: 'professional',
            label: t('esg.calculator.roles.professional') || 'Professional',
            icon: '👔',
          },
          {
            value: 'investor',
            label: t('esg.calculator.roles.investor') || 'Investor',
            icon: '💼',
          },
        ].map(role => (
          <button
            key={role.value}
            onClick={() => setState(prev => ({ ...prev, selectedRole: role.value as any }))}
            className={`p-6 rounded-lg border-2 transition-all cursor-pointer text-center ${
              state.selectedRole === role.value
                ? 'border-blue-600 bg-blue-50'
                : 'border-slate-200 hover:border-blue-300'
            }`}
          >
            <div className='text-4xl mb-3'>{role.icon}</div>
            <h3 className='font-semibold text-slate-900'>{role.label}</h3>
          </button>
        ))}
      </div>

      {state.errors.role && (
        <div className='text-red-600 text-sm text-center'>{state.errors.role}</div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className='space-y-6'>
      <div className='text-center mb-8'>
        <MapPin className='w-12 h-12 text-blue-600 mx-auto mb-3' />
        <h2 className='text-3xl font-bold text-slate-900 mb-2'>
          {t('esg.calculator.step2.title') || 'Project Location'}
        </h2>
        <p className='text-slate-600 text-sm'>
          {t('esg.calculator.step2.subtitle') ||
            'Location helps us provide accurate environmental data and local incentives.'}
        </p>
      </div>

      <div className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-slate-900 mb-2'>
            {t('esg.calculator.step2.address') || 'Project Address'}
          </label>
          <div className='flex gap-2'>
            <input
              type='text'
              value={state.location.address}
              onChange={e =>
                setState(prev => ({
                  ...prev,
                  location: { ...prev.location, address: e.target.value },
                }))
              }
              placeholder={t('esg.calculator.step2.addressPlaceholder') || 'Enter full address'}
              className='flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none'
            />
            <button className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium'>
              {t('esg.calculator.step2.useLocation') || 'Use Current'}
            </button>
          </div>
          {state.location.address && (
            <p className='mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-slate-700'>
              <MapPin className='w-4 h-4 inline mr-2' />
              {state.location.address}
            </p>
          )}
        </div>
      </div>

      {state.errors.location && <div className='text-red-600 text-sm'>{state.errors.location}</div>}
    </div>
  );

  const renderStep3 = () => {
    const totalAllocation = getTotalAllocation();

    return (
      <div className='space-y-8'>
        <div className='bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6'>
          <h2 className='text-2xl font-bold text-slate-900 mb-2'>
            {t('esg.calculator.step3.title') || 'Roof Configuration'}
          </h2>
          <p className='text-slate-600 mb-4'>
            {t('esg.calculator.step3.subtitle') ||
              'Configure your roof segments and see environmental impact in real-time'}
          </p>

          <div className='grid md:grid-cols-4 gap-4 mt-6'>
            <div>
              <label className='block text-sm font-medium text-slate-900 mb-2'>
                {t('esg.calculator.step3.totalRoofSize') || 'Total Roof Size'}
              </label>
              <div className='flex gap-2'>
                <input
                  type='number'
                  value={state.totalRoofSize || ''}
                  onChange={e => handleRoofSizeChange(e.target.value)}
                  placeholder='1000'
                  className='flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none'
                />
                <span className='flex items-center px-3 bg-slate-100 rounded-lg text-sm font-medium text-slate-600'>
                  m²
                </span>
              </div>
              <p className='mt-2 text-sm text-slate-600'>
                {state.totalRoofSize > 0 ? `${state.totalRoofSize.toLocaleString()}m²` : ''}
              </p>
            </div>

            <div>
              <label className='block text-sm font-medium text-slate-900 mb-2'>
                {t('esg.calculator.step3.segments') || 'Segments'}
              </label>
              <div className='px-3 py-2 bg-slate-100 rounded-lg text-xl font-bold text-slate-900'>
                {state.segments.length}
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-slate-900 mb-2'>
                {t('esg.calculator.step3.allocated') || 'Allocated'}
              </label>
              <div
                className={`px-3 py-2 rounded-lg text-xl font-bold ${
                  totalAllocation === 100
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {totalAllocation}%
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-slate-900 mb-2'>
                {t('esg.calculator.step3.roofAllocation') || 'Allocation'}
              </label>
              <div className='px-3 py-2 bg-blue-100 rounded-lg text-xl font-bold text-blue-700'>
                {totalAllocation}% of 100%
              </div>
            </div>
          </div>
        </div>

        {state.errors.roof && <div className='text-red-600 text-sm'>{state.errors.roof}</div>}

        {/* Segments */}
        <div className='space-y-6'>
          <div className='flex justify-between items-center'>
            <h3 className='text-lg font-semibold text-slate-900'>
              {t('esg.calculator.step3.roofSegments') || 'Roof Segments'}
            </h3>
            <p className='text-sm text-slate-600'>
              {t('esg.calculator.step3.configureAreas') ||
                'Configure different areas with specific solutions'}
            </p>
          </div>

          {state.segments.map((segment, idx) => (
            <div key={segment.id} className='bg-white border border-slate-200 rounded-lg p-6'>
              <div className='flex items-start justify-between mb-4'>
                <div className='flex items-center gap-3'>
                  <div className='w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold'>
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className='font-semibold text-slate-900'>{segment.name}</h4>
                    <p className='text-sm text-slate-600'>
                      {segment.area.toLocaleString()} m² ({segment.percentage}%)
                    </p>
                  </div>
                </div>
                <span className='text-right'>
                  <p className='font-bold text-lg text-slate-900'>
                    {formatCurrency(segment.area * segment.costPerSqm, locale as SupportedLocale)}
                  </p>
                  <p className='text-xs text-slate-600'>
                    {t('esg.calculator.step3.totalCost') || 'Total Cost'}
                  </p>
                </span>
              </div>

              <div className='grid md:grid-cols-2 gap-6 mb-4'>
                <div>
                  <label className='block text-sm font-medium text-slate-900 mb-2'>
                    {t('esg.calculator.step3.percentage') || 'Percentage'}
                  </label>
                  <div className='flex gap-2'>
                    <input
                      type='number'
                      value={segment.percentage}
                      onChange={e =>
                        handleSegmentPercentageChange(segment.id, parseFloat(e.target.value) || 0)
                      }
                      min='0'
                      max='100'
                      className='flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none'
                    />
                    <span className='flex items-center px-3 bg-slate-100 rounded-lg text-sm font-medium'>
                      %
                    </span>
                  </div>
                  <p className='mt-2 text-sm text-slate-600'>
                    = {segment.area.toLocaleString()} m²
                  </p>
                </div>

                <div>
                  <label className='block text-sm font-medium text-slate-900 mb-2'>
                    {t('esg.calculator.step3.solution') || 'Roof Solution'}
                  </label>
                  <div className='px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-900 font-medium'>
                    <CheckCircle2 className='w-4 h-4 inline mr-2 text-green-600' />
                    {segment.solution}
                  </div>
                </div>
              </div>

              <div className='bg-slate-50 rounded-lg p-4 mb-4'>
                <p className='text-sm font-medium text-slate-900 mb-2'>
                  {t('esg.calculator.step3.benefits') || 'Benefits:'}
                </p>
                <ul className='space-y-1'>
                  {segment.benefits.map((benefit, i) => (
                    <li key={i} className='text-sm text-slate-600'>
                      • {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              <div className='grid md:grid-cols-4 gap-4 text-center'>
                <div>
                  <p className='text-lg font-bold text-slate-900'>{segment.co2Offset}</p>
                  <p className='text-xs text-slate-600 font-medium'>kg CO₂/year</p>
                </div>
                <div>
                  <p className='text-lg font-bold text-slate-900'>
                    {segment.energy.toLocaleString()}
                  </p>
                  <p className='text-xs text-slate-600 font-medium'>kWh/year</p>
                </div>
                <div>
                  <p className='text-lg font-bold text-slate-900'>{segment.lifespan}</p>
                  <p className='text-xs text-slate-600 font-medium'>Years Lifespan</p>
                </div>
                <div>
                  <p className='text-lg font-bold text-slate-900'>{totalAllocation}%</p>
                  <p className='text-xs text-slate-600 font-medium'>Allocation</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {totalAllocation !== 100 && (
          <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3'>
            <AlertCircle className='w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5' />
            <p className='text-sm text-yellow-800'>
              {t('esg.calculator.step3.allocationWarning') ||
                `Roof allocation must equal 100%. Currently at ${totalAllocation}%`}
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderStep4 = () => {
    if (state.loading) {
      return (
        <div className='flex items-center justify-center py-12'>
          <LoadingSpinner />
        </div>
      );
    }

    if (!state.metrics) {
      return (
        <div className='text-center py-12'>
          <AlertCircle className='w-16 h-16 text-slate-400 mx-auto mb-4' />
          <p className='text-slate-600'>
            {t('esg.calculator.step4.noMetrics') || 'No metrics calculated'}
          </p>
        </div>
      );
    }

    const metrics = state.metrics;
    const totalCost = getTotalCost();
    const totalCO2 = getTotalCO2();
    // Calculate annual savings from energy savings (using average electricity price)
    const annualSavings = (metrics.energySavingsKwhPerYear || 0) * 0.25 || 625;
    const paybackYears = totalCost > 0 ? Math.round((totalCost / annualSavings) * 10) / 10 : 0;
    const totalAllocation = getTotalAllocation();

    return (
      <div className='space-y-8'>
        {/* Header */}
        <div className='bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 text-center'>
          <div className='flex items-center justify-center gap-2 mb-2'>
            <CheckCircle2 className='w-6 h-6 text-green-600' />
            <p className='text-green-700 font-medium'>
              {t('esg.calculator.step4.complete') || 'Analysis complete'}
            </p>
          </div>
          <h2 className='text-3xl font-bold text-slate-900 mb-2'>
            {t('esg.calculator.step4.title') || 'Your Roof For Good Analysis'}
          </h2>
          <p className='text-slate-600'>
            {t('esg.calculator.step4.subtitle') ||
              'Comprehensive analysis of your 4 roof sections and their environmental impact'}
          </p>
        </div>

        {/* Summary Cards */}
        <div className='grid md:grid-cols-4 gap-4'>
          <div className='bg-white border border-slate-200 rounded-lg p-4 text-center'>
            <p className='text-2xl font-bold text-blue-600'>{totalCO2}</p>
            <p className='text-xs text-slate-600 font-medium mt-1'>
              {t('esg.calculator.step4.co2Offset') || 'kg CO₂ Offset/Year'}
            </p>
          </div>
          <div className='bg-white border border-slate-200 rounded-lg p-4 text-center'>
            <p className='text-2xl font-bold text-green-600'>
              {formatCurrency(annualSavings, locale as SupportedLocale)}
            </p>
            <p className='text-xs text-slate-600 font-medium mt-1'>
              {t('esg.calculator.step4.annualSavings') || 'Annual Savings'}
            </p>
          </div>
          <div className='bg-white border border-slate-200 rounded-lg p-4 text-center'>
            <p className='text-2xl font-bold text-purple-600'>{paybackYears}</p>
            <p className='text-xs text-slate-600 font-medium mt-1'>
              {t('esg.calculator.step4.paybackPeriod') || 'Payback Period (Years)'}
            </p>
          </div>
          <div className='bg-white border border-slate-200 rounded-lg p-4 text-center'>
            <p className='text-2xl font-bold text-slate-900'>
              {formatCurrency(totalCost, locale as SupportedLocale)}
            </p>
            <p className='text-xs text-slate-600 font-medium mt-1'>
              {t('esg.calculator.step4.totalInvestment') || 'Total Investment'}
            </p>
          </div>
        </div>

        {/* Executive Summary */}
        <div className='bg-white border border-slate-200 rounded-lg p-6'>
          <h3 className='text-xl font-semibold text-slate-900 mb-4'>
            {t('esg.calculator.step4.executiveSummary') || 'Executive Summary'}
          </h3>
          <p className='text-slate-600 mb-4'>
            {t('esg.calculator.step4.executiveSummaryText') ||
              'Your roof configuration will deliver significant environmental and financial benefits'}
          </p>

          <div className='grid md:grid-cols-3 gap-6'>
            <div>
              <p className='text-3xl font-bold text-slate-900'>{totalCO2}</p>
              <p className='text-sm text-slate-600 mt-1'>
                {t('esg.calculator.step4.environmentalImpact') || 'Environmental Impact'}
              </p>
              <p className='text-xs text-slate-600 mt-2'>kg per year</p>
            </div>
            <div>
              <p className='text-3xl font-bold text-slate-900'>
                {formatCurrency(annualSavings, locale as SupportedLocale)}
              </p>
              <p className='text-sm text-slate-600 mt-1'>
                {t('esg.calculator.step4.financialImpact') || 'Financial Impact'}
              </p>
              <p className='text-xs text-slate-600 mt-2'>Per year</p>
            </div>
            <div>
              <p className='text-3xl font-bold text-slate-900'>{paybackYears}</p>
              <p className='text-sm text-slate-600 mt-1'>
                {t('esg.calculator.step4.paybackPeriod') || 'Payback Period'}
              </p>
              <p className='text-xs text-slate-600 mt-2'>Years</p>
            </div>
          </div>
        </div>

        {/* Segments Breakdown */}
        <div className='space-y-4'>
          <h3 className='text-xl font-semibold text-slate-900'>
            {t('esg.calculator.step4.segmentBreakdown') || 'Roof Segments Breakdown'}
          </h3>

          {state.segments.map((segment, idx) => (
            <div key={segment.id} className='bg-white border border-slate-200 rounded-lg p-4'>
              <div className='flex items-start justify-between mb-3'>
                <div className='flex items-center gap-3'>
                  <div className='w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold'>
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className='font-semibold text-slate-900'>{segment.name}</h4>
                    <p className='text-sm text-slate-600'>
                      {segment.percentage}% ({segment.area.toLocaleString()} m²) •{' '}
                      {segment.solution}
                    </p>
                  </div>
                </div>
                <span className='text-right'>
                  <p className='font-bold text-slate-900'>
                    {formatCurrency(segment.area * segment.costPerSqm, locale as SupportedLocale)}
                  </p>
                  <p className='text-xs text-slate-600'>
                    {t('esg.calculator.step4.totalCost') || 'Total Cost'}
                  </p>
                </span>
              </div>

              <div className='grid md:grid-cols-4 gap-4 text-center text-sm'>
                <div>
                  <p className='font-bold text-slate-900'>{segment.co2Offset}</p>
                  <p className='text-xs text-slate-600'>kg CO₂/year</p>
                </div>
                <div>
                  <p className='font-bold text-slate-900'>{segment.energy.toLocaleString()}</p>
                  <p className='text-xs text-slate-600'>kWh/year</p>
                </div>
                <div>
                  <p className='font-bold text-slate-900'>{segment.lifespan}</p>
                  <p className='text-xs text-slate-600'>Years Lifespan</p>
                </div>
                <div>
                  <p className='font-bold text-slate-900'>{totalAllocation}%</p>
                  <p className='text-xs text-slate-600'>Allocation</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Environmental Impact */}
        <div className='bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6'>
          <div className='flex items-center gap-2 mb-4'>
            <Leaf className='w-6 h-6 text-green-600' />
            <h3 className='text-xl font-semibold text-slate-900'>
              {t('esg.calculator.step4.environmentalImpactDetail') || 'Environmental Impact'}
            </h3>
          </div>

          <p className='text-sm text-slate-600 mb-4'>
            {t('esg.calculator.step4.environmentalImpactText') ||
              "Your roof system's positive environmental impact expressed in relatable terms"}
          </p>

          <div className='grid md:grid-cols-3 gap-6'>
            <div className='text-center'>
              <p className='text-4xl font-bold text-green-600'>≈ {Math.round(totalCO2 / 22)}</p>
              <p className='text-sm font-medium text-slate-900 mt-2'>
                {t('esg.calculator.step4.treesEquivalent') || 'Trees Equivalent'}
              </p>
              <p className='text-xs text-slate-600 mt-1'>
                {t('esg.calculator.step4.co2AbsorptionPerYear') || 'CO₂ absorption per year'} ≈{' '}
                {totalCO2} kg CO₂/year
              </p>
            </div>
            <div className='text-center'>
              <p className='text-4xl font-bold text-blue-600'>
                {getTotalEnergy().toLocaleString()}
              </p>
              <p className='text-sm font-medium text-slate-900 mt-2'>
                {t('esg.calculator.step4.kwhEnergyImpact') || 'kWh Energy Impact'}
              </p>
              <p className='text-xs text-slate-600 mt-1'>
                {t('esg.calculator.step4.savingsAndGeneration') || 'Savings + generation'}
              </p>
            </div>
            <div className='text-center'>
              <p className='text-4xl font-bold text-cyan-600'>
                {((totalCO2 / 22) * 100).toLocaleString()}
              </p>
              <p className='text-sm font-medium text-slate-900 mt-2'>
                {t('esg.calculator.step4.noxReduction') || 'kg NOₓ Reduction'}
              </p>
              <p className='text-xs text-slate-600 mt-1'>
                {t('esg.calculator.step4.airQualityImprovement') || 'Air quality improvement'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100'>
      {/* Header */}
      <div className='bg-white border-b border-slate-200 sticky top-0 z-10'>
        <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-lg bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center'>
                <Leaf className='w-6 h-6 text-white' />
              </div>
              <div>
                <h1 className='text-2xl font-bold text-slate-900'>
                  {t('esg.calculator.title') || 'Roof For Good'}
                </h1>
                <p className='text-sm text-slate-600'>
                  {t('esg.calculator.subtitle') || 'Design Your Roof For Good'}
                </p>
              </div>
            </div>

            <div className='text-right'>
              <p className='text-sm font-medium text-slate-900'>
                {t('esg.calculator.step') || 'Step'} {state.step} {t('esg.calculator.of') || 'of'} 4
              </p>
              <div className='mt-2 flex gap-1'>
                {[1, 2, 3, 4].map(step => (
                  <div
                    key={step}
                    className={`h-2 w-8 rounded-full ${
                      step <= state.step ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-8'>
          {state.step === 1 && renderStep1()}
          {state.step === 2 && renderStep2()}
          {state.step === 3 && renderStep3()}
          {state.step === 4 && renderStep4()}
        </div>

        {/* Navigation */}
        <div className='mt-8 flex justify-between items-center'>
          <button
            onClick={handleBack}
            disabled={state.step === 1}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              state.step === 1
                ? 'text-slate-400 cursor-not-allowed'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ChevronLeft className='w-5 h-5' />
            {t('common.back') || 'Back'}
          </button>

          <div className='flex gap-3'>
            {state.step === 4 && (
              <button
                onClick={() =>
                  showSuccess(t('esg.calculator.reportSaved') || 'Report saved successfully!')
                }
                className='px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-all'
              >
                {t('esg.calculator.step4.viewResults') || 'View Results'}
              </button>
            )}
            {state.step < 4 && (
              <button
                onClick={handleNext}
                disabled={state.loading}
                className='flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-all disabled:bg-slate-400'
              >
                {state.loading ? (
                  <>
                    <Loader2 className='w-5 h-5 animate-spin' />
                    {t('common.calculating') || 'Calculating...'}
                  </>
                ) : (
                  <>
                    {state.step === 3
                      ? t('esg.calculator.calculate') || 'Calculate Impact'
                      : t('common.next') || 'Next'}
                    <ChevronRight className='w-5 h-5' />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className='bg-white border-t border-slate-200 mt-16 py-8'>
        <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-600'>
          <p>
            © 2025 Agritectum - {t('esg.calculator.footer') || 'Sustainable Building Solutions'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoofForGoodCalculator;
