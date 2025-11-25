/**
 * Página: UserPage
 * Página principal del módulo de Usuarios - Lista todos los registros
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, RefreshCw, Users } from "lucide-react";
import { UserList } from "../components/UserList";
import { usersService } from "../service/User.service";
import {
  showSuccessAlert,
  showErrorAlert,
  showLoadingAlert,
  closeAlert,
} from "../../../shared/utils/sweetAlert";
import type {
  User,
  UserFilters,
  UserStatus,
  UserRole,
} from "../models/users.model";

export function UserPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UserFilters>({});

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await usersService.getAll();
        setUsers(data);
        setFilteredUsers(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Error al cargar usuarios"
        );
        console.error("Error al cargar usuarios:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = usersService.filterUsers(users, filters);
    setFilteredUsers(filtered);
  }, [users, filters]);

  const handleDelete = async (userId: string) => {
    try {
      showLoadingAlert("Eliminando usuario...");
      await usersService.delete(userId);
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.userId === userId
            ? { ...user, status: "INACTIVE" as UserStatus }
            : user
        )
      );
      closeAlert();
      showSuccessAlert(
        "Usuario eliminado",
        "El usuario ha sido eliminado correctamente"
      );
    } catch (err) {
      closeAlert();
      console.error("Error al eliminar usuario:", err);
      showErrorAlert(
        "Error al eliminar",
        err instanceof Error ? err.message : "Error desconocido"
      );
    }
  };

  const handleRestore = async (userId: string) => {
    try {
      showLoadingAlert("Restaurando usuario...");
      await usersService.restore(userId);
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.userId === userId
            ? { ...user, status: "ACTIVE" as UserStatus }
            : user
        )
      );
      closeAlert();
      showSuccessAlert(
        "Usuario restaurado",
        "El usuario ha sido restaurado correctamente"
      );
    } catch (err) {
      closeAlert();
      console.error("Error al restaurar usuario:", err);
      showErrorAlert(
        "Error al restaurar",
        err instanceof Error ? err.message : "Error desconocido"
      );
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      showLoadingAlert("Recargando usuarios...");
      const data = await usersService.getAll();
      setUsers(data);
      setFilteredUsers(data);
      closeAlert();
      showSuccessAlert(
        "Lista actualizada",
        "Los datos se han actualizado correctamente"
      );
    } catch (err) {
      closeAlert();
      setError(
        err instanceof Error
          ? err.message
          : "Error al recargar usuarios"
      );
      showErrorAlert(
        "Error al recargar",
        err instanceof Error ? err.message : "Error desconocido"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<UserFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {error}
              </div>
              <div className="mt-4">
                <button
                  onClick={() =>
                    window.location.reload()
                  }
                  className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                >
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Users className="h-8 w-8 mr-3 text-indigo-600" />
            Usuarios
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Gestión de usuarios del sistema (
            {filteredUsers.length} usuarios)
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </button>
          <button
            onClick={() => navigate("/usuarios/nuevo")}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </button>
        </div>
      </div>

      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              placeholder="Nombre, email, usuario..."
              value={filters.search || ""}
              onChange={(e) =>
                handleFilterChange({
                  search: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={filters.status || ""}
              onChange={(e) =>
                handleFilterChange({
                  status:
                    (e.target.value as
                      | UserStatus
                      | undefined) ||
                    undefined,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Todos los estados</option>
              <option value="ACTIVE">Activos</option>
              <option value="INACTIVE">Inactivos</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rol
            </label>
            <select
              value={filters.role || ""}
              onChange={(e) =>
                handleFilterChange({
                  role:
                    (e.target.value as
                      | UserRole
                      | undefined) ||
                    undefined,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Todos los roles</option>
              <option value="ADMIN">Administrador</option>
              <option value="DIRECTOR">Director</option>
              <option value="TUTOR">Tutor</option>
              <option value="AUXILIAR">Auxiliar</option>
              <option value="PADRE">Padre</option>
              <option value="MADRE">Madre</option>
              <option value="PROFESOR">Profesor</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({})}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      <UserList
        items={filteredUsers}
        onDelete={handleDelete}
        onRestore={handleRestore}
      />
    </div>
  );
}
