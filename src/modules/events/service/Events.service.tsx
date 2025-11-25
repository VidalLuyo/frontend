import type { Event, EventCreateRequest } from "../models/events.model"

const API_BASE_URL = "http://localhost:9085/api/v1/events"

export class EventsService {
  static async listActiveEvents(): Promise<Event[]> {
    const response = await fetch(`${API_BASE_URL}`)
    if (!response.ok) throw new Error("Error fetching active events")
    const responseData = await response.json()
    if (!responseData.data || !Array.isArray(responseData.data)) {
      console.error("Invalid API response format:", responseData)
      return []
    }
    return responseData.data
  }

  static async listInactiveEvents(): Promise<Event[]> {
    const response = await fetch(`${API_BASE_URL}/inactive`)
    if (!response.ok) throw new Error("Error fetching inactive events")
    const responseData = await response.json()
    if (!responseData.data || !Array.isArray(responseData.data)) {
      console.error("Invalid API response format:", responseData)
      return []
    }
    return responseData.data
  }

  static async getEventById(id: number): Promise<Event> {
    const response = await fetch(`${API_BASE_URL}/${id}`)
    if (!response.ok) throw new Error("Error fetching event by ID")
    const responseData = await response.json()
    return responseData.data
  }

  static async createEvent(event: EventCreateRequest): Promise<Event> {
    const response = await fetch(`${API_BASE_URL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    })
    if (!response.ok) throw new Error("Error creating event")
    const responseData = await response.json()
    return responseData.data
  }

  static async updateEvent(id: number, event: EventCreateRequest): Promise<Event> {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    })
    if (!response.ok) throw new Error("Error updating event")
    const responseData = await response.json()
    return responseData.data
  }

  static async logicalDeleteEvent(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: "DELETE",
    })
    if (!response.ok) throw new Error("Error deleting event")
  }

  static async restoreEvent(id: number): Promise<Event> {
    const response = await fetch(`${API_BASE_URL}/${id}/restore`, {
      method: "PATCH",
    })
    if (!response.ok) throw new Error("Error restoring event")
    try {
      const responseData = await response.json()
      return responseData.data
    } catch {
      return {} as Event // Si no devuelve JSON, el restore fue exitoso
    }
  }

  static async getTestInstitutions(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/test-institutions`)
    if (!response.ok) throw new Error("Error fetching test institutions")
    const responseData = await response.json()
    if (!responseData.data || !Array.isArray(responseData.data)) {
      console.error("Invalid API response format:", responseData)
      return []
    }
    return responseData.data
  }
}

export type { Event, EventCreateRequest }
