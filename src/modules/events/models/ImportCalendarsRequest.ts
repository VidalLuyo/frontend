// modules/events/models/ImportCalendarsRequest.ts
import type { AcademicCalendar } from './AcademicCalendar';
import type { EventCalendar } from './EventCalendar';

export interface ImportCalendarsRequest {
  academic_calendar: Partial<AcademicCalendar>[]; // puede venir parcial
  event_calendar: Partial<EventCalendar>[];      // puede venir parcial
}
