import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useIntl } from '../../hooks/useIntl';
import { Customer, Building, Report, ServiceAgreement, ESGServiceReport } from '../../types';
import {
  ArrowLeft,
  Building as BuildingIcon,
  FileText,
  FileCheck,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Leaf,
  ExternalLink,
  Edit,
  Trash2,
  Plus,
} from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import { formatDateTime, formatDate } from '../../utils/dateFormatter';
import { formatCurrencyAmount } from '../../utils/currency';
import type { SupportedLocale } from '../../utils/geolocation';
import { getCustomerById } from '../../services/customerService';
import { getBuildingsByCustomer } from '../../services/buildingService';
import { getReportsByCustomerId } from '../../services/reportService';
import {
  getServiceAgreementsByCustomer,
  getServiceAgreementsByBuilding,
} from '../../services/serviceAgreementService';
import { getESGServiceReportsByBuilding } from '../../services/esgService';
import StatusBadge from '../shared/badges/StatusBadge';

// Helper function to map report status to StatusBadge-compatible status
const mapReportStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    draft: 'pending',
    completed: 'completed',
    sent: 'completed',
    shared: 'active',
    archived: 'cancelled',
    offer_sent: 'pending',
    offer_accepted: 'accepted',
    offer_rejected: 'rejected',
    offer_expired: 'expired',
  };
  return statusMap[status] || status;
};

// Helper function to get report status label
const getReportStatusLabel = (status: string, t: (key: string) => string): string => {
  const statusMap: Record<string, string> = {
    draft: t('reports.filters.draft') || 'Draft',
    completed: t('reports.filters.completed') || 'Completed',
    sent: t('reports.filters.sent') || 'Sent',
    shared: t('report.status.shared') || 'Shared',
    archived: t('reports.filters.archived') || 'Archived',
    offer_sent: t('reports.filters.offerSent') || 'Offer Sent',
    offer_accepted: t('reports.filters.offerAccepted') || 'Offer Accepted',
    offer_rejected: t('reports.filters.offerRejected') || 'Offer Rejected',
    offer_expired: t('reports.filters.offerExpired') || 'Offer Expired',
  };
  return statusMap[status] || status;
};

const CustomerProfile: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t, locale } = useIntl();
  const currentLocale = locale as SupportedLocale;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [serviceAgreements, setServiceAgreements] = useState<ServiceAgreement[]>([]);
  const [esgReports, setEsgReports] = useState<Record<string, ESGServiceReport[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'buildings' | 'reports' | 'agreements'>(
    'overview'
  );
  const [deletingBuildingId, setDeletingBuildingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (customerId && currentUser) {
      loadCustomerData();
    }
  }, [customerId, currentUser]);

  const loadCustomerData = async () => {
    if (!customerId || !currentUser) return;

    try {
      setLoading(true);
      setError(null);

      // Load customer
      const customerData = await getCustomerById(customerId);
      if (!customerData) {
        setError(t('customerProfile.notFound') || 'Customer not found');
        setLoading(false);
        return;
      }
      setCustomer(customerData);

      // Load buildings
      const buildingsData = await getBuildingsByCustomer(customerId, currentUser.branchId);
      setBuildings(buildingsData);

      // Load reports
      const reportsData = await getReportsByCustomerId(customerId, currentUser.branchId);
      setReports(reportsData);

      // Load service agreements
      const agreementsData = await getServiceAgreementsByCustomer(customerId, currentUser.branchId);

      // Also load agreements for each building
      const buildingAgreements = await Promise.all(
        buildingsData.map(async building => {
          const buildingAgreements = await getServiceAgreementsByBuilding(building.id);
          return buildingAgreements;
        })
      );

      // Combine and deduplicate agreements
      const allAgreements = [...agreementsData, ...buildingAgreements.flat()];

      // Remove duplicates by ID
      const uniqueAgreements = allAgreements.filter(
        (agreement, index, self) => index === self.findIndex(a => a.id === agreement.id)
      );

      setServiceAgreements(uniqueAgreements);

      // Load ESG reports for each building
      const esgReportsByBuilding: Record<string, ESGServiceReport[]> = {};
      await Promise.all(
        buildingsData.map(async building => {
          try {
            const buildingEsgReports = await getESGServiceReportsByBuilding(
              building.id,
              currentUser.branchId
            );
            if (buildingEsgReports.length > 0) {
              esgReportsByBuilding[building.id] = buildingEsgReports;
            }
          } catch (err) {
            // Ignore errors for individual buildings
            console.error(`Error loading ESG reports for building ${building.id}:`, err);
          }
        })
      );
      setEsgReports(esgReportsByBuilding);
    } catch (err) {
      console.error('Error loading customer data:', err);
      setError(t('customerProfile.loadError') || 'Failed to load customer data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return formatCurrencyAmount(amount, currentLocale);
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-slate-50 flex items-center justify-center'>
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className='min-h-screen bg-slate-50 flex items-center justify-center'>
        <div className='text-center'>
          <XCircle className='w-16 h-16 text-red-500 mx-auto mb-4' />
          <h2 className='text-2xl font-bold text-slate-900 mb-2'>
            {error || t('customerProfile.notFound') || 'Customer not found'}
          </h2>
          <button
            onClick={() => navigate('/admin/customers')}
            className='mt-4 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors'
          >
            {t('customerProfile.backToCustomers') || 'Back to Customers'}
          </button>
        </div>
      </div>
    );
  }

  const handleDeleteBuilding = async (buildingId: string) => {
    try {
      const { deleteBuilding } = await import('../../services/buildingService');
      await deleteBuilding(buildingId);
      setBuildings(prev => prev.filter(b => b.id !== buildingId));
      setDeletingBuildingId(null);
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error('Failed to delete building:', err);
      setError('Failed to delete building');
    }
  };

  return (
    <div className='min-h-screen bg-slate-50 font-material'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='mb-6'>
          <button
            onClick={() => navigate('/admin/customers')}
            className='flex items-center text-slate-600 hover:text-slate-900 mb-4 transition-colors'
          >
            <ArrowLeft className='w-4 h-4 mr-2' />
            {t('customerProfile.backToCustomers') || 'Back to Customers'}
          </button>

          <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6'>
            <div className='flex items-start justify-between'>
              <div>
                <h1 className='text-3xl font-bold text-slate-900 mb-2'>{customer.name}</h1>
                {customer.company && (
                  <p className='text-lg text-slate-600 mb-4'>{customer.company}</p>
                )}
                <div className='flex flex-wrap gap-4 text-sm text-slate-600'>
                  {customer.email && (
                    <div className='flex items-center gap-2'>
                      <Mail className='w-4 h-4' />
                      {customer.email}
                    </div>
                  )}
                  {customer.phone && (
                    <div className='flex items-center gap-2'>
                      <Phone className='w-4 h-4' />
                      {customer.phone}
                    </div>
                  )}
                  {customer.address && (
                    <div className='flex items-center gap-2'>
                      <MapPin className='w-4 h-4' />
                      {customer.address}
                    </div>
                  )}
                </div>
              </div>
              <div className='text-right'>
                <div className='text-sm text-slate-500 mb-1'>
                  {t('customerProfile.totalReports') || 'Total Reports'}
                </div>
                <div className='text-2xl font-bold text-slate-900'>
                  {customer.totalReports || 0}
                </div>
                <div className='text-sm text-slate-500 mt-2 mb-1'>
                  {t('customerProfile.totalRevenue') || 'Total Revenue'}
                </div>
                <div className='text-xl font-semibold text-green-600'>
                  {formatCurrency(customer.totalRevenue || 0)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className='bg-white rounded-xl shadow-sm border border-slate-200 mb-6'>
          <div className='border-b border-slate-200'>
            <nav className='flex -mb-px'>
              {[
                { id: 'overview', label: t('customerProfile.overview') || 'Overview', icon: User },
                {
                  id: 'buildings',
                  label: t('customerProfile.buildings.title') || 'Buildings',
                  icon: BuildingIcon,
                },
                {
                  id: 'reports',
                  label: t('customerProfile.reports.title') || 'Reports',
                  icon: FileText,
                },
                {
                  id: 'agreements',
                  label: t('customerProfile.serviceAgreements.title') || 'Service Agreements',
                  icon: FileCheck,
                },
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`
                      flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors
                      ${
                        activeTab === tab.id
                          ? 'border-slate-700 text-slate-900'
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                      }
                    `}
                  >
                    <Icon className='w-4 h-4' />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className='p-6'>
            {activeTab === 'overview' && (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <h3 className='text-lg font-semibold text-slate-900 mb-4'>
                    {t('customerProfile.contactInfo') || 'Contact Information'}
                  </h3>
                  <div className='space-y-3 text-sm'>
                    <div>
                      <span className='font-medium text-slate-700'>
                        {t('customer.name') || 'Name'}:
                      </span>
                      <span className='ml-2 text-slate-900'>{customer.name}</span>
                    </div>
                    {customer.company && (
                      <div>
                        <span className='font-medium text-slate-700'>
                          {t('customer.company') || 'Company'}:
                        </span>
                        <span className='ml-2 text-slate-900'>{customer.company}</span>
                      </div>
                    )}
                    {customer.email && (
                      <div>
                        <span className='font-medium text-slate-700'>
                          {t('customer.email') || 'Email'}:
                        </span>
                        <span className='ml-2 text-slate-900'>{customer.email}</span>
                      </div>
                    )}
                    {customer.phone && (
                      <div>
                        <span className='font-medium text-slate-700'>
                          {t('customer.phone') || 'Phone'}:
                        </span>
                        <span className='ml-2 text-slate-900'>{customer.phone}</span>
                      </div>
                    )}
                    {customer.address && (
                      <div>
                        <span className='font-medium text-slate-700'>
                          {t('customer.address') || 'Address'}:
                        </span>
                        <span className='ml-2 text-slate-900'>{customer.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className='text-lg font-semibold text-slate-900 mb-4'>
                    {t('customerProfile.businessInfo') || 'Business Information'}
                  </h3>
                  <div className='space-y-3 text-sm'>
                    <div>
                      <span className='font-medium text-slate-700'>
                        {t('customerProfile.totalReports') || 'Total Reports'}:
                      </span>
                      <span className='ml-2 text-slate-900'>{customer.totalReports || 0}</span>
                    </div>
                    <div>
                      <span className='font-medium text-slate-700'>
                        {t('customerProfile.totalRevenue') || 'Total Revenue'}:
                      </span>
                      <span className='ml-2 text-green-600 font-semibold'>
                        {formatCurrency(customer.totalRevenue || 0)}
                      </span>
                    </div>
                    {customer.lastReportDate && (
                      <div>
                        <span className='font-medium text-slate-700'>
                          {t('customerProfile.lastReport') || 'Last Report'}:
                        </span>
                        <span className='ml-2 text-slate-900'>
                          {formatDate(customer.lastReportDate)}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className='font-medium text-slate-700'>
                        {t('customerProfile.created') || 'Created'}:
                      </span>
                      <span className='ml-2 text-slate-900'>{formatDate(customer.createdAt)}</span>
                    </div>
                    <div>
                      <span className='font-medium text-slate-700'>
                        {t('customerProfile.buildingsCount') || 'Buildings'}:
                      </span>
                      <span className='ml-2 text-slate-900'>{buildings.length}</span>
                    </div>
                    <div>
                      <span className='font-medium text-slate-700'>
                        {t('customerProfile.agreementsCount') || 'Service Agreements'}:
                      </span>
                      <span className='ml-2 text-slate-900'>{serviceAgreements.length}</span>
                    </div>
                  </div>
                </div>

                {customer.notes && (
                  <div className='md:col-span-2'>
                    <h3 className='text-lg font-semibold text-slate-900 mb-4'>
                      {t('customer.form.notes') || 'Notes'}
                    </h3>
                    <div className='bg-slate-50 p-4 rounded-lg text-sm text-slate-700'>
                      {customer.notes}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'buildings' && (
              <div>
                {buildings.length === 0 ? (
                  <EmptyState
                    icon={BuildingIcon}
                    title={t('customerProfile.buildings.empty') || 'No buildings found'}
                    description={
                      t('customerProfile.buildings.emptyDescription') ||
                      'This customer has no buildings registered.'
                    }
                  />
                ) : (
                  <div className='space-y-4'>
                    {buildings.map(building => {
                      const buildingReports = reports.filter(
                        r =>
                          r.customerAddress === building.address ||
                          r.buildingAddress === building.address
                      );
                      const buildingAgreements = serviceAgreements.filter(
                        a => a.buildingId === building.id
                      );

                      return (
                        <div
                          key={building.id}
                          className='border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors'
                        >
                          <div className='flex items-start justify-between'>
                            <div className='flex-1'>
                              <div className='flex items-center gap-2 mb-2'>
                                <BuildingIcon className='w-5 h-5 text-slate-600' />
                                <h4 className='text-lg font-semibold text-slate-900'>
                                  {building.address}
                                </h4>
                              </div>
                              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600'>
                                {building.buildingType && (
                                  <div>
                                    <span className='font-medium'>
                                      {t('customerProfile.buildingType') || 'Type'}:
                                    </span>{' '}
                                    {building.buildingType}
                                  </div>
                                )}
                                {building.roofType && (
                                  <div>
                                    <span className='font-medium'>
                                      {t('form.fields.roofType') || 'Roof Type'}:
                                    </span>{' '}
                                    {t(`roofTypes.${building.roofType}`) || building.roofType}
                                  </div>
                                )}
                                {building.roofSize && (
                                  <div>
                                    <span className='font-medium'>
                                      {t('customerProfile.roofSize') || 'Roof Size'}:
                                    </span>{' '}
                                    {building.roofSize} m²
                                  </div>
                                )}
                                <div>
                                  <span className='font-medium'>
                                    {t('customerProfile.created') || 'Created'}:
                                  </span>{' '}
                                  {formatDate(building.createdAt)}
                                </div>
                              </div>
                              <div className='mt-3 flex flex-wrap gap-4 text-sm'>
                                <span className='text-slate-600'>
                                  {buildingReports.length}{' '}
                                  {t('customerProfile.reports') || 'reports'}
                                </span>
                                <span className='text-slate-600'>
                                  {buildingAgreements.length}{' '}
                                  {t('customerProfile.agreements') || 'agreements'}
                                </span>
                                {/* ESG Reports count and link */}
                                {esgReports[building.id]?.length > 0 ? (
                                  <span className='text-green-600 flex items-center gap-1'>
                                    <Leaf className='w-4 h-4' />
                                    {esgReports[building.id].length}{' '}
                                    {t('customerProfile.esgReports') || 'ESG report(s)'}
                                  </span>
                                ) : null}
                              </div>

                              {/* Building Actions */}
                              <div className='mt-4 flex flex-wrap gap-2'>
                                {/* Edit Building Button */}
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    navigate(`/portal/buildings/${building.id}`);
                                  }}
                                  className='flex items-center gap-1 px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors'
                                >
                                  <Edit className='w-3 h-3' />
                                  Edit
                                </button>

                                {/* Delete Building Button */}
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    setDeletingBuildingId(building.id);
                                    setShowDeleteConfirm(true);
                                  }}
                                  className='flex items-center gap-1 px-3 py-2 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors'
                                >
                                  <Trash2 className='w-3 h-3' />
                                  Delete
                                </button>
                              </div>

                              {/* ESG Report Actions */}
                              <div className='mt-3 flex flex-wrap gap-2'>
                                {esgReports[building.id]?.length > 0 ? (
                                  <>
                                    {esgReports[building.id][0].isPublic &&
                                      esgReports[building.id][0].publicLinkId && (
                                        <button
                                          onClick={e => {
                                            e.stopPropagation();
                                            window.open(
                                              `/esg-report/public/${esgReports[building.id][0].publicLinkId}`,
                                              '_blank'
                                            );
                                          }}
                                          className='flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors'
                                        >
                                          <ExternalLink className='w-3 h-3' />
                                          {t('customerProfile.viewEsgReport') || 'View ESG Report'}
                                        </button>
                                      )}
                                    <button
                                      onClick={e => {
                                        e.stopPropagation();
                                        navigate(`/admin/esg-service?buildingId=${building.id}`);
                                      }}
                                      className='flex items-center gap-1 px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200 transition-colors'
                                    >
                                      <Leaf className='w-3 h-3' />
                                      {t('customerProfile.editEsgReport') || 'Edit ESG Report'}
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={e => {
                                      e.stopPropagation();
                                      navigate(`/admin/esg-service?buildingId=${building.id}`);
                                    }}
                                    className='flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors'
                                  >
                                    <Leaf className='w-3 h-3' />
                                    {t('customerProfile.createEsgReport') || 'Create ESG Report'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reports' && (
              <div>
                {reports.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title={t('customerProfile.reports.empty') || 'No reports found'}
                    description={
                      t('customerProfile.reports.emptyDescription') ||
                      'This customer has no reports yet.'
                    }
                  />
                ) : (
                  <div className='space-y-4'>
                    {reports.map(report => (
                      <div
                        key={report.id}
                        className='border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors cursor-pointer'
                        onClick={() => navigate(`/report/view/${report.id}`)}
                      >
                        <div className='flex items-start justify-between'>
                          <div className='flex-1'>
                            <div className='flex items-center gap-2 mb-2'>
                              <FileText className='w-5 h-5 text-slate-600' />
                              <h4 className='text-lg font-semibold text-slate-900'>
                                {t('customerProfile.report') || 'Report'} -{' '}
                                {formatDate(report.inspectionDate)}
                              </h4>
                              <StatusBadge
                                status={mapReportStatus(report.status)}
                                label={getReportStatusLabel(report.status, t)}
                              />
                            </div>
                            <div className='grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-slate-600 mb-2'>
                              <div>
                                <span className='font-medium'>
                                  {t('customerProfile.inspectionDate') || 'Inspection Date'}:
                                </span>{' '}
                                {formatDate(report.inspectionDate)}
                              </div>
                              <div>
                                <span className='font-medium'>
                                  {t('customerProfile.address') || 'Address'}:
                                </span>{' '}
                                {report.buildingAddress || report.customerAddress}
                              </div>
                              <div>
                                <span className='font-medium'>
                                  {t('customerProfile.created') || 'Created'}:
                                </span>{' '}
                                {formatDate(report.createdAt)}
                              </div>
                            </div>
                            {report.offerValue && (
                              <div className='text-sm'>
                                <span className='font-medium text-slate-700'>
                                  {t('customerProfile.offerValue') || 'Offer Value'}:
                                </span>{' '}
                                <span className='text-green-600 font-semibold'>
                                  {formatCurrency(report.offerValue)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className='ml-4'>
                            <button className='text-slate-600 hover:text-slate-900'>
                              <ArrowLeft className='w-5 h-5 rotate-180' />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'agreements' && (
              <div>
                {serviceAgreements.length === 0 ? (
                  <EmptyState
                    icon={FileCheck}
                    title={
                      t('customerProfile.serviceAgreements.empty') || 'No service agreements found'
                    }
                    description={
                      t('customerProfile.serviceAgreements.emptyDescription') ||
                      'This customer has no service agreements yet.'
                    }
                  />
                ) : (
                  <div className='space-y-4'>
                    {serviceAgreements.map(agreement => {
                      const associatedBuilding = buildings.find(b => b.id === agreement.buildingId);

                      return (
                        <div
                          key={agreement.id}
                          className='border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors'
                        >
                          <div className='flex items-start justify-between'>
                            <div className='flex-1'>
                              <div className='flex items-center gap-2 mb-2'>
                                <FileCheck className='w-5 h-5 text-slate-600' />
                                <h4 className='text-lg font-semibold text-slate-900'>
                                  {agreement.title}
                                </h4>
                                <StatusBadge
                                  status={
                                    agreement.status === 'active'
                                      ? 'active'
                                      : agreement.status === 'expired'
                                        ? 'expired'
                                        : agreement.status === 'cancelled'
                                          ? 'cancelled'
                                          : 'pending'
                                  }
                                />
                              </div>
                              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600 mb-2'>
                                <div>
                                  <span className='font-medium'>
                                    {t('customerProfile.agreementType') || 'Type'}:
                                  </span>{' '}
                                  {agreement.agreementType}
                                </div>
                                <div>
                                  <span className='font-medium'>
                                    {t('customerProfile.startDate') || 'Start Date'}:
                                  </span>{' '}
                                  {formatDate(agreement.startDate)}
                                </div>
                                <div>
                                  <span className='font-medium'>
                                    {t('customerProfile.endDate') || 'End Date'}:
                                  </span>{' '}
                                  {formatDate(agreement.endDate)}
                                </div>
                                <div>
                                  <span className='font-medium'>
                                    {t('customerProfile.nextService') || 'Next Service'}:
                                  </span>{' '}
                                  {formatDate(agreement.nextServiceDate)}
                                </div>
                              </div>
                              {associatedBuilding && (
                                <div className='text-sm text-slate-600 mb-2'>
                                  <span className='font-medium'>
                                    {t('customerProfile.building') || 'Building'}:
                                  </span>{' '}
                                  {associatedBuilding.address}
                                </div>
                              )}
                              {agreement.price && (
                                <div className='text-sm'>
                                  <span className='font-medium text-slate-700'>
                                    {t('customerProfile.price') || 'Price'}:
                                  </span>{' '}
                                  <span className='text-green-600 font-semibold'>
                                    {formatCurrency(agreement.price)} {agreement.currency || 'DKK'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Building Confirmation Dialog */}
      {showDeleteConfirm && deletingBuildingId && (
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
                This building will be permanently deleted. This action cannot be undone.
              </p>
              <div className='flex gap-3 justify-center'>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletingBuildingId(null);
                  }}
                  className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteBuilding(deletingBuildingId)}
                  className='px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors'
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerProfile;
