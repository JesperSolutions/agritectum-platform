/**
 * Centralized Date Formatter Utility
 * 
 * Provides consistent Swedish locale date formatting across the application.
 * Format: DD MMM YYYY (e.g., "15 Jan 2025")
 */

const SWEDISH_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun',
  'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'
] as const;

/**
 * Format date to Swedish locale: DD MMM YYYY
 * Example: "15 Jan 2025"
 */
export const formatSwedishDate = (date: Date | string | number | null | undefined): string => {
  if (!date) return '-';
  
  try {
    let dateObj: Date;
    
    // Handle Firestore Timestamp
    if (date && typeof date === 'object' && 'toDate' in date && typeof (date as any).toDate === 'function') {
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
    
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = SWEDISH_MONTHS[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    
    return `${day} ${month} ${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
};

/**
 * Format date with time: DD MMM YYYY HH:mm
 * Example: "15 Jan 2025 14:30"
 */
export const formatSwedishDateTime = (
  date: Date | string | number | null | undefined
): string => {
  if (!date) return '-';
  
  try {
    let dateObj: Date;
    
    // Handle Firestore Timestamp
    if (date && typeof date === 'object' && 'toDate' in date && typeof (date as any).toDate === 'function') {
      dateObj = (date as any).toDate();
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      dateObj = date as Date;
    }
    
    if (isNaN(dateObj.getTime())) {
      return '-';
    }
    
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = SWEDISH_MONTHS[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    
    return `${day} ${month} ${year} ${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting date-time:', error);
    return '-';
  }
};

/**
 * Format date only (no year): DD MMM
 * Example: "15 Jan"
 */
export const formatSwedishDateShort = (
  date: Date | string | number | null | undefined
): string => {
  if (!date) return '-';
  
  try {
    let dateObj: Date;
    
    if (date && typeof date === 'object' && 'toDate' in date && typeof (date as any).toDate === 'function') {
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
    
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = SWEDISH_MONTHS[dateObj.getMonth()];
    
    return `${day} ${month}`;
  } catch (error) {
    console.error('Error formatting short date:', error);
    return '-';
  }
};

/**
 * Get relative time string in Swedish
 * Example: "för 2 dagar sedan", "om 3 timmar"
 */
export const formatSwedishRelativeTime = (
  date: Date | string | number | null | undefined
): string => {
  if (!date) return '-';
  
  try {
    let dateObj: Date;
    
    if (date && typeof date === 'object' && 'toDate' in date && typeof (date as any).toDate === 'function') {
      dateObj = (date as any).toDate();
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      dateObj = date as Date;
    }
    
    if (isNaN(dateObj.getTime())) {
      return '-';
    }
    
    const now = new Date();
    const diffMs = dateObj.getTime() - now.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (Math.abs(diffDays) > 7) {
      return formatSwedishDate(dateObj);
    }
    
    if (Math.abs(diffDays) > 0) {
      return diffDays > 0 
        ? `om ${diffDays} ${diffDays === 1 ? 'dag' : 'dagar'}`
        : `för ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'dag' : 'dagar'} sedan`;
    }
    
    if (Math.abs(diffHours) > 0) {
      return diffHours > 0
        ? `om ${diffHours} ${diffHours === 1 ? 'timme' : 'timmar'}`
        : `för ${Math.abs(diffHours)} ${Math.abs(diffHours) === 1 ? 'timme' : 'timmar'} sedan`;
    }
    
    if (Math.abs(diffMinutes) > 0) {
      return diffMinutes > 0
        ? `om ${diffMinutes} ${diffMinutes === 1 ? 'minut' : 'minuter'}`
        : `för ${Math.abs(diffMinutes)} ${Math.abs(diffMinutes) === 1 ? 'minut' : 'minuter'} sedan`;
    }
    
    return 'nu';
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return '-';
  }
};



