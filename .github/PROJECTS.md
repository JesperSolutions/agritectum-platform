# GitHub Projects v2 — setup notes

GitHub Projects v2 boards can't be fully created via files in the repo; they live at the
organization/user level and are configured through the GitHub UI or the GraphQL API.
This file captures the **recommended board layout** so it can be recreated consistently.

## Recommended board: "Agritectum — Delivery"

**Scope:** repository `JesperSolutions/agritectum-platform`.

**Layout:** Board view grouped by `Status`.

### Columns (Status field values)

1. **Triage** — new issues land here (auto via default label `status:triage`).
2. **Backlog** — accepted, not yet scheduled.
3. **Ready** — scoped, acceptance criteria written, ready to pick up.
4. **In progress** — someone is actively working on it.
5. **In review** — PR open.
6. **Blocked** — waiting on external dependency.
7. **Done** — merged / closed.

### Custom fields

| Field      | Type          | Options / notes                                         |
| ---------- | ------------- | ------------------------------------------------------- |
| Priority   | Single select | `P0`, `P1`, `P2`, `P3` (mirror the `priority:*` labels) |
| Area       | Single select | Mirror the `area:*` labels                              |
| Effort     | Single select | `XS`, `S`, `M`, `L`, `XL`                               |
| Target env | Single select | `test`, `prod`                                          |
| Iteration  | Iteration     | 2-week cadence                                          |

### Saved views

- **Triage** — filter `Status = Triage`, sorted by created date descending.
- **Current iteration** — filter `Iteration = @current`, grouped by `Status`.
- **P0/P1 only** — filter `Priority in (P0, P1)`, grouped by `Status`.
- **By area** — group by `Area`, filter `Status != Done`.
- **Release readiness** — filter `Status in (In review, Blocked)`, sorted by `Priority`.

### Automation (enable under Project → Workflows)

- Auto-add new issues from this repo with `status:triage` → column **Triage**.
- Issue closed → column **Done**.
- PR linked to item opened → column **In review**.
- PR merged → column **Done**.
- Issue labeled `status:blocked` → column **Blocked**.

## Setup steps (manual, one-time)

1. Go to <https://github.com/users/JesperSolutions/projects> and click **New project**.
2. Choose **Board** template, name it `Agritectum — Delivery`.
3. Add the columns listed above (rename the default ones).
4. Add the custom fields listed above.
5. Link the project to the `agritectum-platform` repository:
   Project → **⋯** → **Settings** → **Manage access** → add repository.
6. Enable the automations under **Workflows**.
7. Save the views listed above.

## Linking from issues / PRs

- In an issue or PR sidebar, click **Projects** → select `Agritectum — Delivery`.
- `gh` CLI shortcut:
  ```pwsh
  gh issue edit <number> --add-project "Agritectum — Delivery"
  ```

## GraphQL bootstrap (optional)

If we later want to rebuild this board programmatically, the minimum bootstrap is:

```graphql
mutation {
  createProjectV2(input: { ownerId: "<user-node-id>", title: "Agritectum — Delivery" }) {
    projectV2 {
      id
      number
      url
    }
  }
}
```

Then follow up with `addProjectV2Field` for each custom field. Keep the resulting
project node id in `1Password` / GitHub secrets as `PROJECT_NODE_ID` if we want
CI to auto-add items.
