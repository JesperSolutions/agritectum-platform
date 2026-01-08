import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useReports } from '../contexts/ReportContextSimple';
import { useAuth } from '../contexts/AuthContext';
import FormErrorBoundary from './FormErrorBoundary';
import { Report, Offer } from '../types';
import { useIntl } from '../hooks/useIntl';
import QRCode from 'qrcode';
import {
  Calendar,
  User,
  MapPin,
  Phone,
  Mail,
  FileText,
  Edit,
  AlertTriangle,
  CheckCircle,
  Archive,
  Send,
  Share2,
  QrCode,
  DollarSign,
  Eye,
} from 'lucide-react';
import LoadingSpinner from './common/LoadingSpinner';
import CreateOfferModal from './offers/CreateOfferModal';
import { reportHasOffer, getOfferByReportId, createOffer as createOfferService } from '../services/offerService';
import NotificationToast from './common/NotificationToast';
import { lazy, Suspense } from 'react';
import AgritectumLogo from './AgritectumLogo';
import CostSummaryCard from './ReportView/CostSummaryCard';

// Lazy load map component
const InteractiveRoofMap = lazy(() => import('./InteractiveRoofMap'));

const ReportView: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const { currentUser } = useAuth();
  const { getReport, updateReport } = useReports();
  const { t, formatCurrency } = useIntl();
  const navigate = useNavigate();

  // Fallback for currency formatting
  const formatCurrencySafe = (value: number) => {
    try {
      return formatCurrency ? formatCurrency(value) : `${value} SEK`;
    } catch (error) {
      return `${value} SEK`;
    }
  };

  // Centralized QR code generation function
  const generateQRCode = async (url: string): Promise<string> => {
    try {
      setQrGenerating(true);
      const qrCodeDataUrl = await QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    } finally {
      setQrGenerating(false);
    }
  };

  // Generate external URL and QR code with race condition protection
  const generateExternalResources = async (reportId: string) => {
    if (!reportId) return;
    
    // Prevent multiple simultaneous generation attempts
    if (qrGenerating) {
      return;
    }
    
    try {
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/report/public/${reportId}`;
      setExternalUrl(url);
      
      // Only generate if we don't already have a QR code
      if (!qrCodeUrl) {
        const qrDataUrl = await generateQRCode(url);
        // Use functional update to prevent race conditions
        setQrCodeUrl(prev => prev || qrDataUrl);
      }
    } catch (error) {
      console.error('Error generating external resources:', error);
      setToast({
        message: 'Failed to generate sharing resources',
        type: 'error',
      });
      // Reset qrGenerating on error
      setQrGenerating(false);
    }
  };

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [externalUrl, setExternalUrl] = useState<string>('');
  const [qrGenerating, setQrGenerating] = useState(false);
  const [branchInfo, setBranchInfo] = useState<{ name: string; logoUrl?: string } | null>(null);
  const [priorReport, setPriorReport] = useState<Report | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [showCreateOfferModal, setShowCreateOfferModal] = useState(false);
  const [hasOffer, setHasOffer] = useState(false);
  const [existingOffer, setExistingOffer] = useState<Offer | null>(null);
  const [addressCoordinates, setAddressCoordinates] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    const loadReport = async () => {
      if (!reportId) {
        setError('Report ID not provided');
        setLoading(false);
        return;
      }

      try {
        const fetchedReport = await getReport(reportId);
        if (fetchedReport) {
          setReport(fetchedReport);

          // Generate external URL and QR code if report is shared
          if (fetchedReport.isShared) {
            await generateExternalResources(reportId);
          }


          // Load prior report if linked
          if (fetchedReport.priorReportId) {
            try {
              const priorReportData = await getReport(fetchedReport.priorReportId);
              if (priorReportData) {
                setPriorReport(priorReportData);
              }
            } catch (error) {
              console.warn('Could not load prior report:', error);
            }
          }

          // Check if report has an associated offer
          if (reportId) {
            try {
              const offerExists = await reportHasOffer(reportId, currentUser?.branchId);
              setHasOffer(offerExists);
              if (offerExists) {
                const offer = await getOfferByReportId(reportId, currentUser?.branchId);
                setExistingOffer(offer);
              }
            } catch (error) {
              console.warn('Could not check for offer:', error);
            }
          }

          // Geocode address for map display
          if (fetchedReport.customerAddress) {
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fetchedReport.customerAddress)}&limit=1`
              );
              if (response.ok) {
                const data = await response.json();
                if (data && data.length > 0) {
                  setAddressCoordinates({
                    lat: parseFloat(data[0].lat),
                    lon: parseFloat(data[0].lon),
                  });
                }
              }
            } catch (error) {
              console.warn('Could not geocode address for map:', error);
            }
          }

          // Load branch information if user has branchId
          if (currentUser?.branchId) {
            try {
              const { getBranchById } = await import('../services/branchService');
              const branch = await getBranchById(currentUser.branchId);
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
        } else {
          setError('Report not found');
        }
      } catch (error) {
        console.error('Error loading report:', error);
        setError('Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [reportId, currentUser?.branchId]);

  const handleStatusChange = async (newStatus: string) => {
    if (!report) return;

    // Validate status transition
    const { isValidTransition, getValidNextStatuses } = await import('../utils/reportStatusUtils');
    
    if (!isValidTransition(report.status, newStatus as any)) {
      const validNext = getValidNextStatuses(report.status);
      setToast({
        message: `Cannot change status from "${report.status}" to "${newStatus}". Valid next statuses: ${validNext.join(', ')}`,
        type: 'error',
      });
      return;
    }

    try {
      const updates: any = { status: newStatus as any };
      
      // If setting to shared, also set isShared and isPublic flags
      if (newStatus === 'shared') {
        updates.isShared = true;
        updates.isPublic = true;
      }
      
      await updateReport(report.id, updates);
      setReport(prev => (prev ? { ...prev, ...updates } : null));
      
      // Show success message
      const statusMessages: Record<string, string> = {
        'completed': t('reportView.reportCompleted'),
        'sent': t('reportView.reportSent'),
        'shared': t('reportView.reportShared'),
        'archived': t('reports.archived'),
      };
      
      setToast({
        message: statusMessages[newStatus] || t('messages.success.saved'),
        type: 'success',
      });
    } catch (error) {
      console.error('Error updating status:', error);
      setToast({
        message: t('messages.error.saving'),
        type: 'error',
      });
    }
  };

  const handleCreateOffer = async (offerData: any) => {
    if (!report || !reportId) return;

    try {
      await createOfferService(reportId, {
        ...offerData,
        reportId,
        branchId: currentUser?.branchId || '',
        createdBy: currentUser?.uid || '',
        createdByName: currentUser?.displayName || currentUser?.email || '',
        customerName: report.customerName,
        customerEmail: report.customerEmail || '',
        customerPhone: report.customerPhone,
        customerAddress: report.customerAddress,
        currency: 'SEK',
        totalAmount: (() => {
          // Calculate sum of estimated costs from recommended actions (solutions)
          const recommendedActionsCost = (report.recommendedActions || []).reduce(
            (sum, action) => sum + (action.estimatedCost || 0),
            0
          );
          const subtotal = offerData.laborCost + offerData.materialCost + offerData.travelCost + offerData.overheadCost + recommendedActionsCost;
          const profit = subtotal * (offerData.profitMargin / 100);
          return subtotal + profit;
        })(),
      });

      setToast({
        message: 'Offer created successfully!',
        type: 'success',
      });

      setShowCreateOfferModal(false);
      setHasOffer(true);

      // Navigate to the offer
      setTimeout(() => navigate(`/offers`), 1500);
    } catch (error) {
      console.error('Error creating offer:', error);
      setToast({
        message: 'Failed to create offer',
        type: 'error',
      });
    }
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-slate-100 text-slate-700';
      case 'completed':
        return 'bg-slate-200 text-slate-800';
      case 'sent':
        return 'bg-slate-200 text-slate-800';
      case 'shared':
        return 'bg-slate-200 text-slate-800';
      case 'archived':
        return 'bg-slate-100 text-slate-600';
      case 'offer_sent':
      case 'offer_accepted':
      case 'offer_rejected':
      case 'offer_expired':
        return 'bg-slate-200 text-slate-800';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Determine if user can edit this report
  // Inspectors can edit their own reports, admins can edit reports in their branch
  const canEdit = report && (
    currentUser?.uid === report.createdBy ||
    currentUser?.role === 'branchAdmin' ||
    currentUser?.role === 'superadmin'
  ) && report.status !== 'archived'; // Archived reports cannot be edited

  if (loading) {
    return (
      <div className='max-w-4xl mx-auto space-y-6'>
        {/* Header skeleton */}
        <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
          <div className='animate-pulse'>
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center space-x-4'>
                <div className='w-12 h-12 bg-gray-200 rounded'></div>
                <div>
                  <div className='h-6 bg-gray-200 rounded w-48 mb-2'></div>
                  <div className='h-4 bg-gray-200 rounded w-32'></div>
                </div>
              </div>
              <div className='flex space-x-2'>
                <div className='h-8 bg-gray-200 rounded w-20'></div>
                <div className='h-8 bg-gray-200 rounded w-20'></div>
                <div className='h-8 bg-gray-200 rounded w-20'></div>
              </div>
            </div>
          </div>
        </div>

        {/* Content skeleton */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          <div className='lg:col-span-2 space-y-6'>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
                <div className='animate-pulse'>
                  <div className='h-6 bg-gray-200 rounded w-1/3 mb-4'></div>
                  <div className='space-y-2'>
                    <div className='h-4 bg-gray-200 rounded w-full'></div>
                    <div className='h-4 bg-gray-200 rounded w-3/4'></div>
                    <div className='h-4 bg-gray-200 rounded w-1/2'></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className='bg-red-50 border border-red-200 rounded-lg p-6'>
        <div className='flex'>
          <AlertTriangle className='w-5 h-5 text-red-400' />
          <div className='ml-3'>
            <h3 className='text-sm font-medium text-red-800'>{error || 'Report not found'}</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <FormErrorBoundary>
      <div className='max-w-4xl mx-auto space-y-6'>
        {/* Header */}
        <div className='bg-white p-6 rounded-xl shadow-sm border border-slate-200'>
          <div className='flex items-start justify-between gap-6'>
            {/* Left Section - Logo and Title */}
            <div className='flex items-start gap-4 flex-1 min-w-0'>
              {/* Branch Logo */}
              <div className='flex-shrink-0'>
                {branchInfo?.logoUrl ? (
                  <div className='bg-white rounded-xl p-2 border border-slate-200 shadow-sm'>
                    <img
                      src={branchInfo.logoUrl}
                      alt={`${branchInfo.name} logo`}
                      className='h-12 w-auto object-contain'
                      onError={e => {
                        console.error('Error loading branch logo:', e);
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.parentElement?.parentElement?.querySelector('.fallback-logo');
                        if (fallback) (fallback as HTMLElement).style.display = 'flex';
                      }}
                    />
                  </div>
                ) : null}
                {(!branchInfo?.logoUrl || branchInfo.logoUrl === '') && (
                  <div className='fallback-logo flex items-center justify-center bg-white rounded-xl p-2 border border-slate-200 shadow-sm'>
                    <AgritectumLogo size="sm" showText={false} />
                  </div>
                )}
              </div>

              {/* Title and Info */}
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-3 mb-2'>
                  <h1 className='text-2xl font-bold text-slate-900'>
                    {t('reports.public.title') || 'Takservice rapport'}
                  </h1>
                  {report.isOffer && (
                    <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700'>
                      <DollarSign className='w-3 h-3 mr-1' />
                      {t('offer.fields.isOffer')}
                    </span>
                  )}
                </div>
                <p className='text-slate-900 font-medium mb-1'>{report.customerName}</p>
                {branchInfo && (
                  <p className='text-sm text-slate-600'>{branchInfo.name}</p>
                )}
                {report.offerValue && (
                  <p className='text-sm text-slate-600 mt-1'>
                    {t('offer.fields.offerValue')}: {formatCurrencySafe(report.offerValue)}
                  </p>
                )}
              </div>
            </div>

            {/* Right Section - Status and Actions */}
            <div className='flex flex-col items-end gap-3 flex-shrink-0'>
              {/* Status Badge */}
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(report.status)}`}
              >
                {report.status === 'completed'
                  ? t('common.status.completed')
                  : report.status === 'shared'
                    ? t('report.status.shared')
                    : report.status === 'draft'
                      ? t('report.status.draft') || 'Utkast'
                      : report.status === 'sent'
                        ? t('report.status.sent') || 'Skickad'
                        : report.status === 'archived'
                          ? t('report.status.archived') || 'Arkiverad'
                          : report.status === 'offer_sent' && report.isOffer
                            ? t('report.status.offerSent')
                            : report.status === 'offer_accepted' && report.isOffer
                              ? t('report.status.offerAccepted')
                              : report.status === 'offer_rejected' && report.isOffer
                                ? t('report.status.offerRejected')
                                : report.status === 'offer_expired' && report.isOffer
                                  ? t('report.status.offerExpired')
                                  : t(`report.status.${report.status}`) || report.status}
              </span>

              {/* Action Buttons - Horizontal layout */}
              <div className='flex items-center gap-2 flex-wrap'>
                {canEdit && (
                  <Link
                    to={`/report/edit/${report.id}`}
                    className='inline-flex items-center px-3 py-2 border border-slate-300 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-colors shadow-sm'
                  >
                    <Edit className='w-4 h-4 mr-2' />
                    {t('actions.edit')}
                  </Link>
                )}
                
                <button
                  onClick={async () => {
                    try {
                      if (!report.isShared) {
                        await handleStatusChange('shared');
                      }
                      if (!externalUrl || !qrCodeUrl) {
                        await generateExternalResources(report.id);
                      }
                      const urlToCopy = externalUrl || `${window.location.origin}/report/public/${report.id}`;
                      await navigator.clipboard.writeText(urlToCopy);
                      setToast({
                        message: t('reportView.linkCopied'),
                        type: 'success',
                      });
                    } catch (error) {
                      console.error('Error copying link:', error);
                      setToast({
                        message: t('messages.error.sending'),
                        type: 'error',
                      });
                    }
                  }}
                  className='inline-flex items-center px-3 py-2 border border-slate-300 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-colors shadow-sm'
                  title={t('reportView.copyLink')}
                  aria-label={t('reportView.copyLink')}
                >
                  <Share2 className='w-4 h-4 mr-2' />
                  {t('reportView.copyLink')}
                </button>

                <button
                  onClick={async () => {
                    try {
                      if (!report.isShared) {
                        await handleStatusChange('shared');
                      }
                      if (!externalUrl || !qrCodeUrl) {
                        await generateExternalResources(report.id);
                      }
                      const qrWindow = window.open('', '_blank', 'width=300,height=400,scrollbars=yes,resizable=yes');
                      if (qrWindow) {
                        const urlToShow = externalUrl || `${window.location.origin}/report/public/${report.id}`;
                        qrWindow.document.write(`
                          <html>
                            <head>
                              <title>QR Code - ${report.customerName}</title>
                              <style>
                                body { margin:0; padding:20px; text-align:center; font-family:Arial, sans-serif; background:#f5f5f5; }
                                .container { background:white; padding:20px; border-radius:8px; box-shadow:0 2px 10px rgba(0,0,0,0.1); max-width:280px; margin:0 auto; }
                                h3 { margin:0 0 15px 0; color:#333; }
                                img { max-width:100%; border:1px solid #ddd; border-radius:4px; }
                                p { margin:15px 0 0 0; font-size:12px; color:#666; line-height:1.4; }
                                a { color:#0066cc; text-decoration:none; }
                                a:hover { text-decoration:underline; }
                              </style>
                            </head>
                            <body>
                              <div class="container">
                                <h3>Report QR Code</h3>
                                <img src="${qrCodeUrl || ''}" alt="QR Code" />
                                <p>
                                  Scan to view report<br>
                                  <a href="${urlToShow}" target="_blank">${urlToShow}</a>
                                </p>
                              </div>
                            </body>
                          </html>
                        `);
                        qrWindow.document.close();
                      } else {
                        setToast({
                          message: 'Popup blocked. Please allow popups for this site.',
                          type: 'warning',
                        });
                      }
                    } catch (error) {
                      console.error('Error showing QR code:', error);
                      setToast({
                        message: 'Failed to generate QR code. Please try again.',
                        type: 'error',
                      });
                    }
                  }}
                  disabled={qrGenerating}
                  className='inline-flex items-center px-3 py-2 border border-slate-300 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed'
                  title={t('reportView.qrCode')}
                  aria-label={t('reportView.qrCode')}
                >
                  {qrGenerating ? (
                    <LoadingSpinner size='sm' />
                  ) : (
                    <QrCode className='w-4 h-4 mr-2' />
                  )}
                  {qrGenerating ? 'Generating...' : t('reportView.qrCode')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Cost Summary Card */}
        <CostSummaryCard
          report={report}
          isEditable={true}
          canEdit={!!(canEdit && report.createdBy === currentUser?.uid && currentUser?.role === 'inspector')}
          onUpdate={async (costs) => {
            try {
              await updateReport(report.id, {
                laborCost: costs.laborCost,
                materialCost: costs.materialCost,
                travelCost: costs.travelCost,
                overheadCost: costs.overheadCost,
              });
              setToast({
                message: 'Kostnader sparade',
                type: 'success',
              });
              // Reload report to get updated values
              const updatedReport = await getReport(report.id);
              if (updatedReport) {
                setReport(updatedReport);
              }
            } catch (error) {
              console.error('Error updating costs:', error);
              setToast({
                message: 'Kunde inte spara kostnader',
                type: 'error',
              });
            }
          }}
        />

        {/* Report Details */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Customer Information */}
          <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
            <h2 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
              <User className='w-5 h-5 mr-2' />
              Customer Information
            </h2>

            <div className='space-y-3'>
              <div className='flex items-center'>
                <User className='w-4 h-4 text-gray-400 mr-3' />
                <div className='flex items-center gap-2'>
                  <span className='text-gray-900'>{report.customerName}</span>
                  {report.customerType === 'company' && (
                    <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                      Företag
                    </span>
                  )}
                </div>
              </div>

              <div className='flex items-center'>
                <MapPin className='w-4 h-4 text-gray-400 mr-3' />
                <div>
                  <span className='text-gray-900'>{report.customerAddress}</span>
                  {report.customerType === 'company' && report.buildingAddress && (
                    <div className='text-sm text-gray-600 mt-1 ml-7'>
                      Byggnadsadress: {report.buildingAddress}
                    </div>
                  )}
                </div>
              </div>

              {report.customerPhone && (
                <div className='flex items-center'>
                  <Phone className='w-4 h-4 text-gray-400 mr-3' />
                  <span className='text-gray-900'>{report.customerPhone}</span>
                </div>
              )}

              {report.customerEmail && (
                <div className='flex items-center'>
                  <Mail className='w-4 h-4 text-gray-400 mr-3' />
                  <span className='text-gray-900'>{report.customerEmail}</span>
                </div>
              )}
            </div>
          </div>


          {/* Prior Report Information */}
          {priorReport && (
            <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
              <h2 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
                <FileText className='w-5 h-5 mr-2' />
                Prior Report/Offer
              </h2>

              <div className='space-y-3'>
                <div className='flex items-center'>
                  <Calendar className='w-4 h-4 text-gray-400 mr-3' />
                  <span className='text-gray-900'>
                    {new Date(priorReport.inspectionDate).toLocaleDateString('sv-SE', {
                      timeZone: 'Europe/Stockholm',
                    })}
                  </span>
                </div>

                <div className='flex items-center'>
                  <FileText className='w-4 h-4 text-gray-400 mr-3' />
                  <span className='text-gray-900 capitalize'>{priorReport.status}</span>
                </div>

                {priorReport.offerValue && (
                  <div className='flex items-center'>
                    <DollarSign className='w-4 h-4 text-gray-400 mr-3' />
                    <span className='text-gray-900'>
                      {priorReport.offerValue.toLocaleString('sv-SE')} SEK
                    </span>
                  </div>
                )}

                <div className='mt-4'>
                  <Link
                    to={`/report/view/${priorReport.id}`}
                    className='inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  >
                    <Eye className='w-4 h-4 mr-2' />
                    View Prior Report
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Inspection Information */}
          <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
            <h2 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
              <Calendar className='w-5 h-5 mr-2' />
              Inspection Details
            </h2>

            <div className='space-y-3'>
              <div>
                <span className='text-sm font-medium text-gray-500'>Inspection Date:</span>
                <div className='text-gray-900'>
                  {new Date(report.inspectionDate).toLocaleDateString('sv-SE', {
                    timeZone: 'Europe/Stockholm',
                  })}
                </div>
              </div>

              <div>
                <span className='text-sm font-medium text-gray-500'>Roof Type:</span>
                <div className='text-gray-900 capitalize'>{report.roofType}</div>
              </div>

              {report.roofAge && (
                <div>
                  <span className='text-sm font-medium text-gray-500'>Roof Age:</span>
                  <div className='text-gray-900'>{report.roofAge} years</div>
                </div>
              )}

              <div>
                <span className='text-sm font-medium text-gray-500'>Inspector:</span>
                <div className='text-gray-900'>{report.createdByName}</div>
              </div>

            </div>
          </div>
        </div>

        {/* Condition Notes */}
        {report.conditionNotes && (
          <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
            <h2 className='text-lg font-medium text-gray-900 mb-4'>General Condition Notes</h2>
            <p className='text-gray-700 whitespace-pre-wrap leading-relaxed'>
              {report.conditionNotes}
            </p>
          </div>
        )}

        {/* Roof Image with Pins - Static view */}
        {report.roofImageUrl && (
          <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
            <h2 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
              <MapPin className='w-5 h-5 mr-2 text-blue-600' />
              {t('reportView.roofOverview') || 'Roof Overview with Issue Locations'}
            </h2>
            <div className='relative bg-gray-50 rounded-lg overflow-hidden' style={{ position: 'relative', paddingTop: '56.25%' }}>
              <img
                src={report.roofImageUrl}
                alt="Roof overview with issue markers"
                className='absolute inset-0 w-full h-full object-contain'
              />
              {/* Render pins */}
              {report.roofImagePins && report.roofImagePins.map((pin, index) => {
                const getPinColor = (severity: string) => {
                  switch (severity) {
                    case 'critical':
                      return 'bg-red-600 border-red-700';
                    case 'high':
                      return 'bg-orange-500 border-orange-600';
                    case 'medium':
                      return 'bg-yellow-500 border-yellow-600';
                    case 'low':
                      return 'bg-green-600 border-green-700';
                    default:
                      return 'bg-blue-500 border-blue-600';
                  }
                };
                return (
                  <div
                    key={pin.id || index}
                    className={`absolute w-6 h-6 ${getPinColor(pin.severity)} border-2 rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10`}
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
              <div className='mt-4 text-sm text-gray-600'>
                <p>{t('reportView.pinLegend') || 'Markers indicate issue locations on the roof. Colors represent severity levels.'}</p>
              </div>
            )}
          </div>
        )}

        {/* Satellite Map - Only show if we DON'T have a roof image (to avoid redundancy) */}
        {!report.roofImageUrl && ((report.roofMapMarkers && report.roofMapMarkers.length > 0) || addressCoordinates) && (
          <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
            <h2 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
              <MapPin className='w-5 h-5 mr-2' />
              Property Location Map
            </h2>
            {addressCoordinates ? (
              <div className='relative w-full' style={{ height: '400px', zIndex: 0 }}>
                <Suspense fallback={<LoadingSpinner size="sm" />}>
                  <InteractiveRoofMap
                    lat={addressCoordinates.lat}
                    lon={addressCoordinates.lon}
                    availableIssues={(report.issuesFound || []).map(issue => ({
                      id: issue.id,
                      title: issue.type + ' - ' + (issue.title || 'Untitled'),
                    }))}
                    existingMarkers={report.roofMapMarkers || []}
                    onImageCapture={() => {}} // Read-only in view mode
                  />
                </Suspense>
              </div>
            ) : (
              <p className='text-gray-500 text-center py-4'>Map loading...</p>
            )}
          </div>
        )}

        {/* Issues Found */}
        <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
          <h2 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
            <AlertTriangle className='w-5 h-5 mr-2' />
            Issues Found ({report.issuesFound.length})
          </h2>

          {report.issuesFound.length === 0 ? (
            <p className='text-gray-500 text-center py-4'>No issues identified</p>
          ) : (
            <div className='space-y-4'>
              {report.issuesFound.map((issue, index) => (
                <div key={issue.id} className='border border-gray-200 rounded-lg p-4'>
                  <div className='flex items-center justify-between mb-3'>
                    <h4 className='font-medium text-gray-900 capitalize'>
                      {issue.type} Issue #{index + 1}
                    </h4>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getSeverityColor(issue.severity)}`}
                    >
                      {issue.severity}
                    </span>
                  </div>

                  <div className='space-y-2'>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>Location:</span>
                      <span className='ml-2 text-gray-900'>{issue.location}</span>
                    </div>

                    <div>
                      <span className='text-sm font-medium text-gray-500'>Description:</span>
                      <p className='text-gray-700 mt-1 leading-relaxed'>{issue.description}</p>
                    </div>

                    {issue.images && issue.images.length > 0 && (
                      <div>
                        <span className='text-sm font-medium text-gray-500'>
                          Images ({issue.images.length}):
                        </span>
                        <div className='mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2'>
                          {issue.images.map((imageUrl, imgIndex) => (
                            <div key={imgIndex} className='relative group'>
                              <img
                                src={imageUrl}
                                alt={`Issue ${index + 1} image ${imgIndex + 1}`}
                                className='w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-75 transition-opacity'
                                onClick={() => window.open(imageUrl, '_blank')}
                              />
                              <div className='absolute top-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 py-0.5 rounded'>
                                {imgIndex + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fallback for old single image format */}
                    {issue.imageUrl && (!issue.images || issue.images.length === 0) && (
                      <div>
                        <span className='text-sm font-medium text-gray-500'>Image:</span>
                        <div className='mt-2'>
                          <img
                            src={issue.imageUrl}
                            alt={`Issue ${index + 1} image`}
                            className='max-w-full h-48 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-75 transition-opacity'
                            onClick={() => window.open(issue.imageUrl, '_blank')}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommended Actions */}
        <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
          <h2 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
            <FileText className='w-5 h-5 mr-2' />
            Recommended Actions ({report.recommendedActions.length})
          </h2>

          {report.recommendedActions.length === 0 ? (
            <p className='text-gray-500 text-center py-4'>No actions recommended</p>
          ) : (
            <div className='space-y-4'>
              {report.recommendedActions.map((action, index) => (
                <div key={action.id} className='border border-gray-200 rounded-lg p-4'>
                  <div className='flex items-center justify-between mb-3'>
                    <h4 className='font-medium text-gray-900'>Action #{index + 1}</h4>
                    <div className='flex items-center space-x-2'>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          action.priority === 'high'
                            ? 'bg-red-100 text-red-800'
                            : action.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {action.priority} priority
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          action.urgency === 'immediate'
                            ? 'bg-red-100 text-red-800'
                            : action.urgency === 'short_term'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {action.urgency.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <p className='text-gray-700 leading-relaxed'>{action.description}</p>

                    {action.estimatedCost && (
                      <div>
                        <span className='text-sm font-medium text-gray-500'>Estimated Cost:</span>
                        <span className='ml-2 text-gray-900 font-medium'>
                          {action.estimatedCost.toLocaleString('sv-SE')} SEK
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status Actions */}
        {canEdit && (
          <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
            <h3 className='text-lg font-medium text-gray-900 mb-4'>{t('reportView.reportActions') || 'Report Actions'}</h3>

            <div className='flex flex-wrap gap-3'>
              {report.status === 'draft' && (
                <button
                  onClick={() => handleStatusChange('completed')}
                  className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                >
                  <CheckCircle className='w-4 h-4 mr-2' />
                  {t('reportView.markAsCompleted')}
                </button>
              )}

              {report.status === 'completed' && (
                <button
                  onClick={() => handleStatusChange('sent')}
                  className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                >
                  <Send className='w-4 h-4 mr-2' />
                  {t('reportView.markAsSent')}
                </button>
              )}

              {!report.isShared && (
                <button
                  onClick={() => handleStatusChange('shared')}
                  className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500'
                >
                  <Share2 className='w-4 h-4 mr-2' />
                  {t('reportView.makeShareable')}
                </button>
              )}

              {(report.status === 'sent' || report.status === 'completed') && (
                <button
                  onClick={() => handleStatusChange('archived')}
                  className='inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                >
                  <Archive className='w-4 h-4 mr-2' />
                  {t('reports.actions.archive')}
                </button>
              )}

              {report.status !== 'archived' && (
                hasOffer ? (
                  <Link
                    to={existingOffer ? `/offers?selected=${existingOffer.id}` : '/offers'}
                    className='inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors'
                  >
                    <Eye className='w-4 h-4 mr-2' />
                    {t('reportView.viewOffer') || 'View Offer'}
                  </Link>
                ) : (
                  <button
                    onClick={() => setShowCreateOfferModal(true)}
                    className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500'
                  >
                    <DollarSign className='w-4 h-4 mr-2' />
                    {t('reportView.createOffer') || 'Create Offer'}
                  </button>
                )
              )}
            </div>
          </div>
        )}


        {/* Create Offer Modal */}
        {report && showCreateOfferModal && (
          <CreateOfferModal
            report={report}
            onClose={() => setShowCreateOfferModal(false)}
            onCreate={handleCreateOffer}
          />
        )}

        {/* Toast Notification */}
        {toast && (
          <NotificationToast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </FormErrorBoundary>
  );
};

export default ReportView;
