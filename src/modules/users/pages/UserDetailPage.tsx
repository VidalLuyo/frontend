/**
 * Página: UserDetailPage
 * Página para ver los detalles de Usuarios
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import { usersService } from "../service/User.service";
import { institutionService } from "../../institution/service/Institution.service";
import type { User } from "../models/users.model";

export function UserDetailPage() {
     const { userId } = useParams<{ userId: string }>();
     const navigate = useNavigate();
     const [loading, setLoading] = useState(true);
     const [user, setUser] = useState<User | null>(null);
     const [institutionName, setInstitutionName] = useState<string>("");

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
                    alert(
                         "Error al cargar usuario: " +
                              (error instanceof Error
                                   ? error.message
                                   : "Error desconocido")
                    );
                    navigate("/usuarios");
               } finally {
                    setLoading(false);
               }
          };

          fetchUser();
     }, [userId, navigate]);

     const getRoleText = (role: string) => {
          const roleLabels: Record<string, string> = {
               ADMIN: "Administrador",
               PADRE: "Padre",
               MADRE: "Madre",
               DIRECTOR: "Director",
               AUXILIAR: "Auxiliar",
               TUTOR: "Tutor",
          };
          return roleLabels[role] || role;
     };

     const getStatusText = (status: string) => {
          return status === "ACTIVE" ? "Activo" : "Inactivo";
     };

     const getStatusClass = (status: string) => {
          return status === "ACTIVE"
               ? "bg-green-100 text-green-800"
               : "bg-red-100 text-red-800";
     };

     const formatDate = (dateString: string) => {
          return new Date(dateString).toLocaleDateString("es-ES", {
               year: "numeric",
               month: "long",
               day: "numeric",
               hour: "2-digit",
               minute: "2-digit",
          });
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

     return (
          <div className="max-w-4xl mx-auto">
               <div className="mb-6 flex justify-between items-start">
                    <div>
                         <h1 className="text-3xl font-bold text-gray-900">
                              {user.firstName} {user.lastName}
                         </h1>
                         <p className="mt-2 text-sm text-gray-600">
                              Detalles del usuario
                         </p>
                    </div>
                    <div className="flex space-x-3">
                         {user.status === "ACTIVE" && (
                              <button
                                   onClick={() =>
                                        navigate(
                                             `/usuarios/${user.userId}/editar`
                                        )
                                   }
                                   className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                   Editar
                              </button>
                         )}
                         {user.status === "INACTIVE" && (
                              <div className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 bg-gray-100 cursor-not-allowed">
                                   Usuario Inactivo - No Editable
                              </div>
                         )}
                         <button
                              onClick={() => navigate("/usuarios")}
                              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                         >
                              Volver
                         </button>
                    </div>
               </div>

               <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                         <div className="flex justify-between items-center">
                              <h2 className="text-lg font-medium text-gray-900">
                                   Información del Usuario
                              </h2>
                              <div className="flex items-center space-x-3">
                                   <span
                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(
                                             user.status
                                        )}`}
                                   >
                                        {getStatusText(user.status)}
                                   </span>
                                   <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                        {getRoleText(user.role)}
                                   </span>
                              </div>
                         </div>
                    </div>

                    <div className="px-6 py-4">
                         <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="md:col-span-2">
                                   <h3 className="text-md font-medium text-gray-900 mb-4">
                                        Información Personal
                                   </h3>
                              </div>

                              <div>
                                   <dt className="text-sm font-medium text-gray-500">
                                        Nombres
                                   </dt>
                                   <dd className="mt-1 text-sm text-gray-900">
                                        {user.firstName}
                                   </dd>
                              </div>

                              <div>
                                   <dt className="text-sm font-medium text-gray-500">
                                        Apellidos
                                   </dt>
                                   <dd className="mt-1 text-sm text-gray-900">
                                        {user.lastName}
                                   </dd>
                              </div>

                              <div>
                                   <dt className="text-sm font-medium text-gray-500">
                                        Tipo de Documento
                                   </dt>
                                   <dd className="mt-1 text-sm text-gray-900">
                                        {user.documentType}
                                   </dd>
                              </div>

                              <div>
                                   <dt className="text-sm font-medium text-gray-500">
                                        Número de Documento
                                   </dt>
                                   <dd className="mt-1 text-sm text-gray-900">
                                        {user.documentNumber}
                                   </dd>
                              </div>

                              <div>
                                   <dt className="text-sm font-medium text-gray-500">
                                        Teléfono
                                   </dt>
                                   <dd className="mt-1 text-sm text-gray-900">
                                        {user.phone}
                                   </dd>
                              </div>

                              <div>
                                   <dt className="text-sm font-medium text-gray-500">
                                        Email
                                   </dt>
                                   <dd className="mt-1 text-sm text-gray-900">
                                        {user.email}
                                   </dd>
                              </div>

                              <div className="md:col-span-2">
                                   <dt className="text-sm font-medium text-gray-500">
                                        Dirección
                                   </dt>
                                   <dd className="mt-1 text-sm text-gray-900">
                                        {user.address}
                                   </dd>
                              </div>

                              <div className="md:col-span-2 mt-6">
                                   <h3 className="text-md font-medium text-gray-900 mb-4">
                                        Información del Sistema
                                   </h3>
                              </div>
                              <div>
                                   <dt className="text-sm font-medium text-gray-500 flex items-center">
                                        <Building2 className="h-4 w-4 mr-1" />
                                        Institución
                                   </dt>
                                   <dd className="mt-1 text-sm text-gray-900">
                                        {institutionName || "Cargando..."}
                                   </dd>
                              </div>

                              <div>
                                   <dt className="text-sm font-medium text-gray-500">
                                        Nombre de Usuario
                                   </dt>
                                   <dd className="mt-1 text-sm text-gray-900">
                                        {user.userName}
                                   </dd>
                              </div>

                              <div>
                                   <dt className="text-sm font-medium text-gray-500">
                                        Rol
                                   </dt>
                                   <dd className="mt-1 text-sm text-gray-900">
                                        {getRoleText(user.role)}
                                   </dd>
                              </div>

                              <div>
                                   <dt className="text-sm font-medium text-gray-500">
                                        Fecha de Creación
                                   </dt>
                                   <dd className="mt-1 text-sm text-gray-900">
                                        {formatDate(user.createdAt)}
                                   </dd>
                              </div>

                              <div>
                                   <dt className="text-sm font-medium text-gray-500">
                                        Última Actualización
                                   </dt>
                                   <dd className="mt-1 text-sm text-gray-900">
                                        {formatDate(user.updatedAt)}
                                   </dd>
                              </div>
                         </dl>
                    </div>
               </div>
          </div>
     );
}
