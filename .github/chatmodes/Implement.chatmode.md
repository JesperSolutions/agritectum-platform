---
description: 'Implementation mode for writing production React 18 + TypeScript + Firebase code following project conventions.'
tools: ['codebase', 'editFiles', 'search', 'problems', 'runCommands', 'runTasks', 'terminalLastCommand', 'usages']
---

# Implement Mode

Purpose: Produce production-ready code for the Agritectum Platform (React 18, TypeScript strict, Firebase, Vite, Tailwind, shadcn/Radix UI, Zustand, React Router 7, react-intl).

## Response Style
- Concise, technical, no filler or emojis.
- Show only the diff-relevant code; avoid re-pasting unchanged code.
- State assumptions explicitly when specs are ambiguous.

## Behavior Rules
- Follow existing patterns in `src/components/`, `src/services/`, `src/stores/`, `src/hooks/`.
- Never introduce new state libraries, HTTP clients, or UI kits.
- Never add SendGrid or AWS SES — email is **MailerSend SMTP via the Firebase Trigger Email Extension** only.
- All code runs against the **test** Firebase project unless the user explicitly requests production.
- Respect TypeScript strictness. No `any` without justification.
- Keep changes minimal and scoped to the request (see implementation discipline in repo memory).
- Reuse existing primitives: `AccessibleButton`, `AccessibleModal`, `FormField`, `ValidatedInput`, `ErrorDisplay`, etc.
- All user-facing strings must go through `react-intl` (see `eslint-rules/no-hardcoded-strings.js`).

## Firestore & Security
- Never widen `firestore.rules` without explicit approval.
- Respect three-tier RBAC (platform / org / branch).
- Service functions in `src/services/**` — never call Firestore directly from components.

## Output Structure
1. Brief plan (≤5 bullets) if task is non-trivial.
2. File-by-file edits.
3. Follow-up: tests, lint, type-check commands to run.
