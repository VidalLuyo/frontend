// Interfaces para los tipos de datos
export interface ContactMethod {
  type: string;
  value: string;
}

export interface Address {
  department: string;
  province: string;
  district: string;
  street: string;
  postalCode: string;
}

export interface InstitutionInformation {
  institutionName: string;
  codeInstitution: string;
  modularCode: string;
  institutionType: string;
  institutionLevel: string;
  gender: string;
  slogan: string;
  logoUrl: string;
}

export interface Schedule {
  type: string;
  entryTime: string;
  exitTime: string;
}

export interface Classroom {
  classroomId: string;
  classroomName: string;
  classroomAge: string;
  capacity: number;
  color: string;
  gradeLevel?: string;
  section?: string;
  institutionId: string;
  status: string;
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
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export type InstitutionStatus = 'ACTIVE' | 'INACTIVE';

// Interfaces para las respuestas del backend
export interface Institution {
  institutionId: string;
  status: InstitutionStatus;
  institutionInformation: InstitutionInformation;
  address: Address;
  contactMethods: ContactMethod[];
  gradingType: string;
  classroomType: string;
  schedules: Schedule[];
  classroomIds: string[];
  directorId: string;
  auxiliaryIds: string[];
  ugel: string;
  dre: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface InstitutionCompleteResponse {
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
  status: InstitutionStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface InstitutionWithUsersAndClassroomsResponse {
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
  status: InstitutionStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// Interfaces para las peticiones (DTOs de entrada)
export interface ClassroomCreate {
  classroomName: string;
  classroomAge: string;
  capacity: number;
  color: string;
}

export interface UserCreateRequest {
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  phone: string;
  email: string;
  role: string;
}

export interface InstitutionCreateWithUsersRequest {
  institutionInformation: InstitutionInformation;
  address: Address;
  contactMethods: ContactMethod[];
  gradingType: string;
  classroomType: string;
  schedules: Schedule[];
  classrooms: ClassroomCreate[];
  director: UserCreateRequest;
  auxiliaries: UserCreateRequest[];
  ugel: string;
  dre: string;
}

// Definición de la estructura de la respuesta de la API
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface InstitutionUpdateRequest {
  institutionInformation: InstitutionInformation;
  address: Address;
  contactMethods: ContactMethod[];
  gradingType: string;
  classroomType: string;
  schedules: Schedule[];
  directorId: string;
  auxiliaryIds: string[];
  ugel: string;
  dre: string;
}
