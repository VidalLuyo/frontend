/**
 * Modelo: Teacher
 * Define la estructura de datos para el módulo de Gestión de Profesores
 */

export interface Teacher {
  id: string
  name: string
  description?: string
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export interface CreateTeacherDto {
  name: string
  description?: string
}

export interface UpdateTeacherDto extends Partial<CreateTeacherDto> {
  status?: 'active' | 'inactive'
}
