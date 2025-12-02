import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useIntl } from '../../hooks/useIntl';
import { getOffers, sendReminderToCustomer, extendOfferValidity, sendOfferToCustomer, deleteOffer } from '../../services/offerService';
import { Offer } from '../../types';
import OffersList from './OffersList';
import OfferDetail from './OfferDetail';
import CreateOfferModal from './CreateOfferModal';
import { useReports } from '../../contexts/ReportContextSimple';
import OfferPreviewModal from './OfferPreviewModal';
import LoadingSpinner from '../common/LoadingSpinner';
import NotificationToast from '../common/NotificationToast';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import {
  Plus,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { checkEmailHealth } from '../../services/emailService';
import { openOfferPrintWindow } from '../../services/offerExport';

const OffersPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useIntl();
  const { reports: availableReports, fetchReports } = useReports();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReportSelector, setShowReportSelector] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning';
  } | null>(null);

  useDocumentTitle('Offers');
  const [emailEnabled, setEmailEnabled] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadOffers();
      fetchReports();
    }
  }, [currentUser, fetchReports]);

  useEffect(() => {
    async function runHealthCheck() {
      const result = await checkEmailHealth();
      setEmailEnabled(result === 'ok');
    }
    runHealthCheck();
  }, []);

  const loadOffers = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const fetchedOffers = await getOffers(currentUser);
      setOffers(fetchedOffers);
    } catch (error) {
      console.error('Error loading offers:', error);
      setNotification({
        message: 'Failed to load offers',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewOffer = (offerId: string) => {
    const offer = offers.find((o) => o.id === offerId);
    if (offer) {
      setSelectedOffer(offer);
    }
  };

  const handleSendReminder = async (offerId: string) => {
    try {
      await sendReminderToCustomer(offerId);
      setNotification({
        message: 'Reminder sent successfully',
        type: 'success',
      });
      loadOffers();
    } catch (error) {
      console.error('Error sending reminder:', error);
      setNotification({
        message: 'Failed to send reminder',
        type: 'error',
      });
    }
  };

  const handleExtendValidity = async (offerId: string) => {
    try {
      // For now, extend by 30 days
      const offer = offers.find((o) => o.id === offerId);
      if (!offer) return;

      const newDate = new Date(offer.validUntil);
      newDate.setDate(newDate.getDate() + 30);
      const newValidUntil = newDate.toISOString().split('T')[0];

      await extendOfferValidity(
        offerId,
        newValidUntil,
        currentUser?.uid || 'system',
        currentUser?.displayName || 'System'
      );

      setNotification({
        message: 'Offer validity extended by 30 days',
        type: 'success',
      });
      loadOffers();
      if (selectedOffer?.id === offerId) {
        setSelectedOffer(null);
      }
    } catch (error) {
      console.error('Error extending validity:', error);
      setNotification({
        message: 'Failed to extend validity',
        type: 'error',
      });
    }
  };

  const [previewOffer, setPreviewOffer] = useState<Offer | null>(null);
  const [isSendingOffer, setIsSendingOffer] = useState(false);

  const handleSendOffer = async (offerId: string) => {
    try {
      if (!emailEnabled) {
        setNotification({ message: 'Email is disabled. Use Copy Public Link instead.', type: 'warning' });
        return;
      }
      
      // Show preview modal before sending
      const offer = offers.find((o) => o.id === offerId);
      if (offer) {
        setPreviewOffer(offer);
      }
    } catch (error) {
      console.error('Error preparing offer preview:', error);
    }
  };

  const handleConfirmSendOffer = async () => {
    if (!previewOffer) return;
    
    setIsSendingOffer(true);
    try {
      await sendOfferToCustomer(previewOffer.id);
      setNotification({ message: 'Offert skickad', type: 'success' });
      setPreviewOffer(null);
      await loadOffers();
    } catch (error) {
      console.error('Error sending offer:', error);
      setNotification({ message: 'Kunde inte skicka offert', type: 'error' });
    } finally {
      setIsSendingOffer(false);
    }
  };

  const handleExportOffer = (offerId: string) => {
    openOfferPrintWindow(offerId);
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (!currentUser) return;
    
    const offer = offers.find((o) => o.id === offerId);
    if (!offer) return;
    
    if (!confirm(t('offers.deleteConfirm', { customerName: offer.customerName }) || `Are you sure you want to delete the offer for ${offer.customerName}?`)) {
      return;
    }
    
    try {
      await deleteOffer(offerId, currentUser);
      setNotification({
        message: t('offers.deletedSuccessfully') || 'Offer deleted successfully',
        type: 'success',
      });
      await loadOffers();
      // If the deleted offer was selected, clear selection
      if (selectedOffer?.id === offerId) {
        setSelectedOffer(null);
      }
    } catch (error: any) {
      console.error('Error deleting offer:', error);
      setNotification({
        message: error.message || t('offers.deleteError') || 'Failed to delete offer',
        type: 'error',
      });
    }
  };

  const handleCreateOffer = async (offerData: any) => {
    if (!selectedReport) return;

    try {
      // Create offer using offerService
      const { createOffer } = await import('../../services/offerService');
      const offerId = await createOffer(selectedReport.id, {
        ...offerData,
        reportId: selectedReport.id,
        branchId: currentUser?.branchId || '',
        createdBy: currentUser?.uid || '',
        createdByName: currentUser?.displayName || currentUser?.email || '',
        customerName: selectedReport.customerName,
        customerEmail: selectedReport.customerEmail || '',
        customerPhone: selectedReport.customerPhone,
        customerAddress: selectedReport.customerAddress,
        currency: 'SEK',
        totalAmount: (() => {
          // Calculate sum of estimated costs from recommended actions (solutions)
          const recommendedActionsCost = (selectedReport.recommendedActions || []).reduce(
            (sum, action) => sum + (action.estimatedCost || 0),
            0
          );
          const subtotal = offerData.laborCost + offerData.materialCost + offerData.travelCost + offerData.overheadCost + recommendedActionsCost;
          const profit = subtotal * (offerData.profitMargin / 100);
          return subtotal + profit;
        })(),
      });

      setNotification({
        message: 'Offer created successfully',
        type: 'success',
      });

      // Load offers to refresh the list
      await loadOffers();

      // Navigate to the new offer
      setSelectedReport(null);
      setShowCreateModal(false);
      navigate(`/offers/${offerId}`);
    } catch (error) {
      console.error('Error creating offer:', error);
      setNotification({
        message: 'Failed to create offer',
        type: 'error',
      });
    }
  };


  // Calculate statistics
  const stats = {
    total: offers.length,
    pending: offers.filter((o) => o.status === 'pending').length,
    awaiting_response: offers.filter((o) => o.status === 'awaiting_response').length,
    accepted: offers.filter((o) => o.status === 'accepted').length,
    rejected: offers.filter((o) => o.status === 'rejected').length,
    expired: offers.filter((o) => o.status === 'expired').length,
    overdue: offers.filter((o) => {
      if (o.status !== 'pending' && o.status !== 'awaiting_response') return false;
      if (!o.sentAt) return false;
      const sentDate = new Date(o.sentAt);
      const now = new Date();
      const diff = now.getTime() - sentDate.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      return days > 7;
    }).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (selectedOffer) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <OfferDetail
            offer={selectedOffer}
            onSendReminder={() => handleSendReminder(selectedOffer.id)}
            onExtendValidity={() => handleExtendValidity(selectedOffer.id)}
            onSendOffer={() => handleSendOffer(selectedOffer.id)}
            onExportOffer={() => handleExportOffer(selectedOffer.id)}
          />
        </div>
        {notification && (
          <NotificationToast
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-material">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* EMAIL WARNING (if email system is down) */}
        {!emailEnabled && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-600 p-4 rounded-lg flex items-center gap-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <div>
              <strong className="text-red-700 font-semibold">Email sending is currently unavailable.</strong>
              <div className="text-red-700 text-sm font-normal">You can still copy the public link for manual delivery below. Please alert an admin if this persists.</div>
            </div>
          </div>
        )}
        {/* Material Design Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-light tracking-tight text-gray-900">{t('offers.title')}</h1>
              <p className="text-gray-600 mt-2 text-base font-light">{t('offers.subtitle')}</p>
            </div>
            <button
              onClick={() => setShowReportSelector(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-material shadow-material-2 hover:shadow-material-3 transition-all duration-material font-medium uppercase tracking-wide"
            >
              <Plus className="w-5 h-5" />
{t('offers.createFromReport')}
            </button>
          </div>
        </div>

        {/* Material Design Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6 mb-8">
          <div className="bg-white rounded-material shadow-material-2 p-6 transition-all duration-material hover:shadow-material-3">
            <div className="flex items-start justify-between gap-3">
              <DollarSign className="w-10 h-10 text-blue-600 flex-shrink-0 mt-1" />
              <div className="flex-1 text-right">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">{t('offers.total')}</p>
                <p className="text-4xl font-light text-gray-900 mb-1">{stats.total}</p>
                <p className="text-xs text-gray-500 font-light">{t('offers.total')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-material shadow-material-2 p-6 transition-all duration-material hover:shadow-material-3">
            <div className="flex items-start justify-between gap-3">
              <Clock className="w-10 h-10 text-yellow-600 flex-shrink-0 mt-1" />
              <div className="flex-1 text-right">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">{t('offers.pending')}</p>
                <p className="text-4xl font-light text-yellow-600 mb-1">{stats.pending}</p>
                <p className="text-xs text-gray-500 font-light">{t('offers.pending')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-material shadow-material-2 p-6 transition-all duration-material hover:shadow-material-3">
            <div className="flex items-start justify-between gap-3">
              <AlertCircle className="w-10 h-10 text-orange-600 flex-shrink-0 mt-1" />
              <div className="flex-1 text-right">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Awaiting</p>
                <p className="text-4xl font-light text-orange-600 mb-1">{stats.awaiting_response}</p>
                <p className="text-xs text-gray-500 font-light">Customer response</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-material shadow-material-2 p-6 transition-all duration-material hover:shadow-material-3">
            <div className="flex items-start justify-between gap-3">
              <CheckCircle className="w-10 h-10 text-green-600 flex-shrink-0 mt-1" />
              <div className="flex-1 text-right">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">{t('offers.status.accepted')}</p>
                <p className="text-4xl font-light text-green-600 mb-1">{stats.accepted}</p>
                <p className="text-xs text-gray-500 font-light">{t('offers.stats.approved')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-material shadow-material-2 p-6 transition-all duration-material hover:shadow-material-3">
            <div className="flex items-start justify-between gap-3">
              <XCircle className="w-10 h-10 text-red-600 flex-shrink-0 mt-1" />
              <div className="flex-1 text-right">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">{t('offers.status.rejected')}</p>
                <p className="text-4xl font-light text-red-600 mb-1">{stats.rejected}</p>
                <p className="text-xs text-gray-500 font-light">{t('offers.stats.declined')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-material shadow-material-2 p-6 transition-all duration-material hover:shadow-material-3">
            <div className="flex items-start justify-between gap-3">
              <XCircle className="w-10 h-10 text-gray-600 flex-shrink-0 mt-1" />
              <div className="flex-1 text-right">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Expired</p>
                <p className="text-4xl font-light text-gray-600 mb-1">{stats.expired}</p>
                <p className="text-xs text-gray-500 font-light">Time expired</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-material shadow-material-2 p-6 transition-all duration-material hover:shadow-material-3 border-l-4 border-red-500">
            <div className="flex items-start justify-between gap-3">
              <AlertCircle className="w-10 h-10 text-red-600 flex-shrink-0 mt-1" />
              <div className="flex-1 text-right">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Overdue</p>
                <p className="text-4xl font-light text-red-600 mb-1">{stats.overdue}</p>
                <p className="text-xs text-gray-500 font-light">Needs attention</p>
              </div>
            </div>
          </div>
        </div>

        {/* Offers List */}
        <OffersList
          offers={offers}
          onView={handleViewOffer}
          onSendReminder={handleSendReminder}
          onExtendValidity={handleExtendValidity}
          emailEnabled={emailEnabled}
          onSendOffer={handleSendOffer}
          onExportOffer={handleExportOffer}
          onDelete={handleDeleteOffer}
        />
      </div>

      {/* Report Selector Modal */}
      {showReportSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">{t('offers.selectReport') || 'Select a Report'}</h2>
              <button
                onClick={() => setShowReportSelector(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {availableReports.length === 0 ? (
                <p className="text-gray-500 text-center py-8">{t('offers.noReportsAvailable') || 'No reports available'}</p>
              ) : (
                <div className="space-y-3">
                  {availableReports
                    .filter(report => report.status === 'completed' || report.status === 'sent')
                    .slice(0, 20)
                    .map((report) => (
                      <button
                        key={report.id}
                        onClick={() => {
                          setSelectedReport(report);
                          setShowReportSelector(false);
                          setShowCreateModal(true);
                        }}
                        className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{report.customerName}</p>
                            <p className="text-sm text-gray-600">{report.customerAddress}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {report.inspectionDate ? new Date(report.inspectionDate).toLocaleDateString('sv-SE') : 'N/A'}
                            </p>
                          </div>
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Offer Modal */}
      {showCreateModal && selectedReport && (
        <CreateOfferModal
          report={selectedReport}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedReport(null);
          }}
          onCreate={handleCreateOffer}
        />
      )}

      {/* Offer Preview Modal */}
      {previewOffer && (
        <OfferPreviewModal
          offer={previewOffer}
          isOpen={!!previewOffer}
          onClose={() => setPreviewOffer(null)}
          onConfirmSend={handleConfirmSendOffer}
          isLoading={isSendingOffer}
        />
      )}

      {/* Notification Toast */}
      {notification && (
        <NotificationToast
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default OffersPage;

