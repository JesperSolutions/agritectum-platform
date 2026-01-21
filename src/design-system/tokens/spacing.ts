/**
 * Spacing Tokens - Material Design System
 *
 * 8dp grid system for consistent spacing across the application.
 * Base unit: 0.5rem (8px) = 1dp in Material Design
 */

// Base spacing unit (8px = 0.5rem)
export const baseUnit = 0.5; // rem

// Spacing Scale (8dp increments)
export const spacing = {
  // 0.5rem = 8px (1dp)
  xs: '0.5rem', // 8px
  // 1rem = 16px (2dp)
  sm: '1rem', // 16px
  // 1.5rem = 24px (3dp)
  md: '1.5rem', // 24px
  // 2rem = 32px (4dp)
  lg: '2rem', // 32px
  // 3rem = 48px (6dp)
  xl: '3rem', // 48px
  // 4rem = 64px (8dp)
  '2xl': '4rem', // 64px
  // 6rem = 96px (12dp)
  '3xl': '6rem', // 96px
};

// Tailwind Spacing Classes (8dp grid)
export const spacingClasses = {
  // Padding
  padding: {
    xs: 'p-1', // 0.25rem = 4px (0.5dp) - exception for tight spaces
    sm: 'p-2', // 0.5rem = 8px (1dp)
    md: 'p-4', // 1rem = 16px (2dp)
    lg: 'p-6', // 1.5rem = 24px (3dp)
    xl: 'p-8', // 2rem = 32px (4dp)
    '2xl': 'p-12', // 3rem = 48px (6dp)
  },
  // Padding X (horizontal)
  paddingX: {
    sm: 'px-2', // 0.5rem = 8px
    md: 'px-4', // 1rem = 16px
    lg: 'px-6', // 1.5rem = 24px
    xl: 'px-8', // 2rem = 32px
  },
  // Padding Y (vertical)
  paddingY: {
    sm: 'py-2', // 0.5rem = 8px
    md: 'py-4', // 1rem = 16px
    lg: 'py-6', // 1.5rem = 24px
    xl: 'py-8', // 2rem = 32px
  },
  // Margin
  margin: {
    xs: 'm-1', // 0.25rem = 4px
    sm: 'm-2', // 0.5rem = 8px
    md: 'm-4', // 1rem = 16px
    lg: 'm-6', // 1.5rem = 24px
    xl: 'm-8', // 2rem = 32px
  },
  // Margin X (horizontal)
  marginX: {
    sm: 'mx-2', // 0.5rem = 8px
    md: 'mx-4', // 1rem = 16px
    lg: 'mx-6', // 1.5rem = 24px
    xl: 'mx-8', // 2rem = 32px
  },
  // Margin Y (vertical)
  marginY: {
    sm: 'my-2', // 0.5rem = 8px
    md: 'my-4', // 1rem = 16px
    lg: 'my-6', // 1.5rem = 24px
    xl: 'my-8', // 2rem = 32px
  },
  // Gap (for flexbox/grid)
  gap: {
    xs: 'gap-1', // 0.25rem = 4px
    sm: 'gap-2', // 0.5rem = 8px
    md: 'gap-4', // 1rem = 16px
    lg: 'gap-6', // 1.5rem = 24px
    xl: 'gap-8', // 2rem = 32px
  },
};

// Component-Specific Spacing
export const componentSpacing = {
  // Button Padding
  button: {
    sm: 'px-3 py-1.5', // 12px x 6px
    md: 'px-4 py-2', // 16px x 8px
    lg: 'px-6 py-3', // 24px x 12px
  },
  // Input Padding
  input: {
    default: 'px-3 py-2.5', // 12px x 10px
    sm: 'px-2 py-1.5', // 8px x 6px
    lg: 'px-4 py-3', // 16px x 12px
  },
  // Card Padding
  card: {
    compact: 'p-4', // 16px (2dp)
    default: 'p-6', // 24px (3dp)
    spacious: 'p-8', // 32px (4dp)
  },
  // Section Spacing
  section: {
    sm: 'py-8', // 32px vertical
    md: 'py-12', // 48px vertical
    lg: 'py-16', // 64px vertical
  },
  // Container Padding
  container: {
    sm: 'px-4', // 16px horizontal
    md: 'px-6', // 24px horizontal
    lg: 'px-8', // 32px horizontal
  },
};

// Export unified spacing tokens
export const spacingTokens = {
  baseUnit,
  spacing,
  spacingClasses,
  componentSpacing,
};

export default spacingTokens;
