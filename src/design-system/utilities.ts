/**
 * Design System Utilities
 * 
 * Utility functions for working with design tokens and consistent styling.
 */

import { colors, statusBadge, card, formInput } from './tokens';

/**
 * Get status badge classes based on status value
 */
export function getStatusBadgeClass(status: string): string {
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes('success') || statusLower.includes('completed') || statusLower.includes('active')) {
    return statusBadge.success;
  }
  if (statusLower.includes('error') || statusLower.includes('failed') || statusLower.includes('critical')) {
    return statusBadge.error;
  }
  if (statusLower.includes('warning') || statusLower.includes('pending') || statusLower.includes('draft')) {
    return statusBadge.warning;
  }
  if (statusLower.includes('info') || statusLower.includes('sent') || statusLower.includes('shared')) {
    return statusBadge.info;
  }
  if (statusLower.includes('purple') || statusLower.includes('offer')) {
    return statusBadge.purple;
  }
  
  // Default to info
  return statusBadge.info;
}

/**
 * Get semantic color classes based on type
 */
export function getSemanticColorClass(type: 'success' | 'error' | 'warning' | 'info'): {
  bg: string;
  text: string;
  border: string;
} {
  return colors.semantic[type];
}

/**
 * Get button classes with optional size variant
 */
export function getButtonClass(
  variant: 'primary' | 'secondary' | 'danger' | 'ghost' = 'primary',
  size: 'sm' | 'md' | 'lg' = 'md'
): string {
  const baseClasses = {
    primary: colors.button.primary.className,
    secondary: colors.button.secondary.className,
    danger: colors.button.danger.className,
    ghost: colors.button.ghost.className,
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  // Replace size in base class with size variant
  const baseClass = baseClasses[variant];
  const sizeClass = sizeClasses[size];
  
  // Remove existing size classes and add new ones
  return baseClass
    .replace(/px-\d+ py-\d+ text-(xs|sm|base)/, '')
    .trim() + ' ' + sizeClass;
}

/**
 * Get form input classes with error state
 */
export function getFormInputClass(hasError: boolean = false, isDisabled: boolean = false): string {
  if (isDisabled) {
    return formInput.disabled;
  }
  if (hasError) {
    return formInput.error;
  }
  return formInput.base;
}

/**
 * Get card classes with optional padding variant
 */
export function getCardClass(padding: 'main' | 'inner' | 'compact' = 'main'): string {
  return card[padding];
}

/**
 * Combine class names (similar to clsx or classnames)
 */
export function combineClasses(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Check if a color class is using the design system
 */
export function isDesignSystemColor(className: string): boolean {
  // Check if it uses slate colors (design system)
  return /slate-\d+/.test(className);
}

/**
 * Check if a color class is legacy (gray)
 */
export function isLegacyColor(className: string): boolean {
  // Check if it uses gray colors (legacy)
  return /gray-\d+/.test(className) && !/slate-\d+/.test(className);
}

/**
 * Migrate legacy gray color to slate
 */
export function migrateGrayToSlate(className: string): string {
  return className.replace(/gray-(\d+)/g, 'slate-$1');
}

/**
 * Get focus ring classes
 */
export function getFocusRingClass(color: 'slate' | 'red' | 'blue' = 'slate'): string {
  const colors = {
    slate: 'focus:ring-2 focus:ring-slate-500 focus:border-slate-500',
    red: 'focus:ring-2 focus:ring-red-500 focus:border-red-500',
    blue: 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
  };
  return colors[color];
}

export default {
  getStatusBadgeClass,
  getSemanticColorClass,
  getButtonClass,
  getFormInputClass,
  getCardClass,
  combineClasses,
  isDesignSystemColor,
  isLegacyColor,
  migrateGrayToSlate,
  getFocusRingClass,
};
