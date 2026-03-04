/**
 * Color Tokens - Material Design System
 *
 * AG Brand Colors: Green (#A1BA53), Red (#DA5062), Blue (#7DA8CC), Purple (#956098)
 * Unified slate color palette for consistent UI styling.
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
  error: 'border-[#DA5062]',
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

// Semantic Colors (Status Indicators - using AG Brand Colors)
export const semantic = {
  success: {
    bg: 'bg-[#A1BA53]/15',
    bgHover: 'bg-[#A1BA53]/25',
    text: 'text-[#5c6a2f]',
    border: 'border-[#A1BA53]/30',
    badge: 'bg-[#A1BA53]/15 text-[#5c6a2f]',
    button: 'bg-[#A1BA53] hover:bg-[#8a9f47] text-white',
  },
  error: {
    bg: 'bg-[#DA5062]/15',
    bgHover: 'bg-[#DA5062]/25',
    text: 'text-[#872a38]',
    border: 'border-[#DA5062]/30',
    badge: 'bg-[#DA5062]/15 text-[#872a38]',
    button: 'bg-[#DA5062] hover:bg-[#c23d4f] text-white',
  },
  warning: {
    bg: 'bg-[#DA5062]/10',
    bgHover: 'bg-[#DA5062]/20',
    text: 'text-[#872a38]',
    border: 'border-[#DA5062]/20',
    badge: 'bg-[#DA5062]/10 text-[#872a38]',
    button: 'bg-[#DA5062] hover:bg-[#c23d4f] text-white',
  },
  info: {
    bg: 'bg-[#7DA8CC]/15',
    bgHover: 'bg-[#7DA8CC]/25',
    text: 'text-[#476279]',
    border: 'border-[#7DA8CC]/30',
    badge: 'bg-[#7DA8CC]/15 text-[#476279]',
    button: 'bg-[#7DA8CC] hover:bg-[#6890b3] text-white',
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
    bg: 'bg-[#DA5062]',
    bgHover: 'hover:bg-[#c23d4f]',
    bgActive: 'active:bg-[#872a38]',
    text: 'text-white',
    focus: 'focus-visible:ring-[#DA5062]',
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
  borderError: 'border-[#DA5062]',
  text: 'text-slate-900',
  textPlaceholder: 'text-slate-400',
  textDisabled: 'text-slate-500',
  ring: 'focus-visible:ring-slate-500',
  ringError: 'focus-visible:ring-[#DA5062]',
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
