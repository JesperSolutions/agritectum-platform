/**
 * Centralized Date Formatter Utility
 *
 * Provides consistent date formatting across the application.
 * Reference format: MM/DD/YYYY at HH:mm (e.g., "1/7/2026 at 09:00")
 */

/**
 * Format date to MM/DD/YYYY at HH:mm
 * Example: "1/7/2026 at 09:00"
 */
export const formatDateTime = (
  date: Date | string | number | null | undefined,
  time?: string
): string => {
  if (!date) return '-';

  try {
    let dateObj: Date;

    // Handle Firestore Timestamp
    if (
      date &&
      typeof date === 'object' &&
      'toDate' in date &&
      typeof (date as any).toDate === 'function'
    ) {
      dateObj = (date as any).toDate();
    } else if (typeof date === 'string') {
      // Handle ISO string or YYYY-MM-DD format
      if (date.includes('T')) {
        dateObj = new Date(date);
      } else {
        // YYYY-MM-DD format - parse without timezone conversion
        const [year, month, day] = date.split('-').map(Number);
        dateObj = new Date(year, month - 1, day);
      }
    } else if (typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      dateObj = date as Date;
    }

    if (isNaN(dateObj.getTime())) {
      return '-';
    }

    const month = (dateObj.getMonth() + 1).toString();
    const day = dateObj.getDate().toString();
    const year = dateObj.getFullYear().toString();

    // Format time
    let timeStr = '';
    if (time) {
      timeStr = ` at ${time}`;
    } else {
      const hours = dateObj.getHours().toString().padStart(2, '0');
      const minutes = dateObj.getMinutes().toString().padStart(2, '0');
      timeStr = ` at ${hours}:${minutes}`;
    }

    return `${month}/${day}/${year}${timeStr}`;
  } catch (error) {
    console.error('Error formatting date-time:', error);
    return '-';
  }
};

/**
 * Format date to MM/DD/YYYY (no time)
 * Example: "1/7/2026"
 */
export const formatDate = (date: Date | string | number | null | undefined): string => {
  if (!date) return '-';

  try {
    let dateObj: Date;

    if (
      date &&
      typeof date === 'object' &&
      'toDate' in date &&
      typeof (date as any).toDate === 'function'
    ) {
      dateObj = (date as any).toDate();
    } else if (typeof date === 'string') {
      if (date.includes('T')) {
        dateObj = new Date(date);
      } else {
        const [year, month, day] = date.split('-').map(Number);
        dateObj = new Date(year, month - 1, day);
      }
    } else if (typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      dateObj = date as Date;
    }

    if (isNaN(dateObj.getTime())) {
      return '-';
    }

    const month = (dateObj.getMonth() + 1).toString();
    const day = dateObj.getDate().toString();
    const year = dateObj.getFullYear().toString();

    return `${month}/${day}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
};

/**
 * Format date to Swedish format (YYYY-MM-DD)
 * Legacy function for backward compatibility
 * @deprecated Use formatDate or formatDateTime instead
 */
export const formatSwedishDate = (date: Date | string | number | null | undefined): string => {
  if (!date) return '-';

  try {
    let dateObj: Date;

    if (
      date &&
      typeof date === 'object' &&
      'toDate' in date &&
      typeof (date as any).toDate === 'function'
    ) {
      dateObj = (date as any).toDate();
    } else if (typeof date === 'string') {
      if (date.includes('T')) {
        dateObj = new Date(date);
      } else {
        const [year, month, day] = date.split('-').map(Number);
        dateObj = new Date(year, month - 1, day);
      }
    } else if (typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      dateObj = date as Date;
    }

    if (isNaN(dateObj.getTime())) {
      return '-';
    }

    const year = dateObj.getFullYear().toString();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting Swedish date:', error);
    return '-';
  }
};

/**
 * Format date to Swedish format with time (YYYY-MM-DD HH:mm)
 * Legacy function for backward compatibility
 * @deprecated Use formatDateTime instead
 */
export const formatSwedishDateTime = (date: Date | string | number | null | undefined): string => {
  if (!date) return '-';

  try {
    let dateObj: Date;

    if (
      date &&
      typeof date === 'object' &&
      'toDate' in date &&
      typeof (date as any).toDate === 'function'
    ) {
      dateObj = (date as any).toDate();
    } else if (typeof date === 'string') {
      if (date.includes('T')) {
        dateObj = new Date(date);
      } else {
        const [year, month, day] = date.split('-').map(Number);
        dateObj = new Date(year, month - 1, day);
      }
    } else if (typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      dateObj = date as Date;
    }

    if (isNaN(dateObj.getTime())) {
      return '-';
    }

    const year = dateObj.getFullYear().toString();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting Swedish date-time:', error);
    return '-';
  }
};
