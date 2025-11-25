/**
 * Rutas del módulo Academic
 * Define todas las rutas relacionadas con académico
 */
import { Route } from "react-router-dom";
import { AcademicListPage } from "../pages/AcademicListPage";
import { AcademicCreatePage } from "../pages/AcademicCreatePage";
import { AcademicDetailPage } from "../pages/AcademicDetailPage";
import { AcademicEditPage } from "../pages/AcademicEditPage";

export const academicRoutes = (
  <>
    <Route path="gestion-academica" element={<AcademicListPage />} />
    <Route path="gestion-academica/nuevo" element={<AcademicCreatePage />} />
    <Route path="gestion-academica/:id" element={<AcademicDetailPage />} />
    <Route path="gestion-academica/:id/editar" element={<AcademicEditPage />} />
  </>
);
