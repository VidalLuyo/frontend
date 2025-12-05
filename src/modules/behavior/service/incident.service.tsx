import type {
  IncidentResponse,
  IncidentSimpleResponse,
  IncidentCreateRequest,
  IncidentUpdateRequest
} from '../models/incident.interface';

// Configuración de la API
const API_BASE_URL = 'http://localhost:9088/api/v1/incidents';

// Funciones utilitarias para convertir arrays de fecha/hora
const convertDateArrayToString = (dateArray: number[] | string): string => {
  if (typeof dateArray === 'string') return dateArray;
  if (Array.isArray(dateArray) && dateArray.length >= 3) {
    // dateArray es [year, month, day]
    const [year, month, day] = dateArray;
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }
  return '';
};

const convertTimeArrayToString = (timeArray: number[] | string): string => {
  if (typeof timeArray === 'string') return timeArray;
  if (Array.isArray(timeArray) && timeArray.length >= 2) {
    // timeArray es [hour, minute]
    const [hour, minute] = timeArray;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
  }
  return '';
};

const convertDateTimeArrayToString = (dateTimeArray: number[] | string): string => {
  if (typeof dateTimeArray === 'string') return dateTimeArray;
  if (Array.isArray(dateTimeArray) && dateTimeArray.length >= 6) {
    // dateTimeArray es [year, month, day, hour, minute, second, nanoseconds]
    const [year, month, day, hour, minute, second] = dateTimeArray;
    const date = new Date(year, month - 1, day, hour, minute, second);
    return date.toISOString();
  }
  return '';
};

export class IncidentService {
  // Método privado para hacer peticiones con mejor manejo de errores
  private async makeRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
    try {
      console.log(`🚀 Haciendo petición a: ${url}`);
      console.log('📋 Opciones:', options);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      console.log(`📡 Respuesta recibida - Status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Error en la respuesta:', errorData);
        
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const parsedError = JSON.parse(errorData);
          errorMessage = parsedError.message || errorMessage;
        } catch {
          errorMessage = errorData || errorMessage;
        }

        throw new Error(errorMessage);
      }

      // Obtener el texto de la respuesta primero
      const responseText = await response.text();
        
      // Si la respuesta está vacía, manejar apropiadamente
      if (!responseText || responseText.trim() === '') {
        console.warn('⚠️ Respuesta vacía del servidor');
        throw new Error('El servidor devolvió una respuesta vacía');
      }
      
      // Intentar parsear como JSON
      try {
        const data = JSON.parse(responseText);
        console.log('✅ Datos parseados exitosamente:', data);
        return data;
      } catch (jsonError) {
        console.error('❌ Error al parsear JSON:', jsonError);
        console.error('📄 Texto de respuesta que causó el error:', responseText);
        throw new Error(`Error al parsear la respuesta JSON: ${jsonError}`);
      }
    } catch (error) {
      console.error('💥 Error en makeRequest:', error);
      throw error;
    }
  }

  // Crear un nuevo incidente
  async createIncident(request: IncidentCreateRequest): Promise<IncidentResponse> {
    try {
      console.log('📤 Enviando request de creación de incidente:', request);
      console.log('🔍 Verificando campos obligatorios...');
      
      // Validar campos requeridos antes de enviar
      if (!request.studentId) {
        throw new Error('El ID del estudiante es requerido');
      }
      if (!request.reportedBy) {
        throw new Error('El usuario que reporta es requerido');
      }
      if (!request.description) {
        throw new Error('La descripción del incidente es requerida');
      }

      console.log('✅ Validación de campos completada');
      console.log('🚀 Enviando petición al servidor...');
      console.log('📦 Datos del request:', JSON.stringify(request, null, 2));

      const response = await this.makeRequest<IncidentResponse>(API_BASE_URL, {
        method: 'POST',
        body: JSON.stringify(request),
      });

      console.log('✅ Incidente creado exitosamente:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Error creating incident:', error);
      
      // Mejorar el mensaje de error basado en el tipo
      let errorMessage = 'Error al crear el incidente';
      if (error.message) {
        if (error.message.includes('Cannot invoke') || error.message.includes('NullPointerException')) {
          errorMessage = 'Error interno del servidor. Algunos datos requeridos no están disponibles. Intente nuevamente.';
        } else if (error.message.includes('404')) {
          errorMessage = 'Servicio no encontrado. Verifique que el microservicio esté ejecutándose.';
        } else if (error.message.includes('500')) {
          errorMessage = 'Error interno del servidor. Verifique que los datos del estudiante y usuario sean válidos.';
        } else if (error.message.includes('Connection refused') || error.message.includes('fetch')) {
          errorMessage = 'No se puede conectar al servidor. Verifique que el microservicio esté ejecutándose.';
        } else {
          errorMessage = error.message;
        }
      }
      
      throw new Error(errorMessage);
    }
  }

  // Actualizar un incidente existente
  async updateIncident(id: string, request: IncidentUpdateRequest): Promise<IncidentResponse> {
    try {
      console.log('📤 Enviando request de actualización de incidente:', request);
      console.log('🔍 ID del incidente a actualizar:', id);
      
      const response = await this.makeRequest<IncidentResponse>(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(request),
      });
      
      console.log('✅ Incidente actualizado exitosamente:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Error updating incident:', error);
      throw new Error(
        error.message || 'Error al actualizar el incidente'
      );
    }
  }

  // Obtener todos los incidentes
  async getAllIncidents(): Promise<IncidentResponse[]> {
    try {
      return await this.makeRequest<IncidentResponse[]>(API_BASE_URL);
    } catch (error: any) {
      console.error('Error fetching incidents:', error);
      throw new Error(
        error.message || 'Error al cargar los incidentes'
      );
    }
  }

  // Obtener incidentes por estudiante
  async getIncidentsByStudent(studentId: string): Promise<IncidentResponse[]> {
    try {
      return await this.makeRequest<IncidentResponse[]>(`${API_BASE_URL}/student/${studentId}`);
    } catch (error: any) {
      console.error('Error fetching incidents by student:', error);
      throw new Error(
        error.message || 'Error al cargar los incidentes del estudiante'
      );
    }
  }

  // Obtener todos los incidentes simples (solo IDs)
  async getAllIncidentsSimple(): Promise<IncidentSimpleResponse[]> {
    try {
      return await this.makeRequest<IncidentSimpleResponse[]>(`${API_BASE_URL}/simple`);
    } catch (error: any) {
      console.error('Error fetching simple incidents:', error);
      throw new Error(
        error.message || 'Error al cargar los incidentes simples'
      );
    }
  }

  // Obtener incidentes simples por estudiante
  async getIncidentsByStudentSimple(studentId: string): Promise<IncidentSimpleResponse[]> {
    try {
      return await this.makeRequest<IncidentSimpleResponse[]>(`${API_BASE_URL}/simple/student/${studentId}`);
    } catch (error: any) {
      console.error('Error fetching simple incidents by student:', error);
      throw new Error(
        error.message || 'Error al cargar los incidentes simples del estudiante'
      );
    }
  }

  // Métodos auxiliares para formatear datos
  formatIncidentForDisplay(incident: IncidentResponse): IncidentResponse {
    const dateString = convertDateArrayToString(incident.incidentDate);
    const timeString = convertTimeArrayToString(incident.incidentTime);
    const reportedAtString = convertDateTimeArrayToString(incident.reportedAt);
    
    return {
      ...incident,
      incidentDate: dateString,
      incidentTime: timeString.substring(0, 5), // HH:mm
      reportedAt: reportedAtString,
      notificationDate: incident.notificationDate ? (() => {
        const date = new Date(incident.notificationDate);
        const day = date.getDate();
        const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${day}-${month}-${year} ${hours}:${minutes}`;
      })() : null,
      resolvedAt: incident.resolvedAt ? (() => {
        const date = new Date(incident.resolvedAt);
        const day = date.getDate();
        const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${day}-${month}-${year} ${hours}:${minutes}`;
      })() : null
    };
  }

  // Preparar datos para envío a la API (simplificado - classroom e institution se obtienen automáticamente)
  prepareIncidentForSubmission(formData: any): IncidentCreateRequest {
    return {
      studentId: formData.studentId,
      incidentDate: formData.incidentDate,
      incidentTime: formData.incidentTime,
      academicYear: parseInt(formData.academicYear),
      incidentType: formData.incidentType,
      severityLevel: formData.severityLevel,
      description: formData.description,
      location: formData.location,
      witnesses: formData.witnesses || undefined,
      otherStudentsInvolved: formData.otherStudentsInvolved?.length > 0 ? 
        formData.otherStudentsInvolved.filter((id: string) => id.trim() !== '') : 
        undefined,
      immediateAction: formData.immediateAction || undefined,
      reportedBy: formData.reportedBy
    };
  }

  // Obtener estadísticas de incidentes
  async getIncidentStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    try {
      const incidents = await this.getAllIncidents();
      
      const stats = {
        total: incidents.length,
        byType: {} as Record<string, number>,
        bySeverity: {} as Record<string, number>,
        byStatus: {} as Record<string, number>
      };

      incidents.forEach(incident => {
        // Contar por tipo
        stats.byType[incident.incidentType] = (stats.byType[incident.incidentType] || 0) + 1;
        
        // Contar por severidad
        stats.bySeverity[incident.severityLevel] = (stats.bySeverity[incident.severityLevel] || 0) + 1;
        
        // Contar por estado
        stats.byStatus[incident.status] = (stats.byStatus[incident.status] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching incident stats:', error);
      throw error;
    }
  }
}

// Instancia singleton del servicio
export const incidentService = new IncidentService();