import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

export interface MailPayload {
  to: string | string[];
  subject: string;
  templateName: string;
  data: Record<string, unknown>;
  replyTo?: string;
  priority?: 'high' | 'normal' | 'low';
  metadata?: Record<string, unknown>;
}

export interface QueueResult {
  success: boolean;
  enqueued: number;
  suppressed: number;
  skipped: number;
  reason?: string;
  messageIds?: string[];
  errors?: string[];
}

/**
 * Queue email for sending via Trigger Email extension
 * Validates payload, checks suppressions, and enqueues to Firestore
 */
export const queueMail = onCall(
  { region: 'europe-west1', timeoutSeconds: 30, memory: '256MiB' },
  async (request): Promise<QueueResult> => {
    try {
      const { data, auth } = request;

      // Check authentication
      if (!auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated to send emails');
      }

      // Validate payload
      const validation = validateMailPayload(data);
      if (!validation.valid) {
        throw new HttpsError('invalid-argument', `Invalid payload: ${validation.error}`);
      }

      const db = getFirestore();
      const recipients = Array.isArray(data.to) ? data.to : [data.to];

      // Check development environment restrictions
      const isDevelopment =
        process.env.NODE_ENV === 'development' || process.env.FUNCTIONS_EMULATOR === 'true';

      if (isDevelopment) {
        const allowedDomains = ['@taklaget.app', '@example.com', '@test.com'];
        const restrictedRecipients = recipients.filter(
          (recipient: string) => !isAllowedDomain(recipient, allowedDomains)
        );

        if (restrictedRecipients.length > 0) {
          console.log(`Development mode: Blocking emails to ${restrictedRecipients.join(', ')}`);
          return {
            success: false,
            enqueued: 0,
            suppressed: 0,
            skipped: restrictedRecipients.length,
            reason: 'development_mode_restriction',
          };
        }
      }

      // Check suppressions
      const suppressed: string[] = [];
      const allowedRecipients: string[] = [];

      for (const recipient of recipients) {
        const normalizedEmail = recipient.trim().toLowerCase();

        // Check suppression list
        const suppressionDoc = await db.collection('mail-suppressions').doc(normalizedEmail).get();

        if (suppressionDoc.exists) {
          const suppressionData = suppressionDoc.data();
          console.log(`Email suppressed for ${normalizedEmail}: ${suppressionData?.reason}`);
          suppressed.push(normalizedEmail);
        } else {
          allowedRecipients.push(recipient);
        }
      }

      // If all recipients are suppressed, return early
      if (allowedRecipients.length === 0) {
        return {
          success: true,
          enqueued: 0,
          suppressed: suppressed.length,
          skipped: 0,
          reason: 'all_recipients_suppressed',
        };
      }

      // Prepare email document for Trigger Email extension
      const emailDoc = {
        to: allowedRecipients,
        from: 'noreply@taklaget.app',
        replyTo: data.replyTo || 'support@taklaget.app',
        template: {
          name: data.templateName,
          data: {
            ...data.data,
            // Add shared variables
            brandName: 'Taklaget Professional Roofing',
            legalEntity: 'Taklaget AB',
            legalAddress: 'Professional Roofing Services, Sweden',
            emailReason: "You're receiving this because you have an account with our service.",
            unsubscribeUrl: 'https://taklaget.app/unsubscribe',
          },
        },
        message: {
          subject: data.subject,
          messageId: generateMessageId(),
          priority: data.priority || 'normal',
        },
        metadata: {
          sentBy: auth.uid,
          sentAt: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'production',
          ...data.metadata,
        },
        createdAt: new Date().toISOString(),
      };

      // Add to mail collection (triggers email extension)
      const mailRef = await db.collection('mail').add(emailDoc);

      // Log the email request
      await db.collection('email-logs').add({
        messageId: mailRef.id,
        recipients: allowedRecipients,
        suppressed: suppressed,
        templateName: data.templateName,
        subject: data.subject,
        sentBy: auth.uid,
        sentAt: new Date().toISOString(),
        status: 'queued',
      });

      console.log(`Email queued successfully: ${mailRef.id}`);

      return {
        success: true,
        enqueued: allowedRecipients.length,
        suppressed: suppressed.length,
        skipped: 0,
        messageIds: [mailRef.id],
      };
    } catch (error) {
      console.error('Error queuing email:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        'internal',
        `Failed to queue email: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
);

/**
 * Validate mail payload
 */
function validateMailPayload(data: MailPayload): { valid: boolean; error?: string } {
  if (!data.to || (Array.isArray(data.to) && data.to.length === 0)) {
    return { valid: false, error: 'Recipients are required' };
  }

  if (!data.subject || typeof data.subject !== 'string') {
    return { valid: false, error: 'Subject is required' };
  }

  if (!data.templateName || typeof data.templateName !== 'string') {
    return { valid: false, error: 'Template name is required' };
  }

  if (!data.data || typeof data.data !== 'object') {
    return { valid: false, error: 'Template data is required' };
  }

  // Validate recipients
  const recipients = Array.isArray(data.to) ? data.to : [data.to];
  for (const recipient of recipients) {
    if (!isValidEmail(recipient)) {
      return { valid: false, error: `Invalid email address: ${recipient}` };
    }
  }

  // Check recipient count limit
  if (recipients.length > 100) {
    return { valid: false, error: 'Too many recipients (max 100)' };
  }

  // Validate template name
  const allowedTemplates = ['report-ready', 'urgent-issues', 'password-reset'];
  if (!allowedTemplates.includes(data.templateName)) {
    return { valid: false, error: `Invalid template: ${data.templateName}` };
  }

  return { valid: true };
}

/**
 * Check if email is valid
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if email domain is allowed in development
 */
function isAllowedDomain(email: string, allowedDomains: string[]): boolean {
  if (allowedDomains.length === 0) return true;

  const domain = '@' + email.split('@')[1];
  return allowedDomains.includes(domain);
}

/**
 * Generate unique message ID
 */
function generateMessageId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `taklaget-${timestamp}-${random}`;
}

/**
 * Bulk queue emails (for batch operations)
 */
export const queueBulkMail = onCall(
  { region: 'europe-west1', timeoutSeconds: 60, memory: '512MiB' },
  async (request): Promise<QueueResult> => {
    const { data, auth } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    if (!data.emails || !Array.isArray(data.emails) || data.emails.length === 0) {
      throw new HttpsError('invalid-argument', 'Emails array is required');
    }

    if (data.emails.length > 50) {
      throw new HttpsError('invalid-argument', 'Too many emails in batch (max 50)');
    }

    const results: QueueResult[] = [];

    for (const email of data.emails) {
      try {
        // Process each email directly instead of calling queueMail function
        const validation = validateMailPayload(email);
        if (!validation.valid) {
          results.push({
            success: false,
            enqueued: 0,
            suppressed: 0,
            skipped: 1,
            errors: [`Invalid payload: ${validation.error}`],
          });
          continue;
        }

        const db = getFirestore();
        const recipients = Array.isArray(email.to) ? email.to : [email.to];

        // Check suppressions for this email
        const suppressed: string[] = [];
        const allowedRecipients: string[] = [];

        for (const recipient of recipients) {
          const normalizedEmail = recipient.trim().toLowerCase();
          const suppressionDoc = await db
            .collection('mail-suppressions')
            .doc(normalizedEmail)
            .get();

          if (suppressionDoc.exists) {
            suppressed.push(normalizedEmail);
          } else {
            allowedRecipients.push(recipient);
          }
        }

        if (allowedRecipients.length === 0) {
          results.push({
            success: true,
            enqueued: 0,
            suppressed: suppressed.length,
            skipped: 0,
            reason: 'all_recipients_suppressed',
          });
          continue;
        }

        // Create email document
        const emailDoc = {
          to: allowedRecipients,
          from: 'noreply@taklaget.app',
          replyTo: email.replyTo || 'support@taklaget.app',
          template: {
            name: email.templateName,
            data: {
              ...email.data,
              brandName: 'Taklaget Professional Roofing',
              legalEntity: 'Taklaget AB',
              legalAddress: 'Professional Roofing Services, Sweden',
              emailReason: "You're receiving this because you have an account with our service.",
              unsubscribeUrl: 'https://taklaget.app/unsubscribe',
            },
          },
          message: {
            subject: email.subject,
            messageId: generateMessageId(),
            priority: email.priority || 'normal',
          },
          metadata: {
            sentBy: auth.uid,
            sentAt: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'production',
            ...email.metadata,
          },
          createdAt: new Date().toISOString(),
        };

        const mailRef = await db.collection('mail').add(emailDoc);
        results.push({
          success: true,
          enqueued: allowedRecipients.length,
          suppressed: suppressed.length,
          skipped: 0,
          messageIds: [mailRef.id],
        });
      } catch (error) {
        results.push({
          success: false,
          enqueued: 0,
          suppressed: 0,
          skipped: 1,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        });
      }
    }

    // Aggregate results
    const totalEnqueued = results.reduce((sum, r) => sum + r.enqueued, 0);
    const totalSuppressed = results.reduce((sum, r) => sum + r.suppressed, 0);
    const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0);
    const allErrors = results.flatMap(r => r.errors || []);

    return {
      success: allErrors.length === 0,
      enqueued: totalEnqueued,
      suppressed: totalSuppressed,
      skipped: totalSkipped,
      errors: allErrors.length > 0 ? allErrors : undefined,
    };
  }
);
