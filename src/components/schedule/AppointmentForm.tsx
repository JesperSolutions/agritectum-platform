import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useIntl } from '../../hooks/useIntl';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Appointment, AppointmentStatus, Employee, Customer, canAccessAllBranches } from '../../types';
import * as appointmentService from '../../services/appointmentService';
import * as userService from '../../services/userService';
import * as customerService from '../../services/customerService';
import { Calendar, User, AlertTriangle, Loader2 } from 'lucide-react';

interface AppointmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  appointment?: Appointment | null; // If provided, we're editing
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({ isOpen, onClose, onSuccess, appointment }) => {
  const { t } = useIntl();
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const isEditing = !!appointment;

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerCompany, setCustomerCompany] = useState('');
  const [customerId, setCustomerId] = useState<string | undefined>(undefined);

  const [assignedInspectorId, setAssignedInspectorId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [duration, setDuration] = useState(120); // Default 2 hours
  const [appointmentType, setAppointmentType] = useState<'inspection' | 'follow_up' | 'estimate' | 'other'>('inspection');
  const [description, setDescription] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inspectors, setInspectors] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [conflicts, setConflicts] = useState<Appointment[]>([]);

  // Load inspectors on mount
  useEffect(() => {
    if (isOpen && currentUser) {
      loadInspectors();
      loadCustomers();
    }
  }, [isOpen, currentUser]);

  // Helper function to normalize date string (YYYY-MM-DD format)
  const normalizeDateString = (date: Date | string | undefined | null): string => {
    if (!date) return '';
    if (typeof date === 'string') {
      // Extract date part only (in case it's an ISO string with time)
      return date.split('T')[0];
    }
    if (date instanceof Date) {
      // Create local date string without timezone conversion
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return '';
  };

  // Pre-fill form when editing
  useEffect(() => {
    if (appointment) {
      setCustomerName(appointment.customerName);
      setCustomerAddress(appointment.customerAddress);
      setCustomerPhone(appointment.customerPhone || '');
      setCustomerEmail(appointment.customerEmail || '');
      setCustomerCompany(appointment.customerCompany || '');
      setCustomerId(appointment.customerId);
      setAssignedInspectorId(appointment.assignedInspectorId);
      setScheduledDate(normalizeDateString(appointment.scheduledDate));
      setScheduledTime(appointment.scheduledTime);
      setDuration(appointment.duration);
      setAppointmentType(appointment.appointmentType || 'inspection');
      setDescription(appointment.description || '');
    } else {
      resetForm();
    }
  }, [appointment]);

  // Check for conflicts when inspector, date, or time changes
  useEffect(() => {
    if (assignedInspectorId && scheduledDate && scheduledTime) {
      checkForConflicts();
    }
  }, [assignedInspectorId, scheduledDate, scheduledTime, duration]);

  const loadInspectors = async () => {
    try {
      if (!currentUser) return;
      
      // Get inspectors based on user permissions
      const branchId = canAccessAllBranches(currentUser.permissionLevel) ? undefined : currentUser.branchId;
      const allUsers = await userService.getUsers(branchId);
      
      console.log('🔍 Schedule Debug - All users loaded:', allUsers.length);
      console.log('🔍 Schedule Debug - Users data:', allUsers);
      
      const inspectors = allUsers.filter((user: any) => {
        const isInspector = user.permissionLevel === 0 || user.role === 'inspector';
        const isActive = user.isActive !== false; // Default to true if not set
        console.log(`🔍 Schedule Debug - User ${user.displayName}: permissionLevel=${user.permissionLevel}, role=${user.role}, isActive=${user.isActive}, isInspector=${isInspector}, isActive=${isActive}`);
        return isInspector && isActive;
      });
      
      console.log('🔍 Schedule Debug - Filtered inspectors:', inspectors.length, inspectors);
      setInspectors(inspectors);
    } catch (error) {
      console.error('Error loading inspectors:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      if (!currentUser) return;
      
      // Get customers based on user permissions
      const branchId = canAccessAllBranches(currentUser.permissionLevel) ? undefined : currentUser.branchId;
      const allCustomers = await customerService.getCustomers(branchId);
      
      setCustomers(allCustomers);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const checkForConflicts = async () => {
    try {
      const foundConflicts = await appointmentService.checkConflicts(
        assignedInspectorId,
        scheduledDate,
        scheduledTime,
        duration,
        currentUser?.branchId,
        appointment?.id
      );
      setConflicts(foundConflicts);
    } catch (error) {
      console.error('Error checking conflicts:', error);
    }
  };

  const resetForm = () => {
    setCustomerName('');
    setCustomerAddress('');
    setCustomerPhone('');
    setCustomerEmail('');
    setCustomerCompany('');
    setCustomerId(undefined);
    setAssignedInspectorId('');
    setScheduledDate('');
    setScheduledTime('09:00');
    setDuration(120);
    setAppointmentType('inspection');
    setDescription('');
    setError(null);
    setConflicts([]);
    setShowCustomerSearch(false);
    setCustomerSearchTerm('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;

    // Validation
    if (!customerName.trim()) {
      setError(t('schedule.form.validation.customerRequired'));
      return;
    }
    if (!customerAddress.trim()) {
      setError(t('schedule.form.validation.addressRequired'));
      return;
    }
    if (!assignedInspectorId) {
      setError(t('schedule.form.validation.inspectorRequired'));
      return;
    }
    if (!scheduledDate) {
      setError(t('schedule.form.validation.dateRequired'));
      return;
    }
    if (!scheduledTime) {
      setError(t('schedule.form.validation.timeRequired'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const selectedInspector = inspectors.find(i => i.uid === assignedInspectorId);
      if (!selectedInspector) {
        throw new Error('Selected inspector not found');
      }

      // Generate title
      const title = `${t(`schedule.form.types.${appointmentType}`)} - ${customerAddress.split(',')[0]}`;

      // Determine branchId based on user permissions
      let appointmentBranchId: string;
      if (canAccessAllBranches(currentUser.permissionLevel)) {
        // Superadmin: use the inspector's branch
        appointmentBranchId = selectedInspector.branchId || currentUser.branchId || '';
      } else {
        // Branch Admin: use their own branch
        appointmentBranchId = currentUser.branchId!;
      }

      // Normalize date to ensure it's in YYYY-MM-DD format
      const normalizedDate = normalizeDateString(scheduledDate);

      const appointmentData = {
        branchId: appointmentBranchId,
        customerId,
        customerName,
        customerAddress,
        customerPhone: customerPhone || undefined,
        customerEmail: customerEmail || undefined,
        customerCompany: customerCompany || undefined,
        assignedInspectorId,
        assignedInspectorName: selectedInspector.displayName,
        scheduledDate: normalizedDate,
        scheduledTime,
        duration,
        status: (appointment?.status || 'scheduled') as AppointmentStatus,
        title,
        description: description || undefined,
        appointmentType,
        createdBy: currentUser.uid,
        createdByName: currentUser.displayName || currentUser.email,
      };

      if (isEditing && appointment) {
        await appointmentService.updateAppointment(appointment.id, appointmentData);
        showSuccess(t('schedule.appointment.updatedSuccessfully') || 'Appointment updated successfully');
      } else {
        await appointmentService.createAppointment(appointmentData);
        showSuccess(t('schedule.appointment.createdSuccessfully') || 'Appointment scheduled successfully');
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      const errorMsg = err.message || t(isEditing ? 'schedule.error.update' : 'schedule.error.create') || 'Failed to save appointment';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setCustomerId(customer.id);
    setCustomerName(customer.name);
    setCustomerAddress(customer.address || '');
    setCustomerPhone(customer.phone || '');
    setCustomerEmail(customer.email || '');
    setCustomerCompany(customer.company || '');
    setShowCustomerSearch(false);
    setCustomerSearchTerm('');
  };

  const filteredCustomers = useMemo(() => {
    if (!customerSearchTerm.trim()) return customers.slice(0, 5);
    
    const searchLower = customerSearchTerm.toLowerCase();
    return customers
      .filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.address?.toLowerCase().includes(searchLower) ||
        c.phone?.toLowerCase().includes(searchLower) ||
        c.email?.toLowerCase().includes(searchLower)
      )
      .slice(0, 10);
  }, [customers, customerSearchTerm]);

  const selectedInspectorName = useMemo(() => {
    const inspector = inspectors.find(i => i.uid === assignedInspectorId);
    return inspector?.displayName || '';
  }, [inspectors, assignedInspectorId]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-2xl font-light'>
            {isEditing ? t('schedule.form.editTitle') : t('schedule.form.createTitle')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Customer Section */}
          <div className='space-y-4 p-4 bg-gray-50 rounded-material'>
            <h3 className='text-sm font-medium text-gray-700 uppercase tracking-wide flex items-center gap-2'>
              <User className='w-4 h-4' />
              {t('schedule.form.customer')}
            </h3>

            {/* Customer Search */}
            <div className='space-y-2'>
              <Label htmlFor='customer-search'>{t('schedule.form.customerSearch')}</Label>
              <div className='relative'>
                <Input
                  id='customer-search'
                  type='text'
                  placeholder={t('schedule.form.customerPlaceholder')}
                  value={customerSearchTerm}
                  onChange={(e) => {
                    setCustomerSearchTerm(e.target.value);
                    setShowCustomerSearch(true);
                  }}
                  onFocus={() => setShowCustomerSearch(true)}
                />
                {showCustomerSearch && filteredCustomers.length > 0 && (
                  <div className='absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-material shadow-material-3 max-h-60 overflow-y-auto'>
                    {filteredCustomers.map((customer) => (
                      <button
                        key={customer.id}
                        type='button'
                        onClick={() => handleCustomerSelect(customer)}
                        className='w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors'
                      >
                        <div className='font-medium'>{customer.name}</div>
                        <div className='text-sm text-gray-600'>{customer.address}</div>
                        {customer.phone && (
                          <div className='text-xs text-gray-500'>{customer.phone}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='customerName'>{t('schedule.form.customerName')}</Label>
                <Input
                  id='customerName'
                  type='text'
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  title={t('schedule.validation.fillThisField')}
                  onInvalid={(e) => {
                    e.preventDefault();
                    (e.target as HTMLInputElement).setCustomValidity(t('schedule.validation.customerRequired'));
                  }}
                  onInput={(e) => {
                    (e.target as HTMLInputElement).setCustomValidity('');
                  }}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='customerCompany'>{t('schedule.form.customerCompany')}</Label>
                <Input
                  id='customerCompany'
                  type='text'
                  value={customerCompany}
                  onChange={(e) => setCustomerCompany(e.target.value)}
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='customerAddress'>{t('schedule.form.customerAddress')}</Label>
              <Input
                id='customerAddress'
                type='text'
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                required
                title={t('schedule.validation.fillThisField')}
                onInvalid={(e) => {
                  e.preventDefault();
                  (e.target as HTMLInputElement).setCustomValidity(t('schedule.validation.addressRequired'));
                }}
                onInput={(e) => {
                  (e.target as HTMLInputElement).setCustomValidity('');
                }}
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='customerPhone'>{t('schedule.form.customerPhone')}</Label>
                <Input
                  id='customerPhone'
                  type='tel'
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='customerEmail'>{t('schedule.form.customerEmail')}</Label>
                <Input
                  id='customerEmail'
                  type='email'
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Scheduling Section */}
          <div className='space-y-4 p-4 bg-gray-50 rounded-material'>
            <h3 className='text-sm font-medium text-gray-700 uppercase tracking-wide flex items-center gap-2'>
              <Calendar className='w-4 h-4' />
              {t('schedule.form.title')}
            </h3>

            <div className='space-y-2'>
              <Label htmlFor='inspector'>{t('schedule.form.inspector')}</Label>
              <select
                id='inspector'
                value={assignedInspectorId}
                onChange={(e) => setAssignedInspectorId(e.target.value)}
                className='flex h-10 w-full rounded-material border border-input bg-gray-50 px-4 py-2.5 text-base font-light shadow-material-1 transition-all duration-material focus-visible:outline-none focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-ring focus-visible:shadow-material-2'
                required
                title={t('schedule.validation.fillThisField')}
                onInvalid={(e) => {
                  e.preventDefault();
                  (e.target as HTMLSelectElement).setCustomValidity(t('schedule.validation.inspectorRequired'));
                }}
                onInput={(e) => {
                  (e.target as HTMLSelectElement).setCustomValidity('');
                }}
              >
                <option value=''>{t('schedule.form.inspectorPlaceholder')}</option>
                {inspectors.map((inspector) => (
                  <option key={inspector.uid} value={inspector.uid}>
                    {inspector.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='date'>{t('schedule.form.date')}</Label>
                <Input
                  id='date'
                  type='date'
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  title={t('schedule.validation.fillThisField')}
                  onInvalid={(e) => {
                    e.preventDefault();
                    (e.target as HTMLInputElement).setCustomValidity(t('schedule.validation.dateRequired'));
                  }}
                  onInput={(e) => {
                    (e.target as HTMLInputElement).setCustomValidity('');
                  }}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='time'>{t('schedule.form.time')}</Label>
                <Input
                  id='time'
                  type='time'
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  required
                  title={t('schedule.validation.fillThisField')}
                  onInvalid={(e) => {
                    e.preventDefault();
                    (e.target as HTMLInputElement).setCustomValidity(t('schedule.validation.timeRequired'));
                  }}
                  onInput={(e) => {
                    (e.target as HTMLInputElement).setCustomValidity('');
                  }}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='duration'>{t('schedule.form.duration')}</Label>
                <select
                  id='duration'
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className='flex h-10 w-full rounded-material border border-input bg-gray-50 px-4 py-2.5 text-base font-light shadow-material-1 transition-all duration-material focus-visible:outline-none focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-ring focus-visible:shadow-material-2'
                  required
                >
                  <option value={30}>30 min</option>
                  <option value={60}>1 h</option>
                  <option value={90}>1.5 h</option>
                  <option value={120}>2 h</option>
                  <option value={180}>3 h</option>
                  <option value={240}>4 h</option>
                  <option value={360}>6 h</option>
                  <option value={480}>8 h</option>
                </select>
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='appointmentType'>{t('schedule.form.appointmentType')}</Label>
              <select
                id='appointmentType'
                value={appointmentType}
                onChange={(e) => setAppointmentType(e.target.value as any)}
                className='flex h-10 w-full rounded-material border border-input bg-gray-50 px-4 py-2.5 text-base font-light shadow-material-1 transition-all duration-material focus-visible:outline-none focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-ring focus-visible:shadow-material-2'
              >
                <option value='inspection'>{t('schedule.form.types.inspection')}</option>
                <option value='follow_up'>{t('schedule.form.types.followUp')}</option>
                <option value='estimate'>{t('schedule.form.types.estimate')}</option>
                <option value='other'>{t('schedule.form.types.other')}</option>
              </select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='description'>{t('schedule.form.description')}</Label>
              <textarea
                id='description'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('schedule.form.descriptionPlaceholder')}
                rows={3}
                className='flex w-full rounded-material border border-input bg-gray-50 px-4 py-2.5 text-base font-light shadow-material-1 transition-all duration-material focus-visible:outline-none focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-ring focus-visible:shadow-material-2 resize-none'
              />
            </div>

            {/* Conflict Warning */}
            {conflicts.length > 0 && (
              <div className='flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-material'>
                <AlertTriangle className='w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5' />
                <div className='text-sm text-yellow-800'>
                  {t('schedule.form.conflictWarning', { inspector: selectedInspectorName })}
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className='p-4 bg-red-50 border border-red-200 rounded-material text-red-800 text-sm'>
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                onClose();
                resetForm();
              }}
              disabled={loading}
            >
              {t('schedule.form.cancel')}
            </Button>
            <Button type='submit' disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className='w-4 h-4 animate-spin' />
                  {t('schedule.form.saving')}
                </>
              ) : (
                t('schedule.form.save')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentForm;

