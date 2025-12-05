// modules/events/models/EventCreateRequest.ts
export interface EventCreateRequest {
  institutionId: string;    // en backend es String
  title: string;
  description?: string | null;
  startDate: string;        // YYYY-MM-DD
  endDate: string;          // YYYY-MM-DD
  eventType?: string | null;
  isHoliday?: boolean | null;
  isRecurring?: boolean | null;
  isNational?: boolean | null;
  affectsClasses?: boolean | null;
  createdBy?: string | null;
}
