# Deployment

Guides for deploying Agritectum Platform to production and test environments.

## Quick Deploy

**Production:**

```bash
npm run build
npm run deploy:prod
```

**Test Environment:**

```bash
npm run build:test
npm run deploy:test
```

---

## What's in This Section

- **DEPLOYMENT.md** - Complete deployment guide including:
  - Deployment readiness checklist
  - Deployment process steps
  - DNS configuration for email
  - EU GDPR compliance requirements
  - System integration verification
  - Google Maps API security
  - Worldwide address support

---

## Deployment Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] Code reviewed
- [ ] Environment variables configured
- [ ] Firebase rules updated
- [ ] DNS records configured (if new domain)
- [ ] Email system tested
- [ ] Maps integration verified
- [ ] Firestore backups taken
- [ ] Deployment script tested on staging

---

## Pre-Deployment Verification

**Check Firebase Status:**

```bash
firebase status
```

**Test Build:**

```bash
npm run build
```

**Verify Environment:**

```bash
echo $VITE_FIREBASE_PROJECT_ID
echo $VITE_FIREBASE_API_KEY
```

---

## Rollback Procedure

If issues occur after deployment:

1. Check Firebase Console logs
2. Review recent deployments
3. Identify the issue
4. Revert to previous working version
5. Verify and redeploy

---

## Environments

| Environment | Domain                           | Purpose           | Update Frequency |
| ----------- | -------------------------------- | ----------------- | ---------------- |
| Development | localhost:5173                   | Local development | Continuous       |
| Test        | agritectum-platform-test.web.app | Staging/QA        | Weekly           |
| Production  | agritectum-platform.web.app      | Live users        | As needed        |

---

**See Also**: [DEPLOYMENT.md](DEPLOYMENT.md)
