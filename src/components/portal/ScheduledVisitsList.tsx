import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useIntl } from '../../hooks/useIntl';
import { logger } from '../../utils/logger';
import { getScheduledVisitsByCustomer, createScheduledVisit } from '../../services/scheduledVisitService';
import { getBuildingsByCustomer } from '../../services/buildingService';
import { getExternalProvidersByCompany } from '../../services/externalProviderService';
import { ScheduledVisit, Building, ExternalServiceProvider } from '../../types';
import { Calendar, MapPin, User, CheckCircle, XCircle, ExternalLink, Plus, Clock, Download, List, Grid } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import { VisitsListSkeleton } from '../common/SkeletonLoader';
import FilterTabs from '../shared/filters/FilterTabs';
import StatusBadge from '../shared/badges/StatusBadge';
import IconLabel from '../shared/layouts/IconLabel';
import ListCard from '../shared/cards/ListCard';
import PageHeader from '../shared/layouts/PageHeader';
import { formatDateTime, formatDate } from '../../utils/dateFormatter';
import { Button } from '../ui/button';
import { downloadICalFile, addToGoogleCalendar, addToOutlookCalendar } from '../../utils/calendarExport';
import { getCurrencyCode } from '../../utils/currency';

const ScheduledVisitsList: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { t } = useIntl();
  
  const [visits, setVisits] = useState<ScheduledVisit[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [providers, setProviders] = useState<ExternalServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [showForm, setShowForm] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [openCalendarMenu, setOpenCalendarMenu] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  
  // Form state
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [serviceType, setServiceType] = useState<'inspection' | 'cleaning' | 'repair' | 'emergency'>('inspection');
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('10:00');
  const [duration, setDuration] = useState(120);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [suggestedDate, setSuggestedDate] = useState<string | null>(null);
  const [estimatedCost, setEstimatedCost] = useState<{ min: number; max: number } | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  // Close calendar menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openCalendarMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest('.calendar-menu-container')) {
          setOpenCalendarMenu(null);
        }
      }
    };

    if (openCalendarMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openCalendarMenu]);

  const loadData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const customerId = currentUser.companyId || currentUser.uid;
      const [visitsData, buildingsData, providersData] = await Promise.all([
        getScheduledVisitsByCustomer(customerId),
        getBuildingsByCustomer(customerId),
        getExternalProvidersByCompany(customerId),
      ]);
      setVisits(visitsData);
      setBuildings(buildingsData);
      setProviders(providersData);
    } catch (error) {
      logger.error('Error loading data:', error);
      showError('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  // Smart suggestions based on selected building
  useEffect(() => {
    if (!selectedBuilding) {
      setSuggestedDate(null);
      setEstimatedCost(null);
      return;
    }

    const building = buildings.find(b => b.id === selectedBuilding);
    if (!building) return;

    // Calculate suggested date based on last visit
    const buildingVisits = visits.filter(v => v.buildingId === selectedBuilding);
    if (buildingVisits.length > 0) {
      const sortedVisits = buildingVisits.sort((a, b) => 
        new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
      );
      const lastVisit = sortedVisits[0];
      const daysSince = Math.floor(
        (Date.now() - new Date(lastVisit.scheduledDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSince > 365) {
        const recommended = new Date();
        recommended.setDate(recommended.getDate() + 7); // Suggest next week
        setSuggestedDate(recommended.toISOString().split('T')[0]);
      } else {
        setSuggestedDate(null);
      }
    }

    // Calculate estimated cost based on building size and service type
    const roofSize = building.roofSize || 100; // Default 100m² if not specified
    let baseRate = 0;
    
    switch (serviceType) {
      case 'inspection':
        baseRate = 8; // DKK 8 per m²
        break;
      case 'cleaning':
        baseRate = 15; // DKK 15 per m²
        break;
      case 'repair':
        baseRate = 25; // DKK 25 per m²
        break;
      case 'emergency':
        baseRate = 40; // DKK 40 per m² (premium)
        break;
    }

    const minCost = Math.round(roofSize * baseRate * 0.8);
    const maxCost = Math.round(roofSize * baseRate * 1.2);
    setEstimatedCost({ min: minCost, max: maxCost });
  }, [selectedBuilding, serviceType, buildings, visits]);

  // Auto-select provider if only one exists
  useEffect(() => {
    if (providers.length === 1 && !selectedProvider) {
      setSelectedProvider(providers[0].id);
    }
  }, [providers, selectedProvider]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!selectedBuilding) newErrors.building = 'Building is required';
    if (!selectedProvider) newErrors.provider = 'Provider is required';
    if (!visitDate) newErrors.visitDate = 'Date is required';
    if (!visitTime) newErrors.visitTime = 'Time is required';
    if (duration < 30) newErrors.duration = 'Duration must be at least 30 minutes';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !currentUser) return;

    setSubmitting(true);
    try {
      const customerId = currentUser.companyId || currentUser.uid;
      const building = buildings.find(b => b.id === selectedBuilding);
      const provider = providers.find(p => p.id === selectedProvider);

      if (!building || !provider) {
        showError('Invalid building or provider');
        return;
      }

      await createScheduledVisit({
        branchId: currentUser.branchId || '',
        customerId: customerId,
        customerName: currentUser.name || 'Building Owner',
        customerAddress: building.address,
        customerEmail: currentUser.email,
        buildingId: selectedBuilding,
        companyId: customerId,
        assignedInspectorId: provider.id,
        assignedInspectorName: provider.companyName,
        scheduledDate: visitDate,
        scheduledTime: visitTime,
        duration: duration,
        status: 'scheduled' as const,
        description: `[${serviceType.toUpperCase()}] ${notes || `${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} service requested`}`,
        createdBy: currentUser.uid,
      });

      showSuccess('Visit scheduled successfully');
      setShowForm(false);
      setSelectedBuilding('');
      setSelectedProvider('');
      setVisitDate('');
      setVisitTime('10:00');
      setDuration(120);
      setNotes('');
      loadData();
    } catch (error) {
      logger.error('Error scheduling visit:', error);
      showError('Failed to schedule visit');
    } finally {
      setSubmitting(false);
    }
  };

  const now = new Date();
  const filteredVisits = visits.filter(visit => {
    const visitDate = new Date(visit.scheduledDate);
    if (filter === 'upcoming') return visitDate >= now && visit.status === 'scheduled';
    if (filter === 'past') return visitDate < now || visit.status !== 'scheduled';
    return true;
  });

  const sortedVisits = [...filteredVisits].sort((a, b) => {
    const dateA = new Date(a.scheduledDate).getTime();
    const dateB = new Date(b.scheduledDate).getTime();
    if (dateA !== dateB) return dateB - dateA;
    return a.scheduledTime.localeCompare(b.scheduledTime);
  });

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const getVisitsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return visits.filter(v => v.scheduledDate === dateStr);
  };

  if (loading) {
    return (
      <div className='space-y-6'>
        <PageHeader
          title={t('schedule.portal.title')}
          subtitle={t('schedule.portal.subtitle')}
        />
        <VisitsListSkeleton count={5} />
      </div>
    );
  }

  const calendarDays = getCalendarDays();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const filterTabs = [
    { value: 'all', label: t('schedule.portal.all') },
    { value: 'upcoming', label: t('schedule.portal.upcoming') },
    { value: 'past', label: t('schedule.portal.past') },
  ];

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4'>
        <PageHeader
          title={t('schedule.portal.title')}
          subtitle={t('schedule.portal.subtitle')}
        />
        <div className='flex items-center gap-2'>
          {/* View mode toggle */}
          <div className='flex bg-slate-100 rounded-lg p-1'>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              aria-label='List view'
            >
              <List className='w-4 h-4' />
              <span className='hidden sm:inline'>List</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                viewMode === 'calendar'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              aria-label='Calendar view'
            >
              <Grid className='w-4 h-4' />
              <span className='hidden sm:inline'>Calendar</span>
            </button>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            data-action="schedule-visit"
            className='flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm'
          >
            <Plus className='w-5 h-5' />
            <span className='hidden sm:inline'>{t('schedule.portal.requestVisit')}</span>
            <span className='sm:hidden'>Add</span>
          </button>
        </div>
      </div>

      {showForm && (
        <div className='bg-white rounded-lg shadow p-6 border border-slate-200'>
          <h3 className='text-lg font-semibold mb-4'>{t('schedule.portal.scheduleNewVisit')}</h3>
          <form onSubmit={handleCreateVisit} className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>{t('schedule.portal.building')} *</label>
                <select
                  value={selectedBuilding}
                  onChange={e => setSelectedBuilding(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.building ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value=''>{t('schedule.portal.selectBuilding')}</option>
                  {buildings.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name || b.address}
                    </option>
                  ))}
                </select>
                {errors.building && <p className='text-xs text-red-600 mt-1'>{errors.building}</p>}
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>{t('schedule.portal.provider')} *</label>
                <select
                  value={selectedProvider}
                  onChange={e => setSelectedProvider(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.provider ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value=''>{t('schedule.portal.selectProvider')}</option>
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.companyName}
                    </option>
                  ))}
                </select>
                {errors.provider && <p className='text-xs text-red-600 mt-1'>{errors.provider}</p>}
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>{t('schedule.portal.serviceType')} *</label>
              <select
                value={serviceType}
                onChange={e => setServiceType(e.target.value as 'inspection' | 'cleaning' | 'repair' | 'emergency')}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              >
                <option value='inspection'>{t('schedule.portal.serviceType.inspection')}</option>
                <option value='cleaning'>{t('schedule.portal.serviceType.cleaning')}</option>
                <option value='repair'>{t('schedule.portal.serviceType.repair')}</option>
                <option value='emergency'>{t('schedule.portal.serviceType.emergency')}</option>
              </select>
              
              {estimatedCost && (
                <div className='mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                  <p className='text-sm font-medium text-blue-900'>{t('schedule.portal.estimatedCost')}</p>
                  <p className='text-lg font-bold text-blue-700'>
                    {getCurrencyCode()} {estimatedCost.min.toLocaleString()} - {estimatedCost.max.toLocaleString()}
                  </p>
                  <p className='text-xs text-blue-600 mt-1'>
                    {t('schedule.portal.estimatedCostNote', { serviceType })}
                  </p>
                </div>
              )}
              
              {suggestedDate && (
                <div className='mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg'>
                  <p className='text-sm text-amber-800'>
                    💡 <strong>{t('schedule.portal.recommended')}:</strong> {t('schedule.portal.scheduleBy')} {new Date(suggestedDate).toLocaleDateString()} 
                  </p>
                </div>
              )}
            </div>

            <div className='grid grid-cols-3 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>{t('schedule.portal.date')} *</label>
                <input
                  type='date'
                  value={visitDate}
                  onChange={e => setVisitDate(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.visitDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.visitDate && <p className='text-xs text-red-600 mt-1'>{errors.visitDate}</p>}
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>{t('schedule.portal.time')} *</label>
                <input
                  type='time'
                  value={visitTime}
                  onChange={e => setVisitTime(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.visitTime ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.visitTime && <p className='text-xs text-red-600 mt-1'>{errors.visitTime}</p>}
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>{t('schedule.portal.duration')} *</label>
                <input
                  type='number'
                  value={duration}
                  onChange={e => setDuration(parseInt(e.target.value) || 0)}
                  min='30'
                  step='30'
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.duration ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.duration && <p className='text-xs text-red-600 mt-1'>{errors.duration}</p>}
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>{t('schedule.portal.notes')}</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={t('schedule.portal.notesPlaceholder')}
                rows={2}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              />
            </div>

            <div className='flex gap-3 pt-2'>
              <button
                type='button'
                onClick={() => setShowForm(false)}
                className='flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium'
              >
                {t('common.cancel')}
              </button>
              <button
                type='submit'
                disabled={submitting}
                className='flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50'
              >
                {submitting ? t('schedule.portal.scheduling') : t('schedule.portal.requestVisit')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className='bg-white rounded-lg shadow p-4 sm:p-6 border border-slate-200'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6'>
            <h3 className='text-lg font-semibold'>{monthName}</h3>
            <div className='flex gap-2'>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                className='px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50'
              >
                ← <span className='hidden sm:inline'>{t('schedule.portal.prev')}</span>
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className='px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50'
              >
                {t('schedule.portal.today')}
              </button>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                className='px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50'
              >
                <span className='hidden sm:inline'>{t('schedule.portal.next')}</span> →
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className='hidden sm:grid grid-cols-7 gap-2 mb-2'>
            {[t('schedule.portal.sun'), t('schedule.portal.mon'), t('schedule.portal.tue'), t('schedule.portal.wed'), t('schedule.portal.thu'), t('schedule.portal.fri'), t('schedule.portal.sat')].map(day => (
              <div key={day} className='text-center font-semibold text-sm text-gray-600 py-2'>
                {day}
              </div>
            ))}
          </div>

          {/* Mobile: Compact day headers */}
          <div className='grid sm:hidden grid-cols-7 gap-1 mb-2'>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
              <div key={idx} className='text-center font-semibold text-xs text-gray-600 py-1'>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className='grid grid-cols-7 gap-1 sm:gap-2'>
            {calendarDays.map((date, idx) => {
              const visitsOnDate = getVisitsForDate(date);
              const isToday = date && new Date().toDateString() === date.toDateString();
              return (
                <div
                  key={idx}
                  className={`min-h-16 sm:min-h-24 p-1 sm:p-2 border rounded-lg ${
                    date ? 'bg-white' : 'bg-gray-50'
                  } ${isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                >
                  {date && (
                    <>
                      <div className={`text-xs sm:text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                        {date.getDate()}
                      </div>
                      <div className='space-y-1'>
                        {visitsOnDate.slice(0, 2).map(visit => (
                          <div
                            key={visit.id}
                            className='text-xs bg-amber-100 text-amber-800 px-1 py-0.5 rounded truncate cursor-pointer hover:bg-amber-200'
                            title={`${visit.scheduledTime} - ${visit.assignedInspectorName}`}
                            onClick={() => {
                              setFilter('all');
                              setViewMode('list');
                            }}
                          >
                            <span className='hidden sm:inline'>{visit.scheduledTime}</span>
                            <span className='sm:hidden'>•</span>
                          </div>
                        ))}
                        {visitsOnDate.length > 2 && (
                          <div className='text-xs text-gray-500 px-1'>
                            +{visitsOnDate.length - 2} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'list' && (
        <>
          <FilterTabs
            tabs={filterTabs}
            activeTab={filter}
            onTabChange={value => setFilter(value as 'all' | 'upcoming' | 'past')}
          />

      {sortedVisits.length === 0 ? (
        <div className='bg-white rounded-lg shadow p-12 text-center border border-slate-200'>
          <Calendar className='w-16 h-16 text-gray-400 mx-auto mb-4' />
          <p className='text-gray-600'>
            {t('schedule.portal.noVisits')}
          </p>
        </div>
      ) : (
        <div className='space-y-4'>
          {sortedVisits.map(visit => (
            <ListCard key={visit.id}>
              <div className='flex items-start justify-between mb-4'>
                <div>
                  <h3 className='font-semibold text-gray-900'>{visit.assignedInspectorName}</h3>
                  <p className='text-sm text-gray-600'>{visit.status}</p>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='relative calendar-menu-container'>
                    <button
                      onClick={() => setOpenCalendarMenu(openCalendarMenu === visit.id ? null : visit.id)}
                      className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                      title='Add to calendar'
                      aria-label='Add to calendar'
                      aria-expanded={openCalendarMenu === visit.id}
                    >
                      <Calendar className='w-5 h-5 text-blue-600' />
                    </button>
                    {openCalendarMenu === visit.id && (
                      <div className='absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10'>
                        <button
                          onClick={() => {
                            downloadICalFile(visit);
                            setOpenCalendarMenu(null);
                          }}
                          className='w-full text-left px-4 py-2 hover:bg-gray-50 text-sm border-b border-gray-100 flex items-center gap-2'
                        >
                          <Download className='w-4 h-4' />
                          {t('schedule.portal.downloadIcs')}
                        </button>
                        <button
                          onClick={() => {
                            addToGoogleCalendar(visit);
                            setOpenCalendarMenu(null);
                          }}
                          className='w-full text-left px-4 py-2 hover:bg-gray-50 text-sm border-b border-gray-100'
                        >
                          {t('schedule.portal.addToGoogle')}
                        </button>
                        <button
                          onClick={() => {
                            addToOutlookCalendar(visit);
                            setOpenCalendarMenu(null);
                          }}
                          className='w-full text-left px-4 py-2 hover:bg-gray-50 text-sm'
                        >
                          {t('schedule.portal.addToOutlook')}
                        </button>
                      </div>
                    )}
                  </div>
                  <StatusBadge status={visit.status} />
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-4'>
                <IconLabel
                  icon={Calendar}
                  label={t('schedule.portal.dateAndTime')}
                  value={`${formatDate(visit.scheduledDate)} ${visit.scheduledTime}`}
                />
                <IconLabel
                  icon={MapPin}
                  label={t('schedule.portal.location')}
                  value={visit.customerAddress}
                />
                <IconLabel
                  icon={Clock}
                  label={t('schedule.portal.durationLabel')}
                  value={`${visit.duration} ${t('schedule.portal.minutes')}`}
                />
              </div>

              {visit.description && (
                <p className='mt-4 text-sm text-gray-600'>{visit.description}</p>
              )}

              {visit.customerResponse === 'pending' && visit.status === 'scheduled' && (
                <div className='mt-6 pt-4 border-t border-slate-200 flex gap-3'>
                  <Button
                    onClick={() =>
                      navigate(
                        `/portal/appointment/${visit.id}/respond?token=${visit.publicToken || ''}`
                      )
                    }
                    className='flex-1 bg-green-600 hover:bg-green-700'
                  >
                    <CheckCircle className='w-4 h-4 mr-2' />
                    {t('schedule.portal.accept')}
                  </Button>
                  <Button
                    onClick={() =>
                      navigate(
                        `/portal/appointment/${visit.id}/respond?token=${visit.publicToken || ''}`
                      )
                    }
                    variant='outline'
                    className='flex-1 border-red-300 text-red-700 hover:bg-red-50'
                  >
                    <XCircle className='w-4 h-4 mr-2' />
                    {t('schedule.portal.reject')}
                  </Button>
                </div>
              )}

              {visit.status === 'completed' && visit.reportId && (
                <div className='mt-6 pt-4 border-t border-slate-200'>
                  <Button
                    onClick={() => window.open(`/report/view/${visit.reportId}`, '_blank')}
                    variant='outline'
                    className='w-full'
                  >
                    <ExternalLink className='w-4 h-4 mr-2' />
                    {t('schedule.portal.viewReport')}
                  </Button>
                </div>
              )}
            </ListCard>
          ))}
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default ScheduledVisitsList;
