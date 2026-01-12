/**
 * Shadow Tokens - Material Design Elevation System
 * 
 * Material Design 3 elevation system with 6 levels.
 * Semantic naming for better understanding and usage.
 */

// Material Design Elevation Levels
export const elevation = {
  // Level 1: Subtle elevation (cards, buttons at rest)
  level1: 'shadow-material-1',
  // Level 2: Default card elevation
  level2: 'shadow-material-2',
  // Level 3: Hover state, raised cards
  level3: 'shadow-material-3',
  // Level 4: Dropdowns, popovers
  level4: 'shadow-material-4',
  // Level 5: Modals, dialogs
  level5: 'shadow-material-5',
  // Level 6: Highest elevation (tooltips, notifications)
  level6: 'shadow-material-6',
};

// Semantic Shadow Names
export const shadows = {
  // Surface shadows
  surface: elevation.level1,
  surfaceHover: elevation.level2,
  
  // Card shadows
  card: elevation.level2,
  cardHover: elevation.level3,
  cardRaised: elevation.level3,
  
  // Button shadows
  button: elevation.level2,
  buttonHover: elevation.level3,
  buttonPressed: elevation.level1,
  
  // Input shadows
  input: elevation.level1,
  inputFocus: elevation.level2,
  
  // Dropdown/Popover shadows
  dropdown: elevation.level4,
  popover: elevation.level4,
  
  // Modal/Dialog shadows
  modal: elevation.level5,
  dialog: elevation.level5,
  
  // Tooltip/Notification shadows
  tooltip: elevation.level6,
  notification: elevation.level6,
  
  // No shadow
  none: 'shadow-none',
};

// Hover Shadow Transitions
export const shadowTransitions = {
  card: 'transition-shadow duration-material',
  button: 'transition-shadow duration-material',
  input: 'transition-shadow duration-material',
};

// Export unified shadow tokens
export const shadowTokens = {
  elevation,
  shadows,
  shadowTransitions,
};

export default shadowTokens;
