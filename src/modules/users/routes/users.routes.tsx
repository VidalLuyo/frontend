/**
 * Rutas del módulo User
 * Define todas las rutas relacionadas con usuarios
 */

import { Route } from "react-router-dom";
import { UserPage } from "../pages/UserPage";
import { UserCreatePage } from "../pages/UserCreatePage";
import { UserDetailPage } from "../pages/UserDetailPage";
import { UserEditPage } from "../pages/UserEditPage";

export const usersRoutes = (
  <>
    <Route path="usuarios" element={<UserPage />} />
    <Route path="usuarios/nuevo" element={<UserCreatePage />} />
    <Route path="usuarios/:userId" element={<UserDetailPage />} />
    <Route path="usuarios/:userId/editar" element={<UserEditPage />} />
  </>
);
