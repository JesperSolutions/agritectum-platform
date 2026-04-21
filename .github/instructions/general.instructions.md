---
applyTo: '**'
---

# Agritectum Platform — Global Conventions

## Stack
React 18 · TypeScript (strict) · Vite 5 · Tailwind CSS · shadcn/Radix UI · Zustand · React Router 7 · react-intl · Firebase (Auth, Firestore, Functions v2, Hosting, Storage) · MailerSend SMTP (via Trigger Email Extension) · Stripe.

## Golden Rules
- **Test environment by default.** Production deploys require explicit user approval.
- **Email provider is MailerSend only.** Never add SendGrid, AWS SES, or direct SMTP code — write to the `mail/` Firestore collection.
- **No hardcoded user-facing strings.** Use `react-intl` (`<FormattedMessage>` / `useIntl()`). The `eslint-rules/no-hardcoded-strings.js` rule enforces this.
- **No direct Firestore in components.** Route through `src/services/**`.
- **Reuse primitives** in `src/components/` (`AccessibleButton`, `FormField`, `ErrorDisplay`, etc.) instead of rebuilding.
- **Keep diffs minimal.** Do not refactor, rename, or reformat code outside the task.

## Branching & Deploys
- Default branch for work: `develop` → deploys to `agritectum-platform-test`.
- `main` deploys to `agritectum-platform` (production) — never push without approval.

## Commit & PR
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).
- Run `npm run check` before committing.

## Security
- Never log secrets, tokens, or full user objects.
- Validate all external input (forms, callable functions, URL params) with Zod.
- Respect RBAC: platform_admin / org_admin / branch_user custom claims.
