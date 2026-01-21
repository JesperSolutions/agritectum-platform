/**
 * Centralized Button Styles
 *
 * Provides consistent button styles across the application
 * including hover and disabled states
 */

export const buttonStyles = {
  // Primary button (main actions)
  primary: {
    base: 'px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md',
    hover: 'hover:bg-blue-700',
    focus: 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
    disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
    transition: 'transition-colors duration-200',
    full: 'px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200',
  },

  // Secondary button (less important actions)
  secondary: {
    base: 'px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md',
    hover: 'hover:bg-gray-50',
    focus: 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
    disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
    transition: 'transition-colors duration-200',
    full: 'px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200',
  },

  // Success button (positive actions)
  success: {
    base: 'px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md',
    hover: 'hover:bg-green-700',
    focus: 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500',
    disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
    transition: 'transition-colors duration-200',
    full: 'px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200',
  },

  // Danger button (destructive actions)
  danger: {
    base: 'px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md',
    hover: 'hover:bg-red-700',
    focus: 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500',
    disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
    transition: 'transition-colors duration-200',
    full: 'px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200',
  },

  // Warning button
  warning: {
    base: 'px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md',
    hover: 'hover:bg-yellow-700',
    focus: 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500',
    disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
    transition: 'transition-colors duration-200',
    full: 'px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200',
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
