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
} from 'lucide-react';
import { Building, ESGMetrics, RoofDivisionAreas } from '../../types';
import {
  getBuildingsByBranch,
  getBuildingById,
} from '../../services/buildingService';
import {
  createESGServiceReport,
  updateESGServiceReport,
  generatePublicESGReportLink,
  getESGServiceReportsByBuilding,
  getESGServiceReport,
} from '../../services/esgService';
import { calculateESGFromDivisions } from '../../utils/esgCalculations';
import LoadingSpinner from '../common/LoadingSpinner';
import PageHeader from '../shared/layouts/PageHeader';
import ListCard from '../shared/cards/ListCard';
import IconLabel from '../shared/layouts/IconLabel';
import StatusBadge from '../shared/badges/StatusBadge';

const ESGService: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useIntl();
  const { showSuccess, showError } = useToast();

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [loadingBuildings, setLoadingBuildings] = useState(true);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">
            {t('errors.access.denied') || 'Access Denied'}
          </h1>
          <p className="text-slate-600 mb-6">
            {t('admin.esgService.accessDenied') ||
              'You do not have permission to access this page'}
          </p>
        </div>
      </div>
    );
  }

  // Load buildings on mount
  useEffect(() => {
    if (currentUser?.branchId) {
      loadBuildings();
    }
  }, [currentUser]);

  const loadBuildings = async () => {
    if (!currentUser?.branchId) return;
    setLoadingBuildings(true);
    try {
      const data = await getBuildingsByBranch(currentUser.branchId);
      setBuildings(data);
    } catch (error) {
      console.error('Error loading buildings:', error);
      showError(t('admin.esgService.errorLoadingBuildings') || 'Failed to load buildings');
    } finally {
      setLoadingBuildings(false);
    }
  };

  const handleBuildingSelect = async (buildingId: string) => {
    setLoadingBuilding(true);
    setCalculatedMetrics(null);
    setExistingReportId(null);
    setPublicLink(null);
    try {
      const building = await getBuildingById(buildingId);
      if (building) {
        setSelectedBuilding(building);
        setRoofSize(building.roofSize?.toString() || '');
        
        // Check if report already exists for this building
        try {
          const existingReports = await getESGServiceReportsByBuilding(buildingId);
          if (existingReports.length > 0) {
            const latestReport = existingReports[0];
            setExistingReportId(latestReport.id);
            setRoofSize(latestReport.roofSize.toString());
            setDivisions(latestReport.divisions);
            setCalculatedMetrics(latestReport.calculatedMetrics || null);
            setPublicLink(latestReport.publicLinkId ? `/esg-report/public/${latestReport.publicLinkId}` : null);
          }
        } catch (error) {
          // No existing report, continue with defaults
          console.log('No existing report found for this building');
        }
      }
    } catch (error) {
      console.error('Error loading building:', error);
      showError(t('admin.esgService.errorLoadingBuilding') || 'Failed to load building');
    } finally {
      setLoadingBuilding(false);
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
      setInlineError(t('admin.esgService.selectBuildingAndRoofSize') || 'Please select a building and enter roof size');
      showError(t('admin.esgService.selectBuildingAndRoofSize') || 'Please select a building and enter roof size');
      return;
    }

    const roofSizeNum = parseFloat(roofSize);
    if (isNaN(roofSizeNum) || roofSizeNum <= 0) {
      setInlineError(t('admin.esgService.invalidRoofSize') || 'Please enter a valid roof size');
      showError(t('admin.esgService.invalidRoofSize') || 'Please enter a valid roof size');
      return;
    }

    // Validate percentages sum to 100
    const totalPercentage = divisions.greenRoof +
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
      const metrics = calculateESGFromDivisions(roofSizeNum, divisions);
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
      setInlineError(t('admin.esgService.calculateFirst') || 'Please calculate metrics before saving');
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
    const totalPercentage = divisions.greenRoof +
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
      showError(t('admin.esgService.saveFirst') || 'Please save the report before generating a public link');
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
        console.warn('Failed to copy to clipboard:', clipboardError);
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

  const filteredBuildings = buildings.filter((building) =>
    building.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPercentage = divisions.greenRoof +
    divisions.noxReduction +
    divisions.coolRoof +
    divisions.socialActivities;

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
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={t('admin.esgService.title') || 'ESG Service'}
        subtitle={
          t('admin.esgService.subtitle') ||
          'Create ESG reports by allocating roof areas to sustainable divisions'
        }
      />

      {/* Building Selection */}
      <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <BuildingIcon className="w-5 h-5 mr-2" />
          {t('admin.esgService.selectBuilding') || 'Select Building'}
        </h2>

        {loadingBuildings ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('admin.esgService.searchBuildings') || 'Search buildings...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Building List */}
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
              {filteredBuildings.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {t('admin.esgService.noBuildings') || 'No buildings found'}
                </div>
              ) : (
                filteredBuildings.map((building) => (
                  <button
                    key={building.id}
                    onClick={() => handleBuildingSelect(building.id)}
                    className={`w-full text-left p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                      selectedBuilding?.id === building.id
                        ? 'bg-green-50 border-green-200'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{building.address}</p>
                        <p className="text-sm text-gray-600">
                          {building.roofType && t(`roofTypes.${building.roofType}`)}
                          {building.roofSize && ` • ${building.roofSize} m²`}
                        </p>
                      </div>
                      {selectedBuilding?.id === building.id && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selected Building Form */}
      {selectedBuilding && (
        <div className="space-y-6">
          {/* Building Info */}
          <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
            <h2 className="text-lg font-semibold mb-4">
              {t('admin.esgService.buildingInfo') || 'Building Information'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <IconLabel
                icon={BuildingIcon}
                label={t('buildings.address') || 'Address'}
                value={selectedBuilding.address}
              />
              {selectedBuilding.roofType && (
                <IconLabel
                  icon={BuildingIcon}
                  label={t('buildings.roofType') || 'Roof Type'}
                  value={t(`roofTypes.${selectedBuilding.roofType}`) || selectedBuilding.roofType}
                />
              )}
            </div>
          </div>

          {/* Roof Size Input */}
          <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Calculator className="w-5 h-5 mr-2" />
              {t('admin.esgService.roofSize') || 'Roof Size (m²)'}
            </h2>
            <div className="max-w-md">
              <input
                type="number"
                min="1"
                step="0.1"
                placeholder={t('admin.esgService.enterRoofSize') || 'Enter roof size in square meters'}
                value={roofSize}
                onChange={(e) => {
                  setRoofSize(e.target.value);
                  setCalculatedMetrics(null);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              />
              <p className="text-sm text-gray-500 mt-2">
                {t('admin.esgService.confirmRoofSize') ||
                  'Confirm the total roof area in square meters'}
              </p>
            </div>
          </div>

          {/* Division Areas Input */}
          <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
            {inlineError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                <AlertCircle className="inline w-4 h-4 mr-2 align-text-bottom" />
                {inlineError}
              </div>
            )}
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Leaf className="w-5 h-5 mr-2 text-green-600" />
              {t('admin.esgService.roofDivision') || 'Roof Division Areas'}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {t('admin.esgService.allocatePercentages') ||
                'Allocate percentages to each division area (must total 100%)'}
            </p>

            <div className="space-y-4">
              {/* Green Roof Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {divisionLabels.greenRoof}
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={divisions.greenRoof}
                    onChange={(e) => handleDivisionChange('greenRoof', parseFloat(e.target.value) || 0)}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-600">%</span>
                  <div className={`w-8 h-8 rounded ${divisionColors.greenRoof}`} />
                </div>
              </div>

              {/* NOx Reduction Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {divisionLabels.noxReduction}
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={divisions.noxReduction}
                    onChange={(e) => handleDivisionChange('noxReduction', parseFloat(e.target.value) || 0)}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">%</span>
                  <div className={`w-8 h-8 rounded ${divisionColors.noxReduction}`} />
                </div>
              </div>

              {/* Cool Roof Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {divisionLabels.coolRoof}
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={divisions.coolRoof}
                    onChange={(e) => handleDivisionChange('coolRoof', parseFloat(e.target.value) || 0)}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500"
                  />
                  <span className="text-sm text-gray-600">%</span>
                  <div className={`w-8 h-8 rounded ${divisionColors.coolRoof}`} />
                </div>
              </div>

              {/* Social Activities Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {divisionLabels.socialActivities}
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={divisions.socialActivities}
                    onChange={(e) => handleDivisionChange('socialActivities', parseFloat(e.target.value) || 0)}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-600">%</span>
                  <div className={`w-8 h-8 rounded ${divisionColors.socialActivities}`} />
                </div>
              </div>

              {/* Total Percentage Display */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {t('admin.esgService.totalAllocation') || 'Total Allocation'}
                  </span>
                  <span
                    className={`text-lg font-bold ${
                      Math.abs(totalPercentage - 100) < 0.1
                        ? 'text-green-600'
                        : totalPercentage > 100
                        ? 'text-red-600'
                        : 'text-yellow-600'
                    }`}
                  >
                    {totalPercentage.toFixed(1)}%
                  </span>
                </div>
                {Math.abs(totalPercentage - 100) > 0.1 && (
                  <p className="text-xs text-red-600 mt-1">
                    {t('admin.esgService.percentagesMustSumTo100') ||
                      'Percentages must sum to exactly 100%'}
                  </p>
                )}
              </div>

              {/* Visual Allocation Bar */}
              {roofSize && (
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    {t('admin.esgService.visualAllocation') || 'Visual Allocation'}
                  </h3>
                  <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden border-2 border-gray-300">
                    {divisions.greenRoof > 0 && (
                      <div
                        className={`h-full float-left ${divisionColors.greenRoof}`}
                        style={{ width: `${divisions.greenRoof}%` }}
                        title={`${divisionLabels.greenRoof}: ${divisions.greenRoof}%`}
                      />
                    )}
                    {divisions.noxReduction > 0 && (
                      <div
                        className={`h-full float-left ${divisionColors.noxReduction}`}
                        style={{ width: `${divisions.noxReduction}%` }}
                        title={`${divisionLabels.noxReduction}: ${divisions.noxReduction}%`}
                      />
                    )}
                    {divisions.coolRoof > 0 && (
                      <div
                        className={`h-full float-left ${divisionColors.coolRoof}`}
                        style={{ width: `${divisions.coolRoof}%` }}
                        title={`${divisionLabels.coolRoof}: ${divisions.coolRoof}%`}
                      />
                    )}
                    {divisions.socialActivities > 0 && (
                      <div
                        className={`h-full float-left ${divisionColors.socialActivities}`}
                        style={{ width: `${divisions.socialActivities}%` }}
                        title={`${divisionLabels.socialActivities}: ${divisions.socialActivities}%`}
                      />
                    )}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Calculate Button */}
            <div className="mt-6">
              <button
                onClick={handleCalculate}
                disabled={loadingCalculation || !roofSize || Math.abs(totalPercentage - 100) > 0.1}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loadingCalculation ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('admin.esgService.calculating') || 'Calculating...'}
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4 mr-2" />
                    {t('admin.esgService.calculateMetrics') || 'Calculate ESG Metrics'}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Calculated Metrics Preview */}
          {calculatedMetrics && (
            <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Leaf className="w-5 h-5 mr-2 text-green-600" />
                {t('admin.esgService.calculatedMetrics') || 'Calculated ESG Metrics'}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <ListCard>
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border-4 bg-green-50 border-green-200 text-green-600 mb-3">
                      <span className="text-2xl font-bold">{calculatedMetrics.sustainabilityScore}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {t('buildings.esg.sustainabilityScore') || 'Sustainability Score'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{calculatedMetrics.rating}</p>
                  </div>
                </ListCard>

                <ListCard>
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 border-4 border-blue-200 mb-3">
                      <span className="text-2xl font-bold text-blue-600">
                        {calculatedMetrics.carbonFootprint.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {t('buildings.esg.carbonFootprint') || 'Carbon Footprint'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">kg CO₂</p>
                  </div>
                </ListCard>

                <ListCard>
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-50 border-4 border-yellow-200 mb-3">
                      <span className="text-2xl font-bold text-yellow-600">
                        {calculatedMetrics.solarPotential.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {t('buildings.esg.solarPotential') || 'Solar Potential'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">kWh/year</p>
                  </div>
                </ListCard>

                <ListCard>
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 border-4 border-green-200 mb-3">
                      <span className="text-2xl font-bold text-green-600">
                        {calculatedMetrics.recyclingPotential}%
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {t('buildings.esg.recyclingPotential') || 'Recycling Potential'}
                    </p>
                  </div>
                </ListCard>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <IconLabel
                  icon={Leaf}
                  label={t('buildings.esg.annualCO2Offset') || 'Annual CO₂ Offset'}
                  value={`${calculatedMetrics.annualCO2Offset.toLocaleString()} kg CO₂/year`}
                />
                {calculatedMetrics.neutralityTimeline && (
                  <IconLabel
                    icon={Calculator}
                    label={t('buildings.esg.neutralityTimeline') || 'CO₂ Neutrality Timeline'}
                    value={`${calculatedMetrics.neutralityTimeline} ${t('buildings.esg.years') || 'years'}`}
                  />
                )}
              </div>

              {/* SDG Alignment */}
              {calculatedMetrics.sdgAlignment.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {t('buildings.esg.sdgAlignment') || 'SDG Alignment'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {calculatedMetrics.sdgAlignment.map((sdg) => (
                      <StatusBadge
                        key={sdg}
                        status="active"
                        label={sdg}
                        className="bg-blue-100 text-blue-800"
                        useTranslation={false}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {t('buildings.esg.sdgScore') || 'SDG Score'}: {calculatedMetrics.sdgScore}%
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('common.saving') || 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {existingReportId
                        ? t('common.update') || 'Update Report'
                        : t('common.save') || 'Save Report'}
                    </>
                  )}
                </button>

                {existingReportId && (
                  <button
                    onClick={handleGeneratePublicLink}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    {publicLink
                      ? t('admin.esgService.viewPublicLink') || 'View Public Link'
                      : t('admin.esgService.generatePublicLink') || 'Generate Public Link'}
                  </button>
                )}

                {publicLink && (
                  <a
                    href={publicLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {t('admin.esgService.preview') || 'Preview'}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Public Link Modal */}
      {showPublicLinkModal && publicLink && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {t('admin.esgService.publicLink') || 'Public Report Link'}
              </h3>
              <button
                onClick={() => setShowPublicLinkModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {t('admin.esgService.publicLinkDescription') ||
                'Share this link with your customer. They can view the ESG report without logging in.'}
            </p>
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="text"
                readOnly
                value={publicLink}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                title={t('common.copy') || 'Copy'}
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowPublicLinkModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                {t('common.close') || 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ESGService;
