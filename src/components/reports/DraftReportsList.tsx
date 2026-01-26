import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReports } from '../../contexts/ReportContextSimple';
import { useIntl } from '../../hooks/useIntl';
import { useToast } from '../../contexts/ToastContext';
import { Report } from '../../types';
import { FileText, Trash2, Clock, Edit, MapPin, User } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import ConfirmationDialog from '../common/ConfirmationDialog';

const DraftReportsList: React.FC = () => {
  const { reports, loading, deleteReport } = useReports();
  const { t } = useIntl();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [reportToDelete, setReportToDelete] = React.useState<Report | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Filter draft reports
  const draftReports = useMemo(() => {
    return reports.filter(report => report.status === 'draft');
  }, [reports]);

  // Calculate completion percentage for a draft report
  const calculateProgress = (report: Report): number => {
    let filledFields = 0;
    let totalFields = 0;

    // Basic information
    totalFields += 4;
    if (report.customerName) filledFields++;
    if (report.customerAddress) filledFields++;
    if (report.customerPhone || report.customerEmail) filledFields++;
    if (report.inspectionDate) filledFields++;

    // Roof information
    totalFields += 2;
    if (report.roofType) filledFields++;
    if (report.roofAge !== undefined) filledFields++;

    // Issues and actions
    totalFields += 2;
    if (report.issuesFound && report.issuesFound.length > 0) filledFields++;
    if (report.recommendedActions && report.recommendedActions.length > 0) filledFields++;

    // Images
    totalFields += 1;
    if (report.images && report.images.length > 0) filledFields++;

    return Math.round((filledFields / totalFields) * 100);
  };

  // Format date
  const formatDate = (dateString: string | Date | undefined): string => {
    if (!dateString) return '';
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      return date.toLocaleDateString('sv-SE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(dateString);
    }
  };

  // Handle resume draft
  const handleResumeDraft = (report: Report) => {
    navigate(`/report/edit/${report.id}`);
  };

  // Handle delete draft
  const handleDeleteDraft = (report: Report) => {
    setReportToDelete(report);
    setShowDeleteDialog(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!reportToDelete) return;

    setIsDeleting(true);
    try {
      await deleteReport(reportToDelete.id);
      setShowDeleteDialog(false);
      setReportToDelete(null);
      showSuccess(t('reports.draftDeleted') || 'Draft deleted successfully');
    } catch (error: any) {
      console.error('Error deleting draft:', error);
      showError(error.message || t('reports.deleteError') || 'Failed to delete draft');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className='max-w-7xl mx-auto p-6 space-y-6'>
      {/* Header */}
      <div className='bg-white rounded-lg shadow-sm p-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-light text-gray-900 mb-2'>
              {t('reports.draftReports') || 'Draft Reports'}
            </h1>
            <p className='text-gray-600'>
              {draftReports.length === 0
                ? t('reports.noDrafts') || 'No draft reports'
                : t('reports.draftCount', { count: draftReports.length }) ||
                  `${draftReports.length} draft report${draftReports.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      </div>

      {/* Draft Reports List */}
      {draftReports.length === 0 ? (
        <div className='bg-white rounded-lg shadow-sm p-12 text-center'>
          <FileText className='w-16 h-16 text-gray-400 mx-auto mb-4' />
          <h3 className='text-xl font-medium text-gray-900 mb-2'>
            {t('reports.noDrafts') || 'No Draft Reports'}
          </h3>
          <p className='text-gray-600 mb-6'>
            {t('reports.noDraftsDescription') ||
              "You don't have any draft reports. Start creating a new report to save drafts."}
          </p>
          <button
            onClick={() => navigate('/report/new')}
            className='px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm'
          >
            {t('reports.createNewReport') || 'Create New Report'}
          </button>
        </div>
      ) : (
        <div className='space-y-4'>
          {draftReports
            .sort((a, b) => {
              const dateA = a.lastEdited ? new Date(a.lastEdited).getTime() : 0;
              const dateB = b.lastEdited ? new Date(b.lastEdited).getTime() : 0;
              return dateB - dateA; // Newest first
            })
            .map(report => {
              const progress = calculateProgress(report);
              return (
                <div
                  key={report.id}
                  className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'
                >
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      {/* Customer Info */}
                      <div className='flex items-center gap-3 mb-3'>
                        <User className='w-5 h-5 text-gray-400' />
                        <h3 className='text-lg font-medium text-gray-900'>
                          {report.customerName ||
                            t('reports.unnamedCustomer') ||
                            'Unnamed Customer'}
                        </h3>
                      </div>

                      {/* Address */}
                      {report.customerAddress && (
                        <div className='flex items-start gap-2 mb-3 text-gray-600'>
                          <MapPin className='w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0' />
                          <span className='text-sm'>{report.customerAddress}</span>
                        </div>
                      )}

                      {/* Progress and Last Edited */}
                      <div className='flex items-center gap-6 mt-4'>
                        <div className='flex items-center gap-2'>
                          <Clock className='w-4 h-4 text-gray-400' />
                          <span className='text-sm text-gray-600'>
                            {t('reports.lastEdited') || 'Last edited'}:{' '}
                            {formatDate(report.lastEdited || report.createdAt)}
                          </span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <div className='flex-1 w-32 bg-gray-200 rounded-full h-2'>
                            <div
                              className='bg-blue-600 h-2 rounded-full'
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className='text-sm font-medium text-gray-700'>{progress}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className='flex items-center gap-2 ml-6'>
                      <button
                        onClick={() => handleResumeDraft(report)}
                        className='px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm flex items-center gap-2'
                      >
                        <Edit className='w-4 h-4' />
                        {t('reports.resume') || 'Resume'}
                      </button>
                      <button
                        onClick={() => handleDeleteDraft(report)}
                        className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium shadow-sm flex items-center gap-2'
                      >
                        <Trash2 className='w-4 h-4' />
                        {t('common.delete') || 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title={t('common.delete') || 'Delete Draft'}
        message={
          t('reports.deleteDraftConfirm', { name: reportToDelete?.customerName }) ||
          `Are you sure you want to delete this draft report for ${reportToDelete?.customerName}? This action cannot be undone.`
        }
        confirmText={t('common.delete') || 'Delete'}
        cancelText={t('common.cancel') || 'Cancel'}
        type='danger'
        icon='trash'
        isLoading={isDeleting}
      />
    </div>
  );
};

export default DraftReportsList;
