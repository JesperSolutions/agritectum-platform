/**
 * ESG Service Component
 *
 * Allows branch managers to create ESG service reports by:
 * - Selecting a building
 * - Confirming roof square meters
 * - Allocating percentages to 4 division areas (Green Roof, NOx Reduction, Cool Roof, Social Activities)
 * - Generating public report links for customers
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import CustomerSearch from './CustomerSearch';
import { useAuth } from '../../contexts/AuthContext';
import { useIntl } from '../../hooks/useIntl';
import { useToast } from '../../contexts/ToastContext';
import {
  Building as BuildingIcon,
  Search,
  Calculator,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Leaf,
  RefreshCw,
  Share2,
  Copy,
  Eye,
  X,
  Droplets,
  Zap,
  Wind,
  Users,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { Building, ESGMetrics, RoofDivisionAreas, Customer } from '../../types';
import { getBuildingsByCustomer, getBuildingById } from '../../services/buildingService';
import {
  createESGServiceReport,
  updateESGServiceReport,
  generatePublicESGReportLink,
  getESGServiceReportsByBuilding,
  getESGServiceReport,
} from '../../services/esgService';
import { calculateESGFromDivisions } from '../../utils/esgCalculations';
import LoadingSpinner from '../common/LoadingSpinner';

// Add CSS for range input styling
const rangeInputStyles = `
  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    cursor: pointer;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    border: 2px solid rgba(255, 255, 255, 0.8);
  }

  input[type="range"]::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    border: 2px solid rgba(255, 255, 255, 0.8);
  }

  input[type="range"]::-webkit-slider-runnable-track {
    width: 100%;
    height: 8px;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
  }

  input[type="range"]::-moz-range-track {
    width: 100%;
    height: 8px;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
  }
`;
import PageHeader from '../shared/layouts/PageHeader';
import ListCard from '../shared/cards/ListCard';
import IconLabel from '../shared/layouts/IconLabel';
import StatusBadge from '../shared/badges/StatusBadge';

// Dynamic logger import to avoid circular dependencies
let logger: any = {
  log: console.log,
  warn: console.warn,
  error: console.error,
};

(async () => {
  try {
    const loggerModule = await import('../../utils/logger');
    logger = loggerModule.logger;
  } catch (error) {
    console.warn('Failed to load logger module');
  }
})();

const ESGService: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useIntl();
  const { showSuccess, showError } = useToast();
  const [searchParams] = useSearchParams();

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingBuilding, setLoadingBuilding] = useState(false);
  const [loadingCalculation, setLoadingCalculation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [existingReportId, setExistingReportId] = useState<string | null>(null);

  // Form state
  const [roofSize, setRoofSize] = useState<string>('');
  const [divisions, setDivisions] = useState<RoofDivisionAreas>({
    greenRoof: 25,
    noxReduction: 25,
    coolRoof: 25,
    socialActivities: 25,
  });
  const [calculatedMetrics, setCalculatedMetrics] = useState<ESGMetrics | null>(null);
  const [publicLink, setPublicLink] = useState<string | null>(null);
  const [showPublicLinkModal, setShowPublicLinkModal] = useState(false);

  // Inline error state for validation
  const [inlineError, setInlineError] = useState<string | null>(null);

  // Check permissions
  if (!currentUser || (currentUser.role !== 'branchAdmin' && currentUser.role !== 'superadmin')) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center'>
        <div className='bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center'>
          <h1 className='text-2xl font-bold text-slate-900 mb-4'>
            {t('errors.access.denied') || 'Access Denied'}
          </h1>
          <p className='text-slate-600 mb-6'>
            {t('admin.esgService.accessDenied') || 'You do not have permission to access this page'}
          </p>
        </div>
      </div>
    );
  }

  // Load buildings for selected customer
  useEffect(() => {
    if (selectedCustomer) {
      loadBuildingsForCustomer(selectedCustomer.id);
    } else {
      setBuildings([]);
      setSelectedBuilding(null);
    }
  }, [selectedCustomer]);

  // Handle URL buildingId parameter
  useEffect(() => {
    const buildingIdParam = searchParams.get('buildingId');
    if (buildingIdParam && !selectedBuilding) {
      // Load building directly from URL parameter
      handleBuildingSelect(buildingIdParam);
    }
  }, [searchParams]);

  const loadBuildingsForCustomer = async (customerId: string) => {
    setLoadingBuildings(true);
    try {
      // Use the customer-aware API which will include branchId and fallback logic
      const buildingsForCustomer = await getBuildingsByCustomer(customerId, currentUser?.branchId);
      setBuildings(buildingsForCustomer || []);
    } catch (error) {
      console.error('Error loading buildings:', error);
      showError(t('admin.esgService.errorLoadingBuildings') || 'Failed to load buildings');
    } finally {
      setLoadingBuildings(false);
    }
  };

  const handleBuildingSelect = async (buildingId: string) => {
    logger.log('🏢 Selecting building:', buildingId);
    setLoadingBuilding(true);
    setCalculatedMetrics(null);
    setExistingReportId(null);
    setPublicLink(null);
    setInlineError(null);

    try {
      const building = await getBuildingById(buildingId);
      logger.log('🏢 Building loaded:', building);

      if (building) {
        setSelectedBuilding(building);
        setRoofSize(building.roofSize?.toString() || '');

        // Check if report already exists for this building
        try {
          logger.log('🔍 Checking for existing ESG reports...');
          const existingReports = await getESGServiceReportsByBuilding(
            buildingId,
            currentUser?.branchId
          );
          logger.log('📊 Existing reports found:', existingReports.length);

          if (existingReports.length > 0) {
            const latestReport = existingReports[0];
            logger.log('📋 Loading existing report:', latestReport.id);
            setExistingReportId(latestReport.id);
            setRoofSize(latestReport.roofSize.toString());
            setDivisions(latestReport.divisions);
            setCalculatedMetrics(latestReport.calculatedMetrics || null);
            setPublicLink(
              latestReport.publicLinkId ? `/esg-report/public/${latestReport.publicLinkId}` : null
            );
            showSuccess('Existing ESG report loaded');
          } else {
            logger.log('🆕 No existing report found, starting fresh');
          }
        } catch (error) {
          // No existing report, continue with defaults
          logger.log('✅ No existing report found for this building, creating new');
          console.error('Report check error:', error);
        }
      } else {
        setInlineError('Building not found');
        showError('Building could not be loaded');
      }
    } catch (error) {
      console.error('❌ Error loading building:', error);
      setInlineError('Failed to load building');
      showError(t('admin.esgService.errorLoadingBuilding') || 'Failed to load building');
    } finally {
      setLoadingBuilding(false);
      logger.log('🏁 Building selection completed');
    }
  };

  const handleDivisionChange = (area: keyof RoofDivisionAreas, value: number) => {
    const newDivisions = { ...divisions };
    newDivisions[area] = Math.max(0, Math.min(100, value));
    setDivisions(newDivisions);
    setCalculatedMetrics(null); // Clear previous calculations
    setInlineError(null);
  };

  const handleCalculate = () => {
    setInlineError(null);
    if (!selectedBuilding || !roofSize) {
      setInlineError(
        t('admin.esgService.selectBuildingAndRoofSize') ||
          'Please select a building and enter roof size'
      );
      showError(
        t('admin.esgService.selectBuildingAndRoofSize') ||
          'Please select a building and enter roof size'
      );
      return;
    }

    const roofSizeNum = parseFloat(roofSize);
    if (isNaN(roofSizeNum) || roofSizeNum <= 0) {
      setInlineError(t('admin.esgService.invalidRoofSize') || 'Please enter a valid roof size');
      showError(t('admin.esgService.invalidRoofSize') || 'Please enter a valid roof size');
      return;
    }

    // Validate percentages sum to 100
    const totalPercentage =
      divisions.greenRoof +
      divisions.noxReduction +
      divisions.coolRoof +
      divisions.socialActivities;

    if (Math.abs(totalPercentage - 100) > 0.1) {
      setInlineError(
        t('admin.esgService.percentagesMustSumTo100') ||
          `Division percentages must sum to 100%. Current total: ${totalPercentage.toFixed(1)}%`
      );
      showError(
        t('admin.esgService.percentagesMustSumTo100') ||
          `Division percentages must sum to 100%. Current total: ${totalPercentage.toFixed(1)}%`
      );
      return;
    }

    setLoadingCalculation(true);
    try {
      logger.log('Calculating ESG metrics with:', { roofSizeNum, divisions });
      const metrics = calculateESGFromDivisions(roofSizeNum, divisions);
      logger.log('Calculated metrics:', metrics);
      setCalculatedMetrics(metrics);
    } catch (error) {
      console.error('Error calculating metrics:', error);
      setInlineError(t('admin.esgService.errorCalculating') || 'Failed to calculate metrics');
      showError(t('admin.esgService.errorCalculating') || 'Failed to calculate metrics');
    } finally {
      setLoadingCalculation(false);
    }
  };

  const handleSave = async () => {
    setInlineError(null);
    if (!selectedBuilding || !calculatedMetrics) {
      setInlineError(
        t('admin.esgService.calculateFirst') || 'Please calculate metrics before saving'
      );
      showError(t('admin.esgService.calculateFirst') || 'Please calculate metrics before saving');
      return;
    }

    if (!currentUser?.branchId) {
      setInlineError(t('admin.esgService.noBranchId') || 'No branch ID found');
      showError(t('admin.esgService.noBranchId') || 'No branch ID found');
      return;
    }

    const roofSizeNum = parseFloat(roofSize);
    if (isNaN(roofSizeNum) || roofSizeNum <= 0) {
      setInlineError(t('admin.esgService.invalidRoofSize') || 'Please enter a valid roof size');
      showError(t('admin.esgService.invalidRoofSize') || 'Please enter a valid roof size');
      return;
    }

    // Validate percentages sum to 100 before saving
    const totalPercentage =
      divisions.greenRoof +
      divisions.noxReduction +
      divisions.coolRoof +
      divisions.socialActivities;
    if (Math.abs(totalPercentage - 100) > 0.1) {
      setInlineError(
        t('admin.esgService.percentagesMustSumTo100') ||
          `Division percentages must sum to 100%. Current total: ${totalPercentage.toFixed(1)}%`
      );
      showError(
        t('admin.esgService.percentagesMustSumTo100') ||
          `Division percentages must sum to 100%. Current total: ${totalPercentage.toFixed(1)}%`
      );
      return;
    }

    setSaving(true);
    try {
      if (existingReportId) {
        // Update existing report
        await updateESGServiceReport(existingReportId, {
          roofSize: roofSizeNum,
          divisions,
          calculatedMetrics,
        });
        showSuccess(t('admin.esgService.reportUpdated') || 'ESG report updated successfully');
      } else {
        // Create new report
        const reportId = await createESGServiceReport({
          buildingId: selectedBuilding.id,
          branchId: currentUser.branchId,
          createdBy: currentUser.uid,
          roofSize: roofSizeNum,
          divisions,
        });
        setExistingReportId(reportId);
        showSuccess(t('admin.esgService.reportSaved') || 'ESG report saved successfully');
      }
    } catch (error) {
      console.error('Error saving report:', error);
      setInlineError(t('admin.esgService.errorSaving') || 'Failed to save report');
      showError(t('admin.esgService.errorSaving') || 'Failed to save report');
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePublicLink = async () => {
    if (!existingReportId) {
      showError(
        t('admin.esgService.saveFirst') || 'Please save the report before generating a public link'
      );
      return;
    }

    try {
      const publicLinkId = await generatePublicESGReportLink(existingReportId);
      const publicUrl = `${window.location.origin}/esg-report/public/${publicLinkId}`;
      setPublicLink(publicUrl);
      setShowPublicLinkModal(true);

      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(publicUrl);
        showSuccess(t('admin.esgService.linkCopied') || 'Public link copied to clipboard');
      } catch (clipboardError) {
        // Clipboard copy failed, but link was generated
        logger.warn('Failed to copy to clipboard:', clipboardError);
      }
    } catch (error) {
      console.error('Error generating public link:', error);
      showError(t('admin.esgService.errorGeneratingLink') || 'Failed to generate public link');
    }
  };

  const handleCopyLink = async () => {
    if (!publicLink) return;

    try {
      await navigator.clipboard.writeText(publicLink);
      showSuccess(t('admin.esgService.linkCopied') || 'Link copied to clipboard');
    } catch (error) {
      console.error('Error copying link:', error);
      showError(t('admin.esgService.errorCopyingLink') || 'Failed to copy link');
    }
  };

  const filteredBuildings = buildings.filter(building =>
    building.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPercentage =
    divisions.greenRoof + divisions.noxReduction + divisions.coolRoof + divisions.socialActivities;

  const divisionColors = {
    greenRoof: 'bg-green-500',
    noxReduction: 'bg-blue-500',
    coolRoof: 'bg-cyan-500',
    socialActivities: 'bg-orange-500',
  };

  const divisionLabels = {
    greenRoof: t('admin.esgService.greenRoofArea') || 'Green Roof Area',
    noxReduction: t('admin.esgService.noxReductionArea') || 'NOₓ Reduction Area',
    coolRoof: t('admin.esgService.coolRoofArea') || 'Cool Roof Area',
    socialActivities: t('admin.esgService.socialActivitiesArea') || 'Social Activities Area',
  };

  return (
    <>
      <style>{rangeInputStyles}</style>
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8'>
          {/* Modern Header with Gradient */}
          <div className='relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-700 to-slate-800 p-8 shadow-2xl'>
            <div className='absolute inset-0 bg-grid-white/10'></div>
            <div className='relative'>
              <div className='flex items-center space-x-3 mb-3'>
                <div className='p-3 bg-white/20 backdrop-blur-sm rounded-2xl'>
                  <Sparkles className='w-8 h-8 text-white' />
                </div>
                <div>
                  <h1 className='text-4xl font-bold text-white tracking-tight'>
                    {t('admin.esgService.title') || 'ESG Service'}
                  </h1>
                  <p className='text-emerald-50 text-lg mt-1'>
                    {t('admin.esgService.subtitle') ||
                      'Create ESG reports with intelligent roof allocation'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Search - Modern Card */}
          <div className='group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-6 hover:shadow-xl transition-all duration-300'>
            <div className='flex items-center space-x-3 mb-4'>
              <div className='p-2 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl shadow-lg'>
                <Search className='w-5 h-5 text-white' />
              </div>
              <h2 className='text-xl font-bold text-slate-800'>
                {t('admin.esgService.selectCustomer') || 'Select Customer'}
              </h2>
            </div>
            <CustomerSearch onCustomerSelect={setSelectedCustomer} />
            {selectedCustomer && (
              <div className='mt-4 flex items-center space-x-3 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200'>
                <CheckCircle className='w-5 h-5 text-slate-700' />
                <div>
                  <span className='font-semibold text-slate-900'>{selectedCustomer.name}</span>
                  {selectedCustomer.email && (
                    <span className='text-sm text-slate-600 ml-2'>({selectedCustomer.email})</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Building Selection */}
          {selectedCustomer && (
            <div className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-6 hover:shadow-xl transition-all duration-300'>
              <div className='flex items-center space-x-3 mb-4'>
                <div className='p-2 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl shadow-lg'>
                  <BuildingIcon className='w-5 h-5 text-white' />
                </div>
                <h2 className='text-xl font-bold text-slate-800'>
                  {t('admin.esgService.selectBuilding') || 'Select Building'}
                </h2>
              </div>

              {loadingBuildings ? (
                <div className='flex items-center justify-center py-12'>
                  <div className='text-center'>
                    <Loader2 className='w-8 h-8 text-purple-600 animate-spin mx-auto mb-2' />
                    <p className='text-slate-600'>Loading buildings...</p>
                  </div>
                </div>
              ) : (
                <div className='space-y-4'>
                  {/* Search Input */}
                  <div className='relative'>
                    <Search className='absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5' />
                    <input
                      type='text'
                      placeholder={t('admin.esgService.searchBuildings') || 'Search buildings...'}
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className='w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all'
                    />
                  </div>

                  {/* Building List */}
                  <div className='max-h-80 overflow-y-auto space-y-2 rounded-xl'>
                    {filteredBuildings.length === 0 ? (
                      <div className='p-8 text-center'>
                        <BuildingIcon className='w-12 h-12 text-slate-300 mx-auto mb-2' />
                        <p className='text-slate-500'>
                          {t('admin.esgService.noBuildings') || 'No buildings found'}
                        </p>
                      </div>
                    ) : (
                      filteredBuildings.map(building => (
                        <button
                          key={building.id}
                          onClick={() => handleBuildingSelect(building.id)}
                          className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                            selectedBuilding?.id === building.id
                              ? 'bg-gradient-to-r from-slate-100 to-slate-200 border-2 border-slate-400 shadow-md'
                              : 'bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                        >
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center space-x-3'>
                              <div
                                className={`p-2 rounded-lg ${
                                  selectedBuilding?.id === building.id
                                    ? 'bg-slate-600'
                                    : 'bg-slate-300'
                                }`}
                              >
                                <BuildingIcon className='w-4 h-4 text-white' />
                              </div>
                              <div>
                                <p className='font-semibold text-slate-900'>{building.address}</p>
                                <p className='text-sm text-slate-600'>
                                  {building.roofType && t(`roofTypes.${building.roofType}`)}
                                  {building.roofSize && ` • ${building.roofSize} m²`}
                                </p>
                              </div>
                            </div>
                            {selectedBuilding?.id === building.id && (
                              <CheckCircle className='w-5 h-5 text-green-600' />
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Selected Building Form */}
          {selectedBuilding && (
            <div className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden'>
              {/* Form Header with Gradient */}
              <div className='bg-gradient-to-r from-slate-800 to-slate-700 p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h2 className='text-2xl font-bold text-white flex items-center'>
                      <Calculator className='w-6 h-6 mr-2' />
                      ESG Service Report
                    </h2>
                    <p className='text-slate-300 mt-1'>{selectedBuilding.address}</p>
                  </div>
                  <div className='p-3 bg-white/10 rounded-xl backdrop-blur-sm'>
                    <Leaf className='w-8 h-8 text-emerald-400' />
                  </div>
                </div>
              </div>

              <div className='p-6 space-y-6'>
                {inlineError && (
                  <div className='bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 rounded-xl p-4 flex items-start'>
                    <AlertCircle className='w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5' />
                    <p className='text-sm text-red-700 font-medium'>{inlineError}</p>
                  </div>
                )}

                {/* Roof Size Input - Modern Design */}
                <div className='bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-5 border border-slate-200'>
                  <label
                    htmlFor='roofSize'
                    className='block text-sm font-bold text-slate-800 mb-3 flex items-center'
                  >
                    <BuildingIcon className='w-5 h-5 mr-2 text-slate-700' />
                    Roof Size (m²)
                  </label>
                  <input
                    type='number'
                    id='roofSize'
                    value={roofSize}
                    onChange={e => setRoofSize(e.target.value)}
                    className='w-full border-2 border-blue-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white font-semibold text-lg'
                    placeholder='Enter roof size'
                  />
                </div>

                {/* Division Areas - Card-based Design */}
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <h3 className='text-xl font-bold text-slate-800 flex items-center'>
                      <TrendingUp className='w-5 h-5 mr-2 text-emerald-600' />
                      Area Allocation
                    </h3>
                    <div
                      className={`px-4 py-2 rounded-xl font-bold text-lg ${
                        Math.abs(totalPercentage - 100) < 0.1
                          ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-lg'
                          : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                      }`}
                    >
                      {totalPercentage.toFixed(1)}%
                    </div>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {/* Green Roof */}
                    <div className='group relative overflow-hidden bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl p-5 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1'>
                      <div className='absolute inset-0 bg-white/10'></div>
                      <div className='relative flex flex-col h-full'>
                        <div className='flex items-center justify-between mb-3'>
                          <div className='flex items-center space-x-2'>
                            <div className='p-2 bg-white/20 rounded-lg backdrop-blur-sm'>
                              <Leaf className='w-5 h-5 text-white' />
                            </div>
                            <label className='block text-sm font-bold text-white'>Green Roof</label>
                          </div>
                          <span className='text-2xl font-bold text-white'>
                            {divisions.greenRoof}%
                          </span>
                        </div>
                        <div className='flex-1 flex flex-col justify-between'>
                          <input
                            type='range'
                            min='0'
                            max='100'
                            value={divisions.greenRoof}
                            onChange={e =>
                              handleDivisionChange('greenRoof', Number(e.target.value))
                            }
                            className='w-full h-2 bg-white/30 rounded-lg appearance-none cursor-pointer'
                            style={{
                              WebkitAppearance: 'none',
                              appearance: 'none',
                            }}
                          />
                          <input
                            type='number'
                            min='0'
                            max='100'
                            value={divisions.greenRoof}
                            onChange={e =>
                              handleDivisionChange('greenRoof', Number(e.target.value))
                            }
                            className='w-full mt-2 border-2 border-white/50 rounded-xl px-3 py-2 bg-white/20 text-white placeholder-white/60 font-bold focus:outline-none focus:ring-2 focus:ring-white/50'
                          />
                          <p className='text-xs text-white/80 mt-3 leading-relaxed'>
                            CO₂ absorption, stormwater retention, improved insulation, and
                            biodiversity support
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* NOx Reduction */}
                    <div className='group relative overflow-hidden bg-gradient-to-br from-slate-500 to-slate-600 rounded-2xl p-5 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1'>
                      <div className='absolute inset-0 bg-white/10'></div>
                      <div className='relative flex flex-col h-full'>
                        <div className='flex items-center justify-between mb-3'>
                          <div className='flex items-center space-x-2'>
                            <div className='p-2 bg-white/20 rounded-lg backdrop-blur-sm'>
                              <Wind className='w-5 h-5 text-white' />
                            </div>
                            <label className='block text-sm font-bold text-white'>
                              NOₓ Reduction
                            </label>
                          </div>
                          <span className='text-2xl font-bold text-white'>
                            {divisions.noxReduction}%
                          </span>
                        </div>
                        <div className='flex-1 flex flex-col justify-between'>
                          <input
                            type='range'
                            min='0'
                            max='100'
                            value={divisions.noxReduction}
                            onChange={e =>
                              handleDivisionChange('noxReduction', Number(e.target.value))
                            }
                            className='w-full h-2 bg-white/30 rounded-lg appearance-none cursor-pointer'
                            style={{
                              WebkitAppearance: 'none',
                              appearance: 'none',
                            }}
                          />
                          <input
                            type='number'
                            min='0'
                            max='100'
                            value={divisions.noxReduction}
                            onChange={e =>
                              handleDivisionChange('noxReduction', Number(e.target.value))
                            }
                            className='w-full mt-2 border-2 border-white/50 rounded-xl px-3 py-2 bg-white/20 text-white placeholder-white/60 font-bold focus:outline-none focus:ring-2 focus:ring-white/50'
                          />
                          <p className='text-xs text-white/80 mt-3 leading-relaxed'>
                            Photocatalytic coatings break down NOₓ pollutants, improving air quality
                            and reducing smog
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Cool Roof */}
                    <div className='group relative overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-5 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1'>
                      <div className='absolute inset-0 bg-white/10'></div>
                      <div className='relative flex flex-col h-full'>
                        <div className='flex items-center justify-between mb-3'>
                          <div className='flex items-center space-x-2'>
                            <div className='p-2 bg-white/20 rounded-lg backdrop-blur-sm'>
                              <Zap className='w-5 h-5 text-white' />
                            </div>
                            <label className='block text-sm font-bold text-white'>Cool Roof</label>
                          </div>
                          <span className='text-2xl font-bold text-white'>
                            {divisions.coolRoof}%
                          </span>
                        </div>
                        <div className='flex-1 flex flex-col justify-between'>
                          <input
                            type='range'
                            min='0'
                            max='100'
                            value={divisions.coolRoof}
                            onChange={e => handleDivisionChange('coolRoof', Number(e.target.value))}
                            className='w-full h-2 bg-white/30 rounded-lg appearance-none cursor-pointer'
                            style={{
                              WebkitAppearance: 'none',
                              appearance: 'none',
                            }}
                          />
                          <input
                            type='number'
                            min='0'
                            max='100'
                            value={divisions.coolRoof}
                            onChange={e => handleDivisionChange('coolRoof', Number(e.target.value))}
                            className='w-full mt-2 border-2 border-white/50 rounded-xl px-3 py-2 bg-white/20 text-white placeholder-white/60 font-bold focus:outline-none focus:ring-2 focus:ring-white/50'
                          />
                          <p className='text-xs text-white/80 mt-3 leading-relaxed'>
                            Reflective surfaces reduce cooling costs by up to 50%, ideal for solar
                            panel installation
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Social Activities */}
                    <div className='group relative overflow-hidden bg-gradient-to-br from-slate-500 to-slate-600 rounded-2xl p-5 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1'>
                      <div className='absolute inset-0 bg-white/10'></div>
                      <div className='relative flex flex-col h-full'>
                        <div className='flex items-center justify-between mb-3'>
                          <div className='flex items-center space-x-2'>
                            <div className='p-2 bg-white/20 rounded-lg backdrop-blur-sm'>
                              <Users className='w-5 h-5 text-white' />
                            </div>
                            <label className='block text-sm font-bold text-white'>
                              Social Activities
                            </label>
                          </div>
                          <span className='text-2xl font-bold text-white'>
                            {divisions.socialActivities}%
                          </span>
                        </div>
                        <div className='flex-1 flex flex-col justify-between'>
                          <input
                            type='range'
                            min='0'
                            max='100'
                            value={divisions.socialActivities}
                            onChange={e =>
                              handleDivisionChange('socialActivities', Number(e.target.value))
                            }
                            className='w-full h-2 bg-white/30 rounded-lg appearance-none cursor-pointer'
                            style={{
                              WebkitAppearance: 'none',
                              appearance: 'none',
                            }}
                          />
                          <input
                            type='number'
                            min='0'
                            max='100'
                            value={divisions.socialActivities}
                            onChange={e =>
                              handleDivisionChange('socialActivities', Number(e.target.value))
                            }
                            className='w-full mt-2 border-2 border-white/50 rounded-xl px-3 py-2 bg-white/20 text-white placeholder-white/60 font-bold focus:outline-none focus:ring-2 focus:ring-white/50'
                          />
                          <p className='text-xs text-white/80 mt-3 leading-relaxed'>
                            Community gardens, gathering spaces, and urban farming promote social
                            well-being
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons - Modern Design */}
                <div className='flex flex-col sm:flex-row gap-4 pt-6'>
                  <button
                    onClick={handleCalculate}
                    disabled={loadingCalculation}
                    className='flex-1 group relative overflow-hidden bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-2xl px-6 py-4 font-bold text-lg shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
                  >
                    <div className='absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left'></div>
                    <div className='relative flex items-center justify-center'>
                      {loadingCalculation ? (
                        <>
                          <Loader2 className='w-6 h-6 mr-2 animate-spin' />
                          Calculating...
                        </>
                      ) : (
                        <>
                          <Calculator className='w-6 h-6 mr-2' />
                          Calculate ESG Metrics
                        </>
                      )}
                    </div>
                  </button>

                  {calculatedMetrics && (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className='flex-1 group relative overflow-hidden bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-2xl px-6 py-4 font-bold text-lg shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
                      >
                        <div className='absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left'></div>
                        <div className='relative flex items-center justify-center'>
                          {saving ? (
                            <>
                              <Loader2 className='w-6 h-6 mr-2 animate-spin' />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className='w-6 h-6 mr-2' />
                              Save Report
                            </>
                          )}
                        </div>
                      </button>

                      {existingReportId && (
                        <button
                          onClick={handleGeneratePublicLink}
                          className='flex-1 group relative overflow-hidden bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-2xl px-6 py-4 font-bold text-lg shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300'
                        >
                          <div className='absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left'></div>
                          <div className='relative flex items-center justify-center'>
                            <Share2 className='w-6 h-6 mr-2' />
                            Share Report
                          </div>
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Calculated Metrics Display - Roof For Good Style */}
                {calculatedMetrics && (
                  <div className='mt-8 space-y-6'>
                    {/* Header with completion badge */}
                    <div className='bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 text-center'>
                      <div className='flex items-center justify-center gap-2 mb-2'>
                        <CheckCircle className='w-6 h-6 text-green-600' />
                        <p className='text-green-700 font-semibold'>Analysis Complete</p>
                      </div>
                      <h3 className='text-3xl font-bold text-slate-900 mb-2'>
                        Your Roof For Good Analysis
                      </h3>
                      <p className='text-slate-600'>
                        Comprehensive analysis of your roof sections and their environmental impact
                      </p>
                    </div>

                    {/* Executive Summary Cards - 4 columns */}
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                      {/* CO2 Offset Card */}
                      <div className='bg-white border border-slate-200 rounded-2xl p-5 text-center hover:shadow-lg transition-all'>
                        <div className='flex items-center justify-center mb-3'>
                          <div className='p-2 bg-green-100 rounded-xl'>
                            <Leaf className='w-6 h-6 text-green-600' />
                          </div>
                        </div>
                        <p className='text-3xl font-bold text-green-600 mb-1'>
                          {calculatedMetrics.co2ReductionKgPerYear
                            ? Math.round(calculatedMetrics.co2ReductionKgPerYear)
                            : '0'}
                        </p>
                        <p className='text-xs text-slate-600 font-medium'>kg CO₂ Offset/Year</p>
                        <p className='text-xs text-slate-500 mt-1'>Environmental Impact</p>
                      </div>

                      {/* Energy Impact Card */}
                      <div className='bg-white border border-slate-200 rounded-2xl p-5 text-center hover:shadow-lg transition-all'>
                        <div className='flex items-center justify-center mb-3'>
                          <div className='p-2 bg-blue-100 rounded-xl'>
                            <Zap className='w-6 h-6 text-blue-600' />
                          </div>
                        </div>
                        <p className='text-3xl font-bold text-blue-600 mb-1'>
                          {calculatedMetrics.energySavingsKwhPerYear
                            ? Math.round(calculatedMetrics.energySavingsKwhPerYear)
                            : '0'}
                        </p>
                        <p className='text-xs text-slate-600 font-medium'>kWh Energy Impact</p>
                        <p className='text-xs text-slate-500 mt-1'>Savings + Generation</p>
                      </div>

                      {/* Trees Equivalent Card */}
                      <div className='bg-white border border-slate-200 rounded-2xl p-5 text-center hover:shadow-lg transition-all'>
                        <div className='flex items-center justify-center mb-3'>
                          <div className='p-2 bg-emerald-100 rounded-xl'>
                            <span className='text-2xl'>🌳</span>
                          </div>
                        </div>
                        <p className='text-3xl font-bold text-emerald-600 mb-1'>
                          {calculatedMetrics.co2ReductionKgPerYear
                            ? Math.round(calculatedMetrics.co2ReductionKgPerYear / 22)
                            : '0'}
                        </p>
                        <p className='text-xs text-slate-600 font-medium'>Trees Equivalent</p>
                        <p className='text-xs text-slate-500 mt-1'>CO₂ Absorption</p>
                      </div>

                      {/* Water Management Card */}
                      <div className='bg-white border border-slate-200 rounded-2xl p-5 text-center hover:shadow-lg transition-all'>
                        <div className='flex items-center justify-center mb-3'>
                          <div className='p-2 bg-cyan-100 rounded-xl'>
                            <Droplets className='w-6 h-6 text-cyan-600' />
                          </div>
                        </div>
                        <p className='text-3xl font-bold text-cyan-600 mb-1'>
                          {calculatedMetrics.waterManagementLitersPerYear
                            ? Math.round(calculatedMetrics.waterManagementLitersPerYear)
                            : '0'}
                        </p>
                        <p className='text-xs text-slate-600 font-medium'>Liters/Year</p>
                        <p className='text-xs text-slate-500 mt-1'>Water Management</p>
                      </div>
                    </div>

                    {/* Detailed Breakdown Section */}
                    <div className='bg-white border border-slate-200 rounded-2xl p-6'>
                      <h4 className='text-xl font-bold text-slate-900 mb-4 flex items-center'>
                        <TrendingUp className='w-5 h-5 mr-2 text-emerald-600' />
                        Roof Segments Breakdown
                      </h4>

                      <div className='space-y-4'>
                        {/* Green Roof Segment */}
                        <div className='bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200'>
                          <div className='flex items-start justify-between mb-2'>
                            <div className='flex items-center gap-3'>
                              <div className='w-10 h-10 rounded-full bg-green-100 flex items-center justify-center'>
                                <span className='text-green-700 font-bold'>1</span>
                              </div>
                              <div>
                                <h5 className='font-semibold text-slate-900'>Green Roof Area</h5>
                                <p className='text-sm text-slate-600'>
                                  {divisions.greenRoof}% (
                                  {roofSize
                                    ? Math.round((parseFloat(roofSize) * divisions.greenRoof) / 100)
                                    : 0}{' '}
                                  m²)
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className='grid grid-cols-3 gap-3 mt-3 text-center text-sm'>
                            <div>
                              <p className='font-bold text-slate-900'>
                                {roofSize
                                  ? Math.round(
                                      (parseFloat(roofSize) / 1000) *
                                        525 *
                                        (divisions.greenRoof / 100)
                                    )
                                  : 0}
                              </p>
                              <p className='text-xs text-slate-600'>kg CO₂/year</p>
                            </div>
                            <div>
                              <p className='font-bold text-slate-900'>
                                {roofSize
                                  ? Math.round(
                                      (parseFloat(roofSize) / 1000) *
                                        375 *
                                        (divisions.greenRoof / 100)
                                    )
                                  : 0}
                              </p>
                              <p className='text-xs text-slate-600'>kWh/year</p>
                            </div>
                            <div>
                              <p className='font-bold text-slate-900'>40</p>
                              <p className='text-xs text-slate-600'>Years Lifespan</p>
                            </div>
                          </div>
                        </div>

                        {/* NOx Reduction Segment */}
                        <div className='bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200'>
                          <div className='flex items-start justify-between mb-2'>
                            <div className='flex items-center gap-3'>
                              <div className='w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center'>
                                <span className='text-blue-700 font-bold'>2</span>
                              </div>
                              <div>
                                <h5 className='font-semibold text-slate-900'>NOₓ Reduction Area</h5>
                                <p className='text-sm text-slate-600'>
                                  {divisions.noxReduction}% (
                                  {roofSize
                                    ? Math.round(
                                        (parseFloat(roofSize) * divisions.noxReduction) / 100
                                      )
                                    : 0}{' '}
                                  m²)
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className='grid grid-cols-3 gap-3 mt-3 text-center text-sm'>
                            <div>
                              <p className='font-bold text-slate-900'>
                                {roofSize
                                  ? Math.round(
                                      (parseFloat(roofSize) / 1000) *
                                        485 *
                                        (divisions.noxReduction / 100)
                                    )
                                  : 0}
                              </p>
                              <p className='text-xs text-slate-600'>kg CO₂/year</p>
                            </div>
                            <div>
                              <p className='font-bold text-slate-900'>0</p>
                              <p className='text-xs text-slate-600'>kWh/year</p>
                            </div>
                            <div>
                              <p className='font-bold text-slate-900'>15</p>
                              <p className='text-xs text-slate-600'>Years Lifespan</p>
                            </div>
                          </div>
                        </div>

                        {/* Cool Roof Segment */}
                        <div className='bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200'>
                          <div className='flex items-start justify-between mb-2'>
                            <div className='flex items-center gap-3'>
                              <div className='w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center'>
                                <span className='text-cyan-700 font-bold'>3</span>
                              </div>
                              <div>
                                <h5 className='font-semibold text-slate-900'>Cool Roof Area</h5>
                                <p className='text-sm text-slate-600'>
                                  {divisions.coolRoof}% (
                                  {roofSize
                                    ? Math.round((parseFloat(roofSize) * divisions.coolRoof) / 100)
                                    : 0}{' '}
                                  m²)
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className='grid grid-cols-3 gap-3 mt-3 text-center text-sm'>
                            <div>
                              <p className='font-bold text-slate-900'>
                                {roofSize
                                  ? Math.round(
                                      (parseFloat(roofSize) / 1000) *
                                        1663 *
                                        (divisions.coolRoof / 100)
                                    )
                                  : 0}
                              </p>
                              <p className='text-xs text-slate-600'>kg CO₂/year</p>
                            </div>
                            <div>
                              <p className='font-bold text-slate-900'>
                                {roofSize
                                  ? Math.round(
                                      (parseFloat(roofSize) / 1000) *
                                        2125 *
                                        (divisions.coolRoof / 100)
                                    )
                                  : 0}
                              </p>
                              <p className='text-xs text-slate-600'>kWh/year</p>
                            </div>
                            <div>
                              <p className='font-bold text-slate-900'>20</p>
                              <p className='text-xs text-slate-600'>Years Lifespan</p>
                            </div>
                          </div>
                        </div>

                        {/* Social Activities Segment */}
                        <div className='bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200'>
                          <div className='flex items-start justify-between mb-2'>
                            <div className='flex items-center gap-3'>
                              <div className='w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center'>
                                <span className='text-orange-700 font-bold'>4</span>
                              </div>
                              <div>
                                <h5 className='font-semibold text-slate-900'>
                                  Social Activities Area
                                </h5>
                                <p className='text-sm text-slate-600'>
                                  {divisions.socialActivities}% (
                                  {roofSize
                                    ? Math.round(
                                        (parseFloat(roofSize) * divisions.socialActivities) / 100
                                      )
                                    : 0}{' '}
                                  m²)
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className='grid grid-cols-3 gap-3 mt-3 text-center text-sm'>
                            <div>
                              <p className='font-bold text-slate-900'>
                                {roofSize
                                  ? Math.round(
                                      (parseFloat(roofSize) / 1000) *
                                        125 *
                                        (divisions.socialActivities / 100)
                                    )
                                  : 0}
                              </p>
                              <p className='text-xs text-slate-600'>kg CO₂/year</p>
                            </div>
                            <div>
                              <p className='font-bold text-slate-900'>0</p>
                              <p className='text-xs text-slate-600'>kWh/year</p>
                            </div>
                            <div>
                              <p className='font-bold text-slate-900'>25</p>
                              <p className='text-xs text-slate-600'>Years Lifespan</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Environmental Impact Highlights */}
                    <div className='bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6'>
                      <div className='flex items-center gap-2 mb-4'>
                        <Leaf className='w-6 h-6 text-green-600' />
                        <h4 className='text-xl font-semibold text-slate-900'>
                          Environmental Impact
                        </h4>
                      </div>
                      <p className='text-sm text-slate-600 mb-4'>
                        Your roof system's positive environmental impact expressed in relatable
                        terms
                      </p>
                      <div className='grid md:grid-cols-3 gap-6'>
                        <div className='text-center'>
                          <p className='text-4xl font-bold text-green-600 mb-2'>
                            🌳{' '}
                            {calculatedMetrics.co2ReductionKgPerYear
                              ? Math.round(calculatedMetrics.co2ReductionKgPerYear / 22)
                              : 0}
                          </p>
                          <p className='text-sm font-semibold text-slate-900'>Trees Equivalent</p>
                          <p className='text-xs text-slate-600 mt-1'>
                            CO₂ absorption per year ≈{' '}
                            {calculatedMetrics.co2ReductionKgPerYear
                              ? Math.round(calculatedMetrics.co2ReductionKgPerYear)
                              : 0}{' '}
                            kg CO₂/year
                          </p>
                        </div>
                        <div className='text-center'>
                          <p className='text-4xl font-bold text-blue-600 mb-2'>
                            ⚡{' '}
                            {calculatedMetrics.energySavingsKwhPerYear
                              ? Math.round(calculatedMetrics.energySavingsKwhPerYear)
                              : 0}
                          </p>
                          <p className='text-sm font-semibold text-slate-900'>kWh Energy Impact</p>
                          <p className='text-xs text-slate-600 mt-1'>
                            Savings + generation per year
                          </p>
                        </div>
                        <div className='text-center'>
                          <p className='text-4xl font-bold text-cyan-600 mb-2'>
                            💨{' '}
                            {calculatedMetrics.waterManagementLitersPerYear
                              ? Math.round(calculatedMetrics.waterManagementLitersPerYear / 100)
                              : 0}
                          </p>
                          <p className='text-sm font-semibold text-slate-900'>kg NOₓ Reduction</p>
                          <p className='text-xs text-slate-600 mt-1'>Air quality improvement</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Legacy detailed cards - keeping for backward compatibility */}
                {calculatedMetrics && false && (
                  <div className='mt-6 space-y-4 hidden'>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                      {/* CO2 Reduction Card */}
                      <div className='group relative overflow-hidden bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300'>
                        <div className='absolute inset-0 bg-white/10'></div>
                        <div className='relative'>
                          <div className='flex items-center justify-between mb-4'>
                            <div className='p-3 bg-white/20 rounded-xl backdrop-blur-sm'>
                              <Leaf className='w-8 h-8 text-white' />
                            </div>
                            <div className='text-xs font-semibold text-white/80 bg-white/20 px-3 py-1 rounded-full'>
                              CO₂
                            </div>
                          </div>
                          <div className='space-y-2'>
                            <h4 className='text-sm font-bold text-white/90'>CO₂ Reduction</h4>
                            <div className='text-4xl font-black text-white'>
                              {calculatedMetrics.co2ReductionKgPerYear
                                ? calculatedMetrics.co2ReductionKgPerYear.toFixed(1)
                                : '0.0'}
                            </div>
                            <p className='text-sm font-semibold text-white/80'>kg/year</p>
                          </div>
                        </div>
                      </div>

                      {/* Energy Savings Card */}
                      <div className='group relative overflow-hidden bg-gradient-to-br from-slate-500 to-slate-600 rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300'>
                        <div className='absolute inset-0 bg-white/10'></div>
                        <div className='relative'>
                          <div className='flex items-center justify-between mb-4'>
                            <div className='p-3 bg-white/20 rounded-xl backdrop-blur-sm'>
                              <Zap className='w-8 h-8 text-white' />
                            </div>
                            <div className='text-xs font-semibold text-white/80 bg-white/20 px-3 py-1 rounded-full'>
                              ENERGY
                            </div>
                          </div>
                          <div className='space-y-2'>
                            <h4 className='text-sm font-bold text-white/90'>Energy Savings</h4>
                            <div className='text-4xl font-black text-white'>
                              {calculatedMetrics.energySavingsKwhPerYear
                                ? calculatedMetrics.energySavingsKwhPerYear.toFixed(1)
                                : '0.0'}
                            </div>
                            <p className='text-sm font-semibold text-white/80'>kWh/year</p>
                          </div>
                        </div>
                      </div>

                      {/* Water Management Card */}
                      <div className='group relative overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300'>
                        <div className='absolute inset-0 bg-white/10'></div>
                        <div className='relative'>
                          <div className='flex items-center justify-between mb-4'>
                            <div className='p-3 bg-white/20 rounded-xl backdrop-blur-sm'>
                              <Droplets className='w-8 h-8 text-white' />
                            </div>
                            <div className='text-xs font-semibold text-white/80 bg-white/20 px-3 py-1 rounded-full'>
                              WATER
                            </div>
                          </div>
                          <div className='space-y-2'>
                            <h4 className='text-sm font-bold text-white/90'>Water Management</h4>
                            <div className='text-4xl font-black text-white'>
                              {calculatedMetrics.waterManagementLitersPerYear
                                ? calculatedMetrics.waterManagementLitersPerYear.toFixed(1)
                                : '0.0'}
                            </div>
                            <p className='text-sm font-semibold text-white/80'>L/year</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Public Link Section */}
                {publicLink && (
                  <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <h3 className='text-md font-semibold text-blue-900'>Public Report Link</h3>
                        <p className='text-sm text-blue-700 mt-1'>
                          Share this link with your customer
                        </p>
                      </div>
                      <button
                        onClick={() => setShowPublicLinkModal(true)}
                        className='inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                      >
                        <Share2 className='w-4 h-4 mr-2' />
                        View Link
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Public Link Modal - Modern Design */}
          {showPublicLinkModal && publicLink && (
            <div className='fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4'>
              <div className='bg-white rounded-3xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden transform transition-all'>
                {/* Modal Header with Gradient */}
                <div className='bg-gradient-to-r from-slate-700 to-slate-800 p-6'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                      <div className='p-2 bg-white/20 rounded-xl backdrop-blur-sm'>
                        <Share2 className='w-6 h-6 text-white' />
                      </div>
                      <h3 className='text-2xl font-bold text-white'>
                        {t('admin.esgService.publicLink') || 'Public Report Link'}
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowPublicLinkModal(false)}
                      className='text-white/80 hover:text-white p-2 hover:bg-white/20 rounded-xl transition-all'
                    >
                      <X className='w-6 h-6' />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className='p-6 space-y-4'>
                  <p className='text-slate-600 text-sm'>
                    {t('admin.esgService.publicLinkDescription') ||
                      'Share this link with your customer. They can view the ESG report without logging in.'}
                  </p>

                  <div className='bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-4 border-2 border-slate-200'>
                    <div className='flex items-center space-x-2'>
                      <input
                        type='text'
                        readOnly
                        value={publicLink}
                        className='flex-1 px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500'
                      />
                      <button
                        onClick={handleCopyLink}
                        className='p-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl hover:shadow-lg transition-all transform hover:scale-105'
                        title={t('common.buttons.copy') || 'Copy'}
                      >
                        <Copy className='w-5 h-5' />
                      </button>
                    </div>
                  </div>

                  <div className='flex justify-end space-x-3 pt-4'>
                    <button
                      onClick={() => window.open(publicLink, '_blank')}
                      className='px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl hover:shadow-lg transition-all transform hover:scale-105 font-semibold flex items-center'
                    >
                      <Eye className='w-5 h-5 mr-2' />
                      {t('common.buttons.preview') || 'Preview'}
                    </button>
                    <button
                      onClick={() => setShowPublicLinkModal(false)}
                      className='px-6 py-3 bg-slate-200 text-slate-800 rounded-xl hover:bg-slate-300 transition-all font-semibold'
                    >
                      {t('common.buttons.close') || 'Close'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ESGService;
