/**
 * Servicio de Matrículas - Integración completa con Backend
 * Basado en la documentación de API del microservicio de matrículas
 */

import type { Enrollment, CreateEnrollmentDto, UpdateEnrollmentDto } from '../models/enrollments.model';

// Configuración local
const INTEGRATION_CONFIG = {
  ENROLLMENT_SERVICE_URL: import.meta.env.VITE_ENROLLMENT_API_URL || 'http://localhost:9082/api/v1',
  DEFAULT_TIMEOUT: 10000,
  MAX_RETRIES: 3,
  USE_MOCK_DATA: false,
  ENABLE_LOGGING: import.meta.env.DEV === true,
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
} as const;

// 🌐 Configuración de API - Basada en documentación backend
const API_CONFIG = {
  BASE_URL: INTEGRATION_CONFIG.ENROLLMENT_SERVICE_URL,
  TIMEOUT: INTEGRATION_CONFIG.DEFAULT_TIMEOUT,
  RETRIES: INTEGRATION_CONFIG.MAX_RETRIES,
  DEFAULT_HEADERS: INTEGRATION_CONFIG.DEFAULT_HEADERS,
  ENDPOINTS: {
    // Endpoints principales
    GET_ALL: '/enrollments',
    GET_ALL_ACTIVE: '/enrollments/active',
    GET_ALL_INACTIVE: '/enrollments/inactive',
    GET_ALL_PENDING: '/enrollments/pending',
    GET_ALL_CANCELLED: '/enrollments/cancelled',

    GET_BY_ID: (id: string) => `/enrollments/${id}`,
    CREATE: '/enrollments',
    UPDATE: (id: string) => `/enrollments/${id}`,
    DELETE: (id: string) => `/enrollments/${id}`,
    RESTORE: (id: string) => `/enrollments/${id}/restore`,
    
    // Endpoints de filtrado
    BY_INSTITUTION: (institutionId: string) => `/enrollments/institution/${institutionId}`,
    BY_STUDENT: (studentId: string) => `/enrollments/student/${studentId}`,
    
    // Endpoint para cambiar estado (NUEVO)
    CHANGE_STATUS: (id: string, status: string) => `/enrollments/${id}/status?status=${status}`,
    
    // Endpoints de validación
    VALIDATE: (studentId: string, institutionId: string, classroomId: string) => 
      `/enrollments/validate?studentId=${studentId}&institutionId=${institutionId}&classroomId=${classroomId}`,
    
    // Endpoints de integración para instituciones
    INSTITUTIONS_AVAILABLE: '/enrollments/institutions/available',
    INSTITUTIONS_COMPLETE: '/enrollments/institutions/complete',
    INSTITUTIONS_STATISTICS: '/enrollments/institutions/statistics',
  },
  DEVELOPMENT: {
    USE_MOCK_DATA: INTEGRATION_CONFIG.USE_MOCK_DATA,
    LOG_REQUESTS: INTEGRATION_CONFIG.ENABLE_LOGGING,
    LOG_RESPONSES: INTEGRATION_CONFIG.ENABLE_LOGGING,
  }
};





// Helper function para manejar requests con timeout
const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeout: number = API_CONFIG.TIMEOUT
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error instanceof Error ? error : new Error('Request failed');
  }
};

// Helper function para manejar requests con reintentos y fallback
const handleRequest = async <T,>(
  endpoint: string,
  options: RequestInit = {},
  retries: number = API_CONFIG.RETRIES
): Promise<T> => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  const method = options.method || 'GET';

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (API_CONFIG.DEVELOPMENT.LOG_REQUESTS) {
        console.log(`🚀 API Request (Attempt ${attempt}): ${method} ${url}`);
      }

      const response = await fetchWithTimeout(url, {
        ...options,
        headers: {
          ...API_CONFIG.DEFAULT_HEADERS,
          ...options.headers,
        },
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        let errorData: any = null;

        try {
          errorData = await response.json();
          errorMessage = errorData?.message || errorMessage;
        } catch (e) {
          // Si no se puede parsear el JSON, usar el mensaje por defecto
        }

        if (API_CONFIG.DEVELOPMENT.LOG_RESPONSES) {
          console.error(`❌ API Error: ${response.status} ${url}`, errorData);
        }

        // Manejar diferentes tipos de errores
        if (response.status === 400 && errorData && 'errors' in errorData) {
          const validationErrors = errorData.errors as Record<string, string>;
          const errorMessages = Object.entries(validationErrors)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
          throw new Error(`${errorMessage}: ${errorMessages}`);
        } else if (response.status === 404) {
          throw new Error(errorMessage || 'Recurso no encontrado');
        } else if (response.status === 500) {
          // Manejar errores específicos de constraint de base de datos
          if (errorMessage.includes('unique constraint "uq_enrollment_student_period"')) {
            throw new Error('Ya existe una matrícula para este estudiante en el período académico seleccionado. Por favor, verifique los datos o seleccione un período diferente.');
          } else if (errorMessage.includes('duplicate key value violates unique constraint')) {
            throw new Error('Ya existe un registro con estos datos. Por favor, verifique la información ingresada.');
          } else {
            throw new Error(errorMessage || 'Error interno del servidor');
          }
        } else {
          throw new Error(errorMessage);
        }
      }

      // Manejar respuestas 204 No Content
      if (response.status === 204) {
        if (API_CONFIG.DEVELOPMENT.LOG_RESPONSES) {
          console.log(`✅ API Success: ${response.status} No Content`);
        }
        return undefined as T;
      }

      const data = await response.json();
      if (API_CONFIG.DEVELOPMENT.LOG_RESPONSES) {
        console.log(`✅ API Success: ${response.status} ${url}`, data);
      }

      // El backend devuelve las listas directamente como arrays, no envueltas en ResponseEntity
      // Spring WebFlux con Mono<ResponseEntity<Flux<T>>> se serializa como array directo
      return data;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.error(`❌ API Failed for ${url} (Attempt ${attempt}):`, lastError);
    }
  }

  throw lastError || new Error('All retry attempts failed');
};

// 📝 ENROLLMENT API FUNCTIONS - Integración completa con Backend
export const enrollmentService = {
  /**
   * 📋 GET /api/v1/enrollments
   * Listar todas las matrículas (incluyendo eliminadas)
   */
  getAllEnrollments: async (): Promise<Enrollment[]> => {
    return handleRequest<Enrollment[]>(
      API_CONFIG.ENDPOINTS.GET_ALL,
      { method: 'GET' }
    );
  },

  /**
   * ✅ GET /api/v1/enrollments/active
   * Obtener matrículas activas
   */
  getActiveEnrollments: async (): Promise<Enrollment[]> => {
    return handleRequest<Enrollment[]>(
      API_CONFIG.ENDPOINTS.GET_ALL_ACTIVE,
      { method: 'GET' }
    );
  },

  /**
   * ❌ GET /api/v1/enrollments/inactive
   * Obtener matrículas inactivas
   */
  getInactiveEnrollments: async (): Promise<Enrollment[]> => {
    return handleRequest<Enrollment[]>(
      API_CONFIG.ENDPOINTS.GET_ALL_INACTIVE,
      { method: 'GET' }
    );
  },

  /**
   * ⏳ GET /api/v1/enrollments/pending
   * Obtener matrículas pendientes
   */
  getPendingEnrollments: async (): Promise<Enrollment[]> => {
    return handleRequest<Enrollment[]>(
      API_CONFIG.ENDPOINTS.GET_ALL_PENDING,
      { method: 'GET' }
    );
  },

  /**
   * 🚫 GET /api/v1/enrollments/cancelled
   * Obtener matrículas canceladas
   */
  getCancelledEnrollments: async (): Promise<Enrollment[]> => {
    return handleRequest<Enrollment[]>(
      API_CONFIG.ENDPOINTS.GET_ALL_CANCELLED,
      { method: 'GET' }
    );
  },

  /**
   * 📋 Obtener matrículas activas y pendientes
   * Combina matrículas activas y pendientes (excluye canceladas)
   */
  getNonDeletedEnrollments: async (): Promise<Enrollment[]> => {
    // Combinar matrículas activas y pendientes
    const [activeEnrollments, pendingEnrollments] = await Promise.all([
      handleRequest<Enrollment[]>(API_CONFIG.ENDPOINTS.GET_ALL_ACTIVE, { method: 'GET' }),
      handleRequest<Enrollment[]>(API_CONFIG.ENDPOINTS.GET_ALL_PENDING, { method: 'GET' })
    ]);
    
    // Combinar y filtrar duplicados por ID
    const allNonCancelled = [...activeEnrollments, ...pendingEnrollments];
    const uniqueEnrollments = allNonCancelled.filter((enrollment, index, self) => 
      index === self.findIndex(e => e.id === enrollment.id)
    );
    
    // Normalizar datos de documentos para asegurar valores booleanos consistentes
    const normalizedEnrollments = uniqueEnrollments.map(normalizeEnrollmentDocuments);
    
    if (API_CONFIG.DEVELOPMENT.LOG_RESPONSES) {
      console.log(`📋 Matrículas activas/pendientes: ${normalizedEnrollments.length} (${activeEnrollments.length} activas + ${pendingEnrollments.length} pendientes)`);
    }
    
    return normalizedEnrollments;
  },

  /**
   * 🚫 Obtener matrículas canceladas
   * Obtiene solo las matrículas con estado CANCELLED
   */
  getCancelledEnrollmentsOnly: async (): Promise<Enrollment[]> => {
    const cancelledEnrollments = await handleRequest<Enrollment[]>(
      API_CONFIG.ENDPOINTS.GET_ALL_CANCELLED,
      { method: 'GET' }
    );
    
    // Normalizar datos de documentos para asegurar valores booleanos consistentes
    const normalizedCancelledEnrollments = cancelledEnrollments.map(normalizeEnrollmentDocuments);
    
    if (API_CONFIG.DEVELOPMENT.LOG_RESPONSES) {
      console.log(`🚫 Matrículas canceladas encontradas: ${normalizedCancelledEnrollments.length}`);
    }
    
    return normalizedCancelledEnrollments;
  },

  /**
   * 🔍 GET /api/v1/enrollments/{id}
   * Obtener matrícula por ID
   */
  getEnrollmentById: async (id: string): Promise<Enrollment> => {
    if (!id) {
      throw new Error('ID de matrícula es requerido');
    }

    const enrollment = await handleRequest<Enrollment>(
      API_CONFIG.ENDPOINTS.GET_BY_ID(id),
      { method: 'GET' }
    );

    // Normalizar datos de documentos para asegurar valores booleanos consistentes
    return normalizeEnrollmentDocuments(enrollment);
  },

  /**
   * 📝 POST /api/v1/enrollments
   * Crear nueva matrícula
   */
  createEnrollment: async (enrollment: CreateEnrollmentDto): Promise<Enrollment> => {
    // Validar datos antes de enviar
    const { isValid, errors } = enrollmentUtils.validateEnrollmentData(enrollment);
    if (!isValid) {
      throw new Error(
        `Validación fallida: ${Object.entries(errors)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ')}`
      );
    }

    const result = await handleRequest<Enrollment>(
      API_CONFIG.ENDPOINTS.CREATE,
      {
        method: 'POST',
        body: JSON.stringify(enrollment),
      }
    );

    // Normalizar datos de documentos en la respuesta
    return normalizeEnrollmentDocuments(result);
  },

  /**
   * ✏️ PUT /api/v1/enrollments/{id}
   * Actualizar matrícula existente
   */
  updateEnrollment: async (id: string, enrollment: UpdateEnrollmentDto): Promise<Enrollment> => {
    if (!id) {
      throw new Error('ID de matrícula es requerido para actualizar');
    }

    // Validar datos antes de enviar
    const { isValid, errors } = enrollmentUtils.validateEnrollmentData(enrollment);
    if (!isValid) {
      throw new Error(
        `Validación fallida: ${Object.entries(errors)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ')}`
      );
    }

    const result = await handleRequest<Enrollment>(
      API_CONFIG.ENDPOINTS.UPDATE(id),
      {
        method: 'PUT',
        body: JSON.stringify(enrollment),
      }
    );

    // Normalizar datos de documentos en la respuesta
    return normalizeEnrollmentDocuments(result);
  },

  /**
   * 🗑️ DELETE /api/v1/enrollments/{id}
   * Eliminar matrícula (soft delete)
   */
  deleteEnrollment: async (id: string): Promise<void> => {
    if (!id) {
      throw new Error('ID de matrícula es requerido para eliminar');
    }

    return handleRequest<void>(
      API_CONFIG.ENDPOINTS.DELETE(id),
      { method: 'DELETE' }
    );
  },

  /**
   * 🔄 PATCH /api/v1/enrollments/{id}/restore
   * Restaurar matrícula eliminada
   */
  restoreEnrollment: async (id: string): Promise<Enrollment> => {
    if (!id) {
      throw new Error('ID de matrícula es requerido para restaurar');
    }

    return handleRequest<Enrollment>(
      API_CONFIG.ENDPOINTS.RESTORE(id),
      { method: 'PUT' }
    );
  },

  /**
   * 🔄 Cambiar estado de matrícula (NUEVO ENDPOINT)
   * PUT /api/v1/enrollments/{id}/status?status={newStatus}
   */
  changeEnrollmentStatus: async (id: string, newStatus: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'CANCELLED'): Promise<Enrollment> => {
    if (!id) {
      throw new Error('ID de matrícula es requerido para cambiar estado');
    }

    if (!newStatus) {
      throw new Error('Nuevo estado es requerido');
    }

    // Validar que el estado sea válido
    const validStatuses = ['ACTIVE', 'INACTIVE', 'PENDING', 'CANCELLED'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Estado inválido: ${newStatus}. Estados válidos: ${validStatuses.join(', ')}`);
    }

    if (API_CONFIG.DEVELOPMENT.LOG_REQUESTS) {
      console.log(`🔄 Cambiando estado de matrícula ${id} a ${newStatus}`);
    }

    return handleRequest<Enrollment>(
      API_CONFIG.ENDPOINTS.CHANGE_STATUS(id, newStatus),
      {
        method: 'PUT',
      }
    );
  },

  /**
   * 🚫 Cancelar matrícula (cambiar estado a CANCELLED)
   * Usa el nuevo endpoint de cambio de estado
   */
  cancelEnrollment: async (id: string): Promise<Enrollment> => {
    return enrollmentService.changeEnrollmentStatus(id, 'CANCELLED');
  },

  /**
   * ⏳ Poner matrícula en estado pendiente
   * Usa el nuevo endpoint de cambio de estado
   */
  setPendingEnrollment: async (id: string): Promise<Enrollment> => {
    return enrollmentService.changeEnrollmentStatus(id, 'PENDING');
  },

  /**
   * ✅ Activar matrícula (cambiar estado a ACTIVE)
   * Usa el nuevo endpoint de cambio de estado
   */
  activateEnrollment: async (id: string): Promise<Enrollment> => {
    return enrollmentService.changeEnrollmentStatus(id, 'ACTIVE');
  },

  /**
   * ❌ Desactivar matrícula (cambiar estado a INACTIVE)
   * Usa el nuevo endpoint de cambio de estado
   */
  deactivateEnrollment: async (id: string): Promise<Enrollment> => {
    return enrollmentService.changeEnrollmentStatus(id, 'INACTIVE');
  },

  /**
   * 🔍 Verificar si una matrícula existe en el backend
   * Intenta obtener la matrícula por ID para verificar su existencia
   */
  verifyEnrollmentExists: async (id: string): Promise<boolean> => {
    try {
      await enrollmentService.getEnrollmentById(id);
      return true;
    } catch (error) {
      if (API_CONFIG.DEVELOPMENT.LOG_RESPONSES) {
        console.log(`🔍 Matrícula ${id} no existe en el backend`);
      }
      return false;
    }
  },

  /**
   * 🏫 GET /api/v1/enrollments/institution/{institutionId}
   * Obtener matrículas por institución
   */
  getEnrollmentsByInstitution: async (institutionId: string): Promise<Enrollment[]> => {
    if (!institutionId) {
      throw new Error('ID de institución es requerido');
    }

    return handleRequest<Enrollment[]>(
      API_CONFIG.ENDPOINTS.BY_INSTITUTION(institutionId),
      { method: 'GET' }
    );
  },

  /**
   * 👨‍🎓 GET /api/v1/enrollments/student/{studentId}
   * Obtener matrículas por estudiante
   */
  getEnrollmentsByStudent: async (studentId: string): Promise<Enrollment[]> => {
    if (!studentId) {
      throw new Error('ID de estudiante es requerido');
    }

    return handleRequest<Enrollment[]>(
      API_CONFIG.ENDPOINTS.BY_STUDENT(studentId),
      { method: 'GET' }
    );
  },

  /**
   * ✔️ GET /api/v1/enrollments/validate
   * Validar datos de matrícula
   */
  validateEnrollmentData: async (
    studentId: string, 
    institutionId: string, 
    classroomId: string
  ): Promise<any> => {
    if (!studentId || !institutionId || !classroomId) {
      throw new Error('ID de estudiante, institución y aula son requeridos para validación');
    }

    return handleRequest<any>(
      API_CONFIG.ENDPOINTS.VALIDATE(studentId, institutionId, classroomId),
      { method: 'GET' }
    );
  },

  /**
   * 🏫 GET /api/v1/enrollments/institutions/available
   * Obtener instituciones disponibles para matrícula
   */
  getAvailableInstitutions: async (): Promise<any[]> => {
    return handleRequest<any[]>(
      API_CONFIG.ENDPOINTS.INSTITUTIONS_AVAILABLE,
      { method: 'GET' }
    );
  },

  /**
   * 🏢 GET /api/v1/enrollments/institutions/complete
   * Obtener instituciones completas para gestión
   */
  getCompleteInstitutions: async (): Promise<any[]> => {
    return handleRequest<any[]>(
      API_CONFIG.ENDPOINTS.INSTITUTIONS_COMPLETE,
      { method: 'GET' }
    );
  },

  /**
   * 📊 GET /api/v1/enrollments/institutions/statistics
   * Obtener estadísticas de instituciones
   */
  getInstitutionStatistics: async (): Promise<any> => {
    return handleRequest<any>(
      API_CONFIG.ENDPOINTS.INSTITUTIONS_STATISTICS,
      { method: 'GET' }
    );
  },
};



// 🔧 UTILITY FUNCTIONS

/**
 * Normalizar un valor a booleano
 * Maneja diferentes tipos de datos que pueden venir del backend
 */
const normalizeBoolean = (value: any): boolean => {
  if (value === true || value === 'true' || value === 1 || value === '1') {
    return true;
  }
  return false;
};

/**
 * Normalizar ageGroup del backend al formato esperado por el frontend
 * Backend puede enviar: "3 años", "4 años", "5 años" o "3_AÑOS", "4_AÑOS", "5_AÑOS"
 * Frontend espera: "3_AÑOS", "4_AÑOS", "5_AÑOS"
 */
const normalizeAgeGroup = (ageGroup: string): string => {
  if (!ageGroup) return ageGroup;
  
  const ageGroupMap: Record<string, string> = {
    "3 años": "3_AÑOS",
    "4 años": "4_AÑOS", 
    "5 años": "5_AÑOS",
    "3_AÑOS": "3_AÑOS",
    "4_AÑOS": "4_AÑOS",
    "5_AÑOS": "5_AÑOS"
  };
  
  return ageGroupMap[ageGroup] || ageGroup;
};

/**
 * Calcular studentAge basándose en ageGroup si no existe
 * Backend: studentAge es Short (puede ser null)
 * Frontend: necesita number
 */
const calculateStudentAge = (enrollment: Enrollment): number | undefined => {
  // Si ya tiene edad válida, usarla
  if (enrollment.studentAge !== null && enrollment.studentAge !== undefined && enrollment.studentAge > 0) {
    return Number(enrollment.studentAge);
  }
  
  // Si no tiene edad, calcularla desde ageGroup
  const ageMap: Record<string, number> = {
    "3_AÑOS": 3,
    "4_AÑOS": 4,
    "5_AÑOS": 5,
    "3 años": 3,
    "4 años": 4,
    "5 años": 5
  };
  
  return enrollment.ageGroup ? ageMap[enrollment.ageGroup] : undefined;
};

/**
 * Normalizar datos de matrícula completos
 * Convierte valores null/undefined/string a tipos consistentes
 * Normaliza ageGroup y calcula studentAge si es necesario
 */
const normalizeEnrollmentDocuments = (enrollment: Enrollment): Enrollment => {
  // Normalizar ageGroup al formato esperado
  const normalizedAgeGroup = normalizeAgeGroup(enrollment.ageGroup);
  
  // Calcular edad basándose en el ageGroup normalizado
  const enrollmentWithNormalizedAge = { ...enrollment, ageGroup: normalizedAgeGroup };
  const calculatedAge = calculateStudentAge(enrollmentWithNormalizedAge);
  
  return {
    ...enrollment,
    birthCertificate: normalizeBoolean(enrollment.birthCertificate),
    studentDni: normalizeBoolean(enrollment.studentDni),
    guardianDni: normalizeBoolean(enrollment.guardianDni),
    vaccinationCard: normalizeBoolean(enrollment.vaccinationCard),
    disabilityCertificate: normalizeBoolean(enrollment.disabilityCertificate),
    utilityBill: normalizeBoolean(enrollment.utilityBill),
    psychologicalReport: normalizeBoolean(enrollment.psychologicalReport),
    studentPhoto: normalizeBoolean(enrollment.studentPhoto),
    healthRecord: normalizeBoolean(enrollment.healthRecord),
    signedEnrollmentForm: normalizeBoolean(enrollment.signedEnrollmentForm),
    dniVerification: normalizeBoolean(enrollment.dniVerification),
    // Normalizar ageGroup al formato esperado
    ageGroup: normalizedAgeGroup,
    // Calcular studentAge si no existe o es inválido
    studentAge: calculatedAge,
  };
};

export const enrollmentUtils = {
  /**
   * Validar datos de matrícula antes de enviar al backend
   * @param data Datos de la matrícula
   * @returns Objeto con resultado de validación y errores
   */
  validateEnrollmentData: (data: Partial<Enrollment>) => {
    const errors: Record<string, string> = {};

    // Campos requeridos según la documentación de la API
    const requiredFields = [
      { key: 'studentId', label: 'ID del estudiante' },
      { key: 'institutionId', label: 'ID de la institución' },
      { key: 'classroomId', label: 'ID del aula' },
      { key: 'academicYear', label: 'Año académico' },
      { key: 'academicPeriodId', label: 'ID del período académico' },
      { key: 'ageGroup', label: 'Grupo de edad' },
      { key: 'shift', label: 'Turno' },
      // Sección no es requerida en inicial - se diferencia por aulas
      { key: 'modality', label: 'Modalidad' },
    ];

    for (const field of requiredFields) {
      const value = data[field.key as keyof Enrollment];
      if (!value || (typeof value === 'string' && !value.trim())) {
        errors[field.key] = `${field.label} es requerido`;
      }
    }

    // Validar valores permitidos según la documentación
    const allowedValues = {
      enrollmentStatus: ['ACTIVE', 'INACTIVE', 'PENDING', 'CANCELLED'],
      enrollmentType: ['NUEVA', 'REINSCRIPCION'],
    };

    for (const [field, values] of Object.entries(allowedValues)) {
      const value = data[field as keyof Enrollment];
      if (value && !values.includes(value as string)) {
        errors[field] = `Valor no válido para ${field}: debe ser uno de ${values.join(', ')}`;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },



  /**
   * Calcular progreso de documentos de una matrícula
   * @param enrollment Matrícula
   * @returns Objeto con número de documentos completados, total y porcentaje
   */
  calculateDocumentProgress: (enrollment: Enrollment) => {
    const documents = [
      enrollment.birthCertificate ?? false,
      enrollment.studentDni ?? false,
      enrollment.guardianDni ?? false,
      enrollment.vaccinationCard ?? false,
      enrollment.disabilityCertificate ?? false,
      enrollment.utilityBill ?? false,
      enrollment.psychologicalReport ?? false,
      enrollment.studentPhoto ?? false,
      enrollment.healthRecord ?? false,
      enrollment.signedEnrollmentForm ?? false,
      enrollment.dniVerification ?? false,
    ];

    const completed = documents.filter(Boolean).length;
    const total = documents.length;
    const percentage = Math.round((completed / total) * 100);

    return { completed, total, percentage };
  },


};

// 🎯 FUNCIONES DE UTILIDAD Y HELPERS

/**
 * Función helper para manejar errores de API de forma consistente
 */
export const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Error desconocido';
};

/**
 * Función para validar y crear matrícula
 */
export const validateAndCreate = async (data: CreateEnrollmentDto): Promise<Enrollment> => {
  const validation = enrollmentUtils.validateEnrollmentData(data);
  if (!validation.isValid) {
    throw new Error(`Datos inválidos: ${Object.values(validation.errors).join(', ')}`);
  }
  return enrollmentService.createEnrollment(data);
};

/**
 * Función para validar y actualizar matrícula
 */
export const validateAndUpdate = async (id: string, data: UpdateEnrollmentDto): Promise<Enrollment> => {
  const validation = enrollmentUtils.validateEnrollmentData(data);
  if (!validation.isValid) {
    throw new Error(`Datos inválidos: ${Object.values(validation.errors).join(', ')}`);
  }
  return enrollmentService.updateEnrollment(id, data);
};

// 🔄 Compatibilidad con versiones anteriores
export const enrollmentsService = enrollmentService;