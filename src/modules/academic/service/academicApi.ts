import type { CatalogRegistration, UUID } from "../models/catalog";

const API_URL = "http://localhost:9084/api/v1/academic";
const DEFAULT_INSTITUTION_ID: UUID = "4fa85f64-5717-4562-b3fc-2c963f66afa6";

export const academicApi = {
  async listAll(): Promise<CatalogRegistration[]> {
    const response = await fetch(`${API_URL}/list-all`);
    if (!response.ok) throw new Error("Error al obtener registros académicos");

    const rawList = await response.json();
    return rawList.map((item: any) => ({
      ...item,
      course: {
        ...item.course,
        active: item.course.status === "ACTIVE",
      },
      competency: {
        ...item.competency,
        active: item.competency.status === "ACTIVE",
      },
      capacity: {
        ...item.capacity,
        active: item.capacity.status === "ACTIVE",
      },
      performance: {
        ...item.performance,
        active: item.performance.status === "ACTIVE",
      },
    }));
  },

  async register(data: CatalogRegistration): Promise<CatalogRegistration> {
    const payload: CatalogRegistration = {
      institutionId: DEFAULT_INSTITUTION_ID,
      course: {
        code: data.course.code,
        name: data.course.name,
        areaCurricular: data.course.areaCurricular,
        ageLevel: data.course.ageLevel,
        description: data.course.description,
        active: true,
      },
      competency: {
        code: data.competency.code,
        name: data.competency.name,
        description: data.competency.description,
        orderIndex: data.competency.orderIndex,
      },
      capacity: {
        code: data.capacity.code,
        name: data.capacity.name,
        description: data.capacity.description,
        orderIndex: data.capacity.orderIndex,
      },
      performance: {
        code: data.performance.code,
        description: data.performance.description,
        ageLevel: data.performance.ageLevel,
        orderIndex: data.performance.orderIndex,
      },
    };

    const response = await fetch(`${API_URL}/register-all`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error("Error al registrar el curso");
    return await response.json();
  },

  async update(data: CatalogRegistration): Promise<CatalogRegistration> {
    const response = await fetch(`${API_URL}/update-all`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error("Error al actualizar el curso");
    return await response.json();
  },

  async deactivate(courseId: UUID): Promise<void> {
    const response = await fetch(`${API_URL}/deactivate/${courseId}`, {
      method: "PUT",
    });

    if (!response.ok) throw new Error("Error al desactivar el curso");
  },

  async activate(courseId: UUID): Promise<void> {
    const response = await fetch(`${API_URL}/activate/${courseId}`, {
      method: "PUT",
    });

    if (!response.ok) throw new Error("Error al activar el curso");
  },
};
