/**
 * Componente: UserList
 * Muestra la lista de usuarios con paginación
 */

import { useNavigate } from "react-router-dom";
import { Eye, Edit3, Trash2, RotateCcw } from "lucide-react";
import { usePagination } from "../../../shared/hooks/usePagination";
import { Pagination } from "../../../shared/components/Pagination";
import {
  showDeleteConfirm,
  showRestoreConfirm,
} from "../../../shared/utils/sweetAlert";
import type { User } from "../models/users.model";

interface UserListProps {
  readonly items: User[];
  readonly onDelete?: (userId: string) => void;
  readonly onRestore?: (userId: string) => void;
}

export function UserList({ items, onDelete, onRestore }: UserListProps) {
  const navigate = useNavigate();

  const {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    hasNext,
    hasPrevious,
    totalItems,
  } = usePagination({ data: items, itemsPerPage: 8 });

  const handleView = (userId: string) => {
    navigate(`/usuarios/${userId}`);
  };

  const handleEdit = (userId: string) => {
    navigate(`/usuarios/${userId}/editar`);
  };

  const handleDelete = async (userId: string, userName: string) => {
    const result = await showDeleteConfirm(userName);
    if (result.isConfirmed) {
      onDelete?.(userId);
    }
  };

  const handleRestore = async (userId: string, userName: string) => {
    const result = await showRestoreConfirm(userName);
    if (result.isConfirmed) {
      onRestore?.(userId);
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

  const getRoleText = (role: string) => {
    const roleLabels: Record<string, string> = {
      ADMIN: "Administrador",
      PADRE: "Padre",
      MADRE: "Madre",
      DIRECTOR: "Director",
      AUXILIAR: "Auxiliar",
      TUTOR: "Tutor",
      PROFESOR: "Profesor",
    };
    return roleLabels[role] || role;
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Información Personal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rol
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
            {paginatedData.map((user) => (
              <tr
                key={user.userId}
                className="hover:bg-gray-50"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-900">
                      {user.userName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {user.email}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-900">
                      {user.firstName}{" "}
                      {user.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {user.documentType}:{" "}
                      {user.documentNumber}
                    </div>
                    <div className="text-sm text-gray-500">
                      {user.phone}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {getRoleText(user.role)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(
                      user.status
                    )}`}
                  >
                    {getStatusText(user.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() =>
                        handleView(
                          user.userId
                        )
                      }
                      className="inline-flex items-center px-2 py-1 border border-blue-300 rounded-md text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors duration-200"
                      title="Ver detalles"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                    </button>
                    {user.status === "ACTIVE" ? (
                      <button
                        onClick={() =>
                          handleEdit(
                            user.userId
                          )
                        }
                        className="inline-flex items-center px-2 py-1 border border-indigo-300 rounded-md text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200"
                        title="Editar usuario"
                      >
                        <Edit3 className="h-4 w-4 mr-1" />
                      </button>
                    ) : (
                      <div
                        className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-500 bg-gray-100 cursor-not-allowed"
                        title="Usuario inactivo - No editable"
                      >
                        <Edit3 className="h-4 w-4 mr-1 opacity-50" />
                      </div>
                    )}
                    {user.status === "ACTIVE" ? (
                      <button
                        onClick={() =>
                          handleDelete(
                            user.userId,
                            user.userName
                          )
                        }
                        className="inline-flex items-center px-2 py-1 border border-red-300 rounded-md text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors duration-200"
                        title="Eliminar usuario"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          handleRestore(
                            user.userId,
                            user.userName
                          )
                        }
                        className="inline-flex items-center px-2 py-1 border border-green-300 rounded-md text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors duration-200"
                        title="Restaurar usuario"
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
              No se encontraron usuarios
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
