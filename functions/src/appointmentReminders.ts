import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import { getEmailCenterConfig, isEmailServiceEnabled } from './emailCenter';

/**
 * Scheduled Cloud Function that runs daily at 6 AM to send appointment reminders
 * Finds appointments scheduled for tomorrow and sends reminders to customers and roofers
 */
export const sendAppointmentReminders = onSchedule(
  { schedule: '0 6 * * *', region: 'europe-west1' },
  async () => {
    console.log('🔄 Starting appointment reminder job...');

    try {
      const db = admin.firestore();
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDateStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD

      console.log(`📅 Looking for appointments on ${tomorrowDateStr}`);

      // Find all appointments scheduled for tomorrow with status 'scheduled' or 'accepted'
      const appointmentsSnapshot = await db
        .collection('appointments')
        .where('scheduledDate', '==', tomorrowDateStr)
        .where('status', 'in', ['scheduled', 'accepted'])
        .get();

      if (appointmentsSnapshot.empty) {
        console.log('✅ No appointments found for tomorrow');
        return;
      }

      console.log(`📋 Found ${appointmentsSnapshot.size} appointments for tomorrow`);

      const reminderPromises: Promise<void>[] = [];
      const { mode, provider } = getEmailCenterConfig();
      const emailEnabled = isEmailServiceEnabled();

      for (const appointmentDoc of appointmentsSnapshot.docs) {
        const appointment = appointmentDoc.data();
        const appointmentId = appointmentDoc.id;

        // Skip if already sent reminder (check metadata)
        if (appointment.reminderSentAt) {
          const reminderDate = new Date(appointment.reminderSentAt);
          const reminderDateStr = reminderDate.toISOString().split('T')[0];
          if (reminderDateStr === now.toISOString().split('T')[0]) {
            console.log(`⏭️ Reminder already sent today for appointment ${appointmentId}`);
            continue;
          }
        }

        // Only send reminders for accepted appointments
        if (appointment.customerResponse !== 'accepted') {
          console.log(`⏭️ Skipping appointment ${appointmentId} - not accepted by customer`);
          continue;
        }

        // Get corresponding scheduledVisit if exists
        let scheduledVisit = null;
        if (appointment.scheduledVisitId) {
          try {
            const visitDoc = await db
              .collection('scheduledVisits')
              .doc(appointment.scheduledVisitId)
              .get();
            if (visitDoc.exists) {
              scheduledVisit = visitDoc.data();
            }
          } catch (error) {
            console.error(`Error fetching scheduledVisit for appointment ${appointmentId}:`, error);
          }
        }

        // Send reminder to customer
        if (appointment.customerId || appointment.customerEmail) {
          const customerNotification = {
            userId: appointment.customerId || null,
            type: 'appointment_reminder',
            title: 'Reminder: Roof Inspection Tomorrow',
            message: `Your roof inspection is scheduled for tomorrow (${appointment.scheduledDate}) at ${appointment.scheduledTime}.`,
            link: scheduledVisit
              ? `/portal/appointment/${appointment.scheduledVisitId}/respond`
              : '/portal/scheduled-visits',
            read: false,
            metadata: {
              appointmentId: appointmentId,
              scheduledVisitId: appointment.scheduledVisitId || null,
              category: 'appointment',
              priority: 'medium',
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          };

          if (appointment.customerId) {
            reminderPromises.push(
              db
                .collection('notifications')
                .add(customerNotification)
                .then(() => {
                  console.log(
                    `✅ Customer reminder notification created for appointment ${appointmentId}`
                  );
                })
            );
          }

          // Send email reminder to customer
          if (appointment.customerEmail && emailEnabled) {
            reminderPromises.push(
              db
                .collection('mail')
                .add({
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
                })
                .then(() => {
                  console.log(`✅ Customer reminder email queued for appointment ${appointmentId}`);
                })
            );
          } else if (appointment.customerEmail && !emailEnabled) {
            console.log('Email service disabled, skipping customer reminder email', {
              appointmentId,
              mode,
              provider,
            });
          }
        }

        // Send reminder to roofer
        if (appointment.assignedInspectorId) {
          reminderPromises.push(
            db
              .collection('notifications')
              .add({
                userId: appointment.assignedInspectorId,
                type: 'appointment_reminder',
                title: 'Reminder: Inspection Tomorrow',
                message: `You have an inspection scheduled for tomorrow (${appointment.scheduledDate}) at ${appointment.scheduledTime} - ${appointment.customerName}, ${appointment.customerAddress}`,
                link: '/schedule',
                read: false,
                metadata: {
                  appointmentId: appointmentId,
                  category: 'appointment',
                  priority: 'medium',
                },
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
              })
              .then(() => {
                console.log(
                  `✅ Roofer reminder notification created for appointment ${appointmentId}`
                );
              })
          );

          // Send email reminder to roofer
          try {
            const rooferDoc = await db
              .collection('users')
              .doc(appointment.assignedInspectorId)
              .get();
            if (rooferDoc.exists && rooferDoc.data()?.email && emailEnabled) {
              reminderPromises.push(
                db
                  .collection('mail')
                  .add({
                    to: rooferDoc.data()!.email,
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
                  })
                  .then(() => {
                    console.log(`✅ Roofer reminder email queued for appointment ${appointmentId}`);
                  })
              );
            } else if (rooferDoc.exists && rooferDoc.data()?.email && !emailEnabled) {
              console.log('Email service disabled, skipping roofer reminder email', {
                appointmentId,
                mode,
                provider,
              });
            }
          } catch (error) {
            console.error(`Error sending roofer email for appointment ${appointmentId}:`, error);
          }
        }

        // Mark reminder as sent
        reminderPromises.push(
          db
            .collection('appointments')
            .doc(appointmentId)
            .update({
              reminderSentAt: admin.firestore.FieldValue.serverTimestamp(),
            })
            .then(() => {
              console.log(`✅ Reminder marked as sent for appointment ${appointmentId}`);
            })
        );
      }

      await Promise.all(reminderPromises);
      console.log(
        `✅ Reminder job completed. Processed ${appointmentsSnapshot.size} appointments.`
      );
      return;
    } catch (error) {
      console.error('❌ Error in appointment reminder job:', error);
      throw error;
    }
  });
