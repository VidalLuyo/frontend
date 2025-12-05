import { useNavigate } from "react-router-dom";
import { Eye, Pencil, Trash2, RotateCcw } from "lucide-react";
import type { TeacherAssignmentSummary, Status } from "../models/teacher.model";

interface TeacherListProps {
     readonly items: TeacherAssignmentSummary[];
     readonly onDelete?: (id: string, teacherName: string) => void;
     readonly onRestore?: (id: string, teacherName: string) => void;
     readonly startIndex?: number;
}

export function TeacherList({
     items,
     onDelete,
     onRestore,
     startIndex = 0,
}: TeacherListProps) {
     const navigate = useNavigate();

     const handleView = (id: string) => {
          navigate(`/asignaciones/${id}`);
     };

     const handleEdit = (id: string) => {
          navigate(`/asignaciones/${id}/editar`);
     };

     const getStatusBadge = (status: Status) => {
          const statusConfig = {
               ACTIVE: {
                    bg: "bg-green-100",
                    text: "text-green-800",
                    label: "Activo",
               },
               INACTIVE: {
                    bg: "bg-red-100",
                    text: "text-red-800",
                    label: "Inactivo",
               },
               COMPLETED: {
                    bg: "bg-gray-100",
                    text: "text-gray-800",
                    label: "Completado",
               },
          };
          const config = statusConfig[status];
          return (
               <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.bg} ${config.text}`}
               >
                    {config.label}
               </span>
          );
     };

     const getAssignmentTypeBadge = (type: string) => {
          const typeConfig = {
               REGULAR: {
                    bg: "bg-blue-100",
                    text: "text-blue-800",
                    label: "Regular",
               },
               SUBSTITUTE: {
                    bg: "bg-yellow-100",
                    text: "text-yellow-800",
                    label: "Auxiliar",
               },
               ASSISTANT: {
                    bg: "bg-purple-100",
                    text: "text-purple-800",
                    label: "Asistente",
               },
          };
          const config = typeConfig[type as keyof typeof typeConfig];
          return (
               <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.bg} ${config.text}`}
               >
                    {config.label}
               </span>
          );
     };

     if (items.length === 0) {
          return (
               <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-12 text-center text-gray-500">
                         No se encontraron asignaciones
                    </div>
               </div>
          );
     }

     return (
          <div className="bg-white rounded-lg shadow overflow-hidden">
               <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                         <thead className="bg-gray-50">
                              <tr>
                                   <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                                        #
                                   </th>
                                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Profesor
                                   </th>
                                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Información
                                   </th>
                                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tipo
                                   </th>
                                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Estado
                                   </th>
                                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Período
                                   </th>
                                   <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Acciones
                                   </th>
                              </tr>
                         </thead>
                         <tbody className="bg-white divide-y divide-gray-200">
                              {items.map((item, index) => (
                                   <tr
                                        key={item.id}
                                        className="hover:bg-gray-50 transition-colors"
                                   >
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                             <div className="text-sm font-medium text-gray-900">
                                                  {startIndex + index + 1}
                                             </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                             <div className="text-sm font-medium text-gray-900">
                                                  {item.teacherName}
                                             </div>
                                             <div className="text-sm text-gray-500">
                                                  {item.institutionName}
                                             </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                             <div className="text-sm text-gray-900">
                                                  Año: {item.academicYear}
                                             </div>
                                             <div className="text-sm text-gray-500">
                                                  {item.totalClassrooms} aulas •{" "}
                                                  {item.totalSchedules} horarios
                                             </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                             {getAssignmentTypeBadge(
                                                  item.assignmentType
                                             )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                             {getStatusBadge(item.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                             <div className="text-sm text-gray-900">
                                                  {new Date(
                                                       item.startDate
                                                  ).toLocaleDateString("es-ES")}
                                             </div>
                                             <div className="text-sm text-gray-500">
                                                  {new Date(
                                                       item.endDate
                                                  ).toLocaleDateString("es-ES")}
                                             </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                             <div className="flex justify-end gap-2">
                                                  <button
                                                       onClick={() =>
                                                            handleView(item.id)
                                                       }
                                                       className="inline-flex items-center px-3 py-1.5 border border-blue-300 rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                                                       title="Ver detalles"
                                                  >
                                                       <Eye className="h-4 w-4" />
                                                  </button>
                                                  <button
                                                       onClick={() =>
                                                            handleEdit(item.id)
                                                       }
                                                       className="inline-flex items-center px-3 py-1.5 border border-indigo-300 rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                                                       title="Editar"
                                                  >
                                                       <Pencil className="h-4 w-4" />
                                                  </button>
                                                  {item.status ===
                                                  "INACTIVE" ? (
                                                       <button
                                                            onClick={() =>
                                                                 onRestore?.(
                                                                      item.id,
                                                                      item.teacherName
                                                                 )
                                                            }
                                                            className="inline-flex items-center px-3 py-1.5 border border-green-300 rounded-md text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                                                            title="Restaurar"
                                                       >
                                                            <RotateCcw className="h-4 w-4" />
                                                       </button>
                                                  ) : (
                                                       <button
                                                            onClick={() =>
                                                                 onDelete?.(
                                                                      item.id,
                                                                      item.teacherName
                                                                 )
                                                            }
                                                            className="inline-flex items-center px-3 py-1.5 border border-red-300 rounded-md text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                                                            title="Eliminar"
                                                       >
                                                            <Trash2 className="h-4 w-4" />
                                                       </button>
                                                  )}
                                             </div>
                                        </td>
                                   </tr>
                              ))}
                         </tbody>
                    </table>
               </div>
          </div>
     );
}
