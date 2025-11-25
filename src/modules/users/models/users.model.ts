/**
 * Modelo: User
 * Define la estructura de datos para el módulo de Usuarios
 */

export interface User {
  userId: string
  institutionId: string
  firstName: string
  lastName: string
  documentType: string
  documentNumber: string
  phone: string
  address: string
  email: string
  userName: string
  role: UserRole
  status: UserStatus
  createdAt: string
  updatedAt: string
}

export type UserRole = 'ADMIN' | 'PADRE' | 'MADRE' | 'DIRECTOR' | 'AUXILIAR' | 'TUTOR'

export type UserStatus = 'ACTIVE' | 'INACTIVE'

export interface CreateUserDto {
  institutionId: string
  firstName: string
  lastName: string
  documentType: string
  documentNumber: string
  phone: string
  address: string
  email: string
  userName: string
  role: UserRole
}

export interface UpdateUserDto extends Partial<CreateUserDto> {
  status?: UserStatus
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data?: T
  timestamp: string
}

export interface UserFilters {
  status?: UserStatus
  role?: UserRole
  search?: string
}

// DTO para mostrar información de institución junto con el usuario
export interface InstitutionDto {
  institutionId: string
  institutionName: string
  codeInstitution: string
}

// Response con información de institución
export interface UserWithInstitutionResponse extends User {
  institution: InstitutionDto
}
