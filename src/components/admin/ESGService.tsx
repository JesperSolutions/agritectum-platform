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

  // Load buildings for selected customer
  useEffect(() => {
    if (selectedCustomer) {
      loadBuildingsForCustomer(selectedCustomer.id);
    } else {
      setBuildings([]);
      setSelectedBuilding(null);
    }
  }, [selectedCustomer]);

  const loadBuildingsForCustomer = async (customerId: string) => {
    setLoadingBuildings(true);
    try {
      // Fetch all buildings and filter by customerId
      const allBuildings = await getBuildingsByBranch(currentUser?.branchId || '');
      const filtered = allBuildings.filter(b => b.customerId === customerId);
      setBuildings(filtered);
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

      {/* Customer Search/Selection */}
      <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Search className="w-5 h-5 mr-2" />
          {t('admin.esgService.selectCustomer') || 'Select Customer'}
        </h2>
        <CustomerSearch onCustomerSelect={setSelectedCustomer} />
        {selectedCustomer && (
          <div className="mt-2 text-green-700 font-semibold">
            {selectedCustomer.name} {selectedCustomer.email && <span className="text-xs text-slate-500">({selectedCustomer.email})</span>}
          </div>
        )}
      </div>

      {/* Building Selection (only after customer is selected) */}
      {selectedCustomer && (
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
      )}

      {/* Selected Building Form */}
      {selectedBuilding && (
        // ...existing code for the ESG report form...
        <div className="space-y-6">
          {/* Building Info */}
          {/* ...existing code... */}
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
