/**
 * Modelos de Integración - Estudiantes e Instituciones
 * Basado en la documentación de los microservicios externos
 */

// ========================================
// MODELOS DE ESTUDIANTES (vg-ms-students)
// ========================================

export interface StudentResponse {
  success: boolean;
  message: string;
  data: StudentData;
  timestamp: string;
  path?: string;
}

export interface StudentsListResponse {
  success: boolean;
  message: string;
  data: StudentData[];
  timestamp: string;
  path?: string;
}

export interface StudentData {
  studentId: string;
  cui: string;
  personalInfo: PersonalInfoData;
  dateOfBirth: string;
  address: string;
  photoPerfil?: string;
  status: 'A' | 'I' | 'T' | 'G'; // Active, Inactive, Transferred, Graduated
  institutionId: string;
  classroomId: string;
  guardians?: GuardianData[];
}

export interface PersonalInfoData {
  names: string;
  lastNames: string;
  documentType: string;
  documentNumber: string;
  gender: 'MASCULINO' | 'FEMENINO';
  dateOfBirth: string;
}

export interface GuardianData {
  relationship: string;
  names: string;
  lastNames: string;
  phone: string;
  documentType: string;
  documentNumber: string;
  userId?: string;
}

// ========================================
// MODELOS DE INSTITUCIONES (vg-ms-institution-management)
// ========================================

export interface InstitutionCompleteResponse {
  institutionId: string;
  status: 'ACTIVE' | 'INACTIVE';
  institutionInformation: InstitutionInformation;
  address: Address;
  contactMethods: ContactMethod[];
  gradingType: string;
  classroomType: string;
  schedules: Schedule[];
  classrooms: Classroom[];
  directorId: string;
  auxiliaryIds: string[];
  ugel: string;
  dre: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface InstitutionWithUsersResponse {
  institutionId: string;
  status: 'ACTIVE' | 'INACTIVE';
  institutionInformation: InstitutionInformation;
  address: Address;
  contactMethods: ContactMethod[];
  gradingType: string;
  classroomType: string;
  schedules: Schedule[];
  classrooms: Classroom[];
  director: UserResponse;
  auxiliaries: UserResponse[];
  ugel: string;
  dre: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// Nuevos tipos de respuesta según la documentación actualizada
export interface InstitutionCompleteResponseDto {
  institutionId: string;
  institutionInformation: InstitutionInformation;
  address: Address;
  contactMethods: ContactMethod[];
  gradingType: string;
  classroomType: string;
  schedules: Schedule[];
  classrooms: Classroom[];
  directorId: string;
  auxiliaryIds: string[];
  ugel: string;
  dre: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface InstitutionWithUsersAndClassroomsResponseDto {
  institutionId: string;
  institutionInformation: InstitutionInformation;
  address: Address;
  contactMethods: ContactMethod[];
  gradingType: string;
  classroomType: string;
  schedules: Schedule[];
  classrooms: Classroom[];
  director: UserResponse;
  auxiliaries: UserResponse[];
  ugel: string;
  dre: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface InstitutionInformation {
  institutionName: string;
  codeInstitution: string;
  modularCode: string;
  institutionType: string;
  institutionLevel: string;
  gender: string;
  slogan: string;
  logoUrl?: string;
}

export interface Address {
  street: string;
  district: string;
  province: string;
  department: string;
  postalCode: string;
}

export interface ContactMethod {
  type: string;
  value: string;
}

export interface Schedule {
  type: string;
  entryTime: string;
  exitTime: string;
}

export interface Classroom {
  classroomId: string;
  institutionId: string;
  classroomName: string;
  classroomAge: string;
  capacity: number;
  color: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface UserResponse {
  userId: string;
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  phone: string;
  email: string;
  role: 'DIRECTOR' | 'AUXILIAR' | 'ADMIN' | 'PROFESOR';
  status: 'A' | 'I';
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// ========================================
// MODELOS DE VALIDACIÓN DE MATRÍCULA
// ========================================

export interface EnrollmentValidationResponse {
  studentValid: boolean;
  institutionValid: boolean;
  classroomValid: boolean;
  studentName?: string;
  institutionName?: string;
  classroomName?: string;
  classroomCapacity?: number;
  validationMessage?: string;
  valid: boolean;
}

export interface InstitutionSummary {
  institutionId: string;
  institutionName: string;
  institutionType: string;
  institutionLevel: string;
  address: Address;
  availableClassrooms: number;
  logoUrl?: string;
}

// ========================================
// TIPOS DE UTILIDAD
// ========================================

export interface ApiError {
  message: string;
  status: number;
  timestamp: string;
  path?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// ========================================
// CONSTANTES
// ========================================

export const STUDENT_STATUS = {
  ACTIVE: 'A',
  INACTIVE: 'I',
  TRANSFERRED: 'T',
  GRADUATED: 'G'
} as const;

export const INSTITUTION_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE'
} as const;

export const CLASSROOM_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE'
} as const;

export type StudentStatus = typeof STUDENT_STATUS[keyof typeof STUDENT_STATUS];
export type InstitutionStatus = typeof INSTITUTION_STATUS[keyof typeof INSTITUTION_STATUS];
export type ClassroomStatus = typeof CLASSROOM_STATUS[keyof typeof CLASSROOM_STATUS];