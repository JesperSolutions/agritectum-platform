/**
 * Design System Component Patterns
 * 
 * Standardized component class name patterns for consistent styling.
 * Use these patterns when creating new components or updating existing ones.
 */

import { colors, borderRadius, shadows, spacing, formInput, card, statusBadge, table, typography } from './tokens';

/**
 * Button Variants
 */
export const buttonVariants = {
  primary: colors.button.primary.className,
  secondary: colors.button.secondary.className,
  danger: colors.button.danger.className,
  ghost: colors.button.ghost.className,
};

/**
 * Card Variants
 */
export const cardVariants = {
  main: card.main,
  inner: card.inner,
  compact: card.compact,
};

/**
 * Form Input Variants
 */
export const inputVariants = {
  default: formInput.base,
  error: formInput.error,
  disabled: formInput.disabled,
};

/**
 * Status Badge Variants
 */
export const badgeVariants = {
  success: statusBadge.success,
  error: statusBadge.error,
  warning: statusBadge.warning,
  info: statusBadge.info,
  purple: statusBadge.purple,
};

/**
 * Table Variants
 */
export const tableVariants = {
  header: table.header,
  headerCell: table.headerCell,
  row: table.row,
  cell: table.cell,
};

/**
 * Typography Variants
 */
export const typographyVariants = {
  h1: typography.heading.h1,
  h2: typography.heading.h2,
  h3: typography.heading.h3,
  h4: typography.heading.h4,
  bodyPrimary: typography.body.primary,
  bodySecondary: typography.body.secondary,
  bodyTertiary: typography.body.tertiary,
  label: typography.label.default,
  labelRequired: typography.label.required,
};

/**
 * Helper function to combine class names
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Helper function to get button classes
 */
export function getButtonClasses(variant: keyof typeof buttonVariants = 'primary'): string {
  return buttonVariants[variant];
}

/**
 * Helper function to get card classes
 */
export function getCardClasses(variant: keyof typeof cardVariants = 'main'): string {
  return cardVariants[variant];
}

/**
 * Helper function to get input classes
 */
export function getInputClasses(variant: keyof typeof inputVariants = 'default'): string {
  return inputVariants[variant];
}

/**
 * Helper function to get badge classes
 */
export function getBadgeClasses(variant: keyof typeof badgeVariants = 'info'): string {
  return badgeVariants[variant];
}

/**
 * Helper function to get table classes
 */
export function getTableClasses(part: keyof typeof tableVariants): string {
  return tableVariants[part];
}

/**
 * Helper function to get typography classes
 */
export function getTypographyClasses(variant: keyof typeof typographyVariants): string {
  return typographyVariants[variant];
}

export default {
  buttonVariants,
  cardVariants,
  inputVariants,
  badgeVariants,
  tableVariants,
  typographyVariants,
  cn,
  getButtonClasses,
  getCardClasses,
  getInputClasses,
  getBadgeClasses,
  getTableClasses,
  getTypographyClasses,
};
