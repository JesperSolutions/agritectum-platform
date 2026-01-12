/**
 * Building ESG Improvements Admin Page
 * 
 * Allows branch admins to select buildings and configure ESG improvements
 * (green roofs, solar panels, water management, etc.)
 */

import React, { useState, useEffect } from 'react';
import {
  Building as BuildingIcon,
  Search,
  Calculator,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useIntl } from '../../hooks/useIntl';
import { useToast } from '../../contexts/ToastContext';
import {
  Building,
  RoofImprovement,
  ImprovementType,
} from '../../types';
import {
  getBuildingsByBranch,
  getBuildingById,
} from '../../services/buildingService';
import {
  calculateBuildingImprovementImpact,
  saveBuildingImprovements,
  getBuildingImprovements,
  createDefaultImprovements,
  getImprovementRecommendations,
} from '../../services/buildingImprovementService';
import { getBuildingESGMetrics } from '../../services/esgService';
import { IMPROVEMENT_COST_FACTORS } from '../../utils/improvementCalculations';
import LoadingSpinner from '../common/LoadingSpinner';
import PageHeader from '../shared/layouts/PageHeader';
import ListCard from '../shared/cards/ListCard';
import IconLabel from '../shared/layouts/IconLabel';
import ImprovementCard from './improvements/ImprovementCard';
import RoofDivisionVisualization from './improvements/RoofDivisionVisualization';
import ImprovementResults from './improvements/ImprovementResults';

const BuildingESGImprovements: React.FC = () => {
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

  // Improvement configuration
  const [improvements, setImprovements] = useState<Map<ImprovementType, RoofImprovement | null>>(
    new Map()
  );
  const [calculatedMetrics, setCalculatedMetrics] = useState<ReturnType<
    typeof calculateBuildingImprovementImpact
  > | null>(null);
  const [savedImprovements, setSavedImprovements] = useState<any>(null);
  // Inline error state for validation and async errors
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
            {t('admin.improvements.accessDenied') ||
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

  // Load saved improvements when building changes
  useEffect(() => {
    if (selectedBuilding) {
      loadSavedImprovements();
    }
  }, [selectedBuilding]);

  const loadBuildings = async () => {
    if (!currentUser?.branchId) return;
    setLoadingBuildings(true);
    try {
      const data = await getBuildingsByBranch(currentUser.branchId);
      setBuildings(data);
    } catch (error) {
      console.error('Error loading buildings:', error);
      showError(t('admin.improvements.errorLoadingBuildings') || 'Failed to load buildings');
    } finally {
      setLoadingBuildings(false);
    }
  };

  const loadSavedImprovements = async () => {
    if (!selectedBuilding) return;
    try {
      const saved = await getBuildingImprovements(selectedBuilding.id);
      if (saved) {
        setSavedImprovements(saved);
        // Load improvements into state
        const improvementsMap = new Map<ImprovementType, RoofImprovement | null>();
        for (const imp of saved.improvements) {
          improvementsMap.set(imp.type, imp);
        }
        setImprovements(improvementsMap);
      } else {
        // Create default improvements based on recommendations
        const defaultImps = createDefaultImprovements(selectedBuilding);
        const improvementsMap = new Map<ImprovementType, RoofImprovement | null>();
        for (const imp of defaultImps) {
          improvementsMap.set(imp.type, imp);
        }
        setImprovements(improvementsMap);
      }
    } catch (error) {
      console.error('Error loading saved improvements:', error);
    }
  };

  const handleBuildingSelect = async (buildingId: string) => {
    setLoadingBuilding(true);
    setCalculatedMetrics(null);
    setInlineError(null);
    try {
      const building = await getBuildingById(buildingId);
      if (building) {
        setSelectedBuilding(building);
        // Load or create default improvements
        await loadSavedImprovements();
      }
    } catch (error) {
      console.error('Error loading building:', error);
      setInlineError(t('admin.improvements.errorLoadingBuilding') || 'Failed to load building');
      showError(t('admin.improvements.errorLoadingBuilding') || 'Failed to load building');
    } finally {
      setLoadingBuilding(false);
    }
  };

  const handleImprovementToggle = (type: ImprovementType, enabled: boolean) => {
    const newImprovements = new Map(improvements);
    if (enabled) {
      newImprovements.set(type, {
        type,
        percentage: 0,
        startYear: 0,
        costPerSqm: IMPROVEMENT_COST_FACTORS[type],
      });
    } else {
      newImprovements.set(type, null);
    }
    setImprovements(newImprovements);
    setCalculatedMetrics(null); // Clear previous calculations
    setInlineError(null);
  };

  const handleImprovementUpdate = (improvement: RoofImprovement) => {
  const newImprovements = new Map(improvements);
  newImprovements.set(improvement.type, improvement);
  setImprovements(newImprovements);
  setCalculatedMetrics(null); // Clear previous calculations
  setInlineError(null);
  };

  const handleCalculate = async () => {
    setInlineError(null);
    if (!selectedBuilding) {
      setInlineError(t('admin.improvements.selectBuilding') || 'Please select a building');
      showError(t('admin.improvements.selectBuilding') || 'Please select a building');
      return;
    }

    if (!selectedBuilding.roofSize || selectedBuilding.roofSize <= 0) {
      setInlineError(t('admin.improvements.noRoofSize') || 'Building roof size is not set.');
      showError(t('admin.improvements.noRoofSize') || 'Building roof size is not set.');
      return;
    }

    const activeImprovements = Array.from(improvements.values()).filter(
      (imp): imp is RoofImprovement => imp !== null && imp.percentage > 0
    );

    if (activeImprovements.length === 0) {
      setInlineError(t('admin.improvements.noImprovementsSelected') || 'Please select at least one improvement');
      showError(t('admin.improvements.noImprovementsSelected') || 'Please select at least one improvement');
      return;
    }

    // Validate total percentage
    const totalPercentage = activeImprovements.reduce(
      (sum, imp) => sum + imp.percentage,
      0
    );
    if (totalPercentage > 100) {
      setInlineError(t('admin.improvements.overAllocated') || 'Total percentage cannot exceed 100%');
      showError(t('admin.improvements.overAllocated') || 'Total percentage cannot exceed 100%');
      return;
    }
    if (totalPercentage < 1) {
      setInlineError('Total improvement allocation must be at least 1%.');
      showError('Total improvement allocation must be at least 1%.');
      return;
    }

    setLoadingCalculation(true);
    try {
      // Ensure building has ESG metrics
      if (!selectedBuilding.esgMetrics) {
        const esgMetrics = await getBuildingESGMetrics(
          selectedBuilding,
          currentUser.branchId
        );
        selectedBuilding.esgMetrics = esgMetrics;
      }

      const metrics = calculateBuildingImprovementImpact(
        selectedBuilding,
        activeImprovements
      );
      setCalculatedMetrics(metrics);
    } catch (error) {
      console.error('Error calculating impact:', error);
      setInlineError(t('admin.improvements.errorCalculating') || 'Failed to calculate impact');
      showError(t('admin.improvements.errorCalculating') || 'Failed to calculate impact');
    } finally {
      setLoadingCalculation(false);
    }
  };

  const handleSave = async () => {
    setInlineError(null);
    if (!selectedBuilding || !calculatedMetrics) {
      setInlineError('Please select a building and calculate improvements before saving.');
      showError('Please select a building and calculate improvements before saving.');
      return;
    }

    if (!selectedBuilding.roofSize || selectedBuilding.roofSize <= 0) {
      setInlineError(t('admin.improvements.noRoofSize') || 'Building roof size is not set.');
      showError(t('admin.improvements.noRoofSize') || 'Building roof size is not set.');
      return;
    }

    const activeImprovements = Array.from(improvements.values()).filter(
      (imp): imp is RoofImprovement => imp !== null && imp.percentage > 0
    );

    if (activeImprovements.length === 0) {
      setInlineError(t('admin.improvements.noImprovementsSelected') || 'Please select at least one improvement');
      showError(t('admin.improvements.noImprovementsSelected') || 'Please select at least one improvement');
      return;
    }

    // Validate total percentage
    const totalPercentage = activeImprovements.reduce(
      (sum, imp) => sum + imp.percentage,
      0
    );
    if (totalPercentage > 100) {
      setInlineError(t('admin.improvements.overAllocated') || 'Total percentage cannot exceed 100%');
      showError(t('admin.improvements.overAllocated') || 'Total percentage cannot exceed 100%');
      return;
    }
    if (totalPercentage < 1) {
      setInlineError('Total improvement allocation must be at least 1%.');
      showError('Total improvement allocation must be at least 1%.');
      return;
    }

    setSaving(true);
    try {
      await saveBuildingImprovements(
        selectedBuilding.id,
        activeImprovements,
        calculatedMetrics
      );

      showSuccess(
        t('admin.improvements.savedSuccessfully') ||
          'Improvements saved successfully'
      );
      
      // Reload saved improvements to show updated state
      await loadSavedImprovements();
      setSavedImprovements({
        improvements: activeImprovements,
        metrics: calculatedMetrics.financialMetrics,
        scenarios: calculatedMetrics.scenarios,
      });
    } catch (error) {
      console.error('Error saving improvements:', error);
      setInlineError(t('admin.improvements.errorSaving') || 'Failed to save improvements');
      showError(t('admin.improvements.errorSaving') || 'Failed to save improvements');
    } finally {
      setSaving(false);
    }
  };

  const filteredBuildings = buildings.filter((building) =>
    building.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeImprovements = Array.from(improvements.values()).filter(
    (imp): imp is RoofImprovement => imp !== null && imp.percentage > 0
  );
  const totalPercentage = activeImprovements.reduce(
    (sum, imp) => sum + imp.percentage,
    0
  );
  const maxPercentage = 100 - (totalPercentage - (activeImprovements.find(imp => imp.percentage > 0)?.percentage || 0));

  const improvementTypes: ImprovementType[] = [
    'green_roof',
    'solar_panels',
    'water_management',
    'insulation',
    'cooling',
    'biodiversity',
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={t('admin.improvements.title') || 'Building ESG Improvements'}
        subtitle={
          t('admin.improvements.subtitle') ||
          'Configure and calculate ESG improvements for buildings'
        }
      />

      {/* Building Selection */}
      <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <BuildingIcon className="w-5 h-5 mr-2" />
          {t('admin.improvements.selectBuilding') || 'Select Building'}
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
                placeholder={t('admin.improvements.searchBuildings') || 'Search buildings...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Building List */}
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
              {filteredBuildings.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {t('admin.improvements.noBuildings') || 'No buildings found'}
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

      {/* Selected Building Info */}
      {selectedBuilding && (
        <>
          <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
            <h2 className="text-lg font-semibold mb-4">
              {t('admin.improvements.buildingInfo') || 'Building Information'}
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
              {selectedBuilding.roofSize && (
                <IconLabel
                  icon={BuildingIcon}
                  label={t('buildings.roofSize') || 'Roof Size'}
                  value={`${selectedBuilding.roofSize} m²`}
                />
              )}
            </div>

            {/* Recommendations */}
            {selectedBuilding.roofSize && selectedBuilding.roofSize > 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <Lightbulb className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">
                      {t('admin.improvements.recommendations') || 'Recommendations'}
                    </p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {getImprovementRecommendations(selectedBuilding).map((rec, idx) => (
                        <li key={idx}>
                          • {rec.reason} ({t('admin.improvements.suggested') || 'Suggested'}:{' '}
                          {rec.suggestedPercentage}%)
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Improvement Configuration */}
          {selectedBuilding.roofSize && selectedBuilding.roofSize > 0 && (
            <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
              {inlineError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                  <AlertCircle className="inline w-4 h-4 mr-2 align-text-bottom" />
                  {inlineError}
                </div>
              )}
              <h2 className="text-lg font-semibold mb-4">
                {t('admin.improvements.configureImprovements') ||
                  'Configure Improvements'}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {improvementTypes.map((type) => (
                  <ImprovementCard
                    key={type}
                    type={type}
                    improvement={improvements.get(type) || null}
                    roofArea={selectedBuilding.roofSize || 0}
                    enabled={improvements.get(type) !== null}
                    onToggle={(enabled) => handleImprovementToggle(type, enabled)}
                    onUpdate={handleImprovementUpdate}
                    maxPercentage={100}
                  />
                ))}
              </div>

              {/* Roof Division Visualization */}
              <RoofDivisionVisualization
                improvements={activeImprovements}
                roofArea={selectedBuilding.roofSize || 0}
              />

              {/* Calculate Button */}
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleCalculate}
                  disabled={loadingCalculation || activeImprovements.length === 0}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {loadingCalculation ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>
                        {t('admin.improvements.calculating') || 'Calculating...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Calculator className="w-5 h-5" />
                      <span>
                        {t('admin.improvements.calculateImpact') ||
                          'Calculate Impact'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Results */}
          {calculatedMetrics && (
            <>
              <ImprovementResults
                metrics={calculatedMetrics}
                onExport={(format) => {
                  // TODO: Implement export functionality
                  console.log('Export as', format);
                }}
              />

              {/* Save Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{t('admin.improvements.saving') || 'Saving...'}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>
                        {t('admin.improvements.saveImprovements') ||
                          'Save Improvements'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* No Roof Size Warning */}
          {(!selectedBuilding.roofSize || selectedBuilding.roofSize <= 0) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                <p className="text-sm text-gray-700">
                  {t('admin.improvements.noRoofSize') ||
                    'Building roof size is not set. Please set roof size before configuring improvements.'}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BuildingESGImprovements;
