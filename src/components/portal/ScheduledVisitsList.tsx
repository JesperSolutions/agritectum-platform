import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useIntl } from '../../hooks/useIntl';
import { getScheduledVisitsByCustomer } from '../../services/scheduledVisitService';
import { ScheduledVisit } from '../../types';
import { Calendar, MapPin, User } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import FilterTabs from '../shared/filters/FilterTabs';
import StatusBadge from '../shared/badges/StatusBadge';
import IconLabel from '../shared/layouts/IconLabel';
import ListCard from '../shared/cards/ListCard';
import PageHeader from '../shared/layouts/PageHeader';
import { formatDateTime } from '../../utils/dateFormatter';

const ScheduledVisitsList: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useIntl();
  const [visits, setVisits] = useState<ScheduledVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  useEffect(() => {
    if (currentUser) {
      loadVisits();
    }
  }, [currentUser]);

  const loadVisits = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await getScheduledVisitsByCustomer(currentUser.uid);
      setVisits(data);
    } catch (error) {
      console.error('Error loading scheduled visits:', error);
    } finally {
      setLoading(false);
    }
  };


  const now = new Date();
  const filteredVisits = visits.filter((visit) => {
    const visitDate = new Date(visit.scheduledDate);
    if (filter === 'upcoming') return visitDate >= now && visit.status === 'scheduled';
    if (filter === 'past') return visitDate < now || visit.status !== 'scheduled';
    return true;
  });

  const sortedVisits = [...filteredVisits].sort((a, b) => {
    const dateA = new Date(a.scheduledDate).getTime();
    const dateB = new Date(b.scheduledDate).getTime();
    if (dateA !== dateB) return dateB - dateA; // Most recent first
    return a.scheduledTime.localeCompare(b.scheduledTime);
  });

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  const filterTabs = [
    { value: 'all', label: t('common.filters.all') || 'All' },
    { value: 'upcoming', label: t('common.filters.upcoming') || 'Upcoming' },
    { value: 'past', label: t('common.filters.past') || 'Past' },
  ];

  return (
    <div className='space-y-6'>
      <PageHeader
        title={t('navigation.scheduledVisits') || 'Scheduled Visits'}
        subtitle={t('schedule.visits.subtitle') || 'View scheduled roofer visits for your buildings'}
      />

      <FilterTabs
        tabs={filterTabs}
        activeTab={filter}
        onTabChange={(value) => setFilter(value as 'all' | 'upcoming' | 'past')}
      />

      {sortedVisits.length === 0 ? (
        <div className='bg-white rounded-lg shadow p-12 text-center border border-slate-200'>
          <Calendar className='w-16 h-16 text-gray-400 mx-auto mb-4' />
          <p className='text-gray-600'>{t('schedule.visits.noVisits') || 'No scheduled visits found'}</p>
        </div>
      ) : (
        <div className='space-y-4'>
          {sortedVisits.map((visit) => (
            <ListCard key={visit.id}>
              <div className='flex items-start justify-between mb-4'>
                <div>
                  <h3 className='font-semibold text-gray-900'>{visit.title}</h3>
                  <p className='text-sm text-gray-600'>{visit.visitType}</p>
                </div>
                <StatusBadge status={visit.status} />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-4'>
                <IconLabel
                  icon={Calendar}
                  label={t('schedule.visits.dateTime') || 'Date & Time'}
                  value={formatDateTime(visit.scheduledDate, visit.scheduledTime)}
                />
                <IconLabel
                  icon={MapPin}
                  label={t('schedule.visits.location') || 'Location'}
                  value={visit.customerAddress}
                />
                <IconLabel
                  icon={User}
                  label={t('schedule.visits.inspector') || 'Inspector'}
                  value={visit.assignedInspectorName}
                />
              </div>

              {visit.description && (
                <p className='mt-4 text-sm text-gray-600'>{visit.description}</p>
              )}
            </ListCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScheduledVisitsList;


