/**
 * Design System Utilities Index
 * 
 * Centralized export for all design system utility functions.
 */

export { default as accessibility } from './accessibility';
export { default as responsive } from './responsive';
export { default as theme } from './theme';

// Re-export commonly used functions
export {
  getFocusRing,
  getFormFieldAttributes,
  generateFieldId,
  getErrorId,
  getHelpId,
} from './accessibility';

export {
  cn,
  getButtonClasses,
  getCardClasses,
  getInputClasses,
  getBadgeClasses,
  isDesignSystemColor,
  isLegacyColor,
  migrateGrayToSlate,
  migrateBlueToSlate,
} from './theme';
