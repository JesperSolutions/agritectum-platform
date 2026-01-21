# Trigger Email Extension Implementation Guide

## Overview

This document provides a comprehensive guide for the new Trigger Email extension implementation in the Taklaget application. The system has been migrated from a custom Firebase Functions + Nodemailer setup to the official Firebase Trigger Email extension for improved reliability, delivery tracking, and maintenance.

## Architecture

### New Email Flow

1. **Frontend** → Creates email document in Firestore `mail` collection
2. **Trigger Email Extension** → Detects new document and processes email
3. **SMTP Server** → Delivers email using configured MailerSend SMTP
4. **Delivery Status** → Extension updates document with delivery information

### Key Components

- **`triggerEmailService.ts`** - Main email service using Trigger Email extension
- **`EmailDeliveryStatus.tsx`** - Component for monitoring email delivery
- **Firestore Collections**:
  - `mail` - Email documents processed by extension
  - `emailTemplates` - Handlebars email templates
  - `emailLogs` - Email sending logs and status

## Setup Instructions

### 1. Install Trigger Email Extension

```bash
# Install the extension
firebase ext:install firebase/firestore-send-email

# Or use the automated setup script
node scripts/setup-trigger-email-extension.cjs
```

### 2. Configure Extension

During installation, configure:

- **SMTP Host**: `smtp.mailersend.net`
- **SMTP Port**: `2525` (or `587`)
- **Username**: `MS_pSTeeA@test-dnvo4d912qrg5r86.mlsender.net`
- **Password**: `mssp.NTOLQYw.351ndgwp1z5lzqx8.TameInd`
- **Mail Collection**: `mail`
- **Templates Collection**: `emailTemplates`
- **Default FROM**: `noreply@taklaget.app`
- **Default REPLY-TO**: `support@taklaget.app`

### 3. Initialize Email Templates

```bash
node scripts/setup-email-templates.cjs
```

### 4. Deploy Security Rules

```bash
firebase deploy --only firestore:rules
```

### 5. Test the System

```bash
node scripts/test-trigger-email.cjs
```

## Usage

### Sending Emails

```typescript
import { sendReportEmail } from '../services/triggerEmailService';

// Send a report email
const result = await sendReportEmail(
  report, // Report object
  'customer@email.com', // Customer email
  'inspection-complete', // Template ID
  branchInfo, // Branch information
  'https://...', // Report link
  'user-id' // Sender ID
);

if (result.success) {
  console.log('Email sent:', result.messageId);
}
```

### Monitoring Delivery Status

```typescript
import { monitorEmailDelivery } from '../services/triggerEmailService';

// Check delivery status
const status = await monitorEmailDelivery(messageId);
console.log('Status:', status.status);
console.log('Delivery info:', status.delivery);
```

### Using Email Templates

Email templates are stored in Firestore and use Handlebars syntax:

```javascript
// Template data
const templateData = {
  customerName: 'John Doe',
  inspectionDate: '2024-01-15',
  reportLink: 'https://...',
  // ... other variables
};

// Email document for Trigger Email extension
const mailDoc = {
  to: 'customer@email.com',
  template: {
    name: 'inspection-complete',
    data: templateData,
  },
};
```

## Email Templates

### Available Templates

1. **`inspection-complete`** - Standard inspection completion email
2. **`urgent-issues`** - Critical issues found email
3. **`follow-up`** - Follow-up reminder email

### Template Variables

All templates support these variables:

- `{{customerName}}` - Customer's name
- `{{inspectionDate}}` - Inspection date
- `{{inspectorName}}` - Inspector's name
- `{{reportId}}` - Report ID
- `{{branchName}}` - Branch name
- `{{branchPhone}}` - Branch phone
- `{{branchEmail}}` - Branch email
- `{{branchAddress}}` - Branch address
- `{{reportLink}}` - Link to report
- `{{summary}}` - Inspection summary
- `{{recommendations}}` - Recommendations
- `{{criticalIssues}}` - Critical issues (urgent template only)
- `{{totalIssues}}` - Total issues found
- `{{estimatedCost}}` - Estimated repair cost

## Delivery Status Tracking

### Status States

- **`PENDING`** - Email document created, waiting to be processed
- **`PROCESSING`** - Extension is processing the email
- **`SUCCESS`** - Email delivered successfully
- **`ERROR`** - Email delivery failed

### Delivery Information

When successful, the delivery object contains:

```javascript
{
  state: 'SUCCESS',
  startTime: timestamp,
  endTime: timestamp,
  attempts: 1,
  info: {
    messageId: 'smtp-message-id',
    accepted: ['customer@email.com'],
    rejected: [],
    pending: [],
    response: 'SMTP server response'
  }
}
```

### Monitoring in Frontend

```tsx
import { EmailDeliveryStatus } from '../components/EmailDeliveryStatus';

// In your component
<EmailDeliveryStatus reportId={report.id} messageId={emailMessageId} showDetails={true} />;
```

## Error Handling

### Common Issues

1. **Extension Not Installed**
   - Solution: Install using `firebase ext:install firebase/firestore-send-email`

2. **SMTP Configuration Error**
   - Solution: Check SMTP settings in Firebase console

3. **Template Not Found**
   - Solution: Run `node scripts/setup-email-templates.cjs`

4. **Permission Denied**
   - Solution: Deploy updated Firestore rules

### Troubleshooting

```bash
# Check extension status
firebase ext:list

# View extension logs
firebase functions:log --only firestore-send-email

# Test email system
node scripts/test-trigger-email.cjs

# Check Firestore documents
# Go to Firebase console → Firestore → mail collection
```

## Security Considerations

### Firestore Rules

The mail collection has restricted access:

```javascript
match /mail/{mailId} {
  // Only authenticated users can create mail documents
  allow create: if isAuthenticated() && (
    isSuperadmin() ||
    isBranchAdmin() ||
    isInspector()
  );
  // Only superadmins can read mail documents (for debugging)
  allow read: if isSuperadmin();
  // Trigger Email extension can update delivery status
  allow update: if true; // Extension has admin privileges
  // No delete access for users
  allow delete: if false;
}
```

### Email Content Validation

- Templates are stored in Firestore and validated
- User input is sanitized before template rendering
- Email addresses are validated before sending

## Performance Considerations

### Batching

- Multiple emails can be sent by creating multiple documents
- Extension processes emails in parallel
- No rate limiting on document creation

### Monitoring

- Monitor the `mail` collection for processing delays
- Check extension logs for performance issues
- Set up alerts for failed deliveries

## Migration from Legacy System

### Backward Compatibility

The new system maintains backward compatibility:

```typescript
// This still works (redirects to new service)
import { sendReportEmail } from '../services/emailService';
```

### Migration Steps

1. **Install Extension** - Use setup scripts
2. **Initialize Templates** - Run template setup
3. **Update Components** - Use new email service
4. **Test System** - Verify email delivery
5. **Remove Legacy** - Clean up old Firebase Functions

### Migration Script

```bash
# Run complete migration
node scripts/migrate-to-trigger-email.cjs
```

## Best Practices

### Email Sending

1. **Always check delivery status** after sending
2. **Use appropriate templates** for different scenarios
3. **Validate email addresses** before sending
4. **Handle errors gracefully** in the frontend

### Template Management

1. **Test templates** before deploying
2. **Use consistent styling** across templates
3. **Include fallback text** for HTML emails
4. **Keep templates updated** with latest branding

### Monitoring

1. **Set up alerts** for delivery failures
2. **Monitor delivery rates** regularly
3. **Review error logs** for patterns
4. **Update templates** based on feedback

## API Reference

### `triggerEmailService.ts`

#### Functions

- `sendEmail(emailRequest)` - Send email using Trigger Email extension
- `sendReportEmail(report, email, templateId, branch, link, sentBy)` - Send report email
- `sendTestEmail(email)` - Send test email
- `testEmailSetup()` - Test email system configuration
- `monitorEmailDelivery(messageId)` - Check delivery status
- `getEmailDeliveryStatus(reportId)` - Get email history for report
- `initializeEmailTemplates()` - Setup default templates

#### Types

- `EmailRequest` - Email request object
- `EmailLog` - Email log entry
- `EmailTemplate` - Email template definition

### Components

#### `EmailDeliveryStatus`

Props:

- `reportId: string` - Report ID to check
- `messageId?: string` - Specific message ID
- `showDetails?: boolean` - Show detailed information

## Support and Maintenance

### Regular Maintenance

1. **Monitor extension logs** for issues
2. **Update templates** as needed
3. **Check delivery rates** monthly
4. **Review error patterns** and fix issues

### Support Resources

- [Firebase Trigger Email Extension Documentation](https://firebase.google.com/products/extensions/firestore-send-email)
- [Handlebars Template Guide](https://firebase.google.com/products/extensions/firestore-send-email#use-handlebars-templates)
- [Delivery Status Management](https://firebase.google.com/products/extensions/firestore-send-email#manage-delivery-status)

### Contact

For issues or questions:

1. Check the troubleshooting section above
2. Review Firebase console logs
3. Test using the provided scripts
4. Contact the development team with specific error details
