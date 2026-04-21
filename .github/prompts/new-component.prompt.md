---
description: 'Scaffold a new React component following Agritectum conventions.'
mode: 'Implement'
---

Create a new React component named `${input:name:ComponentName}` in `src/components/${input:folder:subfolder}/`.

Requirements:
- TypeScript function component with `${input:name}Props` interface.
- Accessible by default (semantic HTML, labelled controls, keyboard support).
- Styled with Tailwind; use `cn()` from `src/lib/utils.ts` for conditional classes.
- All user-facing strings via `react-intl` with IDs prefixed `${input:messagePrefix:feature.subfeature}`.
- Reuse `AccessibleButton`, `FormField`, `ErrorDisplay`, or other existing primitives when applicable.
- Export from `src/components/${input:folder}/index.ts` if an index exists.
- Add a co-located Vitest + RTL test file `${input:name}.test.tsx` covering the primary happy path and one error state.

Do not add Firestore calls directly — route any data access through an existing or new service in `src/services/`.
