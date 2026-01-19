import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Users,
  FileText,
  TrendingUp,
  Calendar,
  DollarSign,
  Clock,
  AlertTriangle,
  Building,
  Activity,
  Download,
  Filter,
  MapPin,
  Target,
  CheckCircle,
  XCircle,
  LineChart,
  ChevronDown,
  ChevronUp,
  Award,
  Shield,
  FileCheck,
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { useReports } from '../../contexts/ReportContextSimple';
import { useIntl } from '../../hooks/useIntl';
import LoadingProgress from '../LoadingProgress';
import { getServiceAgreements } from '../../services/serviceAgreementService';
import { getOffers } from '../../services/offerService';
import { ServiceAgreement, Offer } from '../../types';
import { formatCurrencyAmount, getCurrencyCode } from '../../utils/currency';
import type { SupportedLocale } from '../../utils/geolocation';
import { logger } from '../../utils/logger';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface AnalyticsData {
  // KPIs & Metrics
  totalReports: number;
  reportsThisMonth: number;
  totalRevenue: number; // Revenue from reports only
  totalBusinessRevenue: number; // Total revenue from reports + offers + service agreements
  monthlyEarnings: number; // Total earnings this month
  yearlyEarnings: number; // Total earnings this year
  averageReportValue: number;
  completionRate: number;
  criticalIssueRate: number;
  
  // Service Agreements
  totalServiceAgreements: number;
  activeServiceAgreements: number;
  serviceAgreementRevenue: number; // Total revenue from active service agreements
  serviceAgreementsByType: Array<{
    type: string;
    count: number;
    revenue: number;
  }>;
  serviceAgreementsByStatus: Array<{
    status: string;
    count: number;
    revenue: number;
  }>;

  // Customer Insights
  uniqueCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  topCustomers: Array<{
    name: string;
    revenue: number;
    reportCount: number;
    location: string;
  }>;

  // Report Insights
  reportsByRoofType: Array<{
    type: string;
    count: number;
    revenue: number;
    percentage: number;
  }>;
  reportsByBranch: Array<{
    branch: string;
    count: number;
    revenue: number;
  }>;
  averageTimeToSend: number; // in days

  // Critical Issues
  currentIssues: Array<{
    id: string;
    description: string;
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    assignedInspector: string;
    createdAt: string;
    status: 'Open' | 'In Progress' | 'Resolved';
  }>;
  issueResolutionRate: number;

  // User & Branch Management
  reportsPerEmployee: Array<{
    name: string;
    count: number;
    revenue: number;
  }>;
  branchPerformance: Array<{
    branch: string;
    reports: number;
    revenue: number;
    efficiency: number;
  }>;

  // Trends
  monthlyTrends: Array<{
    month: string;
    reports: number;
    revenue: number;
  }>;
  issueTrends: Array<{
    month: string;
    critical: number;
    resolved: number;
  }>;
}

const AnalyticsDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { reports, fetchReports } = useReports();
  const { t, locale } = useIntl();
  const currentLocale = locale as SupportedLocale;
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [serviceAgreements, setServiceAgreements] = useState<ServiceAgreement[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState(t('analytics.loadingReports'));
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  // Initialize selectedBranch based on user role
  const [selectedBranch, setSelectedBranch] = useState<string>(() => {
    if (currentUser?.role === 'superadmin') {
      return 'all'; // Superadmin can see all branches
    } else if (currentUser?.role === 'branchAdmin' || currentUser?.role === 'inspector') {
      return currentUser?.branchId || 'malmo'; // Branch users see only their branch
    }
    return 'all';
  });
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['kpis', 'customers'])
  );
  const [showFilters, setShowFilters] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);

  // Define calculateAnalytics function first
  const calculateAnalytics = useCallback(
    (reports: any[], serviceAgreements: ServiceAgreement[], offers: Offer[], timeframe: string, branch: string): AnalyticsData => {
      const now = new Date();
      const timeframeDays = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365,
      };

      const cutoffDate = new Date(
        now.getTime() - timeframeDays[timeframe as keyof typeof timeframeDays] * 24 * 60 * 60 * 1000
      );

      // Filter reports by timeframe and branch
      const filteredReports = reports.filter(report => {
        const reportDate = new Date(report.createdAt || report.inspectionDate);
        const timeMatch = reportDate >= cutoffDate;
        
        // For non-superadmin users, always filter by their branch
        let branchMatch;
        if (currentUser?.role === 'superadmin') {
          branchMatch = branch === 'all' || report.branchId === branch;
        } else {
          // Branch users can only see their own branch data
          branchMatch = report.branchId === currentUser?.branchId;
        }
        
        return timeMatch && branchMatch;
      });

      // Calculate KPIs
      const totalReports = filteredReports.length;
      const reportsThisMonth = filteredReports.filter(r => {
        const reportDate = new Date(r.createdAt || r.inspectionDate);
        return (
          reportDate.getMonth() === now.getMonth() && reportDate.getFullYear() === now.getFullYear()
        );
      }).length;

      const totalRevenue = filteredReports.reduce((sum, report) => {
        return sum + (report.estimatedCost || 0);
      }, 0);

      const averageReportValue = totalReports > 0 ? totalRevenue / totalReports : 0;

      const sentReports = filteredReports.filter(r => r.status === 'sent').length;
      const completionRate = totalReports > 0 ? (sentReports / totalReports) * 100 : 0;

      const criticalIssues = filteredReports.filter(r =>
        r.issuesFound?.some((issue: any) => issue.severity === 'Critical')
      ).length;
      const criticalIssueRate = totalReports > 0 ? (criticalIssues / totalReports) * 100 : 0;

      // Customer Insights
      const uniqueCustomers = new Set(filteredReports.map(r => r.customerName)).size;
      const customerData = new Map();

      filteredReports.forEach(report => {
        const customer = report.customerName;
        if (!customerData.has(customer)) {
          customerData.set(customer, {
            name: customer,
            revenue: 0,
            reportCount: 0,
            location: report.customerAddress || 'Unknown',
          });
        }
        const data = customerData.get(customer);
        data.revenue += report.estimatedCost || 0;
        data.reportCount += 1;
      });

      const topCustomers = Array.from(customerData.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Report Insights
      const roofTypeData = new Map();
      filteredReports.forEach(report => {
        const type = report.roofType || 'Unknown';
        if (!roofTypeData.has(type)) {
          roofTypeData.set(type, { type, count: 0, revenue: 0 });
        }
        const data = roofTypeData.get(type);
        data.count += 1;
        data.revenue += report.estimatedCost || 0;
      });

      const reportsByRoofType = Array.from(roofTypeData.values()).map(item => ({
        ...item,
        percentage: totalReports > 0 ? (item.count / totalReports) * 100 : 0,
      }));

      // Branch Performance
      const branchData = new Map();
      filteredReports.forEach(report => {
        const branch = report.branchId || 'Unknown';
        if (!branchData.has(branch)) {
          branchData.set(branch, { branch, count: 0, revenue: 0 });
        }
        const data = branchData.get(branch);
        data.count += 1;
        data.revenue += report.estimatedCost || 0;
      });

      const reportsByBranch = Array.from(branchData.values());

      // Calculate average time to send
      const sentReportsWithDates = filteredReports.filter(
        r => r.status === 'sent' && r.createdAt && r.sentAt
      );
      const totalTimeToSend = sentReportsWithDates.reduce((sum, report) => {
        const created = new Date(report.createdAt);
        const sent = new Date(report.sentAt);
        return sum + (sent.getTime() - created.getTime());
      }, 0);
      const averageTimeToSend =
        sentReportsWithDates.length > 0
          ? totalTimeToSend / (sentReportsWithDates.length * 24 * 60 * 60 * 1000)
          : 0;

      // Critical Issues
      const currentIssues = filteredReports
        .flatMap(report =>
          (report.issuesFound || []).map((issue: any, index: number) => ({
            id: `${report.id}-${index}`,
            description: issue.description,
            severity: issue.severity || 'Medium',
            assignedInspector: report.createdByName || 'Unknown',
            createdAt: report.createdAt,
            status: 'Open' as const,
          }))
        )
        .filter(issue => issue.severity === 'Critical' || issue.severity === 'High')
        .slice(0, 10);

      const resolvedIssues = currentIssues.filter(issue => issue.status === 'Resolved').length;
      const issueResolutionRate =
        currentIssues.length > 0 ? (resolvedIssues / currentIssues.length) * 100 : 0;

      // Employee Performance
      const employeeData = new Map();
      filteredReports.forEach(report => {
        const employee = report.createdByName || 'Unknown';
        if (!employeeData.has(employee)) {
          employeeData.set(employee, { name: employee, count: 0, revenue: 0 });
        }
        const data = employeeData.get(employee);
        data.count += 1;
        data.revenue += report.estimatedCost || 0;
      });

      const reportsPerEmployee = Array.from(employeeData.values()).sort(
        (a, b) => b.count - a.count
      );

      const branchPerformance = Array.from(branchData.values()).map(branch => ({
        ...branch,
        efficiency: branch.count > 0 ? branch.revenue / branch.count : 0,
      }));

      // Monthly Trends (simplified)
      const monthlyTrends = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthReports = filteredReports.filter(r => {
          const reportDate = new Date(r.createdAt || r.inspectionDate);
          return (
            reportDate.getMonth() === date.getMonth() &&
            reportDate.getFullYear() === date.getFullYear()
          );
        });
        monthlyTrends.push({
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          reports: monthReports.length,
          revenue: monthReports.reduce((sum, r) => sum + (r.estimatedCost || 0), 0),
        });
      }

      // Filter service agreements by branch and timeframe
      const filteredAgreements = serviceAgreements.filter(agreement => {
        const agreementDate = new Date(agreement.createdAt);
        const timeMatch = agreementDate >= cutoffDate;
        
        let branchMatch;
        if (currentUser?.role === 'superadmin') {
          branchMatch = branch === 'all' || agreement.branchId === branch;
        } else {
          branchMatch = agreement.branchId === currentUser?.branchId;
        }
        
        return timeMatch && branchMatch;
      });

      // Calculate service agreement metrics
      const totalServiceAgreements = filteredAgreements.length;
      const activeServiceAgreements = filteredAgreements.filter(a => a.status === 'active').length;
      const serviceAgreementRevenue = filteredAgreements
        .filter(a => a.status === 'active')
        .reduce((sum, a) => sum + (a.price || 0), 0);

      // Service agreements by type
      const agreementTypeData = new Map();
      filteredAgreements.forEach(agreement => {
        const type = agreement.agreementType || 'other';
        if (!agreementTypeData.has(type)) {
          agreementTypeData.set(type, { type, count: 0, revenue: 0 });
        }
        const data = agreementTypeData.get(type);
        data.count += 1;
        if (agreement.status === 'active') {
          data.revenue += agreement.price || 0;
        }
      });
      const serviceAgreementsByType = Array.from(agreementTypeData.values());

      // Service agreements by status
      const agreementStatusData = new Map();
      filteredAgreements.forEach(agreement => {
        const status = agreement.status || 'pending';
        if (!agreementStatusData.has(status)) {
          agreementStatusData.set(status, { status, count: 0, revenue: 0 });
        }
        const data = agreementStatusData.get(status);
        data.count += 1;
        if (status === 'active') {
          data.revenue += agreement.price || 0;
        }
      });
      const serviceAgreementsByStatus = Array.from(agreementStatusData.values());

      // Filter offers by branch and timeframe
      const filteredOffers = offers.filter(offer => {
        const offerDate = new Date(offer.createdAt);
        const timeMatch = offerDate >= cutoffDate;
        
        let branchMatch;
        if (currentUser?.role === 'superadmin') {
          branchMatch = branch === 'all' || offer.branchId === branch;
        } else {
          branchMatch = offer.branchId === currentUser?.branchId;
        }
        
        return timeMatch && branchMatch;
      });

      // Calculate offer revenue (only accepted offers)
      const offerRevenue = filteredOffers
        .filter(o => o.status === 'accepted')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      // Calculate total business revenue (reports + offers + service agreements)
      const totalBusinessRevenue = totalRevenue + offerRevenue + serviceAgreementRevenue;

      // Calculate monthly earnings
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyReports = reports.filter(r => {
        const reportDate = new Date(r.createdAt || r.inspectionDate);
        return reportDate >= startOfMonth && (
          currentUser?.role === 'superadmin' ? (branch === 'all' || r.branchId === branch) : r.branchId === currentUser?.branchId
        );
      });
      const monthlyReportRevenue = monthlyReports.reduce((sum, r) => sum + (r.estimatedCost || 0), 0);
      
      const monthlyAgreements = serviceAgreements.filter(a => {
        const agreementDate = new Date(a.createdAt);
        return agreementDate >= startOfMonth && (
          currentUser?.role === 'superadmin' ? (branch === 'all' || a.branchId === branch) : a.branchId === currentUser?.branchId
        );
      });
      const monthlyAgreementRevenue = monthlyAgreements
        .filter(a => a.status === 'active')
        .reduce((sum, a) => sum + (a.price || 0), 0);
      
      const monthlyOffers = offers.filter(o => {
        const offerDate = new Date(o.createdAt);
        return offerDate >= startOfMonth && (
          currentUser?.role === 'superadmin' ? (branch === 'all' || o.branchId === branch) : o.branchId === currentUser?.branchId
        );
      });
      const monthlyOfferRevenue = monthlyOffers
        .filter(o => o.status === 'accepted')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      
      const monthlyEarnings = monthlyReportRevenue + monthlyOfferRevenue + monthlyAgreementRevenue;

      // Calculate yearly earnings
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const yearlyReports = reports.filter(r => {
        const reportDate = new Date(r.createdAt || r.inspectionDate);
        return reportDate >= startOfYear && (
          currentUser?.role === 'superadmin' ? (branch === 'all' || r.branchId === branch) : r.branchId === currentUser?.branchId
        );
      });
      const yearlyReportRevenue = yearlyReports.reduce((sum, r) => sum + (r.estimatedCost || 0), 0);
      
      const yearlyAgreements = serviceAgreements.filter(a => {
        const agreementDate = new Date(a.createdAt);
        return agreementDate >= startOfYear && (
          currentUser?.role === 'superadmin' ? (branch === 'all' || a.branchId === branch) : a.branchId === currentUser?.branchId
        );
      });
      const yearlyAgreementRevenue = yearlyAgreements
        .filter(a => a.status === 'active')
        .reduce((sum, a) => sum + (a.price || 0), 0);
      
      const yearlyOffers = offers.filter(o => {
        const offerDate = new Date(o.createdAt);
        return offerDate >= startOfYear && (
          currentUser?.role === 'superadmin' ? (branch === 'all' || o.branchId === branch) : o.branchId === currentUser?.branchId
        );
      });
      const yearlyOfferRevenue = yearlyOffers
        .filter(o => o.status === 'accepted')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      
      const yearlyEarnings = yearlyReportRevenue + yearlyOfferRevenue + yearlyAgreementRevenue;

      return {
        totalReports,
        reportsThisMonth,
        totalRevenue,
        totalBusinessRevenue,
        monthlyEarnings,
        yearlyEarnings,
        averageReportValue,
        completionRate,
        criticalIssueRate,
        uniqueCustomers,
        newCustomers: Math.floor(uniqueCustomers * 0.3), // Placeholder calculation
        returningCustomers: Math.floor(uniqueCustomers * 0.7),
        topCustomers,
        reportsByRoofType,
        reportsByBranch,
        averageTimeToSend,
        currentIssues,
        issueResolutionRate,
        reportsPerEmployee,
        branchPerformance,
        monthlyTrends,
        issueTrends: monthlyTrends.map(month => ({
          month: month.month,
          critical: Math.floor(Math.random() * 5),
          resolved: Math.floor(Math.random() * 3),
        })),
        totalServiceAgreements,
        activeServiceAgreements,
        serviceAgreementRevenue,
        serviceAgreementsByType,
        serviceAgreementsByStatus,
      };
    },
    [currentUser]
  );

  // Note: Removed memoizedAnalytics to prevent infinite loops

  // Effect for calculating analytics when reports change
  useEffect(() => {
    if (!currentUser || !reports) return;

    const calculateAnalyticsData = async () => {
      setLoading(true);
      setLoadingProgress(0);
      setLoadingMessage('Calculating analytics...');

      try {
        // Step 1: Process data
        setLoadingProgress(40);
        setLoadingMessage('Processing data...');

        // Debug: Log reports data
        logger.log('🔍 Analytics Debug - Reports received:', reports.length);
        logger.log('🔍 Analytics Debug - Reports data:', reports);
        logger.log(
          '🔍 Analytics Debug - Current user:',
          currentUser?.email,
          'Permission Level:',
          currentUser?.permissionLevel
        );

        // Step 2: Calculate analytics
        setLoadingProgress(60);
        setLoadingMessage('Calculating metrics...');

        // Calculate analytics directly
        const data = calculateAnalytics(reports, serviceAgreements, offers, selectedTimeframe, selectedBranch);

        // Debug: Log calculated data
        logger.log('🔍 Analytics Debug - Calculated data:', data);

        // Step 3: Finalize
        setLoadingProgress(80);
        setLoadingMessage('Finalizing analytics...');

        await new Promise(resolve => setTimeout(resolve, 100));

        setAnalyticsData(data);

        // Complete
        setLoadingProgress(100);
        setLoadingMessage('Analytics ready!');

        // Small delay before hiding loading
        setTimeout(() => {
          setLoading(false);
        }, 300);
      } catch (error) {
        console.error('Error in analytics:', error);
        setLoadingMessage('Error loading analytics');
        setLoading(false);
      }
    };

    calculateAnalyticsData();
  }, [reports, serviceAgreements, offers, selectedTimeframe, selectedBranch, calculateAnalytics, currentUser]);

  // Fetch service agreements and offers
  useEffect(() => {
    if (!currentUser) return;

    const fetchAdditionalData = async () => {
      try {
        // Fetch service agreements
        const branchId = currentUser.role === 'superadmin' ? undefined : currentUser.branchId;
        const agreements = await getServiceAgreements(branchId);
        setServiceAgreements(agreements);

        // Fetch offers
        const offersData = await getOffers(currentUser);
        setOffers(offersData);
      } catch (error) {
        console.error('Error fetching additional data:', error);
      }
    };

    fetchAdditionalData();
  }, [currentUser]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const exportData = (format: 'csv' | 'excel') => {
    // Placeholder for export functionality
    logger.log(`Exporting data as ${format}`);
  };

  const Tooltip: React.FC<{ content: string; children: React.ReactNode; id: string }> = ({
    content,
    children,
    id,
  }) => (
    <div
      className='relative inline-block'
      onMouseEnter={() => setHoveredElement(id)}
      onMouseLeave={() => setHoveredElement(null)}
    >
      {children}
      {hoveredElement === id && (
        <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg shadow-lg z-50 whitespace-nowrap'>
          {content}
          <div className='absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900'></div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className='min-h-screen bg-slate-50 flex items-center justify-center'>
        <div className='bg-white rounded-lg shadow-lg p-8 max-w-4xl w-full mx-4'>
          <LoadingProgress
            message={loadingMessage}
            progress={loadingProgress}
            showSteps={true}
            className='min-h-96'
          />
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className='text-center py-8'>
        <p className='text-slate-500'>No analytics data available</p>
      </div>
    );
  }

  return (
    <div className='space-y-6 font-material max-w-7xl mx-auto bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen py-8'>
      {/* Material Design Header */}
      <div className='bg-white p-8 rounded-xl shadow-sm border border-slate-200'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-3xl font-bold text-slate-900 flex items-center tracking-tight'>
              <BarChart3 className='w-8 h-8 mr-3 text-slate-600' />
              {t('analytics.dashboard')}
            </h2>
            <p className='text-base text-slate-600 mt-2'>{t('analytics.comprehensiveInsights')}</p>
          </div>
        <div className='flex items-center space-x-4'>
          <div className='flex items-center space-x-2 text-sm text-slate-500'>
            <Calendar className='w-4 h-4' />
            <span>{t('common.lastUpdated')}: {new Date().toLocaleDateString()}</span>
          </div>


          <Tooltip content={t('common.filterDataByTimeframe')} id='filter-tooltip'>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors shadow-sm ${
                showFilters
                  ? 'bg-slate-200 text-slate-900 border border-slate-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Filter className='w-4 h-4' />
              <span>{t('common.filters')}</span>
            </button>
          </Tooltip>

          <Tooltip content={t('common.exportAnalyticsData')} id='export-tooltip'>
            <div className='relative'>
              <button
                onClick={() => exportData('csv')}
                className='flex items-center space-x-2 px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-sm transition-colors shadow-sm'
              >
                <Download className='w-4 h-4' />
                <span>{t('common.buttons.export')}</span>
              </button>
            </div>
          </Tooltip>
        </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className='bg-white p-4 rounded-xl shadow-sm border border-slate-200'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <label className='block text-sm font-medium text-slate-700 mb-2'>{t('common.timeframe')}</label>
              <select
                value={selectedTimeframe}
                onChange={e => setSelectedTimeframe(e.target.value as any)}
                className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 shadow-sm'
              >
                <option value='7d'>{t('analytics.last7Days')}</option>
                <option value='30d'>{t('analytics.last30Days')}</option>
                <option value='90d'>{t('analytics.last90Days')}</option>
                <option value='1y'>{t('analytics.lastYear')}</option>
              </select>
            </div>
            <div>
              <label className='block text-sm font-medium text-slate-700 mb-2'>{t('common.branch')}</label>
              <select
                value={selectedBranch}
                onChange={e => setSelectedBranch(e.target.value)}
                className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 shadow-sm'
                disabled={currentUser?.role !== 'superadmin'} // Only superadmin can change branch filter
              >
                {currentUser?.role === 'superadmin' ? (
                  <>
                    <option value='all'>{t('analytics.allBranches')}</option>
                    <option value='main'>Main Office</option>
                    <option value='malmo'>Malmö</option>
                    <option value='goteborg'>Göteborg</option>
                    <option value='stockholm'>Stockholm</option>
                  </>
                ) : (
                  <option value={currentUser?.branchId || 'malmo'}>
                    {currentUser?.branchId === 'main' ? 'Main Office' :
                     currentUser?.branchId === 'malmo' ? 'Malmö' :
                     currentUser?.branchId === 'goteborg' ? 'Göteborg' :
                     currentUser?.branchId === 'stockholm' ? 'Stockholm' :
                     'Your Branch'}
                  </option>
                )}
              </select>
              {currentUser?.role !== 'superadmin' && (
                <p className='text-xs text-slate-500 mt-1'>
                  {t('analytics.branchFilterNote')}
                </p>
              )}
            </div>
            <div className='flex items-end'>
              <button
                onClick={() => setShowFilters(false)}
                className='w-full px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-sm font-medium shadow-sm transition-colors'
              >
                {t('common.applyFilters')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPIs & Metrics */}
      <div className='bg-white rounded-xl shadow-sm border border-slate-200'>
        <div
          className='flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 border-b border-slate-200'
          onClick={() => toggleSection('kpis')}
        >
          <h3 className='text-lg font-semibold text-slate-900 flex items-center'>
            <BarChart3 className='w-5 h-5 mr-2 text-slate-600' />
{t('analytics.kpisMetrics')}
          </h3>
          {expandedSections.has('kpis') ? (
            <ChevronUp className='w-5 h-5 text-slate-600' />
          ) : (
            <ChevronDown className='w-5 h-5 text-slate-600' />
          )}
        </div>
        {expandedSections.has('kpis') && (
          <div className='px-6 pb-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6'>
              <Tooltip
                content='Total number of reports created in the selected timeframe'
                id='total-reports-tooltip'
              >
                <div className='bg-white border-2 border-slate-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-all'>
                  <div className='flex items-center justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center mb-2'>
                        <div className='w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mr-2'>
                          <FileText className='w-4 h-4 text-slate-600' />
                        </div>
                        <p className='text-slate-600 text-sm font-medium'>
{t('analytics.totalReports')}
                        </p>
                      </div>
                      <p className='text-3xl font-bold text-slate-900 mb-1'>{analyticsData.totalReports}</p>
                      <p className='text-slate-500 text-sm flex items-center'>
                        <TrendingUp className='w-3 h-3 mr-1' />+{analyticsData.reportsThisMonth}{' '}
                        {t('analytics.thisMonth')}
                      </p>
                    </div>
                  </div>
                </div>
              </Tooltip>

              <Tooltip
                content='Total revenue generated from all reports in the selected timeframe'
                id='total-revenue-tooltip'
              >
                <div className='bg-white border-2 border-slate-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-all'>
                  <div className='flex items-center justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center mb-2'>
                        <div className='w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mr-2'>
                          <DollarSign className='w-4 h-4 text-slate-600' />
                        </div>
                        <p className='text-slate-600 text-sm font-medium'>
{t('analytics.totalRevenue')}
                        </p>
                      </div>
                      <p className='text-3xl font-bold text-slate-900 mb-1'>
                        {formatCurrencyAmount(analyticsData.totalRevenue, currentLocale)}
                      </p>
                      <p className='text-slate-500 text-sm flex items-center'>
                        <Target className='w-3 h-3 mr-1' />
                        Avg: {formatCurrencyAmount(Math.round(analyticsData.averageReportValue), currentLocale)}
                      </p>
                    </div>
                  </div>
                </div>
              </Tooltip>

              <Tooltip
                content='Percentage of reports that have been completed and sent to customers'
                id='completion-rate-tooltip'
              >
                <div className='bg-white border-2 border-slate-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-all'>
                  <div className='flex items-center justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center mb-2'>
                        <div className='w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mr-2'>
                          <CheckCircle className='w-4 h-4 text-slate-600' />
                        </div>
                        <p className='text-slate-600 text-sm font-medium'>
{t('analytics.completionRate')}
                        </p>
                      </div>
                      <p className='text-3xl font-bold text-slate-900 mb-1'>
                        {Math.round(analyticsData.completionRate)}%
                      </p>
                      <p className='text-slate-500 text-sm flex items-center'>
                        <Award className='w-3 h-3 mr-1' />
                        {t('analytics.reportsSent')}
                      </p>
                    </div>
                  </div>
                </div>
              </Tooltip>

              <Tooltip
                content='Percentage of reports containing critical or high-severity issues'
                id='critical-issues-tooltip'
              >
                <div className='bg-white border-2 border-slate-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-all'>
                  <div className='flex items-center justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center mb-2'>
                        <div className='w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mr-2'>
                          <AlertTriangle className='w-4 h-4 text-slate-600' />
                        </div>
                        <p className='text-slate-600 text-sm font-medium'>
{t('analytics.criticalIssues')}
                        </p>
                      </div>
                      <p className='text-3xl font-bold text-slate-900 mb-1'>
                        {Math.round(analyticsData.criticalIssueRate)}%
                      </p>
                      <p className='text-slate-500 text-sm flex items-center'>
                        <Shield className='w-3 h-3 mr-1' />
                        {t('analytics.ofAllReports')}
                      </p>
                    </div>
                  </div>
                </div>
              </Tooltip>
            </div>

            {/* Additional Revenue Metrics */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
              <Tooltip
                content='Total revenue from reports, offers, and service agreements'
                id='total-business-revenue-tooltip'
              >
                <div className='bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-all'>
                  <div className='flex items-center justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center mb-2'>
                        <div className='w-8 h-8 bg-blue-200 rounded-lg flex items-center justify-center mr-2'>
                          <DollarSign className='w-4 h-4 text-blue-700' />
                        </div>
                        <p className='text-blue-700 text-sm font-medium'>
                          {t('analytics.totalBusinessRevenue') || 'Total Business Revenue'}
                        </p>
                      </div>
                      <p className='text-3xl font-bold text-blue-900 mb-1'>
                        {formatCurrencyAmount(analyticsData.totalBusinessRevenue, currentLocale)}
                      </p>
                      <p className='text-blue-600 text-sm flex items-center'>
                        <TrendingUp className='w-3 h-3 mr-1' />
                        All revenue sources
                      </p>
                    </div>
                  </div>
                </div>
              </Tooltip>

              <Tooltip
                content='Total earnings this month from all sources'
                id='monthly-earnings-tooltip'
              >
                <div className='bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-all'>
                  <div className='flex items-center justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center mb-2'>
                        <div className='w-8 h-8 bg-green-200 rounded-lg flex items-center justify-center mr-2'>
                          <Calendar className='w-4 h-4 text-green-700' />
                        </div>
                        <p className='text-green-700 text-sm font-medium'>
                          {t('analytics.monthlyEarnings') || 'Monthly Earnings'}
                        </p>
                      </div>
                      <p className='text-3xl font-bold text-green-900 mb-1'>
                        {formatCurrencyAmount(analyticsData.monthlyEarnings, currentLocale)}
                      </p>
                      <p className='text-green-600 text-sm flex items-center'>
                        <TrendingUp className='w-3 h-3 mr-1' />
                        This month
                      </p>
                    </div>
                  </div>
                </div>
              </Tooltip>

              <Tooltip
                content='Total earnings this year from all sources'
                id='yearly-earnings-tooltip'
              >
                <div className='bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-all'>
                  <div className='flex items-center justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center mb-2'>
                        <div className='w-8 h-8 bg-purple-200 rounded-lg flex items-center justify-center mr-2'>
                          <Award className='w-4 h-4 text-purple-700' />
                        </div>
                        <p className='text-purple-700 text-sm font-medium'>
                          {t('analytics.yearlyEarnings') || 'Yearly Earnings'}
                        </p>
                      </div>
                      <p className='text-3xl font-bold text-purple-900 mb-1'>
                        {formatCurrencyAmount(analyticsData.yearlyEarnings, currentLocale)}
                      </p>
                      <p className='text-purple-600 text-sm flex items-center'>
                        <TrendingUp className='w-3 h-3 mr-1' />
                        This year
                      </p>
                    </div>
                  </div>
                </div>
              </Tooltip>
            </div>

            {/* Report Trends Chart */}
            <div className='bg-slate-50 p-6 rounded-xl border border-slate-200'>
              <h4 className='text-lg font-semibold text-slate-900 mb-4 flex items-center'>
                <LineChart className='w-5 h-5 mr-2 text-slate-600' />
{t('analytics.reportTrends')}
              </h4>
              <div className='h-80'>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={analyticsData.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="reports" stroke="#3b82f6" name={t('analytics.reports')} />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" name={t('analytics.revenue')} />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Report Status Overview */}
            <div className='mt-6'>
              <h4 className='text-lg font-semibold text-slate-900 mb-4 flex items-center'>
                <Activity className='w-5 h-5 mr-2 text-slate-600' />
                {t('analytics.reportStatusOverview')}
              </h4>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='bg-white p-4 rounded-lg border border-slate-200 shadow-sm'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-slate-900 font-semibold text-2xl'>2</p>
                      <p className='text-slate-700 text-sm font-medium'>{t('analytics.draftReportsInProgress')}</p>
                      <p className='text-slate-500 text-xs'>In progress</p>
                    </div>
                    <div className='bg-slate-100 p-3 rounded-lg'>
                      <FileText className='w-6 h-6 text-slate-600' />
                    </div>
                  </div>
                </div>

                <div className='bg-white p-4 rounded-lg border border-slate-200 shadow-sm'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-slate-900 font-semibold text-2xl'>2</p>
                      <p className='text-slate-700 text-sm font-medium'>{t('analytics.sentReportsCompleted')}</p>
                      <p className='text-slate-500 text-xs'>Completed</p>
                    </div>
                    <div className='bg-slate-100 p-3 rounded-lg'>
                      <CheckCircle className='w-6 h-6 text-slate-600' />
                    </div>
                  </div>
                </div>

                <div className='bg-white p-4 rounded-lg border border-slate-200 shadow-sm'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-slate-900 font-semibold text-2xl'>1</p>
                      <p className='text-slate-700 text-sm font-medium'>{t('analytics.archivedReportsStored')}</p>
                      <p className='text-slate-500 text-xs'>Stored</p>
                    </div>
                    <div className='bg-slate-100 p-3 rounded-lg'>
                      <XCircle className='w-6 h-6 text-slate-600' />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Customer Insights */}
      <div className='bg-white rounded-xl shadow-sm border border-slate-200'>
        <div
          className='flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 transition-colors'
          onClick={() => toggleSection('customers')}
        >
          <h3 className='text-lg font-semibold text-slate-900 flex items-center'>
            <Users className='w-5 h-5 mr-2 text-slate-600' />
            {t('analytics.customerInsights')}
          </h3>
          {expandedSections.has('customers') ? (
            <ChevronUp className='w-5 h-5 text-slate-600' />
          ) : (
            <ChevronDown className='w-5 h-5 text-slate-600' />
          )}
        </div>
        {expandedSections.has('customers') && (
          <div className='px-6 pb-6'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <div>
                <h4 className='text-lg font-semibold text-slate-900 mb-4'>
                  {t('analytics.topCustomersByRevenue')}
                </h4>
                <div className='space-y-3'>
                  {analyticsData.topCustomers.map((customer, index) => (
                    <div
                      key={customer.name}
                      className='flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200'
                    >
                      <div className='flex items-center'>
                        <div className='w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-700 font-semibold text-sm'>
                          {index + 1}
                        </div>
                        <div className='ml-3'>
                          <p className='font-medium text-slate-900'>{customer.name}</p>
                          <p className='text-sm text-slate-600 flex items-center'>
                            <MapPin className='w-3 h-3 mr-1' />
                            {customer.location}
                          </p>
                        </div>
                      </div>
                      <div className='text-right'>
                        <p className='font-semibold text-slate-900'>
                          {formatCurrencyAmount(customer.revenue, currentLocale)}
                        </p>
                        <p className='text-sm text-slate-600'>{customer.reportCount} {t('analytics.reports')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className='text-lg font-semibold text-slate-900 mb-4'>{t('analytics.customerOverview')}</h4>
                <div className='grid grid-cols-2 gap-4 mb-6'>
                  <div className='text-center p-4 bg-white rounded-xl shadow-sm border border-slate-200'>
                    <p className='text-2xl font-bold text-slate-900'>
                      {analyticsData.uniqueCustomers}
                    </p>
                    <p className='text-sm text-slate-600 font-medium'>{t('analytics.totalCustomers')}</p>
                  </div>
                  <div className='text-center p-4 bg-white rounded-xl shadow-sm border border-slate-200'>
                    <p className='text-2xl font-bold text-slate-900'>
                      {analyticsData.newCustomers}
                    </p>
                    <p className='text-sm text-slate-600 font-medium'>{t('analytics.newThisPeriod')}</p>
                  </div>
                </div>

                <div className='bg-slate-50 p-4 rounded-xl border border-slate-200'>
                  <h5 className='font-semibold text-slate-900 mb-2'>{t('analytics.newVsReturning')}</h5>
                  <div className='flex items-center space-x-4'>
                    <div className='flex-1'>
                      <div className='flex justify-between text-sm mb-1'>
                        <span className='text-slate-700'>{t('analytics.new')}</span>
                        <span className='text-slate-900 font-medium'>{analyticsData.newCustomers}</span>
                      </div>
                      <div className='w-full bg-slate-200 rounded-full h-2'>
                        <div
                          className='bg-slate-600 h-2 rounded-full'
                          style={{
                            width: `${(analyticsData.newCustomers / analyticsData.uniqueCustomers) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className='flex-1'>
                      <div className='flex justify-between text-sm mb-1'>
                        <span className='text-slate-700'>{t('analytics.returning')}</span>
                        <span className='text-slate-900 font-medium'>{analyticsData.returningCustomers}</span>
                      </div>
                      <div className='w-full bg-slate-200 rounded-full h-2'>
                        <div
                          className='bg-slate-700 h-2 rounded-full'
                          style={{
                            width: `${(analyticsData.returningCustomers / analyticsData.uniqueCustomers) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Report Insights */}
      <div className='bg-white rounded-lg shadow'>
        <div
          className='flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50'
          onClick={() => toggleSection('reports')}
        >
          <h3 className='text-lg font-semibold text-slate-900 flex items-center'>
            <FileText className='w-5 h-5 mr-2' />
            {t('analytics.reportInsights')}
          </h3>
          {expandedSections.has('reports') ? (
            <ChevronUp className='w-5 h-5' />
          ) : (
            <ChevronDown className='w-5 h-5' />
          )}
        </div>
        {expandedSections.has('reports') && (
          <div className='px-6 pb-6'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <div>
                <h4 className='text-lg font-semibold text-slate-900 mb-4'>{t('analytics.reportsByRoofType')}</h4>
                <div className='h-80'>
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={analyticsData.reportsByRoofType}
                        dataKey="count"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {analyticsData.reportsByRoofType.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h4 className='text-lg font-semibold text-slate-900 mb-4'>{t('analytics.branchPerformance')}</h4>
                <div className='h-80'>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.branchPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="branch" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#3b82f6" name={t('analytics.reports')} />
                      <Bar dataKey="revenue" fill="#10b981" name={t('analytics.revenue')} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className='mt-6 grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='text-center p-4 bg-blue-50 rounded-lg'>
                <Clock className='w-8 h-8 text-blue-600 mx-auto mb-2' />
                <p className='text-2xl font-bold text-blue-600'>
                  {Math.round(analyticsData.averageTimeToSend)}
                </p>
                <p className='text-sm text-blue-600'>{t('analytics.avgDaysToSend')}</p>
              </div>
              <div className='text-center p-4 bg-green-50 rounded-lg'>
                <CheckCircle className='w-8 h-8 text-green-600 mx-auto mb-2' />
                <p className='text-2xl font-bold text-green-600'>
                  {Math.round(analyticsData.completionRate)}%
                </p>
                <p className='text-sm text-green-600'>{t('analytics.completionRate')}</p>
              </div>
              <div className='text-center p-4 bg-purple-50 rounded-lg'>
                <Activity className='w-8 h-8 text-purple-600 mx-auto mb-2' />
                <p className='text-2xl font-bold text-purple-600'>
                  {analyticsData.reportsByRoofType.length}
                </p>
                <p className='text-sm text-purple-600'>{t('analytics.roofTypes')}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Service Agreements */}
      <div className='bg-white rounded-xl shadow-sm border border-slate-200'>
        <div
          className='flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 transition-colors'
          onClick={() => toggleSection('serviceAgreements')}
        >
          <h3 className='text-lg font-semibold text-slate-900 flex items-center'>
            <FileCheck className='w-5 h-5 mr-2 text-slate-600' />
            {t('analytics.serviceAgreements') || 'Service Agreements'}
          </h3>
          {expandedSections.has('serviceAgreements') ? (
            <ChevronUp className='w-5 h-5 text-slate-600' />
          ) : (
            <ChevronDown className='w-5 h-5 text-slate-600' />
          )}
        </div>
        {expandedSections.has('serviceAgreements') && (
          <div className='px-6 pb-6'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
              <div className='bg-white border-2 border-slate-200 p-6 rounded-xl shadow-sm'>
                <div className='flex items-center mb-2'>
                  <FileCheck className='w-5 h-5 text-slate-600 mr-2' />
                  <p className='text-slate-600 text-sm font-medium'>
                    {t('analytics.totalServiceAgreements') || 'Total Agreements'}
                  </p>
                </div>
                <p className='text-3xl font-bold text-slate-900'>
                  {analyticsData.totalServiceAgreements}
                </p>
              </div>
              <div className='bg-white border-2 border-green-200 p-6 rounded-xl shadow-sm'>
                <div className='flex items-center mb-2'>
                  <CheckCircle className='w-5 h-5 text-green-600 mr-2' />
                  <p className='text-green-600 text-sm font-medium'>
                    {t('analytics.activeServiceAgreements') || 'Active Agreements'}
                  </p>
                </div>
                <p className='text-3xl font-bold text-green-900'>
                  {analyticsData.activeServiceAgreements}
                </p>
              </div>
              <div className='bg-white border-2 border-blue-200 p-6 rounded-xl shadow-sm'>
                <div className='flex items-center mb-2'>
                  <DollarSign className='w-5 h-5 text-blue-600 mr-2' />
                  <p className='text-blue-600 text-sm font-medium'>
                    {t('analytics.serviceAgreementRevenue') || 'Agreement Revenue'}
                  </p>
                </div>
                <p className='text-3xl font-bold text-blue-900'>
                  {formatCurrencyAmount(analyticsData.serviceAgreementRevenue, currentLocale)}
                </p>
              </div>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <div>
                <h4 className='text-lg font-semibold text-slate-900 mb-4'>
                  {t('analytics.serviceAgreementsByType') || 'Agreements by Type'}
                </h4>
                <div className='h-80'>
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={analyticsData.serviceAgreementsByType}
                        dataKey="count"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {analyticsData.serviceAgreementsByType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h4 className='text-lg font-semibold text-slate-900 mb-4'>
                  {t('analytics.serviceAgreementsByStatus') || 'Agreements by Status'}
                </h4>
                <div className='space-y-3'>
                  {analyticsData.serviceAgreementsByStatus.map((status, index) => (
                    <div
                      key={status.status}
                      className='flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200'
                    >
                      <div className='flex items-center'>
                        <div
                          className='w-4 h-4 rounded-full mr-3'
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div>
                          <p className='font-medium text-slate-900 capitalize'>{status.status}</p>
                          <p className='text-sm text-slate-600'>{status.count} {t('analytics.agreements') || 'agreements'}</p>
                        </div>
                      </div>
                      <div className='text-right'>
                        <p className='font-semibold text-slate-900'>
                          {formatCurrencyAmount(status.revenue, currentLocale)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Critical Issues Tracking */}
      <div className='bg-white rounded-xl shadow-sm border border-slate-200'>
        <div
          className='flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 transition-colors'
          onClick={() => toggleSection('issues')}
        >
          <h3 className='text-lg font-semibold text-slate-900 flex items-center'>
            <AlertTriangle className='w-5 h-5 mr-2 text-slate-600' />
            {t('analytics.criticalIssuesTracking')}
          </h3>
          {expandedSections.has('issues') ? (
            <ChevronUp className='w-5 h-5 text-slate-600' />
          ) : (
            <ChevronDown className='w-5 h-5 text-slate-600' />
          )}
        </div>
        {expandedSections.has('issues') && (
          <div className='px-6 pb-6'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <div>
                <h4 className='text-lg font-semibold text-slate-900 mb-4'>{t('analytics.currentIssues')}</h4>
                <div className='space-y-3'>
                  {analyticsData.currentIssues.map((issue) => (
                    <div key={issue.id} className='p-3 border border-slate-200 rounded-lg bg-white'>
                      <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                          <p className='font-medium text-slate-900'>{issue.description}</p>
                          <p className='text-sm text-slate-600'>
                            {t('analytics.assignedTo')}: {issue.assignedInspector}
                          </p>
                        </div>
                        <div className='flex items-center space-x-2'>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              issue.severity === 'Critical'
                                ? 'bg-slate-200 text-slate-800'
                                : issue.severity === 'High'
                                  ? 'bg-slate-200 text-slate-800'
                                  : issue.severity === 'Medium'
                                    ? 'bg-slate-100 text-slate-700'
                                    : 'bg-slate-50 text-slate-600'
                            }`}
                          >
                            {issue.severity}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              issue.status === 'Resolved'
                                ? 'bg-slate-200 text-slate-800'
                                : issue.status === 'In Progress'
                                  ? 'bg-slate-200 text-slate-800'
                                  : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {issue.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className='text-lg font-semibold text-slate-900 mb-4'>{t('analytics.issueStatistics')}</h4>
                <div className='space-y-4'>
                  <div className='text-center p-4 bg-white rounded-xl shadow-sm border border-slate-200'>
                    <p className='text-2xl font-bold text-slate-900'>
                      {analyticsData.currentIssues.length}
                    </p>
                    <p className='text-sm text-slate-600 font-medium'>{t('analytics.openIssues')}</p>
                  </div>
                  <div className='text-center p-4 bg-white rounded-xl shadow-sm border border-slate-200'>
                    <p className='text-2xl font-bold text-slate-900'>
                      {Math.round(analyticsData.issueResolutionRate)}%
                    </p>
                    <p className='text-sm text-slate-600 font-medium'>{t('analytics.resolutionRate')}</p>
                  </div>
                  <div className='text-center p-4 bg-white rounded-xl shadow-sm border border-slate-200'>
                    <p className='text-2xl font-bold text-slate-900'>
                      {Math.round(analyticsData.criticalIssueRate)}%
                    </p>
                    <p className='text-sm text-slate-600 font-medium'>{t('analytics.criticalIssueRate')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User & Branch Management */}
      <div className='bg-white rounded-lg shadow'>
        <div
          className='flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50'
          onClick={() => toggleSection('management')}
        >
          <h3 className='text-lg font-semibold text-slate-900 flex items-center'>
            <Building className='w-5 h-5 mr-2' />
            {t('analytics.userBranchManagement')}
          </h3>
          {expandedSections.has('management') ? (
            <ChevronUp className='w-5 h-5' />
          ) : (
            <ChevronDown className='w-5 h-5' />
          )}
        </div>
        {expandedSections.has('management') && (
          <div className='px-6 pb-6'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <div>
                <h4 className='text-lg font-semibold text-gray-900 mb-4'>{t('analytics.reportsPerEmployee')}</h4>
                <div className='space-y-3'>
                  {analyticsData.reportsPerEmployee.map((employee, index) => (
                    <div
                      key={employee.name}
                      className='flex items-center justify-between p-3 bg-slate-50 rounded-lg'
                    >
                      <div className='flex items-center'>
                        <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm'>
                          {index + 1}
                        </div>
                        <div className='ml-3'>
                          <p className='font-medium text-slate-900'>{employee.name}</p>
                          <p className='text-sm text-slate-600'>{t('analytics.inspector')}</p>
                        </div>
                      </div>
                      <div className='text-right'>
                        <p className='font-semibold text-slate-900'>{employee.count} {t('analytics.reports')}</p>
                        <p className='text-sm text-slate-600'>
                          {formatCurrencyAmount(employee.revenue, currentLocale)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className='text-lg font-semibold text-gray-900 mb-4'>
                  {t('analytics.branchPerformanceComparison')}
                </h4>
                <div className='space-y-3'>
                  {analyticsData.branchPerformance.map((branch) => (
                    <div key={branch.branch} className='p-3 border rounded-lg'>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='font-medium text-slate-900'>{branch.branch}</span>
                        <span className='text-sm text-slate-600'>{branch.reports} {t('analytics.reports')}</span>
                      </div>
                      <div className='flex justify-between text-sm text-slate-600 mb-2'>
                        <span>{t('analytics.revenue')}: {formatCurrencyAmount(branch.revenue, currentLocale)}</span>
                        <span>
                          {t('analytics.efficiency')}: {formatCurrencyAmount(Math.round(branch.efficiency), currentLocale)}
                        </span>
                      </div>
                      <div className='w-full bg-slate-200 rounded-full h-2'>
                        <div
                          className='bg-blue-600 h-2 rounded-full'
                          style={{
                            width: `${(branch.reports / Math.max(...analyticsData.branchPerformance.map(b => b.reports))) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
