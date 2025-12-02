import { create } from 'zustand';
import { subscribeWithSelector, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Types for the optimized store
interface AppState {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
  offline: boolean;
}

interface UserPreferences {
  dashboardLayout: 'grid' | 'list';
  reportsPerPage: number;
  autoSave: boolean;
  showTutorials: boolean;
  dateFormat: string;
  timeFormat: '12h' | '24h';
}

interface UIState {
  sidebarOpen: boolean;
  currentPage: string;
  modals: Record<string, boolean>;
  toasts: Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
  }>;
  loadingStates: Record<string, boolean>;
}

interface DataState {
  reports: any[];
  branches: any[];
  customers: any[];
  employees: any[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

interface OptimizedStore {
  // State
  app: AppState;
  userPreferences: UserPreferences;
  ui: UIState;
  data: DataState;

  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: string) => void;
  setNotifications: (notifications: boolean) => void;
  setOffline: (offline: boolean) => void;

  updateUserPreference: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => void;
  updateUserPreferences: (preferences: Partial<UserPreferences>) => void;

  setSidebarOpen: (open: boolean) => void;
  setCurrentPage: (page: string) => void;
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  addToast: (toast: Omit<UIState['toasts'][0], 'id'>) => void;
  removeToast: (toastId: string) => void;
  setLoadingState: (key: string, loading: boolean) => void;

  setReports: (reports: any[]) => void;
  addReport: (report: any) => void;
  updateReport: (id: string, updates: Partial<any>) => void;
  removeReport: (id: string) => void;

  setBranches: (branches: any[]) => void;
  addBranch: (branch: any) => void;
  updateBranch: (id: string, updates: Partial<any>) => void;
  removeBranch: (id: string) => void;

  setCustomers: (customers: any[]) => void;
  addCustomer: (customer: any) => void;
  updateCustomer: (id: string, updates: Partial<any>) => void;
  removeCustomer: (id: string) => void;

  setEmployees: (employees: any[]) => void;
  addEmployee: (employee: any) => void;
  updateEmployee: (id: string, updates: Partial<any>) => void;
  removeEmployee: (id: string) => void;

  setDataLoading: (loading: boolean) => void;
  setDataError: (error: string | null) => void;
  setLastUpdated: (timestamp: number) => void;

  // Selectors
  getReportById: (id: string) => any | undefined;
  getBranchById: (id: string) => any | undefined;
  getCustomerById: (id: string) => any | undefined;
  getEmployeeById: (id: string) => any | undefined;

  getReportsByBranch: (branchId: string) => any[];
  getReportsByStatus: (status: string) => any[];
  getReportsByDateRange: (startDate: Date, endDate: Date) => any[];

  getActiveModals: () => string[];
  getActiveToasts: () => UIState['toasts'];
  getLoadingStates: () => Record<string, boolean>;

  // Computed values
  getTotalReports: () => number;
  getTotalBranches: () => number;
  getTotalCustomers: () => number;
  getTotalEmployees: () => number;

  getReportsByStatusCount: () => Record<string, number>;
  getReportsByBranchCount: () => Record<string, number>;

  // Reset actions
  resetApp: () => void;
  resetUserPreferences: () => void;
  resetUI: () => void;
  resetData: () => void;
  resetAll: () => void;
}

// Initial state
const initialAppState: AppState = {
  theme: 'light',
  language: 'en',
  notifications: true,
  offline: false,
};

const initialUserPreferences: UserPreferences = {
  dashboardLayout: 'grid',
  reportsPerPage: 10,
  autoSave: true,
  showTutorials: true,
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
};

const initialUIState: UIState = {
  sidebarOpen: true,
  currentPage: 'dashboard',
  modals: {},
  toasts: [],
  loadingStates: {},
};

const initialDataState: DataState = {
  reports: [],
  branches: [],
  customers: [],
  employees: [],
  loading: false,
  error: null,
  lastUpdated: null,
};

// Create the optimized store
export const useOptimizedStore = create<OptimizedStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial state
        app: initialAppState,
        userPreferences: initialUserPreferences,
        ui: initialUIState,
        data: initialDataState,

        // App actions
        setTheme: theme =>
          set(state => {
            state.app.theme = theme;
          }),

        setLanguage: language =>
          set(state => {
            state.app.language = language;
          }),

        setNotifications: notifications =>
          set(state => {
            state.app.notifications = notifications;
          }),

        setOffline: offline =>
          set(state => {
            state.app.offline = offline;
          }),

        // User preferences actions
        updateUserPreference: (key, value) =>
          set(state => {
            state.userPreferences[key] = value;
          }),

        updateUserPreferences: preferences =>
          set(state => {
            Object.assign(state.userPreferences, preferences);
          }),

        // UI actions
        setSidebarOpen: open =>
          set(state => {
            state.ui.sidebarOpen = open;
          }),

        setCurrentPage: page =>
          set(state => {
            state.ui.currentPage = page;
          }),

        openModal: modalId =>
          set(state => {
            state.ui.modals[modalId] = true;
          }),

        closeModal: modalId =>
          set(state => {
            state.ui.modals[modalId] = false;
          }),

        addToast: toast =>
          set(state => {
            const id = Math.random().toString(36).substr(2, 9);
            state.ui.toasts.push({ ...toast, id });
          }),

        removeToast: toastId =>
          set(state => {
            state.ui.toasts = state.ui.toasts.filter(toast => toast.id !== toastId);
          }),

        setLoadingState: (key, loading) =>
          set(state => {
            state.ui.loadingStates[key] = loading;
          }),

        // Data actions
        setReports: reports =>
          set(state => {
            state.data.reports = reports;
            state.data.lastUpdated = Date.now();
          }),

        addReport: report =>
          set(state => {
            state.data.reports.push(report);
            state.data.lastUpdated = Date.now();
          }),

        updateReport: (id, updates) =>
          set(state => {
            const index = state.data.reports.findIndex(report => report.id === id);
            if (index !== -1) {
              Object.assign(state.data.reports[index], updates);
              state.data.lastUpdated = Date.now();
            }
          }),

        removeReport: id =>
          set(state => {
            state.data.reports = state.data.reports.filter(report => report.id !== id);
            state.data.lastUpdated = Date.now();
          }),

        setBranches: branches =>
          set(state => {
            state.data.branches = branches;
            state.data.lastUpdated = Date.now();
          }),

        addBranch: branch =>
          set(state => {
            state.data.branches.push(branch);
            state.data.lastUpdated = Date.now();
          }),

        updateBranch: (id, updates) =>
          set(state => {
            const index = state.data.branches.findIndex(branch => branch.id === id);
            if (index !== -1) {
              Object.assign(state.data.branches[index], updates);
              state.data.lastUpdated = Date.now();
            }
          }),

        removeBranch: id =>
          set(state => {
            state.data.branches = state.data.branches.filter(branch => branch.id !== id);
            state.data.lastUpdated = Date.now();
          }),

        setCustomers: customers =>
          set(state => {
            state.data.customers = customers;
            state.data.lastUpdated = Date.now();
          }),

        addCustomer: customer =>
          set(state => {
            state.data.customers.push(customer);
            state.data.lastUpdated = Date.now();
          }),

        updateCustomer: (id, updates) =>
          set(state => {
            const index = state.data.customers.findIndex(customer => customer.id === id);
            if (index !== -1) {
              Object.assign(state.data.customers[index], updates);
              state.data.lastUpdated = Date.now();
            }
          }),

        removeCustomer: id =>
          set(state => {
            state.data.customers = state.data.customers.filter(customer => customer.id !== id);
            state.data.lastUpdated = Date.now();
          }),

        setEmployees: employees =>
          set(state => {
            state.data.employees = employees;
            state.data.lastUpdated = Date.now();
          }),

        addEmployee: employee =>
          set(state => {
            state.data.employees.push(employee);
            state.data.lastUpdated = Date.now();
          }),

        updateEmployee: (id, updates) =>
          set(state => {
            const index = state.data.employees.findIndex(employee => employee.id === id);
            if (index !== -1) {
              Object.assign(state.data.employees[index], updates);
              state.data.lastUpdated = Date.now();
            }
          }),

        removeEmployee: id =>
          set(state => {
            state.data.employees = state.data.employees.filter(employee => employee.id !== id);
            state.data.lastUpdated = Date.now();
          }),

        setDataLoading: loading =>
          set(state => {
            state.data.loading = loading;
          }),

        setDataError: error =>
          set(state => {
            state.data.error = error;
          }),

        setLastUpdated: timestamp =>
          set(state => {
            state.data.lastUpdated = timestamp;
          }),

        // Selectors
        getReportById: id => {
          const state = get();
          return state.data.reports.find(report => report.id === id);
        },

        getBranchById: id => {
          const state = get();
          return state.data.branches.find(branch => branch.id === id);
        },

        getCustomerById: id => {
          const state = get();
          return state.data.customers.find(customer => customer.id === id);
        },

        getEmployeeById: id => {
          const state = get();
          return state.data.employees.find(employee => employee.id === id);
        },

        getReportsByBranch: branchId => {
          const state = get();
          return state.data.reports.filter(report => report.branchId === branchId);
        },

        getReportsByStatus: status => {
          const state = get();
          return state.data.reports.filter(report => report.status === status);
        },

        getReportsByDateRange: (startDate, endDate) => {
          const state = get();
          return state.data.reports.filter(report => {
            const reportDate = new Date(report.createdAt);
            return reportDate >= startDate && reportDate <= endDate;
          });
        },

        getActiveModals: () => {
          const state = get();
          return Object.keys(state.ui.modals).filter(modalId => state.ui.modals[modalId]);
        },

        getActiveToasts: () => {
          const state = get();
          return state.ui.toasts;
        },

        getLoadingStates: () => {
          const state = get();
          return state.ui.loadingStates;
        },

        // Computed values
        getTotalReports: () => {
          const state = get();
          return state.data.reports.length;
        },

        getTotalBranches: () => {
          const state = get();
          return state.data.branches.length;
        },

        getTotalCustomers: () => {
          const state = get();
          return state.data.customers.length;
        },

        getTotalEmployees: () => {
          const state = get();
          return state.data.employees.length;
        },

        getReportsByStatusCount: () => {
          const state = get();
          return state.data.reports.reduce(
            (acc, report) => {
              acc[report.status] = (acc[report.status] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          );
        },

        getReportsByBranchCount: () => {
          const state = get();
          return state.data.reports.reduce(
            (acc, report) => {
              acc[report.branchId] = (acc[report.branchId] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          );
        },

        // Reset actions
        resetApp: () =>
          set(state => {
            state.app = { ...initialAppState };
          }),

        resetUserPreferences: () =>
          set(state => {
            state.userPreferences = { ...initialUserPreferences };
          }),

        resetUI: () =>
          set(state => {
            state.ui = { ...initialUIState };
          }),

        resetData: () =>
          set(state => {
            state.data = { ...initialDataState };
          }),

        resetAll: () =>
          set(state => {
            state.app = { ...initialAppState };
            state.userPreferences = { ...initialUserPreferences };
            state.ui = { ...initialUIState };
            state.data = { ...initialDataState };
          }),
      }))
    ),
    {
      name: 'optimized-store',
      partialize: state => ({
        app: state.app,
        userPreferences: state.userPreferences,
        ui: {
          sidebarOpen: state.ui.sidebarOpen,
          currentPage: state.ui.currentPage,
        },
      }),
    }
  )
);

// Selector hooks for specific parts of the store
export const useAppState = () => useOptimizedStore(state => state.app);
export const useUserPreferences = () => useOptimizedStore(state => state.userPreferences);
export const useUIState = () => useOptimizedStore(state => state.ui);
export const useDataState = () => useOptimizedStore(state => state.data);

// Action hooks
export const useAppActions = () =>
  useOptimizedStore(state => ({
    setTheme: state.setTheme,
    setLanguage: state.setLanguage,
    setNotifications: state.setNotifications,
    setOffline: state.setOffline,
  }));

export const useUserPreferenceActions = () =>
  useOptimizedStore(state => ({
    updateUserPreference: state.updateUserPreference,
    updateUserPreferences: state.updateUserPreferences,
  }));

export const useUIActions = () =>
  useOptimizedStore(state => ({
    setSidebarOpen: state.setSidebarOpen,
    setCurrentPage: state.setCurrentPage,
    openModal: state.openModal,
    closeModal: state.closeModal,
    addToast: state.addToast,
    removeToast: state.removeToast,
    setLoadingState: state.setLoadingState,
  }));

export const useDataActions = () => {
  const store = useOptimizedStore();
  return {
    setReports: store.setReports,
    addReport: store.addReport,
    updateReport: store.updateReport,
    removeReport: store.removeReport,
    setBranches: store.setBranches,
    addBranch: store.addBranch,
    updateBranch: store.updateBranch,
    removeBranch: store.removeBranch,
    setCustomers: store.setCustomers,
    addCustomer: store.addCustomer,
    updateCustomer: store.updateCustomer,
    removeCustomer: store.removeCustomer,
    setEmployees: store.setEmployees,
    addEmployee: store.addEmployee,
    updateEmployee: store.updateEmployee,
    removeEmployee: store.removeEmployee,
    setDataLoading: store.setDataLoading,
    setDataError: store.setDataError,
    setLastUpdated: store.setLastUpdated,
  };
};

// Computed value hooks
export const useComputedValues = () => {
  const store = useOptimizedStore();
  return {
    totalReports: store.getTotalReports,
    totalBranches: store.getTotalBranches,
    totalCustomers: store.getTotalCustomers,
    totalEmployees: store.getTotalEmployees,
    reportsByStatusCount: store.getReportsByStatusCount,
    reportsByBranchCount: store.getReportsByBranchCount,
  };
};

// Selector hooks
export const useSelectors = () =>
  useOptimizedStore(state => ({
    getReportById: state.getReportById,
    getBranchById: state.getBranchById,
    getCustomerById: state.getCustomerById,
    getEmployeeById: state.getEmployeeById,
    getReportsByBranch: state.getReportsByBranch,
    getReportsByStatus: state.getReportsByStatus,
    getReportsByDateRange: state.getReportsByDateRange,
    getActiveModals: state.getActiveModals,
    getActiveToasts: state.getActiveToasts,
    getLoadingStates: state.getLoadingStates,
  }));
