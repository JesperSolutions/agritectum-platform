/**
 * Scheduled Visits Manager for Building Owners
 * Allows customers to schedule and view external service visits
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { ScheduledVisit, Building, ExternalServiceProvider } from '../../types';
import { getBuildingsByCustomer } from '../../services/buildingService';
import { getExternalProvidersByCompany } from '../../services/externalProviderService';
import * as scheduledVisitService from '../../services/scheduledVisitService';
import { Calendar, Plus, Clock, MapPin, User, X } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import PageHeader from '../shared/layouts/PageHeader';

const ScheduledVisitsManager: React.FC = () => {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [providers, setProviders] = useState<ExternalServiceProvider[]>([]);
  const [scheduledVisits, setScheduledVisits] = useState<ScheduledVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Current month for calendar
  const [currentDate, setCurrentDate] = useState(new Date());

  // Form state
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('10:00');
  const [duration, setDuration] = useState(120);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

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

      const buildingsList = await getBuildingsByCustomer(customerId);
      setBuildings(buildingsList);

      const providersList = await getExternalProvidersByCompany(customerId);
      setProviders(providersList);

      // Load visits for current customer
      const visits = await scheduledVisitService.getScheduledVisitsForCustomer(customerId);
      setScheduledVisits(visits);
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Error loading data');
    } finally {
      setLoading(false);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !currentUser) return;

    try {
      const customerId = currentUser.companyId || currentUser.uid;
      const building = buildings.find(b => b.id === selectedBuilding);
      const provider = providers.find(p => p.id === selectedProvider);

      if (!building || !provider) {
        showError('Invalid building or provider');
        return;
      }

      const visit = {
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
        description: notes,
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
      };

      await scheduledVisitService.createScheduledVisit(visit);

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
    }
  };

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getVisitsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return scheduledVisits.filter(v => v.scheduledDate === dateStr);
  };

  const calendarDays = getCalendarDays();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <PageHeader
          title='Scheduled Visits'
          subtitle='Schedule and manage external service visits'
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
          <form onSubmit={handleSubmit} className='space-y-4'>
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
                className='flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium'
              >
                Schedule Visit
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Calendar */}
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
            const visits = getVisitsForDate(date);
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
                      {visits.map(visit => (
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

      {/* Visits list */}
      <div className='bg-white rounded-lg shadow p-6 border border-slate-200'>
        <h3 className='text-lg font-semibold mb-4'>Upcoming Visits</h3>
        {scheduledVisits.length === 0 ? (
          <p className='text-gray-600 text-center py-8'>No scheduled visits yet</p>
        ) : (
          <div className='space-y-3'>
            {scheduledVisits
              .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
              .map(visit => (
                <div key={visit.id} className='border border-gray-200 rounded-lg p-4 hover:shadow-sm transition'>
                  <div className='flex items-start justify-between mb-2'>
                    <h4 className='font-semibold text-gray-900'>{visit.assignedInspectorName}</h4>
                    <span className='text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded'>
                      {visit.status}
                    </span>
                  </div>
                  <div className='space-y-1 text-sm text-gray-600'>
                    <div className='flex items-center gap-2'>
                      <Calendar className='w-4 h-4' />
                      {new Date(visit.scheduledDate).toLocaleDateString()}
                    </div>
                    <div className='flex items-center gap-2'>
                      <Clock className='w-4 h-4' />
                      {visit.scheduledTime} ({visit.duration} min)
                    </div>
                    <div className='flex items-center gap-2'>
                      <MapPin className='w-4 h-4' />
                      {visit.customerAddress}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduledVisitsManager;
