// Shared accessibility assertion helper for the user-flow audit.
// Usage:
//   import { expectNoA11yViolations } from '@/__tests__/helpers/axe';
//   await expectNoA11yViolations(container);
import { axe, toHaveNoViolations } from 'jest-axe';
import { expect } from 'vitest';

expect.extend(toHaveNoViolations);

export async function expectNoA11yViolations(
  container: Element | Document,
  options?: Parameters<typeof axe>[1]
): Promise<void> {
  const results = await axe(container, options);
  // `toHaveNoViolations` matcher is provided by jest-axe; Vitest accepts jest matchers.
  expect(results).toHaveNoViolations();
}

export { axe };
