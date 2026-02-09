/**
 * Calendar export utilities for scheduled visits
 * Supports iCal format and Google Calendar integration
 */

import { ScheduledVisit } from '../types';

/**
 * Parse scheduled date and time and convert to Date object
 */
const parseVisitDateTime = (dateStr: string, timeStr: string): Date => {
  // dateStr format: "2025-10-02"
  // timeStr format: "10:00"
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date(dateStr);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

/**
 * Convert a Date object to iCal format (YYYYMMDDTHHMMSSZ for UTC)
 */
const toICalFormat = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
};

/**
 * Generate an iCal event string for a scheduled visit
 */
export const generateICalEvent = (visit: ScheduledVisit): string => {
  const startDate = parseVisitDateTime(visit.scheduledDate, visit.scheduledTime);
  const endDate = new Date(startDate.getTime() + visit.duration * 60 * 1000);

  const startDateTime = toICalFormat(startDate);
  const endDateTime = toICalFormat(endDate);

  const uid = `${visit.id}@agritectum-platform.com`;
  const dtstamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  
  // Escape special characters in text fields per RFC 5545
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
SEQUENCE:0
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
  const startDate = parseVisitDateTime(visit.scheduledDate, visit.scheduledTime);
  const endDate = new Date(startDate.getTime() + visit.duration * 60 * 1000);

  // Google Calendar uses format: YYYYMMDDTHHMMSSZ for UTC times
  const formatForGoogle = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
  };

  const startDateTime = formatForGoogle(startDate);
  const endDateTime = formatForGoogle(endDate);

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
    trp: 'false', // Don't show timezone picker
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
  const startDate = parseVisitDateTime(visit.scheduledDate, visit.scheduledTime);
  const endDate = new Date(startDate.getTime() + visit.duration * 60 * 1000);

  const startDateTime = startDate.toISOString();
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
    allday: 'false',
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
};

/**
 * Open Outlook Calendar in a new window
 */
export const addToOutlookCalendar = (visit: ScheduledVisit): void => {
  const url = generateOutlookCalendarUrl(visit);
  window.open(url, '_blank', 'width=800,height=600');
};
