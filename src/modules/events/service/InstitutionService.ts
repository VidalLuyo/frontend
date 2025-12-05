import axios from "axios";
import type { InstitutionMinimal } from "../models/InstitutionMinimal";

// Mantienes este para obtener por ID
const API_URL = "http://localhost:9085/api/v1/institutions";

// Nuevo URL para listar todas las instituciones directamente de tu compañero
const API_LIST_URL = "http://localhost:9080/api/v1/institutions";

export const InstitutionService = {
  getInstitutionById: async (id: string) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data; // funciona con tu microservicio
  },

  listAll: async (): Promise<InstitutionMinimal[]> => {
    const response = await axios.get(API_LIST_URL);
    return response.data.data; // <--- OJO: usar el array dentro de "data"
  },
};
