/**
 * Color Tokens - Material Design System
 *
 * Unified slate color palette for consistent UI styling.
 * Brand colors (orange, blue, yellow) are reserved for marketing pages only.
 */

// Slate Color Palette (Primary UI Colors)
export const slate = {
  50: 'slate-50',
  100: 'slate-100',
  200: 'slate-200',
  300: 'slate-300',
  400: 'slate-400',
  500: 'slate-500',
  600: 'slate-600',
  700: 'slate-700',
  800: 'slate-800',
  900: 'slate-900',
};

// UI Background Colors
export const backgrounds = {
  page: 'bg-gradient-to-br from-slate-50 to-slate-100',
  card: 'bg-white',
  cardElevated: 'bg-white',
  cardFilled: 'bg-slate-50',
  nested: 'bg-slate-100',
  overlay: 'bg-black/50',
  backdrop: 'bg-black/50',
};

// UI Border Colors
export const borders = {
  default: 'border-slate-200',
  input: 'border-slate-300',
  focus: 'border-slate-500',
  error: 'border-red-500',
  card: 'border-slate-200',
  divider: 'border-slate-200',
};

// UI Text Colors
export const text = {
  primary: 'text-slate-900',
  secondary: 'text-slate-600',
  tertiary: 'text-slate-500',
  muted: 'text-slate-400',
  disabled: 'text-slate-400',
  inverse: 'text-white',
  onPrimary: 'text-white',
  onSecondary: 'text-white',
};

// Semantic Colors (Status Indicators)
export const semantic = {
  success: {
    bg: 'bg-green-100',
    bgHover: 'bg-green-200',
    text: 'text-green-800',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-800',
    button: 'bg-green-600 hover:bg-green-700 text-white',
  },
  error: {
    bg: 'bg-red-100',
    bgHover: 'bg-red-200',
    text: 'text-red-800',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-800',
    button: 'bg-red-600 hover:bg-red-700 text-white',
  },
  warning: {
    bg: 'bg-yellow-100',
    bgHover: 'bg-yellow-200',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-800',
    button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
  },
  info: {
    bg: 'bg-blue-100',
    bgHover: 'bg-blue-200',
    text: 'text-blue-800',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-800',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
};

// Button Colors (Material Design with Slate)
export const button = {
  primary: {
    bg: 'bg-slate-700',
    bgHover: 'hover:bg-slate-800',
    bgActive: 'active:bg-slate-900',
    text: 'text-white',
    focus: 'focus-visible:ring-slate-500',
  },
  secondary: {
    bg: 'bg-white',
    bgHover: 'hover:bg-slate-50',
    bgActive: 'active:bg-slate-100',
    text: 'text-slate-700',
    border: 'border border-slate-200',
    focus: 'focus-visible:ring-slate-500',
  },
  danger: {
    bg: 'bg-red-600',
    bgHover: 'hover:bg-red-700',
    bgActive: 'active:bg-red-800',
    text: 'text-white',
    focus: 'focus-visible:ring-red-500',
  },
  ghost: {
    bg: 'bg-transparent',
    bgHover: 'hover:bg-slate-100',
    bgActive: 'active:bg-slate-200',
    text: 'text-slate-700',
    focus: 'focus-visible:ring-slate-500',
  },
  link: {
    bg: 'bg-transparent',
    bgHover: 'hover:bg-transparent',
    text: 'text-slate-700',
    textHover: 'hover:text-slate-900',
    underline: 'underline',
    focus: 'focus-visible:ring-slate-500',
  },
};

// Input Colors
export const input = {
  bg: 'bg-white',
  bgFocus: 'focus-visible:bg-white',
  bgDisabled: 'bg-slate-100',
  border: 'border-slate-300',
  borderFocus: 'focus-visible:border-slate-500',
  borderError: 'border-red-500',
  text: 'text-slate-900',
  textPlaceholder: 'text-slate-400',
  textDisabled: 'text-slate-500',
  ring: 'focus-visible:ring-slate-500',
  ringError: 'focus-visible:ring-red-500',
};

// Card Colors
export const card = {
  bg: 'bg-white',
  bgFilled: 'bg-slate-50',
  border: 'border-slate-200',
  text: 'text-slate-900',
  textSecondary: 'text-slate-600',
};

// Export unified color tokens
export const colors = {
  slate,
  backgrounds,
  borders,
  text,
  semantic,
  button,
  input,
  card,
};

export default colors;
