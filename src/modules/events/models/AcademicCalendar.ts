// modules/events/models/AcademicCalendar.ts
export interface AcademicCalendar {
  calendarId: number;
  institutionId: string;
  academicYear: number;
  startDate: string;        // YYYY-MM-DD
  endDate: string;          // YYYY-MM-DD
  createdAt?: string | null; // ISO datetime
  updatedAt?: string | null; // ISO datetime
}
