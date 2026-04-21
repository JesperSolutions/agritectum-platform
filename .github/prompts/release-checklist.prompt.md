---
description: 'Produce a release checklist for deploying to test or production.'
mode: 'Plan'
---

Target environment: `${input:env|test|prod}`.

Produce a release checklist covering:

1. **Pre-flight**
   - Branch is correct (`develop` for test, `main` for prod).
   - `npm run check` passes locally.
   - Vitest suite passes.
   - Emulator-based Firestore rules tests pass.
   - No secrets in the diff (`grep` for API keys, tokens).
   - `CHANGELOG.md` updated with user-visible changes.

2. **Build**
   - `npm run build` (or `npm run build:test`) completes with no warnings.
   - Bundle size diff reviewed.

3. **Firebase**
   - Rule diff reviewed.
   - Index diff reviewed — new composite indexes added.
   - Functions diff reviewed — check cold-start impact and secrets.
   - Extension parameter files (`extensions/*.params.json`) reviewed.

4. **Deploy commands**
   - Test: `npm run deploy:test`.
   - Prod: `npm run deploy:prod` — **requires explicit user approval**.

5. **Post-deploy**
   - Smoke-test critical flows: login, create report, upload image, send email, Stripe checkout.
   - Check Cloud Functions logs for errors (first 5 minutes).
   - Verify email delivery via MailerSend dashboard.

Flag any blocker before allowing the deploy to proceed.
