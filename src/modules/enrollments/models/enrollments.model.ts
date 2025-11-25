/**
 * Modelos: Enrollment y Academic Period
 * Define las estructuras de datos para el módulo de Matrículas y Períodos Académicos
 */

// 📝 Modelo principal de Matrícula - Basado exactamente en el DTO del Backend
export interface Enrollment {
  // Campos de identificación
  id?: string; // Auto-generado por el backend
  studentId: string; // ✅ Requerido
  institutionId: string; // ✅ Requerido
  classroomId: string; // ✅ Requerido
  
  // Información académica
  academicYear: string; // ✅ Requerido - "2025", "2024"
  academicPeriodId: string; // ✅ Requerido
  enrollmentDate?: string; // ISO format date - Auto-generado por backend
  enrollmentStatus?: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'CANCELLED'; // Default: "ACTIVE"
  enrollmentType?: 'NUEVA' | 'REINSCRIPCION'; // Default: "NUEVA"
  
  // Información adicional
  previousInstitution?: string; // Solo para reinscripciones
  observations?: string; // Texto libre
  
  // Información del estudiante
  ageGroup: string; // ✅ Requerido
  shift: string; // ✅ Requerido
  section: string; // ✅ Requerido - "A", "B", "C"
  modality: string; // ✅ Requerido
  
  // Nuevos campos del schema del backend
  educationalLevel?: string; // Default: "INITIAL"
  studentAge?: number; // Short en backend - 3, 4, 5
  enrollmentCode?: string; // "MAT2025001"
  
  // 📋 Documentos Requeridos (todos boolean, default: false)
  birthCertificate?: boolean; // Certificado de nacimiento
  studentDni?: boolean; // DNI del estudiante
  guardianDni?: boolean; // DNI del apoderado
  vaccinationCard?: boolean; // Carnet de vacunas
  disabilityCertificate?: boolean; // Certificado de discapacidad
  utilityBill?: boolean; // Recibo de servicios
  psychologicalReport?: boolean; // Informe psicológico
  studentPhoto?: boolean; // Foto del estudiante
  healthRecord?: boolean; // Ficha de salud
  signedEnrollmentForm?: boolean; // Ficha de matrícula firmada
  dniVerification?: boolean; // Verificación de DNI
  
  // Campo de control
  deleted?: boolean; // Soft delete - Default: false
}

// 🎓 Importar modelo de Período Académico desde su archivo específico
export type { AcademicPeriod, CreateAcademicPeriodDto, UpdateAcademicPeriodDto, AcademicPeriodFilters } from './academicPeriod.model';

// 📋 DTOs para creación y actualización
export interface CreateEnrollmentDto extends Omit<Enrollment, 'id' | 'enrollmentDate' | 'deleted'> {}

export interface UpdateEnrollmentDto extends Partial<Omit<Enrollment, 'id'>> {}



// 🔧 Tipos de utilidad
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  status: number;
  errors?: Record<string, string>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface DocumentProgress {
  completed: number;
  total: number;
  percentage: number;
}

// 📊 Filtros para búsquedas
export interface EnrollmentFilters {
  academicYear?: string;
  institutionId?: string;
  status?: string;
  shift?: string;
  ageGroup?: string;
  modality?: string;
  enrollmentType?: string;
  search?: string;
}



// 📝 Constantes de valores permitidos
export const ENROLLMENT_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  PENDING: 'PENDING',
  CANCELLED: 'CANCELLED'
} as const;

export const ENROLLMENT_TYPE = {
  NUEVA: 'NUEVA',
  REINSCRIPCION: 'REINSCRIPCION'
} as const;

// Tipos de estado y tipo de matrícula
export type EnrollmentStatus = typeof ENROLLMENT_STATUS[keyof typeof ENROLLMENT_STATUS];
export type EnrollmentType = typeof ENROLLMENT_TYPE[keyof typeof ENROLLMENT_TYPE];



// 📋 Lista de documentos requeridos
export const REQUIRED_DOCUMENTS = [
  { key: 'birthCertificate', label: 'Certificado de Nacimiento', required: true },
  { key: 'studentDni', label: 'DNI del Estudiante', required: true },
  { key: 'guardianDni', label: 'DNI del Apoderado', required: true },
  { key: 'vaccinationCard', label: 'Carné de Vacunación', required: true },
  { key: 'disabilityCertificate', label: 'Certificado de Discapacidad', required: false },
  { key: 'utilityBill', label: 'Recibo de Servicios', required: true },
  { key: 'psychologicalReport', label: 'Informe Psicológico', required: false },
  { key: 'studentPhoto', label: 'Foto del Estudiante', required: true },
  { key: 'healthRecord', label: 'Ficha de Salud', required: true },
  { key: 'signedEnrollmentForm', label: 'Formulario de Matrícula Firmado', required: true },
  { key: 'dniVerification', label: 'Verificación de DNI', required: true }
] as const;
