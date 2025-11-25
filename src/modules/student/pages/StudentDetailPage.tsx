/**
 * Página: StudentDetailPage
 * Página para ver los detalles de un estudiante
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
     User,
     Users,
     Heart,
     Activity,
     ArrowLeft,
     Edit,
     Building2,
     School,
} from "lucide-react";
import { studentsService } from "../service/Student.service";
import type { StudentWithInstitutionResponse } from "../models/student.model";

export function StudentDetailPage() {
     const { studentId } = useParams<{ studentId: string }>();
     const navigate = useNavigate();
     const [loading, setLoading] = useState(true);
     const [studentData, setStudentData] =
          useState<StudentWithInstitutionResponse | null>(null);

     useEffect(() => {
          const fetchStudent = async () => {
               if (!studentId) {
                    navigate("/estudiantes");
                    return;
               }

               try {
                    setLoading(true);
                    const data = await studentsService.getByIdWithInstitution(
                         studentId
                    );
                    setStudentData(data);
               } catch (error) {
                    console.error("Error al cargar estudiante:", error);
                    alert(
                         "Error al cargar estudiante: " +
                              (error instanceof Error
                                   ? error.message
                                   : "Error desconocido")
                    );
                    navigate("/estudiantes");
               } finally {
                    setLoading(false);
               }
          };

          fetchStudent();
     }, [studentId, navigate]);

     const getStatusText = (status: string) => {
          return status === "ACTIVE" ? "Activo" : "Inactivo";
     };

     const getStatusClass = (status: string) => {
          return status === "ACTIVE"
               ? "bg-green-100 text-green-800"
               : "bg-red-100 text-red-800";
     };

     if (loading) {
          return (
               <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
               </div>
          );
     }

     if (!studentData) {
          return (
               <div className="max-w-4xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                         <div className="text-sm text-red-700">
                              Estudiante no encontrado
                         </div>
                    </div>
               </div>
          );
     }

     const student = studentData.student;
     const institution = studentData.institution;
     const classroom = studentData.classroom;

     return (
          <div className="max-w-6xl mx-auto">
               <div className="mb-6 flex justify-between items-start">
                    <div className="flex items-center">
                         {student.photoPerfil ? (
                              <img
                                   src={student.photoPerfil}
                                   alt={student.personalInfo.names}
                                   className="h-20 w-20 rounded-full object-cover mr-4"
                              />
                         ) : (
                              <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
                                   <User className="h-12 w-12 text-indigo-600" />
                              </div>
                         )}
                         <div>
                              <h1 className="text-3xl font-bold text-gray-900">
                                   {student.personalInfo.names}{" "}
                                   {student.personalInfo.lastNames}
                              </h1>
                              <p className="mt-2 text-sm text-gray-600">
                                   CUI: {student.cui} •{" "}
                                   {student.personalInfo.age} años
                              </p>
                         </div>
                    </div>
                    <div className="flex space-x-3">
                         {student.status === "ACTIVE" && (
                              <button
                                   onClick={() =>
                                        navigate(
                                             `/estudiantes/${student.studentId}/editar`
                                        )
                                   }
                                   className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                              >
                                   <Edit className="h-4 w-4 mr-2" />
                                   Editar
                              </button>
                         )}
                         <button
                              onClick={() => navigate("/estudiantes")}
                              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                         >
                              <ArrowLeft className="h-4 w-4 mr-2" />
                              Volver
                         </button>
                    </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Información Académica */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                         <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                                   <Building2 className="h-5 w-5 mr-2 text-gray-600" />
                                   Información Académica
                              </h2>
                         </div>
                         <div className="px-6 py-4">
                              <dl className="space-y-4">
                                   <div>
                                        <dt className="text-sm font-medium text-gray-500">
                                             Institución Educativa
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900 font-medium">
                                             {institution.institutionName ||
                                                  "No especificado"}
                                        </dd>
                                   </div>
                                   <div>
                                        <dt className="text-sm font-medium text-gray-500 flex items-center">
                                             <School className="h-4 w-4 mr-1" />
                                             Aula Asignada
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900 font-medium">
                                             {classroom.classroomName ||
                                                  "No especificado"}
                                        </dd>
                                        {classroom.levelName && (
                                             <dd className="mt-0.5 text-xs text-gray-500">
                                                  Edad: {classroom.levelName}
                                             </dd>
                                        )}
                                        {(classroom.grade ||
                                             classroom.section) && (
                                             <dd className="mt-0.5 text-xs text-gray-500">
                                                  {classroom.grade &&
                                                       `Grado: ${classroom.grade}`}
                                                  {classroom.grade &&
                                                       classroom.section &&
                                                       " • "}
                                                  {classroom.section &&
                                                       `Sección: ${classroom.section}`}
                                             </dd>
                                        )}
                                   </div>
                              </dl>
                         </div>
                    </div>

                    {/* Información Personal */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                         <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                                   <User className="h-5 w-5 mr-2 text-gray-600" />
                                   Información Personal
                              </h2>
                         </div>
                         <div className="px-6 py-4">
                              <dl className="space-y-4">
                                   <div>
                                        <dt className="text-sm font-medium text-gray-500">
                                             Nombres Completos
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                             {student.personalInfo.names}{" "}
                                             {student.personalInfo.lastNames}
                                        </dd>
                                   </div>
                                   <div>
                                        <dt className="text-sm font-medium text-gray-500">
                                             Documento
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                             {student.personalInfo.documentType}
                                             :{" "}
                                             {
                                                  student.personalInfo
                                                       .documentNumber
                                             }
                                        </dd>
                                   </div>
                                   <div>
                                        <dt className="text-sm font-medium text-gray-500">
                                             Género
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                             {student.personalInfo.gender}
                                        </dd>
                                   </div>
                                   <div>
                                        <dt className="text-sm font-medium text-gray-500">
                                             Fecha de Nacimiento
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                             {student.personalInfo.dateOfBirth}{" "}
                                             ({student.personalInfo.age} años)
                                        </dd>
                                   </div>
                                   <div>
                                        <dt className="text-sm font-medium text-gray-500">
                                             Dirección
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                             {student.address}
                                        </dd>
                                   </div>
                                   <div>
                                        <dt className="text-sm font-medium text-gray-500">
                                             Estado
                                        </dt>
                                        <dd className="mt-1">
                                             <span
                                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(
                                                       student.status
                                                  )}`}
                                             >
                                                  {getStatusText(
                                                       student.status
                                                  )}
                                             </span>
                                        </dd>
                                   </div>
                              </dl>
                         </div>
                    </div>

                    {/* Tutores */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                         <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                                   <Users className="h-5 w-5 mr-2 text-gray-600" />
                                   Tutores / Apoderados
                              </h2>
                         </div>
                         <div className="px-6 py-4">
                              <div className="space-y-4">
                                   {studentData.guardians &&
                                   studentData.guardians.length > 0 ? (
                                        studentData.guardians.map(
                                             (guardian, index) => {
                                                  // Buscar el guardian correspondiente en student.guardians para obtener el relationship
                                                  const guardianInfo =
                                                       student.guardians.find(
                                                            (g) =>
                                                                 g.userId ===
                                                                 guardian.userId
                                                       );

                                                  return (
                                                       <div
                                                            key={
                                                                 guardian.userId ||
                                                                 index
                                                            }
                                                            className="border-b border-gray-200 pb-4 last:border-0"
                                                       >
                                                            <div className="flex items-center justify-between mb-2">
                                                                 <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                                      {guardianInfo?.relationship ||
                                                                           "Tutor"}
                                                                 </span>
                                                                 <span
                                                                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                                           guardian.status ===
                                                                           "ACTIVE"
                                                                                ? "bg-green-100 text-green-800"
                                                                                : "bg-red-100 text-red-800"
                                                                      }`}
                                                                 >
                                                                      {guardian.status ===
                                                                      "ACTIVE"
                                                                           ? "Activo"
                                                                           : "Inactivo"}
                                                                 </span>
                                                            </div>
                                                            <div className="text-sm space-y-1">
                                                                 <div className="font-medium text-gray-900">
                                                                      {
                                                                           guardian.firstName
                                                                      }{" "}
                                                                      {
                                                                           guardian.lastName
                                                                      }
                                                                 </div>
                                                                 <div className="text-gray-500">
                                                                      {
                                                                           guardian.documentType
                                                                      }
                                                                      :{" "}
                                                                      {
                                                                           guardian.documentNumber
                                                                      }
                                                                 </div>
                                                                 <div className="text-gray-500">
                                                                      Tel:{" "}
                                                                      {
                                                                           guardian.phone
                                                                      }
                                                                 </div>
                                                                 {guardian.email && (
                                                                      <div className="text-gray-500">
                                                                           Email:{" "}
                                                                           {
                                                                                guardian.email
                                                                           }
                                                                      </div>
                                                                 )}
                                                                 {guardian.userName && (
                                                                      <div className="text-gray-500 text-xs">
                                                                           Usuario:{" "}
                                                                           {
                                                                                guardian.userName
                                                                           }
                                                                      </div>
                                                                 )}
                                                                 <div className="text-gray-400 text-xs mt-1">
                                                                      Rol:{" "}
                                                                      {
                                                                           guardian.role
                                                                      }
                                                                 </div>
                                                            </div>
                                                       </div>
                                                  );
                                             }
                                        )
                                   ) : (
                                        <div className="text-sm text-gray-500 text-center py-4">
                                             No hay tutores registrados
                                        </div>
                                   )}
                              </div>
                         </div>
                    </div>

                    {/* Información de Salud */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                         <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                                   <Heart className="h-5 w-5 mr-2 text-gray-600" />
                                   Información de Salud
                              </h2>
                         </div>
                         <div className="px-6 py-4">
                              <dl className="space-y-4">
                                   <div>
                                        <dt className="text-sm font-medium text-gray-500">
                                             Estado de Salud
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                             {student.healthInfo.healthStatus}
                                        </dd>
                                   </div>
                                   <div>
                                        <dt className="text-sm font-medium text-gray-500">
                                             Enfermedades
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                             {student.healthInfo.illnesses ||
                                                  "Ninguna"}
                                        </dd>
                                   </div>
                                   <div>
                                        <dt className="text-sm font-medium text-gray-500">
                                             Vacunas
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                             {student.healthInfo.vaccines ||
                                                  "No especificado"}
                                        </dd>
                                   </div>
                                   {student.healthInfo.controls &&
                                        student.healthInfo.controls.length >
                                             0 && (
                                             <div>
                                                  <dt className="text-sm font-medium text-gray-500 mb-2">
                                                       Último Control de Salud
                                                  </dt>
                                                  <dd className="mt-1 text-sm text-gray-900 space-y-1">
                                                       <div>
                                                            Fecha:{" "}
                                                            {
                                                                 student
                                                                      .healthInfo
                                                                      .controls[0]
                                                                      .date
                                                            }
                                                       </div>
                                                       <div>
                                                            Peso:{" "}
                                                            {
                                                                 student
                                                                      .healthInfo
                                                                      .controls[0]
                                                                      .weight
                                                            }{" "}
                                                            kg
                                                       </div>
                                                       <div>
                                                            Altura:{" "}
                                                            {
                                                                 student
                                                                      .healthInfo
                                                                      .controls[0]
                                                                      .height
                                                            }{" "}
                                                            cm
                                                       </div>
                                                       <div>
                                                            IMC:{" "}
                                                            {student.healthInfo.controls[0].bmi.toFixed(
                                                                 2
                                                            )}
                                                       </div>
                                                  </dd>
                                             </div>
                                        )}
                              </dl>
                         </div>
                    </div>

                    {/* Información de Desarrollo */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                         <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                                   <Activity className="h-5 w-5 mr-2 text-gray-600" />
                                   Información de Desarrollo
                              </h2>
                         </div>
                         <div className="px-6 py-4">
                              <dl className="space-y-4">
                                   <div>
                                        <dt className="text-sm font-medium text-gray-500">
                                             Tipo de Nacimiento
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                             {student.developmentInfo.birthType}
                                        </dd>
                                   </div>
                                   <div>
                                        <dt className="text-sm font-medium text-gray-500">
                                             Complicaciones
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                             {student.developmentInfo
                                                  .complications || "Ninguna"}
                                        </dd>
                                   </div>
                                   <div>
                                        <dt className="text-sm font-medium text-gray-500">
                                             Discapacidades
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                             {student.developmentInfo
                                                  .hasAuditoryDisability && (
                                                  <div>
                                                       • Discapacidad Auditiva
                                                  </div>
                                             )}
                                             {student.developmentInfo
                                                  .hasVisualDisability && (
                                                  <div>
                                                       • Discapacidad Visual
                                                  </div>
                                             )}
                                             {student.developmentInfo
                                                  .hasMotorDisability && (
                                                  <div>
                                                       • Discapacidad Motora
                                                  </div>
                                             )}
                                             {!student.developmentInfo
                                                  .hasAuditoryDisability &&
                                                  !student.developmentInfo
                                                       .hasVisualDisability &&
                                                  !student.developmentInfo
                                                       .hasMotorDisability && (
                                                       <div>Ninguna</div>
                                                  )}
                                        </dd>
                                   </div>
                              </dl>
                         </div>
                    </div>
               </div>
          </div>
     );
}
