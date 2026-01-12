/**
 * Accessibility Utilities
 * 
 * Helper functions for WCAG 2.1 AA compliance and accessibility best practices.
 */

/**
 * Get focus ring classes for interactive elements
 * WCAG 2.1 AA: Focus indicators must be at least 2px wide
 */
export function getFocusRing(color: 'slate' | 'red' | 'blue' | 'green' = 'slate'): string {
  const focusColors = {
    slate: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2',
    red: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2',
    blue: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
    green: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2',
  };
  return focusColors[color];
}

/**
 * Get ARIA attributes for form fields
 */
export function getFormFieldAttributes(
  fieldId: string,
  hasError: boolean,
  hasHelp: boolean
): {
  'aria-invalid': boolean | 'true' | 'false';
  'aria-describedby'?: string;
  'aria-required'?: boolean;
} {
  const attributes: {
    'aria-invalid': boolean | 'true' | 'false';
    'aria-describedby'?: string;
    'aria-required'?: boolean;
  } = {
    'aria-invalid': hasError ? 'true' : 'false',
  };

  if (hasError) {
    attributes['aria-describedby'] = `${fieldId}-error`;
  } else if (hasHelp) {
    attributes['aria-describedby'] = `${fieldId}-help`;
  }

  return attributes;
}

/**
 * Generate unique ID for form fields
 */
export function generateFieldId(prefix: string = 'field'): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Get error ID for a field
 */
export function getErrorId(fieldId: string): string {
  return `${fieldId}-error`;
}

/**
 * Get help text ID for a field
 */
export function getHelpId(fieldId: string): string {
  return `${fieldId}-help`;
}

/**
 * Check if color contrast meets WCAG AA standards
 * Returns true if contrast ratio >= 4.5:1 for normal text or 3:1 for large text
 */
export function meetsContrastRatio(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  // This is a simplified check - in production, use a proper contrast calculation library
  // WCAG AA: 4.5:1 for normal text, 3:1 for large text (18pt+ or 14pt+ bold)
  const minRatio = isLargeText ? 3 : 4.5;
  
  // Placeholder - would need actual color contrast calculation
  // For now, return true for known good combinations
  const goodCombinations = [
    ['slate-900', 'white'],
    ['slate-800', 'white'],
    ['slate-700', 'white'],
    ['white', 'slate-700'],
    ['white', 'slate-800'],
    ['white', 'slate-900'],
  ];
  
  return goodCombinations.some(
    ([fg, bg]) => foreground.includes(fg) && background.includes(bg)
  );
}

/**
 * Get screen reader only class
 */
export function srOnly(): string {
  return 'sr-only';
}

/**
 * Get skip link class for keyboard navigation
 */
export function skipLink(): string {
  return 'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-slate-900 focus:text-white';
}

export default {
  getFocusRing,
  getFormFieldAttributes,
  generateFieldId,
  getErrorId,
  getHelpId,
  meetsContrastRatio,
  srOnly,
  skipLink,
};
