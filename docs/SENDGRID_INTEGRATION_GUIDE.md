# SendGrid Integration Architecture Guide

## 📐 Solutions Architecture Overview

### Design Principles
1. **Universal Email Service** - Single abstraction layer for all email sending
2. **Template Management** - Keep existing Handlebars templates, compile server-side
3. **Observability** - Full logging, webhooks, and delivery tracking
4. **Resilience** - Retry logic, error handling, fallback mechanisms
5. **Scalability** - Cloud Functions auto-scale with demand

---

## 🏛️ Architecture Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  React Components (ReportForm, OfferModal, etc.)               │
│         ↓                                                        │
│  Email Trigger Service (triggerEmailService.ts)                │
│         ↓                                                        │
│  Writes to Firestore 'mail' collection                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                      FIRESTORE (Queue)                          │
├─────────────────────────────────────────────────────────────────┤
│  Collection: mail                                               │
│  {                                                              │
│    to: ["customer@example.com"],                               │
│    template: "report-ready",                                   │
│    data: { customerName, reportLink, ... },                    │
│    status: "pending",                                          │
│    createdAt: Timestamp                                        │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓ (triggers)
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUD FUNCTIONS LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│  1. sendEmailTrigger (onDocumentCreated)                       │
│     - Reads email request                                      │
│     - Loads template from /email/templates/                    │
│     - Compiles Handlebars with data                           │
│     - Calls SendGrid API                                       │
│     - Updates status to "sent" or "failed"                    │
│                                                                 │
│  2. sendgridWebhook (HTTP endpoint)                            │
│     - Receives delivery events from SendGrid                   │
│     - Updates emailLogs collection                            │
│     - Triggers notifications for bounces/failures             │
│                                                                 │
│  3. retryFailedEmails (scheduled, every 5 min)                │
│     - Finds failed emails                                      │
│     - Retries with exponential backoff                        │
│     - Max 3 retry attempts                                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                      SENDGRID API                               │
├─────────────────────────────────────────────────────────────────┤
│  - Sends emails to recipients                                  │
│  - Tracks opens, clicks, bounces                              │
│  - Sends webhooks back to your system                         │
│  - Provides analytics dashboard                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    EMAIL LOGS (Firestore)                       │
├─────────────────────────────────────────────────────────────────┤
│  Collection: emailLogs                                         │
│  {                                                              │
│    messageId: "abc123",                                        │
│    to: "customer@example.com",                                 │
│    template: "report-ready",                                   │
│    status: "delivered",                                        │
│    sentAt: Timestamp,                                          │
│    deliveredAt: Timestamp,                                     │
│    openedAt: Timestamp,                                        │
│    clickedAt: Timestamp,                                       │
│    events: [{type, timestamp}]                                │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementation Strategy

### Phase 1: Setup & Configuration (1 day)

**1.1 SendGrid Account Setup**
```bash
# Create SendGrid account
# API Key: https://app.sendgrid.com/settings/api_keys
# Permissions: Full Access (or Mail Send + Email Activity)
```

**1.2 Domain Verification**
- Verify sender domain: agritectum.com or taklaget.app
- Set up SPF, DKIM, DMARC records
- Verify email addresses for sending

**1.3 Environment Configuration**
```bash
# Add to Firebase Functions config
firebase functions:secrets:set SENDGRID_API_KEY
firebase functions:config:set sendgrid.from_email="noreply@taklaget.app"
firebase functions:config:set sendgrid.from_name="Agritectum"
firebase functions:config:set sendgrid.webhook_secret="<generate-random-string>"
```

### Phase 2: Email Service Layer (2-3 days)

**2.1 Install SendGrid SDK**
```bash
cd functions
npm install @sendgrid/mail handlebars
npm install @types/node --save-dev
```

**2.2 Create Universal Email Service**
Location: `functions/src/services/sendGridService.ts`

**2.3 Migrate Templates**
- Keep existing Handlebars templates
- Add template validation
- Create template loader utility

**2.4 Create Cloud Functions**
- `sendEmailTrigger` - Main email sender
- `sendgridWebhook` - Event receiver
- `retryFailedEmails` - Retry logic

### Phase 3: Frontend Integration (1 day)

**3.1 Update triggerEmailService.ts**
- No major changes needed
- Existing Firestore writes remain the same
- Add better error handling

**3.2 Add Email Status Dashboard (optional)**
- Admin panel to view email logs
- Delivery status, open rates, etc.

### Phase 4: Testing & Migration (2 days)

**4.1 Testing Strategy**
```typescript
// Test with limited recipients first
const TEST_EMAILS = ['test@yourcompany.com'];
const PRODUCTION_ENABLED = process.env.SENDGRID_PRODUCTION === 'true';
```

**4.2 Gradual Rollout**
1. Enable for test accounts only
2. Enable for 10% of users
3. Monitor for 48 hours
4. Full rollout

---

## 📦 Implementation Files

### 1. SendGrid Service (Core)

**File**: `functions/src/services/sendGridService.ts`

```typescript
import * as sgMail from '@sendgrid/mail';
import * as Handlebars from 'handlebars';
import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions/v2';
import * as fs from 'fs';
import * as path from 'path';

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface SendEmailRequest {
  to: string | string[];
  cc?: string[];
  bcc?: string[];
  from?: { email: string; name: string };
  replyTo?: string;
  subject: string;
  template: string;
  data: Record<string, any>;
  attachments?: Array<{
    content: string;
    filename: string;
    type?: string;
    disposition?: 'attachment' | 'inline';
  }>;
}

export interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class SendGridService {
  private static instance: SendGridService;
  private templateCache: Map<string, HandlebarsTemplateDelegate> = new Map();
  
  private constructor() {}
  
  static getInstance(): SendGridService {
    if (!SendGridService.instance) {
      SendGridService.instance = new SendGridService();
    }
    return SendGridService.instance;
  }

  /**
   * Load and compile Handlebars template
   */
  private async loadTemplate(templateName: string): Promise<{
    html: HandlebarsTemplateDelegate;
    text: HandlebarsTemplateDelegate;
    subject: HandlebarsTemplateDelegate;
  }> {
    const cacheKey = templateName;
    
    // Check cache
    if (this.templateCache.has(cacheKey)) {
      const cached = this.templateCache.get(cacheKey);
      if (cached) {
        return {
          html: cached,
          text: cached,
          subject: cached
        };
      }
    }

    // Load template files from /email/templates/
    const templateDir = path.join(__dirname, '../../email/templates');
    const htmlPath = path.join(templateDir, `${templateName}.hbs`);
    const textPath = path.join(templateDir, `${templateName}.txt.hbs`);
    
    if (!fs.existsSync(htmlPath)) {
      throw new Error(`Template not found: ${templateName}`);
    }

    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    const textContent = fs.existsSync(textPath) 
      ? fs.readFileSync(textPath, 'utf-8')
      : this.htmlToText(htmlContent);

    // Load partials (_header.hbs, _footer.hbs)
    this.registerPartials(templateDir);

    // Register custom Handlebars helpers
    this.registerHelpers();

    const htmlTemplate = Handlebars.compile(htmlContent);
    const textTemplate = Handlebars.compile(textContent);
    
    // Extract subject from template config
    const subjectTemplate = this.getSubjectTemplate(templateName);

    // Cache compiled templates
    this.templateCache.set(cacheKey, htmlTemplate);

    return {
      html: htmlTemplate,
      text: textTemplate,
      subject: subjectTemplate
    };
  }

  /**
   * Register Handlebars partials (_header, _footer)
   */
  private registerPartials(templateDir: string): void {
    const partialFiles = ['_header.hbs', '_footer.hbs'];
    
    partialFiles.forEach(file => {
      const partialPath = path.join(templateDir, file);
      if (fs.existsSync(partialPath)) {
        const partialName = file.replace('.hbs', '').replace('_', '');
        const content = fs.readFileSync(partialPath, 'utf-8');
        Handlebars.registerPartial(partialName, content);
      }
    });
  }

  /**
   * Register custom Handlebars helpers
   */
  private registerHelpers(): void {
    Handlebars.registerHelper('formatDate', (date: Date | string) => {
      const d = new Date(date);
      return d.toLocaleDateString('da-DK', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    });

    Handlebars.registerHelper('formatCurrency', (amount: number) => {
      return new Intl.NumberFormat('da-DK', {
        style: 'currency',
        currency: 'DKK'
      }).format(amount);
    });

    Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
    Handlebars.registerHelper('gt', (a: number, b: number) => a > b);
  }

  /**
   * Get subject template from config
   */
  private getSubjectTemplate(templateName: string): HandlebarsTemplateDelegate {
    const configPath = path.join(__dirname, '../../email/templates/template-config.json');
    
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const templateConfig = config.templates[templateName];
      
      if (templateConfig && templateConfig.subject) {
        return Handlebars.compile(templateConfig.subject);
      }
    }

    // Default subject
    return Handlebars.compile('Notification from Agritectum');
  }

  /**
   * Simple HTML to text conversion
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Send email via SendGrid
   */
  async sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
    try {
      logger.info('Sending email via SendGrid', {
        to: request.to,
        template: request.template
      });

      // Load and compile template
      const templates = await this.loadTemplate(request.template);
      
      // Compile with data
      const html = templates.html(request.data);
      const text = templates.text(request.data);
      const subject = templates.subject(request.data);

      // Prepare email message
      const msg: sgMail.MailDataRequired = {
        to: request.to,
        from: request.from || {
          email: process.env.SENDGRID_FROM_EMAIL || 'noreply@taklaget.app',
          name: process.env.SENDGRID_FROM_NAME || 'Agritectum'
        },
        subject: subject,
        text: text,
        html: html,
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true }
        },
        categories: [request.template, 'agritectum-platform']
      };

      // Add optional fields
      if (request.cc) msg.cc = request.cc;
      if (request.bcc) msg.bcc = request.bcc;
      if (request.replyTo) msg.replyTo = request.replyTo;
      if (request.attachments) msg.attachments = request.attachments;

      // Send via SendGrid
      const [response] = await sgMail.send(msg);

      logger.info('Email sent successfully', {
        messageId: response.headers['x-message-id'],
        statusCode: response.statusCode
      });

      return {
        success: true,
        messageId: response.headers['x-message-id'] as string
      };

    } catch (error: any) {
      logger.error('SendGrid email failed', {
        error: error.message,
        code: error.code,
        response: error.response?.body
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send batch emails (up to 1000 recipients)
   */
  async sendBatchEmails(requests: SendEmailRequest[]): Promise<SendEmailResponse[]> {
    const results: SendEmailResponse[] = [];
    
    // SendGrid supports batch sending
    for (const request of requests) {
      const result = await this.sendEmail(request);
      results.push(result);
    }

    return results;
  }
}

export const sendGridService = SendGridService.getInstance();
```

### 2. Cloud Function: Email Trigger

**File**: `functions/src/sendEmailTrigger.ts`

```typescript
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions/v2';
import { sendGridService } from './services/sendGridService';

export const sendEmailTrigger = onDocumentCreated(
  {
    document: 'mail/{emailId}',
    region: 'europe-west3',
    secrets: ['SENDGRID_API_KEY']
  },
  async (event) => {
    const emailDoc = event.data;
    if (!emailDoc) {
      logger.warn('No email document found');
      return;
    }

    const emailId = event.params.emailId;
    const emailData = emailDoc.data();

    logger.info('Processing email request', { emailId, template: emailData.template });

    try {
      // Update status to processing
      await emailDoc.ref.update({
        status: 'processing',
        processingStartedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Prepare email request
      const emailRequest = {
        to: emailData.to,
        cc: emailData.cc,
        bcc: emailData.bcc,
        from: emailData.from,
        replyTo: emailData.replyTo,
        subject: emailData.subject || '',
        template: emailData.template,
        data: emailData.data || {},
        attachments: emailData.attachments
      };

      // Send email via SendGrid
      const result = await sendGridService.sendEmail(emailRequest);

      if (result.success) {
        // Update email document
        await emailDoc.ref.update({
          status: 'sent',
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          messageId: result.messageId,
          delivery: {
            state: 'sent',
            info: {
              messageId: result.messageId
            }
          }
        });

        // Create email log
        await admin.firestore().collection('emailLogs').add({
          emailId: emailId,
          to: emailData.to,
          template: emailData.template,
          status: 'sent',
          messageId: result.messageId,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          data: emailData.data
        });

        logger.info('Email sent successfully', {
          emailId,
          messageId: result.messageId
        });

      } else {
        // Update with error
        await emailDoc.ref.update({
          status: 'failed',
          failedAt: admin.firestore.FieldValue.serverTimestamp(),
          error: result.error,
          delivery: {
            state: 'ERROR',
            error: result.error
          }
        });

        logger.error('Email sending failed', {
          emailId,
          error: result.error
        });
      }

    } catch (error: any) {
      logger.error('Error processing email', {
        emailId,
        error: error.message
      });

      await emailDoc.ref.update({
        status: 'failed',
        failedAt: admin.firestore.FieldValue.serverTimestamp(),
        error: error.message
      });
    }
  }
);
```

### 3. Cloud Function: SendGrid Webhook

**File**: `functions/src/sendgridWebhook.ts`

```typescript
import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions/v2';
import * as crypto from 'crypto';

interface SendGridEvent {
  email: string;
  timestamp: number;
  'smtp-id': string;
  event: 'processed' | 'dropped' | 'delivered' | 'deferred' | 'bounce' | 'open' | 'click' | 'spamreport' | 'unsubscribe';
  category?: string[];
  sg_message_id: string;
  reason?: string;
  status?: string;
  url?: string;
}

export const sendgridWebhook = onRequest(
  {
    region: 'europe-west3',
    cors: false
  },
  async (request, response) => {
    // Verify webhook signature
    const signature = request.headers['x-twilio-email-event-webhook-signature'] as string;
    const timestamp = request.headers['x-twilio-email-event-webhook-timestamp'] as string;
    
    if (!verifyWebhookSignature(request.body, signature, timestamp)) {
      logger.warn('Invalid webhook signature');
      response.status(401).send('Unauthorized');
      return;
    }

    const events: SendGridEvent[] = request.body;

    logger.info(`Received ${events.length} webhook events from SendGrid`);

    for (const event of events) {
      try {
        await processWebhookEvent(event);
      } catch (error: any) {
        logger.error('Error processing webhook event', {
          event: event.event,
          email: event.email,
          error: error.message
        });
      }
    }

    response.status(200).send('OK');
  }
);

function verifyWebhookSignature(
  payload: any,
  signature: string,
  timestamp: string
): boolean {
  const webhookSecret = process.env.SENDGRID_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.warn('SENDGRID_WEBHOOK_SECRET not configured');
    return true; // Skip verification if not configured
  }

  const data = JSON.stringify(payload) + timestamp;
  const hash = crypto
    .createHmac('sha256', webhookSecret)
    .update(data)
    .digest('base64');

  return hash === signature;
}

async function processWebhookEvent(event: SendGridEvent): Promise<void> {
  const messageId = event.sg_message_id;
  
  // Find email log by messageId
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
      if (event.url) {
        updates.clickedUrl = event.url;
      }
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

  // Add event to events array
  updates.events = admin.firestore.FieldValue.arrayUnion({
    type: event.event,
    timestamp: admin.firestore.Timestamp.fromMillis(event.timestamp * 1000),
    reason: event.reason,
    status: event.status
  });

  await emailLogDoc.ref.update(updates);

  logger.info('Email log updated', {
    messageId,
    event: event.event,
    email: event.email
  });
}
```

### 4. Cloud Function: Retry Failed Emails

**File**: `functions/src/retryFailedEmails.ts`

```typescript
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions/v2';
import { sendGridService } from './services/sendGridService';

export const retryFailedEmails = onSchedule(
  {
    schedule: 'every 5 minutes',
    region: 'europe-west3',
    secrets: ['SENDGRID_API_KEY']
  },
  async () => {
    logger.info('Starting failed email retry job');

    const mailRef = admin.firestore().collection('mail');
    
    // Find failed emails within last 24 hours, max 3 retries
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    const failedEmails = await mailRef
      .where('status', '==', 'failed')
      .where('failedAt', '>', new Date(oneDayAgo))
      .where('retryCount', '<', 3)
      .limit(50)
      .get();

    logger.info(`Found ${failedEmails.size} failed emails to retry`);

    for (const doc of failedEmails.docs) {
      const emailData = doc.data();
      const retryCount = emailData.retryCount || 0;

      try {
        // Exponential backoff: 5min, 15min, 45min
        const backoffMinutes = 5 * Math.pow(3, retryCount);
        const nextRetryTime = emailData.failedAt.toMillis() + (backoffMinutes * 60 * 1000);

        if (Date.now() < nextRetryTime) {
          logger.info('Too soon to retry', { emailId: doc.id, nextRetryTime });
          continue;
        }

        logger.info('Retrying failed email', {
          emailId: doc.id,
          retryCount: retryCount + 1
        });

        // Retry sending
        const result = await sendGridService.sendEmail({
          to: emailData.to,
          cc: emailData.cc,
          bcc: emailData.bcc,
          from: emailData.from,
          replyTo: emailData.replyTo,
          subject: emailData.subject,
          template: emailData.template,
          data: emailData.data,
          attachments: emailData.attachments
        });

        if (result.success) {
          await doc.ref.update({
            status: 'sent',
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            messageId: result.messageId,
            retryCount: retryCount + 1,
            delivery: {
              state: 'sent',
              info: { messageId: result.messageId }
            }
          });

          logger.info('Email retry successful', { emailId: doc.id });
        } else {
          await doc.ref.update({
            retryCount: retryCount + 1,
            lastRetryAt: admin.firestore.FieldValue.serverTimestamp(),
            lastError: result.error
          });

          logger.warn('Email retry failed', {
            emailId: doc.id,
            error: result.error
          });
        }

      } catch (error: any) {
        logger.error('Error retrying email', {
          emailId: doc.id,
          error: error.message
        });
      }
    }

    logger.info('Failed email retry job completed');
  }
);
```

### 5. Update functions/src/index.ts

```typescript
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Export all Cloud Functions
export { sendEmailTrigger } from './sendEmailTrigger';
export { sendgridWebhook } from './sendgridWebhook';
export { retryFailedEmails } from './retryFailedEmails';

// Export existing functions
export { createUserWithAuth } from './createUserWithAuth';
export { appointmentReminders } from './appointmentReminders';
```

---

## 🔐 Security Configuration

### Firebase Secret Manager

```bash
# Set SendGrid API Key
firebase functions:secrets:set SENDGRID_API_KEY
# Paste your SendGrid API key when prompted

# Set Webhook Secret (for signature verification)
firebase functions:secrets:set SENDGRID_WEBHOOK_SECRET
# Generate: openssl rand -base64 32

# Set default sender
firebase functions:config:set sendgrid.from_email="noreply@taklaget.app"
firebase functions:config:set sendgrid.from_name="Agritectum Platform"
```

### SendGrid Webhook Configuration

1. Go to https://app.sendgrid.com/settings/mail_settings
2. Click "Event Webhook"
3. Enable webhook
4. Set URL: `https://europe-west3-agritectum-platform.cloudfunctions.net/sendgridWebhook`
5. Select events: Delivered, Opened, Clicked, Bounced, Dropped
6. Enable OAuth (use SENDGRID_WEBHOOK_SECRET)

---

## 📊 Monitoring & Analytics

### Firestore Data Structure

```typescript
// Collection: emailLogs
{
  emailId: string,
  messageId: string,
  to: string | string[],
  template: string,
  status: 'sent' | 'delivered' | 'failed',
  sentAt: Timestamp,
  deliveredAt?: Timestamp,
  openedAt?: Timestamp,
  clickedAt?: Timestamp,
  bouncedAt?: Timestamp,
  opened: boolean,
  clicked: boolean,
  clickedUrl?: string,
  bounceReason?: string,
  events: Array<{
    type: string,
    timestamp: Timestamp,
    reason?: string
  }>
}
```

### Dashboard Queries

```typescript
// Get delivery rate for last 30 days
const emailLogs = await admin.firestore()
  .collection('emailLogs')
  .where('sentAt', '>', thirtyDaysAgo)
  .get();

const total = emailLogs.size;
const delivered = emailLogs.docs.filter(doc => doc.data().status === 'delivered').length;
const deliveryRate = (delivered / total) * 100;

// Get open rate
const opened = emailLogs.docs.filter(doc => doc.data().opened === true).length;
const openRate = (opened / total) * 100;

// Get click rate
const clicked = emailLogs.docs.filter(doc => doc.data().clicked === true).length;
const clickRate = (clicked / total) * 100;
```

---

## 🚀 Deployment Guide

### Step 1: Install Dependencies

```bash
cd functions
npm install @sendgrid/mail handlebars
npm install --save-dev @types/node
```

### Step 2: Set Secrets

```bash
firebase functions:secrets:set SENDGRID_API_KEY
firebase functions:secrets:set SENDGRID_WEBHOOK_SECRET
```

### Step 3: Copy Templates

```bash
# Templates should already exist in /email/templates/
# Verify they compile with Handlebars syntax
```

### Step 4: Deploy Functions

```bash
cd functions
npm run build
cd ..
firebase deploy --only functions
```

### Step 5: Configure SendGrid Webhooks

- Set webhook URL to your Cloud Function endpoint
- Enable event tracking
- Save configuration

### Step 6: Test Email Sending

```typescript
// Test from Firebase Console or frontend
await db.collection('mail').add({
  to: 'test@example.com',
  template: 'report-ready',
  data: {
    customerName: 'John Doe',
    reportLink: 'https://example.com/report',
    // ... other template data
  }
});
```

---

## 💰 Cost Estimation

### SendGrid Pricing (as of 2026)
- **Free Tier**: 100 emails/day
- **Essentials**: $19.95/month - 50K emails
- **Pro**: $89.95/month - 100K emails + webhooks
- **Premier**: Custom pricing

### Firebase Functions Costs
- **Invocations**: First 2M free, then $0.40/million
- **Compute Time**: First 400K GB-s free
- **Estimated**: ~$5-20/month for 10K emails

### Total Monthly Cost (estimate)
- 10K emails: $25-40/month
- 50K emails: $30-50/month
- 100K emails: $100-120/month

---

## 🎯 Migration Checklist

- [ ] Create SendGrid account
- [ ] Verify domain and sender email
- [ ] Generate API key
- [ ] Install npm packages
- [ ] Create sendGridService.ts
- [ ] Create Cloud Functions (trigger, webhook, retry)
- [ ] Set Firebase secrets
- [ ] Deploy functions
- [ ] Configure SendGrid webhook
- [ ] Test with single email
- [ ] Test all template types
- [ ] Monitor first 100 sends
- [ ] Enable for 10% of users
- [ ] Monitor for 48 hours
- [ ] Full rollout
- [ ] Remove old Firebase email extension (after verification)
- [ ] Set up alerts for bounce rate > 5%
- [ ] Create admin dashboard for email analytics

---

## 🔄 Rollback Plan

If issues arise:

1. **Disable SendGrid Functions**
   ```bash
   firebase functions:delete sendEmailTrigger
   ```

2. **Re-enable Firebase Email Extension**
   - Extension will resume processing `mail` collection

3. **Monitor Firestore**
   - Check for unprocessed emails in `mail` collection
   - Manually retry if needed

---

## 📚 Resources

- [SendGrid API Documentation](https://docs.sendgrid.com/api-reference)
- [SendGrid Node.js Library](https://github.com/sendgrid/sendgrid-nodejs)
- [Firebase Functions v2 Guide](https://firebase.google.com/docs/functions)
- [Handlebars Documentation](https://handlebarsjs.com/)

---

**Architecture designed by**: Solutions Architect
**Date**: February 2, 2026
**Status**: Ready for implementation
