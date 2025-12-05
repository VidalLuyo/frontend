import type {
  AttendanceRecord,
  CreateAttendanceDto,
  UpdateAttendanceDto,
  JustificationDto,
  AttendanceStats,
} from "../models/attendance.model";

// Esta URL será reemplazada por el script docker-entrypoint.sh
const BASE_URL = "PLACEHOLDER_API_URL";
const API_BASE_URL = `${BASE_URL}/attendance`;

// Interfaces para datos sin procesar de los servicios externos
interface RawStudentData {
  id?: string;
  studentId?: string;
  name?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  institutionId?: string;
  classroomId?: string;
  personalInfo?: {
    names?: string;
    lastnames?: string;
  };
}

interface RawClassroomData {
  id?: string;
  classroomId?: string;
  name?: string;
  classroomName?: string;
  code?: string;
  description?: string;
  institutionId?: string;
}

interface RawInstitutionData {
  id?: string;
  institutionId?: string;
  name?: string;
  institutionName?: string;
  code?: string;
}

class AttendanceService {
  // Método auxiliar para hacer peticiones HTTP
  private async fetchData<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, options);
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `HTTP ${response.status}`);
    }
    return response.json();
  }

  // CRUD Operations
  async getAllAttendances(): Promise<AttendanceRecord[]> {
    try {
      // El backend ya enriquece los datos con nombres
      const data = await this.fetchData<AttendanceRecord[]>(API_BASE_URL);
      return data;
    } catch (error) {
      console.error("Error loading attendances, returning empty array", error);
      return [];
    }
  }

  async getAttendanceById(id: string): Promise<AttendanceRecord> {
    return this.fetchData<AttendanceRecord>(`${API_BASE_URL}/${id}`);
  }

  async createAttendance(data: CreateAttendanceDto): Promise<AttendanceRecord> {
    return this.fetchData<AttendanceRecord>(API_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async updateAttendance(
    id: string,
    data: UpdateAttendanceDto
  ): Promise<AttendanceRecord> {
    return this.fetchData<AttendanceRecord>(`${API_BASE_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async justifyAttendance(
    id: string,
    data: JustificationDto
  ): Promise<AttendanceRecord> {
    return this.fetchData<AttendanceRecord>(`${API_BASE_URL}/${id}/justify`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async deleteAttendance(id: string): Promise<void> {
    await fetch(`${API_BASE_URL}/${id}`, {
      method: "DELETE",
    });
  }

  // Consultas específicas - El backend ya enriquece los datos
  async getAttendancesByStudent(
    studentId: string
  ): Promise<AttendanceRecord[]> {
    return this.fetchData<AttendanceRecord[]>(
      `${API_BASE_URL}/student/${studentId}`
    );
  }

  async getAttendancesByClassroom(
    classroomId: string
  ): Promise<AttendanceRecord[]> {
    return this.fetchData<AttendanceRecord[]>(
      `${API_BASE_URL}/classroom/${classroomId}`
    );
  }

  async getAttendancesByInstitution(
    institutionId: string
  ): Promise<AttendanceRecord[]> {
    return this.fetchData<AttendanceRecord[]>(
      `${API_BASE_URL}/institution/${institutionId}`
    );
  }

  async getAttendancesByDate(date: string): Promise<AttendanceRecord[]> {
    return this.fetchData<AttendanceRecord[]>(`${API_BASE_URL}/date/${date}`);
  }

  async getAttendancesByClassroomAndDate(
    classroomId: string,
    date: string
  ): Promise<AttendanceRecord[]> {
    return this.fetchData<AttendanceRecord[]>(
      `${API_BASE_URL}/classroom/${classroomId}/date/${date}`
    );
  }

  async getAttendancesByStudentAndDateRange(
    studentId: string,
    startDate: string,
    endDate: string
  ): Promise<AttendanceRecord[]> {
    return this.fetchData<AttendanceRecord[]>(
      `${API_BASE_URL}/student/${studentId}/range?startDate=${startDate}&endDate=${endDate}`
    );
  }

  // Estadísticas
  async getAttendanceStats(
    studentId: string,
    startDate: string,
    endDate: string
  ): Promise<AttendanceStats> {
    return this.fetchData<AttendanceStats>(
      `${API_BASE_URL}/student/${studentId}/stats?startDate=${startDate}&endDate=${endDate}`
    );
  }

  // Métodos para obtener listas de referencia (útiles para formularios)
  async getAllStudents(): Promise<Array<{ id: string; name: string }>> {
    try {
      const data = await this.fetchData<Array<RawStudentData>>(
        `${API_BASE_URL}/reference/students`
      );

      // Normalizar los datos para asegurar que tengan id y name
      return data.map((item) => {
        const id = item.id || item.studentId || "";
        let name = "Desconocido";

        // El backend ya devuelve el nombre completo en el campo 'name' desde ReferenceDTO
        if (item.name && item.name !== "Desconocido") {
          name = item.name;
        } else if (item.personalInfo?.names && item.personalInfo?.lastnames) {
          name = `${item.personalInfo.names} ${item.personalInfo.lastnames}`;
        } else if (item.personalInfo?.names) {
          name = item.personalInfo.names;
        } else if (item.fullName) {
          name = item.fullName;
        } else if (item.firstName && item.lastName) {
          name = `${item.firstName} ${item.lastName}`;
        } else if (item.firstName) {
          name = item.firstName;
        } else if (id) {
          name = `Estudiante ${id.substring(0, 8)}`;
        }

        return { id, name };
      });
    } catch (error) {
      console.error("Error loading students", error);
      return [];
    }
  }

  async getAllClassrooms(): Promise<Array<{ id: string; name: string }>> {
    try {
      const data = await this.fetchData<Array<RawClassroomData>>(
        `${API_BASE_URL}/reference/classrooms`
      );

      // Normalizar los datos
      return data.map((item) => {
        const id = item.id || item.classroomId || "";
        const name =
          item.classroomName ||
          item.name ||
          item.code ||
          (id ? `Aula ${id.substring(0, 8)}` : "Desconocido");

        return { id, name };
      });
    } catch (error) {
      console.error("Error loading classrooms", error);
      return [];
    }
  }

  async getAllInstitutions(): Promise<Array<{ id: string; name: string }>> {
    try {
      const data = await this.fetchData<Array<RawInstitutionData>>(
        `${API_BASE_URL}/reference/institutions`
      );

      // Normalizar los datos
      return data.map((item) => ({
        id: item.id || item.institutionId || "",
        name:
          item.name ||
          item.institutionName ||
          item.code ||
          (item.id ? `Institución ${item.id.substring(0, 8)}` : "Desconocido"),
      }));
    } catch (error) {
      console.error("Error loading institutions", error);
      return [];
    }
  }

  async createBulkAttendance(
    data: import("../models/attendance.model").BulkAttendanceDto
  ): Promise<import("../models/attendance.model").BulkAttendanceResponse> {
    return this.fetchData<
      import("../models/attendance.model").BulkAttendanceResponse
    >(`${API_BASE_URL}/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async getStudentsByInstitution(institutionId: string): Promise<
    Array<{
      id: string;
      name: string;
      institutionId?: string;
      classroomId?: string;
    }>
  > {
    try {
      const data = await this.fetchData<Array<RawStudentData>>(
        `${API_BASE_URL}/reference/students/institution/${institutionId}`
      );

      return data.map((item) => {
        const id = item.id || item.studentId || "";
        const name = item.name || `Estudiante ${id.substring(0, 8)}`;
        return {
          id,
          name,
          institutionId: item.institutionId,
          classroomId: item.classroomId,
        };
      });
    } catch (error) {
      console.error("Error loading students by institution", error);
      return [];
    }
  }

  async getClassroomsByInstitution(
    institutionId: string
  ): Promise<Array<{ id: string; name: string; institutionId?: string }>> {
    try {
      const data = await this.fetchData<Array<RawClassroomData>>(
        `${API_BASE_URL}/reference/classrooms/institution/${institutionId}`
      );

      return data.map((item) => ({
        id: item.id || item.classroomId || "",
        name:
          item.classroomName ||
          item.name ||
          item.code ||
          (item.id ? `Aula ${item.id.substring(0, 8)}` : "Desconocido"),
        institutionId: item.institutionId,
      }));
    } catch (error) {
      console.error("Error loading classrooms by institution", error);
      return [];
    }
  }
}

export const attendanceService = new AttendanceService();
export default attendanceService;
