import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useIntl } from '../../hooks/useIntl';
import { logger } from '../../utils/logger';
import { Building, ESGPortfolioMetrics, BuildingESGInsight } from '../../types';
import { getBuildingsByCustomer } from '../../services/buildingService';
import { getPortfolioESGMetrics, exportPortfolioESGToCSV } from '../../services/esgPortfolioService';
import {
  TrendingUp,
  Sun,
  Cloud,
  Droplet,
  Leaf,
  Wind,
  AlertTriangle,
  Download,
  Filter,
  ChevronDown,
  Phone,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Calendar,
  Zap,
  Home,
  DollarSign,
} from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import PageHeader from '../shared/layouts/PageHeader';
import StatusBadge from '../shared/badges/StatusBadge';
import { formatDate } from '../../utils/dateFormatter';

const ESGOverview: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useIntl();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [metrics, setMetrics] = useState<ESGPortfolioMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'solar' | 'white-roof' | 'green' | 'nox'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'potential' | 'utilization'>('name');
  const [expandedBuilding, setExpandedBuilding] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.companyId || currentUser?.uid) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      const customerId = currentUser?.companyId || currentUser?.uid;
      if (!customerId) throw new Error('No customer ID');

      const buildingsData = await getBuildingsByCustomer(customerId);
      setBuildings(buildingsData);

      const metricsData = await getPortfolioESGMetrics(customerId);
      setMetrics(metricsData);
    } catch (error) {
      logger.error('[ESGOverview] Load failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBuildings = (): Building[] => {
    let filtered = buildings;

    switch (filter) {
      case 'solar':
        filtered = buildings.filter(b => b.esgMetrics?.features?.solarPanels?.installed);
        break;
      case 'white-roof':
        filtered = buildings.filter(b => b.esgMetrics?.features?.whiteRoof?.installed);
        break;
      case 'green':
        filtered = buildings.filter(b => b.esgMetrics?.features?.greenRoof?.installed);
        break;
      case 'nox':
        filtered = buildings.filter(b => b.esgMetrics?.features?.noxTreatment?.installed);
        break;
    }

    // Sort
    switch (sortBy) {
      case 'potential':
        filtered.sort((a, b) => {
          const scoreA = a.esgMetrics?.sustainabilityScore || 0;
          const scoreB = b.esgMetrics?.sustainabilityScore || 0;
          return scoreB - scoreA;
        });
        break;
      case 'utilization':
        filtered.sort((a, b) => {
          const areaA = a.roofSize || 0;
          const areaB = b.roofSize || 0;
          return areaB - areaA;
        });
        break;
      case 'name':
      default:
        filtered.sort((a, b) => (a.name || a.address).localeCompare(b.name || b.address));
    }

    return filtered;
  };

  const exportCSV = () => {
    const csv = exportPortfolioESGToCSV(metrics!, buildings);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ESG-Portfolio-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className='text-center py-12'>
        <p className='text-gray-600'>Unable to load ESG data</p>
      </div>
    );
  }

  const filteredBuildings = filterBuildings();

  return (
    <div className='space-y-6'>
      {/* Header */}
      <PageHeader
        title={t('buildings.overview.title')}
        subtitle={t('buildings.overview.subtitle')}
      />

      {/* Buildings List - MOVED TO TOP */}
      <div className='bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden'>
        <div className='p-6 border-b border-slate-200'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-xl font-semibold'>{t('buildings.buildingsTable.header')}</h3>
            <button
              onClick={exportCSV}
              className='flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium'
            >
              <Download className='w-4 h-4' />
              {t('buildings.buildingsTable.exportCsv')}
            </button>
          </div>

          {/* Filters & Sort */}
          <div className='flex flex-col md:flex-row gap-3'>
            <div className='flex items-center gap-2'>
              <Filter className='w-4 h-4 text-gray-600' />
              <select
                value={filter}
                onChange={e => setFilter(e.target.value as typeof filter)}
                className='px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500'
              >
                <option value='all'>{t('buildings.buildingsTable.filterAll')}</option>
                <option value='solar'>{t('buildings.buildingsTable.filterSolar')}</option>
                <option value='white-roof'>{t('buildings.buildingsTable.filterWhiteRoof')}</option>
                <option value='green'>{t('buildings.buildingsTable.filterGreen')}</option>
                <option value='nox'>{t('buildings.buildingsTable.filterNox')}</option>
              </select>
            </div>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className='px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500'
            >
              <option value='name'>{t('buildings.buildingsTable.sortName')}</option>
              <option value='potential'>{t('buildings.buildingsTable.sortPotential')}</option>
              <option value='utilization'>{t('buildings.buildingsTable.sortUtilization')}</option>
            </select>
          </div>
        </div>

        {/* Buildings Table */}
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-50 border-b border-gray-200'>
              <tr>
                <th className='px-6 py-3 text-left text-sm font-semibold text-gray-900'>
                  {t('buildings.buildingsTable.colName')}
                </th>
                <th className='px-6 py-3 text-left text-sm font-semibold text-gray-900'>
                  {t('buildings.buildingsTable.colRoofArea')}
                </th>
                <th className='px-6 py-3 text-left text-sm font-semibold text-gray-900'>
                  {t('buildings.buildingsTable.colFeatures')}
                </th>
                <th className='px-6 py-3 text-left text-sm font-semibold text-gray-900'>
                  {t('buildings.buildingsTable.colSustainability')}
                </th>
                <th className='px-6 py-3 text-left text-sm font-semibold text-gray-900'>
                  {t('buildings.buildingsTable.colCo2')}
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200'>
              {filteredBuildings.map(building => (
                <React.Fragment key={building.id}>
                  <tr className='hover:bg-gray-50 cursor-pointer'>
                    <td className='px-6 py-4'>
                      <p className='font-medium text-gray-900'>{building.name || building.address}</p>
                      <p className='text-sm text-gray-600 truncate max-w-xs'>{building.address}</p>
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-600'>
                      {building.roofSize ? `${building.roofSize.toLocaleString()} m²` : '—'}
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex flex-wrap gap-2'>
                        {building.esgMetrics?.features?.solarPanels?.installed && (
                          <FeatureBadge icon={Sun} label='Solar' color='yellow' />
                        )}
                        {building.esgMetrics?.features?.whiteRoof?.installed && (
                          <FeatureBadge icon={Cloud} label='White Roof' color='gray' />
                        )}
                        {building.esgMetrics?.features?.greenRoof?.installed && (
                          <FeatureBadge icon={Leaf} label='Green' color='green' />
                        )}
                        {building.esgMetrics?.features?.blueRoof?.installed && (
                          <FeatureBadge icon={Droplet} label='Blue' color='blue' />
                        )}
                        {building.esgMetrics?.features?.noxTreatment?.installed && (
                          <FeatureBadge icon={Wind} label='NOx' color='blue' />
                        )}
                        {(!building.esgMetrics?.features ||
                          Object.values(building.esgMetrics?.features || {}).filter(f => f).length === 0) && (
                          <span className='text-xs text-gray-500'>—</span>
                        )}
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      {building.esgMetrics?.sustainabilityScore ? (
                        <div className='flex items-center gap-2'>
                          <div className='w-16 h-2 bg-gray-200 rounded-full overflow-hidden'>
                            <div
                              className='h-full bg-green-500'
                              style={{
                                width: `${building.esgMetrics?.sustainabilityScore || 0}%`,
                              }}
                            />
                          </div>
                          <span className='text-sm font-semibold text-gray-900'>
                            {building.esgMetrics?.sustainabilityScore}/100
                          </span>
                        </div>
                      ) : (
                        <span className='text-sm text-gray-500'>—</span>
                      )}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-600'>
                      {building.esgMetrics?.annualCO2Offset
                        ? `${building.esgMetrics.annualCO2Offset.toLocaleString()} kg/yr`
                        : '—'}
                    </td>
                  </tr>

                  {/* Expandable Details */}
                  {expandedBuilding === building.id && (
                    <tr className='bg-gray-50'>
                      <td colSpan={5} className='px-6 py-4'>
                        <BuildingDetailsExpanded building={building} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Portfolio KPI Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <KPICard
          label={t('buildings.kpi.totalBuildings')}
          value={metrics.totalBuildings}
          icon={Home}
          color='blue'
        />
        <KPICard
          label={t('buildings.kpi.totalRoofArea')}
          value={`${metrics.totalRoofArea.toLocaleString()} m²`}
          icon={TrendingUp}
          color='green'
        />
        <KPICard
          label={t('buildings.kpi.portfolioRating')}
          value={metrics.portfolioRating}
          icon={Star}
          color='purple'
        />
        <KPICard
          label={t('buildings.kpi.avgSustainability')}
          value={`${metrics.averageSustainabilityScore}/100`}
          icon={Leaf}
          color='green'
        />
      </div>

      {/* Solar & ESG Features Grid */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <FeatureCard
          title={t('buildings.features.solar')}
          stats={[
            { label: t('buildings.esgMetrics.totalCapacity'), value: `${metrics.totalSolarCapacity} kW` },
            { label: t('buildings.esgMetrics.annualOutput'), value: `${metrics.totalSolarOutput.toLocaleString()} kWh` },
            { label: t('buildings.esgMetrics.buildings'), value: `${metrics.buildingsWithSolar}/${metrics.totalBuildings}` },
            { label: t('buildings.esgMetrics.penetration'), value: `${metrics.solarPenetration}%` },
          ]}
          icon={Sun}
          color='yellow'
        />
        <FeatureCard
          title={t('buildings.features.nox')}
          stats={[
            {
              label: t('buildings.esgMetrics.installed'),
              value: `${metrics.buildingsWithNoxTreatment}/${metrics.totalBuildings}`,
            },
            { label: t('buildings.esgMetrics.penetration'), value: `${metrics.noxTreatmentPenetration}%` },
          ]}
          icon={Wind}
          color='blue'
        />
        <FeatureCard
          title={t('buildings.features.white')}
          stats={[
            { label: t('buildings.esgMetrics.coverage'), value: `${metrics.whiteRoofCoverage}%` },
            { label: t('buildings.esgMetrics.area'), value: `${metrics.totalWhiteRoofArea.toLocaleString()} m²` },
            {
              label: t('buildings.esgMetrics.buildings'),
              value: `${metrics.buildingsWithWhiteRoof}/${metrics.totalBuildings}`,
            },
          ]}
          icon={Cloud}
          color='gray'
        />
      </div>

      {/* Green & Blue Roof */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <FeatureCard
          title={t('buildings.features.green')}
          stats={[
            { label: t('buildings.esgMetrics.coverage'), value: `${metrics.greenRoofCoverage}%` },
            { label: t('buildings.esgMetrics.area'), value: `${metrics.totalGreenRoofArea.toLocaleString()} m²` },
            {
              label: t('buildings.esgMetrics.buildings'),
              value: `${metrics.buildingsWithGreenRoof}/${metrics.totalBuildings}`,
            },
          ]}
          icon={Leaf}
          color='green'
        />
        <FeatureCard
          title={t('buildings.features.blue')}
          stats={[
            { label: t('buildings.esgMetrics.coverage'), value: `${metrics.blueRoofCoverage}%` },
            { label: t('buildings.esgMetrics.area'), value: `${metrics.totalBlueRoofArea.toLocaleString()} m²` },
            {
              label: t('buildings.esgMetrics.storageCapacity'),
              value: `${metrics.totalWaterStorageCapacity.toLocaleString()} L`,
            },
            {
              label: t('buildings.esgMetrics.buildings'),
              value: `${metrics.buildingsWithBlueRoof}/${metrics.totalBuildings}`,
            },
          ]}
          icon={Droplet}
          color='cyan'
        />
      </div>

      {/* CO2 Metrics */}
      <div className='bg-white rounded-lg shadow-lg p-6 border border-slate-200'>
        <h3 className='text-xl font-semibold mb-4 flex items-center'>
          <Zap className='w-5 h-5 mr-2 text-yellow-600' />
          {t('buildings.co2.title')}
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div>
            <p className='text-sm text-gray-600 mb-1'>{t('buildings.co2.totalFootprint')}</p>
            <p className='text-3xl font-bold text-red-600'>
              {metrics.totalCO2Footprint.toLocaleString()}
            </p>
            <p className='text-xs text-gray-500 mt-1'>{t('buildings.co2.perYear')}</p>
          </div>
          <div>
            <p className='text-sm text-gray-600 mb-1'>{t('buildings.co2.totalOffset')}</p>
            <p className='text-3xl font-bold text-green-600'>
              {metrics.totalCO2Offset.toLocaleString()}
            </p>
            <p className='text-xs text-gray-500 mt-1'>{t('buildings.co2.perYear')}</p>
          </div>
          <div>
            <p className='text-sm text-gray-600 mb-1'>{t('buildings.co2.netFootprint')}</p>
            <p className='text-3xl font-bold text-orange-600'>
              {metrics.netCO2Footprint.toLocaleString()}
            </p>
            <p className='text-xs text-gray-500 mt-1'>{t('buildings.co2.perYear')}</p>
          </div>
        </div>
      </div>

      {/* BIG CTA - Consultation */}
      <ConsultationCTA metrics={metrics} />

      {/* Underutilized Buildings Alert */}
      {metrics.underutilizedBuildings.length > 0 && (
        <AlertSection
          title={`⚠️ ${t('buildings.alerts.underutilized')}`}
          subtitle={t('buildings.alerts.underutilizedDesc')}
          buildings={metrics.underutilizedBuildings}
          type='alert'
        />
      )}

      {/* High Potential Buildings */}
      {metrics.highPotentialBuildings.length > 0 && (
        <AlertSection
          title={`🌟 ${t('buildings.alerts.highPotential')}`}
          subtitle={`${t('buildings.alerts.roofSpace')} ${t('buildings.alerts.highPotential').toLowerCase()}`}
          buildings={metrics.highPotentialBuildings}
          type='success'
        />
      )}
    </div>
  );
};

// Component: KPI Card
const KPICard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}> = ({ label, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className='bg-white rounded-lg shadow p-6 border border-slate-200'>
      <div className='flex items-start justify-between'>
        <div>
          <p className='text-sm text-gray-600 mb-2'>{label}</p>
          <p className='text-3xl font-bold text-gray-900'>{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className='w-6 h-6' />
        </div>
      </div>
    </div>
  );
};

// Component: Feature Card
const FeatureCard: React.FC<{
  title: string;
  stats: Array<{ label: string; value: string }>;
  icon: React.ElementType;
  color: string;
}> = ({ title, stats, icon: Icon, color }) => {
  const colorClasses = {
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    gray: 'bg-gray-50 text-gray-600 border-gray-200',
    cyan: 'bg-cyan-50 text-cyan-600 border-cyan-200',
  };

  return (
    <div
      className={`rounded-lg shadow p-6 border ${colorClasses[color as keyof typeof colorClasses]}`}
    >
      <div className='flex items-center gap-3 mb-4'>
        <Icon className='w-6 h-6' />
        <h4 className='text-lg font-semibold'>{title}</h4>
      </div>
      <div className='space-y-3'>
        {stats.map((stat, idx) => (
          <div key={idx} className='flex justify-between items-center'>
            <span className='text-sm opacity-80'>{stat.label}</span>
            <span className='text-lg font-bold'>{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Component: Feature Badge
const FeatureBadge: React.FC<{
  icon: React.ElementType;
  label: string;
  color: string;
}> = ({ icon: Icon, label, color }) => {
  const colorClasses = {
    yellow: 'bg-yellow-100 text-yellow-800',
    green: 'bg-green-100 text-green-800',
    blue: 'bg-blue-100 text-blue-800',
    gray: 'bg-gray-100 text-gray-800',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        colorClasses[color as keyof typeof colorClasses]
      }`}
    >
      <Icon className='w-3 h-3' />
      {label}
    </span>
  );
};

// Component: Alert Section
const AlertSection: React.FC<{
  title: string;
  subtitle: string;
  buildings: BuildingESGInsight[];
  type: 'alert' | 'success';
}> = ({ title, subtitle, buildings, type }) => {
  const { t } = useIntl();
  return (
    <div
      className={`rounded-lg shadow-lg p-6 border ${
        type === 'alert'
          ? 'bg-orange-50 border-orange-200'
          : 'bg-green-50 border-green-200'
      }`}
    >
      <div className='mb-4'>
        <h3 className='text-lg font-semibold mb-1'>{title}</h3>
        <p className='text-sm text-gray-700'>{subtitle}</p>
      </div>

      <div className='space-y-3'>
        {buildings.slice(0, 3).map(insight => (
          <div
            key={insight.buildingId}
            className={`p-4 rounded-lg border ${
              type === 'alert'
                ? 'bg-white border-orange-200'
                : 'bg-white border-green-200'
            }`}
          >
            <div className='flex items-start justify-between mb-2'>
              <div>
                <p className='font-semibold text-gray-900'>{insight.buildingName}</p>
                <p className='text-sm text-gray-600'>{insight.roofArea.toLocaleString()} m² roof</p>
              </div>
              <span
                className={`text-sm font-bold ${
                  type === 'alert'
                    ? 'text-orange-600'
                    : 'text-green-600'
                }`}
              >
                {insight.sustainabilityPotentialScore}/100
              </span>
            </div>

            {insight.quickWins.length > 0 && (
              <div className='mb-2'>
                <p className='text-xs font-semibold text-gray-700 mb-1'>{t('buildings.alerts.quickWins')}</p>
                <div className='flex flex-wrap gap-1'>
                  {insight.quickWins.slice(0, 2).map((win, idx) => (
                    <span
                      key={idx}
                      className='inline-block text-xs bg-white px-2 py-1 rounded border border-gray-200'
                    >
                      {win}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {insight.potentialCO2Reduction > 0 && (
              <p className='text-sm'>
                <span className='font-semibold'>Potential CO₂ reduction:</span>{' '}
                {insight.potentialCO2Reduction.toLocaleString()} kg/year with{' '}
                {insight.estimatedInvestmentRequired.toLocaleString()}€ investment ({insight.roi} yr ROI)
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Component: Consultation CTA
const ConsultationCTA: React.FC<{ metrics: ESGPortfolioMetrics }> = ({ metrics }) => {
  const { t } = useIntl();
  const hasOpportunity =
    metrics.underutilizedBuildings.length > 0 ||
    metrics.totalSolarCapacity < metrics.totalRoofArea * 0.2;

  if (!hasOpportunity) return null;

  return (
    <div className='bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg shadow-xl p-8 text-white border-2 border-green-400'>
      <div className='max-w-4xl mx-auto'>
        <div className='flex items-center gap-4 mb-4'>
          <AlertCircle className='w-8 h-8 flex-shrink-0' />
          <h3 className='text-2xl font-bold'>{t('buildings.cta.title')}</h3>
        </div>

        <p className='text-lg mb-6 opacity-95'>
          {t('buildings.cta.description')}
          {metrics.underutilizedBuildings.length > 0 &&
            ` ${t('buildings.cta.underutilized').replace('{count}', metrics.underutilizedBuildings.length.toString())}`}
        </p>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
          <div className='bg-white bg-opacity-20 rounded-lg p-4'>
            <p className='text-sm opacity-90'>{t('buildings.cta.estimatedSolar')}</p>
            <p className='text-2xl font-bold'>
              +{Math.round(metrics.totalRoofArea * 0.15 - metrics.totalSolarCapacity)} kW
            </p>
          </div>
          <div className='bg-white bg-opacity-20 rounded-lg p-4'>
            <p className='text-sm opacity-90'>{t('buildings.cta.co2Reduction')}</p>
            <p className='text-2xl font-bold'>
              +{Math.round((metrics.totalRoofArea * 0.15 - metrics.totalSolarCapacity) * 1200).toLocaleString()} kg/yr
            </p>
          </div>
          <div className='bg-white bg-opacity-20 rounded-lg p-4'>
            <p className='text-sm opacity-90'>{t('buildings.cta.annualSavings')}</p>
            <p className='text-2xl font-bold'>
              €{Math.round((metrics.totalRoofArea * 0.15 - metrics.totalSolarCapacity) * 1000).toLocaleString()}
            </p>
          </div>
        </div>

        <div className='flex flex-col sm:flex-row gap-4'>
          <a
            href='tel:+4540000000'
            className='flex items-center justify-center gap-2 bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors'
          >
            <Phone className='w-5 h-5' />
            {t('buildings.cta.callExpert')}
          </a>
          <button className='flex items-center justify-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:bg-opacity-10 transition-colors'>
            {t('buildings.cta.scheduleConsultation')}
            <ArrowRight className='w-5 h-5' />
          </button>
        </div>
      </div>
    </div>
  );
};

// Component: Building Details Expanded
const BuildingDetailsExpanded: React.FC<{ building: Building }> = ({ building }) => {
  const { t } = useIntl();
  const features = building.esgMetrics?.features;

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        {features?.solarPanels?.installed && (
          <DetailBox
            icon={Sun}
            label={t('buildings.detail.solarPanels')}
            value={`${features.solarPanels.count || 0} ${t('buildings.detail.panels')}`}
            detail={`${features.solarPanels.capacity || 0} kW, ${features.solarPanels.annualOutput || 0} ${t('buildings.detail.kwhPerYear')}`}
          />
        )}
        {features?.whiteRoof?.installed && (
          <DetailBox
            icon={Cloud}
            label={t('buildings.detail.whiteRoof')}
            value={`${features.whiteRoof.area || 0} m²`}
            detail={`${t('buildings.detail.reflectance')}: ${features.whiteRoof.reflectance || 0}%`}
          />
        )}
        {features?.greenRoof?.installed && (
          <DetailBox
            icon={Leaf}
            label={t('buildings.detail.greenRoof')}
            value={`${features.greenRoof.area || 0} m²`}
            detail={features.greenRoof.type || t('buildings.detail.installed')}
          />
        )}
        {features?.blueRoof?.installed && (
          <DetailBox
            icon={Droplet}
            label={t('buildings.detail.blueRoof')}
            value={`${features.blueRoof.area || 0} m²`}
            detail={`${features.blueRoof.storageCapacity || 0} ${t('buildings.detail.capacity')}`}
          />
        )}
      </div>
    </div>
  );
};

const DetailBox: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
  detail: string;
}> = ({ icon: Icon, label, value, detail }) => (
  <div className='bg-white p-3 rounded border border-gray-200'>
    <div className='flex items-center gap-2 mb-2'>
      <Icon className='w-4 h-4 text-gray-600' />
      <p className='font-semibold text-sm'>{label}</p>
    </div>
    <p className='text-lg font-bold text-gray-900'>{value}</p>
    <p className='text-xs text-gray-500'>{detail}</p>
  </div>
);

const Star = TrendingUp; // Placeholder

export default ESGOverview;
