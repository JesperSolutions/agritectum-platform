# Deployment Guide

Complete guide for deploying Agritectum Platform to production.

## Table of Contents

1. [Deployment Readiness](#deployment-readiness)
2. [Deployment Process](#deployment-process)
3. [DNS Configuration](#dns-configuration)
4. [EU Compliance](#eu-compliance)
5. [System Integration Checks](#system-integration-checks)
6. [API Security](#api-security)

---

## Deployment Readiness

### ✅ Pre-Deployment Checklist

**Code & Testing:**

- ✅ All tests passing
- ✅ Code reviewed
- ✅ Build optimized
- ✅ No console errors

**Infrastructure:**

- ✅ Firebase configured
- ✅ Environment variables set
- ✅ Firestore rules deployed
- ✅ Storage rules configured
- ✅ Cloud Functions ready

**Documentation:**

- ✅ All features documented
- ✅ Deployment process clear
- ✅ Rollback plan ready
- ✅ Team trained

**Material Design:**

- ✅ Roboto font implemented throughout
- ✅ Material elevation system (6 levels)
- ✅ Material Design on all pages
- ✅ 80-90% visual coverage
- ✅ Zero functionality breaks

### Deployment Commands

```bash
# Production deployment
npm run build
firebase deploy --only hosting,functions,firestore:rules,storage --project agritectum-platform

# Test deployment
npm run build:test
firebase deploy --only hosting,functions,firestore:rules,storage --project agritectum-platform-test

# Rules only
npm run deploy:rules
```

---

## Deployment Process

### 1. Pre-Deployment

```bash
# Run tests
npm test

# Build production bundle
npm run build

# Verify bundle size
ls -lh dist/
```

### 2. Staging Deployment

Deploy to test environment first to verify everything works:

```bash
npm run build:test
firebase deploy --only hosting --project agritectum-platform-test
```

### 3. Production Deployment

Once staging is verified:

```bash
npm run build
firebase deploy --only hosting --project agritectum-platform
```

### 4. Post-Deployment

- Monitor error logs in Firebase Console
- Verify all features work
- Check email delivery
- Test critical user flows
- Monitor performance

---

## DNS Configuration

### Domain Setup: agritectum-platform

Configure these DNS records for proper email deliverability and domain verification.

### 1. SPF (Sender Policy Framework) Record

**Purpose**: Authorizes email servers to send on behalf of your domain

**Record Type**: TXT  
**Name**: @ (root domain)  
**Value**:

```
v=spf1 include:spf.protection.outlook.com include:_spf.mailersend.net -all
```

**Explanation**:

- `include:spf.protection.outlook.com` - Microsoft 365 authorization
- `include:_spf.mailersend.net` - MailerSend authorization
- `-all` - Reject emails from unauthorized sources

**Verification**:

```bash
dig TXT your-domain.com
nslookup -type=TXT your-domain.com
```

### 2. DKIM (DomainKeys Identified Mail) Records

DKIM records are automatically created by:

- **Microsoft 365**: Check admin center → Exchange → Protection → DKIM
- **MailerSend**: Provided in settings → Domain configuration

### 3. DMARC (Domain-based Message Authentication, Reporting and Conformance)

**Record Type**: TXT  
**Name**: \_dmarc  
**Value**:

```
v=DMARC1; p=quarantine; rua=mailto:admin@your-domain.com
```

### 4. MX (Mail Exchange) Records

If using custom domain for email:

**Record Type**: MX  
**Name**: @ (root)  
**Priority**: 10  
**Value**: `[your-mail-server]`

---

## EU Compliance

### GDPR & EU Data Protection

**Legal Basis for Processing:**

- **Contract Performance**: Service delivery
- **Legitimate Interest**: Business operations
- **Consent**: User registration and communications

**Data Categories:**

- Personal: Names, email, phone numbers
- Business: Company info, addresses, contacts
- Technical: IP addresses, device info, usage
- Report: Inspection data, images, assessments

### Data Subject Rights

**Right to Access**: Users can view and export all personal data
**Right to Rectification**: Users can update their information
**Right to Erasure**: Account deletion with full data cleanup
**Right to Portability**: Data export in standard formats
**Right to Object**: Opt-out mechanisms available

### Data Protection Measures

- ✅ Data encryption at rest and in transit
- ✅ Firestore security rules enforced
- ✅ Role-based access control
- ✅ Regular security audits
- ✅ Data retention policies
- ✅ Privacy-by-design architecture

### Compliance Verification

- ✅ Data Processing Agreement (DPA) required with Firebase
- ✅ Standard Contractual Clauses (SCCs) in place
- ✅ Regular compliance reviews
- ✅ Incident response procedures documented
- ✅ User privacy policy current

---

## System Integration Checks

Before deployment, verify all system integrations are working:

### 1. Firebase Integration

```javascript
// Verify authentication
firebase.auth().currentUser;

// Verify Firestore connection
firebase.firestore().collection('users').get();

// Verify Storage access
firebase.storage().bucket().listFiles();
```

### 2. Email System

- ✅ MailerSend API configured
- ✅ Email templates active
- ✅ Sender domain verified
- ✅ Test emails delivering
- ✅ Microsoft 365 sync working (if applicable)

### 3. Maps Integration

- ✅ Google Maps API key valid
- ✅ Geocoding enabled
- ✅ Address validation working
- ✅ Satellite imagery accessible
- ✅ Billing alerts configured

### 4. File Storage

- ✅ Firebase Storage rules deployed
- ✅ Upload functionality working
- ✅ PDF generation functional
- ✅ File cleanup processes running

### 5. Notifications

- ✅ Firebase Cloud Messaging configured
- ✅ FCM tokens generating
- ✅ Push notifications sending
- ✅ In-app notifications working

---

## API Security

### Google Maps API Security

**API Key Restrictions:**

1. **Application Restrictions**
   - Restrict to your web domain
   - HTTP referrers: `*.agritectum-platform.web.app`

2. **API Restrictions**
   - Enable only required APIs:
     - Maps JavaScript API
     - Places API
     - Geocoding API
     - Static Maps API

3. **Quota Monitoring**
   - Monitor daily usage
   - Set billing alerts
   - Review for unusual spikes

### Firebase Security Rules

Firestore rules should enforce:

```javascript
// Only authenticated users
match /documents/{document=**} {
  allow read, write: if request.auth != null;
}

// Role-based access
match /users/{userId} {
  allow read: if request.auth.uid == userId ||
               getUserRole() == 'admin';
  allow write: if request.auth.uid == userId;
}
```

### Environment Variables

All sensitive data in `.env`:

- Firebase configuration
- API keys (restricted to domain)
- Email service credentials
- Third-party integrations

Never commit `.env` files to version control.

---

## Worldwide Address Support

The system supports addresses worldwide with:

- ✅ International address formats
- ✅ Google Geocoding API for validation
- ✅ Satellite imagery global coverage
- ✅ Multi-language support
- ✅ Timezone handling

---

## Troubleshooting

### Common Issues

**Firebase Connection Failed**

- Check network connectivity
- Verify Firebase project ID
- Confirm authentication token
- Check Firestore rules

**Emails Not Sending**

- Verify MailerSend API key
- Check sender domain validation
- Review email templates
- Monitor email logs

**Maps Not Loading**

- Verify Google Maps API key
- Check domain restrictions
- Confirm API quota available
- Check browser console for errors

**Performance Issues**

- Check Firebase usage metrics
- Monitor function execution time
- Review Firestore index health
- Optimize bundle size

---

**Last Updated**: January 2026  
**Maintained By**: Development Team
