import { lazy } from 'react';
import LoadingSpinner from './common/LoadingSpinner';
import { lazyWithRetry } from '../utils/chunkRetry';

// Loading fallback component
const LoadingFallback = () => (
  <div className='flex items-center justify-center h-64'>
    <LoadingSpinner size='lg' text='Loading...' />
  </div>
);

// Lazy load main components with chunk retry
export const LazyDashboard = lazyWithRetry(() => import('./Dashboard'));
export const LazyReportForm = lazyWithRetry(() => import('./ReportForm'));
export const LazyReportView = lazyWithRetry(() => import('./ReportView'));
export const LazyAllReports = lazyWithRetry(() => import('./reports/AllReports'));
export const LazyCustomerManagement = lazyWithRetry(() => import('./admin/CustomerManagement'));
export const LazyCustomerProfile = lazyWithRetry(() => import('./admin/CustomerProfile'));
export const LazyUserManagement = lazyWithRetry(() => import('./admin/UserManagement'));
export const LazyBranchManagement = lazyWithRetry(() => import('./admin/BranchManagement'));
export const LazyQATestingPage = lazyWithRetry(() => import('./admin/QATestingPage'));
export const LazyAnalyticsDashboard = lazyWithRetry(() => import('./admin/AnalyticsDashboard'));
export const LazySchedulePage = lazyWithRetry(() => import('./schedule/SchedulePage'));
export const LazyEmailTemplateViewer = lazyWithRetry(() => import('./admin/EmailTemplateViewer'));
export const LazyOffersPage = lazyWithRetry(() => import('./offers/OffersPage'));
export const LazyPublicOfferView = lazyWithRetry(() => import('./offers/PublicOfferView'));
export const LazyUserProfile = lazyWithRetry(() => import('./UserProfile'));
export const LazyOfferThankYou = lazyWithRetry(() => import('./offers/OfferThankYou'));
export const LazyServiceAgreements = lazyWithRetry(() => import('./admin/ServiceAgreements'));
export const LazyPublicServiceAgreementView = lazyWithRetry(
  () => import('./serviceAgreements/PublicServiceAgreementView')
);
export const LazyBuildingESGImprovements = lazyWithRetry(
  () => import('./admin/BuildingESGImprovements')
);
export const LazyESGService = lazyWithRetry(() => import('./admin/ESGService'));
export const LazyESGReportsList = lazyWithRetry(() => import('./admin/ESGReportsList'));
export const LazyPublicESGReportView = lazyWithRetry(() => import('./public/PublicESGReportView'));

// Portal components
export const LazyPortalLayout = lazyWithRetry(() => import('./portal/PortalLayout'));
export const LazyPortalDashboard = lazyWithRetry(() => import('./portal/PortalDashboard'));
export const LazyPortalLogin = lazyWithRetry(() => import('./portal/PortalLogin'));
export const LazyPortalRegister = lazyWithRetry(() => import('./portal/PortalRegister'));
export const LazyBuildingsList = lazyWithRetry(() => import('./portal/BuildingsList'));
export const LazyBuildingDetail = lazyWithRetry(() => import('./portal/BuildingDetail'));
export const LazyServiceAgreementsList = lazyWithRetry(
  () => import('./portal/ServiceAgreementsList')
);
export const LazyPortalServiceAgreementDetail = lazyWithRetry(
  () => import('./portal/PortalServiceAgreementDetail')
);
export const LazyScheduledVisitsList = lazyWithRetry(() => import('./portal/ScheduledVisitsList'));
export const LazyAcceptAppointmentView = lazyWithRetry(
  () => import('./portal/AcceptAppointmentView')
);
export const LazyPortalCustomerProfile = lazyWithRetry(() => import('./portal/CustomerProfile'));

// Lazy load utility components
export const LazyEmailDialog = lazy(() => import('./email/EmailDialog'));
export const LazyEmailTestPanel = lazy(() => import('./email/EmailTestPanel'));
export const LazyNotificationToast = lazy(() => import('./common/NotificationToast'));

// Lazy load form components
export const LazyValidatedInput = lazy(() => import('./ValidatedInput'));
export const LazyFormField = lazy(() => import('./FormField'));

// Lazy load UI components
export const LazyAccessibleButton = lazy(() => import('./AccessibleButton'));
export const LazyAccessibleTable = lazy(() => import('./AccessibleTable'));
export const LazyAccessibleModal = lazy(() => import('./AccessibleModal'));
export const LazyErrorDisplay = lazy(() => import('./ErrorDisplay'));

// Lazy load loading components
export const LazySkeletonLoader = lazy(() => import('./common/SkeletonLoader'));

// Export loading fallback
export { LoadingFallback };
