// modules/events/models/EventResponse.ts
export interface EventResponse {
  eventId: number;
  institutionId: string | null;
  title: string;
  description: string | null;
  startDate: string;        // ISO date: YYYY-MM-DD
  endDate: string;          // ISO date: YYYY-MM-DD
  eventType: string | null;
  isHoliday: boolean | null;
  isRecurring: boolean | null;
  isNational: boolean | null;
  status: string | null;    // ej. "ACTIVE" | "INACTIVE"
  affectsClasses: boolean | null;
  createdBy: string | null;
  createdAt: string | null; // ISO datetime
  updatedAt: string | null; // ISO datetime
  institutionName?: string | null;
}
