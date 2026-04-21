---
description: 'Create a new typed service module in src/services/ for a Firestore collection.'
mode: 'Implement'
---

Create a new service module `${input:name:domainName}.service.ts` in `src/services/` for the `${input:collection:collectionPath}` Firestore collection.

Deliverables:
1. A Zod schema for the document shape; derive TS type with `z.infer`.
2. Typed CRUD helpers: `get`, `list` (with filter + pagination), `create`, `update`, `delete` — as needed for the task.
3. Real-time subscription helper `subscribeTo${input:name}` returning an unsubscribe function.
4. All reads/writes go through the service; components never import `firebase/firestore` directly.
5. Structured error handling: throw typed errors (not raw Firebase errors) to the caller.
6. Corresponding Firestore rule updates in `firestore.rules` with RBAC checks against custom claims.
7. Any new composite query registered in `firestore.indexes.json`.
8. Emulator-based rules tests covering allow/deny cases.

Verify:
- `npm run check` passes.
- No UI imports in the service file.
