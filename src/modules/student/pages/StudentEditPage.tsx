/**
 * Página: StudentEditPage
 * Página para editar un estudiante existente
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save, X, User, Building2, School } from "lucide-react";
import { studentsService } from "../service/Student.service";
import { institutionService } from "../../institution/service/Institution.service";
import {
     showSuccessAlert,
     showErrorAlert,
     showLoadingAlert,
     closeAlert,
} from "../../../shared/utils/sweetAlert";
import type {
     Student,
     UpdateStudentRequest,
     DocumentType,
     Gender,
} from "../models/student.model";

// Helper para convertir fecha de dd/MM/yyyy a yyyy-MM-dd
const formatDateForInput = (dateString: string): string => {
     if (!dateString) return "";
     const [day, month, year] = dateString.split("/");
     return `${year}-${month}-${day}`;
};

// Helper para convertir fecha de yyyy-MM-dd a dd/MM/yyyy
const formatDateForBackend = (dateString: string): string => {
     if (!dateString) return "";
     const [year, month, day] = dateString.split("-");
     return `${day}/${month}/${year}`;
};

export function StudentEditPage() {
     const { studentId } = useParams<{ studentId: string }>();
     const navigate = useNavigate();
     const [loading, setLoading] = useState(true);
     const [saving, setSaving] = useState(false);
     const [student, setStudent] = useState<Student | null>(null);
     const [institutionName, setInstitutionName] = useState<string>("");
     const [classroomName, setClassroomName] = useState<string>("");
     const [formData, setFormData] = useState<UpdateStudentRequest>({
          cui: "",
          personalInfo: {
               names: "",
               lastNames: "",
               documentType: "DNI",
               documentNumber: "",
               gender: "MASCULINO",
               dateOfBirth: "",
          },
          address: "",
          photoPerfil: "",
          institutionId: "",
          classroomId: "",
          guardians: [],
     });

     const [errors, setErrors] = useState<Record<string, string>>({});
     const [touched, setTouched] = useState<Record<string, boolean>>({});

     useEffect(() => {
          const fetchStudent = async () => {
               if (!studentId) {
                    navigate("/estudiantes");
                    return;
               }

               try {
                    setLoading(true);
                    const studentData = await studentsService.getById(
                         studentId
                    );
                    setStudent(studentData);
                    setFormData({
                         cui: studentData.cui,
                         personalInfo: {
                              ...studentData.personalInfo,
                              dateOfBirth: formatDateForInput(
                                   studentData.personalInfo.dateOfBirth
                              ),
                         },
                         address: studentData.address,
                         photoPerfil: studentData.photoPerfil,
                         institutionId: studentData.institutionId,
                         classroomId: studentData.classroomId,
                         guardians: studentData.guardians || [],
                    });

                    // Cargar el nombre de la institución y aula
                    try {
                         const institution =
                              await institutionService.getInstitutionById(
                                   studentData.institutionId
                              );
                         setInstitutionName(
                              institution.institutionInformation.institutionName
                         );

                         // Buscar el nombre del aula en las aulas de la institución
                         const classroom = institution.classrooms.find(
                              (c) => c.classroomId === studentData.classroomId
                         );
                         setClassroomName(
                              classroom
                                   ? classroom.classroomName
                                   : "Aula no encontrada"
                         );
                    } catch (error) {
                         console.error(
                              "Error al cargar institución/aula:",
                              error
                         );
                         setInstitutionName("Institución no encontrada");
                         setClassroomName("Aula no encontrada");
                    }
               } catch (error) {
                    console.error("Error al cargar estudiante:", error);
                    showErrorAlert(
                         "Error",
                         error instanceof Error
                              ? error.message
                              : "Error desconocido"
                    );
                    navigate("/estudiantes");
               } finally {
                    setLoading(false);
               }
          };

          fetchStudent();
     }, [studentId, navigate]);

     // Función de validación
     const validateField = (name: string, value: string): string => {
          switch (name) {
               case "cui":
                    if (!value) return "El CUI es requerido";
                    if (!/^\d{8,9}$/.test(value))
                         return "El CUI debe tener 8 o 9 dígitos";
                    return "";

               case "personalInfo.names":
                    if (!value) return "Los nombres son requeridos";
                    if (value.length < 2)
                         return "Debe tener al menos 2 caracteres";
                    if (!/^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s]+$/.test(value))
                         return "Solo se permiten letras y espacios";
                    return "";

               case "personalInfo.lastNames":
                    if (!value) return "Los apellidos son requeridos";
                    if (value.length < 2)
                         return "Debe tener al menos 2 caracteres";
                    if (!/^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s]+$/.test(value))
                         return "Solo se permiten letras y espacios";
                    return "";

               case "personalInfo.documentNumber":
                    if (!value) return "El número de documento es requerido";
                    if (!/^\d{8}$/.test(value))
                         return "Debe tener exactamente 8 dígitos numéricos";
                    return "";

               case "personalInfo.dateOfBirth": {
                    if (!value) return "La fecha de nacimiento es requerida";
                    const birthDate = new Date(value);
                    const today = new Date();
                    const age = today.getFullYear() - birthDate.getFullYear();
                    if (age < 3 || age > 5)
                         return "El estudiante debe tener entre 3 y 5 años";
                    return "";
               }

               case "address":
                    if (!value) return "La dirección es requerida";
                    if (value.length < 5)
                         return "Debe tener al menos 5 caracteres";
                    return "";

               default:
                    return "";
          }
     };

     const handleChange = (
          e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
     ) => {
          const { name, value } = e.target;

          if (name.startsWith("personalInfo.")) {
               const field = name.split(".")[1];

               // Filtrar valor para documentNumber (solo números, máximo 8)
               let filteredValue = value;
               if (field === "documentNumber") {
                    filteredValue = value.replace(/\D/g, "").slice(0, 8);
               }

               // Si es documentNumber, también actualizar el CUI
               if (field === "documentNumber") {
                    setFormData((prev) => ({
                         ...prev,
                         cui:
                              filteredValue.length === 8
                                   ? filteredValue + (prev.cui?.slice(8) || "")
                                   : filteredValue,
                         personalInfo: {
                              ...prev.personalInfo!,
                              [field]: filteredValue,
                         },
                    }));
               } else {
                    setFormData((prev) => ({
                         ...prev,
                         personalInfo: {
                              ...prev.personalInfo!,
                              [field]: value,
                         },
                    }));
               }
          } else if (name === "cui") {
               // Filtrar solo números, máximo 9 dígitos
               const filteredCUI = value.replace(/\D/g, "").slice(0, 9);
               setFormData((prev) => ({
                    ...prev,
                    cui: filteredCUI,
                    personalInfo: {
                         ...prev.personalInfo!,
                         documentNumber: filteredCUI.slice(0, 8),
                    },
               }));
          } else if (name !== "cui") {
               setFormData((prev) => ({ ...prev, [name]: value }));
          }

          const error = validateField(name, value);
          setErrors((prev) => ({ ...prev, [name]: error }));
     };

     const handleBlur = (
          e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>
     ) => {
          const { name } = e.target;
          setTouched((prev) => ({ ...prev, [name]: true }));
     };

     const getFieldError = (fieldName: string) => {
          return touched[fieldName] && errors[fieldName]
               ? errors[fieldName]
               : "";
     };

     const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();

          if (!studentId) return;

          // Validar todos los campos
          const newErrors: Record<string, string> = {};
          const fieldsToValidate = [
               "cui",
               "personalInfo.names",
               "personalInfo.lastNames",
               "personalInfo.documentNumber",
               "personalInfo.dateOfBirth",
               "address",
          ];

          for (const field of fieldsToValidate) {
               let value = "";
               if (field.startsWith("personalInfo.")) {
                    const subField = field.split(
                         "."
                    )[1] as keyof typeof formData.personalInfo;
                    value = String(formData.personalInfo?.[subField] ?? "");
               } else {
                    value =
                         (formData[field as keyof typeof formData] as string) ||
                         "";
               }
               const error = validateField(field, value);
               if (error) newErrors[field] = error;
          }

          if (Object.keys(newErrors).length > 0) {
               setErrors(newErrors);
               setTouched(
                    Object.keys(newErrors).reduce(
                         (acc, key) => ({ ...acc, [key]: true }),
                         {}
                    )
               );
               showErrorAlert(
                    "Formulario inválido",
                    "Por favor corrige los errores antes de continuar"
               );
               return;
          }

          setSaving(true);
          showLoadingAlert("Actualizando estudiante...");

          try {
               // Convertir la fecha al formato esperado por el backend
               const dataToSend = {
                    ...formData,
                    personalInfo: formData.personalInfo
                         ? {
                              names: formData.personalInfo.names,
                              lastNames: formData.personalInfo.lastNames,
                              documentType:
                                   formData.personalInfo.documentType,
                              documentNumber:
                                   formData.personalInfo.documentNumber,
                              gender: formData.personalInfo.gender,
                              dateOfBirth: formatDateForBackend(
                                   formData.personalInfo.dateOfBirth
                              ),
                         }
                         : undefined,
               };

               await studentsService.update(studentId, dataToSend);
               closeAlert();
               await showSuccessAlert(
                    "¡Estudiante actualizado!",
                    "Los cambios se han guardado correctamente"
               );
               navigate(`/estudiantes/${studentId}`);
          } catch (error) {
               closeAlert();
               console.error("Error al actualizar estudiante:", error);
               showErrorAlert(
                    "Error al actualizar",
                    error instanceof Error ? error.message : "Error desconocido"
               );
          } finally {
               setSaving(false);
          }
     };

     const documentTypes: DocumentType[] = ["DNI", "CE", "PASAPORTE"];
     const genders: Gender[] = ["MASCULINO", "FEMENINO"];

     if (loading) {
          return (
               <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
               </div>
          );
     }

     if (!student) {
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

     return (
          <div className="max-w-4xl mx-auto">
               <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                         <User className="h-8 w-8 mr-3 text-indigo-600" />
                         Editar Estudiante
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                         {student.personalInfo.names}{" "}
                         {student.personalInfo.lastNames}
                    </p>
               </div>

               <div className="bg-white rounded-lg shadow">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                         <div>
                              <h3 className="text-lg font-medium text-gray-900 mb-4">
                                   Información Personal
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             CUI (Código Único) *
                                        </label>
                                        <input
                                             type="text"
                                             name="cui"
                                             value={formData.cui}
                                             onChange={handleChange}
                                             onBlur={handleBlur}
                                             maxLength={9}
                                             className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${getFieldError("cui")
                                                       ? "border-red-500"
                                                       : "border-gray-300"
                                                  }`}
                                        />
                                        {getFieldError("cui") && (
                                             <p className="mt-1 text-sm text-red-600">
                                                  {getFieldError("cui")}
                                             </p>
                                        )}
                                        <p className="mt-1 text-xs text-gray-500">
                                             Los primeros 8 dígitos se
                                             sincronizan con el DNI
                                        </p>
                                   </div>
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Nombres *
                                        </label>
                                        <input
                                             type="text"
                                             name="personalInfo.names"
                                             value={
                                                  formData.personalInfo?.names
                                             }
                                             onChange={handleChange}
                                             onBlur={handleBlur}
                                             className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${getFieldError(
                                                  "personalInfo.names"
                                             )
                                                       ? "border-red-500"
                                                       : "border-gray-300"
                                                  }`}
                                        />
                                        {getFieldError(
                                             "personalInfo.names"
                                        ) && (
                                                  <p className="mt-1 text-sm text-red-600">
                                                       {getFieldError(
                                                            "personalInfo.names"
                                                       )}
                                                  </p>
                                             )}
                                   </div>
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Apellidos *
                                        </label>
                                        <input
                                             type="text"
                                             name="personalInfo.lastNames"
                                             value={
                                                  formData.personalInfo
                                                       ?.lastNames
                                             }
                                             onChange={handleChange}
                                             onBlur={handleBlur}
                                             className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${getFieldError(
                                                  "personalInfo.lastNames"
                                             )
                                                       ? "border-red-500"
                                                       : "border-gray-300"
                                                  }`}
                                        />
                                        {getFieldError(
                                             "personalInfo.lastNames"
                                        ) && (
                                                  <p className="mt-1 text-sm text-red-600">
                                                       {getFieldError(
                                                            "personalInfo.lastNames"
                                                       )}
                                                  </p>
                                             )}
                                   </div>
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Tipo de Documento *
                                        </label>
                                        <select
                                             name="personalInfo.documentType"
                                             value={
                                                  formData.personalInfo
                                                       ?.documentType
                                             }
                                             onChange={handleChange}
                                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                             {documentTypes.map((type) => (
                                                  <option
                                                       key={type}
                                                       value={type}
                                                  >
                                                       {type}
                                                  </option>
                                             ))}
                                        </select>
                                   </div>
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Número de Documento *
                                        </label>
                                        <input
                                             type="text"
                                             name="personalInfo.documentNumber"
                                             value={
                                                  formData.personalInfo
                                                       ?.documentNumber
                                             }
                                             disabled
                                             className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                             El DNI se sincroniza
                                             automáticamente con el CUI
                                        </p>
                                   </div>
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Género *
                                        </label>
                                        <select
                                             name="personalInfo.gender"
                                             value={
                                                  formData.personalInfo?.gender
                                             }
                                             onChange={handleChange}
                                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                             {genders.map((gender) => (
                                                  <option
                                                       key={gender}
                                                       value={gender}
                                                  >
                                                       {gender}
                                                  </option>
                                             ))}
                                        </select>
                                   </div>
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Fecha de Nacimiento *
                                        </label>
                                        <input
                                             type="date"
                                             name="personalInfo.dateOfBirth"
                                             value={
                                                  formData.personalInfo
                                                       ?.dateOfBirth
                                             }
                                             onChange={handleChange}
                                             onBlur={handleBlur}
                                             className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${getFieldError(
                                                  "personalInfo.dateOfBirth"
                                             )
                                                       ? "border-red-500"
                                                       : "border-gray-300"
                                                  }`}
                                        />
                                        {getFieldError(
                                             "personalInfo.dateOfBirth"
                                        ) && (
                                                  <p className="mt-1 text-sm text-red-600">
                                                       {getFieldError(
                                                            "personalInfo.dateOfBirth"
                                                       )}
                                                  </p>
                                             )}
                                   </div>
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Dirección *
                                        </label>
                                        <input
                                             type="text"
                                             name="address"
                                             value={formData.address}
                                             onChange={handleChange}
                                             onBlur={handleBlur}
                                             className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${getFieldError("address")
                                                       ? "border-red-500"
                                                       : "border-gray-300"
                                                  }`}
                                        />
                                        {getFieldError("address") && (
                                             <p className="mt-1 text-sm text-red-600">
                                                  {getFieldError("address")}
                                             </p>
                                        )}
                                   </div>

                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Institución *
                                        </label>
                                        <div className="relative">
                                             <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                             <input
                                                  type="text"
                                                  value={institutionName}
                                                  disabled
                                                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                                                  placeholder="Cargando..."
                                             />
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">
                                             La institución no puede ser
                                             modificada
                                        </p>
                                   </div>

                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Aula *
                                        </label>
                                        <div className="relative">
                                             <School className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                             <input
                                                  type="text"
                                                  value={classroomName}
                                                  disabled
                                                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                                                  placeholder="Cargando..."
                                             />
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">
                                             El aula no puede ser modificada
                                        </p>
                                   </div>

                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Foto de Perfil (URL)
                                        </label>
                                        <input
                                             type="url"
                                             name="photoPerfil"
                                             value={formData.photoPerfil}
                                             onChange={handleChange}
                                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                   </div>
                              </div>
                         </div>

                         <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                              <button
                                   type="button"
                                   onClick={() =>
                                        navigate(`/estudiantes/${studentId}`)
                                   }
                                   className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                              >
                                   <X className="h-4 w-4 mr-2" />
                                   Cancelar
                              </button>
                              <button
                                   type="submit"
                                   disabled={saving}
                                   className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                              >
                                   <Save className="h-4 w-4 mr-2" />
                                   {saving ? "Guardando..." : "Guardar Cambios"}
                              </button>
                         </div>
                    </form>
               </div>
          </div>
     );
}
