// CalendarService.ts
import type { Calendar } from "../models/Calendar";
import type { ApiResponse } from "../models/ApiResponse";

const BASE_URL = "http://localhost:9085/api/v1/calendars";

export class CalendarService {
  async getAll(): Promise<Calendar[]> {
    const res = await fetch(`${BASE_URL}`);
    if (!res.ok) throw new Error("Error al obtener calendarios");
    const json: ApiResponse<Calendar[]> = await res.json();
    return json.data;
  }

  async getById(id: number): Promise<Calendar> {
    const res = await fetch(`${BASE_URL}/${id}`);
    if (!res.ok) throw new Error("Error al obtener calendario");
    const json: ApiResponse<Calendar> = await res.json();
    return json.data;
  }

  /**
   * Crear un nuevo calendario
   */
  async create(calendar: Partial<Calendar>): Promise<Calendar> {
    const res = await fetch(`${BASE_URL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(calendar),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err?.message || "Error al crear calendario");
    }

    const json: ApiResponse<Calendar> = await res.json();
    return json.data;
  }
}

export const calendarService = new CalendarService();
