import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import * as admin from 'firebase-admin';
import { sendGridService } from './services/sendGridService';
import { getEmailCenterConfig, isEmailServiceEnabled, isSendGridProvider } from './emailCenter';

export const sendgridEmailTrigger = onDocumentCreated(
  {
    document: 'mail/{emailId}',
    region: 'europe-west1',
    secrets: ['SENDGRID_API_KEY'],
  },
  async event => {
    const emailDoc = event.data;
    if (!emailDoc) return;

    const { mode, provider } = getEmailCenterConfig();
    if (!isEmailServiceEnabled() || !isSendGridProvider()) {
      logger.info('SendGrid trigger skipped (email service disabled or provider mismatch)', {
        mode,
        provider,
      });
      return;
    }

    const emailId = event.params.emailId;
    const emailData = emailDoc.data() as any;

    try {
      await emailDoc.ref.update({
        status: 'processing',
        processingStartedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

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
        await emailDoc.ref.update({
          status: 'sent',
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          messageId: result.messageId,
          delivery: {
            state: 'sent',
            info: { messageId: result.messageId },
          },
        });

        await admin.firestore().collection('emailLogs').add({
          emailId,
          to: emailData.to,
          template: emailData.template?.name,
          status: 'sent',
          messageId: result.messageId,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          metadata: emailData.metadata || {},
        });
      } else {
        await emailDoc.ref.update({
          status: 'failed',
          failedAt: admin.firestore.FieldValue.serverTimestamp(),
          error: result.error,
          delivery: {
            state: 'ERROR',
            error: result.error,
          },
        });
      }
    } catch (error: any) {
      logger.error('SendGrid trigger error', { emailId, error: error?.message });
      await emailDoc.ref.update({
        status: 'failed',
        failedAt: admin.firestore.FieldValue.serverTimestamp(),
        error: error?.message,
      });
    }
  }
);
