import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, X, User, Building2, Clock, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { teacherAssignmentService } from "../service/Teacher.service";
import { externalDataService } from "../service/ExternalData.service";
import type {
     TeacherOption,
     InstitutionOption,
     ClassroomOption,
     CourseOption,
} from "../service/ExternalData.service";
import {
     showSuccessAlert,
     showErrorAlert,
     showLoadingAlert,
     closeAlert,
} from "../../../shared/utils/sweetAlert";
import type {
     CreateTeacherAssignmentDto,
     AssignmentType,
     SessionType,
} from "../models/teacher.model";

import { DateRangePicker, isWeekday, isDateAfter } from "../components/DateRangePicker";

const DAYS_OF_WEEK = [
     { value: "MONDAY", label: "Lunes" },
     { value: "TUESDAY", label: "Martes" },
     { value: "WEDNESDAY", label: "Miércoles" },
     { value: "THURSDAY", label: "Jueves" },
     { value: "FRIDAY", label: "Viernes" },
     { value: "SATURDAY", label: "Sábado" },
     { value: "SUNDAY", label: "Domingo" },
];

export function TeacherCreatePage() {
     const navigate = useNavigate();
     const [loading, setLoading] = useState(true);

     const [teachers, setTeachers] = useState<TeacherOption[]>([]);
     const [institutions, setInstitutions] = useState<InstitutionOption[]>([]);
     const [classroomOptions, setClassroomOptions] = useState<
          ClassroomOption[]
     >([]);
     const [courses, setCourses] = useState<CourseOption[]>([]);

     const [formData, setFormData] = useState({
          teacherUserId: "",
          institutionId: "",
          assignmentType: "REGULAR" as AssignmentType,
          startDate: "",
          endDate: "",
          notes: "",
     });

     const [classrooms, setClassrooms] = useState<
          Array<{ classroomId: string; isPrimary: boolean }>
     >([{ classroomId: "", isPrimary: true }]);

     const [schedules, setSchedules] = useState<
          Array<{
               courseId: string;
               dayOfWeek: string;
               startTime: string;
               endTime: string;
               sessionType: SessionType;
               sessionName: string;
               classroomId: string;
          }>
     >([]);

     const [dateErrors, setDateErrors] = useState({
          startDate: '',
          endDate: ''
     });

     useEffect(() => {
          loadInitialData();
     }, []);

     useEffect(() => {
          if (formData.institutionId) {
               loadClassrooms(formData.institutionId);
               setClassrooms([{ classroomId: "", isPrimary: true }]);
               setSchedules((prev) =>
                    prev.map((s) => ({ ...s, classroomId: "" }))
               );
          } else {
               setClassroomOptions([]);
               setClassrooms([{ classroomId: "", isPrimary: true }]);
          }
     }, [formData.institutionId]);

     const loadInitialData = async () => {
          try {
               setLoading(true);
               const [teachersData, institutionsData, coursesData] =
                    await Promise.all([
                         externalDataService.getTeachers(),
                         externalDataService.getInstitutions(),
                         externalDataService.getCourses(),
                    ]);

               setTeachers(teachersData);
               setInstitutions(institutionsData);
               setCourses(coursesData);
          } catch (error) {
               console.error("Error cargando datos:", error);
               showErrorAlert(
                    "Error",
                    "No se pudieron cargar los datos iniciales"
               );
          } finally {
               setLoading(false);
          }
     };

     const loadClassrooms = async (institutionId: string) => {
          try {
               const classroomsData =
                    await externalDataService.getClassroomsByInstitution(
                         institutionId
                    );
               setClassroomOptions(classroomsData);
          } catch (error) {
               console.error("Error cargando aulas:", error);
               setClassroomOptions([]);
          }
     };

     const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();

          if (
               !formData.teacherUserId ||
               !formData.institutionId ||
               !formData.startDate ||
               !formData.endDate
          ) {
               showErrorAlert(
                    "Error",
                    "Complete todos los campos obligatorios"
               );
               return;
          }

          if (
               classrooms.length === 0 ||
               classrooms.some((c) => !c.classroomId)
          ) {
               showErrorAlert("Error", "Debe asignar al menos un aula válida");
               return;
          }

          const hasInvalidSchedules = schedules.some(
               (s) =>
                    !s.dayOfWeek || !s.startTime || !s.endTime || !s.sessionType
          );

          if (hasInvalidSchedules) {
               showErrorAlert(
                    "Error",
                    "Complete todos los campos obligatorios de los horarios o elimínelos"
               );
               return;
          }

          if (!isWeekday(formData.startDate) || !isWeekday(formData.endDate)) {
               showErrorAlert(
                    "Error",
                    "Las fechas deben ser días laborales (lunes a viernes)"
               );
               return;
          }

          if (new Date(formData.endDate) < new Date(formData.startDate)) {
               showErrorAlert(
                    "Error",
                    "La fecha de fin debe ser posterior a la fecha de inicio"
               );
               return;
          }

          if (dateErrors.startDate || dateErrors.endDate) {
               showErrorAlert(
                    "Error",
                    "Corrija los errores en las fechas antes de continuar"
               );
               return;
          }

          const data: CreateTeacherAssignmentDto = {
               ...formData,
               classrooms: classrooms.map((c) => ({
                    classroomId: c.classroomId,
                    isPrimary: c.isPrimary,
               })),
               schedules: schedules.length > 0 ? schedules : undefined,
          };

          try {
               showLoadingAlert("Creando asignación...");
               await teacherAssignmentService.create(data);
               closeAlert();
               await showSuccessAlert(
                    "¡Éxito!",
                    "Asignación creada correctamente"
               );
               navigate("/asignaciones");
          } catch (error) {
               closeAlert();
               const message =
                    error instanceof Error
                         ? error.message
                         : "No se pudo crear la asignación";
               showErrorAlert("Error", message);
          }
     };

     const addClassroom = () => {
          if (classrooms.length >= classroomOptions.length) {
               showErrorAlert(
                    "Error",
                    "Ya has agregado todas las aulas disponibles"
               );
               return;
          }
          setClassrooms([...classrooms, { classroomId: "", isPrimary: false }]);
     };

     const removeClassroom = (index: number) => {
          setClassrooms(classrooms.filter((_, i) => i !== index));
     };

     const updateClassroom = (
          index: number,
          field: "classroomId" | "isPrimary",
          value: string | boolean
     ) => {
          const updated = [...classrooms];

          if (field === "isPrimary" && value === true) {
               updated.forEach((classroom, i) => {
                    classroom.isPrimary = i === index;
               });
          } else {
               updated[index] = { ...updated[index], [field]: value };
          }

          setClassrooms(updated);
     };

     const addSchedule = () => {
          setSchedules([
               ...schedules,
               {
                    courseId: "",
                    dayOfWeek: "MONDAY",
                    startTime: "",
                    endTime: "",
                    sessionType: "INDIVIDUAL",
                    sessionName: "",
                    classroomId: "",
               },
          ]);
     };

     const removeSchedule = (index: number) => {
          setSchedules(schedules.filter((_, i) => i !== index));
     };

     const updateSchedule = (index: number, field: string, value: string) => {
          const updated = [...schedules];
          updated[index] = { ...updated[index], [field]: value };
          setSchedules(updated);
     };

     const handleDateRangeChange = (startDate: string, endDate: string) => {
          let newErrors = { ...dateErrors };

          // Validar fecha de inicio
          if (startDate && !isWeekday(startDate)) {
               newErrors.startDate = 'Solo se permiten fechas de lunes a viernes';
          } else {
               newErrors.startDate = '';
          }

          // Validar fecha de fin
          if (endDate && !isWeekday(endDate)) {
               newErrors.endDate = 'Solo se permiten fechas de lunes a viernes';
          } else if (endDate && startDate && !isDateAfter(startDate, endDate)) {
               newErrors.endDate = 'La fecha de fin debe ser posterior a la fecha de inicio';
          } else {
               newErrors.endDate = '';
          }

          setDateErrors(newErrors);
          setFormData(prev => ({ ...prev, startDate, endDate }));
     }; return (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
               <button
                    onClick={() => navigate("/asignaciones")}
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
               >
                    <ArrowLeft className="h-5 w-5" />
                    Volver
               </button>

               <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">
                         Nueva Asignación
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                         Complete el formulario para crear una nueva asignación
                         de profesor
                    </p>
               </div>

               {loading ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                         <p className="text-gray-500">Cargando datos...</p>
                    </div>
               ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                         <div className="bg-white rounded-lg shadow">
                              <div className="px-6 py-4 border-b border-gray-200">
                                   <div className="flex items-center gap-2">
                                        <User className="h-5 w-5 text-indigo-600" />
                                        <h2 className="text-lg font-semibold text-gray-900">
                                             Información General
                                        </h2>
                                   </div>
                              </div>
                              <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Profesor{" "}
                                             <span className="text-red-500">
                                                  *
                                             </span>
                                        </label>
                                        <select
                                             value={formData.teacherUserId}
                                             onChange={(e) =>
                                                  setFormData({
                                                       ...formData,
                                                       teacherUserId:
                                                            e.target.value,
                                                  })
                                             }
                                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                             required
                                        >
                                             <option value="">
                                                  Seleccione un profesor
                                             </option>
                                             {teachers.map((teacher) => (
                                                  <option
                                                       key={teacher.id}
                                                       value={teacher.id}
                                                  >
                                                       {teacher.name}
                                                  </option>
                                             ))}
                                        </select>
                                   </div>

                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Institución{" "}
                                             <span className="text-red-500">
                                                  *
                                             </span>
                                        </label>
                                        <select
                                             value={formData.institutionId}
                                             onChange={(e) =>
                                                  setFormData({
                                                       ...formData,
                                                       institutionId:
                                                            e.target.value,
                                                  })
                                             }
                                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                             required
                                        >
                                             <option value="">
                                                  Seleccione una institución
                                             </option>
                                             {institutions.map(
                                                  (institution) => (
                                                       <option
                                                            key={institution.id}
                                                            value={
                                                                 institution.id
                                                            }
                                                       >
                                                            {institution.name}
                                                       </option>
                                                  )
                                             )}
                                        </select>
                                   </div>

                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Tipo de Asignación{" "}
                                             <span className="text-red-500">
                                                  *
                                             </span>
                                        </label>
                                        <select
                                             value={formData.assignmentType}
                                             onChange={(e) =>
                                                  setFormData({
                                                       ...formData,
                                                       assignmentType: e.target
                                                            .value as AssignmentType,
                                                  })
                                             }
                                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                             required
                                        >
                                             <option value="REGULAR">
                                                  Regular
                                             </option>
                                             <option value="SUBSTITUTE">
                                                  Auxiliar
                                             </option>
                                             <option value="ASSISTANT">
                                                  Asistente
                                             </option>
                                        </select>
                                   </div>

                                   <div className="md:col-span-2">
                                        <DateRangePicker
                                             label="Período de Asignación"
                                             startDate={formData.startDate}
                                             endDate={formData.endDate}
                                             onChange={handleDateRangeChange}
                                             error={dateErrors.startDate || dateErrors.endDate}
                                             required
                                        />
                                   </div>

                                   <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Notas
                                        </label>
                                        <textarea
                                             value={formData.notes}
                                             onChange={(e) =>
                                                  setFormData({
                                                       ...formData,
                                                       notes: e.target.value,
                                                  })
                                             }
                                             rows={3}
                                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                             placeholder="Notas adicionales..."
                                        />
                                   </div>
                              </div>
                         </div>

                         <div className="bg-white rounded-lg shadow">
                              <div className="px-6 py-4 border-b border-gray-200">
                                   <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                             <Building2 className="h-5 w-5 text-indigo-600" />
                                             <h2 className="text-lg font-semibold text-gray-900">
                                                  Aulas Asignadas
                                             </h2>
                                        </div>
                                        <button
                                             type="button"
                                             onClick={addClassroom}
                                             disabled={
                                                  classrooms.length >=
                                                  classroomOptions.length
                                             }
                                             className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        >
                                             <Plus className="h-4 w-4" />
                                             Agregar Aula
                                        </button>
                                   </div>
                              </div>
                              <div className="px-6 py-4 space-y-3">
                                   {classrooms.map((classroom, index) => (
                                        <div
                                             key={index}
                                             className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                                        >
                                             <div className="flex gap-3 items-start">
                                                  <div className="flex-1">
                                                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            <div>
                                                                 <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                      Aula{" "}
                                                                      <span className="text-red-500">
                                                                           *
                                                                      </span>
                                                                 </label>
                                                                 <select
                                                                      value={
                                                                           classroom.classroomId
                                                                      }
                                                                      onChange={(e) =>
                                                                           updateClassroom(
                                                                                index,
                                                                                "classroomId",
                                                                                e.target
                                                                                     .value
                                                                           )
                                                                      }
                                                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                                      required
                                                                      disabled={
                                                                           !formData.institutionId
                                                                      }
                                                                 >
                                                                      <option value="">
                                                                           {formData.institutionId
                                                                                ? "Seleccione un aula"
                                                                                : "Primero seleccione una institución"}
                                                                      </option>
                                                                      {classroomOptions
                                                                           .filter(
                                                                                (cr) =>
                                                                                     !classrooms.some(
                                                                                          (
                                                                                               c,
                                                                                               ci
                                                                                          ) =>
                                                                                               ci !==
                                                                                               index &&
                                                                                               c.classroomId ===
                                                                                               cr.id
                                                                                     )
                                                                           )
                                                                           .map((cr) => (
                                                                                <option
                                                                                     key={
                                                                                          cr.id
                                                                                     }
                                                                                     value={
                                                                                          cr.id
                                                                                     }
                                                                                >
                                                                                     {
                                                                                          cr.name
                                                                                     }
                                                                                </option>
                                                                           ))}
                                                                 </select>
                                                            </div>
                                                            <div className="flex flex-col justify-end">
                                                                 <div className="h-8 flex items-center">
                                                                      <label className="flex items-center gap-2 cursor-pointer">
                                                                           <input
                                                                                type="checkbox"
                                                                                checked={
                                                                                     classroom.isPrimary
                                                                                }
                                                                                onChange={(
                                                                                     e
                                                                                ) =>
                                                                                     updateClassroom(
                                                                                          index,
                                                                                          "isPrimary",
                                                                                          e
                                                                                               .target
                                                                                               .checked
                                                                                     )
                                                                                }
                                                                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                                                           />
                                                                           <span className="text-sm font-medium text-gray-700">
                                                                                Aula Principal
                                                                           </span>
                                                                      </label>
                                                                 </div>
                                                            </div>
                                                       </div>
                                                  </div>
                                                  {classrooms.length > 1 && (
                                                       <button
                                                            type="button"
                                                            onClick={() =>
                                                                 removeClassroom(
                                                                      index
                                                                 )
                                                            }
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                       >
                                                            <X className="h-5 w-5" />
                                                       </button>
                                                  )}
                                             </div>
                                        </div>
                                   ))}
                              </div>
                         </div>

                         <div className="bg-white rounded-lg shadow">
                              <div className="px-6 py-4 border-b border-gray-200">
                                   <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                             <Clock className="h-5 w-5 text-indigo-600" />
                                             <h2 className="text-lg font-semibold text-gray-900">
                                                  Horarios
                                             </h2>
                                        </div>
                                        <button
                                             type="button"
                                             onClick={addSchedule}
                                             className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                                        >
                                             <Plus className="h-4 w-4" />
                                             Agregar Horario
                                        </button>
                                   </div>
                              </div>
                              <div className="px-6 py-4 space-y-3">
                                   {schedules.length === 0 ? (
                                        <p className="text-gray-500 text-center py-4">
                                             No hay horarios agregados
                                        </p>
                                   ) : (
                                        schedules.map((schedule, index) => (
                                             <div
                                                  key={index}
                                                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                                             >
                                                  <div className="flex justify-between items-start mb-3">
                                                       <h3 className="text-sm font-medium text-gray-900">
                                                            Horario #{index + 1}
                                                       </h3>
                                                       <button
                                                            type="button"
                                                            onClick={() =>
                                                                 removeSchedule(
                                                                      index
                                                                 )
                                                            }
                                                            className="p-1 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                       >
                                                            <X className="h-4 w-4" />
                                                       </button>
                                                  </div>
                                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                       <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                 Curso
                                                            </label>
                                                            <select
                                                                 value={
                                                                      schedule.courseId
                                                                 }
                                                                 onChange={(
                                                                      e
                                                                 ) =>
                                                                      updateSchedule(
                                                                           index,
                                                                           "courseId",
                                                                           e
                                                                                .target
                                                                                .value
                                                                      )
                                                                 }
                                                                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                            >
                                                                 <option value="">
                                                                      Seleccione
                                                                      un curso
                                                                 </option>
                                                                 {courses.map(
                                                                      (
                                                                           course
                                                                      ) => (
                                                                           <option
                                                                                key={
                                                                                     course.id
                                                                                }
                                                                                value={
                                                                                     course.id
                                                                                }
                                                                           >
                                                                                {
                                                                                     course.name
                                                                                }{" "}
                                                                                (
                                                                                {
                                                                                     course.code
                                                                                }

                                                                                )
                                                                           </option>
                                                                      )
                                                                 )}
                                                            </select>
                                                       </div>
                                                       <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                 Día
                                                            </label>
                                                            <select
                                                                 value={
                                                                      schedule.dayOfWeek
                                                                 }
                                                                 onChange={(
                                                                      e
                                                                 ) =>
                                                                      updateSchedule(
                                                                           index,
                                                                           "dayOfWeek",
                                                                           e
                                                                                .target
                                                                                .value
                                                                      )
                                                                 }
                                                                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                            >
                                                                 {DAYS_OF_WEEK.map(
                                                                      (day) => (
                                                                           <option
                                                                                key={
                                                                                     day.value
                                                                                }
                                                                                value={
                                                                                     day.value
                                                                                }
                                                                           >
                                                                                {
                                                                                     day.label
                                                                                }
                                                                           </option>
                                                                      )
                                                                 )}
                                                            </select>
                                                       </div>
                                                       <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                 Hora Inicio
                                                            </label>
                                                            <input
                                                                 type="time"
                                                                 value={
                                                                      schedule.startTime
                                                                 }
                                                                 onChange={(
                                                                      e
                                                                 ) =>
                                                                      updateSchedule(
                                                                           index,
                                                                           "startTime",
                                                                           e
                                                                                .target
                                                                                .value
                                                                      )
                                                                 }
                                                                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                            />
                                                       </div>
                                                       <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                 Hora Fin
                                                            </label>
                                                            <input
                                                                 type="time"
                                                                 value={
                                                                      schedule.endTime
                                                                 }
                                                                 onChange={(
                                                                      e
                                                                 ) =>
                                                                      updateSchedule(
                                                                           index,
                                                                           "endTime",
                                                                           e
                                                                                .target
                                                                                .value
                                                                      )
                                                                 }
                                                                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                            />
                                                       </div>
                                                       <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                 Tipo Sesión
                                                            </label>
                                                            <select
                                                                 value={
                                                                      schedule.sessionType
                                                                 }
                                                                 onChange={(
                                                                      e
                                                                 ) =>
                                                                      updateSchedule(
                                                                           index,
                                                                           "sessionType",
                                                                           e
                                                                                .target
                                                                                .value
                                                                      )
                                                                 }
                                                                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                            >
                                                                 <option value="INDIVIDUAL">
                                                                      Individual
                                                                 </option>
                                                                 <option value="MULTI_CLASSROOM">
                                                                      Múltiple
                                                                 </option>
                                                            </select>
                                                       </div>
                                                       <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                 Aula
                                                            </label>
                                                            <select
                                                                 value={
                                                                      schedule.classroomId
                                                                 }
                                                                 onChange={(
                                                                      e
                                                                 ) =>
                                                                      updateSchedule(
                                                                           index,
                                                                           "classroomId",
                                                                           e
                                                                                .target
                                                                                .value
                                                                      )
                                                                 }
                                                                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                                 disabled={
                                                                      !formData.institutionId
                                                                 }
                                                            >
                                                                 <option value="">
                                                                      {formData.institutionId
                                                                           ? "Seleccione un aula"
                                                                           : "Primero seleccione una institución"}
                                                                 </option>
                                                                 {classroomOptions.map(
                                                                      (cr) => (
                                                                           <option
                                                                                key={
                                                                                     cr.id
                                                                                }
                                                                                value={
                                                                                     cr.id
                                                                                }
                                                                           >
                                                                                {
                                                                                     cr.name
                                                                                }
                                                                           </option>
                                                                      )
                                                                 )}
                                                            </select>
                                                       </div>
                                                       <div className="sm:col-span-2">
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                 Nombre Sesión
                                                            </label>
                                                            <input
                                                                 type="text"
                                                                 value={
                                                                      schedule.sessionName
                                                                 }
                                                                 onChange={(
                                                                      e
                                                                 ) =>
                                                                      updateSchedule(
                                                                           index,
                                                                           "sessionName",
                                                                           e
                                                                                .target
                                                                                .value
                                                                      )
                                                                 }
                                                                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                                 placeholder="Nombre de la sesión"
                                                            />
                                                       </div>
                                                  </div>
                                             </div>
                                        ))
                                   )}
                              </div>
                         </div>

                         <div className="flex justify-end gap-3">
                              <button
                                   type="button"
                                   onClick={() => navigate("/asignaciones")}
                                   className="px-6 py-2.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                   Cancelar
                              </button>
                              <button
                                   type="submit"
                                   className="px-6 py-2.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                              >
                                   Crear Asignación
                              </button>
                         </div>
                    </form>
               )}
          </div>
     );
}
