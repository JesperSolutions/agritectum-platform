import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useIntl } from '../../hooks/useIntl';
import {
  getBuildingById,
  updateBuilding,
  getBuildingActivity,
  BuildingActivity,
} from '../../services/buildingService';
import { getReportsByBuildingId } from '../../services/reportService';
import { getServiceAgreementsByBuilding } from '../../services/serviceAgreementService';
import { Building, Report, ServiceAgreement } from '../../types';
import {
  Building as BuildingIcon,
  MapPin,
  ArrowLeft,
  Edit,
  Save,
  X,
  FileText,
  FileCheck,
  Calendar,
  Activity,
  Clock,
  Layers,
  Ruler,
  Home,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import BuildingMap from './BuildingMap';
import PageHeader from '../shared/layouts/PageHeader';
import ListCard from '../shared/cards/ListCard';
import IconLabel from '../shared/layouts/IconLabel';
import StatusBadge from '../shared/badges/StatusBadge';
import { formatDate, formatDateTime } from '../../utils/dateFormatter';

const BuildingDetail: React.FC = () => {
  const { buildingId } = useParams<{ buildingId: string }>();
  const { currentUser } = useAuth();
  const { t } = useIntl();
  const [building, setBuilding] = useState<Building | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [serviceAgreements, setServiceAgreements] = useState<ServiceAgreement[]>([]);
  const [activities, setActivities] = useState<BuildingActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    address: '',
    buildingType: 'residential' as Building['buildingType'],
    roofType: 'tile' as Building['roofType'],
    roofSize: '',
  });

  useEffect(() => {
    if (buildingId && currentUser) {
      loadBuilding();
      loadRelatedData();
    }
  }, [buildingId, currentUser]);

  const loadBuilding = async () => {
    if (!buildingId) return;
    setLoading(true);
    try {
      const data = await getBuildingById(buildingId);
      if (data) {
        setBuilding(data);
        setFormData({
          address: data.address,
          buildingType: data.buildingType || 'residential',
          roofType: data.roofType || 'tile',
          roofSize: data.roofSize?.toString() || '',
        });
      }
    } catch (error) {
      console.error('Error loading building:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedData = async () => {
    if (!buildingId || !currentUser) return;
    setLoadingRelated(true);
    try {
      // Load all related data in parallel
      const [reportsData, agreementsData, activitiesData] = await Promise.all([
        getReportsByBuildingId(buildingId, currentUser.branchId).catch(() => []),
        getServiceAgreementsByBuilding(buildingId).catch(() => []),
        getBuildingActivity(
          buildingId,
          currentUser.uid,
          currentUser.branchId
        ).catch(() => []),
      ]);

      setReports(reportsData);
      setServiceAgreements(agreementsData);
      setActivities(activitiesData);
    } catch (error) {
      console.error('Error loading related data:', error);
    } finally {
      setLoadingRelated(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buildingId) return;

    try {
      await updateBuilding(buildingId, {
        address: formData.address,
        buildingType: formData.buildingType,
        roofType: formData.roofType,
        roofSize: formData.roofSize ? parseFloat(formData.roofSize) : undefined,
      });
      setEditing(false);
      await loadBuilding();
      await loadRelatedData(); // Reload to refresh map if address changed
    } catch (error) {
      console.error('Error updating building:', error);
    }
  };

  const getActivityIcon = (type: BuildingActivity['type']) => {
    switch (type) {
      case 'report':
        return FileText;
      case 'service_agreement':
        return FileCheck;
      case 'scheduled_visit':
      case 'appointment':
        return Calendar;
      default:
        return Activity;
    }
  };

  const activeAgreements = serviceAgreements.filter(a => a.status === 'active');
  const pastAgreements = serviceAgreements.filter(a => a.status !== 'active');

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  if (!building) {
    return (
      <div className='text-center py-12'>
        <p className='text-gray-600'>{t('buildings.notFound') || t('buildings.notFoundFallback') || 'Building not found'}</p>
        <Link
          to='/portal/buildings'
          className='text-green-600 hover:text-green-700 mt-4 inline-block'
        >
          {t('buildings.backToBuildings') || t('dashboard.viewAll') || 'Back to Buildings'}
        </Link>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <Link
          to='/portal/buildings'
          className='inline-flex items-center text-gray-600 hover:text-gray-900'
        >
          <ArrowLeft className='w-4 h-4 mr-2' />
          {t('buildings.backToBuildings') || t('dashboard.viewAll') || 'Back to Buildings'}
        </Link>
        <button
          onClick={() => setEditing(!editing)}
          className='flex items-center space-x-2 px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors'
        >
          {editing ? (
            <>
              <X className='w-4 h-4' />
              <span>{t('buildings.cancel') || 'Cancel'}</span>
            </>
          ) : (
            <>
              <Edit className='w-4 h-4' />
              <span>{t('buildings.edit') || 'Edit'}</span>
            </>
          )}
        </button>
      </div>

      {/* Page Header with Stats */}
      <div className='bg-white rounded-lg shadow p-6 border border-slate-200'>
        <PageHeader
          title={building.address}
          subtitle={t('buildings.buildingDetails') || 'Building Details'}
        />
        <div className='mt-6 grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='bg-slate-50 rounded-lg p-4 border border-slate-200'>
            <div className='flex items-center space-x-3'>
              <FileText className='w-8 h-8 text-slate-600' />
              <div>
                <p className='text-2xl font-bold text-slate-900'>{reports.length}</p>
                <p className='text-sm text-slate-600'>{t('buildings.reports.total') || 'Reports'}</p>
              </div>
            </div>
          </div>
          <div className='bg-slate-50 rounded-lg p-4 border border-slate-200'>
            <div className='flex items-center space-x-3'>
              <FileCheck className='w-8 h-8 text-slate-600' />
              <div>
                <p className='text-2xl font-bold text-slate-900'>{activeAgreements.length}</p>
                <p className='text-sm text-slate-600'>
                  {t('buildings.serviceAgreements.active') || 'Active Agreements'}
                </p>
              </div>
            </div>
          </div>
          <div className='bg-slate-50 rounded-lg p-4 border border-slate-200'>
            <div className='flex items-center space-x-3'>
              <Activity className='w-8 h-8 text-slate-600' />
              <div>
                <p className='text-2xl font-bold text-slate-900'>{activities.length}</p>
                <p className='text-sm text-slate-600'>
                  {t('buildings.activity.total') || 'Total Activities'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {editing && (
        <div className='bg-white rounded-lg shadow p-6 border border-slate-200'>
          <h2 className='text-xl font-semibold mb-4'>{t('buildings.editBuilding') || 'Edit Building'}</h2>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                {t('buildings.address')} *
              </label>
              <input
                type='text'
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500'
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  {t('buildings.buildingType')}
                </label>
                <select
                  value={formData.buildingType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      buildingType: e.target.value as Building['buildingType'],
                    })
                  }
                  className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500'
                >
                  <option value='residential'>{t('buildings.residential')}</option>
                  <option value='commercial'>{t('buildings.commercial')}</option>
                  <option value='industrial'>{t('buildings.industrial')}</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  {t('buildings.roofType')}
                </label>
                <select
                  value={formData.roofType}
                  onChange={(e) =>
                    setFormData({ ...formData, roofType: e.target.value as Building['roofType'] })
                  }
                  className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500'
                >
                  <option value='tile'>{t('roofTypes.tile')}</option>
                  <option value='metal'>{t('roofTypes.metal')}</option>
                  <option value='shingle'>{t('roofTypes.shingle')}</option>
                  <option value='slate'>{t('roofTypes.slate')}</option>
                  <option value='flat'>{t('roofTypes.flat')}</option>
                  <option value='other'>{t('roofTypes.other')}</option>
                </select>
              </div>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                {t('buildings.roofSize')}
              </label>
              <input
                type='number'
                value={formData.roofSize}
                onChange={(e) => setFormData({ ...formData, roofSize: e.target.value })}
                className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500'
              />
            </div>
            <button
              type='submit'
              className='flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700'
            >
              <Save className='w-4 h-4' />
              <span>{t('buildings.saveChanges') || 'Save Changes'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Map Section */}
      {!editing && (
        <div className='bg-white rounded-lg shadow p-6 border border-slate-200'>
          <h2 className='text-xl font-semibold mb-4 flex items-center'>
            <MapPin className='w-5 h-5 mr-2' />
            {t('buildings.map.title') || 'Location'}
          </h2>
          <BuildingMap
            latitude={building.latitude}
            longitude={building.longitude}
            address={building.address}
            buildingId={building.id}
          />
        </div>
      )}

      {/* Metadata Section */}
      {!editing && (
        <div className='bg-white rounded-lg shadow p-6 border border-slate-200'>
          <h2 className='text-xl font-semibold mb-4 flex items-center'>
            <Home className='w-5 h-5 mr-2' />
            {t('buildings.metadata.title') || 'Building Information'}
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            <IconLabel
              icon={MapPin}
              label={t('buildings.address') || 'Address'}
              value={building.address}
            />
            <IconLabel
              icon={Home}
              label={t('buildings.buildingType') || 'Building Type'}
              value={
                building.buildingType
                  ? t(`buildings.${building.buildingType}`) || building.buildingType
                  : 'N/A'
              }
            />
            <IconLabel
              icon={Layers}
              label={t('buildings.roofType') || 'Roof Type'}
              value={building.roofType ? t(`roofTypes.${building.roofType}`) || building.roofType : 'N/A'}
            />
            {building.roofSize && (
              <IconLabel
                icon={Ruler}
                label={t('buildings.roofSize') || 'Roof Size'}
                value={`${building.roofSize} m²`}
              />
            )}
            {building.createdAt && (
              <IconLabel
                icon={Clock}
                label={t('buildings.metadata.created') || 'Created'}
                value={formatDate(building.createdAt)}
              />
            )}
            {building.latitude && building.longitude && (
              <div className='flex items-center space-x-2'>
                <MapPin className='w-4 h-4 text-gray-400' />
                <div>
                  <p className='text-sm font-medium text-gray-600'>
                    {t('buildings.map.coordinates') || 'Coordinates'}
                  </p>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${building.latitude}&mlon=${building.longitude}&zoom=16`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-blue-600 hover:text-blue-700 hover:underline text-sm flex items-center space-x-1'
                  >
                    <span>
                      {building.latitude.toFixed(6)}, {building.longitude.toFixed(6)}
                    </span>
                    <ExternalLink className='w-3 h-3' />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reports Section */}
      {!editing && (
        <div className='bg-white rounded-lg shadow p-6 border border-slate-200'>
          <h2 className='text-xl font-semibold mb-4 flex items-center'>
            <FileText className='w-5 h-5 mr-2' />
            {t('buildings.reports.title') || 'Inspection Reports'}
          </h2>
          {loadingRelated ? (
            <div className='flex items-center justify-center py-8'>
              <LoadingSpinner />
            </div>
          ) : reports.length === 0 ? (
            <div className='text-center py-12'>
              <FileText className='w-16 h-16 text-gray-400 mx-auto mb-4' />
              <p className='text-gray-600'>{t('buildings.reports.empty') || 'No reports found'}</p>
            </div>
          ) : (
            <div className='space-y-4'>
              {reports.slice(0, 10).map((report) => (
                <Link key={report.id} to={`/reports/${report.id}`}>
                  <ListCard className='hover:shadow-material-3 transition-shadow'>
                    <div className='flex items-start justify-between mb-2'>
                      <div>
                        <h3 className='font-semibold text-gray-900'>
                          {report.isOffer
                            ? t('buildings.reports.offer') || 'Offer'
                            : t('buildings.reports.inspection') || 'Inspection Report'}
                        </h3>
                        <p className='text-sm text-gray-600'>
                          {formatDate(report.inspectionDate || report.createdAt)}
                        </p>
                      </div>
                      <StatusBadge status={report.status || 'completed'} />
                    </div>
                    {report.conditionNotes && (
                      <p className='text-sm text-gray-600 mt-2 line-clamp-2'>
                        {report.conditionNotes}
                      </p>
                    )}
                    {report.issuesFound && report.issuesFound.length > 0 && (
                      <p className='text-xs text-slate-500 mt-2'>
                        {report.issuesFound.length}{' '}
                        {report.issuesFound.length === 1
                          ? t('buildings.reports.issue') || 'issue'
                          : t('buildings.reports.issues') || 'issues'}{' '}
                        found
                      </p>
                    )}
                  </ListCard>
                </Link>
              ))}
              {reports.length > 10 && (
                <p className='text-sm text-gray-500 text-center mt-4'>
                  {t('buildings.reports.showing') || 'Showing'} 10{' '}
                  {t('buildings.reports.of') || 'of'} {reports.length}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Service Agreements Section */}
      {!editing && (
        <div className='bg-white rounded-lg shadow p-6 border border-slate-200'>
          <h2 className='text-xl font-semibold mb-4 flex items-center'>
            <FileCheck className='w-5 h-5 mr-2' />
            {t('buildings.serviceAgreements.title') || 'Service Agreements'}
          </h2>
          {loadingRelated ? (
            <div className='flex items-center justify-center py-8'>
              <LoadingSpinner />
            </div>
          ) : serviceAgreements.length === 0 ? (
            <div className='text-center py-12'>
              <FileCheck className='w-16 h-16 text-gray-400 mx-auto mb-4' />
              <p className='text-gray-600'>
                {t('buildings.serviceAgreements.empty') || 'No service agreements found'}
              </p>
            </div>
          ) : (
            <div className='space-y-6'>
              {activeAgreements.length > 0 && (
                <div>
                  <h3 className='text-lg font-medium mb-4 text-slate-700'>
                    {t('buildings.serviceAgreements.active') || 'Active Agreements'}
                  </h3>
                  <div className='space-y-4'>
                    {activeAgreements.map((agreement) => (
                      <Link key={agreement.id} to={`/portal/service-agreements/${agreement.id}`}>
                        <ListCard className='hover:shadow-material-3 transition-shadow'>
                          <div className='flex items-start justify-between mb-2'>
                            <div>
                              <h3 className='font-semibold text-gray-900'>{agreement.title}</h3>
                              <p className='text-sm text-gray-600'>
                                {t(`serviceAgreement.type.${agreement.agreementType}`) ||
                                  agreement.agreementType}
                              </p>
                            </div>
                            <StatusBadge status={agreement.status} />
                          </div>
                          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-4'>
                            <IconLabel
                              icon={Calendar}
                              label={t('serviceAgreement.startDate') || 'Start Date'}
                              value={formatDate(agreement.startDate)}
                            />
                            <IconLabel
                              icon={Calendar}
                              label={t('serviceAgreement.endDate') || 'End Date'}
                              value={formatDate(agreement.endDate)}
                            />
                            {agreement.nextServiceDate && (
                              <IconLabel
                                icon={Calendar}
                                label={t('serviceAgreement.nextService') || 'Next Service'}
                                value={formatDate(agreement.nextServiceDate)}
                              />
                            )}
                          </div>
                        </ListCard>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {pastAgreements.length > 0 && (
                <div>
                  <h3 className='text-lg font-medium mb-4 text-slate-700'>
                    {t('buildings.serviceAgreements.past') || 'Past Agreements'}
                  </h3>
                  <div className='space-y-4'>
                    {pastAgreements.map((agreement) => (
                      <Link key={agreement.id} to={`/portal/service-agreements/${agreement.id}`}>
                        <ListCard className='hover:shadow-material-3 transition-shadow opacity-75'>
                          <div className='flex items-start justify-between mb-2'>
                            <div>
                              <h3 className='font-semibold text-gray-900'>{agreement.title}</h3>
                              <p className='text-sm text-gray-600'>
                                {t(`serviceAgreement.type.${agreement.agreementType}`) ||
                                  agreement.agreementType}
                              </p>
                            </div>
                            <StatusBadge status={agreement.status} />
                          </div>
                          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
                            <IconLabel
                              icon={Calendar}
                              label={t('serviceAgreement.startDate') || 'Start Date'}
                              value={formatDate(agreement.startDate)}
                            />
                            <IconLabel
                              icon={Calendar}
                              label={t('serviceAgreement.endDate') || 'End Date'}
                              value={formatDate(agreement.endDate)}
                            />
                          </div>
                        </ListCard>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Activity Timeline */}
      {!editing && (
        <div className='bg-white rounded-lg shadow p-6 border border-slate-200'>
          <h2 className='text-xl font-semibold mb-4 flex items-center'>
            <Activity className='w-5 h-5 mr-2' />
            {t('buildings.activity.title') || 'Activity Timeline'}
          </h2>
          {loadingRelated ? (
            <div className='flex items-center justify-center py-8'>
              <LoadingSpinner />
            </div>
          ) : activities.length === 0 ? (
            <div className='text-center py-12'>
              <Activity className='w-16 h-16 text-gray-400 mx-auto mb-4' />
              <p className='text-gray-600'>
                {t('buildings.activity.empty') || 'No activity found for this building'}
              </p>
            </div>
          ) : (
            <div className='space-y-4'>
              {activities.slice(0, 20).map((activity) => {
                const Icon = getActivityIcon(activity.type);
                return (
                  <div
                    key={activity.id}
                    className='flex items-start space-x-4 pb-4 border-b border-slate-200 last:border-0'
                  >
                    <div className='flex-shrink-0 mt-1'>
                      <div className='w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center'>
                        <Icon className='w-5 h-5 text-slate-600' />
                      </div>
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-start justify-between'>
                        <div>
                          <h3 className='font-semibold text-gray-900'>{activity.title}</h3>
                          {activity.description && (
                            <p className='text-sm text-gray-600 mt-1 line-clamp-2'>
                              {activity.description}
                            </p>
                          )}
                          <p className='text-xs text-gray-500 mt-2'>
                            {formatDate(activity.date)}
                          </p>
                        </div>
                        <div className='flex items-center space-x-2 ml-4'>
                          {activity.status && (
                            <StatusBadge status={activity.status} />
                          )}
                          {activity.link && (
                            <Link
                              to={activity.link}
                              className='text-blue-600 hover:text-blue-700'
                            >
                              <ExternalLink className='w-4 h-4' />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {activities.length > 20 && (
                <p className='text-sm text-gray-500 text-center mt-4'>
                  {t('buildings.activity.showing') || 'Showing'} 20{' '}
                  {t('buildings.activity.of') || 'of'} {activities.length}
                </p>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default BuildingDetail;
