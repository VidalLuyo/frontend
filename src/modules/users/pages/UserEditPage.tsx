/**
 * Página: UserEditPage
 * Página para editar un registro de Usuarios
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
     Save,
     X,
     User as UserIcon,
     Mail,
     Phone,
     MapPin,
     Building2,
} from "lucide-react";
import { usersService } from "../service/User.service";
import { institutionService } from "../../institution/service/Institution.service";
import {
     showSuccessAlert,
     showErrorAlert,
     showLoadingAlert,
     closeAlert,
} from "../../../shared/utils/sweetAlert";
import type { User, UpdateUserDto, UserRole } from "../models/users.model";
import type { InstitutionCompleteResponse } from "../../institution/models/Institution.interface";

export function UserEditPage() {
     const { userId } = useParams<{ userId: string }>();
     const navigate = useNavigate();
     const [loading, setLoading] = useState(true);
     const [saving, setSaving] = useState(false);
     const [user, setUser] = useState<User | null>(null);
     const [institutionName, setInstitutionName] = useState<string>("");
     const [formData, setFormData] = useState<UpdateUserDto>({});
     const [errors, setErrors] = useState<Record<string, string>>({});
     const [touched, setTouched] = useState<Record<string, boolean>>({});

     useEffect(() => {
          const fetchUser = async () => {
               if (!userId) {
                    navigate("/usuarios");
                    return;
               }

               try {
                    setLoading(true);
                    const userData = await usersService.getById(userId);
                    setUser(userData);
                    setFormData({
                         institutionId: userData.institutionId,
                         firstName: userData.firstName,
                         lastName: userData.lastName,
                         documentType: userData.documentType,
                         documentNumber: userData.documentNumber,
                         phone: userData.phone,
                         address: userData.address,
                         email: userData.email,
                         userName: userData.userName,
                         role: userData.role,
                         status: userData.status, // Preservar el estado original
                    });

                    // Cargar el nombre de la institución
                    try {
                         const institution =
                              await institutionService.getInstitutionById(
                                   userData.institutionId
                              );
                         setInstitutionName(
                              institution.institutionInformation.institutionName
                         );
                    } catch (error) {
                         console.error("Error al cargar institución:", error);
                         setInstitutionName("Institución no encontrada");
                    }
               } catch (error) {
                    console.error("Error al cargar usuario:", error);
                    showErrorAlert(
                         "Error al cargar usuario",
                         error instanceof Error
                              ? error.message
                              : "Error desconocido"
                    );
                    navigate("/usuarios");
               } finally {
                    setLoading(false);
               }
          };

          fetchUser();
     }, [userId, navigate]);

     const validateField = (name: string, value: string): string => {
          switch (name) {
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

               case "address":
                    if (!value) return "Este campo es requerido";
                    if (value.length < 5)
                         return "Debe tener al menos 5 caracteres";
                    return "";

               case "institutionId":
                    if (!value) return "Este campo es requerido";
                    return "";

               default:
                    return "";
          }
     };

     const handleChange = (
          e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
     ) => {
          const { name, value } = e.target;

          if (name === "phone" || name === "documentNumber") {
               const numericValue = value.replace(/\D/g, "");
               if (name === "phone" && numericValue.length > 9) return;
               if (name === "documentNumber" && numericValue.length > 8) return;

               setFormData((prev) => ({ ...prev, [name]: numericValue }));
               const error = validateField(name, numericValue);
               setErrors((prev) => ({ ...prev, [name]: error }));
               return;
          }

          setFormData((prev) => ({ ...prev, [name]: value }));
          const error = validateField(name, value);
          setErrors((prev) => ({ ...prev, [name]: error }));
     };

     const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
          const { name } = e.target;
          setTouched((prev) => ({ ...prev, [name]: true }));
     };

     const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!userId) return;

          const newErrors: Record<string, string> = {};
          const fieldsToValidate = [
               "firstName",
               "lastName",
               "documentNumber",
               "phone",
               "email",
               "userName",
               "address",
               "institutionId",
          ];

          for (const key of fieldsToValidate) {
               const value = formData[key as keyof UpdateUserDto] as string;
               const error = validateField(key, value || "");
               if (error) newErrors[key] = error;
          }

          const allTouched: Record<string, boolean> = {};
          for (const field of fieldsToValidate) {
               allTouched[field] = true;
          }
          setTouched(allTouched);

          console.log("=== DATOS DEL FORMULARIO ===");
          for (const field of fieldsToValidate) {
               const value = formData[field as keyof UpdateUserDto] as string;
               console.log(
                    `${field}: "${value || ""}" (${value ? "CON VALOR" : "VACÍO"
                    })`
               );
          }
          console.log("=== ERRORES ENCONTRADOS ===");
          for (const [field, error] of Object.entries(newErrors)) {
               console.log(`${field}: ${error}`);
          }

          if (Object.keys(newErrors).length > 0) {
               setErrors(newErrors);

               const errorList = Object.entries(newErrors)
                    .map(([field, error]) => {
                         const fieldNames: Record<string, string> = {
                              firstName: "Nombres",
                              lastName: "Apellidos",
                              documentNumber: "Número de Documento",
                              phone: "Teléfono",
                              email: "Email",
                              userName: "Nombre de Usuario",
                              address: "Dirección",
                              institutionId: "ID de Institución",
                         };
                         return `• ${fieldNames[field] || field}: ${error}`;
                    })
                    .join("\n");

               showErrorAlert("Errores en el formulario:", errorList);
               return;
          }

          setSaving(true);
          showLoadingAlert("Actualizando usuario...");

          try {
               // Excluir el campo 'role' del objeto a enviar para evitar modificaciones
               // pero mantener 'status' para preservar el estado del usuario
               const { role, ...updateData } = formData;
               await usersService.update(userId, updateData);
               closeAlert();
               await showSuccessAlert(
                    "¡Usuario actualizado!",
                    "Los cambios se han guardado correctamente"
               );
               navigate("/usuarios");
          } catch (error) {
               closeAlert();
               console.error("Error al actualizar usuario:", error);
               showErrorAlert(
                    "Error al actualizar usuario",
                    error instanceof Error ? error.message : "Error desconocido"
               );
          } finally {
               setSaving(false);
          }
     };

     const getFieldError = (fieldName: string) => {
          return touched[fieldName] && errors[fieldName]
               ? errors[fieldName]
               : "";
     };

     if (loading) {
          return (
               <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
               </div>
          );
     }

     if (!user) {
          return (
               <div className="max-w-4xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                         <div className="text-sm text-red-700">
                              Usuario no encontrado
                         </div>
                    </div>
               </div>
          );
     }

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
                         <UserIcon className="h-8 w-8 mr-3 text-indigo-600" />
                         Editar Usuario: {user.firstName} {user.lastName}
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                         Modifique los datos del usuario
                    </p>
               </div>

               <div className="bg-white rounded-lg shadow">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Información Personal */}
                              <div className="md:col-span-2">
                                   <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                        <UserIcon className="h-5 w-5 mr-2 text-gray-600" />
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
                                        value={formData.firstName || ""}
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
                                        value={formData.lastName || ""}
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
                                        value={formData.documentType || ""}
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
                                        value={formData.documentNumber || ""}
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
                                             value={formData.phone || ""}
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
                                             value={formData.email || ""}
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
                                             value={formData.address || ""}
                                             onChange={handleChange}
                                             onBlur={handleBlur}
                                             className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${getFieldError("address")
                                                  ? "border-red-500"
                                                  : "border-gray-300"
                                                  }`}
                                             placeholder="Ingrese la dirección completa"
                                        />
                                   </div>
                                   {getFieldError("address") && (
                                        <p className="mt-1 text-sm text-red-600">
                                             {getFieldError("address")}
                                        </p>
                                   )}
                              </div>

                              <div className="md:col-span-2">
                                   <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6 flex items-center">
                                        <UserIcon className="h-5 w-5 mr-2 text-gray-600" />
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
                                        <input
                                             type="text"
                                             id="institutionName"
                                             name="institutionName"
                                             value={institutionName}
                                             disabled
                                             className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                                             placeholder="Cargando..."
                                        />
                                   </div>
                                   <p className="mt-1 text-xs text-gray-500">
                                        La institución no puede ser modificada
                                   </p>
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
                                        value={formData.userName || ""}
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
                                        value={formData.role || ""}
                                        onChange={handleChange}
                                        disabled
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed focus:outline-none"
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
                                   <p className="mt-1 text-xs text-gray-500">
                                        El rol no puede ser modificado
                                   </p>
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
