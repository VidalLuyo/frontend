/**
 * Página: UserCreatePage
 * Página para crear un nuevo usuario
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, X, User, Mail, Phone, MapPin, Building2 } from "lucide-react";
import { usersService } from "../service/User.service";
import { institutionService } from "../../institution/service/Institution.service";
import {
     showSuccessAlert,
     showErrorAlert,
     showLoadingAlert,
     closeAlert,
} from "../../../shared/utils/sweetAlert";
import type { CreateUserDto, UserRole } from "../models/users.model";
import type { InstitutionCompleteResponse } from "../../institution/models/Institution.interface";

export function UserCreatePage() {
     const navigate = useNavigate();
     const [loading, setLoading] = useState(false);
     const [institutions, setInstitutions] = useState<
          InstitutionCompleteResponse[]
     >([]);
     const [loadingInstitutions, setLoadingInstitutions] = useState(true);
     const [formData, setFormData] = useState<CreateUserDto>({
          institutionId: "",
          firstName: "",
          lastName: "",
          documentType: "DNI",
          documentNumber: "",
          phone: "",
          address: "",
          email: "",
          userName: "",
          role: "TUTOR",
     });

     const [errors, setErrors] = useState<Record<string, string>>({});
     const [touched, setTouched] = useState<Record<string, boolean>>({});

     // Cargar instituciones al montar el componente
     useEffect(() => {
          const loadInstitutions = async () => {
               try {
                    setLoadingInstitutions(true);
                    const data =
                         await institutionService.getActiveInstitutions();
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

          loadInstitutions();
     }, []);

     const validateField = (name: string, value: string): string => {
          switch (name) {
               case "institutionId":
                    if (!value) return "Debe seleccionar una institución";
                    return "";

               case "firstName":
               case "lastName":
                    if (!value) return "Este campo es requerido";
                    if (value.length < 2)
                         return "Debe tener al menos 2 caracteres";
                    if (!/^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s]+$/.test(value))
                         return "Solo se permiten letras y espacios";
                    return "";

               case "documentNumber":
                    if (!value) return "Este campo es requerido";
                    if (!/^\d{8}$/.test(value))
                         return "Debe tener exactamente 8 dígitos numéricos";
                    return "";

               case "phone":
                    if (!value) return "Este campo es requerido";
                    if (!/^9\d{8}$/.test(value))
                         return "Debe comenzar con 9 y tener 9 dígitos numéricos";
                    return "";

               case "email":
                    if (!value) return "Este campo es requerido";
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
                         return "Ingrese un email válido";
                    return "";

               case "userName":
                    if (!value) return "Este campo es requerido";
                    if (value.length < 3)
                         return "Debe tener al menos 3 caracteres";
                    if (!/^[a-zA-Z0-9._-]+$/.test(value))
                         return "Solo letras, números, puntos, guiones";
                    return "";

               default:
                    return "";
          }
     };

     const handleChange = (
          e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
     ) => {
          const { name, value } = e.target;

          // Filtrar valores para campos numéricos
          let filteredValue = value;
          if (name === "documentNumber") {
               // Solo números, máximo 8 dígitos
               filteredValue = value.replace(/\D/g, "").slice(0, 8);
          } else if (name === "phone") {
               // Solo números, máximo 9 dígitos
               filteredValue = value.replace(/\D/g, "").slice(0, 9);
          }

          setFormData((prev) => ({ ...prev, [name]: filteredValue }));

          const error = validateField(name, filteredValue);
          setErrors((prev) => ({ ...prev, [name]: error }));
     };

     const handleBlur = (
          e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>
     ) => {
          const { name } = e.target;
          setTouched((prev) => ({ ...prev, [name]: true }));
     };

     const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();

          const newErrors: Record<string, string> = {};
          Object.keys(formData).forEach((key) => {
               if (
                    [
                         "institutionId",
                         "firstName",
                         "lastName",
                         "documentNumber",
                         "phone",
                         "email",
                         "userName",
                    ].includes(key)
               ) {
                    const error = validateField(
                         key,
                         formData[key as keyof CreateUserDto] as string
                    );
                    if (error) newErrors[key] = error;
               }
          });

          if (Object.keys(newErrors).length > 0) {
               setErrors(newErrors);
               showErrorAlert(
                    "Formulario inválido",
                    "Por favor corrige los errores antes de continuar"
               );
               return;
          }

          setLoading(true);
          showLoadingAlert("Creando usuario...");

          try {
               await usersService.create(formData);
               closeAlert();
               await showSuccessAlert(
                    "¡Usuario creado!",
                    "El usuario se ha creado correctamente"
               );
               navigate("/usuarios");
          } catch (error) {
               closeAlert();
               console.error("Error al crear usuario:", error);
               showErrorAlert(
                    "Error al crear usuario",
                    error instanceof Error ? error.message : "Error desconocido"
               );
          } finally {
               setLoading(false);
          }
     };

     const getFieldError = (fieldName: string) => {
          return touched[fieldName] && errors[fieldName]
               ? errors[fieldName]
               : "";
     };

     const documentTypes = ["DNI", "CE", "Pasaporte"];
     const roles: { value: UserRole; label: string }[] = [
          { value: "ADMIN", label: "Administrador" },
          { value: "DIRECTOR", label: "Director" },
          { value: "TUTOR", label: "Tutor" },
          { value: "AUXILIAR", label: "Auxiliar" },
          { value: "PADRE", label: "Padre" },
          { value: "MADRE", label: "Madre" },
     ];

     return (
          <div className="max-w-4xl mx-auto">
               <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                         <User className="h-8 w-8 mr-3 text-indigo-600" />
                         Nuevo Usuario
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                         Complete el formulario para crear un nuevo usuario
                    </p>
               </div>

               <div className="bg-white rounded-lg shadow">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="md:col-span-2">
                                   <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                        <User className="h-5 w-5 mr-2 text-gray-600" />
                                        Información Personal
                                   </h3>
                              </div>

                              <div>
                                   <label
                                        htmlFor="firstName"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                   >
                                        Nombres *
                                   </label>
                                   <input
                                        type="text"
                                        id="firstName"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${getFieldError("firstName")
                                                  ? "border-red-500"
                                                  : "border-gray-300"
                                             }`}
                                        placeholder="Ingrese los nombres"
                                   />
                                   {getFieldError("firstName") && (
                                        <p className="mt-1 text-sm text-red-600">
                                             {getFieldError("firstName")}
                                        </p>
                                   )}
                              </div>

                              <div>
                                   <label
                                        htmlFor="lastName"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                   >
                                        Apellidos *
                                   </label>
                                   <input
                                        type="text"
                                        id="lastName"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${getFieldError("lastName")
                                                  ? "border-red-500"
                                                  : "border-gray-300"
                                             }`}
                                        placeholder="Ingrese los apellidos"
                                   />
                                   {getFieldError("lastName") && (
                                        <p className="mt-1 text-sm text-red-600">
                                             {getFieldError("lastName")}
                                        </p>
                                   )}
                              </div>

                              <div>
                                   <label
                                        htmlFor="documentType"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                   >
                                        Tipo de Documento *
                                   </label>
                                   <select
                                        id="documentType"
                                        name="documentType"
                                        value={formData.documentType}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                   >
                                        {documentTypes.map((type) => (
                                             <option key={type} value={type}>
                                                  {type}
                                             </option>
                                        ))}
                                   </select>
                              </div>

                              <div>
                                   <label
                                        htmlFor="documentNumber"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                   >
                                        Número de Documento *
                                   </label>
                                   <input
                                        type="text"
                                        id="documentNumber"
                                        name="documentNumber"
                                        value={formData.documentNumber}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        maxLength={8}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${getFieldError("documentNumber")
                                                  ? "border-red-500"
                                                  : "border-gray-300"
                                             }`}
                                        placeholder="12345678"
                                   />
                                   {getFieldError("documentNumber") && (
                                        <p className="mt-1 text-sm text-red-600">
                                             {getFieldError("documentNumber")}
                                        </p>
                                   )}
                              </div>

                              <div>
                                   <label
                                        htmlFor="phone"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                   >
                                        Teléfono *
                                   </label>
                                   <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                             type="tel"
                                             id="phone"
                                             name="phone"
                                             value={formData.phone}
                                             onChange={handleChange}
                                             onBlur={handleBlur}
                                             maxLength={9}
                                             className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${getFieldError("phone")
                                                       ? "border-red-500"
                                                       : "border-gray-300"
                                                  }`}
                                             placeholder="912345678"
                                        />
                                   </div>
                                   {getFieldError("phone") && (
                                        <p className="mt-1 text-sm text-red-600">
                                             {getFieldError("phone")}
                                        </p>
                                   )}
                              </div>

                              <div>
                                   <label
                                        htmlFor="email"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                   >
                                        Email *
                                   </label>
                                   <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                             type="email"
                                             id="email"
                                             name="email"
                                             value={formData.email}
                                             onChange={handleChange}
                                             onBlur={handleBlur}
                                             className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${getFieldError("email")
                                                       ? "border-red-500"
                                                       : "border-gray-300"
                                                  }`}
                                             placeholder="usuario@ejemplo.com"
                                        />
                                   </div>
                                   {getFieldError("email") && (
                                        <p className="mt-1 text-sm text-red-600">
                                             {getFieldError("email")}
                                        </p>
                                   )}
                              </div>

                              <div className="md:col-span-2">
                                   <label
                                        htmlFor="address"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                   >
                                        Dirección *
                                   </label>
                                   <div className="relative">
                                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <input
                                             type="text"
                                             id="address"
                                             name="address"
                                             value={formData.address}
                                             onChange={handleChange}
                                             required
                                             className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                             placeholder="Ingrese la dirección completa"
                                        />
                                   </div>
                              </div>

                              <div className="md:col-span-2">
                                   <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6 flex items-center">
                                        <User className="h-5 w-5 mr-2 text-gray-600" />
                                        Información del Sistema
                                   </h3>
                              </div>

                              <div>
                                   <label
                                        htmlFor="institutionId"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                   >
                                        Institución *
                                   </label>
                                   <div className="relative">
                                        <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <select
                                             id="institutionId"
                                             name="institutionId"
                                             value={formData.institutionId}
                                             onChange={handleChange}
                                             onBlur={handleBlur}
                                             disabled={loadingInstitutions}
                                             className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${getFieldError("institutionId")
                                                       ? "border-red-500"
                                                       : "border-gray-300"
                                                  }`}
                                        >
                                             <option value="">
                                                  {loadingInstitutions
                                                       ? "Cargando instituciones..."
                                                       : "Seleccione una institución"}
                                             </option>
                                             {institutions.map((inst) => (
                                                  <option
                                                       key={inst.institutionId}
                                                       value={
                                                            inst.institutionId
                                                       }
                                                  >
                                                       {
                                                            inst
                                                                 .institutionInformation
                                                                 .institutionName
                                                       }{" "}
                                                       -{" "}
                                                       {
                                                            inst
                                                                 .institutionInformation
                                                                 .codeInstitution
                                                       }
                                                  </option>
                                             ))}
                                        </select>
                                   </div>
                                   {getFieldError("institutionId") && (
                                        <p className="mt-1 text-sm text-red-600">
                                             {getFieldError("institutionId")}
                                        </p>
                                   )}
                              </div>

                              <div>
                                   <label
                                        htmlFor="userName"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                   >
                                        Nombre de Usuario *
                                   </label>
                                   <input
                                        type="text"
                                        id="userName"
                                        name="userName"
                                        value={formData.userName}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${getFieldError("userName")
                                                  ? "border-red-500"
                                                  : "border-gray-300"
                                             }`}
                                        placeholder="usuario123"
                                   />
                                   {getFieldError("userName") && (
                                        <p className="mt-1 text-sm text-red-600">
                                             {getFieldError("userName")}
                                        </p>
                                   )}
                              </div>

                              <div className="md:col-span-2">
                                   <label
                                        htmlFor="role"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                   >
                                        Rol *
                                   </label>
                                   <select
                                        id="role"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                   >
                                        {roles.map((role) => (
                                             <option
                                                  key={role.value}
                                                  value={role.value}
                                             >
                                                  {role.label}
                                             </option>
                                        ))}
                                   </select>
                              </div>
                         </div>

                         <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                              <button
                                   type="button"
                                   onClick={() => navigate("/usuarios")}
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
                                   {loading ? "Creando..." : "Crear Usuario"}
                              </button>
                         </div>
                    </form>
               </div>
          </div>
     );
}
