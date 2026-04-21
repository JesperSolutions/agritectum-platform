# Security Policy

## Supported versions

Only the latest production release on `main` (deployed to `agritectum-platform`) receives security fixes.

## Reporting a vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Use one of the following private channels:

1. **GitHub Security Advisories** — preferred. Open a private report at
   <https://github.com/JesperSolutions/agritectum-platform/security/advisories/new>.
2. **Email** — send details to the repository owner listed in `.github/CODEOWNERS`.

Please include:

- A description of the issue and the potential impact.
- Steps to reproduce (or a proof-of-concept).
- The affected URL, endpoint, component, or Cloud Function.
- Whether the vulnerability is already public.

We aim to acknowledge reports within **3 business days** and to provide a fix or mitigation plan within **14 days** for high-severity issues.

## Scope

In scope:

- The web application (`https://agritectum-platform.web.app` and custom domains).
- Firebase Cloud Functions under `functions/`.
- Firestore security rules (`firestore.rules`) and Storage rules (`storage.rules`).
- Authentication, RBAC, and session handling.

Out of scope:

- Third-party services we integrate with (Firebase, Stripe, MailerSend, Google Maps) — report directly to those vendors.
- Social-engineering attacks against staff.
- Denial-of-service attacks.
- Automated scanner output without a working proof-of-concept.

## Safe-harbor

Good-faith security research that complies with this policy will not be pursued legally. Please avoid accessing data that is not your own, degrading service for other users, or exfiltrating data beyond the minimum needed to demonstrate the issue.
