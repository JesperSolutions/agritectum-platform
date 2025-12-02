import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Report, OfflineReport } from '../types';
import { useAuth } from './AuthContext';
import * as reportService from '../services/reportService';
import * as offlineService from '../services/offlineService';

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
        reports: state.reports.map(r => (r.id === action.payload.id ? action.payload : r)),
        currentReport:
          state.currentReport?.id === action.payload.id ? action.payload : state.currentReport,
      };
    case 'DELETE_REPORT':
      return {
        ...state,
        reports: state.reports.filter(r => r.id !== action.payload),
        currentReport: state.currentReport?.id === action.payload ? null : state.currentReport,
      };
    case 'SET_OFFLINE_REPORTS':
      return { ...state, offlineReports: action.payload };
    case 'ADD_OFFLINE_REPORT':
      return { ...state, offlineReports: [action.payload, ...state.offlineReports] };
    case 'UPDATE_OFFLINE_REPORT':
      return {
        ...state,
        offlineReports: state.offlineReports.map(r =>
          r.localId === action.payload.localId ? action.payload : r
        ),
      };
    case 'REMOVE_OFFLINE_REPORT':
      return {
        ...state,
        offlineReports: state.offlineReports.filter(r => r.localId !== action.payload),
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
  fetchReports: () => Promise<void>;
  createReport: (report: Omit<Report, 'id' | 'createdAt' | 'lastEdited'>) => Promise<string>;
  updateReport: (reportId: string, updates: Partial<Report>) => Promise<void>;
  deleteReport: (reportId: string) => Promise<void>;
  getReport: (reportId: string) => Promise<Report | null>;
  syncOfflineReports: () => Promise<void>;
  exportToPDF: (reportId: string) => Promise<string>;
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

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      dispatch({ type: 'SET_OFFLINE', payload: false });
      syncOfflineReports();
    };
    const handleOffline = () => dispatch({ type: 'SET_OFFLINE', payload: true });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load offline reports on mount
  useEffect(() => {
    const loadOfflineReports = async () => {
      if (currentUser) {
        const offlineReports = await offlineService.getOfflineReports(currentUser.uid);
        dispatch({ type: 'SET_OFFLINE_REPORTS', payload: offlineReports });
      }
    };
    loadOfflineReports();
  }, [currentUser]);

  const fetchReports = useCallback(async (): Promise<void> => {
    if (!currentUser) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const reports = await reportService.getReports(currentUser);
      dispatch({ type: 'SET_REPORTS', payload: reports });
    } catch (error: any) {
      const { logger } = await import('../utils/logger');
      logger.error('Error fetching reports:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch reports' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [currentUser]);

  // Fetch reports when user is available
  useEffect(() => {
    if (currentUser) {
      fetchReports();
    }
  }, [currentUser, fetchReports]);

  const createReport = async (
    reportData: Omit<Report, 'id' | 'createdAt' | 'lastEdited'>
  ): Promise<string> => {
    if (!currentUser) throw new Error('User not authenticated');

    const newReport: Omit<Report, 'id'> = {
      ...reportData,
      createdBy: currentUser.uid,
      createdByName: currentUser.displayName || currentUser.email,
      branchId: currentUser.branchId!,
      createdAt: new Date().toISOString(),
      lastEdited: new Date().toISOString(),
    };

    if (state.isOffline) {
      const offlineReport: OfflineReport = {
        ...newReport,
        localId: `offline_${Date.now()}`,
        syncStatus: 'pending',
      };

      await offlineService.saveOfflineReport(offlineReport);
      dispatch({ type: 'ADD_OFFLINE_REPORT', payload: offlineReport });
      return offlineReport.localId;
    }

    try {
      const reportId = await reportService.createReport(newReport);
      const createdReport: Report = { ...newReport, id: reportId };
      dispatch({ type: 'ADD_REPORT', payload: createdReport });
      return reportId;
    } catch (error: any) {
      const { logger } = await import('../utils/logger');
      logger.error('Error creating report:', error);
      throw error;
    }
  };

  const updateReport = async (reportId: string, updates: Partial<Report>): Promise<void> => {
    if (!currentUser) throw new Error('User not authenticated');

    const updatedReport = {
      ...updates,
      lastEdited: new Date().toISOString(),
    };

    if (state.isOffline) {
      // Handle offline update
      const offlineReport = state.offlineReports.find(r => r.localId === reportId);
      if (offlineReport) {
        const updated: OfflineReport = {
          ...offlineReport,
          ...updatedReport,
          syncStatus: 'pending',
        };
        await offlineService.updateOfflineReport(updated);
        dispatch({ type: 'UPDATE_OFFLINE_REPORT', payload: updated });
        return;
      }
    }

    try {
      await reportService.updateReport(reportId, updatedReport);
      const currentReport = state.reports.find(r => r.id === reportId);
      if (currentReport) {
        const updated = { ...currentReport, ...updatedReport };
        dispatch({ type: 'UPDATE_REPORT', payload: updated });
      }
    } catch (error: any) {
      const { logger } = await import('../utils/logger');
      logger.error('Error updating report:', error);
      throw error;
    }
  };

  const deleteReport = async (reportId: string): Promise<void> => {
    if (!currentUser) throw new Error('User not authenticated');

    try {
      await reportService.deleteReport(reportId);
      dispatch({ type: 'DELETE_REPORT', payload: reportId });
    } catch (error: any) {
      const { logger } = await import('../utils/logger');
      logger.error('Error deleting report:', error);
      throw error;
    }
  };

  const getReport = async (reportId: string): Promise<Report | null> => {
    if (!currentUser) return null;

    try {
      const report = await reportService.getReport(reportId);
      if (report) {
        dispatch({ type: 'SET_CURRENT_REPORT', payload: report });
      }
      return report;
    } catch (error: any) {
      const { logger } = await import('../utils/logger');
      logger.error('Error fetching report:', error);
      return null;
    }
  };

  const syncOfflineReports = async (): Promise<void> => {
    if (state.isOffline || state.syncInProgress || !currentUser) return;

    dispatch({ type: 'SET_SYNC_IN_PROGRESS', payload: true });

    try {
      const offlineReports = await offlineService.getOfflineReports(currentUser.uid);

      for (const offlineReport of offlineReports) {
        if (offlineReport.syncStatus === 'pending') {
          try {
            // Update sync status to 'syncing'
            const syncingReport = { ...offlineReport, syncStatus: 'syncing' as const };
            await offlineService.updateOfflineReport(syncingReport);

            // Sync to Firestore
            const { localId, syncStatus, lastSyncAttempt, ...reportData } = offlineReport;
            const reportId = await reportService.createReport(reportData);

            // Remove from offline storage
            await offlineService.removeOfflineReport(localId);
            dispatch({ type: 'REMOVE_OFFLINE_REPORT', payload: localId });

            // Add to online reports
            const syncedReport: Report = { ...reportData, id: reportId };
            dispatch({ type: 'ADD_REPORT', payload: syncedReport });
          } catch (error: any) {
            const { logger } = await import('../utils/logger');
            logger.error('Error syncing report:', error);
            const errorReport = {
              ...offlineReport,
              syncStatus: 'error' as const,
              lastSyncAttempt: new Date().toISOString(),
            };
            await offlineService.updateOfflineReport(errorReport);
            dispatch({ type: 'UPDATE_OFFLINE_REPORT', payload: errorReport });
          }
        }
      }
    } catch (error: any) {
      const { logger } = await import('../utils/logger');
      logger.error('Error during sync:', error);
    } finally {
      dispatch({ type: 'SET_SYNC_IN_PROGRESS', payload: false });
    }
  };

  const exportToPDF = async (reportId: string): Promise<string> => {
    if (!currentUser) throw new Error('User not authenticated');

    try {
      const pdfUrl = await reportService.generatePDF(reportId);
      return pdfUrl;
    } catch (error: any) {
      const { logger } = await import('../utils/logger');
      logger.error('Error generating PDF:', error);
      throw error;
    }
  };

  const value: ReportContextType = {
    state,
    fetchReports,
    createReport,
    updateReport,
    deleteReport,
    getReport,
    syncOfflineReports,
    exportToPDF,
  };

  return <ReportContext.Provider value={value}>{children}</ReportContext.Provider>;
};
