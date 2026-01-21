# Domain Migration Guide: taklaget.se → taklaget.app

## Overview

This guide outlines the steps to migrate from the current Firebase hosting domain to the new `taklaget.app` domain.

## Current Status

- ✅ Email addresses configured: `noreply@taklaget.app`, `support@taklaget.app`
- ✅ Code updated to use new domain references
- ✅ PDF generation uses new domain
- ✅ Email templates updated

## Next Steps

### 1. Firebase Hosting Configuration

```bash
# Add custom domain to Firebase project
firebase hosting:channel:deploy live --project taklaget-service-app

# Add custom domain (run this when ready)
firebase hosting:channel:deploy taklaget.app --project taklaget-service-app
```

### 2. DNS Configuration

- Point `taklaget.app` to Firebase hosting
- Configure subdomains:
  - `www.taklaget.app` → Main application
  - `app.taklaget.app` → Alternative app URL

### 3. Email Configuration

- Configure SMTP for `noreply@taklaget.app`
- Set up email forwarding for `support@taklaget.app`
- Update Firebase Functions environment variables:
  ```bash
  firebase functions:config:set email.user="noreply@taklaget.app"
  firebase functions:config:set email.password="your-app-password"
  ```

### 4. SSL Certificate

- Firebase will automatically provision SSL for custom domain
- Verify HTTPS is working after DNS propagation

### 5. Testing Checklist

- [ ] Domain resolves correctly
- [ ] HTTPS works
- [ ] Email sending works with new addresses
- [ ] PDF generation uses correct domain
- [ ] All internal links updated

## Rollback Plan

If issues arise, the system can continue using:

- Current Firebase URL: `https://taklaget-service-app.web.app`
- Old email addresses as fallback

## Files Updated

- `src/services/emailService.ts` - Email templates and defaults
- `functions/src/emailService.ts` - Firebase Functions email service
- `src/services/enhancedPdfService.ts` - PDF branding
- `src/services/pdfService.ts` - Legacy PDF service
- `src/locales/sv.json` - UI text
- `src/components/QATestingPage.tsx` - Test data
- `src/__tests__/services/emailService.test.ts` - Test data

## Environment Variables

Update these in Firebase Functions:

```bash
EMAIL_USER=noreply@taklaget.app
EMAIL_PASSWORD=your-app-password
```

## Monitoring

- Check Firebase Functions logs for email sending
- Monitor domain resolution and SSL status
- Test email delivery to various providers
