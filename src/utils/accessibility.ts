// Accessibility utilities for better screen reader support and keyboard navigation

// ARIA labels and descriptions
export const ariaLabels = {
  // Navigation
  mainNavigation: 'Main navigation',
  userMenu: 'User menu',
  breadcrumb: 'Breadcrumb navigation',

  // Forms
  form: 'Form',
  requiredField: 'Required field',
  optionalField: 'Optional field',
  fieldError: 'Field error',
  fieldHelp: 'Field help text',

  // Buttons
  saveButton: 'Save changes',
  cancelButton: 'Cancel changes',
  deleteButton: 'Delete item',
  editButton: 'Edit item',
  viewButton: 'View item',
  addButton: 'Add new item',
  removeButton: 'Remove item',
  closeButton: 'Close dialog',
  submitButton: 'Submit form',

  // Tables
  dataTable: 'Data table',
  sortableColumn: 'Sortable column',
  sortAscending: 'Sort ascending',
  sortDescending: 'Sort descending',

  // Modals and dialogs
  modal: 'Modal dialog',
  dialog: 'Dialog',
  alertDialog: 'Alert dialog',
  confirmDialog: 'Confirmation dialog',

  // Status indicators
  loading: 'Loading content',
  error: 'Error occurred',
  success: 'Success',
  warning: 'Warning',

  // Reports
  reportCard: 'Inspection report',
  reportStatus: 'Report status',
  reportDate: 'Report date',
  customerInfo: 'Customer information',
  inspectorInfo: 'Inspector information',

  // Images
  reportImage: 'Report image',
  issueImage: 'Issue image',
  branchLogo: 'Branch logo',

  // Filters and search
  searchInput: 'Search reports',
  filterButton: 'Filter options',
  clearFilters: 'Clear all filters',

  // Pagination
  pagination: 'Pagination',
  previousPage: 'Previous page',
  nextPage: 'Next page',
  pageNumber: 'Page number',
};

// ARIA descriptions
export const ariaDescriptions = {
  formValidation: 'Form validation errors will be announced when they occur',
  autoSave: 'Form will be automatically saved as you type',
  imageUpload: 'Upload images by clicking or dragging files to this area',
  reportStatus: 'Current status of the inspection report',
  branchAccess: 'You can only access reports from your assigned branch',
  offlineMode: 'You are currently offline. Changes will sync when connection is restored',
};

// Keyboard navigation helpers
export const keyboardNavigation = {
  // Common key codes
  keys: {
    ENTER: 'Enter',
    ESCAPE: 'Escape',
    SPACE: ' ',
    TAB: 'Tab',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    HOME: 'Home',
    END: 'End',
    PAGE_UP: 'PageUp',
    PAGE_DOWN: 'PageDown',
  },

  // Focus management
  focus: {
    trap: (element: HTMLElement) => {
      const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      return {
        firstElement,
        lastElement,
        handleTabKey: (e: KeyboardEvent) => {
          if (e.key === 'Tab') {
            if (e.shiftKey) {
              if (document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
              }
            } else {
              if (document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
              }
            }
          }
        },
      };
    },

    restore: (element: HTMLElement | null) => {
      if (element) {
        element.focus();
      }
    },
  },
};

// Screen reader announcements
export const screenReaderAnnouncements = {
  // Create a live region for announcements
  createLiveRegion: () => {
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
    return liveRegion;
  },

  // Announce message to screen readers
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const liveRegion = document.querySelector('[aria-live]') as HTMLElement;
    if (liveRegion) {
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.textContent = message;

      // Clear after announcement
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  },

  // Common announcements
  announcements: {
    formSaved: 'Form saved successfully',
    formError: 'Form has validation errors',
    itemAdded: 'Item added successfully',
    itemRemoved: 'Item removed successfully',
    itemUpdated: 'Item updated successfully',
    loadingStarted: 'Loading content',
    loadingCompleted: 'Content loaded',
    errorOccurred: 'An error occurred',
    offlineMode: 'You are now offline',
    onlineMode: 'You are now online',
  },
};

// Color contrast utilities
export const colorContrast = {
  // Check if color meets WCAG AA standards
  meetsWCAGAA: (foreground: string, background: string): boolean => {
    // This is a simplified check - in production, use a proper color contrast library
    const fgLuminance = getLuminance(foreground);
    const bgLuminance = getLuminance(background);
    const contrast =
      (Math.max(fgLuminance, bgLuminance) + 0.05) / (Math.min(fgLuminance, bgLuminance) + 0.05);
    return contrast >= 4.5; // WCAG AA standard
  },

  // Get relative luminance of a color
  getLuminance: (color: string): number => {
    const rgb = hexToRgb(color);
    if (!rgb) return 0;

    const { r, g, b } = rgb;
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },
};

// Helper function to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// Helper function to get luminance
function getLuminance(color: string): number {
  return colorContrast.getLuminance(color);
}

// Form accessibility helpers
export const formAccessibility = {
  // Generate unique IDs for form elements
  generateId: (prefix: string): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Create field error ID
  getErrorId: (fieldId: string): string => {
    return `${fieldId}-error`;
  },

  // Create field help ID
  getHelpId: (fieldId: string): string => {
    return `${fieldId}-help`;
  },

  // Create field description ID
  getDescriptionId: (fieldId: string): string => {
    return `${fieldId}-description`;
  },

  // Get ARIA attributes for form fields
  getFieldAttributes: (fieldId: string, hasError: boolean, hasHelp: boolean) => {
    const attributes: Record<string, string> = {
      id: fieldId,
      'aria-invalid': hasError ? 'true' : 'false',
    };

    if (hasError) {
      attributes['aria-describedby'] = formAccessibility.getErrorId(fieldId);
    } else if (hasHelp) {
      attributes['aria-describedby'] = formAccessibility.getHelpId(fieldId);
    }

    return attributes;
  },
};

// Table accessibility helpers
export const tableAccessibility = {
  // Generate table header attributes
  getHeaderAttributes: (columnId: string, sortable: boolean = false) => {
    const attributes: Record<string, string> = {
      id: columnId,
      scope: 'col',
    };

    if (sortable) {
      attributes.role = 'columnheader';
      attributes.tabIndex = '0';
    }

    return attributes;
  },

  // Generate table cell attributes
  getCellAttributes: (columnId: string, rowId: string) => {
    return {
      headers: `${columnId} ${rowId}`,
      role: 'cell',
    };
  },
};

// Modal accessibility helpers
export const modalAccessibility = {
  // Get modal attributes
  getModalAttributes: (modalId: string, labelledBy?: string) => {
    const attributes: Record<string, string> = {
      id: modalId,
      role: 'dialog',
      'aria-modal': 'true',
    };

    if (labelledBy) {
      attributes['aria-labelledby'] = labelledBy;
    }

    return attributes;
  },

  // Get modal header attributes
  getHeaderAttributes: (headerId: string) => {
    return {
      id: headerId,
      role: 'heading',
      'aria-level': '2',
    };
  },
};

// Focus management for modals
export const focusManagement = {
  // Focus first focusable element in modal
  focusFirstElement: (modalElement: HTMLElement) => {
    const focusableElements = modalElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    if (firstElement) {
      firstElement.focus();
    }
  },

  // Focus last focused element before modal opened
  restoreFocus: (element: HTMLElement | null) => {
    if (element) {
      element.focus();
    }
  },
};

// Skip links for keyboard navigation
export const skipLinks = {
  // Create skip link
  createSkipLink: (targetId: string, text: string): HTMLElement => {
    const skipLink = document.createElement('a');
    skipLink.href = `#${targetId}`;
    skipLink.textContent = text;
    skipLink.className =
      'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded';
    return skipLink;
  },

  // Add skip links to page
  addSkipLinks: (container: HTMLElement) => {
    const skipLinks = [
      { target: 'main-content', text: 'Skip to main content' },
      { target: 'navigation', text: 'Skip to navigation' },
      { target: 'search', text: 'Skip to search' },
    ];

    skipLinks.forEach(({ target, text }) => {
      const skipLink = skipLinks.createSkipLink(target, text);
      container.insertBefore(skipLink, container.firstChild);
    });
  },
};

// Screen reader only class
export const srOnly =
  'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded';
