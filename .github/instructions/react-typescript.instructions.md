---
applyTo: 'src/**/*.{ts,tsx}'
---

# React + TypeScript Conventions

## Components
- Function components only. No class components.
- Props typed via `interface` named `<Component>Props`.
- Default export for page components; named export for reusable components.
- Co-locate component-specific hooks and helpers in the same folder; promote to `src/hooks/` or `src/utils/` when reused.

## Hooks
- Custom hooks named `useX` and live in `src/hooks/`.
- Follow Rules of Hooks — exhaustive deps enforced by `eslint-plugin-react-hooks`.

## State
- Local UI state → `useState` / `useReducer`.
- Cross-component state → Zustand stores in `src/stores/` (use `immer` middleware for nested updates).
- Server state / Firestore subscriptions → `src/services/**` + store hydration or context.

## Types
- No `any` without an inline justification comment.
- Prefer discriminated unions for variant props and async result shapes.
- Use `zod` schemas as source of truth; derive TS types via `z.infer<typeof schema>`.

## Styling
- Tailwind utilities first; use `cn()` from `src/lib/utils.ts` for conditional classes.
- Variants via `class-variance-authority` (see existing `ui/` primitives).
- No inline `style` unless dynamic values require it.

## Routing
- React Router v7 data APIs. Route definitions live in `src/Router.tsx` / `src/routing/`.
- Wrap routed components in `RouteErrorBoundary`.

## Forms
- `react-hook-form` + `@hookform/resolvers/zod` exclusively.
- Use `FormField` / `ValidatedInput` wrappers.

## Performance
- Memoize only when profiling shows benefit.
- Lazy-load heavy routes via `LazyComponents.tsx` pattern.
- Virtualize long lists with `react-window`.
