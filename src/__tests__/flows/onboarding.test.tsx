// Onboarding / auth flow regression tests.
// Scaffolded by Phase 0 of the user-flow audit plan.
// Fixes from Phase 2 drop concrete tests into the describe blocks below.
import { describe, it } from 'vitest';

describe('onboarding flow', () => {
  describe('login form', () => {
    it.todo('submits credentials and routes authenticated user to dashboard');
    it.todo('surfaces provider errors through ErrorDisplay');
    it.todo('is free of serious a11y violations');
  });

  describe('password reset', () => {
    it.todo('sends reset email and confirms to the user');
  });

  describe('router 404', () => {
    it.todo('renders a localized not-found page for unknown paths');
  });
});
