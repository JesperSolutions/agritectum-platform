import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getScheduledVisitsByCustomer, createScheduledVisit } from '../../services/scheduledVisitService';
import { getBuildingsByCustomer } from '../../services/buildingService';
import { getExternalProvidersByCompany } from '../../services/externalProviderService';
import { ScheduledVisit, Building, ExternalServiceProvider } from '../../types';
import { Calendar, MapPin, User, CheckCircle, XCircle, ExternalLink, Plus, Clock, Download } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import FilterTabs from '../shared/filters/FilterTabs';
import StatusBadge from '../shared/badges/StatusBadge';
import IconLabel from '../shared/layouts/IconLabel';
import ListCard from '../shared/cards/ListCard';
import PageHeader from '../shared/layouts/PageHeader';
import { formatDateTime, formatDate } from '../../utils/dateFormatter';
import { Button } from '../ui/button';
import { downloadICalFile, addToGoogleCalendar, addToOutlookCalendar } from '../../utils/calendarExport';

const ScheduledVisitsList: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  
  const [visits, setVisits] = useState<ScheduledVisit[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [providers, setProviders] = useState<ExternalServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [showForm, setShowForm] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [openCalendarMenu, setOpenCalendarMenu] = useState<string | null>(null);
  
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
      console.error('Error loading data:', error);
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
      console.error('Error scheduling visit:', error);
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
      <div className='flex items-center justify-center h-64'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  const calendarDays = getCalendarDays();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const filterTabs = [
    { value: 'all', label: 'All' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'past', label: 'Past' },
  ];

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <PageHeader
          title='Scheduled Visits'
          subtitle='View and schedule external service visits'
        />
        <button
          onClick={() => setShowForm(!showForm)}
          className='flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm'
        >
          <Plus className='w-5 h-5' />
          Schedule Visit
        </button>
      </div>

      {showForm && (
        <div className='bg-white rounded-lg shadow p-6 border border-slate-200'>
          <h3 className='text-lg font-semibold mb-4'>Schedule a New Visit</h3>
          <form onSubmit={handleCreateVisit} className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Building *</label>
                <select
                  value={selectedBuilding}
                  onChange={e => setSelectedBuilding(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.building ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value=''>Select building...</option>
                  {buildings.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name || b.address}
                    </option>
                  ))}
                </select>
                {errors.building && <p className='text-xs text-red-600 mt-1'>{errors.building}</p>}
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Provider *</label>
                <select
                  value={selectedProvider}
                  onChange={e => setSelectedProvider(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.provider ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value=''>Select provider...</option>
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
              <label className='block text-sm font-medium text-gray-700 mb-1'>Service Type *</label>
              <select
                value={serviceType}
                onChange={e => setServiceType(e.target.value as 'inspection' | 'cleaning' | 'repair' | 'emergency')}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              >
                <option value='inspection'>🔍 Inspection - Routine roof assessment</option>
                <option value='cleaning'>🧹 Cleaning - Gutter & surface cleaning</option>
                <option value='repair'>🔧 Repair - Fix identified issues</option>
                <option value='emergency'>🚨 Emergency - Urgent attention needed</option>
              </select>
              
              {estimatedCost && (
                <div className='mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                  <p className='text-sm font-medium text-blue-900'>Estimated Cost</p>
                  <p className='text-lg font-bold text-blue-700'>
                    DKK {estimatedCost.min.toLocaleString()} - {estimatedCost.max.toLocaleString()}
                  </p>
                  <p className='text-xs text-blue-600 mt-1'>
                    Based on {serviceType} service for selected building
                  </p>
                </div>
              )}
              
              {suggestedDate && (
                <div className='mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg'>
                  <p className='text-sm text-amber-800'>
                    💡 <strong>Recommended:</strong> Schedule by {new Date(suggestedDate).toLocaleDateString()} 
                    {' '}(Last inspection was over 365 days ago)
                  </p>
                </div>
              )}
            </div>

            <div className='grid grid-cols-3 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Date *</label>
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
                <label className='block text-sm font-medium text-gray-700 mb-1'>Time *</label>
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
                <label className='block text-sm font-medium text-gray-700 mb-1'>Duration (min) *</label>
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
              <label className='block text-sm font-medium text-gray-700 mb-1'>Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder='Any additional details about the visit...'
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
                Cancel
              </button>
              <button
                type='submit'
                disabled={submitting}
                className='flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50'
              >
                {submitting ? 'Scheduling...' : 'Schedule Visit'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Calendar View */}
      <div className='bg-white rounded-lg shadow p-6 border border-slate-200'>
        <div className='flex items-center justify-between mb-6'>
          <h3 className='text-lg font-semibold'>{monthName}</h3>
          <div className='flex gap-2'>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              className='px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50'
            >
              ← Prev
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className='px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50'
            >
              Today
            </button>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              className='px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50'
            >
              Next →
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div className='grid grid-cols-7 gap-2 mb-2'>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className='text-center font-semibold text-sm text-gray-600 py-2'>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className='grid grid-cols-7 gap-2'>
          {calendarDays.map((date, idx) => {
            const visitsOnDate = getVisitsForDate(date);
            const isToday = date && new Date().toDateString() === date.toDateString();
            return (
              <div
                key={idx}
                className={`min-h-24 p-2 border rounded-lg ${
                  date ? 'bg-white' : 'bg-gray-50'
                } ${isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              >
                {date && (
                  <>
                    <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                      {date.getDate()}
                    </div>
                    <div className='space-y-1'>
                      {visitsOnDate.map(visit => (
                        <div
                          key={visit.id}
                          className='text-xs bg-amber-100 text-amber-800 p-1 rounded truncate'
                          title={`${visit.scheduledTime} - ${visit.assignedInspectorName}`}
                        >
                          {visit.scheduledTime}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <FilterTabs
        tabs={filterTabs}
        activeTab={filter}
        onTabChange={value => setFilter(value as 'all' | 'upcoming' | 'past')}
      />

      {sortedVisits.length === 0 ? (
        <div className='bg-white rounded-lg shadow p-12 text-center border border-slate-200'>
          <Calendar className='w-16 h-16 text-gray-400 mx-auto mb-4' />
          <p className='text-gray-600'>
            No scheduled visits found
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
                  <div className='relative'>
                    <button
                      onClick={() => setOpenCalendarMenu(openCalendarMenu === visit.id ? null : visit.id)}
                      className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                      title='Add to calendar'
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
                          Download (.ics)
                        </button>
                        <button
                          onClick={() => {
                            addToGoogleCalendar(visit);
                            setOpenCalendarMenu(null);
                          }}
                          className='w-full text-left px-4 py-2 hover:bg-gray-50 text-sm border-b border-gray-100'
                        >
                          Add to Google Calendar
                        </button>
                        <button
                          onClick={() => {
                            addToOutlookCalendar(visit);
                            setOpenCalendarMenu(null);
                          }}
                          className='w-full text-left px-4 py-2 hover:bg-gray-50 text-sm'
                        >
                          Add to Outlook
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
                  label='Date & Time'
                  value={`${formatDate(visit.scheduledDate)} ${visit.scheduledTime}`}
                />
                <IconLabel
                  icon={MapPin}
                  label='Location'
                  value={visit.customerAddress}
                />
                <IconLabel
                  icon={Clock}
                  label='Duration'
                  value={`${visit.duration} minutes`}
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
                    Accept
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
                    Reject
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
                    View Inspection Report
                  </Button>
                </div>
              )}
            </ListCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScheduledVisitsList;
