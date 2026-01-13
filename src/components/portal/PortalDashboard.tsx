import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getBuildingsByCustomer } from '../../services/buildingService';
import { getServiceAgreementsByCustomer } from '../../services/serviceAgreementService';
import { getScheduledVisitsByCustomer } from '../../services/scheduledVisitService';
import { Building, ServiceAgreement, ScheduledVisit } from '../../types';
import { Building as BuildingIcon, FileCheck, Calendar, ArrowRight } from 'lucide-react';
import { useIntl } from '../../hooks/useIntl';
import LoadingSpinner from '../common/LoadingSpinner';

const PortalDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useIntl();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [agreements, setAgreements] = useState<ServiceAgreement[]>([]);
  const [visits, setVisits] = useState<ScheduledVisit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    }
  }, [currentUser]);

  const loadDashboardData = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      // Load buildings - use companyId (linked customer/company document) not user uid
      const customerId = currentUser.companyId || currentUser.uid;
      const buildingsData = await getBuildingsByCustomer(customerId);
      setBuildings(buildingsData);

      // Load service agreements
      const agreementsData = await getServiceAgreementsByCustomer(customerId);
      setAgreements(agreementsData);

      // Load scheduled visits
      const visitsData = await getScheduledVisitsByCustomer(customerId);
      setVisits(visitsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  const activeAgreements = agreements.filter(a => a.status === 'active');
  const upcomingVisits = visits
    .filter(v => v.status === 'scheduled' && new Date(v.scheduledDate) >= new Date())
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
    .slice(0, 5);
  const pendingAcceptances = visits
    .filter(v => v.customerResponse === 'pending' && v.status === 'scheduled')
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-3xl font-bold text-gray-900'>
          {currentUser?.displayName ? t('dashboard.welcomeBack', { name: currentUser.displayName }) : t('dashboard.subtitle')}
        </h1>
        <p className='mt-2 text-gray-600'>{t('dashboard.subtitle')}</p>
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <div className='bg-white rounded-lg shadow p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>{t('navigation.buildings')}</p>
              <p className='text-3xl font-bold text-gray-900 mt-2'>{buildings.length}</p>
            </div>
            <BuildingIcon className='w-12 h-12 text-green-600' />
          </div>
          <Link
            to='/portal/buildings'
            className='mt-4 inline-flex items-center text-sm font-medium text-green-600 hover:text-green-700'
          >
            {t('dashboard.viewAll')} <ArrowRight className='ml-1 w-4 h-4' />
          </Link>
        </div>

        <div className='bg-white rounded-lg shadow p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>{t('analytics.activeServiceAgreements')}</p>
              <p className='text-3xl font-bold text-gray-900 mt-2'>{activeAgreements.length}</p>
            </div>
            <FileCheck className='w-12 h-12 text-blue-600' />
          </div>
          <Link
            to='/portal/service-agreements'
            className='mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700'
          >
            {t('dashboard.viewAll')} <ArrowRight className='ml-1 w-4 h-4' />
          </Link>
        </div>

        <div className='bg-white rounded-lg shadow p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>{t('dashboard.scheduledVisits.title')}</p>
              <p className='text-3xl font-bold text-gray-900 mt-2'>{upcomingVisits.length}</p>
            </div>
            <Calendar className='w-12 h-12 text-purple-600' />
          </div>
          <Link
            to='/portal/scheduled-visits'
            className='mt-4 inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-700'
          >
            {t('dashboard.viewAll')} <ArrowRight className='ml-1 w-4 h-4' />
          </Link>
        </div>
      </div>

      {/* Pending Acceptances */}
      {pendingAcceptances.length > 0 && (
        <div className='bg-yellow-50 border border-yellow-200 rounded-lg shadow'>
          <div className='p-6 border-b border-yellow-200'>
            <h2 className='text-xl font-semibold text-gray-900'>{t('schedule.visits.respondToAppointment')}</h2>
            <p className='text-sm text-gray-600 mt-1'>{t('schedule.visits.respondSubtitle')}</p>
          </div>
          <div className='p-6'>
            <div className='space-y-4'>
              {pendingAcceptances.map((visit) => (
                <div
                  key={visit.id}
                  className='flex items-center justify-between p-4 border border-yellow-300 rounded-lg bg-white hover:bg-yellow-50'
                >
                  <div>
                    <p className='font-medium text-gray-900'>{visit.title}</p>
                    <p className='text-sm text-gray-600 mt-1'>
                      {new Date(visit.scheduledDate).toLocaleDateString()} at {visit.scheduledTime}
                    </p>
                    <p className='text-sm text-gray-500 mt-1'>{visit.customerAddress}</p>
                  </div>
                    <Link
                      to={`/portal/appointment/${visit.id}/respond?token=${visit.publicToken || ''}`}
                      className='px-4 py-2 text-sm font-medium bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors'
                    >
                      {t('schedule.visits.respondToAppointment')}
                    </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Visits */}
      {upcomingVisits.length > 0 && (
        <div className='bg-white rounded-lg shadow'>
          <div className='p-6 border-b border-gray-200'>
            <h2 className='text-xl font-semibold text-gray-900'>{t('dashboard.scheduledVisits.title')}</h2>
          </div>
          <div className='p-6'>
            <div className='space-y-4'>
              {upcomingVisits.map((visit) => (
                <div
                  key={visit.id}
                  className='flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50'
                >
                  <div>
                    <p className='font-medium text-gray-900'>{visit.title}</p>
                    <p className='text-sm text-gray-600 mt-1'>
                      {new Date(visit.scheduledDate).toLocaleDateString()} at {visit.scheduledTime}
                    </p>
                    {visit.buildingId && (
                      <p className='text-sm text-gray-500 mt-1'>{visit.customerAddress}</p>
                    )}
                  </div>
                  <span className='px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full'>
                    {visit.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className='bg-white rounded-lg shadow p-6'>
        <h2 className='text-xl font-semibold text-gray-900 mb-4'>{t('dashboard.quickActions.title')}</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Link
            to='/portal/buildings'
            className='p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'
          >
            <BuildingIcon className='w-6 h-6 text-green-600 mb-2' />
            <p className='font-medium text-gray-900'>{t('navigation.buildings')}</p>
            <p className='text-sm text-gray-600 mt-1'>{t('dashboard.branchInfo.address')}</p>
          </Link>
          <Link
            to='/portal/profile'
            className='p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'
          >
            <FileCheck className='w-6 h-6 text-blue-600 mb-2' />
            <p className='font-medium text-gray-900'>{t('navigation.profile')}</p>
            <p className='text-sm text-gray-600 mt-1'>{t('dashboard.personalWorkspace')}</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PortalDashboard;


