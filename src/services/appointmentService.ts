import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { logger } from '../utils/logger';
import { Appointment, User, canAccessAllBranches } from '../types';

/**
 * Get appointments based on user permissions
 */
export const getAppointments = async (user: User): Promise<Appointment[]> => {
  try {
    const appointmentsRef = collection(db, 'appointments');
    let q;

    if (canAccessAllBranches(user.permissionLevel)) {
      // Superadmin: see all appointments
      q = query(appointmentsRef, orderBy('scheduledDate', 'desc'));
    } else if (user.permissionLevel >= 1 && user.branchId) {
      // Branch Admin: see all appointments in their branch
      q = query(
        appointmentsRef,
        where('branchId', '==', user.branchId),
        orderBy('scheduledDate', 'desc')
      );
    } else if (user.uid) {
      // Inspector: see only their own appointments
      // Note: This query requires a Firestore composite index on (assignedInspectorId, scheduledDate)
      logger.log('🔍 Inspector query - UID:', user.uid, 'BranchId:', user.branchId);
      try {
        q = query(
          appointmentsRef,
          where('assignedInspectorId', '==', user.uid),
          orderBy('scheduledDate', 'desc')
        );
      } catch (queryError: any) {
        // If composite index error, try without orderBy
        if (queryError.code === 'failed-precondition' || queryError.message?.includes('index')) {
          logger.warn('⚠️ Composite index missing, querying without orderBy:', queryError);
          q = query(appointmentsRef, where('assignedInspectorId', '==', user.uid));
        } else {
          throw queryError;
        }
      }
    } else {
      logger.warn('⚠️ Cannot query appointments - missing user.uid');
      return [];
    }

    const querySnapshot = await getDocs(q);
    const appointments = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Appointment[];

    // Sort manually if we couldn't use orderBy
    if (appointments.length > 0 && !q) {
      appointments.sort((a, b) => {
        const dateA = a.scheduledDate || '';
        const dateB = b.scheduledDate || '';
        return dateB.localeCompare(dateA); // Descending
      });
    }

    logger.log(`✅ Loaded ${appointments.length} appointments for user ${user.uid}`);
    return appointments;
  } catch (error: any) {
    console.error('❌ Error fetching appointments:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack,
    });
    // Provide more helpful error message
    if (error.code === 'failed-precondition') {
      throw new Error(
        'Firestore index required. Please create a composite index for (assignedInspectorId, scheduledDate) in Firestore.'
      );
    }
    throw new Error(error.message || 'Failed to fetch appointments');
  }
};

/**
 * Get a single appointment by ID
 */
export const getAppointment = async (appointmentId: string): Promise<Appointment | null> => {
  try {
    const appointmentRef = doc(db, 'appointments', appointmentId);
    const appointmentSnap = await getDoc(appointmentRef);

    if (!appointmentSnap.exists()) {
      return null;
    }

    return { id: appointmentSnap.id, ...appointmentSnap.data() } as Appointment;
  } catch (error) {
    console.error('Error fetching appointment:', error);
    throw new Error('Failed to fetch appointment');
  }
};

/**
 * Get appointments for a specific date (for inspector's "Today's Schedule")
 * IMPORTANT: For branch admins, you MUST provide branchId to satisfy security rules
 */
export const getAppointmentsByDate = async (
  date: string,
  inspectorId?: string,
  branchId?: string
): Promise<Appointment[]> => {
  try {
    const appointmentsRef = collection(db, 'appointments');
    let q;

    if (inspectorId && branchId) {
      // Get appointments for specific inspector in a branch on this date
      // This satisfies security rules for branch admins
      q = query(
        appointmentsRef,
        where('scheduledDate', '==', date),
        where('assignedInspectorId', '==', inspectorId),
        where('branchId', '==', branchId)
      );
    } else if (inspectorId) {
      // Get appointments for specific inspector on this date (inspector's own view)
      q = query(
        appointmentsRef,
        where('scheduledDate', '==', date),
        where('assignedInspectorId', '==', inspectorId)
      );
    } else if (branchId) {
      // Get appointments for entire branch on this date
      q = query(
        appointmentsRef,
        where('scheduledDate', '==', date),
        where('branchId', '==', branchId)
      );
    } else {
      // Get all appointments for this date (superadmin only)
      q = query(appointmentsRef, where('scheduledDate', '==', date));
    }

    const querySnapshot = await getDocs(q);
    const appointments = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Appointment[];

    // Sort by time
    return appointments.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  } catch (error) {
    console.error('Error fetching appointments by date:', error);
    throw new Error('Failed to fetch appointments by date');
  }
};

/**
 * Get upcoming appointments for an inspector (next 7 days)
 */
export const getUpcomingAppointments = async (
  inspectorId: string,
  days: number = 7
): Promise<Appointment[]> => {
  try {
    const appointmentsRef = collection(db, 'appointments');
    const today = new Date().toISOString().split('T')[0];

    const q = query(
      appointmentsRef,
      where('assignedInspectorId', '==', inspectorId),
      where('scheduledDate', '>=', today),
      where('status', 'in', ['scheduled', 'in_progress'])
    );

    const querySnapshot = await getDocs(q);
    const appointments = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Appointment[];

    // Filter to next X days and sort
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    return appointments
      .filter(apt => apt.scheduledDate <= futureDateStr)
      .sort((a, b) => {
        const dateCompare = a.scheduledDate.localeCompare(b.scheduledDate);
        if (dateCompare !== 0) return dateCompare;
        return a.scheduledTime.localeCompare(b.scheduledTime);
      });
  } catch (error) {
    console.error('Error fetching upcoming appointments:', error);
    throw new Error('Failed to fetch upcoming appointments');
  }
};

/**
 * Generate a unique public token for customer access
 */
const generatePublicToken = (): string => {
  return `visit_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * Create a new appointment and automatically create corresponding scheduledVisit
 */
export const createAppointment = async (
  appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const appointmentsRef = collection(db, 'appointments');
    const now = new Date().toISOString();

    // Set initial customer response to pending
    const appointmentWithResponse = {
      ...appointmentData,
      customerResponse: 'pending' as const,
      createdAt: now,
      updatedAt: now,
    };

    // Filter out undefined values to prevent Firestore errors
    const cleanData = Object.fromEntries(
      Object.entries(appointmentWithResponse).filter(([_, value]) => value !== undefined)
    );

    const docRef = await addDoc(appointmentsRef, cleanData);
    const appointmentId = docRef.id;

    // Automatically create corresponding scheduledVisit for customer portal
    if (appointmentData.customerId || appointmentData.customerEmail) {
      try {
        const { createScheduledVisit } = await import('./scheduledVisitService');
        const publicToken = generatePublicToken();

        // Map appointment type to visit type
        const visitTypeMap: Record<string, 'inspection' | 'maintenance' | 'repair' | 'other'> = {
          inspection: 'inspection',
          follow_up: 'maintenance',
          estimate: 'other',
          other: 'other',
        };

        const scheduledVisitData = {
          branchId: appointmentData.branchId,
          customerId: appointmentData.customerId,
          customerName: appointmentData.customerName,
          customerAddress: appointmentData.customerAddress,
          customerPhone: appointmentData.customerPhone,
          customerEmail: appointmentData.customerEmail,
          customerCompany: appointmentData.customerCompany,
          assignedInspectorId: appointmentData.assignedInspectorId,
          assignedInspectorName: appointmentData.assignedInspectorName,
          scheduledDate: appointmentData.scheduledDate,
          scheduledTime: appointmentData.scheduledTime,
          duration: appointmentData.duration,
          status: 'scheduled' as const,
          appointmentId: appointmentId,
          customerResponse: 'pending' as const,
          publicToken: publicToken,
          title: appointmentData.title,
          description: appointmentData.description,
          visitType: visitTypeMap[appointmentData.appointmentType || 'inspection'] || 'inspection',
          createdBy: appointmentData.createdBy,
          createdByName: appointmentData.createdByName,
        };

        const scheduledVisitId = await createScheduledVisit(scheduledVisitData);

        // Link scheduledVisit back to appointment
        await updateDoc(docRef, {
          scheduledVisitId: scheduledVisitId,
        });

        logger.log('✅ Created scheduledVisit for appointment:', {
          appointmentId,
          scheduledVisitId,
        });
      } catch (visitError) {
        console.error('⚠️ Failed to create scheduledVisit (non-blocking):', visitError);
        // Don't fail appointment creation if scheduledVisit creation fails
      }
    }

    return appointmentId;
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw new Error('Failed to create appointment');
  }
};

/**
 * Update an existing appointment
 */
export const updateAppointment = async (
  appointmentId: string,
  updates: Partial<Appointment>
): Promise<void> => {
  try {
    const appointmentRef = doc(db, 'appointments', appointmentId);
    await updateDoc(appointmentRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw new Error('Failed to update appointment');
  }
};

/**
 * Delete an appointment
 */
export const deleteAppointment = async (appointmentId: string): Promise<void> => {
  try {
    const appointmentRef = doc(db, 'appointments', appointmentId);
    await deleteDoc(appointmentRef);
  } catch (error) {
    console.error('Error deleting appointment:', error);
    throw new Error('Failed to delete appointment');
  }
};

/**
 * Mark appointment as in progress and optionally create a linked report
 */
export const startAppointment = async (appointmentId: string): Promise<void> => {
  try {
    await updateAppointment(appointmentId, {
      status: 'in_progress',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error starting appointment:', error);
    throw new Error('Failed to start appointment');
  }
};

/**
 * Mark appointment as completed
 */
export const completeAppointment = async (
  appointmentId: string,
  reportId?: string,
  inspectorNotes?: string
): Promise<void> => {
  try {
    const updates: Partial<Appointment> = {
      status: 'completed',
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (reportId) {
      updates.reportId = reportId;
    }

    if (inspectorNotes) {
      updates.inspectorNotes = inspectorNotes;
    }

    await updateAppointment(appointmentId, updates);
  } catch (error) {
    console.error('Error completing appointment:', error);
    throw new Error('Failed to complete appointment');
  }
};

/**
 * Cancel an appointment
 */
export const cancelAppointment = async (appointmentId: string, reason?: string): Promise<void> => {
  try {
    await updateAppointment(appointmentId, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancelReason: reason,
      customerResponse: 'rejected',
      updatedAt: new Date().toISOString(),
    });

    // Also cancel corresponding scheduledVisit if linked
    const appointment = await getAppointment(appointmentId);
    if (appointment?.scheduledVisitId) {
      try {
        const { updateScheduledVisit } = await import('./scheduledVisitService');
        await updateScheduledVisit(appointment.scheduledVisitId, {
          status: 'cancelled',
          cancelledAt: new Date().toISOString(),
          cancelReason: reason,
          customerResponse: 'rejected',
        });
      } catch (visitError) {
        console.error('Error updating scheduled visit:', visitError);
        // Don't fail appointment cancellation if visit update fails
      }
    }
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    throw new Error('Failed to cancel appointment');
  }
};

/**
 * Check for scheduling conflicts (same inspector, overlapping time)
 * For branch admins, branchId must be provided to satisfy security rules
 */
export const checkConflicts = async (
  inspectorId: string,
  date: string,
  startTime: string,
  duration: number,
  branchId?: string,
  excludeAppointmentId?: string
): Promise<Appointment[]> => {
  try {
    const appointments = await getAppointmentsByDate(date, inspectorId, branchId);

    // Filter out the appointment being edited
    const otherAppointments = excludeAppointmentId
      ? appointments.filter(apt => apt.id !== excludeAppointmentId)
      : appointments;

    // Check for time overlaps
    const conflicts = otherAppointments.filter(apt => {
      if (apt.status === 'cancelled' || apt.status === 'no_show') {
        return false;
      }

      // Parse times (assuming HH:MM format)
      const [startHour, startMin] = startTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = startMinutes + duration;

      const [aptStartHour, aptStartMin] = apt.scheduledTime.split(':').map(Number);
      const aptStartMinutes = aptStartHour * 60 + aptStartMin;
      const aptEndMinutes = aptStartMinutes + apt.duration;

      // Check for overlap
      return (
        (startMinutes >= aptStartMinutes && startMinutes < aptEndMinutes) ||
        (endMinutes > aptStartMinutes && endMinutes <= aptEndMinutes) ||
        (startMinutes <= aptStartMinutes && endMinutes >= aptEndMinutes)
      );
    });

    return conflicts;
  } catch (error) {
    console.error('Error checking conflicts:', error);
    throw new Error('Failed to check conflicts');
  }
};
