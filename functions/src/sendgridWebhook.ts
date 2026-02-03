import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import { getEmailCenterConfig, isEmailServiceEnabled, isSendGridProvider } from './emailCenter';

interface SendGridEvent {
  email: string;
  timestamp: number;
  event:
    | 'processed'
    | 'dropped'
    | 'delivered'
    | 'deferred'
    | 'bounce'
    | 'open'
    | 'click'
    | 'spamreport'
    | 'unsubscribe';
  sg_message_id: string;
  reason?: string;
  status?: string;
  url?: string;
}

export const sendgridWebhook = onRequest(
  {
    region: 'europe-west1',
    cors: false,
  },
  async (request, response) => {
    const { mode, provider } = getEmailCenterConfig();
    if (!isEmailServiceEnabled() || !isSendGridProvider()) {
      logger.info('SendGrid webhook ignored (email service disabled or provider mismatch)', {
        mode,
        provider,
      });
      response.status(202).send('Email service disabled');
      return;
    }

    const signature = request.headers['x-twilio-email-event-webhook-signature'] as string;
    const timestamp = request.headers['x-twilio-email-event-webhook-timestamp'] as string;

    if (!verifyWebhookSignature(request.body, signature, timestamp)) {
      logger.warn('Invalid SendGrid webhook signature');
      response.status(401).send('Unauthorized');
      return;
    }

    const events: SendGridEvent[] = request.body;

    for (const event of events) {
      try {
        await processWebhookEvent(event);
      } catch (error: any) {
        logger.error('Error processing SendGrid webhook event', {
          event: event.event,
          email: event.email,
          error: error?.message,
        });
      }
    }

    response.status(200).send('OK');
  }
);

function verifyWebhookSignature(payload: any, signature: string, timestamp: string): boolean {
  const secret = process.env.SENDGRID_WEBHOOK_SECRET;
  if (!secret || !signature || !timestamp) {
    return true;
  }

  const data = JSON.stringify(payload) + timestamp;
  const hash = crypto.createHmac('sha256', secret).update(data).digest('base64');
  return hash === signature;
}

async function processWebhookEvent(event: SendGridEvent): Promise<void> {
  const messageId = event.sg_message_id;

  const emailLogsRef = admin.firestore().collection('emailLogs');
  const query = await emailLogsRef.where('messageId', '==', messageId).limit(1).get();

  if (query.empty) {
    logger.warn('Email log not found for messageId', { messageId });
    return;
  }

  const emailLogDoc = query.docs[0];
  const updates: any = {};

  switch (event.event) {
    case 'delivered':
      updates.status = 'delivered';
      updates.deliveredAt = admin.firestore.Timestamp.fromMillis(event.timestamp * 1000);
      break;
    case 'open':
      updates.openedAt = admin.firestore.Timestamp.fromMillis(event.timestamp * 1000);
      updates.opened = true;
      break;
    case 'click':
      updates.clickedAt = admin.firestore.Timestamp.fromMillis(event.timestamp * 1000);
      updates.clicked = true;
      if (event.url) updates.clickedUrl = event.url;
      break;
    case 'bounce':
    case 'dropped':
      updates.status = 'failed';
      updates.bounceReason = event.reason;
      updates.bouncedAt = admin.firestore.Timestamp.fromMillis(event.timestamp * 1000);
      break;
    case 'spamreport':
      updates.spamReported = true;
      updates.spamReportedAt = admin.firestore.Timestamp.fromMillis(event.timestamp * 1000);
      break;
    case 'unsubscribe':
      updates.unsubscribed = true;
      updates.unsubscribedAt = admin.firestore.Timestamp.fromMillis(event.timestamp * 1000);
      break;
  }

  updates.events = admin.firestore.FieldValue.arrayUnion({
    type: event.event,
    timestamp: admin.firestore.Timestamp.fromMillis(event.timestamp * 1000),
    reason: event.reason,
    status: event.status,
  });

  await emailLogDoc.ref.update(updates);
}
