/**
 * Design System Tokens
 *
 * Centralized design tokens for consistent styling across the application.
 * These tokens define colors, spacing, typography, and other design constants.
 */

// Color Tokens
export const colors = {
  // UI Colors (Slate - Primary)
  ui: {
    background: {
      page: 'bg-gradient-to-br from-slate-50 to-slate-100',
      card: 'bg-white',
      inner: 'bg-slate-50',
      nested: 'bg-slate-100',
    },
    border: {
      card: 'border border-slate-200',
      input: 'border border-slate-300',
      focus: 'border-slate-500',
    },
    text: {
      primary: 'text-slate-900',
      secondary: 'text-slate-600',
      tertiary: 'text-slate-500',
      muted: 'text-slate-400',
    },
  },

  // Semantic Colors (Status Indicators)
  semantic: {
    success: {
      bg: 'bg-[#A1BA53]/15',
      text: 'text-[#5c6a2f]',
      border: 'border-[#A1BA53]/30',
      badge: 'bg-[#A1BA53]/15 text-[#5c6a2f]',
    },
    error: {
      bg: 'bg-[#DA5062]/15',
      text: 'text-[#872a38]',
      border: 'border-[#DA5062]/30',
      badge: 'bg-[#DA5062]/15 text-[#872a38]',
    },
    warning: {
      bg: 'bg-[#DA5062]/15',
      text: 'text-[#872a38]',
      border: 'border-[#DA5062]/25',
      badge: 'bg-[#DA5062]/15 text-[#872a38]',
    },
    info: {
      bg: 'bg-[#7DA8CC]/15',
      text: 'text-[#476279]',
      border: 'border-[#7DA8CC]/30',
      badge: 'bg-[#7DA8CC]/15 text-[#476279]',
    },
  },

  // Button Colors
  button: {
    primary: {
      bg: 'bg-slate-700',
      text: 'text-white',
      hover: 'hover:bg-slate-800',
      className:
        'px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm',
    },
    secondary: {
      bg: 'bg-white',
      text: 'text-slate-700',
      border: 'border border-slate-200',
      hover: 'hover:bg-slate-50',
      className:
        'px-4 py-2 border border-slate-200 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50',
    },
    danger: {
      bg: 'bg-[#DA5062]',
      text: 'text-white',
      hover: 'hover:bg-[#c23d4f]',
      className:
        'px-4 py-2 bg-[#DA5062] text-white rounded-lg hover:bg-[#c23d4f] transition-colors text-sm font-medium shadow-sm',
    },
    ghost: {
      text: 'text-slate-700',
      hover: 'hover:bg-slate-100',
      className:
        'px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-sm font-medium',
    },
  },
};

// Spacing Tokens
export const spacing = {
  card: {
    padding: {
      main: 'p-6',
      inner: 'p-4',
      compact: 'p-3',
    },
  },
  button: {
    padding: {
      default: 'px-4 py-2',
      small: 'px-3 py-1.5',
      large: 'px-6 py-3',
    },
  },
  input: {
    padding: 'px-3 py-2',
  },
};

// Border Radius Tokens
export const borderRadius = {
  button: 'rounded-lg',
  input: 'rounded-lg',
  card: 'rounded-xl',
  badge: 'rounded-full',
  material: 'rounded-material', // Material Design specific
};

// Shadow Tokens
export const shadows = {
  card: 'shadow-sm',
  cardHover: 'hover:shadow-md',
  button: 'shadow-sm',
  modal: 'shadow-lg',
  material: {
    sm: 'shadow-material-1',
    md: 'shadow-material-2',
    lg: 'shadow-material-3',
  },
};

// Form Input Tokens
export const formInput = {
  base: 'w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 shadow-sm',
  error:
    'w-full border border-[#DA5062]/40 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#DA5062] focus:border-[#DA5062] shadow-sm',
  disabled:
    'w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-100 text-slate-500 cursor-not-allowed',
};

// Card Tokens
export const card = {
  main: 'bg-white rounded-xl shadow-sm border border-slate-200 p-6',
  inner: 'bg-slate-50 border border-slate-200 rounded-xl p-4',
  compact: 'bg-white rounded-xl shadow-sm border border-slate-200 p-3',
};

// Status Badge Tokens
export const statusBadge = {
  success: 'px-2 py-0.5 text-xs bg-[#A1BA53]/15 text-[#5c6a2f] rounded-full',
  error: 'px-2 py-0.5 text-xs bg-[#DA5062]/15 text-[#872a38] rounded-full',
  warning: 'px-2 py-0.5 text-xs bg-[#DA5062]/15 text-[#872a38] rounded-full',
  info: 'px-2 py-0.5 text-xs bg-[#7DA8CC]/15 text-[#476279] rounded-full',
  purple: 'px-2 py-0.5 text-xs bg-[#956098]/15 text-[#553657] rounded-full',
};

// Table Tokens
export const table = {
  header: 'bg-slate-50',
  headerCell: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
  row: 'hover:bg-slate-50',
  cell: 'px-6 py-4 whitespace-nowrap text-sm text-slate-900',
};

// Typography Tokens
export const typography = {
  heading: {
    h1: 'text-3xl font-bold text-slate-900',
    h2: 'text-2xl font-bold text-slate-900',
    h3: 'text-xl font-semibold text-slate-900',
    h4: 'text-lg font-semibold text-slate-900',
  },
  body: {
    primary: 'text-base text-slate-900',
    secondary: 'text-sm text-slate-600',
    tertiary: 'text-xs text-slate-500',
  },
  label: {
    default: 'block text-sm font-medium text-slate-700 mb-2',
    required:
      'block text-sm font-medium text-slate-700 mb-2 after:content-["*"] after:ml-0.5 after:text-[#DA5062]',
  },
};

// Transition Tokens
export const transitions = {
  default: 'transition-colors',
  all: 'transition-all',
  duration: {
    fast: 'duration-150',
    default: 'duration-200',
    slow: 'duration-300',
  },
};

// Export combined token object
export const designTokens = {
  colors,
  spacing,
  borderRadius,
  shadows,
  formInput,
  card,
  statusBadge,
  table,
  typography,
  transitions,
};

export default designTokens;
