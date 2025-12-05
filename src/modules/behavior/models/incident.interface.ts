// Enums para los tipos de incidentes
export type IncidentType = 'ACCIDENTE' | 'CONFLICTO' | 'COMPORTAMIENTO' | 'EMOCIONAL' | 'SALUD';
export type SeverityLevel = 'LEVE' | 'MODERADO' | 'GRAVE';
export type IncidentStatus = 'OPEN' | 'RESOLVED' | 'CLOSED';

// Interface para la respuesta completa del incidente
export interface IncidentResponse {
  id: string; // UUID
  studentId: string;
  studentName?: string;
  classroomId: string;
  classroomName?: string;
  institutionId: string;
  institutionName?: string;
  incidentDate: number[] | string; // Array [year, month, day] or string
  incidentTime: number[] | string; // Array [hour, minute] or string
  academicYear: number;
  incidentType: IncidentType;
  severityLevel: SeverityLevel;
  description: string;
  location: string;
  witnesses?: string;
  otherStudentsInvolved?: string[];
  otherStudentsNames?: string[] | null;
  immediateAction?: string;
  parentsNotified?: boolean | null;
  notificationDate?: string | null; // LocalDateTime as string
  followUpRequired?: boolean;
  status: IncidentStatus;
  reportedBy: string;
  reportedByName?: string;
  reportedAt: number[] | string; // Array with date/time or string
  resolvedBy?: string | null;
  resolvedByName?: string | null;
  resolvedAt?: string | null; // LocalDateTime as string
}

// Interface para la respuesta simple del incidente (solo IDs)
export interface IncidentSimpleResponse {
  id: string;
  studentId: string;
  classroomId: string;
  institutionId: string;
  incidentDate: string;
  incidentTime: string;
  academicYear: number;
  incidentType: IncidentType;
  severityLevel: SeverityLevel;
  description: string;
  location: string;
  witnesses?: string;
  otherStudentsInvolved?: string[];
  immediateAction?: string;
  parentsNotified?: boolean;
  notificationDate?: string;
  followUpRequired?: boolean;
  status: IncidentStatus;
  reportedBy: string;
  reportedAt: string;
  resolvedBy?: string;
  resolvedAt?: string;
}

// Interface para crear un incidente (simplificada - classroom e institution se obtienen automáticamente del estudiante)
export interface IncidentCreateRequest {
  studentId: string;
  incidentDate: string; // LocalDate as string (YYYY-MM-DD)
  incidentTime: string; // LocalTime as string (HH:mm:ss)
  academicYear: number;
  incidentType: IncidentType;
  severityLevel: SeverityLevel;
  description: string;
  location: string;
  witnesses?: string;
  otherStudentsInvolved?: string[];
  immediateAction?: string;
  followUpRequired?: boolean;
  reportedBy: string;
}

// Interface para actualizar un incidente
export interface IncidentUpdateRequest {
  studentId?: string;
  incidentDate?: string;
  incidentTime?: string;
  academicYear?: number;
  incidentType?: IncidentType;
  severityLevel?: SeverityLevel;
  description?: string;
  location?: string;
  witnesses?: string;
  otherStudentsInvolved?: string[];
  immediateAction?: string;
  parentsNotified?: boolean;
  notificationDate?: string;
  followUpRequired?: boolean;
  status?: IncidentStatus;
  resolvedBy?: string;
  reportedBy?: string;
}

// Interface para formularios (simplificada - classroom e institution se obtienen automáticamente del estudiante)
export interface IncidentFormData {
  studentId: string;
  incidentDate: string;
  incidentTime: string;
  academicYear: number;
  incidentType: IncidentType;
  severityLevel: SeverityLevel;
  description: string;
  location: string;
  witnesses: string;
  otherStudentsInvolved: string[];
  immediateAction: string;
  followUpRequired: boolean;
  reportedBy: string;
}

// Interface para respuesta de la API
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Props para modales
export interface CreateIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: IncidentCreateRequest) => Promise<void>;
  loading?: boolean;
}

export interface EditIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: IncidentUpdateRequest) => Promise<void>;
  incident: IncidentResponse | null;
  loading?: boolean;
}

export interface ViewIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  incident: IncidentResponse | null;
}

// Opciones para los selects
export const INCIDENT_TYPE_OPTIONS = [
  { value: 'ACCIDENTE', label: 'Accidente' },
  { value: 'CONFLICTO', label: 'Conflicto' },
  { value: 'COMPORTAMIENTO', label: 'Comportamiento' },
  { value: 'EMOCIONAL', label: 'Emocional' },
  { value: 'SALUD', label: 'Salud' }
] as const;

export const SEVERITY_LEVEL_OPTIONS = [
  { value: 'LEVE', label: 'Leve' },
  { value: 'MODERADO', label: 'Moderado' },
  { value: 'GRAVE', label: 'Grave' }
] as const;

export const INCIDENT_STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Abierto' },
  { value: 'RESOLVED', label: 'Resuelto' },
  { value: 'CLOSED', label: 'Cerrado' }
] as const;