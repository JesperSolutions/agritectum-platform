import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

interface PageState {
  scrollPosition?: number;
  branchId?: string;
  filters?: Record<string, any>;
  selectedItems?: string[];
  timestamp?: number;
  [key: string]: any;
}

interface UsePageStateOptions {
  key?: string;
  persistBranch?: boolean;
  persistFilters?: boolean;
  persistSelection?: boolean;
}

export const usePageState = (options: UsePageStateOptions = {}) => {
  const location = useLocation();
  const {
    key,
    persistBranch: _persistBranch = true,
    persistFilters: _persistFilters = true,
    persistSelection: _persistSelection = false,
  } = options;

  // Generate a unique key for this page/route
  const pageKey = key || location.pathname.replace(/\//g, '_').replace(/^_/, '') || 'home';
  const storageKey = `pageState_${pageKey}`;
  
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const isRestoringRef = useRef(false);

  // Save page state to sessionStorage
  const saveState = useCallback((state: Partial<PageState>) => {
    if (isRestoringRef.current) return;
    
    try {
      const currentState = getState();
      const newState: PageState = {
        ...currentState,
        ...state,
        timestamp: Date.now(),
      };
      
      sessionStorage.setItem(storageKey, JSON.stringify(newState));
    } catch (error) {
      console.warn('Failed to save page state:', error);
    }
  }, [storageKey]);

  // Get page state from sessionStorage
  const getState = useCallback((): PageState => {
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (!stored) return {};
      
      const parsed = JSON.parse(stored);
      
      // Check if state is not too old (24 hours)
      if (parsed.timestamp && Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
        sessionStorage.removeItem(storageKey);
        return {};
      }
      
      return parsed;
    } catch (error) {
      console.warn('Failed to get page state:', error);
      return {};
    }
  }, [storageKey]);

  // Restore scroll position
  const restoreScrollPosition = useCallback(() => {
    const state = getState();
    if (state.scrollPosition && typeof state.scrollPosition === 'number') {
      isRestoringRef.current = true;
      window.scrollTo(0, state.scrollPosition);
      
      // Reset flag after a short delay
      setTimeout(() => {
        isRestoringRef.current = false;
      }, 100);
    }
  }, [getState]);

  // Save scroll position with debouncing
  const handleScroll = useCallback(() => {
    if (isRestoringRef.current) return;
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      saveState({ scrollPosition: window.scrollY });
    }, 150);
  }, [saveState]);

  // Set up scroll listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll]);

  // Restore scroll position on mount
  useEffect(() => {
    restoreScrollPosition();
  }, [restoreScrollPosition]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return {
    saveState,
    getState,
    restoreScrollPosition,
    pageKey,
  };
};

// Specialized hook for branch context persistence
export const useBranchContext = (currentBranchId?: string) => {
  const { saveState, getState } = usePageState({ persistBranch: true });
  
  // Save branch context when it changes
  useEffect(() => {
    if (currentBranchId) {
      saveState({ branchId: currentBranchId });
    }
  }, [currentBranchId, saveState]);

  // Get last used branch
  const getLastBranch = useCallback(() => {
    const state = getState();
    return state.branchId;
  }, [getState]);

  return {
    getLastBranch,
    saveBranchContext: (branchId: string) => saveState({ branchId }),
  };
};

// Specialized hook for filter persistence
export const useFilterPersistence = (filters: Record<string, any> = {}) => {
  const { saveState, getState } = usePageState({ persistFilters: true });
  
  // Save filters when they change
  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      saveState({ filters });
    }
  }, [filters, saveState]);

  // Get saved filters
  const getSavedFilters = useCallback(() => {
    const state = getState();
    return state.filters || {};
  }, [getState]);

  return {
    getSavedFilters,
    saveFilters: (newFilters: Record<string, any>) => saveState({ filters: newFilters }),
  };
};
