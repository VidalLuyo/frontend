import type { SpecialNeedsSupport } from '../models/specialNeedSupport';

const API_URL = import.meta.env.VITE_API_URL || 'https://vg-ms-psychology-welfare.onrender.com/api/v1';

// ------------------ LISTAR TODOS (solo activos) ------------------
export const getAllSupports = async (): Promise<SpecialNeedsSupport[]> => {
  const response = await fetch(`${API_URL}/special-needs-support`);
  if (!response.ok) throw new Error('Error fetching supports');
  return response.json();
};

// ------------------ LISTAR TODOS (incluyendo inactivos) ------------------
export const getAllSupportsIncludingInactive = async (): Promise<SpecialNeedsSupport[]> => {
  const response = await fetch(`${API_URL}/special-needs-support/all`);
  if (!response.ok) throw new Error('Error fetching all supports (including inactive)');
  return response.json();
};

// ------------------ OBTENER POR ID ------------------
export const getSupportById = async (id: string): Promise<SpecialNeedsSupport> => {
  const response = await fetch(`${API_URL}/special-needs-support/${id}`);
  if (!response.ok) throw new Error(`Error fetching support with ID ${id}`);
  return response.json();
};

// ------------------ CREAR ------------------
export const createSupport = async (support: SpecialNeedsSupport): Promise<SpecialNeedsSupport> => {
  const response = await fetch(`${API_URL}/special-needs-support`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(support),
  });
  if (!response.ok) throw new Error('Error creating support');
  return response.json();
};

// ------------------ ACTUALIZAR ------------------
export const updateSupport = async (id: string, support: SpecialNeedsSupport): Promise<SpecialNeedsSupport> => {
  const response = await fetch(`${API_URL}/special-needs-support/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(support),
  });
  if (!response.ok) throw new Error(`Error updating support with ID ${id}`);
  return response.json();
};

// ------------------ ELIMINACIÓN LÓGICA ------------------
export const deactivateSupport = async (id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/special-needs-support/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error(`Error deactivating support with ID ${id}`);
};

// ------------------ REACTIVAR ------------------
export const activateSupport = async (id: string): Promise<SpecialNeedsSupport> => {
  const response = await fetch(`${API_URL}/special-needs-support/${id}/activate`, { method: 'PUT' });
  if (!response.ok) throw new Error(`Error activating support with ID ${id}`);
  return response.json();
};