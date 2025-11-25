/**
 * Índice de Servicios de Matrículas
 * Exporta todos los servicios de manera organizada
 */

// Servicios principales
export * from './Enrollment.service';
export * from './AcademicPeriod.service';
export * from './Integration.service';
export * from './EnrollmentIntegration.service';

// Re-exportar servicios con nombres específicos para evitar conflictos
export { enrollmentService } from './Enrollment.service';
export { academicPeriodService } from './AcademicPeriod.service';
export { integrationService } from './Integration.service';
export { enrollmentIntegrationService } from './EnrollmentIntegration.service';

// Utilidades
export { enrollmentUtils } from './Enrollment.service';
export { academicPeriodUtils } from './AcademicPeriod.service';
export { integrationUtils } from './Integration.service';
export { enrollmentIntegrationUtils } from './EnrollmentIntegration.service';

// Funciones de validación y helpers
export { 
  validateAndCreate, 
  validateAndUpdate, 
  handleApiError 
} from './Enrollment.service';

export { 
  validateAndCreatePeriod, 
  validateAndUpdatePeriod, 
  handleAcademicPeriodApiError 
} from './AcademicPeriod.service';

export { 
  getCompleteEnrollmentData, 
  validateCompleteEnrollmentData 
} from './EnrollmentIntegration.service';