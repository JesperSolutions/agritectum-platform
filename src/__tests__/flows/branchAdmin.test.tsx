// Branch admin flow regression tests.
// Scaffolded by Phase 0 of the user-flow audit plan.
import { describe, it } from 'vitest';

describe('branch admin flow', () => {
  describe('BranchManagement (fix #9)', () => {
    it.todo('renders inputs through FormField with aria-invalid on error');
    it.todo('uses AccessibleModal for destructive branch deletion');
  });

  describe('route guards (fix #4)', () => {
    it.todo('blocks inspector role from /admin/branches');
    it.todo('allows superadmin and branch admin on /admin/branches');
  });
});
