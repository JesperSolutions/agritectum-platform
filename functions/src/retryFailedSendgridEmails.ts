import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import * as admin from 'firebase-admin';
import { sendGridService } from './services/sendGridService';
import { getEmailCenterConfig, isEmailServiceEnabled, isSendGridProvider } from './emailCenter';

export const retryFailedSendgridEmails = onSchedule(
  {
    schedule: 'every 5 minutes',
    region: 'europe-west1',
    secrets: ['SENDGRID_API_KEY'],
  },
  async () => {
    const { mode, provider } = getEmailCenterConfig();
    if (!isEmailServiceEnabled() || !isSendGridProvider()) {
      logger.info('Retry job skipped (email service disabled or provider mismatch)', {
        mode,
        provider,
      });
      return;
    }

    const mailRef = admin.firestore().collection('mail');
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const failedEmails = await mailRef
      .where('status', '==', 'failed')
      .where('failedAt', '>', new Date(oneDayAgo))
      .where('retryCount', '<', 3)
      .limit(50)
      .get();

    for (const doc of failedEmails.docs) {
      const emailData = doc.data() as any;
      const retryCount = emailData.retryCount || 0;
      const backoffMinutes = 5 * Math.pow(3, retryCount);
      const nextRetryTime = emailData.failedAt?.toMillis
        ? emailData.failedAt.toMillis() + backoffMinutes * 60 * 1000
        : Date.now();

      if (Date.now() < nextRetryTime) continue;

      try {
        const result = await sendGridService.sendEmail({
          to: emailData.to,
          cc: emailData.cc,
          bcc: emailData.bcc,
          from: emailData.from,
          replyTo: emailData.replyTo,
          template: emailData.template,
          subject: emailData.subject,
          attachments: emailData.attachments,
        });

        if (result.success) {
          await doc.ref.update({
            status: 'sent',
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            messageId: result.messageId,
            retryCount: retryCount + 1,
            delivery: {
              state: 'sent',
              info: { messageId: result.messageId },
            },
          });
        } else {
          await doc.ref.update({
            retryCount: retryCount + 1,
            lastRetryAt: admin.firestore.FieldValue.serverTimestamp(),
            lastError: result.error,
          });
        }
      } catch (error: any) {
        logger.error('Retry failed', { emailId: doc.id, error: error?.message });
      }
    }
  }
);
