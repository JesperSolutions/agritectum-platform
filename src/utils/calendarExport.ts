/**
 * Calendar export utilities for scheduled visits
 * Supports iCal format and Google Calendar integration
 */

import { ScheduledVisit } from '../types';

/**
 * Convert a date string (YYYY-MM-DD) and time string (HH:MM) to ISO 8601 format
 */
const toISODateTime = (dateStr: string, timeStr: string): string => {
  return `${dateStr.replace(/-/g, '')}T${timeStr.replace(/:/g, '')}00`;
};

/**
 * Generate an iCal event string for a scheduled visit
 */
export const generateICalEvent = (visit: ScheduledVisit): string => {
  const startDateTime = toISODateTime(visit.scheduledDate, visit.scheduledTime);
  const endDate = new Date(visit.scheduledDate);
  endDate.setMinutes(endDate.getMinutes() + visit.duration);
  const endDateTime = toISODateTime(
    endDate.toISOString().split('T')[0],
    `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`
  );

  const uid = `${visit.id}@agritectum-platform`;
  const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  // Escape special characters in text fields
  const escape = (str: string): string => {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;')
      .replace(/\n/g, '\\n');
  };

  const summary = `Inspection - ${escape(visit.customerAddress)}`;
  const description = escape(
    `Inspector: ${visit.assignedInspectorName}\nDuration: ${visit.duration} minutes${
      visit.description ? `\nNotes: ${visit.description}` : ''
    }`
  );

  return `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtstamp}
DTSTART:${startDateTime}
DTEND:${endDateTime}
SUMMARY:${summary}
DESCRIPTION:${description}
LOCATION:${escape(visit.customerAddress)}
STATUS:CONFIRMED
END:VEVENT`;
};

/**
 * Generate a complete iCal file for a scheduled visit
 */
export const generateICalFile = (visit: ScheduledVisit): string => {
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Agritectum//Scheduled Visits//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Inspection Visits
X-WR-TIMEZONE:UTC
${generateICalEvent(visit)}
END:VCALENDAR`;
};

/**
 * Download an iCal file for a scheduled visit
 */
export const downloadICalFile = (visit: ScheduledVisit): void => {
  const iCalContent = generateICalFile(visit);
  const blob = new Blob([iCalContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `inspection-${visit.id}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

/**
 * Generate a Google Calendar add URL
 */
export const generateGoogleCalendarUrl = (visit: ScheduledVisit): string => {
  const startDateTime = `${visit.scheduledDate.replace(/-/g, '')}T${visit.scheduledTime.replace(/:/g, '')}00`;
  const endDate = new Date(visit.scheduledDate);
  endDate.setMinutes(endDate.getMinutes() + visit.duration);
  const endDateTime = `${endDate.toISOString().split('T')[0].replace(/-/g, '')}T${String(
    endDate.getHours()
  ).padStart(2, '0')}${String(endDate.getMinutes()).padStart(2, '0')}00`;

  const title = `Inspection - ${visit.customerAddress}`;
  const description = `Inspector: ${visit.assignedInspectorName}\nDuration: ${visit.duration} minutes${
    visit.description ? `\nNotes: ${visit.description}` : ''
  }`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startDateTime}/${endDateTime}`,
    details: description,
    location: visit.customerAddress,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Open Google Calendar in a new window
 */
export const addToGoogleCalendar = (visit: ScheduledVisit): void => {
  const url = generateGoogleCalendarUrl(visit);
  window.open(url, '_blank', 'width=800,height=600');
};

/**
 * Generate Microsoft Outlook add URL
 */
export const generateOutlookCalendarUrl = (visit: ScheduledVisit): string => {
  const startDateTime = new Date(`${visit.scheduledDate}T${visit.scheduledTime}`).toISOString();
  const endDate = new Date(`${visit.scheduledDate}T${visit.scheduledTime}`);
  endDate.setMinutes(endDate.getMinutes() + visit.duration);
  const endDateTime = endDate.toISOString();

  const title = `Inspection - ${visit.customerAddress}`;
  const description = `Inspector: ${visit.assignedInspectorName}\nDuration: ${visit.duration} minutes${
    visit.description ? `\nNotes: ${visit.description}` : ''
  }`;

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    startdt: startDateTime,
    enddt: endDateTime,
    subject: title,
    body: description,
    location: visit.customerAddress,
  });

  return `https://outlook.live.com/calendar/0/compose?${params.toString()}`;
};

/**
 * Open Outlook Calendar in a new window
 */
export const addToOutlookCalendar = (visit: ScheduledVisit): void => {
  const url = generateOutlookCalendarUrl(visit);
  window.open(url, '_blank', 'width=800,height=600');
};
