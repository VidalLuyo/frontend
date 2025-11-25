/**
 * Modelo: Student
 * Define la estructura de datos para el módulo de Estudiantes
 */

export interface Student {
     studentId: string
     cui: string
     personalInfo: PersonalInfo
     dateOfBirth: string
     address: string
     photoPerfil?: string
     status: StudentStatus
     institutionId: string
     classroomId: string
     developmentInfo: DevelopmentInfo
     guardians: Guardian[]
     healthInfo: HealthInfo
}

export interface PersonalInfo {
     names: string
     lastNames: string
     documentType: DocumentType
     documentNumber: string
     gender: Gender
     dateOfBirth: string
     age: number
}

export interface DevelopmentInfo {
     birthType: string
     complications?: string
     hasAuditoryDisability: boolean
     hasVisualDisability: boolean
     hasMotorDisability: boolean
     otherDisability?: string
     liftedHeadAt?: string
     satAt?: string
     crawledAt?: string
     stoodUpAt?: string
     walkedAt?: string
     controlledSphinctersAt?: string
     spokeFirstWordsAt?: string
     spokeFluentlyAt?: string
}

export interface Guardian {
     relationship: GuardianRole
     names: string
     lastNames: string
     phone: string
     documentType: DocumentType
     documentNumber: string
     userId?: string
}

export interface HealthInfo {
     controls: HealthControl[]
     healthStatus: string
     illnesses?: string
     vaccines?: string
}

export interface HealthControl {
     date: string
     weight: number
     height: number
     bmi: number
}

export type StudentStatus = 'ACTIVE' | 'INACTIVE'
export type DocumentType = 'DNI' | 'CE' | 'PASAPORTE'
export type Gender = 'MASCULINO' | 'FEMENINO'
export type GuardianRole = 'PADRE' | 'MADRE' | 'TUTOR' | 'OTRO'

export interface CreateStudentRequest {
     cui: string
     personalInfo: {
          names: string
          lastNames: string
          documentType: DocumentType
          documentNumber: string
          gender: Gender
          dateOfBirth: string
     }
     address: string
     photoPerfil?: string
     institutionId: string
     classroomId: string
     developmentInfo?: Partial<DevelopmentInfo>
     guardians: Array<{
          relationship: GuardianRole
          names: string
          lastNames: string
          phone: string
          documentType: DocumentType
          documentNumber: string
     }>
     healthInfo?: {
          healthStatus: string
          illnesses?: string
          vaccines?: string
     }
}

export interface UpdateStudentRequest extends Partial<CreateStudentRequest> {
     status?: StudentStatus
}

export interface ApiResponse<T> {
     success: boolean
     message: string
     data?: T
     timestamp: string
}

export interface StudentFilters {
     status?: StudentStatus
     search?: string
     institutionId?: string
     classroomId?: string
}

// Interfaces para datos de institución y aula
export interface InstitutionDto {
     institutionId: string
     institutionName: string
}

export interface ClassroomDto {
     classroomId: string
     classroomName: string
     levelName?: string
     grade?: string
     section?: string
}

export interface StudentWithInstitutionResponse {
     student: Student
     institution: InstitutionDto
     classroom: ClassroomDto
     guardians: UserDto[]
}

// Interface para datos de usuario (guardians) desde MS Users
export interface UserDto {
     userId: string
     firstName: string
     lastName: string
     documentType: string
     documentNumber: string
     phone: string
     email: string
     userName: string
     role: string
     status: string
}
