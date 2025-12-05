// modules/events/services/EventService.ts
import type { EventResponse } from "../models/EventResponse";
import type { EventCreateRequest } from "../models/EventCreateRequest";

const BASE_URL = "http://localhost:9085/api/v1/events";

export const EventService = {
  async listActiveEvents(): Promise<EventResponse[]> {
    const res = await fetch(`${BASE_URL}`);
    const json = await res.json();
    return json.data;
  },

  async listInactiveEvents(): Promise<EventResponse[]> {
    const res = await fetch(`${BASE_URL}/inactive`);
    const json = await res.json();
    return json.data;
  },

  async getEventById(id: number): Promise<EventResponse> {
    const res = await fetch(`${BASE_URL}/${id}`);
    const json = await res.json();
    return json.data;
  },

  async createEvent(body: EventCreateRequest): Promise<EventResponse> {
    const res = await fetch(`${BASE_URL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    return json.data;
  },

  async updateEvent(id: number, body: EventCreateRequest): Promise<EventResponse> {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    return json.data;
  },

  async deleteEvent(id: number): Promise<void> {
    await fetch(`${BASE_URL}/${id}`, {
      method: "DELETE",
    });
  },

  async restoreEvent(id: number): Promise<void> {
    await fetch(`${BASE_URL}/${id}/restore`, {
      method: "PATCH",
    });
  },
};
