import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useIntl } from '../../hooks/useIntl';
import { logger } from '../../utils/logger';
import {
  getBuildingById,
  updateBuilding,
  getBuildingActivity,
  BuildingActivity,
  deleteBuilding,
} from '../../services/buildingService';
import { getReportsByBuildingId } from '../../services/reportService';
import { getServiceAgreementsByBuilding } from '../../services/serviceAgreementService';
import { getESGServiceReportsByBuilding } from '../../services/esgService';
import { Building, Report, ServiceAgreement, ESGServiceReport } from '../../types';
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
  Leaf,
  Trash2,
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
  const [esgReports, setEsgReports] = useState<ESGServiceReport[]>([]);
  const [activities, setActivities] = useState<BuildingActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
    } else {
      setErrors([
        `Missing: ${!buildingId ? 'buildingId' : ''} ${!currentUser ? 'currentUser' : ''}`,
      ]);
    }
  }, [buildingId, currentUser]);

  const handleDeleteBuilding = async () => {
    if (!buildingId || !building) return;

    // Check for non-in-progress reports
    const completedReports = reports.filter(r => r.status !== 'in-progress');
    if (completedReports.length > 0) {
      setErrors([
        `Cannot delete building with ${completedReports.length} completed/archived report(s). Please remove these reports first.`,
      ]);
      setShowDeleteDialog(false);
      return;
    }

    setIsDeleting(true);
    try {
      await deleteBuilding(buildingId);
      // Redirect to buildings list
      window.location.href = '/portal/buildings';
    } catch (error: any) {
      logger.error('[BuildingDetail] Delete failed:', error);
      setErrors(prev => [...prev, `Delete failed: ${error?.message || 'Unknown error'}`]);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const loadBuilding = async () => {
    if (!buildingId) {
      return;
    }

    setLoading(true);

    try {
      const data = await getBuildingById(buildingId);

      if (!data) {
        setErrors(prev => [...prev, 'Building data is null or undefined']);
        setLoading(false);
        return;
      }

      setBuilding(data);
      setFormData({
        address: data.address,
        buildingType: data.buildingType || 'residential',
        roofType: data.roofType || 'tile',
        roofSize: data.roofSize?.toString() || '',
      });
      setLoading(false);
    } catch (error: any) {
      logger.error('[BuildingDetail] Building load failed:', error);
      setErrors(prev => [...prev, `Failed to load building: ${error?.message || 'Unknown error'}`]);
      setLoading(false);
    }
  };

  const loadRelatedData = async () => {
    if (!buildingId || !currentUser) {
      return;
    }

    setLoadingRelated(true);
    try {
      const branchIdForQuery = currentUser.role === 'customer' ? undefined : currentUser.branchId;
      const companyIdForQuery = currentUser.role === 'customer' ? currentUser.companyId : undefined;

      const [reportsData, agreementsData, esgReportsData, activitiesData] = await Promise.all([
        getReportsByBuildingId(buildingId, branchIdForQuery, companyIdForQuery)
          .then(data => data || [])
          .catch(error => {
            logger.error('[BuildingDetail] Reports load failed:', error);
            setErrors(prev => [...prev, `Reports error: ${error?.message}`]);
            return [];
          }),
        getServiceAgreementsByBuilding(buildingId)
          .then(data => data || [])
          .catch(error => {
            logger.error('[BuildingDetail] Agreements load failed:', error);
            setErrors(prev => [...prev, `Agreements error: ${error?.message}`]);
            return [];
          }),
        getESGServiceReportsByBuilding(buildingId)
          .then(data => data || [])
          .catch(error => {
            logger.error('[BuildingDetail] ESG reports load failed:', error);
            setErrors(prev => [...prev, `ESG reports error: ${error?.message}`]);
            return [];
          }),
        getBuildingActivity(buildingId, currentUser.uid, currentUser.branchId)
          .then(data => data || [])
          .catch(error => {
            logger.error('[BuildingDetail] Activities load failed:', error);
            setErrors(prev => [...prev, `Activities error: ${error?.message}`]);
            return [];
          }),
      ]);

      setReports(reportsData);
      setServiceAgreements(agreementsData);
      setEsgReports(esgReportsData);
      setActivities(activitiesData);
    } catch (error: any) {
      logger.error('[BuildingDetail] Unexpected error loading related data:', error);
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
        <p className='text-gray-600'>
          {t('buildings.notFound') || t('buildings.notFoundFallback') || 'Building not found'}
        </p>
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
      {/* Error Messages */}
      {errors.length > 0 && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <div className='flex items-start gap-3'>
            <AlertCircle className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' />
            <div className='flex-1'>
              <h3 className='font-semibold text-red-900 mb-2'>Issues encountered</h3>
              <ul className='space-y-1'>
                {errors.map((error, idx) => (
                  <li key={idx} className='text-sm text-red-700'>
                    • {error}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setErrors([])}
                className='mt-3 text-sm text-red-600 hover:text-red-700 font-medium'
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

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
          onClick={() => setShowDeleteDialog(true)}
          className='inline-flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors'
          title='Delete building'
        >
          <Trash2 className='w-4 h-4 mr-2' />
          Delete
        </button>
      </div>

      {/* Page Header with Stats */}
      <div className='bg-white rounded-lg shadow p-6 border border-slate-200'>
        <PageHeader
          title={building.name || building.address}
          subtitle={
            building.name ? building.address : t('buildings.buildingDetails') || 'Building Details'
          }
        />
        <div className='mt-6 grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='bg-slate-50 rounded-lg p-4 border border-slate-200'>
            <div className='flex items-center space-x-3'>
              <FileText className='w-8 h-8 text-slate-600' />
              <div>
                <p className='text-2xl font-bold text-slate-900'>{reports.length}</p>
                <p className='text-sm text-slate-600'>
                  {t('buildings.reports.total') || 'Reports'}
                </p>
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
          <h2 className='text-xl font-semibold mb-4'>
            {t('buildings.editBuilding') || 'Edit Building'}
          </h2>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                {t('buildings.address')} *
              </label>
              <input
                type='text'
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
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
                  onChange={e =>
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
                  onChange={e =>
                    setFormData({ ...formData, roofType: e.target.value as Building['roofType'] })
                  }
                  className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500'
                >
                  <option value='tile'>{t('roofTypes.tile')}</option>
                  <option value='metal'>{t('roofTypes.metal')}</option>
                  <option value='shingle'>{t('roofTypes.shingle')}</option>
                  <option value='slate'>{t('roofTypes.slate')}</option>
                  <option value='flat'>{t('roofTypes.flat')}</option>
                  <option value='flat_bitumen_2layer'>{t('roofTypes.flat_bitumen_2layer')}</option>
                  <option value='flat_bitumen_3layer'>{t('roofTypes.flat_bitumen_3layer')}</option>
                  <option value='flat_rubber'>{t('roofTypes.flat_rubber')}</option>
                  <option value='flat_pvc'>{t('roofTypes.flat_pvc')}</option>
                  <option value='flat_tpo'>{t('roofTypes.flat_tpo')}</option>
                  <option value='flat_epdm'>{t('roofTypes.flat_epdm')}</option>
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
                onChange={e => setFormData({ ...formData, roofSize: e.target.value })}
                className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500'
              />
            </div>
            <button
              type='submit'
              className='flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm'
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
            {building.name && (
              <IconLabel
                icon={Home}
                label={t('buildings.name') || 'Building Name'}
                value={building.name}
              />
            )}
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
              value={
                building.roofType ? t(`roofTypes.${building.roofType}`) || building.roofType : 'N/A'
              }
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
              {reports.slice(0, 10).map(report => (
                <Link key={report.id} to={`/portal/reports/${report.id}`}>
                  <ListCard className='hover:shadow-material-3 transition-shadow'>
                    <div className='flex items-start justify-between mb-2'>
                      <div className='w-full'>
                        <h3 className='font-semibold text-gray-900'>
                          {report.buildingName ||
                            report.customerName ||
                            t('buildings.reports.inspection') ||
                            'Inspection Report'}
                        </h3>
                        <p className='text-sm text-gray-600'>
                          {formatDate(report.inspectionDate || report.createdAt)}
                        </p>
                        {report.conditionNotes && (
                          <p className='text-sm text-gray-500 mt-1 line-clamp-2'>
                            {report.conditionNotes}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={report.status || 'completed'} />
                    </div>
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
                    {activeAgreements.map(agreement => (
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
                              label={t('serviceAgreement.detail.startDate') || 'Start Date'}
                              value={formatDate(agreement.startDate)}
                            />
                            <IconLabel
                              icon={Calendar}
                              label={t('serviceAgreement.detail.endDate') || 'End Date'}
                              value={formatDate(agreement.endDate)}
                            />
                            {agreement.nextServiceDate && (
                              <IconLabel
                                icon={Calendar}
                                label={t('serviceAgreement.detail.nextService') || 'Next Service'}
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
                    {pastAgreements.map(agreement => (
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
                              label={t('serviceAgreement.detail.startDate') || 'Start Date'}
                              value={formatDate(agreement.startDate)}
                            />
                            <IconLabel
                              icon={Calendar}
                              label={t('serviceAgreement.detail.endDate') || 'End Date'}
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

      {/* ESG Reports Section */}
      {!editing && esgReports.length > 0 && (
        <div className='bg-white rounded-lg shadow p-6 border border-slate-200'>
          <h2 className='text-xl font-semibold mb-4 flex items-center'>
            <Leaf className='w-5 h-5 mr-2 text-green-600' />
            {t('buildings.esgReports.title') || 'ESG Reports'}
          </h2>
          {loadingRelated ? (
            <div className='flex items-center justify-center py-8'>
              <LoadingSpinner />
            </div>
          ) : (
            <div className='space-y-4'>
              {esgReports.map(esgReport => (
                <div key={esgReport.id}>
                  {esgReport.isPublic && esgReport.publicLinkId ? (
                    <a
                      href={`/esg-report/public/${esgReport.publicLinkId}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='block'
                    >
                      <ListCard className='hover:shadow-material-3 transition-shadow'>
                        <div className='flex items-start justify-between'>
                          <div className='flex-1'>
                            <div className='flex items-center gap-2 mb-2'>
                              <div className='p-2 bg-green-100 rounded-lg'>
                                <Leaf className='w-4 h-4 text-green-600' />
                              </div>
                              <div>
                                <h3 className='font-semibold text-gray-900'>
                                  {t('buildings.esgReports.report') || 'ESG Service Report'}
                                </h3>
                                <p className='text-xs text-gray-500'>
                                  {formatDate(esgReport.createdAt)}
                                </p>
                              </div>
                            </div>
                            <div className='mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm'>
                              <div>
                                <p className='text-xs text-gray-500'>
                                  {t('buildings.esgReports.roofSize') || 'Roof Size'}
                                </p>
                                <p className='font-medium text-gray-900'>{esgReport.roofSize} m²</p>
                              </div>
                              <div>
                                <p className='text-xs text-gray-500'>
                                  {t('buildings.esgReports.greenRoof') || 'Green Roof'}
                                </p>
                                <p className='font-medium text-gray-900'>
                                  {esgReport.divisions.greenRoof}%
                                </p>
                              </div>
                              <div>
                                <p className='text-xs text-gray-500'>
                                  {t('buildings.esgReports.coolRoof') || 'Cool Roof'}
                                </p>
                                <p className='font-medium text-gray-900'>
                                  {esgReport.divisions.coolRoof}%
                                </p>
                              </div>
                              <div>
                                <p className='text-xs text-gray-500'>
                                  {t('buildings.esgReports.noxReduction') || 'NOₓ Reduction'}
                                </p>
                                <p className='font-medium text-gray-900'>
                                  {esgReport.divisions.noxReduction}%
                                </p>
                              </div>
                            </div>
                          </div>
                          <ExternalLink className='w-5 h-5 text-green-600 flex-shrink-0 ml-3' />
                        </div>
                      </ListCard>
                    </a>
                  ) : (
                    <ListCard>
                      <div className='flex items-start'>
                        <div className='p-2 bg-gray-100 rounded-lg'>
                          <Leaf className='w-4 h-4 text-gray-400' />
                        </div>
                        <div className='ml-3'>
                          <h3 className='font-semibold text-gray-600'>
                            {t('buildings.esgReports.private') || 'ESG Report (Private)'}
                          </h3>
                          <p className='text-xs text-gray-500 mt-1'>
                            {t('buildings.esgReports.privateDesc') ||
                              'This report is not publicly available yet'}
                          </p>
                        </div>
                      </div>
                    </ListCard>
                  )}
                </div>
              ))}
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
              {activities.slice(0, 20).map(activity => {
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
                          <p className='text-xs text-gray-500 mt-2'>{formatDate(activity.date)}</p>
                        </div>
                        <div className='flex items-center space-x-2 ml-4'>
                          {activity.status && <StatusBadge status={activity.status} />}
                          {activity.link && (
                            <Link to={activity.link} className='text-blue-600 hover:text-blue-700'>
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

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-lg shadow-xl max-w-md w-full'>
            <div className='p-6'>
              <div className='flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4'>
                <AlertCircle className='w-6 h-6 text-red-600' />
              </div>
              <h3 className='text-lg font-medium text-gray-900 text-center mb-2'>
                Delete Building?
              </h3>
              <p className='text-sm text-gray-600 text-center mb-6'>
                {building?.address || 'This building'} will be permanently deleted. This action cannot be undone.
                {reports.length > 0 && (
                  <span className='block mt-4 text-red-600 font-medium'>
                    Note: Only in-progress reports can be kept. {reports.filter(r => r.status !== 'in-progress').length} completed/archived report(s) must be removed first.
                  </span>
                )}
              </p>
              <div className='flex gap-3 justify-center'>
                <button
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={isDeleting}
                  className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50'
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteBuilding}
                  disabled={isDeleting}
                  className='px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuildingDetail;
