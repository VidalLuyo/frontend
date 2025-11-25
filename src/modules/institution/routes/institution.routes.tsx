/**
 * Rutas del módulo Institution
 * Define todas las rutas relacionadas con instituciones
 */

import { Route } from "react-router-dom";
import { InstitutionPage } from "../pages/InstitutionPage";

export const institutionRoutes = (
     <>
          <Route path="institucion" element={<InstitutionPage />} />
     </>
);