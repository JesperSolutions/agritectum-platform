/**
 * Border Tokens - Material Design System
 *
 * Standardized border radius and border width values.
 * Material Design uses 4dp (4px) as the standard border radius.
 */

// Border Radius (Material Design 4dp standard)
export const borderRadius = {
  // Material Design standard (4px)
  material: 'rounded-material', // 4px - for all interactive elements
  // Small radius (2px) - rarely used
  sm: 'rounded-sm', // 2px
  // Medium radius (6px) - legacy, migrating to material
  md: 'rounded-md', // 6px - legacy
  // Large radius (8px) - for cards
  lg: 'rounded-lg', // 8px - legacy, migrating to material
  // Extra large (12px) - legacy
  xl: 'rounded-xl', // 12px - legacy, migrating to material
  // Full circle (for badges, avatars)
  full: 'rounded-full', // 50% - for circular elements
  // None
  none: 'rounded-none',
};

// Border Width
export const borderWidth = {
  none: 'border-0',
  thin: 'border', // 1px
  medium: 'border-2', // 2px
  thick: 'border-4', // 4px
};

// Border Style
export const borderStyle = {
  solid: 'border-solid',
  dashed: 'border-dashed',
  dotted: 'border-dotted',
  none: 'border-none',
};

// Component-Specific Border Radius
export const componentRadius = {
  // Interactive elements (buttons, inputs, etc.)
  interactive: borderRadius.material, // 4px
  // Cards
  card: borderRadius.material, // 4px
  // Badges (pills)
  badge: borderRadius.full, // 50%
  // Badges (chips)
  chip: borderRadius.material, // 4px
  // Modals/Dialogs
  modal: borderRadius.material, // 4px
  // Tooltips
  tooltip: borderRadius.material, // 4px
};

// Export unified border tokens
export const borderTokens = {
  borderRadius,
  borderWidth,
  borderStyle,
  componentRadius,
};

// Named exports for direct access
export { borderRadius, borderWidth, borderStyle, componentRadius };

export default borderTokens;
