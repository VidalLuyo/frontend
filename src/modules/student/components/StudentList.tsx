/**
 * Componente: StudentList
 * Muestra la lista de estudiantes con paginación
 */

import { useNavigate } from "react-router-dom";
import { Eye, Edit3, User, Trash2, RotateCcw } from "lucide-react";
import { usePagination } from "../../../shared/hooks/usePagination";
import { Pagination } from "../../../shared/components/Pagination";
import {
     showDeleteConfirm,
     showRestoreConfirm,
} from "../../../shared/utils/sweetAlert";
import type { Student } from "../models/student.model";

interface StudentListProps {
     readonly items: Student[];
     readonly onDelete?: (studentId: string) => void;
     readonly onRestore?: (studentId: string) => void;
}

export function StudentList({ items, onDelete, onRestore }: StudentListProps) {
     const navigate = useNavigate();

     const {
          currentPage,
          totalPages,
          paginatedData,
          goToPage,
          hasNext,
          hasPrevious,
          totalItems,
     } = usePagination({ data: items || [], itemsPerPage: 8 });

     const handleView = (studentId: string) => {
          navigate(`/estudiantes/${studentId}`);
     };

     const handleEdit = (studentId: string) => {
          navigate(`/estudiantes/${studentId}/editar`);
     };

     const handleDelete = async (studentId: string, studentName: string) => {
          const result = await showDeleteConfirm(studentName);
          if (result.isConfirmed) {
               onDelete?.(studentId);
          }
     };

     const handleRestore = async (studentId: string, studentName: string) => {
          const result = await showRestoreConfirm(studentName);
          if (result.isConfirmed) {
               onRestore?.(studentId);
          }
     };

     const getStatusClass = (status: string) => {
          return status === "ACTIVE"
               ? "bg-green-100 text-green-800"
               : "bg-red-100 text-red-800";
     };

     const getStatusText = (status: string) => {
          return status === "ACTIVE" ? "Activo" : "Inactivo";
     };

     const formatAge = (age: number) => {
          return `${age} años`;
     };

     return (
          <>
               <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                         <thead className="bg-gray-50">
                              <tr>
                                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Estudiante
                                   </th>
                                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Información Personal
                                   </th>
                                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tutores
                                   </th>
                                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Estado
                                   </th>
                                   <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Acciones
                                   </th>
                              </tr>
                         </thead>
                         <tbody className="bg-white divide-y divide-gray-200">
                              {paginatedData.map((student) => (
                                   <tr
                                        key={student.studentId}
                                        className="hover:bg-gray-50"
                                   >
                                        <td className="px-6 py-4">
                                             <div className="flex items-center">
                                                  {student.photoPerfil ? (
                                                       <img
                                                            src={
                                                                 student.photoPerfil
                                                            }
                                                            alt={
                                                                 student.personalInfo?.names || "Estudiante"
                                                            }
                                                            className="h-10 w-10 rounded-full object-cover"
                                                       />
                                                  ) : (
                                                       <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                            <User className="h-6 w-6 text-indigo-600" />
                                                       </div>
                                                  )}
                                                  <div className="ml-4">
                                                       <div className="text-sm font-medium text-gray-900">
                                                            {student.personalInfo?.names || "N/A"}
                                                       </div>
                                                       <div className="text-sm text-gray-500">
                                                            {student.personalInfo?.lastNames || "N/A"}
                                                       </div>
                                                  </div>
                                             </div>
                                        </td>
                                        <td className="px-6 py-4">
                                             <div className="flex flex-col">
                                                  <div className="text-sm text-gray-900">
                                                       <span className="font-medium">
                                                            CUI:
                                                       </span>{" "}
                                                       {student.cui || "N/A"}
                                                  </div>
                                                  <div className="text-sm text-gray-500">
                                                       {student.personalInfo?.documentType || "N/A"}
                                                       :{" "}
                                                       {student.personalInfo?.documentNumber || "N/A"}
                                                  </div>
                                                  <div className="text-sm text-gray-500">
                                                       {student.personalInfo?.age
                                                            ? formatAge(student.personalInfo.age)
                                                            : "N/A"}{" "}
                                                       •{" "}
                                                       {student.personalInfo?.gender || "N/A"}
                                                  </div>
                                             </div>
                                        </td>
                                        <td className="px-6 py-4">
                                             <div className="text-sm text-gray-900">
                                                  {student.guardians && student.guardians.length >
                                                       0 ? (
                                                       <>
                                                            <div className="font-medium">
                                                                 {
                                                                      student
                                                                           .guardians[0]
                                                                           .names
                                                                 }{" "}
                                                                 {
                                                                      student
                                                                           .guardians[0]
                                                                           .lastNames
                                                                 }
                                                            </div>
                                                            <div className="text-gray-500">
                                                                 {
                                                                      student
                                                                           .guardians[0]
                                                                           .phone
                                                                 }
                                                            </div>
                                                            {student.guardians
                                                                 .length >
                                                                 1 && (
                                                                      <div className="text-xs text-gray-400 mt-1">
                                                                           +
                                                                           {student
                                                                                .guardians
                                                                                .length -
                                                                                1}{" "}
                                                                           más
                                                                      </div>
                                                                 )}
                                                       </>
                                                  ) : (
                                                       <span className="text-gray-400 text-xs">Sin tutores registrados</span>
                                                  )}
                                             </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                             <span
                                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(
                                                       student.status
                                                  )}`}
                                             >
                                                  {getStatusText(
                                                       student.status
                                                  )}
                                             </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                             <div className="flex justify-end space-x-2">
                                                  <button
                                                       onClick={() =>
                                                            handleView(
                                                                 student.studentId
                                                            )
                                                       }
                                                       className="inline-flex items-center px-2 py-1 border border-blue-300 rounded-md text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors duration-200"
                                                       title="Ver detalles"
                                                  >
                                                       <Eye className="h-4 w-4 mr-1" />
                                                  </button>
                                                  {student.status === "ACTIVE" && (
                                                       <>
                                                            <button
                                                                 onClick={() =>
                                                                      handleEdit(
                                                                           student.studentId
                                                                      )
                                                                 }
                                                                 className="inline-flex items-center px-2 py-1 border border-indigo-300 rounded-md text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200"
                                                                 title="Editar estudiante"
                                                            >
                                                                 <Edit3 className="h-4 w-4 mr-1" />
                                                            </button>
                                                            <button
                                                                 onClick={() =>
                                                                      handleDelete(
                                                                           student.studentId,
                                                                           `${student.personalInfo.names} ${student.personalInfo.lastNames}`
                                                                      )
                                                                 }
                                                                 className="inline-flex items-center px-2 py-1 border border-red-300 rounded-md text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors duration-200"
                                                                 title="Eliminar estudiante"
                                                            >
                                                                 <Trash2 className="h-4 w-4 mr-1" />
                                                            </button>
                                                       </>
                                                  )}
                                                  {student.status === "INACTIVE" && (
                                                       <button
                                                            onClick={() =>
                                                                 handleRestore(
                                                                      student.studentId,
                                                                      `${student.personalInfo.names} ${student.personalInfo.lastNames}`
                                                                 )
                                                            }
                                                            className="inline-flex items-center px-2 py-1 border border-green-300 rounded-md text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors duration-200"
                                                            title="Restaurar estudiante"
                                                       >
                                                            <RotateCcw className="h-4 w-4 mr-1" />
                                                       </button>
                                                  )}
                                             </div>
                                        </td>
                                   </tr>
                              ))}
                         </tbody>
                    </table>

                    {paginatedData.length === 0 && (
                         <div className="text-center py-12">
                              <div className="text-gray-500">
                                   No se encontraron estudiantes
                              </div>
                         </div>
                    )}
               </div>

               <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={goToPage}
                    hasNext={hasNext}
                    hasPrevious={hasPrevious}
                    totalItems={totalItems}
                    itemsPerPage={8}
               />
          </>
     );
}
