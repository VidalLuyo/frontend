/**
 * Modelo: Behavior
 * Define la estructura de datos para el módulo de Comportamiento
 */

export interface Behavior {
  id: string
  name: string
  description?: string
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export interface CreateBehaviorDto {
  name: string
  description?: string
}

export interface UpdateBehaviorDto extends Partial<CreateBehaviorDto> {
  status?: 'active' | 'inactive'
}
