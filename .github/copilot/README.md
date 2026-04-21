# Copilot Configuration

Custom Copilot agents, skills, and prompts for the Agritectum Platform.

## Chat Modes (Agents) — `.github/chatmodes/`

Open the Copilot Chat mode picker and select one of:

| Mode | When to use |
|---|---|
| **Plan** | System design, architecture, tradeoffs — no code. |
| **Implement** | Write production code following project conventions. |
| **Review** | Senior code review with severity-graded findings. |
| **Debug** | Root-cause investigation and minimal fix. |
| **Firebase** | Firestore rules/indexes, Functions v2, Extensions, Storage. |
| **A11y** | WCAG 2.2 AA audits and remediation. |

## Instructions — `.github/instructions/`

Automatically applied based on file path (`applyTo` frontmatter):

| File | Scope |
|---|---|
| `general.instructions.md` | All files — golden rules, email provider, branching. |
| `react-typescript.instructions.md` | `src/**/*.{ts,tsx}` |
| `firebase.instructions.md` | `functions/**`, `firestore.rules`, `storage.rules`, `src/services/**`, `extensions/**` |
| `i18n.instructions.md` | `src/**/*.{ts,tsx}` — react-intl rules. |
| `testing.instructions.md` | `**/__tests__/**`, `**/*.test.*`, `**/*.spec.*` |

## Prompts — `.github/prompts/`

Reusable prompts. Run with `/` in Copilot Chat:

| Prompt | Purpose |
|---|---|
| `/new-component` | Scaffold a new accessible React component. |
| `/new-firestore-service` | Create a typed service module + rules + indexes + tests. |
| `/audit-accessibility` | WCAG 2.2 AA audit of a component or page. |
| `/release-checklist` | Pre-deploy checklist for test or production. |
| `/debug-issue` | Structured root-cause debugging session. |

## Conventions Encoded

- **Email**: MailerSend SMTP via Trigger Email extension only. Never SendGrid / AWS SES.
- **Default deploy target**: `agritectum-platform-test`. Production requires explicit approval.
- **No hardcoded user-facing strings** — enforced by `eslint-rules/no-hardcoded-strings.js`.
- **No direct Firestore calls in components** — use `src/services/**`.
- **Three-tier RBAC**: `platform_admin` / `org_admin` / `branch_user` via Auth custom claims.

## Extending

- New chat mode → create `.github/chatmodes/<Name>.chatmode.md` with `description` and optional `tools` frontmatter.
- New path-scoped rule → create `.github/instructions/<name>.instructions.md` with an `applyTo` glob.
- New reusable prompt → create `.github/prompts/<name>.prompt.md` with `description` and optional `mode` frontmatter.
