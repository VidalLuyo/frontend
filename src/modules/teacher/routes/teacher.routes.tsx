/**
 * Rutas del módulo Teacher
 * Define todas las rutas relacionadas con gestión de profesores
 */

import { Route } from "react-router-dom";
import { TeacherPage } from "../pages/TeacherPage";
import { TeacherCreatePage } from "../pages/TeacherCreatePage";
import { TeacherDetailPage } from "../pages/TeacherDetailPage";
import { TeacherEditPage } from "../pages/TeacherEditPage";

export const teacherRoutes = (
     <>
          <Route path="asignaciones" element={<TeacherPage />} />
          <Route path="asignaciones/nuevo" element={<TeacherCreatePage />} />
          <Route path="asignaciones/:id" element={<TeacherDetailPage />} />
          <Route path="asignaciones/:id/editar" element={<TeacherEditPage />} />
     </>
);
