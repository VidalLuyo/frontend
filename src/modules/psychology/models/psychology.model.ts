/**
 * Modelo: Psychological Evaluation
 * Define la estructura de datos para evaluaciones psicológicas
 */

export type EvaluationType = 'INICIAL' | 'SEGUIMIENTO' | 'ESPECIAL' | 'DERIVACION'
export type DevelopmentLevel = 'ESPERADO' | 'EN_PROCESO' | 'REQUIERE_APOYO' | 'NO_EVALUADO'
export type Status = 'ACTIVE' | 'INACTIVE'

export interface PsychologicalEvaluation {
  id: string
  studentId: string
  studentName?: string
  classroomId: string
  classroomName?: string
  institutionId: string
  institutionName?: string
  evaluationDate: string
  academicYear: number
  evaluationType: EvaluationType
  evaluationReason?: string
  emotionalDevelopment?: DevelopmentLevel
  socialDevelopment?: DevelopmentLevel
  cognitiveDevelopment?: DevelopmentLevel
  motorDevelopment?: DevelopmentLevel
  observations: string
  recommendations?: string
  requiresFollowUp?: boolean
  followUpFrequency?: string
  evaluatedBy: string
  evaluatedByName?: string
  evaluatedAt?: string
  updatedAt?: string
  status?: Status
}

export interface CreatePsychologicalEvaluationDto {
  studentId: string
  classroomId: string
  institutionId: string
  evaluationDate: string
  academicYear: number
  evaluationType: EvaluationType
  evaluationReason?: string
  emotionalDevelopment?: DevelopmentLevel
  socialDevelopment?: DevelopmentLevel
  cognitiveDevelopment?: DevelopmentLevel
  motorDevelopment?: DevelopmentLevel
  observations: string
  recommendations?: string
  requiresFollowUp?: boolean
  followUpFrequency?: string
  evaluatedBy: string
  status?: Status
}

export type UpdatePsychologicalEvaluationDto = Partial<CreatePsychologicalEvaluationDto>

// Opciones para los selects
export const EVALUATION_TYPE_OPTIONS = [
  { value: 'INICIAL', label: 'Inicial' },
  { value: 'SEGUIMIENTO', label: 'Seguimiento' },
  { value: 'ESPECIAL', label: 'Especial' },
  { value: 'DERIVACION', label: 'Derivación' }
] as const

export const DEVELOPMENT_LEVEL_OPTIONS = [
  { value: 'ESPERADO', label: 'Esperado' },
  { value: 'EN_PROCESO', label: 'En Proceso' },
  { value: 'REQUIERE_APOYO', label: 'Requiere Apoyo' },
  { value: 'NO_EVALUADO', label: 'No Evaluado' }
] as const
