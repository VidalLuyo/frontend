/**
 * Servicio de Integración - Estudiantes e Instituciones
 * Basado en la documentación de integración del microservicio de matrículas
 */

import type {
  StudentResponse,
  InstitutionCompleteResponseDto,
  InstitutionWithUsersAndClassroomsResponseDto,
  Classroom,
  ContactMethod,
  Schedule,
  EnrollmentValidationResponse,
  InstitutionSummary,
  ApiError
} from '../models/integration.model';

// Configuración de integración local
const INTEGRATION_CONFIG = {
  ENROLLMENT_SERVICE_URL: import.meta.env.VITE_ENROLLMENT_API_URL || 'http://localhost:9082/api/v1',
  STUDENT_SERVICE_URL: import.meta.env.VITE_STUDENT_API_URL || 'http://localhost:9081',
  INSTITUTION_SERVICE_URL: import.meta.env.VITE_INSTITUTION_API_URL || 'http://localhost:9080',
  DEFAULT_TIMEOUT: 10000,
  MAX_RETRIES: 3,
  USE_MOCK_DATA: false,
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  ENABLE_LOGGING: import.meta.env.DEV === true,
} as const;

// Configuración de debug local
const DEBUG_CONFIG = {
  VERBOSE_LOGGING: import.meta.env.VITE_DEBUG_VERBOSE === 'true' || import.meta.env.DEV,
  LOG_API_RESPONSES: import.meta.env.VITE_DEBUG_API_LOGS === 'true',
  ALLOW_INACTIVE_STUDENTS: false,
  SKIP_STATUS_VALIDATION: false,
} as const;

// Funciones helper locales
const debugLog = (message: string, data?: any) => {
  if (DEBUG_CONFIG.VERBOSE_LOGGING) {
    if (data) {
      console.log(`🐛 ${message}`, data);
    } else {
      console.log(`🐛 ${message}`);
    }
  }
};

const logApiResponse = (endpoint: string, response: any) => {
  if (DEBUG_CONFIG.LOG_API_RESPONSES) {
    console.group(`📡 API Response: ${endpoint}`);
    console.log('Response:', response);
    console.groupEnd();
  }
};






// Helper function para manejar requests con timeout
const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeout: number = 10000
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

// Helper function para manejar requests con fallback a mock data
const handleIntegrationRequest = async <T,>(
  url: string,
  options: RequestInit = {},
  mockData?: T,
  timeout: number = 10000
): Promise<T> => {
  // Si está en modo mock, devolver mock data directamente
  if (INTEGRATION_CONFIG.USE_MOCK_DATA && mockData !== undefined) {
    if (INTEGRATION_CONFIG.ENABLE_LOGGING) {
      console.log(`🔧 Using mock data for ${url}:`, mockData);
    }
    return Promise.resolve(mockData);
  }

  try {
    if (INTEGRATION_CONFIG.ENABLE_LOGGING) {
      console.log(`🚀 Integration Request: ${options.method || 'GET'} ${url}`);
    }

    const response = await fetchWithTimeout(url, {
      ...options,
      headers: {
        ...INTEGRATION_CONFIG.DEFAULT_HEADERS,
        ...options.headers,
      },
    }, timeout);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorData: ApiError | null = null;

      try {
        errorData = await response.json();
        errorMessage = errorData?.message || errorMessage;
      } catch (e) {
        // Si no se puede parsear el JSON, usar el mensaje por defecto
      }

      throw new Error(errorMessage);
    }

    // Manejar respuestas 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error(`❌ Integration Request Failed for ${url}:`, error);
    
    // Fallback a mock data si está disponible
    if (mockData !== undefined && !INTEGRATION_CONFIG.USE_MOCK_DATA) {
      console.warn(`🔄 Falling back to mock data for ${url}:`, mockData);
      return mockData;
    }
    
    throw error instanceof Error ? error : new Error('Integration request failed');
  }
};

// ========================================
// SERVICIOS DE ESTUDIANTES
// ========================================

export const studentIntegrationService = {
  /**
   * Obtener estudiante por ID
   * Endpoint: GET /api/v1/students/{studentId}
   */
  getStudentById: async (studentId: string): Promise<StudentResponse> => {
    if (!studentId) {
      throw new Error('ID de estudiante es requerido');
    }

    const url = `${INTEGRATION_CONFIG.STUDENT_SERVICE_URL}/api/v1/students/${studentId}`;
    
    debugLog(`Obteniendo datos del estudiante: ${studentId} desde ${url}`);

    const response = await handleIntegrationRequest<StudentResponse>(
      url,
      { method: 'GET' },
      undefined,
      INTEGRATION_CONFIG.DEFAULT_TIMEOUT
    );

    logApiResponse(`GET /api/v1/students/${studentId}`, response);
    
    return response;
  },

  /**
   * Obtener estudiante por CUI
   * Endpoint: GET /api/v1/students/cui/{cui}
   */
  getStudentByCui: async (cui: string): Promise<StudentResponse> => {
    if (!cui) {
      throw new Error('CUI es requerido');
    }

    const url = `${INTEGRATION_CONFIG.STUDENT_SERVICE_URL}/api/v1/students/cui/${cui}`;
    
    debugLog(`Obteniendo estudiante por CUI: ${cui} desde ${url}`);

    try {
      const response = await handleIntegrationRequest<StudentResponse>(
        url,
        { method: 'GET' },
        undefined,
        INTEGRATION_CONFIG.DEFAULT_TIMEOUT
      );

      logApiResponse(`GET /api/v1/students/cui/${cui}`, response);
      
      return response;
    } catch (error) {
      // Manejar errores específicos de CUI duplicado
      if (error instanceof Error) {
        if (error.message.includes('non unique result')) {
          throw new Error(`Múltiples estudiantes encontrados con CUI ${cui}. Contacte al administrador para resolver la duplicación.`);
        } else if (error.message.includes('404') || error.message.includes('not found')) {
          throw new Error(`No se encontró ningún estudiante con CUI ${cui}.`);
        }
      }
      
      // Re-lanzar el error original si no es uno de los casos específicos
      throw error;
    }
  },

  /**
   * Buscar estudiantes por CUI (maneja múltiples resultados)
   * Alternativa cuando hay CUIs duplicados
   */
  searchStudentsByCui: async (cui: string): Promise<StudentResponse[]> => {
    if (!cui) {
      throw new Error('CUI es requerido');
    }

    // Como el endpoint /cui/{cui} falla con duplicados, 
    // podríamos usar un endpoint de búsqueda si existe
    // Por ahora, intentamos el endpoint normal y manejamos el error
    try {
      const response = await studentIntegrationService.getStudentByCui(cui);
      return [response]; // Si funciona, devolver como array
    } catch (error) {
      if (error instanceof Error && error.message.includes('Múltiples estudiantes')) {
        // Aquí podrías implementar una llamada a un endpoint de búsqueda
        // Por ejemplo: GET /api/v1/students/search?cui={cui}
        console.warn(`CUI duplicado detectado: ${cui}. Necesita resolución manual.`);
        throw new Error(`Se encontraron múltiples estudiantes con CUI ${cui}. Por favor, use la búsqueda por ID en su lugar.`);
      }
      throw error;
    }
  },

  /**
   * Validar estudiante para institución
   * Endpoint: Validación local basada en datos obtenidos
   */
  validateStudentForInstitution: async (studentId: string, institutionId: string): Promise<boolean> => {
    if (!studentId || !institutionId) {
      throw new Error('ID de estudiante e institución son requeridos');
    }

    try {
      const studentResponse = await studentIntegrationService.getStudentById(studentId);
      if (!studentResponse.success || !studentResponse.data) {
        return false;
      }

      // Validar que el estudiante esté activo
      if (studentResponse.data.status !== 'A') {
        return false;
      }

      // Validar que el estudiante pertenezca a la institución (si ya está matriculado)
      if (studentResponse.data.institutionId && studentResponse.data.institutionId !== institutionId) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating student for institution:', error);
      return false;
    }
  },
};

// ========================================
// SERVICIOS DE INSTITUCIONES
// ========================================

export const institutionIntegrationService = {
  /**
   * Obtener instituciones activas disponibles para matrícula
   * Endpoint: GET /api/v1/institutions/active
   */
  getAvailableInstitutions: async (): Promise<InstitutionSummary[]> => {
    const url = `${INTEGRATION_CONFIG.INSTITUTION_SERVICE_URL}/api/v1/institutions/active`;
    
    debugLog(`Obteniendo instituciones activas desde: ${url}`);

    try {
      // Según la documentación, este endpoint devuelve instituciones con aulas incluidas
      const response = await handleIntegrationRequest<any>(
        url,
        { method: 'GET' },
        undefined,
        INTEGRATION_CONFIG.DEFAULT_TIMEOUT
      );

      logApiResponse(`GET /api/v1/institutions/active`, response);

      // El API devuelve un wrapper con success, message y data
      let institutions: InstitutionCompleteResponseDto[];
      
      if (response && response.success && Array.isArray(response.data)) {
        // Formato con wrapper: { success: true, data: [...] }
        institutions = response.data;
        debugLog(`Instituciones encontradas (con wrapper): ${institutions.length}`);
      } else if (Array.isArray(response)) {
        // Formato directo: [...]
        institutions = response;
        debugLog(`Instituciones encontradas (directo): ${institutions.length}`);
      } else {
        debugLog(`Error: Formato de respuesta no reconocido`, response);
        throw new Error(`Formato de respuesta inválido del API de instituciones`);
      }

      // Convertir a formato InstitutionSummary
      return institutions.map(institution => {
        if (!institution || !institution.institutionInformation) {
          debugLog(`Institución inválida encontrada:`, institution);
          throw new Error('Datos de institución inválidos recibidos del API');
        }

        return {
          institutionId: institution.institutionId,
          institutionName: institution.institutionInformation.institutionName,
          institutionType: institution.institutionInformation.institutionType,
          institutionLevel: institution.institutionInformation.institutionLevel,
          address: institution.address,
          availableClassrooms: institution.classrooms ? institution.classrooms.length : 0,
          logoUrl: institution.institutionInformation.logoUrl
        };
      });
    } catch (error) {
      debugLog(`Error al obtener instituciones:`, error);
      throw error;
    }
  },

  /**
   * Obtener institución por ID con información completa
   * Endpoint: GET /api/v1/institutions/{institutionId}
   */
  getInstitutionById: async (institutionId: string): Promise<InstitutionWithUsersAndClassroomsResponseDto> => {
    if (!institutionId) {
      throw new Error('ID de institución es requerido');
    }

    const url = `${INTEGRATION_CONFIG.INSTITUTION_SERVICE_URL}/api/v1/institutions/${institutionId}`;

    debugLog(`Obteniendo institución por ID: ${institutionId}`);

    const response = await handleIntegrationRequest<any>(
      url,
      { method: 'GET' },
      undefined,
      INTEGRATION_CONFIG.DEFAULT_TIMEOUT
    );

    logApiResponse(`GET /api/v1/institutions/${institutionId}`, response);

    // Manejar formato de respuesta con wrapper
    if (response && response.success && response.data) {
      return response.data;
    } else if (response && response.institutionId) {
      // Formato directo
      return response;
    } else {
      throw new Error('Formato de respuesta inválido para institución');
    }
  },

  /**
   * Obtener aula por ID
   * Endpoint: GET /api/v1/classrooms/{classroomId}
   */
  getClassroomById: async (classroomId: string): Promise<Classroom> => {
    if (!classroomId) {
      throw new Error('ID de aula es requerido');
    }

    const url = `${INTEGRATION_CONFIG.INSTITUTION_SERVICE_URL}/api/v1/classrooms/${classroomId}`;

    debugLog(`Obteniendo aula por ID: ${classroomId}`);

    const response = await handleIntegrationRequest<any>(
      url,
      { method: 'GET' },
      undefined,
      INTEGRATION_CONFIG.DEFAULT_TIMEOUT
    );

    logApiResponse(`GET /api/v1/classrooms/${classroomId}`, response);

    // Manejar formato de respuesta con wrapper
    if (response && response.success && response.data) {
      return response.data;
    } else if (response && response.classroomId) {
      // Formato directo
      return response;
    } else {
      throw new Error('Formato de respuesta inválido para aula');
    }
  },

  /**
   * Obtener aulas activas
   * Endpoint: GET /api/v1/classrooms/active
   */
  getActiveClassrooms: async (): Promise<Classroom[]> => {
    const url = `${INTEGRATION_CONFIG.INSTITUTION_SERVICE_URL}/api/v1/classrooms/active`;

    debugLog(`Obteniendo aulas activas desde: ${url}`);

    const response = await handleIntegrationRequest<any>(
      url,
      { method: 'GET' },
      undefined,
      INTEGRATION_CONFIG.DEFAULT_TIMEOUT
    );

    logApiResponse(`GET /api/v1/classrooms/active`, response);

    // Manejar formato de respuesta con wrapper
    if (response && response.success && Array.isArray(response.data)) {
      return response.data;
    } else if (Array.isArray(response)) {
      return response;
    } else {
      throw new Error('Formato de respuesta inválido para aulas activas');
    }
  },

  /**
   * Obtener todas las instituciones (activas e inactivas)
   * Endpoint: GET /api/v1/institutions
   */
  getAllInstitutions: async (): Promise<InstitutionCompleteResponseDto[]> => {
    const url = `${INTEGRATION_CONFIG.INSTITUTION_SERVICE_URL}/api/v1/institutions`;

    return handleIntegrationRequest<InstitutionCompleteResponseDto[]>(
      url,
      { method: 'GET' },
      undefined,
      INTEGRATION_CONFIG.DEFAULT_TIMEOUT
    );
  },

  /**
   * Obtener instituciones inactivas
   * Endpoint: GET /api/v1/institutions/inactive
   */
  getInactiveInstitutions: async (): Promise<InstitutionCompleteResponseDto[]> => {
    const url = `${INTEGRATION_CONFIG.INSTITUTION_SERVICE_URL}/api/v1/institutions/inactive`;

    return handleIntegrationRequest<InstitutionCompleteResponseDto[]>(
      url,
      { method: 'GET' },
      undefined,
      INTEGRATION_CONFIG.DEFAULT_TIMEOUT
    );
  },

  /**
   * Obtener instituciones con usuarios y aulas completas
   * Endpoint: GET /api/v1/institutions/with-users-classrooms
   */
  getInstitutionsWithUsersAndClassrooms: async (): Promise<InstitutionWithUsersAndClassroomsResponseDto[]> => {
    const url = `${INTEGRATION_CONFIG.INSTITUTION_SERVICE_URL}/api/v1/institutions/with-users-classrooms`;

    return handleIntegrationRequest<InstitutionWithUsersAndClassroomsResponseDto[]>(
      url,
      { method: 'GET' },
      undefined,
      INTEGRATION_CONFIG.DEFAULT_TIMEOUT
    );
  },

  /**
   * Obtener todas las aulas (activas e inactivas)
   * Endpoint: GET /api/v1/classrooms
   */
  getAllClassrooms: async (): Promise<Classroom[]> => {
    const url = `${INTEGRATION_CONFIG.INSTITUTION_SERVICE_URL}/api/v1/classrooms`;

    return handleIntegrationRequest<Classroom[]>(
      url,
      { method: 'GET' },
      undefined,
      INTEGRATION_CONFIG.DEFAULT_TIMEOUT
    );
  },

  /**
   * Obtener aulas inactivas
   * Endpoint: GET /api/v1/classrooms/inactive
   */
  getInactiveClassrooms: async (): Promise<Classroom[]> => {
    const url = `${INTEGRATION_CONFIG.INSTITUTION_SERVICE_URL}/api/v1/classrooms/inactive`;

    return handleIntegrationRequest<Classroom[]>(
      url,
      { method: 'GET' },
      undefined,
      INTEGRATION_CONFIG.DEFAULT_TIMEOUT
    );
  },

  /**
   * Validar institución y aula
   * Validación local basada en datos obtenidos
   */
  validateInstitutionAndClassroom: async (institutionId: string, classroomId: string): Promise<boolean> => {
    if (!institutionId || !classroomId) {
      throw new Error('ID de institución y aula son requeridos');
    }

    try {
      // Obtener institución y verificar que esté activa
      const institution = await institutionIntegrationService.getInstitutionById(institutionId);
      if (!institution || institution.status !== 'ACTIVE') {
        return false;
      }

      // Obtener aula y verificar que esté activa
      const classroom = await institutionIntegrationService.getClassroomById(classroomId);
      if (!classroom || classroom.status !== 'ACTIVE') {
        return false;
      }

      // Verificar que el aula pertenezca a la institución
      if (classroom.institutionId !== institutionId) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating institution and classroom:', error);
      return false;
    }
  },
};

// ========================================
// SERVICIOS DE VALIDACIÓN DE MATRÍCULA
// ========================================

export const enrollmentValidationService = {
  /**
   * Validar datos completos de matrícula
   * Validación local usando los microservicios individuales
   */
  validateEnrollmentData: async (
    studentId: string,
    institutionId: string,
    classroomId: string
  ): Promise<EnrollmentValidationResponse> => {
    if (!studentId || !institutionId || !classroomId) {
      throw new Error('ID de estudiante, institución y aula son requeridos');
    }

    try {
      // Validar estudiante
      const studentResponse = await studentIntegrationService.getStudentById(studentId);
      const studentValid = studentResponse.success && 
                          studentResponse.data && 
                          integrationUtils.isStudentActive(studentResponse.data.status);

      // Validar institución
      const institution = await institutionIntegrationService.getInstitutionById(institutionId);
      const institutionValid = institution && integrationUtils.isInstitutionActive(institution.status);

      // Validar aula
      const classroom = await institutionIntegrationService.getClassroomById(classroomId);
      const classroomValid = classroom && 
                            integrationUtils.isClassroomActive(classroom.status) &&
                            classroom.institutionId === institutionId;

      const result: EnrollmentValidationResponse = {
        studentValid,
        institutionValid,
        classroomValid,
        studentName: studentValid ? integrationUtils.formatStudentName(studentResponse.data.personalInfo) : undefined,
        institutionName: institutionValid ? institution.institutionInformation.institutionName : undefined,
        classroomName: classroomValid ? classroom.classroomName : undefined,
        classroomCapacity: classroomValid ? classroom.capacity : undefined,
        validationMessage: '',
        valid: studentValid && institutionValid && classroomValid
      };

      // Generar mensaje de validación
      if (!result.valid) {
        const issues = [];
        if (!studentValid) issues.push('estudiante no válido o inactivo');
        if (!institutionValid) issues.push('institución no válida o inactiva');
        if (!classroomValid) issues.push('aula no válida o no pertenece a la institución');
        result.validationMessage = `Problemas encontrados: ${issues.join(', ')}`;
      } else {
        result.validationMessage = 'Todos los datos son válidos para la matrícula';
      }

      return result;
    } catch (error) {
      console.error('Error validating enrollment data:', error);
      return {
        studentValid: false,
        institutionValid: false,
        classroomValid: false,
        validationMessage: 'Error al validar datos: ' + (error instanceof Error ? error.message : 'Error desconocido'),
        valid: false
      };
    }
  },
};

// ========================================
// UTILIDADES DE INTEGRACIÓN
// ========================================

export const integrationUtils = {
  /**
   * Formatear nombre completo del estudiante
   */
  formatStudentName: (personalInfo: { names: string; lastNames: string }): string => {
    return `${personalInfo.names} ${personalInfo.lastNames}`.trim();
  },

  /**
   * Formatear dirección completa
   */
  formatAddress: (address: { street: string; district: string; province: string; department: string }): string => {
    return `${address.street}, ${address.district}, ${address.province}, ${address.department}`;
  },

  /**
   * Verificar si un estudiante está activo
   */
  isStudentActive: (status: string): boolean => {
    // Si está en modo debug y se permite estudiantes inactivos, siempre retornar true
    if (DEBUG_CONFIG.ALLOW_INACTIVE_STUDENTS || DEBUG_CONFIG.SKIP_STATUS_VALIDATION) {
      debugLog(`Debug mode: Permitiendo estudiante con estado "${status}"`);
      return true;
    }
    
    // Soportar ambos formatos: 'A' (formato corto) y 'ACTIVE' (formato largo)
    const isActive = status === 'A' || status === 'ACTIVE';
    debugLog(`Validando estado de estudiante: "${status}" -> ${isActive ? 'ACTIVO' : 'INACTIVO'}`);
    return isActive;
  },

  /**
   * Verificar si una institución está activa
   */
  isInstitutionActive: (status: string): boolean => {
    return status === 'ACTIVE';
  },

  /**
   * Verificar si un aula está activa
   */
  isClassroomActive: (status: string): boolean => {
    return status === 'ACTIVE';
  },

  /**
   * Obtener color de estado
   */
  getStatusColor: (status: string): string => {
    switch (status) {
      case 'A':
      case 'ACTIVE':
        return '#4CAF50'; // Verde
      case 'I':
      case 'INACTIVE':
        return '#F44336'; // Rojo
      case 'T':
      case 'TRANSFERRED':
        return '#FF9800'; // Naranja
      case 'G':
      case 'GRADUATED':
        return '#2196F3'; // Azul
      default:
        return '#9E9E9E'; // Gris
    }
  },

  /**
   * Obtener texto de estado
   */
  getStatusText: (status: string): string => {
    switch (status) {
      case 'A':
      case 'ACTIVE':
        return 'Activo';
      case 'I':
      case 'INACTIVE':
        return 'Inactivo';
      case 'T':
      case 'TRANSFERRED':
        return 'Transferido';
      case 'G':
      case 'GRADUATED':
        return 'Graduado';
      default:
        return 'Desconocido';
    }
  },

  /**
   * Validar capacidad de aula
   */
  validateClassroomCapacity: (classroom: Classroom, currentEnrollments: number): boolean => {
    return classroom.capacity > currentEnrollments;
  },

  /**
   * Obtener información de contacto formateada
   */
  formatContactMethods: (contactMethods: ContactMethod[]): string => {
    return contactMethods
      .map(contact => `${contact.type}: ${contact.value}`)
      .join(', ');
  },

  /**
   * Verificar si una institución tiene aulas disponibles
   */
  hasAvailableClassrooms: (institution: InstitutionCompleteResponseDto | InstitutionWithUsersAndClassroomsResponseDto): boolean => {
    return institution.classrooms && 
           institution.classrooms.some(classroom => classroom.status === 'ACTIVE');
  },

  /**
   * Obtener horarios formateados
   */
  formatSchedules: (schedules: Schedule[]): string => {
    return schedules
      .map(schedule => `${schedule.type}: ${schedule.entryTime} - ${schedule.exitTime}`)
      .join(', ');
  },
};

// Exportar servicios principales
export const integrationService = {
  student: studentIntegrationService,
  institution: institutionIntegrationService,
  validation: enrollmentValidationService,
  utils: integrationUtils,
};