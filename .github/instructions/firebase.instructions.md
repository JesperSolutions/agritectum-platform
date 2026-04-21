---
applyTo: 'functions/**,firestore.rules,firestore.indexes.json,storage.rules,src/services/**,extensions/**'
---

# Firebase Conventions

## Firestore Rules
- Deny-by-default; allow explicitly.
- Validate RBAC via `request.auth.token` custom claims, never by reading a user doc inside a rule (reads cost money and recurse).
- Validate write shape with `request.resource.data.keys().hasOnly([...])` and type checks.
- Every rule change requires a matching test (emulator-based in `functions/` or `scripts/`).

## Indexes
- Add a composite index entry to `firestore.indexes.json` for every multi-field or array-contains + orderBy query.

## Cloud Functions (v2)
- Triggers: `onDocumentWritten`, `onCall`, `onSchedule`, `onRequest`.
- Handlers must be **idempotent** — guard with `event.id` or a processed-flag document.
- Lazy-import heavy deps (Puppeteer, jspdf, etc.) inside the handler.
- Use structured logging (`logger.info({ ... })`). Never log secrets, tokens, or full user records.
- Secrets via `defineSecret()` — never hardcode.

## Client Services (`src/services/**`)
- One service module per domain (reports, customers, buildings, offers, notifications, ...).
- Return typed results and throw typed errors.
- No UI imports. Components call services; services call Firestore.

## Email
- To send email, write a doc to the `mail/` collection matching the Trigger Email extension schema. Do not call MailerSend REST directly.

## Storage
- Enforce max file size and MIME type both client-side and in `storage.rules`.
- Path convention: `orgs/{orgId}/branches/{branchId}/{domain}/{docId}/{filename}`.
