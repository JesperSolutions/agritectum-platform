import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { getEmailCenterConfig, isEmailServiceEnabled } from './emailCenter';

/**
 * Cloud Function: Check for offers needing follow-up
 * Runs daily at 9 AM
 */
export const checkOfferFollowUps = functions.region('europe-west1').pubsub
  .schedule('0 9 * * *') // Every day at 9 AM
  .timeZone('Europe/Copenhagen')
  .onRun(async _context => {
    const db = admin.firestore();
    const now = new Date();
    const { mode, provider } = getEmailCenterConfig();
    const emailEnabled = isEmailServiceEnabled();

    try {
      console.log('Checking for offers needing follow-up...');

      // Get all pending offers
      const pendingOffersSnapshot = await db
        .collection('offers')
        .where('status', '==', 'pending')
        .get();

      const offersNeedingFollowUp: string[] = [];
      const offersNeedingEscalation: string[] = [];

      for (const doc of pendingOffersSnapshot.docs) {
        const offer = doc.data();
        // Support both Firestore Timestamp and legacy string
        const sentDate = offer.sentAt?.toDate
          ? offer.sentAt.toDate()
          : offer.sentAt
            ? new Date(offer.sentAt)
            : undefined;

        if (!sentDate) continue;

        const daysSinceSent = Math.floor(
          (now.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Check if needs follow-up (7 days)
        if (daysSinceSent >= 7 && offer.followUpAttempts < 3) {
          offersNeedingFollowUp.push(doc.id);

          // Send notification to inspector
          await sendFollowUpNotification(doc.id, offer, daysSinceSent, emailEnabled, mode, provider);
        }

        // Check if needs escalation (14 days)
        if (daysSinceSent >= 14) {
          offersNeedingEscalation.push(doc.id);

          // Send escalation notification to branch admin
          await sendEscalationNotification(doc.id, offer, daysSinceSent, emailEnabled, mode, provider);
        }

        // Check if expired (30 days)
        const validUntil = offer.validUntil?.toDate
          ? offer.validUntil.toDate()
          : offer.validUntil
            ? new Date(offer.validUntil)
            : undefined;
        if (validUntil && validUntil < now) {
          // Mark as expired
          await doc.ref.update({
            status: 'expired',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            statusHistory: admin.firestore.FieldValue.arrayUnion({
              status: 'expired',
              timestamp: new Date().toISOString(),
              changedBy: 'system',
              changedByName: 'System',
              reason: 'Offer validity period expired',
            }),
          });
        }
      }

      console.log(`Found ${offersNeedingFollowUp.length} offers needing follow-up`);
      console.log(`Found ${offersNeedingEscalation.length} offers needing escalation`);

      return {
        success: true,
        followUpCount: offersNeedingFollowUp.length,
        escalationCount: offersNeedingEscalation.length,
        timestamp: now.toISOString(),
      };
    } catch (error) {
      console.error('Error checking offer follow-ups:', error);
      throw error;
    }
  });

/**
 * Send follow-up notification to inspector
 */
async function sendFollowUpNotification(
  offerId: string,
  offer: any,
  daysSinceSent: number,
  emailEnabled: boolean,
  mode: string,
  provider: string
) {
  try {
    // Get inspector information
    const inspectorRef = admin.firestore().collection('users').doc(offer.createdBy);
    const inspectorDoc = await inspectorRef.get();

    if (!inspectorDoc.exists) {
      console.error(`Inspector ${offer.createdBy} not found`);
      return;
    }

    const inspector = inspectorDoc.data();

    // Update offer
    await admin
      .firestore()
      .collection('offers')
      .doc(offerId)
      .update({
        followUpAttempts: admin.firestore.FieldValue.increment(1),
        lastFollowUpAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'awaiting_response',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        statusHistory: admin.firestore.FieldValue.arrayUnion({
          status: 'awaiting_response',
          timestamp: new Date().toISOString(),
          changedBy: 'system',
          changedByName: 'System',
          reason: `Automatic follow-up after ${daysSinceSent} days`,
        }),
      });

    // Send email notification to inspector
    const db = admin.firestore();
    if (inspector && inspector.email && emailEnabled) {
      await db.collection('mail').add({
        to: inspector.email,
        template: {
          name: 'offer-reminder',
          data: {
            inspectorName: inspector.displayName || 'Inspector',
            customerName: offer.customerName,
            offerTitle: offer.title,
            daysSinceSent,
            offerLink: `https://taklaget.app/offers/${offerId}`,
          },
        },
      });
    }

    // Create in-app notification for inspector
    await db.collection('notifications').add({
      userId: offer.createdBy,
      type: 'offer_followup',
      title: 'Offer Follow-up Required',
      message: `Offer for ${offer.customerName} has been pending for ${daysSinceSent} days. Please follow up with the customer.`,
      link: `/offers/${offerId}`,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Log communication
    if (inspector?.email) {
      await db.collection('emailLogs').add({
        offerId,
        type: 'followup_reminder',
        recipient: inspector.email,
        subject: 'Offer Follow-up Required',
        status: 'sent',
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        sentBy: 'system',
      });
    }

    console.log(`Sent follow-up notification for offer ${offerId}`);
  } catch (error) {
    console.error('Error sending follow-up notification:', error);
  }
}

/**
 * Send escalation notification to branch admin
 */
async function sendEscalationNotification(
  offerId: string,
  offer: any,
    daysSinceSent: number,
    emailEnabled: boolean,
    mode: string,
    provider: string
): Promise<void> {
  try {
    // Get branch admin
    const branchAdminsSnapshot = await admin
      .firestore()
      .collection('users')
      .where('branchId', '==', offer.branchId)
      .where('role', '==', 'branchAdmin')
      .get();

    if (branchAdminsSnapshot.empty) {
      console.error(`No branch admin found for branch ${offer.branchId}`);
      return;
    }

    // Send email notification to branch admin
    const db = admin.firestore();
    const branchAdmin = branchAdminsSnapshot.docs[0].data();

      if (emailEnabled) {
    await db.collection('mail').add({
      to: branchAdmin.email,
      template: {
        name: 'offer-escalation',
        data: {
          adminName: branchAdmin.displayName || 'Admin',
          customerName: offer.customerName,
          offerTitle: offer.title,
          daysSinceSent,
          offerLink: `https://taklaget.app/offers/${offerId}`,
        },
      },
    });
      } else {
        console.log('Email service disabled, skipping escalation email', { mode, provider, offerId });
      }

    // Create in-app notification for branch admin
    await db.collection('notifications').add({
      userId: branchAdmin.uid,
      type: 'offer_escalation',
      title: 'Offer Escalation Required',
      message: `Offer for ${offer.customerName} has been pending for ${daysSinceSent} days and requires your attention.`,
      link: `/offers/${offerId}`,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Log communication
    await db.collection('emailLogs').add({
      offerId,
      type: 'escalation',
      recipient: branchAdmin.email,
      subject: 'Offer Escalation Required',
      status: 'sent',
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      sentBy: 'system',
    });

    console.log(`Sent escalation notification for offer ${offerId}`);
  } catch (error) {
    console.error('Error sending escalation notification:', error);
  }
}

/**
 * Cloud Function: Send test follow-up notification
 * Manual trigger for testing
 */
export const testOfferFollowUp = functions.region('europe-west1').https.onCall(async (data, context) => {
  // Verify admin
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can trigger test');
  }

  const { offerId } = data;

  if (!offerId) {
    throw new functions.https.HttpsError('invalid-argument', 'offerId is required');
  }

  try {
    const { mode, provider } = getEmailCenterConfig();
    const emailEnabled = isEmailServiceEnabled();
    const offerDoc = await admin.firestore().collection('offers').doc(offerId).get();

    if (!offerDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Offer not found');
    }

    const offer = offerDoc.data();
    if (offer && offer.sentAt) {
      const daysSinceSent = Math.floor(
        (Date.now() - offer.sentAt.toMillis()) / (1000 * 60 * 60 * 24)
      );

      await sendFollowUpNotification(offerId, offer, daysSinceSent, emailEnabled, mode, provider);
    }

    return {
      success: true,
      message: 'Follow-up notification sent',
      offerId,
    };
  } catch (error) {
    console.error('Error in test offer follow-up:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send test notification');
  }
});

/**
 * Callable function for public offer response (accept/reject)
 */
export const publicRespondToOffer = functions.region('europe-west1').https.onCall(async (data, _context) => {
  const { offerId, action, reason, customerData } = data || {};
  if (!offerId || !['accept', 'reject'].includes(action)) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing offerId or invalid action');
  }
  try {
    const db = admin.firestore();
    const { mode, provider } = getEmailCenterConfig();
    const emailEnabled = isEmailServiceEnabled();
    const ref = db.collection('offers').doc(offerId);
    const snap = await ref.get();
    if (!snap.exists) throw new functions.https.HttpsError('not-found', 'Offer not found');
    const offer = snap.data() as any;
    // Only pending or awaiting_response allowed
    if (!['pending', 'awaiting_response'].includes(offer.status)) {
      throw new functions.https.HttpsError('failed-precondition', 'Offer is no longer active');
    }
    if (!offer.publicLink) {
      throw new functions.https.HttpsError('permission-denied', 'Not allowed');
    }
    // Accept
    if (action === 'accept') {
      await ref.update({
        customerResponse: 'accept',
        customerResponseAt: admin.firestore.FieldValue.serverTimestamp(),
        respondedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'accepted',
        customerNamePublic: customerData?.name || null,
        customerEmailPublic: customerData?.email || null,
      });
      // Send confirmation email to inspector if possible
      if (offer.createdBy) {
        const userSnap = await db.collection('users').doc(offer.createdBy).get();
        const inspectorEmail = userSnap.exists ? userSnap.get('email') : undefined;
        if (inspectorEmail && emailEnabled) {
          await db.collection('mail').add({
            to: inspectorEmail,
            template: {
              name: 'offer-accepted',
              data: {
                customerName: offer.customerName,
                offerTitle: offer.title,
                totalAmount: offer.totalAmount,
                currency: offer.currency,
              },
            },
          });
        } else if (inspectorEmail && !emailEnabled) {
          console.log('Email service disabled, skipping offer accepted email', {
            mode,
            provider,
            offerId,
          });
        }
      }
    } else if (action === 'reject') {
      await ref.update({
        customerResponse: 'reject',
        customerResponseReason: reason,
        customerResponseAt: admin.firestore.FieldValue.serverTimestamp(),
        respondedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'rejected',
        customerNamePublic: customerData?.name || null,
        customerEmailPublic: customerData?.email || null,
      });
      // Send rejection email to inspector
      if (offer.createdBy) {
        const userSnap = await db.collection('users').doc(offer.createdBy).get();
        const inspectorEmail = userSnap.exists ? userSnap.get('email') : undefined;
        if (inspectorEmail && emailEnabled) {
          await db.collection('mail').add({
            to: inspectorEmail,
            template: {
              name: 'offer-rejected',
              data: {
                customerName: offer.customerName,
                offerTitle: offer.title,
                rejectionReason: reason || '',
              },
            },
          });
        } else if (inspectorEmail && !emailEnabled) {
          console.log('Email service disabled, skipping offer rejected email', {
            mode,
            provider,
            offerId,
          });
        }
      }
    }
    return { status: 'ok' };
  } catch (error: any) {
    console.error('publicRespondToOffer error', error);

    // Sanitize error messages to prevent information leakage
    // Only expose safe, user-friendly error messages
    if (error instanceof functions.https.HttpsError) {
      // Re-throw HttpsErrors as-is (already sanitized)
      throw error;
    }

    // For internal errors, provide generic message
    const errorCode = error?.code || 'internal';
    const safeMessage =
      errorCode === 'invalid-argument'
        ? 'Invalid request. Please check your input.'
        : errorCode === 'not-found'
          ? 'Offer not found or no longer available.'
          : errorCode === 'failed-precondition'
            ? 'This offer cannot be processed at this time.'
            : errorCode === 'permission-denied'
              ? 'You do not have permission to perform this action.'
              : 'An error occurred processing your request. Please try again later.';

    throw new functions.https.HttpsError(errorCode, safeMessage);
  }
});

/**
 * Callable function for email health check
 */
export const checkEmailHealth = functions.region('europe-west1').https.onCall(async (_data, context) => {
  try {
    const { mode, provider } = getEmailCenterConfig();
    const emailEnabled = isEmailServiceEnabled();
    if (!emailEnabled) {
      return { status: 'disabled', mode, provider };
    }
    // Write a test mail document (dummy email, not delivered, gets picked up by extension)
    const db = admin.firestore();
    await db.collection('mail').add({
      to: 'test-healthcheck@taklaget.app',
      template: { name: 'healthcheck', data: { system: 'Taklaget' } },
      meta: {
        createdBy: context.auth?.uid || 'system',
        test: true,
        timestamp: new Date().toISOString(),
      },
    });
    return { status: 'ok' };
  } catch (err: any) {
    return { status: 'fail', error: err?.message || 'unknown' };
  }
});
