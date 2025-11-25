/**
 * Modelo: Attendance Record
 * Define la estructura de datos para registros de asistencia escolar
 */

export type AttendanceStatus = 'PRESENTE' | 'AUSENTE' | 'TARDANZA' | 'JUSTIFICADO' | 'PERMISO'

export interface AttendanceRecord {
  id: string
  studentId: string
  studentName?: string
  classroomId: string
  classroomName?: string
  institutionId: string
  institutionName?: string
  attendanceDate: string
  academicYear: number
  attendanceStatus: AttendanceStatus
  arrivalTime?: string
  departureTime?: string
  justified?: boolean
  justificationReason?: string
  justificationDocumentUrl?: string
  registeredBy: string
  registeredByName?: string
  registeredAt?: string
  updatedAt?: string
}

export interface CreateAttendanceDto {
  studentId: string
  classroomId: string
  institutionId: string
  attendanceDate: string
  academicYear: number
  attendanceStatus: AttendanceStatus
  arrivalTime?: string
  departureTime?: string
  justified?: boolean
  justificationReason?: string
  justificationDocumentUrl?: string
  registeredBy: string
}

export interface JustificationDto {
  justificationReason: string
  justificationDocumentUrl?: string
}

export interface AttendanceStats {
  totalRecords: number
  presentCount: number
  absentCount: number
  lateCount: number
  justifiedCount: number
  permissionCount: number
  attendanceRate: number
}

// DTO para actualizar - solo campos editables
export interface UpdateAttendanceDto {
  attendanceStatus: AttendanceStatus
  departureTime?: string
  justified?: boolean
  justificationReason?: string
  justificationDocumentUrl?: string
}

// Opciones para los selects
export const ATTENDANCE_STATUS_OPTIONS = [
  { value: 'PRESENTE', label: 'Presente', color: 'success' },
  { value: 'AUSENTE', label: 'Ausente', color: 'error' },
  { value: 'TARDANZA', label: 'Tardanza', color: 'warning' },
  { value: 'JUSTIFICADO', label: 'Justificado', color: 'info' },
  { value: 'PERMISO', label: 'Permiso', color: 'default' }
] as const

// Función helper para obtener el color del estado
export const getStatusColor = (status: AttendanceStatus): string => {
  const option = ATTENDANCE_STATUS_OPTIONS.find(opt => opt.value === status)
  return option?.color || 'default'
}

// Función helper para obtener el label del estado
export const getStatusLabel = (status: AttendanceStatus): string => {
  const option = ATTENDANCE_STATUS_OPTIONS.find(opt => opt.value === status)
  return option?.label || status
}

// Interfaces para registro masivo
export interface BulkAttendanceDto {
  studentIds: string[]
  classroomId: string
  institutionId: string
  attendanceDate: string
  academicYear: number
  attendanceStatus: AttendanceStatus
  arrivalTime?: string
  registeredBy: string
}

export interface BulkAttendanceResponse {
  totalRequested: number
  successCount: number
  failureCount: number
  successfulRecords: AttendanceRecord[]
  failedRecords: FailedRecord[]
}

export interface FailedRecord {
  studentId: string
  studentName: string
  reason: string
}
