/**
 * Responsive Utilities
 * 
 * Breakpoint system and responsive helper functions.
 * Material Design responsive breakpoints.
 */

// Breakpoint System (Material Design)
export const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px', // Extra large desktop
};

// Container Max Widths
export const containerMaxWidth = {
  sm: 'max-w-sm',     // 384px
  md: 'max-w-md',     // 448px
  lg: 'max-w-lg',     // 512px
  xl: 'max-w-xl',     // 576px
  '2xl': 'max-w-2xl', // 672px
  '3xl': 'max-w-3xl', // 768px
  '4xl': 'max-w-4xl', // 896px
  '5xl': 'max-w-5xl', // 1024px
  '6xl': 'max-w-6xl', // 1152px
  '7xl': 'max-w-7xl', // 1280px
  full: 'max-w-full',
};

// Responsive Grid Columns
export const gridColumns = {
  mobile: 'grid-cols-1',
  tablet: 'md:grid-cols-2',
  desktop: 'lg:grid-cols-3',
  wide: 'xl:grid-cols-4',
};

// Responsive Typography Scale
export const responsiveTypography = {
  // Display
  display: {
    mobile: 'text-3xl',    // 30px on mobile
    tablet: 'md:text-4xl', // 36px on tablet
    desktop: 'lg:text-5xl', // 48px on desktop
  },
  // Headline
  headline: {
    mobile: 'text-2xl',    // 24px on mobile
    tablet: 'md:text-3xl', // 32px on tablet
    desktop: 'lg:text-4xl', // 36px on desktop
  },
  // Title
  title: {
    mobile: 'text-lg',     // 18px on mobile
    tablet: 'md:text-xl',  // 20px on tablet
    desktop: 'lg:text-2xl', // 24px on desktop
  },
  // Body
  body: {
    mobile: 'text-sm',     // 14px on mobile
    tablet: 'md:text-base', // 16px on tablet
    desktop: 'lg:text-lg',  // 18px on desktop
  },
};

// Responsive Spacing
export const responsiveSpacing = {
  // Padding
  padding: {
    mobile: 'p-4',        // 16px on mobile
    tablet: 'md:p-6',     // 24px on tablet
    desktop: 'lg:p-8',    // 32px on desktop
  },
  // Margin
  margin: {
    mobile: 'm-4',        // 16px on mobile
    tablet: 'md:m-6',    // 24px on tablet
    desktop: 'lg:m-8',   // 32px on desktop
  },
  // Gap
  gap: {
    mobile: 'gap-4',     // 16px on mobile
    tablet: 'md:gap-6',  // 24px on tablet
    desktop: 'lg:gap-8', // 32px on desktop
  },
};

// Hide/Show Utilities
export const visibility = {
  hideMobile: 'hidden md:block',
  hideTablet: 'block md:hidden lg:block',
  hideDesktop: 'block lg:hidden',
  showMobile: 'block md:hidden',
  showTablet: 'hidden md:block lg:hidden',
  showDesktop: 'hidden lg:block',
};

export default {
  breakpoints,
  containerMaxWidth,
  gridColumns,
  responsiveTypography,
  responsiveSpacing,
  visibility,
};
