/**
 * Servicio de Períodos Académicos - Integración completa con Backend
 * Basado en la documentación de API del microservicio de matrículas
 */

import type { 
  AcademicPeriod, 
  CreateAcademicPeriodDto, 
  UpdateAcademicPeriodDto,
  AcademicPeriodFilters,
  AcademicPeriodStats
} from '../models/academicPeriod.model';

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
    // Endpoints principales según documentación
    GET_ALL: '/academic-periods',
    GET_BY_ID: (id: string) => `/academic-periods/${id}`,
    CREATE: '/academic-periods',
    UPDATE: (id: string) => `/academic-periods/${id}`,
    DELETE: (id: string) => `/academic-periods/${id}`,
    RESTORE: (id: string) => `/academic-periods/${id}/restore`,
    
    // Endpoints de filtrado
    BY_INSTITUTION: (institutionId: string) => `/academic-periods/institution/${institutionId}`,
    BY_YEAR: (academicYear: string) => `/academic-periods/year/${academicYear}`,
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

// Helper function para manejar requests con reintentos
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
        console.log(`🚀 Academic Period API Request (Attempt ${attempt}): ${method} ${url}`);
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
          console.error(`❌ Academic Period API Error: ${response.status} ${url}`, errorData);
        }

        // Manejar diferentes tipos de errores
        if (response.status === 400 && errorData && 'fieldErrors' in errorData) {
          const validationErrors = errorData.fieldErrors as Record<string, string>;
          const errorMessages = Object.entries(validationErrors)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
          throw new Error(`${errorMessage}: ${errorMessages}`);
        } else if (response.status === 404) {
          throw new Error('Período académico no encontrado');
        } else if (response.status === 500) {
          throw new Error(errorMessage || 'Error interno del servidor');
        } else {
          throw new Error(errorMessage);
        }
      }

      // Manejar respuestas 204 No Content
      if (response.status === 204) {
        if (API_CONFIG.DEVELOPMENT.LOG_RESPONSES) {
          console.log(`✅ Academic Period API Success: ${response.status} No Content`);
        }
        return undefined as T;
      }

      const data = await response.json();
      if (API_CONFIG.DEVELOPMENT.LOG_RESPONSES) {
        console.log(`✅ Academic Period API Success: ${response.status} ${url}`, data);
      }
      return data;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.error(`❌ Academic Period API Failed for ${url} (Attempt ${attempt}):`, lastError);
    }
  }

  throw lastError || new Error('All retry attempts failed');
};

// 📝 ACADEMIC PERIOD API FUNCTIONS - Integración completa con Backend
export const academicPeriodService = {
  /**
   * 📋 GET /api/v1/academic-periods
   * Obtener todos los períodos académicos
   */
  getAllAcademicPeriods: async (): Promise<AcademicPeriod[]> => {
    return handleRequest<AcademicPeriod[]>(
      API_CONFIG.ENDPOINTS.GET_ALL,
      { method: 'GET' }
    );
  },

  /**
   * 🔍 GET /api/v1/academic-periods/{id}
   * Obtener período académico por ID
   */
  getAcademicPeriodById: async (id: string): Promise<AcademicPeriod> => {
    if (!id) {
      throw new Error('ID de período académico es requerido');
    }

    return handleRequest<AcademicPeriod>(
      API_CONFIG.ENDPOINTS.GET_BY_ID(id),
      { method: 'GET' }
    );
  },

  /**
   * 📝 POST /api/v1/academic-periods
   * Crear nuevo período académico
   */
  createAcademicPeriod: async (period: CreateAcademicPeriodDto): Promise<AcademicPeriod> => {
    // Log para debug
    if (API_CONFIG.DEVELOPMENT.LOG_REQUESTS) {
      console.log('🎯 Creating academic period:', period);
    }

    // Validar datos antes de enviar
    const { isValid, errors } = academicPeriodUtils.validateAcademicPeriodData(period);
    if (!isValid) {
      throw new Error(
        `Validación fallida: ${Object.entries(errors)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ')}`
      );
    }

    return handleRequest<AcademicPeriod>(
      API_CONFIG.ENDPOINTS.CREATE,
      {
        method: 'POST',
        body: JSON.stringify(period),
      }
    );
  },

  /**
   * ✏️ PUT /api/v1/academic-periods/{id}
   * Actualizar período académico existente
   */
  updateAcademicPeriod: async (id: string, period: UpdateAcademicPeriodDto): Promise<AcademicPeriod> => {
    if (!id) {
      throw new Error('ID de período académico es requerido para actualizar');
    }

    // Validar datos antes de enviar
    const { isValid, errors } = academicPeriodUtils.validateAcademicPeriodData(period);
    if (!isValid) {
      throw new Error(
        `Validación fallida: ${Object.entries(errors)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ')}`
      );
    }

    return handleRequest<AcademicPeriod>(
      API_CONFIG.ENDPOINTS.UPDATE(id),
      {
        method: 'PUT',
        body: JSON.stringify(period),
      }
    );
  },

  /**
   * 🗑️ DELETE /api/v1/academic-periods/{id}
   * Eliminar período académico (soft delete)
   */
  deleteAcademicPeriod: async (id: string): Promise<void> => {
    if (!id) {
      throw new Error('ID de período académico es requerido para eliminar');
    }

    return handleRequest<void>(
      API_CONFIG.ENDPOINTS.DELETE(id),
      { method: 'DELETE' }
    );
  },

  /**
   * 🔄 PATCH /api/v1/academic-periods/{id}/restore
   * Restaurar período académico eliminado
   */
  restoreAcademicPeriod: async (id: string): Promise<AcademicPeriod> => {
    if (!id) {
      throw new Error('ID de período académico es requerido para restaurar');
    }

    return handleRequest<AcademicPeriod>(
      API_CONFIG.ENDPOINTS.RESTORE(id),
      { method: 'PATCH' }
    );
  },

  /**
   * 🏫 GET /api/v1/academic-periods/institution/{institutionId}
   * Obtener períodos académicos por institución
   */
  getAcademicPeriodsByInstitution: async (institutionId: string): Promise<AcademicPeriod[]> => {
    if (!institutionId) {
      throw new Error('ID de institución es requerido');
    }

    return handleRequest<AcademicPeriod[]>(
      API_CONFIG.ENDPOINTS.BY_INSTITUTION(institutionId),
      { method: 'GET' }
    );
  },

  /**
   * 📅 GET /api/v1/academic-periods/year/{academicYear}
   * Obtener períodos académicos por año académico
   */
  getAcademicPeriodsByYear: async (academicYear: string): Promise<AcademicPeriod[]> => {
    if (!academicYear) {
      throw new Error('Año académico es requerido');
    }

    return handleRequest<AcademicPeriod[]>(
      API_CONFIG.ENDPOINTS.BY_YEAR(academicYear),
      { method: 'GET' }
    );
  },
};

// 🔧 UTILITY FUNCTIONS
export const academicPeriodUtils = {
  /**
   * Validar datos de período académico antes de enviar al backend
   */
  validateAcademicPeriodData: (data: Partial<AcademicPeriod>) => {
    const errors: Record<string, string> = {};

    // Campos requeridos según la documentación de la API
    const requiredFields = [
      { key: 'institutionId', label: 'ID de la institución' },
      { key: 'academicYear', label: 'Año académico' },
      { key: 'periodName', label: 'Nombre del período' },
      { key: 'startDate', label: 'Fecha de inicio' },
      { key: 'endDate', label: 'Fecha de fin' },
      { key: 'enrollmentPeriodStart', label: 'Inicio del período de matrícula' },
      { key: 'enrollmentPeriodEnd', label: 'Fin del período de matrícula' },
    ];

    for (const field of requiredFields) {
      const value = data[field.key as keyof AcademicPeriod];
      if (!value || (typeof value === 'string' && !value.trim())) {
        errors[field.key] = `${field.label} es requerido`;
      }
    }

    // Validar fechas
    if (data.startDate && data.endDate) {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      if (startDate >= endDate) {
        errors.endDate = 'La fecha de fin debe ser posterior a la fecha de inicio';
      }
    }

    if (data.enrollmentPeriodStart && data.enrollmentPeriodEnd) {
      const enrollStart = new Date(data.enrollmentPeriodStart);
      const enrollEnd = new Date(data.enrollmentPeriodEnd);
      if (enrollStart >= enrollEnd) {
        errors.enrollmentPeriodEnd = 'El fin del período de matrícula debe ser posterior al inicio';
      }
    }

    // Validar valores permitidos
    const allowedStatuses = ['ACTIVE', 'INACTIVE', 'PENDING', 'CLOSED'];
    if (data.status && !allowedStatuses.includes(data.status)) {
      errors.status = `Estado debe ser uno de: ${allowedStatuses.join(', ')}`;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  /**
   * Verificar si un período está activo
   */
  isPeriodActive: (period: AcademicPeriod): boolean => {
    return period.status === 'ACTIVE' && !period.deleted;
  },

  /**
   * Verificar si el período de matrícula está abierto
   */
  isEnrollmentPeriodOpen: (period: AcademicPeriod): boolean => {
    const now = new Date();
    const enrollStart = new Date(period.enrollmentPeriodStart);
    const enrollEnd = new Date(period.enrollmentPeriodEnd);
    
    const isInPeriod = now >= enrollStart && now <= enrollEnd;
    
    // Verificar matrícula tardía si está habilitada
    if (!isInPeriod && period.allowLateEnrollment && period.lateEnrollmentEndDate) {
      const lateEnd = new Date(period.lateEnrollmentEndDate);
      return now <= lateEnd;
    }
    
    return isInPeriod;
  },

  /**
   * Obtener el estado del período de matrícula
   */
  getEnrollmentPeriodStatus: (period: AcademicPeriod): 'not-started' | 'open' | 'late' | 'closed' => {
    const now = new Date();
    const enrollStart = new Date(period.enrollmentPeriodStart);
    const enrollEnd = new Date(period.enrollmentPeriodEnd);
    
    if (now < enrollStart) {
      return 'not-started';
    }
    
    if (now <= enrollEnd) {
      return 'open';
    }
    
    if (period.allowLateEnrollment && period.lateEnrollmentEndDate) {
      const lateEnd = new Date(period.lateEnrollmentEndDate);
      if (now <= lateEnd) {
        return 'late';
      }
    }
    
    return 'closed';
  },

  /**
   * Formatear fechas para mostrar
   */
  formatDateRange: (startDate: string, endDate: string): string => {
    const start = new Date(startDate).toLocaleDateString('es-ES');
    const end = new Date(endDate).toLocaleDateString('es-ES');
    return `${start} - ${end}`;
  },

  /**
   * Calcular duración del período en días
   */
  calculatePeriodDuration: (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  /**
   * Generar estadísticas de períodos académicos
   */
  generatePeriodStats: (periods: AcademicPeriod[]): AcademicPeriodStats => {
    const stats = {
      total: periods.length,
      active: 0,
      inactive: 0,
      pending: 0,
      closed: 0,
    };

    periods.forEach(period => {
      switch (period.status) {
        case 'ACTIVE':
          stats.active++;
          break;
        case 'INACTIVE':
          stats.inactive++;
          break;
        case 'PENDING':
          stats.pending++;
          break;
        case 'CLOSED':
          stats.closed++;
          break;
      }
    });

    return stats;
  },
};

// 🎯 FUNCIONES DE UTILIDAD Y HELPERS

/**
 * Función helper para manejar errores de API de forma consistente
 */
export const handleAcademicPeriodApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Error desconocido en período académico';
};

/**
 * Función para validar y crear período académico
 */
export const validateAndCreatePeriod = async (data: CreateAcademicPeriodDto): Promise<AcademicPeriod> => {
  const validation = academicPeriodUtils.validateAcademicPeriodData(data);
  if (!validation.isValid) {
    throw new Error(`Datos inválidos: ${Object.values(validation.errors).join(', ')}`);
  }
  return academicPeriodService.createAcademicPeriod(data);
};

/**
 * Función para validar y actualizar período académico
 */
export const validateAndUpdatePeriod = async (id: string, data: UpdateAcademicPeriodDto): Promise<AcademicPeriod> => {
  const validation = academicPeriodUtils.validateAcademicPeriodData(data);
  if (!validation.isValid) {
    throw new Error(`Datos inválidos: ${Object.values(validation.errors).join(', ')}`);
  }
  return academicPeriodService.updateAcademicPeriod(id, data);
};