/**
 * Servicio de Integración de Matrículas - Endpoints específicos de integración
 * Basado en la documentación de API del microservicio de matrículas
 */

// Configuración local
const INTEGRATION_CONFIG = {
  ENROLLMENT_SERVICE_URL: import.meta.env.VITE_ENROLLMENT_API_URL || 'http://localhost:9082/api/v1',
  STUDENT_SERVICE_URL: import.meta.env.VITE_STUDENT_API_URL || 'http://localhost:9081',
  INSTITUTION_SERVICE_URL: import.meta.env.VITE_INSTITUTION_API_URL || 'http://localhost:9080',
  DEFAULT_TIMEOUT: 10000,
  MAX_RETRIES: 3,
  USE_MOCK_DATA: false,
  ENABLE_LOGGING: import.meta.env.DEV === true,
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
} as const;

// 🌐 Configuración de API - Endpoints de integración
const INTEGRATION_API_CONFIG = {
  BASE_URL: INTEGRATION_CONFIG.ENROLLMENT_SERVICE_URL,
  TIMEOUT: INTEGRATION_CONFIG.DEFAULT_TIMEOUT,
  RETRIES: INTEGRATION_CONFIG.MAX_RETRIES,
  DEFAULT_HEADERS: INTEGRATION_CONFIG.DEFAULT_HEADERS,
  ENDPOINTS: {
    // Endpoints de integración de estudiantes
    STUDENT_BY_ID: (studentId: string) => `/integration/students/${studentId}`,
    STUDENT_BY_CUI: (cui: string) => `/integration/students/cui/${cui}`,
    
    // Endpoints de integración de instituciones
    INSTITUTIONS_ACTIVE: '/integration/institutions',
    INSTITUTIONS_ALL: '/integration/institutions/all',
    INSTITUTIONS_INACTIVE: '/integration/institutions/inactive',
    INSTITUTION_BY_ID: (institutionId: string) => `/integration/institutions/${institutionId}`,
    INSTITUTIONS_WITH_USERS_CLASSROOMS: '/integration/institutions/with-users-classrooms',
    
    // Endpoints de integración de aulas
    CLASSROOMS_ACTIVE: '/integration/classrooms',
    CLASSROOMS_ALL: '/integration/classrooms/all',
    CLASSROOMS_INACTIVE: '/integration/classrooms/inactive',
    CLASSROOM_BY_ID: (classroomId: string) => `/integration/classrooms/${classroomId}`,
    
    // Endpoints de validación de integración
    VALIDATE_STUDENT_INSTITUTION: (studentId: string, institutionId: string) => 
      `/integration/validate/student/${studentId}/institution/${institutionId}`,
    VALIDATE_INSTITUTION_CLASSROOM: (institutionId: string, classroomId: string) => 
      `/integration/validate/institution/${institutionId}/classroom/${classroomId}`,
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
  timeout: number = INTEGRATION_API_CONFIG.TIMEOUT
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

// Helper function para manejar requests con reintentos
const handleIntegrationRequest = async <T,>(
  endpoint: string,
  options: RequestInit = {},
  retries: number = INTEGRATION_API_CONFIG.RETRIES
): Promise<T> => {
  const url = `${INTEGRATION_API_CONFIG.BASE_URL}${endpoint}`;
  const method = options.method || 'GET';

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (INTEGRATION_API_CONFIG.DEVELOPMENT.LOG_REQUESTS) {
        console.log(`🚀 Integration API Request (Attempt ${attempt}): ${method} ${url}`);
      }

      const response = await fetchWithTimeout(url, {
        ...options,
        headers: {
          ...INTEGRATION_API_CONFIG.DEFAULT_HEADERS,
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

        if (INTEGRATION_API_CONFIG.DEVELOPMENT.LOG_RESPONSES) {
          console.error(`❌ Integration API Error: ${response.status} ${url}`, errorData);
        }

        throw new Error(errorMessage);
      }

      // Manejar respuestas 204 No Content
      if (response.status === 204) {
        if (INTEGRATION_API_CONFIG.DEVELOPMENT.LOG_RESPONSES) {
          console.log(`✅ Integration API Success: ${response.status} No Content`);
        }
        return undefined as T;
      }

      const data = await response.json();
      if (INTEGRATION_API_CONFIG.DEVELOPMENT.LOG_RESPONSES) {
        console.log(`✅ Integration API Success: ${response.status} ${url}`, data);
      }
      return data;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.error(`❌ Integration API Failed for ${url} (Attempt ${attempt}):`, lastError);
    }
  }

  throw lastError || new Error('All retry attempts failed');
};

// 📝 ENROLLMENT INTEGRATION API FUNCTIONS
export const enrollmentIntegrationService = {
  // ========================================
  // SERVICIOS DE ESTUDIANTES
  // ========================================

  /**
   * 👨‍🎓 GET /api/v1/integration/students/{studentId}
   * Obtener datos de un estudiante por ID
   */
  getStudentById: async (studentId: string): Promise<any> => {
    if (!studentId) {
      throw new Error('ID de estudiante es requerido');
    }

    return handleIntegrationRequest<any>(
      INTEGRATION_API_CONFIG.ENDPOINTS.STUDENT_BY_ID(studentId),
      { method: 'GET' }
    );
  },

  /**
   * 🆔 GET /api/v1/integration/students/cui/{cui}
   * Obtener datos de un estudiante por CUI
   */
  getStudentByCui: async (cui: string): Promise<any> => {
    if (!cui) {
      throw new Error('CUI es requerido');
    }

    return handleIntegrationRequest<any>(
      INTEGRATION_API_CONFIG.ENDPOINTS.STUDENT_BY_CUI(cui),
      { method: 'GET' }
    );
  },

  // ========================================
  // SERVICIOS DE INSTITUCIONES
  // ========================================

  /**
   * 🏫 GET /api/v1/integration/institutions
   * Obtener instituciones activas
   */
  getActiveInstitutions: async (): Promise<any[]> => {
    return handleIntegrationRequest<any[]>(
      INTEGRATION_API_CONFIG.ENDPOINTS.INSTITUTIONS_ACTIVE,
      { method: 'GET' }
    );
  },

  /**
   * 🏢 GET /api/v1/integration/institutions/all
   * Obtener todas las instituciones
   */
  getAllInstitutions: async (): Promise<any[]> => {
    return handleIntegrationRequest<any[]>(
      INTEGRATION_API_CONFIG.ENDPOINTS.INSTITUTIONS_ALL,
      { method: 'GET' }
    );
  },

  /**
   * 🏚️ GET /api/v1/integration/institutions/inactive
   * Obtener instituciones inactivas
   */
  getInactiveInstitutions: async (): Promise<any[]> => {
    return handleIntegrationRequest<any[]>(
      INTEGRATION_API_CONFIG.ENDPOINTS.INSTITUTIONS_INACTIVE,
      { method: 'GET' }
    );
  },

  /**
   * 🏫 GET /api/v1/integration/institutions/{institutionId}
   * Obtener una institución por ID
   */
  getInstitutionById: async (institutionId: string): Promise<any> => {
    if (!institutionId) {
      throw new Error('ID de institución es requerido');
    }

    return handleIntegrationRequest<any>(
      INTEGRATION_API_CONFIG.ENDPOINTS.INSTITUTION_BY_ID(institutionId),
      { method: 'GET' }
    );
  },

  /**
   * 👥 GET /api/v1/integration/institutions/with-users-classrooms
   * Obtener instituciones con usuarios y aulas
   */
  getInstitutionsWithUsersAndClassrooms: async (): Promise<any[]> => {
    return handleIntegrationRequest<any[]>(
      INTEGRATION_API_CONFIG.ENDPOINTS.INSTITUTIONS_WITH_USERS_CLASSROOMS,
      { method: 'GET' }
    );
  },

  // ========================================
  // SERVICIOS DE AULAS
  // ========================================

  /**
   * 🚪 GET /api/v1/integration/classrooms
   * Obtener aulas activas
   */
  getActiveClassrooms: async (): Promise<any[]> => {
    return handleIntegrationRequest<any[]>(
      INTEGRATION_API_CONFIG.ENDPOINTS.CLASSROOMS_ACTIVE,
      { method: 'GET' }
    );
  },

  /**
   * 🏛️ GET /api/v1/integration/classrooms/all
   * Obtener todas las aulas
   */
  getAllClassrooms: async (): Promise<any[]> => {
    return handleIntegrationRequest<any[]>(
      INTEGRATION_API_CONFIG.ENDPOINTS.CLASSROOMS_ALL,
      { method: 'GET' }
    );
  },

  /**
   * 🚫 GET /api/v1/integration/classrooms/inactive
   * Obtener aulas inactivas
   */
  getInactiveClassrooms: async (): Promise<any[]> => {
    return handleIntegrationRequest<any[]>(
      INTEGRATION_API_CONFIG.ENDPOINTS.CLASSROOMS_INACTIVE,
      { method: 'GET' }
    );
  },

  /**
   * 🚪 GET /api/v1/integration/classrooms/{classroomId}
   * Obtener un aula por ID
   */
  getClassroomById: async (classroomId: string): Promise<any> => {
    if (!classroomId) {
      throw new Error('ID de aula es requerido');
    }

    return handleIntegrationRequest<any>(
      INTEGRATION_API_CONFIG.ENDPOINTS.CLASSROOM_BY_ID(classroomId),
      { method: 'GET' }
    );
  },

  // ========================================
  // SERVICIOS DE VALIDACIÓN
  // ========================================

  /**
   * ✅ GET /api/v1/integration/validate/student/{studentId}/institution/{institutionId}
   * Validar estudiante para matrícula
   */
  validateStudentForInstitution: async (studentId: string, institutionId: string): Promise<any> => {
    if (!studentId || !institutionId) {
      throw new Error('ID de estudiante e institución son requeridos');
    }

    return handleIntegrationRequest<any>(
      INTEGRATION_API_CONFIG.ENDPOINTS.VALIDATE_STUDENT_INSTITUTION(studentId, institutionId),
      { method: 'GET' }
    );
  },

  /**
   * ✔️ GET /api/v1/integration/validate/institution/{institutionId}/classroom/{classroomId}
   * Validar institución y aula
   */
  validateInstitutionAndClassroom: async (institutionId: string, classroomId: string): Promise<any> => {
    if (!institutionId || !classroomId) {
      throw new Error('ID de institución y aula son requeridos');
    }

    return handleIntegrationRequest<any>(
      INTEGRATION_API_CONFIG.ENDPOINTS.VALIDATE_INSTITUTION_CLASSROOM(institutionId, classroomId),
      { method: 'GET' }
    );
  },
};

// 🔧 UTILITY FUNCTIONS para integración
export const enrollmentIntegrationUtils = {
  /**
   * Formatear respuesta de estudiante
   */
  formatStudentResponse: (student: any) => {
    if (!student) return null;
    
    return {
      id: student.id || student.studentId,
      name: student.name || `${student.names || ''} ${student.lastNames || ''}`.trim(),
      cui: student.cui,
      status: student.status,
      institutionId: student.institutionId,
    };
  },

  /**
   * Formatear respuesta de institución
   */
  formatInstitutionResponse: (institution: any) => {
    if (!institution) return null;
    
    return {
      id: institution.id || institution.institutionId,
      name: institution.name || institution.institutionName,
      type: institution.type || institution.institutionType,
      level: institution.level || institution.institutionLevel,
      status: institution.status,
      address: institution.address,
      classrooms: institution.classrooms || [],
    };
  },

  /**
   * Formatear respuesta de aula
   */
  formatClassroomResponse: (classroom: any) => {
    if (!classroom) return null;
    
    return {
      id: classroom.id || classroom.classroomId,
      name: classroom.name || classroom.classroomName,
      capacity: classroom.capacity,
      status: classroom.status,
      institutionId: classroom.institutionId,
      level: classroom.level || classroom.educationalLevel,
    };
  },

  /**
   * Validar respuesta de API
   */
  validateApiResponse: (response: any, expectedFields: string[] = []) => {
    if (!response) {
      return { isValid: false, error: 'Respuesta vacía' };
    }

    const missingFields = expectedFields.filter(field => !(field in response));
    if (missingFields.length > 0) {
      return { 
        isValid: false, 
        error: `Campos faltantes: ${missingFields.join(', ')}` 
      };
    }

    return { isValid: true };
  },

  /**
   * Manejar errores de integración
   */
  handleIntegrationError: (error: unknown, context: string): string => {
    console.error(`Error en integración (${context}):`, error);
    
    if (error instanceof Error) {
      return `Error en ${context}: ${error.message}`;
    }
    
    return `Error desconocido en ${context}`;
  },
};

// 🎯 FUNCIONES DE UTILIDAD PRINCIPALES

/**
 * Función para obtener datos completos de matrícula
 */
export const getCompleteEnrollmentData = async (
  studentId: string, 
  institutionId: string, 
  classroomId: string
) => {
  try {
    const [student, institution, classroom] = await Promise.all([
      enrollmentIntegrationService.getStudentById(studentId),
      enrollmentIntegrationService.getInstitutionById(institutionId),
      enrollmentIntegrationService.getClassroomById(classroomId),
    ]);

    return {
      student: enrollmentIntegrationUtils.formatStudentResponse(student),
      institution: enrollmentIntegrationUtils.formatInstitutionResponse(institution),
      classroom: enrollmentIntegrationUtils.formatClassroomResponse(classroom),
    };
  } catch (error) {
    throw new Error(
      enrollmentIntegrationUtils.handleIntegrationError(error, 'obtener datos completos de matrícula')
    );
  }
};

/**
 * Función para validar datos completos de matrícula
 */
export const validateCompleteEnrollmentData = async (
  studentId: string, 
  institutionId: string, 
  classroomId: string
) => {
  try {
    const [studentValidation, classroomValidation] = await Promise.all([
      enrollmentIntegrationService.validateStudentForInstitution(studentId, institutionId),
      enrollmentIntegrationService.validateInstitutionAndClassroom(institutionId, classroomId),
    ]);

    return {
      studentValid: studentValidation?.valid || false,
      classroomValid: classroomValidation?.valid || false,
      overall: (studentValidation?.valid || false) && (classroomValidation?.valid || false),
      details: {
        student: studentValidation,
        classroom: classroomValidation,
      },
    };
  } catch (error) {
    throw new Error(
      enrollmentIntegrationUtils.handleIntegrationError(error, 'validar datos de matrícula')
    );
  }
};