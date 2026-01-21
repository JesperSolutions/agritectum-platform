# Email System Documentation

## Overview

Taklaget uses MailerSend SMTP for email delivery with the Firebase Trigger Email extension.

## Configuration

### MailerSend Setup

1. Create MailerSend account
2. Verify domain: taklaget.app
3. Generate SMTP credentials
4. Configure DNS records (SPF, DKIM, DMARC)

### Firebase Extension

Extension ID: `firestore-send-email`

**Configuration**:

```
SMTP Connection URI: smtp://smtp.mailersend.net:587
SMTP Password: [Stored in Firebase Secret Manager]
Default FROM: noreply@taklaget.app
Default REPLY-TO: support@taklaget.app
```

## Email Templates

Templates are stored in `/email/templates/` using Handlebars (.hbs).

### Available Templates:

1. **password-reset** - Password reset emails
2. **report-ready** - Notify customers when reports are ready
3. **urgent-issues** - Alert for urgent inspection findings

### Template Structure:

```
/email/templates/
├── _header.hbs          (Shared header)
├── _footer.hbs          (Shared footer)
├── template-config.json (Template metadata)
├── password-reset.hbs   (HTML version)
├── password-reset.txt.hbs (Plain text version)
└── ...
```

## Sending Emails

### From Code:

```typescript
import { db } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';

await addDoc(collection(db, 'mail'), {
  to: 'customer@example.com',
  template: {
    name: 'report-ready',
    data: {
      customerName: 'John Doe',
      reportLink: 'https://...',
    },
  },
});
```

### Email Queue Processing:

1. Document added to `/mail` collection
2. Trigger Email extension picks it up
3. Renders template with provided data
4. Sends via MailerSend SMTP
5. Updates document with delivery status

## Testing Emails

### Emulator Mode:

- Emails are logged to console
- No actual emails sent
- Check `email-logs` collection for records

### Production:

- Real emails sent via MailerSend
- Track delivery in MailerSend dashboard
- Check `mail` collection for status

## Troubleshooting

### Email not sending?

1. Check `/mail/{docId}` for error messages
2. Verify SMTP credentials in Firebase Console
3. Check MailerSend dashboard for blocks/bounces
4. Verify domain DNS records are correct

### Template not rendering?

1. Validate template syntax in `template-config.json`
2. Check template file exists in `/email/templates/`
3. Verify all template variables are provided
4. Test template rendering locally

## Production Setup

See archived docs for historical setup details:

- `archive/EMAIL_SETUP_GUIDE.md`
- `archive/PRODUCTION_EMAIL_SETUP.md`
- `archive/TRIGGER_EMAIL_EXTENSION_GUIDE.md`

## Email Preferences

Users can manage their email preferences at:
`https://taklaget-service-app.web.app/unsubscribe?email={email}`

Preferences are stored in `/emailPreferences/{email}` collection.
