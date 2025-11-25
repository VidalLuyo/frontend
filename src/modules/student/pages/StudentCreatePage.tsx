/**
 * Página: StudentCreatePage
 * Página para crear un nuevo estudiante
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, X, User, Users, Heart, Activity } from "lucide-react";
import { studentsService } from "../service/Student.service";
import { institutionService } from "../../institution/service/Institution.service";
import type {
     InstitutionCompleteResponse,
     Classroom,
} from "../../institution/models/Institution.interface";
import {
     showSuccessAlert,
     showErrorAlert,
     showLoadingAlert,
     closeAlert,
} from "../../../shared/utils/sweetAlert";
import type {
     CreateStudentRequest,
     DocumentType,
     Gender,
     GuardianRole,
} from "../models/student.model";

// Helper para convertir fecha de yyyy-MM-dd a dd/MM/yyyy
const formatDateForBackend = (dateString: string): string => {
     if (!dateString) return "";
     const [year, month, day] = dateString.split("-");
     return `${day}/${month}/${year}`;
};

export function StudentCreatePage() {
     const navigate = useNavigate();
     const [loading, setLoading] = useState(false);
     const [errors, setErrors] = useState<{ [key: string]: string }>({});
     const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

     // Estados para instituciones y aulas
     const [institutions, setInstitutions] = useState<
          InstitutionCompleteResponse[]
     >([]);
     const [classrooms, setClassrooms] = useState<Classroom[]>([]);
     const [loadingInstitutions, setLoadingInstitutions] = useState(false);
     const [loadingClassrooms, setLoadingClassrooms] = useState(false);

     const [formData, setFormData] = useState<CreateStudentRequest>({
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
          guardians: [
               {
                    relationship: "PADRE",
                    names: "",
                    lastNames: "",
                    phone: "",
                    documentType: "DNI",
                    documentNumber: "",
               },
          ],
          healthInfo: {
               healthStatus: "Bueno",
               illnesses: "",
               vaccines: "",
          },
          developmentInfo: {
               birthType: "normal",
               complications: "",
               hasAuditoryDisability: false,
               hasVisualDisability: false,
               hasMotorDisability: false,
               otherDisability: "",
          },
     });

     // Cargar instituciones al montar el componente
     useEffect(() => {
          loadInstitutions();
     }, []);

     // Función para cargar instituciones activas
     const loadInstitutions = async () => {
          setLoadingInstitutions(true);
          try {
               const data = await institutionService.getActiveInstitutions();
               setInstitutions(data);
          } catch (error) {
               console.error("Error al cargar instituciones:", error);
               showErrorAlert(
                    "Error",
                    "No se pudieron cargar las instituciones"
               );
          } finally {
               setLoadingInstitutions(false);
          }
     };

     // Función para cargar aulas de una institución específica
     const loadClassrooms = async (institutionId: string) => {
          if (!institutionId) {
               setClassrooms([]);
               return;
          }

          setLoadingClassrooms(true);
          try {
               const institution = await institutionService.getInstitutionById(
                    institutionId
               );
               setClassrooms(institution.classrooms || []);

               // Limpiar el classroomId seleccionado cuando cambie la institución
               setFormData((prev) => ({
                    ...prev,
                    classroomId: "",
               }));
          } catch (error) {
               console.error("Error al cargar aulas:", error);
               showErrorAlert(
                    "Error",
                    "No se pudieron cargar las aulas de la institución"
               );
               setClassrooms([]);
          } finally {
               setLoadingClassrooms(false);
          }
     };

     // Funciones de validación
     const validateNames = (value: string): string => {
          if (!value.trim()) return "Este campo es requerido";
          if (value.length < 2) return "Debe tener al menos 2 caracteres";
          if (value.length > 50) return "No puede exceder 50 caracteres";
          if (!/^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]+$/.test(value))
               return "Solo se permiten letras y espacios";
          return "";
     };

     const validateCUI = (value: string): string => {
          if (!value.trim()) return "El CUI es requerido";
          if (!/^\d+$/.test(value)) return "El CUI solo debe contener números";
          if (value.length !== 8 && value.length !== 9)
               return "El CUI debe tener 8 o 9 dígitos";
          return "";
     };

     const validateDateOfBirth = (value: string): string => {
          if (!value) return "La fecha de nacimiento es requerida";

          const birthDate = new Date(value);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();

          if (
               monthDiff < 0 ||
               (monthDiff === 0 && today.getDate() < birthDate.getDate())
          ) {
               age--;
          }

          if (birthDate > today) return "La fecha no puede ser futura";
          if (age < 3)
               return "El estudiante debe tener al menos 3 años (Nivel Inicial)";
          if (age > 5)
               return "El estudiante no puede tener más de 5 años (Nivel Inicial)";

          return "";
     };

     const validateField = (name: string, value: string): string => {
          switch (name) {
               case "personalInfo.names":
                    return validateNames(value);
               case "personalInfo.lastNames":
                    return validateNames(value);
               case "cui":
                    return validateCUI(value);
               case "personalInfo.dateOfBirth":
                    return validateDateOfBirth(value);
               case "institutionId":
                    return value.trim()
                         ? ""
                         : "El ID de institución es requerido";
               case "classroomId":
                    return value.trim() ? "" : "El ID de aula es requerido";
               default:
                    return "";
          }
     };

     const validatePhone = (value: string): string => {
          if (!value.trim()) return "El teléfono es requerido";
          if (!/^\d+$/.test(value)) return "Solo se permiten números";
          if (value.length !== 9) return "El teléfono debe tener 9 dígitos";
          if (!value.startsWith("9")) return "El teléfono debe comenzar con 9";
          return "";
     };

     const validateGuardianDocumentNumber = (
          value: string,
          documentType: string
     ): string => {
          if (!value.trim()) return "El número de documento es requerido";

          switch (documentType) {
               case "DNI":
                    if (!/^\d{8}$/.test(value))
                         return "El DNI debe tener exactamente 8 dígitos numéricos";
                    break;
               case "CE":
                    if (!/^\d{9}$/.test(value))
                         return "El Carné de Extranjería debe tener 9 dígitos";
                    break;
               case "PASAPORTE":
                    if (!/^[A-Z0-9]{6,12}$/.test(value))
                         return "El Pasaporte debe tener entre 6 y 12 caracteres alfanuméricos";
                    break;
          }
          return "";
     };

     const handleChange = (
          e: React.ChangeEvent<
               HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
          >
     ) => {
          const { name, value, type } = e.target;

          if (name.startsWith("personalInfo.")) {
               const field = name.split(".")[1];

               // Filtrar valor para documentNumber (solo números, máximo 8)
               let filteredValue = value;
               if (field === "documentNumber") {
                    filteredValue = value.replace(/\D/g, "").slice(0, 8);
               }

               setFormData((prev) => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, [field]: filteredValue },
               }));
          } else if (name === "cui") {
               // Sincronizar CUI con documentNumber automáticamente
               // Filtrar solo números, máximo 9 dígitos
               const filteredCUI = value.replace(/\D/g, "").slice(0, 9);
               setFormData((prev) => ({
                    ...prev,
                    cui: filteredCUI,
                    personalInfo: {
                         ...prev.personalInfo,
                         documentNumber: filteredCUI.slice(0, 8), // Los primeros 8 dígitos del CUI
                    },
               }));
          } else if (name === "institutionId") {
               // Cuando cambie la institución, cargar sus aulas
               setFormData((prev) => ({
                    ...prev,
                    institutionId: value,
               }));
               // Cargar aulas de la institución seleccionada
               if (value) {
                    loadClassrooms(value);
               } else {
                    setClassrooms([]);
               }
          } else if (name.startsWith("healthInfo.")) {
               const field = name.split(".")[1];
               setFormData((prev) => ({
                    ...prev,
                    healthInfo: { ...prev.healthInfo!, [field]: value },
               }));
          } else if (name.startsWith("developmentInfo.")) {
               const field = name.split(".")[1];
               const finalValue =
                    type === "checkbox"
                         ? (e.target as HTMLInputElement).checked
                         : value;
               setFormData((prev) => ({
                    ...prev,
                    developmentInfo: {
                         ...prev.developmentInfo!,
                         [field]: finalValue,
                    },
               }));
          } else {
               setFormData((prev) => ({ ...prev, [name]: value }));
          }

          // Validar en tiempo real
          const error = validateField(name, value);
          setErrors((prev) => ({
               ...prev,
               [name]: error,
          }));
     };

     const handleBlur = (name: string) => {
          setTouched((prev) => ({ ...prev, [name]: true }));
     };

     const getFieldError = (fieldName: string): string | undefined => {
          return touched[fieldName] ? errors[fieldName] : undefined;
     };

     const getInputClassName = (
          fieldName: string,
          baseClass: string = "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
     ): string => {
          const hasError = getFieldError(fieldName);

          if (hasError) {
               return `${baseClass} border-red-300 focus:border-red-500 text-red-900`;
          }

          if (touched[fieldName] && !hasError) {
               return `${baseClass} border-green-300 focus:border-green-500`;
          }

          return `${baseClass} border-gray-300`;
     };

     const handleGuardianChange = (
          index: number,
          field: string,
          value: string
     ) => {
          // Filtrar solo números para teléfono y documento (DNI/CE)
          let filteredValue = value;
          if (field === "phone") {
               // Solo números, máximo 9 dígitos
               filteredValue = value.replace(/\D/g, "").slice(0, 9);
          } else if (field === "documentNumber") {
               const guardian = formData.guardians[index];
               if (guardian.documentType === "DNI") {
                    // Solo números, máximo 8 dígitos
                    filteredValue = value.replace(/\D/g, "").slice(0, 8);
               } else if (guardian.documentType === "CE") {
                    // Solo números, máximo 9 dígitos
                    filteredValue = value.replace(/\D/g, "").slice(0, 9);
               }
          }

          const newGuardians = [...formData.guardians];
          newGuardians[index] = { ...newGuardians[index], [field]: filteredValue };
          setFormData((prev) => ({ ...prev, guardians: newGuardians }));

          // Validar campos de guardián en tiempo real
          const fieldName = `guardian.${index}.${field}`;
          let error = "";

          if (field === "names" || field === "lastNames") {
               error = validateNames(filteredValue);
          } else if (field === "phone") {
               error = validatePhone(filteredValue);
          } else if (field === "documentNumber") {
               error = validateGuardianDocumentNumber(
                    filteredValue,
                    newGuardians[index].documentType
               );
          }

          setErrors((prev) => ({
               ...prev,
               [fieldName]: error,
          }));
     };

     const addGuardian = () => {
          setFormData((prev) => ({
               ...prev,
               guardians: [
                    ...prev.guardians,
                    {
                         relationship: "MADRE",
                         names: "",
                         lastNames: "",
                         phone: "",
                         documentType: "DNI",
                         documentNumber: "",
                    },
               ],
          }));
     };

     const removeGuardian = (index: number) => {
          if (formData.guardians.length > 1) {
               setFormData((prev) => ({
                    ...prev,
                    guardians: prev.guardians.filter((_, i) => i !== index),
               }));
          }
     };

     const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();

          if (
               !formData.cui ||
               !formData.personalInfo.names ||
               !formData.personalInfo.lastNames
          ) {
               showErrorAlert(
                    "Campos requeridos",
                    "Complete todos los campos obligatorios"
               );
               return;
          }

          setLoading(true);
          showLoadingAlert("Creando estudiante...");

          try {
               // Convertir la fecha al formato esperado por el backend
               const dataToSend = {
                    ...formData,
                    personalInfo: {
                         ...formData.personalInfo,
                         dateOfBirth: formatDateForBackend(
                              formData.personalInfo.dateOfBirth
                         ),
                    },
               };

               await studentsService.create(dataToSend);
               closeAlert();
               await showSuccessAlert(
                    "¡Estudiante creado!",
                    "El estudiante se ha creado correctamente"
               );
               navigate("/estudiantes");
          } catch (error) {
               closeAlert();
               console.error("Error al crear estudiante:", error);
               showErrorAlert(
                    "Error al crear estudiante",
                    error instanceof Error ? error.message : "Error desconocido"
               );
          } finally {
               setLoading(false);
          }
     };

     const documentTypes: DocumentType[] = ["DNI", "CE", "PASAPORTE"];
     const genders: Gender[] = ["MASCULINO", "FEMENINO"];
     const guardianRoles: GuardianRole[] = ["PADRE", "MADRE", "TUTOR", "OTRO"];

     return (
          <div className="max-w-6xl mx-auto">
               <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                         <User className="h-8 w-8 mr-3 text-indigo-600" />
                         Nuevo Estudiante
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                         Complete el formulario para crear un nuevo estudiante
                    </p>
               </div>

               <div className="bg-white rounded-lg shadow">
                    <form onSubmit={handleSubmit} className="p-6 space-y-8">
                         {/* Información Personal */}
                         <div>
                              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                   <User className="h-5 w-5 mr-2 text-gray-600" />
                                   Información Personal
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             CUI (Código Único){" "}
                                             <span className="text-red-500">
                                                  *
                                             </span>
                                        </label>
                                        <input
                                             type="text"
                                             name="cui"
                                             value={formData.cui}
                                             onChange={handleChange}
                                             onBlur={() => handleBlur("cui")}
                                             required
                                             maxLength={9}
                                             className={getInputClassName(
                                                  "cui"
                                             )}
                                             placeholder="12345678"
                                        />
                                        {getFieldError("cui") && (
                                             <p className="mt-1 text-sm text-red-600">
                                                  {getFieldError("cui")}
                                             </p>
                                        )}
                                        <p className="mt-1 text-xs text-gray-500">
                                             8 o 9 dígitos numéricos
                                        </p>
                                   </div>
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Nombres{" "}
                                             <span className="text-red-500">
                                                  *
                                             </span>
                                        </label>
                                        <input
                                             type="text"
                                             name="personalInfo.names"
                                             value={formData.personalInfo.names}
                                             onChange={handleChange}
                                             onBlur={() =>
                                                  handleBlur(
                                                       "personalInfo.names"
                                                  )
                                             }
                                             required
                                             className={getInputClassName(
                                                  "personalInfo.names"
                                             )}
                                             placeholder="Ingrese los nombres"
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
                                             Apellidos{" "}
                                             <span className="text-red-500">
                                                  *
                                             </span>
                                        </label>
                                        <input
                                             type="text"
                                             name="personalInfo.lastNames"
                                             value={
                                                  formData.personalInfo
                                                       .lastNames
                                             }
                                             onChange={handleChange}
                                             onBlur={() =>
                                                  handleBlur(
                                                       "personalInfo.lastNames"
                                                  )
                                             }
                                             required
                                             className={getInputClassName(
                                                  "personalInfo.lastNames"
                                             )}
                                             placeholder="Ingrese los apellidos"
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
                                             Tipo de Documento{" "}
                                             <span className="text-red-500">
                                                  *
                                             </span>
                                        </label>
                                        <select
                                             name="personalInfo.documentType"
                                             value={
                                                  formData.personalInfo
                                                       .documentType
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
                                             Género{" "}
                                             <span className="text-red-500">
                                                  *
                                             </span>
                                        </label>
                                        <select
                                             name="personalInfo.gender"
                                             value={
                                                  formData.personalInfo.gender
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
                                             Fecha de Nacimiento{" "}
                                             <span className="text-red-500">
                                                  *
                                             </span>
                                        </label>
                                        <input
                                             type="date"
                                             name="personalInfo.dateOfBirth"
                                             value={
                                                  formData.personalInfo
                                                       .dateOfBirth
                                             }
                                             onChange={handleChange}
                                             onBlur={() =>
                                                  handleBlur(
                                                       "personalInfo.dateOfBirth"
                                                  )
                                             }
                                             required
                                             max={
                                                  new Date()
                                                       .toISOString()
                                                       .split("T")[0]
                                             }
                                             className={getInputClassName(
                                                  "personalInfo.dateOfBirth"
                                             )}
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
                                        <p className="mt-1 text-xs text-gray-500">
                                             Edad permitida: 3 a 5 años (Nivel
                                             Inicial)
                                        </p>
                                   </div>
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Dirección
                                        </label>
                                        <input
                                             type="text"
                                             name="address"
                                             value={formData.address}
                                             onChange={handleChange}
                                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                             placeholder="Dirección completa (opcional)"
                                        />
                                   </div>
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Institución{" "}
                                             <span className="text-red-500">
                                                  *
                                             </span>
                                        </label>
                                        <select
                                             name="institutionId"
                                             value={formData.institutionId}
                                             onChange={handleChange}
                                             onBlur={() =>
                                                  handleBlur("institutionId")
                                             }
                                             required
                                             disabled={loadingInstitutions}
                                             className={getInputClassName(
                                                  "institutionId"
                                             )}
                                        >
                                             <option value="">
                                                  {loadingInstitutions
                                                       ? "Cargando instituciones..."
                                                       : "Seleccione una institución"}
                                             </option>
                                             {institutions.map(
                                                  (institution) => (
                                                       <option
                                                            key={
                                                                 institution.institutionId
                                                            }
                                                            value={
                                                                 institution.institutionId
                                                            }
                                                       >
                                                            {
                                                                 institution
                                                                      .institutionInformation
                                                                      .institutionName
                                                            }
                                                       </option>
                                                  )
                                             )}
                                        </select>
                                        {getFieldError("institutionId") && (
                                             <p className="mt-1 text-sm text-red-600">
                                                  {getFieldError(
                                                       "institutionId"
                                                  )}
                                             </p>
                                        )}
                                        <p className="mt-1 text-xs text-gray-500">
                                             Seleccione la institución educativa
                                        </p>
                                   </div>
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Aula{" "}
                                             <span className="text-red-500">
                                                  *
                                             </span>
                                        </label>
                                        <select
                                             name="classroomId"
                                             value={formData.classroomId}
                                             onChange={handleChange}
                                             onBlur={() =>
                                                  handleBlur("classroomId")
                                             }
                                             required
                                             disabled={
                                                  !formData.institutionId ||
                                                  loadingClassrooms
                                             }
                                             className={getInputClassName(
                                                  "classroomId"
                                             )}
                                        >
                                             <option value="">
                                                  {!formData.institutionId
                                                       ? "Primero seleccione una institución"
                                                       : loadingClassrooms
                                                            ? "Cargando aulas..."
                                                            : classrooms.length === 0
                                                                 ? "No hay aulas disponibles"
                                                                 : "Seleccione un aula"}
                                             </option>
                                             {classrooms.map((classroom) => (
                                                  <option
                                                       key={
                                                            classroom.classroomId
                                                       }
                                                       value={
                                                            classroom.classroomId
                                                       }
                                                  >
                                                       {classroom.classroomName}{" "}
                                                       -{" "}
                                                       {classroom.classroomAge}{" "}
                                                       años (Capacidad:{" "}
                                                       {classroom.capacity})
                                                  </option>
                                             ))}
                                        </select>
                                        {getFieldError("classroomId") && (
                                             <p className="mt-1 text-sm text-red-600">
                                                  {getFieldError("classroomId")}
                                             </p>
                                        )}
                                        <p className="mt-1 text-xs text-gray-500">
                                             Seleccione el aula del estudiante
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

                         {/* Tutores */}
                         <div>
                              <div className="flex justify-between items-center mb-4">
                                   <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                        <Users className="h-5 w-5 mr-2 text-gray-600" />
                                        Tutores / Apoderados
                                   </h3>
                                   <button
                                        type="button"
                                        onClick={addGuardian}
                                        className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                   >
                                        + Agregar Tutor
                                   </button>
                              </div>
                              {formData.guardians.map((guardian, index) => (
                                   <div
                                        key={index}
                                        className="mb-4 p-4 border border-gray-200 rounded-md"
                                   >
                                        <div className="flex justify-between items-center mb-2">
                                             <h4 className="text-sm font-medium text-gray-700">
                                                  Tutor {index + 1}
                                             </h4>
                                             {formData.guardians.length > 1 && (
                                                  <button
                                                       type="button"
                                                       onClick={() =>
                                                            removeGuardian(
                                                                 index
                                                            )
                                                       }
                                                       className="text-red-600 text-sm hover:text-red-800"
                                                  >
                                                       Eliminar
                                                  </button>
                                             )}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                             <div>
                                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                                       Relación
                                                  </label>
                                                  <select
                                                       value={
                                                            guardian.relationship
                                                       }
                                                       onChange={(e) =>
                                                            handleGuardianChange(
                                                                 index,
                                                                 "relationship",
                                                                 e.target.value
                                                            )
                                                       }
                                                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                  >
                                                       {guardianRoles.map(
                                                            (role) => (
                                                                 <option
                                                                      key={role}
                                                                      value={
                                                                           role
                                                                      }
                                                                 >
                                                                      {role}
                                                                 </option>
                                                            )
                                                       )}
                                                  </select>
                                             </div>
                                             <div>
                                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                                       Nombres{" "}
                                                       <span className="text-red-500">
                                                            *
                                                       </span>
                                                  </label>
                                                  <input
                                                       type="text"
                                                       value={guardian.names}
                                                       onChange={(e) =>
                                                            handleGuardianChange(
                                                                 index,
                                                                 "names",
                                                                 e.target.value
                                                            )
                                                       }
                                                       onBlur={() =>
                                                            handleBlur(
                                                                 `guardian.${index}.names`
                                                            )
                                                       }
                                                       required
                                                       className={getInputClassName(
                                                            `guardian.${index}.names`
                                                       )}
                                                       placeholder="Nombres del tutor"
                                                  />
                                                  {getFieldError(
                                                       `guardian.${index}.names`
                                                  ) && (
                                                            <p className="mt-1 text-sm text-red-600">
                                                                 {getFieldError(
                                                                      `guardian.${index}.names`
                                                                 )}
                                                            </p>
                                                       )}
                                             </div>
                                             <div>
                                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                                       Apellidos{" "}
                                                       <span className="text-red-500">
                                                            *
                                                       </span>
                                                  </label>
                                                  <input
                                                       type="text"
                                                       value={
                                                            guardian.lastNames
                                                       }
                                                       onChange={(e) =>
                                                            handleGuardianChange(
                                                                 index,
                                                                 "lastNames",
                                                                 e.target.value
                                                            )
                                                       }
                                                       onBlur={() =>
                                                            handleBlur(
                                                                 `guardian.${index}.lastNames`
                                                            )
                                                       }
                                                       required
                                                       className={getInputClassName(
                                                            `guardian.${index}.lastNames`
                                                       )}
                                                       placeholder="Apellidos del tutor"
                                                  />
                                                  {getFieldError(
                                                       `guardian.${index}.lastNames`
                                                  ) && (
                                                            <p className="mt-1 text-sm text-red-600">
                                                                 {getFieldError(
                                                                      `guardian.${index}.lastNames`
                                                                 )}
                                                            </p>
                                                       )}
                                             </div>
                                             <div>
                                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                                       Teléfono{" "}
                                                       <span className="text-red-500">
                                                            *
                                                       </span>
                                                  </label>
                                                  <input
                                                       type="tel"
                                                       value={guardian.phone}
                                                       onChange={(e) =>
                                                            handleGuardianChange(
                                                                 index,
                                                                 "phone",
                                                                 e.target.value
                                                            )
                                                       }
                                                       onBlur={() =>
                                                            handleBlur(
                                                                 `guardian.${index}.phone`
                                                            )
                                                       }
                                                       required
                                                       maxLength={9}
                                                       className={getInputClassName(
                                                            `guardian.${index}.phone`
                                                       )}
                                                       placeholder="999999999"
                                                  />
                                                  {getFieldError(
                                                       `guardian.${index}.phone`
                                                  ) && (
                                                            <p className="mt-1 text-sm text-red-600">
                                                                 {getFieldError(
                                                                      `guardian.${index}.phone`
                                                                 )}
                                                            </p>
                                                       )}
                                                  <p className="mt-1 text-xs text-gray-500">
                                                       9 dígitos
                                                  </p>
                                             </div>
                                             <div>
                                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                                       Tipo Doc.
                                                  </label>
                                                  <select
                                                       value={
                                                            guardian.documentType
                                                       }
                                                       onChange={(e) =>
                                                            handleGuardianChange(
                                                                 index,
                                                                 "documentType",
                                                                 e.target.value
                                                            )
                                                       }
                                                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                  >
                                                       {documentTypes.map(
                                                            (type) => (
                                                                 <option
                                                                      key={type}
                                                                      value={
                                                                           type
                                                                      }
                                                                 >
                                                                      {type}
                                                                 </option>
                                                            )
                                                       )}
                                                  </select>
                                             </div>
                                             <div>
                                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                                       N° Documento{" "}
                                                       <span className="text-red-500">
                                                            *
                                                       </span>
                                                  </label>
                                                  <input
                                                       type="text"
                                                       value={
                                                            guardian.documentNumber
                                                       }
                                                       onChange={(e) =>
                                                            handleGuardianChange(
                                                                 index,
                                                                 "documentNumber",
                                                                 e.target.value
                                                            )
                                                       }
                                                       onBlur={() =>
                                                            handleBlur(
                                                                 `guardian.${index}.documentNumber`
                                                            )
                                                       }
                                                       required
                                                       className={getInputClassName(
                                                            `guardian.${index}.documentNumber`
                                                       )}
                                                       placeholder={
                                                            guardian.documentType ===
                                                                 "DNI"
                                                                 ? "8 dígitos"
                                                                 : guardian.documentType ===
                                                                      "CE"
                                                                      ? "9 dígitos"
                                                                      : "6-12 caracteres"
                                                       }
                                                  />
                                                  {getFieldError(
                                                       `guardian.${index}.documentNumber`
                                                  ) && (
                                                            <p className="mt-1 text-sm text-red-600">
                                                                 {getFieldError(
                                                                      `guardian.${index}.documentNumber`
                                                                 )}
                                                            </p>
                                                       )}
                                             </div>
                                        </div>
                                   </div>
                              ))}
                         </div>

                         {/* Información de Salud */}
                         <div>
                              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                   <Heart className="h-5 w-5 mr-2 text-gray-600" />
                                   Información de Salud
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Estado de Salud
                                        </label>
                                        <input
                                             type="text"
                                             name="healthInfo.healthStatus"
                                             value={
                                                  formData.healthInfo
                                                       ?.healthStatus
                                             }
                                             onChange={handleChange}
                                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                   </div>
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Enfermedades
                                        </label>
                                        <input
                                             type="text"
                                             name="healthInfo.illnesses"
                                             value={
                                                  formData.healthInfo?.illnesses
                                             }
                                             onChange={handleChange}
                                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                   </div>
                                   <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Vacunas
                                        </label>
                                        <textarea
                                             name="healthInfo.vaccines"
                                             value={
                                                  formData.healthInfo?.vaccines
                                             }
                                             onChange={handleChange}
                                             rows={2}
                                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                   </div>
                              </div>
                         </div>

                         {/* Información de Desarrollo */}
                         <div>
                              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                   <Activity className="h-5 w-5 mr-2 text-gray-600" />
                                   Información de Desarrollo
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Tipo de Nacimiento
                                        </label>
                                        <input
                                             type="text"
                                             name="developmentInfo.birthType"
                                             value={
                                                  formData.developmentInfo
                                                       ?.birthType
                                             }
                                             onChange={handleChange}
                                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                   </div>
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Complicaciones
                                        </label>
                                        <input
                                             type="text"
                                             name="developmentInfo.complications"
                                             value={
                                                  formData.developmentInfo
                                                       ?.complications
                                             }
                                             onChange={handleChange}
                                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                   </div>
                                   <div className="md:col-span-2">
                                        <div className="flex flex-wrap gap-4">
                                             <label className="flex items-center">
                                                  <input
                                                       type="checkbox"
                                                       name="developmentInfo.hasAuditoryDisability"
                                                       checked={
                                                            formData
                                                                 .developmentInfo
                                                                 ?.hasAuditoryDisability
                                                       }
                                                       onChange={handleChange}
                                                       className="mr-2"
                                                  />
                                                  <span className="text-sm text-gray-700">
                                                       Discapacidad Auditiva
                                                  </span>
                                             </label>
                                             <label className="flex items-center">
                                                  <input
                                                       type="checkbox"
                                                       name="developmentInfo.hasVisualDisability"
                                                       checked={
                                                            formData
                                                                 .developmentInfo
                                                                 ?.hasVisualDisability
                                                       }
                                                       onChange={handleChange}
                                                       className="mr-2"
                                                  />
                                                  <span className="text-sm text-gray-700">
                                                       Discapacidad Visual
                                                  </span>
                                             </label>
                                             <label className="flex items-center">
                                                  <input
                                                       type="checkbox"
                                                       name="developmentInfo.hasMotorDisability"
                                                       checked={
                                                            formData
                                                                 .developmentInfo
                                                                 ?.hasMotorDisability
                                                       }
                                                       onChange={handleChange}
                                                       className="mr-2"
                                                  />
                                                  <span className="text-sm text-gray-700">
                                                       Discapacidad Motora
                                                  </span>
                                             </label>
                                        </div>
                                   </div>
                              </div>
                         </div>

                         <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                              <button
                                   type="button"
                                   onClick={() => navigate("/estudiantes")}
                                   className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                              >
                                   <X className="h-4 w-4 mr-2" />
                                   Cancelar
                              </button>
                              <button
                                   type="submit"
                                   disabled={loading}
                                   className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                              >
                                   <Save className="h-4 w-4 mr-2" />
                                   {loading ? "Creando..." : "Crear Estudiante"}
                              </button>
                         </div>
                    </form>
               </div>
          </div>
     );
}
