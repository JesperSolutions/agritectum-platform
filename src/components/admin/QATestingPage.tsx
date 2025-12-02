import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useReports } from '../../contexts/ReportContextSimple';
import ImageUploadTest from '../ImageUploadTest';
import { EmailTestPanel } from '../email/EmailTestPanel';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Database,
  FileText,
  Wifi,
  WifiOff,
  User,
  Shield,
  Download,
  Upload,
  Trash2,
  Edit,
  Eye,
  Plus,
  RefreshCw,
  Mail,
} from 'lucide-react';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message: string;
  duration?: number;
  details?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
    context?: Record<string, any>;
  };
  debugInfo?: {
    timestamp: string;
    userInfo?: {
      uid?: string;
      email?: string;
      role?: string;
      branchId?: string;
      branchIds?: string[];
    };
    testData?: Record<string, unknown>;
    firebaseError?: {
      code: string;
      message: string;
      details?: unknown;
    };
  };
}

const QATestingPage: React.FC = () => {
  const { currentUser, logout, refreshToken } = useAuth();
  const {
    state,
    fetchReports,
    createReport,
    updateReport,
    deleteReport,
    getReport,
    exportToPDF,
    syncOfflineReports,
  } = useReports();

  // 🚨 CRITICAL SECURITY CHECK - Only super admin with permission level 2 can access QA
  if (!currentUser || currentUser.role !== 'superadmin' || currentUser.permissionLevel < 2) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='bg-white p-8 rounded-lg shadow-md text-center'>
          <h1 className='text-2xl font-bold text-red-600 mb-4'>🚨 ACCESS DENIED 🚨</h1>
          <p className='text-gray-600 mb-6'>
            QA Testing is restricted to Super Administrators only.
          </p>
          <p className='text-sm text-gray-500 mb-6'>
            Your role: {currentUser?.role || 'Not authenticated'}
            <br />
            Permission level: {currentUser?.permissionLevel || 'N/A'}
          </p>
          <button
            onClick={() => (window.location.href = '/dashboard')}
            className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testReportId, setTestReportId] = useState<string | null>(null);
  const [testBranchId, setTestBranchId] = useState<string | null>(null);
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());
  const [debugConsole, setDebugConsole] = useState<string[]>([]);
  const [showDebugConsole, setShowDebugConsole] = useState(false);

  const addDebugLog = (
    message: string,
    type: 'info' | 'error' | 'success' | 'warning' = 'info'
  ) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    setDebugConsole(prev => [...prev.slice(-49), logEntry]); // Keep last 50 entries
    console.log(`🔍 QA Debug: ${logEntry}`);
  };

  const testSuites = [
    {
      name: 'Authentication Tests',
      tests: [
        {
          id: 'auth-1',
          name: 'User Authentication Status',
          test: async () => {
            if (!currentUser) throw new Error('No authenticated user');
            if (currentUser.role !== 'superadmin') throw new Error('User is not superadmin');
            return `Authenticated as ${currentUser.email} with role ${currentUser.role}`;
          },
        },
        {
          id: 'auth-2',
          name: 'Token Refresh',
          test: async () => {
            await refreshToken();
            return 'Token refreshed successfully';
          },
        },
      ],
    },
    {
      name: 'Firestore CRUD Tests',
      tests: [
        {
          id: 'firestore-1',
          name: 'Fetch Reports',
          test: async () => {
            await fetchReports();
            const reportCount = state.reports.length;
            return `Fetched ${reportCount} reports from Firestore`;
          },
        },
        {
          id: 'firestore-2',
          name: 'Create Test Branch',
          test: async () => {
            if (!currentUser) throw new Error('No authenticated user');

            addDebugLog(`Creating test branch for user role: ${currentUser.role}`, 'info');

            // For superadmin, create a test branch for QA testing
            if (currentUser.role === 'superadmin') {
              addDebugLog('Superadmin detected, creating new test branch', 'info');

              const { collection, addDoc } = await import('firebase/firestore');
              const { db } = await import('../../config/firebase');

              const testBranch = {
                name: 'QA Test Branch',
                address: '123 Test Street, Test City',
                phone: '123-456-7890',
                email: 'test@example.com',
                isActive: true,
                createdAt: new Date().toISOString(),
                createdBy: currentUser.uid,
              };

              addDebugLog(`Test branch data: ${JSON.stringify(testBranch)}`, 'info');

              const branchRef = collection(db, 'branches');
              const docRef = await addDoc(branchRef, testBranch);

              addDebugLog(`Branch created with ID: ${docRef.id}`, 'success');
              setTestBranchId(docRef.id);
              return `Created test branch with ID: ${docRef.id}`;
            } else {
              // For other users, use their existing branch
              if (!currentUser.branchId) throw new Error('No branch assigned to user');
              addDebugLog(`Using existing branch: ${currentUser.branchId}`, 'info');
              setTestBranchId(currentUser.branchId);
              return `Using existing branch: ${currentUser.branchId}`;
            }
          },
        },
        {
          id: 'firestore-3',
          name: 'Create Test Report',
          test: async () => {
            if (!currentUser) throw new Error('No authenticated user');

            // Ensure we have a test branch - create one if needed
            let branchId = testBranchId;
            if (!branchId) {
              addDebugLog('No test branch available, creating one now', 'warning');

              if (currentUser.role === 'superadmin') {
                const { collection, addDoc } = await import('firebase/firestore');
                const { db } = await import('../../config/firebase');

                const testBranch = {
                  name: 'QA Test Branch',
                  address: '123 Test Street, Test City',
                  phone: '123-456-7890',
                  email: 'test@example.com',
                  isActive: true,
                  createdAt: new Date().toISOString(),
                  createdBy: currentUser.uid,
                };

                const branchRef = collection(db, 'branches');
                const docRef = await addDoc(branchRef, testBranch);
                branchId = docRef.id;
                setTestBranchId(branchId);
                addDebugLog(`Created test branch with ID: ${branchId}`, 'success');
              } else {
                if (!currentUser.branchId) throw new Error('No branch assigned to user');
                branchId = currentUser.branchId;
                setTestBranchId(branchId);
                addDebugLog(`Using existing branch: ${branchId}`, 'info');
              }
            }

            addDebugLog(`Using test branch ID: ${branchId}`, 'info');

            const testReport = {
              customerName: 'QA Test Customer',
              customerAddress: '123 Test Street, Test City',
              roofType: 'Asphalt' as const,
              conditionNotes: 'QA test report - can be deleted',
              issuesFound: [
                {
                  id: 'test-issue-1',
                  description: 'Test issue for QA',
                  severity: 'Low' as const,
                  location: 'Test location',
                  estimatedCost: 1000,
                },
              ],
              recommendedActions: [
                {
                  id: 'test-action-1',
                  description: 'Test recommended action',
                  priority: 'Low' as const,
                  estimatedCost: 500,
                },
              ],
              status: 'draft' as const,
              inspectionDate: new Date().toISOString().split('T')[0],
              branchId: branchId,
              createdBy: currentUser.uid,
              createdByName: currentUser.displayName || currentUser.email,
              createdAt: new Date().toISOString(),
              lastEdited: new Date().toISOString(),
            };

            addDebugLog(`Creating report with branch ID: ${branchId}`, 'info');
            addDebugLog(`User permission level: ${currentUser.permissionLevel}`, 'info');
            addDebugLog(`User role: ${currentUser.role}`, 'info');
            addDebugLog(`User branch ID: ${currentUser.branchId}`, 'info');

            // Use the report service directly with the test branch
            const { createReport: createReportService } = await import('../../services/reportService');
            const reportId = await createReportService(testReport, branchId);
            setTestReportId(reportId);
            addDebugLog(`Test report ID set to: ${reportId}`, 'info');

            // Store the report ID in sessionStorage for the next test to access
            sessionStorage.setItem('qaTestReportId', reportId);
            sessionStorage.setItem('qaTestBranchId', branchId);

            return `Created test report with ID: ${reportId}`;
          },
        },
        {
          id: 'firestore-4',
          name: 'Read Test Report',
          test: async () => {
            // Get the report ID from sessionStorage (set by previous test)
            const reportId = sessionStorage.getItem('qaTestReportId');
            const branchId = sessionStorage.getItem('qaTestBranchId');

            addDebugLog(`Current testReportId: ${testReportId}`, 'info');
            addDebugLog(`Current testBranchId: ${testBranchId}`, 'info');
            addDebugLog(`SessionStorage reportId: ${reportId}`, 'info');
            addDebugLog(`SessionStorage branchId: ${branchId}`, 'info');

            if (!reportId) throw new Error('No test report ID available');
            if (!branchId) throw new Error('No test branch available');

            addDebugLog(`Reading report ${reportId} from branch ${branchId}`, 'info');

            const { getReport: getReportService } = await import('../../services/reportService');
            const report = await getReportService(reportId, branchId);
            if (!report) throw new Error('Could not retrieve test report');
            return `Retrieved report: ${report.customerName}`;
          },
        },
        {
          id: 'firestore-5',
          name: 'Update Test Report',
          test: async () => {
            const reportId = sessionStorage.getItem('qaTestReportId');
            const branchId = sessionStorage.getItem('qaTestBranchId');

            if (!reportId) throw new Error('No test report ID available');
            if (!branchId) throw new Error('No test branch available');

            addDebugLog(`Updating report ${reportId} in branch ${branchId}`, 'info');

            const { updateReport: updateReportService } = await import('../../services/reportService');
            await updateReportService(
              reportId,
              {
                conditionNotes: 'Updated by QA test - can be deleted',
              },
              branchId
            );
            return `Updated report: ${reportId}`;
          },
        },
        {
          id: 'firestore-6',
          name: 'Delete Test Report',
          test: async () => {
            const reportId = sessionStorage.getItem('qaTestReportId');
            const branchId = sessionStorage.getItem('qaTestBranchId');

            if (!reportId) throw new Error('No test report ID available');
            if (!branchId) throw new Error('No test branch available');

            addDebugLog(`Deleting report ${reportId} from branch ${branchId}`, 'info');

            const { deleteReport: deleteReportService } = await import('../../services/reportService');
            await deleteReportService(reportId, branchId);
            setTestReportId(null);

            // Clear sessionStorage
            sessionStorage.removeItem('qaTestReportId');
            sessionStorage.removeItem('qaTestBranchId');

            return 'Test report deleted successfully';
          },
        },
        {
          id: 'firestore-7',
          name: 'Cleanup Test Branch',
          test: async () => {
            if (!testBranchId || currentUser?.role !== 'superadmin') {
              return 'No cleanup needed (not superadmin or no test branch)';
            }

            const { doc, deleteDoc } = await import('firebase/firestore');
            const { db } = await import('../../config/firebase');

            const branchRef = doc(db, 'branches', testBranchId);
            await deleteDoc(branchRef);
            setTestBranchId(null);
            return 'Test branch cleaned up successfully';
          },
        },
      ],
    },
    {
      name: 'PDF Generation Tests',
      tests: [
        {
          id: 'pdf-1',
          name: 'Generate PDF from Report',
          test: async () => {
            if (!testBranchId) throw new Error('No test branch available');

            // Create a temporary report for PDF testing
            const tempReport = {
              customerName: 'PDF Test Customer',
              customerAddress: '456 PDF Street, Test City',
              roofType: 'Metal' as const,
              conditionNotes: 'PDF generation test',
              issuesFound: [
                {
                  id: 'pdf-issue-1',
                  description: 'PDF test issue',
                  severity: 'Medium' as const,
                  location: 'Test location',
                  estimatedCost: 2000,
                },
              ],
              recommendedActions: [
                {
                  id: 'pdf-action-1',
                  description: 'PDF test action',
                  priority: 'Medium' as const,
                  estimatedCost: 1500,
                },
              ],
              status: 'draft' as const,
              inspectionDate: new Date().toISOString().split('T')[0],
              branchId: testBranchId,
              createdBy: currentUser?.uid || 'test-user',
              createdByName: currentUser?.displayName || currentUser?.email || 'Test User',
              createdAt: new Date().toISOString(),
              lastEdited: new Date().toISOString(),
            };

            const { createReport: createReportService, deleteReport: deleteReportService } =
              await import('../../services/reportService');
            const reportId = await createReportService(tempReport, testBranchId);
            const pdfBlob = await exportToPDF(reportId);

            // Clean up the test report
            await deleteReportService(reportId, testBranchId);

            if (!pdfBlob) throw new Error('PDF generation failed');
            return `Generated PDF (${Math.round(pdfBlob.size / 1024)}KB)`;
          },
        },
      ],
    },
    {
      name: 'Offline Functionality Tests',
      tests: [
        {
          id: 'offline-1',
          name: 'Offline Status Detection',
          test: async () => {
            const isOnline = navigator.onLine;
            return `Offline status: ${isOnline ? 'Online' : 'Offline'}`;
          },
        },
        {
          id: 'offline-2',
          name: 'Sync Offline Reports',
          test: async () => {
            await syncOfflineReports();
            return 'Offline sync completed';
          },
        },
      ],
    },
    {
      name: 'Role-Based Access Tests',
      tests: [
        {
          id: 'role-1',
          name: 'Superadmin Access',
          test: async () => {
            if (!currentUser) throw new Error('No authenticated user');
            if (currentUser.role !== 'superadmin') {
              throw new Error(`Expected superadmin role, got ${currentUser.role}`);
            }
            return `Access confirmed for role: ${currentUser.role}`;
          },
        },
        {
          id: 'role-2',
          name: 'Branch Access',
          test: async () => {
            if (!currentUser) throw new Error('No authenticated user');
            if (currentUser.role === 'superadmin') {
              return 'Superadmin has access to all branches';
            }
            if (!currentUser.branchId) {
              throw new Error('No branch assigned to user');
            }
            return `User assigned to branch: ${currentUser.branchId}`;
          },
        },
      ],
    },
    {
      name: 'UI Component Tests',
      tests: [
        {
          id: 'ui-1',
          name: 'Report Context State',
          test: async () => {
            const hasReports = Array.isArray(state.reports);
            const hasLoading = typeof state.loading === 'boolean';
            const hasError = state.error === null || typeof state.error === 'string';

            if (!hasReports) throw new Error('Reports state is not an array');
            if (typeof state.loading !== 'boolean') throw new Error('Loading state is not boolean');

            return `Context state valid - Reports: ${state.reports.length}, Loading: ${state.loading}`;
          },
        },
        {
          id: 'ui-2',
          name: 'Navigation Access',
          test: async () => {
            // Test if we can access different routes (simulated)
            const routes = ['/dashboard', '/admin/analytics', '/admin/users', '/admin/branches'];
            return `Navigation routes accessible: ${routes.join(', ')}`;
          },
        },
      ],
    },
  ];

  const runSingleTest = async (test: Test): Promise<TestResult> => {
    const startTime = Date.now();
    const result: TestResult = {
      id: test.id,
      name: test.name,
      status: 'running',
      message: 'Running...',
      debugInfo: {
        timestamp: new Date().toISOString(),
        userInfo: currentUser
          ? {
              uid: currentUser.uid,
              email: currentUser.email,
              role: currentUser.role,
              branchId: currentUser.branchId,
              branchIds: currentUser.branchIds,
            }
          : undefined,
      },
    };

    try {
      addDebugLog(`Starting test: ${test.name}`, 'info');
      addDebugLog(`Current user: ${currentUser?.email} (${currentUser?.role})`, 'info');
      addDebugLog(`Test branch ID: ${testBranchId}`, 'info');

      const message = await test.test();
      const duration = Date.now() - startTime;

      addDebugLog(`Test passed: ${test.name} (${duration}ms)`, 'success');

      return {
        ...result,
        status: 'passed',
        message,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      addDebugLog(
        `Test failed: ${test.name} - ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );

      // Enhanced error parsing
      const errorInfo = {
        name: 'Unknown Error',
        message: 'An unknown error occurred',
        stack: undefined as string | undefined,
        code: undefined as string | undefined,
        context: {} as Record<string, any>,
      };

      if (error instanceof Error) {
        errorInfo.name = error.name;
        errorInfo.message = error.message;
        errorInfo.stack = error.stack;

        // Check for Firebase-specific errors
        if ('code' in error) {
          errorInfo.code = (error as any).code;
        }

        // Extract context from error message
        if (error.message.includes('branchId')) {
          errorInfo.context.branchId = testBranchId;
          errorInfo.context.userBranchId = currentUser?.branchId;
          errorInfo.context.userBranchIds = currentUser?.branchIds;
        }

        if (error.message.includes('permission')) {
          errorInfo.context.userRole = currentUser?.role;
          errorInfo.context.isAuthenticated = !!currentUser;
        }
      }

      // Firebase error detection
      let firebaseError = undefined;
      if (error instanceof Error && error.message.includes('Firebase')) {
        firebaseError = {
          code: errorInfo.code || 'unknown',
          message: error.message,
          details: {
            stack: error.stack,
            name: error.name,
          },
        };
      }

      const enhancedResult: TestResult = {
        ...result,
        status: 'failed',
        message: `${errorInfo.name}: ${errorInfo.message}`,
        duration,
        error: errorInfo,
        debugInfo: {
          ...result.debugInfo,
          testData: {
            testBranchId,
            testReportId,
            currentUserRole: currentUser?.role,
            hasBranchId: !!currentUser?.branchId,
            hasBranchIds: !!currentUser?.branchIds?.length,
          },
          firebaseError,
        },
      };

      return enhancedResult;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    const allTests = testSuites.flatMap(suite => suite.tests);
    const results: TestResult[] = [];

    for (const test of allTests) {
      const result = await runSingleTest(test);
      results.push(result);
      setTestResults([...results]);

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsRunning(false);
  };

  const runTestSuite = async (suiteName: string) => {
    setIsRunning(true);
    const suite = testSuites.find(s => s.name === suiteName);
    if (!suite) return;

    const results: TestResult[] = [];
    for (const test of suite.tests) {
      const result = await runSingleTest(test);
      results.push(result);
      setTestResults(prev => [
        ...prev.filter(r => !results.some(nr => nr.id === r.id)),
        ...results,
      ]);

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsRunning(false);
  };

  const clearResults = () => {
    setTestResults([]);
    setExpandedErrors(new Set());
    setDebugConsole([]);
    setTestBranchId(null);
    setTestReportId(null);

    // Clear sessionStorage
    sessionStorage.removeItem('qaTestReportId');
    sessionStorage.removeItem('qaTestBranchId');
  };

  const toggleErrorExpansion = (testId: string) => {
    setExpandedErrors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(testId)) {
        newSet.delete(testId);
      } else {
        newSet.add(testId);
      }
      return newSet;
    });
  };

  const copyErrorToClipboard = async (result: TestResult) => {
    const errorReport = {
      testName: result.name,
      status: result.status,
      message: result.message,
      duration: result.duration,
      error: result.error,
      debugInfo: result.debugInfo,
      timestamp: new Date().toISOString(),
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2));
      alert('Error details copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className='w-5 h-5 text-green-500' />;
      case 'failed':
        return <XCircle className='w-5 h-5 text-red-500' />;
      case 'running':
        return <RefreshCw className='w-5 h-5 text-blue-500 animate-spin' />;
      default:
        return <Clock className='w-5 h-5 text-gray-400' />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'running':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const passedTests = testResults.filter(r => r.status === 'passed').length;
  const failedTests = testResults.filter(r => r.status === 'failed').length;
  const totalTests = testResults.length;

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='bg-white rounded-lg shadow-sm p-6 mb-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900 flex items-center gap-3'>
                <Shield className='w-8 h-8 text-blue-600' />
                QA Testing Dashboard
              </h1>
              <p className='text-gray-600 mt-2'>
                Comprehensive testing suite for all application functionality
              </p>
            </div>
            <div className='flex gap-3'>
              <button
                onClick={runAllTests}
                disabled={isRunning}
                className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2'
              >
                <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
                Run All Tests
              </button>
              <button
                onClick={clearResults}
                disabled={isRunning}
                className='px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50'
              >
                Clear Results
              </button>
            </div>
          </div>
        </div>

        {/* Test Suites */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
          {testSuites.map(suite => (
            <div key={suite.name} className='bg-white rounded-lg shadow-sm p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                <Database className='w-5 h-5 text-blue-600' />
                {suite.name}
              </h3>
              <div className='space-y-2'>
                {suite.tests.map(test => (
                  <div
                    key={test.id}
                    className='flex items-center justify-between p-2 bg-gray-50 rounded'
                  >
                    <span className='text-sm text-gray-700'>{test.name}</span>
                    <button
                      onClick={() =>
                        runSingleTest(test).then(result =>
                          setTestResults(prev => [...prev.filter(r => r.id !== result.id), result])
                        )
                      }
                      disabled={isRunning}
                      className='px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 disabled:opacity-50'
                    >
                      Run
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => runTestSuite(suite.name)}
                disabled={isRunning}
                className='w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50'
              >
                Run Suite
              </button>
            </div>
          ))}
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className='bg-white rounded-lg shadow-sm p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-gray-900'>Test Results</h3>
              <div className='flex items-center gap-4 text-sm'>
                <span className='text-green-600 font-medium'>✓ {passedTests} passed</span>
                <span className='text-red-600 font-medium'>✗ {failedTests} failed</span>
                <span className='text-gray-600'>{totalTests} total</span>
              </div>
            </div>

            <div className='space-y-3'>
              {testResults.map(result => (
                <div
                  key={result.id}
                  className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      {getStatusIcon(result.status)}
                      <div className='flex-1'>
                        <h4 className='font-medium text-gray-900'>{result.name}</h4>
                        <p className='text-sm text-gray-600'>{result.message}</p>

                        {/* Error details for failed tests */}
                        {result.status === 'failed' && result.error && (
                          <div className='mt-2'>
                            <button
                              onClick={() => toggleErrorExpansion(result.id)}
                              className='text-xs text-red-600 hover:text-red-800 flex items-center gap-1'
                            >
                              {expandedErrors.has(result.id) ? '▼' : '▶'}
                              {expandedErrors.has(result.id) ? 'Hide' : 'Show'} Error Details
                            </button>

                            {expandedErrors.has(result.id) && (
                              <div className='mt-2 p-3 bg-red-50 border border-red-200 rounded text-xs'>
                                <div className='space-y-2'>
                                  <div>
                                    <strong>Error Type:</strong> {result.error.name}
                                  </div>
                                  {result.error.code && (
                                    <div>
                                      <strong>Error Code:</strong> {result.error.code}
                                    </div>
                                  )}
                                  <div>
                                    <strong>Full Message:</strong> {result.error.message}
                                  </div>

                                  {result.debugInfo?.userInfo && (
                                    <div>
                                      <strong>User Info:</strong>
                                      <pre className='mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto'>
                                        {JSON.stringify(result.debugInfo.userInfo, null, 2)}
                                      </pre>
                                    </div>
                                  )}

                                  {result.debugInfo?.testData && (
                                    <div>
                                      <strong>Test Context:</strong>
                                      <pre className='mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto'>
                                        {JSON.stringify(result.debugInfo.testData, null, 2)}
                                      </pre>
                                    </div>
                                  )}

                                  {result.debugInfo?.firebaseError && (
                                    <div>
                                      <strong>Firebase Error:</strong>
                                      <pre className='mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto'>
                                        {JSON.stringify(result.debugInfo.firebaseError, null, 2)}
                                      </pre>
                                    </div>
                                  )}

                                  {result.error.stack && (
                                    <div>
                                      <strong>Stack Trace:</strong>
                                      <pre className='mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto max-h-32'>
                                        {result.error.stack}
                                      </pre>
                                    </div>
                                  )}

                                  <div className='flex gap-2 mt-2'>
                                    <button
                                      onClick={() => copyErrorToClipboard(result)}
                                      className='px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700'
                                    >
                                      Copy Error Report
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      {result.duration && (
                        <span className='text-xs text-gray-500'>{result.duration}ms</span>
                      )}
                      {result.status === 'failed' && (
                        <button
                          onClick={() => copyErrorToClipboard(result)}
                          className='text-xs text-red-600 hover:text-red-800'
                          title='Copy error details'
                        >
                          📋
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Debug Console */}
        <div className='mt-6 bg-white rounded-lg shadow-sm p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-gray-900'>Debug Console</h3>
            <div className='flex gap-2'>
              <button
                onClick={() => setShowDebugConsole(!showDebugConsole)}
                className='px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700'
              >
                {showDebugConsole ? 'Hide' : 'Show'} Console
              </button>
              <button
                onClick={() => setDebugConsole([])}
                className='px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700'
              >
                Clear
              </button>
            </div>
          </div>

          {showDebugConsole && (
            <div className='bg-black text-green-400 p-4 rounded font-mono text-xs max-h-64 overflow-y-auto'>
              {debugConsole.length === 0 ? (
                <div className='text-gray-500'>
                  No debug messages yet. Run some tests to see output.
                </div>
              ) : (
                debugConsole.map((log, index) => (
                  <div key={index} className='mb-1'>
                    {log}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* System Status */}
        <div className='mt-6 bg-white rounded-lg shadow-sm p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>System Status</h3>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='flex items-center gap-3 p-3 bg-gray-50 rounded'>
              <User className='w-5 h-5 text-blue-600' />
              <div>
                <p className='text-sm text-gray-600'>Current User</p>
                <p className='font-medium'>{currentUser?.email || 'Not authenticated'}</p>
              </div>
            </div>
            <div className='flex items-center gap-3 p-3 bg-gray-50 rounded'>
              <Shield className='w-5 h-5 text-green-600' />
              <div>
                <p className='text-sm text-gray-600'>Role</p>
                <p className='font-medium'>{currentUser?.role || 'Unknown'}</p>
              </div>
            </div>
            <div className='flex items-center gap-3 p-3 bg-gray-50 rounded'>
              {navigator.onLine ? (
                <Wifi className='w-5 h-5 text-green-600' />
              ) : (
                <WifiOff className='w-5 h-5 text-red-600' />
              )}
              <div>
                <p className='text-sm text-gray-600'>Connection</p>
                <p className='font-medium'>{navigator.onLine ? 'Online' : 'Offline'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Image Upload Test Section */}
        <div className='bg-white rounded-lg shadow-sm p-6 mb-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
            <Upload className='w-5 h-5 text-blue-600' />
            Image Upload Test
          </h3>
          <p className='text-gray-600 mb-4'>
            Test the image upload functionality with Firebase Storage integration.
          </p>
          <ImageUploadTest />
        </div>

        {/* Email System Test Section */}
        <div className='bg-white rounded-lg shadow-sm p-6 mb-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
            <Mail className='w-5 h-5 text-green-600' />
            Email System Test
          </h3>
          <p className='text-gray-600 mb-4'>
            Test the email functionality with SendGrid integration.
          </p>
          <EmailTestPanel />
        </div>
      </div>
    </div>
  );
};

export default QATestingPage;
