import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Report } from '../../types';
import { useIntl } from '../../hooks/useIntl';
import { BRAND_CONFIG } from '../../config/brand';
import LoadingSpinner from '../common/LoadingSpinner';
import EnhancedErrorDisplay from '../EnhancedErrorDisplay';
import AgritectumLogo from '../AgritectumLogo';
import CostSummaryCard from '../ReportView/CostSummaryCard';
import { formatCurrencyAmount, getCurrencyPreference, Currency } from '../../utils/currencyUtils';
import {
  User,
  MapPin,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle,
  Building,
  Shield,
  Download,
  FileText,
  Calendar,
  Wrench,
  Package,
  Route,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

const PublicReportView: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const { t, locale } = useIntl();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [branchInfo, setBranchInfo] = useState<{ name: string; logoUrl?: string } | null>(null);
  const [selectedCurrency] = useState<Currency>(getCurrencyPreference());

  const handleExportPDF = () => {
    window.print();
  };

  useEffect(() => {
    const fetchReport = async () => {
      if (!reportId) {
        setError('No report ID provided');
        setLoading(false);
        return;
      }

      try {
        const reportDoc = await getDoc(doc(db, 'reports', reportId));

        if (!reportDoc.exists()) {
          setError('Report not found');
          setLoading(false);
          return;
        }

        const reportData = { id: reportDoc.id, ...reportDoc.data() } as Report;
        
        if (!reportData.isPublic && !reportData.isShared) {
          setError('This report is not publicly accessible');
          setLoading(false);
          return;
        }
        
        setReport(reportData);

        // Load branch information if branchId exists
        if (reportData.branchId) {
          try {
            const { getBranchById } = await import('../../services/branchService');
            const branch = await getBranchById(reportData.branchId);
            if (branch) {
              setBranchInfo({
                name: branch.name,
                logoUrl: branch.logoUrl,
              });
            }
          } catch (error) {
            console.warn('Could not load branch information:', error);
          }
        }

      } catch (err) {
        console.error('Error fetching report:', err);
        setError('Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId]);

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center'>
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4'>
        <EnhancedErrorDisplay
          error={error || 'The requested report could not be found or is no longer available.'}
          title='Report Not Found'
          showContactSupport={true}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

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

  const formatCurrency = (amount: number, currency?: string) => {
    const currencyCode = (currency as Currency) || selectedCurrency;
    return formatCurrencyAmount(amount, currencyCode, locale);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-slate-800 bg-slate-100 border-slate-300';
      case 'high':
        return 'text-slate-700 bg-slate-50 border-slate-200';
      case 'medium':
        return 'text-slate-600 bg-slate-50 border-slate-200';
      case 'low':
        return 'text-slate-600 bg-slate-50 border-slate-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-slate-800 bg-slate-100 border-slate-300';
      case 'medium':
        return 'text-slate-700 bg-slate-50 border-slate-200';
      case 'low':
        return 'text-slate-600 bg-slate-50 border-slate-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  // Calculate recommended actions total
  const recommendedActionsTotal = (report.recommendedActions || []).reduce(
    (sum, action) => sum + (action.estimatedCost || 0),
    0
  );

  // Calculate total cost
  const totalCost = recommendedActionsTotal + 
    (report.laborCost || 0) + 
    (report.materialCost || 0) + 
    (report.travelCost || 0) + 
    (report.overheadCost || 0);

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100'>
      <div id='report-root'>
        {/* Header */}
        <div className='bg-white border-b border-slate-200 shadow-sm'>
          <div className='max-w-7xl mx-auto px-6 py-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className='flex-shrink-0'>
                  <div className='bg-white rounded-xl p-2 border border-slate-200 shadow-sm'>
                    <AgritectumLogo size="lg" showText={false} />
                  </div>
                </div>
                <div>
                  <div className='text-xl font-bold text-slate-900'>{BRAND_CONFIG.BRAND_NAME.toUpperCase()}</div>
                  <div className='text-sm text-slate-500'>Building Performance Platform</div>
                </div>
              </div>
              <div className='flex items-center gap-3'>
                <div className='no-print flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors'>
                  <Shield className='w-4 h-4' />
                  <span>{t('reports.public.secureView')}</span>
                </div>
                <button
                  onClick={handleExportPDF}
                  className='no-print inline-flex items-center gap-2 px-5 py-2.5 bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-all shadow-sm hover:shadow-md'
                >
                  <Download className='w-4 h-4' />
                  <span>{t('reports.public.printSave')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className='max-w-7xl mx-auto px-6 py-6'>
          {/* Title Banner */}
          <div className='bg-gradient-to-r from-slate-900 to-slate-700 rounded-2xl p-8 mb-6 shadow-lg'>
            <div className='flex items-start justify-between'>
              <div>
                <h1 className='text-3xl font-bold text-white mb-2'>{t('reports.public.title') || 'Takservice rapport'}</h1>
                <p className='text-slate-300 text-sm'>
                  {t('reports.public.reportId')}: <span className='font-mono bg-slate-800 px-2 py-1 rounded'>{report.id}</span>
                </p>
              </div>
              <div className='bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 px-5 py-3'>
                <div className='flex items-center gap-2 mb-1'>
                  <Calendar className='w-4 h-4 text-white' />
                  <span className='text-xs font-medium text-white uppercase tracking-wide'>{t('reports.public.inspectionDate')}</span>
                </div>
                <div className='text-xl font-bold text-white'>{formatDate(report.inspectionDate)}</div>
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6'>
            {/* Customer Card */}
            <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6'>
              <h2 className='text-lg font-semibold text-slate-900 mb-4'>{t('reports.public.customerInformation')}</h2>
              <div className='space-y-4'>
                <div>
                  <div className='text-sm text-slate-500 mb-1'>{t('common.labels.name')}</div>
                  <div className='text-base font-medium text-slate-900'>{report.customerName}</div>
                </div>
                {report.customerPhone && (
                  <div className='flex items-center gap-2'>
                    <Phone className='w-4 h-4 text-slate-400' />
                    <span className='text-sm text-slate-700'>{report.customerPhone}</span>
                  </div>
                )}
                {report.customerEmail && (
                  <div className='flex items-center gap-2'>
                    <Mail className='w-4 h-4 text-slate-400' />
                    <span className='text-sm text-slate-700'>{report.customerEmail}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Property Card - Spans 2 columns */}
            <div className='lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6'>
              <h2 className='text-lg font-semibold text-slate-900 mb-4'>{t('reports.public.propertyLocation')}</h2>
              <div className='flex items-start gap-3'>
                <div className='w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                  <MapPin className='w-5 h-5 text-slate-600' />
                </div>
                <div className='flex-1'>
                  <div className='text-base font-medium text-slate-900'>{report.customerAddress}</div>
                  {report.buildingAddress && (
                    <div className='text-sm text-slate-500 mt-1'>{report.buildingAddress}</div>
                  )}
                  <span className='inline-block mt-2 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full'>
                    {t('common.propertyAddress')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cost Estimation Card */}
          <div className='bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6'>
            {/* Cost Header */}
            <div className='bg-gradient-to-r from-slate-700 to-slate-800 p-6'>
              <div className='flex items-center gap-3 mb-4'>
                <div className='w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center'>
                  <DollarSign className='w-6 h-6 text-white' />
                </div>
                <h2 className='text-xl font-bold text-white'>Kostnadsuppskattning</h2>
              </div>
              <div className='mt-4'>
                <div className='text-sm text-slate-300 mb-2 uppercase tracking-wide font-medium'>TOTAL UPPSKATTNING</div>
                <div className='text-5xl font-bold text-white'>{formatCurrency(totalCost)}</div>
              </div>
            </div>

            {/* Cost Body */}
            <div className='p-6'>
              {/* Recommended Actions Alert */}
              {recommendedActionsTotal > 0 && (
                <div className='bg-slate-50 border border-slate-300 rounded-lg p-4 mb-6 flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <AlertCircle className='w-5 h-5 text-slate-600' />
                    <span className='font-semibold text-slate-800'>Rekommenderade åtgärder</span>
                  </div>
                  <span className='text-xl font-bold text-slate-900'>{formatCurrency(recommendedActionsTotal)}</span>
                </div>
              )}

              {/* Cost Breakdown Grid */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* Labor Cost */}
                <div className='bg-slate-50 rounded-lg border border-slate-200 p-5'>
                  <div className='flex items-center gap-3 mb-3'>
                    <div className='w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center'>
                      <Wrench className='w-5 h-5 text-slate-700' />
                    </div>
                    <div>
                      <div className='text-sm font-medium text-slate-700'>Arbetskostnad</div>
                      <div className='text-xl font-bold text-slate-900'>{formatCurrency(report.laborCost || 0)}</div>
                    </div>
                  </div>
                </div>

                {/* Material Cost */}
                <div className='bg-slate-50 rounded-lg border border-slate-200 p-5'>
                  <div className='flex items-center gap-3 mb-3'>
                    <div className='w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center'>
                      <Package className='w-5 h-5 text-slate-700' />
                    </div>
                    <div>
                      <div className='text-sm font-medium text-slate-700'>Materialkostnad</div>
                      <div className='text-xl font-bold text-slate-900'>{formatCurrency(report.materialCost || 0)}</div>
                    </div>
                  </div>
                </div>

                {/* Travel Cost */}
                <div className='bg-slate-50 rounded-lg border border-slate-200 p-5'>
                  <div className='flex items-center gap-3 mb-3'>
                    <div className='w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center'>
                      <Route className='w-5 h-5 text-slate-700' />
                    </div>
                    <div>
                      <div className='text-sm font-medium text-slate-700'>Resekostnad</div>
                      <div className='text-xl font-bold text-slate-900'>{formatCurrency(report.travelCost || 0)}</div>
                    </div>
                  </div>
                </div>

                {/* Overhead Cost */}
                <div className='bg-slate-50 rounded-lg border border-slate-200 p-5'>
                  <div className='flex items-center gap-3 mb-3'>
                    <div className='w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center'>
                      <DollarSign className='w-5 h-5 text-slate-700' />
                    </div>
                    <div>
                      <div className='text-sm font-medium text-slate-700'>{t('costEstimate.overhead') || 'Andet'}</div>
                      <div className='text-xl font-bold text-slate-900'>{formatCurrency(report.overheadCost || 0)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6'>
            <h3 className='text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2'>
              <Building className='w-5 h-5 text-slate-600' />
              {t('reports.public.propertyDetails')}
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <div className='text-sm text-slate-500 mb-1'>{t('reports.public.roofType')}</div>
                <div className='font-medium text-slate-900 capitalize'>{t(`roofTypes.${report.roofType}`) || report.roofType}</div>
              </div>
              {report.roofAge && (
                <div>
                  <div className='text-sm text-slate-500 mb-1'>{t('reports.public.roofAge')}</div>
                  <div className='font-medium text-slate-900'>{report.roofAge} {t('reports.public.years')}</div>
                </div>
              )}
              {report.roofSize && (
                <div>
                  <div className='text-sm text-slate-500 mb-1'>{t('reports.public.roofSize')}</div>
                  <div className='font-medium text-slate-900'>{report.roofSize} m²</div>
                </div>
              )}
            </div>
            {report.conditionNotes && (
              <div className='mt-4 pt-4 border-t border-slate-200'>
                <div className='text-sm text-slate-500 mb-2'>{t('reports.public.generalConditionNotes')}</div>
                <div className='text-slate-900 bg-slate-50 p-3 rounded-lg'>{report.conditionNotes}</div>
              </div>
            )}
          </div>

          {/* Roof Image with Annotations */}
          {report.roofImageUrl && (
            <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6'>
              <h3 className='text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2'>
                <MapPin className='w-5 h-5 text-slate-600' />
                {t('reports.public.roofOverview')}
              </h3>
              <div className='relative bg-slate-50 rounded-lg overflow-hidden' style={{ position: 'relative', paddingTop: '56.25%' }}>
                <img
                  src={report.roofImageUrl}
                  alt={t('reports.public.roofOverview')}
                  className='absolute inset-0 w-full h-full object-contain'
                />
                {report.roofImagePins && report.roofImagePins.map((pin, index) => {
                  const getPinColor = (severity: string) => {
                    switch (severity) {
                      case 'critical':
                        return 'bg-slate-800 border-slate-900';
                      case 'high':
                        return 'bg-slate-700 border-slate-800';
                      case 'medium':
                        return 'bg-slate-600 border-slate-700';
                      case 'low':
                        return 'bg-slate-500 border-slate-600';
                      default:
                        return 'bg-slate-600 border-slate-700';
                    }
                  };
                  return (
                    <div
                      key={pin.id || index}
                      className={`absolute w-6 h-6 ${getPinColor(pin.severity)} border-2 rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none`}
                      style={{
                        left: `${pin.x}%`,
                        top: `${pin.y}%`,
                      }}
                    >
                      <span className='absolute inset-0 flex items-center justify-center text-white text-xs font-bold'>
                        {index + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
              {report.roofImagePins && report.roofImagePins.length > 0 && (
                <div className='mt-4 text-sm text-slate-600'>
                  <p>{t('reports.public.markersDescription')}</p>
                </div>
              )}
            </div>
          )}

          {/* Issues Found */}
          {report.issuesFound && report.issuesFound.length > 0 && (
            <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6'>
              <h3 className='text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2'>
                <AlertTriangle className='w-5 h-5 text-slate-600' />
                {t('reports.public.issuesFound')} ({report.issuesFound.length})
              </h3>
              <div className='space-y-3'>
                {report.issuesFound.map((issue: any, index: number) => (
                  <div
                    key={issue.id || index}
                    className={`p-4 rounded-lg border ${getSeverityColor(issue.severity)}`}
                  >
                    <div className='flex items-start justify-between mb-2'>
                      <div className='font-medium capitalize'>{t(`issueTypes.${issue.type}`) || issue.type}</div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}
                      >
                        {t(`severity.${issue.severity}`) || issue.severity}
                      </span>
                    </div>
                    <div className='text-sm mb-2'>{issue.description}</div>
                    {issue.location && (
                      <div className='text-xs opacity-75'>{t('reports.public.location')}: {issue.location}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Actions */}
          {report.recommendedActions && report.recommendedActions.length > 0 && (
            <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6'>
              <h3 className='text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2'>
                <CheckCircle className='w-5 h-5 text-slate-600' />
                {t('reports.public.recommendedActions')} ({report.recommendedActions.length})
              </h3>
              <div className='space-y-3'>
                {report.recommendedActions.map((action: any, index: number) => (
                  <div
                    key={action.id || index}
                    className='bg-slate-50 border border-slate-200 rounded-lg p-4'
                  >
                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
                      <div className='flex-1 min-w-0'>
                        <div className='font-semibold text-slate-900 mb-1'>{action.description}</div>
                        {action.urgency && (
                          <div className='text-sm text-slate-600'>
                            {t('reports.public.urgency')}: {t(`urgency.${action.urgency}`) || action.urgency.replace('_', ' ')}
                          </div>
                        )}
                      </div>
                      <div className='flex items-center gap-3 flex-shrink-0'>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(action.priority)}`}
                        >
                          {t(`severity.${action.priority}`) || action.priority}
                        </span>
                        {action.estimatedCost && (
                          <span className='text-base font-bold text-slate-900 whitespace-nowrap'>
                            {formatCurrency(action.estimatedCost)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6'>
            <h3 className='text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2'>
              <Phone className='w-5 h-5 text-slate-600' />
              {t('reports.public.contactInformation')}
            </h3>
            <div className='bg-slate-50 border border-slate-200 rounded-lg p-5'>
              <p className='text-slate-700 text-sm mb-4 leading-relaxed'>
                {t('reports.public.contactDescription')}
              </p>
              <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200'>
                    <Phone className='w-4 h-4 text-slate-600' />
                  </div>
                  <span className='text-sm font-medium text-slate-900'>+46 470 123 456</span>
                </div>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200'>
                    <Mail className='w-4 h-4 text-slate-600' />
                  </div>
                  <span className='text-sm font-medium text-slate-900'>{import.meta.env.VITE_SUPPORT_EMAIL || 'support@example.com'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className='mt-8 text-center text-sm text-slate-500'>
            <p>© 2025 {BRAND_CONFIG.LEGAL_ENTITY}. {t('reports.public.allRightsReserved')}</p>
            <p className='mt-1'>{t('reports.public.professionalServices')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicReportView;
