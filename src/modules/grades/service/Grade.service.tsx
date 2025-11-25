/**
 * Servicio: GradeService
 * Maneja las peticiones al API para Notas
 */

import type { Grade, CreateGradeDto, UpdateGradeDto } from '../models/grades.model'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const gradesService = {
  async getAll(): Promise<Grade[]> {
    const response = await fetch(`${API_URL}/notas`)
    if (!response.ok) throw new Error('Error al obtener datos')
    return response.json()
  },

  async getById(id: string): Promise<Grade> {
    const response = await fetch(`${API_URL}/notas/${id}`)
    if (!response.ok) throw new Error('Error al obtener el registro')
    return response.json()
  },

  async create(data: CreateGradeDto): Promise<Grade> {
    const response = await fetch(`${API_URL}/notas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Error al crear el registro')
    return response.json()
  },

  async update(id: string, data: UpdateGradeDto): Promise<Grade> {
    const response = await fetch(`${API_URL}/notas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Error al actualizar el registro')
    return response.json()
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/notas/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Error al eliminar el registro')
  },
}
