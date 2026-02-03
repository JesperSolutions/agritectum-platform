import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { logger } from '../utils/logger';

export type EmailServiceMode = 'disabled' | 'log-only' | 'enabled';
export type EmailProviderId = 'trigger-email-extension' | 'sendgrid';

export interface EmailCenterConfig {
  mode: EmailServiceMode;
  provider: EmailProviderId;
  disabledReason?: string;
}

export interface EmailQueueDocument {
  to: string | string[];
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  template: {
    name: string;
    data: Record<string, any>;
  };
  metadata?: Record<string, any>;
}

export interface EmailQueueLogContext {
  reportId?: string;
  customerName?: string;
  sentBy?: string;
}

export interface EnqueueEmailResult {
  success: boolean;
  skipped?: boolean;
  messageId?: string;
  reason?: string;
}

const normalizeMode = (value?: string): EmailServiceMode => {
  if (value === 'enabled' || value === 'log-only' || value === 'disabled') {
    return value;
  }
  return 'disabled';
};

const normalizeProvider = (value?: string): EmailProviderId => {
  if (value === 'sendgrid' || value === 'trigger-email-extension') {
    return value;
  }
  return 'trigger-email-extension';
};

export const getEmailCenterConfig = (): EmailCenterConfig => {
  const mode = normalizeMode(import.meta.env.VITE_EMAIL_SERVICE_MODE);
  const provider = normalizeProvider(import.meta.env.VITE_EMAIL_PROVIDER);
  const disabledReason = import.meta.env.VITE_EMAIL_SERVICE_DISABLED_REASON || undefined;

  return {
    mode,
    provider,
    disabledReason,
  };
};

export const isEmailServiceEnabled = (): boolean => {
  return getEmailCenterConfig().mode === 'enabled';
};

export const isEmailServiceLogOnly = (): boolean => {
  return getEmailCenterConfig().mode === 'log-only';
};

export const isEmailServiceDisabled = (): boolean => {
  return getEmailCenterConfig().mode === 'disabled';
};

export const enqueueEmail = async (
  mailDoc: EmailQueueDocument,
  context?: EmailQueueLogContext
): Promise<EnqueueEmailResult> => {
  const { mode, disabledReason } = getEmailCenterConfig();

  if (mode !== 'enabled') {
    const reason =
      disabledReason ||
      (mode === 'log-only' ? 'Email service is in log-only mode' : 'Email service is disabled');

    try {
      const recipient = Array.isArray(mailDoc.to) ? mailDoc.to[0] : mailDoc.to;
      await addDoc(collection(db, 'emailLogs'), {
        reportId: context?.reportId || 'system',
        customerEmail: recipient,
        customerName: context?.customerName || 'Unknown',
        subject: `Template: ${mailDoc.template.name}`,
        templateId: mailDoc.template.name,
        sentBy: context?.sentBy || 'system',
        status: 'disabled',
        errorMessage: reason,
        sentAt: serverTimestamp(),
      });
    } catch (logError) {
      logger.warn('⚠️ Email log write failed while disabled:', logError);
    }

    logger.warn('📧 Email send skipped (service disabled/log-only)', {
      mode,
      template: mailDoc.template.name,
      to: mailDoc.to,
    });

    return {
      success: false,
      skipped: true,
      reason: 'EMAIL_SERVICE_DISABLED',
    };
  }

  const mailRef = await addDoc(collection(db, 'mail'), mailDoc);

  return {
    success: true,
    messageId: mailRef.id,
  };
};
