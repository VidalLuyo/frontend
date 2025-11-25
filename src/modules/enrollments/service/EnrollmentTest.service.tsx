/**
 * Servicio de Pruebas para Endpoints de Matrículas
 * Para verificar que los endpoints funcionen correctamente
 */

// Configuración local
const INTEGRATION_CONFIG = {
  ENROLLMENT_SERVICE_URL: import.meta.env.VITE_ENROLLMENT_API_URL || 'http://localhost:9082/api/v1',
} as const;

const BASE_URL = INTEGRATION_CONFIG.ENROLLMENT_SERVICE_URL;

export const enrollmentTestService = {
  /**
   * Probar todos los endpoints de matrículas
   */
  testAllEndpoints: async () => {
    console.group('🧪 Probando Endpoints de Matrículas');
    
    const endpoints = [
      { name: 'Todas las matrículas', url: `${BASE_URL}/enrollments` },
      { name: 'Matrículas activas', url: `${BASE_URL}/enrollments/active` },
      { name: 'Matrículas pendientes', url: `${BASE_URL}/enrollments/pending` },
      { name: 'Matrículas canceladas', url: `${BASE_URL}/enrollments/cancelled` },
      { name: 'Matrículas inactivas', url: `${BASE_URL}/enrollments/inactive` },
    ];

    const results = [];

    for (const endpoint of endpoints) {
      try {
        console.log(`🚀 Probando: ${endpoint.name} - ${endpoint.url}`);
        
        const response = await fetch(endpoint.url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const count = Array.isArray(data) ? data.length : 'N/A';
          console.log(`✅ ${endpoint.name}: ${response.status} - ${count} registros`);
          
          if (Array.isArray(data) && data.length > 0) {
            console.log(`📋 Primer registro:`, data[0]);
          }
          
          results.push({
            endpoint: endpoint.name,
            status: response.status,
            success: true,
            count,
            data: Array.isArray(data) ? data.slice(0, 2) : data // Solo primeros 2 para no saturar
          });
        } else {
          console.error(`❌ ${endpoint.name}: ${response.status} ${response.statusText}`);
          results.push({
            endpoint: endpoint.name,
            status: response.status,
            success: false,
            error: response.statusText
          });
        }
      } catch (error) {
        console.error(`💥 Error en ${endpoint.name}:`, error);
        results.push({
          endpoint: endpoint.name,
          success: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }

    console.groupEnd();
    return results;
  },

  /**
   * Probar endpoint específico
   */
  testEndpoint: async (endpoint: string) => {
    const url = `${BASE_URL}${endpoint}`;
    console.log(`🧪 Probando endpoint: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      const data = await response.json();
      
      console.log(`📊 Respuesta:`, {
        status: response.status,
        ok: response.ok,
        dataType: Array.isArray(data) ? 'array' : typeof data,
        count: Array.isArray(data) ? data.length : 'N/A',
        sample: Array.isArray(data) ? data[0] : data
      });

      return {
        success: response.ok,
        status: response.status,
        data,
        count: Array.isArray(data) ? data.length : null
      };
    } catch (error) {
      console.error(`❌ Error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  },

  /**
   * Verificar estructura de datos
   */
  verifyDataStructure: (enrollments: any[]) => {
    if (!Array.isArray(enrollments)) {
      console.error('❌ Los datos no son un array');
      return false;
    }

    if (enrollments.length === 0) {
      console.warn('⚠️ No hay matrículas para verificar');
      return true;
    }

    const sample = enrollments[0];
    const requiredFields = [
      'id', 'studentId', 'institutionId', 'classroomId', 
      'academicYear', 'academicPeriodId', 'enrollmentStatus'
    ];

    const missingFields = requiredFields.filter(field => !(field in sample));
    
    if (missingFields.length > 0) {
      console.error('❌ Campos faltantes:', missingFields);
      return false;
    }

    console.log('✅ Estructura de datos correcta');
    console.log('📋 Campos encontrados:', Object.keys(sample));
    
    // Verificar campo deleted
    if ('deleted' in sample) {
      const deletedCount = enrollments.filter(e => e.deleted === true).length;
      const activeCount = enrollments.filter(e => e.deleted !== true).length;
      console.log(`🗑️ Matrículas eliminadas: ${deletedCount}`);
      console.log(`✅ Matrículas activas: ${activeCount}`);
    }

    return true;
  }
};

// Función global para probar desde la consola del navegador
(window as any).testEnrollmentEndpoints = enrollmentTestService.testAllEndpoints;
(window as any).testEnrollmentEndpoint = enrollmentTestService.testEndpoint;