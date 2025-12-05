import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Plus, Users } from "lucide-react";
import { TeacherList } from "../components/TeacherList";
import { Pagination } from "../../../shared/components/Pagination";
import { teacherAssignmentService } from "../service/Teacher.service";
import {
     showSuccessAlert,
     showErrorAlert,
     showDeleteConfirm,
     showRestoreConfirm,
     showLoadingAlert,
     closeAlert,
} from "../../../shared/utils/sweetAlert";
import type { TeacherAssignmentSummary, Status } from "../models/teacher.model";

const ITEMS_PER_PAGE = 10;

export function TeacherPage() {
     const navigate = useNavigate();
     const [items, setItems] = useState<TeacherAssignmentSummary[]>([]);
     const [filteredItems, setFilteredItems] = useState<
          TeacherAssignmentSummary[]
     >([]);
     const [loading, setLoading] = useState(true);
     const [currentPage, setCurrentPage] = useState(1);
     const [searchTerm, setSearchTerm] = useState("");
     const [statusFilter, setStatusFilter] = useState<Status | "ALL">("ALL");
     const [roleFilter, setRoleFilter] = useState<string>("ALL");

     const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
     const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
     const endIndex = startIndex + ITEMS_PER_PAGE;
     const currentItems = filteredItems.slice(startIndex, endIndex);

     const fetchAssignments = async () => {
          try {
               setLoading(true);
               const response = await teacherAssignmentService.getAll();
               setItems(response.data);
               setFilteredItems(response.data);
          } catch (error) {
               showErrorAlert(
                    "Error",
                    "No se pudieron cargar las asignaciones"
               );
               console.error("Error al cargar asignaciones:", error);
          } finally {
               setLoading(false);
          }
     };

     useEffect(() => {
          fetchAssignments();
     }, []);

     useEffect(() => {
          let filtered = [...items];

          if (searchTerm) {
               filtered = filtered.filter(
                    (item) =>
                         item.teacherName
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase()) ||
                         item.teacherUserId
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase()) ||
                         item.institutionName
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase())
               );
          }

          if (statusFilter !== "ALL") {
               filtered = filtered.filter(
                    (item) => item.status === statusFilter
               );
          }

          if (roleFilter !== "ALL") {
               filtered = filtered.filter(
                    (item) => item.assignmentType === roleFilter
               );
          }

          setFilteredItems(filtered);
          setCurrentPage(1);
     }, [searchTerm, statusFilter, roleFilter, items]);

     const handleDelete = async (id: string, teacherName: string) => {
          const result = await showDeleteConfirm(teacherName);
          if (result.isConfirmed) {
               try {
                    showLoadingAlert("Eliminando...");
                    await teacherAssignmentService.delete(id);
                    closeAlert();
                    await showSuccessAlert(
                         "¡Eliminado!",
                         "La asignación ha sido eliminada"
                    );
                    fetchAssignments();
               } catch (error) {
                    closeAlert();
                    showErrorAlert(
                         "Error",
                         "No se pudo eliminar la asignación"
                    );
                    console.error("Error al eliminar:", error);
               }
          }
     };

     const handleRestore = async (id: string, teacherName: string) => {
          const result = await showRestoreConfirm(teacherName);
          if (result.isConfirmed) {
               try {
                    showLoadingAlert("Restaurando...");
                    await teacherAssignmentService.restore(id);
                    closeAlert();
                    await showSuccessAlert(
                         "¡Restaurado!",
                         "La asignación ha sido restaurada"
                    );
                    fetchAssignments();
               } catch (error) {
                    closeAlert();
                    showErrorAlert(
                         "Error",
                         "No se pudo restaurar la asignación"
                    );
                    console.error("Error al restaurar:", error);
               }
          }
     };

     const handleRefresh = () => {
          fetchAssignments();
          showSuccessAlert("Actualizado", "Lista de asignaciones actualizada");
     };

     const handleClearFilters = () => {
          setSearchTerm("");
          setStatusFilter("ALL");
          setRoleFilter("ALL");
     };

     if (loading) {
          return (
               <div className="flex justify-center items-center h-64">
                    <div className="flex flex-col items-center gap-3">
                         <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
                         <p className="text-gray-600">
                              Cargando asignaciones...
                         </p>
                    </div>
               </div>
          );
     }

     return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
               <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                         <Users className="h-8 w-8 text-indigo-600" />
                         <h1 className="text-3xl font-bold text-gray-900">
                              Asignaciones de Profesores
                         </h1>
                    </div>
                    <p className="text-sm text-gray-600">
                         Gestión de asignaciones de profesores (
                         {filteredItems.length}{" "}
                         {filteredItems.length === 1
                              ? "asignación"
                              : "asignaciones"}
                         )
                    </p>
               </div>

               <div className="bg-white rounded-lg shadow mb-6 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                         <div className="md:col-span-1">
                              <label
                                   htmlFor="search"
                                   className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                   Buscar
                              </label>
                              <input
                                   id="search"
                                   type="text"
                                   placeholder="Nombre, email, usuario..."
                                   value={searchTerm}
                                   onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                   }
                                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              />
                         </div>

                         <div>
                              <label
                                   htmlFor="status"
                                   className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                   Estado
                              </label>
                              <select
                                   id="status"
                                   value={statusFilter}
                                   onChange={(e) =>
                                        setStatusFilter(
                                             e.target.value as Status | "ALL"
                                        )
                                   }
                                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              >
                                   <option value="ALL">
                                        Todos los estados
                                   </option>
                                   <option value="ACTIVE">Activo</option>
                                   <option value="INACTIVE">Inactivo</option>
                                   <option value="COMPLETED">Completado</option>
                              </select>
                         </div>

                         <div>
                              <label
                                   htmlFor="role"
                                   className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                   Tipo
                              </label>
                              <select
                                   id="role"
                                   value={roleFilter}
                                   onChange={(e) =>
                                        setRoleFilter(e.target.value)
                                   }
                                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              >
                                   <option value="ALL">Todos los tipos</option>
                                   <option value="REGULAR">Regular</option>
                                   <option value="SUBSTITUTE">Auxiliar</option>
                                   <option value="ASSISTANT">Asistente</option>
                              </select>
                         </div>

                         <div className="flex items-end gap-2">
                              <button
                                   onClick={handleClearFilters}
                                   className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                              >
                                   Limpiar Filtros
                              </button>
                         </div>
                    </div>
               </div>

               <div className="mb-6 flex justify-end gap-3">
                    <button
                         onClick={handleRefresh}
                         className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                         <RefreshCw className="h-4 w-4" />
                         Actualizar
                    </button>
                    <button
                         onClick={() => navigate("/asignaciones/nuevo")}
                         className="inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                    >
                         <Plus className="h-4 w-4" />
                         Nueva Asignación
                    </button>
               </div>

               <TeacherList
                    items={currentItems}
                    onDelete={handleDelete}
                    onRestore={handleRestore}
                    startIndex={startIndex}
               />

               {totalPages > 1 && (
                    <Pagination
                         currentPage={currentPage}
                         totalPages={totalPages}
                         onPageChange={setCurrentPage}
                         hasNext={currentPage < totalPages}
                         hasPrevious={currentPage > 1}
                         totalItems={filteredItems.length}
                         itemsPerPage={ITEMS_PER_PAGE}
                    />
               )}
          </div>
     );
}
