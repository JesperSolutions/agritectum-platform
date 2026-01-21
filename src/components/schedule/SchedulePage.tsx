import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useIntl } from '../../hooks/useIntl';
import { useToast } from '../../contexts/ToastContext';
import { Appointment, AppointmentStatus } from '../../types';
import * as appointmentService from '../../services/appointmentService';
import AppointmentForm from './AppointmentForm';
import AppointmentList from './AppointmentList';
import LoadingSpinner from '../common/LoadingSpinner';
import { logger } from '../../utils/logger';
import { Button } from '../ui/button';
import {
  Plus,
  RefreshCw,
  AlertTriangle,
  Calendar,
  CheckCircle,
  FileText,
  Filter,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SchedulePage: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useIntl();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | 'all'>('all');

  const userCanManage = currentUser && currentUser.permissionLevel >= 1; // Branch Admin or Superadmin
  const isInspector = currentUser && currentUser.permissionLevel === 0; // Inspector only

  // Enhanced filter states (after isInspector is defined)
  // For inspectors, default to 'all' to show all their appointments
  const [dateFilter, setDateFilter] = useState<
    'all' | 'today' | 'week' | 'month' | 'upcoming' | 'past'
  >(() => (currentUser?.permissionLevel === 0 ? 'all' : 'all'));
  const [hideCancelled, setHideCancelled] = useState<boolean>(false);
  const [hideCompleted, setHideCompleted] = useState<boolean>(false);
  const [hideOld, setHideOld] = useState<boolean>(false);
  const [inspectorFilter, setInspectorFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [inspectors, setInspectors] = useState<any[]>([]);

  useEffect(() => {
    if (currentUser) {
      loadAppointments();
    }
  }, [currentUser]);

  const loadAppointments = async () => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);

    try {
      logger.log('📅 Loading appointments for user:', {
        uid: currentUser.uid,
        role: currentUser.role,
        permissionLevel: currentUser.permissionLevel,
        branchId: currentUser.branchId,
      });
      const data = await appointmentService.getAppointments(currentUser);
      logger.log('📅 Appointments loaded:', data.length, 'appointments');
      setAppointments(data);
    } catch (err: any) {
      console.error('📅 Error loading appointments:', err);
      setError(err.message || t('schedule.errorMessage'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = () => {
    setEditingAppointment(null);
    setIsFormOpen(true);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsFormOpen(true);
  };

  const handleDeleteAppointment = async (appointment: Appointment) => {
    if (!confirm(t('schedule.appointment.deleteConfirm'))) return;

    try {
      await appointmentService.deleteAppointment(appointment.id);
      await loadAppointments();
      showSuccess(
        t('schedule.appointment.deletedSuccessfully') || 'Appointment deleted successfully'
      );
    } catch (err: any) {
      const errorMsg = err.message || t('schedule.error.delete') || 'Failed to delete appointment';
      showError(errorMsg);
    }
  };

  const handleCancelAppointment = async (appointment: Appointment) => {
    if (!confirm(t('schedule.appointment.cancelConfirm'))) return;

    const reason = prompt(t('schedule.form.cancelReason'));
    if (reason === null) return; // User cancelled the prompt

    try {
      await appointmentService.cancelAppointment(appointment.id, reason);
      await loadAppointments();
      showSuccess(
        t('schedule.appointment.cancelledSuccessfully') || 'Appointment cancelled successfully'
      );
    } catch (err: any) {
      const errorMsg = err.message || t('schedule.error.cancel') || 'Failed to cancel appointment';
      showError(errorMsg);
    }
  };

  const handleStartAppointment = async (appointment: Appointment) => {
    try {
      // Validate current user exists
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Log the start action for debugging
      logger.log('🔍 Start Inspection - Appointing data:', {
        appointmentId: appointment.id,
        status: appointment.status,
        customerName: appointment.customerName,
        inspector: currentUser.email,
      });

      // If appointment is scheduled, mark it as in_progress first
      if (appointment.status === 'scheduled') {
        try {
          await appointmentService.startAppointment(appointment.id);
          logger.log('✅ Appointment marked as in_progress');
        } catch (err: any) {
          console.error('⚠️ Failed to update appointment status:', err);
          // Continue anyway - the navigation should still work
        }
      }

      // Navigate to report creation with pre-filled data
      navigate('/report/new', {
        state: {
          appointmentId: appointment.id,
          customerName: appointment.customerName,
          customerAddress: appointment.customerAddress,
          customerPhone: appointment.customerPhone,
          customerEmail: appointment.customerEmail,
        },
      });
    } catch (err: any) {
      console.error('❌ Start Inspection Error:', {
        error: err,
        message: err.message,
        stack: err.stack,
        appointmentId: appointment.id,
      });
      alert(err.message || t('schedule.errorMessage') || 'Failed to start appointment');
    }
  };

  // Load inspectors for admin filter
  useEffect(() => {
    if (userCanManage && currentUser?.branchId) {
      const loadInspectors = async () => {
        try {
          const { getUsers } = await import('../../services/userService');
          const branchUsers = await getUsers(currentUser.branchId);
          const inspectorsList = branchUsers.filter(u => u.role === 'inspector' && u.isActive);
          setInspectors(inspectorsList);
        } catch (error) {
          console.error('Error loading inspectors:', error);
        }
      };
      loadInspectors();
    }
  }, [userCanManage, currentUser?.branchId]);

  // Persist filter preferences
  useEffect(() => {
    if (currentUser) {
      const key = `appointment_filters_${currentUser.uid}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const filters = JSON.parse(saved);
          if (filters.dateFilter) setDateFilter(filters.dateFilter);
          if (filters.hideCancelled !== undefined) setHideCancelled(filters.hideCancelled);
          if (filters.hideCompleted !== undefined) setHideCompleted(filters.hideCompleted);
          if (filters.hideOld !== undefined) setHideOld(filters.hideOld);
        } catch (e) {
          console.error('Error loading saved filters:', e);
        }
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      const key = `appointment_filters_${currentUser.uid}`;
      const filters = {
        dateFilter,
        hideCancelled,
        hideCompleted,
        hideOld,
        inspectorFilter,
      };
      localStorage.setItem(key, JSON.stringify(filters));
    }
  }, [dateFilter, hideCancelled, hideCompleted, hideOld, inspectorFilter, currentUser]);

  const filteredAppointments = useMemo(() => {
    let filtered = appointments;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Debug logging for inspectors
    if (isInspector && appointments.length > 0) {
      logger.log('🔍 Inspector appointments filter debug:', {
        totalAppointments: appointments.length,
        filterStatus,
        dateFilter,
        hideCancelled,
        hideCompleted,
        hideOld,
      });
    }

    // Status filter (existing)
    if (filterStatus !== 'all') {
      filtered = filtered.filter(apt => apt.status === filterStatus);
    }

    // Date filter (new)
    if (dateFilter === 'today') {
      filtered = filtered.filter(apt => apt.scheduledDate === today);
    } else if (dateFilter === 'upcoming') {
      filtered = filtered.filter(apt => apt.scheduledDate >= today);
    } else if (dateFilter === 'past') {
      filtered = filtered.filter(apt => apt.scheduledDate < today);
    } else if (dateFilter === 'week') {
      const weekLater = new Date();
      weekLater.setDate(weekLater.getDate() + 7);
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.scheduledDate);
        return aptDate >= new Date(today) && aptDate <= weekLater;
      });
    } else if (dateFilter === 'month') {
      const monthLater = new Date();
      monthLater.setMonth(monthLater.getMonth() + 1);
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.scheduledDate);
        return aptDate >= new Date(today) && aptDate <= monthLater;
      });
    }

    // Hide filters (new)
    if (hideCancelled) {
      filtered = filtered.filter(apt => apt.status !== 'cancelled');
    }
    if (hideCompleted) {
      filtered = filtered.filter(apt => apt.status !== 'completed');
    }
    if (hideOld) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.scheduledDate);
        return aptDate >= cutoff;
      });
    }

    // Inspector filter (admin only)
    if (userCanManage && inspectorFilter !== 'all') {
      filtered = filtered.filter(apt => apt.assignedInspectorId === inspectorFilter);
    }

    // Debug logging for filtered result
    if (isInspector && appointments.length > 0) {
      logger.log('✅ Filtered appointments count:', filtered.length);
    }

    return filtered;
  }, [
    appointments,
    filterStatus,
    dateFilter,
    hideCancelled,
    hideCompleted,
    hideOld,
    inspectorFilter,
    userCanManage,
    isInspector,
  ]);

  // Get today's appointments for inspectors
  const todaysAppointments = useMemo(() => {
    if (!isInspector) return [];

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    return appointments.filter(
      appointment =>
        appointment.scheduledDate === today &&
        (appointment.status === 'scheduled' || appointment.status === 'in_progress')
    );
  }, [appointments, isInspector]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className='space-y-6 font-material max-w-7xl mx-auto'>
      {/* Header */}
      <div className='bg-white rounded-material shadow-material-2 p-6'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div>
            <h1 className='text-3xl sm:text-4xl font-light text-slate-900 tracking-tight mb-2'>
              {t('schedule.title')}
            </h1>
            <p className='text-base sm:text-lg text-slate-600 font-light'>
              {t('schedule.subtitle')}
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Button variant='outline' onClick={loadAppointments} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className='hidden sm:inline'>{t('schedule.refresh')}</span>
            </Button>
            {userCanManage && (
              <Button onClick={handleCreateAppointment}>
                <Plus className='w-4 h-4' />
                {t('schedule.addAppointment')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Filter Panel */}
      <div className='bg-white rounded-material shadow-material-2 p-4 border border-slate-200'>
        <div className='flex items-center justify-between mb-4'>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className='flex items-center gap-2 text-slate-700 hover:text-slate-900'
          >
            <Filter className='w-4 h-4' />
            <span className='text-sm font-medium'>{t('schedule.filters') || 'Filters'}</span>
            {showFilters ? <ChevronUp className='w-4 h-4' /> : <ChevronDown className='w-4 h-4' />}
          </button>
          {(filterStatus !== 'all' ||
            dateFilter !== 'all' ||
            hideCancelled ||
            hideCompleted ||
            hideOld ||
            inspectorFilter !== 'all') && (
            <button
              onClick={() => {
                setFilterStatus('all');
                setDateFilter(isInspector ? 'upcoming' : 'all');
                setHideCancelled(isInspector ? true : false);
                setHideCompleted(false);
                setHideOld(false);
                setInspectorFilter('all');
              }}
              className='text-sm text-blue-600 hover:text-blue-700'
            >
              {t('schedule.clearFilters')}
            </button>
          )}
        </div>

        {showFilters && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-200'>
            {/* Status Filter */}
            <div>
              <label className='block text-sm font-medium text-slate-700 mb-2'>
                {t('schedule.status') || 'Status'}
              </label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as AppointmentStatus | 'all')}
                className='w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 shadow-sm'
              >
                <option value='all'>{t('schedule.all') || 'All'}</option>
                <option value='scheduled'>{t('schedule.scheduled') || 'Scheduled'}</option>
                <option value='in_progress'>{t('schedule.inProgress') || 'In Progress'}</option>
                <option value='completed'>{t('schedule.completed') || 'Completed'}</option>
                <option value='cancelled'>{t('schedule.cancelled') || 'Cancelled'}</option>
                <option value='no_show'>{t('schedule.noShow') || 'No Show'}</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label className='block text-sm font-medium text-slate-700 mb-2'>
                {t('schedule.dateRange') || 'Date Range'}
              </label>
              <select
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value as typeof dateFilter)}
                className='w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 shadow-sm'
              >
                <option value='all'>{t('schedule.allDates') || 'All Dates'}</option>
                <option value='today'>{t('schedule.today') || 'Today'}</option>
                <option value='week'>{t('schedule.thisWeek') || 'This Week'}</option>
                <option value='month'>{t('schedule.thisMonth') || 'This Month'}</option>
                <option value='upcoming'>{t('schedule.upcoming') || 'Upcoming'}</option>
                <option value='past'>{t('schedule.past') || 'Past'}</option>
              </select>
            </div>

            {/* Inspector Filter (Admin only) */}
            {userCanManage && (
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-2'>
                  {t('schedule.inspector') || 'Inspector'}
                </label>
                <select
                  value={inspectorFilter}
                  onChange={e => setInspectorFilter(e.target.value)}
                  className='w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 shadow-sm'
                >
                  <option value='all'>{t('schedule.allInspectors') || 'All Inspectors'}</option>
                  {inspectors.map(inspector => (
                    <option key={inspector.id} value={inspector.uid || inspector.id}>
                      {inspector.displayName || inspector.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Hide Options */}
            <div>
              <label className='block text-sm font-medium text-slate-700 mb-2'>
                {t('schedule.options') || 'Options'}
              </label>
              <div className='space-y-2'>
                <label className='flex items-center gap-2 text-sm'>
                  <input
                    type='checkbox'
                    checked={hideCancelled}
                    onChange={e => setHideCancelled(e.target.checked)}
                    className='rounded border-slate-300 text-blue-600 focus:ring-slate-500'
                  />
                  <span>{t('schedule.hideCancelled') || 'Hide Cancelled'}</span>
                </label>
                <label className='flex items-center gap-2 text-sm'>
                  <input
                    type='checkbox'
                    checked={hideCompleted}
                    onChange={e => setHideCompleted(e.target.checked)}
                    className='rounded border-slate-300 text-blue-600 focus:ring-slate-500'
                  />
                  <span>{t('schedule.hideCompleted') || 'Hide Completed'}</span>
                </label>
                <label className='flex items-center gap-2 text-sm'>
                  <input
                    type='checkbox'
                    checked={hideOld}
                    onChange={e => setHideOld(e.target.checked)}
                    className='rounded border-slate-300 text-blue-600 focus:ring-slate-500'
                  />
                  <span>{t('schedule.hideOld') || 'Hide Old (>30 days)'}</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className='bg-red-50 border border-red-200 rounded-material p-4 flex items-start gap-3'>
          <AlertTriangle className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' />
          <div>
            <h3 className='font-medium text-red-900 mb-1'>{t('schedule.errorLoading')}</h3>
            <p className='text-sm text-red-700'>{error}</p>
          </div>
        </div>
      )}

      {/* Today's Appointments for Inspectors */}
      {isInspector && todaysAppointments.length > 0 && (
        <div className='bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-material p-4'>
          <div className='flex items-center gap-2 mb-3'>
            <Calendar className='w-5 h-5 text-blue-600' />
            <h3 className='font-semibold text-blue-900'>{t('schedule.todaysAppointments')}</h3>
            <span className='bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full'>
              {todaysAppointments.length}
            </span>
          </div>
          <div className='space-y-2'>
            {todaysAppointments.map(appointment => (
              <div key={appointment.id} className='bg-white rounded-lg p-3 border border-blue-100'>
                <div className='flex items-center justify-between'>
                  <div className='flex-1'>
                    <div className='font-medium text-slate-900'>{appointment.customerName}</div>
                    <div className='text-sm text-slate-600'>{appointment.customerAddress}</div>
                    <div className='text-sm text-slate-500'>
                      {appointment.scheduledTime} • {appointment.assignedInspectorName}
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        appointment.status === 'scheduled'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {appointment.status === 'scheduled'
                        ? t('schedule.status.scheduled')
                        : t('schedule.status.inProgress')}
                    </span>
                    {appointment.status === 'scheduled' && (
                      <Button
                        size='sm'
                        onClick={() => handleStartAppointment(appointment)}
                        className='bg-blue-600 hover:bg-blue-700'
                      >
                        <CheckCircle className='w-4 h-4' />
                        {t('schedule.appointment.start')}
                      </Button>
                    )}
                    {appointment.status === 'in_progress' && (
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() =>
                          navigate('/report/new', {
                            state: {
                              appointmentId: appointment.id,
                              customerName: appointment.customerName,
                              customerAddress: appointment.customerAddress,
                              customerPhone: appointment.customerPhone,
                              customerEmail: appointment.customerEmail,
                            },
                          })
                        }
                      >
                        <FileText className='w-4 h-4' />
                        {t('schedule.appointment.createReport')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className='bg-white rounded-material shadow-material-2 p-4'>
        <div className='flex items-center gap-2 overflow-x-auto'>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-material text-sm font-medium transition-all duration-material whitespace-nowrap ${
              filterStatus === 'all'
                ? 'bg-blue-600 text-white shadow-material-2'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {t('schedule.filters.allAppointments')} ({appointments.length})
          </button>
          <button
            onClick={() => setFilterStatus('scheduled')}
            className={`px-4 py-2 rounded-material text-sm font-medium transition-all duration-material whitespace-nowrap ${
              filterStatus === 'scheduled'
                ? 'bg-blue-600 text-white shadow-material-2'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {t('schedule.filters.scheduled')} (
            {appointments.filter(a => a.status === 'scheduled').length})
          </button>
          <button
            onClick={() => setFilterStatus('in_progress')}
            className={`px-4 py-2 rounded-material text-sm font-medium transition-all duration-material whitespace-nowrap ${
              filterStatus === 'in_progress'
                ? 'bg-yellow-600 text-white shadow-material-2'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {t('schedule.filters.inProgress')} (
            {appointments.filter(a => a.status === 'in_progress').length})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-4 py-2 rounded-material text-sm font-medium transition-all duration-material whitespace-nowrap ${
              filterStatus === 'completed'
                ? 'bg-green-600 text-white shadow-material-2'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {t('schedule.filters.completed')} (
            {appointments.filter(a => a.status === 'completed').length})
          </button>
          <button
            onClick={() => setFilterStatus('cancelled')}
            className={`px-4 py-2 rounded-material text-sm font-medium transition-all duration-material whitespace-nowrap ${
              filterStatus === 'cancelled'
                ? 'bg-slate-600 text-white shadow-material-2'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {t('schedule.filters.cancelled')} (
            {appointments.filter(a => a.status === 'cancelled').length})
          </button>
        </div>
      </div>

      {/* Appointments List */}
      <div className='bg-white rounded-material shadow-material-2 p-6'>
        <AppointmentList
          appointments={filteredAppointments}
          onEdit={handleEditAppointment}
          onDelete={handleDeleteAppointment}
          onCancel={handleCancelAppointment}
          onStart={handleStartAppointment}
          userCanManage={!!userCanManage}
        />
      </div>

      {/* Appointment Form Dialog */}
      <AppointmentForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingAppointment(null);
        }}
        onSuccess={loadAppointments}
        appointment={editingAppointment}
      />
    </div>
  );
};

export default SchedulePage;
