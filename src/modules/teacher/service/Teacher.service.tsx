/**
 * Servicio: TeacherService
 * Maneja las peticiones al API para Gestión de Profesores
 */

import type { Teacher, CreateTeacherDto, UpdateTeacherDto } from '../models/teacher.model'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const teacherService = {
  async getAll(): Promise<Teacher[]> {
    const response = await fetch(`${API_URL}/cursos`)
    if (!response.ok) throw new Error('Error al obtener datos')
    return response.json()
  },

  async getById(id: string): Promise<Teacher> {
    const response = await fetch(`${API_URL}/cursos/${id}`)
    if (!response.ok) throw new Error('Error al obtener el registro')
    return response.json()
  },

  async create(data: CreateTeacherDto): Promise<Teacher> {
    const response = await fetch(`${API_URL}/cursos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Error al crear el registro')
    return response.json()
  },

  async update(id: string, data: UpdateTeacherDto): Promise<Teacher> {
    const response = await fetch(`${API_URL}/cursos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Error al actualizar el registro')
    return response.json()
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/cursos/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Error al eliminar el registro')
  },
}
