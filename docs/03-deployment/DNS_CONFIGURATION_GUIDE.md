# DNS Configuration Guide for Email Deliverability

## Overview

This guide provides step-by-step instructions for configuring DNS records to ensure proper email deliverability for the Taklaget email system using MailerSend for transactional emails and Microsoft 365 for human mail.

## Domain Configuration: taklaget.app

### 1. SPF (Sender Policy Framework) Record

**Purpose**: Authorizes MailerSend to send emails on behalf of taklaget.app while maintaining Microsoft 365 authorization.

**Record Type**: TXT  
**Name**: @ (or taklaget.app)  
**Value**: 
```
v=spf1 include:spf.protection.outlook.com include:_spf.mailersend.net -all
```

**Explanation**:
- `include:spf.protection.outlook.com` - Authorizes Microsoft 365 to send emails
- `include:_spf.mailersend.net` - Authorizes MailerSend to send emails
- `-all` - Reject emails from any other source

**Verification**:
```bash
dig TXT taklaget.app
nslookup -type=TXT taklaget.app
```

### 2. DKIM (DomainKeys Identified Mail) Records

#### Microsoft 365 DKIM

**Status**: Already configured for Microsoft 365  
**Records**: Should be automatically created by Microsoft 365  
**Verification**: Check Microsoft 365 admin center → Exchange → Protection → DKIM

#### MailerSend DKIM

**Setup Process**:
1. Log into MailerSend dashboard
2. Go to Domains → taklaget.app → DKIM
3. Enable DKIM signing
4. Copy the provided CNAME records
5. Add them to your DNS provider

**Example Records** (values will be provided by MailerSend):
```
Type: CNAME
Name: ms1._domainkey.taklaget.app
Value: ms1._domainkey.mailersend.net

Type: CNAME  
Name: ms2._domainkey.taklaget.app
Value: ms2._domainkey.mailersend.net
```

**Verification**:
```bash
dig CNAME ms1._domainkey.taklaget.app
dig CNAME ms2._domainkey.taklaget.app
```

### 3. DMARC (Domain-based Message Authentication) Record

**Phase 1 - Monitor Mode** (Start with this):
```
Record Type: TXT
Name: _dmarc.taklaget.app
Value: v=DMARC1; p=none; rua=mailto:dmarc@taklaget.app; fo=1
```

**Phase 2 - Quarantine Mode** (After 1-2 weeks of monitoring):
```
Record Type: TXT
Name: _dmarc.taklaget.app  
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@taklaget.app; ruf=mailto:dmarc@taklaget.app; fo=1
```

**Phase 3 - Reject Mode** (After quarantine is working well):
```
Record Type: TXT
Name: _dmarc.taklaget.app
Value: v=DMARC1; p=reject; rua=mailto:dmarc@taklaget.app; ruf=mailto:dmarc@taklaget.app; fo=1
```

**Parameters Explanation**:
- `p=none|quarantine|reject` - Policy for failed alignment
- `rua=mailto:dmarc@taklaget.app` - Aggregate reports destination
- `ruf=mailto:dmarc@taklaget.app` - Forensic reports destination (optional)
- `fo=1` - Generate forensic reports on SPF and DKIM alignment failures

**Verification**:
```bash
dig TXT _dmarc.taklaget.app
```

### 4. Mailbox Configuration

#### noreply@taklaget.app

**Purpose**: System-generated emails (transactional)  
**Configuration**: 
- Create mailbox in Microsoft 365
- Set up auto-reply: "This inbox is not monitored. Please contact support@taklaget.app for assistance."
- No forwarding needed
- Used as FROM address for transactional emails

#### support@taklaget.app

**Purpose**: Human support emails  
**Configuration**:
- Active mailbox in Microsoft 365
- Used as Reply-To address for transactional emails
- Handles customer inquiries and support requests

#### dmarc@taklaget.app

**Purpose**: DMARC report collection  
**Configuration**:
- Create mailbox or alias in Microsoft 365
- Set up rules to process DMARC reports
- Optional: Forward to monitoring service

### 5. MailerSend Domain Verification

**Steps**:
1. Log into MailerSend dashboard
2. Go to Domains → Add Domain → taklaget.app
3. Add required DNS records (SPF, DKIM, DMARC)
4. Verify domain ownership
5. Configure sender identity for noreply@taklaget.app
6. Test email sending

## DNS Record Summary

| Record Type | Name | Value | Purpose |
|-------------|------|-------|---------|
| TXT | @ | `v=spf1 include:spf.protection.outlook.com include:_spf.mailersend.net -all` | SPF authorization |
| CNAME | ms1._domainkey | `ms1._domainkey.mailersend.net` | MailerSend DKIM |
| CNAME | ms2._domainkey | `ms2._domainkey.mailersend.net` | MailerSend DKIM |
| TXT | _dmarc | `v=DMARC1; p=none; rua=mailto:dmarc@taklaget.app; fo=1` | DMARC policy |

## Verification Tools

### Online Tools
- [MXToolbox SPF Checker](https://mxtoolbox.com/spf.aspx)
- [DKIM Validator](https://dkimvalidator.com/)
- [DMARC Analyzer](https://dmarcian.com/dmarc-inspector/)
- [Mail Tester](https://www.mail-tester.com/)

### Command Line Tools
```bash
# Check SPF
dig TXT taklaget.app | grep spf

# Check DKIM
dig CNAME ms1._domainkey.taklaget.app
dig CNAME ms2._domainkey.taklaget.app

# Check DMARC
dig TXT _dmarc.taklaget.app

# Test email authentication
swaks --to test@example.com --from noreply@taklaget.app --server smtp.mailersend.net:587 --auth-user MS_Mq69Kn@taklaget.app --auth-password 'password'
```

## Testing Checklist

### DNS Records
- [ ] SPF record is valid and includes both Microsoft 365 and MailerSend
- [ ] DKIM records are properly configured for MailerSend
- [ ] DMARC record is in monitor mode initially
- [ ] All records pass online validation tools

### Email Authentication
- [ ] SPF alignment passes for noreply@taklaget.app
- [ ] DKIM signature is valid for MailerSend emails
- [ ] DMARC alignment passes for both SPF and DKIM
- [ ] Reply-To header points to support@taklaget.app

### Deliverability
- [ ] Test emails reach Gmail inbox
- [ ] Test emails reach Outlook inbox
- [ ] No emails go to spam folder
- [ ] Email headers show proper authentication
- [ ] Auto-reply works for noreply@taklaget.app

## Monitoring and Maintenance

### Daily Monitoring
- Check DMARC reports for alignment issues
- Monitor bounce rates and delivery statistics
- Review email authentication logs

### Weekly Review
- Analyze DMARC aggregate reports
- Check domain reputation scores
- Review any delivery issues

### Monthly Maintenance
- Update DNS records if needed
- Review and optimize DMARC policy
- Check for new authentication requirements

## Troubleshooting

### Common Issues

1. **SPF Alignment Fails**
   - Verify SPF record syntax
   - Check for duplicate SPF records
   - Ensure all sending sources are included

2. **DKIM Signature Invalid**
   - Verify DKIM records are correctly added
   - Check DNS propagation (up to 24 hours)
   - Ensure MailerSend DKIM is enabled

3. **DMARC Policy Too Strict**
   - Start with `p=none` and monitor
   - Gradually move to `p=quarantine`
   - Only use `p=reject` when confident

4. **Emails Going to Spam**
   - Check domain reputation
   - Verify all authentication records
   - Review email content and headers

### Emergency Procedures

1. **Disable DMARC Temporarily**
   ```
   v=DMARC1; p=none; rua=mailto:dmarc@taklaget.app; fo=1
   ```

2. **Switch to Microsoft 365 Only**
   ```
   v=spf1 include:spf.protection.outlook.com -all
   ```

3. **Contact Support**
   - MailerSend: support@mailersend.com
   - Microsoft 365: Admin center support
   - DNS Provider: Check their support documentation

## Security Considerations

1. **DNS Security**
   - Use DNSSEC if available
   - Monitor for DNS hijacking
   - Keep DNS records secure

2. **Email Security**
   - Use TLS for all email transmission
   - Implement email signing where appropriate
   - Monitor for email spoofing attempts

3. **Access Control**
   - Limit DNS modification access
   - Use strong authentication for all services
   - Regular security audits

## Compliance

### GDPR Considerations
- Ensure email addresses are collected with consent
- Provide unsubscribe mechanisms
- Handle data subject requests appropriately

### CAN-SPAM Compliance
- Include clear sender identification
- Provide valid physical address
- Honor unsubscribe requests promptly

### Industry Best Practices
- Follow RFC standards for email authentication
- Implement proper error handling
- Maintain delivery statistics and logs
