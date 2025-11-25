/**
 * Modelo: Grade
 * Define la estructura de datos para el módulo de Notas
 */

export interface Grade {
  id: string
  name: string
  description?: string
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export interface CreateGradeDto {
  name: string
  description?: string
}

export interface UpdateGradeDto extends Partial<CreateGradeDto> {
  status?: 'active' | 'inactive'
}
