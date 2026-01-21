import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Report, OfflineReport } from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import * as reportService from '../services/reportService';
import { offlineService } from '../services/offlineService';

interface ReportState {
  reports: Report[];
  offlineReports: OfflineReport[];
  currentReport: Report | null;
  loading: boolean;
  error: string | null;
  isOffline: boolean;
  syncInProgress: boolean;
}

type ReportAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_REPORTS'; payload: Report[] }
  | { type: 'SET_CURRENT_REPORT'; payload: Report | null }
  | { type: 'ADD_REPORT'; payload: Report }
  | { type: 'UPDATE_REPORT'; payload: Report }
  | { type: 'DELETE_REPORT'; payload: string }
  | { type: 'SET_OFFLINE_REPORTS'; payload: OfflineReport[] }
  | { type: 'ADD_OFFLINE_REPORT'; payload: OfflineReport }
  | { type: 'UPDATE_OFFLINE_REPORT'; payload: OfflineReport }
  | { type: 'REMOVE_OFFLINE_REPORT'; payload: string }
  | { type: 'SET_OFFLINE'; payload: boolean }
  | { type: 'SET_SYNC_IN_PROGRESS'; payload: boolean };

const initialState: ReportState = {
  reports: [],
  offlineReports: [],
  currentReport: null,
  loading: false,
  error: null,
  isOffline: !navigator.onLine,
  syncInProgress: false,
};

const reportReducer = (state: ReportState, action: ReportAction): ReportState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_REPORTS':
      return { ...state, reports: action.payload };
    case 'SET_CURRENT_REPORT':
      return { ...state, currentReport: action.payload };
    case 'ADD_REPORT':
      return { ...state, reports: [action.payload, ...state.reports] };
    case 'UPDATE_REPORT':
      return {
        ...state,
        reports: state.reports.map(report =>
          report.id === action.payload.id ? { ...report, ...action.payload } : report
        ),
        currentReport:
          state.currentReport?.id === action.payload.id
            ? { ...state.currentReport, ...action.payload }
            : state.currentReport,
      };
    case 'DELETE_REPORT':
      return {
        ...state,
        reports: state.reports.filter(report => report.id !== action.payload),
        currentReport: state.currentReport?.id === action.payload ? null : state.currentReport,
      };
    case 'SET_OFFLINE_REPORTS':
      return { ...state, offlineReports: action.payload };
    case 'ADD_OFFLINE_REPORT':
      return { ...state, offlineReports: [action.payload, ...state.offlineReports] };
    case 'UPDATE_OFFLINE_REPORT':
      return {
        ...state,
        offlineReports: state.offlineReports.map(report =>
          report.id === action.payload.id ? action.payload : report
        ),
      };
    case 'REMOVE_OFFLINE_REPORT':
      return {
        ...state,
        offlineReports: state.offlineReports.filter(report => report.id !== action.payload),
      };
    case 'SET_OFFLINE':
      return { ...state, isOffline: action.payload };
    case 'SET_SYNC_IN_PROGRESS':
      return { ...state, syncInProgress: action.payload };
    default:
      return state;
  }
};

interface ReportContextType {
  state: ReportState;
  reports: Report[];
  offlineReports: OfflineReport[];
  currentReport: Report | null;
  loading: boolean;
  error: string | null;
  isOffline: boolean;
  syncInProgress: boolean;
  fetchReports: () => Promise<void>;
  getReport: (id: string) => Promise<Report | null>;
  createReport: (reportData: Omit<Report, 'id' | 'createdAt' | 'lastEdited'>) => Promise<string>;
  updateReport: (id: string, reportData: Partial<Report>) => Promise<void>;
  deleteReport: (id: string, branchId?: string) => Promise<void>;
  exportReport: (id: string) => Promise<void>;
  exportToPDF: (id: string) => Promise<Blob>;
  syncOfflineReports: () => Promise<void>;
  addOfflineReport: (report: OfflineReport) => Promise<void>;
  updateOfflineReport: (id: string, report: Partial<OfflineReport>) => Promise<void>;
  removeOfflineReport: (id: string) => Promise<void>;
  clearOfflineReports: () => Promise<void>;
}

const ReportContext = createContext<ReportContextType | null>(null);

export const useReports = () => {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReports must be used within a ReportProvider');
  }
  return context;
};

interface ReportProviderProps {
  children: React.ReactNode;
}

export const ReportProvider: React.FC<ReportProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(reportReducer, initialState);
  const { currentUser } = useAuth();
  const { showError: showToastError, showSuccess: showToastSuccess } = useToast();

  // Online/offline status monitoring
  useEffect(() => {
    const handleOnline = () => {
      dispatch({ type: 'SET_OFFLINE', payload: false });
      if (currentUser) {
        syncOfflineReports();
      }
    };

    const handleOffline = () => {
      dispatch({ type: 'SET_OFFLINE', payload: true });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentUser]);

  // Load offline reports on mount
  useEffect(() => {
    const loadOfflineReports = async () => {
      if (currentUser) {
        const offlineReports = await offlineService.getOfflineReports();
        dispatch({ type: 'SET_OFFLINE_REPORTS', payload: offlineReports });
      }
    };
    loadOfflineReports();
  }, [currentUser]);

  const fetchReports = useCallback(async (): Promise<void> => {
    const { logger } = await import('../utils/logger');
    logger.debug('ReportContext - fetchReports called');

    if (!currentUser) {
      logger.debug('ReportContext - No current user, returning');
      return;
    }

    logger.debug('ReportContext - User details:', {
      uid: currentUser.uid,
      email: currentUser.email,
      role: currentUser.role,
      permissionLevel: currentUser.permissionLevel,
      branchId: currentUser.branchId,
      branchIds: currentUser.branchIds,
    });

    logger.debug('ReportContext - Starting to fetch reports...');
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      logger.debug('ReportContext - Calling reportService.getReports...');
      const reports = await reportService.getReports(currentUser);
      logger.debug('ReportContext - Reports fetched successfully:', reports.length);
      dispatch({ type: 'SET_REPORTS', payload: reports });
    } catch (error: any) {
      const { logger: loggerSync } = await import('../utils/logger');
      loggerSync.error('ReportContext - Error fetching reports:', error);
      loggerSync.debug('ReportContext - Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      });
      const errorMessage = 'Failed to fetch reports. Please try again.';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      showToastError(errorMessage);
    } finally {
      const { logger: loggerSync } = await import('../utils/logger');
      loggerSync.debug('ReportContext - Setting loading to false');
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [currentUser]);

  // Fetch reports when user is available
  useEffect(() => {
    if (currentUser) {
      fetchReports();
    }
  }, [currentUser, fetchReports]);

  const getReport = async (id: string): Promise<Report | null> => {
    try {
      // For super-admin, don't pass branchId to allow searching across all branches
      const branchId = currentUser?.permissionLevel === 2 ? undefined : currentUser?.branchId;
      const report = await reportService.getReport(id, branchId);
      if (report) {
        dispatch({ type: 'SET_CURRENT_REPORT', payload: report });
      }
      return report;
    } catch (error: any) {
      const { logger } = await import('../utils/logger');
      logger.error('Error fetching report:', error);
      const errorMessage = 'Failed to load report. Please try again.';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      showToastError(errorMessage);
      return null;
    }
  };

  const createReport = async (
    reportData: Omit<Report, 'id' | 'createdAt' | 'lastEdited'>
  ): Promise<string> => {
    if (!currentUser) throw new Error('User not authenticated');

    // Determine the branch ID to use
    let branchId = currentUser.branchId;
    if (!branchId && currentUser.role === 'superadmin') {
      // For super admins, use the branchId from the report data if provided
      branchId = reportData.branchId;
    }
    if (!branchId) {
      throw new Error(
        'Branch ID is required to create a report. Superadmins must specify a branchId in the report data.'
      );
    }

    const newReport: Omit<Report, 'id'> = {
      ...reportData,
      createdBy: currentUser.uid,
      createdByName: currentUser.displayName || currentUser.email,
      branchId: branchId,
      createdAt: new Date().toISOString(),
      lastEdited: new Date().toISOString(),
    };

    try {
      const { logger } = await import('../utils/logger');
      logger.debug('Creating report with branchId:', branchId);

      const reportId = await reportService.createReport(newReport, branchId);
      const report = { id: reportId, ...newReport };

      logger.debug('Report created successfully:', reportId);
      dispatch({ type: 'ADD_REPORT', payload: report });

      // Refresh the reports list to show the new report
      await fetchReports();

      return reportId;
    } catch (error: any) {
      const { logger } = await import('../utils/logger');
      logger.error('Error creating report:', error);
      logger.debug('Error details:', {
        message: error?.message,
        stack: error?.stack,
        branchId: branchId,
      });
      const errorMessage = error?.message?.includes('Branch ID')
        ? error.message
        : 'Failed to create report. Please try again.';
      showToastError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateReport = async (id: string, reportData: Partial<Report>): Promise<void> => {
    try {
      // For super-admin, don't pass branchId to allow searching across all branches
      const branchId = currentUser?.permissionLevel === 2 ? undefined : currentUser?.branchId;
      await reportService.updateReport(id, reportData, branchId);
      const updatedReport = { ...reportData, id } as Report;
      dispatch({ type: 'UPDATE_REPORT', payload: updatedReport });
    } catch (error: any) {
      const { logger } = await import('../utils/logger');
      logger.error('Error updating report:', error);
      const errorMessage = 'Failed to update report. Please try again.';
      showToastError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteReport = async (id: string, branchId?: string): Promise<void> => {
    try {
      // For super-admin, don't pass branchId to allow searching across all branches
      const targetBranchId = currentUser?.permissionLevel === 2 ? branchId : currentUser?.branchId;
      await reportService.deleteReport(id, targetBranchId);
      dispatch({ type: 'DELETE_REPORT', payload: id });
    } catch (error: any) {
      const { logger } = await import('../utils/logger');
      logger.error('Error deleting report:', error);
      const errorMessage = 'Failed to delete report. Please try again.';
      showToastError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const exportReport = async (id: string): Promise<void> => {
    try {
      // Simple export - just log for now
      const { logger } = await import('../utils/logger');
      logger.debug('Exporting report:', id);
    } catch (error: any) {
      const { logger } = await import('../utils/logger');
      logger.error('Error exporting report:', error);
      throw new Error('Failed to export report');
    }
  };

  const exportToPDF = async (id: string): Promise<Blob> => {
    try {
      // Import the enhanced PDF service directly
      const { generateReportPDF } = await import('../services/simplePdfService');

      // Get the report data
      const report = await getReport(id);
      if (!report) {
        throw new Error('Report not found');
      }

      // Get branch information
      let branchInfo = null;
      if (report.branchId) {
        try {
          const { getBranchById } = await import('../services/branchService');
          const branch = await getBranchById(report.branchId);
          if (branch) {
            branchInfo = {
              id: branch.id,
              name: branch.name,
              address: branch.address || '',
              phone: branch.phone || '',
              email: branch.email || '',
              cvr: branch.cvr || '',
            };
          }
        } catch (error) {
          const { logger } = await import('../utils/logger');
          logger.warn('Could not load branch information for PDF:', error);
        }
      }

      // Generate PDF using simplified service
      const result = await generateReportPDF(report.id, {
        format: 'A4',
        margin: {
          top: '20px',
          bottom: '20px',
          left: '20px',
          right: '20px',
        },
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate PDF');
      }

      return result.blob!;
    } catch (error: any) {
      const { logger } = await import('../utils/logger');
      logger.error('Error generating PDF:', error);
      const errorMessage = 'Failed to generate PDF. Please try again.';
      showToastError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const syncOfflineReports = async (): Promise<void> => {
    if (!currentUser || state.offlineReports.length === 0) return;

    dispatch({ type: 'SET_SYNC_IN_PROGRESS', payload: true });

    try {
      for (const offlineReport of state.offlineReports) {
        try {
          if (offlineReport.action === 'create') {
            await createReport(offlineReport.data);
          } else if (offlineReport.action === 'update') {
            await updateReport(offlineReport.id, offlineReport.data);
          } else if (offlineReport.action === 'delete') {
            await deleteReport(offlineReport.id);
          }
        } catch (error: any) {
          const { logger } = await import('../utils/logger');
          logger.error(`Error syncing offline report ${offlineReport.id}:`, error);
        }
      }

      await clearOfflineReports();
      await fetchReports();
      showToastSuccess('Offline reports synced successfully');
    } catch (error: any) {
      const { logger } = await import('../utils/logger');
      logger.error('Error syncing offline reports:', error);
      showToastError('Failed to sync offline reports. Some changes may not have been saved.');
    } finally {
      dispatch({ type: 'SET_SYNC_IN_PROGRESS', payload: false });
    }
  };

  const addOfflineReport = async (report: OfflineReport): Promise<void> => {
    await offlineService.saveReport(report);
    dispatch({ type: 'ADD_OFFLINE_REPORT', payload: report });
  };

  const updateOfflineReport = async (id: string, report: Partial<OfflineReport>): Promise<void> => {
    await offlineService.updateSyncStatus(id, 'pending');
    dispatch({ type: 'UPDATE_OFFLINE_REPORT', payload: { id, ...report } as OfflineReport });
  };

  const removeOfflineReport = async (id: string): Promise<void> => {
    await offlineService.deleteReport(id);
    dispatch({ type: 'REMOVE_OFFLINE_REPORT', payload: id });
  };

  const clearOfflineReports = async (): Promise<void> => {
    await offlineService.clearAllData();
    dispatch({ type: 'SET_OFFLINE_REPORTS', payload: [] });
  };

  const value: ReportContextType = {
    state,
    reports: state.reports,
    offlineReports: state.offlineReports,
    currentReport: state.currentReport,
    loading: state.loading,
    error: state.error,
    isOffline: state.isOffline,
    syncInProgress: state.syncInProgress,
    fetchReports,
    getReport,
    createReport,
    updateReport,
    deleteReport,
    exportReport,
    exportToPDF,
    syncOfflineReports,
    addOfflineReport,
    updateOfflineReport,
    removeOfflineReport,
    clearOfflineReports,
  };

  return <ReportContext.Provider value={value}>{children}</ReportContext.Provider>;
};
