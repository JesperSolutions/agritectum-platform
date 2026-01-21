/**
 * Theme Utilities
 *
 * Helper functions for working with design tokens and theme values.
 */

import { colors } from '../tokens/colors';
import { typography } from '../tokens/typography';
import { spacing } from '../tokens/spacing';
import { shadows } from '../tokens/shadows';
import { borders } from '../tokens/borders';
import { motion } from '../tokens/motion';

/**
 * Combine class names (similar to clsx)
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Get button classes with variant and size
 */
export function getButtonClasses(
  variant: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link' = 'primary',
  size: 'sm' | 'md' | 'lg' = 'md'
): string {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-material font-medium transition-all duration-material focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 uppercase tracking-wide';

  const variantClasses = {
    primary: `${colors.button.primary.bg} ${colors.button.primary.text} ${colors.button.primary.bgHover} ${colors.button.primary.focus} ${shadows.shadows.button}`,
    secondary: `${colors.button.secondary.bg} ${colors.button.secondary.text} ${colors.button.secondary.border} ${colors.button.secondary.bgHover} ${colors.button.secondary.focus} ${shadows.shadows.button}`,
    danger: `${colors.button.danger.bg} ${colors.button.danger.text} ${colors.button.danger.bgHover} ${colors.button.danger.focus} ${shadows.shadows.button}`,
    ghost: `${colors.button.ghost.bg} ${colors.button.ghost.text} ${colors.button.ghost.bgHover} ${colors.button.ghost.focus}`,
    link: `${colors.button.link.bg} ${colors.button.link.text} ${colors.button.link.textHover} ${colors.button.link.underline} ${colors.button.link.focus}`,
  };

  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 py-2 text-sm',
    lg: 'h-12 px-6 py-3 text-base',
  };

  return cn(baseClasses, variantClasses[variant], sizeClasses[size]);
}

/**
 * Get card classes with variant
 */
export function getCardClasses(
  variant: 'elevated' | 'outlined' | 'filled' = 'elevated',
  padding: 'compact' | 'default' | 'spacious' = 'default'
): string {
  const baseClasses = 'rounded-material border transition-shadow duration-material';

  const variantClasses = {
    elevated: `${colors.card.bg} ${colors.card.border} ${shadows.shadows.card} hover:${shadows.shadows.cardHover}`,
    outlined: `${colors.card.bg} ${colors.card.border}`,
    filled: `${colors.card.bgFilled} ${colors.card.border} ${shadows.shadows.surface}`,
  };

  const paddingClasses = {
    compact: spacing.componentSpacing.card.compact,
    default: spacing.componentSpacing.card.default,
    spacious: spacing.componentSpacing.card.spacious,
  };

  return cn(baseClasses, variantClasses[variant], paddingClasses[padding]);
}

/**
 * Get input classes with state
 */
export function getInputClasses(hasError: boolean = false, isDisabled: boolean = false): string {
  const baseClasses =
    'w-full rounded-material border transition-all duration-material focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

  if (isDisabled) {
    return cn(
      baseClasses,
      colors.input.bgDisabled,
      colors.input.border,
      colors.input.textDisabled,
      'cursor-not-allowed',
      spacing.componentSpacing.input.default
    );
  }

  if (hasError) {
    return cn(
      baseClasses,
      colors.input.bg,
      colors.input.borderError,
      colors.input.text,
      colors.input.ringError,
      spacing.componentSpacing.input.default
    );
  }

  return cn(
    baseClasses,
    colors.input.bg,
    colors.input.border,
    colors.input.text,
    colors.input.ring,
    spacing.componentSpacing.input.default
  );
}

/**
 * Get badge classes with variant
 */
export function getBadgeClasses(
  variant: 'success' | 'error' | 'warning' | 'info' | 'default' = 'default'
): string {
  const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';

  const variantClasses = {
    success: colors.semantic.success.badge,
    error: colors.semantic.error.badge,
    warning: colors.semantic.warning.badge,
    info: colors.semantic.info.badge,
    default: 'bg-slate-100 text-slate-800',
  };

  return cn(baseClasses, variantClasses[variant]);
}

/**
 * Check if a color class is using the design system
 */
export function isDesignSystemColor(className: string): boolean {
  return /slate-\d+/.test(className);
}

/**
 * Check if a color class is legacy (gray or blue)
 */
export function isLegacyColor(className: string): boolean {
  return /(gray|blue)-\d+/.test(className) && !/slate-\d+/.test(className);
}

/**
 * Migrate legacy gray color to slate
 */
export function migrateGrayToSlate(className: string): string {
  return className.replace(/gray-(\d+)/g, 'slate-$1');
}

/**
 * Migrate legacy blue color to slate (for UI elements)
 */
export function migrateBlueToSlate(className: string): string {
  // Map blue to slate equivalents
  const blueToSlate: Record<string, string> = {
    'blue-50': 'slate-50',
    'blue-100': 'slate-100',
    'blue-200': 'slate-200',
    'blue-300': 'slate-300',
    'blue-400': 'slate-400',
    'blue-500': 'slate-500',
    'blue-600': 'slate-700', // Buttons use slate-700
    'blue-700': 'slate-800',
    'blue-800': 'slate-900',
    'blue-900': 'slate-900',
  };

  let migrated = className;
  Object.entries(blueToSlate).forEach(([blue, slate]) => {
    const regex = new RegExp(`\\b${blue}\\b`, 'g');
    migrated = migrated.replace(regex, slate);
  });

  return migrated;
}

export default {
  cn,
  getButtonClasses,
  getCardClasses,
  getInputClasses,
  getBadgeClasses,
  isDesignSystemColor,
  isLegacyColor,
  migrateGrayToSlate,
  migrateBlueToSlate,
};
