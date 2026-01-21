import React from 'react';
import { Appointment, AppointmentStatus } from '../../types';
import { useIntl } from '../../hooks/useIntl';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Link } from 'react-router-dom';
import EmptyState from '../common/EmptyState';
import { formatSwedishDate } from '../../utils/dateFormatter';

interface AppointmentListProps {
  appointments: Appointment[];
  onEdit: (appointment: Appointment) => void;
  onDelete: (appointment: Appointment) => void;
  onCancel: (appointment: Appointment) => void;
  onStart: (appointment: Appointment) => void;
  userCanManage: boolean; // Whether current user can edit/delete
}

const AppointmentList: React.FC<AppointmentListProps> = ({
  appointments,
  onEdit,
  onDelete,
  onCancel,
  onStart,
  userCanManage,
}) => {
  const { t } = useIntl();

  const getStatusColor = (status: AppointmentStatus): string => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'no_show':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: AppointmentStatus): string => {
    return t(
      `schedule.status.${status === 'in_progress' ? 'inProgress' : status === 'no_show' ? 'noShow' : status}`
    );
  };

  // Use centralized date formatter
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '-';
    // If it's already in YYYY-MM-DD format, create a date object
    if (dateStr.includes('-') && dateStr.length === 10) {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return formatSwedishDate(date);
    }
    return formatSwedishDate(dateStr);
  };

  const isUpcoming = (appointment: Appointment): boolean => {
    const now = new Date();
    // Parse date as local date without timezone conversion
    const [year, month, day] = appointment.scheduledDate.split('-').map(Number);
    const [hour, minute] = appointment.scheduledTime.split(':').map(Number);
    // Create date in local timezone
    const appointmentDate = new Date(year, month - 1, day, hour, minute);
    return (
      appointmentDate > now &&
      (appointment.status === 'scheduled' || appointment.status === 'in_progress')
    );
  };

  if (appointments.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title={t('schedule.noAppointments')}
        description={t('schedule.noAppointmentsMessage')}
      />
    );
  }

  return (
    <div className='space-y-4'>
      {/* Desktop Table View */}
      <div className='hidden lg:block overflow-x-auto'>
        <table className='w-full'>
          <thead>
            <tr className='border-b-2 border-gray-200'>
              <th className='text-left py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wide'>
                {t('schedule.list.date')}
              </th>
              <th className='text-left py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wide'>
                {t('schedule.list.customer')}
              </th>
              <th className='text-left py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wide'>
                {t('schedule.list.address')}
              </th>
              <th className='text-left py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wide'>
                {t('schedule.list.inspector')}
              </th>
              <th className='text-left py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wide'>
                {t('schedule.list.status')}
              </th>
              <th className='text-right py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wide'>
                {t('schedule.list.actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {appointments.map(appointment => (
              <tr
                key={appointment.id}
                className='border-b border-gray-100 hover:bg-gray-50 transition-colors'
              >
                <td className='py-4 px-4'>
                  <div className='flex items-center gap-2'>
                    <Calendar className='w-4 h-4 text-gray-400' />
                    <div>
                      <div className='font-medium text-gray-900'>
                        {formatDate(appointment.scheduledDate)}
                      </div>
                      <div className='text-sm text-gray-500 flex items-center gap-1'>
                        <Clock className='w-3 h-3' />
                        {appointment.scheduledTime} ({appointment.duration} min)
                      </div>
                    </div>
                  </div>
                </td>
                <td className='py-4 px-4'>
                  <div className='font-medium text-gray-900'>{appointment.customerName}</div>
                  {appointment.customerCompany && (
                    <div className='text-sm text-gray-500'>{appointment.customerCompany}</div>
                  )}
                </td>
                <td className='py-4 px-4'>
                  <div className='flex items-start gap-2'>
                    <MapPin className='w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0' />
                    <span className='text-gray-700'>{appointment.customerAddress}</span>
                  </div>
                </td>
                <td className='py-4 px-4'>
                  <div className='flex items-center gap-2'>
                    <User className='w-4 h-4 text-gray-400' />
                    <span className='text-gray-700'>{appointment.assignedInspectorName}</span>
                  </div>
                </td>
                <td className='py-4 px-4'>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}
                  >
                    {getStatusLabel(appointment.status)}
                  </span>
                </td>
                <td className='py-4 px-4'>
                  <div className='flex items-center justify-end gap-2'>
                    {appointment.reportId && (
                      <Link to={`/report/view/${appointment.reportId}`}>
                        <Button
                          variant='ghost'
                          size='sm'
                          title={t('schedule.list.viewReport') || 'View Report'}
                        >
                          <FileText className='w-4 h-4' />
                        </Button>
                      </Link>
                    )}

                    {!appointment.reportId &&
                      isUpcoming(appointment) &&
                      appointment.status === 'scheduled' && (
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => onStart(appointment)}
                          title={t('schedule.appointment.start')}
                        >
                          <CheckCircle className='w-4 h-4 text-green-600' />
                        </Button>
                      )}

                    {!appointment.reportId && appointment.status === 'in_progress' && (
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => onStart(appointment)}
                        title={t('schedule.appointment.createReport')}
                      >
                        <FileText className='w-4 h-4 text-blue-600' />
                      </Button>
                    )}

                    {userCanManage &&
                      (appointment.status === 'scheduled' ||
                        appointment.status === 'in_progress' ||
                        appointment.status === 'no_show') && (
                        <>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => onEdit(appointment)}
                            title={t('schedule.appointment.edit')}
                          >
                            <Edit className='w-4 h-4' />
                          </Button>

                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => onCancel(appointment)}
                            title={t('schedule.appointment.cancel')}
                          >
                            <Ban className='w-4 h-4 text-orange-600' />
                          </Button>

                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => onDelete(appointment)}
                            title={t('schedule.appointment.delete')}
                          >
                            <Trash2 className='w-4 h-4 text-red-600' />
                          </Button>
                        </>
                      )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className='lg:hidden space-y-4'>
        {appointments.map(appointment => (
          <div
            key={appointment.id}
            className='bg-white rounded-material shadow-material-2 p-4 space-y-3'
          >
            {/* Header */}
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <div className='font-medium text-gray-900 mb-1'>{appointment.customerName}</div>
                {appointment.customerCompany && (
                  <div className='text-sm text-gray-500 mb-2'>{appointment.customerCompany}</div>
                )}
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Calendar className='w-4 h-4' />
                  {formatDate(appointment.scheduledDate)}
                  <Clock className='w-4 h-4 ml-2' />
                  {appointment.scheduledTime}
                </div>
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}
              >
                {getStatusLabel(appointment.status)}
              </span>
            </div>

            {/* Details */}
            <div className='space-y-2 text-sm'>
              <div className='flex items-start gap-2'>
                <MapPin className='w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0' />
                <span className='text-gray-700'>{appointment.customerAddress}</span>
              </div>
              <div className='flex items-center gap-2'>
                <User className='w-4 h-4 text-gray-400' />
                <span className='text-gray-700'>{appointment.assignedInspectorName}</span>
              </div>
            </div>

            {/* Actions */}
            <div className='flex items-center gap-2 pt-2 border-t border-gray-100'>
              {appointment.reportId && (
                <Link to={`/report/view/${appointment.reportId}`} className='flex-1'>
                  <Button variant='outline' size='sm' className='w-full'>
                    <FileText className='w-4 h-4' />
                    {t('schedule.list.viewReport') || 'View Report'}
                  </Button>
                </Link>
              )}

              {!appointment.reportId &&
                isUpcoming(appointment) &&
                appointment.status === 'scheduled' && (
                  <Button
                    variant='default'
                    size='sm'
                    onClick={() => onStart(appointment)}
                    className='flex-1'
                  >
                    <CheckCircle className='w-4 h-4' />
                    {t('schedule.appointment.start')}
                  </Button>
                )}

              {!appointment.reportId && appointment.status === 'in_progress' && (
                <Button
                  variant='default'
                  size='sm'
                  onClick={() => onStart(appointment)}
                  className='flex-1'
                >
                  <FileText className='w-4 h-4' />
                  {t('schedule.appointment.createReport')}
                </Button>
              )}

              {userCanManage &&
                (appointment.status === 'scheduled' ||
                  appointment.status === 'in_progress' ||
                  appointment.status === 'no_show') && (
                  <>
                    <Button variant='outline' size='sm' onClick={() => onEdit(appointment)}>
                      <Edit className='w-4 h-4' />
                    </Button>

                    <Button variant='outline' size='sm' onClick={() => onCancel(appointment)}>
                      <Ban className='w-4 h-4' />
                    </Button>

                    <Button variant='ghost' size='sm' onClick={() => onDelete(appointment)}>
                      <Trash2 className='w-4 h-4 text-red-600' />
                    </Button>
                  </>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppointmentList;
