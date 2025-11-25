/**
 * Rutas: Academic Periods
 * Configuración de rutas para el módulo de Períodos Académicos
 */

import { Routes, Route } from 'react-router-dom';
import { AcademicPeriodPage } from '../pages/AcademicPeriodPage';

export function AcademicPeriodsRoutes() {
  return (
    <Routes>
      {/* Ruta principal - Lista de períodos académicos */}
      <Route path="/" element={<AcademicPeriodPage />} />
      
      {/* Ruta para crear nuevo período académico */}
      <Route path="/nuevo" element={<AcademicPeriodPage />} />
      
      {/* Ruta para editar período académico */}
      <Route path="/editar/:id" element={<AcademicPeriodPage />} />
      
      {/* Ruta para ver detalles del período académico */}
      <Route path="/ver/:id" element={<AcademicPeriodPage />} />
    </Routes>
  );
}

export default AcademicPeriodsRoutes;