/**
 * Página: StudentPage
 * Página principal del módulo de Estudiantes - Lista todos los registros
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, RefreshCw, GraduationCap } from "lucide-react";
import { StudentList } from "../components/StudentList";
import { studentsService } from "../service/Student.service";
import {
     showSuccessAlert,
     showErrorAlert,
     showLoadingAlert,
     closeAlert,
} from "../../../shared/utils/sweetAlert";
import type {
     Student,
     StudentFilters,
     StudentStatus,
} from "../models/student.model";

export function StudentPage() {
     const navigate = useNavigate();
     const [students, setStudents] = useState<Student[]>([]);
     const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState<string | null>(null);
     const [filters, setFilters] = useState<StudentFilters>({});

     useEffect(() => {
          const fetchStudents = async () => {
               try {
                    setLoading(true);
                    setError(null);
                    const data = await studentsService.getAll();
                    setStudents(data);
                    setFilteredStudents(data);
               } catch (err) {
                    setError(
                         err instanceof Error
                              ? err.message
                              : "Error al cargar estudiantes"
                    );
                    console.error("Error al cargar estudiantes:", err);
               } finally {
                    setLoading(false);
               }
          };

          fetchStudents();
     }, []);

     useEffect(() => {
          const filtered = studentsService.filterStudents(students, filters);
          setFilteredStudents(filtered);
     }, [students, filters]);

     const handleRefresh = async () => {
          try {
               setLoading(true);
               setError(null);
               showLoadingAlert("Recargando estudiantes...");
               const data = await studentsService.getAll();
               setStudents(data);
               setFilteredStudents(data);
               closeAlert();
               showSuccessAlert(
                    "Lista actualizada",
                    "Los datos se han actualizado correctamente"
               );
          } catch (err) {
               closeAlert();
               setError(
                    err instanceof Error
                         ? err.message
                         : "Error al recargar estudiantes"
               );
               showErrorAlert(
                    "Error al recargar",
                    err instanceof Error ? err.message : "Error desconocido"
               );
          } finally {
               setLoading(false);
          }
     };

     const handleFilterChange = (newFilters: Partial<StudentFilters>) => {
          setFilters((prev) => ({ ...prev, ...newFilters }));
     };

     const handleDelete = async (studentId: string) => {
          try {
               showLoadingAlert("Eliminando estudiante...");
               await studentsService.delete(studentId);
               closeAlert();

               setStudents((prev) =>
                    prev.map((student) =>
                         student.studentId === studentId
                              ? { ...student, status: "INACTIVE" }
                              : student
                    )
               );

               showSuccessAlert(
                    "Estudiante eliminado",
                    "El estudiante ha sido eliminado exitosamente"
               );
          } catch (err) {
               closeAlert();
               showErrorAlert(
                    "Error al eliminar",
                    err instanceof Error ? err.message : "Error desconocido"
               );
          }
     };

     const handleRestore = async (studentId: string) => {
          try {
               showLoadingAlert("Restaurando estudiante...");
               await studentsService.restore(studentId);
               closeAlert();

               setStudents((prev) =>
                    prev.map((student) =>
                         student.studentId === studentId
                              ? { ...student, status: "ACTIVE" }
                              : student
                    )
               );

               showSuccessAlert(
                    "Estudiante restaurado",
                    "El estudiante ha sido restaurado exitosamente"
               );
          } catch (err) {
               closeAlert();
               showErrorAlert(
                    "Error al restaurar",
                    err instanceof Error ? err.message : "Error desconocido"
               );
          }
     };

     if (loading) {
          return (
               <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
               </div>
          );
     }

     if (error) {
          return (
               <div className="max-w-7xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                         <div className="flex">
                              <div className="ml-3">
                                   <h3 className="text-sm font-medium text-red-800">
                                        Error
                                   </h3>
                                   <div className="mt-2 text-sm text-red-700">
                                        {error}
                                   </div>
                                   <div className="mt-4">
                                        <button
                                             onClick={() =>
                                                  window.location.reload()
                                             }
                                             className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                                        >
                                             Reintentar
                                        </button>
                                   </div>
                              </div>
                         </div>
                    </div>
               </div>
          );
     }

     return (
          <div className="max-w-7xl mx-auto">
               <div className="mb-6 flex justify-between items-center">
                    <div>
                         <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                              <GraduationCap className="h-8 w-8 mr-3 text-indigo-600" />
                              Estudiantes
                         </h1>
                         <p className="mt-2 text-sm text-gray-600">
                              Gestión de estudiantes del sistema (
                              {filteredStudents.length} estudiantes)
                         </p>
                    </div>
                    <div className="flex space-x-3">
                         <button
                              onClick={handleRefresh}
                              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                         >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Actualizar
                         </button>
                         <button
                              onClick={() => navigate("/estudiantes/nuevo")}
                              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                         >
                              <Plus className="h-4 w-4 mr-2" />
                              Nuevo Estudiante
                         </button>
                    </div>
               </div>

               <div className="mb-6 bg-white p-4 rounded-lg shadow">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                   Buscar
                              </label>
                              <input
                                   type="text"
                                   placeholder="Nombre, CUI, documento..."
                                   value={filters.search || ""}
                                   onChange={(e) =>
                                        handleFilterChange({
                                             search: e.target.value,
                                        })
                                   }
                                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              />
                         </div>
                         <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                   Estado
                              </label>
                              <select
                                   value={filters.status || ""}
                                   onChange={(e) =>
                                        handleFilterChange({
                                             status:
                                                  (e.target.value as
                                                       | StudentStatus
                                                       | undefined) ||
                                                  undefined,
                                        })
                                   }
                                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              >
                                   <option value="">Todos los estados</option>
                                   <option value="ACTIVE">Activos</option>
                                   <option value="INACTIVE">Inactivos</option>
                              </select>
                         </div>
                         <div className="flex items-end">
                              <button
                                   onClick={() => setFilters({})}
                                   className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                   Limpiar Filtros
                              </button>
                         </div>
                    </div>
               </div>

               <StudentList
                    items={filteredStudents}
                    onDelete={handleDelete}
                    onRestore={handleRestore}
               />
          </div>
     );
}
