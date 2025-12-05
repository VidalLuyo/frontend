export interface Calendar {
  calendarId: number;
  institutionId: string;
  academicYear: number;
  startDate: string;   // YYYY-MM-DD
  endDate: string;     // YYYY-MM-DD
  createdAt: string;   // ISO date
  updatedAt: string;   // ISO date
}
