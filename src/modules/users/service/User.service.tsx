/**
 * Servicio: UserService
 * Maneja las peticiones al API para Usuarios
 */

import type { User, CreateUserDto, UpdateUserDto, ApiResponse, UserFilters, UserStatus } from '../models/users.model'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9083/api/v1'

export const usersService = {
  async getAll(): Promise<User[]> {
    const response = await fetch(`${API_URL}/users`);
    if (!response.ok) throw new Error("Error al obtener usuarios");
    const apiResponse: ApiResponse<User[]> = await response.json();
    return apiResponse.data || [];
  },

  async getById(userId: string): Promise<User> {
    const response = await fetch(`${API_URL}/users/${userId}`);
    if (!response.ok) throw new Error("Error al obtener el usuario");
    const apiResponse: ApiResponse<User> = await response.json();
    if (!apiResponse.data) throw new Error("Usuario no encontrado");
    return apiResponse.data;
  },

  async getByStatus(status: UserStatus): Promise<User[]> {
      const statusParam = status === "ACTIVE" ? "ACTIVE" : "INACTIVE";
    const response = await fetch(`${API_URL}/users/status/${statusParam}`);
    if (!response.ok) throw new Error("Error al obtener usuarios por estado");
    const apiResponse: ApiResponse<User[]> = await response.json();
    return apiResponse.data || [];
  },

  async create(data: CreateUserDto): Promise<User> {
    const response = await fetch(`${API_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Error al crear el usuario");
    const apiResponse: ApiResponse<User> = await response.json();
    if (!apiResponse.data) throw new Error("Error al crear el usuario");
    return apiResponse.data;
  },
  async update(userId: string, data: UpdateUserDto): Promise<User> {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Usuario no encontrado");
      }
      throw new Error("Error al actualizar el usuario");
    }
    const apiResponse: ApiResponse<User> = await response.json();
    if (!apiResponse.data)
      throw new Error("Error al actualizar el usuario");
    return apiResponse.data;
  },
  async delete(userId: string): Promise<User> {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Usuario no encontrado");
      }
      throw new Error("Error al eliminar el usuario");
    }
    const apiResponse: ApiResponse<User> = await response.json();
    if (!apiResponse.data)
      throw new Error("Error al eliminar el usuario");
    return apiResponse.data;
  },

  async restore(userId: string): Promise<User> {
    const response = await fetch(`${API_URL}/users/${userId}/restore`, {
      method: "PATCH",
    });
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Usuario no encontrado");
      }
      throw new Error("Error al restaurar el usuario");
    }
    const apiResponse: ApiResponse<User> = await response.json();
    if (!apiResponse.data)
      throw new Error("Error al restaurar el usuario");
    return apiResponse.data;
  },

  filterUsers(users: User[], filters: UserFilters): User[] {
    return users.filter((user) => {
      if (filters.status && user.status !== filters.status)
        return false;
      if (filters.role && user.role !== filters.role) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const fullName =
          `${user.firstName} ${user.lastName}`.toLowerCase();
        const searchableText =
          `${fullName} ${user.email} ${user.userName} ${user.documentNumber}`.toLowerCase();
        if (!searchableText.includes(searchLower)) return false;
      }
      return true;
    });
  },
}
