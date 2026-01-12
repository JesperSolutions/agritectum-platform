/**
 * Public ESG Report View Component
 * 
 * Customer-facing view for ESG service reports
 * Accessed via public link, no authentication required
 */

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useIntl } from '../../hooks/useIntl';
import { ESGServiceReport, ESGMetrics, Building } from '../../types';
import { getPublicESGServiceReport } from '../../services/esgService';
import { getBuildingById } from '../../services/buildingService';
import LoadingSpinner from '../common/LoadingSpinner';
import EnhancedErrorDisplay from '../EnhancedErrorDisplay';
import ListCard from '../shared/cards/ListCard';
import IconLabel from '../shared/layouts/IconLabel';
import StatusBadge from '../shared/badges/StatusBadge';
import {
  Leaf,
  Sun,
  Recycle,
  TrendingUp,
  Target,
  Award,
  Calendar,
  AlertCircle,
  Download,
  Building as BuildingIcon,
  MapPin,
} from 'lucide-react';

const PublicESGReportView: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const { t } = useIntl();
  const [report, setReport] = useState<ESGServiceReport | null>(null);
  const [building, setBuilding] = useState<Building | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchReport = async () => {
      if (!reportId) {
        setError('No report ID provided');
        setLoading(false);
        return;
      }

      try {
        const reportData = await getPublicESGServiceReport(reportId);

        if (!reportData) {
          setError('Report not found or not publicly accessible');
          setLoading(false);
          return;
        }

        if (!reportData.isPublic) {
          setError('This report is not publicly accessible');
          setLoading(false);
          return;
        }

        setReport(reportData);

        // Load building information
        if (reportData.buildingId) {
          try {
            const buildingData = await getBuildingById(reportData.buildingId);
            if (buildingData) {
              setBuilding(buildingData);
            }
          } catch (error) {
            console.warn('Could not load building information:', error);
          }
        }
      } catch (err) {
        console.error('Error fetching ESG report:', err);
        setError('Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId]);

  const handleExportPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !report || !report.calculatedMetrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <EnhancedErrorDisplay
          error={error || 'The requested report could not be found or is no longer available.'}
          title="Report Not Found"
          showContactSupport={true}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const metrics = report.calculatedMetrics;
  const totalPercentage = report.divisions.greenRoof +
    report.divisions.noxReduction +
    report.divisions.coolRoof +
    report.divisions.socialActivities;

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

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('sv-SE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">
              {t('admin.esgService.publicReportTitle') || 'ESG Sustainability Report'}
            </h1>
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              {t('common.exportPDF') || 'Export PDF'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Building Information */}
          {building && (
            <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <BuildingIcon className="w-5 h-5 mr-2 text-slate-600" />
                {t('buildings.buildingInformation') || 'Building Information'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <IconLabel
                  icon={MapPin}
                  label={t('buildings.address') || 'Address'}
                  value={building.address}
                />
                {building.buildingType && (
                  <IconLabel
                    icon={BuildingIcon}
                    label={t('buildings.buildingType') || 'Building Type'}
                    value={building.buildingType}
                  />
                )}
              </div>
            </div>
          )}

          {/* Report Information */}
          <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <Leaf className="w-5 h-5 mr-2 text-green-600" />
                {t('buildings.esg.title') || 'ESG Metrics'}
              </h2>
              {report.createdAt && (
                <p className="text-sm text-gray-500">
                  {t('buildings.esg.lastCalculated') || 'Created'}: {formatDate(report.createdAt)}
                </p>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-6">
              {t('buildings.esg.description') ||
                'Environmental, Social, and Governance metrics for this building'}
            </p>

            {/* Roof Size and Division Summary */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <IconLabel
                  icon={BuildingIcon}
                  label={t('admin.esgService.roofSize') || 'Total Roof Area'}
                  value={`${report.roofSize.toLocaleString()} m²`}
                />
              </div>

              {/* Division Breakdown */}
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  {t('admin.esgService.roofDivision') || 'Roof Division Allocation'}
                </h3>
                <div className="space-y-2">
                  {report.divisions.greenRoof > 0 && (
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded ${divisionColors.greenRoof}`} />
                        <span className="text-sm font-medium text-gray-700">
                          {divisionLabels.greenRoof}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {report.divisions.greenRoof}%
                      </span>
                    </div>
                  )}
                  {report.divisions.noxReduction > 0 && (
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded ${divisionColors.noxReduction}`} />
                        <span className="text-sm font-medium text-gray-700">
                          {divisionLabels.noxReduction}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {report.divisions.noxReduction}%
                      </span>
                    </div>
                  )}
                  {report.divisions.coolRoof > 0 && (
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded ${divisionColors.coolRoof}`} />
                        <span className="text-sm font-medium text-gray-700">
                          {divisionLabels.coolRoof}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {report.divisions.coolRoof}%
                      </span>
                    </div>
                  )}
                  {report.divisions.socialActivities > 0 && (
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded ${divisionColors.socialActivities}`} />
                        <span className="text-sm font-medium text-gray-700">
                          {divisionLabels.socialActivities}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {report.divisions.socialActivities}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Visual Allocation Bar */}
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden border-2 border-gray-300">
                    {report.divisions.greenRoof > 0 && (
                      <div
                        className={`h-full float-left ${divisionColors.greenRoof}`}
                        style={{ width: `${report.divisions.greenRoof}%` }}
                      />
                    )}
                    {report.divisions.noxReduction > 0 && (
                      <div
                        className={`h-full float-left ${divisionColors.noxReduction}`}
                        style={{ width: `${report.divisions.noxReduction}%` }}
                      />
                    )}
                    {report.divisions.coolRoof > 0 && (
                      <div
                        className={`h-full float-left ${divisionColors.coolRoof}`}
                        style={{ width: `${report.divisions.coolRoof}%` }}
                      />
                    )}
                    {report.divisions.socialActivities > 0 && (
                      <div
                        className={`h-full float-left ${divisionColors.socialActivities}`}
                        style={{ width: `${report.divisions.socialActivities}%` }}
                      />
                    )}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Metrics Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Sustainability Score */}
              <ListCard>
                <div className="text-center">
                  <div
                    className={`inline-flex items-center justify-center w-16 h-16 rounded-full border-4 mb-3 ${getScoreBgColor(
                      metrics.sustainabilityScore
                    )} ${getScoreColor(metrics.sustainabilityScore)}`}
                  >
                    <span className="text-2xl font-bold">{metrics.sustainabilityScore}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {t('buildings.esg.sustainabilityScore') || 'Sustainability Score'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{metrics.rating}</p>
                </div>
              </ListCard>

              {/* Carbon Footprint */}
              <ListCard>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 border-4 border-blue-200 mb-3">
                    <TrendingUp className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {metrics.carbonFootprint.toLocaleString()}
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {t('buildings.esg.carbonFootprint') || 'Carbon Footprint'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">kg CO₂</p>
                </div>
              </ListCard>

              {/* Solar Potential */}
              <ListCard>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-50 border-4 border-yellow-200 mb-3">
                    <Sun className="w-8 h-8 text-yellow-600" />
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {metrics.solarPotential.toLocaleString()}
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {t('buildings.esg.solarPotential') || 'Solar Potential'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">kWh/year</p>
                </div>
              </ListCard>

              {/* Recycling Potential */}
              <ListCard>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 border-4 border-green-200 mb-3">
                    <Recycle className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">{metrics.recyclingPotential}%</p>
                  <p className="text-sm font-medium text-gray-900">
                    {t('buildings.esg.recyclingPotential') || 'Recycling Potential'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('buildings.esg.materialRecyclable') || 'Material recyclable'}
                  </p>
                </div>
              </ListCard>
            </div>

            {/* Detailed Metrics */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-green-600" />
                {t('buildings.esg.detailedMetrics') || 'Detailed Metrics'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
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
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {t('buildings.esg.sdgAlignment') || 'SDG Alignment'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {metrics.sdgAlignment.length > 0 ? (
                        metrics.sdgAlignment.map((sdg) => (
                          <StatusBadge
                            key={sdg}
                            status="active"
                            label={sdg}
                            className="bg-blue-100 text-blue-800"
                            useTranslation={false}
                          />
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">
                          {t('buildings.esg.noSDGs') || 'No SDGs identified'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {t('buildings.esg.sdgScore') || 'SDG Score'}: {metrics.sdgScore}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-blue-600" />
                {t('buildings.esg.recommendations') || 'Recommendations'}
              </h3>
              <div className="space-y-3">
                {metrics.sustainabilityScore < 60 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-gray-700">
                      {t('buildings.esg.recommendation.lowScore') ||
                        'Consider upgrading to more sustainable roofing materials to improve your ESG score.'}
                    </p>
                  </div>
                )}
                {metrics.solarPotential > 0 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-gray-700">
                      {t('buildings.esg.recommendation.solar') ||
                        `This building has significant solar potential (${metrics.solarPotential.toLocaleString()} kWh/year). Consider installing solar panels to reduce carbon footprint.`}
                    </p>
                  </div>
                )}
                {metrics.recyclingPotential >= 70 && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-gray-700">
                      {t('buildings.esg.recommendation.recycling') ||
                        'Your roofing material has high recycling potential. Ensure proper recycling at end of life.'}
                    </p>
                  </div>
                )}
                {metrics.neutralityTimeline && metrics.neutralityTimeline > 20 && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm text-gray-700">
                      {(t('buildings.esg.recommendation.neutrality') ||
                        'CO₂ neutrality is projected in {years} years. Consider additional improvements to accelerate this timeline.').replace(
                        '{years}',
                        metrics.neutralityTimeline.toString()
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .print\\:hidden {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default PublicESGReportView;
