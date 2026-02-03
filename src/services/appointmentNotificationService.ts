import { collection, doc, addDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Appointment, ScheduledVisit } from '../types';
import { logger } from '../utils/logger';
import { enqueueEmail } from './emailCenter';

/**
 * Generate a unique public token for customer access
 */
const generatePublicToken = (): string => {
  return `visit_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * Notify customer when an appointment is created
 */
export const notifyCustomerOfAppointment = async (
  appointment: Appointment,
  scheduledVisit: ScheduledVisit
): Promise<void> => {
  try {
    // Send email notification to customer
    if (appointment.customerEmail) {
      const publicLink = `${window.location.origin}/portal/appointment/${scheduledVisit.id}/respond?token=${scheduledVisit.publicToken}`;

      await enqueueEmail(
        {
          to: appointment.customerEmail,
          template: {
            name: 'appointment-created',
            data: {
              customerName: appointment.customerName,
              appointmentDate: appointment.scheduledDate,
              appointmentTime: appointment.scheduledTime,
              inspectorName: appointment.assignedInspectorName,
              address: appointment.customerAddress,
              publicLink: publicLink,
            },
          },
        },
        {
          reportId: appointment.id,
          customerName: appointment.customerName,
          sentBy: appointment.createdBy,
        }
      );
    }

    // Create in-app notification for customer (if they have an account)
    if (appointment.customerId) {
      const notificationsRef = collection(db, 'notifications');
      const publicLink = `/portal/appointment/${scheduledVisit.id}/respond?token=${scheduledVisit.publicToken}`;

      await addDoc(notificationsRef, {
        userId: appointment.customerId,
        type: 'appointment_created',
        title: 'New Roof Inspection Scheduled',
        message: `A roof inspection has been scheduled for ${appointment.scheduledDate} at ${appointment.scheduledTime}. Please accept or deny this appointment.`,
        link: publicLink,
        read: false,
        metadata: {
          appointmentId: appointment.id,
          scheduledVisitId: scheduledVisit.id,
          category: 'appointment',
          priority: 'medium',
        },
        createdAt: serverTimestamp(),
      });
    }

    logger.log('✅ Customer notification sent for appointment:', appointment.id);
  } catch (error) {
    console.error('❌ Error notifying customer:', error);
    // Don't throw - notification failure should not block appointment creation
  }
};

/**
 * Notify customer when appointment is accepted
 */
export const notifyCustomerOfAcceptance = async (
  appointment: Appointment,
  scheduledVisit: ScheduledVisit
): Promise<void> => {
  try {
    // Send confirmation email
    if (appointment.customerEmail) {
      await enqueueEmail(
        {
          to: appointment.customerEmail,
          template: {
            name: 'appointment-accepted',
            data: {
              customerName: appointment.customerName,
              appointmentDate: appointment.scheduledDate,
              appointmentTime: appointment.scheduledTime,
              inspectorName: appointment.assignedInspectorName,
              address: appointment.customerAddress,
            },
          },
        },
        {
          reportId: appointment.id,
          customerName: appointment.customerName,
          sentBy: appointment.createdBy,
        }
      );
    }

    // Create in-app notification
    if (appointment.customerId) {
      const notificationsRef = collection(db, 'notifications');

      await addDoc(notificationsRef, {
        userId: appointment.customerId,
        type: 'appointment_accepted',
        title: 'Appointment Accepted',
        message: `Your roof inspection on ${appointment.scheduledDate} at ${appointment.scheduledTime} has been confirmed.`,
        link: `/portal/scheduled-visits`,
        read: false,
        metadata: {
          appointmentId: appointment.id,
          scheduledVisitId: scheduledVisit.id,
          category: 'appointment',
          priority: 'low',
        },
        createdAt: serverTimestamp(),
      });
    }

    // Notify roofer that appointment was accepted
    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
      userId: appointment.assignedInspectorId,
      type: 'appointment_accepted',
      title: 'Appointment Accepted by Customer',
      message: `${appointment.customerName} has accepted the appointment on ${appointment.scheduledDate} at ${appointment.scheduledTime}.`,
      link: `/schedule`,
      read: false,
      metadata: {
        appointmentId: appointment.id,
        category: 'appointment',
        priority: 'medium',
      },
      createdAt: serverTimestamp(),
    });

    logger.log('✅ Acceptance notifications sent');
  } catch (error) {
    console.error('❌ Error sending acceptance notifications:', error);
  }
};

/**
 * Notify customer and branch manager when appointment is rejected
 */
export const notifyOfRejection = async (
  appointment: Appointment,
  scheduledVisit: ScheduledVisit,
  reason?: string
): Promise<void> => {
  try {
    // Notify branch manager
    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
      userId: appointment.createdBy,
      type: 'appointment_rejected',
      title: 'Appointment Rejected by Customer',
      message: `${appointment.customerName} has rejected the appointment scheduled for ${appointment.scheduledDate} at ${appointment.scheduledTime}.${reason ? ` Reason: ${reason}` : ''}`,
      link: `/schedule`,
      read: false,
      metadata: {
        appointmentId: appointment.id,
        scheduledVisitId: scheduledVisit.id,
        category: 'appointment',
        priority: 'high',
      },
      createdAt: serverTimestamp(),
    });

    // Send email to branch manager if available
    try {
      const userRef = doc(db, 'users', appointment.createdBy);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists() && userSnap.data().email) {
        await enqueueEmail(
          {
            to: userSnap.data().email,
            template: {
              name: 'appointment-rejected',
              data: {
                customerName: appointment.customerName,
                appointmentDate: appointment.scheduledDate,
                appointmentTime: appointment.scheduledTime,
                reason: reason || 'No reason provided',
              },
            },
          },
          {
            reportId: appointment.id,
            customerName: appointment.customerName,
            sentBy: appointment.createdBy,
          }
        );
      }
    } catch (emailError) {
      console.error('Error sending rejection email:', emailError);
    }

    logger.log('✅ Rejection notifications sent');
  } catch (error) {
    console.error('❌ Error sending rejection notifications:', error);
  }
};

/**
 * Send reminder notifications (day before appointment)
 */
export const sendAppointmentReminders = async (
  appointment: Appointment,
  scheduledVisit: ScheduledVisit
): Promise<void> => {
  try {
    // Notify customer
    if (appointment.customerId) {
      const notificationsRef = collection(db, 'notifications');
      await addDoc(notificationsRef, {
        userId: appointment.customerId,
        type: 'appointment_reminder',
        title: 'Reminder: Roof Inspection Tomorrow',
        message: `Your roof inspection is scheduled for tomorrow (${appointment.scheduledDate}) at ${appointment.scheduledTime}.`,
        link: `/portal/scheduled-visits`,
        read: false,
        metadata: {
          appointmentId: appointment.id,
          scheduledVisitId: scheduledVisit.id,
          category: 'appointment',
          priority: 'medium',
        },
        createdAt: serverTimestamp(),
      });
    }

    // Send email reminder to customer
    if (appointment.customerEmail) {
      await enqueueEmail(
        {
          to: appointment.customerEmail,
          template: {
            name: 'appointment-reminder',
            data: {
              customerName: appointment.customerName,
              appointmentDate: appointment.scheduledDate,
              appointmentTime: appointment.scheduledTime,
              inspectorName: appointment.assignedInspectorName,
              address: appointment.customerAddress,
            },
          },
        },
        {
          reportId: appointment.id,
          customerName: appointment.customerName,
          sentBy: appointment.createdBy,
        }
      );
    }

    // Notify roofer
    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
      userId: appointment.assignedInspectorId,
      type: 'appointment_reminder',
      title: 'Reminder: Inspection Tomorrow',
      message: `You have an inspection scheduled for tomorrow (${appointment.scheduledDate}) at ${appointment.scheduledTime} - ${appointment.customerName}, ${appointment.customerAddress}`,
      link: `/schedule`,
      read: false,
      metadata: {
        appointmentId: appointment.id,
        category: 'appointment',
        priority: 'medium',
      },
      createdAt: serverTimestamp(),
    });

    logger.log('✅ Reminder notifications sent');
  } catch (error) {
    console.error('❌ Error sending reminders:', error);
  }
};
