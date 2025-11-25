/**
 * Rutas del módulo Grade
 * Define todas las rutas relacionadas con notas
 */

import { Route } from 'react-router-dom'
import { GradePage } from '../pages/GradePage'
import { GradeCreatePage } from '../pages/GradeCreatePage'
import { GradeDetailPage } from '../pages/GradeDetailPage'
import { GradeEditPage } from '../pages/GradeEditPage'

export const gradesRoutes = (
  <>
    <Route path="notas" element={<GradePage />} />
    <Route path="notas/nuevo" element={<GradeCreatePage />} />
    <Route path="notas/:id" element={<GradeDetailPage />} />
    <Route path="notas/:id/editar" element={<GradeEditPage />} />
  </>
)
