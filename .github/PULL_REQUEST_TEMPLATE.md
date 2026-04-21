<!--
Thanks for contributing! Please fill in each section.
Reference conventions: .github/instructions/general.instructions.md
-->

## Summary

<!-- One-sentence description of the change -->

Closes #

## Type

- [ ] `feat` — new feature
- [ ] `fix` — bug fix
- [ ] `refactor` — internal change, no behavior change
- [ ] `perf` — performance improvement
- [ ] `test` — adding or fixing tests
- [ ] `docs` — documentation only
- [ ] `chore` / `build` / `ci`

## Changes

<!-- Bullet list of notable changes -->

-

## Screenshots / recordings

<!-- For UI changes, include before/after -->

## Checklist

### Code quality

- [ ] `npm run check` passes locally
- [ ] `npm run test -- --run` passes
- [ ] Added or updated tests for changed behavior
- [ ] No new ESLint errors in touched files
- [ ] Diff is minimal — no drive-by refactors or reformatting

### Platform conventions

- [ ] No hardcoded user-facing strings — all new copy uses `react-intl` and keys exist in **all five** locales (`en`, `sv`, `da`, `de`, `no`)
- [ ] No direct Firestore calls in components — went through `src/services/**`
- [ ] Reused existing primitives (`AccessibleButton`, `FormField`, `AccessibleModal`, `ErrorDisplay`, …) instead of rebuilding
- [ ] Email changes write to the `mail/` Firestore collection (MailerSend) — no SendGrid / SES / direct SMTP added

### Security & privacy

- [ ] No secrets, tokens, service-account keys, or full user objects logged
- [ ] External input (forms, callable functions, URL params) validated with Zod
- [ ] RBAC respected — `platform_admin` / `org_admin` / `branch_user` claims checked where needed
- [ ] Firestore & Storage rules updated if new collections/paths were added

### Deploy gate

- [ ] Target environment is **test** (`agritectum-platform-test`) unless the PR title explicitly says `[prod]` and has maintainer approval
- [ ] Manual smoke on test env: desktop, mobile viewport, offline toggle

### Review focus

<!-- Call out areas where you want extra scrutiny -->
