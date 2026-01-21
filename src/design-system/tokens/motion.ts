/**
 * Motion Tokens - Material Design System
 *
 * Standardized transition timing, duration, and easing functions.
 * Material Design uses 250ms as the standard transition duration.
 */

// Transition Duration (Material Design standard: 250ms)
export const duration = {
  // Instant (0ms)
  instant: 'duration-0',
  // Fast (150ms)
  fast: 'duration-150',
  // Material Design standard (250ms)
  material: 'duration-material', // 250ms
  // Default (200ms)
  default: 'duration-200',
  // Slow (300ms)
  slow: 'duration-300',
  // Slower (500ms)
  slower: 'duration-500',
};

// Easing Functions
export const easing = {
  // Material Design standard easing
  standard: 'ease-in-out',
  // Decelerate (ease-out)
  decelerate: 'ease-out',
  // Accelerate (ease-in)
  accelerate: 'ease-in',
  // Sharp (ease-in-out with sharper curve)
  sharp: 'ease-in-out',
};

// Transition Properties
export const transition = {
  // Color transitions (most common)
  colors: 'transition-colors duration-material',
  // All properties
  all: 'transition-all duration-material',
  // Opacity
  opacity: 'transition-opacity duration-material',
  // Transform
  transform: 'transition-transform duration-material',
  // Shadow
  shadow: 'transition-shadow duration-material',
  // Background
  background: 'transition-background-color duration-material',
  // Border
  border: 'transition-border-color duration-material',
};

// Animation Timing
export const animation = {
  // Fade in
  fadeIn: 'animate-fade-in',
  // Fade out
  fadeOut: 'animate-fade-out',
  // Slide up
  slideUp: 'animate-slide-up',
  // Slide down
  slideDown: 'animate-slide-down',
  // Scale
  scale: 'animate-scale',
};

// Component-Specific Transitions
export const componentTransitions = {
  // Button transitions
  button: 'transition-all duration-material',
  // Card transitions
  card: 'transition-shadow duration-material',
  // Input transitions
  input: 'transition-all duration-material',
  // Modal/Dialog transitions
  modal: 'transition-all duration-material',
  // Dropdown transitions
  dropdown: 'transition-all duration-material',
};

// Export unified motion tokens
export const motionTokens = {
  duration,
  easing,
  transition,
  animation,
  componentTransitions,
};

export default motionTokens;
