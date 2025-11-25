/**
 * Servicio: StudentService
 * Maneja las peticiones al API para Estudiantes
 */

import type {
     Student,
     CreateStudentRequest,
     UpdateStudentRequest,
     ApiResponse,
     StudentFilters,
     StudentWithInstitutionResponse,
} from "../models/student.model";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:9081/api/v1";

export const studentsService = {
     async getAll(): Promise<Student[]> {
          const response = await fetch(`${API_URL}/students`);
          if (!response.ok) throw new Error("Error al obtener estudiantes");
          const apiResponse: ApiResponse<Student[]> = await response.json();
          return apiResponse.data || [];
     },

     async getById(studentId: string): Promise<Student> {
          const response = await fetch(`${API_URL}/students/${studentId}`);
          if (!response.ok) throw new Error("Error al obtener el estudiante");
          const apiResponse: ApiResponse<Student> = await response.json();
          if (!apiResponse.data) throw new Error("Estudiante no encontrado");
          return apiResponse.data;
     },

     async getByIdWithInstitution(
          studentId: string
     ): Promise<StudentWithInstitutionResponse> {
          const response = await fetch(
               `${API_URL}/students/${studentId}/with-institution`
          );
          if (!response.ok)
               throw new Error(
                    "Error al obtener el estudiante con institución"
               );
          const apiResponse: ApiResponse<StudentWithInstitutionResponse> =
               await response.json();
          if (!apiResponse.data) throw new Error("Estudiante no encontrado");
          return apiResponse.data;
     },

     async getByCui(cui: string): Promise<Student> {
          const response = await fetch(`${API_URL}/students/cui/${cui}`);
          if (!response.ok)
               throw new Error("Error al obtener estudiante por CUI");
          const apiResponse: ApiResponse<Student> = await response.json();
          if (!apiResponse.data) throw new Error("Estudiante no encontrado");
          return apiResponse.data;
     },

     async getByClassroom(classroomId: string): Promise<Student[]> {
          const response = await fetch(
               `${API_URL}/students/classroom/${classroomId}`
          );
          if (!response.ok)
               throw new Error("Error al obtener estudiantes del aula");
          const apiResponse: ApiResponse<Student[]> = await response.json();
          return apiResponse.data || [];
     },

     async getByInstitution(institutionId: string): Promise<Student[]> {
          const response = await fetch(
               `${API_URL}/students/institution/${institutionId}`
          );
          if (!response.ok)
               throw new Error(
                    "Error al obtener estudiantes de la institución"
               );
          const apiResponse: ApiResponse<Student[]> = await response.json();
          return apiResponse.data || [];
     },

     async create(data: CreateStudentRequest): Promise<Student> {
          const response = await fetch(`${API_URL}/students`, {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify(data),
          });
          if (!response.ok) throw new Error("Error al crear el estudiante");
          const apiResponse: ApiResponse<Student> = await response.json();
          if (!apiResponse.data)
               throw new Error("Error al crear el estudiante");
          return apiResponse.data;
     },

     async update(
          studentId: string,
          data: UpdateStudentRequest
     ): Promise<Student> {
          const response = await fetch(`${API_URL}/students/${studentId}`, {
               method: "PUT",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify(data),
          });
          if (!response.ok) {
               if (response.status === 404) {
                    throw new Error("Estudiante no encontrado");
               }
               throw new Error("Error al actualizar el estudiante");
          }
          const apiResponse: ApiResponse<Student> = await response.json();
          if (!apiResponse.data)
               throw new Error("Error al actualizar el estudiante");
          return apiResponse.data;
     },

     filterStudents(students: Student[], filters: StudentFilters): Student[] {
          return students.filter((student) => {
               if (filters.status && student.status !== filters.status)
                    return false;
               if (
                    filters.institutionId &&
                    student.institutionId !== filters.institutionId
               )
                    return false;
               if (
                    filters.classroomId &&
                    student.classroomId !== filters.classroomId
               )
                    return false;
               if (filters.search) {
                    const searchLower = filters.search.toLowerCase();
                    const fullName =
                         `${student.personalInfo.names} ${student.personalInfo.lastNames}`.toLowerCase();
                    const searchableText =
                         `${fullName} ${student.cui} ${student.personalInfo.documentNumber}`.toLowerCase();
                    if (!searchableText.includes(searchLower)) return false;
               }
               return true;
          });
     },

     async delete(studentId: string): Promise<string> {
          const response = await fetch(`${API_URL}/students/${studentId}`, {
               method: "DELETE",
          });
          if (!response.ok) {
               if (response.status === 404) {
                    throw new Error("Estudiante no encontrado");
               }
               throw new Error("Error al eliminar el estudiante");
          }
          const apiResponse: ApiResponse<string> = await response.json();
          return apiResponse.message || "Estudiante eliminado exitosamente";
     },

     async restore(studentId: string): Promise<string> {
          const response = await fetch(
               `${API_URL}/students/restore/${studentId}`,
               {
                    method: "PUT",
               }
          );
          if (!response.ok) {
               if (response.status === 404) {
                    throw new Error("Estudiante no encontrado");
               }
               throw new Error("Error al restaurar el estudiante");
          }
          const apiResponse: ApiResponse<string> = await response.json();
          return apiResponse.message || "Estudiante restaurado exitosamente";
     },
};
