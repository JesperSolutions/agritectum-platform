# Taklaget Email System

## Production-Ready Email Infrastructure

This document provides a complete overview of the Taklaget email system, which uses Firebase Trigger Email extension with MailerSend for reliable transactional email delivery.

## 🏗️ Architecture

```
App → Cloud Functions → Firestore mail/ → Trigger Email Extension → MailerSend SMTP → Recipients
                                                                        ↓
Webhooks ← Cloud Functions ← MailerSend ← Bounces/Complaints
```

### Key Components

- **Trigger Email Extension**: Official Firebase extension for email delivery
- **MailerSend SMTP**: EU-compliant email delivery service
- **Cloud Functions**: `queueMail`, `mailerWebhook`, suppression management
- **Firestore Collections**: `mail`, `mail-suppressions`, `email-logs`, `mail-events`
- **Security**: Tight Firestore rules, authenticated access only

## 🚀 Quick Start

### 1. Production Setup

```bash
# Run the complete production setup
node scripts/setup-production-email.cjs
```

### 2. Manual Setup (Alternative)

```bash
# Setup environments and secrets
node scripts/setup-email-environments.cjs

# Deploy email templates
node scripts/setup-email-templates.cjs

# Install Trigger Email extension
firebase ext:install firebase/firestore-send-email

# Deploy security rules
firebase deploy --only firestore:rules

# Deploy Cloud Functions
firebase deploy --only functions

# Test the system
node scripts/test-email-system.cjs
```

## 📧 Usage

### Sending Emails

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const queueMail = httpsCallable(functions, 'queueMail');

// Send a report email
const result = await queueMail({
  to: 'customer@example.com',
  subject: 'Your Roof Inspection Report is Ready',
  templateName: 'report-ready',
  data: {
    customerName: 'John Doe',
    inspectionDate: '2024-01-15',
    inspectorName: 'Jane Smith',
    reportId: 'RPT-12345',
    customerAddress: '123 Main St, Stockholm',
    summary: 'Inspection completed successfully with minor issues found.',
    reportLink: 'https://taklaget.app/report/RPT-12345',
    branchName: 'Stockholm Branch',
    branchPhone: '+46 8 123 4567',
    branchEmail: 'stockholm@taklaget.app'
  }
});

if (result.data.success) {
  console.log(`Email queued: ${result.data.enqueued} recipients`);
}
```

### Monitoring Delivery Status

```typescript
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './config/firebase';

// Monitor email delivery status
const unsubscribe = onSnapshot(
  doc(db, 'mail', messageId),
  (doc) => {
    const data = doc.data();
    if (data?.delivery) {
      console.log('Delivery status:', data.delivery.state);
      if (data.delivery.state === 'SUCCESS') {
        console.log('Email delivered successfully!');
      }
    }
  }
);
```

## 📋 Email Templates

### Available Templates

1. **`report-ready`** - Standard inspection completion notification
2. **`urgent-issues`** - Critical issues requiring immediate action
3. **`password-reset`** - Secure password reset notification

### Template Structure

```
email/templates/
├── _header.hbs          # Common header with styling
├── _footer.hbs          # Common footer with contact info
├── report-ready.hbs     # HTML template
├── report-ready.txt.hbs # Plain text fallback
├── urgent-issues.hbs    # HTML template
├── urgent-issues.txt.hbs # Plain text fallback
├── password-reset.hbs   # HTML template
├── password-reset.txt.hbs # Plain text fallback
└── template-config.json # Template configuration and contracts
```

### Adding New Templates

1. Create HTML and text versions in `email/templates/`
2. Update `template-config.json` with required fields
3. Deploy templates: `node scripts/setup-email-templates.cjs`
4. Update Cloud Functions validation in `emailQueue.ts`

## 🔒 Security

### Firestore Security Rules

- **`mail` collection**: No direct client access (Cloud Functions only)
- **`mail-suppressions`**: Admin read-only, Cloud Functions write-only
- **`emailTemplates`**: Authenticated read, superadmin write-only
- **`mail-events`**: Admin read-only, Cloud Functions write-only

### Authentication

- All email operations require user authentication
- Permission levels: Inspector (0), Branch Admin (1), Superadmin (2)
- Development mode restricts email domains for safety

### Suppression Management

- Automatic suppression on bounces/complaints via webhooks
- Manual suppression management for admins
- Suppression list prevents sending to problematic addresses

## 🌐 DNS Configuration

### Required DNS Records

#### SPF Record
```
v=spf1 include:spf.protection.outlook.com include:_spf.mailersend.net -all
```

#### DMARC Record
```
v=DMARC1; p=quarantine; rua=mailto:dmarc@taklaget.app; fo=1
```

#### DKIM Records
Configure in MailerSend dashboard and add CNAME records:
- `ms1._domainkey.taklaget.app` → `ms1._domainkey.mailersend.net`
- `ms2._domainkey.taklaget.app` → `ms2._domainkey.mailersend.net`

### Verification Commands

```bash
# Check SPF
dig TXT taklaget.app | grep spf

# Check DMARC
dig TXT _dmarc.taklaget.app

# Check DKIM
dig CNAME ms1._domainkey.taklaget.app
```

## 📊 Monitoring & Observability

### Key Metrics

- **Delivery Rate**: >95% successful delivery
- **Bounce Rate**: <5% hard bounces
- **Complaint Rate**: <0.1% spam complaints
- **Processing Time**: <30 seconds average

### Monitoring Points

1. **Firebase Console** → Extensions → Trigger Email
2. **Firestore** → `mail` collection for delivery status
3. **Cloud Functions Logs** for errors and performance
4. **MailerSend Dashboard** for delivery statistics

### Alerts

- High error rate (>2% in 15 minutes)
- High bounce rate (>5% in 1 hour)
- Processing delays (>5 minutes)
- Authentication failures

## 🔧 Configuration

### Environment Variables

```bash
# SMTP Configuration
MAILERSEND_SMTP_HOST=smtp.mailersend.net
MAILERSEND_SMTP_PORT=587
MAILERSEND_SMTP_USERNAME=MS_Mq69Kn@taklaget.app
MAILERSEND_SMTP_PASSWORD=your_password_here

# Email Settings
EMAIL_FROM_ADDRESS=noreply@taklaget.app
EMAIL_REPLY_TO=support@taklaget.app

# Development Safety
EMAIL_ALLOWED_DOMAINS=["@taklaget.app", "@example.com"]
```

### MailerSend Configuration

1. **Domain Verification**: Verify `taklaget.app` in MailerSend
2. **Sender Identity**: Configure `noreply@taklaget.app`
3. **Webhook Endpoint**: `https://us-central1-taklaget-service-app.cloudfunctions.net/mailerWebhook`
4. **SMTP Settings**: Use provided credentials in Trigger Email extension

## 🧪 Testing

### Automated Tests

```bash
# Run comprehensive email system tests
node scripts/test-email-system.cjs
```

### Manual Testing

```bash
# Test individual components
node scripts/test-trigger-email.cjs

# Test from frontend
# Use EmailTestPanel component in admin interface
```

### Test Checklist

- [ ] DNS records (SPF/DKIM/DMARC) configured
- [ ] Trigger Email extension installed and configured
- [ ] Email templates deployed and rendering correctly
- [ ] Email delivery to Gmail/Outlook inboxes
- [ ] Suppression system working (bounces/complaints)
- [ ] Webhook processing functional
- [ ] Performance acceptable (<60s for 50 emails)

## 🚨 Troubleshooting

### Common Issues

#### Emails Going to Spam
1. Check SPF/DKIM/DMARC alignment
2. Verify domain reputation
3. Review email content and headers
4. Check MailerSend domain status

#### High Bounce Rate
1. Review recipient list quality
2. Check for invalid email addresses
3. Update suppression rules
4. Verify domain reputation

#### Authentication Failures
1. Verify SMTP credentials in Secret Manager
2. Check Trigger Email extension configuration
3. Review Cloud Functions logs
4. Ensure proper IAM permissions

#### Webhook Issues
1. Check webhook endpoint URL in MailerSend
2. Verify webhook signature validation
3. Review Cloud Functions logs
4. Test webhook endpoint manually

### Debug Commands

```bash
# Check extension status
firebase ext:list

# View extension logs
firebase functions:log --only firestore-send-email

# Check Firestore documents
# Firebase Console → Firestore → mail collection

# Test SMTP connection
swaks --to test@example.com --from noreply@taklaget.app --server smtp.mailersend.net:587 --auth-user MS_Mq69Kn@taklaget.app
```

## 📚 Documentation

- **[DNS Configuration Guide](./DNS_CONFIGURATION_GUIDE.md)** - Complete DNS setup instructions
- **[Trigger Email Extension Guide](./TRIGGER_EMAIL_EXTENSION_GUIDE.md)** - Extension usage and configuration
- **[Operations Runbook](./EMAIL_OPERATIONS_RUNBOOK.md)** - Maintenance and troubleshooting
- **[Production Setup](./PRODUCTION_SETUP_COMPLETE.md)** - Production deployment guide

## 🔄 Maintenance

### Regular Tasks

- **Weekly**: Review delivery rates and error logs
- **Monthly**: Update templates and review DNS records
- **Quarterly**: Review extension configuration and security
- **As Needed**: Troubleshoot delivery issues and update suppressions

### Credential Rotation

```bash
# Update SMTP credentials
echo "new_password" | gcloud secrets versions add MAILERSEND_SMTP_PASSWORD --data-file=- --project=taklaget-service-app

# Update extension configuration in Firebase Console
# Or redeploy with new secrets
```

### Template Updates

1. Modify templates in `email/templates/`
2. Test rendering with sample data
3. Deploy: `node scripts/setup-email-templates.cjs`
4. Verify in Firebase Console

## 🆘 Support

### Emergency Procedures

#### Disable Email Sending
```bash
# Set maintenance mode environment variable
export EMAIL_MAINTENANCE_MODE=true
```

#### Switch to Microsoft Graph (Fallback)
```bash
# Enable fallback mode
export EMAIL_CHANNEL=graph
```

#### Contact Information
- **MailerSend Support**: support@mailersend.com
- **Firebase Support**: Firebase Console → Support
- **DNS Provider**: Check their support documentation

## 📈 Performance

### Benchmarks

- **Email Creation**: <1 second per email
- **Delivery Processing**: <30 seconds average
- **Batch Operations**: 50 emails in <60 seconds
- **Webhook Processing**: <5 seconds per event

### Optimization

- Use batch operations for multiple emails
- Implement proper error handling and retries
- Monitor and optimize template rendering
- Regular cleanup of old mail documents

## 🔐 Security Best Practices

1. **Never expose SMTP credentials** in client-side code
2. **Use Cloud Functions** for all email operations
3. **Implement proper authentication** for all endpoints
4. **Monitor webhook signatures** for security
5. **Regular security audits** of Firestore rules
6. **Keep dependencies updated** and patched

## 📋 Compliance

### GDPR
- Email addresses collected with consent
- Unsubscribe mechanisms provided
- Data subject requests handled appropriately

### CAN-SPAM
- Clear sender identification
- Valid physical address included
- Unsubscribe requests honored promptly

### Industry Standards
- Follow RFC standards for email authentication
- Implement proper error handling
- Maintain delivery statistics and logs

---

**System Status**: ✅ Production Ready  
**Last Updated**: ${new Date().toISOString().split('T')[0]}  
**Version**: 1.0.0
