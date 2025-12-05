import type {
     TeacherAssignmentSummary,
     TeacherAssignmentDetail,
     CreateTeacherAssignmentDto,
     UpdateTeacherAssignmentDto,
     ApiResponse,
     Status,
} from "../models/teacher.model";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:9099";
const BASE_PATH = "/api/v1/teacher-assignments";

export const teacherAssignmentService = {
     async getAll(): Promise<ApiResponse<TeacherAssignmentSummary[]>> {
          const response = await fetch(`${API_URL}${BASE_PATH}`);
          if (!response.ok) throw new Error("Error al obtener asignaciones");
          return response.json();
     },

     async getById(id: string): Promise<ApiResponse<TeacherAssignmentDetail>> {
          const response = await fetch(`${API_URL}${BASE_PATH}/${id}`);
          if (!response.ok) throw new Error("Error al obtener la asignación");
          return response.json();
     },

     async getByTeacher(
          teacherUserId: string
     ): Promise<ApiResponse<TeacherAssignmentSummary[]>> {
          const response = await fetch(
               `${API_URL}${BASE_PATH}/teacher/${teacherUserId}`
          );
          if (!response.ok)
               throw new Error("Error al obtener asignaciones del profesor");
          return response.json();
     },

     async getByInstitution(
          institutionId: string
     ): Promise<ApiResponse<TeacherAssignmentSummary[]>> {
          const response = await fetch(
               `${API_URL}${BASE_PATH}/institution/${institutionId}`
          );
          if (!response.ok)
               throw new Error(
                    "Error al obtener asignaciones de la institución"
               );
          return response.json();
     },

     async getByStatus(
          status: Status
     ): Promise<ApiResponse<TeacherAssignmentSummary[]>> {
          const response = await fetch(
               `${API_URL}${BASE_PATH}/status/${status}`
          );
          if (!response.ok)
               throw new Error("Error al obtener asignaciones por estado");
          return response.json();
     },

     async getActiveOnDate(
          date: string
     ): Promise<ApiResponse<TeacherAssignmentSummary[]>> {
          const response = await fetch(
               `${API_URL}${BASE_PATH}/active-on?date=${date}`
          );
          if (!response.ok)
               throw new Error("Error al obtener asignaciones activas");
          return response.json();
     },

     async getByAcademicYear(
          year: string
     ): Promise<ApiResponse<TeacherAssignmentSummary[]>> {
          const response = await fetch(
               `${API_URL}${BASE_PATH}/academic-year/${year}`
          );
          if (!response.ok)
               throw new Error(
                    "Error al obtener asignaciones del año académico"
               );
          return response.json();
     },

     async create(
          data: CreateTeacherAssignmentDto
     ): Promise<ApiResponse<TeacherAssignmentDetail>> {
          const response = await fetch(`${API_URL}${BASE_PATH}`, {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify(data),
          });
          if (!response.ok) {
               const error = await response.json();
               throw new Error(error.message || "Error al crear la asignación");
          }
          return response.json();
     },

     async update(
          id: string,
          data: UpdateTeacherAssignmentDto
     ): Promise<ApiResponse<TeacherAssignmentDetail>> {
          const response = await fetch(`${API_URL}${BASE_PATH}/${id}`, {
               method: "PUT",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify(data),
          });
          if (!response.ok) {
               const error = await response.json();
               throw new Error(
                    error.message || "Error al actualizar la asignación"
               );
          }
          return response.json();
     },

     async changeStatus(
          id: string,
          status: Status
     ): Promise<ApiResponse<TeacherAssignmentDetail>> {
          const response = await fetch(
               `${API_URL}${BASE_PATH}/${id}/status?status=${status}`,
               {
                    method: "PATCH",
               }
          );
          if (!response.ok) throw new Error("Error al cambiar el estado");
          return response.json();
     },

     async delete(id: string): Promise<ApiResponse<void>> {
          const response = await fetch(`${API_URL}${BASE_PATH}/${id}`, {
               method: "DELETE",
          });
          if (!response.ok) throw new Error("Error al eliminar la asignación");
          return response.json();
     },

     async restore(id: string): Promise<ApiResponse<TeacherAssignmentDetail>> {
          const response = await fetch(`${API_URL}${BASE_PATH}/${id}/restore`, {
               method: "POST",
          });
          if (!response.ok) throw new Error("Error al restaurar la asignación");
          return response.json();
     },
};
