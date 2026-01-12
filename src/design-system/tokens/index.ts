/**
 * Design Tokens Index
 * 
 * Centralized export for all design system tokens.
 * This is the single source of truth for design values.
 */

export { default as colors } from './colors';
export { default as typography } from './typography';
export { default as spacing } from './spacing';
export { default as shadows } from './shadows';
export { default as borders } from './borders';
export { default as motion } from './motion';

// Re-export all tokens as a unified object
import colors from './colors';
import typography from './typography';
import spacing from './spacing';
import shadows from './shadows';
import borders from './borders';
import motion from './motion';

export const designTokens = {
  colors,
  typography,
  spacing,
  shadows,
  borders,
  motion,
};

export default designTokens;
