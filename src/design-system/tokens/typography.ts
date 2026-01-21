/**
 * Typography Tokens - Material Design System
 *
 * Roboto font family with standardized typography scale.
 * Based on Material Design 3 typography system.
 */

// Font Family
export const fontFamily = {
  sans: ['Roboto', 'system-ui', '-apple-system', 'sans-serif'],
  mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'monospace'],
};

// Font Weights (Material Design)
export const fontWeight = {
  light: 'font-light', // 300
  regular: 'font-normal', // 400
  medium: 'font-medium', // 500
  semibold: 'font-semibold', // 600
  bold: 'font-bold', // 700
};

// Typography Scale (Material Design 3)
export const typography = {
  // Display - Large headings (48px)
  display: {
    large: 'text-5xl font-light text-slate-900', // 48px, weight 300
    medium: 'text-4xl font-light text-slate-900', // 36px, weight 300
    small: 'text-3xl font-light text-slate-900', // 32px, weight 300
  },

  // Headline - Section headings (32px, 28px, 24px)
  headline: {
    large: 'text-3xl font-normal text-slate-900', // 32px, weight 400
    medium: 'text-2xl font-normal text-slate-900', // 28px, weight 400
    small: 'text-xl font-normal text-slate-900', // 24px, weight 400
  },

  // Title - Card titles, list items (20px, 16px, 14px)
  title: {
    large: 'text-xl font-medium text-slate-900', // 20px, weight 500
    medium: 'text-base font-medium text-slate-900', // 16px, weight 500
    small: 'text-sm font-medium text-slate-900', // 14px, weight 500
  },

  // Body - Main content (16px, 14px)
  body: {
    large: 'text-base font-normal text-slate-900', // 16px, weight 400
    medium: 'text-sm font-normal text-slate-900', // 14px, weight 400
    small: 'text-xs font-normal text-slate-900', // 12px, weight 400
  },

  // Label - Form labels, buttons (14px, 12px, 11px)
  label: {
    large: 'text-sm font-medium text-slate-700', // 14px, weight 500
    medium: 'text-xs font-medium text-slate-700', // 12px, weight 500
    small: 'text-[11px] font-medium text-slate-700', // 11px, weight 500
  },
};

// Line Heights
export const lineHeight = {
  tight: 'leading-tight', // 1.25
  normal: 'leading-normal', // 1.5
  relaxed: 'leading-relaxed', // 1.75
};

// Letter Spacing
export const letterSpacing = {
  tighter: 'tracking-tighter', // -0.05em
  tight: 'tracking-tight', // -0.025em
  normal: 'tracking-normal', // 0
  wide: 'tracking-wide', // 0.025em
  wider: 'tracking-wider', // 0.05em
  widest: 'tracking-widest', // 0.1em (for uppercase buttons)
};

// Text Alignment
export const textAlign = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify',
};

// Text Transform
export const textTransform = {
  uppercase: 'uppercase',
  lowercase: 'lowercase',
  capitalize: 'capitalize',
  normal: 'normal-case',
};

// Form Label Styles
export const label = {
  default: 'block text-sm font-medium text-slate-700 mb-2',
  required:
    'block text-sm font-medium text-slate-700 mb-2 after:content-["*"] after:ml-0.5 after:text-red-500',
  error: 'block text-sm font-medium text-red-700 mb-2',
};

// Export unified typography tokens
export const typographyTokens = {
  fontFamily,
  fontWeight,
  typography,
  lineHeight,
  letterSpacing,
  textAlign,
  textTransform,
  label,
};

export default typographyTokens;
