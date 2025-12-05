/**
 * Rutas del módulo Grades (Notas)
 * Se inyectan en AppRouter dentro de <DashboardLayout />
 */
import { Route } from "react-router-dom";
import GradesPage from "../pages/GradesPage";
import GradeCreatePage from "../pages/GradeCreatePage";

export const gradesRoutes = (
  <>
    {/* /grades -> listado principal */}
    <Route path="grades" element={<GradesPage />} />

    {/* /notas -> alias del listado */}
    <Route path="notas" element={<GradesPage />} />

    {/* /grades/new -> crear boleta */}
    <Route path="grades/new" element={<GradeCreatePage />} />
  </>
);
