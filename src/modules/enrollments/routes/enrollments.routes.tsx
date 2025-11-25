/**
 * Rutas del módulo Enrollments
 * Define todas las rutas relacionadas con matrículas y períodos académicos
 */

import { Route } from 'react-router-dom'
import { EnrollmentPage } from '../pages/EnrollmentPage'
import { EnrollmentEditPage } from '../pages/EnrollmentEditPage'
import { EnrollmentCreatePage } from '../pages/EnrollmentCreatePage'
import { EnrollmentDetailPage } from '../pages/EnrollmentDetailPage'

import { AcademicPeriodPage } from '../pages/AcademicPeriodPage'

export const enrollmentsRoutes = (
  <>
    {/* Rutas de Matrículas */}
    <Route path="matriculas" element={<EnrollmentPage />} />
    <Route path="matriculas/nueva" element={<EnrollmentCreatePage />} />

    <Route path="matriculas/:id" element={<EnrollmentDetailPage />} />
    <Route path="matriculas/:id/editar" element={<EnrollmentEditPage />} />
    
    {/* Rutas de Períodos Académicos */}
    <Route path="periodos-academicos" element={<AcademicPeriodPage />} />
    <Route path="periodos-academicos/nuevo" element={<AcademicPeriodPage />} />
    <Route path="periodos-academicos/:id/editar" element={<AcademicPeriodPage />} />
    <Route path="periodos-academicos/:id" element={<AcademicPeriodPage />} />
  </>
)
