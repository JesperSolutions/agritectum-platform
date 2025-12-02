import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import {
  useOptimizedState,
  useSelectiveState,
  useAsyncState,
  useFormState,
} from '../hooks/useOptimizedState';

// Types for the optimized state context
interface OptimizedStateContextType {
  // Global app state
  appState: {
    state: any;
    setState: (value: any) => void;
    getCurrentValue: () => any;
    subscribe: (listener: () => void) => () => void;
  };

  // User preferences
  userPreferences: {
    state: any;
    updateField: (field: string, value: any) => void;
    updateFields: (updates: Record<string, any>) => void;
    subscribeToField: (field: string, listener: () => void) => () => void;
    getFieldValue: (field: string) => any;
    getCurrentValue: () => any;
  };

  // UI state
  uiState: {
    state: any;
    updateField: (field: string, value: any) => void;
    updateFields: (updates: Record<string, any>) => void;
    subscribeToField: (field: string, listener: () => void) => () => void;
    getFieldValue: (field: string) => any;
    getCurrentValue: () => any;
  };

  // Data state
  dataState: {
    data: any;
    loading: boolean;
    error: Error | null;
    setData: (data: any) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: Error | null) => void;
    executeAsync: (asyncFn: () => Promise<any>) => Promise<any>;
    subscribe: (listener: () => void) => () => void;
    getCurrentValue: () => any;
  };
}

const OptimizedStateContext = createContext<OptimizedStateContextType | undefined>(undefined);

interface OptimizedStateProviderProps {
  children: ReactNode;
}

/**
 * Provider component that manages optimized state across the application
 */
export function OptimizedStateProvider({ children }: OptimizedStateProviderProps) {
  // Global app state
  const appState = useOptimizedState({
    theme: 'light',
    language: 'en',
    notifications: true,
    offline: false,
  });

  // User preferences
  const userPreferences = useSelectiveState({
    dashboardLayout: 'grid',
    reportsPerPage: 10,
    autoSave: true,
    showTutorials: true,
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
  });

  // UI state
  const uiState = useSelectiveState({
    sidebarOpen: true,
    currentPage: 'dashboard',
    modals: {},
    toasts: [],
    loadingStates: {},
  });

  // Data state
  const dataState = useAsyncState(null);

  const contextValue = useMemo(
    () => ({
      appState,
      userPreferences,
      uiState,
      dataState,
    }),
    [appState, userPreferences, uiState, dataState]
  );

  return (
    <OptimizedStateContext.Provider value={contextValue}>{children}</OptimizedStateContext.Provider>
  );
}

/**
 * Hook to access the optimized state context
 */
export function useOptimizedStateContext() {
  const context = useContext(OptimizedStateContext);
  if (context === undefined) {
    throw new Error('useOptimizedStateContext must be used within an OptimizedStateProvider');
  }
  return context;
}

/**
 * Hook for managing form state with validation
 */
export function useOptimizedFormState<T extends Record<string, any>>(initialState: T) {
  return useFormState(initialState);
}

/**
 * Hook for managing component-specific state
 */
export function useComponentState<T>(initialState: T) {
  return useOptimizedState(initialState);
}

/**
 * Hook for managing async operations
 */
export function useAsyncOperation<T>(initialData: T) {
  return useAsyncState(initialData);
}

/**
 * Hook for managing selective state updates
 */
export function useSelectiveUpdates<T extends Record<string, any>>(initialState: T) {
  return useSelectiveState(initialState);
}
