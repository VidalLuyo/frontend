import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
     ArrowLeft,
     User,
     Building2,
     Calendar,
     Clock,
     BookOpen,
     MapPin,
     AlertCircle,
} from "lucide-react";
import { teacherAssignmentService } from "../service/Teacher.service";
import { showErrorAlert } from "../../../shared/utils/sweetAlert";
import type {
     TeacherAssignmentDetail,
     Status,
     AssignmentType,
} from "../models/teacher.model";

const DAY_LABELS: Record<string, string> = {
     MONDAY: "Lunes",
     TUESDAY: "Martes",
     WEDNESDAY: "Miércoles",
     THURSDAY: "Jueves",
     FRIDAY: "Viernes",
     SATURDAY: "Sábado",
     SUNDAY: "Domingo",
};

export function TeacherDetailPage() {
     const { id } = useParams<{ id: string }>();
     const navigate = useNavigate();
     const [assignment, setAssignment] =
          useState<TeacherAssignmentDetail | null>(null);
     const [loading, setLoading] = useState(true);

     useEffect(() => {
          const fetchAssignment = async () => {
               if (!id) return;
               try {
                    setLoading(true);
                    const response = await teacherAssignmentService.getById(id);
                    setAssignment(response.data);
               } catch (error) {
                    showErrorAlert("Error", "No se pudo cargar la asignación");
                    console.error("Error:", error);
               } finally {
                    setLoading(false);
               }
          };
          fetchAssignment();
     }, [id]);

     const getStatusBadge = (status: Status) => {
          const config = {
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
          const c = config[status];
          return (
               <span
                    className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${c.bg} ${c.text}`}
               >
                    {c.label}
               </span>
          );
     };

     const getTypeBadge = (type: AssignmentType) => {
          const config = {
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
          const c = config[type];
          return (
               <span
                    className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${c.bg} ${c.text}`}
               >
                    {c.label}
               </span>
          );
     };

     if (loading) {
          return (
               <div className="flex justify-center items-center h-64">
                    <div className="text-gray-600">Cargando...</div>
               </div>
          );
     }

     if (!assignment) {
          return (
               <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="bg-white rounded-lg shadow p-6 text-center">
                         <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                         <p className="text-gray-600">
                              Asignación no encontrada
                         </p>
                    </div>
               </div>
          );
     }

     return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
               <div className="mb-6">
                    <button
                         onClick={() => navigate("/asignaciones")}
                         className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
                    >
                         <ArrowLeft className="h-5 w-5" />
                         Volver
                    </button>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                         <div>
                              <h1 className="text-3xl font-bold text-gray-900">
                                   Detalle de Asignación
                              </h1>
                              <p className="text-gray-600 mt-1">
                                   Información completa de la asignación del
                                   profesor
                              </p>
                         </div>
                         <div className="flex gap-3">
                              {getStatusBadge(assignment.status)}
                              {getTypeBadge(assignment.assignmentType)}
                         </div>
                    </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                         <div className="bg-white rounded-lg shadow">
                              <div className="px-6 py-4 border-b border-gray-200">
                                   <div className="flex items-center gap-2">
                                        <User className="h-5 w-5 text-indigo-600" />
                                        <h2 className="text-lg font-semibold text-gray-900">
                                             Información del Profesor
                                        </h2>
                                   </div>
                              </div>
                              <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                   <div>
                                        <label className="block text-sm font-medium text-gray-500">
                                             Nombre Completo
                                        </label>
                                        <p className="mt-1 text-base text-gray-900">
                                             {assignment.teacher.fullName}
                                        </p>
                                   </div>
                                   <div>
                                        <label className="block text-sm font-medium text-gray-500">
                                             DNI
                                        </label>
                                        <p className="mt-1 text-base text-gray-900">
                                             {assignment.teacher.documentNumber}
                                        </p>
                                   </div>
                                   <div>
                                        <label className="block text-sm font-medium text-gray-500">
                                             Correo Electrónico
                                        </label>
                                        <p className="mt-1 text-base text-gray-900">
                                             {assignment.teacher.email}
                                        </p>
                                   </div>
                                   <div>
                                        <label className="block text-sm font-medium text-gray-500">
                                             Año Académico
                                        </label>
                                        <p className="mt-1 text-base text-gray-900">
                                             {assignment.academicYear}
                                        </p>
                                   </div>
                              </div>
                         </div>

                         <div className="bg-white rounded-lg shadow">
                              <div className="px-6 py-4 border-b border-gray-200">
                                   <div className="flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-indigo-600" />
                                        <h2 className="text-lg font-semibold text-gray-900">
                                             Aulas Asignadas
                                        </h2>
                                   </div>
                              </div>
                              <div className="px-6 py-4">
                                   {assignment.classrooms.length === 0 ? (
                                        <p className="text-gray-500 text-center py-4">
                                             No hay aulas asignadas
                                        </p>
                                   ) : (
                                        <div className="space-y-3">
                                             {assignment.classrooms.map(
                                                  (classroom) => (
                                                       <div
                                                            key={classroom.id}
                                                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                                                       >
                                                            <div className="flex-1">
                                                                 <div className="flex items-center gap-2">
                                                                      <p className="font-medium text-gray-900">
                                                                           {
                                                                                classroom.classroomName
                                                                           }
                                                                      </p>
                                                                      {classroom.isPrimary && (
                                                                           <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-800 rounded-full">
                                                                                Principal
                                                                           </span>
                                                                      )}
                                                                 </div>
                                                                 <p className="text-sm text-gray-500 mt-1">
                                                                      {
                                                                           classroom.classroomAge
                                                                      }
                                                                 </p>
                                                            </div>
                                                            <div>
                                                                 {classroom.status ===
                                                                 "ACTIVE" ? (
                                                                      <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                                                                           Activo
                                                                      </span>
                                                                 ) : (
                                                                      <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">
                                                                           Inactivo
                                                                      </span>
                                                                 )}
                                                            </div>
                                                       </div>
                                                  )
                                             )}
                                        </div>
                                   )}
                              </div>
                         </div>

                         <div className="bg-white rounded-lg shadow">
                              <div className="px-6 py-4 border-b border-gray-200">
                                   <div className="flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-indigo-600" />
                                        <h2 className="text-lg font-semibold text-gray-900">
                                             Horarios
                                        </h2>
                                   </div>
                              </div>
                              <div className="px-6 py-4">
                                   {assignment.schedules.length === 0 ? (
                                        <p className="text-gray-500 text-center py-4">
                                             No hay horarios asignados
                                        </p>
                                   ) : (
                                        <div className="overflow-x-auto">
                                             <table className="min-w-full divide-y divide-gray-200">
                                                  <thead className="bg-gray-50">
                                                       <tr>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                                 Día
                                                            </th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                                 Curso
                                                            </th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                                 Horario
                                                            </th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                                 Aula
                                                            </th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                                 Tipo
                                                            </th>
                                                       </tr>
                                                  </thead>
                                                  <tbody className="bg-white divide-y divide-gray-200">
                                                       {assignment.schedules.map(
                                                            (schedule) => (
                                                                 <tr
                                                                      key={
                                                                           schedule.id
                                                                      }
                                                                      className="hover:bg-gray-50"
                                                                 >
                                                                      <td className="px-4 py-3 text-sm text-gray-900">
                                                                           {
                                                                                DAY_LABELS[
                                                                                     schedule
                                                                                          .dayOfWeek
                                                                                ]
                                                                           }
                                                                      </td>
                                                                      <td className="px-4 py-3 text-sm text-gray-900">
                                                                           {
                                                                                schedule.courseName
                                                                           }
                                                                      </td>
                                                                      <td className="px-4 py-3 text-sm text-gray-500">
                                                                           {
                                                                                schedule.startTime
                                                                           }{" "}
                                                                           -{" "}
                                                                           {
                                                                                schedule.endTime
                                                                           }
                                                                      </td>
                                                                      <td className="px-4 py-3 text-sm text-gray-500">
                                                                           {
                                                                                schedule.classroomName
                                                                           }
                                                                      </td>
                                                                      <td className="px-4 py-3">
                                                                           <span
                                                                                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                                                     schedule.sessionType ===
                                                                                     "INDIVIDUAL"
                                                                                          ? "bg-blue-100 text-blue-800"
                                                                                          : "bg-purple-100 text-purple-800"
                                                                                }`}
                                                                           >
                                                                                {schedule.sessionType ===
                                                                                "INDIVIDUAL"
                                                                                     ? "Individual"
                                                                                     : "Múltiple"}
                                                                           </span>
                                                                      </td>
                                                                 </tr>
                                                            )
                                                       )}
                                                  </tbody>
                                             </table>
                                        </div>
                                   )}
                              </div>
                         </div>
                    </div>

                    <div className="space-y-6">
                         <div className="bg-white rounded-lg shadow">
                              <div className="px-6 py-4 border-b border-gray-200">
                                   <div className="flex items-center gap-2">
                                        <Calendar className="h-5 w-5 text-indigo-600" />
                                        <h2 className="text-lg font-semibold text-gray-900">
                                             Período
                                        </h2>
                                   </div>
                              </div>
                              <div className="px-6 py-4 space-y-3">
                                   <div>
                                        <label className="block text-sm font-medium text-gray-500">
                                             Fecha Inicio
                                        </label>
                                        <p className="mt-1 text-base text-gray-900">
                                             {new Date(
                                                  assignment.startDate
                                             ).toLocaleDateString("es-ES", {
                                                  year: "numeric",
                                                  month: "long",
                                                  day: "numeric",
                                             })}
                                        </p>
                                   </div>
                                   <div>
                                        <label className="block text-sm font-medium text-gray-500">
                                             Fecha Fin
                                        </label>
                                        <p className="mt-1 text-base text-gray-900">
                                             {new Date(
                                                  assignment.endDate
                                             ).toLocaleDateString("es-ES", {
                                                  year: "numeric",
                                                  month: "long",
                                                  day: "numeric",
                                             })}
                                        </p>
                                   </div>
                              </div>
                         </div>

                         <div className="bg-white rounded-lg shadow">
                              <div className="px-6 py-4 border-b border-gray-200">
                                   <div className="flex items-center gap-2">
                                        <BookOpen className="h-5 w-5 text-indigo-600" />
                                        <h2 className="text-lg font-semibold text-gray-900">
                                             Estadísticas
                                        </h2>
                                   </div>
                              </div>
                              <div className="px-6 py-4 space-y-4">
                                   <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">
                                             Total Aulas
                                        </span>
                                        <span className="text-2xl font-bold text-indigo-600">
                                             {assignment.stats.totalClassrooms}
                                        </span>
                                   </div>
                                   <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">
                                             Total Cursos
                                        </span>
                                        <span className="text-2xl font-bold text-indigo-600">
                                             {assignment.stats.totalCourses}
                                        </span>
                                   </div>
                                   <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">
                                             Total Horarios
                                        </span>
                                        <span className="text-2xl font-bold text-indigo-600">
                                             {assignment.stats.totalSchedules}
                                        </span>
                                   </div>
                                   <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                                        <span className="text-sm text-gray-500">
                                             Horas Semanales
                                        </span>
                                        <span className="text-2xl font-bold text-green-600">
                                             {assignment.stats.totalWeeklyHours}
                                             h
                                        </span>
                                   </div>
                              </div>
                         </div>

                         {assignment.notes && (
                              <div className="bg-white rounded-lg shadow">
                                   <div className="px-6 py-4 border-b border-gray-200">
                                        <h2 className="text-lg font-semibold text-gray-900">
                                             Notas
                                        </h2>
                                   </div>
                                   <div className="px-6 py-4">
                                        <p className="text-sm text-gray-600">
                                             {assignment.notes}
                                        </p>
                                   </div>
                              </div>
                         )}
                    </div>
               </div>
          </div>
     );
}
