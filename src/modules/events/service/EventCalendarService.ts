import type { EventCalendar } from "../models/EventCalendar";
import type { ApiResponse } from "../models/ApiResponse";

const BASE_URL = "http://localhost:9085/api/v1/calendars";

export class EventCalendarService {
  /**
   * Obtener los eventos vinculados a un calendario
   */
  async getByCalendarId(calendarId: number): Promise<EventCalendar[]> {
    const res = await fetch(`${BASE_URL}/${calendarId}/event-calendar`);
    if (!res.ok) throw new Error("Error al obtener eventos del calendario");

    const json: ApiResponse<EventCalendar[]> = await res.json();
    return json.data;
  }

  async assignEventsToCalendar(
    calendarId: number,
    eventIds: number[]
  ): Promise<void> {
    const res = await fetch(
      `http://localhost:9085/api/v1/calendars/${calendarId}/events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventIds),
      }
    );

    if (!res.ok) throw new Error("Error al asignar evento(s) al calendario");
  }
}

export const eventCalendarService = new EventCalendarService();
