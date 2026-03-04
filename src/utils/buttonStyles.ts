/**
 * Centralized Button Styles
 *
 * Provides consistent button styles across the application
 * including hover and disabled states
 */

export const buttonStyles = {
  // Primary button (main actions)
  primary: {
    base: 'px-4 py-2 text-sm font-medium text-white bg-[#7DA8CC] rounded-md',
    hover: 'hover:bg-[#6890b3]',
    focus: 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7DA8CC]',
    disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
    transition: 'transition-colors duration-200',
    full: 'px-4 py-2 text-sm font-medium text-white bg-[#7DA8CC] rounded-md hover:bg-[#6890b3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7DA8CC] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200',
  },

  // Secondary button (less important actions)
  secondary: {
    base: 'px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md',
    hover: 'hover:bg-gray-50',
    focus: 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7DA8CC]',
    disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
    transition: 'transition-colors duration-200',
    full: 'px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7DA8CC] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200',
  },

  // Success button (positive actions)
  success: {
    base: 'px-4 py-2 text-sm font-medium text-white bg-[#A1BA53] rounded-md',
    hover: 'hover:bg-[#8a9f47]',
    focus: 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#A1BA53]',
    disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
    transition: 'transition-colors duration-200',
    full: 'px-4 py-2 text-sm font-medium text-white bg-[#A1BA53] rounded-md hover:bg-[#8a9f47] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#A1BA53] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200',
  },

  // Danger button (destructive actions)
  danger: {
    base: 'px-4 py-2 text-sm font-medium text-white bg-[#DA5062] rounded-md',
    hover: 'hover:bg-[#c23d4f]',
    focus: 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#DA5062]',
    disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
    transition: 'transition-colors duration-200',
    full: 'px-4 py-2 text-sm font-medium text-white bg-[#DA5062] rounded-md hover:bg-[#c23d4f] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#DA5062] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200',
  },

  // Warning button
  warning: {
    base: 'px-4 py-2 text-sm font-medium text-white bg-[#DA5062] rounded-md',
    hover: 'hover:bg-[#c23d4f]',
    focus: 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#DA5062]',
    disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
    transition: 'transition-colors duration-200',
    full: 'px-4 py-2 text-sm font-medium text-white bg-[#DA5062] rounded-md hover:bg-[#c23d4f] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#DA5062] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200',
  },
};

/**
 * Get button classes by variant
 */
export const getButtonClasses = (
  variant: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' = 'primary'
): string => {
  return buttonStyles[variant].full;
};
