/**
 * Report Library Component
 *
 * Displays all saved report drafts (max 5 per user) with:
 * - Draft status and stage information
 * - Quick resume/continue action
 * - Delete with confirmation warning
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReports } from '../../contexts/ReportContextSimple';
import { useIntl } from '../../hooks/useIntl';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { Report } from '../../types';
import {
  FileText,
  Trash2,
  Clock,
  Edit,
  MapPin,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import ConfirmationDialog from '../common/ConfirmationDialog';

const ReportLibrary: React.FC = () => {
  const { reports, loading, deleteReport } = useReports();
  const { t } = useIntl();
  const { showSuccess, showError } = useToast();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [reportToDelete, setReportToDelete] = React.useState<Report | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Calculate stage progression
  const getStageInfo = (
    report: Report
  ): { stage: number; label: string; progress: number; icon: React.ReactNode } => {
    const stage = report.reportStage === 'stage3' ? 3 : report.reportStage === 'stage2' ? 2 : 1;

    switch (stage) {
      case 1:
        return {
          stage: 1,
          label: t('reports.library.stage1OnSite') || 'On-Site Data Collection',
          progress: 33,
          icon: <MapPin className='w-4 h-4' />,
        };
      case 2:
        return {
          stage: 2,
          label: t('reports.library.stage2Annotation') || 'Annotation & Mapping',
          progress: 66,
          icon: <Edit className='w-4 h-4' />,
        };
      case 3:
        return {
          stage: 3,
          label: t('reports.library.stage3Complete') || 'Completed',
          progress: 100,
          icon: <CheckCircle2 className='w-4 h-4' />,
        };
      default:
        return {
          stage: 1,
          label: t('reports.library.stage1OnSite') || 'On-Site Data Collection',
          progress: 33,
          icon: <MapPin className='w-4 h-4' />,
        };
    }
  };

  // Filter draft reports
  const activeReports = useMemo(() => {
    return (
      reports
        .filter(report => report.status === 'draft')
        // Only show reports created by current user
        .filter(report => report.createdBy === currentUser?.uid)
        // Sort by last edited (most recent first)
        .sort(
          (a, b) =>
            new Date(b.lastEdited).getTime() - new Date(a.lastEdited).getTime()
        )
        // Limit to 5 reports per user
        .slice(0, 5)
    );
  }, [reports, currentUser?.uid]);

  // Format date with time
  const formatDateTime = (dateString: string | undefined): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
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

  // Handle resume/continue report
  const handleResume = (report: Report) => {
    navigate(`/report/edit/${report.id}`);
  };

  // Handle soft delete
  const handleSoftDelete = (report: Report) => {
    setReportToDelete(report);
    setShowDeleteConfirm(true);
  };

  // Confirm soft delete
  const confirmDelete = async () => {
    if (!reportToDelete) return;

    setIsDeleting(true);
    try {
      // Delete the report permanently
      await deleteReport(reportToDelete.id);

      setShowDeleteConfirm(false);
      setReportToDelete(null);
      showSuccess(t('reports.library.deleted') || 'Report deleted successfully.');
    } catch (error: any) {
      console.error('Error deleting report:', error);
      showError(error.message || t('reports.deleteError') || 'Failed to delete report');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center h-96'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  return (
    <div className='max-w-6xl mx-auto px-4 py-8'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-slate-900 mb-2'>
          {t('reports.library.title') || 'Report Library'}
        </h1>
        <p className='text-slate-600'>
          {t('reports.library.subtitle') ||
            'Manage your roof inspection reports across multiple stages. Save on-site data, annotate findings, and complete your reports.'}
        </p>
      </div>

      {/* Create New Report CTA */}
      <div className='mb-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-white shadow-lg'>
        <div className='flex items-center justify-between gap-6'>
          <div>
            <h2 className='text-2xl font-bold mb-2'>
              {t('reports.library.createNewReportTitle') || 'Create New Report'}
            </h2>
            <p className='text-blue-100'>
              {t('reports.library.createNewReportDesc') ||
                'Start a new roof inspection report. Your progress will be automatically saved as a draft.'}
            </p>
          </div>
          <button
            onClick={() => navigate('/report/new')}
            className='px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold whitespace-nowrap shadow-md hover:shadow-lg'
          >
            {t('reports.library.startNewReport') || 'Start New Report'}
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className='mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3'>
        <AlertCircle className='w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5' />
        <div>
          <h3 className='font-semibold text-blue-900 mb-1'>
            {t('reports.library.workflowInfo') || 'Multi-Stage Report Workflow'}
          </h3>
          <p className='text-sm text-blue-800'>
            {t('reports.library.workflowDesc') ||
              'Stage 1: Collect on-site data and photos → Stage 2: Annotate and map issues → Stage 3: Review and complete. You can save up to 5 drafts, and they expire after 30 days.'}
          </p>
        </div>
      </div>

      {/* Active Reports Section */}
      <div className='mb-12'>
        <h2 className='text-xl font-semibold text-slate-900 mb-4'>
          {t('reports.library.activeDrafts') || 'Active Drafts'} ({activeReports.length}/5)
        </h2>

        {activeReports.length === 0 ? (
          <div className='bg-slate-50 rounded-lg border border-slate-200 p-12 text-center'>
            <FileText className='w-12 h-12 text-slate-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-slate-900 mb-2'>
              {t('reports.library.noDrafts') || 'No active drafts'}
            </h3>
            <p className='text-slate-600 mb-6'>
              {t('reports.library.noDraftsDesc') || 'Start creating a new report to see it here.'}
            </p>
            <button
              onClick={() => navigate('/report/new')}
              className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium'
            >
              {t('reports.library.newReport') || 'Create New Report'}
            </button>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {activeReports.map(report => {
              const stageInfo = getStageInfo(report);
              return (
                <div
                  key={report.id}
                  className='bg-white rounded-lg border border-slate-200 hover:shadow-lg transition-all overflow-hidden'
                >
                  {/* Card Header with Stage */}
                  <div className='bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3 border-b border-slate-200'>
                    <div className='flex items-center justify-between mb-2'>
                      <div className='flex items-center gap-2'>
                        {stageInfo.icon}
                        <span className='text-xs font-semibold text-slate-600 uppercase tracking-wider'>
                          {stageInfo.label}
                        </span>
                      </div>
                      <span className='text-xs font-medium text-slate-500'>
                        {stageInfo.stage === 3 ? (
                          <span className='text-green-600'>Complete</span>
                        ) : (
                          `${stageInfo.progress}%`
                        )}
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className='w-full bg-slate-300 rounded-full h-1.5'>
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          stageInfo.progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${stageInfo.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className='p-4'>
                    {/* Customer & Address */}
                    <div className='mb-3'>
                      <p className='text-sm text-slate-500'>Customer</p>
                      <p className='font-medium text-slate-900'>{report.customerName}</p>
                      <p className='text-sm text-slate-600'>{report.customerAddress || report.buildingAddress}</p>
                    </div>

                    {/* Roof Info */}
                    <div className='grid grid-cols-2 gap-3 mb-4 text-sm'>
                      {report.roofType && (
                        <div>
                          <p className='text-slate-500'>Roof Type</p>
                          <p className='font-medium text-slate-900 capitalize'>
                            {report.roofType.replace(/_/g, ' ')}
                          </p>
                        </div>
                      )}
                      {report.roofSize && (
                        <div>
                          <p className='text-slate-500'>Size</p>
                          <p className='font-medium text-slate-900'>{report.roofSize} m²</p>
                        </div>
                      )}
                    </div>

                    {/* Issues Count */}
                    {report.issuesFound && report.issuesFound.length > 0 && (
                      <div className='mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200'>
                        <p className='text-sm font-medium text-orange-900'>
                          {report.issuesFound.length}{' '}
                          {report.issuesFound.length === 1 ? 'issue' : 'issues'} found
                        </p>
                      </div>
                    )}

                    {/* Last Edited */}
                    <div className='text-xs text-slate-500 mb-4 flex items-center gap-1'>
                      <Clock className='w-3 h-3' />
                      Last edited: {formatDateTime(report.lastEdited)}
                    </div>

                    {/* Actions */}
                    <div className='flex gap-2'>
                      <button
                        onClick={() => handleResume(report)}
                        className='flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm'
                      >
                        <Edit className='w-4 h-4 inline mr-1' />
                        {t('reports.library.continue') || 'Continue'}
                      </button>
                      <button
                        onClick={() => handleSoftDelete(report)}
                        className='px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors font-medium text-sm'
                        title={t('reports.library.deleteTooltip') || 'Delete report permanently'}
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title={t('reports.library.deleteTitle') || 'Delete Report Draft?'}
        message={
          t('reports.library.deleteMessage') ||
          'This report will be permanently deleted and cannot be recovered. Are you sure?'
        }
        confirmText={t('reports.library.deleteConfirm') || 'Delete'}
        cancelText={t('common.cancel') || 'Cancel'}
        type="danger"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onClose={() => {
          setShowDeleteConfirm(false);
          setReportToDelete(null);
        }}
      />
    </div>
  );
};

export default ReportLibrary;
