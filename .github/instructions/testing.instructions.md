---
applyTo: '**/__tests__/**,**/*.test.{ts,tsx},**/*.spec.{ts,tsx}'
---

# Testing Conventions

## Stack
- Unit/component: Vitest + React Testing Library.
- Firestore rules & functions: Firebase Emulator Suite + `@firebase/rules-unit-testing`.

## Principles
- Test **behavior**, not implementation.
- One assertion topic per test; use clear `it('...')` names stating the expected behavior.
- Use `screen.getByRole(...)` over `getByTestId` where possible — reinforces accessibility.
- Mock at the service boundary (`src/services/**`), not inside components.

## Fixtures
- Shared fixtures in `src/__tests__/fixtures/`.
- Never use real PII, real customer names, or real addresses.

## Firebase Tests
- Run against emulators (`npm run emulators`).
- Every rule change gets a positive and negative case.

## CI
- `npm run check` must pass.
- New code paths require tests; bug fixes require a regression test.
