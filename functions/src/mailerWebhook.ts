import { onRequest, onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

interface MailerSendWebhookEvent {
  type: string;
  data: {
    recipient: string;
    message_id: string;
    event_id: string;
    timestamp: number;
    reason?: string;
    domain?: string;
  };
  created_at: number;
}

interface SuppressionRecord {
  email: string;
  reason: string;
  provider: string;
  messageId?: string;
  eventId?: string;
  timestamp: string;
  updatedAt: string;
}

/**
 * Handle MailerSend webhook events for bounces, complaints, and unsubscribes
 */
export const mailerWebhook = onRequest(
  { region: 'europe-west1', timeoutSeconds: 30, memory: '256MiB' },
  async (req, res) => {
    try {
      // Only accept POST requests
      if (req.method !== 'POST') {
        res.status(405).send('Method not allowed');
        return;
      }

      // Verify webhook signature (if available)
      const signature = req.headers['x-mailersend-signature'] as string;
      if (signature) {
        const isValid = await verifyWebhookSignature(req.body, signature);
        if (!isValid) {
          console.error('Invalid webhook signature');
          res.status(401).send('Invalid signature');
          return;
        }
      }

      const event: MailerSendWebhookEvent = req.body;

      // Validate event structure
      if (!event.type || !event.data || !event.data.recipient) {
        console.error('Invalid webhook payload:', event);
        res.status(400).send('Invalid payload');
        return;
      }

      const email = event.data.recipient.trim().toLowerCase();
      const eventType = event.type;
      const messageId = event.data.message_id;
      const eventId = event.data.event_id;

      console.log(`Processing webhook event: ${eventType} for ${email}`);

      // Process different event types
      const suppressionTypes = new Set([
        'hard_bounce',
        'soft_bounce',
        'spam_complaint',
        'unsubscribed',
        'blocked',
      ]);

      if (suppressionTypes.has(eventType)) {
        await processSuppressionEvent(email, eventType, messageId, eventId, event.data.reason);
      } else {
        // Log other events (delivered, opened, clicked, etc.)
        await logEmailEvent(email, eventType, messageId, eventId, event);
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).send('Internal server error');
    }
  }
);

/**
 * Process suppression events (bounces, complaints, unsubscribes)
 */
async function processSuppressionEvent(
  email: string,
  reason: string,
  messageId: string,
  eventId: string,
  additionalReason?: string
): Promise<void> {
  const db = getFirestore();
  const normalizedEmail = email.trim().toLowerCase();

  // Create suppression record
  const suppressionRecord: SuppressionRecord = {
    email: normalizedEmail,
    reason: reason,
    provider: 'mailersend',
    messageId: messageId,
    eventId: eventId,
    timestamp: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Add additional reason if provided
  if (additionalReason) {
    suppressionRecord.reason += `: ${additionalReason}`;
  }

  // Upsert suppression record
  await db
    .collection('mail-suppressions')
    .doc(normalizedEmail)
    .set(suppressionRecord, { merge: true });

  // Log the suppression
  await db.collection('suppression-logs').add({
    email: normalizedEmail,
    reason: reason,
    provider: 'mailersend',
    messageId: messageId,
    eventId: eventId,
    timestamp: new Date().toISOString(),
    additionalReason: additionalReason,
  });

  console.log(`Suppressed email ${normalizedEmail} for reason: ${reason}`);
}

/**
 * Log email events (delivered, opened, clicked, etc.)
 */
async function logEmailEvent(
  email: string,
  eventType: string,
  messageId: string,
  eventId: string,
  eventData: any
): Promise<void> {
  const db = getFirestore();

  // Only log important events to avoid spam
  const loggableEvents = new Set(['delivered', 'opened', 'clicked', 'unsubscribed']);

  if (!loggableEvents.has(eventType)) {
    return;
  }

  await db.collection('mail-events').add({
    email: email.trim().toLowerCase(),
    eventType: eventType,
    messageId: messageId,
    eventId: eventId,
    timestamp: new Date().toISOString(),
    eventData: eventData,
    provider: 'mailersend',
  });

  console.log(`Logged email event: ${eventType} for ${email}`);
}

/**
 * Verify webhook signature (implementation depends on MailerSend's method)
 */
async function verifyWebhookSignature(_payload: any, _signature: string): Promise<boolean> {
  try {
    // MailerSend may use HMAC-SHA256 or similar
    // This is a placeholder implementation
    // Check MailerSend documentation for exact signature verification method

    // For now, we'll accept all webhooks (not recommended for production)
    // In production, implement proper signature verification
    return true;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
}

/**
 * Manual suppression management endpoints
 */

/**
 * Add email to suppression list manually
 */
export const addSuppression = onCall(
  { region: 'europe-west1', timeoutSeconds: 30, memory: '256MiB' },
  async request => {
    const { data, auth } = request;

    // Check authentication and permissions
    if (!auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Only allow superadmins to manually add suppressions
    const permissionLevel = auth.token?.permissionLevel || 0;
    if (permissionLevel < 2) {
      throw new HttpsError('permission-denied', 'Insufficient permissions');
    }

    if (!data.email || !data.reason) {
      throw new HttpsError('invalid-argument', 'Email and reason are required');
    }

    const email = data.email.trim().toLowerCase();
    await processSuppressionEvent(email, data.reason, 'manual', 'manual-' + Date.now());

    return { success: true, email: email, reason: data.reason };
  }
);

/**
 * Remove email from suppression list
 */
export const removeSuppression = onCall(
  { region: 'europe-west1', timeoutSeconds: 30, memory: '256MiB' },
  async request => {
    const { data, auth } = request;

    // Check authentication and permissions
    if (!auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const permissionLevel = auth.token?.permissionLevel || 0;
    if (permissionLevel < 2) {
      throw new HttpsError('permission-denied', 'Insufficient permissions');
    }

    if (!data.email) {
      throw new HttpsError('invalid-argument', 'Email is required');
    }

    const email = data.email.trim().toLowerCase();
    const db = getFirestore();

    await db.collection('mail-suppressions').doc(email).delete();

    // Log the removal
    await db.collection('suppression-logs').add({
      email: email,
      action: 'removed',
      reason: 'manual_removal',
      removedBy: auth.uid,
      timestamp: new Date().toISOString(),
    });

    return { success: true, email: email };
  }
);

/**
 * Get suppression list (admin only)
 */
export const getSuppressions = onCall(
  { region: 'europe-west1', timeoutSeconds: 30, memory: '256MiB' },
  async request => {
    const { data, auth } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const permissionLevel = auth.token?.permissionLevel || 0;
    if (permissionLevel < 1) {
      throw new HttpsError('permission-denied', 'Insufficient permissions');
    }

    const db = getFirestore();
    const limit = data.limit || 100;
    const offset = data.offset || 0;

    const query = db
      .collection('mail-suppressions')
      .orderBy('updatedAt', 'desc')
      .limit(limit)
      .offset(offset);

    const snapshot = await query.get();
    const suppressions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      suppressions: suppressions,
      total: snapshot.size,
      hasMore: snapshot.size === limit,
    };
  }
);
